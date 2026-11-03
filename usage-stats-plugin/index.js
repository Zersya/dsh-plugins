/**
 * Usage statistics — Host half.
 *
 * Reads the durable session logs through `ctx.sessionQuery`, folds token usage
 * and cost from `assistant/message` events, and samples CPU activity from the
 * Host process and the operating system. The Client page polls one JSON route
 * so the same numbers drive every card, chart, and conversation row.
 */
import os from 'node:os';

export const name = '@local/dsh-usage-stats';
export const inject = ['webServer', 'sessionQuery', 'sessionPersistence'];

const ROUTE_PREFIX = '/plugins/dsh-stats';
const DEFAULT_BUDGET_USD = 5;
const MAX_BUDGET_USD = 1_000_000;
const MAX_CPU_SAMPLES = 180;
const CPU_SAMPLE_MS = 2000;

/**
 * DeepSeek list prices, USD per 1M tokens. Peak hours are 01:00-04:00 and
 * 06:00-10:00 UTC on weekdays; all other hours are off-peak at half these
 * rates. The estimate intentionally stays token-only.
 */
const PRICING = {
  'deepseek-flash': { cacheHit: 0.003, cacheMiss: 0.15, output: 0.6 },
  'deepseek-v4-pro': { cacheHit: 0.022, cacheMiss: 0.66, output: 1.98 },
};
const FALLBACK_MODEL = 'deepseek-flash';
const PEAK_MULTIPLIER = 2;

const summaryCache = new Map();
let cpuMonitor;

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

function priceFor(model) {
  return PRICING[model] ?? PRICING[FALLBACK_MODEL];
}

function isPeak(time) {
  const date = new Date(time);
  const day = date.getUTCDay();
  if (day === 0 || day === 6) return false;
  const hour = date.getUTCHours();
  return (hour >= 1 && hour < 4) || (hour >= 6 && hour < 10);
}

function costParts(usage, model, time) {
  const prices = priceFor(model);
  const multiplier = isPeak(time) ? PEAK_MULTIPLIER : 1;
  const input = (number(usage?.inputTokens) + number(usage?.cacheWriteTokens)) * prices.cacheMiss * multiplier / 1e6;
  const cache = number(usage?.cacheReadTokens) * prices.cacheHit * multiplier / 1e6;
  const output = number(usage?.outputTokens) * prices.output * multiplier / 1e6;
  return { input, cache, output, total: input + cache + output, peak: multiplier > 1 };
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

function emptyTokens() {
  return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, total: 0 };
}

function emptyCost() {
  return { totalUsd: 0, inputUsd: 0, cacheUsd: 0, outputUsd: 0 };
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
    usageEvents: [],
    peakEvents: 0,
    offPeakEvents: 0,
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
      const parts = costParts(usage, model, t);
      summary.usageCalls += 1;
      addTokens(summary.tokens, usage);
      addCost(summary.cost, parts);
      summary.usageEvents.push({
        t,
        input: number(usage.inputTokens),
        output: number(usage.outputTokens),
        cacheRead: number(usage.cacheReadTokens),
        cacheWrite: number(usage.cacheWriteTokens),
        total: number(usage.inputTokens) + number(usage.outputTokens)
          + number(usage.cacheReadTokens) + number(usage.cacheWriteTokens),
        cost: { inputUsd: parts.input, cacheUsd: parts.cache, outputUsd: parts.output, totalUsd: parts.total },
        model,
        peak: parts.peak,
      });
      if (parts.peak) summary.peakEvents += 1;
      else summary.offPeakEvents += 1;

      const key = `${provider}/${model}`;
      const entry = summary.models[key] ?? {
        provider,
        model,
        calls: 0,
        tokens: emptyTokens(),
        cost: emptyCost(),
      };
      entry.calls += 1;
      addTokens(entry.tokens, usage);
      addCost(entry.cost, parts);
      summary.models[key] = entry;
    }
  }

  if (turnStart !== undefined && summary.lastAt > turnStart) {
    summary.activeMs += Math.max(0, summary.lastAt - turnStart);
  }

  summary.title = summary.title || firstUserText(events) || 'Untitled conversation';
  summary.models = Object.values(summary.models).sort((a, b) => b.cost.totalUsd - a.cost.totalUsd);
  summary.activeMs = Math.max(0, Math.min(summary.activeMs, Math.max(0, summary.lastAt - summary.createdAt)));
  return summary;
}

async function loadSummary(ctx, snapshot, live, signal) {
  const id = snapshot.header.id;
  const revision = String(snapshot.revision ?? `${snapshot.eventCount ?? 0}:${snapshot.sizeBytes ?? 0}`);
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

function aggregate(summaries, budgetUsd) {
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
    peakEvents: 0,
    offPeakEvents: 0,
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
  const rateMode = totals.peakEvents === 0
    ? 'off-peak'
    : totals.offPeakEvents === 0
      ? 'peak'
      : 'mixed';

  return {
    version: 1,
    generatedAt: now,
    profile: process.env.DSH_PROFILE ?? null,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    totals,
    budget,
    timeline,
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
      models: summary.models.map((entry) => ({
        provider: entry.provider,
        model: entry.model,
        calls: entry.calls,
        tokens: entry.tokens,
        cost: entry.cost,
      })),
      series: summary.series ?? [],
    })),
    cpu: cpuMonitor.snapshot(),
    pricing: {
      models: modelList,
      fallbackModel: FALLBACK_MODEL,
      peakMultiplier: PEAK_MULTIPLIER,
      rateMode,
      peakEvents: totals.peakEvents,
      offPeakEvents: totals.offPeakEvents,
      note: 'DeepSeek list prices per 1M tokens. Peak hours are 01:00-04:00 and 06:00-10:00 UTC on weekdays; off-peak is half price. Token usage only; excludes search, fetch, and taxes.',
    },
  };
}

/* -------------------------------------------------------------------- route */

function sendJson(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

export function apply(ctx, config) {
  const configuredBudget = Number(config?.budgetUsd);
  const defaultBudget = Number.isFinite(configuredBudget) && configuredBudget > 0
    ? Math.min(configuredBudget, MAX_BUDGET_USD)
    : DEFAULT_BUDGET_USD;

  cpuMonitor = createCpuMonitor();
  cpuMonitor.prime();
  ctx.effect(() => {
    const timer = setInterval(() => cpuMonitor?.sample(), CPU_SAMPLE_MS);
    return () => {
      clearInterval(timer);
      cpuMonitor = undefined;
    };
  });

  ctx.effect(() => {
    const liveSessions = () => {
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

    return ctx.webServer.register({
      kind: 'prefix',
      path: ROUTE_PREFIX,
      async handler(req, res) {
        const url = new URL(req.url ?? '/', `http://${req.headers.host ?? '127.0.0.1'}`);
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
          const live = liveSessions();
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
          sendJson(res, 200, aggregate(conversations, budgetUsd));
        } catch (error) {
          sendJson(res, 500, { error: String(error?.message ?? error) });
        }
      },
    });
  });
}
