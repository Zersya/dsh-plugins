#!/usr/bin/env bash
# Deterministic UI/a11y regression for the Shopee panel.
# Usage: ./test/ui-a11y.sh 'http://host:port/?token=...'
# Requires: ego-browser on PATH, a running DSH instance with the plugin loaded.
set -euo pipefail
URL="${1:?pass the DSH URL including ?token=}"
TMP="$(mktemp -t shopee-a11y).mjs"
trap 'rm -f "$TMP"' EXIT
cat > "$TMP" <<'JS'
const URL = '__URL__'
const task = await taskSpace('shopee-a11y-test')

const results = []
const check = (name, pass, detail) => results.push({ name, pass, detail: String(detail).slice(0, 90) })

const box = async (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } }, sel)

const openPanel = async (page) => {
  for (let i = 0; i < 6; i++) {
    const has = await page.evaluate(() => !!document.querySelector('.sr-dd-btn'))
    if (has) return true
    const g = await box(page, '[aria-label="Global panels"]'); if (g) await page.mouse.click(g.x, g.y, { label: 'panels' })
    await page.waitForTimeout(1500)
    const s2 = await box(page, '[aria-label="Shopee"]'); if (s2) await page.mouse.click(s2.x, s2.y, { label: 'shopee' })
    await page.waitForTimeout(4000)
  }
  return page.evaluate(() => !!document.querySelector('.sr-dd-btn'))
}

const measure = async (page) => page.evaluate(() => {
  const root = document.querySelector('.sr-root')
  if (!root) return { err: 'no panel' }
  const parse = (c) => { const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] } }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b) }
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); const hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + 0.05) / (lo + 0.05) }
  const bgOf = (el) => { let n = el; while (n && n !== document.documentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a > 0.5) return c; n = n.parentElement } return { r: 255, g: 255, b: 255, a: 1 } }
  let min = 99; const fails = []
  for (const el of root.querySelectorAll('*')) {
    const t = (el.innerText || '').trim(); if (!t || el.children.length) continue
    const cs = getComputedStyle(el); if (cs.display === 'none') continue
    const fg = parse(cs.color); if (!fg) continue
    const r = ratio(fg, bgOf(el)); const px = parseFloat(cs.fontSize); const w = Number(cs.fontWeight) || 400
    const need = (px >= 24 || (px >= 18.66 && w >= 600)) ? 3 : 4.5
    if (r < min) min = r
    if (r < need) fails.push(t.slice(0, 24) + ' ' + r.toFixed(2))
  }
  return { min: +min.toFixed(2), fails }
})

// --- light theme page ---
const lightPage = await task.newPage()
await lightPage.goto(URL, { timeout: 90000 })
await lightPage.waitForTimeout(9000)
const lightOpen = await openPanel(lightPage)
check('panel/opens', lightOpen, lightOpen ? 'ok' : 'panel did not open')
const light = await measure(lightPage)
check('contrast/light', !light.err && light.fails.length === 0 && light.min >= 4.5, JSON.stringify(light).slice(0, 80))

const a11y = await lightPage.evaluate(() => {
  const root = document.querySelector('.sr-root')
  if (!root) return { missing: true, live: 0, statusRole: 0, thTotal: 0, thScope: 0, chart: 0 }
  return {
    live: root.querySelectorAll('[aria-live="polite"]').length,
    statusRole: root.querySelectorAll('[role="status"]').length,
    thTotal: root.querySelectorAll('th').length,
    thScope: root.querySelectorAll('th[scope="col"]').length,
    chart: root.querySelectorAll('[role="img"]').length,
  }
})
check('live-region', a11y.live >= 1 && a11y.statusRole >= 1, JSON.stringify({ live: a11y.live, status: a11y.statusRole }))
check('table-scope', a11y.thTotal > 0 && a11y.thTotal === a11y.thScope, `${a11y.thScope}/${a11y.thTotal}`)
check('chart-alt', a11y.chart >= 1, a11y.chart)

await lightPage.keyboard.press('Tab')
await lightPage.waitForTimeout(200)
const ring = await lightPage.evaluate(() => {
  const el = document.querySelector('.sr-btn')
  if (!el) return { missing: true }
  el.focus()
  const cs = getComputedStyle(el)
  return { focusVisible: el.matches(':focus-visible'), width: parseFloat(cs.outlineWidth) || 0, style: cs.outlineStyle }
})
check('focus-ring', !ring.missing && ring.focusVisible && ring.width >= 2 && ring.style !== 'none', JSON.stringify(ring))

const dd = await lightPage.evaluate(() => { const b = document.querySelector('.sr-dd-btn'); if (!b) return false; b.focus(); return true })
await lightPage.waitForTimeout(300)
if (dd) {
  await lightPage.keyboard.press('Enter')
  await lightPage.waitForTimeout(900)
  const opened = await lightPage.evaluate(() => !!document.querySelector('.sr-dd-list'))
  await lightPage.keyboard.press('Escape')
  await lightPage.waitForTimeout(600)
  const closed = await lightPage.evaluate(() => !document.querySelector('.sr-dd-list'))
  check('keyboard-datepicker', opened && closed, `opened=${opened} closed=${closed}`)
} else check('keyboard-datepicker', false, 'date button missing')
await lightPage.close().catch(() => {})

// --- dark theme page (media emulated before load) ---
const darkPage = await task.newPage()
await darkPage.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] }).catch(() => {})
await darkPage.goto(URL, { timeout: 90000 })
await darkPage.waitForTimeout(9000)
await openPanel(darkPage)
const dark = await measure(darkPage)
check('contrast/dark', !dark.err && dark.fails.length === 0 && dark.min >= 4.5, JSON.stringify(dark).slice(0, 80))
await darkPage.screenshot({ path: '/tmp/shopee-a11y-dark.png' }).catch(() => {})
await darkPage.close().catch(() => {})

const failed = results.filter((r) => !r.pass)
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.name} ${r.detail}`)
console.log(`SUMMARY ${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
JS
sed -i '' "s|__URL__|${URL//&/\\&}|" "$TMP"
ego-browser nodejs < "$TMP"
