# Usage Statistics

A live usage ledger page for DeepSeek Harness. It answers "where did the tokens
go?" from the session logs already on disk: totals, composition, estimated spend,
a monthly budget, a bucketed timeline, one row per conversation, and Host CPU
activity. It appears as **Usage** in the sidebar and opens a full main-panel
page.

## What it shows

- **Ledger.** Total tokens, conversation count, message and turn counts, estimated
  spend, budget used, and total active time. A composition bar splits output /
  input (cache miss) / cache read, with the cache hit rate underneath.
- **Token timeline.** Stacked bars over automatically chosen intervals — 10
  minutes up to a 3h span, hourly to 36h, daily to 21 days, weekly beyond that,
  capped near 160 buckets. Switch the measure between tokens and estimated cost;
  hovering a bar gives the full segment breakdown for that interval.
- **Budget.** An editable monthly budget with a spend meter, remaining, projected
  month-end (month-to-date ÷ elapsed days × days in month), today's spend, days
  left, and the remaining budget expressed in tokens at the current blended rate.
- **Cost composition.** Blended USD per 1M tokens, the estimated token-only cost,
  and per-component rows (output, cache read, input cache miss) with shares.
- **CPU activity.** System utilization, the Harness Host's share of it, Host CPU
  time, peaks, and Host uptime, sampled every 2s. The chart keeps ~3 minutes of
  history; 180 samples are retained.
- **Conversations.** One row per conversation with tokens, estimated cost, share
  of total, and last activity, sorted by estimated spend. Expanding a row shows a
  mini token-activity chart plus turns, steps, tool calls, active time, cache hit
  rate, cost per turn, start time, and event count. Rows are labelled `root`,
  `fork`, or `subagent`, and resident conversations are marked live.

## How it works

- The Host half registers one prefix route, `/plugins/dsh-stats/overview`, on
  `ctx.webServer`. It lists durable session logs through `ctx.sessionPersistence`,
  reads each one through `ctx.sessionQuery.readSession`, and folds
  `assistant/message` usage. Summaries are cached per session revision, so
  polling stays cheap.
- Counting is monotonic over durable logs; a conversation still counts for turns,
  messages, and active time even when it recorded no `usage` block, which the page
  reflects in the usage coverage figure.
- CPU is sampled from `os.cpus()` deltas and `process.cpuUsage()` on a 2s
  interval, so the history starts when the plugin loads.
- The Client half polls the route every 6s, keeps the last good payload, and shows
  a stale banner instead of dropping the page when a refresh fails. One route
  feeds every card, so the numbers on screen are always from the same snapshot.

## Pricing

Costs are token-only estimates from DeepSeek list prices per 1M tokens.

| Model | Cache hit | Cache miss | Output |
| --- | --- | --- | --- |
| `deepseek-flash` | 0.003 | 0.15 | 0.6 |
| `deepseek-v4-pro` | 0.022 | 0.66 | 1.98 |

Peak hours are 01:00–04:00 and 06:00–10:00 UTC on weekdays and cost double;
everything else is off-peak at the list rate. Unknown model ids are priced as
`deepseek-flash`. Cache writes are counted at the cache-miss rate. Search, fetch,
and taxes are excluded. The page prints the rate mode it used (peak, off-peak, or
mixed) so an estimate is never ambiguous.

## Install

Add the package to a DSH profile and register the bundle, then restart:

```jsonc
// ~/.dsh/profiles/<profile>/package.json
{
  "dependencies": { "@local/dsh-usage-stats": "link:/absolute/path/to/usage-stats-plugin" },
  "dsh": { "profile": { "bundles": ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app", "@local/dsh-usage-stats"] } }
}
```

See the repository [README](../README.md) for the full install and adaptation
notes. [`token-farm-plugin`](../token-farm-plugin) reads this plugin's route, so
install it alongside if you want the farm.

## Configuration

- `budgetUsd` in the `cordis.patch.yml` row sets the default monthly budget
  (default `5`, capped at `1,000,000`).
- The page also accepts `?budgetUsd=` on the route, and stores the budget you type
  in the field under `dsh.usage-stats.budgetUsd` in `localStorage`.

## Data and privacy

Read-only and local. The plugin reads session logs and OS CPU counters, and serves
them to the Web client on the Host's own origin. It makes no outbound requests,
writes no files, and needs no credentials.

## Files

- `index.js`: Host half. Log folding, pricing, CPU sampling, and the
  `/plugins/dsh-stats/overview` route.
- `client.js`: the page, injected into the `main` and `sidebar.panellist` slots.
- `cordis.patch.yml`, `package.json`, `locale/*.json`, `icon.svg`: bundle
  manifest, row insert (with the budget config), display title/description, icon.
