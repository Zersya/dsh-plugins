/**
 * Usage statistics — Host half.
 *
 * Reads the durable session logs through `ctx.sessionQuery`, folds token usage
 * and cost from `assistant/message` events, and samples CPU activity from the
 * Host process and the operating system. The Client page polls one JSON route
 * so the same numbers drive every card, chart, and conversation row.
 *
 * Every response is priced by the provider that served it: a provider profile
 * owns its model table and its billing schedule, so DeepSeek's direct API, a
 * DeepSeek reseller, and a flat-rate sandbox can share one ledger without one
 * provider's rules leaking into another. The CommandCode profile additionally
 * carries a live credit counter read from the provider's own billing API.
 */
import os from 'node:os';

export const name = '@local/dsh-usage-stats';
export const inject = ['webServer', 'sessionQuery', 'sessionPersistence'];

const ROUTE_PREFIX = '/plugins/dsh-stats';
const DEFAULT_BUDGET_USD = 5;
const MAX_BUDGET_USD = 1_000_000;
const MAX_CPU_SAMPLES = 180;
const CPU_SAMPLE_MS = 2000;
const COUNTER_TIMEOUT_MS = 8000;
const DEFAULT_COUNTER_REFRESH_MS = 60_000;

/**
 * Pricing tables, USD per 1M tokens.
 *
 * `cacheHit` prices cache reads, `cacheMiss` prices fresh input *and* cache
 * writes, and `output` prices generated tokens. Those three cover every model
 * we price; a model that bills cache writes separately can set `cacheWrite`.
 */
const DEEPSEEK_MODELS = {
  'deepseek-flash': { cacheHit: 0.003, cacheMiss: 0.15, output: 0.6 },
  'deepseek-v4-flash': { cacheHit: 0.003, cacheMiss: 0.15, output: 0.6 },
  'deepseek-v4-flash-fast': { cacheHit: 0.07, cacheMiss: 0.28, output: 0.56 },
  'deepseek-v4-flash-vision-exp': { cacheHit: 0.003, cacheMiss: 0.15, output: 0.6 },
  'deepseek-v4.1-flash': { cacheHit: 0.003, cacheMiss: 0.15, output: 0.6 },
  'deepseek-v4.1-flash-fast': { cacheHit: 0.016, cacheMiss: 0.16, output: 0.58 },
  'deepseek-v4-pro': { cacheHit: 0.022, cacheMiss: 0.66, output: 1.98 },
};

/**
 * Non-DeepSeek models CommandCode resells. CommandCode passes upstream prices
 * through without markup, so these are also the upstream list rates. Only the
 * families a Harness conversation is likely to pick are listed; an unlisted
 * model falls back to the provider profile's default row.
 */
const COMMANDCODE_EXTRA_MODELS = {
  'claude-fable-5': { cacheHit: 1.0, cacheMiss: 10.0, output: 50.0, cacheWrite: 12.5 },
  'claude-haiku-4-5': { cacheHit: 0.1, cacheMiss: 1.0, output: 5.0, cacheWrite: 1.25 },
  'claude-haiku-5-5': { cacheHit: 0.01, cacheMiss: 0.1, output: 0.5, cacheWrite: 0.125 },
  'claude-opus-4-7': { cacheHit: 0.5, cacheMiss: 5.0, output: 25.0, cacheWrite: 6.25 },
  'claude-opus-4-8': { cacheHit: 0.5, cacheMiss: 5.0, output: 25.0, cacheWrite: 6.25 },
  'claude-opus-5': { cacheHit: 0.5, cacheMiss: 5.0, output: 25.0, cacheWrite: 6.25 },
  'claude-opus-5-5': { cacheHit: 0.2, cacheMiss: 4.0, output: 20.0, cacheWrite: 5.0 },
  'claude-sonnet-4-6': { cacheHit: 0.3, cacheMiss: 3.0, output: 15.0, cacheWrite: 3.75 },
  'claude-sonnet-5': { cacheHit: 0.2, cacheMiss: 2.0, output: 10.0, cacheWrite: 2.5 },
  'claude-sonnet-5-5': { cacheHit: 0.1, cacheMiss: 2.0, output: 10.0, cacheWrite: 2.5 },
  'gemini-3.7-flash': { cacheHit: 0.15, cacheMiss: 1.5, output: 7.5, cacheWrite: 0.08334 },
  'gemini-3.8-flash': { cacheHit: 0.15, cacheMiss: 1.5, output: 7.5 },
  'gemini-4-argon': { cacheHit: 0.1, cacheMiss: 2.0, output: 10.0 },
  'glm-5.3': { cacheHit: 0.26, cacheMiss: 1.4, output: 4.4 },
  'glm-5.3-flash': { cacheHit: 0.03, cacheMiss: 0.15, output: 0.5 },
  'gpt-5.3-codex': { cacheHit: 0.5, cacheMiss: 2.0, output: 8.0 },
  'gpt-5.4': { cacheHit: 0.25, cacheMiss: 2.5, output: 15.0 },
  'gpt-5.4-mini': { cacheHit: 0.075, cacheMiss: 0.75, output: 4.5 },
  'gpt-5.5': { cacheHit: 0.5, cacheMiss: 5.0, output: 30.0 },
  'gpt-5.6-luna': { cacheHit: 0.02, cacheMiss: 0.2, output: 1.2, cacheWrite: 0.25 },
  'gpt-5.6-sol': { cacheHit: 0.5, cacheMiss: 5.0, output: 30.0, cacheWrite: 6.25 },
  'gpt-5.6-terra': { cacheHit: 0.2, cacheMiss: 2.0, output: 12.0, cacheWrite: 2.5 },
  'gpt-6-astra': { cacheHit: 1.0, cacheMiss: 10.0, output: 50.0, cacheWrite: 12.5 },
  'gpt-6-luna': { cacheHit: 0.01, cacheMiss: 0.1, output: 0.5, cacheWrite: 0.125 },
  'gpt-6-sol': { cacheHit: 0.2, cacheMiss: 2.0, output: 10.0, cacheWrite: 2.5 },
  'gpt-6.1-sol': { cacheHit: 0.1, cacheMiss: 2.0, output: 10.0, cacheWrite: 2.5 },
  'gpt-6.1-terra': { cacheHit: 0.05, cacheMiss: 1.0, output: 5.0, cacheWrite: 1.25 },
  'grok-4.5': { cacheHit: 0.5, cacheMiss: 2.0, output: 6.0 },
  'grok-4.6': { cacheHit: 0.5, cacheMiss: 2.0, output: 6.0 },
  'grok-4.7': { cacheHit: 0.5, cacheMiss: 2.0, output: 6.0 },
  'kimi-k2.7-code': { cacheHit: 0.19, cacheMiss: 0.95, output: 4.0 },
  'kimi-k3': { cacheHit: 0.3, cacheMiss: 3.0, output: 15.0 },
  'kimi-k3.1-pro': { cacheHit: 0.2, cacheMiss: 2.0, output: 10.0 },
  'minimax-m3': { cacheHit: 0.06, cacheMiss: 0.3, output: 1.2 },
  'minimax-m3.1-flash': { cacheHit: 0.015, cacheMiss: 0.15, output: 0.6 },
  'mimo-v2.6-flash': { cacheHit: 0.0028, cacheMiss: 0.14, output: 0.28 },
  'mimo-v2.6-pro': { cacheHit: 0.0036, cacheMiss: 0.435, output: 0.87 },
  'qwen3.7-plus': { cacheHit: 0.08, cacheMiss: 0.4, output: 1.6, cacheWrite: 0.5 },
  'qwen3.8-27b': { cacheHit: 0.04, cacheMiss: 0.4, output: 3.0 },
  'qwen3.8-max': { cacheHit: 0.25, cacheMiss: 2.0, output: 6.0, cacheWrite: 2.5 },
  'qwen3.8-max-0902': { cacheHit: 0.25, cacheMiss: 2.0, output: 6.0 },
  'qwen3.8-max-prime': { cacheHit: 0.5, cacheMiss: 4.0, output: 12.0, cacheWrite: 5.0 },
};

/** Every model id we can price, whichever provider serves it. */
const GLOBAL_MODELS = { ...DEEPSEEK_MODELS, ...COMMANDCODE_EXTRA_MODELS };

const FALLBACK_MODEL = 'deepseek-flash';
const PEAK_MULTIPLIER = 2;
/** Bump when rates, windows, or holidays change so cached costs are rebuilt. */
const PRICING_VERSION = '2026-11-05';

/**
 * Peak windows in UTC; both sit inside one UTC day, so an hour test is enough.
 * DeepSeek bills them Monday–Friday: 01:00–04:00 and 06:00–10:00.
 */
const PEAK_WINDOWS_UTC = [
  { startHour: 1, endHour: 4 },
  { startHour: 6, endHour: 10 },
];

/** DeepSeek decides the weekday and the holiday from China Standard Time. */
const SCHEDULE_TIME_ZONE = 'Asia/Shanghai';

/** Billing schedules a provider profile can declare. */
const SCHEDULE_DEEPSEEK = 'deepseek';
const SCHEDULE_DEEPSEEK_WEEKDAY = 'deepseek-weekday';
const SCHEDULE_FLAT = 'flat';

/**
 * DeepSeek's own peak windows, plus the Chinese public holidays it bills as
 * off-peak. 2026 comes from 国办发明电〔2025〕7号:
 * https://www.gov.cn/zhengce/content/202511/content_7047090.htm
 * Extend this list with the `holidays` config key when the 2027 notice lands.
 */
const CHINA_HOLIDAY_RANGES_2026 = [
  ['2026-01-01', '2026-01-03'],
  ['2026-02-15', '2026-02-23'],
  ['2026-04-04', '2026-04-06'],
  ['2026-05-01', '2026-05-05'],
  ['2026-06-19', '2026-06-21'],
  ['2026-09-25', '2026-09-27'],
  ['2026-10-01', '2026-10-07'],
];

/**
 * Provider profiles. `schedule` picks the billing clock that applies to that
 * provider's responses — CommandCode follows DeepSeek's weekday peak windows
 * but keeps every Chinese holiday at its normal price.
 */
const DEFAULT_PROVIDERS = {
  deepseek: {
    displayName: 'DeepSeek',
    schedule: SCHEDULE_DEEPSEEK,
    models: DEEPSEEK_MODELS,
    fallbackModel: 'deepseek-flash',
  },
  'deepseek-account': { alias: 'deepseek' },
  'deepseek-api-key': { alias: 'deepseek' },
  commandcode: {
    displayName: 'Command Code',
    schedule: SCHEDULE_DEEPSEEK_WEEKDAY,
    models: { ...DEEPSEEK_MODELS, ...COMMANDCODE_EXTRA_MODELS },
    fallbackModel: 'deepseek/deepseek-v4.1-flash',
    counter: { kind: 'commandcode', apiBase: 'https://api.commandcode.ai', apiKeyEnv: 'COMMANDCODE_API_KEY' },
  },
  'command-code': { alias: 'commandcode' },
};

/** CommandCode plan ids, as `/alpha/billing/subscriptions` reports them. */
const COMMANDCODE_PLAN_NAMES = {
  'individual-go': 'Go',
  'individual-goat': 'GOAT',
  'individual-pro': 'Pro',
  'individual-pro-v1': 'Pro',
  'individual-provider': 'Provider',
  'individual-max': 'Max',
  'individual-ultra': 'Ultra',
  'teams-pro': 'Teams Pro',
};

const DAY_MS = 24 * 60 * 60 * 1000;

const summaryCache = new Map();
let cpuMonitor;
/** Provider profiles in effect for this Host plugin instance (config can extend them). */
let providers = resolveProfiles({});

/* ------------------------------------------------------------------ helpers */

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function number(value) {
  return Number.isFinite(value) ? value : 0;
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function oneOf(value, allowed, fallback) {
  const candidate = cleanText(value).toLowerCase();
  return allowed.includes(candidate) ? candidate : fallback;
}

/** The Host machine's zone, unless the Config row names a valid IANA zone. */
function resolveTimeZone(value) {
  const fallback = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const candidate = cleanText(value);
  if (!candidate) return fallback;
  try {
    new Intl.DateTimeFormat('en', { timeZone: candidate });
    return candidate;
  } catch {
    return fallback;
  }
}

const scheduleDayFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: SCHEDULE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** `YYYY-MM-DD` for the China Standard Time calendar day of `time`. */
function scheduleDayKey(time) {
  const parts = scheduleDayFormat.formatToParts(new Date(time));
  const pick = (type) => parts.find((part) => part.type === type)?.value ?? '';
  return `${pick('year')}-${pick('month')}-${pick('day')}`;
}

function expandHolidayRanges(ranges) {
  const days = new Set();
  for (const [from, to] of ranges) {
    const start = Date.parse(`${from}T00:00:00Z`);
    const end = Date.parse(`${to}T00:00:00Z`);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) continue;
    for (let t = start; t <= end; t += DAY_MS) days.add(new Date(t).toISOString().slice(0, 10));
  }
  return days;
}

/** Holiday set in effect for this Host plugin instance (config can extend it). */
let holidaySet = expandHolidayRanges(CHINA_HOLIDAY_RANGES_2026);

/**
 * True when `time` bills at the peak rate under `schedule`.
 *
 * `deepseek` follows DeepSeek's own calendar: weekdays inside a UTC peak
 * window, Chinese public holidays excluded. `deepseek-weekday` — CommandCode's
 * pass-through of the same hourly rate — drops the holiday rule and only keeps
 * the weekday rule. `flat` never peaks.
 */
function isPeak(time, schedule) {
  if (schedule === SCHEDULE_FLAT) return false;
  const dayKey = scheduleDayKey(time);
  if (schedule === SCHEDULE_DEEPSEEK && holidaySet.has(dayKey)) return false;
  const weekday = new Date(`${dayKey}T00:00:00Z`).getUTCDay();
  if (weekday === 0 || weekday === 6) return false;
  const hour = new Date(time).getUTCHours();
  return PEAK_WINDOWS_UTC.some((window) => hour >= window.startHour && hour < window.endHour);
}

function emptyTokens() {
  return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, total: 0 };
}

function emptyCost() {
  return { totalUsd: 0, inputUsd: 0, cacheUsd: 0, outputUsd: 0 };
}

function emptyRateCounters() {
  return { peakEvents: 0, offPeakEvents: 0, flatEvents: 0, peakCostUsd: 0, offPeakCostUsd: 0, flatCostUsd: 0, peakTokens: 0, offPeakTokens: 0, flatTokens: 0 };
}

function addTokens(target, usage) {
  target.input += number(usage?.inputTokens);
  target.output += number(usage?.outputTokens);
  target.cacheRead += number(usage?.cacheReadTokens);
  target.cacheWrite += number(usage?.cacheWriteTokens);
  target.reasoning += number(usage?.reasoningTokens);
  target.total += number(usage?.inputTokens)
    + number(usage?.outputTokens)
    + number(usage?.cacheReadTokens)
    + number(usage?.cacheWriteTokens);
}

function addCost(target, parts) {
  target.inputUsd += parts.input;
  target.cacheUsd += parts.cache;
  target.outputUsd += parts.output;
  target.totalUsd += parts.total;
}

function addParts(from, to) {
  to.inputUsd += from.inputUsd;
  to.cacheUsd += from.cacheUsd;
  to.outputUsd += from.outputUsd;
  to.totalUsd += from.totalUsd;
}

/* ----------------------------------------------------------------- pricing */

function normalizeModels(input) {
  const table = {};
  for (const [id, row] of Object.entries(input ?? {})) {
    if (!row || typeof row !== 'object') continue;
    const cacheMiss = Number(row.cacheMiss ?? row.input);
    const output = Number(row.output);
    if (!Number.isFinite(cacheMiss) || !Number.isFinite(output)) continue;
    const cacheHit = Number(row.cacheHit ?? row.cacheRead);
    const entry = {
      cacheMiss: Math.max(0, cacheMiss),
      output: Math.max(0, output),
      cacheHit: Math.max(0, Number.isFinite(cacheHit) ? cacheHit : 0),
    };
    const cacheWrite = Number(row.cacheWrite);
    if (Number.isFinite(cacheWrite) && cacheWrite >= 0) entry.cacheWrite = cacheWrite;
    table[cleanText(id).toLowerCase()] = entry;
  }
  return table;
}

function normalizeSchedule(value, fallback) {
  const candidate = oneOf(value, [SCHEDULE_DEEPSEEK, SCHEDULE_DEEPSEEK_WEEKDAY, SCHEDULE_FLAT, 'none'], fallback);
  if (!candidate || candidate === 'none') return fallback ?? SCHEDULE_FLAT;
  return candidate;
}

/** Merge the built-in profiles with the `providers` config override. */
function resolveProfiles(overrides) {
  const merged = {};
  for (const [id, profile] of Object.entries(DEFAULT_PROVIDERS)) {
    merged[id] = profile.alias ? { ...profile } : {
      displayName: profile.displayName,
      schedule: profile.schedule,
      models: profile.models,
      fallbackModel: profile.fallbackModel,
      counter: profile.counter,
    };
  }
  for (const [rawId, override] of Object.entries(overrides ?? {})) {
    const id = cleanText(rawId).toLowerCase();
    if (!id || !override || typeof override !== 'object') continue;
    const targetId = merged[id]?.alias ?? id;
    const base = merged[targetId] ?? {};
    merged[id] = {
      displayName: cleanText(override.displayName) || base.displayName || rawId,
      schedule: normalizeSchedule(override.schedule, base.schedule ?? SCHEDULE_FLAT),
      models: { ...(base.models ?? {}), ...normalizeModels(override.models) },
      fallbackModel: cleanText(override.fallbackModel) || base.fallbackModel || FALLBACK_MODEL,
      counter: override.counter === null ? undefined : (override.counter ?? base.counter),
    };
  }
  return merged;
}

/** Follow one alias hop so `deepseek-account` and `deepseek` share a profile. */
function providerProfile(providerId) {
  const id = cleanText(providerId).toLowerCase();
  if (!id) return undefined;
  const direct = providers[id];
  if (!direct) return undefined;
  return direct.alias ? providers[direct.alias] : direct;
}

/**
 * Provider-reported model ids carry a vendor prefix (`deepseek/…`) and the
 * adapter may append its resolved response suffix (`…-1017-cm`). Neither names
 * a different model, so both are stripped before the lookup.
 */
function canonicalModelId(model) {
  let id = cleanText(model).toLowerCase();
  if (!id) return '';
  const slash = id.lastIndexOf('/');
  if (slash >= 0) id = id.slice(slash + 1);
  id = id.replace(/-\d{3,4}-cm$/, '');
  return id;
}

/**
 * Everything one priced call needs: the provider's display name, the model
 * row that applies, and the billing clock that row follows.
 */
function resolvePricing(providerId, model) {
  const profile = providerProfile(providerId);
  const canonical = canonicalModelId(model);
  const known = Boolean(profile?.models?.[canonical] ?? GLOBAL_MODELS[canonical]);
  const prices = profile?.models?.[canonical]
    ?? GLOBAL_MODELS[canonical]
    ?? profile?.models?.[canonicalModelId(profile?.fallbackModel)]
    ?? profile?.models?.[profile?.fallbackModel]
    ?? GLOBAL_MODELS[FALLBACK_MODEL];
  const schedule = profile?.schedule
    ?? (canonical.startsWith('deepseek') ? SCHEDULE_DEEPSEEK : SCHEDULE_FLAT);
  return {
    provider: cleanText(providerId) || 'unknown',
    displayName: profile?.displayName ?? (cleanText(providerId) || 'Unknown provider'),
    model: cleanText(model) || 'unknown',
    canonical: canonical || 'unknown',
    prices,
    schedule,
    known,
  };
}

function costParts(usage, pricing, time) {
  const prices = pricing.prices;
  const peak = isPeak(time, pricing.schedule);
  const multiplier = peak ? PEAK_MULTIPLIER : 1;
  const cacheWriteRate = Number.isFinite(prices.cacheWrite) ? prices.cacheWrite : prices.cacheMiss;
  const input = (number(usage?.inputTokens) * prices.cacheMiss + number(usage?.cacheWriteTokens) * cacheWriteRate) * multiplier / 1e6;
  const cache = number(usage?.cacheReadTokens) * prices.cacheHit * multiplier / 1e6;
  const output = number(usage?.outputTokens) * prices.output * multiplier / 1e6;
  return {
    input,
    cache,
    output,
    total: input + cache + output,
    peak,
    rate: pricing.schedule === SCHEDULE_FLAT ? 'flat' : peak ? 'peak' : 'off-peak',
  };
}

/* ----------------------------------------------------------------- CPU data */

function createCpuMonitor() {
  const samples = [];
  let previous;

  function readCpu() {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;
    for (const cpu of cpus) {
      const times = cpu.times;
      idle += number(times.idle);
      total += number(times.user)
        + number(times.nice)
        + number(times.sys)
        + number(times.idle)
        + number(times.irq);
    }
    const usage = process.cpuUsage();
    return { t: Date.now(), idle, total, process: usage.user + usage.system, cores: Math.max(1, cpus.length) };
  }

  function prime() {
    previous = readCpu();
  }

  function sample() {
    const current = readCpu();
    if (!previous) {
      previous = current;
      return undefined;
    }
    const elapsed = current.t - previous.t;
    const totalDelta = current.total - previous.total;
    const idleDelta = current.idle - previous.idle;
    const processDelta = current.process - previous.process;
    let systemPct = 0;
    let processPct = 0;
    if (elapsed > 0 && totalDelta > 0) {
      systemPct = clamp(100 * (1 - idleDelta / totalDelta), 0, 100);
    }
    if (elapsed > 0) {
      processPct = clamp(100 * (processDelta / 1000) / (elapsed * current.cores), 0, 100);
    }
    const entry = {
      t: current.t,
      system: round(systemPct),
      process: round(processPct),
      cpuMs: Math.round(current.process / 1000),
    };
    samples.push(entry);
    if (samples.length > MAX_CPU_SAMPLES) samples.shift();
    previous = current;
    return entry;
  }

  function snapshot() {
    if (!samples.length || Date.now() - samples[samples.length - 1].t > CPU_SAMPLE_MS - 500) sample();
    const last = samples[samples.length - 1] ?? { t: Date.now(), system: 0, process: 0, cpuMs: 0 };
    let peakSystem = 0;
    let peakProcess = 0;
    for (const sample of samples) {
      if (sample.system > peakSystem) peakSystem = sample.system;
      if (sample.process > peakProcess) peakProcess = sample.process;
    }
    return {
      cores: previous?.cores ?? Math.max(1, os.cpus().length),
      systemPct: last.system,
      processPct: last.process,
      peakSystemPct: round(peakSystem),
      peakProcessPct: round(peakProcess),
      processCpuMs: last.cpuMs,
      uptimeSec: Math.round(process.uptime()),
      sampleMs: CPU_SAMPLE_MS,
      samples: samples.slice(),
    };
  }

  return { sample, prime, snapshot };
}

/* --------------------------------------------------------------- log folding */

function providerEntry(summary, pricing) {
  const key = pricing.provider;
  let entry = summary.providers.get(key);
  if (!entry) {
    entry = {
      provider: key,
      displayName: pricing.displayName,
      calls: 0,
      tokens: emptyTokens(),
      cost: emptyCost(),
      schedules: new Set(),
      ...emptyRateCounters(),
      models: new Map(),
    };
    summary.providers.set(key, entry);
  }
  entry.schedules.add(pricing.schedule);
  return entry;
}

function summarizeLog(log, snapshot, live) {
  const header = log.session;
  const inherited = Number(log.inheritedEventCount) || 0;
  const events = inherited > 0
    ? log.events.filter((event) => Number(event.seq) >= inherited)
    : log.events;

  const summary = {
    id: header.id,
    title: undefined,
    createdAt: header.createdAt,
    lastAt: header.createdAt,
    live: Boolean(live),
    origin: header.origin,
    parentSessionId: header.parentSession,
    agentPreset: header.agentPreset,
    eventCount: snapshot?.eventCount ?? events.length,
    sizeBytes: snapshot?.sizeBytes,
    turns: 0,
    steps: 0,
    userMessages: 0,
    assistantMessages: 0,
    toolCalls: 0,
    activeMs: 0,
    usageCalls: 0,
    tokens: emptyTokens(),
    cost: emptyCost(),
    models: {},
    providers: new Map(),
    usageEvents: [],
    ...emptyRateCounters(),
  };

  let turnStart;
  for (const event of events) {
    const t = number(event.time);
    if (t > summary.lastAt) summary.lastAt = t;

    if (event.type === 'session/title') {
      const title = cleanText(event.data?.title);
      if (title) summary.title = title;
      continue;
    }

    if (event.type === 'turn/start') {
      summary.turns += 1;
      turnStart = t;
      continue;
    }

    if (event.type === 'turn/end') {
      if (turnStart !== undefined) {
        summary.activeMs += Math.max(0, t - turnStart);
        turnStart = undefined;
      }
      continue;
    }

    if (event.type === 'step/start') {
      summary.steps += 1;
      continue;
    }

    if (event.type === 'user/message') {
      summary.userMessages += 1;
      continue;
    }

    if (event.type === 'tool/call') {
      summary.toolCalls += 1;
      continue;
    }

    if (event.type === 'assistant/message') {
      summary.assistantMessages += 1;
      const usage = event.data?.usage;
      if (!usage) continue;

      const model = cleanText(event.data?.message?.source?.model) || 'unknown';
      const provider = cleanText(event.data?.message?.source?.provider) || 'unknown';
      const pricing = resolvePricing(provider, model);
      const parts = costParts(usage, pricing, t);
      const callTokens = number(usage.inputTokens) + number(usage.outputTokens)
        + number(usage.cacheReadTokens) + number(usage.cacheWriteTokens);
      summary.usageCalls += 1;
      addTokens(summary.tokens, usage);
      addCost(summary.cost, parts);
      summary.usageEvents.push({
        t,
        input: number(usage.inputTokens),
        output: number(usage.outputTokens),
        cacheRead: number(usage.cacheReadTokens),
        cacheWrite: number(usage.cacheWriteTokens),
        total: callTokens,
        cost: { inputUsd: parts.input, cacheUsd: parts.cache, outputUsd: parts.output, totalUsd: parts.total },
        model,
        provider: pricing.provider,
        schedule: pricing.schedule,
        rate: parts.rate,
        peak: parts.peak,
      });

      if (parts.rate === 'flat') {
        summary.flatEvents += 1;
        summary.flatCostUsd += parts.total;
        summary.flatTokens += callTokens;
      } else if (parts.peak) {
        summary.peakEvents += 1;
        summary.peakCostUsd += parts.total;
        summary.peakTokens += callTokens;
      } else {
        summary.offPeakEvents += 1;
        summary.offPeakCostUsd += parts.total;
        summary.offPeakTokens += callTokens;
      }

      const providerStats = providerEntry(summary, pricing);
      providerStats.calls += 1;
      addTokens(providerStats.tokens, usage);
      addCost(providerStats.cost, parts);
      if (parts.rate === 'flat') {
        providerStats.flatEvents += 1;
        providerStats.flatCostUsd += parts.total;
        providerStats.flatTokens += callTokens;
      } else if (parts.peak) {
        providerStats.peakEvents += 1;
        providerStats.peakCostUsd += parts.total;
        providerStats.peakTokens += callTokens;
      } else {
        providerStats.offPeakEvents += 1;
        providerStats.offPeakCostUsd += parts.total;
        providerStats.offPeakTokens += callTokens;
      }

      const key = `${pricing.provider}/${model}`;
      const entry = summary.models[key] ?? {
        provider: pricing.provider,
        providerName: pricing.displayName,
        model,
        schedule: pricing.schedule,
        calls: 0,
        tokens: emptyTokens(),
        cost: emptyCost(),
      };
      entry.calls += 1;
      addTokens(entry.tokens, usage);
      addCost(entry.cost, parts);
      summary.models[key] = entry;

      const modelEntry = providerStats.models.get(model) ?? {
        model,
        calls: 0,
        tokens: emptyTokens(),
        cost: emptyCost(),
      };
      modelEntry.calls += 1;
      addTokens(modelEntry.tokens, usage);
      addCost(modelEntry.cost, parts);
      providerStats.models.set(model, modelEntry);
    }
  }

  if (turnStart !== undefined && summary.lastAt > turnStart) {
    summary.activeMs += Math.max(0, summary.lastAt - turnStart);
  }

  summary.title = summary.title || firstUserText(events) || 'Untitled conversation';
  summary.models = Object.values(summary.models).sort((a, b) => b.cost.totalUsd - a.cost.totalUsd);
  summary.providers = [...summary.providers.values()]
    .map((entry) => ({
      provider: entry.provider,
      displayName: entry.displayName,
      calls: entry.calls,
      tokens: entry.tokens,
      cost: entry.cost,
      schedule: entry.schedules.size > 1 ? 'mixed' : [...entry.schedules][0] ?? SCHEDULE_FLAT,
      peakEvents: entry.peakEvents,
      offPeakEvents: entry.offPeakEvents,
      flatEvents: entry.flatEvents,
      peakCostUsd: entry.peakCostUsd,
      offPeakCostUsd: entry.offPeakCostUsd,
      flatCostUsd: entry.flatCostUsd,
      peakTokens: entry.peakTokens,
      offPeakTokens: entry.offPeakTokens,
      flatTokens: entry.flatTokens,
      models: [...entry.models.values()].sort((a, b) => b.cost.totalUsd - a.cost.totalUsd),
    }))
    .sort((a, b) => b.cost.totalUsd - a.cost.totalUsd);
  summary.activeMs = Math.max(0, Math.min(summary.activeMs, Math.max(0, summary.lastAt - summary.createdAt)));
  return summary;
}

function firstUserText(events) {
  for (const event of events) {
    if (event.type !== 'user/message') continue;
    const content = event.data?.content ?? event.data?.message?.content;
    if (!Array.isArray(content)) continue;
    const text = cleanText(content.map((block) => (block?.type === 'text' ? block.text : '')).join(' '));
    if (text) return text.length > 110 ? `${text.slice(0, 107)}…` : text;
  }
  return undefined;
}

async function loadSummary(ctx, snapshot, live, signal) {
  const id = snapshot.header.id;
  const revision = `${PRICING_VERSION}|${snapshot.revision ?? `${snapshot.eventCount ?? 0}:${snapshot.sizeBytes ?? 0}`}`;
  const cached = summaryCache.get(id);
  if (cached && cached.revision === revision) return cached.summary;

  try {
    const log = await ctx.sessionQuery.readSession(id, signal);
    const summary = summarizeLog(log, snapshot, live);
    summaryCache.set(id, { revision, summary });
    return summary;
  } catch (error) {
    if (cached) return cached.summary;
    return summarizeLog(
      { session: snapshot.header, inheritedEventCount: 0, events: [] },
      snapshot,
      live,
    );
  }
}

/* ------------------------------------------------- CommandCode credit counter */

/**
 * The key the provider row already uses: `apiKeyEnv` names a credential the
 * User configured once, so the counter never needs its own copy. Ambient
 * environment first, then the Harness credential store, exactly like a model
 * call.
 */
async function readApiKey(ctx, envName) {
  const fromEnv = cleanText(process.env?.[envName]);
  if (fromEnv) return fromEnv;
  try {
    const credentials = ctx.get('credentials');
    const resolved = await credentials?.resolve(envName);
    const value = typeof resolved === 'string' ? resolved : resolved?.value;
    const text = cleanText(value);
    if (text) return text;
  } catch {
    // A deployment without a credential store simply has no counter.
  }
  return undefined;
}

async function fetchJson(url, apiKey, signal) {
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${apiKey}`, accept: 'application/json' },
    signal,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}${text ? ` ${cleanText(text).slice(0, 120)}` : ''}`);
  }
  return response.json();
}

function windowInfo(limit) {
  if (!limit || typeof limit !== 'object') return null;
  const used = Math.max(0, number(limit.used));
  const cap = Math.max(0, number(limit.cap));
  return {
    used,
    cap,
    remaining: Math.max(0, cap - used),
    pct: cap > 0 ? clamp(100 * used / cap, 0, 100) : 0,
    exceeded: Boolean(limit.exceeded) || (cap > 0 && used >= cap),
    resetAt: number(limit.resetAt) || null,
  };
}

/** Fold the provider's four billing endpoints into one display-ready counter. */
function buildCounter(apiBase, whoami, creditsBody, subscriptionBody, summaryBody) {
  const credits = creditsBody?.credits ?? {};
  const monthlyRemaining = Math.max(0, number(credits.monthlyCredits));
  const purchasedRemaining = Math.max(0, number(credits.purchasedCredits));
  const freeRemaining = Math.max(0, number(credits.freeCredits));
  const totalRemaining = monthlyRemaining + purchasedRemaining + freeRemaining;

  const subscription = subscriptionBody?.data ?? null;
  const planId = cleanText(subscription?.planId) || null;
  const planName = planId ? COMMANDCODE_PLAN_NAMES[planId] ?? planId : 'Command Code';
  const periodStart = Date.parse(subscription?.currentPeriodStart);
  const periodEnd = Date.parse(subscription?.currentPeriodEnd);

  const spent = Math.max(0, number(summaryBody?.totalCost));
  const monthlyCap = Math.max(monthlyRemaining, 0) + spent;

  const windowLimits = creditsBody?.windowLimits ?? null;
  const fiveHour = windowInfo(windowLimits?.fiveHour);
  const weekly = windowInfo(windowLimits?.weekly);
  const monthly = {
    used: spent,
    cap: monthlyCap,
    remaining: totalRemaining,
    pct: monthlyCap > 0 ? clamp(100 * spent / monthlyCap, 0, 100) : 0,
    exceeded: totalRemaining <= 0,
    resetAt: Number.isFinite(periodEnd) ? periodEnd : null,
  };

  return {
    available: true,
    apiBase,
    fetchedAt: Date.now(),
    account: {
      name: cleanText(whoami?.user?.name) || null,
      userName: cleanText(whoami?.user?.userName) || null,
    },
    plan: {
      id: planId,
      name: planName,
      status: cleanText(subscription?.status) || null,
      periodStart: Number.isFinite(periodStart) ? periodStart : null,
      periodEnd: Number.isFinite(periodEnd) ? periodEnd : null,
      cancelAtPeriodEnd: Boolean(subscription?.cancelAtPeriodEnd),
    },
    credits: {
      monthlyRemaining,
      purchasedRemaining,
      freeRemaining,
      totalRemaining,
      monthlyCap,
      spent,
      usagePct: monthly.used,
      belowThreshold: Boolean(credits.belowThreshold),
      creditThreshold: number(credits.creditThreshold),
    },
    windows: { fiveHour, weekly, monthly },
    period: {
      since: Number.isFinite(periodStart) ? periodStart : null,
      costUsd: spent,
      tokensIn: number(summaryBody?.totalTokensIn),
      tokensOut: number(summaryBody?.totalTokensOut),
      tokens: number(summaryBody?.totalTokens),
      requests: number(summaryBody?.totalCount),
      successRate: number(summaryBody?.successRate),
    },
  };
}

async function fetchCommandCodeCounter(ctx, options) {
  const apiKey = await readApiKey(ctx, options.apiKeyEnv);
  if (!apiKey) {
    return { available: false, reason: 'no-credentials', apiBase: options.apiBase, apiKeyEnv: options.apiKeyEnv };
  }
  const signal = AbortSignal.timeout(options.timeoutMs);
  const call = (path) => fetchJson(`${options.apiBase}${path}`, apiKey, signal);
  const [whoami, credits, subscription, summary] = await Promise.all([
    call('/alpha/whoami').catch(() => null),
    call('/alpha/billing/credits'),
    call('/alpha/billing/subscriptions').catch(() => null),
    call('/alpha/usage/summary').catch(() => null),
  ]);
  return buildCounter(options.apiBase, whoami, credits, subscription, summary);
}

/**
 * One cached counter per Host instance. Every route reads this cache, so a
 * page poll and a composer poll in the same second cost one provider request,
 * and a provider outage serves the last good value instead of an error.
 */
function createCounterStore() {
  let state = { status: 'idle', at: 0, value: null, error: null };
  let inflight = null;

  async function refresh(ctx, options) {
    if (!options.enabled) {
      state = { status: 'disabled', at: Date.now(), value: null, error: null };
      return state;
    }
    const now = Date.now();
    if (state.status !== 'idle' && now - state.at < options.refreshMs) return state;
    if (inflight) return inflight;
    inflight = (async () => {
      try {
        const value = await fetchCommandCodeCounter(ctx, options);
        state = { status: 'ok', at: Date.now(), value, error: null };
      } catch (error) {
        state = {
          status: 'error',
          at: Date.now(),
          value: state.value,
          error: String(error?.message ?? error),
        };
      } finally {
        inflight = null;
      }
      return state;
    })();
    return inflight;
  }

  return {
    refresh,
    payload() {
      if (state.status === 'disabled') return { status: 'disabled' };
      if (!state.value) {
        return {
          status: state.status === 'error' ? 'error' : 'pending',
          error: state.error,
        };
      }
      return {
        status: state.status === 'error' ? 'stale' : 'ok',
        error: state.error,
        ...state.value,
      };
    },
  };
}

/* --------------------------------------------------------------- aggregation */

function chooseBucketSize(span) {
  if (span <= 3 * 60 * 60 * 1000) return 10 * 60 * 1000;
  if (span <= 36 * 60 * 60 * 1000) return 60 * 60 * 1000;
  if (span <= 21 * 24 * 60 * 60 * 1000) return 24 * 60 * 60 * 1000;
  return 7 * 24 * 60 * 60 * 1000;
}

function buildTimeline(summaries) {
  let min = Infinity;
  let max = -Infinity;
  let fallbackMin = Infinity;
  let fallbackMax = -Infinity;
  for (const summary of summaries) {
    if (summary.createdAt < fallbackMin) fallbackMin = summary.createdAt;
    if (summary.lastAt > fallbackMax) fallbackMax = summary.lastAt;
    for (const usage of summary.usageEvents) {
      if (usage.t < min) min = usage.t;
      if (usage.t > max) max = usage.t;
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    min = fallbackMin;
    max = fallbackMax;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { bucketMs: 10 * 60 * 1000, from: Date.now(), to: Date.now(), buckets: [] };
  }

  let bucketMs = chooseBucketSize(max - min);
  let start = Math.floor(min / bucketMs) * bucketMs;
  let end = Math.floor(max / bucketMs) * bucketMs;
  let count = Math.floor((end - start) / bucketMs) + 1;
  if (count > 160) {
    bucketMs = Math.ceil((max - min) / 140 / 3600000) * 3600000;
    bucketMs = Math.max(bucketMs, 60 * 60 * 1000);
    start = Math.floor(min / bucketMs) * bucketMs;
    end = Math.floor(max / bucketMs) * bucketMs;
    count = Math.floor((end - start) / bucketMs) + 1;
  }

  const buckets = [];
  const index = new Map();
  for (let i = 0; i < count; i += 1) {
    const t = start + i * bucketMs;
    const bucket = {
      t,
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      total: 0,
      costUsd: 0,
      cost: emptyCost(),
      calls: 0,
      sessions: 0,
      sessionIds: new Set(),
    };
    buckets.push(bucket);
    index.set(t, i);
  }

  for (const summary of summaries) {
    const values = new Array(count).fill(0);
    for (const usage of summary.usageEvents) {
      const at = Math.floor(usage.t / bucketMs) * bucketMs;
      const i = index.get(at);
      if (i === undefined) continue;
      const bucket = buckets[i];
      bucket.input += usage.input;
      bucket.output += usage.output;
      bucket.cacheRead += usage.cacheRead;
      bucket.cacheWrite += usage.cacheWrite;
      bucket.total += usage.total;
      bucket.calls += 1;
      addCost(bucket.cost, {
        input: usage.cost.inputUsd,
        cache: usage.cost.cacheUsd,
        output: usage.cost.outputUsd,
        total: usage.cost.totalUsd,
      });
      bucket.costUsd += usage.cost.totalUsd;
      bucket.sessionIds.add(summary.id);
      values[i] += usage.total;
    }
    summary.series = values;
  }

  const output = buckets.map((bucket) => ({
    t: bucket.t,
    input: bucket.input,
    output: bucket.output,
    cacheRead: bucket.cacheRead,
    cacheWrite: bucket.cacheWrite,
    total: bucket.total,
    costUsd: bucket.costUsd,
    cost: bucket.cost,
    calls: bucket.calls,
    sessions: bucket.sessionIds.size,
  }));
  return { bucketMs, from: start, to: end, buckets: output };
}

function rateModeOf(peakEvents, offPeakEvents, flatEvents) {
  const kinds = [peakEvents > 0, offPeakEvents > 0, flatEvents > 0].filter(Boolean).length;
  if (kinds === 0) return 'off-peak';
  if (kinds > 1) return 'mixed';
  if (peakEvents > 0) return 'peak';
  if (flatEvents > 0) return 'flat';
  return 'off-peak';
}

function aggregateProviderRows(summaries) {
  const rows = new Map();
  for (const summary of summaries) {
    for (const entry of summary.providers) {
      const row = rows.get(entry.provider) ?? {
        provider: entry.provider,
        displayName: entry.displayName,
        schedule: entry.schedule,
        schedules: new Set(),
        calls: 0,
        tokens: emptyTokens(),
        cost: emptyCost(),
        models: new Map(),
        ...emptyRateCounters(),
        conversations: 0,
      };
      row.schedules.add(entry.schedule);
      row.calls += entry.calls;
      row.conversations += 1;
      addTokens(row.tokens, {
        inputTokens: entry.tokens.input,
        outputTokens: entry.tokens.output,
        cacheReadTokens: entry.tokens.cacheRead,
        cacheWriteTokens: entry.tokens.cacheWrite,
        reasoningTokens: entry.tokens.reasoning,
      });
      addParts(entry.cost, row.cost);
      row.peakEvents += entry.peakEvents;
      row.offPeakEvents += entry.offPeakEvents;
      row.flatEvents += entry.flatEvents;
      row.peakCostUsd += entry.peakCostUsd;
      row.offPeakCostUsd += entry.offPeakCostUsd;
      row.flatCostUsd += entry.flatCostUsd;
      row.peakTokens += entry.peakTokens;
      row.offPeakTokens += entry.offPeakTokens;
      row.flatTokens += entry.flatTokens;
      for (const model of entry.models) {
        const current = row.models.get(model.model) ?? {
          model: model.model,
          calls: 0,
          tokens: emptyTokens(),
          cost: emptyCost(),
        };
        current.calls += model.calls;
        addTokens(current.tokens, {
          inputTokens: model.tokens.input,
          outputTokens: model.tokens.output,
          cacheReadTokens: model.tokens.cacheRead,
          cacheWriteTokens: model.tokens.cacheWrite,
          reasoningTokens: model.tokens.reasoning,
        });
        addParts(model.cost, current.cost);
        row.models.set(model.model, current);
      }
      rows.set(entry.provider, row);
    }
  }
  return [...rows.values()]
    .map((row) => ({
      ...row,
      schedule: row.schedules.size > 1 ? 'mixed' : [...row.schedules][0] ?? SCHEDULE_FLAT,
      schedules: undefined,
      models: [...row.models.values()].sort((a, b) => b.cost.totalUsd - a.cost.totalUsd),
    }))
    .sort((a, b) => b.cost.totalUsd - a.cost.totalUsd);
}

function aggregate(summaries, budgetUsd, timeZone, counter) {
  const now = Date.now();
  const nowDate = new Date(now);
  const monthStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1).getTime();
  const todayStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
  const daysInMonth = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0).getDate();

  const totals = {
    conversations: summaries.length,
    messages: 0,
    turns: 0,
    steps: 0,
    userMessages: 0,
    assistantMessages: 0,
    toolCalls: 0,
    usageCalls: 0,
    activeMs: 0,
    spanMs: 0,
    tokens: emptyTokens(),
    cost: emptyCost(),
    cacheHitRate: 0,
    usageCoveragePct: 0,
    costPerConversationUsd: 0,
    blendedPerMillionUsd: 0,
    ...emptyRateCounters(),
    providers: 0,
    monthSpendUsd: 0,
    todaySpendUsd: 0,
  };

  const tokens = emptyTokens();
  const cost = emptyCost();
  let earliest = Infinity;
  let latest = -Infinity;
  let monthSpendUsd = 0;
  let todaySpendUsd = 0;
  let monthTokens = 0;

  for (const summary of summaries) {
    totals.turns += summary.turns;
    totals.steps += summary.steps;
    totals.userMessages += summary.userMessages;
    totals.assistantMessages += summary.assistantMessages;
    totals.toolCalls += summary.toolCalls;
    totals.usageCalls += summary.usageCalls;
    totals.activeMs += summary.activeMs;
    totals.peakEvents += summary.peakEvents;
    totals.offPeakEvents += summary.offPeakEvents;
    totals.flatEvents += summary.flatEvents;
    totals.peakCostUsd += summary.peakCostUsd;
    totals.offPeakCostUsd += summary.offPeakCostUsd;
    totals.flatCostUsd += summary.flatCostUsd;
    totals.peakTokens += summary.peakTokens;
    totals.offPeakTokens += summary.offPeakTokens;
    totals.flatTokens += summary.flatTokens;
    if (summary.createdAt < earliest) earliest = summary.createdAt;
    if (summary.lastAt > latest) latest = summary.lastAt;

    addTokens(tokens, {
      inputTokens: summary.tokens.input,
      outputTokens: summary.tokens.output,
      cacheReadTokens: summary.tokens.cacheRead,
      cacheWriteTokens: summary.tokens.cacheWrite,
      reasoningTokens: summary.tokens.reasoning,
    });
    addCost(cost, {
      input: summary.cost.inputUsd,
      cache: summary.cost.cacheUsd,
      output: summary.cost.outputUsd,
      total: summary.cost.totalUsd,
    });

    for (const usage of summary.usageEvents) {
      if (usage.t >= monthStart) {
        monthSpendUsd += usage.cost.totalUsd;
        monthTokens += usage.total;
      }
      if (usage.t >= todayStart) todaySpendUsd += usage.cost.totalUsd;
    }
  }

  totals.messages = totals.userMessages + totals.assistantMessages;
  totals.tokens = tokens;
  totals.cost = cost;
  totals.spanMs = Number.isFinite(earliest) && Number.isFinite(latest) ? Math.max(0, latest - earliest) : 0;
  totals.cacheHitRate = tokens.cacheRead + tokens.input + tokens.cacheWrite > 0
    ? 100 * tokens.cacheRead / (tokens.cacheRead + tokens.input + tokens.cacheWrite)
    : 0;
  totals.usageCoveragePct = totals.assistantMessages > 0
    ? 100 * totals.usageCalls / totals.assistantMessages
    : 0;
  totals.costPerConversationUsd = summaries.length > 0 ? cost.totalUsd / summaries.length : 0;
  totals.blendedPerMillionUsd = tokens.total > 0 ? cost.totalUsd / (tokens.total / 1e6) : 0;
  totals.monthSpendUsd = monthSpendUsd;
  totals.todaySpendUsd = todaySpendUsd;
  totals.monthTokens = monthTokens;

  for (const summary of summaries) {
    summary.sharePct = tokens.total > 0 ? 100 * summary.tokens.total / tokens.total : 0;
  }
  summaries.sort((a, b) => b.cost.totalUsd - a.cost.totalUsd || b.tokens.total - a.tokens.total);

  const providerRows = aggregateProviderRows(summaries);
  totals.providers = providerRows.length;
  for (const row of providerRows) {
    row.sharePct = cost.totalUsd > 0 ? 100 * row.cost.totalUsd / cost.totalUsd : 0;
    row.tokenSharePct = tokens.total > 0 ? 100 * row.tokens.total / tokens.total : 0;
    row.rateMode = rateModeOf(row.peakEvents, row.offPeakEvents, row.flatEvents);
    row.cacheHitRate = row.tokens.cacheRead + row.tokens.input + row.tokens.cacheWrite > 0
      ? 100 * row.tokens.cacheRead / (row.tokens.cacheRead + row.tokens.input + row.tokens.cacheWrite)
      : 0;
    row.blendedPerMillionUsd = row.tokens.total > 0 ? row.cost.totalUsd / (row.tokens.total / 1e6) : 0;
  }

  const timeline = buildTimeline(summaries);
  const budget = {
    monthlyUsd: budgetUsd,
    spentUsd: monthSpendUsd,
    remainingUsd: Math.max(0, budgetUsd - monthSpendUsd),
    usedPct: budgetUsd > 0 ? 100 * monthSpendUsd / budgetUsd : 0,
    projectedUsd: monthSpendUsd > 0
      ? monthSpendUsd / Math.max(1 / 24, (now - monthStart) / 86400000) * daysInMonth
      : 0,
    todayUsd: todaySpendUsd,
    daysInMonth,
    daysLeft: Math.max(0, daysInMonth - nowDate.getDate()),
    monthLabel: new Intl.DateTimeFormat('en', { month: 'long' }).format(nowDate),
    headroomTokens: totals.blendedPerMillionUsd > 0
      ? Math.max(0, budgetUsd - monthSpendUsd) / totals.blendedPerMillionUsd * 1e6
      : 0,
  };

  const models = new Map();
  for (const summary of summaries) {
    for (const entry of summary.models) {
      const key = `${entry.provider}/${entry.model}`;
      const current = models.get(key) ?? { provider: entry.provider, model: entry.model, calls: 0 };
      current.calls += entry.calls;
      models.set(key, current);
    }
  }
  const modelList = [...models.values()].sort((a, b) => b.calls - a.calls).map((entry) => entry.model);
  const rateMode = rateModeOf(totals.peakEvents, totals.offPeakEvents, totals.flatEvents);
  const peakPremiumUsd = totals.peakCostUsd - totals.peakCostUsd / PEAK_MULTIPLIER;

  const counterPayload = counter ?? null;
  const periodFrom = Number(counterPayload?.plan?.periodStart) || monthStart;
  const period = {
    from: periodFrom,
    to: now,
    providers: providerRows.map((row) => ({ provider: row.provider, displayName: row.displayName, tokens: 0, costUsd: 0, calls: 0 })),
    tokens: 0,
    costUsd: 0,
    calls: 0,
  };
  const periodIndex = new Map(period.providers.map((row) => [row.provider, row]));
  for (const summary of summaries) {
    for (const usage of summary.usageEvents) {
      if (usage.t < periodFrom) continue;
      period.tokens += usage.total;
      period.costUsd += usage.cost.totalUsd;
      period.calls += 1;
      const row = periodIndex.get(usage.provider);
      if (!row) continue;
      row.tokens += usage.total;
      row.costUsd += usage.cost.totalUsd;
      row.calls += 1;
    }
  }

  return {
    version: 2,
    generatedAt: now,
    profile: process.env.DSH_PROFILE ?? null,
    timeZone,
    totals,
    budget,
    timeline,
    providers: providerRows,
    period,
    counter: counterPayload,
    conversations: summaries.map((summary) => ({
      id: summary.id,
      title: summary.title,
      createdAt: summary.createdAt,
      lastAt: summary.lastAt,
      live: summary.live,
      origin: summary.origin,
      parentSessionId: summary.parentSessionId,
      agentPreset: summary.agentPreset,
      eventCount: summary.eventCount,
      sizeBytes: summary.sizeBytes,
      turns: summary.turns,
      steps: summary.steps,
      userMessages: summary.userMessages,
      assistantMessages: summary.assistantMessages,
      toolCalls: summary.toolCalls,
      activeMs: summary.activeMs,
      usageCalls: summary.usageCalls,
      tokens: summary.tokens,
      cost: summary.cost,
      sharePct: summary.sharePct,
      providers: summary.providers.map((entry) => ({
        provider: entry.provider,
        displayName: entry.displayName,
        schedule: entry.schedule,
        calls: entry.calls,
        tokens: entry.tokens,
        cost: entry.cost,
      })),
      models: summary.models.map((entry) => ({
        provider: entry.provider,
        providerName: entry.providerName,
        model: entry.model,
        calls: entry.calls,
        tokens: entry.tokens,
        cost: entry.cost,
      })),
      series: summary.series ?? [],
    })),
    cpu: cpuMonitor.snapshot(),
    pricing: {
      version: PRICING_VERSION,
      models: modelList,
      fallbackModel: FALLBACK_MODEL,
      peakMultiplier: PEAK_MULTIPLIER,
      rateMode,
      peakEvents: totals.peakEvents,
      offPeakEvents: totals.offPeakEvents,
      flatEvents: totals.flatEvents,
      providers: providerRows.map((row) => ({
        provider: row.provider,
        displayName: row.displayName,
        schedule: row.schedule,
        models: row.models.map((entry) => entry.model),
      })),
      spend: {
        peakUsd: totals.peakCostUsd,
        offPeakUsd: totals.offPeakCostUsd,
        flatUsd: totals.flatCostUsd,
        peakTokens: totals.peakTokens,
        offPeakTokens: totals.offPeakTokens,
        flatTokens: totals.flatTokens,
        /** What the peak-priced calls would have cost at off-peak rates. */
        peakPremiumUsd,
        peakSharePct: totals.cost.totalUsd > 0 ? 100 * totals.peakCostUsd / totals.cost.totalUsd : 0,
      },
      schedule: scheduleInfo(timeZone, providerRows),
      note: 'Estimated from each provider\'s own list prices per 1M tokens. DeepSeek (direct) and Command Code bill 01:00–04:00 and 06:00–10:00 UTC Monday–Friday at double the off-peak rate; only DeepSeek\'s direct API treats Chinese public holidays as off-peak. Providers whose profile declares no hourly schedule are priced flat. Token usage only; excludes search, fetch, and taxes.',
    },
  };
}

/** The peak/off-peak schedule the Client needs to render the rate badge and clock. */
function scheduleInfo(timeZone, providerRows) {
  const usingPeak = (providerRows ?? []).some((row) => (
    row.schedule === SCHEDULE_DEEPSEEK || row.schedule === SCHEDULE_DEEPSEEK_WEEKDAY
  ));
  return {
    version: PRICING_VERSION,
    timeZone,
    holidayTimeZone: SCHEDULE_TIME_ZONE,
    windowsUtc: PEAK_WINDOWS_UTC.map((window) => ({ startHour: window.startHour, endHour: window.endHour })),
    weekdays: [1, 2, 3, 4, 5],
    holidays: [...holidaySet].sort(),
    usingPeak,
    holidaySchedules: [SCHEDULE_DEEPSEEK],
    source: 'https://api-docs.deepseek.com/quick_start/pricing',
  };
}

/* -------------------------------------------------------------------- route */

/**
 * One conversation's estimated spend, token split, and provider mix, for the
 * composer chip. Kept apart from `aggregate` so polling one session never scans
 * the whole ledger.
 */
function sessionPayload(summary, timeZone, counter, selection) {
  const rateMode = rateModeOf(summary.peakEvents, summary.offPeakEvents, summary.flatEvents);
  const peakPremiumUsd = summary.peakCostUsd - summary.peakCostUsd / PEAK_MULTIPLIER;
  const providers = summary.providers ?? [];
  const selectionProvider = cleanText(selection?.provider);
  const selectionPricing = selectionProvider
    ? resolvePricing(selectionProvider, selection?.model)
    : undefined;
  const counterProvider = counter?.provider;
  const usesCounterProvider = providers.some((entry) => (
    providerProfile(entry.provider)?.counter !== undefined
  )) || Boolean(selectionPricing && providerProfile(selectionPricing.provider)?.counter !== undefined);
  const usesPeakSchedule = providers.some((entry) => (
    entry.schedule === SCHEDULE_DEEPSEEK || entry.schedule === SCHEDULE_DEEPSEEK_WEEKDAY
  )) || Boolean(selectionPricing
    && (selectionPricing.schedule === SCHEDULE_DEEPSEEK || selectionPricing.schedule === SCHEDULE_DEEPSEEK_WEEKDAY));

  return {
    version: 2,
    generatedAt: Date.now(),
    id: summary.id,
    title: summary.title,
    live: Boolean(summary.live),
    usageCalls: summary.usageCalls,
    turns: summary.turns,
    steps: summary.steps,
    userMessages: summary.userMessages,
    assistantMessages: summary.assistantMessages,
    toolCalls: summary.toolCalls,
    activeMs: summary.activeMs,
    tokens: summary.tokens,
    cost: summary.cost,
    providers: providers.map((entry) => ({
      provider: entry.provider,
      displayName: entry.displayName,
      schedule: entry.schedule,
      calls: entry.calls,
      tokens: entry.tokens,
      cost: entry.cost,
    })),
    selection: selectionPricing
      ? {
        provider: selectionPricing.provider,
        displayName: selectionPricing.displayName,
        model: selectionPricing.model,
        schedule: selectionPricing.schedule,
      }
      : null,
    badge: usesCounterProvider ? 'counter' : usesPeakSchedule ? 'rate' : 'none',
    /** True when the chip may show this provider's account counter. */
    counterProvider: usesCounterProvider ? (counterProvider ?? selectionPricing?.provider ?? null) : null,
    rate: {
      mode: rateMode,
      peakEvents: summary.peakEvents,
      offPeakEvents: summary.offPeakEvents,
      flatEvents: summary.flatEvents,
      peakUsd: summary.peakCostUsd,
      offPeakUsd: summary.offPeakCostUsd,
      flatUsd: summary.flatCostUsd,
      peakTokens: summary.peakTokens,
      offPeakTokens: summary.offPeakTokens,
      flatTokens: summary.flatTokens,
      peakPremiumUsd,
    },
    schedule: scheduleInfo(timeZone, providers),
    pricing: {
      peakMultiplier: PEAK_MULTIPLIER,
      fallbackModel: FALLBACK_MODEL,
      models: (summary.models ?? []).map((entry) => entry.model).filter(Boolean),
      providers: providers.map((entry) => ({
        provider: entry.provider,
        displayName: entry.displayName,
        schedule: entry.schedule,
      })),
    },
    counter: usesCounterProvider ? (counter ?? null) : null,
  };
}

function readDefaultSelection(ctx) {
  try {
    const settings = ctx.get('agentDefaultModel');
    const selection = settings?.currentSelection?.();
    if (!selection) return null;
    return {
      provider: cleanText(selection.provider) || null,
      model: cleanText(selection.model) || null,
    };
  } catch {
    return null;
  }
}

function sendJson(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

function counterOptions(config) {
  const source = config?.commandCode ?? config?.counter ?? {};
  const envName = cleanText(source.apiKeyEnv) || 'COMMANDCODE_API_KEY';
  return {
    enabled: source.enabled !== false,
    apiBase: (cleanText(source.apiBase) || 'https://api.commandcode.ai').replace(/\/+$/, ''),
    apiKeyEnv: envName,
    refreshMs: Math.max(15_000, number(source.refreshSeconds) * 1000 || DEFAULT_COUNTER_REFRESH_MS),
    timeoutMs: clamp(number(source.timeoutMs) || COUNTER_TIMEOUT_MS, 1000, 30_000),
  };
}

export function apply(ctx, config) {
  const configuredBudget = Number(config?.budgetUsd);
  const defaultBudget = Number.isFinite(configuredBudget) && configuredBudget > 0
    ? Math.min(configuredBudget, MAX_BUDGET_USD)
    : DEFAULT_BUDGET_USD;

  const timeZone = resolveTimeZone(config?.timeZone);
  holidaySet = new Set([
    ...expandHolidayRanges(CHINA_HOLIDAY_RANGES_2026),
    ...(Array.isArray(config?.holidays) ? config.holidays : [])
      .map((day) => cleanText(day))
      .filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day)),
  ]);
  providers = resolveProfiles(config?.providers);
  const counterStore = createCounterStore();
  const counters = counterOptions(config);

  cpuMonitor = createCpuMonitor();
  cpuMonitor.prime();
  ctx.effect(() => {
    const timer = setInterval(() => cpuMonitor?.sample(), CPU_SAMPLE_MS);
    return () => {
      clearInterval(timer);
      cpuMonitor = undefined;
    };
  });

  const liveSessionIds = () => {
    try {
      const agents = ctx.get('agents');
      if (agents?.list) {
        return new Set(agents.list().map((agent) => agent.id ?? agent.session?.id).filter(Boolean));
      }
      const sessions = ctx.get('sessions');
      return new Set((sessions?.list?.() ?? []).map((session) => session.id));
    } catch {
      return new Set();
    }
  };

  /** Read (or reuse) the provider counter; never throws into a route. */
  const readCounter = async () => {
    try {
      await counterStore.refresh(ctx, counters);
    } catch {
      // `payload()` carries the failure to the Client.
    }
    return counterStore.payload();
  };

  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: ROUTE_PREFIX,
    async handler(req, res) {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? '127.0.0.1'}`);

      if (url.pathname === `${ROUTE_PREFIX}/counter`) {
        sendJson(res, 200, { version: 2, generatedAt: Date.now(), counter: await readCounter() });
        return;
      }

      if (url.pathname === `${ROUTE_PREFIX}/session`) {
        const sessionId = cleanText(url.searchParams.get('session'));
        if (!sessionId) {
          sendJson(res, 400, { error: 'bad-session', message: 'A session id is required.' });
          return;
        }
        try {
          const log = await ctx.sessionQuery.readSession(sessionId);
          const summary = summarizeLog(log, null, liveSessionIds().has(sessionId));
          const selection = readDefaultSelection(ctx);
          const counter = await readCounter();
          sendJson(res, 200, sessionPayload(summary, timeZone, counter, selection));
        } catch (error) {
          sendJson(res, 404, { error: 'session-not-found', message: String(error?.message ?? error) });
        }
        return;
      }

      if (url.pathname !== `${ROUTE_PREFIX}/overview`) {
        sendJson(res, 404, { error: 'not found' });
        return;
      }

      const requested = Number(url.searchParams.get('budgetUsd'));
      const budgetUsd = Number.isFinite(requested) && requested > 0
        ? Math.min(requested, MAX_BUDGET_USD)
        : defaultBudget;

      try {
        const snapshots = await ctx.sessionPersistence.list();
        const live = liveSessionIds();
        const readable = snapshots
          .filter((snapshot) => snapshot?.header?.id)
          .sort((a, b) => b.header.createdAt - a.header.createdAt);

        const summaries = [];
        const concurrency = 3;
        let cursor = 0;
        const worker = async () => {
          while (cursor < readable.length) {
            const index = cursor;
            cursor += 1;
            const snapshot = readable[index];
            summaries.push(await loadSummary(ctx, snapshot, live.has(snapshot.header.id)));
          }
        };
        await Promise.all(Array.from({ length: Math.min(concurrency, readable.length) }, worker));

        const currentIds = new Set(readable.map((snapshot) => snapshot.header.id));
        for (const id of summaryCache.keys()) {
          if (!currentIds.has(id)) summaryCache.delete(id);
        }

        const conversations = summaries.filter((summary) => (
          summary.userMessages + summary.assistantMessages > 0
        ));
        const counter = await readCounter();
        sendJson(res, 200, aggregate(conversations, budgetUsd, timeZone, counter));
      } catch (error) {
        sendJson(res, 500, { error: String(error?.message ?? error) });
      }
    },
  }));
}
