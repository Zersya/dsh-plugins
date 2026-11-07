/**
 * Shopee daily dashboard — Host half.
 *
 * Serves the JSON store written by the ego-browser collector and exposes one
 * POST route that runs a sync on demand. The Client page polls `/state`.
 */
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

export const name = '@local/dsh-shopee-report'
export const inject = ['webServer']

const ROUTE_PREFIX = '/shopee-report'
const PLUGIN_DIR = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_DATA_DIR = path.join(os.homedir(), '.dsh', 'shopee-report', 'data')
const DEFAULT_COLLECTOR_DIR = path.join(PLUGIN_DIR, 'collector')

function sendJson(res, status, body) {
  const text = JSON.stringify(body)
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(text)
}

function admit(ctx, req) {
  const connection = ctx.get('connection')
  if (!connection || typeof connection.admit !== 'function') return true
  try {
    const verdict = connection.admit(req)
    if (verdict && 'rejection' in verdict) return verdict.rejection
    return true
  } catch { return 401 }
}

const readJson = async (file) => { try { return JSON.parse(await fs.readFile(file, 'utf8')) } catch { return null } }
const listDays = async (dir) => {
  try {
    const names = await fs.readdir(path.join(dir, 'days'))
    return names.filter((n) => /^\d{4}-\d{2}-\d{2}\.json$/.test(n)).map((n) => n.slice(0, 10)).sort()
  } catch { return [] }
}

export function apply(ctx, config = {}) {
  const dataDir = config.dataDir || DEFAULT_DATA_DIR
  const collectorDir = config.collectorDir || DEFAULT_COLLECTOR_DIR
  const taskSpace = config.collectorTaskSpace || 'shopee-ads-daily'
  let child = null

  const statusFile = path.join(dataDir, '.sync.json')
  const writeStatus = (value) => fs.writeFile(statusFile, JSON.stringify(value, null, 2)).catch(() => {})
  const readStatus = async () => (await readJson(statusFile)) || { state: 'idle' }

  const buildWeek = async (endDate, allDays) => {
    if (!endDate) return null
    const end = new Date(endDate + 'T00:00:00Z')
    const wanted = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(end.getTime() - i * 86400e3).toISOString().slice(0, 10)
      wanted.push(d)
    }
    const rows = []
    for (const d of wanted) {
      const snap = allDays.includes(d) ? await readJson(path.join(dataDir, 'days', `${d}.json`)) : null
      rows.push({
        date: d,
        present: !!snap,
        sales: snap?.store?.sales ?? snap?.ads?.sales ?? null,
        spend: snap?.ads?.spend ?? null,
        roas: snap?.ads?.roas ?? null,
        orders: snap?.store?.orders ?? snap?.ads?.orders ?? null,
        cancelled: snap?.cancellations?.count ?? null,
        cancelledValue: snap?.cancellations?.value ?? null,
      })
    }
    const have = rows.filter((r) => r.present)
    const sum = (k) => have.reduce((a, r) => a + (Number(r[k]) || 0), 0)
    const sales = sum('sales')
    const spend = sum('spend')
    const orders = sum('orders')
    const cancelled = have.reduce((a, r) => a + (Number(r.cancelled) || 0), 0)
    const cancelledValue = sum('cancelledValue')
    return {
      from: wanted[0], to: wanted[wanted.length - 1],
      days: have.length, expected: wanted.length, missing: rows.filter((r) => !r.present).map((r) => r.date),
      sales, spend, orders, cancelled, cancelledValue,
      roas: spend ? +(sales / spend).toFixed(2) : null,
      acosPct: sales ? +((spend / sales) * 100).toFixed(1) : null,
      aov: orders ? Math.round(sales / orders) : null,
      rows,
    }
  }

  const buildState = async (url) => {
    const days = await listDays(dataDir)
    const wanted = url.searchParams.get('date') || ''
    const date = days.includes(wanted) ? wanted : days[days.length - 1] || null
    const day = date ? await readJson(path.join(dataDir, 'days', `${date}.json`)) : null
    const economics = await readJson(path.join(dataDir, 'economics.json'))
    const summaries = []
    for (const d of days.slice(-21)) {
      const snap = d === date ? day : await readJson(path.join(dataDir, 'days', `${d}.json`))
      if (!snap) continue
      summaries.push({
        date: d,
        sales: snap.store?.sales ?? snap.ads?.sales ?? null,
        spend: snap.ads?.spend ?? null,
        roas: snap.ads?.roas ?? null,
        orders: snap.store?.orders ?? snap.ads?.orders ?? null,
        cancelled: snap.cancellations?.available === false ? null : (snap.cancellations?.count ?? 0),
        cancelledValue: snap.cancellations?.value ?? 0,
      })
    }
    const week = await buildWeek(date, days)
    return { ok: true, date, days, day, economics, summaries, week, sync: await readStatus(), running: child !== null }
  }

  const startWeekSync = async (url) => {
    const force = url && url.searchParams.get('force') === '1'
    if (child) return { ok: false, error: 'already-running' }
    const script = path.join(collectorDir, 'sync-week.mjs')
    try { await fs.access(script) } catch { return { ok: false, error: 'week-script-missing', message: `Tidak ada ${script}` } }
    await writeStatus({ state: 'running', mode: 'week', startedAt: new Date().toISOString() })
    const weekArgs = [script, `--data-dir=${dataDir}`]
    if (force) weekArgs.push('--force')
    child = spawn(process.execPath, weekArgs, { cwd: collectorDir, env: { ...process.env, EGO_TASK_SPACE: taskSpace }, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    child.stdout.on('data', (c) => { out += String(c).slice(0, 4000) })
    child.stderr.on('data', (c) => { err += String(c).slice(0, 4000) })
    child.on('error', (error) => { child = null; writeStatus({ state: 'error', message: String(error?.message || error) }) })
    child.on('close', (code) => { child = null; writeStatus({ state: code === 0 ? 'idle' : 'error', mode: 'week', code, message: (err || out).trim().split('\n').slice(-8).join('\n'), finishedAt: new Date().toISOString() }) })
    return { ok: true, started: true }
  }

  const startSync = async (url) => {
    if (child) return { ok: false, error: 'already-running' }
    const date = url.searchParams.get('date') || ''
    const script = path.join(collectorDir, 'run-sync.mjs')
    try { await fs.access(script) } catch { return { ok: false, error: 'collector-missing', message: `Tidak ada ${script}` } }
    await writeStatus({ state: 'running', startedAt: new Date().toISOString(), date: date || 'today' })
    const args = [script]
    if (date) args.push(`--date=${date}`)
    args.push(`--task-space=${taskSpace}`, `--data-dir=${dataDir}`)
    child = spawn(process.execPath, args, { cwd: collectorDir, env: { ...process.env, EGO_TASK_SPACE: taskSpace }, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    child.stdout.on('data', (chunk) => { out += String(chunk).slice(0, 4000) })
    child.stderr.on('data', (chunk) => { err += String(chunk).slice(0, 4000) })
    child.on('error', (error) => { child = null; writeStatus({ state: 'error', message: String(error?.message || error), finishedAt: new Date().toISOString() }) })
    child.on('close', (code) => {
      child = null
      writeStatus({ state: code === 0 ? 'idle' : 'error', code, message: (err || out).trim().split('\n').slice(-6).join('\n'), finishedAt: new Date().toISOString() })
    })
    return { ok: true, started: true }
  }

  ctx.inject(['webServer'], (webCtx) => {
    const handler = async (req, res) => {
      const verdict = admit(ctx, req)
      if (verdict !== true) { sendJson(res, verdict, { error: verdict === 401 ? 'unauthorized' : 'forbidden' }); return }
      let url
      try { url = new URL(req.url, 'http://localhost') } catch { sendJson(res, 400, { error: 'bad-request' }); return }
      try {
        if (url.pathname === `${ROUTE_PREFIX}/state`) { sendJson(res, 200, await buildState(url)); return }
        if (url.pathname === `${ROUTE_PREFIX}/sync-week`) {
          if (req.method !== 'POST') { sendJson(res, 405, { error: 'method-not-allowed' }); return }
          const result = await startWeekSync(url)
          sendJson(res, result.ok ? 202 : 409, result)
          return
        }
        if (url.pathname === `${ROUTE_PREFIX}/sync`) {
          if (req.method !== 'POST') { sendJson(res, 405, { error: 'method-not-allowed' }); return }
          const result = await startSync(url)
          sendJson(res, result.ok ? 202 : 409, result)
          return
        }
        if (url.pathname === `${ROUTE_PREFIX}/raw`) {
          const date = url.searchParams.get('date') || ''
          const snap = date ? await readJson(path.join(dataDir, 'days', `${date}.json`)) : await readJson(path.join(dataDir, 'latest.json'))
          sendJson(res, snap ? 200 : 404, snap || { error: 'not-found' })
          return
        }
        sendJson(res, 404, { error: 'not-found' })
      } catch (error) {
        sendJson(res, 500, { error: 'dashboard-failed', message: String(error?.message || error) })
      }
    }
    webCtx.effect(
      () => webCtx.webServer.register({ kind: 'prefix', path: ROUTE_PREFIX, handler }),
      'shopee-report: dashboard + sync routes',
    )
  })
}
