/**
 * Host half of the Git Graph bundle.
 *
 * Serves read-only Git facts for the working directory of one conversation,
 * which is what makes the view follow a session into its own worktree. Access
 * goes through `ctx.connection` admission first, mirroring the shipped `/api`
 * bridge, and the directory always comes from the session itself — the client
 * never supplies a path.
 */
import { execFile } from 'node:child_process'
import { clampLimit, readCommit, readRepository } from './git.js'

const ROUTE_PREFIX = '/git-graph'
const TIMEOUT_MS = 12_000

/* ------------------------------------------------------------------ */
/* Process execution                                                    */
/* ------------------------------------------------------------------ */

function runWithSubprocess(subprocess) {
  return (cwd, args) =>
    new Promise((resolve, reject) => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
      let handle
      try {
        handle = subprocess.spawn({
          argv: ['git', ...args],
          cwd,
          graceMs: 1500,
          signal: controller.signal,
          env: {
            GIT_TERMINAL_PROMPT: '0',
            GIT_OPTIONAL_LOCKS: '0',
            GIT_PAGER: 'cat',
            GIT_FLUSH: '1',
            LC_ALL: 'C',
          },
          stdio: {
            stdin: 'ignore',
            stdout: { maxBytes: 8_000_000 },
            stderr: { maxBytes: 65_536 },
          },
        })
      } catch (error) {
        clearTimeout(timer)
        reject(error)
        return
      }
      handle.done.then(
        (outcome) => {
          clearTimeout(timer)
          resolve({
            code: typeof outcome?.exitCode === 'number' ? outcome.exitCode : -1,
            stdout: handle.collected?.stdout ? handle.collected.stdout.readFrom(0).text : '',
            stderr: handle.collected?.stderr ? handle.collected.stderr.readFrom(0).text : '',
          })
        },
        (error) => {
          clearTimeout(timer)
          reject(error)
        },
      )
    })
}

function runLocally() {
  return (cwd, args) =>
    new Promise((resolve) => {
      execFile(
        'git',
        args,
        { cwd, timeout: TIMEOUT_MS, maxBuffer: 8 * 1024 * 1024, windowsHide: true },
        (error, stdout, stderr) => {
          const code = error && typeof error.code === 'number' ? error.code : error ? 1 : 0
          resolve({ code, stdout: stdout || '', stderr: stderr || '' })
        },
      )
    })
}

function createRunner(ctx) {
  const subprocess = ctx.get('subprocess')
  if (subprocess && typeof subprocess.spawn === 'function') return runWithSubprocess(subprocess)
  return runLocally()
}

/* ------------------------------------------------------------------ */
/* HTTP helpers                                                         */
/* ------------------------------------------------------------------ */

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  })
  res.end(body)
}

function sendText(res, status, text) {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' })
  res.end(text)
}

/** `true` when allowed, otherwise the HTTP status the request deserves. */
function admit(ctx, req) {
  const connection = ctx.get('connection')
  if (!connection || typeof connection.admit !== 'function') return true
  try {
    const admission = connection.admit(req)
    if (admission && 'rejection' in admission) return admission.rejection
    return true
  } catch {
    return 401
  }
}

/* ------------------------------------------------------------------ */
/* Session resolution                                                   */
/* ------------------------------------------------------------------ */

function readSessionId(url) {
  const raw = url.searchParams.get('session') || ''
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(raw) ? raw : ''
}

/**
 * Authoritative directory for one conversation: the live Agent's effective
 * working directory first (it moves with `workingDirectory.set`), then the
 * stored session header, then the deployment default. Worktree sessions
 * resolve to the worktree automatically, with no client input.
 */
async function resolveSessionDirectory(ctx, sessionId) {
  const agents = ctx.get('agents')
  const agent = agents && typeof agents.get === 'function' ? agents.get(sessionId) : undefined
  const workingDirectory = ctx.get('workingDirectory')

  if (agent && agent.session && workingDirectory && typeof workingDirectory.get === 'function') {
    try {
      const current = workingDirectory.get(agent.session)
      if (typeof current === 'string' && current) return { directory: current, source: 'live' }
    } catch {
      /* fall through to the stored header */
    }
  }

  let known = Boolean(agent)
  const persistence = ctx.get('sessionPersistence')
  if (persistence && typeof persistence.stat === 'function') {
    try {
      const snapshot = await persistence.stat(sessionId)
      if (snapshot) known = true
      const cwd = snapshot && snapshot.header && snapshot.header.cwd
      if (typeof cwd === 'string' && cwd) return { directory: cwd, source: 'session' }
    } catch {
      /* fall through to the deployment default */
    }
  }

  // Only a session we could actually identify may use the deployment default;
  // an unknown id must not be shown some other conversation's repository.
  if (known && workingDirectory && typeof workingDirectory.defaultDirectory === 'string' && workingDirectory.defaultDirectory) {
    return { directory: workingDirectory.defaultDirectory, source: 'default' }
  }
  return undefined
}

/* ------------------------------------------------------------------ */
/* Payloads                                                             */
/* ------------------------------------------------------------------ */

async function buildState(ctx, run, url) {
  const sessionId = readSessionId(url)
  if (!sessionId) return { status: 400, body: { error: 'bad-session', message: 'A session id is required.' } }
  const resolved = await resolveSessionDirectory(ctx, sessionId)
  if (!resolved) {
    return { status: 404, body: { error: 'session-not-found', message: 'This conversation has no working directory.' } }
  }
  const repo = await readRepository(run, resolved.directory, clampLimit(url.searchParams.get('limit')))
  return {
    status: 200,
    body: {
      version: 1,
      generatedAt: Date.now(),
      sessionId,
      directory: resolved.directory,
      directorySource: resolved.source,
      repo,
    },
  }
}

async function buildCommit(ctx, run, url) {
  const sessionId = readSessionId(url)
  if (!sessionId) return { status: 400, body: { error: 'bad-session', message: 'A session id is required.' } }
  const resolved = await resolveSessionDirectory(ctx, sessionId)
  if (!resolved) {
    return { status: 404, body: { error: 'session-not-found', message: 'This conversation has no working directory.' } }
  }
  const detail = await readCommit(run, resolved.directory, url.searchParams.get('oid') || '')
  return { status: detail.error ? 404 : 200, body: { ...detail, directory: resolved.directory } }
}

/* ------------------------------------------------------------------ */
/* Plugin                                                               */
/* ------------------------------------------------------------------ */

export function apply(ctx) {
  ctx.inject(['webServer'], (webCtx) => {
    const handler = async (req, res) => {
      const verdict = admit(ctx, req)
      if (verdict !== true) {
        sendText(res, verdict, verdict === 401 ? 'unauthorized' : 'forbidden')
        return
      }
      let url
      try {
        url = new URL(req.url, 'http://localhost')
      } catch {
        sendText(res, 400, 'bad request')
        return
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        sendText(res, 405, 'method not allowed')
        return
      }
      const run = createRunner(ctx)
      try {
        if (url.pathname === `${ROUTE_PREFIX}/state`) {
          const result = await buildState(ctx, run, url)
          sendJson(res, result.status, result.body)
          return
        }
        if (url.pathname === `${ROUTE_PREFIX}/commit`) {
          const result = await buildCommit(ctx, run, url)
          sendJson(res, result.status, result.body)
          return
        }
        sendText(res, 404, 'not found')
      } catch (error) {
        const missing = /ENOENT|not found|no such file/i.test(String(error?.message || error))
        sendJson(
          res,
          503,
          missing
            ? { error: 'git-unavailable', message: 'Git is not installed or not on PATH.' }
            : { error: 'git-failed', message: String(error?.message || error || 'Git failed') },
        )
      }
    }
    webCtx.effect(
      () =>
        webCtx.webServer.register({
          kind: 'prefix',
          path: ROUTE_PREFIX,
          handler,
        }),
      'git-graph: read-only Git route',
    )
  })
}
