# Shopee Report Plugin

A Shopee seller dashboard for DSH: one **Shopee** entry in the sidebar with daily
sales, ad spend, cancellations, and a per-campaign table that turns ROAS into
**actual money** — contribution margin after platform fees and COGS, plus the
break-even ROAS for every campaign.

## What it shows

| Card / section | Content |
| --- | --- |
| KPI cards | Sales, ad spend (ROAS, ACOS), ad profit, cancellations, wallet balance, visitors + conversion |
| Per campaign | Spend, sales, ROAS, **break-even ROAS**, margin, **profit or loss**, status badge (Sehat / Tipis / Rugi) |
| Trend | 14-day two-series spark: sales vs ad spend |
| Cancellations | Order, buyer, product, refund amount, reason |
| Verdict strip | Rules-based warnings, e.g. "rugi: ACOS 39.0% > margin 38.1%" |

Profit is computed as `sales × contribution margin − ad spend`, where the margin
comes from `economics.json`: price, COGS, packaging, and the platform fee
percentage. Edit that file for your own shop.

## How data arrives

```
Sync button / schedule
      │
      ▼
Host half (index.js) ──spawn──▶ collector/run-sync.mjs
      │                              │
      │                       ego-browser (logged-in seller session)
      │                              │ scrape Shopee Seller Centre
      ▼                              ▼
Client page ◀── JSON ── data/days/<YYYY-MM-DD>.json
```

The collector is a plain ego-browser script: no LLM, no tokens, ~60–90 s per run.

## Requirements

- **ego-browser** (ego lite) on `PATH`, with a Shopee Seller Centre login that
  persists in the browser profile.
- A Shopee shop; the collector is written against Shopee **Indonesia** Seller
  Centre endpoints and DOM.

## Install

```bash
# 1. link the plugin into the target profile
node install.mjs web          # or another profile name

# 2. restart / reload DSH, then open "Shopee" in the sidebar
```

Prefer not to load it in every session? Skip the bundle entry and boot with an
overlay instead:

```bash
dsh web --patch ./cordis.patch.yml
```

## Scheduler (recommended)

Three runs a day, tuned to how Shopee attribution settles:

| Time (WIB) | Purpose |
| --- | --- |
| 08:30 | morning — yesterday settled |
| 16:00 | before prime time |
| 00:30 | closing — finalizes the previous day |

See `collector/README.md` for a launchd example and the CLI flags.

## Limitations

- Campaign-level rows and the cancellation list are scraped from the DOM, so a
  Shopee UI change needs a selector update; totals come from Shopee's own report
  API and stay accurate.
- Store totals for past dates are only available for the current day (Shopee
  real-time endpoint).
- The collector never closes its browser task space, so successive runs are cheap.

## License

MIT

## UI regression test

`test/ui-a11y.sh` drives a running DSH instance and checks the panel objectively:

```bash
./test/ui-a11y.sh 'http://host:port/?token=…'
```

Checks: panel opens · contrast in light and dark (per text node, WCAG AA) · one polite live
region with `role="status"` · every `th` scoped · chart has a text alternative · keyboard focus
ring on buttons · date picker opens with Enter and closes with Escape. Exit code is non-zero when
any check fails, so it can gate a release.
