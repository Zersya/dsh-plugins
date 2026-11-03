const CSS = String.raw`
.ec-root {
  --ec-dot: color-mix(in srgb, var(--dsw-alias-label-secondary) 22%, transparent);
  --ec-ring-track: color-mix(in srgb, var(--dsw-alias-border-l2) 55%, transparent);
  --ec-edge: color-mix(in srgb, var(--dsw-alias-label-secondary) 62%, transparent);
  --ec-minimap-bg: color-mix(in srgb, var(--dsw-alias-bg-base) 84%, transparent);
  --ec-minimap-lane: color-mix(in srgb, var(--dsw-alias-label-secondary) 10%, transparent);
  --ec-minimap-frame: color-mix(in srgb, var(--dsw-alias-border-l2) 70%, transparent);
  --ec-minimap-node: color-mix(in srgb, var(--dsw-alias-label-secondary) 36%, transparent);
  --ec-card-shadow: 0 1px 1px rgba(15, 23, 42, .04), 0 5px 14px rgba(15, 23, 42, .055);
  --ec-float-shadow: 0 18px 52px rgba(2, 6, 15, .34), 0 2px 8px rgba(2, 6, 15, .2);
  --ec-panel: var(--dsw-alias-bg-base);
  --ec-panel-sunken: color-mix(in srgb, var(--dsw-alias-bg-base) 92%, var(--dsw-alias-label-primary) 8%);
  --ec-panel-border: color-mix(in srgb, var(--dsw-alias-label-secondary) 26%, transparent);
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 540px;
  overflow: hidden;
  container-type: inline-size;
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif;
  font-size: 13px;
  line-height: 1.4;
  -webkit-font-smoothing: antialiased;
}
.ec-root *, .ec-root *::before, .ec-root *::after { box-sizing: border-box; }
.ec-root :where(button, input, textarea, select) { font: inherit; color: inherit; }
.ec-root :where(button) { border: 0; background: transparent; cursor: pointer; }
.ec-root button:disabled { cursor: default; opacity: .34; }
.ec-root kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 5px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary);
  font-family: inherit;
  font-size: 9.5px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}
.ec-root button:focus-visible, .ec-root input:focus-visible, .ec-root textarea:focus-visible, .ec-root select:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 1px;
}
.ec-root ::selection { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 24%, transparent); }
.ec-icon { display: block; flex: none; }
.ec-eyebrow {
  display: block;
  color: var(--dsw-alias-label-secondary);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .12em;
  line-height: 1.2;
  text-transform: uppercase;
}
.ec-hidden-input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.ec-link-btn {
  padding: 0;
  color: var(--dsw-alias-brand-primary) !important;
  font-size: 11px;
  font-weight: 600;
}
.ec-link-btn:hover { text-decoration: underline; }

/* top bar */
.ec-topbar {
  position: relative;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 12px;
  flex: none;
  height: 58px;
  padding: 0 13px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1);
}
.ec-brand { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; }
.ec-brand-mark {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: none;
  border-radius: 10px;
}
.ec-brand-mark, .ec-sidebar-glyph { color: var(--dsw-alias-label-primary); }
.ec-brand-glyph { display: block; border-radius: 10px; filter: drop-shadow(0 2px 5px rgba(2, 6, 15, .22)); }
.ec-sidebar-glyph.is-active .ec-brand-glyph { filter: drop-shadow(0 0 4px color-mix(in srgb, var(--dsw-alias-label-primary) 34%, transparent)); }
.ec-brand-copy { min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.ec-board-title {
  width: min(330px, 30vw);
  height: 22px;
  padding: 0 3px;
  margin: 0 -3px;
  border: 1px solid transparent;
  border-radius: 5px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  font-weight: 650;
  letter-spacing: -.012em;
  text-overflow: ellipsis;
}
.ec-board-title:hover { background: var(--dsw-alias-bg-layer-2); }
.ec-board-title:focus { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l1); outline: none; }
.ec-save {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: none;
  color: var(--dsw-alias-label-secondary);
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
}
.ec-save-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--dsw-alias-state-success-primary); }
.ec-save--saving .ec-save-dot { background: var(--dsw-alias-state-warn-primary); animation: ec-pulse 1.2s infinite; }
.ec-save--error { color: var(--dsw-alias-state-error-primary); }
.ec-save--error .ec-save-dot { background: var(--dsw-alias-state-error-primary); }
@keyframes ec-pulse { 50% { opacity: .35; } }
.ec-top-actions { display: flex; align-items: center; gap: 7px; flex: none; }
.ec-progress-pill {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 38px;
  padding: 2px 10px 2px 2px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-2);
}
.ec-progress-ring { flex: none; }
.ec-progress-copy { display: flex; flex-direction: column; line-height: 1.15; }
.ec-progress-copy strong { font-size: 11.5px; font-weight: 700; }
.ec-progress-copy span { color: var(--dsw-alias-label-secondary); font-size: 9px; white-space: nowrap; }
.ec-search {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 214px;
  height: 32px;
  padding: 0 5px 0 9px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary);
  transition: border-color .14s, background .14s;
}
.ec-search:focus-within { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-bg-layer-1); }
.ec-search input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font-size: 11.5px;
}
.ec-search input::placeholder { color: var(--dsw-alias-label-secondary); }
.ec-search-kbd { height: 17px; min-width: 27px; font-size: 8.5px; }
.ec-search-clear {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  color: var(--dsw-alias-label-secondary);
}
.ec-search-clear:hover { background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); }
.ec-history {
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 2px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2);
}
.ec-history .ec-icon-btn { width: 27px; height: 26px; border-radius: 6px; }
.ec-icon-btn {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 8px;
  color: var(--dsw-alias-label-secondary);
  transition: background .12s, color .12s;
}
.ec-icon-btn:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.ec-icon-btn.is-open { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.ec-inspector-toggle.is-open { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, transparent); color: var(--dsw-alias-brand-primary); }
.ec-btn, .ec-new-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
  transition: border-color .12s, background .12s, transform .08s;
}
.ec-btn:hover, .ec-new-btn:hover { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2); }
.ec-btn:active, .ec-new-btn:active { transform: translateY(1px); }
.ec-btn.is-open { background: var(--dsw-alias-bg-layer-2); }
.ec-new-btn {
  border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 28%, var(--dsw-alias-border-l1));
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, var(--dsw-alias-bg-layer-1));
  color: var(--dsw-alias-brand-primary);
}
.ec-new-btn:hover { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, var(--dsw-alias-bg-layer-1)); border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, var(--dsw-alias-border-l1)); }
.ec-btn--primary {
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 20%, var(--dsw-alias-bg-base));
  border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 54%, var(--dsw-alias-border-l1));
  color: var(--dsw-alias-label-primary);
}
.ec-btn--primary:hover {
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 28%, var(--dsw-alias-bg-base));
  border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 68%, var(--dsw-alias-border-l1));
}
.ec-btn--danger { background: var(--dsw-alias-state-error-primary); border-color: var(--dsw-alias-state-error-primary); color: oklch(98% 0.004 255); }
.ec-btn--danger:hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 88%, oklch(15% 0.018 258)); }
.ec-btn--danger-quiet { color: var(--dsw-alias-state-error-primary); }
.ec-btn--danger-quiet:hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 30%, var(--dsw-alias-border-l1)); }
.ec-btn--full { width: 100%; }
.ec-menu-wrap { position: relative; }
.ec-popover {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 300;
  min-width: 224px;
  padding: 5px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 10px;
  background: var(--ec-panel);
  box-shadow: var(--ec-float-shadow);
  animation: ec-pop .12s ease-out;
}
.ec-popover--export { min-width: 214px; }
@keyframes ec-pop { from { opacity: 0; transform: translateY(-3px) scale(.985); } }
.ec-popover-label {
  padding: 6px 8px 5px;
  color: var(--dsw-alias-label-secondary);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
}
.ec-popover-sep { height: 1px; margin: 5px 4px; background: var(--dsw-alias-border-l1); }
.ec-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 31px;
  padding: 0 8px;
  border-radius: 6px;
  color: var(--dsw-alias-label-primary);
  text-align: left;
  font-size: 11.5px;
}
.ec-menu-item:hover { background: var(--dsw-alias-bg-layer-2); }
.ec-menu-item.is-danger { color: var(--dsw-alias-state-error-primary); }
.ec-menu-item.is-danger:hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 9%, transparent); }
.ec-menu-label { flex: 1; }
.ec-menu-item kbd { height: 17px; font-size: 8.5px; }

/* body and tool rail */
.ec-body { display: flex; flex: 1; min-height: 0; position: relative; }
.ec-rail {
  position: relative;
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: none;
  width: 52px;
  padding: 9px 0 8px;
  border-right: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1);
}
.ec-rail-tools { display: flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; }
.ec-tool {
  position: relative;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  color: var(--dsw-alias-label-secondary);
  transition: background .12s, color .12s;
}
.ec-tool:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.ec-tool.is-active {
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 11%, transparent);
  color: var(--dsw-alias-brand-primary);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-brand-primary) 18%, transparent);
}
.ec-tool-key {
  position: absolute;
  right: 3px;
  bottom: 2px;
  color: var(--dsw-alias-label-secondary);
  font-size: 7px;
  font-weight: 600;
  opacity: .55;
}
.ec-tool.is-active .ec-tool-key { color: var(--dsw-alias-brand-primary); opacity: .9; }
.ec-tool[data-tip]::after {
  content: attr(data-tip);
  position: absolute;
  left: calc(100% + 9px);
  top: 50%;
  z-index: 200;
  padding: 5px 8px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 6px;
  background: var(--ec-panel);
  color: var(--dsw-alias-label-primary);
  box-shadow: 0 4px 14px rgba(15, 23, 42, .12);
  font-size: 10.5px;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transform: translate(-3px, -50%);
  transition: opacity .1s, transform .1s;
}
.ec-tool[data-tip]:hover::after { opacity: 1; transform: translate(0, -50%); }
.ec-tool-wrap { position: relative; }
.ec-shape-picker {
  position: absolute;
  left: calc(100% + 9px);
  top: -5px;
  z-index: 240;
  width: 294px;
  padding: 8px;
  border: 1px solid var(--ec-panel-border);
  border-radius: 12px;
  background: var(--ec-panel);
  box-shadow: var(--ec-float-shadow);
  animation: ec-pop .12s ease-out;
}
.ec-shape-picker-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; padding: 4px 3px 8px; }
.ec-shape-picker-head strong { display: block; margin-top: 2px; font-size: 13px; font-weight: 650; letter-spacing: -.012em; }
.ec-shape-picker-head .ec-icon-btn { width: 24px; height: 24px; border-radius: 6px; }
.ec-shape-picker-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; }
.ec-shape-option {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 43px;
  padding: 5px 6px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--dsw-alias-label-secondary);
  text-align: left;
  transition: background .12s, border-color .12s, color .12s;
}
.ec-shape-option:hover { border-color: var(--dsw-alias-border-l1); background: var(--ec-panel-sunken); color: var(--dsw-alias-label-primary); }
.ec-shape-option.is-active { border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 34%, transparent); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent); color: var(--dsw-alias-brand-primary); }
.ec-shape-option-icon { display: grid; place-items: center; width: 27px; height: 27px; flex: none; }
.ec-shape-option-label { flex: 1; overflow: hidden; font-size: 10.5px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.ec-shape-option kbd { height: 16px; min-width: 16px; padding: 0 4px; font-size: 8px; opacity: .65; }
.ec-shape-option.is-active kbd { border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 30%, transparent); color: var(--dsw-alias-brand-primary); }
.ec-shape-picker-foot { padding: 8px 4px 2px; color: color-mix(in srgb, var(--dsw-alias-label-primary) 52%, transparent); font-size: 9px; }
.ec-rail-sep { display: block; width: 20px; height: 1px; margin: 4px 0; background: var(--dsw-alias-border-l1); }
.ec-rail-foot { margin-top: auto; padding-top: 6px; }

/* stage */
.ec-stage {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  background-color: var(--dsw-alias-bg-base);
  touch-action: none;
  user-select: none;
  cursor: default;
}
.ec-stage.is-hand { cursor: grab; }
.ec-stage.is-panning { cursor: grabbing; }
.ec-stage.is-pen { cursor: crosshair; }
.ec-stage.is-eraser { cursor: cell; }
.ec-stage.is-connect { cursor: crosshair; }
.ec-stage.is-creator { cursor: crosshair; }
.ec-world {
  position: absolute;
  inset: 0;
  transform-origin: 0 0;
  pointer-events: none;
  will-change: transform;
}
.ec-world > * { pointer-events: none; }
.ec-world .ec-node, .ec-world .ec-frame-label, .ec-world .ec-edge-hit, .ec-world .ec-edge-label, .ec-world .ec-resize, .ec-world .ec-port { pointer-events: auto; }

/* frames and lanes */
.ec-frame { position: absolute; z-index: 1; border-radius: 18px; }
.ec-frame-surface {
  position: absolute;
  inset: 0;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 18px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-brand-primary) 3.2%, transparent), transparent 42%),
    color-mix(in srgb, var(--dsw-alias-bg-layer-1) 46%, transparent);
  transition: border-color .14s, box-shadow .14s;
}
.ec-frame.is-selected .ec-frame-surface {
  border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 60%, var(--dsw-alias-border-l1));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent);
}
.ec-frame-label {
  position: absolute;
  top: 17px;
  left: 20px;
  display: flex;
  align-items: flex-start;
  gap: 9px;
  max-width: calc(100% - 40px);
  cursor: grab;
  user-select: none;
}
.ec-frame-icon { margin-top: 3px; color: var(--dsw-alias-label-secondary); opacity: .7; }
.ec-frame-copy { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.ec-frame-title {
  overflow: hidden;
  color: var(--dsw-alias-label-primary);
  font-size: 19px;
  font-weight: 680;
  letter-spacing: -.022em;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ec-frame-subtitle {
  overflow: hidden;
  color: var(--dsw-alias-label-secondary);
  font-size: 10.5px;
  font-weight: 500;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ec-lane {
  position: absolute;
  z-index: 2;
  border: 1px dashed color-mix(in srgb, var(--lane-color) 16%, var(--dsw-alias-border-l1));
  border-radius: 18px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--lane-color) 7%, transparent), transparent 100px),
    color-mix(in srgb, var(--lane-color) 2.4%, var(--dsw-alias-bg-base));
  transition: border-color .14s, background .14s, box-shadow .14s;
}
.ec-lane.is-drop-target {
  border-color: color-mix(in srgb, var(--lane-color) 58%, var(--dsw-alias-border-l1));
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--lane-color) 14%, transparent), transparent 150px),
    color-mix(in srgb, var(--lane-color) 6%, var(--dsw-alias-bg-base));
  box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--lane-color) 15%, transparent);
}
.ec-lane::before {
  content: "";
  position: absolute;
  top: -1px;
  left: 20px;
  right: 20px;
  height: 2px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--lane-color) 44%, transparent);
}
.ec-lane-head { display: flex; align-items: center; gap: 7px; height: 54px; padding: 0 16px; }
.ec-lane-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--lane-color); box-shadow: 0 0 0 3px color-mix(in srgb, var(--lane-color) 12%, transparent); }
.ec-lane-title { color: var(--dsw-alias-label-primary); font-size: 10.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
.ec-lane-count {
  margin-left: auto;
  display: grid;
  place-items: center;
  min-width: 19px;
  height: 19px;
  padding: 0 6px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--lane-color) 10%, transparent);
  color: var(--lane-color);
  font-size: 9.5px;
  font-weight: 700;
}
.ec-lane-empty {
  position: absolute;
  top: 80px;
  left: 0;
  right: 0;
  color: var(--dsw-alias-label-secondary);
  font-size: 10px;
  text-align: center;
  opacity: .6;
}

/* edges */
.ec-edge { position: absolute; z-index: 3; pointer-events: none; }
.ec-edge-svg { position: absolute; inset: 0; overflow: visible; }
.ec-edge-hit { fill: none; stroke: transparent; stroke-width: 18; pointer-events: stroke; cursor: pointer; }
.ec-edge-line { fill: none; stroke: var(--ec-edge); stroke-width: 1.7; stroke-linecap: round; transition: stroke .12s, stroke-width .12s; }
.ec-edge-arrow { fill: var(--ec-edge); transition: fill .12s; }
.ec-edge.is-dashed .ec-edge-line { stroke-dasharray: 6 5; }
.ec-edge.is-selected .ec-edge-line { stroke: var(--dsw-alias-brand-primary); stroke-width: 2.4; }
.ec-edge.is-selected .ec-edge-arrow { fill: var(--dsw-alias-brand-primary); }
.ec-edge.is-dimmed { opacity: .2; }
.ec-edge-label {
  position: absolute;
  padding: 2px 7px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 999px;
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-secondary);
  font-size: 9px;
  font-weight: 600;
  line-height: 1.5;
  white-space: nowrap;
  transform: translate(-50%, -50%);
  cursor: pointer;
}
.ec-edge.is-selected .ec-edge-label { color: var(--dsw-alias-brand-primary); border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 38%, var(--dsw-alias-border-l1)); }
.ec-edge-anchor { fill: var(--dsw-alias-brand-primary); }

/* nodes */
.ec-node { position: absolute; z-index: 4; }
.ec-node.is-dimmed { opacity: .2; pointer-events: none; filter: saturate(.4); }
.ec-node.is-connect-target::after {
  content: "";
  position: absolute;
  inset: -5px;
  border: 2px dashed var(--dsw-alias-brand-primary);
  border-radius: 18px;
  pointer-events: none;
}
.ec-task {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  padding: 13px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 13px;
  background: var(--dsw-alias-bg-layer-1);
  box-shadow: var(--ec-card-shadow);
  cursor: grab;
  overflow: hidden;
  transition: border-color .13s, box-shadow .13s, transform .13s;
}
.ec-node--task:hover .ec-task { border-color: var(--dsw-alias-border-l2); box-shadow: 0 2px 3px rgba(15, 23, 42, .05), 0 10px 24px rgba(15, 23, 42, .075); }
.ec-node.is-selected .ec-task {
  border-color: var(--dsw-alias-brand-primary);
  box-shadow: 0 0 0 2.5px color-mix(in srgb, var(--dsw-alias-brand-primary) 17%, transparent), 0 12px 26px rgba(15, 23, 42, .10);
}
.ec-node.is-editing .ec-task { cursor: text; }
.ec-node--task.is-status-blocked .ec-task {
  border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 30%, var(--dsw-alias-border-l1));
}
.ec-task-top { display: flex; align-items: center; gap: 6px; min-height: 19px; }
.ec-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 19px;
  padding: 0 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--status-color) 12%, transparent);
  color: color-mix(in srgb, var(--status-color) 72%, var(--dsw-alias-label-primary));
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: .015em;
  white-space: nowrap;
}
.ec-status-pill--large { height: 24px; padding: 0 9px; font-size: 9.5px; }
.ec-status-dot { display: inline-block; width: 5px; height: 5px; flex: none; border-radius: 50%; background: var(--status-color); }
.ec-task-priority {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: auto;
  color: color-mix(in srgb, var(--priority-color) 80%, var(--dsw-alias-label-primary));
  font-size: 8.5px;
  font-weight: 700;
}
.ec-priority-dot { width: 4px; height: 4px; border-radius: 1px; background: var(--priority-color); }
.ec-task-estimate { color: var(--dsw-alias-label-secondary); font-size: 8.5px; font-weight: 600; }
.ec-task-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 37px;
  margin: 7px 0 4px;
  color: var(--dsw-alias-label-primary);
  font-size: 14.5px;
  font-weight: 650;
  letter-spacing: -.014em;
  line-height: 1.27;
  overflow-wrap: anywhere;
}
.ec-task-title-input {
  width: 100%;
  height: 40px;
  margin: 5px -4px 2px;
  padding: 2px 4px;
  border: 1px solid var(--dsw-alias-brand-primary);
  border-radius: 6px;
  outline: none;
  background: var(--dsw-alias-bg-layer-2);
  font-size: 14.5px;
  font-weight: 650;
  line-height: 1.25;
}
.ec-task-tags { display: flex; align-items: center; gap: 3px; height: 18px; overflow: hidden; }
.ec-task-tags--empty { color: var(--dsw-alias-label-secondary); font-size: 8.5px; opacity: .75; }
.ec-tag {
  display: inline-flex;
  align-items: center;
  height: 17px;
  padding: 0 6px;
  border-radius: 5px;
  background: color-mix(in srgb, var(--dsw-alias-label-secondary) 8%, transparent);
  color: var(--dsw-alias-label-secondary);
  font-size: 8px;
  font-weight: 600;
  white-space: nowrap;
}
.ec-tag--more { padding: 0 5px; }
.ec-task-progress { display: flex; align-items: center; gap: 6px; margin-top: 8px; height: 13px; }
.ec-task-progress--empty { color: var(--dsw-alias-label-secondary); font-size: 8px; opacity: .65; }
.ec-task-progress-track {
  position: relative;
  flex: 1;
  height: 4px;
  overflow: hidden;
  border-radius: 2px;
  background: color-mix(in srgb, var(--dsw-alias-label-secondary) 12%, transparent);
}
.ec-task-progress-track > span { display: block; height: 100%; border-radius: inherit; background: var(--dsw-alias-brand-primary); transition: width .25s ease; }
.ec-task-progress-track > span.is-complete { background: var(--dsw-alias-state-success-primary); }
.ec-task-progress-label { color: var(--dsw-alias-label-secondary); font-size: 8px; font-weight: 600; }
.ec-task-foot { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-top: auto; padding-top: 7px; border-top: 1px solid color-mix(in srgb, var(--dsw-alias-border-l1) 60%, transparent); }
.ec-assignee { display: flex; align-items: center; gap: 5px; min-width: 0; }
.ec-avatar {
  display: grid;
  place-items: center;
  width: 19px;
  height: 19px;
  flex: none;
  border-radius: 50%;
  background: var(--avatar-bg);
  color: oklch(98% 0.004 255);
  font-size: 6.5px;
  font-weight: 800;
  letter-spacing: .02em;
}
.ec-assignee-name { overflow: hidden; color: var(--dsw-alias-label-secondary); font-size: 9px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
.ec-due { display: inline-flex; align-items: center; gap: 3px; flex: none; color: var(--dsw-alias-label-secondary); font-size: 8.5px; font-weight: 600; }
.ec-due.is-overdue { color: var(--dsw-alias-state-error-primary); }

/* notes, text, shapes, drawings */
.ec-node--note .ec-note {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 13px 15px 13px 17px;
  border: 1px solid color-mix(in srgb, var(--ec-tone) 32%, var(--dsw-alias-border-l1));
  border-radius: 11px;
  background:
    linear-gradient(160deg, color-mix(in srgb, var(--ec-tone) 16%, transparent), color-mix(in srgb, var(--ec-tone) 7%, transparent)),
    var(--dsw-alias-bg-layer-1);
  box-shadow: var(--ec-card-shadow);
  cursor: grab;
  overflow: hidden;
}
.ec-node.is-selected .ec-note { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 2.5px color-mix(in srgb, var(--dsw-alias-brand-primary) 17%, transparent); }
.ec-note-mark { display: flex; align-items: center; gap: 4px; color: color-mix(in srgb, var(--ec-tone) 78%, var(--dsw-alias-label-primary)); font-size: 7.5px; font-weight: 800; letter-spacing: .12em; }
.ec-note-title { padding-right: 16px; color: var(--dsw-alias-label-primary); font-size: 13.5px; font-weight: 700; line-height: 1.25; letter-spacing: -.01em; }
.ec-note-body { overflow: hidden; color: var(--dsw-alias-label-secondary); font-size: 10px; font-weight: 450; line-height: 1.5; white-space: pre-wrap; }
.ec-note-editor {
  flex: 1;
  min-height: 0;
  width: 100%;
  padding: 4px 5px;
  border: 1px solid var(--dsw-alias-brand-primary);
  border-radius: 6px;
  outline: none;
  background: color-mix(in srgb, var(--dsw-alias-bg-base) 68%, transparent);
  color: var(--dsw-alias-label-primary);
  font-size: 10.5px;
  line-height: 1.5;
  resize: none;
}
.ec-node--text { cursor: text; }
.ec-text-block {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-start;
  padding: 1px 2px;
  cursor: text;
  outline: 1px dashed transparent;
  outline-offset: 4px;
  border-radius: 2px;
}
.ec-node--text:hover .ec-text-block { outline-color: color-mix(in srgb, var(--dsw-alias-border-l2) 60%, transparent); }
.ec-node--text.is-selected .ec-text-block { outline: 1.5px dashed var(--dsw-alias-brand-primary); }
.ec-text-value { width: 100%; line-height: 1.3; white-space: pre-wrap; overflow-wrap: anywhere; }
.ec-text-editor {
  width: 100%;
  min-height: 100%;
  padding: 0 2px;
  border: 0;
  outline: none;
  background: transparent;
  resize: none;
  line-height: 1.3;
}
.ec-node--shape .ec-shape-inner { position: absolute; inset: 0; display: grid; place-items: center; cursor: grab; }
.ec-shape-svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.ec-shape-svg rect, .ec-shape-svg ellipse, .ec-shape-svg polygon, .ec-shape-svg path {
  fill: color-mix(in srgb, var(--ec-tone) 15%, transparent);
  stroke: color-mix(in srgb, var(--ec-tone) 72%, var(--dsw-alias-label-secondary));
  stroke-width: 1.2;
  vector-effect: non-scaling-stroke;
}
.ec-shape-svg line {
  stroke: color-mix(in srgb, var(--ec-tone) 72%, var(--dsw-alias-label-secondary));
  stroke-width: 1.2;
  vector-effect: non-scaling-stroke;
}
.ec-node--shape.is-selected .ec-shape-inner { filter: drop-shadow(0 0 1px var(--dsw-alias-brand-primary)); }
.ec-node--shape.is-selected .ec-shape-svg rect, .ec-node--shape.is-selected .ec-shape-svg ellipse, .ec-node--shape.is-selected .ec-shape-svg polygon, .ec-node--shape.is-selected .ec-shape-svg path, .ec-node--shape.is-selected .ec-shape-svg line { stroke: var(--dsw-alias-brand-primary); stroke-width: 2; }
.ec-shape-label { position: relative; z-index: 1; max-width: calc(100% - 24px); color: var(--dsw-alias-label-primary); font-size: 11.5px; font-weight: 650; text-align: center; line-height: 1.25; overflow-wrap: anywhere; pointer-events: none; }
.ec-shape-label--decision { max-width: 56%; }
.ec-shape-label--io { max-width: 70%; }
.ec-shape-label--database { max-width: 68%; transform: translateY(2%); }
.ec-shape-label--document { max-width: 78%; transform: translateY(-2%); }
.ec-shape-label--manual { max-width: 70%; }
.ec-shape-glyph { display: block; flex: none; overflow: visible; }
.ec-shape-glyph rect, .ec-shape-glyph ellipse, .ec-shape-glyph polygon, .ec-shape-glyph path { fill: none; stroke: currentColor; stroke-width: 5.5; stroke-linejoin: round; }
.ec-shape-glyph line { stroke: currentColor; stroke-width: 5.5; }
.ec-shape-editor {
  position: relative;
  z-index: 2;
  width: calc(100% - 20px);
  height: calc(100% - 16px);
  padding: 4px;
  border: 1px solid var(--dsw-alias-brand-primary);
  border-radius: 5px;
  outline: none;
  background: var(--dsw-alias-bg-layer-2);
  font-size: 11px;
  text-align: center;
  resize: none;
}
.ec-draw { overflow: visible; pointer-events: none; }
.ec-node--draw { cursor: pointer; }
.ec-node--draw.is-selected { filter: drop-shadow(0 0 1.5px var(--dsw-alias-brand-primary)); }

/* ports and resize */
.ec-port {
  position: absolute;
  z-index: 8;
  display: grid;
  place-items: center;
  width: 12px;
  height: 12px;
  padding: 0;
  border: 1.5px solid var(--dsw-alias-brand-primary);
  border-radius: 50%;
  background: var(--dsw-alias-bg-layer-1);
  opacity: 0;
  pointer-events: none;
  transform: scale(.7);
  transition: opacity .12s, transform .12s;
}
.ec-port span { width: 4px; height: 4px; border-radius: 50%; background: var(--dsw-alias-brand-primary); }
.ec-port::before { content: ""; position: absolute; inset: -6px; border-radius: 50%; }
.ec-node:hover .ec-port, .ec-node.is-selected .ec-port { opacity: 1; pointer-events: auto; transform: scale(1); }
.ec-port:hover { background: var(--dsw-alias-brand-primary); transform: scale(1.18); }
.ec-port:hover span { background: oklch(98% 0.004 255); }
.ec-port--top { top: -6px; left: calc(50% - 6px); cursor: crosshair; }
.ec-port--right { right: -6px; top: calc(50% - 6px); cursor: crosshair; }
.ec-port--bottom { bottom: -6px; left: calc(50% - 6px); cursor: crosshair; }
.ec-port--left { left: -6px; top: calc(50% - 6px); cursor: crosshair; }
.ec-resize {
  position: absolute;
  right: -5px;
  bottom: -5px;
  z-index: 9;
  width: 12px;
  height: 12px;
  padding: 0;
  border: 1.5px solid var(--dsw-alias-bg-base);
  border-radius: 3px;
  background: var(--dsw-alias-brand-primary);
  box-shadow: 0 1px 3px rgba(15, 23, 42, .2);
  cursor: nwse-resize;
}
.ec-resize span { display: block; width: 100%; height: 100%; }

/* canvas chrome */
.ec-group-outline {
  position: absolute;
  z-index: 12;
  border: 1.5px dashed color-mix(in srgb, var(--dsw-alias-brand-primary) 58%, transparent);
  border-radius: 16px;
  pointer-events: none;
}
.ec-group-label {
  position: absolute;
  top: -24px;
  left: -1px;
  display: flex;
  align-items: center;
  gap: 5px;
  height: 21px;
  padding: 0 7px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 28%, var(--ec-panel-border));
  border-radius: 6px;
  background: var(--ec-panel);
  color: var(--dsw-alias-brand-primary);
  font-size: 9px;
  font-weight: 650;
  white-space: nowrap;
}
.ec-group-label em { color: var(--dsw-alias-label-secondary); font-size: 8px; font-style: normal; font-weight: 600; }
.ec-group-resize {
  position: absolute;
  right: -6px;
  bottom: -6px;
  width: 12px;
  height: 12px;
  padding: 0;
  border: 1.5px solid var(--dsw-alias-bg-base);
  border-radius: 3px;
  background: var(--dsw-alias-brand-primary);
  box-shadow: 0 1px 3px rgba(2, 6, 15, .22);
  pointer-events: auto;
  cursor: nwse-resize;
}
.ec-group-resize span { display: block; width: 100%; height: 100%; }
.ec-marquee { position: absolute; z-index: 20; border: 1px solid var(--dsw-alias-brand-primary); border-radius: 4px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, transparent); pointer-events: none; }
.ec-create-preview { position: absolute; z-index: 20; border: 1.5px dashed var(--dsw-alias-brand-primary); border-radius: 10px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 5%, transparent); pointer-events: none; }
.ec-connect-layer { position: absolute; inset: 0; z-index: 50; pointer-events: none; overflow: visible; }
.ec-details-pill {
  position: absolute;
  top: 14px;
  right: 16px;
  z-index: 25;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 999px;
  background: var(--ec-panel);
  box-shadow: 0 4px 16px rgba(15, 23, 42, .10);
  color: var(--dsw-alias-label-secondary);
  font-size: 10px;
  font-weight: 600;
}
.ec-details-pill:hover { border-color: var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); }
.ec-filter-chip {
  position: absolute;
  top: 14px;
  left: 50%;
  z-index: 25;
  display: flex;
  align-items: center;
  gap: 7px;
  height: 30px;
  padding: 0 5px 0 10px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 999px;
  background: var(--ec-panel);
  box-shadow: 0 4px 16px rgba(15, 23, 42, .10);
  color: var(--dsw-alias-label-secondary);
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
  transform: translateX(-50%);
}
.ec-filter-clear { width: 22px; height: 22px; border-radius: 50%; }
.ec-minimap {
  position: absolute;
  right: 16px;
  bottom: 16px;
  z-index: 24;
  padding: 7px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 11px;
  background: var(--ec-panel);
  box-shadow: var(--ec-float-shadow);
}
.ec-minimap-head { display: flex; justify-content: space-between; gap: 16px; padding: 1px 2px 5px; color: var(--dsw-alias-label-secondary); font-size: 8px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.ec-minimap-svg { display: block; border-radius: 6px; cursor: crosshair; }
.ec-zoom {
  position: absolute;
  left: 16px;
  bottom: 16px;
  z-index: 25;
  display: flex;
  align-items: center;
  gap: 1px;
  height: 34px;
  padding: 3px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 9px;
  background: var(--ec-panel);
  box-shadow: 0 4px 18px rgba(15, 23, 42, .10);
}
.ec-zoom .ec-icon-btn { width: 27px; height: 27px; border-radius: 6px; }
.ec-zoom-value { min-width: 42px; height: 27px; padding: 0 5px; border-radius: 6px; color: var(--dsw-alias-label-secondary); font-size: 9.5px; font-weight: 700; font-variant-numeric: tabular-nums; }
.ec-zoom-value:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.ec-zoom-sep { width: 1px; height: 18px; margin: 0 3px; background: var(--dsw-alias-border-l1); }
.ec-hint {
  position: absolute;
  left: 50%;
  bottom: 17px;
  z-index: 23;
  display: flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 8px 0 9px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 999px;
  background: var(--ec-panel);
  box-shadow: 0 4px 18px rgba(15, 23, 42, .09);
  color: var(--dsw-alias-label-secondary);
  font-size: 9.5px;
  white-space: nowrap;
  transform: translateX(-50%);
}
.ec-hint i { width: 3px; height: 3px; margin: 0 2px; border-radius: 50%; background: var(--dsw-alias-border-l2); }
.ec-hint-close { width: 21px; height: 21px; margin-left: 3px; border-radius: 50%; }
.ec-toast {
  position: absolute;
  left: 50%;
  bottom: 64px;
  z-index: 70;
  display: flex;
  align-items: center;
  gap: 7px;
  max-width: 420px;
  padding: 8px 13px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 9px;
  background: var(--ec-panel);
  box-shadow: var(--ec-float-shadow);
  color: var(--dsw-alias-label-primary);
  font-size: 11px;
  font-weight: 500;
  transform: translateX(-50%);
  animation: ec-toast-in .18s ease-out;
  pointer-events: none;
}
@keyframes ec-toast-in { from { opacity: 0; transform: translate(-50%, 5px); } }
.ec-empty {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 40;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 362px;
  padding: 30px 28px 26px;
  border: 1px solid var(--ec-panel-border);
  border-radius: 16px;
  background: var(--ec-panel-sunken);
  box-shadow: var(--ec-float-shadow);
  text-align: center;
  transform: translate(-50%, -50%);
}
.ec-empty-mark { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 12px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 13%, var(--ec-panel)); color: var(--dsw-alias-brand-primary); }
.ec-empty h2 { margin: 14px 0 5px; color: var(--dsw-alias-label-primary); font-size: 18px; font-weight: 700; line-height: 1.25; letter-spacing: -.025em; }
.ec-empty p { max-width: 31ch; margin: 0 0 19px; color: color-mix(in srgb, var(--dsw-alias-label-primary) 68%, transparent); font-size: 11.5px; line-height: 1.55; }
.ec-empty-actions { display: flex; gap: 7px; }
.ec-empty-actions .ec-btn { height: 34px; }
.ec-empty-actions .ec-btn:not(.ec-btn--primary) { border-color: var(--ec-panel-border); background: var(--ec-panel); }

/* inspector */
.ec-inspector {
  position: relative;
  z-index: 30;
  display: flex;
  flex-direction: column;
  flex: none;
  width: 316px;
  min-height: 0;
  border-left: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1);
}
.ec-inspector-head {
  display: flex;
  align-items: center;
  gap: 9px;
  flex: none;
  min-height: 60px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.ec-inspector-mark { display: grid; place-items: center; width: 32px; height: 32px; flex: none; border-radius: 9px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); }
.ec-inspector-title { flex: 1; min-width: 0; }
.ec-inspector-title h2 { overflow: hidden; margin: 1px 0 0; font-size: 13px; font-weight: 650; letter-spacing: -.012em; text-overflow: ellipsis; white-space: nowrap; }
.ec-inspector-body { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 0 13px 8px; scrollbar-width: thin; }
.ec-inspector-body::-webkit-scrollbar { width: 7px; }
.ec-inspector-body::-webkit-scrollbar-thumb { border: 2px solid transparent; border-radius: 4px; background: var(--dsw-alias-border-l2); background-clip: content-box; }
.ec-inspector-section { padding: 13px 0; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.ec-inspector-section:last-child { border-bottom: 0; }
.ec-section-title { margin: 0 0 8px; color: var(--dsw-alias-label-secondary); font-size: 8.5px; font-weight: 750; letter-spacing: .09em; text-transform: uppercase; }
.ec-section-title--spaced { margin-top: 13px; }
.ec-section-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
.ec-section-head .ec-section-title { margin: 0; }
.ec-section-meta { color: var(--dsw-alias-label-secondary); font-size: 9px; font-weight: 600; font-variant-numeric: tabular-nums; }
.ec-field-input, .ec-field-textarea {
  width: 100%;
  height: 31px;
  padding: 0 8px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 7px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
  font-size: 11px;
  outline: none;
  transition: border-color .12s, background .12s;
}
.ec-field-input:hover, .ec-field-textarea:hover { border-color: var(--dsw-alias-border-l2); }
.ec-field-input:focus, .ec-field-textarea:focus { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-bg-layer-1); }
.ec-field-input::placeholder, .ec-field-textarea::placeholder { color: var(--dsw-alias-label-secondary); opacity: .75; }
.ec-field-textarea { height: auto; min-height: 66px; padding: 7px 8px; line-height: 1.5; resize: vertical; }
.ec-task-title-field { height: 34px; font-size: 14px; font-weight: 650; letter-spacing: -.01em; }
.ec-field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.ec-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.ec-field > span, .ec-field-label { color: var(--dsw-alias-label-secondary); font-size: 8.5px; font-weight: 650; letter-spacing: .04em; text-transform: uppercase; }
.ec-field-grid .ec-field:last-child:nth-child(odd) { grid-column: span 2; }
.ec-task-status-line { display: flex; align-items: center; gap: 7px; margin-bottom: 9px; }
.ec-focus-btn { margin-left: auto; width: 26px; height: 26px; border-radius: 6px; }
.ec-status-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
.ec-status-choice {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 7px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary);
  font-size: 10px;
  font-weight: 600;
  text-align: left;
}
.ec-status-choice:hover { border-color: var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); }
.ec-status-choice.is-active {
  border-color: color-mix(in srgb, var(--status-color) 48%, var(--dsw-alias-border-l1));
  background: color-mix(in srgb, var(--status-color) 10%, transparent);
  color: color-mix(in srgb, var(--status-color) 76%, var(--dsw-alias-label-primary));
}
.ec-priority-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
.ec-priority-choice {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 7px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 7px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary);
  font-size: 9px;
  text-align: left;
}
.ec-priority-choice strong { color: var(--dsw-alias-label-primary); font-size: 9.5px; font-weight: 750; }
.ec-priority-choice span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ec-priority-choice:hover { border-color: var(--dsw-alias-border-l2); }
.ec-priority-choice.is-active { border-color: color-mix(in srgb, var(--priority-color) 44%, var(--dsw-alias-border-l1)); background: color-mix(in srgb, var(--priority-color) 8%, transparent); }
.ec-priority-bar { width: 4px; height: 14px; flex: none; border-radius: 2px; background: var(--priority-color); opacity: .45; }
.ec-priority-choice.is-active .ec-priority-bar { opacity: 1; }
.ec-tags-field { display: flex; flex-direction: column; gap: 5px; grid-column: span 2; }
.ec-tags-preview { display: flex; flex-wrap: wrap; gap: 3px; }
.ec-checks { display: flex; flex-direction: column; gap: 2px; }
.ec-check { display: flex; align-items: center; gap: 6px; min-height: 27px; padding: 1px 3px; border-radius: 5px; }
.ec-check:hover { background: var(--dsw-alias-bg-layer-2); }
.ec-check-box {
  display: grid;
  place-items: center;
  width: 15px;
  height: 15px;
  flex: none;
  padding: 0;
  border: 1.3px solid var(--dsw-alias-border-l2);
  border-radius: 4px;
  background: var(--dsw-alias-bg-layer-1);
  color: oklch(98% 0.004 255);
}
.ec-check.is-done .ec-check-box { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-brand-primary); }
.ec-check-input { flex: 1; min-width: 0; height: 23px; padding: 0 4px; border: 0; border-radius: 4px; outline: none; background: transparent; font-size: 10.5px; }
.ec-check-input:focus { background: var(--dsw-alias-bg-layer-1); box-shadow: inset 0 0 0 1px var(--dsw-alias-border-l1); }
.ec-check.is-done .ec-check-input { color: var(--dsw-alias-label-secondary); text-decoration: line-through; }
.ec-check-delete { display: grid; place-items: center; width: 19px; height: 19px; padding: 0; border-radius: 4px; color: var(--dsw-alias-label-secondary); opacity: 0; }
.ec-check:hover .ec-check-delete { opacity: 1; }
.ec-check-delete:hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 9%, transparent); color: var(--dsw-alias-state-error-primary); }
.ec-add-row { display: flex; align-items: center; gap: 5px; height: 27px; margin-top: 3px; padding: 0 4px; border-radius: 5px; color: var(--dsw-alias-label-secondary); font-size: 10px; font-weight: 550; text-align: left; }
.ec-add-row:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.ec-inspector-progress { display: flex; align-items: center; gap: 7px; margin-top: 8px; color: var(--dsw-alias-label-secondary); font-size: 9px; font-weight: 600; }
.ec-inspector-progress .ec-task-progress-track { height: 5px; }
.ec-dep-group { margin-top: 8px; }
.ec-dep-group:first-of-type { margin-top: 0; }
.ec-dep-label { display: block; margin-bottom: 3px; color: var(--dsw-alias-label-secondary); font-size: 8.5px; font-weight: 600; }
.ec-dep-row {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  height: 28px;
  padding: 0 6px;
  border-radius: 5px;
  color: var(--dsw-alias-label-primary);
  font-size: 10px;
  text-align: left;
}
.ec-dep-row span:nth-child(2) { overflow: hidden; flex: 1; text-overflow: ellipsis; white-space: nowrap; }
.ec-dep-row:hover { background: var(--dsw-alias-bg-layer-2); }
.ec-hint-copy { margin: 4px 0 0; color: var(--dsw-alias-label-secondary); font-size: 9.5px; line-height: 1.5; }
.ec-inspector-section--actions { display: flex; flex-direction: column; gap: 6px; padding-top: 12px; }
.ec-btn-row { display: flex; gap: 6px; margin-top: 6px; }
.ec-btn-row .ec-btn { height: 29px; padding: 0 6px; font-size: 9.5px; }
.ec-edge-endpoints { display: flex; align-items: center; gap: 6px; margin-bottom: 12px; }
.ec-edge-endpoints > .ec-icon { color: var(--dsw-alias-label-secondary); }
.ec-endpoint { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; padding: 7px 8px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 7px; background: var(--dsw-alias-bg-layer-2); text-align: left; }
.ec-endpoint:hover { border-color: var(--dsw-alias-border-l2); }
.ec-endpoint-label { color: var(--dsw-alias-label-secondary); font-size: 7.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.ec-endpoint strong { overflow: hidden; font-size: 10px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.ec-switch-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 12px; color: var(--dsw-alias-label-secondary); font-size: 10px; font-weight: 600; }
.ec-switch { width: 30px; height: 17px; padding: 2px; border-radius: 999px; background: var(--dsw-alias-border-l2); transition: background .14s; }
.ec-switch span { display: block; width: 13px; height: 13px; border-radius: 50%; background: oklch(98% 0.004 255); box-shadow: 0 1px 2px rgba(15, 23, 42, .25); transition: transform .14s; }
.ec-switch.is-on { background: var(--dsw-alias-brand-primary); }
.ec-switch.is-on span { transform: translateX(13px); }
.ec-tone-field { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
.ec-swatches { display: flex; gap: 6px; }
.ec-swatch { width: 22px; height: 22px; padding: 0; border: 2px solid transparent; border-radius: 50%; background: var(--swatch); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .25); }
.ec-swatch.is-active { border-color: var(--dsw-alias-label-primary); box-shadow: 0 0 0 2px var(--dsw-alias-bg-layer-1), 0 0 0 3.5px var(--swatch); }
.ec-shape-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 8px; }
.ec-shape-type { display: flex; align-items: center; gap: 7px; min-height: 35px; padding: 4px 7px; border: 1px solid transparent; border-radius: 6px; color: var(--dsw-alias-label-secondary); font-size: 9px; font-weight: 600; text-align: left; }
.ec-shape-type:hover { border-color: var(--dsw-alias-border-l1); background: var(--ec-panel-sunken); color: var(--dsw-alias-label-primary); }
.ec-shape-type.is-active { border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 34%, transparent); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent); color: var(--dsw-alias-brand-primary); }
.ec-shape-type span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ec-segmented { display: flex; gap: 2px; margin-top: 8px; padding: 2px; border-radius: 7px; background: var(--dsw-alias-bg-layer-2); }
.ec-segmented button { flex: 1; height: 25px; border-radius: 5px; color: var(--dsw-alias-label-secondary); font-size: 9px; font-weight: 600; }
.ec-segmented button:hover { color: var(--dsw-alias-label-primary); }
.ec-segmented button.is-active { background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); box-shadow: 0 1px 3px rgba(15, 23, 42, .1); }
.ec-range { width: 100%; accent-color: var(--dsw-alias-brand-primary); }
.ec-group-summary { display: flex; align-items: center; gap: 9px; margin-bottom: 13px; }
.ec-group-summary-icon { display: grid; place-items: center; width: 34px; height: 34px; flex: none; border-radius: 9px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, transparent); color: var(--dsw-alias-brand-primary); }
.ec-group-summary strong { display: block; font-size: 12px; font-weight: 650; }
.ec-group-summary span { display: block; margin-top: 1px; color: var(--dsw-alias-label-secondary); font-size: 9px; }
.ec-multi-summary { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 13px; }
.ec-summary-chip { padding: 3px 7px; border-radius: 5px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); font-size: 9px; font-weight: 600; }
.ec-align-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
.ec-align-btn { height: 28px; padding: 0 4px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 6px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); font-size: 9px; font-weight: 600; }
.ec-align-btn:hover { border-color: var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); }
.ec-selection-list { display: flex; flex-direction: column; gap: 2px; max-height: 170px; overflow-y: auto; }
.ec-selection-row { display: flex; align-items: center; gap: 6px; height: 27px; padding: 0 6px; border-radius: 5px; color: var(--dsw-alias-label-primary); font-size: 10px; text-align: left; }
.ec-selection-row:hover { background: var(--dsw-alias-bg-layer-2); }
.ec-selection-row span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ec-board-health { display: flex; align-items: center; gap: 16px; }
.ec-health-ring { position: relative; width: 86px; height: 86px; flex: none; }
.ec-health-ring-copy { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.ec-health-ring-copy strong { font-size: 17px; font-weight: 720; letter-spacing: -.03em; }
.ec-health-ring-copy span { color: var(--dsw-alias-label-secondary); font-size: 8px; font-weight: 600; }
.ec-health-stats { display: flex; flex-direction: column; gap: 5px; flex: 1; }
.ec-stat-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.ec-stat-label { display: flex; align-items: center; gap: 5px; color: var(--dsw-alias-label-secondary); font-size: 9.5px; }
.ec-stat-row strong { font-size: 11px; font-weight: 700; font-variant-numeric: tabular-nums; }
.ec-status-bars { display: flex; flex-direction: column; gap: 2px; }
.ec-status-bar-row { display: flex; align-items: center; gap: 6px; height: 27px; padding: 0 5px; border-radius: 5px; text-align: left; }
.ec-status-bar-row:hover { background: var(--dsw-alias-bg-layer-2); }
.ec-status-bar-row.is-active { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent); }
.ec-status-bar-label { width: 64px; flex: none; color: var(--dsw-alias-label-secondary); font-size: 9px; font-weight: 600; }
.ec-status-bar-track { flex: 1; height: 4px; overflow: hidden; border-radius: 2px; background: color-mix(in srgb, var(--dsw-alias-label-secondary) 10%, transparent); }
.ec-status-bar-track span { display: block; height: 100%; border-radius: inherit; opacity: .85; }
.ec-status-bar-count { width: 17px; flex: none; color: var(--dsw-alias-label-secondary); font-size: 8.5px; font-weight: 650; text-align: right; font-variant-numeric: tabular-nums; }
.ec-board-list { display: flex; flex-direction: column; gap: 2px; max-height: 190px; overflow-y: auto; }
.ec-board-row { display: flex; align-items: center; gap: 7px; width: 100%; padding: 6px; border: 1px solid transparent; border-radius: 7px; text-align: left; }
.ec-board-row:hover { background: var(--dsw-alias-bg-layer-2); }
.ec-board-row.is-active { border-color: var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2); }
.ec-board-row-icon { display: grid; place-items: center; width: 26px; height: 26px; flex: none; border-radius: 6px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); }
.ec-board-row.is-active .ec-board-row-icon { color: var(--dsw-alias-brand-primary); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, transparent); }
.ec-board-row-copy { display: flex; flex-direction: column; min-width: 0; flex: 1; gap: 1px; }
.ec-board-row-copy strong { overflow: hidden; font-size: 10px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.ec-board-row-copy span { color: var(--dsw-alias-label-secondary); font-size: 8px; }
.ec-board-row-dot { width: 6px; height: 6px; flex: none; border-radius: 50%; background: var(--dsw-alias-brand-primary); }
.ec-mini-btn { display: inline-flex; align-items: center; gap: 3px; height: 22px; padding: 0 6px; border-radius: 5px; color: var(--dsw-alias-brand-primary); font-size: 9px; font-weight: 650; }
.ec-mini-btn:hover { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, transparent); }
.ec-inspector-section--tip { display: flex; gap: 8px; align-items: flex-start; color: var(--dsw-alias-label-secondary); }
.ec-inspector-section--tip .ec-icon { margin-top: 1px; color: var(--dsw-alias-brand-primary); opacity: .7; }
.ec-inspector-section--tip p { margin: 0; font-size: 9.5px; line-height: 1.55; }
.ec-inspector-foot { display: flex; align-items: center; gap: 5px; flex: none; height: 32px; padding: 0 13px; border-top: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary); font-size: 8.5px; }
.ec-foot-sep { width: 1px; height: 12px; margin: 0 2px; background: var(--dsw-alias-border-l1); }

/* rich note detail */
.ec-note-focus {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(3, 7, 15, .64);
  backdrop-filter: blur(7px) saturate(.88);
  opacity: 0;
  transition: opacity .2s ease;
}
.ec-note-focus.is-open { opacity: 1; }
.ec-note-focus-panel {
  display: flex;
  flex-direction: column;
  max-width: calc(100% - 2px);
  max-height: calc(100% - 2px);
  overflow: hidden;
  border: 1px solid var(--ec-panel-border);
  border-radius: 18px;
  background: var(--ec-panel);
  box-shadow: 0 36px 120px rgba(2, 6, 15, .62), 0 4px 16px rgba(2, 6, 15, .3);
  transform-origin: center center;
  transition: transform 300ms cubic-bezier(.16, 1, .3, 1), opacity .2s ease;
  will-change: transform;
}
.ec-note-detail-head {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: none;
  height: 58px;
  padding: 0 15px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
  background: var(--ec-panel);
}
.ec-note-back {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--ec-panel-border);
  border-radius: 7px;
  background: var(--ec-panel-sunken);
  color: var(--dsw-alias-label-secondary);
  font-size: 10px;
  font-weight: 600;
}
.ec-note-back:hover { color: var(--dsw-alias-label-primary); border-color: var(--dsw-alias-border-l2); }
.ec-note-detail-heading { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.ec-note-detail-heading > span:last-child { color: var(--dsw-alias-label-secondary); font-size: 9px; font-weight: 500; }
.ec-note-detail-actions { display: flex; align-items: center; gap: 4px; margin-left: auto; }
.ec-note-colors { display: flex; align-items: center; gap: 4px; padding-right: 7px; margin-right: 3px; border-right: 1px solid var(--dsw-alias-border-l1); }
.ec-note-color {
  width: 17px;
  height: 17px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 50%;
  background: var(--swatch);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .24);
}
.ec-note-color.is-active { border-color: var(--dsw-alias-label-primary); box-shadow: 0 0 0 2px var(--ec-panel), 0 0 0 3.5px var(--swatch); }
.ec-note-detail-actions .ec-icon-btn { width: 28px; height: 28px; border-radius: 7px; }
.ec-note-delete:hover { color: var(--dsw-alias-state-error-primary) !important; background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 9%, transparent) !important; }
.ec-note-detail-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 34px 42px 46px;
  scrollbar-width: thin;
}
.ec-note-detail-body::-webkit-scrollbar { width: 7px; }
.ec-note-detail-body::-webkit-scrollbar-thumb { border: 2px solid transparent; border-radius: 4px; background: var(--dsw-alias-border-l2); background-clip: content-box; }
.ec-note-editor-inner { width: 100%; max-width: 690px; margin: 0 auto; }
.ec-note-detail-title {
  width: 100%;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font-size: 32px;
  font-weight: 720;
  letter-spacing: -.035em;
  line-height: 1.2;
}
.ec-note-detail-title::placeholder { color: color-mix(in srgb, var(--dsw-alias-label-primary) 38%, transparent); }
.ec-note-detail-meta { display: flex; align-items: center; gap: 7px; margin: 9px 0 25px; color: var(--dsw-alias-label-secondary); font-size: 9px; }
.ec-note-blocks { display: flex; flex-direction: column; gap: 1px; }
.ec-note-block {
  position: relative;
  display: grid;
  grid-template-columns: 25px 22px minmax(0, 1fr);
  align-items: flex-start;
  margin: 0 -8px;
  padding: 3px 8px;
  border-radius: 6px;
}
.ec-note-block:hover { background: color-mix(in srgb, var(--dsw-alias-bg-layer-2) 54%, transparent); }
.ec-note-block-gutter {
  display: flex;
  align-items: center;
  gap: 1px;
  height: 24px;
  opacity: 0;
  transition: opacity .12s;
}
.ec-note-block:hover .ec-note-block-gutter, .ec-note-block:focus-within .ec-note-block-gutter { opacity: 1; }
.ec-note-block-plus {
  display: grid;
  place-items: center;
  width: 19px;
  height: 20px;
  padding: 0;
  border-radius: 4px;
  color: var(--dsw-alias-label-secondary);
}
.ec-note-block-plus:hover { background: var(--ec-panel); color: var(--dsw-alias-label-primary); }
.ec-note-block-handle { color: var(--dsw-alias-label-secondary); font-size: 11px; opacity: .55; cursor: grab; }
.ec-note-block-prefix { display: flex; justify-content: center; min-height: 24px; padding-top: 3px; color: var(--dsw-alias-label-secondary); font-size: 12px; }
.ec-note-block-content { position: relative; min-width: 0; }
.ec-note-block-text {
  display: block;
  width: 100%;
  min-height: 24px;
  padding: 2px 3px;
  border: 0;
  outline: none;
  overflow: hidden;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  line-height: 1.65;
  resize: none;
}
.ec-note-block-text::placeholder { color: color-mix(in srgb, var(--dsw-alias-label-primary) 32%, transparent); }
.ec-note-block--heading1 .ec-note-block-text { padding-top: 14px; font-size: 30px; font-weight: 700; letter-spacing: -.03em; line-height: 1.22; }
.ec-note-block--heading2 .ec-note-block-text { padding-top: 11px; font-size: 24px; font-weight: 680; letter-spacing: -.022em; line-height: 1.3; }
.ec-note-block--heading3 .ec-note-block-text { padding-top: 8px; font-size: 19px; font-weight: 660; letter-spacing: -.014em; line-height: 1.35; }
.ec-note-block--quote .ec-note-block-text {
  padding: 7px 11px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 6px;
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-2) 42%, transparent);
  color: color-mix(in srgb, var(--dsw-alias-label-primary) 80%, transparent);
  font-style: italic;
}
.ec-note-block--code .ec-note-block-text, .ec-note-block--math .ec-note-block-text {
  padding: 10px 12px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 7px;
  background: var(--ec-panel-sunken);
  color: var(--dsw-alias-label-primary);
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 12px;
  line-height: 1.6;
}
.ec-note-block--code .ec-note-block-text { white-space: pre; }
.ec-note-block--math .ec-note-block-text { color: var(--dsw-alias-brand-primary); font-size: 13px; text-align: center; }
.ec-note-block--math .ec-note-block-prefix { color: var(--dsw-alias-brand-primary); }
.ec-note-bullet, .ec-note-number, .ec-note-quote-mark, .ec-note-code-mark, .ec-note-math-mark { display: block; padding-top: 1px; font-weight: 650; }
.ec-note-bullet { font-size: 15px; }
.ec-note-number { font-size: 10px; font-variant-numeric: tabular-nums; }
.ec-note-quote-mark { color: var(--dsw-alias-brand-primary); font-size: 17px; line-height: 1; }
.ec-note-code-mark, .ec-note-math-mark { padding-top: 4px; font-family: monospace; font-size: 8px; }
.ec-note-todo-box {
  display: grid;
  place-items: center;
  width: 15px;
  height: 15px;
  margin-top: 4px;
  padding: 0;
  border: 1.2px solid var(--dsw-alias-border-l2);
  border-radius: 4px;
  background: var(--ec-panel);
  color: var(--ec-panel);
}
.ec-note-todo-box.is-checked { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-brand-primary); color: var(--ec-panel); }
.ec-note-block--todo.is-checked .ec-note-block-text { color: var(--dsw-alias-label-secondary); text-decoration: line-through; }
.ec-note-block--todo .ec-note-block-prefix { padding-top: 2px; }
.ec-note-add-block {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 31px;
  margin-top: 7px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--dsw-alias-label-secondary);
  font-size: 10px;
  font-weight: 550;
}
.ec-note-add-block:hover { border-color: var(--dsw-alias-border-l1); background: var(--ec-panel-sunken); color: var(--dsw-alias-label-primary); }
.ec-note-editor-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 36px; padding-top: 13px; border-top: 1px solid var(--dsw-alias-border-l1); color: color-mix(in srgb, var(--dsw-alias-label-primary) 48%, transparent); font-size: 8.5px; }
.ec-note-slash {
  position: absolute;
  top: calc(100% + 5px);
  left: 3px;
  z-index: 80;
  width: 302px;
  max-height: 382px;
  overflow-y: auto;
  padding: 5px;
  border: 1px solid var(--ec-panel-border);
  border-radius: 10px;
  background: var(--ec-panel);
  box-shadow: var(--ec-float-shadow);
  animation: ec-pop .12s ease-out;
}
.ec-note-slash-head { padding: 6px 8px 4px; color: var(--dsw-alias-label-secondary); font-size: 8px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
.ec-note-command-group { padding: 6px 8px 3px; color: color-mix(in srgb, var(--dsw-alias-label-primary) 48%, transparent); font-size: 7.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.ec-note-command { display: flex; align-items: center; gap: 8px; width: 100%; height: 31px; padding: 0 7px; border: 1px solid transparent; border-radius: 6px; color: var(--dsw-alias-label-primary); text-align: left; }
.ec-note-command:hover, .ec-note-command.is-active { border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 28%, transparent); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, transparent); }
.ec-note-command-icon { display: grid; place-items: center; width: 22px; height: 22px; flex: none; border-radius: 5px; background: var(--ec-panel-sunken); color: var(--dsw-alias-label-secondary); }
.ec-note-command.is-active .ec-note-command-icon { color: var(--dsw-alias-brand-primary); }
.ec-note-command-label { flex: 1; overflow: hidden; font-size: 10.5px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
.ec-block-glyph { display: grid; place-items: center; width: 18px; height: 18px; color: currentColor; font-family: inherit; font-size: 8px; font-weight: 750; letter-spacing: -.02em; }
.ec-block-glyph--code { font-family: monospace; font-size: 7px; }
.ec-block-glyph--math { font-family: serif; font-size: 14px; font-style: italic; }
.ec-block-glyph--todo { color: currentColor; }
.ec-note-command kbd { height: 16px; min-width: 17px; padding: 0 4px; font-size: 8px; opacity: .65; }
.ec-note-slash-foot { margin-top: 4px; padding: 7px 8px 3px; border-top: 1px solid var(--dsw-alias-border-l1); color: color-mix(in srgb, var(--dsw-alias-label-primary) 42%, transparent); font-size: 8px; }
.ec-note-inspector-preview { margin-bottom: 9px; padding: 10px 11px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; background: var(--ec-panel-sunken); }
.ec-note-inspector-preview strong { display: block; overflow: hidden; color: var(--dsw-alias-label-primary); font-size: 11.5px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
.ec-note-inspector-preview p { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; margin: 4px 0 0; color: var(--dsw-alias-label-secondary); font-size: 10px; line-height: 1.45; }
.ec-note-open { position: absolute; top: 11px; right: 11px; z-index: 2; color: var(--dsw-alias-label-secondary); opacity: 0; transition: opacity .13s; }
.ec-node--note:hover .ec-note-open { opacity: 1; }
@media (max-width: 720px) {
  .ec-note-detail-body { padding: 24px 22px 32px; }
  .ec-note-detail-title { font-size: 24px; }
  .ec-note-detail-head { padding: 0 10px; gap: 7px; }
  .ec-note-detail-heading { display: none; }
  .ec-note-detail-actions .ec-note-colors { display: none; }
  .ec-note-slash { width: min(302px, calc(100vw - 60px)); }
}
@media (prefers-reduced-motion: reduce) {
  .ec-note-focus, .ec-note-focus-panel { transition-duration: .001ms !important; }
}

/* overlays and dialogs */
.ec-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(5, 8, 15, .62);
  backdrop-filter: blur(6px) saturate(.82);
  animation: ec-fade .13s ease-out;
}
@keyframes ec-fade { from { opacity: 0; } }
.ec-overlay--palette { align-items: flex-start; padding-top: 13vh; }
.ec-palette {
  width: min(560px, 94vw);
  overflow: hidden;
  border: 1px solid var(--ec-panel-border);
  border-radius: 13px;
  background: var(--ec-panel);
  box-shadow: var(--ec-float-shadow);
  color: var(--dsw-alias-label-primary);
  animation: ec-dialog-in .16s ease-out;
}
@keyframes ec-dialog-in { from { opacity: 0; transform: translateY(-6px) scale(.985); } }
.ec-palette-search { display: flex; align-items: center; gap: 9px; height: 48px; padding: 0 13px; border-bottom: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary); }
.ec-palette-search input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; font-size: 13px; }
.ec-palette-search input::placeholder { color: var(--dsw-alias-label-secondary); }
.ec-palette-list { max-height: 390px; overflow-y: auto; padding: 5px; }
.ec-palette-group { padding: 7px 9px 3px; color: var(--dsw-alias-label-secondary); font-size: 8px; font-weight: 750; letter-spacing: .1em; text-transform: uppercase; }
.ec-palette-row { display: flex; align-items: center; gap: 9px; width: 100%; height: 35px; padding: 0 9px; border-radius: 7px; color: var(--dsw-alias-label-primary); text-align: left; }
.ec-palette-row.is-active { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, transparent); }
.ec-palette-icon { display: grid; place-items: center; width: 25px; height: 25px; flex: none; border-radius: 6px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); }
.ec-palette-row.is-active .ec-palette-icon { color: var(--dsw-alias-brand-primary); }
.ec-palette-label { flex: 1; overflow: hidden; font-size: 11.5px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
.ec-palette-footer, .ec-palette-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 13px; border-top: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary); font-size: 8.5px; }
.ec-palette-foot span { display: flex; align-items: center; gap: 3px; }
.ec-palette-empty { padding: 26px; color: var(--dsw-alias-label-secondary); font-size: 11px; text-align: center; }
.ec-dialog {
  width: min(620px, 94vw);
  max-height: 88vh;
  overflow: auto;
  border: 1px solid var(--ec-panel-border);
  border-radius: 16px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary) 3%, transparent), transparent 150px),
    var(--ec-panel);
  box-shadow: 0 32px 110px rgba(2, 6, 15, .52), 0 3px 12px rgba(2, 6, 15, .24);
  color: var(--dsw-alias-label-primary);
  animation: ec-dialog-in .17s ease-out;
}
.ec-dialog--templates { width: min(780px, 94vw); }
.ec-dialog--shortcuts { width: min(720px, 94vw); }
.ec-dialog--confirm { width: min(410px, 92vw); padding: 24px; text-align: center; }
.ec-dialog-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 21px 23px 2px; }
.ec-dialog-head h2 { margin: 3px 0 0; font-size: 21px; font-weight: 680; letter-spacing: -.025em; }
.ec-dialog-sub { max-width: 46ch; margin: 6px 0 0; color: color-mix(in srgb, var(--dsw-alias-label-primary) 62%, transparent); font-size: 10.5px; line-height: 1.5; }
.ec-template-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 17px 22px 6px; }
.ec-template-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 196px;
  padding: 12px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-secondary) 24%, transparent);
  border-radius: 12px;
  background: var(--ec-panel-sunken);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary) 4%, transparent);
  text-align: left;
  transition: border-color .14s, transform .14s, box-shadow .14s, background .14s;
}
.ec-template-card:hover {
  border-color: color-mix(in srgb, var(--template-accent) 58%, var(--dsw-alias-border-l2));
  background: color-mix(in srgb, var(--template-accent) 5%, var(--ec-panel-sunken));
  transform: translateY(-1px);
  box-shadow: 0 10px 28px rgba(2, 6, 15, .22);
}
.ec-template-preview {
  position: relative;
  height: 92px;
  overflow: hidden;
  margin-bottom: 10px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-secondary) 18%, transparent);
  border-radius: 8px;
  background:
    radial-gradient(circle at 18% 0%, color-mix(in srgb, var(--template-accent) 12%, transparent), transparent 58%),
    radial-gradient(circle, color-mix(in srgb, var(--dsw-alias-label-secondary) 18%, transparent) 1px, transparent 1.1px) 0 0 / 13px 13px,
    var(--dsw-alias-bg-base);
}
.ec-template-preview--sprint { display: flex; gap: 5px; padding: 10px 8px; }
.tp-lane { flex: 1; border: 1px dashed color-mix(in srgb, var(--dsw-alias-label-secondary) 26%, transparent); border-radius: 5px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 45%, transparent); }
.tp-card { position: absolute; width: 36px; height: 18px; border-radius: 3px; background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l2); box-shadow: 0 1px 2px rgba(15, 23, 42, .08); }
.tp-card--a { left: 17px; top: 28px; border-color: #4f7cf7; }
.tp-card--b { left: 88px; top: 28px; border-color: #d18b00; }
.tp-card--c { left: 159px; top: 28px; border-color: #e05252; }
.tp-node { position: absolute; width: 54px; height: 23px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 5px; background: var(--dsw-alias-bg-layer-1); }
.tp-node--a { left: 18px; top: 24px; border-color: #4f7cf7; }
.tp-node--b { left: 132px; top: 20px; border-color: #2f9e63; }
.tp-node--c { left: 74px; top: 55px; border-color: #d18b00; }
.tp-flow-start { position: absolute; left: 18px; top: 9px; width: 18px; height: 18px; border: 1px solid #2f9e63; border-radius: 50%; }
.tp-flow-process { position: absolute; left: 16px; top: 39px; width: 54px; height: 18px; border: 1px solid #4f7cf7; border-radius: 4px; }
.tp-flow-decision { position: absolute; left: 96px; top: 29px; width: 22px; height: 22px; border: 1px solid #d18b00; transform: rotate(45deg); }
.tp-flow-io { position: absolute; left: 154px; top: 43px; width: 52px; height: 18px; border: 1px solid #df5f7c; transform: skewX(-16deg); }
.tp-line { position: absolute; height: 1px; background: var(--dsw-alias-label-secondary); opacity: .5; transform-origin: left center; }
.tp-line--a { left: 72px; top: 36px; width: 60px; transform: rotate(-5deg); }
.tp-line--b { left: 96px; top: 55px; width: 40px; transform: rotate(45deg); }
.tp-line--c { left: 52px; top: 29px; width: 11px; transform: rotate(90deg); }
.tp-line--d { left: 72px; top: 46px; width: 25px; transform: rotate(12deg); }
.tp-line--e { left: 121px; top: 40px; width: 34px; transform: rotate(7deg); }
.tp-alert { position: absolute; left: 14px; top: 13px; width: 4px; height: 66px; border-radius: 2px; background: #e05252; }
.tp-note { position: absolute; left: 118px; top: 44px; width: 70px; height: 38px; border-radius: 4px; background: rgba(217, 163, 0, .15); border: 1px solid rgba(217, 163, 0, .4); }
.tp-blank { position: absolute; inset: 0; display: grid; place-items: center; color: var(--dsw-alias-label-secondary); opacity: .55; }
.ec-template-name { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 650; letter-spacing: -.008em; }
.ec-template-name::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--template-accent); }
.ec-template-desc { margin-top: 3px; color: color-mix(in srgb, var(--dsw-alias-label-primary) 68%, transparent); font-size: 10.5px; line-height: 1.5; text-wrap: pretty; }
.ec-template-arrow { position: absolute; top: 13px; right: 13px; color: var(--dsw-alias-label-primary); opacity: 0; transform: translate(-2px, 2px); transition: opacity .13s, transform .13s; }
.ec-template-card:hover .ec-template-arrow { opacity: 1; transform: none; }
.ec-dialog-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 4px; padding: 14px 23px 19px; border-top: 1px solid color-mix(in srgb, var(--dsw-alias-border-l1) 70%, transparent); color: color-mix(in srgb, var(--dsw-alias-label-primary) 62%, transparent); font-size: 10px; }
.ec-dialog .ec-btn { background: var(--ec-panel-sunken); border-color: var(--ec-panel-border); }
.ec-dialog .ec-icon-btn:hover { background: var(--ec-panel-sunken); }
.ec-dialog-actions { display: flex; justify-content: center; gap: 7px; margin-top: 18px; }
.ec-confirm-icon { display: grid; place-items: center; width: 44px; height: 44px; margin: 0 auto 12px; border-radius: 12px; background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent); color: var(--dsw-alias-state-error-primary); }
.ec-dialog--confirm h2 { margin: 0 0 6px; font-size: 16px; font-weight: 680; letter-spacing: -.02em; }
.ec-dialog--confirm p { margin: 0; color: var(--dsw-alias-label-secondary); font-size: 10.5px; line-height: 1.55; }
.ec-shortcut-grid { display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 20px; padding: 20px 22px 4px; }
.ec-shortcut-group h3 { margin: 0 0 7px; color: var(--dsw-alias-label-secondary); font-size: 8.5px; font-weight: 750; letter-spacing: .09em; text-transform: uppercase; }
.ec-shortcut-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 27px; border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-border-l1) 55%, transparent); color: var(--dsw-alias-label-secondary); font-size: 9.5px; }
.ec-shortcut-row:last-child { border-bottom: 0; }
.ec-shortcut-row kbd { flex: none; }


@container (max-width: 1120px) {
  .ec-progress-pill { display: none; }
  .ec-board-title { width: min(260px, 27cqw); }
}
@container (max-width: 980px) {
  .ec-search { display: none; }
  .ec-save { display: none; }
  .ec-new-btn { width: 32px; padding: 0; }
  .ec-new-btn span { display: none; }
  .ec-history { display: none; }
  .ec-inspector { width: 296px; }
}
@container (max-width: 760px) {
  .ec-inspector { display: none; }
  .ec-hint { display: none; }
  .ec-minimap { display: none; }
}

@media (max-width: 1240px) {
  .ec-progress-pill { display: none; }
  .ec-search { width: 182px; }
  .ec-board-title { width: min(260px, 27vw); }
}
@media (max-width: 1060px) {
  .ec-search { display: none; }
  .ec-new-btn span { display: none; }
  .ec-new-btn { width: 32px; padding: 0; }
  .ec-inspector { width: 292px; }
  .ec-save { display: none; }
}
@media (max-width: 860px) {
  .ec-inspector { display: none; }
  .ec-hint { display: none; }
  .ec-minimap { display: none; }
  .ec-brand-copy .ec-eyebrow { display: none; }
  .ec-topbar { height: 52px; }
  .ec-board-title { font-size: 13px; }
  .ec-template-grid { grid-template-columns: 1fr; }
  .ec-dialog--templates { width: min(440px, 94vw); }
  .ec-shortcut-grid { grid-template-columns: 1fr; gap: 13px; }
}
@media (max-width: 620px) {
  .ec-rail { width: 44px; }
  .ec-tool { width: 32px; height: 32px; }
  .ec-tool-key { display: none; }
  .ec-history { display: none; }
  .ec-zoom { bottom: 10px; left: 10px; }
  .ec-details-pill {
  position: absolute;
  top: 14px;
  right: 16px;
  z-index: 25;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 999px;
  background: var(--ec-panel);
  box-shadow: 0 4px 16px rgba(15, 23, 42, .10);
  color: var(--dsw-alias-label-secondary);
  font-size: 10px;
  font-weight: 600;
}
.ec-details-pill:hover { border-color: var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); }
.ec-filter-chip { top: 8px; }
}
@media (prefers-reduced-motion: reduce) {
  .ec-root *, .ec-root *::before, .ec-root *::after { animation-duration: .001ms !important; transition-duration: .001ms !important; }
}
`
