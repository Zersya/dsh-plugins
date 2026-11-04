window.__ModuleLoader__.load({
  id: '@local/dsh-usage-stats',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useCallback, useEffect, useMemo, useState } = React;

    const PANEL_ID = 'usage-stats';
    const API = '/plugins/dsh-stats/overview';
    const SESSION_API = '/plugins/dsh-stats/session';
    const SESSION_POLL_MS = 10000;
    const BUDGET_KEY = 'dsh.usage-stats.budgetUsd';
    const POLL_MS = 6000;

    const CSS = `
      .dsx-page {
        height:100%; overflow:auto; background:var(--dsw-alias-bg-base);
        color:var(--dsw-alias-label-primary); font-size:13px; line-height:1.45;
        -webkit-font-smoothing:antialiased; color-scheme:dark light;
      }
      .dsx-page *, .dsx-page *::before, .dsx-page *::after { box-sizing:border-box; }
      .dsx-page ::selection { background:var(--dsw-alias-brand-primary); color:var(--dsw-alias-bg-base); }
      .dsx-page::-webkit-scrollbar { width:10px; height:10px; }
      .dsx-page::-webkit-scrollbar-thumb {
        background:var(--dsw-alias-border-l2); border-radius:999px;
        border:3px solid var(--dsw-alias-bg-base);
      }
      .dsx-page :focus-visible { outline:2px solid var(--dsw-alias-label-primary); outline-offset:2px; }
      .dsx-inner { max-width:1120px; margin:0 auto; padding:30px 34px 72px; }
      .dsx-head { display:flex; align-items:flex-start; justify-content:space-between; gap:22px; }
      .dsx-title { margin:0; font-size:27px; line-height:1.08; font-weight:600; letter-spacing:-.03em; }
      .dsx-sub { margin:7px 0 0; color:var(--dsw-alias-label-secondary); font-size:12.5px; }
      .dsx-actions { display:flex; align-items:center; gap:12px; padding-top:4px; flex:0 0 auto; }
      .dsx-live { display:inline-flex; align-items:center; gap:7px; font-size:11.5px; color:var(--dsw-alias-label-secondary); white-space:nowrap; }
      .dsx-dot { width:6px; height:6px; border-radius:50%; background:var(--dsw-alias-state-success-primary); animation:dsx-pulse 2.4s ease-in-out infinite; }
      .dsx-live.is-stale .dsx-dot { background:var(--dsw-alias-state-warn-primary); }
      .dsx-updated { color:var(--dsw-alias-label-secondary); }
      .dsx-icon-btn {
        width:28px; height:28px; display:grid; place-items:center; padding:0;
        border:1px solid var(--dsw-alias-border-l1); border-radius:7px;
        background:transparent; color:var(--dsw-alias-label-secondary); cursor:pointer;
        transition:background .12s ease, color .12s ease;
      }
      .dsx-icon-btn:hover { background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); }
      .dsx-icon-btn:disabled { opacity:.45; cursor:default; }
      .dsx-icon-btn.is-busy svg { animation:dsx-spin 1s linear infinite; }
      .dsx-banner {
        margin-top:16px; padding:8px 10px; border:1px solid var(--dsw-alias-border-l1);
        border-radius:7px; color:var(--dsw-alias-state-warn-primary); font-size:11.5px;
      }
      .dsx-ledger {
        display:grid; grid-template-columns:minmax(0,1fr) 334px; gap:44px;
        margin-top:28px; padding:25px 0 27px;
        border-top:1px solid var(--dsw-alias-border-l1); border-bottom:1px solid var(--dsw-alias-border-l1);
      }
      .dsx-ledger-main { min-width:0; align-self:center; }
      .dsx-total-row { display:flex; align-items:baseline; gap:9px; flex-wrap:wrap; }
      .dsx-total { font-size:clamp(46px,6vw,64px); line-height:.92; font-weight:550; letter-spacing:-.04em; font-variant-numeric:tabular-nums; }
      .dsx-total-unit { font-size:13px; color:var(--dsw-alias-label-secondary); letter-spacing:0; }
      .dsx-total-sub { margin-top:9px; color:var(--dsw-alias-label-secondary); font-size:12px; }
      .dsx-comp { margin-top:22px; }
      .dsx-comp-bar {
        display:flex; height:8px; border-radius:999px; overflow:hidden;
        background:var(--dsw-alias-bg-layer-2);
      }
      .dsx-comp-seg { height:100%; transition:flex-grow .3s ease; }
      .dsx-comp-seg.out { background:var(--dsw-alias-state-warn-primary); }
      .dsx-comp-seg.in { background:var(--dsw-alias-label-primary); opacity:.58; }
      .dsx-comp-seg.cache { background:var(--dsw-alias-label-secondary); opacity:.32; }
      .dsx-legend { display:flex; flex-wrap:wrap; gap:7px 18px; margin-top:9px; color:var(--dsw-alias-label-secondary); font-size:11px; }
      .dsx-legend-item { display:inline-flex; align-items:center; gap:6px; white-space:nowrap; }
      .dsx-swatch { width:7px; height:7px; border-radius:2px; flex:0 0 auto; }
      .dsx-swatch.out { background:var(--dsw-alias-state-warn-primary); }
      .dsx-swatch.in { background:var(--dsw-alias-label-primary); opacity:.58; }
      .dsx-swatch.cache { background:var(--dsw-alias-label-secondary); opacity:.32; }
      .dsx-swatch.system { background:var(--dsw-alias-label-primary); opacity:.82; }
      .dsx-swatch.process { background:var(--dsw-alias-state-warn-primary); }
      .dsx-figures { display:grid; align-content:start; border-left:1px solid var(--dsw-alias-border-l1); padding-left:24px; }
      .dsx-figure { padding:12px 0; border-bottom:1px solid var(--dsw-alias-border-l1); }
      .dsx-figure:first-child { padding-top:0; }
      .dsx-figure:last-child { border-bottom:0; padding-bottom:0; }
      .dsx-figure-label { color:var(--dsw-alias-label-secondary); font-size:11px; }
      .dsx-figure-value { margin-top:3px; font-size:21px; font-weight:550; letter-spacing:-.025em; font-variant-numeric:tabular-nums; }
      .dsx-figure-value.is-over { color:var(--dsw-alias-state-error-primary); }
      .dsx-figure-note { margin-top:2px; color:var(--dsw-alias-label-secondary); font-size:10.5px; }
      .dsx-grid-main { display:grid; grid-template-columns:minmax(0,1fr) 334px; gap:44px; margin-top:30px; }
      .dsx-panel { min-width:0; padding-top:19px; border-top:1px solid var(--dsw-alias-border-l1); }
      .dsx-sec-head { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:10px 14px; min-height:28px; }
      .dsx-sec-title { margin:0; font-size:14px; line-height:1.25; font-weight:600; letter-spacing:-.01em; }
      .dsx-sec-meta { margin:3px 0 0; color:var(--dsw-alias-label-secondary); font-size:11px; }
      .dsx-seg { display:inline-flex; padding:2px; border:1px solid var(--dsw-alias-border-l1); border-radius:7px; background:var(--dsw-alias-bg-layer-1); flex:0 0 auto; }
      .dsx-seg button {
        appearance:none; border:0; background:transparent; color:var(--dsw-alias-label-secondary);
        font:inherit; font-size:11px; line-height:1; padding:5px 9px; border-radius:5px; cursor:pointer;
      }
      .dsx-seg button[aria-pressed="true"] { background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); }
      .dsx-chart { position:relative; margin-top:16px; }
      .dsx-chart svg { display:block; width:100%; height:auto; overflow:visible; }
      .dsx-gridline { stroke:var(--dsw-alias-border-l1); stroke-width:1; stroke-dasharray:2 5; }
      .dsx-axis { fill:var(--dsw-alias-label-secondary); font-size:9.5px; font-variant-numeric:tabular-nums; }
      .dsx-bar-out { fill:var(--dsw-alias-state-warn-primary); }
      .dsx-bar-in { fill:var(--dsw-alias-label-primary); opacity:.58; }
      .dsx-bar-cache { fill:var(--dsw-alias-label-secondary); opacity:.32; }
      .dsx-hover { fill:transparent; cursor:crosshair; }
      .dsx-hover:focus { outline:none; stroke:var(--dsw-alias-label-primary); stroke-width:1.5; }
      .dsx-tip {
        position:absolute; top:2px; z-index:2; min-width:178px; pointer-events:none;
        padding:9px 10px; border:1px solid var(--dsw-alias-border-l2); border-radius:7px;
        background:var(--dsw-alias-bg-overlay); color:var(--dsw-alias-label-primary);
        box-shadow:0 10px 26px -14px rgba(0,0,0,.62);
      }
      .dsx-tip.left { transform:translateX(-102%); }
      .dsx-tip.right { transform:translateX(2%); }
      .dsx-tip.center { transform:translateX(-50%); }
      .dsx-tip-time { color:var(--dsw-alias-label-secondary); font-size:10.5px; margin-bottom:6px; }
      .dsx-tip-row { display:grid; grid-template-columns:8px minmax(0,1fr) auto auto; gap:6px; align-items:center; font-size:10.5px; margin-top:3px; }
      .dsx-tip-row b { font-weight:550; font-variant-numeric:tabular-nums; }
      .dsx-tip-row span { color:var(--dsw-alias-label-secondary); font-variant-numeric:tabular-nums; }
      .dsx-tip-total { display:grid; grid-template-columns:minmax(0,1fr) auto auto; gap:6px; align-items:center; margin-top:7px; padding-top:7px; border-top:1px solid var(--dsw-alias-border-l1); font-size:11px; }
      .dsx-tip-total b { font-weight:600; font-variant-numeric:tabular-nums; }
      .dsx-tip-total span { color:var(--dsw-alias-label-secondary); font-variant-numeric:tabular-nums; }
      .dsx-tip-sessions { margin-top:4px; color:var(--dsw-alias-label-secondary); font-size:10px; }
      .dsx-chart-foot { margin-top:8px; color:var(--dsw-alias-label-secondary); font-size:10.5px; }
      .dsx-budget-field { display:inline-flex; align-items:center; gap:4px; border-bottom:1px solid var(--dsw-alias-border-l2); padding:1px 0; }
      .dsx-budget-field > span { color:var(--dsw-alias-label-secondary); font-size:10.5px; }
      .dsx-budget-field b { color:var(--dsw-alias-label-secondary); font-weight:400; font-size:11px; }
      .dsx-budget-field input {
        width:50px; border:0; background:transparent; color:var(--dsw-alias-label-primary);
        font:inherit; font-size:11.5px; text-align:right; padding:0; caret-color:var(--dsw-alias-label-primary);
        font-variant-numeric:tabular-nums;
      }
      .dsx-budget-field input::-webkit-inner-spin-button,
      .dsx-budget-field input::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
      .dsx-budget-spent { display:flex; align-items:baseline; gap:8px; margin-top:17px; }
      .dsx-budget-spent strong { font-size:35px; line-height:1; font-weight:550; letter-spacing:-.035em; font-variant-numeric:tabular-nums; }
      .dsx-budget-spent span { color:var(--dsw-alias-label-secondary); font-size:11.5px; }
      .dsx-meter { position:relative; height:9px; margin-top:15px; border-radius:999px; background:var(--dsw-alias-bg-layer-2); overflow:hidden; }
      .dsx-meter-fill { height:100%; border-radius:999px; background:var(--dsw-alias-state-warn-primary); transition:width .35s ease; }
      .dsx-meter-fill.is-over { background:var(--dsw-alias-state-error-primary); }
      .dsx-meter-tick { position:absolute; top:0; bottom:0; width:1px; background:var(--dsw-alias-bg-base); opacity:.55; }
      .dsx-meter-labels { display:flex; justify-content:space-between; margin-top:6px; color:var(--dsw-alias-label-secondary); font-size:10px; font-variant-numeric:tabular-nums; }
      .dsx-budget-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px 18px; margin-top:19px; }
      .dsx-stat-label { color:var(--dsw-alias-label-secondary); font-size:10.5px; }
      .dsx-stat-value { margin-top:2px; font-size:13px; font-weight:550; font-variant-numeric:tabular-nums; }
      .dsx-stat-value.is-over { color:var(--dsw-alias-state-error-primary); }
      .dsx-note { margin:16px 0 0; color:var(--dsw-alias-label-secondary); font-size:10.5px; line-height:1.5; }
      .dsx-note a { color:var(--dsw-alias-label-primary); text-decoration:none; border-bottom:1px solid var(--dsw-alias-border-l2); }
      .dsx-note a:hover { border-bottom-color:var(--dsw-alias-label-primary); }
      @media (max-width: 820px) {
        .dsx-week-axis, .dsx-week-row { grid-template-columns:86px minmax(0,1fr) 104px; }
        .dsx-week-axis > span:first-child { font-size:9px; }
        .dsx-ledger { grid-template-columns:minmax(0,1fr); gap:22px; }
        .dsx-figures { border-left:0; padding-left:0; }
        .dsx-grid-main, .dsx-detail { grid-template-columns:minmax(0,1fr); }
      }
      .dsx-cpu-figures { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:18px; margin-top:17px; }
      .dsx-cpu-value { font-size:25px; line-height:1; font-weight:550; letter-spacing:-.03em; font-variant-numeric:tabular-nums; }
      .dsx-cpu-label { margin-top:4px; color:var(--dsw-alias-label-secondary); font-size:10.5px; }
      .dsx-cpu-chart { margin-top:15px; }
      .dsx-cpu-chart svg { display:block; width:100%; height:auto; }
      .dsx-cpu-foot { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px; margin-top:9px; color:var(--dsw-alias-label-secondary); font-size:10.5px; }
      .dsx-cost-top { display:flex; align-items:flex-end; justify-content:space-between; gap:18px; margin-top:17px; }
      .dsx-cost-blend { font-size:31px; line-height:1; font-weight:550; letter-spacing:-.035em; font-variant-numeric:tabular-nums; }
      .dsx-cost-unit { margin-top:5px; color:var(--dsw-alias-label-secondary); font-size:10.5px; }
      .dsx-cost-total { text-align:right; font-size:17px; font-weight:550; font-variant-numeric:tabular-nums; }
      .dsx-cost-total span { display:block; margin-top:4px; color:var(--dsw-alias-label-secondary); font-size:10px; font-weight:400; }
      .dsx-cost-rows { margin-top:15px; }
      .dsx-cost-row { padding:9px 0 10px; border-top:1px solid var(--dsw-alias-border-l1); }
      .dsx-cost-row-head { display:flex; align-items:baseline; justify-content:space-between; gap:10px; font-size:11.5px; }
      .dsx-cost-row-head span { color:var(--dsw-alias-label-secondary); font-size:10.5px; font-variant-numeric:tabular-nums; }
      .dsx-cost-row-head b { font-weight:550; font-variant-numeric:tabular-nums; }
      .dsx-cost-track { height:3px; margin-top:7px; border-radius:999px; background:var(--dsw-alias-bg-layer-2); overflow:hidden; }
      .dsx-cost-fill { height:100%; border-radius:999px; background:var(--dsw-alias-label-secondary); }
      .dsx-cost-fill.out { background:var(--dsw-alias-state-warn-primary); }
      .dsx-cost-fill.in { background:var(--dsw-alias-label-primary); opacity:.58; }
      .dsx-cost-fill.cache { background:var(--dsw-alias-label-secondary); opacity:.32; }
      .dsx-rate { margin-top:26px; padding:18px 20px 17px; border:1px solid var(--dsw-alias-border-l1); border-radius:10px; background:var(--dsw-alias-bg-layer-1); }
      .dsx-rate-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
      .dsx-rate-clock { display:flex; align-items:baseline; gap:9px; }
      .dsx-rate-time { font-size:24px; line-height:1; font-weight:550; letter-spacing:-.03em; font-variant-numeric:tabular-nums; }
      .dsx-rate-zone { color:var(--dsw-alias-label-secondary); font-size:10.5px; }
      .dsx-rate-sub { margin-top:7px; color:var(--dsw-alias-label-secondary); font-size:11px; }
      .dsx-rate-chip { display:inline-flex; align-items:center; gap:7px; padding:4px 10px; border:1px solid currentColor; border-radius:999px; font-size:10.5px; font-weight:550; white-space:nowrap; }
      .dsx-rate-chip.is-peak { color:var(--dsw-alias-state-warn-primary); }
      .dsx-rate-chip.is-off { color:var(--dsw-alias-state-success-primary); }
      .dsx-rate-chip i { width:6px; height:6px; border-radius:50%; background:currentColor; }
      .dsx-rate-body { display:grid; grid-template-columns:repeat(auto-fit,minmax(215px,1fr)); gap:16px 26px; margin-top:17px; padding-top:15px; border-top:1px solid var(--dsw-alias-border-l1); }
      .dsx-rate-label { color:var(--dsw-alias-label-secondary); font-size:10px; letter-spacing:.045em; text-transform:uppercase; }
      .dsx-rate-value { margin-top:5px; font-size:13px; font-weight:550; font-variant-numeric:tabular-nums; }
      .dsx-rate-meta { margin-top:3px; color:var(--dsw-alias-label-secondary); font-size:10.5px; }
      .dsx-rate-split { margin-top:16px; padding-top:14px; border-top:1px solid var(--dsw-alias-border-l1); }
      .dsx-rate-split-bar { display:flex; height:7px; margin-top:9px; border-radius:999px; background:var(--dsw-alias-bg-layer-2); overflow:hidden; }
      .dsx-rate-split-seg { height:100%; }
      .dsx-rate-split-seg.peak { background:var(--dsw-alias-state-warn-primary); }
      .dsx-rate-split-seg.off { background:var(--dsw-alias-state-success-primary); }
      .dsx-rate-split-legend { display:flex; flex-wrap:wrap; gap:6px 20px; margin-top:8px; color:var(--dsw-alias-label-secondary); font-size:10.5px; }
      .dsx-rate-split-legend b { color:var(--dsw-alias-label-primary); font-weight:550; font-variant-numeric:tabular-nums; }
      .dsx-week { margin-top:16px; padding-top:14px; border-top:1px solid var(--dsw-alias-border-l1); }
      .dsx-week-axis { display:grid; grid-template-columns:104px minmax(0,1fr) 122px; gap:10px; color:var(--dsw-alias-label-secondary); font-size:9.5px; }
      .dsx-week-axis-track { display:flex; justify-content:space-between; font-variant-numeric:tabular-nums; }
      .dsx-week-row { display:grid; grid-template-columns:104px minmax(0,1fr) 122px; gap:10px; align-items:center; margin-top:5px; }
      .dsx-week-day { color:var(--dsw-alias-label-secondary); font-size:10.5px; white-space:nowrap; font-variant-numeric:tabular-nums; }
      .dsx-week-row.is-today .dsx-week-day { color:var(--dsw-alias-label-primary); font-weight:550; }
      .dsx-week-track { position:relative; height:12px; border-radius:4px; background:var(--dsw-alias-bg-layer-2); overflow:hidden; }
      .dsx-week-seg { position:absolute; top:0; bottom:0; background:var(--dsw-alias-state-warn-primary); opacity:.78; }
      .dsx-week-row.is-today .dsx-week-seg { opacity:1; }
      .dsx-week-now { position:absolute; top:-1px; bottom:-1px; width:1.5px; margin-left:.75px; background:var(--dsw-alias-label-primary); }
      .dsx-week-meta { color:var(--dsw-alias-label-secondary); font-size:10px; text-align:right; white-space:nowrap; font-variant-numeric:tabular-nums; }
      .dsx-conv-head { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; }
      .dsx-table-head {
        display:grid; grid-template-columns:minmax(0,1fr) 94px 86px 76px 84px 16px; gap:14px;
        margin-top:15px; padding:0 10px 7px; border-bottom:1px solid var(--dsw-alias-border-l1);
        color:var(--dsw-alias-label-secondary); font-size:10px; letter-spacing:.055em; text-transform:uppercase;
      }
      .dsx-table-head > span:nth-child(n+2) { text-align:right; }
      .dsx-row {
        appearance:none; width:100%; display:grid; grid-template-columns:minmax(0,1fr) 94px 86px 76px 84px 16px;
        gap:14px; align-items:center; text-align:left; border:0; border-bottom:1px solid var(--dsw-alias-border-l1);
        background:transparent; color:inherit; font:inherit; padding:13px 10px; margin:0; cursor:pointer;
        transition:background .12s ease;
      }
      .dsx-row:hover { background:var(--dsw-alias-bg-layer-1); }
      .dsx-cell-conv { text-align:left; min-width:0; }
      .dsx-conv-title { font-size:12.5px; font-weight:550; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .dsx-conv-meta { margin-top:3px; color:var(--dsw-alias-label-secondary); font-size:10.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .dsx-cell { text-align:right; font-size:11.5px; font-variant-numeric:tabular-nums; white-space:nowrap; }
      .dsx-cell-main { font-weight:550; }
      .dsx-cell-sub { margin-top:3px; color:var(--dsw-alias-label-secondary); font-size:10px; }
      .dsx-share { display:inline-flex; align-items:center; gap:7px; }
      .dsx-share-track { width:28px; height:3px; border-radius:999px; background:var(--dsw-alias-bg-layer-2); overflow:hidden; }
      .dsx-share-fill { height:100%; border-radius:999px; background:var(--dsw-alias-label-secondary); opacity:.55; }
      .dsx-cell-chev { display:grid; place-items:center; color:var(--dsw-alias-label-secondary); transition:transform .16s ease; }
      .dsx-cell-chev.is-open { transform:rotate(90deg); }
      .dsx-detail {
        display:grid; grid-template-columns:minmax(0,1fr) minmax(270px,1.08fr); gap:34px;
        padding:17px 10px 23px; margin:0; border-bottom:1px solid var(--dsw-alias-border-l1);
        background:var(--dsw-alias-bg-layer-1);
      }
      .dsx-detail-label { display:flex; align-items:baseline; justify-content:space-between; gap:10px; color:var(--dsw-alias-label-secondary); font-size:10.5px; }
      .dsx-detail-label b { color:var(--dsw-alias-label-primary); font-size:11px; font-weight:550; }
      .dsx-mini { display:flex; align-items:flex-end; gap:3px; height:66px; margin-top:9px; }
      .dsx-mini-bar { flex:1 1 0; min-width:2px; min-height:1px; border-radius:2px 2px 0 0; background:var(--dsw-alias-label-secondary); opacity:.42; }
      .dsx-mini-bar.is-last { background:var(--dsw-alias-state-warn-primary); opacity:.95; }
      .dsx-mini-axis { display:flex; justify-content:space-between; margin-top:6px; color:var(--dsw-alias-label-secondary); font-size:9.5px; font-variant-numeric:tabular-nums; }
      .dsx-facts { display:grid; grid-template-columns:1fr 1fr; gap:11px 18px; margin:0; }
      .dsx-facts dt { color:var(--dsw-alias-label-secondary); font-size:10px; }
      .dsx-facts dd { margin:2px 0 0; font-size:12px; font-weight:550; font-variant-numeric:tabular-nums; }
      .dsx-model-line { display:flex; flex-wrap:wrap; gap:6px; margin-top:14px; }
      .dsx-chip { padding:2px 7px; border:1px solid var(--dsw-alias-border-l1); border-radius:999px; color:var(--dsw-alias-label-secondary); font-size:10px; }
      .dsx-empty { padding:34px 0; color:var(--dsw-alias-label-secondary); font-size:12px; }
      .dsx-state { min-height:64vh; display:grid; place-items:center; text-align:center; padding:30px; }
      .dsx-state-title { font-size:18px; font-weight:600; letter-spacing:-.02em; }
      .dsx-state-body { margin-top:7px; color:var(--dsw-alias-label-secondary); font-size:12px; max-width:420px; }
      .dsx-retry {
        margin-top:16px; appearance:none; border:1px solid var(--dsw-alias-border-l2); border-radius:7px;
        background:transparent; color:var(--dsw-alias-label-primary); font:inherit; font-size:11.5px;
        padding:6px 12px; cursor:pointer;
      }
      .dsx-retry:hover { background:var(--dsw-alias-bg-layer-2); }
      .dsx-skel { border-radius:6px; background:var(--dsw-alias-bg-layer-2); animation:dsx-pulse 1.8s ease-in-out infinite; }
      .dsx-skel-wrap { padding-top:34px; }
      @keyframes dsx-pulse { 0%,100% { opacity:.45 } 50% { opacity:1 } }
      @keyframes dsx-spin { to { transform:rotate(360deg) } }
      @media (max-width:1000px) {
        .dsx-ledger, .dsx-grid-main { grid-template-columns:minmax(0,1fr); gap:28px; }
        .dsx-figures { grid-template-columns:repeat(4,minmax(0,1fr)); border-left:0; padding-left:0; border-top:1px solid var(--dsw-alias-border-l1); padding-top:13px; }
        .dsx-figure { padding:0; border-bottom:0; }
        .dsx-figure-value { font-size:18px; }
        .dsx-detail { grid-template-columns:minmax(0,1fr); gap:22px; }
      }
      @media (max-width:760px) {
        .dsx-inner { padding:22px 18px 56px; }
        .dsx-head { flex-direction:column; gap:12px; }
        .dsx-actions { padding-top:0; }
        .dsx-title { font-size:24px; }
        .dsx-ledger { gap:22px; padding:21px 0 23px; }
        .dsx-figures { grid-template-columns:1fr 1fr; }
        .dsx-figure { padding:9px 0; border-bottom:1px solid var(--dsw-alias-border-l1); }
        .dsx-table-head { display:none; }
        .dsx-row { grid-template-columns:minmax(0,1fr) auto 16px; gap:10px; padding:13px 5px; margin:0; }
        .dsx-cell-tokens, .dsx-cell-share, .dsx-cell-last { display:none; }
        .dsx-cell-cost { grid-column:2; }
        .dsx-cell-chev { grid-column:3; }
        .dsx-detail { margin:0; padding:16px 5px 20px; }
        .dsx-cost-top { align-items:flex-start; flex-direction:column; gap:10px; }
        .dsx-cost-total { text-align:left; }
        .dsx-cpu-figures { gap:10px; }
        .dsx-cpu-value { font-size:21px; }
        .dsx-tip { display:none; }
      }
      @media (max-width:520px) {
        .dsx-figures { grid-template-columns:1fr; }
        .dsx-figure:last-child { grid-column:auto; }
        .dsx-figure { padding:9px 0; border-bottom:1px solid var(--dsw-alias-border-l1); }
        .dsx-cpu-figures { grid-template-columns:1fr 1fr; }
        .dsx-cpu-figures > div:last-child { grid-column:1 / -1; }
        .dsx-budget-grid { grid-template-columns:1fr 1fr; }
      }
      @media (prefers-reduced-motion:reduce) {
        .dsx-dot, .dsx-skel { animation:none; }
        .dsx-icon-btn.is-busy svg { animation:none; }
        .dsx-comp-seg, .dsx-meter-fill, .dsx-cell-chev, .dsx-row { transition:none; }
      }
    `;

    const COST_CSS = `
      .dsx-cost {
        display:inline-flex; align-items:baseline; gap:4px;
        color:var(--dsw-alias-label-secondary); font-size:11px; line-height:1.4;
        white-space:nowrap; font-variant-numeric:tabular-nums;
        cursor:default; user-select:none;
      }
      .dsx-cost-value { color:var(--dsw-alias-label-primary); opacity:.82; }
      .dsx-cost.is-stale { opacity:.55; }
    `;

    const integer = new Intl.NumberFormat('en-US');
    const timeFmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
    const dateFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
    const dateTimeFmt = new Intl.DateTimeFormat(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    function trimZero(value) {
      return value.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
    }

    function fmtTokens(value) {
      const n = Number(value) || 0;
      if (n >= 1e9) return `${trimZero((n / 1e9).toFixed(2))}B`;
      if (n >= 1e6) return `${trimZero((n / 1e6).toFixed(n >= 1e7 ? 1 : 2))}M`;
      if (n >= 1e3) return `${trimZero((n / 1e3).toFixed(n >= 1e5 ? 0 : 1))}K`;
      return String(Math.round(n));
    }

    function fmtInt(value) {
      return integer.format(Math.round(Number(value) || 0));
    }

    function fmtUsd(value, fixed) {
      const n = Number(value);
      if (!Number.isFinite(n)) return '—';
      if (fixed !== undefined) return `$${n.toFixed(fixed)}`;
      const abs = Math.abs(n);
      const digits = abs > 0 && abs < 0.01 ? 4 : abs < 1 ? 3 : 2;
      return `$${n.toFixed(digits)}`;
    }

    function fmtPct(value, digits = 1) {
      const n = Number(value);
      if (!Number.isFinite(n)) return '—';
      return `${n.toFixed(digits)}%`;
    }

    function fmtDuration(ms) {
      const n = Math.max(0, Number(ms) || 0);
      if (n < 1000) return '<1s';
      const seconds = Math.round(n / 1000);
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ${String(seconds % 60).padStart(2, '0')}s`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ${String(minutes % 60).padStart(2, '0')}m`;
      return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    }

    function timeAgo(value, now = Date.now()) {
      const n = Number(value);
      if (!Number.isFinite(n)) return '—';
      const delta = Math.max(0, now - n);
      if (delta < 5000) return 'just now';
      if (delta < 60000) return `${Math.floor(delta / 1000)}s ago`;
      if (delta < 3600000) return `${Math.floor(delta / 60000)}m ago`;
      if (delta < 86400000) return `${Math.floor(delta / 3600000)}h ago`;
      if (delta < 7 * 86400000) return `${Math.floor(delta / 86400000)}d ago`;
      return dateFmt.format(new Date(n));
    }

    function formatSpan(from, to) {
      if (!Number.isFinite(from) || !Number.isFinite(to)) return 'No dated activity';
      const a = new Date(from);
      const b = new Date(to);
      const sameDay = a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
      if (sameDay) return `${dateFmt.format(a)}, ${timeFmt.format(a)} – ${timeFmt.format(b)}`;
      return `${dateFmt.format(a)} – ${dateFmt.format(b)}`;
    }

    function formatBucket(value, bucketMs) {
      const date = new Date(value);
      if (bucketMs >= 86400000) return dateFmt.format(date);
      return timeFmt.format(date);
    }

    function formatBucketSize(bucketMs) {
      if (bucketMs >= 7 * 86400000) return 'weekly';
      if (bucketMs >= 86400000) return 'daily';
      if (bucketMs >= 3600000) return 'hourly';
      return `${Math.max(1, Math.round(bucketMs / 60000))}-minute`;
    }

    function modelLabel(model) {
      if (!model || model === 'unknown') return 'Unknown model';
      return model.split('-').map((part, index) => {
        if (index === 0 && part.toLowerCase() === 'deepseek') return 'DeepSeek';
        if (/^v\d+$/i.test(part)) return part.toUpperCase();
        return part.charAt(0).toUpperCase() + part.slice(1);
      }).join(' ');
    }

    function rateLabel(mode) {
      if (mode === 'peak') return 'peak rates';
      if (mode === 'mixed') return 'peak + off-peak rates';
      return 'off-peak rates';
    }

    /* ------------------------------------------------- peak schedule helpers */

    const MS_DAY = 86400000;
    const formatterCache = new Map();

    function formatter(timeZone, options) {
      const key = `${timeZone}|${JSON.stringify(options)}`;
      let cached = formatterCache.get(key);
      if (!cached) {
        cached = new Intl.DateTimeFormat('en-US', { timeZone, ...options });
        formatterCache.set(key, cached);
      }
      return cached;
    }

    function zoneParts(time, timeZone) {
      const parts = formatter(timeZone, {
        hour12: false, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short',
      }).formatToParts(new Date(time));
      const map = {};
      for (const part of parts) if (part.type !== 'literal') map[part.type] = part.value;
      return {
        year: Number(map.year),
        month: Number(map.month),
        day: Number(map.day),
        hour: Number(map.hour) % 24,
        minute: Number(map.minute),
        second: Number(map.second),
      };
    }

    /** Milliseconds the zone is ahead of UTC at `time`. */
    function zoneOffset(time, timeZone) {
      const parts = zoneParts(time, timeZone);
      const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
      return asUtc - Math.floor(time / 1000) * 1000;
    }

    function localDayStart(time, timeZone) {
      const parts = zoneParts(time, timeZone);
      const naive = Date.UTC(parts.year, parts.month - 1, parts.day);
      return naive - zoneOffset(naive - zoneOffset(time, timeZone), timeZone);
    }

    function zoneDayKey(time, timeZone) {
      const parts = zoneParts(time, timeZone);
      return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
    }

    function clockAt(time, timeZone) {
      return formatter(timeZone, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(time));
    }

    function dayAt(time, timeZone) {
      return formatter(timeZone, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(time));
    }

    function zoneName(timeZone, time) {
      try {
        return formatter(timeZone, { timeZoneName: 'short' })
          .formatToParts(new Date(time))
          .find((part) => part.type === 'timeZoneName')?.value ?? '';
      } catch {
        return '';
      }
    }

    /** Peak intervals (UTC ms) for one UTC calendar day, honouring weekends and holidays. */
    function peakDayIntervals(dayKey, windows, holidays) {
      const weekday = new Date(`${dayKey}T00:00:00Z`).getUTCDay();
      if (weekday === 0 || weekday === 6 || holidays.has(dayKey)) return [];
      const [year, month, day] = dayKey.split('-').map(Number);
      return windows.map((window) => ({
        start: Date.UTC(year, month - 1, day, window.startHour),
        end: Date.UTC(year, month - 1, day, window.endHour),
      }));
    }

    function peakIntervals(from, to, windows, holidays) {
      const found = [];
      const first = Math.floor(from / MS_DAY) * MS_DAY - MS_DAY;
      for (let day = first; day <= to + MS_DAY; day += MS_DAY) {
        const key = new Date(day).toISOString().slice(0, 10);
        for (const interval of peakDayIntervals(key, windows, holidays)) found.push(interval);
      }
      return found.sort((a, b) => a.start - b.start);
    }

    function windowText(intervals, dayStart, timeZone) {
      return intervals.map((interval) => (
        `${clockAt(Math.max(interval.start, dayStart), timeZone)}–${clockAt(Math.min(interval.end, dayStart + MS_DAY), timeZone)}`
      )).join(' · ');
    }

    /** Local-time peak windows of the next day that has any (weekends/holidays have none). */
    function upcomingWindowText(schedule, reference) {
      if (!schedule?.windowsUtc?.length) return null;
      const timeZone = schedule.timeZone;
      const windows = schedule.windowsUtc;
      const holidays = new Set(schedule.holidays ?? []);
      for (let index = 0; index < 8; index += 1) {
        const day = localDayStart(reference + index * MS_DAY + MS_DAY / 2, timeZone);
        const intervals = peakIntervals(day, day + MS_DAY, windows, holidays)
          .filter((interval) => interval.end > day && interval.start < day + MS_DAY);
        if (intervals.length) return windowText(intervals, day, timeZone);
      }
      return null;
    }

    /**
     * Everything the rate clock shows: current mode, the next switch, today's
     * windows, and the next seven local days, all in the Host's timezone.
     */
    function scheduleView(schedule, now) {
      const timeZone = schedule.timeZone;
      const windows = schedule.windowsUtc ?? [];
      const holidays = new Set(schedule.holidays ?? []);
      const holidayZone = schedule.holidayTimeZone || 'Asia/Shanghai';
      const today = localDayStart(now, timeZone);
      const todayIntervals = peakIntervals(today, today + MS_DAY, windows, holidays)
        .filter((interval) => interval.end > today && interval.start < today + MS_DAY);

      let current = null;
      for (const interval of peakDayIntervals(new Date(now).toISOString().slice(0, 10), windows, holidays)) {
        if (now >= interval.start && now < interval.end) {
          current = interval;
          break;
        }
      }

      let next = null;
      if (current) {
        next = { at: current.end, peak: false };
      } else {
        const upcoming = peakIntervals(now, now + 8 * MS_DAY, windows, holidays)
          .filter((interval) => interval.start > now)[0];
        if (upcoming) next = { at: upcoming.start, peak: true };
      }

      const todayKey = zoneDayKey(today + MS_DAY / 2, holidayZone);
      const weekday = new Date(`${todayKey}T00:00:00Z`).getUTCDay();
      const offReason = holidays.has(todayKey)
        ? 'Chinese public holiday — off-peak all day'
        : weekday === 0 || weekday === 6
          ? 'Weekend — off-peak all day'
          : 'No peak window today';

      const week = [];
      for (let index = 0; index < 7; index += 1) {
        const dayStart = localDayStart(today + index * MS_DAY + MS_DAY / 2, timeZone);
        const dayEnd = dayStart + MS_DAY;
        const intervals = peakIntervals(dayStart, dayEnd, windows, holidays)
          .filter((interval) => interval.end > dayStart && interval.start < dayEnd);
        const key = zoneDayKey(dayStart + MS_DAY / 2, holidayZone);
        const dayWeekday = new Date(`${key}T00:00:00Z`).getUTCDay();
        week.push({
          key,
          today: index === 0,
          label: formatter(timeZone, { weekday: 'short' }).format(new Date(dayStart)),
          date: formatter(timeZone, { day: 'numeric' }).format(new Date(dayStart)),
          segments: intervals.map((interval) => ({
            left: (Math.max(interval.start, dayStart) - dayStart) / MS_DAY * 100,
            width: (Math.min(interval.end, dayEnd) - Math.max(interval.start, dayStart)) / MS_DAY * 100,
          })),
          meta: intervals.length
            ? windowText(intervals, dayStart, timeZone)
            : holidays.has(key)
              ? 'holiday · off-peak'
              : dayWeekday === 0 || dayWeekday === 6
                ? 'weekend · off-peak'
                : 'off-peak',
        });
      }

      return {
        timeZone,
        peak: Boolean(current),
        next,
        todayStart: today,
        todayIntervals,
        todayText: todayIntervals.length ? windowText(todayIntervals, today, timeZone) : null,
        offReason,
        week,
        nowPct: (now - today) / MS_DAY * 100,
      };
    }

    /* ------------------------------------------------------------------ rate clock */

    function RateClock({ pricing }) {
      const schedule = pricing?.schedule;
      const [now, setNow] = useState(() => Date.now());

      useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
      }, []);

      if (!schedule) return null;

      const view = scheduleView(schedule, now);
      const spend = pricing.spend;
      const total = spend ? spend.peakUsd + spend.offPeakUsd : 0;
      const peakShare = total > 0 ? spend.peakUsd / total * 100 : 0;
      const next = view.next;
      const windowsText = upcomingWindowText(schedule, now);

      return h('section', { className: 'dsx-rate', 'aria-label': 'DeepSeek rate clock' },
        h('div', { className: 'dsx-rate-head' },
          h('div', {},
            h('div', { className: 'dsx-rate-clock' },
              h('span', { className: 'dsx-rate-time' }, clockAt(now, view.timeZone)),
              h('span', { className: 'dsx-rate-zone' }, `${zoneName(view.timeZone, now)} · ${view.timeZone}`)
            ),
            h('div', { className: 'dsx-rate-sub' },
              view.peak
                ? `Peak pricing is live — ${pricing.peakMultiplier}× the off-peak list rate.`
                : 'Off-peak pricing — half the peak list rate.'
            )
          ),
          h('span', { className: `dsx-rate-chip ${view.peak ? 'is-peak' : 'is-off'}` },
            h('i', {}),
            view.peak ? 'Peak now' : 'Off-peak now'
          )
        ),
        h('div', { className: 'dsx-rate-body' },
          h('div', {},
            h('div', { className: 'dsx-rate-label' }, 'Next change'),
            h('div', { className: 'dsx-rate-value' },
              next ? `${next.peak ? 'Peak' : 'Off-peak'} in ${fmtDuration(next.at - now)}` : 'No change scheduled'
            ),
            h('div', { className: 'dsx-rate-meta' },
              next ? `${next.peak ? 'Peak starts' : 'Off-peak starts'} ${dayAt(next.at, view.timeZone)}` : '—'
            )
          ),
          h('div', {},
            h('div', { className: 'dsx-rate-label' }, 'Peak windows today'),
            h('div', { className: 'dsx-rate-value' }, view.todayText ?? 'None'),
            h('div', { className: 'dsx-rate-meta' },
              view.todayText ? `Your time · ${view.timeZone}` : view.offReason
            )
          ),
          h('div', {},
            h('div', { className: 'dsx-rate-label' }, 'Peak windows (UTC)'),
            h('div', { className: 'dsx-rate-value' },
              schedule.windowsUtc.map((window) => (
                `${String(window.startHour).padStart(2, '0')}:00–${String(window.endHour).padStart(2, '0')}:00`
              )).join(' · ')
            ),
            h('div', { className: 'dsx-rate-meta' }, 'DeepSeek bills Mon–Fri, China holidays excluded')
          )
        ),
        total > 0
          ? h('div', { className: 'dsx-rate-split' },
              h('div', { className: 'dsx-rate-label' }, 'Spend by rate'),
              h('div', {
                className: 'dsx-rate-split-bar',
                role: 'img',
                'aria-label': `Peak ${fmtPct(peakShare)} of spend, off-peak ${fmtPct(100 - peakShare)}.`,
              },
                h('div', { className: 'dsx-rate-split-seg peak', style: { width: `${peakShare}%` } }),
                h('div', { className: 'dsx-rate-split-seg off', style: { width: `${100 - peakShare}%` } })
              ),
              h('div', { className: 'dsx-rate-split-legend' },
                h('span', {}, 'Peak ', h('b', {}, fmtUsd(spend.peakUsd)), ` · ${fmtPct(peakShare)} of spend`),
                h('span', {}, 'Off-peak ', h('b', {}, fmtUsd(spend.offPeakUsd))),
                h('span', {}, 'Peak premium ', h('b', {}, fmtUsd(spend.peakPremiumUsd)), ' vs off-peak rates')
              )
            )
          : null,
        h('div', { className: 'dsx-week' },
          h('div', { className: 'dsx-week-axis' },
            h('span', {}, 'Next 7 days'),
            h('div', { className: 'dsx-week-axis-track' },
              ['00', '06', '12', '18', '24'].map((hour) => h('span', { key: hour }, hour))
            ),
            h('span', { style: { textAlign: 'right' } }, 'Peak hours')
          ),
          view.week.map((day) => h('div', { key: day.key, className: `dsx-week-row${day.today ? ' is-today' : ''}` },
            h('span', { className: 'dsx-week-day' }, day.today ? `${day.label} ${day.date} · today` : `${day.label} ${day.date}`),
            h('div', { className: 'dsx-week-track' },
              day.segments.map((segment, index) => h('span', {
                key: index,
                className: 'dsx-week-seg',
                style: { left: `${segment.left}%`, width: `${segment.width}%` },
              })),
              day.today ? h('span', { className: 'dsx-week-now', style: { left: `${view.nowPct}%` } }) : null
            ),
            h('span', { className: 'dsx-week-meta' }, day.meta)
          ))
        ),
        h('p', { className: 'dsx-note' },
          'DeepSeek bills peak rates at 01:00–04:00 and 06:00–10:00 UTC, Monday–Friday, excluding Chinese public holidays; every other hour is off-peak at half the peak rate. ',
          windowsText ? `In ${view.timeZone} that is ${windowsText}. ` : '',
          h('a', { href: 'https://api-docs.deepseek.com/quick_start/pricing', target: '_blank', rel: 'noreferrer' }, 'Source'),
          '.'
        )
      );
    }

    function readBudget() {
      try {
        const raw = window.localStorage.getItem(BUDGET_KEY);
        const value = Number(raw);
        if (Number.isFinite(value) && value > 0) return value;
      } catch {}
      return 5;
    }

    function writeBudget(value) {
      try {
        window.localStorage.setItem(BUDGET_KEY, String(value));
      } catch {}
    }

    function useOverview(budget) {
      const [state, setState] = useState({ data: null, error: null, loading: true, updatedAt: 0 });
      const [tick, setTick] = useState(0);

      useEffect(() => {
        let active = true;
        let timer;
        const controller = new AbortController();

        const run = async () => {
          if (!active) return;
          setState((current) => (current.data ? current : { ...current, loading: true }));
          try {
            const response = await fetch(`${API}?budgetUsd=${encodeURIComponent(budget)}`, {
              cache: 'no-store',
              signal: controller.signal,
            });
            if (!response.ok) {
              const text = await response.text();
              throw new Error(text || `HTTP ${response.status}`);
            }
            const data = await response.json();
            if (!active) return;
            setState({
              data,
              error: null,
              loading: false,
              updatedAt: Number(data.generatedAt) || Date.now(),
            });
          } catch (error) {
            if (!active || error?.name === 'AbortError') return;
            setState((current) => ({
              ...current,
              loading: false,
              error: String(error?.message || error || 'Could not read usage data'),
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
      }, [budget, tick]);

      const refresh = useCallback(() => setTick((value) => value + 1), []);
      return [state, refresh];
    }

    /**
     * One conversation's live spend, polled on its own lightweight route so the
     * composer chip never triggers a whole-ledger scan.
     */
    function useSessionCost(sessionId) {
      const [state, setState] = useState({ sessionId: null, data: null, error: null, updatedAt: 0 });

      useEffect(() => {
        if (!sessionId) return undefined;
        let active = true;
        let timer;
        const controller = new AbortController();
        // A switch must never render the previous conversation's spend.
        setState({ sessionId, data: null, error: null, updatedAt: 0 });

        const run = async () => {
          if (!active) return;
          try {
            const response = await fetch(`${SESSION_API}?session=${encodeURIComponent(sessionId)}`, {
              cache: 'no-store',
              credentials: 'same-origin',
              signal: controller.signal,
            });
            if (!response.ok) {
              const text = await response.text();
              throw new Error(text || `HTTP ${response.status}`);
            }
            const data = await response.json();
            if (!active) return;
            setState({ sessionId, data, error: null, updatedAt: Number(data.generatedAt) || Date.now() });
          } catch (error) {
            if (!active || error?.name === 'AbortError') return;
            setState((current) => (current.sessionId === sessionId
              ? { ...current, error: String(error?.message || error) }
              : current));
          } finally {
            if (active) timer = setTimeout(run, SESSION_POLL_MS);
          }
        };

        run();
        return () => {
          active = false;
          controller.abort();
          clearTimeout(timer);
        };
      }, [sessionId]);

      // Ignore the render between a sessionId prop change and the reset above.
      return state.sessionId === sessionId
        ? state
        : { sessionId, data: null, error: null, updatedAt: 0 };
    }

    /**
     * Ambient composer-dock chip: the current conversation's estimated spend
     * beside the token count. Hidden until the conversation has a priced call.
     */
    function SessionCostChip({ sessionId }) {
      const state = useSessionCost(sessionId);
      const data = state.data;

      if (!data || !data.usageCalls) return null;

      const cost = Number(data.cost?.totalUsd) || 0;
      const tokens = data.tokens ?? {};
      const rate = data.rate ?? {};
      const mode = rate.mode === 'peak' ? 'peak' : rate.mode === 'mixed' ? 'peak + off-peak' : 'off-peak';
      const tip = [
        `Session cost ${fmtUsd(cost)} (${mode} rates)`,
        `${fmtInt(data.usageCalls)} model calls · ${fmtTokens(tokens.total)} tokens`,
        `Peak ${fmtUsd(rate.peakUsd)} · off-peak ${fmtUsd(rate.offPeakUsd)}`,
        'Estimated from DeepSeek list prices; token-only.',
      ].join('\n');

      return h('span', {
        className: `dsx-cost${state.error ? ' is-stale' : ''}`,
        title: tip,
        'aria-label': `Session cost ${fmtUsd(cost)}`,
      },
        h('style', {}, COST_CSS),
        h('span', { className: 'dsx-cost-value' }, `≈ ${fmtUsd(cost)}`)
      );
    }

    function RefreshIcon() {
      return h('svg', { viewBox: '0 0 16 16', width: 14, height: 14, fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M13.1 6.3A5.4 5.4 0 1 0 13 9.7', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }),
        h('path', { d: 'M13.2 2.9v3.5H9.7', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' })
      );
    }

    function ChevronIcon() {
      return h('svg', { viewBox: '0 0 12 12', width: 11, height: 11, fill: 'none', 'aria-hidden': true },
        h('path', { d: 'm4.5 2.5 3.5 3.5-3.5 3.5', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' })
      );
    }

    function StatsIcon({ size = 16, active = false }) {
      return h('svg', {
        viewBox: '0 0 24 24', width: size, height: size, fill: 'none',
        'aria-hidden': true, style: { display: 'block', opacity: active ? 1 : 0.76 },
      },
        h('path', { d: 'M4.5 19.5h15', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', opacity: 0.5 }),
        h('rect', { x: 5.2, y: 11.4, width: 3.2, height: 6.1, rx: 1, fill: 'currentColor', opacity: 0.55 }),
        h('rect', { x: 10.4, y: 7.2, width: 3.2, height: 10.3, rx: 1, fill: 'currentColor' }),
        h('rect', { x: 15.6, y: 4.2, width: 3.2, height: 13.3, rx: 1, fill: 'currentColor', opacity: 0.34 }),
        h('path', { d: 'M5.5 8.3 10 5.2l4.1 1.5 4.2-3.2', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' })
      );
    }

    function Segmented({ value, onChange, items }) {
      return h('div', { className: 'dsx-seg', role: 'group', 'aria-label': 'Chart measure' },
        items.map((item) => h('button', {
          key: item.value,
          type: 'button',
          'aria-pressed': value === item.value,
          onClick: () => onChange(item.value),
        }, item.label))
      );
    }

    function Swatch({ kind }) {
      return h('i', { className: `dsx-swatch ${kind}`, 'aria-hidden': true });
    }

    function Figure({ label, value, note, over }) {
      return h('div', { className: 'dsx-figure' },
        h('div', { className: 'dsx-figure-label' }, label),
        h('div', { className: `dsx-figure-value${over ? ' is-over' : ''}` }, value),
        note ? h('div', { className: 'dsx-figure-note' }, note) : null
      );
    }

    function CompositionBar({ tokens }) {
      const total = Math.max(1, tokens.total);
      const items = [
        { key: 'out', label: 'Output', value: tokens.output },
        { key: 'in', label: 'Input', value: tokens.input },
        { key: 'cache', label: 'Cache read', value: tokens.cacheRead },
      ];
      return h('div', { className: 'dsx-comp' },
        h('div', {
          className: 'dsx-comp-bar',
          role: 'img',
          'aria-label': `Token composition: ${fmtTokens(tokens.output)} output, ${fmtTokens(tokens.input)} input, ${fmtTokens(tokens.cacheRead)} cache read.`,
        }, items.map((item) => h('span', {
          key: item.key,
          className: `dsx-comp-seg ${item.key}`,
          style: { flexGrow: Math.max(0, item.value), flexBasis: 0, minWidth: item.value > 0 ? 2 : 0 },
        }))),
        h('div', { className: 'dsx-legend' }, items.map((item) => h('span', { key: item.key, className: 'dsx-legend-item' },
          h(Swatch, { kind: item.key }),
          item.label,
          ' ',
          h('b', { style: { fontWeight: 550, color: 'var(--dsw-alias-label-primary)' } }, fmtTokens(item.value))
        )))
      );
    }

    function Ledger({ totals, budget, pricing }) {
      return h('section', { className: 'dsx-ledger', 'aria-label': 'Usage summary' },
        h('div', { className: 'dsx-ledger-main' },
          h('div', { className: 'dsx-total-row' },
            h('span', { className: 'dsx-total', title: `${fmtInt(totals.tokens.total)} tokens` }, fmtTokens(totals.tokens.total)),
            h('span', { className: 'dsx-total-unit' }, 'tokens')
          ),
          h('div', { className: 'dsx-total-sub' },
            `Across ${fmtInt(totals.conversations)} conversations. ${fmtPct(totals.cacheHitRate)} of prompt tokens came from cache.`
          ),
          h(CompositionBar, { tokens: totals.tokens })
        ),
        h('div', { className: 'dsx-figures' },
          h(Figure, {
            label: 'Conversations',
            value: fmtInt(totals.conversations),
            note: `${fmtInt(totals.messages)} messages · ${fmtInt(totals.turns)} turns`,
          }),
          h(Figure, {
            label: 'Estimated spend',
            value: fmtUsd(totals.cost.totalUsd),
            note: `all time · ${rateLabel(pricing.rateMode)}`,
          }),
          h(Figure, {
            label: 'Budget used',
            value: fmtPct(budget.usedPct),
            note: `of ${fmtUsd(budget.monthlyUsd)} this month`,
            over: budget.usedPct > 100,
          }),
          h(Figure, {
            label: 'Active time',
            value: fmtDuration(totals.activeMs),
            note: `${fmtInt(totals.toolCalls)} tool calls`,
          })
        )
      );
    }

    function niceMax(value) {
      if (!Number.isFinite(value) || value <= 0) return 1;
      const exponent = 10 ** Math.floor(Math.log10(value));
      const fraction = value / exponent;
      const step = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
      return step * exponent;
    }

    function TimelineChart({ timeline, totals, mode }) {
      const [hover, setHover] = useState(null);
      const buckets = timeline.buckets ?? [];
      const W = 760;
      const H = 258;
      const M = { l: 50, r: 10, t: 12, b: 27 };
      const plotW = W - M.l - M.r;
      const plotH = H - M.t - M.b;
      const step = plotW / Math.max(1, buckets.length);
      const barW = Math.min(44, step * 0.56);
      const maxValue = Math.max(1, ...buckets.map((bucket) => (
        mode === 'cost' ? bucket.costUsd : bucket.total
      )));
      const scaleMax = niceMax(maxValue);
      const yTicks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => ({
        value: scaleMax * fraction,
        y: M.t + plotH - plotH * fraction,
      }));
      const axisValue = (value) => (mode === 'cost' ? `$${value.toFixed(3)}` : fmtTokens(value));
      const labelEvery = Math.max(1, Math.ceil(buckets.length / 7));

      const segments = (bucket) => (mode === 'cost'
        ? [
            { key: 'out', value: bucket.cost?.outputUsd ?? 0 },
            { key: 'in', value: bucket.cost?.inputUsd ?? 0 },
            { key: 'cache', value: bucket.cost?.cacheUsd ?? 0 },
          ]
        : [
            { key: 'out', value: bucket.output },
            { key: 'in', value: bucket.input },
            { key: 'cache', value: bucket.cacheRead + bucket.cacheWrite },
          ]);

      const tooltipBucket = hover !== null ? buckets[hover] : null;
      const tooltipLeft = hover !== null ? ((M.l + hover * step + step / 2) / W) * 100 : 0;
      const tooltipSide = tooltipLeft < 18 ? 'right' : tooltipLeft > 82 ? 'left' : 'center';

      return h('div', { className: 'dsx-chart' },
        h('svg', {
          viewBox: `0 0 ${W} ${H}`,
          role: 'img',
          'aria-label': `${mode === 'cost' ? 'Estimated cost' : 'Token usage'} timeline over ${buckets.length} intervals.`,
        },
          yTicks.map((tick, index) => h('g', { key: `tick-${index}` },
            h('line', {
              x1: M.l, x2: W - M.r, y1: tick.y, y2: tick.y,
              className: 'dsx-gridline',
            }),
            h('text', {
              x: M.l - 8, y: tick.y + 3, textAnchor: 'end', className: 'dsx-axis',
            }, axisValue(tick.value))
          )),
          buckets.map((bucket, index) => {
            const x = M.l + index * step + (step - barW) / 2;
            const center = M.l + index * step + step / 2;
            let y = M.t + plotH;
            const bars = segments(bucket).map((segment) => {
              const raw = segment.value / scaleMax * plotH;
              const height = segment.value > 0 ? Math.max(1.5, raw) : 0;
              y -= height;
              return h('rect', {
                key: `${bucket.t}-${segment.key}`,
                x,
                y,
                width: barW,
                height,
                rx: 1,
                className: `dsx-bar-${segment.key}`,
              });
            });
            const showLabel = index % labelEvery === 0 || index === buckets.length - 1;
            return h('g', { key: bucket.t },
              bars,
              showLabel ? h('text', {
                x: center, y: H - 7, textAnchor: 'middle', className: 'dsx-axis',
              }, formatBucket(bucket.t, timeline.bucketMs)) : null,
              h('rect', {
                x: M.l + index * step,
                y: M.t,
                width: step,
                height: plotH,
                className: 'dsx-hover',
                tabIndex: 0,
                role: 'img',
                'aria-label': `${formatBucket(bucket.t, timeline.bucketMs)}: ${fmtTokens(bucket.total)} tokens, ${fmtUsd(bucket.costUsd, 4)} estimated cost.`,
                onMouseEnter: () => setHover(index),
                onMouseLeave: () => setHover(null),
                onFocus: () => setHover(index),
                onBlur: () => setHover(null),
              })
            );
          })
        ),
        tooltipBucket ? h('div', {
          className: `dsx-tip ${tooltipSide}`,
          style: { left: `${tooltipLeft}%` },
        },
          h('div', { className: 'dsx-tip-time' }, `${formatBucket(tooltipBucket.t, timeline.bucketMs)} · ${formatBucketSize(timeline.bucketMs)} interval`),
          h('div', { className: 'dsx-tip-row' }, h(Swatch, { kind: 'out' }), h('span', {}, 'Output'), h('b', {}, fmtTokens(tooltipBucket.output)), h('span', {}, fmtUsd(tooltipBucket.cost?.outputUsd ?? 0, 4))),
          h('div', { className: 'dsx-tip-row' }, h(Swatch, { kind: 'in' }), h('span', {}, 'Input'), h('b', {}, fmtTokens(tooltipBucket.input)), h('span', {}, fmtUsd(tooltipBucket.cost?.inputUsd ?? 0, 4))),
          h('div', { className: 'dsx-tip-row' }, h(Swatch, { kind: 'cache' }), h('span', {}, 'Cache'), h('b', {}, fmtTokens(tooltipBucket.cacheRead + tooltipBucket.cacheWrite)), h('span', {}, fmtUsd(tooltipBucket.cost?.cacheUsd ?? 0, 4))),
          h('div', { className: 'dsx-tip-total' }, h('span', {}, 'Total'), h('b', {}, fmtTokens(tooltipBucket.total)), h('span', {}, fmtUsd(tooltipBucket.costUsd, 4))),
          h('div', { className: 'dsx-tip-sessions' }, `${fmtInt(tooltipBucket.sessions)} conversation${tooltipBucket.sessions === 1 ? '' : 's'} · ${fmtInt(tooltipBucket.calls)} responses`)
        ) : null,
        h('div', { className: 'dsx-legend' },
          h('span', { className: 'dsx-legend-item' }, h(Swatch, { kind: 'out' }), 'Output', ' ', h('b', { style: { fontWeight: 550, color: 'var(--dsw-alias-label-primary)' } }, mode === 'cost' ? fmtUsd(totals.cost.outputUsd) : fmtTokens(totals.tokens.output))),
          h('span', { className: 'dsx-legend-item' }, h(Swatch, { kind: 'in' }), 'Input', ' ', h('b', { style: { fontWeight: 550, color: 'var(--dsw-alias-label-primary)' } }, mode === 'cost' ? fmtUsd(totals.cost.inputUsd) : fmtTokens(totals.tokens.input))),
          h('span', { className: 'dsx-legend-item' }, h(Swatch, { kind: 'cache' }), 'Cache read', ' ', h('b', { style: { fontWeight: 550, color: 'var(--dsw-alias-label-primary)' } }, mode === 'cost' ? fmtUsd(totals.cost.cacheUsd) : fmtTokens(totals.tokens.cacheRead)))
        )
      );
    }

    function TimelineSection({ data, mode, setMode }) {
      const { timeline, totals, pricing } = data;
      const buckets = timeline.buckets ?? [];
      return h('section', { className: 'dsx-panel dsx-timeline' },
        h('div', { className: 'dsx-sec-head' },
          h('div', {},
            h('h2', { className: 'dsx-sec-title' }, 'Token timeline'),
            h('p', { className: 'dsx-sec-meta' }, `${formatBucketSize(timeline.bucketMs)} buckets · ${fmtInt(buckets.length)} intervals · ${rateLabel(pricing.rateMode)}`)
          ),
          h(Segmented, {
            value: mode,
            onChange: setMode,
            items: [{ value: 'tokens', label: 'Tokens' }, { value: 'cost', label: 'Cost' }],
          })
        ),
        buckets.length > 0
          ? h(TimelineChart, { timeline, totals, mode })
          : h('div', { className: 'dsx-empty' }, 'No token usage has been recorded yet.'),
        h('p', { className: 'dsx-chart-foot' },
          `Each bar stacks output, input, and cache reads. ${fmtInt(totals.usageCalls)} of ${fmtInt(totals.assistantMessages)} model responses reported usage.`
        )
      );
    }

    function BudgetSection({ budget, draft, setDraft, commitBudget, totals }) {
      const used = Math.max(0, Number(budget.usedPct) || 0);
      const over = used > 100;
      return h('section', { className: 'dsx-panel dsx-budget' },
        h('div', { className: 'dsx-sec-head' },
          h('div', {},
            h('h2', { className: 'dsx-sec-title' }, 'Budget'),
            h('p', { className: 'dsx-sec-meta' }, `${budget.monthLabel} · ${fmtInt(budget.daysLeft)} days left`)
          ),
          h('label', { className: 'dsx-budget-field', title: 'Edit the monthly budget' },
            h('span', {}, 'Monthly'),
            h('b', {}, '$'),
            h('input', {
              type: 'number', min: '0.01', step: '0.01', value: draft,
              'aria-label': 'Monthly budget in US dollars',
              onChange: (event) => setDraft(event.target.value),
              onBlur: commitBudget,
              onKeyDown: (event) => {
                if (event.key === 'Enter') event.currentTarget.blur();
                if (event.key === 'Escape') {
                  setDraft(String(budget.monthlyUsd));
                  event.currentTarget.blur();
                }
              },
            })
          )
        ),
        h('div', { className: 'dsx-budget-spent' },
          h('strong', {}, fmtUsd(budget.spentUsd)),
          h('span', {}, `of ${fmtUsd(budget.monthlyUsd)}`)
        ),
        h('div', {
          className: 'dsx-meter',
          role: 'progressbar',
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': Math.min(100, Math.round(used)),
          'aria-valuetext': `${fmtPct(used)} of monthly budget used`,
        },
          h('div', { className: `dsx-meter-fill${over ? ' is-over' : ''}`, style: { width: `${Math.min(100, used)}%` } }),
          [25, 50, 75].map((tick) => h('span', { key: tick, className: 'dsx-meter-tick', style: { left: `${tick}%` } }))
        ),
        h('div', { className: 'dsx-meter-labels' },
          h('span', {}, '$0'),
          h('span', {}, fmtUsd(budget.monthlyUsd))
        ),
        h('div', { className: 'dsx-budget-grid' },
          h('div', {}, h('div', { className: 'dsx-stat-label' }, 'Remaining'), h('div', { className: 'dsx-stat-value' }, fmtUsd(budget.remainingUsd))),
          h('div', {}, h('div', { className: 'dsx-stat-label' }, 'Projected month'), h('div', { className: `dsx-stat-value${budget.projectedUsd > budget.monthlyUsd ? ' is-over' : ''}` }, fmtUsd(budget.projectedUsd))),
          h('div', {}, h('div', { className: 'dsx-stat-label' }, 'Today'), h('div', { className: 'dsx-stat-value' }, fmtUsd(budget.todayUsd))),
          h('div', {}, h('div', { className: 'dsx-stat-label' }, 'Headroom'), h('div', { className: 'dsx-stat-value' }, `${fmtTokens(budget.headroomTokens)} tokens`))
        ),
        h('p', { className: 'dsx-note' },
          'Projection = month-to-date ÷ elapsed days × days in month. ',
          `At the current blend, the remaining budget covers about ${fmtTokens(budget.headroomTokens)} tokens. Costs are token-only estimates.`
        )
      );
    }

    function CostSection({ totals, pricing }) {
      const cost = totals.cost;
      const windowsText = pricing.schedule ? upcomingWindowText(pricing.schedule, Date.now()) : null;
      const rows = [
        { key: 'out', label: 'Output', value: cost.outputUsd, tokens: totals.tokens.output },
        { key: 'cache', label: 'Cache read', value: cost.cacheUsd, tokens: totals.tokens.cacheRead },
        { key: 'in', label: 'Input (cache miss)', value: cost.inputUsd, tokens: totals.tokens.input + totals.tokens.cacheWrite },
      ];
      const total = Math.max(0.0000001, cost.totalUsd);
      return h('section', { className: 'dsx-panel dsx-cost' },
        h('div', { className: 'dsx-sec-head' },
          h('div', {},
            h('h2', { className: 'dsx-sec-title' }, 'Cost composition'),
            h('p', { className: 'dsx-sec-meta' }, `${fmtPct(totals.cacheHitRate)} cache hit · ${rateLabel(pricing.rateMode)}`)
          )
        ),
        h('div', { className: 'dsx-cost-top' },
          h('div', {},
            h('div', { className: 'dsx-cost-blend' }, fmtUsd(totals.blendedPerMillionUsd, 4)),
            h('div', { className: 'dsx-cost-unit' }, 'per 1M tokens, blended')
          ),
          h('div', { className: 'dsx-cost-total' }, fmtUsd(cost.totalUsd, 3), h('span', {}, 'estimated token cost'))
        ),
        h('div', { className: 'dsx-cost-rows' }, rows.map((row) => h('div', { className: 'dsx-cost-row', key: row.key },
          h('div', { className: 'dsx-cost-row-head' },
            h('div', {}, row.label, ' ', h('span', {}, `· ${fmtTokens(row.tokens)}`)),
            h('div', {}, h('b', {}, fmtUsd(row.value, 4)), ' ', h('span', {}, fmtPct(row.value / total * 100)))
          ),
          h('div', { className: 'dsx-cost-track' },
            h('div', { className: `dsx-cost-fill ${row.key}`, style: { width: `${Math.max(0, Math.min(100, row.value / total * 100))}%` } })
          )
        ))),
        h('p', { className: 'dsx-note' },
          `Estimated with DeepSeek list rates for ${pricing.models.length ? pricing.models.map(modelLabel).join(', ') : 'the active model'}. `,
          'Peak hours are 01:00–04:00 and 06:00–10:00 UTC, Monday–Friday, excluding Chinese public holidays; peak rates are double. ',
          windowsText ? `In ${pricing.schedule.timeZone} that is ${windowsText}. ` : '',
          h('a', { href: 'https://api-docs.deepseek.com/quick_start/pricing', target: '_blank', rel: 'noreferrer' }, 'List pricing'),
          '. Excludes search, fetch, and taxes.'
        )
      );
    }

    function CpuChart({ cpu }) {
      const samples = cpu.samples ?? [];
      if (samples.length < 2) {
        return h('div', { className: 'dsx-empty' }, 'Collecting CPU samples — the history starts when the plugin loads.');
      }
      const shown = samples.slice(-90);
      const W = 520;
      const H = 152;
      const M = { l: 30, r: 8, t: 8, b: 20 };
      const plotW = W - M.l - M.r;
      const plotH = H - M.t - M.b;
      const maxValue = Math.max(10, Math.min(100, Math.ceil(Math.max(...shown.map((sample) => Math.max(sample.system, sample.process))) * 1.2 / 10) * 10));
      const xAt = (index) => M.l + (shown.length === 1 ? 0 : index / (shown.length - 1) * plotW);
      const yAt = (value) => M.t + plotH - Math.max(0, Math.min(maxValue, value)) / maxValue * plotH;
      const path = (key) => shown.map((sample, index) => `${index === 0 ? 'M' : 'L'}${xAt(index).toFixed(1)} ${yAt(sample[key]).toFixed(1)}`).join(' ');
      const area = `${path('system')} L${xAt(shown.length - 1).toFixed(1)} ${M.t + plotH} L${xAt(0).toFixed(1)} ${M.t + plotH} Z`;
      const last = shown[shown.length - 1];
      return h('div', { className: 'dsx-cpu-chart' },
        h('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `CPU utilization timeline. System ${last.system}%, harness host ${last.process}%.` },
          [0, 0.5, 1].map((fraction) => {
            const y = M.t + plotH - plotH * fraction;
            return h('g', { key: fraction },
              h('line', { x1: M.l, x2: W - M.r, y1: y, y2: y, className: 'dsx-gridline' }),
              h('text', { x: M.l - 6, y: y + 3, textAnchor: 'end', className: 'dsx-axis' }, `${Math.round(maxValue * fraction)}%`)
            );
          }),
          h('path', { d: area, fill: 'var(--dsw-alias-label-primary)', opacity: 0.06 }),
          h('path', { d: path('system'), fill: 'none', stroke: 'var(--dsw-alias-label-primary)', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', opacity: 0.82 }),
          h('path', { d: path('process'), fill: 'none', stroke: 'var(--dsw-alias-state-warn-primary)', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }),
          h('circle', { cx: xAt(shown.length - 1), cy: yAt(last.system), r: 2.3, fill: 'var(--dsw-alias-label-primary)' }),
          h('circle', { cx: xAt(shown.length - 1), cy: yAt(last.process), r: 2.3, fill: 'var(--dsw-alias-state-warn-primary)' }),
          h('text', { x: M.l, y: H - 5, textAnchor: 'start', className: 'dsx-axis' }, timeFmt.format(new Date(shown[0].t))),
          h('text', { x: W - M.r, y: H - 5, textAnchor: 'end', className: 'dsx-axis' }, timeFmt.format(new Date(last.t)))
        ),
        h('div', { className: 'dsx-legend' },
          h('span', { className: 'dsx-legend-item' }, h(Swatch, { kind: 'system' }), 'System'),
          h('span', { className: 'dsx-legend-item' }, h(Swatch, { kind: 'process' }), 'Harness host'),
          h('span', { className: 'dsx-legend-item' }, `${shown.length} samples · ${cpu.sampleMs / 1000}s interval`)
        )
      );
    }

    function CpuSection({ cpu }) {
      return h('section', { className: 'dsx-panel dsx-cpu' },
        h('div', { className: 'dsx-sec-head' },
          h('div', {},
            h('h2', { className: 'dsx-sec-title' }, 'CPU activity'),
            h('p', { className: 'dsx-sec-meta' }, `${fmtInt(cpu.cores)} logical cores · history since plugin load`)
          ),
          h('span', { className: 'dsx-live' }, h('i', { className: 'dsx-dot' }), 'Live')
        ),
        h('div', { className: 'dsx-cpu-figures' },
          h('div', {}, h('div', { className: 'dsx-cpu-value' }, fmtPct(cpu.systemPct)), h('div', { className: 'dsx-cpu-label' }, 'System utilization')),
          h('div', {}, h('div', { className: 'dsx-cpu-value' }, fmtPct(cpu.processPct)), h('div', { className: 'dsx-cpu-label' }, 'Harness host share')),
          h('div', {}, h('div', { className: 'dsx-cpu-value' }, fmtDuration(cpu.processCpuMs)), h('div', { className: 'dsx-cpu-label' }, 'Host CPU time'))
        ),
        h(CpuChart, { cpu }),
        h('div', { className: 'dsx-cpu-foot' },
          h('span', {}, `Peak ${fmtPct(cpu.peakSystemPct)} system · ${fmtPct(cpu.peakProcessPct)} host`),
          h('span', {}, `Host up ${fmtDuration(cpu.uptimeSec * 1000)} · sampled every ${cpu.sampleMs / 1000}s`)
        )
      );
    }

    function MiniBars({ values, bucketMs }) {
      const shown = (values ?? []).slice(-40);
      if (!shown.length) return h('div', { className: 'dsx-empty' }, 'No per-interval usage recorded.');
      const max = Math.max(1, ...shown);
      return h('div', {},
        h('div', {
          className: 'dsx-mini',
          role: 'img',
          'aria-label': `Token activity over the last ${shown.length} intervals.`,
        }, shown.map((value, index) => h('span', {
          key: index,
          className: `dsx-mini-bar${index === shown.length - 1 ? ' is-last' : ''}`,
          style: { height: `${value > 0 ? Math.max(2, value / max * 100) : 0}%` },
          title: `${fmtTokens(value)} tokens`,
        }))),
        h('div', { className: 'dsx-mini-axis' },
          h('span', {}, 'Earlier'),
          h('span', {}, 'Latest')
        )
      );
    }

    function Fact({ label, value }) {
      return h('div', {}, h('dt', {}, label), h('dd', {}, value));
    }

    function ConversationRow({ conversation, now, bucketMs, open, onToggle }) {
      const messages = conversation.userMessages + conversation.assistantMessages;
      const origin = conversation.origin === 'subagent'
        ? 'subagent'
        : conversation.parentSessionId
          ? 'fork'
          : 'root';
      return h(React.Fragment, { key: conversation.id },
        h('button', {
          type: 'button',
          className: 'dsx-row',
          'aria-expanded': open,
          'aria-controls': `dsx-detail-${conversation.id}`,
          onClick: onToggle,
        },
          h('div', { className: 'dsx-cell dsx-cell-conv' },
            h('div', { className: 'dsx-conv-title', title: conversation.title }, conversation.title),
            h('div', { className: 'dsx-conv-meta' },
              `${origin}${conversation.agentPreset ? ` · ${conversation.agentPreset}` : ''} · ${fmtInt(conversation.turns)} turns · ${fmtInt(messages)} messages${conversation.live ? ' · resident' : ''}`
            )
          ),
          h('div', { className: 'dsx-cell dsx-cell-tokens' },
            h('div', { className: 'dsx-cell-main' }, fmtTokens(conversation.tokens.total)),
            h('div', { className: 'dsx-cell-sub' }, `${fmtTokens(conversation.tokens.output)} out`)
          ),
          h('div', { className: 'dsx-cell dsx-cell-cost' },
            h('div', { className: 'dsx-cell-main' }, fmtUsd(conversation.cost.totalUsd, 4)),
            h('div', { className: 'dsx-cell-sub' }, 'est.')
          ),
          h('div', { className: 'dsx-cell dsx-cell-share' },
            h('span', { className: 'dsx-share' },
              h('span', { className: 'dsx-share-track' }, h('span', { className: 'dsx-share-fill', style: { width: `${Math.max(0, Math.min(100, conversation.sharePct))}%` } })),
              fmtPct(conversation.sharePct)
            )
          ),
          h('div', { className: 'dsx-cell dsx-cell-last' }, timeAgo(conversation.lastAt, now)),
          h('span', { className: `dsx-cell-chev${open ? ' is-open' : ''}` }, h(ChevronIcon))
        ),
        open ? h('div', { className: 'dsx-detail', id: `dsx-detail-${conversation.id}`, role: 'region', 'aria-label': `Details for ${conversation.title}` },
          h('div', {},
            h('div', { className: 'dsx-detail-label' },
              h('b', {}, 'Token activity'),
              h('span', {}, `${formatBucketSize(bucketMs)} intervals · ${fmtTokens(conversation.tokens.total)} total`)
            ),
            h(MiniBars, { values: conversation.series, bucketMs })
          ),
          h('div', {},
            h('dl', { className: 'dsx-facts' },
              h(Fact, { label: 'Output', value: fmtTokens(conversation.tokens.output) }),
              h(Fact, { label: 'Input · cache miss', value: fmtTokens(conversation.tokens.input) }),
              h(Fact, { label: 'Cache read', value: fmtTokens(conversation.tokens.cacheRead) }),
              h(Fact, { label: 'Cache hit rate', value: fmtPct(conversation.tokens.cacheRead + conversation.tokens.input > 0 ? conversation.tokens.cacheRead / (conversation.tokens.cacheRead + conversation.tokens.input) * 100 : 0) }),
              h(Fact, { label: 'Turns', value: fmtInt(conversation.turns) }),
              h(Fact, { label: 'Steps', value: fmtInt(conversation.steps) }),
              h(Fact, { label: 'Tool calls', value: fmtInt(conversation.toolCalls) }),
              h(Fact, { label: 'Active time', value: fmtDuration(conversation.activeMs) }),
              h(Fact, { label: 'Started', value: dateTimeFmt.format(new Date(conversation.createdAt)) }),
              h(Fact, { label: 'Last active', value: timeAgo(conversation.lastAt, now) }),
              h(Fact, { label: 'Cost per turn', value: fmtUsd(conversation.turns > 0 ? conversation.cost.totalUsd / conversation.turns : 0, 4) }),
              h(Fact, { label: 'Events', value: fmtInt(conversation.eventCount) })
            ),
            h('div', { className: 'dsx-model-line' },
              conversation.models.length
                ? conversation.models.map((entry) => h('span', { className: 'dsx-chip', key: `${entry.provider}/${entry.model}` }, modelLabel(entry.model)))
                : h('span', { className: 'dsx-chip' }, 'No model usage')
            )
          )
        ) : null
      );
    }

    function ConversationsSection({ conversations, now, bucketMs, expanded, setExpanded }) {
      return h('section', { className: 'dsx-panel dsx-conv' },
        h('div', { className: 'dsx-conv-head' },
          h('div', {},
            h('h2', { className: 'dsx-sec-title' }, 'Conversations'),
            h('p', { className: 'dsx-sec-meta' }, `${fmtInt(conversations.length)} total · sorted by estimated spend`)
          ),
          h('span', { className: 'dsx-live' }, conversations.some((item) => item.live) ? `${conversations.filter((item) => item.live).length} resident` : 'all settled')
        ),
        conversations.length === 0
          ? h('div', { className: 'dsx-empty' }, 'No conversations yet. Start one and its tokens will appear here.')
          : h('div', { 'aria-label': 'Conversation usage' },
              h('div', { className: 'dsx-table-head' },
                h('span', {}, 'Conversation'),
                h('span', {}, 'Tokens'),
                h('span', {}, 'Cost'),
                h('span', {}, 'Share'),
                h('span', {}, 'Last active'),
                h('span', { 'aria-label': 'Details' })
              ),
              conversations.map((conversation) => h(ConversationRow, {
                key: conversation.id,
                conversation,
                now,
                bucketMs,
                open: expanded === conversation.id,
                onToggle: () => setExpanded(expanded === conversation.id ? null : conversation.id),
              }))
            )
      );
    }

    function LoadingState() {
      return h('div', { className: 'dsx-page' },
        h('style', {}, CSS),
        h('div', { className: 'dsx-inner' },
          h('div', { className: 'dsx-skel', style: { width: '34%', height: 26 } }),
          h('div', { className: 'dsx-skel', style: { width: '52%', height: 12, marginTop: 11 } }),
          h('div', { className: 'dsx-skel-wrap' },
            h('div', { className: 'dsx-skel', style: { width: '58%', height: 54 } }),
            h('div', { className: 'dsx-skel', style: { width: '100%', height: 8, marginTop: 22 } }),
            h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginTop: 28 } },
              h('div', { className: 'dsx-skel', style: { height: 240 } }),
              h('div', { className: 'dsx-skel', style: { height: 240 } })
            )
          )
        )
      );
    }

    function ErrorState({ message, onRetry }) {
      return h('div', { className: 'dsx-page' },
        h('style', {}, CSS),
        h('div', { className: 'dsx-state' },
          h('div', {},
            h('div', { className: 'dsx-state-title' }, 'Usage data is unavailable'),
            h('div', { className: 'dsx-state-body' }, message || 'The Host could not read the session logs.'),
            h('button', { className: 'dsx-retry', type: 'button', onClick: onRetry }, 'Try again')
          )
        )
      );
    }

    class StatsBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { error: null };
      }

      static getDerivedStateFromError(error) {
        return { error };
      }

      render() {
        if (this.state.error) {
          return h('div', { className: 'dsx-page' },
            h('style', {}, CSS),
            h('div', { className: 'dsx-state' },
              h('div', {},
                h('div', { className: 'dsx-state-title' }, 'Usage page failed to render'),
                h('div', { className: 'dsx-state-body' }, String(this.state.error?.message || this.state.error)),
                h('button', {
                  className: 'dsx-retry',
                  type: 'button',
                  onClick: () => window.location.reload(),
                }, 'Reload')
              )
            )
          );
        }
        return this.props.children;
      }
    }

    function StatsRoot() {
      return h(StatsBoundary, null, h(StatsPage));
    }

    function StatsPage() {
      const [budget, setBudget] = useState(readBudget);
      const [draft, setDraft] = useState(() => String(readBudget()));
      const [mode, setMode] = useState('tokens');
      const [expanded, setExpanded] = useState(null);
      const [state, refresh] = useOverview(budget);
      const data = state.data;
      const now = Date.now();

      const commitBudget = useCallback(() => {
        const value = Number(draft);
        if (!Number.isFinite(value) || value <= 0) {
          setDraft(String(budget));
          return;
        }
        const next = Math.round(value * 100) / 100;
        setBudget(next);
        setDraft(String(next));
        writeBudget(next);
      }, [budget, draft]);

      if (!data) {
        return state.loading && !state.error
          ? h(LoadingState)
          : h(ErrorState, { message: state.error, onRetry: refresh });
      }

      const { totals, timeline, budget: budgetData, pricing, conversations, cpu } = data;

      return h('div', { className: 'dsx-page' },
        h('style', {}, CSS),
        h('div', { className: 'dsx-inner' },
          h('header', { className: 'dsx-head' },
            h('div', {},
              h('h1', { className: 'dsx-title' }, 'Usage ledger'),
              h('p', { className: 'dsx-sub' },
                `${fmtInt(totals.conversations)} conversations · ${fmtInt(totals.messages)} messages · ${formatSpan(timeline.from, timeline.to)}`
              )
            ),
            h('div', { className: 'dsx-actions' },
              h('span', { className: `dsx-live${state.error ? ' is-stale' : ''}` },
                h('i', { className: 'dsx-dot' }),
                state.error ? 'Stale' : 'Live',
                h('span', { className: 'dsx-updated' }, `updated ${timeAgo(state.updatedAt, now)}`)
              ),
              h('button', {
                type: 'button',
                className: `dsx-icon-btn${state.loading ? ' is-busy' : ''}`,
                'aria-label': 'Refresh usage statistics',
                title: 'Refresh',
                onClick: refresh,
                disabled: state.loading,
              }, h(RefreshIcon))
            )
          ),
          state.error ? h('div', { className: 'dsx-banner' }, `Live refresh failed: ${state.error}`) : null,
          h(Ledger, { totals, budget: budgetData, pricing }),
          h(RateClock, { pricing }),
          h('div', { className: 'dsx-grid-main' },
            h(TimelineSection, { data, mode, setMode }),
            h(BudgetSection, {
              budget: budgetData,
              draft,
              setDraft,
              commitBudget,
              totals,
            })
          ),
          h('div', { className: 'dsx-grid-main', style: { marginTop: 30 } },
            h(CpuSection, { cpu }),
            h(CostSection, { totals, pricing })
          ),
          h(ConversationsSection, {
            conversations,
            now,
            bucketMs: timeline.bucketMs,
            expanded,
            setExpanded,
          }),
          h('div', { style: { height: 8 } })
        )
      );
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
        }, StatsRoot));
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 20,
          label: 'Usage',
        }, StatsIcon));
        // Current conversation's spend, beside the composer's token readout.
        ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
          name: 'conversation.composer.dock',
          id: 'usage-cost',
          order: 2,
          label: 'Session cost',
        }, SessionCostChip));
      },
    };
  },
});
