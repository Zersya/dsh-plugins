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
  cancellations: { count: 0, value: 0, items: [] }, orders: null, errors,
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

/* 2. per-campaign table (DOM, today/yesterday only) */
if (out.ads && (DATE === todayStr || DATE === yestStr)) {
  try {
    await page.goto('https://seller.shopee.co.id/portal/marketing/pas/index', { timeout: 90000 }).catch(() => {})
    await page.waitForTimeout(4500)
    await page.evaluate(() => {
      const tab = [...document.querySelectorAll('.eds-tabs__nav-tab')].find((e) => (e.innerText || '').includes('Individual'))
      if (tab) { tab.scrollIntoView({ block: 'center' }); tab.click() }
    })
    await page.waitForTimeout(3000)
    const want = DATE === todayStr ? 'Hari Ini' : 'Kemarin'
    const label = await page.evaluate((w) => {
      const el = [...document.querySelectorAll('p,div,span')].find((e) => new RegExp('^' + w + ' \\(GMT\\+7\\)$').test((e.innerText || '').trim()))
        || [...document.querySelectorAll('p,div,span')].find((e) => /\\(GMT\+7\\)$/.test((e.innerText || '').trim()))
      if (!el) return ''
      if (!el.innerText.trim().startsWith(w)) { el.click(); return 'opened' }
      return 'already:' + el.innerText.trim()
    }, want)
    if (label === 'opened') {
      await page.waitForTimeout(1200)
      await page.evaluate((w) => {
        const el = [...document.querySelectorAll('div,span,li,p')].find((e) => (e.innerText || '').trim() === w)
        if (el) el.click()
      }, want)
      await page.waitForTimeout(4500)
    }
    const parsed = await page.evaluate(() => {
      const body = (document.body.innerText || '').split('\n').map((s) => s.trim())
      const names = []
      for (const tr of document.querySelectorAll('tr')) {
        const t = (tr.innerText || '').replace(/\s+/g, ' ').trim()
        if (!/GMV Max/.test(t)) continue
        const m = t.match(/^(.+?) Iklan Produk GMV Max (Auto|ROAS) (Tidak Terbatas|[\d\/]+ - [\d\/]+) (Berjalan|Nonaktif|Berakhir|Dijadwalkan)/)
        names.push(m ? { name: m[1], type: 'GMV Max ' + m[2], status: m[4] } : { name: t.slice(0, 80), type: '', status: '' })
      }
      const nums = []
      const i = body.findIndex((x) => /^Daftar Iklan Produk$/.test(x))
      for (let j = i; j < body.length; j++) {
        const v = body[j]
        if (/^Rp[\d.]+$/.test(v) || /^[\d.,]+%$/.test(v) || /^\d{1,3}(\.\d{3})*$/.test(v) || /^(Tidak Terbatas|[\d.,]+\s*~\s*[\d.,]+)$/.test(v)) nums.push(v)
      }
      return { names, nums }
    })
    const n = parsed.nums
    const rows = []
    let p = 0
    for (const meta of parsed.names) {
      let budget = null
      const grabMoney = () => { while (p < n.length && !/^Rp/.test(n[p])) p++; return n[p++] }
      // per row the sequence starts with budget/target sometimes captured in nums; skip until first Rp
      const spend = grabMoney(); const sales = grabMoney()
      const roas = n[p++] || '0'; const imp = n[p++] || '0'; const clicks = n[p++] || '0'
      const ctr = n[p++] || '0%'; const conv = n[p++] || '0'; const sold = n[p++] || '0'
      const acos = n[p++] || '0%'; const cpo = n[p++] || '-'
      const pi = (v) => Number(String(v).replace(/[^\d]/g, '')) || 0
      rows.push({ ...meta, targetRoas: null, budget, spend: pi(spend), sales: pi(sales), roas: Number(String(roas).replace(',', '.')) || 0,
        clicks: pi(clicks), impressions: pi(imp), ctrPct: Number(String(ctr).replace(',', '.')) || null,
        orders: pi(conv), productsSold: pi(sold), acosPct: Number(String(acos).replace(',', '.')) || null,
        costPerOrder: /^Rp/.test(cpo) ? pi(cpo) : null })
    }
    out.ads.campaigns = rows.filter((r) => r.spend > 0)
  } catch (e) { errors.push('campaigns:' + String(e.message || e).slice(0, 120)); out.partial = true }
}

/* 3. store real-time totals (today only) */
if (DATE === todayStr) {
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      await page.goto('https://seller.shopee.co.id/datacenter/overview', { timeout: 90000 }).catch(() => {})
      await page.waitForTimeout(9000)
      const t = await page.evaluate(() => {
        const b = document.body.innerText || ''
        const i = b.indexOf('Kriteria Utama')
        return i < 0 ? '' : b.slice(i, i + 900)
      })
      if (!/Penjualan\nRp/.test(t) && !/Penjualan\s*\n?\s*Rp/.test(t)) continue
      const grab = (label) => { const m = t.match(new RegExp(label + '[^\\d-]*(Rp[\\d.]+|[\\d.,]+%?)')); return m ? m[1] : null }
      const pi = (v) => (v && /Rp/.test(v) ? Number(v.replace(/[^\d]/g, '')) : v ? Number(String(v).replace(/[^\d]/g, '')) : null)
      out.store = {
        sales: pi(grab('Penjualan')), orders: Number(String(grab('Pesanan') || '').replace(/[^\d]/g, '')) || null,
        conversionPct: Number(String(grab('Tingkat Konversi Pesanan') || '').replace(',', '.').replace('%', '')) || null,
        visitors: Number(String(grab('Total Pengunjung') || '').replace(/[^\d]/g, '')) || null,
        productClicks: Number(String(grab('Produk Diklik') || '').replace(/[^\d]/g, '')) || null,
        aov: pi(grab('Penjualan per Pesanan')), contrib: null,
      }
      break
    }
  } catch (e) { errors.push('store:' + String(e.message || e).slice(0, 120)); out.partial = true }
}

/* 4. cancellations / refunds for the date */
try {
  await page.goto('https://seller.shopee.co.id/portal/sale/returnrefundcancel', { timeout: 90000 }).catch(() => {})
  await page.waitForTimeout(9000)
  const items = await page.evaluate((target) => {
    const b = (document.body.innerText || '').split('\n').map((s) => s.trim()).filter(Boolean)
    const idx = []
    b.forEach((l, i) => { if (l === 'No. Pesanan') idx.push(i) })
    const blocks = idx.map((i, k) => b.slice(Math.max(0, i - 2), idx[k + 1] !== undefined ? idx[k + 1] : Math.min(b.length, i + 30)))
    const res = []
    for (const bl of blocks) {
      const joined = bl.join(' | ')
      if (!joined.includes(target)) continue
      const order = bl[bl.indexOf('No. Pesanan') + 1] || ''
      const refundLine = bl.find((x) => /^Rp[\d.]+$/.test(x)) || ''
      const reasonIdx = bl.findIndex((x) => /Ingin mengubah|Barang tidak|Rusak|Salah|Berubah pikiran|Tidak sesuai/i.test(x))
      res.push({
        order, buyer: bl[0] === '-' ? bl[1] : bl[0],
        product: (bl.find((x) => /[A-Za-z]{6,}/.test(x) && !/Pengembalian|Kompensasi|Total|Ingin|Dana|Dibatalkan|SPX/.test(x)) || '').slice(0, 90),
        refund: Number(refundLine.replace(/[^\d]/g, '')) || 0,
        reason: reasonIdx >= 0 ? bl[reasonIdx] : '', solution: '',
        status: bl.find((x) => /Dana Dikembalikan|Dalam Pengecekan|Sedang Dikembalikan|Ditolak/i.test(x)) || '',
        cancelledAt: target,
      })
    }
    return res
  }, dmy)
  out.cancellations.items = items
  out.cancellations.count = items.length
  out.cancellations.value = items.reduce((a, c) => a + (c.refund || 0), 0)
} catch (e) { errors.push('cancellations:' + String(e.message || e).slice(0, 120)); out.partial = true }

try { await page.close() } catch (e) { /* keep space alive */ }
console.log('###JSON###' + JSON.stringify(out))
