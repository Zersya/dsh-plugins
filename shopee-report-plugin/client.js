window.__ModuleLoader__.load({
  id: '@local/dsh-shopee-report',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useCallback, useEffect, useMemo, useState } = React

    const PANEL_ID = 'shopee-report'
    const API = '/shopee-report'
    const POLL_MS = 30000
    const RUNNING_POLL_MS = 4000

    const rp = (v) => (v == null ? '–' : 'Rp' + Math.round(v).toLocaleString('id-ID'))
    const num = (v) => (v == null ? '–' : Math.round(v).toLocaleString('id-ID'))
    const pct = (v, d = 1) => (v == null || Number.isNaN(v) ? '–' : v.toFixed(d).replace('.', ',') + '%')
    const r2 = (v) => (v == null || Number.isNaN(v) ? '–' : v.toFixed(2).replace('.', ','))

    const CSS = `
    .sr-root{height:100%;overflow:auto;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);
      font-size:13px;line-height:1.5;-webkit-font-smoothing:antialiased;color-scheme:light dark}
    .sr-root *{box-sizing:border-box}
    .sr-wrap{max-width:1160px;margin:0 auto;padding:28px 24px 64px}

    .sr-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:6px}
    .sr-title{margin:0;font-size:19px;line-height:1.3;font-weight:600;letter-spacing:-.012em}
    .sr-sub{margin-top:5px;color:var(--dsw-alias-label-secondary);font-size:12px}
    .sr-controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-top:2px}
    .sr-btn{font:inherit;font-size:12.5px;line-height:1;border-radius:9px;padding:8px 12px;cursor:pointer;
      transition:background .12s ease,border-color .12s ease,opacity .12s ease}
    .sr-dd{position:relative}
    .sr-dd-btn{display:inline-flex;align-items:center;gap:8px;font:inherit;font-size:12.5px;line-height:1;padding:8px 12px;
      border-radius:9px;cursor:pointer;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);
      border:1px solid var(--dsw-alias-border-l2);transition:background .12s ease,border-color .12s ease}
    .sr-dd-btn:hover{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l3,var(--dsw-alias-border-l2))}
    .sr-dd-caret{width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;
      border-top:5px solid var(--dsw-alias-label-secondary)}
    .sr-dd-list{position:absolute;right:0;top:calc(100% + 6px);z-index:20;min-width:150px;max-height:260px;overflow:auto;
      padding:5px;border-radius:11px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);
      box-shadow:0 10px 28px #00000040}
    .sr-dd-item{display:block;width:100%;text-align:left;font:inherit;font-size:12.5px;padding:8px 10px;border-radius:7px;
      border:0;background:transparent;color:var(--dsw-alias-label-primary);cursor:pointer;font-variant-numeric:tabular-nums}
    .sr-dd-item:hover{background:var(--dsw-alias-interactive-bg-hover)}
    .sr-dd-item[aria-selected="true"]{background:var(--dsw-alias-interactive-bg-hover);font-weight:600}
    .sr-btn{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);border:1px solid transparent;font-weight:550}
    .sr-btn:hover:not([disabled]){opacity:.88}
    .sr-btn[disabled]{opacity:.5;cursor:default}
    .sr-root button:focus-visible,.sr-root select:focus-visible{outline:2px solid var(--dsw-alias-state-warn-primary);outline-offset:2px}

    .sr-pill{display:inline-flex;align-items:center;gap:6px;padding:3px 9px;border-radius:999px;font-size:11.5px;
      font-weight:500;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);
      border:1px solid var(--dsw-alias-border-l2);white-space:nowrap}
    .sr-dot{width:7px;height:7px;border-radius:50%;flex:0 0 auto}

    .sr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(172px,1fr));gap:12px;margin:20px 0 8px}
    .sr-card{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:14px;
      padding:14px 15px;min-width:0}
    .sr-k{font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--dsw-alias-label-secondary);font-weight:550}
    .sr-v{margin-top:8px;font-size:21px;line-height:1.15;font-weight:600;letter-spacing:-.02em;
      font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary);overflow-wrap:anywhere}
    .sr-n{margin-top:6px;font-size:11px;line-height:1.45;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
    .sr-sign{font-size:12px;margin-right:3px;color:var(--dsw-alias-label-secondary)}

    .sr-sec{display:flex;align-items:baseline;gap:10px;margin:30px 0 10px;font-size:13px;font-weight:600;letter-spacing:-.005em}
    .sr-sec small{font-weight:400;font-size:11.5px;color:var(--dsw-alias-label-secondary)}

    .sr-box{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:14px;overflow:hidden}
    .sr-scroll{overflow-x:auto}
    table.sr-t{width:100%;border-collapse:separate;border-spacing:0;font-size:12.5px}
    table.sr-t th{position:sticky;top:0;z-index:1;text-align:left;font-weight:550;font-size:10.5px;letter-spacing:.05em;
      text-transform:uppercase;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);
      padding:9px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);white-space:nowrap}
    table.sr-t td{padding:11px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);vertical-align:top;color:var(--dsw-alias-label-primary)}
    table.sr-t tbody tr:last-child td{border-bottom:0}
    table.sr-t tbody tr:hover td{background:var(--dsw-alias-interactive-bg-hover)}
    .sr-r{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
    .sr-name{font-weight:550;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .sr-tag{margin-top:3px;font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:300px}
    .sr-strong{font-weight:600}

    .sr-verdict{margin-top:20px;padding:14px 16px;border-radius:14px;background:var(--dsw-alias-bg-layer-1);
      border:1px solid var(--dsw-alias-border-l1)}
    .sr-verdict-h{font-size:12px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;color:var(--dsw-alias-label-secondary);margin-bottom:8px}
    .sr-verdict ul{margin:0;padding-left:18px}
    .sr-verdict li{margin-bottom:6px;font-size:12.5px}
    .sr-verdict li:last-child{margin-bottom:0}

    .sr-empty{padding:52px 20px;text-align:center;color:var(--dsw-alias-label-secondary)}
    .sr-empty strong{display:block;color:var(--dsw-alias-label-primary);font-size:14px;font-weight:600;margin-bottom:6px}
    .sr-empty code{font-family:ui-monospace,SFMono-Regular,monospace;font-size:11.5px;padding:3px 7px;border-radius:7px;
      background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-primary)}

    .sr-spark{display:flex;align-items:flex-end;justify-content:space-between;gap:6px;height:64px;
      border-bottom:1px solid var(--dsw-alias-border-l1);padding-bottom:2px}
    .sr-bar{flex:1 1 0;display:flex;align-items:flex-end;justify-content:center;gap:3px;min-width:8px;max-width:46px}
    .sr-bar i{width:38%;max-width:9px;border-radius:3px 3px 0 0;display:block}
    .sr-b-sales{background:var(--dsw-alias-brand-primary-new-colorprimary-new-color)}
    .sr-b-spend{background:var(--dsw-alias-state-warn-primary);opacity:.9}
    .sr-hint{margin:0 0 10px;font-size:11.5px;color:var(--dsw-alias-label-secondary)}
    .sr-spark-x{display:flex;justify-content:space-between;padding:6px 2px 10px;font-size:10.5px;
      letter-spacing:.04em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary)}
    .sr-note{margin-top:14px;font-size:11.5px;color:var(--dsw-alias-label-secondary);line-height:1.6}
    .sr-err{color:var(--dsw-alias-label-primary);border-left:2px solid var(--dsw-alias-state-error-primary);padding-left:10px;margin-top:8px}
    .sr-skel{height:13px;border-radius:6px;background:var(--dsw-alias-bg-layer-2)}
    @media (max-width:680px){
      .sr-wrap{padding:20px 14px 52px}
      .sr-v{font-size:18px}
      .sr-grid{grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px}
      .sr-name,.sr-tag{max-width:180px}
    }
    `

    /* ---------- economics ---------- */
    function buildEconomics(eco) {
      if (!eco) return null
      const fee = Number(eco.platformFees?.totalPct ?? 23.7) / 100
      const products = (eco.products || []).map((p) => {
        const price = Number(p.price) || 0
        const hpp = Number(p.hpp) || 0
        const pack = p.hppIncludesPackaging ? 0 : Number(p.packaging ?? 0)
        const net = price * (1 - fee) - hpp - pack
        return { ...p, price, hpp, pack, net, cmPct: price ? (net / price) * 100 : 0, beRoas: net > 0 ? price / net : null }
      })
      const byId = new Map(products.map((p) => [String(p.id), p]))
      const campaignMap = (eco.campaigns || []).map((c) => ({ match: String(c.match || ''), product: byId.get(String(c.productId)) }))
      return { feePct: fee * 100, products, campaignMap, defaultCmPct: Number(eco.defaultCmPct ?? 45) }
    }

    function economicsForCampaign(name, econ) {
      const hit = econ?.campaignMap?.find((c) => c.product && name && name.toLowerCase().includes(c.match.toLowerCase()))
      if (hit) return hit.product
      return null
    }

    /* ---------- small components ---------- */
    function Card({ label, value, note, trend }) {
      return h('div', { className: 'sr-card' },
        h('div', { className: 'sr-k' }, label),
        h('div', { className: 'sr-v' }, trend ? h('span', { className: 'sr-sign' }, trend) : null, value),
        note ? h('div', { className: 'sr-n' }, note) : null)
    }

    const TONE_VAR = {
      good: 'var(--dsw-alias-state-success-primary)',
      warn: 'var(--dsw-alias-state-warn-primary)',
      bad: 'var(--dsw-alias-state-error-primary)',
      idle: 'var(--dsw-alias-label-tertiary)',
    }

    function DatePicker({ value, days, onChange }) {
      const [open, setOpen] = useState(false)
      const boxRef = React.useRef(null)
      useEffect(() => {
        if (!open) return
        const onDoc = (ev) => { if (boxRef.current && !boxRef.current.contains(ev.target)) setOpen(false) }
        document.addEventListener('mousedown', onDoc)
        return () => document.removeEventListener('mousedown', onDoc)
      }, [open])
      const list = (days || []).slice().reverse()
      return h('div', { className: 'sr-dd', ref: boxRef },
        h('button', {
          className: 'sr-dd-btn', 'aria-haspopup': 'listbox', 'aria-expanded': open,
          onClick: () => setOpen((v) => !v),
        }, h('span', null, value || 'pilih tanggal'), h('span', { className: 'sr-dd-caret' })),
        open ? h('div', { className: 'sr-dd-list', role: 'listbox' },
          ...list.map((d) => h('button', {
            key: d, role: 'option', 'aria-selected': d === value, className: 'sr-dd-item',
            onClick: () => { setOpen(false); onChange(d) },
          }, d))) : null)
    }

    function Pill({ tone, children }) {
      return h('span', { className: 'sr-pill' },
        h('span', { className: 'sr-dot', style: { background: TONE_VAR[tone] || TONE_VAR.idle } }),
        h('span', null, children))
    }

    function CampaignTable({ rows, campaignsAvailable }) {
      const empty = h('tr', null,
        h('td', { colSpan: 9, style: { padding: '13px 14px', color: 'var(--dsw-alias-label-secondary)' } },
          campaignsAvailable === false
            ? 'Data campaign belum tersedia untuk tanggal ini. Total iklan di atas tetap akurat.'
            : 'Belum ada campaign aktif pada tanggal ini.'))

      const body = rows.length
        ? rows.map((c, i) => h('tr', { key: i },
            h('td', null,
              h('div', { className: 'sr-name', title: c.name }, c.name),
              h('div', { className: 'sr-tag' },
                [c.type, c.budget ? 'budget ' + rp(c.budget) : 'budget tak terbatas', c.targetRoas ? 'target ' + c.targetRoas : '']
                  .filter(Boolean).join(' · '))),
            h('td', { className: 'sr-r' }, rp(c.spend)),
            h('td', { className: 'sr-r' }, rp(c.sales)),
            h('td', { className: 'sr-r' }, r2(c.roas)),
            h('td', { className: 'sr-r' }, pct(c.acosPct)),
            h('td', { className: 'sr-r' }, r2(c.beRoas)),
            h('td', { className: 'sr-r' }, pct(c.cmPct)),
            h('td', { className: 'sr-r sr-strong' }, (c.profit >= 0 ? '\u25B2 ' : '\u25BC ') + rp(Math.abs(c.profit))),
            h('td', null, h(Pill, { tone: c.tone }, c.label))))
        : [empty]

      return h('div', null,
        h('div', { className: 'sr-sec' }, 'Per campaign', h('small', null, 'laba = penjualan × margin − biaya iklan')),
        h('div', { className: 'sr-hint' },
          'ACOS di bawah Break-even = untung; di atasnya = rugi (ACOS = biaya iklan ÷ penjualan).'),
        h('div', { className: 'sr-box' },
          h('div', { className: 'sr-scroll' },
            h('table', { className: 'sr-t' },
              h('thead', null,
                h('tr', null,
                  h('th', null, 'Campaign'),
                  h('th', { className: 'sr-r' }, 'Biaya'),
                  h('th', { className: 'sr-r' }, 'Penjualan'),
                  h('th', { className: 'sr-r' }, 'ROAS'),
                  h('th', { className: 'sr-r' }, 'ACOS'),
                  h('th', { className: 'sr-r' }, 'Break-even'),
                  h('th', { className: 'sr-r' }, 'Margin'),
                  h('th', { className: 'sr-r' }, 'Laba'),
                  h('th', null, 'Status'))),
              h('tbody', null, ...body)))))
    }

    function WeeklySection({ week, econ, onSyncWeek, busy }) {
      if (!week) return null
      const cm = (econ && econ.defaultCmPct) || 45
      const profit = (week.sales || 0) * (cm / 100) - (week.spend || 0)

      const header = h('div', { className: 'sr-sec' },
        'Ringkasan 7 hari',
        h('small', null, `${week.from} → ${week.to} · ${week.days}/${week.expected} hari`),
        week.missing.length
          ? h('span', { className: 'sr-pill', style: { marginLeft: 'auto' } },
              h('span', { className: 'sr-dot', style: { background: 'var(--dsw-alias-state-warn-primary)' } }),
              h('span', null, `${week.missing.length} hari belum di-sync`))
          : null)

      const cards = h('div', { className: 'sr-grid' },
        h(Card, { label: 'Penjualan 7 hari', value: rp(week.sales), note: `${num(week.orders)} pesanan · AOV ${rp(week.aov)}` }),
        h(Card, { label: 'Biaya iklan 7 hari', value: rp(week.spend), note: `ROAS ${r2(week.roas)} · ACOS ${pct(week.acosPct)}` }),
        h(Card, { label: 'Laba iklan 7 hari*', value: rp(Math.abs(profit)), trend: profit >= 0 ? '\u25B2' : '\u25BC', note: `margin ${pct(cm)} campuran` }),
        h(Card, { label: 'Pembatalan 7 hari', value: num(week.cancelled), note: rp(week.cancelledValue) + ' refund' }))

      const rows = week.rows.map((r, i) => h('tr', { key: i },
        h('td', null, r.date),
        h('td', { className: 'sr-r' }, r.present ? rp(r.sales) : '\u2014'),
        h('td', { className: 'sr-r' }, r.present ? rp(r.spend) : '\u2014'),
        h('td', { className: 'sr-r' }, r.present ? r2(r.roas) : '\u2014'),
        h('td', { className: 'sr-r' }, r.present ? num(r.orders) : '\u2014'),
        h('td', { className: 'sr-r' }, r.present ? num(r.cancelled) : '\u2014'),
        h('td', null, h(Pill, { tone: r.present ? 'good' : 'idle' }, r.present ? 'ada' : 'belum sync'))))

      const table = h('div', { className: 'sr-box', style: { marginTop: 10 } },
        h('div', { className: 'sr-scroll' },
          h('table', { className: 'sr-t' },
            h('thead', null, h('tr', null,
              h('th', null, 'Tanggal'),
              h('th', { className: 'sr-r' }, 'Penjualan'),
              h('th', { className: 'sr-r' }, 'Biaya iklan'),
              h('th', { className: 'sr-r' }, 'ROAS'),
              h('th', { className: 'sr-r' }, 'Pesanan'),
              h('th', { className: 'sr-r' }, 'Batal'),
              h('th', null, 'Status'))),
            h('tbody', null, ...rows))))

      const controls = h('div', { className: 'sr-controls', style: { marginTop: 12 } },
        h('button', { className: 'sr-btn', disabled: busy, onClick: onSyncWeek }, busy ? 'Menyinkronkan…' : 'Sync minggu ini'),
        h('div', { className: 'sr-note', style: { marginTop: 0 } }, 'Hanya tanggal yang belum punya snapshot yang ditarik.'))

      return h('div', null, header, cards, table, controls)
    }

    function Spark({ rows }) {
      const days = rows.slice(-14)
      if (!days.length) return null
      const max = Math.max(1, ...days.map((d) => Math.max(Number(d.sales) || 0, Number(d.spend) || 0)))
      const H = 58
      const hh = (v) => { const n = Number(v) || 0; return n ? Math.max(3, Math.round((n / max) * H)) : 2 }
      return h('div', { className: 'sr-sparkwrap' },
        h('div', { className: 'sr-spark' },
          ...days.map((d, i) => h('div', {
            key: i, className: 'sr-bar',
            title: `${d.date} · penjualan ${rp(d.sales)} · iklan ${rp(d.spend)} · ROAS ${r2(d.roas)}`,
          },
            h('i', { className: 'sr-b-sales', style: { height: hh(d.sales) + 'px' } }),
            h('i', { className: 'sr-b-spend', style: { height: hh(d.spend) + 'px' } })))),
        h('div', { className: 'sr-spark-x' },
          h('span', null, days[0].date.slice(5)),
          h('span', null, days[days.length - 1].date.slice(5))))
    }

    function Dashboard() {
      const [state, setState] = useState(null)
      const [date, setDate] = useState('')
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState('')

      const load = useCallback(async (sel) => {
        const url = new URL(API + '/state', document.baseURI)
        if (sel) url.searchParams.set('date', sel)
        const res = await fetch(url.toString(), { credentials: 'same-origin', headers: { accept: 'application/json' } })
        const payload = await res.json().catch(() => null)
        if (!res.ok || !payload?.ok) throw new Error(payload?.message || `Gagal memuat (${res.status})`)
        setState(payload)
        if (!sel && payload.date) setDate(payload.date)
      }, [])

      useEffect(() => { load('').catch((e) => setError(String(e.message || e))) }, [load])
      useEffect(() => {
        const running = state?.sync?.state === 'running'
        const id = setInterval(() => { load(date).catch(() => {}) }, running ? RUNNING_POLL_MS : POLL_MS)
        return () => clearInterval(id)
      }, [date, load, state?.sync?.state])

      const sync = useCallback(async () => {
        setBusy(true); setError('')
        try {
          const res = await fetch(API + '/sync' + (date ? `?date=${date}` : ''), { method: 'POST', credentials: 'same-origin' })
          const payload = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error(payload?.message || payload?.error || `Gagal sync (${res.status})`)
          setTimeout(() => { load(date).catch(() => {}) }, 700)
        } catch (e) { setError(String(e.message || e)) } finally { setBusy(false) }
      }, [date, load])

      const syncWeek = useCallback(async () => {
        setBusy(true); setError('')
        try {
          const res = await fetch(API + '/sync-week', { method: 'POST', credentials: 'same-origin' })
          const payload = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error(payload?.message || payload?.error || `Gagal sync minggu (${res.status})`)
          setTimeout(() => { load(date).catch(() => {}) }, 700)
        } catch (e) { setError(String(e.message || e)) } finally { setBusy(false) }
      }, [date, load])

      const econ = useMemo(() => buildEconomics(state?.economics), [state?.economics])
      const day = state?.day
      const ads = day?.ads
      const store = day?.store
      const canc = day?.cancellations
      const running = state?.sync?.state === 'running'

      if (!state) return h('div', { className: 'sr-root' }, h('style', null, CSS), h('div', { className: 'sr-wrap' }, h('div', { className: 'sr-empty' }, error || 'Memuat laporan…')))

      if (!day) {
        return h('div', { className: 'sr-root' }, h('style', null, CSS),
          h('div', { className: 'sr-wrap' },
            h('div', { className: 'sr-head' },
              h('div', null,
                h('h1', { className: 'sr-title' }, 'Laporan Shopee · mamicleo_id'),
                h('div', { className: 'sr-sub' }, 'Belum ada data. Jalankan sync pertama — agent akan membuka browser (ego-browser) dan menarik data iklan, penjualan, dan pembatalan.')),
              h('div', { className: 'sr-controls' },
                h('button', { className: 'sr-btn', disabled: busy || running, onClick: sync }, running ? 'Menyinkronkan…' : 'Sync sekarang'))),
            h('div', { className: 'sr-empty' },
              h('strong', null, 'Belum ada data untuk tanggal ini'),
              h('div', { className: 'sr-note' }, 'Atau dari terminal: ', h('code', null, 'node shopee-report/collector/run-sync.mjs')),
              error ? h('div', { className: 'sr-err' }, error) : null)))
      }

      const spend = ads?.spend ?? 0
      const sales = ads?.sales ?? store?.sales ?? 0
      const roas = ads?.roas ?? (spend ? sales / spend : null)
      const acos = ads?.acosPct ?? (sales ? (spend / sales) * 100 : null)
      const blendedCm = econ ? econ.defaultCmPct : 45
      const adProfit = sales * (blendedCm / 100) - spend

      const campaignRows = (ads?.campaigns || []).map((c) => {
        const product = economicsForCampaign(c.name, econ)
        const cmPct = product ? product.cmPct : blendedCm
        const beRoas = product ? product.beRoas : 100 / blendedCm
        const profit = (c.sales || 0) * (cmPct / 100) - (c.spend || 0)
        const tone = profit > 0 && (c.roas || 0) >= beRoas * 1.15 ? 'good' : profit > 0 ? 'warn' : 'bad'
        const label = tone === 'good' ? 'Sehat' : tone === 'warn' ? 'Tipis' : 'Rugi'
        return { ...c, product, cmPct, beRoas, profit, tone, label }
      })

      const verdicts = []
      for (const c of campaignRows) {
        if (c.tone === 'bad') verdicts.push(`${c.name.split('[')[0].trim()} rugi: ACOS ${pct(c.acosPct ?? (c.sales ? (c.spend / c.sales) * 100 : null))} > margin ${pct(c.cmPct)}. Turunkan budget atau naikkan harga.`)
        else if (c.tone === 'warn') verdicts.push(`${c.name.split('[')[0].trim()} baru balik modal (ROAS ${r2(c.roas)} vs break-even ${r2(c.beRoas)}). Jangan dinaikkan dulu.`)
      }
      if (canc?.count) verdicts.push(`${canc.count} pembatalan senilai ${rp(canc.value)} hari ini — cek apakah pembeli order ulang (biaya iklan tidak kembali).`)
      if (canc?.count && store?.sales) verdicts.push(`Pembatalan = ${pct((canc.value / (store.sales + canc.value)) * 100)} dari order kotor.`)

      return h('div', { className: 'sr-root' }, h('style', null, CSS),
        h('div', { className: 'sr-wrap' },
          h('div', { className: 'sr-head' },
            h('div', null,
              h('h1', { className: 'sr-title' }, 'Laporan Shopee · mamicleo_id'),
              h('div', { className: 'sr-sub' },
                `Data ${state.date} · `,
                state.sync?.finishedAt
                  ? `sync terakhir ${new Date(state.sync.finishedAt).toLocaleString('id-ID')}`
                  : day?.syncAt ? `sync terakhir ${new Date(day.syncAt).toLocaleString('id-ID')}` : 'belum pernah sync',
                day?.partial ? ' · data sebagian' : '')),
            h('div', { className: 'sr-controls' },
              h(DatePicker, { value: date, days: state.days, onChange: (d) => { setDate(d); load(d).catch(() => {}) } }),
              h('button', { className: 'sr-btn', disabled: busy || running, onClick: sync }, running ? 'Menyinkronkan…' : 'Sync sekarang'),
              running ? h(Pill, { tone: 'warn' }, 'sync berjalan') : null,
              error ? h(Pill, { tone: 'bad' }, error) : null)),

          h('div', { className: 'sr-grid' },
            h(Card, { label: 'Penjualan', value: rp(store?.sales ?? sales), note: `${num(store?.orders ?? ads?.orders)} pesanan${store?.aov != null ? ' · AOV ' + rp(store.aov) : ''}` }),
            h(Card, { label: 'Biaya iklan', value: rp(spend), note: `ROAS ${r2(roas)} · ACOS ${pct(acos)}` }),
            h(Card, { label: 'Laba iklan*', value: rp(Math.abs(adProfit)), trend: adProfit >= 0 ? '▲' : '▼', note: `margin ${pct(blendedCm)} campuran · sebelum biaya tetap` }),
            h(Card, {
              label: 'Pembatalan',
              value: canc?.available === false ? '—' : num(canc?.count ?? 0),
              note: canc?.available === false ? 'belum tersedia' : rp(canc?.value ?? 0) + ' refund',
            }),
            h(Card, { label: 'Saldo iklan', value: rp(day?.wallet?.balance), note: `terpakai hari ini ${rp(day?.wallet?.spentToday)}` }),
            h(Card, {
              label: 'Pengunjung',
              value: num(store?.visitors),
              note: store?.visitors == null
                ? (date === state.days[state.days.length - 1] ? 'belum terambil — coba sync ulang' : 'hanya tersedia untuk hari berjalan')
                : `konversi ${pct(store?.conversionPct, 2)}`,
            })),

          h(CampaignTable, { rows: campaignRows, campaignsAvailable: ads?.campaignsAvailable }),

          h('div', { className: 'sr-sec' }, 'Tren 14 hari', h('small', null, 'biru = penjualan, oranye = biaya iklan')),
          (state.summaries || []).length >= 3
            ? h('div', { className: 'sr-box' }, h(Spark, { rows: state.summaries || [] }))
            : h('div', { className: 'sr-box' }, h('div', { style: { padding: '20px 16px', color: 'var(--dsw-alias-label-secondary)', fontSize: '12.5px' } },
                `Baru ada ${(state.summaries || []).length} hari data. Grafik muncul setelah 3 hari — sync otomatis berjalan 3× sehari.`)),

          h(WeeklySection, { week: state.week, econ, onSyncWeek: syncWeek, busy: busy || running }),

          canc?.items?.length ? h(Cancellations, { canc }) : null,

          verdicts.length ? h('div', { className: 'sr-verdict' },
            h('div', { className: 'sr-verdict-h' }, 'Yang perlu diperhatikan'),
            h('ul', null, ...verdicts.slice(0, 6).map((v, i) => h('li', { key: i, style: { marginBottom: 4 } }, v)))) : null,

          h('div', { className: 'sr-note' },
            `*Laba iklan memakai margin kontribusi setelah fee platform ${pct(econ?.feePct ?? 23.7)} dan HPP. `,
            'Angka iklan & penjualan dari Shopee Seller Centre; HPP & fee dari data yang kamu masukkan.',
            day?.errors?.length ? h('div', { className: 'sr-err' }, 'Catatan sync: ' + day.errors.join(' · ')) : null)))
    }


    function Cancellations({ canc }) {
      return h('div', null,
        h('div', { className: 'sr-sec' }, 'Pembatalan hari ini', h('small', null, `${canc.count} kasus · ${rp(canc.value)}`)),
        h('div', { className: 'sr-box' },
          h('table', { className: 'sr-t' },
            h('thead', null, h('tr', null,
              h('th', null, 'Pesanan'), h('th', null, 'Pembeli'), h('th', null, 'Produk'),
              h('th', { className: 'sr-r' }, 'Refund'), h('th', null, 'Alasan'))),
            h('tbody', null, ...(canc.items || []).map((it, i) => h('tr', { key: i },
              h('td', null, it.order),
              h('td', null, it.buyer),
              h('td', null, h('div', { className: 'sr-name', title: it.product }, it.product)),
              h('td', { className: 'sr-r' }, rp(it.refund)),
              h('td', null, it.reason || '–')))))))
    }

    function Icon() {
      return h('svg', { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' },
        h('path', { d: 'M3 3h18l-2 5H5L3 3z' }), h('path', { d: 'M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8' }), h('path', { d: 'M9 12h6' }))
    }

    class PanelBoundary extends React.Component {
      constructor(props) { super(props); this.state = { error: null } }
      static getDerivedStateFromError(error) { return { error } }
      componentDidCatch(error, info) { console.error('shopee-report: render failed', error, info) }
      render() {
        if (!this.state.error) return this.props.children
        return h('div', { className: 'sr-root' },
          h('style', null, CSS),
          h('div', { className: 'sr-wrap' },
            h('div', { className: 'sr-empty' },
              h('strong', null, 'Dashboard gagal dirender'),
              h('div', null, String(this.state.error && this.state.error.message ? this.state.error.message : this.state.error)),
              h('div', { className: 'sr-note' }, 'Reload halaman. Kalau berulang, jalankan sync lalu reload.'))))
      }
    }

    const Page = () => h(PanelBoundary, null, h(Dashboard))

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL_ID }, Page))
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: PANEL_ID, order: 26, label: 'Shopee' }, Icon))
      },
    }
  },
})
