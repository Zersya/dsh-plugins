window.__ModuleLoader__.load({
  id: '@local/dsh-token-bloom',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useCallback, useEffect, useMemo, useRef, useState } = React;

    const PANEL_ID = 'token-bloom';
    const STATS_API = '/plugins/dsh-stats/overview';
    const BUDGET_KEY = 'dsh.usage-stats.budgetUsd';
    const FARM_KEY = 'dsh.token-farm.state.v2';
    const SELECTED_KEY = 'dsh.token-farm.selected.v1';
    const CAMERA_KEY = 'dsh.token-farm.camera.v3';
    const STATS_CACHE_KEY = 'dsh.token-bloom.stats.v1';
    const POLL_MS = 8000;
    const MAX_LEVEL = 50;
    const LEVEL_TOKENS = 5_000_000;

    const CROPS = [
      {
        id: 'daisy', name: 'Daisy', level: 1, kind: 'daisy',
        petal: '#FFFDF8', center: '#FFE08A', leaf: '#9FD4AB', bg: '#F4F7D7',
        height: 1.12, petals: 10, head: 0.34,
      },
      {
        id: 'tulip', name: 'Tulip', level: 2, kind: 'tulip',
        petal: '#FFC7D8', center: '#FFE6C2', leaf: '#8FCFA8', bg: '#FFE8EF',
        height: 1.26, petals: 5, head: 0.32,
      },
      {
        id: 'lavender', name: 'Lavender', level: 4, kind: 'lavender',
        petal: '#C9B6F2', center: '#EDE3FF', leaf: '#9BC7B0', bg: '#F0E8FF',
        height: 1.58, petals: 6, head: 0.26,
      },
      {
        id: 'sunflower', name: 'Sunflower', level: 6, kind: 'sunflower',
        petal: '#FFE082', center: '#A97652', leaf: '#8CCB9E', bg: '#FFF1C9',
        height: 2.0, petals: 14, head: 0.55,
      },
      {
        id: 'strawberry', name: 'Strawberry', level: 9, kind: 'strawberry',
        petal: '#FFF9F0', center: '#FFE08A', leaf: '#82C895', bg: '#FFE4E1',
        height: 0.72, petals: 5, head: 0.26,
      },
      {
        id: 'pumpkin', name: 'Pumpkin', level: 12, kind: 'pumpkin',
        petal: '#FFC58C', center: '#C98148', leaf: '#86C79A', bg: '#FFE8CF',
        height: 0.6, petals: 5, head: 0.38,
      },
      {
        id: 'moonflower', name: 'Moonflower', level: 16, kind: 'moonflower',
        petal: '#EFEAFF', center: '#FFF1B8', leaf: '#A8D8C8', bg: '#EEF0FF',
        height: 1.5, petals: 9, head: 0.42,
      },
      {
        id: 'cosmos', name: 'Cosmos', level: 24, kind: 'cosmos',
        petal: '#FFB7D5', center: '#FFE7A8', leaf: '#9FD4AB', bg: '#FFE9F2',
        height: 1.55, petals: 8, head: 0.36,
      },
      {
        id: 'bluebell', name: 'Bluebell', level: 30, kind: 'bluebell',
        petal: '#BFD8FF', center: '#F0F8FF', leaf: '#9BC7B0', bg: '#E9F2FF',
        height: 1.3, petals: 6, head: 0.28,
      },
    ];

    // Legacy names kept for the dormant block-sandbox helpers below; the Farm
    // page never calls them.
    const BLOOM_KEY = 'dsh.token-bloom.blocks.v1';
    const MAX_STACK = 6;
    const PALETTE = [];
    const SPECIALS = [];

    const CSS = `
      .blm-page {
        height:100%; overflow:auto; background:var(--dsw-alias-bg-base);
        color:var(--dsw-alias-label-primary); font-size:13px; line-height:1.45;
        -webkit-font-smoothing:antialiased; color-scheme:dark light;
      }
      .blm-page *, .blm-page *::before, .blm-page *::after { box-sizing:border-box; }
      .blm-page ::selection { background:var(--dsw-alias-brand-primary); color:var(--dsw-alias-bg-base); }
      .blm-page::-webkit-scrollbar { width:10px; height:10px; }
      .blm-page::-webkit-scrollbar-thumb {
        background:var(--dsw-alias-border-l2); border-radius:999px;
        border:3px solid var(--dsw-alias-bg-base);
      }
      .blm-page :focus-visible { outline:2px solid var(--dsw-alias-label-primary); outline-offset:2px; }
      .blm-inner { max-width:1280px; margin:0 auto; padding:24px 30px 44px; }
      .blm-head { display:flex; align-items:flex-start; justify-content:space-between; gap:22px; }
      .blm-title { margin:0; font-size:27px; line-height:1.08; font-weight:600; letter-spacing:-.03em; }
      .blm-sub { margin:7px 0 0; color:var(--dsw-alias-label-secondary); font-size:12.5px; }
      .blm-head-right { display:flex; align-items:center; gap:9px; flex:0 0 auto; padding-top:4px; }
      .blm-level-pill {
        border:1px solid var(--dsw-alias-border-l1); border-radius:999px;
        padding:5px 10px; font-size:11px; color:var(--dsw-alias-label-secondary);
        font-variant-numeric:tabular-nums; white-space:nowrap;
      }
      .blm-level-pill b { color:var(--dsw-alias-label-primary); font-weight:600; }
      .blm-live { display:inline-flex; align-items:center; gap:6px; font-size:11px; color:var(--dsw-alias-label-secondary); white-space:nowrap; }
      .blm-dot { width:6px; height:6px; border-radius:50%; background:var(--dsw-alias-state-success-primary); animation:blm-pulse 2.4s ease-in-out infinite; }
      .blm-live.is-stale .blm-dot { background:var(--dsw-alias-state-warn-primary); }
      .blm-icon-btn {
        width:28px; height:28px; display:grid; place-items:center; padding:0;
        border:1px solid var(--dsw-alias-border-l1); border-radius:7px;
        background:transparent; color:var(--dsw-alias-label-secondary); cursor:pointer;
      }
      .blm-icon-btn:hover { background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); }
      .blm-banner {
        margin-top:14px; padding:8px 10px; border:1px solid var(--dsw-alias-border-l1);
        border-radius:7px; color:var(--dsw-alias-state-warn-primary); font-size:11.5px;
      }
      .blm-main { display:grid; grid-template-columns:minmax(0,1fr) 306px; gap:22px; margin-top:16px; align-items:start; }
      .blm-left { min-width:0; display:flex; flex-direction:column; gap:11px; }
      .blm-stage {
        position:relative; height:min(62vh, 590px); min-height:430px; overflow:hidden;
        border:1px solid var(--dsw-alias-border-l1); border-radius:16px;
        background:#e7dcff; box-shadow:0 24px 54px -44px rgba(45,30,70,.62);
        outline:none;
      }
      .blm-canvas { display:block; width:100%; height:100%; cursor:grab; touch-action:none; }
      .blm-stage.is-dragging .blm-canvas { cursor:grabbing; }
      .blm-hud { position:absolute; inset:12px 12px auto 12px; display:flex; align-items:flex-start; justify-content:space-between; gap:10px; pointer-events:none; }
      .blm-hud-left, .blm-hud-right { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
      .blm-chip {
        display:inline-flex; align-items:center; gap:6px; padding:5px 9px;
        border:1px solid var(--dsw-alias-border-l1); border-radius:999px;
        background:var(--dsw-alias-bg-overlay); color:var(--dsw-alias-label-primary);
        font-size:10.5px; font-variant-numeric:tabular-nums; pointer-events:auto;
      }
      .blm-chip.is-muted { color:var(--dsw-alias-label-secondary); }
      .blm-chip b { font-weight:600; }
      .blm-hud-btn {
        appearance:none; border:1px solid var(--dsw-alias-border-l1); border-radius:999px;
        background:var(--dsw-alias-bg-overlay); color:var(--dsw-alias-label-secondary);
        font:inherit; font-size:10.5px; padding:5px 9px; cursor:pointer; pointer-events:auto;
      }
      .blm-hud-btn:hover { color:var(--dsw-alias-label-primary); background:var(--dsw-alias-bg-layer-2); }
      .blm-hint {
        position:absolute; left:12px; bottom:12px; max-width:calc(100% - 24px);
        padding:6px 10px; border:1px solid var(--dsw-alias-border-l1); border-radius:999px;
        background:var(--dsw-alias-bg-overlay); color:var(--dsw-alias-label-secondary);
        font-size:10.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        pointer-events:none;
      }
      .blm-toast {
        position:absolute; left:50%; bottom:54px; transform:translateX(-50%);
        padding:6px 11px; border:1px solid var(--dsw-alias-border-l2); border-radius:999px;
        background:var(--dsw-alias-bg-overlay); color:var(--dsw-alias-label-primary);
        font-size:11px; white-space:nowrap; animation:blm-toast-in .18s ease-out;
        box-shadow:0 8px 22px -12px rgba(30,20,50,.55); pointer-events:none;
      }
      .blm-palette {
        display:flex; align-items:center; gap:7px; flex-wrap:wrap;
        padding:8px 10px; border:1px solid var(--dsw-alias-border-l1);
        border-radius:12px; background:var(--dsw-alias-bg-layer-1);
      }
      .blm-palette-label {
        color:var(--dsw-alias-label-secondary); font-size:10px; letter-spacing:.06em;
        text-transform:uppercase; margin-right:3px;
      }
      .blm-selected-name { margin-left:auto; color:var(--dsw-alias-label-secondary); font-size:10.5px; }
      .blm-selected-name b { color:var(--dsw-alias-label-primary); font-weight:550; }
      .blm-swatch-btn {
        position:relative; width:31px; height:31px; padding:2px; border:2px solid transparent;
        border-radius:9px; background:transparent; cursor:pointer; flex:0 0 auto;
      }
      .blm-swatch-btn[aria-pressed="true"] { border-color:var(--dsw-alias-label-primary); }
      .blm-swatch-btn.is-locked { opacity:.43; }
      .blm-swatch-btn:hover .blm-seed { filter:brightness(1.04); }
      .blm-seed {
        display:grid; place-items:center; width:100%; height:100%; border-radius:6px;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.68), inset 0 -4px 0 rgba(40,20,60,.12);
      }
      .blm-seed svg { display:block; width:23px; height:23px; }
      .blm-swatch {
        display:block; width:100%; height:100%; border-radius:5px;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.62), inset 0 -4px 0 rgba(40,20,60,.14);
      }
      .blm-lock { position:absolute; right:-1px; bottom:-1px; width:13px; height:13px; display:grid; place-items:center; border-radius:50%; background:var(--dsw-alias-bg-overlay); color:var(--dsw-alias-label-secondary); }
      .blm-rail { display:flex; flex-direction:column; gap:18px; min-width:0; }
      .blm-sec { border-top:1px solid var(--dsw-alias-border-l1); padding-top:14px; }
      .blm-sec:first-child { border-top:0; padding-top:0; }
      .blm-sec h2 { margin:0; font-size:13.5px; line-height:1.25; font-weight:600; letter-spacing:-.01em; }
      .blm-sec-sub { margin:3px 0 0; color:var(--dsw-alias-label-secondary); font-size:10.5px; }
      .blm-level-row { display:flex; align-items:baseline; gap:8px; margin-top:10px; }
      .blm-level { font-size:42px; line-height:.95; font-weight:550; letter-spacing:-.04em; font-variant-numeric:tabular-nums; }
      .blm-level-unit { color:var(--dsw-alias-label-secondary); font-size:11px; }
      .blm-meter { height:8px; margin-top:11px; border-radius:999px; background:var(--dsw-alias-bg-layer-2); overflow:hidden; }
      .blm-meter-fill { height:100%; border-radius:999px; background:var(--dsw-alias-state-success-primary); transition:width .3s ease; }
      .blm-meter-fill.is-warm { background:var(--dsw-alias-state-warn-primary); }
      .blm-meter-labels { display:flex; justify-content:space-between; gap:10px; margin-top:6px; color:var(--dsw-alias-label-secondary); font-size:9.5px; font-variant-numeric:tabular-nums; }
      .blm-stats { margin-top:12px; }
      .blm-stat { display:flex; align-items:baseline; justify-content:space-between; gap:12px; padding:5px 0; border-bottom:1px solid var(--dsw-alias-border-l1); }
      .blm-stat:last-child { border-bottom:0; }
      .blm-stat span { color:var(--dsw-alias-label-secondary); font-size:10.5px; }
      .blm-stat b { font-weight:550; font-size:11.5px; font-variant-numeric:tabular-nums; text-align:right; }
      .blm-unlocks { margin-top:11px; display:flex; flex-direction:column; gap:8px; }
      .blm-unlock { display:flex; align-items:center; gap:8px; min-width:0; }
      .blm-unlock-swatch { width:18px; height:18px; border-radius:5px; flex:0 0 auto; display:grid; place-items:center; box-shadow:inset 0 1px 0 rgba(255,255,255,.55), inset 0 -3px 0 rgba(40,20,60,.12); }
      .blm-unlock-swatch svg { display:block; width:15px; height:15px; }
      .blm-unlock-text { min-width:0; flex:1; }
      .blm-unlock-name { font-size:11px; font-weight:550; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .blm-unlock-when { color:var(--dsw-alias-label-secondary); font-size:9.5px; }
      .blm-ach { margin-top:11px; display:flex; flex-direction:column; gap:9px; }
      .blm-ach-row { display:flex; align-items:center; gap:8px; min-width:0; }
      .blm-check { width:15px; height:15px; flex:0 0 auto; border:1px solid var(--dsw-alias-border-l2); border-radius:50%; display:grid; place-items:center; color:var(--dsw-alias-label-secondary); }
      .blm-ach-row.is-done .blm-check { background:var(--dsw-alias-state-success-primary); border-color:var(--dsw-alias-state-success-primary); color:var(--dsw-alias-bg-base); }
      .blm-ach-text { min-width:0; flex:1; font-size:10.5px; }
      .blm-ach-row.is-done .blm-ach-text { color:var(--dsw-alias-label-primary); }
      .blm-ach-count { color:var(--dsw-alias-label-secondary); font-size:9.5px; font-variant-numeric:tabular-nums; }
      .blm-actions { display:flex; gap:7px; flex-wrap:wrap; margin-top:12px; }
      .blm-btn {
        appearance:none; border:1px solid var(--dsw-alias-border-l1); border-radius:7px;
        background:transparent; color:var(--dsw-alias-label-secondary); font:inherit;
        font-size:10.5px; padding:5px 8px; cursor:pointer;
      }
      .blm-btn:hover { color:var(--dsw-alias-label-primary); background:var(--dsw-alias-bg-layer-2); }
      .blm-btn.is-danger { color:var(--dsw-alias-state-error-primary); }
      .blm-note { margin:10px 0 0; color:var(--dsw-alias-label-secondary); font-size:9.5px; line-height:1.5; }
      .blm-state { min-height:60vh; display:grid; place-items:center; text-align:center; padding:30px; }
      .blm-state-title { font-size:18px; font-weight:600; letter-spacing:-.02em; }
      .blm-state-body { margin-top:7px; color:var(--dsw-alias-label-secondary); font-size:12px; max-width:430px; }
      .blm-retry { margin-top:15px; border:1px solid var(--dsw-alias-border-l2); border-radius:7px; background:transparent; color:var(--dsw-alias-label-primary); font:inherit; font-size:11.5px; padding:6px 12px; cursor:pointer; }
      .blm-retry:hover { background:var(--dsw-alias-bg-layer-2); }
      @keyframes blm-pulse { 0%,100% { opacity:.45 } 50% { opacity:1 } }
      @keyframes blm-toast-in { from { opacity:0; transform:translate(-50%,5px) } to { opacity:1; transform:translate(-50%,0) } }
      @media (max-width:1000px) {
        .blm-main { grid-template-columns:minmax(0,1fr); }
        .blm-rail { display:grid; grid-template-columns:1fr 1fr; gap:18px 24px; }
        .blm-sec { border-top:1px solid var(--dsw-alias-border-l1); padding-top:13px; }
        .blm-sec:first-child { border-top:1px solid var(--dsw-alias-border-l1); padding-top:13px; }
      }
      @media (max-width:700px) {
        .blm-inner { padding:20px 16px 38px; }
        .blm-head { flex-direction:column; gap:10px; }
        .blm-head-right { padding-top:0; }
        .blm-title { font-size:24px; }
        .blm-stage { height:52vh; min-height:370px; }
        .blm-rail { grid-template-columns:1fr; }
        .blm-hint { font-size:9.5px; }
        .blm-hud { inset:9px 9px auto 9px; }
        .blm-hud-btn { font-size:9.5px; padding:4px 7px; }
        .blm-chip { font-size:9.5px; padding:4px 7px; }
        .blm-hud-left .blm-chip:nth-child(2) { display:none; }
      }
      @media (prefers-reduced-motion:reduce) {
        .blm-dot { animation:none; }
        .blm-toast { animation:none; }
        .blm-meter-fill { transition:none; }
      }
    `;

    const integer = new Intl.NumberFormat('en-US');
    const timeFmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
    const dateTimeFmt = new Intl.DateTimeFormat(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function fmtTokens(value) {
      const n = Number(value) || 0;
      if (n >= 1e9) return `${trimZero((n / 1e9).toFixed(2))}B`;
      if (n >= 1e6) return `${trimZero((n / 1e6).toFixed(n >= 1e7 ? 1 : 2))}M`;
      if (n >= 1e3) return `${trimZero((n / 1e3).toFixed(n >= 1e5 ? 0 : 1))}K`;
      return String(Math.round(n));
    }

    function trimZero(value) {
      return value.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
    }

    function fmtInt(value) {
      return integer.format(Math.round(Number(value) || 0));
    }

    function fmtUsd(value) {
      const n = Number(value) || 0;
      return `$${n.toFixed(n > 0 && n < 1 ? 3 : 2)}`;
    }

    function fmtPct(value) {
      const n = Number(value) || 0;
      return `${n.toFixed(n < 100 ? 1 : 0)}%`;
    }

    function timeAgo(value) {
      const n = Number(value) || 0;
      if (!n) return 'waiting';
      const delta = Math.max(0, Date.now() - n);
      if (delta < 5000) return 'just now';
      if (delta < 60000) return `${Math.floor(delta / 1000)}s ago`;
      if (delta < 3600000) return `${Math.floor(delta / 60000)}m ago`;
      return `${Math.floor(delta / 3600000)}h ago`;
    }

    function readJson(key, fallback) {
      try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    }

    function writeJson(key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {}
    }

    function readBudget() {
      try {
        const value = Number(window.localStorage.getItem(BUDGET_KEY));
        if (Number.isFinite(value) && value > 0) return value;
      } catch {}
      return 5;
    }

    const EMPTY_STATS = {
      tokens: 0,
      conversations: 0,
      cacheHitRate: 0,
      costUsd: 0,
      budget: { monthlyUsd: 5, usedPct: 0, projectedUsd: 0, remainingUsd: 5, spentUsd: 0 },
      generatedAt: 0,
    };

    function readCachedStats() {
      const cached = readJson(STATS_CACHE_KEY, null);
      if (!cached || typeof cached !== 'object') return EMPTY_STATS;
      return {
        ...EMPTY_STATS,
        ...cached,
        budget: { ...EMPTY_STATS.budget, ...(cached.budget || {}) },
      };
    }

    function useUsageStats() {
      const [stats, setStats] = useState(readCachedStats);
      const [meta, setMeta] = useState({ loading: true, error: null, updatedAt: 0 });
      const [tick, setTick] = useState(0);

      useEffect(() => {
        let active = true;
        let timer;
        const controller = new AbortController();

        const run = async () => {
          try {
            const response = await fetch(`${STATS_API}?budgetUsd=${encodeURIComponent(readBudget())}`, {
              cache: 'no-store',
              signal: controller.signal,
            });
            if (!response.ok) throw new Error(`Usage service returned HTTP ${response.status}`);
            const data = await response.json();
            if (!active) return;
            const next = {
              tokens: Number(data.totals?.tokens?.total) || 0,
              conversations: Number(data.totals?.conversations) || 0,
              cacheHitRate: Number(data.totals?.cacheHitRate) || 0,
              costUsd: Number(data.totals?.cost?.totalUsd) || 0,
              budget: data.budget || EMPTY_STATS.budget,
              generatedAt: Number(data.generatedAt) || Date.now(),
            };
            setStats(next);
            setMeta({ loading: false, error: null, updatedAt: next.generatedAt });
            writeJson(STATS_CACHE_KEY, next);
          } catch (error) {
            if (!active || error?.name === 'AbortError') return;
            setMeta((current) => ({
              ...current,
              loading: false,
              error: String(error?.message || error || 'Usage service unavailable'),
            }));
          } finally {
            if (active) timer = setTimeout(run, POLL_MS);
          }
        };

        run();
        return () => {
          active = false;
          controller.abort();
          clearTimeout(timer);
        };
      }, [tick]);

      return [stats, meta, useCallback(() => setTick((value) => value + 1), [])];
    }

    function loadBlocks() {
      const raw = readJson(BLOOM_KEY, []);
      if (!Array.isArray(raw)) return [];
      const seen = new Set();
      const blocks = [];
      for (const item of raw.slice(0, 240)) {
        if (!item || !Number.isInteger(item.x) || !Number.isInteger(item.z) || !Number.isInteger(item.y)) continue;
        if (item.x < 0 || item.z < 0 || item.y < 0 || item.y >= MAX_STACK) continue;
        const key = `${item.x}:${item.z}:${item.y}`;
        if (seen.has(key)) continue;
        seen.add(key);
        blocks.push({
          x: item.x,
          z: item.z,
          y: item.y,
          colorId: typeof item.colorId === 'string' ? item.colorId : 'mint',
          kind: item.kind === 'lantern' || item.kind === 'crystal' ? item.kind : 'cube',
        });
      }
      return blocks;
    }

    function defaultCamera(gridSize) {
      return { yaw: -0.62, pitch: 0.7, distance: 13.4 + gridSize * 1.1 };
    }

    function loadCamera() {
      const raw = readJson(CAMERA_KEY, null);
      if (!raw || typeof raw !== 'object') return null;
      const yaw = Number(raw.yaw);
      const pitch = Number(raw.pitch);
      const distance = Number(raw.distance);
      if (!Number.isFinite(yaw) || !Number.isFinite(pitch) || !Number.isFinite(distance)) return null;
      return { yaw, pitch: clamp(pitch, 0.28, 1.34), distance: clamp(distance, 10, 44) };
    }

    function allItemsFor(level, conversations) {
      return [
        ...PALETTE.map((item) => ({
          ...item,
          unlocked: level >= item.level,
          unlockText: `Level ${item.level}`,
        })),
        ...SPECIALS.map((item) => ({
          ...item,
          unlocked: conversations >= item.conversations,
          unlockText: `${item.conversations} conversations`,
        })),
      ];
    }

    function derive(stats, blocks) {
      const tokens = Math.max(0, Number(stats?.tokens) || 0);
      const conversations = Math.max(0, Number(stats?.conversations) || 0);
      const level = Math.min(MAX_LEVEL, Math.max(1, Math.floor(tokens / LEVEL_TOKENS) + 1));
      const earnedSpark = Math.max(8, Math.floor(tokens / 1_000_000) + conversations * 3);
      const gridSize = level >= 10 ? 11 : level >= 6 ? 9 : 7;
      const previousThreshold = (level - 1) * LEVEL_TOKENS;
      const nextThreshold = level >= MAX_LEVEL ? null : level * LEVEL_TOKENS;
      const progress = level >= MAX_LEVEL ? 1 : clamp((tokens - previousThreshold) / LEVEL_TOKENS, 0, 1);
      const allItems = allItemsFor(level, conversations);
      return {
        tokens,
        conversations,
        cacheHitRate: Number(stats?.cacheHitRate) || 0,
        costUsd: Number(stats?.costUsd) || 0,
        budget: stats?.budget || EMPTY_STATS.budget,
        level,
        earnedSpark,
        availableSpark: Math.max(0, earnedSpark - blocks.length),
        gridSize,
        nextThreshold,
        previousThreshold,
        progress,
        allItems,
        palette: allItems,
      };
    }

    /* ---------------------------------------------------------------- farm */

    const EMPTY_FARM = { plants: [], plantedEver: 0, harvested: 0, pollen: 0 };

    function cropById(id) {
      return CROPS.find((crop) => crop.id === id) || CROPS[0];
    }

    function cropsFor(level) {
      return CROPS.map((crop) => ({
        ...crop,
        unlocked: level >= crop.level,
        unlockText: `Level ${crop.level}`,
      }));
    }

    function gridSizeForLevel(level) {
      return level >= 30 ? 8 : level >= 15 ? 7 : 6;
    }

    function stageMs(level) {
      return clamp(42000 - level * 1100, 9000, 42000);
    }

    function plantStage(plant, level, now = Date.now()) {
      if (!plant) return 0;
      return clamp((now - Number(plant.plantedAt || 0)) / stageMs(level), 0, 4);
    }

    function plantId() {
      return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function starterFarm(level) {
      const now = Date.now();
      const n = gridSizeForLevel(level);
      const unlocked = cropsFor(level).filter((crop) => crop.unlocked);
      const fallback = unlocked[0]?.id || 'daisy';
      const seeds = [
        ['daisy', 1, 1, 4],
        ['tulip', 3, 1, 4],
        ['lavender', 5, 1, 3.2],
        ['sunflower', 0, 2, 4],
        ['strawberry', 2, 2, 2.2],
        ['pumpkin', 4, 2, 4],
        ['cosmos', 6, 2, 3.4],
        ['daisy', 1, 3, 2.8],
        ['tulip', 3, 3, 1.4],
        ['sunflower', 5, 3, 4],
        ['moonflower', 0, 4, 4],
        ['lavender', 2, 4, 4],
        ['strawberry', 4, 4, 1.2],
        ['pumpkin', 6, 4, 3.1],
        ['cosmos', 1, 5, 4],
        ['moonflower', 5, 5, 2.6],
      ];
      const ms = stageMs(level);
      const plants = [];
      for (const [cropId, x, z, stage] of seeds) {
        if (x >= n || z >= n) continue;
        const crop = unlocked.some((item) => item.id === cropId) ? cropId : fallback;
        plants.push({
          id: plantId(),
          cropId: crop,
          x,
          z,
          plantedAt: now - stage * ms,
        });
      }
      return { plants, plantedEver: plants.length, harvested: 0, pollen: 0 };
    }

    function loadFarm(level) {
      const raw = readJson(FARM_KEY, null);
      if (!raw || !Array.isArray(raw.plants)) return starterFarm(level);
      const plants = [];
      for (const item of raw.plants.slice(0, 120)) {
        if (!item || !Number.isInteger(item.x) || !Number.isInteger(item.z)) continue;
        if (item.x < 0 || item.z < 0 || item.x > 12 || item.z > 12) continue;
        if (!CROPS.some((crop) => crop.id === item.cropId)) continue;
        plants.push({
          id: typeof item.id === 'string' ? item.id : plantId(),
          cropId: item.cropId,
          x: item.x,
          z: item.z,
          plantedAt: Number(item.plantedAt) || Date.now(),
        });
      }
      return {
        plants,
        plantedEver: Math.max(plants.length, Number(raw.plantedEver) || plants.length),
        harvested: Math.max(0, Number(raw.harvested) || 0),
        pollen: Math.max(0, Number(raw.pollen) || 0),
      };
    }

    function deriveFarm(stats, farm, now) {
      const tokens = Math.max(0, Number(stats?.tokens) || 0);
      const conversations = Math.max(0, Number(stats?.conversations) || 0);
      const level = Math.min(MAX_LEVEL, Math.max(1, Math.floor(tokens / LEVEL_TOKENS) + 1));
      const gridSize = gridSizeForLevel(level);
      const earnedSeeds = Math.max(6, Math.floor(tokens / 2_000_000) + conversations * 2);
      const availableSeeds = Math.max(0, earnedSeeds + farm.harvested - farm.plantedEver);
      const previousThreshold = (level - 1) * LEVEL_TOKENS;
      const nextThreshold = level >= MAX_LEVEL ? null : level * LEVEL_TOKENS;
      const progress = level >= MAX_LEVEL ? 1 : clamp((tokens - previousThreshold) / LEVEL_TOKENS, 0, 1);
      const crops = cropsFor(level);
      const plants = farm.plants.map((plant) => ({
        ...plant,
        crop: cropById(plant.cropId),
        stage: plantStage(plant, level, now),
      }));
      const blooms = plants.filter((plant) => plant.stage >= 3.8).length;
      const growing = plants.filter((plant) => plant.stage < 4).length;
      const species = new Set(plants.map((plant) => plant.cropId)).size;
      const cacheHitRate = Number(stats?.cacheHitRate) || 0;
      const wildlife = {
        bees: Math.min(8, 1 + Math.floor(blooms / 2)),
        butterflies: Math.min(6, 1 + Math.floor(conversations / 2) + Math.floor(farm.pollen / 4)),
        ladybugs: Math.min(5, 1 + Math.floor(farm.harvested / 4)),
        fireflies: cacheHitRate >= 95 ? Math.min(8, 2 + Math.floor(cacheHitRate / 20)) : 0,
      };
      return {
        tokens,
        conversations,
        cacheHitRate,
        costUsd: Number(stats?.costUsd) || 0,
        budget: stats?.budget || EMPTY_STATS.budget,
        level,
        gridSize,
        earnedSeeds,
        availableSeeds,
        crops,
        plants,
        blooms,
        growing,
        species,
        stageMs: stageMs(level),
        wildlife,
        previousThreshold,
        nextThreshold,
        progress,
        harvests: farm.harvested,
        pollen: farm.pollen,
        planted: farm.plants.length,
      };
    }

    /* ------------------------------------------------------------- geometry */

    function add(a, b) { return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; }
    function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
    function mul(a, s) { return { x: a.x * s, y: a.y * s, z: a.z * s }; }
    function dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
    function cross(a, b) {
      return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
    }
    function norm(a) {
      const length = Math.hypot(a.x, a.y, a.z) || 1;
      return { x: a.x / length, y: a.y / length, z: a.z / length };
    }

    function cameraBasis(camera, width, height) {
      const cp = Math.cos(camera.pitch);
      const target = { x: 0, y: 0.9, z: 0 };
      const position = {
        x: Math.sin(camera.yaw) * camera.distance * cp,
        y: target.y + Math.sin(camera.pitch) * camera.distance,
        z: Math.cos(camera.yaw) * camera.distance * cp,
      };
      const forward = norm(sub(target, position));
      const right = norm(cross(forward, { x: 0, y: 1, z: 0 }));
      const up = cross(right, forward);
      const focal = Math.min(width, height) * 1.28;
      return { position, forward, right, up, focal, cx: width / 2, cy: height * 0.44, target };
    }

    function project(point, basis) {
      const rel = sub(point, basis.position);
      const depth = dot(rel, basis.forward);
      if (depth <= 0.2) return null;
      return {
        x: basis.cx + dot(rel, basis.right) * basis.focal / depth,
        y: basis.cy - dot(rel, basis.up) * basis.focal / depth,
        z: depth,
        scale: basis.focal / depth,
      };
    }

    function groundPoint(screenX, screenY, basis) {
      const dx = (screenX - basis.cx) / basis.focal;
      const dy = -(screenY - basis.cy) / basis.focal;
      const dir = norm(add(basis.forward, add(mul(basis.right, dx), mul(basis.up, dy))));
      if (Math.abs(dir.y) < 0.0001) return null;
      const t = (0 - basis.position.y) / dir.y;
      if (t <= 0) return null;
      return add(basis.position, mul(dir, t));
    }

    function cellFromGround(point, gridSize) {
      if (!point) return null;
      const x = Math.floor(point.x + gridSize / 2);
      const z = Math.floor(point.z + gridSize / 2);
      if (x < 0 || z < 0 || x >= gridSize || z >= gridSize) return null;
      return { x, z };
    }

    function cellCenter(x, z, gridSize) {
      const offset = (gridSize - 1) / 2;
      return { x: x - offset, z: z - offset };
    }

    /* --------------------------------------------------------------- colors */

    function rgb(hex) {
      const value = hex.replace('#', '');
      return {
        r: parseInt(value.slice(0, 2), 16),
        g: parseInt(value.slice(2, 4), 16),
        b: parseInt(value.slice(4, 6), 16),
      };
    }

    function shade(hex, amount) {
      const color = rgb(hex);
      const target = amount < 0 ? 0 : 255;
      const mix = Math.abs(amount);
      const r = Math.round(color.r + (target - color.r) * mix);
      const g = Math.round(color.g + (target - color.g) * mix);
      const b = Math.round(color.b + (target - color.b) * mix);
      return `rgb(${r},${g},${b})`;
    }

    function alpha(hex, value) {
      const color = rgb(hex);
      return `rgba(${color.r},${color.g},${color.b},${value})`;
    }

    /* --------------------------------------------------------------- canvas */

    function drawSky(ctx, width, height, time) {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#FFE9F4');
      gradient.addColorStop(0.36, '#EADDFF');
      gradient.addColorStop(0.7, '#D8ECFF');
      gradient.addColorStop(1, '#C9F2EE');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(width * 0.52, height * 0.55, 8, width * 0.52, height * 0.55, width * 0.55);
      glow.addColorStop(0, 'rgba(255,255,255,.42)');
      glow.addColorStop(0.55, 'rgba(255,255,255,.12)');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // A few tiny high clouds, static and very faint, to give the sky depth.
      ctx.fillStyle = 'rgba(255,255,255,.24)';
      for (let i = 0; i < 4; i += 1) {
        const x = width * (0.15 + i * 0.23) + Math.sin(time * 0.06 + i) * 8;
        const y = height * (0.12 + (i % 2) * 0.1);
        ctx.beginPath();
        ctx.ellipse(x, y, 46 + i * 11, 7 + i * 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawSun(ctx, width, height, time) {
      const x = width * 0.79;
      const y = height * 0.18;
      const radius = Math.min(width, height) * 0.095;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 3.2);
      glow.addColorStop(0, 'rgba(255,248,214,.95)');
      glow.addColorStop(0.24, 'rgba(255,239,188,.42)');
      glow.addColorStop(1, 'rgba(255,239,188,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, radius * 3.2, 0, Math.PI * 2);
      ctx.fill();

      const sun = ctx.createRadialGradient(x - radius * 0.25, y - radius * 0.25, radius * 0.1, x, y, radius);
      sun.addColorStop(0, '#FFFDF2');
      sun.addColorStop(1, '#FFEDB3');
      ctx.fillStyle = sun;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,.32)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, y, radius * 1.45 + Math.sin(time * 0.35) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    function drawCloud(ctx, x, y, scale, opacity) {
      const puffs = [
        [-0.9, 0.05, 0.58],
        [-0.2, -0.22, 0.82],
        [0.62, 0.02, 0.62],
        [0.2, 0.2, 0.5],
      ];
      for (const [dx, dy, r] of puffs) {
        const px = x + dx * scale;
        const py = y + dy * scale;
        const radius = r * scale;
        const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
        gradient.addColorStop(0, `rgba(255,251,247,${opacity})`);
        gradient.addColorStop(1, 'rgba(255,251,247,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawClouds(ctx, width, height, time, camera) {
      const clouds = [
        [0.12, 0.23, 0.11, 0.72],
        [0.34, 0.14, 0.085, 0.58],
        [0.62, 0.3, 0.095, 0.55],
        [0.86, 0.42, 0.12, 0.45],
        [0.22, 0.46, 0.075, 0.36],
        [0.72, 0.07, 0.06, 0.42],
      ];
      for (let i = 0; i < clouds.length; i += 1) {
        const [fx, fy, fs, fo] = clouds[i];
        const parallax = Math.sin(camera.yaw * 0.8 + i) * 8;
        const drift = Math.sin(time * 0.025 + i * 1.7) * 5;
        drawCloud(ctx, width * fx + parallax + drift, height * fy, Math.min(width, height) * fs, fo);
      }
    }

    function drawAurora(ctx, width, height, time) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let band = 0; band < 2; band += 1) {
        const points = 9;
        ctx.beginPath();
        for (let i = 0; i <= points; i += 1) {
          const x = -30 + (width + 60) * i / points;
          const y = height * (0.11 + band * 0.055) + Math.sin(i * 0.85 + time * 0.32 + band) * 16;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = band === 0 ? 'rgba(217,200,242,.08)' : 'rgba(184,230,208,.07)';
        ctx.lineWidth = 15 + Math.sin(time * 0.2 + band) * 2;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawIslandBase(ctx, basis, state) {
      const n = state.gridSize;
      const outer = n / 2 + 1.15;
      const bottom = -1.8;
      const point = { x: 0, y: -5.4, z: 0 };
      const topCorners = {
        nw: { x: -outer, y: 0, z: -outer },
        ne: { x: outer, y: 0, z: -outer },
        se: { x: outer, y: 0, z: outer },
        sw: { x: -outer, y: 0, z: outer },
      };
      const bottomCorners = {
        nw: { x: -outer, y: bottom, z: -outer },
        ne: { x: outer, y: bottom, z: -outer },
        se: { x: outer, y: bottom, z: outer },
        sw: { x: -outer, y: bottom, z: outer },
      };
      const sides = [
        ['nw', 'ne', 'north', '#c99b83'],
        ['ne', 'se', 'east', '#dcb397'],
        ['se', 'sw', 'south', '#d4a68d'],
        ['sw', 'nw', 'west', '#be8f78'],
      ];
      ctx.save();
      for (const [aKey, bKey, name, color] of sides) {
        const a = project(topCorners[aKey], basis);
        const b = project(topCorners[bKey], basis);
        const c = project(bottomCorners[bKey], basis);
        const d = project(bottomCorners[aKey], basis);
        if (!a || !b || !c || !d) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(c.x, c.y);
        ctx.lineTo(d.x, d.y);
        ctx.closePath();
        const sideGradient = ctx.createLinearGradient(a.x, a.y, d.x, d.y);
        sideGradient.addColorStop(0, shade(color, 0.06));
        sideGradient.addColorStop(1, shade(color, -0.18));
        ctx.fillStyle = sideGradient;
        ctx.fill();
        ctx.strokeStyle = 'rgba(120,80,80,.13)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Soft strata lines give the floating island a layered, hand-made feel.
        for (const level of [-0.45, -0.95, -1.45]) {
          const pa = project({ ...topCorners[aKey], y: level }, basis);
          const pb = project({ ...topCorners[bKey], y: level }, basis);
          if (!pa || !pb) continue;
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.strokeStyle = 'rgba(120,80,80,.08)';
          ctx.stroke();
        }
      }

      const pointScreen = project(point, basis);
      if (pointScreen) {
        const bottoms = ['nw', 'ne', 'se', 'sw'];
        for (let i = 0; i < 4; i += 1) {
          const a = project(bottomCorners[bottoms[i]], basis);
          const b = project(bottomCorners[bottoms[(i + 1) % 4]], basis);
          if (!a || !b) continue;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.lineTo(pointScreen.x, pointScreen.y);
          ctx.closePath();
          ctx.fillStyle = i % 2 === 0 ? '#b98570' : '#ad7864';
          ctx.fill();
          ctx.strokeStyle = 'rgba(90,55,60,.16)';
          ctx.stroke();
        }
        const frontEdge = project({ x: 0, y: bottom, z: outer }, basis);
        if (frontEdge) {
          ctx.beginPath();
          ctx.moveTo(frontEdge.x, frontEdge.y);
          ctx.quadraticCurveTo(
            (frontEdge.x + pointScreen.x) / 2 + 4,
            (frontEdge.y + pointScreen.y) / 2,
            pointScreen.x,
            pointScreen.y
          );
          ctx.strokeStyle = 'rgba(90,55,60,.16)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        const tipGlow = ctx.createRadialGradient(pointScreen.x, pointScreen.y, 0, pointScreen.x, pointScreen.y, 52);
        tipGlow.addColorStop(0, 'rgba(255,240,210,.34)');
        tipGlow.addColorStop(1, 'rgba(255,240,210,0)');
        ctx.fillStyle = tipGlow;
        ctx.beginPath();
        ctx.arc(pointScreen.x, pointScreen.y, 52, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hanging roots at the bottom edge.
      const rootSeeds = [
        [-outer * 0.7, outer * 0.9, 0.65],
        [outer * 0.25, outer * 0.95, 0.4],
        [outer * 0.8, outer * 0.55, 0.55],
      ];
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(150,100,88,.28)';
      for (let i = 0; i < rootSeeds.length; i += 1) {
        const [x, z, length] = rootSeeds[i];
        const start = project({ x, y: bottom, z }, basis);
        const end = project({ x: x + Math.sin(i * 2.4) * 0.2, y: bottom - length, z: z + Math.cos(i * 1.8) * 0.16 }, basis);
        if (!start || !end) continue;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.quadraticCurveTo(start.x + 4, start.y + 10, end.x, end.y);
        ctx.stroke();
        ctx.fillStyle = 'rgba(184,230,208,.7)';
        ctx.beginPath();
        ctx.arc(end.x, end.y, 2.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawGround(ctx, basis, state) {
      const n = state.gridSize;
      const tiles = [];
      for (let x = 0; x < n; x += 1) {
        for (let z = 0; z < n; z += 1) {
          const center = cellCenter(x, z, n);
          const projected = project({ x: center.x, y: 0, z: center.z }, basis);
          if (projected) tiles.push({ x, z, center, projected });
        }
      }
      tiles.sort((a, b) => b.projected.z - a.projected.z);

      const occupied = new Set();
      for (const block of state.blocks) occupied.add(`${block.x}:${block.z}`);

      for (const tile of tiles) {
        const { center, x, z } = tile;
        const p1 = project({ x: center.x - 0.5, y: 0, z: center.z - 0.5 }, basis);
        const p2 = project({ x: center.x + 0.5, y: 0, z: center.z - 0.5 }, basis);
        const p3 = project({ x: center.x + 0.5, y: 0, z: center.z + 0.5 }, basis);
        const p4 = project({ x: center.x - 0.5, y: 0, z: center.z + 0.5 }, basis);
        if (!p1 || !p2 || !p3 || !p4) continue;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        ctx.fillStyle = (x + z) % 2 === 0 ? '#d7eedb' : '#cfe9d4';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.22)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        if (!occupied.has(`${x}:${z}`) && ((x * 29 + z * 47 + state.level * 13) % 23) < Math.max(0, Math.min(6, Math.floor(state.level / 3)))) {
          const flowerColors = ['#ffd6e4', '#fff0b8', '#d8c6ff', '#c7e4ff'];
          const cx = (p1.x + p3.x) / 2;
          const cy = (p1.y + p3.y) / 2;
          ctx.fillStyle = flowerColors[(x + z) % flowerColors.length];
          for (let i = 0; i < 3; i += 1) {
            const angle = i * Math.PI * 2 / 3;
            ctx.beginPath();
            ctx.arc(cx + Math.cos(angle) * 3.2, cy + Math.sin(angle) * 2, 1.7, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = 'rgba(255,255,255,.72)';
          ctx.beginPath();
          ctx.arc(cx, cy, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function drawBlockShadows(ctx, basis, state) {
      const tallCells = new Map();
      for (const block of state.blocks) {
        const key = `${block.x}:${block.z}`;
        tallCells.set(key, Math.max(tallCells.get(key) || 0, block.y + 1));
      }
      for (const [key, height] of tallCells) {
        const [x, z] = key.split(':').map(Number);
        if (x < 0 || z < 0 || x >= state.gridSize || z >= state.gridSize) continue;
        const center = cellCenter(x, z, state.gridSize);
        const projected = project({ x: center.x, y: 0.02, z: center.z }, basis);
        if (!projected) continue;
        const size = projected.scale * (0.34 + height * 0.014);
        ctx.fillStyle = `rgba(80,58,92,${0.09 + height * 0.012})`;
        ctx.beginPath();
        ctx.ellipse(projected.x + 2, projected.y + 1, size, size * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function blockItem(block, state) {
      return state.allItems.find((item) => item.id === block.colorId)
        || { id: 'mint', name: 'Mint', color: '#A8E6CF', kind: 'cube' };
    }

    function drawCube(ctx, basis, block, state) {
      const n = state.gridSize;
      const center = cellCenter(block.x, block.z, n);
      const x0 = center.x - 0.5;
      const x1 = center.x + 0.5;
      const z0 = center.z - 0.5;
      const z1 = center.z + 0.5;
      const y0 = block.y;
      const y1 = block.y + 1;
      const item = blockItem(block, state);
      const base = item.color;
      const top = {
        p1: project({ x: x0, y: y1, z: z0 }, basis),
        p2: project({ x: x1, y: y1, z: z0 }, basis),
        p3: project({ x: x1, y: y1, z: z1 }, basis),
        p4: project({ x: x0, y: y1, z: z1 }, basis),
      };
      if (!top.p1 || !top.p2 || !top.p3 || !top.p4) return;

      if (block.kind === 'lantern') {
        const pc = project({ x: center.x, y: y1 + 0.15, z: center.z }, basis);
        if (pc) {
          const glow = ctx.createRadialGradient(pc.x, pc.y, 0, pc.x, pc.y, pc.scale * 0.85);
          glow.addColorStop(0, alpha(base, 0.5));
          glow.addColorStop(1, alpha(base, 0));
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(pc.x, pc.y, pc.scale * 0.85, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const faces = [];
      if (basis.position.z > z1) {
        faces.push({
          points: [
            project({ x: x0, y: y0, z: z1 }, basis),
            project({ x: x1, y: y0, z: z1 }, basis),
            project({ x: x1, y: y1, z: z1 }, basis),
            project({ x: x0, y: y1, z: z1 }, basis),
          ],
          fill: shade(base, -0.24),
        });
      }
      if (basis.position.z < z0) {
        faces.push({
          points: [
            project({ x: x1, y: y0, z: z0 }, basis),
            project({ x: x0, y: y0, z: z0 }, basis),
            project({ x: x0, y: y1, z: z0 }, basis),
            project({ x: x1, y: y1, z: z0 }, basis),
          ],
          fill: shade(base, -0.32),
        });
      }
      if (basis.position.x > x1) {
        faces.push({
          points: [
            project({ x: x1, y: y0, z: z1 }, basis),
            project({ x: x1, y: y0, z: z0 }, basis),
            project({ x: x1, y: y1, z: z0 }, basis),
            project({ x: x1, y: y1, z: z1 }, basis),
          ],
          fill: shade(base, -0.16),
        });
      }
      if (basis.position.x < x0) {
        faces.push({
          points: [
            project({ x: x0, y: y0, z: z0 }, basis),
            project({ x: x0, y: y0, z: z1 }, basis),
            project({ x: x0, y: y1, z: z1 }, basis),
            project({ x: x0, y: y1, z: z0 }, basis),
          ],
          fill: shade(base, -0.22),
        });
      }

      for (const face of faces) {
        if (face.points.some((point) => !point)) continue;
        ctx.beginPath();
        ctx.moveTo(face.points[0].x, face.points[0].y);
        for (let i = 1; i < face.points.length; i += 1) ctx.lineTo(face.points[i].x, face.points[i].y);
        ctx.closePath();
        ctx.fillStyle = face.fill;
        ctx.fill();
        ctx.strokeStyle = 'rgba(70,50,90,.22)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.moveTo(top.p1.x, top.p1.y);
      ctx.lineTo(top.p2.x, top.p2.y);
      ctx.lineTo(top.p3.x, top.p3.y);
      ctx.lineTo(top.p4.x, top.p4.y);
      ctx.closePath();
      ctx.fillStyle = base;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.55)';
      ctx.lineWidth = 1.1;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(top.p4.x, top.p4.y);
      ctx.lineTo(top.p1.x, top.p1.y);
      ctx.strokeStyle = 'rgba(255,255,255,.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (block.kind === 'crystal') {
        const pc = project({ x: center.x, y: y1 + 0.4, z: center.z }, basis);
        if (pc) {
          drawDiamond(ctx, pc.x, pc.y, pc.scale * 0.2, base);
          ctx.fillStyle = 'rgba(255,255,255,.8)';
          ctx.beginPath();
          ctx.arc(pc.x - pc.scale * 0.04, pc.y - pc.scale * 0.05, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (block.kind === 'lantern') {
        const pc = project({ x: center.x, y: y1 + 0.22, z: center.z }, basis);
        if (pc) {
          ctx.strokeStyle = alpha(base, 0.65);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pc.x, pc.y - 3);
          ctx.lineTo(pc.x, pc.y + 3);
          ctx.moveTo(pc.x - 3, pc.y);
          ctx.lineTo(pc.x + 3, pc.y);
          ctx.stroke();
        }
      }
    }

    function drawDiamond(ctx, x, y, radius, color) {
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.8);
      glow.addColorStop(0, alpha(color, 0.45));
      glow.addColorStop(1, alpha(color, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, radius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x, y - radius);
      ctx.lineTo(x + radius * 0.7, y);
      ctx.lineTo(x, y + radius);
      ctx.lineTo(x - radius * 0.7, y);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.75)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    function drawBlocks(ctx, basis, state) {
      const blocks = state.blocks
        .filter((block) => block.x >= 0 && block.z >= 0 && block.x < state.gridSize && block.z < state.gridSize)
        .map((block) => {
          const center = cellCenter(block.x, block.z, state.gridSize);
          const projected = project({ x: center.x, y: block.y + 0.5, z: center.z }, basis);
          return { block, depth: projected ? projected.z : 0 };
        })
        .sort((a, b) => b.depth - a.depth);
      for (const entry of blocks) drawCube(ctx, basis, entry.block, state);
    }

    function drawHover(ctx, basis, state, hover) {
      if (!hover || hover.x < 0 || hover.z < 0 || hover.x >= state.gridSize || hover.z >= state.gridSize) return;
      const stack = state.blocks.filter((block) => block.x === hover.x && block.z === hover.z).length;
      if (stack >= MAX_STACK) return;
      const n = state.gridSize;
      const center = cellCenter(hover.x, hover.z, n);
      const x0 = center.x - 0.5;
      const x1 = center.x + 0.5;
      const z0 = center.z - 0.5;
      const z1 = center.z + 0.5;
      const y0 = stack;
      const y1 = stack + 1;
      const color = state.sparkAvailable > 0 ? (state.selectedItem?.color || '#A8E6CF') : '#F7B7C8';
      const opacity = state.sparkAvailable > 0 ? 0.25 : 0.12;

      const p1 = project({ x: x0, y: y0, z: z1 }, basis);
      const p2 = project({ x: x1, y: y0, z: z1 }, basis);
      const p3 = project({ x: x1, y: y1, z: z0 }, basis);
      const p4 = project({ x: x0, y: y1, z: z0 }, basis);
      const top1 = project({ x: x0, y: y1, z: z0 }, basis);
      const top2 = project({ x: x1, y: y1, z: z0 }, basis);
      const top3 = project({ x: x1, y: y1, z: z1 }, basis);
      const top4 = project({ x: x0, y: y1, z: z1 }, basis);
      if (!p1 || !p2 || !p3 || !p4 || !top1 || !top2 || !top3 || !top4) return;

      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = alpha(color, 0.75);
      ctx.fillStyle = alpha(color, opacity);
      for (const points of [
        [p1, p2, p3, p4],
        [top1, top2, top3, top4],
        [p1, p2, top2, top1],
        [p2, p3, top3, top2],
        [p3, p4, top4, top3],
        [p4, p1, top1, top4],
      ]) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();

      const groundCenter = project({ x: center.x, y: 0.02, z: center.z }, basis);
      if (groundCenter) {
        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = alpha(color, 0.7);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(groundCenter.x, groundCenter.y, groundCenter.scale * 0.4, groundCenter.scale * 0.18, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    function drawMotes(ctx, width, height, time, state) {
      const count = 10 + state.conversations * 2;
      const centerX = width * 0.5;
      const centerY = height * 0.55;
      for (let i = 0; i < count; i += 1) {
        const angle = i * 2.399 + time * 0.05;
        const radius = Math.min(width, height) * (0.23 + (i % 5) * 0.022);
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle * 1.17) * radius * 0.38 + Math.sin(time * 0.5 + i) * 4;
        const size = 1 + (i % 3) * 0.6;
        ctx.fillStyle = i % 3 === 0 ? 'rgba(255,237,179,.8)' : 'rgba(255,255,255,.6)';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = i % 3 === 0 ? 'rgba(255,237,179,.12)' : 'rgba(255,255,255,.1)';
        ctx.beginPath();
        ctx.arc(x, y, size * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawScene(ctx, width, height, time, camera, state, hover) {
      ctx.clearRect(0, 0, width, height);
      drawSky(ctx, width, height, time);
      drawSun(ctx, width, height, time);
      const basis = cameraBasis(camera, width, height);
      drawClouds(ctx, width, height, time, camera);
      if (state.cacheHitRate >= 90) drawAurora(ctx, width, height, time);
      drawCloud(ctx, width * 0.46, height * 0.82, Math.min(width, height) * 0.18, 0.3);
      drawCloud(ctx, width * 0.58, height * 0.86, Math.min(width, height) * 0.12, 0.22);
      drawIslandBase(ctx, basis, state);
      drawGround(ctx, basis, state);
      drawBlockShadows(ctx, basis, state);
      drawBlocks(ctx, basis, state);
      drawHover(ctx, basis, state, hover);
      drawMotes(ctx, width, height, time, state);
    }

    /* ------------------------------------------------------------ farm scene */

    function drawLine3D(ctx, basis, a, b, color, width) {
      const pa = project(a, basis);
      const pb = project(b, basis);
      if (!pa || !pb) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }

    function drawFarmGround(ctx, basis, state) {
      const n = state.gridSize;
      const margin = 1.12;
      const outer = n / 2 + margin;
      const grass = [
        project({ x: -outer, y: 0.01, z: -outer }, basis),
        project({ x: outer, y: 0.01, z: -outer }, basis),
        project({ x: outer, y: 0.01, z: outer }, basis),
        project({ x: -outer, y: 0.01, z: outer }, basis),
      ];
      if (grass.every(Boolean)) {
        ctx.beginPath();
        ctx.moveTo(grass[0].x, grass[0].y);
        for (let i = 1; i < 4; i += 1) ctx.lineTo(grass[i].x, grass[i].y);
        ctx.closePath();
        ctx.fillStyle = '#BFE4C8';
        ctx.fill();
        ctx.strokeStyle = 'rgba(96,140,108,.18)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const tiles = [];
      for (let x = 0; x < n; x += 1) {
        for (let z = 0; z < n; z += 1) {
          const center = cellCenter(x, z, n);
          const projected = project({ x: center.x, y: 0.02, z: center.z }, basis);
          if (projected) tiles.push({ x, z, center, projected });
        }
      }
      tiles.sort((a, b) => b.projected.z - a.projected.z);

      for (const tile of tiles) {
        const { center, x, z } = tile;
        const half = 0.43;
        const p1 = project({ x: center.x - half, y: 0.02, z: center.z - half }, basis);
        const p2 = project({ x: center.x + half, y: 0.02, z: center.z - half }, basis);
        const p3 = project({ x: center.x + half, y: 0.02, z: center.z + half }, basis);
        const p4 = project({ x: center.x - half, y: 0.02, z: center.z + half }, basis);
        if (!p1 || !p2 || !p3 || !p4) continue;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        ctx.fillStyle = (x + z) % 2 === 0 ? '#D9B99F' : '#D2AE92';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,246,236,.18)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        for (const offset of [-0.17, 0.17]) {
          const f1 = project({ x: center.x + offset, y: 0.03, z: center.z - 0.3 }, basis);
          const f2 = project({ x: center.x + offset, y: 0.03, z: center.z + 0.3 }, basis);
          if (!f1 || !f2) continue;
          ctx.strokeStyle = 'rgba(116,76,55,.18)';
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(f1.x, f1.y);
          ctx.lineTo(f2.x, f2.y);
          ctx.stroke();
        }
      }

      // Grass tufts around the border, deterministic so the field feels settled.
      for (let i = 0; i < 26; i += 1) {
        const side = i % 4;
        const t = (i * 37 % 100) / 100;
        const edge = outer - 0.12;
        const x = side === 0 || side === 2 ? -edge + t * edge * 2 : (side === 1 ? edge : -edge);
        const z = side === 1 || side === 3 ? -edge + t * edge * 2 : (side === 0 ? -edge : edge);
        const p = project({ x, y: 0.02, z }, basis);
        if (!p) continue;
        ctx.strokeStyle = 'rgba(90,145,104,.4)';
        ctx.lineWidth = 0.8;
        for (let blade = -1; blade <= 1; blade += 1) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.quadraticCurveTo(p.x + blade * 2, p.y - 3, p.x + blade * 3.2, p.y - 5);
          ctx.stroke();
        }
      }
    }

    function drawFence(ctx, basis, state) {
      const n = state.gridSize;
      const outer = n / 2 + 0.75;
      const sides = [
        [{ x: -outer, z: -outer }, { x: outer, z: -outer }, true],
        [{ x: outer, z: -outer }, { x: outer, z: outer }, false],
        [{ x: outer, z: outer }, { x: -outer, z: outer }, true],
        [{ x: -outer, z: outer }, { x: -outer, z: -outer }, false],
      ];
      const posts = [];
      for (const [a, b] of sides) {
        const length = Math.hypot(b.x - a.x, b.z - a.z);
        const count = Math.max(1, Math.round(length / 1.15));
        for (let i = 0; i <= count; i += 1) {
          const t = i / count;
          posts.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t });
        }
      }
      const drawPost = (post) => {
        const base = project({ x: post.x, y: 0, z: post.z }, basis);
        const top = project({ x: post.x, y: 0.82, z: post.z }, basis);
        if (!base || !top) return;
        ctx.strokeStyle = '#B48467';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(base.x, base.y);
        ctx.lineTo(top.x, top.y);
        ctx.stroke();
        ctx.fillStyle = '#E4C6A8';
        ctx.beginPath();
        ctx.arc(top.x, top.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      };
      for (const post of posts) drawPost(post);

      for (const [a, b, front] of sides) {
        const count = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.z - a.z) / 1.15));
        for (let i = 0; i < count; i += 1) {
          const t1 = i / count;
          const t2 = (i + 1) / count;
          const mx = (t1 + t2) / 2;
          if (front && a.z > 0 && Math.abs(a.x + (b.x - a.x) * mx) < 1.25) continue;
          for (const y of [0.34, 0.65]) {
            drawLine3D(ctx, basis,
              { x: a.x + (b.x - a.x) * t1, y, z: a.z + (b.z - a.z) * t1 },
              { x: a.x + (b.x - a.x) * t2, y, z: a.z + (b.z - a.z) * t2 },
              'rgba(150,104,76,.78)', 1.35);
          }
        }
      }
    }

    function drawTree(ctx, basis, time, x, z, scale, canopyColor, accent) {
      const base = project({ x, y: 0, z }, basis);
      const crown = project({ x, y: 1.65 * scale, z }, basis);
      if (!base || !crown) return;
      const sway = Math.sin(time * 0.6 + x) * 1.2;
      ctx.strokeStyle = '#A9795D';
      ctx.lineWidth = Math.max(2, crown.scale * 0.08);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.quadraticCurveTo(base.x + 2, base.y - (base.y - crown.y) * 0.5, crown.x + sway, crown.y);
      ctx.stroke();

      const r = crown.scale * 0.33 * scale;
      const clusters = [
        [0, 0, 1],
        [-0.45, 0.12, 0.72],
        [0.42, 0.16, 0.7],
        [-0.1, -0.28, 0.66],
      ];
      for (const [dx, dy, rs] of clusters) {
        const cx = crown.x + sway + dx * r;
        const cy = crown.y + dy * r;
        const radius = r * rs;
        const grad = ctx.createRadialGradient(cx - radius * 0.25, cy - radius * 0.3, radius * 0.1, cx, cy, radius);
        grad.addColorStop(0, shade(canopyColor, 0.18));
        grad.addColorStop(1, shade(canopyColor, -0.12));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.18)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      for (let i = 0; i < 3; i += 1) {
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(crown.x + sway + (i - 1) * r * 0.3, crown.y - r * 0.22 + (i % 2) * 4, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawScarecrow(ctx, basis, state) {
      const n = state.gridSize;
      const x = -n / 2 - 0.15;
      const z = n / 2 + 0.1;
      const base = project({ x, y: 0, z }, basis);
      const top = project({ x, y: 1.2, z }, basis);
      const left = project({ x: x - 0.55, y: 0.82, z }, basis);
      const right = project({ x: x + 0.55, y: 0.82, z }, basis);
      if (!base || !top || !left || !right) return;
      ctx.strokeStyle = '#A9795D';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(top.x, top.y);
      ctx.moveTo(left.x, left.y);
      ctx.lineTo(right.x, right.y);
      ctx.stroke();

      ctx.fillStyle = '#F3D9A4';
      ctx.beginPath();
      ctx.arc(top.x, top.y - 2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,80,60,.35)';
      ctx.stroke();
      ctx.fillStyle = '#C9A7E8';
      ctx.beginPath();
      ctx.moveTo(top.x - 8, top.y - 6);
      ctx.lineTo(top.x + 8, top.y - 6);
      ctx.lineTo(top.x, top.y - 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(80,48,50,.72)';
      ctx.beginPath();
      ctx.arc(top.x - 2, top.y - 3, 0.8, 0, Math.PI * 2);
      ctx.arc(top.x + 2, top.y - 3, 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#E8C276';
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(top.x + i * 3, top.y + 1);
        ctx.lineTo(top.x + i * 3 + 1.4, top.y + 5);
        ctx.lineTo(top.x + i * 3 - 1.4, top.y + 5);
        ctx.closePath();
        ctx.fill();
      }
    }

    function drawLeaf(ctx, x, y, length, width, angle, color) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(length * 0.45, -width, length, 0);
      ctx.quadraticCurveTo(length * 0.45, width, 0, 0);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(60,100,70,.18)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.2)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(length * 0.08, 0);
      ctx.quadraticCurveTo(length * 0.55, -width * 0.2, length * 0.88, 0);
      ctx.stroke();
      ctx.restore();
    }

    function drawDaisyHead(ctx, cx, cy, scale, crop, bloom) {
      const r = Math.max(0.5, scale * crop.head * (0.18 + bloom * 0.82));
      if (crop.kind === 'moonflower' && bloom > 0.2) {
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.6);
        glow.addColorStop(0, alpha(crop.petal, 0.5 * bloom));
        glow.addColorStop(1, alpha(crop.petal, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      const petalCount = crop.kind === 'sunflower' ? 14 : crop.petals;
      for (let i = 0; i < petalCount; i += 1) {
        const angle = (i / petalCount) * Math.PI * 2 + 0.2;
        const px = cx + Math.cos(angle) * r * 0.52;
        const py = cy + Math.sin(angle) * r * 0.52 * 0.58;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(0, 0, r * (crop.kind === 'sunflower' ? 0.5 : 0.42), r * 0.17, 0, 0, Math.PI * 2);
        ctx.fillStyle = crop.petal;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.42)';
        ctx.lineWidth = 0.7;
        ctx.stroke();
        ctx.restore();
      }
      const centerR = r * (crop.kind === 'sunflower' ? 0.38 : 0.29);
      const centerGrad = ctx.createRadialGradient(cx - centerR * 0.2, cy - centerR * 0.2, 0, cx, cy, centerR);
      centerGrad.addColorStop(0, shade(crop.center, 0.25));
      centerGrad.addColorStop(1, crop.center);
      ctx.fillStyle = centerGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, centerR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,80,40,.16)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
      if (crop.kind === 'sunflower') {
        ctx.fillStyle = 'rgba(80,50,30,.24)';
        for (let i = 0; i < 8; i += 1) {
          const a = i * 2.399;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(a) * centerR * 0.55, cy + Math.sin(a) * centerR * 0.4, 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function drawTulipHead(ctx, cx, cy, scale, crop, bloom) {
      const r = Math.max(0.5, scale * crop.head * bloom);
      const petals = 3;
      for (let i = 0; i < petals; i += 1) {
        const offset = (i - 1) * r * 0.34;
        const h = r * (1.15 - Math.abs(i - 1) * 0.15);
        ctx.beginPath();
        ctx.moveTo(cx + offset, cy + r * 0.34);
        ctx.bezierCurveTo(cx + offset - r * 0.55, cy - h * 0.1, cx + offset - r * 0.3, cy - h, cx + offset, cy - h);
        ctx.bezierCurveTo(cx + offset + r * 0.3, cy - h, cx + offset + r * 0.55, cy - h * 0.1, cx + offset, cy + r * 0.34);
        ctx.closePath();
        ctx.fillStyle = i === 1 ? shade(crop.petal, 0.08) : crop.petal;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.36)';
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
      ctx.fillStyle = alpha(crop.center, 0.7);
      ctx.beginPath();
      ctx.ellipse(cx, cy - r * 0.12, r * 0.22, r * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawLavenderHead(ctx, cx, cy, scale, crop, bloom) {
      const r = Math.max(0.4, scale * crop.head * bloom);
      ctx.strokeStyle = shade(crop.leaf, -0.12);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy - r * 2.4);
      ctx.stroke();
      for (let i = 0; i < 8; i += 1) {
        const y = cy - r * (0.3 + i * 0.27);
        const rr = r * (0.34 - i * 0.023);
        ctx.fillStyle = i % 2 === 0 ? crop.petal : shade(crop.petal, 0.1);
        ctx.beginPath();
        ctx.ellipse(cx + Math.sin(i * 1.9) * r * 0.18, y, rr, rr * 0.58, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawBellHead(ctx, cx, cy, scale, crop, bloom) {
      const r = Math.max(0.4, scale * crop.head * bloom);
      for (let i = -1; i <= 1; i += 1) {
        const x = cx + i * r * 0.7;
        const y = cy - Math.abs(i) * r * 0.18;
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.15);
        ctx.bezierCurveTo(x - r * 0.55, y - r * 0.2, x - r * 0.4, y + r * 0.8, x, y + r * 0.78);
        ctx.bezierCurveTo(x + r * 0.4, y + r * 0.8, x + r * 0.55, y - r * 0.2, x, y - r * 0.15);
        ctx.closePath();
        ctx.fillStyle = crop.petal;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.34)';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }

    function drawFlowerHead(ctx, cx, cy, scale, crop, stage) {
      if (stage < 2.8) return;
      const bloom = clamp((stage - 3.0) / 1.0, 0, 1);
      if (bloom < 0.06) {
        const r = Math.max(1, scale * crop.head * 0.38);
        ctx.fillStyle = crop.petal;
        ctx.beginPath();
        ctx.ellipse(cx, cy - r * 0.2, r * 0.48, r * 0.82, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.3)';
        ctx.lineWidth = 0.7;
        ctx.stroke();
        ctx.strokeStyle = shade(crop.leaf, -0.1);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy + r * 0.5);
        ctx.lineTo(cx, cy - r * 0.9);
        ctx.stroke();
        return;
      }

      if (crop.kind === 'tulip') drawTulipHead(ctx, cx, cy, scale, crop, bloom);
      else if (crop.kind === 'lavender') drawLavenderHead(ctx, cx, cy, scale, crop, bloom);
      else if (crop.kind === 'bluebell') drawBellHead(ctx, cx, cy, scale, crop, bloom);
      else drawDaisyHead(ctx, cx, cy, scale, crop, bloom);
    }

    function drawFruit(ctx, basis, plant, scale) {
      const n = plant.gridSize;
      const center = cellCenter(plant.x, plant.z, n);
      if (plant.crop.kind === 'strawberry' && plant.stage > 3.25) {
        for (let i = 0; i < 3; i += 1) {
          const angle = i * Math.PI * 2 / 3 + 0.4;
          const p = project({ x: center.x + Math.cos(angle) * 0.22, y: 0.18, z: center.z + Math.sin(angle) * 0.22 }, basis);
          if (!p) continue;
          const r = Math.max(1.4, scale * 0.075);
          ctx.fillStyle = '#F27F87';
          ctx.beginPath();
          ctx.arc(p.x, p.y + r * 0.2, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,240,220,.8)';
          for (let seed = 0; seed < 3; seed += 1) {
            ctx.beginPath();
            ctx.arc(p.x + (seed - 1) * r * 0.4, p.y + (seed % 2) * r * 0.25, 0.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      if (plant.crop.kind === 'pumpkin' && plant.stage > 3.3) {
        const p = project({ x: center.x - 0.2, y: 0.18, z: center.z + 0.1 }, basis);
        if (!p) return;
        const r = Math.max(2, scale * 0.15);
        const grad = ctx.createRadialGradient(p.x - r * 0.3, p.y - r * 0.4, 0, p.x, p.y, r);
        grad.addColorStop(0, '#FFD39A');
        grad.addColorStop(1, '#E8904F');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, r, r * 0.78, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(160,90,30,.28)';
        ctx.lineWidth = 0.8;
        for (let ridge = -1; ridge <= 1; ridge += 1) {
          ctx.beginPath();
          ctx.ellipse(p.x + ridge * r * 0.32, p.y, r * 0.12, r * 0.72, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.strokeStyle = '#75A76C';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - r * 0.75);
        ctx.quadraticCurveTo(p.x + 2, p.y - r * 0.95, p.x + 4, p.y - r * 0.88);
        ctx.stroke();
      }
    }

    function drawPlant(ctx, basis, state, plant, time) {
      const n = state.gridSize;
      const crop = plant.crop;
      const stage = plant.stage;
      const center = cellCenter(plant.x, plant.z, n);
      const size = clamp(stage / 4, 0, 1);
      const sway = Math.sin(time * 1.1 + plant.x * 1.6 + plant.z * 0.8) * 0.075 * size;
      const height = 0.08 + crop.height * (0.12 + size * 0.88);
      const base = project({ x: center.x, y: 0.03, z: center.z }, basis);
      const top = project({ x: center.x + sway, y: height, z: center.z }, basis);
      const mid = project({ x: center.x + sway * 0.35, y: height * 0.56, z: center.z }, basis);
      if (!base || !top || !mid) return;

      // Soft contact shadow.
      ctx.fillStyle = 'rgba(92,66,60,.12)';
      ctx.beginPath();
      ctx.ellipse(base.x + 1, base.y + 1, Math.max(2, base.scale * 0.18), Math.max(1, base.scale * 0.07), 0, 0, Math.PI * 2);
      ctx.fill();

      if (stage < 0.34) {
        ctx.fillStyle = 'rgba(125,86,58,.5)';
        ctx.beginPath();
        ctx.ellipse(base.x, base.y - 1, Math.max(1.5, base.scale * 0.09), Math.max(1, base.scale * 0.035), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#89BE86';
        ctx.beginPath();
        ctx.arc(base.x, base.y - 3, 1.4, 0, Math.PI * 2);
        ctx.fill();
        return;
      }

      // Stem, slightly curved by the same breeze as the flower head.
      ctx.strokeStyle = shade(crop.leaf, -0.16);
      ctx.lineWidth = Math.max(1.3, base.scale * 0.028);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.quadraticCurveTo(mid.x, mid.y, top.x, top.y);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.22)';
      ctx.lineWidth = Math.max(0.6, base.scale * 0.012);
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.quadraticCurveTo(mid.x, mid.y, top.x, top.y);
      ctx.stroke();

      const leafCount = stage < 1 ? 0 : stage < 2 ? 1 : stage < 3 ? 2 : 3;
      for (let i = 0; i < leafCount; i += 1) {
        const frac = 0.27 + i * 0.18;
        const side = i % 2 === 0 ? -1 : 1;
        const anchor = project({ x: center.x + sway * frac + side * 0.06, y: height * frac, z: center.z }, basis);
        if (!anchor) continue;
        const leafLength = Math.max(3, anchor.scale * 0.18 * (0.55 + size * 0.45));
        const angle = side < 0 ? -0.42 - i * 0.12 : Math.PI + 0.42 + i * 0.12;
        drawLeaf(ctx, anchor.x, anchor.y, leafLength, leafLength * 0.42, angle, i === 2 ? shade(crop.leaf, 0.08) : crop.leaf);
      }

      if (crop.kind === 'pumpkin') {
        const leafAnchor = project({ x: center.x - 0.25, y: 0.16, z: center.z + 0.18 }, basis);
        if (leafAnchor) drawLeaf(ctx, leafAnchor.x, leafAnchor.y, leafAnchor.scale * 0.27, leafAnchor.scale * 0.14, -0.7, crop.leaf);
      }

      if (stage >= 2.7) drawFlowerHead(ctx, top.x, top.y, top.scale, crop, stage);
      drawFruit(ctx, basis, { ...plant, gridSize: n }, top.scale);

      if (crop.kind === 'moonflower' && stage >= 3.7) {
        ctx.fillStyle = 'rgba(255,255,255,.8)';
        for (let i = 0; i < 3; i += 1) {
          const a = time * 1.3 + i * 2.1;
          ctx.beginPath();
          ctx.arc(top.x + Math.cos(a) * 8, top.y + Math.sin(a) * 4 - 4, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function drawPlantShadows(ctx, basis, state) {
      // The plant model draws its own small contact shadow; this adds a soft field shadow.
      for (const plant of state.plants) {
        const center = cellCenter(plant.x, plant.z, state.gridSize);
        const p = project({ x: center.x, y: 0.035, z: center.z }, basis);
        if (!p) continue;
        const size = p.scale * (0.16 + clamp(plant.stage / 4, 0, 1) * 0.14);
        ctx.fillStyle = 'rgba(90,62,60,.08)';
        ctx.beginPath();
        ctx.ellipse(p.x + 3, p.y + 1, size, size * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawBee(ctx, x, y, size, time, phase) {
      const flap = 0.5 + Math.abs(Math.sin(time * 16 + phase)) * 0.5;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.beginPath();
      ctx.ellipse(-size * 0.25, -size * 0.65, size * 0.55, size * 0.25 * flap, -0.45, 0, Math.PI * 2);
      ctx.ellipse(size * 0.25, -size * 0.65, size * 0.55, size * 0.25 * flap, 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F4D36B';
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.75, size * 0.45, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(80,56,46,.7)';
      ctx.lineWidth = Math.max(0.6, size * 0.18);
      for (const stripe of [-0.22, 0.16]) {
        ctx.beginPath();
        ctx.moveTo(stripe * size, -size * 0.36);
        ctx.lineTo(stripe * size + size * 0.08, size * 0.36);
        ctx.stroke();
      }
      ctx.fillStyle = '#5B4638';
      ctx.beginPath();
      ctx.arc(size * 0.68, -size * 0.02, size * 0.26, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawButterfly(ctx, x, y, size, time, phase, color) {
      const flap = 0.35 + Math.abs(Math.sin(time * 5 + phase)) * 0.65;
      ctx.save();
      ctx.translate(x, y);
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.scale(side, 1);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(size * 0.9, -size * 1.1 * flap, size * 1.4, size * 0.1, 0, size * 0.45);
        ctx.bezierCurveTo(size * 0.7, size * 0.9, size * 0.2, size * 0.5, 0, 0);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.45)';
        ctx.lineWidth = 0.6;
        ctx.stroke();
        ctx.fillStyle = shade(color, -0.1);
        ctx.beginPath();
        ctx.arc(size * 0.6, -size * 0.05, size * 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = '#7B625F';
      ctx.lineWidth = Math.max(0.8, size * 0.15);
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.35);
      ctx.lineTo(0, size * 0.45);
      ctx.stroke();
      ctx.restore();
    }

    function drawLadybug(ctx, x, y, size) {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#D96666';
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.72, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4D3E3A';
      ctx.beginPath();
      ctx.arc(-size * 0.8, 0, size * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(70,45,45,.7)';
      for (const [dx, dy] of [[-0.2, -0.2], [0.35, -0.1], [0.15, 0.28]]) {
        ctx.beginPath();
        ctx.arc(dx * size, dy * size, size * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(80,55,50,.5)';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.7);
      ctx.lineTo(0, size * 0.7);
      ctx.stroke();
      ctx.restore();
    }

    function drawFarmBugs(ctx, basis, state, time) {
      const blooms = state.plants.filter((plant) => plant.stage >= 3.6);
      const anchors = blooms.length ? blooms : state.plants;
      if (!anchors.length) return;

      for (let i = 0; i < state.wildlife.bees; i += 1) {
        const plant = anchors[i % anchors.length];
        const center = cellCenter(plant.x, plant.z, state.gridSize);
        const angle = time * 0.85 + i * 2.13;
        const p = project({
          x: center.x + Math.cos(angle) * 0.34,
          y: plant.crop.height * 0.75 + 0.25 + Math.sin(angle * 1.7) * 0.12,
          z: center.z + Math.sin(angle) * 0.34,
        }, basis);
        if (p) drawBee(ctx, p.x, p.y, Math.max(3.2, p.scale * 0.22), time, i);
      }

      const butterflyColors = ['#FFC7D8', '#C9D8FF', '#FFE6A8', '#D9C8F2'];
      for (let i = 0; i < state.wildlife.butterflies; i += 1) {
        const plant = anchors[(i + 1) % anchors.length];
        const center = cellCenter(plant.x, plant.z, state.gridSize);
        const angle = time * 0.38 + i * 1.71;
        const p = project({
          x: center.x + Math.cos(angle) * 0.7,
          y: plant.crop.height * 0.8 + 0.55 + Math.sin(angle * 1.2) * 0.18,
          z: center.z + Math.sin(angle) * 0.7,
        }, basis);
        if (p) drawButterfly(ctx, p.x, p.y, Math.max(4, p.scale * 0.3), time, i * 1.4, butterflyColors[i % butterflyColors.length]);
      }

      for (let i = 0; i < state.wildlife.ladybugs; i += 1) {
        const plant = anchors[(i + 2) % anchors.length];
        const center = cellCenter(plant.x, plant.z, state.gridSize);
        const p = project({ x: center.x + 0.35, y: 0.24, z: center.z + 0.2 }, basis);
        if (p) drawLadybug(ctx, p.x, p.y, Math.max(2.4, p.scale * 0.14));
      }

      for (let i = 0; i < state.wildlife.fireflies; i += 1) {
        const angle = time * 0.23 + i * 2.4;
        const p = project({
          x: Math.cos(angle) * (state.gridSize * 0.42),
          y: 1.2 + Math.sin(time * 0.8 + i) * 0.25,
          z: Math.sin(angle) * (state.gridSize * 0.42),
        }, basis);
        if (!p) continue;
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(5, p.scale * 0.35));
        glow.addColorStop(0, 'rgba(255,240,170,.8)');
        glow.addColorStop(1, 'rgba(255,240,170,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(5, p.scale * 0.35), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,252,222,.95)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawPetalDrift(ctx, basis, state, time) {
      for (const plant of state.plants) {
        if (plant.stage < 3.8) continue;
        const center = cellCenter(plant.x, plant.z, state.gridSize);
        for (let i = 0; i < 2; i += 1) {
          const phase = time * 0.28 + plant.x * 1.7 + i * 2.1;
          const p = project({
            x: center.x + Math.sin(phase) * 0.45,
            y: plant.crop.height * 0.75 + 0.2 - ((time * 0.08 + i * 0.3) % 0.8),
            z: center.z + Math.cos(phase * 0.8) * 0.3,
          }, basis);
          if (!p) continue;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(phase);
          ctx.fillStyle = alpha(plant.crop.petal, 0.65);
          ctx.beginPath();
          ctx.ellipse(0, 0, Math.max(1, p.scale * 0.04), Math.max(0.5, p.scale * 0.015), 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    function drawFarmHover(ctx, basis, state, hover) {
      if (!hover || hover.x < 0 || hover.z < 0 || hover.x >= state.gridSize || hover.z >= state.gridSize) return;
      const n = state.gridSize;
      const center = cellCenter(hover.x, hover.z, n);
      const half = 0.46;
      const points = [
        project({ x: center.x - half, y: 0.035, z: center.z - half }, basis),
        project({ x: center.x + half, y: 0.035, z: center.z - half }, basis),
        project({ x: center.x + half, y: 0.035, z: center.z + half }, basis),
        project({ x: center.x - half, y: 0.035, z: center.z + half }, basis),
      ];
      if (points.some((point) => !point)) return;
      const crop = state.selectedCrop;
      const plant = state.plants.find((item) => item.x === hover.x && item.z === hover.z);
      const hasSeed = state.availableSeeds > 0 && crop?.unlocked;
      const color = plant ? '#FFF2C4' : hasSeed ? (crop?.petal || '#FFF2C4') : '#F7B7C8';
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = alpha(color, 0.9);
      ctx.fillStyle = alpha(color, 0.17);
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      if (!plant && hasSeed) {
        const p = project({ x: center.x, y: 0.12, z: center.z }, basis);
        if (p) {
          ctx.fillStyle = 'rgba(125,86,58,.55)';
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, Math.max(1.5, p.scale * 0.07), Math.max(1, p.scale * 0.03), 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#8CBF84';
          ctx.beginPath();
          ctx.arc(p.x, p.y - 3, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (plant) {
        const p = project({ x: center.x, y: plant.crop.height + 0.28, z: center.z }, basis);
        if (p) {
          const label = plant.stage >= 4 ? 'Harvest' : `${Math.min(99, Math.round(plant.stage / 4 * 100))}% grown`;
          ctx.font = '500 10px ui-sans-serif, system-ui, sans-serif';
          const width = ctx.measureText(label).width;
          ctx.fillStyle = 'rgba(28,22,36,.68)';
          ctx.fillRect(p.x - width / 2 - 5, p.y - 10, width + 10, 16);
          ctx.fillStyle = '#FFF8F0';
          ctx.fillText(label, p.x - width / 2, p.y + 2);
        }
      }
    }

    function drawFarmScene(ctx, width, height, time, camera, state, hover) {
      const livePlants = state.plants.map((plant) => ({
        ...plant,
        stage: plantStage(plant, state.level),
      }));
      const live = { ...state, plants: livePlants };
      ctx.clearRect(0, 0, width, height);
      drawSky(ctx, width, height, time);
      drawSun(ctx, width, height, time);
      const basis = cameraBasis(camera, width, height);
      drawClouds(ctx, width, height, time, camera);
      if (live.cacheHitRate >= 90) drawAurora(ctx, width, height, time);
      drawCloud(ctx, width * 0.46, height * 0.82, Math.min(width, height) * 0.18, 0.3);
      drawCloud(ctx, width * 0.58, height * 0.86, Math.min(width, height) * 0.12, 0.22);
      drawIslandBase(ctx, basis, live);
      drawFarmGround(ctx, basis, live);

      const n = live.gridSize;
      drawTree(ctx, basis, time, -n / 2 - 0.2, -n / 2 - 0.2, 1.05, '#A8DDB6', '#FFD6E4');
      drawTree(ctx, basis, time, n / 2 + 0.2, -n / 2 - 0.15, 0.92, '#B7E0B2', '#FFF0B8');
      drawFence(ctx, basis, live);
      drawScarecrow(ctx, basis, live);
      drawPlantShadows(ctx, basis, live);

      const plants = live.plants
        .filter((plant) => plant.x >= 0 && plant.z >= 0 && plant.x < n && plant.z < n)
        .map((plant) => {
          const center = cellCenter(plant.x, plant.z, n);
          const p = project({ x: center.x, y: 0.1, z: center.z }, basis);
          return { plant, depth: p ? p.z : 0 };
        })
        .sort((a, b) => b.depth - a.depth);
      for (const entry of plants) drawPlant(ctx, basis, live, entry.plant, time);

      drawFarmHover(ctx, basis, live, hover);
      drawPetalDrift(ctx, basis, live, time);
      drawFarmBugs(ctx, basis, live, time);
    }

    /* --------------------------------------------------------------- icons */

    function CropIcon({ crop, size = 22 }) {
      const stem = h('path', {
        d: 'M16 27v-9', stroke: crop.leaf, strokeWidth: 1.8, strokeLinecap: 'round',
      });
      const leaves = h('path', {
        d: 'M16 23c-4 0-6-2.2-6.5-4.8 3.8-.2 6 1.4 6.5 4.8Zm0 1.2c4 0 6-2.2 6.5-4.8-3.8-.2-6 1.4-6.5 4.8Z',
        fill: crop.leaf,
      });

      if (crop.kind === 'tulip') {
        return h('svg', { viewBox: '0 0 32 32', width: size, height: size, 'aria-hidden': true },
          stem, leaves,
          h('path', { d: 'M11 17c-1-5 1-8 3-10 1 2 2 2 2 2s1 0 2-2c2 2 4 5 3 10-2 2-3 3-5 3s-3-1-5-3Z', fill: crop.petal, stroke: 'rgba(255,255,255,.55)', strokeWidth: 0.7 }),
          h('path', { d: 'M16 9v10M13 10c0 4 .5 7 1.2 9M19 10c0 4-.5 7-1.2 9', stroke: shade(crop.petal, -0.12), strokeWidth: 0.7, opacity: 0.55 })
        );
      }
      if (crop.kind === 'lavender') {
        return h('svg', { viewBox: '0 0 32 32', width: size, height: size, 'aria-hidden': true },
          h('path', { d: 'M16 28V14', stroke: crop.leaf, strokeWidth: 1.7, strokeLinecap: 'round' }),
          leaves,
          [0, 1, 2, 3, 4, 5].map((i) => h('ellipse', {
            key: i, cx: 16 + (i % 2 === 0 ? -2.4 : 2.4), cy: 13 - i * 2.1, rx: 2.8, ry: 1.8,
            fill: i % 2 === 0 ? crop.petal : shade(crop.petal, 0.12),
          }))
        );
      }
      if (crop.kind === 'strawberry') {
        return h('svg', { viewBox: '0 0 32 32', width: size, height: size, 'aria-hidden': true },
          h('path', { d: 'M16 25c-5-3.5-7-8-5.5-11.2C12 12 14 12 16 13.2 18 12 20 12 21.5 13.8 23 17 21 21.5 16 25Z', fill: '#F27F87', stroke: 'rgba(160,60,80,.35)', strokeWidth: 0.7 }),
          h('path', { d: 'M11 13c1.8-3 3.5-4 5-4s3.2 1 5 4c-2-.6-3.5-.8-5-.8s-3 .2-5 .8Z', fill: crop.leaf }),
          h('circle', { cx: 14, cy: 17, r: 0.7, fill: '#FFE7B0' }),
          h('circle', { cx: 18, cy: 18, r: 0.7, fill: '#FFE7B0' }),
          h('circle', { cx: 16, cy: 21, r: 0.7, fill: '#FFE7B0' })
        );
      }
      if (crop.kind === 'pumpkin') {
        return h('svg', { viewBox: '0 0 32 32', width: size, height: size, 'aria-hidden': true },
          h('ellipse', { cx: 16, cy: 19, rx: 9, ry: 7, fill: '#F0A35C', stroke: 'rgba(150,80,30,.3)', strokeWidth: 0.8 }),
          h('ellipse', { cx: 12, cy: 19, rx: 4.4, ry: 6.6, fill: 'none', stroke: 'rgba(150,80,30,.25)', strokeWidth: 0.8 }),
          h('ellipse', { cx: 20, cy: 19, rx: 4.4, ry: 6.6, fill: 'none', stroke: 'rgba(150,80,30,.25)', strokeWidth: 0.8 }),
          h('path', { d: 'M16 12c0-3 1.4-4.3 3-5', stroke: crop.leaf, strokeWidth: 1.8, strokeLinecap: 'round' }),
          h('path', { d: 'M16 12c-3-1.5-5-1-6 0 1 1.8 3 2.7 6 2.4 3 .3 5-.6 6-2.4-1-1-3-1.5-6 0Z', fill: crop.leaf })
        );
      }
      if (crop.kind === 'bluebell') {
        return h('svg', { viewBox: '0 0 32 32', width: size, height: size, 'aria-hidden': true },
          stem, leaves,
          [-4, 0, 4].map((dx, i) => h('path', {
            key: i,
            d: `M${16 + dx} ${14 - Math.abs(dx) * 0.4}c-3 0-3.5 2.5-3.5 4.5 0 2.8 1.5 4 3.5 4s3.5-1.2 3.5-4c0-2-0.5-4.5-3.5-4.5Z`,
            fill: crop.petal, stroke: 'rgba(255,255,255,.5)', strokeWidth: 0.6,
          }))
        );
      }
      return h('svg', { viewBox: '0 0 32 32', width: size, height: size, 'aria-hidden': true },
        stem, leaves,
        Array.from({ length: crop.kind === 'sunflower' ? 10 : 7 }).map((_, i) => {
          const angle = i * Math.PI * 2 / (crop.kind === 'sunflower' ? 10 : 7);
          const cx = 16 + Math.cos(angle) * 6;
          const cy = 12 + Math.sin(angle) * 3.8;
          return h('ellipse', {
            key: i, cx, cy, rx: 3.4, ry: 1.7, fill: crop.petal,
            transform: `rotate(${(angle * 180) / Math.PI} ${cx} ${cy})`,
          });
        }),
        h('circle', { cx: 16, cy: 12, r: crop.kind === 'sunflower' ? 3.8 : 3.2, fill: crop.center, stroke: 'rgba(140,90,40,.18)', strokeWidth: 0.6 })
      );
    }

    function RefreshIcon() {
      return h('svg', { viewBox: '0 0 16 16', width: 13, height: 13, fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M13.1 6.3A5.4 5.4 0 1 0 13 9.7', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }),
        h('path', { d: 'M13.2 2.9v3.5H9.7', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' })
      );
    }

    function UndoIcon() {
      return h('svg', { viewBox: '0 0 16 16', width: 12, height: 12, fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M5.4 4.1 2.7 6.6l2.7 2.5', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        h('path', { d: 'M3 6.6h6.2a3.2 3.2 0 1 1 0 6.4H7.2', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round' })
      );
    }

    function ResetIcon() {
      return h('svg', { viewBox: '0 0 16 16', width: 12, height: 12, fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M8 2.2a5.8 5.8 0 1 1-5.5 7.6', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round' }),
        h('path', { d: 'M2.1 6.1 3 10l3.7-1.4', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round' })
      );
    }

    function CheckIcon() {
      return h('svg', { viewBox: '0 0 12 12', width: 9, height: 9, fill: 'none', 'aria-hidden': true },
        h('path', { d: 'm2.2 6.1 2.3 2.3 5-5', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' })
      );
    }

    function LockIcon() {
      return h('svg', { viewBox: '0 0 12 12', width: 8, height: 8, fill: 'none', 'aria-hidden': true },
        h('rect', { x: 2.4, y: 5.2, width: 7.2, height: 5, rx: 1.2, stroke: 'currentColor', strokeWidth: 1 }),
        h('path', { d: 'M4.2 5.1V4a1.8 1.8 0 0 1 3.6 0v1.1', stroke: 'currentColor', strokeWidth: 1, strokeLinecap: 'round' })
      );
    }

    function BloomIcon({ size = 16, active = false }) {
      return h('svg', {
        viewBox: '0 0 24 24', width: size, height: size, fill: 'none',
        'aria-hidden': true, style: { display: 'block', opacity: active ? 1 : 0.76 },
      },
        h('path', { d: 'M12 21v-8', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', opacity: 0.7 }),
        h('path', { d: 'M12 17c-3.2 0-5-1.7-5.2-4 2.8-.2 4.5 1.1 5.2 4Zm0 1c3.2 0 5-1.7 5.2-4-2.8-.2-4.5 1.1-5.2 4Z', fill: 'currentColor', opacity: 0.5 }),
        h('circle', { cx: 12, cy: 7.2, r: 2.4, stroke: 'currentColor', strokeWidth: 1.3 }),
        h('path', { d: 'M12 2.3v2.4M12 9.7v2.4M7.3 7.2h2.4M14.3 7.2h2.4M8.7 3.9l1.7 1.7M13.6 8.8l1.7 1.7M15.3 3.9l-1.7 1.7M10.4 8.8l-1.7 1.7', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round' }),
        h('circle', { cx: 19.3, cy: 15.2, r: 1.7, fill: 'currentColor', opacity: 0.8 })
      );
    }

    /* ------------------------------------------------------------- components */

    function Meter({ value, warm }) {
      return h('div', { className: 'blm-meter', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(value * 100) },
        h('div', { className: `blm-meter-fill${warm ? ' is-warm' : ''}`, style: { width: `${clamp(value, 0, 1) * 100}%` } })
      );
    }

    function Stage({ farm, selectedCrop, derived, syncing, meta, onCell, onCompost, onUndo, onSelect, toast }) {
      const stageRef = useRef(null);
      const canvasRef = useRef(null);
      const sizeRef = useRef({ w: 0, h: 0 });
      const cameraRef = useRef(loadCamera() || defaultCamera(derived.gridSize));
      const hoverRef = useRef(null);
      const pointerRef = useRef(null);
      const propsRef = useRef({});
      const [dragging, setDragging] = useState(false);

      propsRef.current = {
        plants: derived.plants,
        gridSize: derived.gridSize,
        selectedCrop,
        availableSeeds: derived.availableSeeds,
        level: derived.level,
        conversations: derived.conversations,
        cacheHitRate: derived.cacheHitRate,
        wildlife: derived.wildlife,
        blooms: derived.blooms,
      };

      useEffect(() => {
        const stage = stageRef.current;
        const canvas = canvasRef.current;
        if (!stage || !canvas) return undefined;
        const resize = () => {
          const rect = stage.getBoundingClientRect();
          const dpr = Math.min(2, window.devicePixelRatio || 1);
          const w = Math.max(1, Math.round(rect.width));
          const height = Math.max(1, Math.round(rect.height));
          canvas.width = Math.round(w * dpr);
          canvas.height = Math.round(height * dpr);
          const ctx = canvas.getContext('2d');
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          sizeRef.current = { w, h: height };
        };
        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(stage);
        return () => observer.disconnect();
      }, []);

      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;
        const ctx = canvas.getContext('2d');
        let raf;
        const frame = (timestamp) => {
          const { w, h } = sizeRef.current;
          if (w > 0 && h > 0) {
            drawFarmScene(ctx, w, h, timestamp / 1000, cameraRef.current, propsRef.current, hoverRef.current);
          }
          raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(raf);
      }, []);

      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;
        const onWheel = (event) => {
          event.preventDefault();
          const camera = cameraRef.current;
          camera.distance = clamp(camera.distance * Math.exp(event.deltaY * 0.0011), 10, 44);
          writeJson(CAMERA_KEY, camera);
        };
        canvas.addEventListener('wheel', onWheel, { passive: false });
        return () => canvas.removeEventListener('wheel', onWheel);
      }, []);

      const pointToCell = useCallback((event) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const { w, h } = sizeRef.current;
        const basis = cameraBasis(cameraRef.current, w, h);
        const ground = groundPoint(event.clientX - rect.left, event.clientY - rect.top, basis);
        return cellFromGround(ground, propsRef.current.gridSize);
      }, []);

      const updateHover = useCallback((event) => {
        const cell = pointToCell(event);
        hoverRef.current = cell || null;
      }, [pointToCell]);

      const onPointerDown = (event) => {
        if (event.button !== 0 && event.button !== 2) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        stageRef.current?.focus();
        canvas.setPointerCapture?.(event.pointerId);
        pointerRef.current = {
          id: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          lastX: event.clientX,
          lastY: event.clientY,
          button: event.button,
          dragged: false,
        };
        setDragging(false);
      };

      const onPointerMove = (event) => {
        const pointer = pointerRef.current;
        if (pointer && pointer.id === event.pointerId) {
          const dx = event.clientX - pointer.lastX;
          const dy = event.clientY - pointer.lastY;
          if (!pointer.dragged && Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) > 3) {
            pointer.dragged = true;
            setDragging(true);
          }
          if (pointer.dragged) {
            const camera = cameraRef.current;
            camera.yaw -= dx * 0.008;
            camera.pitch = clamp(camera.pitch + dy * 0.005, 0.28, 1.34);
            pointer.lastX = event.clientX;
            pointer.lastY = event.clientY;
            hoverRef.current = null;
            return;
          }
          pointer.lastX = event.clientX;
          pointer.lastY = event.clientY;
        }
        updateHover(event);
      };

      const finishPointer = (event) => {
        const pointer = pointerRef.current;
        if (!pointer || pointer.id !== event.pointerId) return;
        pointerRef.current = null;
        setDragging(false);
        if (!pointer.dragged) {
          const cell = pointToCell(event);
          if (cell) {
            if (pointer.button === 2) onCompost(cell.x, cell.z);
            else onCell(cell.x, cell.z);
          }
        }
        writeJson(CAMERA_KEY, cameraRef.current);
        updateHover(event);
      };

      const cancelPointer = () => {
        pointerRef.current = null;
        setDragging(false);
        hoverRef.current = null;
      };

      const resetView = () => {
        cameraRef.current = defaultCamera(derived.gridSize);
        writeJson(CAMERA_KEY, cameraRef.current);
        hoverRef.current = null;
      };

      return h('div', {
        ref: stageRef,
        className: `blm-stage${dragging ? ' is-dragging' : ''}`,
        tabIndex: 0,
        role: 'application',
        'aria-label': 'Token Farm 3D farm. Drag to orbit, scroll to zoom, click soil to plant, click a bloom to harvest, right-click to compost.',
        onKeyDown: (event) => {
          if (event.key === 'r' || event.key === 'R') {
            resetView();
            return;
          }
          if (event.key === 'z' || event.key === 'Z') {
            onUndo();
            return;
          }
          if (event.key === 'Escape') {
            hoverRef.current = null;
            return;
          }
          const index = Number(event.key) - 1;
          if (index >= 0 && index < derived.crops.length) {
            const crop = derived.crops[index];
            if (crop.unlocked) onSelect(crop.id);
          }
        },
      },
        h('canvas', {
          ref: canvasRef,
          className: 'blm-canvas',
          onPointerDown,
          onPointerMove,
          onPointerUp: finishPointer,
          onPointerCancel: cancelPointer,
          onPointerLeave: () => { if (!pointerRef.current) hoverRef.current = null; },
          onContextMenu: (event) => event.preventDefault(),
        }),
        h('div', { className: 'blm-hud' },
          h('div', { className: 'blm-hud-left' },
            h('span', { className: 'blm-chip' }, h('b', {}, `Level ${derived.level}`), ` · ${fmtTokens(derived.tokens)} tokens`),
            h('span', { className: 'blm-chip is-muted' }, `${fmtInt(derived.availableSeeds)} / ${fmtInt(derived.earnedSeeds)} seeds`),
            h('span', { className: 'blm-chip is-muted' }, `${fmtInt(derived.blooms)} blooms`),
            syncing ? h('span', { className: 'blm-chip is-muted' }, 'Syncing usage') : null,
            meta.error ? h('span', { className: 'blm-chip is-muted' }, 'Usage offline') : null
          ),
          h('div', { className: 'blm-hud-right' },
            h('button', { type: 'button', className: 'blm-hud-btn', onClick: resetView, title: 'Reset camera' }, h(ResetIcon), ' Reset view'),
            h('button', { type: 'button', className: 'blm-hud-btn', onClick: onUndo, title: 'Undo last change' }, h(UndoIcon), ' Undo')
          )
        ),
        h('div', { className: 'blm-hint' }, 'Click soil to plant · Click a bloom to harvest · Right-click to compost'),
        toast ? h('div', { className: 'blm-toast', key: toast.id }, toast.text) : null
      );
    }

    function Palette({ crops, selected, onSelect, seedsAvailable, onSow }) {
      return h('div', { className: 'blm-palette', role: 'toolbar', 'aria-label': 'Seed packets' },
        h('span', { className: 'blm-palette-label' }, 'Seeds'),
        crops.map((crop) => h('button', {
          key: crop.id,
          type: 'button',
          className: `blm-swatch-btn${crop.unlocked ? '' : ' is-locked'}`,
          'aria-pressed': selected === crop.id,
          'aria-label': crop.unlocked ? `Plant ${crop.name} seeds` : `${crop.name} seeds unlock at ${crop.unlockText}`,
          'data-item': crop.id,
          title: crop.unlocked ? crop.name : `${crop.name} · ${crop.unlockText}`,
          onClick: () => onSelect(crop.id),
        },
          h('span', { className: 'blm-seed', style: { background: crop.bg } }, h(CropIcon, { crop, size: 23 })),
          crop.unlocked ? null : h('span', { className: 'blm-lock' }, h(LockIcon))
        )),
        h('span', { className: 'blm-selected-name' },
          h('b', {}, crops.find((crop) => crop.id === selected)?.name || 'Daisy'),
          ` · ${fmtInt(seedsAvailable)} seed${seedsAvailable === 1 ? '' : 's'}`
        ),
        h('button', { type: 'button', className: 'blm-btn', onClick: onSow }, 'Sow')
      );
    }

    function ProgressRail({ derived, onUndo, onClear, confirmClear }) {
      const locked = derived.crops.filter((crop) => !crop.unlocked).slice(0, 3);
      const achievements = [
        { id: 'harvest', label: 'First harvest', done: derived.harvests >= 1, count: `${Math.min(derived.harvests, 1)} / 1` },
        { id: 'blooms', label: 'Blooming field', done: derived.blooms >= 3, count: `${Math.min(derived.blooms, 3)} / 3` },
        { id: 'species', label: 'Botanist', done: derived.species >= 5, count: `${Math.min(derived.species, 5)} / 5` },
        { id: 'bees', label: 'Busy bees', done: derived.wildlife.bees >= 4, count: `${Math.min(derived.wildlife.bees, 4)} / 4` },
        { id: 'harvests', label: 'Market day', done: derived.harvests >= 10, count: `${Math.min(derived.harvests, 10)} / 10` },
        { id: 'level', label: 'High summer', done: derived.level >= 30, count: `${derived.level} / 30` },
      ];
      return h('aside', { className: 'blm-rail', 'aria-label': 'Farm progression' },
        h('section', { className: 'blm-sec' },
          h('h2', {}, 'Farm'),
          h('p', { className: 'blm-sec-sub' }, 'Grown from your real usage ledger.'),
          h('div', { className: 'blm-level-row' },
            h('span', { className: 'blm-level' }, derived.level),
            h('span', { className: 'blm-level-unit' }, `of ${MAX_LEVEL}`)
          ),
          h(Meter, { value: derived.progress, warm: derived.progress > 0.85 }),
          h('div', { className: 'blm-meter-labels' },
            h('span', {}, derived.nextThreshold ? `${fmtTokens(derived.previousThreshold)} → ${fmtTokens(derived.nextThreshold)}` : 'Max level'),
            h('span', {}, derived.nextThreshold ? `${fmtTokens(Math.max(0, derived.nextThreshold - derived.tokens))} to go` : 'Complete')
          ),
          h('div', { className: 'blm-stats' },
            h('div', { className: 'blm-stat' }, h('span', {}, 'Tokens'), h('b', {}, fmtTokens(derived.tokens))),
            h('div', { className: 'blm-stat' }, h('span', {}, 'Seeds'), h('b', {}, `${fmtInt(derived.availableSeeds)} free · ${fmtInt(derived.earnedSeeds)} earned`)),
            h('div', { className: 'blm-stat' }, h('span', {}, 'Field'), h('b', {}, `${derived.planted} / ${derived.gridSize * derived.gridSize} plots`)),
            h('div', { className: 'blm-stat' }, h('span', {}, 'Blooms'), h('b', {}, `${derived.blooms} blooming · ${derived.growing} growing`)),
            h('div', { className: 'blm-stat' }, h('span', {}, 'Harvests'), h('b', {}, fmtInt(derived.harvests))),
            h('div', { className: 'blm-stat' }, h('span', {}, 'Pollen'), h('b', {}, fmtInt(derived.pollen))),
            h('div', { className: 'blm-stat' }, h('span', {}, 'Growth'), h('b', {}, `${(derived.stageMs / 1000).toFixed(1)}s / stage`))
          ),
          h('p', { className: 'blm-note' }, 'Each 2M tokens earns a seed; conversations add two. A harvest returns a seed and one pollen. Higher levels grow plants faster.')
        ),
        h('section', { className: 'blm-sec' },
          h('h2', {}, 'Next seeds'),
          h('p', { className: 'blm-sec-sub' }, 'More usage unlocks the seed drawer.'),
          h('div', { className: 'blm-unlocks' },
            locked.length ? locked.map((crop) => h('div', { className: 'blm-unlock', key: crop.id },
              h('span', { className: 'blm-unlock-swatch', style: { background: crop.bg } }, h(CropIcon, { crop, size: 15 })),
              h('div', { className: 'blm-unlock-text' },
                h('div', { className: 'blm-unlock-name' }, crop.name),
                h('div', { className: 'blm-unlock-when' }, crop.unlockText)
              )
            )) : h('p', { className: 'blm-sec-sub' }, 'Every seed is unlocked. The whole meadow is yours.')
          ),
          derived.cacheHitRate >= 90 ? h('p', { className: 'blm-note' }, h('b', { style: { color: 'var(--dsw-alias-label-primary)' } }, 'Aurora active'), ` · ${fmtPct(derived.cacheHitRate)} cache hit.`) : null
        ),
        h('section', { className: 'blm-sec' },
          h('h2', {}, 'Wildlife'),
          h('p', { className: 'blm-sec-sub' }, 'Bugs arrive when the field is alive.'),
          h('div', { className: 'blm-stats' },
            h('div', { className: 'blm-stat' }, h('span', {}, 'Bees'), h('b', {}, derived.wildlife.bees)),
            h('div', { className: 'blm-stat' }, h('span', {}, 'Butterflies'), h('b', {}, derived.wildlife.butterflies)),
            h('div', { className: 'blm-stat' }, h('span', {}, 'Ladybugs'), h('b', {}, derived.wildlife.ladybugs)),
            h('div', { className: 'blm-stat' }, h('span', {}, 'Fireflies'), h('b', {}, derived.wildlife.fireflies))
          )
        ),
        h('section', { className: 'blm-sec' },
          h('h2', {}, 'Field notes'),
          h('p', { className: 'blm-sec-sub' }, 'Small wins, no pressure.'),
          h('div', { className: 'blm-ach' },
            achievements.map((item) => h('div', { className: `blm-ach-row${item.done ? ' is-done' : ''}`, key: item.id },
              h('span', { className: 'blm-check' }, item.done ? h(CheckIcon) : null),
              h('span', { className: 'blm-ach-text' }, item.label),
              h('span', { className: 'blm-ach-count' }, item.count)
            ))
          )
        ),
        h('section', { className: 'blm-sec' },
          h('h2', {}, 'Farm tools'),
          h('div', { className: 'blm-actions' },
            h('button', { type: 'button', className: 'blm-btn', onClick: onUndo }, h(UndoIcon), ' Undo'),
            h('button', { type: 'button', className: `blm-btn${confirmClear ? ' is-danger' : ''}`, onClick: onClear }, confirmClear ? 'Confirm clear' : 'Clear field')
          ),
          h('p', { className: 'blm-note' }, 'The farm and camera are saved locally. Stats refresh every 8 seconds; mature blooms can be harvested for pollen.')
        )
      );
    }

    function TokenBloomPage() {
      const [stats, meta, refresh] = useUsageStats();
      const cachedLevel = Math.min(MAX_LEVEL, Math.max(1, Math.floor((Number(stats.tokens) || 0) / LEVEL_TOKENS) + 1));
      const [farm, setFarm] = useState(() => loadFarm(cachedLevel));
      const [selected, setSelected] = useState(() => {
        const value = readJson(SELECTED_KEY, 'daisy');
        return typeof value === 'string' ? value : 'daisy';
      });
      const [toast, setToast] = useState(null);
      const [confirmClear, setConfirmClear] = useState(false);
      const [clock, setClock] = useState(0);
      const historyRef = useRef([]);

      useEffect(() => {
        const timer = setInterval(() => setClock((value) => value + 1), 2000);
        return () => clearInterval(timer);
      }, []);

      const derived = useMemo(() => deriveFarm(stats, farm, Date.now()), [stats, farm, clock]);
      const selectedCrop = derived.crops.find((crop) => crop.id === selected)
        || derived.crops.find((crop) => crop.unlocked)
        || derived.crops[0];

      useEffect(() => {
        if (!selectedCrop?.unlocked) {
          const fallback = derived.crops.find((crop) => crop.unlocked);
          if (fallback && fallback.id !== selected) setSelected(fallback.id);
        }
      }, [selectedCrop, selected, derived.crops]);

      useEffect(() => {
        writeJson(FARM_KEY, farm);
      }, [farm]);

      useEffect(() => {
        writeJson(SELECTED_KEY, selected);
      }, [selected]);

      useEffect(() => {
        if (!toast) return undefined;
        const timer = setTimeout(() => setToast(null), 2200);
        return () => clearTimeout(timer);
      }, [toast]);

      useEffect(() => {
        if (!confirmClear) return undefined;
        const timer = setTimeout(() => setConfirmClear(false), 3200);
        return () => clearTimeout(timer);
      }, [confirmClear]);

      const say = useCallback((text) => setToast({ text, id: `${Date.now()}-${Math.random()}` }), []);
      const snapshot = useCallback(() => {
        historyRef.current.push(farm);
        if (historyRef.current.length > 30) historyRef.current.shift();
      }, [farm]);

      const select = useCallback((id) => {
        const crop = derived.crops.find((item) => item.id === id);
        if (!crop) return;
        if (!crop.unlocked) {
          say(`${crop.name} seeds unlock at ${crop.unlockText}`);
          return;
        }
        setSelected(id);
      }, [derived.crops, say]);

      const harvest = useCallback((plant) => {
        snapshot();
        setFarm((current) => ({
          ...current,
          plants: current.plants.filter((item) => item.id !== plant.id),
          harvested: current.harvested + 1,
          pollen: current.pollen + 1,
        }));
        say(`Harvested ${cropById(plant.cropId).name} · +1 pollen`);
      }, [say, snapshot]);

      const compost = useCallback((x, z) => {
        const plant = farm.plants.find((item) => item.x === x && item.z === z);
        if (!plant) return;
        snapshot();
        setFarm((current) => ({ ...current, plants: current.plants.filter((item) => item.id !== plant.id) }));
        say(`Composted ${cropById(plant.cropId).name}`);
      }, [farm.plants, say, snapshot]);

      const cell = useCallback((x, z) => {
        const plant = farm.plants.find((item) => item.x === x && item.z === z);
        if (plant) {
          const stage = plantStage(plant, derived.level, Date.now());
          if (stage >= 4) {
            harvest(plant);
            return;
          }
          say(`${cropById(plant.cropId).name} · ${Math.min(99, Math.round(stage / 4 * 100))}% grown`);
          return;
        }
        if (!selectedCrop?.unlocked) {
          say(`${selectedCrop?.name || 'That seed'} is locked`);
          return;
        }
        if (derived.availableSeeds <= 0) {
          say('No seeds free — harvest a bloom or generate more usage');
          return;
        }
        snapshot();
        setFarm((current) => ({
          ...current,
          plants: [...current.plants, {
            id: plantId(),
            cropId: selectedCrop.id,
            x,
            z,
            plantedAt: Date.now(),
          }],
          plantedEver: current.plantedEver + 1,
        }));
        say(`Planted ${selectedCrop.name}`);
      }, [derived.availableSeeds, derived.level, farm.plants, harvest, say, selectedCrop, snapshot]);

      const sow = useCallback(() => {
        const occupied = new Set(farm.plants.map((plant) => `${plant.x}:${plant.z}`));
        for (let x = 0; x < derived.gridSize; x += 1) {
          for (let z = 0; z < derived.gridSize; z += 1) {
            if (!occupied.has(`${x}:${z}`)) {
              cell(x, z);
              return;
            }
          }
        }
        say('The field is full — harvest a bloom first');
      }, [cell, derived.gridSize, farm.plants, say]);

      const undo = useCallback(() => {
        const previous = historyRef.current.pop();
        if (!previous) {
          say('Nothing to undo');
          return;
        }
        setFarm(previous);
        say('Farm restored');
      }, [say]);

      const clear = useCallback(() => {
        if (!confirmClear) {
          setConfirmClear(true);
          return;
        }
        snapshot();
        setFarm((current) => ({ ...current, plants: [] }));
        setConfirmClear(false);
        say('A fresh field');
      }, [confirmClear, say, snapshot]);

      const syncing = !stats.generatedAt && meta.loading;

      return h('div', { className: 'blm-page' },
        h('style', {}, CSS),
        h('div', { className: 'blm-inner' },
          h('header', { className: 'blm-head' },
            h('div', {},
              h('h1', { className: 'blm-title' }, 'Token Farm'),
              h('p', { className: 'blm-sub' }, 'A pastel 3D farm that grows from your real token usage.')
            ),
            h('div', { className: 'blm-head-right' },
              h('span', { className: `blm-live${meta.error ? ' is-stale' : ''}` },
                h('i', { className: 'blm-dot' }),
                meta.error ? 'Stale' : 'Live',
                h('span', {}, meta.updatedAt ? timeAgo(meta.updatedAt) : 'syncing')
              ),
              h('span', { className: 'blm-level-pill' }, 'Level ', h('b', {}, derived.level)),
              h('button', { type: 'button', className: 'blm-icon-btn', onClick: refresh, title: 'Refresh usage', 'aria-label': 'Refresh usage' }, h(RefreshIcon))
            )
          ),
          meta.error ? h('div', { className: 'blm-banner' }, `Usage service unavailable: ${meta.error}. The farm is still playable with the last known stats.`) : null,
          h('div', { className: 'blm-main' },
            h('div', { className: 'blm-left' },
              h(Stage, {
                farm,
                selectedCrop,
                derived,
                syncing,
                meta,
                onCell: cell,
                onCompost: compost,
                onUndo: undo,
                onSelect: select,
                toast,
              }),
              h(Palette, { crops: derived.crops, selected, onSelect: select, seedsAvailable: derived.availableSeeds, onSow: sow })
            ),
            h(ProgressRail, {
              derived,
              onUndo: undo,
              onClear: clear,
              confirmClear,
            })
          )
        )
      );
    }

    function LegacyStage({ blocks, selectedItem, derived, syncing, meta, onPlace, onRemove, onUndo, onSelect, toast }) {
      const stageRef = useRef(null);
      const canvasRef = useRef(null);
      const sizeRef = useRef({ w: 0, h: 0 });
      const cameraRef = useRef(loadCamera() || defaultCamera(derived.gridSize));
      const hoverRef = useRef(null);
      const pointerRef = useRef(null);
      const propsRef = useRef({});
      const [dragging, setDragging] = useState(false);

      propsRef.current = {
        blocks,
        selectedItem,
        level: derived.level,
        conversations: derived.conversations,
        cacheHitRate: derived.cacheHitRate,
        gridSize: derived.gridSize,
        sparkAvailable: derived.availableSpark,
        allItems: derived.allItems,
      };

      useEffect(() => {
        const stage = stageRef.current;
        const canvas = canvasRef.current;
        if (!stage || !canvas) return undefined;
        const resize = () => {
          const rect = stage.getBoundingClientRect();
          const dpr = Math.min(2, window.devicePixelRatio || 1);
          const w = Math.max(1, Math.round(rect.width));
          const height = Math.max(1, Math.round(rect.height));
          canvas.width = Math.round(w * dpr);
          canvas.height = Math.round(height * dpr);
          const ctx = canvas.getContext('2d');
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          sizeRef.current = { w, h: height };
        };
        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(stage);
        return () => observer.disconnect();
      }, []);

      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;
        const ctx = canvas.getContext('2d');
        let raf;
        const frame = (timestamp) => {
          const { w, h } = sizeRef.current;
          if (w > 0 && h > 0) {
            drawScene(ctx, w, h, timestamp / 1000, cameraRef.current, propsRef.current, hoverRef.current);
          }
          raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(raf);
      }, []);

      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;
        const onWheel = (event) => {
          event.preventDefault();
          const camera = cameraRef.current;
          camera.distance = clamp(camera.distance * Math.exp(event.deltaY * 0.0011), 10, 44);
          writeJson(CAMERA_KEY, camera);
        };
        canvas.addEventListener('wheel', onWheel, { passive: false });
        return () => canvas.removeEventListener('wheel', onWheel);
      }, []);

      const pointToCell = useCallback((event) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const { w, h } = sizeRef.current;
        const basis = cameraBasis(cameraRef.current, w, h);
        const ground = groundPoint(event.clientX - rect.left, event.clientY - rect.top, basis);
        return cellFromGround(ground, propsRef.current.gridSize);
      }, []);

      const updateHover = useCallback((event) => {
        const cell = pointToCell(event);
        if (!cell) {
          hoverRef.current = null;
          return;
        }
        hoverRef.current = { x: cell.x, z: cell.z };
      }, [pointToCell]);

      const onPointerDown = (event) => {
        if (event.button !== 0 && event.button !== 2) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        stageRef.current?.focus();
        canvas.setPointerCapture?.(event.pointerId);
        pointerRef.current = {
          id: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          lastX: event.clientX,
          lastY: event.clientY,
          button: event.button,
          dragged: false,
        };
        setDragging(false);
      };

      const onPointerMove = (event) => {
        const pointer = pointerRef.current;
        if (pointer && pointer.id === event.pointerId) {
          const dx = event.clientX - pointer.lastX;
          const dy = event.clientY - pointer.lastY;
          if (!pointer.dragged && Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) > 3) {
            pointer.dragged = true;
            setDragging(true);
          }
          if (pointer.dragged) {
            const camera = cameraRef.current;
            camera.yaw -= dx * 0.008;
            camera.pitch = clamp(camera.pitch + dy * 0.005, 0.28, 1.34);
            pointer.lastX = event.clientX;
            pointer.lastY = event.clientY;
            hoverRef.current = null;
            return;
          }
          pointer.lastX = event.clientX;
          pointer.lastY = event.clientY;
        }
        updateHover(event);
      };

      const finishPointer = (event) => {
        const pointer = pointerRef.current;
        if (!pointer || pointer.id !== event.pointerId) return;
        pointerRef.current = null;
        setDragging(false);
        if (!pointer.dragged) {
          const cell = pointToCell(event);
          if (cell) {
            if (pointer.button === 2) onRemove(cell.x, cell.z);
            else onPlace(cell.x, cell.z);
          }
        }
        writeJson(CAMERA_KEY, cameraRef.current);
        updateHover(event);
      };

      const cancelPointer = () => {
        pointerRef.current = null;
        setDragging(false);
        hoverRef.current = null;
      };

      const resetView = () => {
        cameraRef.current = defaultCamera(derived.gridSize);
        writeJson(CAMERA_KEY, cameraRef.current);
        hoverRef.current = null;
      };

      return h('div', {
        ref: stageRef,
        className: `blm-stage${dragging ? ' is-dragging' : ''}`,
        tabIndex: 0,
        role: 'application',
        'aria-label': 'Token Bloom 3D sandbox. Drag to orbit, scroll to zoom, click to place a block, right-click to remove.',
        onKeyDown: (event) => {
          if (event.key === 'r' || event.key === 'R') {
            resetView();
            return;
          }
          if (event.key === 'z' || event.key === 'Z') {
            onUndo();
            return;
          }
          if (event.key === 'Escape') {
            hoverRef.current = null;
            return;
          }
          const index = Number(event.key) - 1;
          if (index >= 0 && index < derived.allItems.length) {
            const item = derived.allItems[index];
            if (item.unlocked) onSelect(item.id);
          }
        },
      },
        h('canvas', {
          ref: canvasRef,
          className: 'blm-canvas',
          onPointerDown,
          onPointerMove,
          onPointerUp: finishPointer,
          onPointerCancel: cancelPointer,
          onPointerLeave: () => { if (!pointerRef.current) hoverRef.current = null; },
          onContextMenu: (event) => event.preventDefault(),
        }),
        h('div', { className: 'blm-hud' },
          h('div', { className: 'blm-hud-left' },
            h('span', { className: 'blm-chip' }, h('b', {}, `Level ${derived.level}`), ` · ${fmtTokens(derived.tokens)} tokens`),
            h('span', { className: 'blm-chip is-muted' }, `${fmtInt(blocks.length)} / ${fmtInt(derived.earnedSpark)} spark`),
            syncing ? h('span', { className: 'blm-chip is-muted' }, 'Syncing usage') : null,
            meta.error ? h('span', { className: 'blm-chip is-muted' }, 'Usage offline') : null
          ),
          h('div', { className: 'blm-hud-right' },
            h('button', { type: 'button', className: 'blm-hud-btn', onClick: resetView, title: 'Reset camera' }, h(ResetIcon), ' Reset view'),
            h('button', { type: 'button', className: 'blm-hud-btn', onClick: onUndo, title: 'Undo last change' }, h(UndoIcon), ' Undo')
          )
        ),
        h('div', { className: 'blm-hint' }, 'Drag to orbit · Scroll to zoom · Click to place · Right-click to remove'),
        toast ? h('div', { className: 'blm-toast', key: toast.id }, toast.text) : null
      );
    }

    function LegacyPalette({ items, selected, onSelect, derived }) {
      return h('div', { className: 'blm-palette', role: 'toolbar', 'aria-label': 'Block palette' },
        h('span', { className: 'blm-palette-label' }, 'Blocks'),
        items.map((item) => h('button', {
          key: item.id,
          type: 'button',
          className: `blm-swatch-btn${item.unlocked ? '' : ' is-locked'}`,
          'aria-pressed': selected === item.id,
          'aria-label': item.unlocked ? `Place ${item.name} blocks` : `${item.name} unlocks at ${item.unlockText}`,
          'data-item': item.id,
          title: item.unlocked ? item.name : `${item.name} · ${item.unlockText}`,
          onClick: () => onSelect(item.id),
        },
          h('span', { className: 'blm-swatch', style: { background: item.color } }),
          item.unlocked ? null : h('span', { className: 'blm-lock' }, h(LockIcon))
        )),
        h('span', { className: 'blm-selected-name' },
          'Selected ', h('b', {}, derived.allItems.find((item) => item.id === selected)?.name || 'Mint')
        )
      );
    }

    function LegacyProgressRail({ derived, stats, blocks, onUndo, onClear, confirmClear }) {
      const locked = derived.allItems.filter((item) => !item.unlocked).slice(0, 4);
      const usedColors = new Set(blocks.map((block) => block.colorId)).size;
      let maxStack = 0;
      const stacks = new Map();
      for (const block of blocks) {
        const key = `${block.x}:${block.z}`;
        const next = (stacks.get(key) || 0) + 1;
        stacks.set(key, next);
        maxStack = Math.max(maxStack, next);
      }
      const achievements = [
        { id: 'first', label: 'First bloom', done: blocks.length >= 1, count: `${Math.min(blocks.length, 1)} / 1` },
        { id: 'ten', label: 'Little grove', done: blocks.length >= 10, count: `${Math.min(blocks.length, 10)} / 10` },
        { id: 'colors', label: 'Color collector', done: usedColors >= 5, count: `${Math.min(usedColors, 5)} / 5` },
        { id: 'tower', label: 'Tower club', done: maxStack >= 3, count: `${Math.min(maxStack, 3)} / 3` },
        { id: 'keeper', label: 'Island keeper', done: blocks.length >= 25, count: `${Math.min(blocks.length, 25)} / 25` },
        { id: 'level', label: 'High tide', done: derived.level >= 15, count: `${derived.level} / 15` },
      ];
      return h('aside', { className: 'blm-rail', 'aria-label': 'Progression' },
        h('section', { className: 'blm-sec' },
          h('h2', {}, 'Progression'),
          h('p', { className: 'blm-sec-sub' }, 'Grown from your real usage ledger.'),
          h('div', { className: 'blm-level-row' },
            h('span', { className: 'blm-level' }, derived.level),
            h('span', { className: 'blm-level-unit' }, `of ${MAX_LEVEL}`)
          ),
          h(Meter, { value: derived.progress, warm: derived.progress > 0.85 }),
          h('div', { className: 'blm-meter-labels' },
            h('span', {}, derived.nextThreshold ? `${fmtTokens(derived.previousThreshold)} → ${fmtTokens(derived.nextThreshold)}` : 'Max level'),
            h('span', {}, derived.nextThreshold ? `${fmtTokens(Math.max(0, derived.nextThreshold - derived.tokens))} to go` : 'Complete')
          ),
          h('div', { className: 'blm-stats' },
            h('div', { className: 'blm-stat' }, h('span', {}, 'Tokens'), h('b', {}, fmtTokens(derived.tokens))),
            h('div', { className: 'blm-stat' }, h('span', {}, 'Conversations'), h('b', {}, fmtInt(derived.conversations))),
            h('div', { className: 'blm-stat' }, h('span', {}, 'Cache hit'), h('b', {}, fmtPct(derived.cacheHitRate))),
            h('div', { className: 'blm-stat' }, h('span', {}, 'Estimated cost'), h('b', {}, fmtUsd(derived.costUsd))),
            h('div', { className: 'blm-stat' }, h('span', {}, 'Spark'), h('b', {}, `${fmtInt(derived.availableSpark)} free · ${fmtInt(derived.earnedSpark)} earned`)),
            h('div', { className: 'blm-stat' }, h('span', {}, 'Placed'), h('b', {}, `${fmtInt(blocks.length)} blocks`))
          ),
          h('p', { className: 'blm-note' }, 'Each 1M tokens earns one spark and each conversation adds three. Every block costs one spark.')
        ),
        h('section', { className: 'blm-sec' },
          h('h2', {}, 'Next unlocks'),
          h('p', { className: 'blm-sec-sub' }, 'More usage grows the world.'),
          h('div', { className: 'blm-unlocks' },
            locked.length ? locked.map((item) => h('div', { className: 'blm-unlock', key: item.id },
              h('span', { className: 'blm-unlock-swatch', style: { background: item.color } }),
              h('div', { className: 'blm-unlock-text' },
                h('div', { className: 'blm-unlock-name' }, item.name),
                h('div', { className: 'blm-unlock-when' }, item.unlockText)
              )
            )) : h('p', { className: 'blm-sec-sub' }, 'Everything is unlocked. The sky is yours.')
          ),
          derived.cacheHitRate >= 90 ? h('p', { className: 'blm-note' }, h('b', { style: { color: 'var(--dsw-alias-label-primary)' } }, 'Aurora active'), ` · ${fmtPct(derived.cacheHitRate)} cache hit.`) : null
        ),
        h('section', { className: 'blm-sec' },
          h('h2', {}, 'Little goals'),
          h('p', { className: 'blm-sec-sub' }, 'No pressure, just pastel achievements.'),
          h('div', { className: 'blm-ach' },
            achievements.map((item) => h('div', { className: `blm-ach-row${item.done ? ' is-done' : ''}`, key: item.id },
              h('span', { className: 'blm-check' }, item.done ? h(CheckIcon) : null),
              h('span', { className: 'blm-ach-text' }, item.label),
              h('span', { className: 'blm-ach-count' }, item.count)
            ))
          )
        ),
        h('section', { className: 'blm-sec' },
          h('h2', {}, 'Sandbox'),
          h('div', { className: 'blm-actions' },
            h('button', { type: 'button', className: 'blm-btn', onClick: onUndo }, h(UndoIcon), ' Undo'),
            h('button', { type: 'button', className: `blm-btn${confirmClear ? ' is-danger' : ''}`, onClick: onClear }, confirmClear ? 'Confirm clear' : 'Clear island')
          ),
          h('p', { className: 'blm-note' }, 'The island and camera are saved locally. Stats refresh every 8 seconds; new token usage adds spark.')
        )
      );
    }

    function BloomBoundary({ children }) {
      return h(BloomBoundaryInner, null, children);
    }

    class BloomBoundaryInner extends React.Component {
      constructor(props) {
        super(props);
        this.state = { error: null };
      }

      static getDerivedStateFromError(error) {
        return { error };
      }

      render() {
        if (this.state.error) {
          return h('div', { className: 'blm-page' },
            h('style', {}, CSS),
            h('div', { className: 'blm-state' },
              h('div', {},
                h('div', { className: 'blm-state-title' }, 'The farm drifted away'),
                h('div', { className: 'blm-state-body' }, String(this.state.error?.message || this.state.error)),
                h('button', { className: 'blm-retry', type: 'button', onClick: () => window.location.reload() }, 'Reload')
              )
            )
          );
        }
        return this.props.children;
      }
    }

    function LegacyBloomPage() {
      const [stats, meta, refresh] = useUsageStats();
      const [blocks, setBlocks] = useState(loadBlocks);
      const [selected, setSelected] = useState(() => {
        const value = readJson(SELECTED_KEY, 'mint');
        return typeof value === 'string' ? value : 'mint';
      });
      const [toast, setToast] = useState(null);
      const [confirmClear, setConfirmClear] = useState(false);
      const historyRef = useRef([]);

      const derived = useMemo(() => derive(stats, blocks), [stats, blocks]);
      const selectedItem = derived.allItems.find((item) => item.id === selected)
        || derived.allItems.find((item) => item.unlocked)
        || derived.allItems[0];

      useEffect(() => {
        if (!selectedItem?.unlocked) {
          const fallback = derived.allItems.find((item) => item.unlocked);
          if (fallback && fallback.id !== selected) setSelected(fallback.id);
        }
      }, [selectedItem, selected, derived.allItems]);

      useEffect(() => {
        writeJson(BLOOM_KEY, blocks);
      }, [blocks]);

      useEffect(() => {
        writeJson(SELECTED_KEY, selected);
      }, [selected]);

      useEffect(() => {
        if (!toast) return undefined;
        const timer = setTimeout(() => setToast(null), 2200);
        return () => clearTimeout(timer);
      }, [toast]);

      useEffect(() => {
        if (!confirmClear) return undefined;
        const timer = setTimeout(() => setConfirmClear(false), 3200);
        return () => clearTimeout(timer);
      }, [confirmClear]);

      const say = useCallback((text) => setToast({ text, id: `${Date.now()}-${Math.random()}` }), []);

      const place = useCallback((x, z) => {
        if (!selectedItem?.unlocked) {
          say(`${selectedItem?.name || 'That block'} is locked`);
          return;
        }
        if (derived.availableSpark <= 0) {
          say('No spark left — new usage will grow the island');
          return;
        }
        const stack = blocks.filter((block) => block.x === x && block.z === z).length;
        if (stack >= MAX_STACK) {
          say('That stack is already six high');
          return;
        }
        const block = {
          x,
          z,
          y: stack,
          colorId: selectedItem.id,
          kind: selectedItem.kind || 'cube',
        };
        setBlocks((current) => [...current, block]);
        historyRef.current.push({ type: 'place', block });
        if (historyRef.current.length > 40) historyRef.current.shift();
        say(`Placed ${selectedItem.name}`);
      }, [blocks, derived.availableSpark, say, selectedItem]);

      const remove = useCallback((x, z) => {
        const cellBlocks = blocks.filter((block) => block.x === x && block.z === z);
        if (!cellBlocks.length) {
          say('Nothing to remove there');
          return;
        }
        const top = cellBlocks.reduce((best, block) => (block.y > best.y ? block : best), cellBlocks[0]);
        setBlocks((current) => current.filter((block) => !(block.x === top.x && block.z === top.z && block.y === top.y)));
        historyRef.current.push({ type: 'remove', block: top });
        if (historyRef.current.length > 40) historyRef.current.shift();
        say('Block removed');
      }, [blocks, say]);

      const undo = useCallback(() => {
        const action = historyRef.current.pop();
        if (!action) {
          say('Nothing to undo');
          return;
        }
        if (action.type === 'place') {
          setBlocks((current) => current.filter((block) => !(block.x === action.block.x && block.z === action.block.z && block.y === action.block.y)));
          say('Placement undone');
          return;
        }
        if (action.type === 'remove') {
          setBlocks((current) => [...current, action.block]);
          say('Removal undone');
          return;
        }
        if (action.type === 'clear') {
          setBlocks(action.blocks);
          say('Island restored');
        }
      }, [say]);

      const clear = useCallback(() => {
        if (!confirmClear) {
          setConfirmClear(true);
          return;
        }
        historyRef.current.push({ type: 'clear', blocks });
        if (historyRef.current.length > 40) historyRef.current.shift();
        setBlocks([]);
        setConfirmClear(false);
        say('A fresh meadow');
      }, [blocks, confirmClear, say]);

      const select = useCallback((id) => {
        const item = derived.allItems.find((entry) => entry.id === id);
        if (!item) return;
        if (!item.unlocked) {
          say(`${item.name} unlocks at ${item.unlockText}`);
          return;
        }
        setSelected(id);
      }, [derived.allItems, say]);

      const syncing = !stats.generatedAt && meta.loading;

      return h('div', { className: 'blm-page' },
        h('style', {}, CSS),
        h('div', { className: 'blm-inner' },
          h('header', { className: 'blm-head' },
            h('div', {},
              h('h1', { className: 'blm-title' }, 'Token Bloom'),
              h('p', { className: 'blm-sub' }, 'A pastel 3D sandbox grown from your real token usage.')
            ),
            h('div', { className: 'blm-head-right' },
              h('span', { className: `blm-live${meta.error ? ' is-stale' : ''}` },
                h('i', { className: 'blm-dot' }),
                meta.error ? 'Stale' : 'Live',
                h('span', {}, meta.updatedAt ? timeAgo(meta.updatedAt) : 'syncing')
              ),
              h('span', { className: 'blm-level-pill' }, 'Level ', h('b', {}, derived.level)),
              h('button', { type: 'button', className: 'blm-icon-btn', onClick: refresh, title: 'Refresh usage', 'aria-label': 'Refresh usage' }, h(RefreshIcon))
            )
          ),
          meta.error ? h('div', { className: 'blm-banner' }, `Usage service unavailable: ${meta.error}. The island is still playable with the last known stats.`) : null,
          h('div', { className: 'blm-main' },
            h('div', { className: 'blm-left' },
              h(Stage, {
                blocks,
                selectedItem,
                derived,
                syncing,
                meta,
                onPlace: place,
                onRemove: remove,
                onUndo: undo,
                onSelect: select,
                toast,
              }),
              h(Palette, { items: derived.allItems, selected, onSelect: select, derived })
            ),
            h(ProgressRail, {
              derived,
              stats,
              blocks,
              onUndo: undo,
              onClear: clear,
              confirmClear,
            })
          )
        )
      );
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
        }, () => h(BloomBoundary, null, h(TokenBloomPage))));
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 30,
          label: 'Farm',
        }, BloomIcon));
      },
    };
  },
});
