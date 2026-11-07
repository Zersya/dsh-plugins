#!/usr/bin/env node
/**
 * sync-week.mjs — lengkapi snapshot 7 hari terakhir (default) dengan menjalankan
 * run-sync.mjs untuk setiap tanggal yang belum ada filenya.
 *
 *   node sync-week.mjs                 # 7 hari terakhir termasuk hari ini (WIB)
 *   node sync-week.mjs --days=14
 *   node sync-week.mjs --force         # tulis ulang walau file sudah ada
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

const here = path.dirname(new URL(import.meta.url).pathname)
const argv = new Map(process.argv.slice(2).map((a) => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.join('=') || 'true'] }))
const dataDir = argv.get('data-dir') || process.env.SHOPEE_DATA_DIR || path.resolve(here, '..', 'data')
const days = Number(argv.get('days') || 7)
const force = argv.has('force')

const wibNow = new Date(Date.now() + 7 * 3600e3)
const dates = []
for (let i = days - 1; i >= 0; i--) dates.push(new Date(wibNow.getTime() - i * 86400e3).toISOString().slice(0, 10))

const planned = dates.filter((d) => force || !fs.existsSync(path.join(dataDir, 'days', `${d}.json`)))
console.log(`[week] ${dates.length} hari, ${planned.length} perlu di-sync: ${planned.join(', ') || '-'}`)

let ok = 0
let fail = 0
for (const d of planned) {
  const code = await new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(here, 'run-sync.mjs'), `--date=${d}`, `--data-dir=${dataDir}`], { stdio: 'inherit' })
    child.on('close', resolve)
  })
  if (code === 0) ok++
  else { fail++; console.error(`[week] ${d} gagal (exit ${code})`) }
}
console.log(`[week] selesai: ${ok} sukses, ${fail} gagal, ${dates.length - planned.length} sudah ada`)
process.exit(fail && !ok ? 1 : 0)
