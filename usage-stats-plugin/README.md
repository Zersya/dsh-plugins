# Usage Statistics

A live usage ledger page for DeepSeek Harness. It answers "where did the tokens
go?" from the session logs already on disk: totals, composition, estimated spend,
a monthly budget, a bucketed timeline, one row per conversation, and Host CPU
activity. It appears as **Usage** in the sidebar and opens a full main-panel
page.

Every response is priced by **the provider that served it**. One ledger can mix
DeepSeek's direct API, Command Code, and any other provider profile you declare,
without one provider's rate card or billing clock leaking into another's costs.

## What it shows

- **Ledger.** Total tokens, conversation count, message and turn counts, estimated
  spend, budget used, and total active time. A composition bar splits output /
  input (cache miss) / cache read, with the cache hit rate underneath.
- **Providers.** One row per provider that served a response: calls, tokens,
  cache hit rate, blended rate per 1M tokens, estimated spend, share of spend,
  the billing clock it follows (**peak windows** / **weekday peak** / **flat
  rate**), and a chip per model it served. This is the multi-provider view — the
  same ledger, split by who billed it.
- **Session cost chip.** The composer dock shows the current conversation's
  estimated spend, plus one of two badges:
  - a **plan counter** for a provider that publishes an account balance
    (Command Code today): remaining credits, e.g. `GOAT $69.89 left`, with the
    five-hour, weekly, and cycle windows in the tooltip;
  - a **Peak** / **Off-peak** badge for a provider billed on DeepSeek's hourly
    windows, which flips within a second of a window boundary.

  The badge follows the conversation you switch to, and the counter also shows
  on a brand-new conversation so the balance is visible before the first call.
- **Rate clock.** A live peak/off-peak strip, shown only while a provider on
  hourly windows is in use: local time and zone, a **Peak now** / **Off-peak
  now** chip, a countdown to the next switch, today's peak windows in your
  timezone, spend split by rate (peak / off-peak / flat), and a seven-day strip
  that shades each day's peak windows.
- **Token timeline.** Stacked bars over automatically chosen intervals — 10
  minutes up to a 3h span, hourly to 36h, daily to 21 days, weekly beyond that,
  capped near 160 buckets. Switch the measure between tokens and estimated cost;
  hovering a bar gives the full segment breakdown for that interval.
- **Budget.** An editable monthly budget with a spend meter, remaining,
  projected month-end (month-to-date ÷ elapsed days × days in month), today's
  spend, days left, and the remaining budget expressed in tokens at the current
  blended rate.
- **Cost composition.** Blended USD per 1M tokens, the estimated token-only
  cost, per-component rows (output, cache read, input cache miss), and a chip
  per provider when more than one bills you.
- **Command Code plan.** The provider's own counter for the account: plan and
  status, credits left of the cycle allowance, a meter for the rolling five-hour
  window, the rolling week, and the billing cycle, plus each window's reset
  countdown and a local-ledger figure for this cycle.
- **CPU activity.** System utilization, the Harness Host's share of it, Host CPU
  time, peaks, and Host uptime, sampled every 2s. The chart keeps ~3 minutes of
  history; 180 samples are retained.
- **Conversations.** One row per conversation with tokens, estimated cost, share
  of total, and last activity, sorted by estimated spend. Expanding a row shows a
  mini token-activity chart plus turns, steps, tool calls, active time, cache hit
  rate, cost per turn, start time, and event count, with one chip per
  provider/model pair. Rows are labelled `root`, `fork`, or `subagent`, and
  resident conversations are marked live.

## How it works

- The Host half registers one prefix route, `/plugins/dsh-stats/overview`, on
  `ctx.webServer`. It lists durable session logs through `ctx.sessionPersistence`,
  reads each one through `ctx.sessionQuery.readSession`, and folds
  `assistant/message` usage. Summaries are cached per session revision, so
  polling stays cheap.
- Each folded call is priced through its provider profile: the profile names the
  model table, the fallback model, and the billing clock. Provider and model come
  from the response's own `message.source`, so a conversation that switches
  models mid-flight is priced per call, not per session.
- Counting is monotonic over durable logs; a conversation still counts for turns,
  messages, and active time even when it recorded no `usage` block, which the page
  reflects in the usage coverage figure.
- CPU is sampled from `os.cpus()` deltas and `process.cpuUsage()` on a 2s
  interval, so the history starts when the plugin loads.
- A second route, `/plugins/dsh-stats/session?session=<id>`, folds one
  conversation for the composer chip and returns its estimated spend, token
  split, provider mix, rate schedule, and — for a counter-based provider — the
  account counter. It also reports the current default model selection, so the
  chip resolves the right badge for a conversation with no calls yet.
- A third route, `/plugins/dsh-stats/counter`, serves just the cached account
  counter.
- The Client half polls the overview route every 6s and the session route every
  10s, keeps the last good payload, and shows a stale banner instead of dropping
  the page when a refresh fails. One route feeds every card, so the numbers on
  screen are always from the same snapshot.

## Pricing

Costs are token-only estimates in USD per 1M tokens, taken from each provider's
own list prices. `cacheHit` prices cache reads, `cacheMiss` prices fresh input
and cache writes, and `output` prices generated tokens; a model that bills cache
writes separately can set `cacheWrite`.

### Provider profiles

| Provider id | Display name | Schedule | Models |
| --- | --- | --- | --- |
| `deepseek`, `deepseek-account`, `deepseek-api-key` | DeepSeek | DeepSeek holidays | DeepSeek V4 / V4.1 family |
| `commandcode`, `command-code` | Command Code | Weekday peak (no holiday rule) | DeepSeek family + popular Claude, GPT, Gemini, Grok, Qwen, GLM, Kimi, MiniMax, MiMo models |

Unknown providers fall back to the model id they report, then to
`deepseek-flash` rates. Add or override a profile with the `providers` config
key; see below.

| Model | Cache hit | Cache miss | Output |
| --- | --- | --- | --- |
| `deepseek-flash` | 0.003 | 0.15 | 0.6 |
| `deepseek-v4-flash` | 0.003 | 0.15 | 0.6 |
| `deepseek-v4-flash-fast` | 0.07 | 0.28 | 0.56 |
| `deepseek-v4-flash-vision-exp` | 0.003 | 0.15 | 0.6 |
| `deepseek-v4.1-flash` | 0.003 | 0.15 | 0.6 |
| `deepseek-v4.1-flash-fast` | 0.016 | 0.16 | 0.58 |
| `deepseek-v4-pro` | 0.022 | 0.66 | 1.98 |

### Peak and off-peak

DeepSeek bills peak hours at **2× the off-peak (list) rate**:

- **Peak:** 01:00–04:00 and 06:00–10:00 UTC, Monday–Friday.
- **Off-peak:** every other hour, plus all weekend — weekends are off-peak for
  the whole 24 hours.

Two clocks are implemented:

- `deepseek` — DeepSeek's own API: peak on weekdays inside a window, and Chinese
  public holidays are off-peak all day.
- `deepseek-weekday` — Command Code's pass-through of the same hourly pricing:
  the same weekday windows, but Chinese public holidays bill normally, because
  Command Code does not discount them.

That is 08:00–11:00 and 13:00–17:00 in Asia/Jakarta (WIB). Every response is
priced from its own timestamp, so a ledger spanning both modes reports `peak`,
`off-peak`, `flat`, or `mixed` and splits spend accordingly. Sources:
[DeepSeek pricing](https://api-docs.deepseek.com/quick_start/pricing),
[Command Code pricing & limits](https://commandcode.ai/docs/resources/pricing-limits),
and the 2026 State Council holiday notice
([国办发明电〔2025〕7号](https://www.gov.cn/zhengce/content/202511/content_7047090.htm)).

### Command Code counter

Command Code does not expose credits through its Provider API, but its own web
client reads a small undocumented billing API. The Host half reads the same four
endpoints with the API key the provider row already stores
(`COMMANDCODE_API_KEY`), and caches the result for 60s:

| Endpoint | Supplies |
| --- | --- |
| `/alpha/whoami` | account name |
| `/alpha/billing/credits` | credit balances, five-hour and weekly windows |
| `/alpha/billing/subscriptions` | plan id, status, billing period |
| `/alpha/usage/summary` | spend, tokens, and request count for the period |

The cycle allowance is derived as `remaining + spent`, because the API reports a
remaining balance rather than a cap. The provider's per-model monthly allowances
and its `X credits` plan table are not exposed by that API, so the page shows the
account-wide balance; the **Providers** list is where per-model spend lives.

Command Code lags behind local logs by a few minutes, so the plan card also
prints the local ledger's estimate for the cycle and labels it as such.

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
notes. [`token-farm-plugin`](../token-farm-plugin) (`@local/dsh-token-bloom`)
reads this plugin's route, so install it alongside if you want the farm.

## Configuration

- `budgetUsd` sets the default monthly budget (default `5`, capped at
  `1,000,000`).
- `timeZone` (optional) overrides the IANA zone used by the rate clock; the Host
  machine's zone is the default.
- `holidays` (optional) extends the Chinese public-holiday list with extra
  `YYYY-MM-DD` days that DeepSeek's direct API bills off-peak.
- `commandCode` configures the live plan counter:
  - `enabled` (default `true`) — set `false` to keep the plugin fully offline;
  - `apiBase` (default `https://api.commandcode.ai`);
  - `apiKeyEnv` (default `COMMANDCODE_API_KEY`) — the same env-var name the
    provider row uses, resolved from the environment and then the Harness
    credential store;
  - `refreshSeconds` (default `60`, floor `15`) — cache TTL;
  - `timeoutMs` (default `8000`).
- `providers` adds or overrides a provider profile:
  ```yaml
  - id: usage-stats
    name: '@local/dsh-usage-stats'
    config:
      budgetUsd: 5
      timeZone: Asia/Jakarta
      commandCode:
        enabled: true
      providers:
        my-gateway:
          displayName: My Gateway
          schedule: flat
          fallbackModel: my-model
          models:
            my-model: { cacheHit: 0.01, cacheMiss: 0.2, output: 0.8 }
  ```
  `schedule` is `deepseek`, `deepseek-weekday`, or `flat`.
- The page also accepts `?budgetUsd=` on the route, and stores the budget you type
  in the field under `dsh.usage-stats.budgetUsd` in `localStorage`.

## Data and privacy

The ledger itself is read-only and local: it reads session logs and OS CPU
counters and serves them to the Web client on the Host's own origin.

The **optional** Command Code counter is the one exception. While `commandCode`
is enabled and a Command Code key is stored, the Host sends that key to the four
billing/usage endpoints on `api.commandcode.ai` at most once per
`refreshSeconds`. Nothing else leaves the machine: usage is never uploaded, and
no other provider is contacted. Set `commandCode.enabled: false` to keep every
request local.

## Files

- `index.js`: Host half. Provider profiles and rate cards, log folding, the
  Command Code counter, CPU sampling, and the three routes.
- `client.js`: the page, the composer chip, injected into the `main`,
  `sidebar.panellist`, and `conversation.composer.dock` slots.
- `cordis.patch.yml`, `package.json`, `locale/*.json`, `icon.svg`: bundle
  manifest, row insert (with budget and counter config), display
  title/description, icon.
