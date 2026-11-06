#!/usr/bin/env node
/**
 * run-sync.mjs — jalankan collector ego-browser dan simpan snapshot harian.
 *
 *   node run-sync.mjs                      # hari ini (WIB)
 *   node run-sync.mjs --date=2026-11-06    # tanggal tertentu
 *   node run-sync.mjs --dry                # cetak JSON, tidak menulis file
 */
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'

const here = path.dirname(new URL(import.meta.url).pathname)
const dataDir = args0.get('data-dir') || process.env.SHOPEE_DATA_DIR || path.resolve(here, '..', 'data')
const args0 = new Map(process.argv.slice(2).map((a) => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.join('=') || 'true'] }))
const args = args0
const wibNow = new Date(Date.now() + 7 * 3600e3)
const wibToday = wibNow.toISOString().slice(0, 10)
// Sebelum 02:00 WIB, "closing run" menutup hari sebelumnya, bukan hari yang baru 2 jam.
const closingWindow = wibNow.getUTCHours() < 2
const defaultDate = closingWindow ? new Date(Date.now() + 7 * 3600e3 - 86400e3).toISOString().slice(0, 10) : wibToday
const date = args.get('date') || defaultDate
const space = args.get('task-space') || process.env.EGO_TASK_SPACE || 'shopee-ads-daily'
const dry = args.has('dry')

if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { console.error('format --date harus YYYY-MM-DD'); process.exit(2) }

const src = fs.readFileSync(path.join(here, 'collector.mjs'), 'utf8')
  .replaceAll('__SR_DATE__', date)
  .replaceAll('__SR_SPACE__', space)

const child = spawn('ego-browser', ['nodejs'], { stdio: ['pipe', 'pipe', 'pipe'] })
let stdout = ''
let stderr = ''
child.stdout.on('data', (c) => { stdout += String(c) })
child.stderr.on('data', (c) => { stderr += String(c) })
child.stdin.end(src)

const code = await new Promise((resolve) => child.on('close', resolve))
const combined = stdout + '\n' + stderr
const marker = combined.indexOf('###JSON###')
if (marker < 0) {
  console.error('collector gagal: tidak ada output JSON')
  console.error((stderr || stdout).trim().split('\n').slice(-12).join('\n'))
  process.exit(1)
}
const jsonStart = marker + '###JSON###'.length
const jsonEnd = combined.indexOf('\n', jsonStart)
const payload = JSON.parse(combined.slice(jsonStart, jsonEnd < 0 ? undefined : jsonEnd).trim())

if (payload.error === 'login_required') {
  console.error('LOGIN_REQUIRED: sesi Shopee Seller sudah habis. Buka ego-browser, login, lalu jalankan sync lagi.')
  process.exit(3)
}
payload.collectedBy = `ego-browser (exit ${code})`
payload.syncAt = new Date().toISOString()

if (dry) { console.log(JSON.stringify(payload, null, 2)); process.exit(0) }

await fsp.mkdir(path.join(dataDir, 'days'), { recursive: true })
const file = path.join(dataDir, 'days', `${date}.json`)
await fsp.writeFile(file, JSON.stringify(payload, null, 2) + '\n')
await fsp.writeFile(path.join(dataDir, 'latest.json'), JSON.stringify(payload, null, 2) + '\n')

const rp = (v) => (v == null ? '–' : 'Rp' + Math.round(v).toLocaleString('id-ID'))
console.log([`sync ${date}`, `iklan ${rp(payload.ads?.spend)} → ${rp(payload.ads?.sales)} (ROAS ${payload.ads?.roas ?? '–'})`,
  `pesanan ${payload.store?.orders ?? payload.ads?.orders ?? '–'}`, `batal ${payload.cancellations?.count ?? 0} (${rp(payload.cancellations?.value)})`,
  payload.partial ? 'PARTIAL' : 'lengkap', payload.errors?.length ? 'err:' + payload.errors.length : ''].filter(Boolean).join(' · '))
