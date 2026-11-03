/**
 * Read-only Git inspection behind the Git Graph workspace view.
 *
 * Everything here takes a `run(cwd, args)` function returning
 * `{ code, stdout, stderr }` so the caller owns process execution (the Host
 * routes it through `ctx.subprocess`) and tests can drive it with a fixture.
 *
 * Only read-only plumbing is issued: rev-parse, status, log, for-each-ref,
 * rev-list, show. No command mutates the repository, and `--no-optional-locks`
 * keeps `status` from refreshing the index on disk.
 */

const NUL = '\u0000'
const RECORD = '\u001e'

export const DEFAULT_COMMIT_LIMIT = 220
export const MAX_COMMIT_LIMIT = 800

const GIT_OPTS = ['--no-optional-locks', '-c', 'core.quotepath=false', '-c', 'color.ui=false']

export function clampLimit(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_COMMIT_LIMIT
  return Math.min(MAX_COMMIT_LIMIT, Math.max(20, Math.floor(parsed)))
}

function git(run, cwd, args) {
  return run(cwd, [...GIT_OPTS, ...args])
}

function firstLine(text) {
  const line = String(text || '')
    .split('\n')
    .map((value) => value.trim())
    .find((value) => value.length > 0)
  return line || ''
}

function parseStatus(text) {
  const status = {
    oid: null,
    branch: null,
    detached: false,
    initial: false,
    upstream: null,
    ahead: 0,
    behind: 0,
    changes: [],
  }
  let truncated = false
  for (const line of String(text || '').split('\n')) {
    if (!line) continue
    if (line.startsWith('# ')) {
      const parts = line.slice(2).split(' ')
      const key = parts[0]
      if (key === 'branch.oid') {
        if (parts[1] === '(initial)') status.initial = true
        else status.oid = parts[1]
      } else if (key === 'branch.head') {
        if (parts[1] === '(detached)') status.detached = true
        else status.branch = parts[1]
      } else if (key === 'branch.upstream') {
        status.upstream = parts[1]
      } else if (key === 'branch.ab') {
        status.ahead = Math.abs(Number.parseInt(parts[1], 10) || 0)
        status.behind = Math.abs(Number.parseInt(parts[2], 10) || 0)
      }
      continue
    }
    if (status.changes.length >= 500) {
      truncated = true
      break
    }
    if (line.startsWith('1 ')) {
      const parts = line.split(' ')
      const xy = parts[1] || '..'
      status.changes.push({
        path: parts.slice(8).join(' '),
        x: xy[0],
        y: xy[1],
        staged: xy[0] !== '.' && xy[0] !== '?',
        untracked: false,
      })
    } else if (line.startsWith('2 ')) {
      const parts = line.split('\t')
      const head = parts[0].split(' ')
      const xy = head[1] || '..'
      status.changes.push({
        path: parts[1] || '',
        originalPath: parts[2] || undefined,
        x: xy[0],
        y: xy[1],
        staged: xy[0] !== '.' && xy[0] !== '?',
        untracked: false,
        renamed: true,
      })
    } else if (line.startsWith('u ')) {
      const parts = line.split(' ')
      status.changes.push({
        path: parts.slice(10).join(' '),
        x: 'U',
        y: 'U',
        staged: false,
        untracked: false,
        conflicted: true,
      })
    } else if (line.startsWith('? ')) {
      status.changes.push({ path: line.slice(2), x: '?', y: '?', staged: false, untracked: true })
    }
  }
  status.truncated = truncated
  return status
}

function parseLog(text) {
  const commits = []
  for (const record of String(text || '').split(RECORD)) {
    const body = record.replace(/^\n+/, '').replace(/\n+$/, '')
    if (!body) continue
    const fields = body.split(NUL)
    if (fields.length < 7) continue
    commits.push({
      oid: fields[0],
      parents: fields[1] ? fields[1].split(' ').filter(Boolean) : [],
      author: { name: fields[2], email: fields[3] },
      time: Number(fields[4]) * 1000 || 0,
      refs: fields[5] ? fields[5].split(',').map((value) => value.trim()).filter(Boolean) : [],
      subject: fields[6],
    })
  }
  return commits
}

function parseRefs(text) {
  const refs = []
  for (const line of String(text || '').split('\n')) {
    if (!line) continue
    const [name, oid, head, upstream, full] = line.split(NUL)
    if (!name || !oid) continue
    const type = full.startsWith('refs/heads/')
      ? 'branch'
      : full.startsWith('refs/remotes/')
        ? 'remote'
        : full.startsWith('refs/tags/')
          ? 'tag'
          : 'other'
    refs.push({ name, oid, head: head === '*', upstream: upstream || null, type })
    if (refs.length >= 120) break
  }
  return refs
}

const LOG_FORMAT = ['%H', '%P', '%an', '%ae', '%at', '%D', '%s'].join('%x00') + '%x1e'

/** Full read for the selected workspace: head, changes, refs, and the commit graph. */
export async function readRepository(run, dir, limit = DEFAULT_COMMIT_LIMIT) {
  const top = await git(run, dir, ['rev-parse', '--show-toplevel'])
  if (top.code !== 0) {
    return {
      exists: false,
      reason: 'not-a-repo',
      message: firstLine(top.stderr) || 'Not a Git repository',
      path: dir,
    }
  }
  const root = top.stdout.trim() || dir
  const [statusResult, logResult, refsResult, countResult] = await Promise.all([
    git(run, root, ['status', '--porcelain=v2', '--branch', '--untracked-files=normal']),
    git(run, root, ['log', '--all', '--date-order', `--max-count=${limit}`, `--pretty=format:${LOG_FORMAT}`]),
    git(run, root, [
      'for-each-ref',
      '--sort=-committerdate',
      '--count=120',
      '--format=%(refname:short)%00%(objectname)%00%(HEAD)%00%(upstream:short)%00%(refname)',
      'refs/heads',
      'refs/remotes',
      'refs/tags',
    ]),
    git(run, root, ['rev-list', '--count', '--all']),
  ])

  const status = parseStatus(statusResult.stdout)
  const commits = logResult.code === 0 ? parseLog(logResult.stdout) : []
  const refs = refsResult.code === 0 ? parseRefs(refsResult.stdout) : []
  const total = countResult.code === 0 ? Number.parseInt(countResult.stdout.trim(), 10) : null

  return {
    exists: true,
    path: dir,
    root,
    name: root.split('/').filter(Boolean).pop() || root,
    head: {
      oid: status.oid,
      branch: status.branch,
      detached: status.detached,
      initial: status.initial,
      upstream: status.upstream,
      ahead: status.ahead,
      behind: status.behind,
    },
    counts: {
      commits: Number.isFinite(total) ? total : null,
      branches: refs.filter((ref) => ref.type === 'branch').length,
      tags: refs.filter((ref) => ref.type === 'tag').length,
      changes: status.changes.length,
    },
    refs,
    commits,
    changes: status.changes,
    changesTruncated: Boolean(status.truncated),
    truncated: Boolean(logResult.code === 0 && commits.length >= limit),
    limit,
    logError: logResult.code === 0 ? null : firstLine(logResult.stderr) || 'git log failed',
  }
}

function parseNumstat(text) {
  const files = []
  let insertions = 0
  let deletions = 0
  for (const line of String(text || '').split('\n')) {
    if (!line.trim()) continue
    const parts = line.split('\t')
    if (parts.length < 3) continue
    const add = parts[0] === '-' ? null : Number.parseInt(parts[0], 10)
    const remove = parts[1] === '-' ? null : Number.parseInt(parts[1], 10)
    insertions += Number.isFinite(add) ? add : 0
    deletions += Number.isFinite(remove) ? remove : 0
    files.push({
      path: parts.slice(2).join('\t'),
      additions: Number.isFinite(add) ? add : null,
      deletions: Number.isFinite(remove) ? remove : null,
      binary: add === null,
    })
    if (files.length >= 250) break
  }
  return { files, insertions, deletions }
}

/** One commit: message body, parents, and the file summary for the detail pane. */
export async function readCommit(run, dir, oid) {
  if (!/^[0-9a-f]{4,64}$/i.test(String(oid || ''))) {
    return { error: 'invalid-oid', message: 'Not a commit id' }
  }
  const metaFormat =
    ['%H', '%P', '%an', '%ae', '%at', '%cn', '%ce', '%ct', '%D', '%s'].join('%x00') + '%x00%b'
  const [meta, numstat] = await Promise.all([
    git(run, dir, ['show', '-s', '--no-color', `--format=${metaFormat}`, oid]),
    git(run, dir, ['show', '--no-color', '--numstat', '--format=', oid]),
  ])
  if (meta.code !== 0) {
    return { error: 'not-found', message: firstLine(meta.stderr) || 'Commit not found' }
  }
  const fields = meta.stdout.replace(/\n+$/, '').split(NUL)
  const summary = parseNumstat(numstat.code === 0 ? numstat.stdout : '')
  return {
    oid: fields[0],
    parents: fields[1] ? fields[1].split(' ').filter(Boolean) : [],
    author: { name: fields[2], email: fields[3], time: Number(fields[4]) * 1000 || 0 },
    committer: { name: fields[5], email: fields[6], time: Number(fields[7]) * 1000 || 0 },
    refs: fields[8] ? fields[8].split(',').map((value) => value.trim()).filter(Boolean) : [],
    subject: fields[9] || '',
    body: fields.slice(10).join(NUL).replace(/\s+$/, ''),
    files: summary.files,
    stats: {
      files: summary.files.length,
      insertions: summary.insertions,
      deletions: summary.deletions,
    },
  }
}
