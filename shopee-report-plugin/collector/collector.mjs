/* Shopee daily collector — runs under `ego-browser nodejs` (stdin).
   Placeholders __SR_DATE__ / __SR_SPACE__ are substituted by run-sync.mjs. */
const DATE = '__SR_DATE__'
const SPACE = '__SR_SPACE__'
const WIB = '+07:00'
const FINGERPRINT = '+HxpSkwZ2w6PfxVGUW4H1Q==|yNzYeH8wdTVOUoL/CMeu+8U9xbVM2sqzjR0iiH4UpQ9eEexC5DWN19qOkrrMPsVhUe/drGSrrmM=|QF4A+AxaEY0cNCfA|08|3'
const PAS = '/api/pas/v1/report/get_time_graph/'
const WALLET = '/api/pas/v1/wallet/get/'
const errors = []
const out = {
  schema: 1, shop: 'mamicleo_id', date: DATE, timezone: 'Asia/Jakarta',
  capturedAt: new Date().toISOString().replace('Z', WIB).replace(/(\d{2}):(\d{2})\.\d{3}/, '$1:$2'),
  partial: false, store: null, ads: null, wallet: null,
  cancellations: { count: 0, value: 0, items: [], available: false }, orders: null, errors,
}
const start = Math.floor(Date.parse(DATE + 'T00:00:00' + WIB) / 1000)
const end = start + 86399
const todayStr = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10)
const yestStr = new Date(Date.now() + 7 * 3600e3 - 86400e3).toISOString().slice(0, 10)
const dmy = DATE.split('-').reverse().join('/')

const task = await taskSpace(SPACE)
const page = await task.newPage()

try {
  await page.goto('https://seller.shopee.co.id/portal/marketing/pas/index', { timeout: 90000 })
  await page.waitForTimeout(4000)
  if ((await page.url()).includes('/login')) {
    console.log('###JSON###' + JSON.stringify({ error: 'login_required' }))
    process.exit(0)
  }
} catch (e) { errors.push('goto:' + String(e.message || e).slice(0, 120)) }

/* 1. ads totals + wallet (API, exact) */
try {
  const res = await page.fetch(PAS, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ agg_interval: 4, campaign_type: 'product_homepage_v2', start_time: start, end_time: end,
      need_roi_target_setting: false, filter_params: { campaign_type: 'new_cpc_homepage' }, device_sz_fingerprint: FINGERPRINT }),
    timeout: 30000,
  })
  const rows = JSON.parse(res.body).data.report_by_time
  const s = { cost: 0, gmv: 0, orders: 0, clicks: 0, imp: 0, atc: 0, vou: 0, vouSales: 0 }
  for (const r of rows) {
    const m = r.metrics
    s.cost += m.cost / 1e5; s.gmv += m.broad_gmv / 1e5; s.orders += m.broad_order
    s.clicks += m.click; s.imp += m.impression; s.atc += m.atc
    s.vou += (m.voucher_amount || 0) / 1e5; s.vouSales += (m.voucher_sales || 0) / 1e5
  }
  out.ads = {
    spend: Math.round(s.cost), sales: Math.round(s.gmv), orders: s.orders, clicks: s.clicks,
    impressions: s.imp, ctrPct: s.imp ? +((s.clicks / s.imp) * 100).toFixed(2) : 0, atc: s.atc,
    roas: s.cost ? +(s.gmv / s.cost).toFixed(2) : 0, acosPct: s.gmv ? +((s.cost / s.gmv) * 100).toFixed(1) : 0,
    voucherAmount: Math.round(s.vou), voucherSales: Math.round(s.vouSales), budgetToday: null, campaigns: [],
  }
} catch (e) { errors.push('ads:' + String(e.message || e).slice(0, 120)); out.partial = true }

try {
  const res = await page.fetch(WALLET, { timeout: 20000 })
  const d = JSON.parse(res.body).data
  out.wallet = { balance: Math.round(d.ads_credit.available / 1e5), spentToday: Math.round(d.ads_expense_today.total / 1e5) }
} catch (e) { errors.push('wallet:' + String(e.message || e).slice(0, 100)) }

/* 2. per-campaign table (DOM; polling + header-driven mapping) */
const makePoll = (target) => async (fn, { timeout = 20000, interval = 600, arg } = {}) => {
  const t0 = Date.now()
  while (Date.now() - t0 < timeout) {
    try { const v = await target.evaluate(fn, arg); if (v) return v } catch (e) { /* keep polling */ }
    await target.waitForTimeout(interval)
  }
  return null
}
const poll = makePoll(page)

if (out.ads && (DATE === todayStr || DATE === yestStr)) {
  let campPage = page
  try {
    campPage = await task.newPage()
    const pollC = makePoll(campPage)
    await campPage.goto('https://seller.shopee.co.id/portal/marketing/pas/index', { timeout: 90000 }).catch(() => {})
    await pollC(() => document.querySelectorAll('.eds-tabs__nav-tab').length >= 2, { timeout: 25000 })
    await campPage.evaluate(() => {
      const tab = [...document.querySelectorAll('.eds-tabs__nav-tab')].find((e) => (e.innerText || '').includes('Individual'))
      if (tab) { tab.scrollIntoView({ block: 'center' }); tab.click() }
    })
    await campPage.waitForTimeout(1500)

    const want = DATE === todayStr ? 'Hari Ini' : 'Kemarin'
    await campPage.evaluate((w) => {
      const lbl = [...document.querySelectorAll('p,div,span')]
        .find((e) => new RegExp('^' + w + ' \\(GMT\\+7\\)$').test((e.innerText || '').trim()))
        || [...document.querySelectorAll('p,div,span')].find((e) => /^\(GMT\+7\)$/.test((e.innerText || '').trim()))
      if (lbl && !new RegExp('^' + w).test(lbl.innerText.trim())) lbl.click()
    }, want)
    await campPage.waitForTimeout(1200)
    await campPage.evaluate((w) => {
      const opt = [...document.querySelectorAll('div,span,li,p')].find((e) => (e.innerText || '').trim() === w)
      if (opt) opt.click()
    }, want)

    await campPage.evaluate(() => {
      const el = [...document.querySelectorAll('div,span')].find((e) => /Daftar Iklan Produk/.test(e.innerText || '') && (e.innerText || '').length < 400)
      if (el) el.scrollIntoView({ block: 'start' })
      else window.scrollTo(0, document.body.scrollHeight * 0.55)
    })
    await campPage.waitForTimeout(1500)

    // scroll + poll: the campaign table only mounts once its section is in view
    let table = null
    const campDeadline = Date.now() + 60000
    while (Date.now() < campDeadline) {
      table = await campPage.evaluate(() => {
      const headerRow = [...document.querySelectorAll('tr')].find((tr) => /Biaya Iklan/.test(tr.innerText || '') && /ROAS/.test(tr.innerText || ''))
      const nameRows = [...document.querySelectorAll('tr')].filter((tr) => /GMV Max/.test(tr.innerText || '') && (tr.innerText || '').length < 400)
      if (!headerRow || !nameRows.length) return null
      const headers = [...headerRow.querySelectorAll('td,th')].map((c) => (c.innerText || '').split('\n')[0].trim()).filter(Boolean)
      const metricRows = [...document.querySelectorAll('tr')].filter((tr) => tr.querySelectorAll('td').length >= 8 && /Rp/.test(tr.innerText || ''))
      const rows = []
      for (let i = 0; i < nameRows.length; i++) {
        const nameCells = [...nameRows[i].querySelectorAll('td')].map((c) => (c.innerText || '').replace(/\s+/g, ' ').trim())
        const metricTr = metricRows[i]
        if (!metricTr) continue
        const values = [...metricTr.querySelectorAll('td')].map((c) => (c.innerText || '').split('\n')[0].replace(/\s+/g, ' ').trim())
        const mapped = {}
        headers.forEach((h, idx) => { mapped[h] = values[idx] })
        rows.push({ nameCells, mapped })
      }
      return { headers, rows }
      })
      if (table) break
      await campPage.evaluate(() => window.scrollBy(0, 260))
      await campPage.waitForTimeout(2200)
    }

    if (!table || !table.rows.length) { errors.push('campaigns: tabel tidak ter-render'); out.partial = true; out.ads.campaignsAvailable = false }
    else {
      const pi = (v) => Number(String(v || '').replace(/[^\d]/g, '')) || 0
      const pf = (v) => { const n = Number(String(v || '').replace(',', '.').replace(/[^\d.]/g, '')); return Number.isFinite(n) ? n : null }
      out.ads.campaigns = table.rows.map(({ nameCells, mapped }) => {
        const joined = nameCells.join(' | ')
        const nameCell = nameCells
          .map((t) => ({ t, score: (String(t).match(/[A-Za-z]{4,}/g) || []).join('').length }))
          .sort((a, b) => b.score - a.score)[0]
        return {
          name: (nameCell && nameCell.score > 6 ? nameCell.t : (nameCells[1] || ''))
            .replace(/\s+Iklan Produk GMV Max.*$/i, '')
            .replace(/\s+Tidak Terbatas.*$/i, '')
            .trim(),
          type: (joined.match(/Iklan Produk (GMV Max (?:Auto|ROAS))/) || [null, ''])[1],
          status: (joined.match(/(Berjalan|Nonaktif|Berakhir|Dijadwalkan)/) || [null, ''])[1],
          budget: /Rp[\d.]+/.test(joined) ? pi((joined.match(/Rp[\d.]+/) || [''])[0]) : null,
          targetRoas: (joined.match(/([\d.,]+)\s*~\s*([\d.,]+)/) || [])[0] || null,
          spend: pi(mapped['Biaya Iklan']),
          sales: pi(mapped['Penjualan']),
          roas: pf(mapped['ROAS']),
          clicks: pi(mapped['Jumlah Klik']),
          impressions: pi(mapped['Iklan Dilihat']),
          ctrPct: pf(mapped['Persentase Klik']),
          orders: pi(mapped['Konversi']),
          productsSold: pi(mapped['Produk Terjual']),
          acosPct: pf(mapped['Persentase Biaya Iklan (ACOS)']),
          costPerOrder: pi(mapped['Biaya per Konversi']),
        }
      }).filter((r) => r.spend > 0 || r.sales > 0)
      out.ads.campaignsAvailable = out.ads.campaigns.length > 0
    }
  } catch (e) { errors.push('campaigns:' + String(e.message || e).slice(0, 120)); out.partial = true; out.ads.campaignsAvailable = false }
  try { if (campPage !== page) await campPage.close() } catch (e) { /* ignore */ }
}

/* 3. store real-time totals (today only) */
if (DATE === todayStr) {
  let storePage = page
  try {
    storePage = await task.newPage()
    for (let attempt = 0; attempt < 4; attempt++) {
      await storePage.goto('https://seller.shopee.co.id/datacenter/overview', { timeout: 90000 }).catch(() => {})
      await storePage.waitForTimeout(6000)
      await storePage.evaluate(() => {
        const el = [...document.querySelectorAll('div,span')].find((e) => /Kriteria Utama/.test(e.innerText || '') && (e.innerText || '').length < 2000)
        if (el) el.scrollIntoView({ block: 'start' })
      })
      await storePage.waitForTimeout(6000)
      const t = await storePage.evaluate(() => {
        const b = document.body.innerText || ''
        const i = b.indexOf('Kriteria Utama')
        return i < 0 ? '' : b.slice(i, i + 900)
      })
      if (!/Penjualan[\s\S]{0,90}Rp[\d.]/.test(t)) { errors.push('store: metrik belum tampil (percobaan ' + (attempt + 1) + ')'); continue }
      const lines = t.split('\n').map((x) => x.trim()).filter(Boolean)
      const nextNum = (label) => {
        const i = lines.findIndex((x) => x === label || x.startsWith(label))
        if (i < 0) return null
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const v = lines[j]
          if (/^Rp[\d.]+$/.test(v)) return Number(v.replace(/[^\d]/g, ''))
          if (/^[\d.,]+%$/.test(v)) return Number(v.replace('%', '').replace('.', '').replace(',', '.'))
          if (/^[\d.]+$/.test(v)) return Number(v)
        }
        return null
      }
      out.store = {
        sales: nextNum('Penjualan'),
        orders: nextNum('Pesanan'),
        conversionPct: nextNum('Tingkat Konversi Pesanan'),
        visitors: nextNum('Total Pengunjung'),
        productClicks: nextNum('Produk Diklik'),
        aov: nextNum('Penjualan per Pesanan'),
        contrib: null,
      }
      break
    }
  } catch (e) { errors.push('store:' + String(e.message || e).slice(0, 120)); out.partial = true }
  try { if (storePage !== page) await storePage.close() } catch (e) { /* ignore */ }
}

/* 4. cancellations / refunds for the date */
try {
  await page.goto('https://seller.shopee.co.id/portal/sale/returnrefundcancel', { timeout: 90000 }).catch(() => {})
  await poll(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => /Mengerti/i.test(b.innerText || ''))
    if (btn) { btn.click(); return true }
    return document.querySelectorAll('tr').length > 3 || (document.body.innerText || '').includes('Pengajuan')
  }, { timeout: 20000 })

  const items = await poll((target) => {
    const b = (document.body.innerText || '').split('\n').map((x) => x.trim()).filter(Boolean)
    const idx = []
    b.forEach((l, i) => { if (/^No\.\s*Pesanan$/.test(l)) idx.push(i) })
    if (!idx.length) return null
    const res = []
    for (let k = 0; k < idx.length; k++) {
      const i = idx[k]
      const stop = idx[k + 1] !== undefined ? idx[k + 1] : Math.min(b.length, i + 32)
      const bl = b.slice(Math.max(0, i - 2), stop)
      if (!bl.join(' | ').includes(target)) continue
      const orderIdx = bl.findIndex((x) => /^No\.\s*Pesanan$/.test(x))
      const refund = bl.find((x) => /^Rp[\d.]+$/.test(x)) || ''
      const reason = bl.find((x) => /Ingin mengubah|Barang tidak|Rusak|Salah|Berubah pikiran|Tidak sesuai|Stok habis/i.test(x)) || ''
      res.push({
        order: (bl[orderIdx + 1] || '').trim(),
        buyer: (bl.slice(0, 4).find((x) => x && x !== '-' && !/^Aksi$/i.test(x)) || '').trim(),
        product: (bl.find((x) => /[A-Za-z]{6,}/.test(x) && !/Pengembalian|Kompensasi|Total|Ingin|Dana|Dibatalkan|SPX|Variasi|Pre-Order|Mengerti/i.test(x)) || '').slice(0, 90),
        refund: Number(refund.replace(/[^\d]/g, '')) || 0,
        reason,
        solution: bl.find((x) => /Pengembalian dana|Kirim ulang|Tolak/i.test(x)) || '',
        status: bl.find((x) => /Dana Dikembalikan|Dalam Pengecekan|Sedang Dikembalikan|Ditolak/i.test(x)) || '',
        cancelledAt: target,
      })
    }
    return res
  }, { timeout: 25000, arg: dmy })

  const seen = new Set()
  out.cancellations.items = (items || []).filter((it) => { if (!it.order || seen.has(it.order)) return false; seen.add(it.order); return true })
  out.cancellations.available = (items || []).length > 0
  out.cancellations.count = out.cancellations.items.length
  out.cancellations.value = out.cancellations.items.reduce((a, c) => a + (c.refund || 0), 0)
} catch (e) { errors.push('cancellations:' + String(e.message || e).slice(0, 120)); out.partial = true; out.cancellations.available = false }

try { await page.close() } catch (e) { /* keep space alive */ }
console.log('###JSON###' + JSON.stringify(out))
