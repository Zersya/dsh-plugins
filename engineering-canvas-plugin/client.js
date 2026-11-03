window.__ModuleLoader__.load({
  id: '@local/engineering-canvas',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { Fragment, useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } = React
/* Core constants, visual vocabulary, icons, helpers, and starter boards. */

const STORAGE_KEY = 'dsh.engineering-canvas.v1'
const SCHEMA_VERSION = 1
const PANEL_ID = 'engineering-canvas'
const NS = 'engineering.canvas'
const WORLD_LIMIT = 120000

const STATUS_ORDER = ['backlog', 'todo', 'doing', 'blocked', 'done']
const STATUS = {
  backlog: { label: 'Backlog', color: '#8b95a7', tint: 'rgba(139,149,167,.14)' },
  todo: { label: 'To do', color: '#4f7cf7', tint: 'rgba(79,124,247,.13)' },
  doing: { label: 'In progress', color: '#d18b00', tint: 'rgba(209,139,0,.14)' },
  blocked: { label: 'Blocked', color: '#e05252', tint: 'rgba(224,82,82,.14)' },
  done: { label: 'Done', color: '#2f9e63', tint: 'rgba(47,158,99,.14)' },
}

const PRIORITY_ORDER = ['P0', 'P1', 'P2', 'P3']
const PRIORITY = {
  P0: { label: 'P0', color: '#e5484d', name: 'Urgent' },
  P1: { label: 'P1', color: '#e8830c', name: 'High' },
  P2: { label: 'P2', color: '#4f7cf7', name: 'Medium' },
  P3: { label: 'P3', color: '#8b95a7', name: 'Low' },
}

const TONES = {
  amber: { color: '#d9a300', label: 'Amber' },
  blue: { color: '#4f8ff7', label: 'Blue' },
  rose: { color: '#df5f7c', label: 'Rose' },
  green: { color: '#2f9e63', label: 'Green' },
  slate: { color: '#7d879b', label: 'Slate' },
}
const TONE_ORDER = ['amber', 'blue', 'rose', 'green', 'slate']

const SHAPE_TYPES = [
  { id: 'process', label: 'Process', text: 'Process', w: 220, h: 86 },
  { id: 'decision', label: 'Condition', text: 'Condition?', w: 220, h: 150 },
  { id: 'terminator', label: 'Start / End', text: 'Start', w: 120, h: 120 },
  { id: 'io', label: 'Input / Output', text: 'Input / Output', w: 230, h: 92 },
  { id: 'document', label: 'Document', text: 'Document', w: 220, h: 100 },
  { id: 'database', label: 'Data store', text: 'Data store', w: 200, h: 108 },
  { id: 'subprocess', label: 'Subprocess', text: 'Subprocess', w: 220, h: 90 },
  { id: 'manual', label: 'Manual input', text: 'Manual input', w: 220, h: 92 },
]
const SHAPE_BY_ID = Object.fromEntries(SHAPE_TYPES.map((shape) => [shape.id, shape]))
const SHAPE_ALIASES = { rect: 'process', diamond: 'decision' }
const DEFAULT_SHAPE = 'process'

function normalizeShapeVariant(value) {
  const variant = SHAPE_ALIASES[value] || value
  return SHAPE_BY_ID[variant] ? variant : DEFAULT_SHAPE
}

function shapeDefinition(variant) {
  return SHAPE_BY_ID[normalizeShapeVariant(variant)] || SHAPE_TYPES[0]
}

const TOOL_DEFS = [
  { id: 'select', icon: 'cursor', key: 'V', label: 'Select', group: 1 },
  { id: 'hand', icon: 'hand', key: 'H', label: 'Pan', group: 1 },
  { id: 'task', icon: 'task', key: 'T', label: 'Task card', group: 2 },
  { id: 'note', icon: 'note', key: 'N', label: 'Sticky note', group: 2 },
  { id: 'text', icon: 'text', key: 'X', label: 'Text', group: 2 },
  { id: 'shape', icon: 'shape', key: 'R', label: 'Shape', group: 2 },
  { id: 'frame', icon: 'frame', key: 'F', label: 'Frame', group: 2 },
  { id: 'connect', icon: 'connect', key: 'C', label: 'Connect', group: 3 },
  { id: 'pen', icon: 'pen', key: 'P', label: 'Draw', group: 3 },
  { id: 'eraser', icon: 'eraser', key: 'E', label: 'Eraser', group: 3 },
]

const ICON_PATHS = {
  cursor: [['path', { d: 'M5 3l13.8 8.1-6.1 1.6L9.5 19 5 3z', fill: 'currentColor', stroke: 'none' }]],
  hand: [
    ['path', { d: 'M8 12V6.5a1.5 1.5 0 0 1 3 0V11' }],
    ['path', { d: 'M11 10V5.5a1.5 1.5 0 0 1 3 0V11' }],
    ['path', { d: 'M14 10.5V7a1.5 1.5 0 0 1 3 0v6' }],
    ['path', { d: 'M8 11a1.5 1.5 0 0 0-3 0v3.5c0 3.6 2.4 6.5 6.2 6.5h.8c2.8 0 5-2.2 5-5v-3.3' }],
  ],
  task: [
    ['rect', { x: '3.5', y: '4', width: '17', height: '16', rx: '3' }],
    ['path', { d: 'M8 12l2.4 2.4L16.5 8.3' }],
  ],
  note: [
    ['path', { d: 'M5 4.5h14a1.5 1.5 0 0 1 1.5 1.5v9L15 20.5H5A1.5 1.5 0 0 1 3.5 19V6A1.5 1.5 0 0 1 5 4.5z' }],
    ['path', { d: 'M15 20.2V15h5.2' }],
  ],
  text: [
    ['path', { d: 'M5 6V4.5h14V6' }],
    ['path', { d: 'M12 4.5v15' }],
    ['path', { d: 'M8.5 19.5h7' }],
  ],
  shape: [
    ['rect', { x: '3.5', y: '5', width: '17', height: '14', rx: '2.5' }],
    ['path', { d: 'M3.5 9.5h17' }],
  ],
  frame: [
    ['path', { d: 'M8 3.5H5.5A2 2 0 0 0 3.5 5.5V8' }],
    ['path', { d: 'M16 3.5h2.5a2 2 0 0 1 2 2V8' }],
    ['path', { d: 'M8 20.5H5.5a2 2 0 0 1-2-2V16' }],
    ['path', { d: 'M16 20.5h2.5a2 2 0 0 0 2-2V16' }],
    ['path', { d: 'M8.5 9h7M8.5 12.5h4.5' }],
  ],
  connect: [
    ['circle', { cx: '6', cy: '18', r: '2.5' }],
    ['circle', { cx: '18', cy: '6', r: '2.5' }],
    ['path', { d: 'M8 16C10 13 13 12 16 8' }],
    ['path', { d: 'M13.5 8H16v2.5' }],
  ],
  pen: [
    ['path', { d: 'M4 20l4.2-1 10.6-10.6a2.1 2.1 0 0 0-3-3L5.2 16 4 20z' }],
    ['path', { d: 'M13.5 7.5l3 3' }],
  ],
  eraser: [
    ['path', { d: 'M4.4 14.8l8.9-9a2.2 2.2 0 0 1 3.1 0l2.8 2.8a2.2 2.2 0 0 1 0 3.1l-6.6 6.6H7.1l-2.7-2.7a.6.6 0 0 1 0-.8z' }],
    ['path', { d: 'M10.2 10l5.8 5.8' }],
    ['path', { d: 'M9 19.5h11' }],
  ],
  plus: [['path', { d: 'M12 5v14M5 12h14' }]],
  minus: [['path', { d: 'M5 12h14' }]],
  fit: [
    ['path', { d: 'M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9' }],
    ['path', { d: 'M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9' }],
    ['path', { d: 'M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15' }],
    ['path', { d: 'M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15' }],
    ['rect', { x: '8', y: '8', width: '8', height: '8', rx: '1.5' }],
  ],
  search: [
    ['circle', { cx: '10.5', cy: '10.5', r: '6.2' }],
    ['path', { d: 'M15.2 15.2L20 20' }],
  ],
  download: [
    ['path', { d: 'M12 3.5v11' }],
    ['path', { d: 'M7.8 10.5L12 14.7l4.2-4.2' }],
    ['path', { d: 'M4.5 16.5v2A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5v-2' }],
  ],
  upload: [
    ['path', { d: 'M12 15.5v-11' }],
    ['path', { d: 'M7.8 8.5L12 4.3l4.2 4.2' }],
    ['path', { d: 'M4.5 16.5v2A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5v-2' }],
  ],
  more: [
    ['circle', { cx: '5.5', cy: '12', r: '1.25', fill: 'currentColor', stroke: 'none' }],
    ['circle', { cx: '12', cy: '12', r: '1.25', fill: 'currentColor', stroke: 'none' }],
    ['circle', { cx: '18.5', cy: '12', r: '1.25', fill: 'currentColor', stroke: 'none' }],
  ],
  close: [['path', { d: 'M6 6l12 12M18 6L6 18' }]],
  arrowLeft: [
    ['path', { d: 'M20 12H4' }],
    ['path', { d: 'M10 6l-6 6 6 6' }],
  ],
  undo: [
    ['path', { d: 'M9 7L4.5 11.5 9 16' }],
    ['path', { d: 'M4.5 11.5H14a5.5 5.5 0 0 1 0 11h-2' }],
  ],
  redo: [
    ['path', { d: 'M15 7l4.5 4.5L15 16' }],
    ['path', { d: 'M19.5 11.5H10a5.5 5.5 0 0 0 0 11h2' }],
  ],
  chevronDown: [['path', { d: 'M6 9.5l6 6 6-6' }]],
  calendar: [
    ['rect', { x: '3.5', y: '5', width: '17', height: '15', rx: '2.5' }],
    ['path', { d: 'M8 3.5v3M16 3.5v3M3.5 9.5h17' }],
  ],
  user: [
    ['circle', { cx: '12', cy: '8', r: '3.6' }],
    ['path', { d: 'M5 20a7 7 0 0 1 14 0' }],
  ],
  flag: [
    ['path', { d: 'M6 21V4' }],
    ['path', { d: 'M6 4.5h11.5l-2.2 3.6 2.2 3.6H6' }],
  ],
  check: [['path', { d: 'M4.5 12.5l5 5 10-11' }]],
  trash: [
    ['path', { d: 'M4.5 6.5h15' }],
    ['path', { d: 'M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7' }],
    ['path', { d: 'M6.5 6.5l.9 12.1a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12.1' }],
    ['path', { d: 'M10 10.5v5.5M14 10.5v5.5' }],
  ],
  copy: [
    ['rect', { x: '8.5', y: '8.5', width: '11.5', height: '11.5', rx: '2' }],
    ['path', { d: 'M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5' }],
  ],
  keyboard: [
    ['rect', { x: '2.5', y: '6', width: '19', height: '12', rx: '2.5' }],
    ['path', { d: 'M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M6 13.5h.01M9.5 13.5h.01M13 13.5h.01M16.5 13.5h.01M8 16.5h8' }],
  ],
  help: [
    ['circle', { cx: '12', cy: '12', r: '8.5' }],
    ['path', { d: 'M9.6 9.2a2.6 2.6 0 1 1 3.4 2.5c-.8.3-1 1-1 1.8' }],
    ['path', { d: 'M12 17h.01' }],
  ],
  board: [
    ['rect', { x: '3.5', y: '4.5', width: '17', height: '15', rx: '2.5' }],
    ['path', { d: 'M8 4.5v15M15.5 4.5v15M3.5 11h17' }],
  ],
  layers: [
    ['path', { d: 'M12 3.5l9 4.8-9 4.8-9-4.8 9-4.8z' }],
    ['path', { d: 'M3 12.8l9 4.8 9-4.8' }],
    ['path', { d: 'M3 17.2l9 4.8 9-4.8' }],
  ],
  group: [
    ['rect', { x: '3.5', y: '8.5', width: '17', height: '12', rx: '2.5', strokeDasharray: '2.4 2.2' }],
    ['rect', { x: '6.5', y: '3.5', width: '7', height: '5.5', rx: '1.3' }],
    ['rect', { x: '10.5', y: '13.5', width: '7', height: '5.5', rx: '1.3' }],
    ['path', { d: 'M10 9v2.5h3.5' }],
  ],
  ungroup: [
    ['rect', { x: '3.5', y: '8.5', width: '8', height: '6', rx: '2', strokeDasharray: '2.2 2' }],
    ['rect', { x: '12.5', y: '14', width: '8', height: '6', rx: '2', strokeDasharray: '2.2 2' }],
    ['path', { d: 'M3 21L21 3' }],
  ],
  filter: [['path', { d: 'M4 5.5h16l-6.2 7.2v5.6l-3.6 2v-7.6L4 5.5z' }]],
  sparkles: [
    ['path', { d: 'M12 3.5l1.6 4.4 4.4 1.6-4.4 1.6L12 15.5l-1.6-4.4L6 9.5l4.4-1.6L12 3.5z' }],
    ['path', { d: 'M18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z' }],
  ],
  command: [
    ['path', { d: 'M8.5 8.5h7v7h-7z' }],
    ['path', { d: 'M8.5 8.5V6.7a2.2 2.2 0 1 0-2.2 2.2h2.2zM15.5 8.5V6.7a2.2 2.2 0 1 1 2.2 2.2h-2.2zM8.5 15.5v1.8a2.2 2.2 0 1 1-2.2-2.2h2.2zM15.5 15.5v1.8a2.2 2.2 0 1 0 2.2-2.2h-2.2z' }],
  ],
  arrowUpRight: [
    ['path', { d: 'M7 17L17 7' }],
    ['path', { d: 'M9 7h8v8' }],
  ],
  dot: [['circle', { cx: '12', cy: '12', r: '4', fill: 'currentColor', stroke: 'none' }]],
  bold: [['path', { d: 'M7 4h6a4 4 0 0 1 0 8H7zM7 12h7a4 4 0 0 1 0 8H7z' }]],
  chart: [
    ['path', { d: 'M4 20V10M10 20V4M16 20v-7M22 20H2' }],
  ],
  panel: [
    ['rect', { x: '3.5', y: '4.5', width: '17', height: '15', rx: '2.5' }],
    ['path', { d: 'M14.5 4.5v15' }],
  ],
}

function Icon({ name, size = 18, strokeWidth = 1.8, className = '' }) {
  const spec = ICON_PATHS[name] || ICON_PATHS.sparkles
  return h(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className: `ec-icon ${className}`,
      'aria-hidden': 'true',
      focusable: 'false',
    },
    spec.map((entry, index) => h(entry[0], { key: index, ...entry[1] })),
  )
}

/**
 * Brand mark. Fixed pigments keep it legible on the dark top bar and on the
 * host's light active-tile treatment; it never inherits a low-contrast color.
 */
function BrandGlyph({ size = 34 }) {
  // Monochrome inverse mark: the tile follows the current text color and the
  // diagram inside uses the base surface. That keeps it legible on dark bars
  // and on the host's light active-tile state without introducing hue.
  return h(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 32 32',
      className: 'ec-brand-glyph',
      'aria-hidden': 'true',
      focusable: 'false',
    },
    h('rect', {
      x: 0.75,
      y: 0.75,
      width: 30.5,
      height: 30.5,
      rx: 8.5,
      fill: 'currentColor',
    }),
    h('path', {
      d: 'M7.5 11.5h17M7.5 16h17M7.5 20.5h17M11.5 7.5v17M16 7.5v17M20.5 7.5v17',
      stroke: 'var(--dsw-alias-bg-base)',
      strokeWidth: 0.55,
      opacity: 0.3,
      fill: 'none',
    }),
    h('rect', {
      x: 5.4,
      y: 7.4,
      width: 9.3,
      height: 6.6,
      rx: 1.9,
      fill: 'none',
      stroke: 'var(--dsw-alias-bg-base)',
      strokeWidth: 1.6,
    }),
    h('rect', {
      x: 17.4,
      y: 18.3,
      width: 8.8,
      height: 6.3,
      rx: 1.9,
      fill: 'var(--dsw-alias-bg-base)',
    }),
    h('path', {
      d: 'M14.7 10.7h2.4c1.7 0 2.7 1.1 2.7 2.7v8.1',
      fill: 'none',
      stroke: 'var(--dsw-alias-bg-base)',
      strokeWidth: 1.6,
      strokeLinecap: 'round',
    }),
    h('circle', { cx: 19.6, cy: 21.4, r: 1.15, fill: 'currentColor' }),
  )
}

function shapeFigure(value) {
  const variant = normalizeShapeVariant(value)
  if (variant === 'decision') return h('polygon', { points: '50,1 99,50 50,99 1,50' })
  if (variant === 'terminator') return h('ellipse', { cx: 50, cy: 50, rx: 49, ry: 49 })
  if (variant === 'io') return h('polygon', { points: '18,1 99,1 82,99 1,99' })
  if (variant === 'document') {
    return h('path', {
      d: 'M1 1 H99 V82 C83 96 66 77 50 85 C34 93 16 96 1 83 Z',
    })
  }
  if (variant === 'database') {
    return h(
      Fragment,
      null,
      h('path', { d: 'M9 17 V83 C9 93 91 93 91 83 V17' }),
      h('ellipse', { cx: 50, cy: 17, rx: 41, ry: 9.5 }),
    )
  }
  if (variant === 'subprocess') {
    return h(
      Fragment,
      null,
      h('rect', { x: 1, y: 1, width: 98, height: 98, rx: 8 }),
      h('line', { x1: 12, y1: 1, x2: 12, y2: 99 }),
      h('line', { x1: 88, y1: 1, x2: 88, y2: 99 }),
    )
  }
  if (variant === 'manual') return h('polygon', { points: '18,1 82,1 99,99 1,99' })
  return h('rect', { x: 1, y: 1, width: 98, height: 98, rx: 9 })
}

function ShapeGlyph({ variant, size = 22, className = '' }) {
  return h(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 100 100',
      className: `ec-shape-glyph ${className}`,
      'aria-hidden': 'true',
      focusable: 'false',
    },
    shapeFigure(variant),
  )
}

function uid(prefix = 'n') {
  const random =
    typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function'
      ? globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
  return `${prefix}-${random}`
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function cx(...values) {
  return values.filter(Boolean).join(' ')
}

function cloneJSON(value) {
  return JSON.parse(JSON.stringify(value))
}

function isEditableTarget(target) {
  if (!target || typeof target.closest !== 'function') return false
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
}

function stop(event) {
  event.stopPropagation()
}

function initials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function avatarHue(name) {
  const text = String(name || 'unassigned')
  let hash = 0
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) % 360
  return hash
}

function todayISO() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function isOverdue(iso) {
  if (!iso) return false
  return iso < todayISO()
}

function formatDue(iso) {
  if (!iso) return ''
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function emptyBoard(title) {
  return {
    id: uid('board'),
    title: title || 'Untitled canvas',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    camera: null,
    nodes: [],
    edges: [],
    groups: [],
  }
}

function makeFrame(id, x, y, w, h, title, subtitle) {
  return { id, type: 'frame', x, y, w, h, title, subtitle: subtitle || '', tone: 'slate' }
}

function makeLane(id, x, y, status, w = 252, h = 608) {
  return { id, type: 'lane', x, y, w, h, status, title: STATUS[status].label }
}

function makeTask(id, x, y, overrides = {}) {
  return {
    id,
    type: 'task',
    x,
    y,
    w: 224,
    h: 206,
    title: 'Untitled task',
    description: '',
    status: 'backlog',
    priority: 'P2',
    tags: [],
    assignee: '',
    due: '',
    estimate: '',
    checklist: [],
    ...overrides,
  }
}

const NOTE_BLOCK_TYPES = ['text', 'heading1', 'heading2', 'heading3', 'bulleted', 'numbered', 'todo', 'quote', 'code', 'math']

function makeNoteBlock(type = 'text', text = '', checked = false) {
  return { id: uid('block'), type: NOTE_BLOCK_TYPES.includes(type) ? type : 'text', text, checked: Boolean(checked) }
}

function normalizeNoteBlock(block, index = 0) {
  if (!block || typeof block !== 'object') return makeNoteBlock('text', '')
  return {
    id: typeof block.id === 'string' && block.id ? block.id : uid('block'),
    type: NOTE_BLOCK_TYPES.includes(block.type) ? block.type : 'text',
    text: typeof block.text === 'string' ? block.text : '',
    checked: Boolean(block.checked),
  }
}

function parseNoteText(text, fallbackTitle = 'Note') {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n')
  const titleIndex = lines.findIndex((line) => line.trim().length > 0)
  const title = titleIndex >= 0 ? lines[titleIndex].trim() : fallbackTitle
  const body = titleIndex >= 0 ? lines.slice(titleIndex + 1) : []
  const blocks = []
  for (let index = 0; index < body.length; index += 1) {
    const raw = body[index]
    const line = raw.replace(/\s+$/, '')
    if (!line.trim()) continue
    if (line.trim().startsWith('```')) {
      const codeLines = []
      index += 1
      while (index < body.length && !body[index].trim().startsWith('```')) {
        codeLines.push(body[index])
        index += 1
      }
      blocks.push(makeNoteBlock('code', codeLines.join('\n')))
      continue
    }
    const heading = line.match(/^(#{1,3})\s+(.*)$/)
    if (heading) {
      blocks.push(makeNoteBlock(`heading${heading[1].length}`, heading[2]))
      continue
    }
    const todo = line.match(/^[-*]\s+\[([ xX])\]\s+(.*)$/)
    if (todo) {
      blocks.push(makeNoteBlock('todo', todo[2], todo[1].toLowerCase() === 'x'))
      continue
    }
    if (/^[-*]\s+/.test(line)) {
      blocks.push(makeNoteBlock('bulleted', line.replace(/^[-*]\s+/, '')))
      continue
    }
    if (/^\d+\.\s+/.test(line)) {
      blocks.push(makeNoteBlock('numbered', line.replace(/^\d+\.\s+/, '')))
      continue
    }
    if (/^>\s+/.test(line)) {
      blocks.push(makeNoteBlock('quote', line.replace(/^>\s+/, '')))
      continue
    }
    blocks.push(makeNoteBlock('text', line.trim()))
  }
  if (blocks.length === 0) blocks.push(makeNoteBlock('text', ''))
  return { title, blocks }
}

function notePlainText(title, blocks) {
  const lines = [String(title || '').trim() || 'Note', '']
  let number = 0
  for (const block of blocks || []) {
    if (!block || !String(block.text || '').trim()) {
      if (block?.type === 'code' || block?.type === 'math') lines.push('')
      continue
    }
    const text = block.text
    if (block.type === 'bulleted') {
      lines.push(`- ${text}`)
      number = 0
    } else if (block.type === 'numbered') {
      number += 1
      lines.push(`${number}. ${text}`)
    } else if (block.type === 'todo') {
      lines.push(`- [${block.checked ? 'x' : ' '}] ${text}`)
      number = 0
    } else if (block.type === 'quote') {
      lines.push(`> ${text}`)
      number = 0
    } else if (block.type === 'code') {
      lines.push('```')
      lines.push(...String(text).split('\n'))
      lines.push('```')
      number = 0
    } else if (block.type === 'math') {
      lines.push(`$$ ${text} $$`)
      number = 0
    } else {
      lines.push(text)
      number = 0
    }
  }
  return lines.join('\n').trim()
}

function normalizeNoteNode(node) {
  const parsed = Array.isArray(node.blocks) && node.blocks.length
    ? {
        title: typeof node.title === 'string' && node.title.trim() ? node.title : 'Note',
        blocks: node.blocks.map(normalizeNoteBlock),
      }
    : parseNoteText(node.text, typeof node.title === 'string' && node.title.trim() ? node.title : 'Note')
  const title = typeof node.title === 'string' && node.title.trim() ? node.title : parsed.title
  const blocks = parsed.blocks.length ? parsed.blocks : [makeNoteBlock('text', '')]
  return { ...node, title, blocks, text: notePlainText(title, blocks) }
}

function makeNote(id, x, y, text, tone = 'amber', overrides = {}) {
  const parsed = parseNoteText(text, 'New note')
  return {
    id,
    type: 'note',
    x,
    y,
    w: 270,
    h: 150,
    title: parsed.title,
    blocks: parsed.blocks,
    text: notePlainText(parsed.title, parsed.blocks),
    tone,
    ...overrides,
  }
}

function makeText(id, x, y, text, overrides = {}) {
  return {
    id,
    type: 'text',
    x,
    y,
    w: 320,
    h: 34,
    text,
    size: 14,
    weight: 600,
    align: 'left',
    tone: 'slate',
    ...overrides,
  }
}

function makeShape(id, x, y, text, overrides = {}) {
  return {
    id,
    type: 'shape',
    x,
    y,
    w: 220,
    h: 86,
    text,
    variant: 'process',
    tone: 'blue',
    ...overrides,
  }
}

function makeEdge(id, from, to, overrides = {}) {
  return {
    id,
    type: 'edge',
    from,
    to,
    fromSide: 'auto',
    toSide: 'auto',
    label: '',
    dashed: false,
    ...overrides,
  }
}

function checklistItem(text, done = false) {
  return { id: uid('check'), text, done }
}

function createSeedBoard() {
  const now = new Date()
  const dueSoon = new Date(now.getTime() + 2 * 86400000)
  const dueLater = new Date(now.getTime() + 5 * 86400000)
  const iso = (date) => date.toISOString().slice(0, 10)

  const nodes = [
    makeFrame(
      'frame-sprint',
      -28,
      -104,
      1110,
      900,
      'Sprint 24 · Checkout reliability',
      'Zero duplicate charges in the retry path · ship behind a flag by Friday',
    ),
    makeLane('lane-backlog', 0, 0, 'backlog'),
    makeLane('lane-doing', 264, 0, 'doing'),
    makeLane('lane-blocked', 528, 0, 'blocked'),
    makeLane('lane-done', 792, 0, 'done'),

    makeTask('task-idempotency', 14, 76, {
      title: 'Add idempotency keys to /charges',
      description:
        'Prevent duplicate charges when a client retries a timed-out request. Cover charges, refunds, and webhook replays.',
      status: 'backlog',
      priority: 'P0',
      tags: ['payments', 'api'],
      assignee: 'Maya Chen',
      due: iso(dueSoon),
      estimate: '3d',
      checklist: [
        checklistItem('Agree key format with clients'),
        checklistItem('Persist keys with 24h TTL'),
        checklistItem('Replay coverage in staging', true),
      ],
    }),
    makeTask('task-retry-budget', 14, 300, {
      title: 'Retry budget for webhook fanout',
      description:
        'Cap upstream retries so a slow consumer cannot amplify traffic across the fanout workers.',
      status: 'backlog',
      priority: 'P2',
      tags: ['platform', 'reliability'],
      assignee: 'Theo Park',
      due: iso(dueLater),
      estimate: '2d',
      checklist: [checklistItem('Measure current retry volume'), checklistItem('Add per-tenant budget')],
    }),

    makeTask('task-tracing', 278, 76, {
      title: 'Trace p99 latency by route',
      description:
        'Break down checkout latency by route and dependency. Add span attributes for retry count and queue wait.',
      status: 'doing',
      priority: 'P1',
      tags: ['observability'],
      assignee: 'Priya Nair',
      due: iso(dueSoon),
      estimate: '2d',
      checklist: [
        checklistItem('Instrument charge + refund routes', true),
        checklistItem('Add retry_count attribute', true),
        checklistItem('Publish dashboard'),
      ],
    }),
    makeTask('task-ledger-split', 278, 300, {
      title: 'Split ledger write path',
      description:
        'Extract settlement writes behind LedgerWriter so retries can be replayed independently of checkout.',
      status: 'doing',
      priority: 'P1',
      tags: ['ledger', 'refactor'],
      assignee: 'Jonas Weber',
      estimate: '5d',
      checklist: [
        checklistItem('Extract interface', true),
        checklistItem('Move settlement writes'),
        checklistItem('Add replay harness'),
        checklistItem('Delete legacy path'),
      ],
    }),

    makeTask('task-queue-v2', 542, 76, {
      title: 'Migrate settlement queue to v2',
      description:
        'Blocked by the schema freeze. Needs a compatibility window before dual-write and cutover.',
      status: 'blocked',
      priority: 'P0',
      tags: ['infra', 'queue'],
      assignee: 'Noor Haddad',
      due: iso(now),
      estimate: '4d',
      checklist: [
        checklistItem('Dual-write adapter', true),
        checklistItem('Shadow consumer metrics'),
        checklistItem('Cut over by tenant'),
      ],
    }),
    makeTask('task-backfill', 542, 300, {
      title: 'Backfill currency snapshots',
      description:
        'Historical rows are missing the new snapshot column. Decide between a lazy and batch backfill.',
      status: 'blocked',
      priority: 'P2',
      tags: ['data'],
      assignee: 'Ilya Petrov',
      estimate: '3d',
      checklist: [
        checklistItem('Estimate row count', true),
        checklistItem('Choose backfill strategy'),
        checklistItem('Run in staging'),
        checklistItem('Verify FX rounding'),
      ],
    }),

    makeTask('task-request-trace', 806, 76, {
      title: 'Request tracing in checkout',
      description:
        'Trace IDs now propagate from the edge through every checkout dependency. Rolled out to 100%.',
      status: 'done',
      priority: 'P1',
      tags: ['observability'],
      assignee: 'Priya Nair',
      estimate: '2d',
      checklist: [
        checklistItem('Propagate W3C traceparent', true),
        checklistItem('Add edge sampling', true),
        checklistItem('Document runbook', true),
      ],
    }),
    makeTask('task-canary-alerts', 806, 300, {
      title: 'Canary alerts for auth',
      description:
        'Page on canary error-rate divergence before the full fleet is affected. Threshold tuned to 0.4%.',
      status: 'done',
      priority: 'P2',
      tags: ['sre'],
      assignee: 'Sam Okafor',
      estimate: '1d',
      checklist: [checklistItem('Define burn-rate alert', true), checklistItem('Route to #oncall', true)],
    }),

    makeNote(
      'note-goal',
      0,
      640,
      'Sprint goal\n\nShip the retry path behind a flag by Friday. Zero duplicate charges is the bar. Not fewer. Zero.',
      'amber',
      { w: 380, h: 128 },
    ),
    makeNote(
      'note-decision',
      400,
      640,
      'Decision log\n\nQueue v2 waits on the ledger schema freeze. Escalate in #infra before Thursday standup.',
      'blue',
      { w: 380, h: 128 },
    ),
    makeNote(
      'note-risk',
      800,
      640,
      'Watch item\n\nBackfill could re-introduce FX drift. Pair with finance before the first batch.',
      'rose',
      { w: 244, h: 128 },
    ),
  ]

  const edges = [
    makeEdge('edge-idem-ledger', 'task-idempotency', 'task-ledger-split', { label: 'enables' }),
    makeEdge('edge-ledger-queue', 'task-ledger-split', 'task-queue-v2', {
      label: 'blocks',
      dashed: true,
    }),
    makeEdge('edge-tracing-p99', 'task-request-trace', 'task-tracing', { label: 'informs' }),
  ]

  return {
    id: 'board-sprint-24',
    title: 'Sprint 24 · Checkout reliability',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    camera: null,
    nodes,
    edges,
    groups: [],
  }
}

function createArchitectureBoard() {
  const nodes = [
    makeFrame('frame-arch', -30, -100, 980, 700, 'Payments service map', 'Current request path and the planned queue cutover'),
    makeShape('shape-edge-api', 40, 50, 'API gateway', { tone: 'slate', w: 190, h: 72 }),
    makeShape('shape-checkout', 310, 50, 'Checkout service', { tone: 'blue', w: 210, h: 72 }),
    makeShape('shape-ledger', 620, 50, 'Ledger writer', { tone: 'green', w: 190, h: 72 }),
    makeShape('shape-charges', 310, 220, 'Charges worker', { tone: 'blue', w: 210, h: 72 }),
    makeShape('shape-fanout', 620, 220, 'Webhook fanout', { tone: 'rose', w: 190, h: 72 }),
    makeShape('shape-queue', 310, 390, 'Queue v2', { tone: 'amber', w: 210, h: 72, variant: 'diamond' }),
    makeShape('shape-settlement', 620, 390, 'Settlement jobs', { tone: 'slate', w: 190, h: 72 }),
    makeNote(
      'note-arch-risk',
      40,
      260,
      'Risk\n\nDual-write must be idempotent. If the adapter retries, both queues can receive the same settlement.',
      'rose',
      { w: 220, h: 160 },
    ),
    makeNote(
      'note-arch-next',
      40,
      460,
      'Next\n\nAgree on the LedgerWriter contract, then shadow the v2 consumer for one full settlement cycle.',
      'amber',
      { w: 220, h: 150 },
    ),
    makeText('text-arch-legend', 620, 530, 'Solid = live  ·  dashed = planned', {
      tone: 'slate',
      size: 12,
      weight: 500,
    }),
  ]
  const edges = [
    makeEdge('arch-e1', 'shape-edge-api', 'shape-checkout'),
    makeEdge('arch-e2', 'shape-checkout', 'shape-ledger'),
    makeEdge('arch-e3', 'shape-checkout', 'shape-charges'),
    makeEdge('arch-e4', 'shape-charges', 'shape-fanout'),
    makeEdge('arch-e5', 'shape-charges', 'shape-queue', { dashed: true, label: 'planned' }),
    makeEdge('arch-e6', 'shape-queue', 'shape-settlement', { dashed: true }),
    makeEdge('arch-e7', 'shape-ledger', 'shape-settlement'),
  ]
  return {
    id: uid('board'),
    title: 'Payments service map',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    camera: null,
    nodes,
    edges,
    groups: [],
  }
}

function createIncidentBoard() {
  const nodes = [
    makeFrame('frame-incident', -30, -100, 1050, 720, 'SEV-241 · Checkout 5xx spike', 'Incident command canvas · started 14:08 UTC'),
    makeLane('inc-triage', 0, 0, 'backlog', 252, 450),
    makeLane('inc-mitigate', 264, 0, 'doing', 252, 450),
    makeLane('inc-blocked', 528, 0, 'blocked', 252, 450),
    makeLane('inc-done', 792, 0, 'done', 252, 450),
    makeTask('inc-1', 14, 76, {
      title: 'Confirm blast radius',
      status: 'done',
      priority: 'P0',
      tags: ['triage'],
      assignee: 'Noor Haddad',
      checklist: [checklistItem('Error rate by region', true), checklistItem('Identify first bad deploy', true)],
    }),
    makeTask('inc-2', 278, 76, {
      title: 'Roll back release 24.11.3',
      status: 'doing',
      priority: 'P0',
      tags: ['mitigation'],
      assignee: 'Sam Okafor',
      due: todayISO(),
      checklist: [checklistItem('Pause canary', true), checklistItem('Roll back 25%'), checklistItem('Verify 5xx curve')],
    }),
    makeTask('inc-3', 542, 76, {
      title: 'Drain retry backlog',
      status: 'blocked',
      priority: 'P1',
      tags: ['queue'],
      assignee: 'Theo Park',
      checklist: [checklistItem('Wait for rollback health gate')],
    }),
    makeTask('inc-4', 806, 76, {
      title: 'Open incident channel',
      status: 'done',
      priority: 'P0',
      tags: ['comms'],
      assignee: 'Maya Chen',
      checklist: [checklistItem('Post in #incidents', true)],
    }),
    makeNote(
      'inc-note-1',
      0,
      490,
      'Comms\n\nStatus page updated at 14:22 UTC. Next update due 14:42. Support has the customer-facing template.',
      'blue',
      { w: 380, h: 130 },
    ),
    makeNote(
      'inc-note-2',
      400,
      490,
      'Hypothesis\n\nThe retry storm is amplifying a slow ledger write. Validate after rollback before changing queue limits.',
      'amber',
      { w: 380, h: 130 },
    ),
  ]
  return {
    id: uid('board'),
    title: 'SEV-241 · Checkout 5xx spike',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    camera: null,
    nodes,
    edges: [],
    groups: [],
  }
}

function createProcessFlowBoard() {
  const nodes = [
    makeFrame('flow-frame', -30, -100, 1010, 820, 'Release check · Flow', 'Change request to verified release'),
    makeShape('flow-start', 40, 20, 'Start', { variant: 'terminator', w: 120, h: 120, tone: 'green' }),
    makeShape('flow-request', 40, 180, 'Create change request', { variant: 'process', w: 220, h: 86, tone: 'blue' }),
    makeShape('flow-approve', 40, 330, 'Risk approved?', { variant: 'decision', w: 220, h: 150, tone: 'amber' }),
    makeShape('flow-changes', 40, 550, 'Request changes', { variant: 'io', w: 230, h: 92, tone: 'rose' }),
    makeShape('flow-record', 380, 20, 'Change record', { variant: 'document', w: 220, h: 100, tone: 'slate' }),
    makeShape('flow-deploy', 380, 170, 'Deploy to staging', { variant: 'process', w: 220, h: 86, tone: 'blue' }),
    makeShape('flow-canary', 380, 320, 'Canary valid?', { variant: 'decision', w: 220, h: 150, tone: 'amber' }),
    makeShape('flow-release', 380, 520, 'Release', { variant: 'terminator', w: 120, h: 120, tone: 'green' }),
    makeShape('flow-audit', 740, 540, 'Audit log', { variant: 'database', w: 200, h: 108, tone: 'green' }),
    makeShape('flow-signoff', 740, 330, 'Operator sign-off', { variant: 'manual', w: 220, h: 92, tone: 'rose' }),
    makeNote(
      'flow-note',
      740,
      50,
      'Release captain\n\nOne owner closes the loop. If the canary fails, roll back before touching the queue.',
      'blue',
      { w: 230, h: 150 },
    ),
  ]
  const edges = [
    makeEdge('flow-e1', 'flow-start', 'flow-request', { fromSide: 'bottom', toSide: 'top' }),
    makeEdge('flow-e2', 'flow-request', 'flow-approve', { fromSide: 'bottom', toSide: 'top' }),
    makeEdge('flow-e3', 'flow-request', 'flow-record', { label: 'records', fromSide: 'right', toSide: 'left' }),
    makeEdge('flow-e4', 'flow-approve', 'flow-deploy', { label: 'approved', fromSide: 'right', toSide: 'left' }),
    makeEdge('flow-e5', 'flow-approve', 'flow-changes', { label: 'changes', fromSide: 'bottom', toSide: 'top' }),
    makeEdge('flow-e6', 'flow-deploy', 'flow-canary', { fromSide: 'bottom', toSide: 'top' }),
    makeEdge('flow-e7', 'flow-canary', 'flow-release', { label: 'valid', fromSide: 'bottom', toSide: 'top' }),
    makeEdge('flow-e8', 'flow-canary', 'flow-signoff', { label: 'sign-off', fromSide: 'right', toSide: 'left' }),
    makeEdge('flow-e9', 'flow-release', 'flow-audit', { label: 'log', fromSide: 'right', toSide: 'left' }),
    makeEdge('flow-e10', 'flow-record', 'flow-audit', { label: 'retain', dashed: true, fromSide: 'bottom', toSide: 'top' }),
  ]
  return {
    id: uid('board'),
    title: 'Release check flow',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    camera: null,
    nodes,
    edges,
    groups: [],
  }
}

function createBlankBoard(title = 'Untitled canvas') {
  return emptyBoard(title)
}

const TEMPLATES = [
  {
    id: 'sprint',
    name: 'Sprint board',
    description: 'Four lanes, task cards, dependencies, and a sprint goal.',
    accent: '#4f7cf7',
    kind: 'sprint',
    create: createSeedBoard,
  },
  {
    id: 'flow',
    name: 'Process flow',
    description: 'Process, condition, input/output, document, and data-store shapes.',
    accent: '#d18b00',
    kind: 'flow',
    create: createProcessFlowBoard,
  },
  {
    id: 'architecture',
    name: 'Service map',
    description: 'Map request paths, planned cutovers, and architecture risks.',
    accent: '#2f9e63',
    kind: 'architecture',
    create: createArchitectureBoard,
  },
  {
    id: 'incident',
    name: 'Incident command',
    description: 'Triage, mitigation, comms, and watch items in one view.',
    accent: '#e05252',
    kind: 'incident',
    create: createIncidentBoard,
  },
]

function createInitialState() {
  const board = createSeedBoard()
  return { version: SCHEMA_VERSION, activeId: board.id, boards: [board] }
}

function isValidNode(node) {
  return (
    node &&
    typeof node === 'object' &&
    typeof node.id === 'string' &&
    typeof node.type === 'string' &&
    Number.isFinite(node.x) &&
    Number.isFinite(node.y) &&
    Number.isFinite(node.w) &&
    Number.isFinite(node.h)
  )
}

function normalizeState(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.boards) || raw.boards.length === 0) {
    return null
  }
  const boards = raw.boards
    .filter((board) => board && typeof board.id === 'string' && Array.isArray(board.nodes))
    .map((board) => ({
      ...board,
      title: typeof board.title === 'string' && board.title ? board.title : 'Untitled canvas',
      nodes: board.nodes.filter(isValidNode).map((node) => {
        if (node.type === 'note') return normalizeNoteNode(node)
        if (node.type !== 'shape' || normalizeShapeVariant(node.variant) !== 'terminator') return node
        if (Math.abs(node.w - node.h) < 1) return node
        const side = Math.max(120, Math.round((node.w + node.h) / 2))
        return {
          ...node,
          x: node.x + (node.w - side) / 2,
          y: node.y + (node.h - side) / 2,
          w: side,
          h: side,
        }
      }),
      edges: Array.isArray(board.edges)
        ? board.edges.filter((edge) => edge && typeof edge.id === 'string' && edge.from && edge.to)
        : [],
      groups: Array.isArray(board.groups)
        ? board.groups
            .filter((group) => group && typeof group.id === 'string' && Array.isArray(group.childIds))
            .map((group) => ({
              id: group.id,
              name: typeof group.name === 'string' && group.name ? group.name : 'Group',
              childIds: group.childIds.filter((id) => typeof id === 'string'),
            }))
            .filter((group) => group.childIds.length >= 2)
        : [],
      camera:
        board.camera &&
        Number.isFinite(board.camera.x) &&
        Number.isFinite(board.camera.y) &&
        Number.isFinite(board.camera.zoom)
          ? board.camera
          : null,
      createdAt: board.createdAt || new Date().toISOString(),
      updatedAt: board.updatedAt || new Date().toISOString(),
    }))
  if (boards.length === 0) return null
  const activeId = boards.some((board) => board.id === raw.activeId) ? raw.activeId : boards[0].id
  return { version: SCHEMA_VERSION, activeId, boards }
}

function loadState() {
  if (typeof window === 'undefined') return createInitialState()
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return createInitialState()
    const parsed = JSON.parse(stored)
    const normalized = normalizeState(parsed)
    return normalized || createInitialState()
  } catch (error) {
    return createInitialState()
  }
}

function nodeBounds(node) {
  return { x: node.x, y: node.y, w: Math.max(1, node.w), h: Math.max(1, node.h) }
}

function contentBounds(board, includeBackground = false) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const node of board.nodes) {
    if (!includeBackground && (node.type === 'lane' || node.type === 'frame')) continue
    const bounds = nodeBounds(node)
    minX = Math.min(minX, bounds.x)
    minY = Math.min(minY, bounds.y)
    maxX = Math.max(maxX, bounds.x + bounds.w)
    maxY = Math.max(maxY, bounds.y + bounds.h)
  }
  if (!Number.isFinite(minX)) {
    for (const node of board.nodes) {
      const bounds = nodeBounds(node)
      minX = Math.min(minX, bounds.x)
      minY = Math.min(minY, bounds.y)
      maxX = Math.max(maxX, bounds.x + bounds.w)
      maxY = Math.max(maxY, bounds.y + bounds.h)
    }
  }
  if (!Number.isFinite(minX)) return { x: -400, y: -300, w: 800, h: 600 }
  return { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) }
}

function groupsOf(board) {
  return Array.isArray(board.groups) ? board.groups : []
}

function groupForNode(board, nodeId) {
  return groupsOf(board).find((group) => group.childIds.includes(nodeId))
}

function pruneGroups(board, removedIds) {
  const removed = removedIds instanceof Set ? removedIds : new Set(removedIds)
  return groupsOf(board)
    .map((group) => ({ ...group, childIds: group.childIds.filter((id) => !removed.has(id)) }))
    .filter((group) => group.childIds.length >= 2)
}

function expandIdsByGroups(board, ids) {
  const expanded = new Set(ids)
  for (const group of groupsOf(board)) {
    if (group.childIds.some((id) => expanded.has(id))) {
      for (const id of group.childIds) expanded.add(id)
    }
  }
  return Array.from(expanded)
}

function groupBounds(board, group) {
  if (!group) return null
  const map = nodeMapOf(board)
  const nodes = group.childIds.map((id) => map.get(id)).filter(Boolean)
  if (!nodes.length) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const node of nodes) {
    minX = Math.min(minX, node.x)
    minY = Math.min(minY, node.y)
    maxX = Math.max(maxX, node.x + node.w)
    maxY = Math.max(maxY, node.y + node.h)
  }
  return { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY), nodes }
}

function nodeMapOf(board) {
  const map = new Map()
  for (const node of board.nodes) map.set(node.id, node)
  return map
}

function portPoint(node, side) {
  const centerX = node.x + node.w / 2
  const centerY = node.y + node.h / 2
  if (side === 'left') return { x: node.x, y: centerY }
  if (side === 'right') return { x: node.x + node.w, y: centerY }
  if (side === 'top') return { x: centerX, y: node.y }
  return { x: centerX, y: node.y + node.h }
}

function chooseSides(a, b, fromSide, toSide) {
  const acx = a.x + a.w / 2
  const acy = a.y + a.h / 2
  const bcx = b.x + b.w / 2
  const bcy = b.y + b.h / 2
  let start = fromSide
  let end = toSide
  if (start === 'auto' || end === 'auto') {
    if (Math.abs(bcx - acx) > Math.abs(bcy - acy)) {
      if (start === 'auto') start = bcx >= acx ? 'right' : 'left'
      if (end === 'auto') end = bcx >= acx ? 'left' : 'right'
    } else if (start === 'auto') {
      start = bcy >= acy ? 'bottom' : 'top'
      if (end === 'auto') end = bcy >= acy ? 'top' : 'bottom'
    }
  }
  if (end === 'auto') end = start === 'left' ? 'right' : start === 'right' ? 'left' : start === 'top' ? 'bottom' : 'top'
  return { start, end }
}

function edgeGeometry(edge, nodeMap) {
  const from = nodeMap.get(edge.from)
  const to = nodeMap.get(edge.to)
  if (!from || !to) return null
  const sides = chooseSides(from, to, edge.fromSide || 'auto', edge.toSide || 'auto')
  const start = portPoint(from, sides.start)
  const end = portPoint(to, sides.end)
  const dx = end.x - start.x
  const dy = end.y - start.y
  const horizontal = sides.start === 'left' || sides.start === 'right'
  const offset = clamp(Math.hypot(dx, dy) * 0.42, 44, 150)
  const c1 = horizontal
    ? { x: start.x + (sides.start === 'right' ? offset : -offset), y: start.y }
    : { x: start.x, y: start.y + (sides.start === 'bottom' ? offset : -offset) }
  const c2 = horizontal
    ? { x: end.x + (sides.end === 'right' ? offset : -offset), y: end.y }
    : { x: end.x, y: end.y + (sides.end === 'bottom' ? offset : -offset) }
  const path = `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`
  const mid = cubicPoint(start, c1, c2, end, 0.5)
  return { start, end, c1, c2, path, mid, sides }
}

function cubicPoint(p0, p1, p2, p3, t) {
  const u = 1 - t
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  }
}

function arrowHead(end, control, size = 10) {
  const angle = Math.atan2(end.y - control.y, end.x - control.x)
  const wing = 0.48
  return [
    { x: end.x - size * Math.cos(angle - wing), y: end.y - size * Math.sin(angle - wing) },
    { x: end.x, y: end.y },
    { x: end.x - size * Math.cos(angle + wing), y: end.y - size * Math.sin(angle + wing) },
  ]
}

function pointInNode(node, point) {
  return point.x >= node.x && point.x <= node.x + node.w && point.y >= node.y && point.y <= node.y + node.h
}

function nodesInRect(nodes, rect) {
  return nodes
    .filter((node) => node.type !== 'lane')
    .filter((node) => {
      const left = Math.min(rect.x0, rect.x1)
      const right = Math.max(rect.x0, rect.x1)
      const top = Math.min(rect.y0, rect.y1)
      const bottom = Math.max(rect.y0, rect.y1)
      return node.x < right && node.x + node.w > left && node.y < bottom && node.y + node.h > top
    })
}

function boardStats(board) {
  const tasks = board.nodes.filter((node) => node.type === 'task')
  const done = tasks.filter((task) => task.status === 'done').length
  const blocked = tasks.filter((task) => task.status === 'blocked').length
  const doing = tasks.filter((task) => task.status === 'doing').length
  return { total: tasks.length, done, blocked, doing, percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0 }
}

function taskMatches(task, query, statusFilter) {
  if (statusFilter && statusFilter !== 'all' && task.status !== statusFilter) return false
  if (!query) return true
  const haystack = [task.title, task.description, task.assignee, ...(task.tags || [])].join(' ').toLowerCase()
  return haystack.includes(query.toLowerCase())
}

function nextBoardTitle(boards) {
  let index = boards.length + 1
  const titles = new Set(boards.map((board) => board.title))
  while (titles.has(`Canvas ${index}`)) index += 1
  return `Canvas ${index}`
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

function downloadText(text, filename, mime = 'application/json') {
  downloadBlob(new Blob([text], { type: `${mime};charset=utf-8` }), filename)
}

function fileSafe(value) {
  return String(value || 'canvas')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

function markdownForBoard(board) {
  const stats = boardStats(board)
  const lines = [`# ${board.title}`, '', `${stats.done}/${stats.total} done · ${stats.blocked} blocked`, '']
  for (const status of STATUS_ORDER) {
    const tasks = board.nodes.filter((node) => node.type === 'task' && node.status === status)
    if (tasks.length === 0) continue
    lines.push(`## ${STATUS[status].label}`)
    for (const task of tasks) {
      const meta = [task.priority, task.assignee, task.due, task.estimate].filter(Boolean).join(' · ')
      lines.push(`- [${task.status === 'done' ? 'x' : ' '}] **${task.title}**${meta ? `: ${meta}` : ''}`)
      if (task.description) lines.push(`  ${task.description}`)
      for (const item of task.checklist || []) lines.push(`  - [${item.done ? 'x' : ' '}] ${item.text}`)
    }
    lines.push('')
  }
  const notes = board.nodes.filter((node) => node.type === 'note')
  if (notes.length) {
    lines.push('## Notes')
    for (const note of notes) {
      lines.push(`### ${note.text.split('\n')[0] || 'Note'}`)
      lines.push(note.text.split('\n').slice(1).join('\n').trim() || '')
      lines.push('')
    }
  }
  return lines.join('\n')
}

/* The canvas shell: state, camera, gestures, keyboard, and top-level chrome. */

function EngineeringCanvas({ t }) {
  const tr = typeof t === 'function' ? t : (key) => key
  const [store, setStore] = useState(loadState)
  const storeRef = useRef(store)
  storeRef.current = store
  const [tool, setTool] = useState('select')
  const [activeShape, setActiveShape] = useState(DEFAULT_SHAPE)
  const [shapePickerOpen, setShapePickerOpen] = useState(false)
  const activeShapeRef = useRef(DEFAULT_SHAPE)
  const [selection, setSelection] = useState([])
  const [editing, setEditing] = useState(null)
  const [noteFocus, setNoteFocus] = useState(null)
  const [marquee, setMarquee] = useState(null)
  const [createPreview, setCreatePreview] = useState(null)
  const [connectPreview, setConnectPreview] = useState(null)
  const [connectTarget, setConnectTarget] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [menu, setMenu] = useState(null)
  const [modal, setModal] = useState(null)
  const [confirmState, setConfirmState] = useState(null)
  const [toast, setToast] = useState(null)
  const [saveState, setSaveState] = useState('saved')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState('')
  const [paletteIndex, setPaletteIndex] = useState(0)
  const [showHint, setShowHint] = useState(true)
  const [spaceDown, setSpaceDown] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(() =>
    typeof window === 'undefined' ? true : (window.innerWidth || 1400) > 1500,
  )
  const [viewport, setViewport] = useState({ w: 0, h: 0 })

  const stageRef = useRef(null)
  const rootRef = useRef(null)
  const importRef = useRef(null)
  const gestureCleanupRef = useRef(null)
  const historyRef = useRef(new Map())
  const lastCoalesceRef = useRef({ key: null, time: 0 })
  const saveTimerRef = useRef(null)
  const hintTimerRef = useRef(null)
  const fittedRef = useRef(new Set())
  const cameraRef = useRef(null)
  const refitOnResizeRef = useRef(false)

  const activeBoard = store.boards.find((board) => board.id === store.activeId) || store.boards[0]
  const boardRef = useRef(activeBoard)
  boardRef.current = activeBoard
  const camera = activeBoard.camera || { x: 0, y: 0, zoom: 1 }
  cameraRef.current = camera
  activeShapeRef.current = activeShape

  const nodeMap = useMemo(() => nodeMapOf(activeBoard), [activeBoard])
  const edgeMap = useMemo(() => new Map(activeBoard.edges.map((edge) => [edge.id, edge])), [activeBoard])
  const selectionSet = useMemo(() => new Set(selection), [selection])
  const selectedNodes = activeBoard.nodes.filter((node) => selectionSet.has(node.id))
  const selectedEdges = activeBoard.edges.filter((edge) => selectionSet.has(edge.id))
  const selectedGroups = groupsOf(activeBoard).filter(
    (group) => group.childIds.length > 0 && group.childIds.every((id) => selectionSet.has(id)),
  )
  const activeGroup =
    selectedGroups.length === 1 && selection.length === selectedGroups[0].childIds.length ? selectedGroups[0] : null
  const groupedNodeIds = new Set(selectedGroups.flatMap((group) => group.childIds))
  const stats = boardStats(activeBoard)
  const noteDetail = noteFocus ? activeBoard.nodes.find((node) => node.id === noteFocus.id && node.type === 'note') : null
  const filterActive = Boolean(query.trim()) || statusFilter !== 'all'

  function toastMessage(message) {
    setToast(message)
  }

  function selectTool(id) {
    if (id === 'shape') {
      setTool('shape')
      setShapePickerOpen((open) => (tool === 'shape' ? !open : true))
      setShowHint(false)
      return
    }
    setTool(id)
    setShapePickerOpen(false)
  }

  function chooseShape(id) {
    const normalized = normalizeShapeVariant(id)
    activeShapeRef.current = normalized
    setActiveShape(normalized)
    setTool('shape')
    setShapePickerOpen(false)
    setShowHint(false)
    toastMessage(`${tr('Shape selected')}: ${tr(shapeDefinition(normalized).label)}`)
  }

  function updateBoard(updater, options = {}) {
    setStore((prev) => {
      const index = prev.boards.findIndex((board) => board.id === prev.activeId)
      if (index < 0) return prev
      const board = prev.boards[index]
      const next = typeof updater === 'function' ? updater(board) : updater
      if (!next || next === board) return prev
      const withStamp = {
        ...next,
        updatedAt: options.touch === false ? next.updatedAt || board.updatedAt : new Date().toISOString(),
      }
      const boards = prev.boards.slice()
      boards[index] = withStamp
      return { ...prev, boards }
    })
  }

  function pushHistory() {
    const snapshot = cloneJSON(storeRef.current)
    const boardId = snapshot.activeId
    const map = historyRef.current
    const entry = map.get(boardId) || { past: [], future: [] }
    entry.past.push(snapshot)
    if (entry.past.length > 60) entry.past.shift()
    entry.future = []
    map.set(boardId, entry)
  }

  function commitBoard(updater, options = {}) {
    const now = Date.now()
    const coalesce = options.coalesce
    if (options.history !== false) {
      const recent = lastCoalesceRef.current
      if (!(coalesce && recent.key === coalesce && now - recent.time < 900)) pushHistory()
      lastCoalesceRef.current = coalesce ? { key: coalesce, time: now } : { key: null, time: now }
    }
    updateBoard(updater, options)
  }

  function updateNode(id, patch, options = {}) {
    commitBoard(
      (board) => ({
        ...board,
        nodes: board.nodes.map((node) => (node.id === id ? { ...node, ...patch } : node)),
      }),
      options,
    )
  }

  function updateEdge(id, patch, options = {}) {
    commitBoard(
      (board) => ({
        ...board,
        edges: board.edges.map((edge) => (edge.id === id ? { ...edge, ...patch } : edge)),
      }),
      options,
    )
  }

  function updateCamera(next, options = {}) {
    const zoom = clamp(next.zoom, 0.2, 2.5)
    updateBoard(
      (board) => ({
        ...board,
        camera: {
          x: clamp(next.x, -WORLD_LIMIT, WORLD_LIMIT),
          y: clamp(next.y, -WORLD_LIMIT, WORLD_LIMIT),
          zoom,
        },
      }),
      { touch: false, ...options },
    )
  }

  function undo() {
    const entry = historyRef.current.get(activeBoard.id)
    if (!entry || entry.past.length === 0) return
    const current = cloneJSON(storeRef.current)
    const previous = entry.past.pop()
    const currentCamera = current.boards.find((board) => board.id === current.activeId)?.camera
    if (previous.activeId === current.activeId && currentCamera) {
      previous.boards = previous.boards.map((board) =>
        board.id === current.activeId ? { ...board, camera: currentCamera } : board,
      )
    }
    entry.future.push(current)
    if (entry.future.length > 60) entry.future.shift()
    setStore(previous)
    setSelection([])
    setEditing(null)
    toastMessage(tr('Undid last change'))
  }

  function redo() {
    const entry = historyRef.current.get(activeBoard.id)
    if (!entry || entry.future.length === 0) return
    const current = cloneJSON(storeRef.current)
    const next = entry.future.pop()
    const currentCamera = current.boards.find((board) => board.id === current.activeId)?.camera
    if (next.activeId === current.activeId && currentCamera) {
      next.boards = next.boards.map((board) =>
        board.id === current.activeId ? { ...board, camera: currentCamera } : board,
      )
    }
    entry.past.push(current)
    setStore(next)
    setSelection([])
    setEditing(null)
    toastMessage(tr('Redid change'))
  }

  function activateBoard(id) {
    if (!storeRef.current.boards.some((board) => board.id === id)) return
    setStore((prev) => ({ ...prev, activeId: id }))
    setSelection([])
    setEditing(null)
    setQuery('')
    setStatusFilter('all')
    setMenu(null)
  }

  function fitView() {
    const board = boardRef.current
    const width = Math.max(320, viewport.w)
    const height = Math.max(240, viewport.h)
    if (!board.nodes.length) {
      updateCamera({ x: width / 2, y: height / 2, zoom: 1 })
      return
    }
    const bounds = contentBounds(board, true)
    const pad = 52
    const zoom = clamp(Math.min((width - pad * 2) / bounds.w, (height - pad * 2) / bounds.h), 0.2, 1.1)
    updateCamera({
      x: (width - bounds.w * zoom) / 2 - bounds.x * zoom,
      y: (height - bounds.h * zoom) / 2 - bounds.y * zoom,
      zoom,
    })
  }

  function toggleInspector() {
    refitOnResizeRef.current = true
    setInspectorOpen((open) => !open)
  }

  function zoomAt(factor, sx, sy) {
    const cam = cameraRef.current
    const nextZoom = clamp(cam.zoom * factor, 0.2, 2.5)
    const wx = (sx - cam.x) / cam.zoom
    const wy = (sy - cam.y) / cam.zoom
    updateCamera({ x: sx - wx * nextZoom, y: sy - wy * nextZoom, zoom: nextZoom })
  }

  function zoomFromCenter(factor) {
    zoomAt(factor, viewport.w / 2, viewport.h / 2)
  }

  function resetZoom() {
    const cam = cameraRef.current
    const wx = (viewport.w / 2 - cam.x) / cam.zoom
    const wy = (viewport.h / 2 - cam.y) / cam.zoom
    updateCamera({ x: viewport.w / 2 - wx, y: viewport.h / 2 - wy, zoom: 1 })
  }

  function worldFromClient(clientX, clientY) {
    const stage = stageRef.current
    if (!stage) return { x: 0, y: 0 }
    const rect = stage.getBoundingClientRect()
    const cam = cameraRef.current
    return {
      x: (clientX - rect.left - cam.x) / cam.zoom,
      y: (clientY - rect.top - cam.y) / cam.zoom,
    }
  }

  function screenFromWorld(point) {
    const cam = cameraRef.current
    return { x: point.x * cam.zoom + cam.x, y: point.y * cam.zoom + cam.y }
  }

  function viewportCenterWorld() {
    const cam = cameraRef.current
    return { x: (viewport.w / 2 - cam.x) / cam.zoom, y: (viewport.h / 2 - cam.y) / cam.zoom }
  }

  function focusNode(node) {
    if (node.type === 'shape') {
      const shape = normalizeShapeVariant(node.variant)
      activeShapeRef.current = shape
      setActiveShape(shape)
    }
    const cam = cameraRef.current
    const zoom = Math.max(cam.zoom, 0.85)
    updateCamera({
      x: viewport.w / 2 - (node.x + node.w / 2) * zoom,
      y: viewport.h / 2 - (node.y + node.h / 2) * zoom,
      zoom,
    })
    setSelection([node.id])
  }

  function openNoteFocus(node) {
    if (!node || node.type !== 'note') return
    const stage = stageRef.current
    const root = rootRef.current
    const rect = stage ? stage.getBoundingClientRect() : { left: 0, top: 0 }
    const rootRect = root
      ? root.getBoundingClientRect()
      : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }
    const cam = cameraRef.current
    setSelection([node.id])
    setEditing(null)
    setShapePickerOpen(false)
    setNoteFocus({
      id: node.id,
      origin: {
        x: rect.left - rootRect.left + cam.x + node.x * cam.zoom,
        y: rect.top - rootRect.top + cam.y + node.y * cam.zoom,
        w: node.w * cam.zoom,
        h: node.h * cam.zoom,
      },
      bounds: {
        w: rootRect.width || window.innerWidth,
        h: rootRect.height || window.innerHeight,
      },
    })
  }

  function updateNoteContent(noteId, patch, options = {}) {
    const note = boardRef.current.nodes.find((node) => node.id === noteId)
    if (!note || note.type !== 'note') return
    const title = patch.title !== undefined ? patch.title : note.title || ''
    const blocks =
      patch.blocks !== undefined
        ? patch.blocks
        : Array.isArray(note.blocks) && note.blocks.length
          ? note.blocks
          : parseNoteText(note.text, title || 'Note').blocks
    updateNode(
      noteId,
      {
        ...patch,
        title,
        blocks,
        text: notePlainText(title, blocks),
      },
      options,
    )
  }

  function hitTestNode(point, options = {}) {
    const board = boardRef.current
    const allowFrames = options.allowFrames === true
    const exclude = new Set(options.exclude || [])
    for (let index = board.nodes.length - 1; index >= 0; index -= 1) {
      const node = board.nodes[index]
      if (node.type === 'lane') continue
      if (!allowFrames && node.type === 'frame') continue
      if (exclude.has(node.id)) continue
      if (pointInNode(node, point)) return node
    }
    return null
  }

  function hitTestLane(point) {
    const board = boardRef.current
    for (let index = board.nodes.length - 1; index >= 0; index -= 1) {
      const node = board.nodes[index]
      if (node.type === 'lane' && pointInNode(node, point)) return node
    }
    return null
  }

  function endGesture() {
    if (gestureCleanupRef.current) {
      gestureCleanupRef.current()
      gestureCleanupRef.current = null
    }
  }

  function beginWindowGesture(handlers) {
    endGesture()
    const move = (event) => {
      if (handlers.move) handlers.move(event)
    }
    const up = (event) => {
      endGesture()
      if (handlers.up) handlers.up(event)
    }
    const cancel = () => {
      endGesture()
      setMarquee(null)
      setCreatePreview(null)
      setConnectPreview(null)
      setConnectTarget(null)
      setDropTarget(null)
      setIsPanning(false)
      setDragging(false)
    }
    window.addEventListener('pointermove', move, { passive: false })
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', cancel)
    gestureCleanupRef.current = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', cancel)
    }
  }

  useEffect(() => endGesture, [])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return undefined
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect
      setViewport({ w: Math.max(1, rect.width), h: Math.max(1, rect.height) })
    })
    observer.observe(stage)
    setViewport({ w: Math.max(1, stage.clientWidth), h: Math.max(1, stage.clientHeight) })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (viewport.w > 0 && viewport.h > 0 && !fittedRef.current.has(activeBoard.id)) {
      fittedRef.current.add(activeBoard.id)
      const frame = window.requestAnimationFrame(() => fitView())
      return () => window.cancelAnimationFrame(frame)
    }
    return undefined
  }, [activeBoard.id, viewport.w, viewport.h])

  useEffect(() => {
    if (!refitOnResizeRef.current || viewport.w <= 0 || viewport.h <= 0) return undefined
    refitOnResizeRef.current = false
    const frame = window.requestAnimationFrame(() => fitView())
    return () => window.cancelAnimationFrame(frame)
  }, [viewport.w, viewport.h])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return undefined
    const onWheel = (event) => {
      if (isEditableTarget(event.target)) return
      event.preventDefault()
      let dx = event.deltaX
      let dy = event.deltaY
      if (event.deltaMode === 1) {
        dx *= 18
        dy *= 18
      }
      if (event.ctrlKey || event.metaKey) {
        const rect = stage.getBoundingClientRect()
        const factor = Math.exp(-dy * 0.0022)
        zoomAt(factor, event.clientX - rect.left, event.clientY - rect.top)
      } else {
        const cam = cameraRef.current
        updateCamera({ x: cam.x - dx, y: cam.y - dy, zoom: cam.zoom })
      }
    }
    stage.addEventListener('wheel', onWheel, { passive: false })
    return () => stage.removeEventListener('wheel', onWheel)
  }, [])

  useEffect(() => {
    setSaveState('saving')
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storeRef.current))
        setSaveState('saved')
      } catch (error) {
        setSaveState('error')
        toastMessage(tr('Could not save this board locally'))
      }
    }, 500)
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    }
  }, [store])

  useEffect(() => {
    const flush = () => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storeRef.current))
      } catch (error) {
        /* best effort on unload */
      }
    }
    window.addEventListener('beforeunload', flush)
    return () => {
      window.removeEventListener('beforeunload', flush)
      flush()
    }
  }, [])

  useEffect(() => {
    if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current)
    hintTimerRef.current = window.setTimeout(() => setShowHint(false), 12000)
    return () => {
      if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!menu) return undefined
    const close = (event) => {
      if (!event.target.closest('.ec-menu-wrap')) setMenu(null)
    }
    window.addEventListener('pointerdown', close, true)
    return () => window.removeEventListener('pointerdown', close, true)
  }, [menu])

  function selectOnly(id) {
    setSelection([id])
    setEditing(null)
  }

  function toggleSelected(id) {
    setSelection((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]))
    setEditing(null)
  }

  function pushHistoryOnce() {
    pushHistory()
    lastCoalesceRef.current = { key: null, time: Date.now() }
  }

  function beginPan(event) {
    event.preventDefault()
    const startX = event.clientX
    const startY = event.clientY
    const cam = cameraRef.current
    setIsPanning(true)
    setShowHint(false)
    beginWindowGesture({
      move(moveEvent) {
        updateCamera({
          x: cam.x + (moveEvent.clientX - startX),
          y: cam.y + (moveEvent.clientY - startY),
          zoom: cam.zoom,
        })
      },
      up() {
        setIsPanning(false)
      },
    })
  }

  function beginDrag(event, ids) {
    const board = boardRef.current
    const dragIds = new Set(ids.filter((id) => nodeMap.get(id)))
    for (const id of ids) {
      const node = nodeMap.get(id)
      if (node && node.type === 'frame') {
        for (const candidate of board.nodes) {
          if (candidate.type === 'frame' || candidate.type === 'lane') continue
          const center = { x: candidate.x + candidate.w / 2, y: candidate.y + candidate.h / 2 }
          if (pointInNode(node, center)) dragIds.add(candidate.id)
        }
      }
    }
    const base = new Map()
    for (const id of dragIds) {
      const node = nodeMap.get(id)
      if (node) base.set(id, { x: node.x, y: node.y })
    }
    const start = worldFromClient(event.clientX, event.clientY)
    const directTasks = new Set(ids.filter((id) => nodeMap.get(id)?.type === 'task'))
    let moved = false
    let historyPushed = false
    beginWindowGesture({
      move(moveEvent) {
        const point = worldFromClient(moveEvent.clientX, moveEvent.clientY)
        let dx = point.x - start.x
        let dy = point.y - start.y
        if (!moved && Math.hypot(dx, dy) < 2) return
        if (!moved) {
          moved = true
          setDragging(true)
          setShowHint(false)
        }
        if (!historyPushed) {
          historyPushed = true
          pushHistoryOnce()
        }
        dx = Math.round(dx)
        dy = Math.round(dy)
        updateBoard(
          (current) => ({
            ...current,
            nodes: current.nodes.map((node) => {
              const origin = base.get(node.id)
              return origin ? { ...node, x: origin.x + dx, y: origin.y + dy } : node
            }),
          }),
          { touch: false },
        )
        let lane = null
        for (const id of directTasks) {
          const origin = base.get(id)
          const node = nodeMap.get(id)
          if (!origin || !node) continue
          lane = hitTestLane({ x: origin.x + dx + node.w / 2, y: origin.y + dy + node.h / 2 })
          if (lane) break
        }
        setDropTarget(lane ? lane.id : null)
      },
      up() {
        setDragging(false)
        setDropTarget(null)
        if (!moved) return
        if (!directTasks.size) return
        let lane = null
        const cam = cameraRef.current
        for (const id of directTasks) {
          const origin = base.get(id)
          const node = nodeMap.get(id)
          if (!origin || !node) continue
          const current = boardRef.current.nodes.find((item) => item.id === id)
          if (!current) continue
          lane = hitTestLane({ x: current.x + current.w / 2, y: current.y + current.h / 2 })
          if (lane) break
        }
        if (lane) {
          const laneStatus = lane.status
          commitBoard(
            (current) => ({
              ...current,
              nodes: current.nodes.map((node) =>
                directTasks.has(node.id) && node.status !== laneStatus ? { ...node, status: laneStatus } : node,
              ),
            }),
            { history: false },
          )
        }
      },
    })
  }

  function beginResize(event, node) {
    event.stopPropagation()
    event.preventDefault()
    const start = worldFromClient(event.clientX, event.clientY)
    const base = { w: node.w, h: node.h }
    const minW = node.type === 'text' ? 80 : node.type === 'task' ? 190 : 150
    const minH = node.type === 'text' ? 28 : node.type === 'task' ? 140 : 90
    let moved = false
    let historyPushed = false
    beginWindowGesture({
      move(moveEvent) {
        const point = worldFromClient(moveEvent.clientX, moveEvent.clientY)
        const w = Math.round(clamp(base.w + point.x - start.x, minW, 2400))
        const h = Math.round(clamp(base.h + point.y - start.y, minH, 2000))
        if (!moved && Math.abs(w - base.w) < 2 && Math.abs(h - base.h) < 2) return
        if (!moved) {
          moved = true
          setDragging(true)
        }
        if (!historyPushed) {
          historyPushed = true
          pushHistoryOnce()
        }
        updateBoard(
          (board) => ({
            ...board,
            nodes: board.nodes.map((item) => (item.id === node.id ? { ...item, w, h } : item)),
          }),
          { touch: false },
        )
      },
      up() {
        setDragging(false)
      },
    })
  }

  function beginMarquee(event) {
    const start = worldFromClient(event.clientX, event.clientY)
    const shift = event.shiftKey
    let finalRect = { x0: start.x, y0: start.y, x1: start.x, y1: start.y }
    if (!shift) setSelection([])
    setEditing(null)
    setMarquee(finalRect)
    beginWindowGesture({
      move(moveEvent) {
        const point = worldFromClient(moveEvent.clientX, moveEvent.clientY)
        finalRect = { x0: start.x, y0: start.y, x1: point.x, y1: point.y }
        setMarquee(finalRect)
      },
      up() {
        setMarquee(null)
        if (Math.abs(finalRect.x1 - finalRect.x0) < 3 && Math.abs(finalRect.y1 - finalRect.y0) < 3) return
        const board = boardRef.current
        const baseHits = nodesInRect(board.nodes, finalRect)
          .filter((node) => node.type !== 'frame' && node.type !== 'lane')
          .map((node) => node.id)
        const hits = expandIdsByGroups(board, baseHits)
        setSelection((previous) => {
          if (!shift) return hits
          return Array.from(new Set([...previous, ...hits]))
        })
      },
    })
  }

  function addNode(node, options = {}) {
    pushHistory()
    updateBoard((board) => ({ ...board, nodes: [...board.nodes, node] }))
    setSelection([node.id])
    setEditing(options.edit ? { id: node.id, field: options.edit } : null)
    setTool('select')
    setShapePickerOpen(false)
    setShowHint(false)
  }

  function createNode(type, point) {
    if (type === 'task') {
      const lane = hitTestLane(point)
      const node = makeTask(uid('task'), lane ? lane.x + 14 : point.x - 112, lane ? Math.max(lane.y + 76, point.y - 34) : point.y - 34, {
        status: lane ? lane.status : 'backlog',
        title: 'Untitled task',
        checklist: [],
      })
      addNode(node, { edit: 'title' })
      return
    }
    if (type === 'note') {
      const node = makeNote(uid('note'), point.x - 135, point.y - 50, 'New note\n\nWrite the context, decision, or risk here.', 'amber')
      addNode(node)
      openNoteFocus(node)
      return
    }
    if (type === 'text') {
      const node = makeText(uid('text'), point.x, point.y - 16, '', { w: 320, h: 40, size: 18, weight: 500 })
      addNode(node, { edit: 'text' })
      return
    }
    if (type === 'shape') {
      const definition = shapeDefinition(activeShapeRef.current || activeShape)
      const node = makeShape(uid('shape'), point.x - definition.w / 2, point.y - definition.h / 2, definition.text, {
        variant: definition.id,
        w: definition.w,
        h: definition.h,
        tone: 'blue',
      })
      addNode(node, { edit: 'text' })
      setShapePickerOpen(false)
      return
    }
  }

  function beginFrame(event) {
    const start = worldFromClient(event.clientX, event.clientY)
    setCreatePreview({ x: start.x, y: start.y, w: 0, h: 0 })
    let currentRect = null
    beginWindowGesture({
      move(moveEvent) {
        const point = worldFromClient(moveEvent.clientX, moveEvent.clientY)
        currentRect = {
          x: Math.min(start.x, point.x),
          y: Math.min(start.y, point.y),
          w: Math.abs(point.x - start.x),
          h: Math.abs(point.y - start.y),
        }
        setCreatePreview(currentRect)
      },
      up() {
        setCreatePreview(null)
        const rect = currentRect || { x: start.x - 260, y: start.y - 180, w: 520, h: 360 }
        const node = makeFrame(
          uid('frame'),
          Math.round(rect.w < 40 ? start.x - 260 : rect.x),
          Math.round(rect.h < 40 ? start.y - 180 : rect.y),
          Math.round(rect.w < 40 ? 520 : rect.w),
          Math.round(rect.h < 40 ? 360 : rect.h),
          'New frame',
          '',
        )
        addNode(node)
      },
    })
  }

  function startEditing(node, field, options = {}) {
    if (options.history !== false) pushHistory()
    setSelection([node.id])
    setEditing({ id: node.id, field })
    setShowHint(false)
  }

  function finishEditing() {
    if (!editing) return
    const node = nodeMap.get(editing.id)
    setEditing(null)
    if (node && node.type === 'text' && !String(node.text || '').trim()) {
      updateBoard((board) => ({
        ...board,
        nodes: board.nodes.filter((item) => item.id !== node.id),
        edges: board.edges.filter((edge) => edge.from !== node.id && edge.to !== node.id),
      }))
      setSelection([])
    }
  }

  function startConnect(event, node, side) {
    event.stopPropagation()
    event.preventDefault()
    let fromSide = side
    if (!fromSide || fromSide === 'auto') {
      const point = worldFromClient(event.clientX, event.clientY)
      const dx = point.x - (node.x + node.w / 2)
      const dy = point.y - (node.y + node.h / 2)
      fromSide = Math.abs(dx) > Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : dy >= 0 ? 'bottom' : 'top'
    }
    const startWorld = portPoint(node, fromSide)
    const startScreen = screenFromWorld(startWorld)
    setConnectPreview({ start: startScreen, current: startScreen, sourceId: node.id, side: fromSide })
    setConnectTarget(null)
    beginWindowGesture({
      move(moveEvent) {
        const stage = stageRef.current
        if (!stage) return
        const rect = stage.getBoundingClientRect()
        const current = { x: moveEvent.clientX - rect.left, y: moveEvent.clientY - rect.top }
        setConnectPreview((prev) => (prev ? { ...prev, current } : prev))
        const world = worldFromClient(moveEvent.clientX, moveEvent.clientY)
        const target = hitTestNode(world, { exclude: [node.id] })
        setConnectTarget(target ? target.id : null)
      },
      up(upEvent) {
        const world = worldFromClient(upEvent.clientX, upEvent.clientY)
        const target = hitTestNode(world, { exclude: [node.id] })
        setConnectPreview(null)
        setConnectTarget(null)
        if (target) {
          const edge = makeEdge(uid('edge'), node.id, target.id, { fromSide, toSide: 'auto' })
          commitBoard((board) => ({ ...board, edges: [...board.edges, edge] }))
          setSelection([edge.id])
          setTool('select')
          toastMessage(tr('Connected') + ' · ' + (target.title || target.text || tr('Node')))
        }
      },
    })
  }

  function beginPen(event) {
    const start = worldFromClient(event.clientX, event.clientY)
    const id = uid('draw')
    const raw = [{ x: start.x, y: start.y }]
    pushHistoryOnce()
    setSelection([id])
    setEditing(null)
    setShowHint(false)
    updateBoard((board) => ({
      ...board,
      nodes: [
        ...board.nodes,
        {
          id,
          type: 'draw',
          x: start.x,
          y: start.y,
          w: 2,
          h: 2,
          points: [{ x: 0, y: 0 }],
          tone: 'blue',
          width: 2.6,
        },
      ],
    }))
    beginWindowGesture({
      move(moveEvent) {
        const point = worldFromClient(moveEvent.clientX, moveEvent.clientY)
        const last = raw[raw.length - 1]
        if (last && Math.hypot(point.x - last.x, point.y - last.y) < 1.5) return
        raw.push(point)
        const normalized = normalizeStroke(raw)
        updateBoard(
          (board) => ({
            ...board,
            nodes: board.nodes.map((node) => (node.id === id ? { ...node, ...normalized } : node)),
          }),
          { touch: false },
        )
      },
      up() {
        if (raw.length < 2) {
          updateBoard((board) => ({
            ...board,
            nodes: board.nodes.filter((node) => node.id !== id),
          }))
          setSelection([])
        }
      },
    })
  }

  function normalizeStroke(raw) {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const point of raw) {
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
    }
    const pad = 8
    return {
      x: minX - pad,
      y: minY - pad,
      w: Math.max(2, maxX - minX + pad * 2),
      h: Math.max(2, maxY - minY + pad * 2),
      points: raw.map((point) => ({ x: point.x - minX + pad, y: point.y - minY + pad })),
    }
  }

  function removeNodes(ids) {
    const remove = new Set(ids)
    commitBoard((board) => ({
      ...board,
      nodes: board.nodes.filter((node) => !remove.has(node.id)),
      edges: board.edges.filter((edge) => !remove.has(edge.from) && !remove.has(edge.to) && !remove.has(edge.id)),
      groups: pruneGroups(board, remove),
    }))
    setSelection([])
    setEditing(null)
    toastMessage(tr('Deleted'))
  }

  function deleteSelection() {
    if (selection.length === 0) return
    removeNodes(selection)
  }

  function deleteNode(node) {
    pushHistoryOnce()
    updateBoard((board) => ({
      ...board,
      nodes: board.nodes.filter((item) => item.id !== node.id),
      edges: board.edges.filter((edge) => edge.from !== node.id && edge.to !== node.id),
      groups: pruneGroups(board, new Set([node.id])),
    }))
    setSelection((prev) => prev.filter((id) => id !== node.id))
    setEditing(null)
    toastMessage(tr('Deleted'))
  }

  function deleteEdge(edge) {
    pushHistoryOnce()
    updateBoard((board) => ({ ...board, edges: board.edges.filter((item) => item.id !== edge.id) }))
    setSelection((prev) => prev.filter((id) => id !== edge.id))
    toastMessage(tr('Deleted'))
  }

  function beginErase(event) {
    let removed = false
    const erase = (clientX, clientY) => {
      const node = hitTestNode(worldFromClient(clientX, clientY))
      if (!node) return
      if (!removed) {
        removed = true
        pushHistoryOnce()
      }
      updateBoard((board) => ({
        ...board,
        nodes: board.nodes.filter((item) => item.id !== node.id),
        edges: board.edges.filter((edge) => edge.from !== node.id && edge.to !== node.id),
        groups: pruneGroups(board, new Set([node.id])),
      }))
      setSelection((prev) => prev.filter((id) => id !== node.id))
    }
    erase(event.clientX, event.clientY)
    setShowHint(false)
    beginWindowGesture({
      move(moveEvent) {
        erase(moveEvent.clientX, moveEvent.clientY)
      },
      up() {
        if (removed) toastMessage(tr('Deleted'))
      },
    })
  }

  function duplicateSelection() {
    if (!selectedNodes.length) return
    const idMap = new Map()
    const copies = selectedNodes.map((node) => {
      const next = cloneJSON(node)
      next.id = uid(node.type)
      next.x += 28
      next.y += 28
      if (Array.isArray(next.checklist)) {
        next.checklist = next.checklist.map((item) => ({ ...item, id: uid('check') }))
      }
      idMap.set(node.id, next.id)
      return next
    })
    const edges = activeBoard.edges
      .filter((edge) => idMap.has(edge.from) && idMap.has(edge.to))
      .map((edge) => ({ ...edge, id: uid('edge'), from: idMap.get(edge.from), to: idMap.get(edge.to) }))
    const groupCopies = groupsOf(activeBoard)
      .filter((group) => group.childIds.every((id) => idMap.has(id)))
      .map((group) => ({
        id: uid('group'),
        name: group.name,
        childIds: group.childIds.map((id) => idMap.get(id)),
      }))
    pushHistory()
    updateBoard((board) => ({
      ...board,
      nodes: [...board.nodes, ...copies],
      edges: [...board.edges, ...edges],
      groups: [...groupsOf(board), ...groupCopies],
    }))
    setSelection(copies.map((node) => node.id))
    toastMessage(tr('Duplicated'))
  }

  function groupSelection() {
    const ids = selectedNodes.filter((node) => node.type !== 'frame' && node.type !== 'lane').map((node) => node.id)
    if (ids.length < 2) {
      toastMessage(tr('Select at least two components to group'))
      return
    }
    const groupId = uid('group')
    const selectedIds = new Set(ids)
    commitBoard((board) => {
      const remaining = groupsOf(board)
        .map((group) => ({ ...group, childIds: group.childIds.filter((id) => !selectedIds.has(id)) }))
        .filter((group) => group.childIds.length >= 2)
      return {
        ...board,
        groups: [...remaining, { id: groupId, name: tr('Group'), childIds: ids }],
      }
    })
    setSelection(ids)
    toastMessage(`${tr('Grouped')} ${ids.length} ${tr('components')}`)
  }

  function ungroupSelection() {
    const affected = groupsOf(boardRef.current).filter((group) => group.childIds.some((id) => selectionSet.has(id)))
    if (!affected.length) {
      toastMessage(tr('Select a group first'))
      return
    }
    const affectedIds = new Set(affected.map((group) => group.id))
    const children = affected.flatMap((group) => group.childIds)
    commitBoard((board) => ({
      ...board,
      groups: groupsOf(board).filter((group) => !affectedIds.has(group.id)),
    }))
    setSelection((previous) => Array.from(new Set([...previous, ...children])))
    toastMessage(tr('Ungrouped'))
  }

  function renameGroup(groupId, name) {
    commitBoard(
      (board) => ({
        ...board,
        groups: groupsOf(board).map((group) =>
          group.id === groupId ? { ...group, name: String(name || '').trim() } : group,
        ),
      }),
      { coalesce: `group-name:${groupId}` },
    )
  }

  function beginGroupResize(event, group) {
    event.stopPropagation()
    event.preventDefault()
    const base = groupBounds(boardRef.current, group)
    if (!base) return
    const start = worldFromClient(event.clientX, event.clientY)
    const baseNodes = new Map(base.nodes.map((node) => [node.id, { x: node.x, y: node.y, w: node.w, h: node.h }]))
    let moved = false
    let historyPushed = false
    setDragging(true)
    beginWindowGesture({
      move(moveEvent) {
        const point = worldFromClient(moveEvent.clientX, moveEvent.clientY)
        const width = clamp(base.w + point.x - start.x, 120, 5000)
        const height = clamp(base.h + point.y - start.y, 80, 5000)
        const scaleX = width / base.w
        const scaleY = height / base.h
        if (!moved && Math.abs(width - base.w) < 2 && Math.abs(height - base.h) < 2) return
        if (!moved) {
          moved = true
          pushHistoryOnce()
          historyPushed = true
        }
        updateBoard(
          (board) => ({
            ...board,
            nodes: board.nodes.map((node) => {
              const origin = baseNodes.get(node.id)
              if (!origin) return node
              return {
                ...node,
                x: Math.round(base.x + (origin.x - base.x) * scaleX),
                y: Math.round(base.y + (origin.y - base.y) * scaleY),
                w: Math.max(40, Math.round(origin.w * scaleX)),
                h: Math.max(28, Math.round(origin.h * scaleY)),
              }
            }),
          }),
          { touch: false },
        )
      },
      up() {
        setDragging(false)
        if (!historyPushed && !moved) return
      },
    })
  }

  function alignSelection(mode) {
    if (selectedNodes.length < 2) return
    const left = Math.min(...selectedNodes.map((node) => node.x))
    const right = Math.max(...selectedNodes.map((node) => node.x + node.w))
    const top = Math.min(...selectedNodes.map((node) => node.y))
    const bottom = Math.max(...selectedNodes.map((node) => node.y + node.h))
    const centerX = (left + right) / 2
    const centerY = (top + bottom) / 2
    const ids = new Set(selectedNodes.map((node) => node.id))
    commitBoard((board) => ({
      ...board,
      nodes: board.nodes.map((node) => {
        if (!ids.has(node.id)) return node
        if (mode === 'left') return { ...node, x: Math.round(left) }
        if (mode === 'right') return { ...node, x: Math.round(right - node.w) }
        if (mode === 'hcenter') return { ...node, x: Math.round(centerX - node.w / 2) }
        if (mode === 'top') return { ...node, y: Math.round(top) }
        if (mode === 'bottom') return { ...node, y: Math.round(bottom - node.h) }
        if (mode === 'vcenter') return { ...node, y: Math.round(centerY - node.h / 2) }
        return node
      }),
    }))
  }

  function distributeSelection(axis) {
    if (selectedNodes.length < 3) return
    const sorted = [...selectedNodes].sort((a, b) => (axis === 'x' ? a.x - b.x : a.y - b.y))
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    const span =
      axis === 'x'
        ? last.x + last.w / 2 - (first.x + first.w / 2)
        : last.y + last.h / 2 - (first.y + first.h / 2)
    const step = span / (sorted.length - 1)
    const positions = new Map()
    sorted.forEach((node, index) => {
      if (index === 0 || index === sorted.length - 1) return
      if (axis === 'x') positions.set(node.id, { x: Math.round(first.x + first.w / 2 + step * index - node.w / 2) })
      else positions.set(node.id, { y: Math.round(first.y + first.h / 2 + step * index - node.h / 2) })
    })
    commitBoard((board) => ({
      ...board,
      nodes: board.nodes.map((node) => {
        const patch = positions.get(node.id)
        return patch ? { ...node, ...patch } : node
      }),
    }))
  }

  function bringToFront() {
    const ids = new Set(selectedNodes.map((node) => node.id))
    if (!ids.size) return
    commitBoard((board) => ({
      ...board,
      nodes: [...board.nodes.filter((node) => !ids.has(node.id)), ...board.nodes.filter((node) => ids.has(node.id))],
    }))
  }

  function sendToBack() {
    const ids = new Set(selectedNodes.map((node) => node.id))
    if (!ids.size) return
    commitBoard((board) => ({
      ...board,
      nodes: [...board.nodes.filter((node) => ids.has(node.id)), ...board.nodes.filter((node) => !ids.has(node.id))],
    }))
  }

  function addBoard(template) {
    const created = template.create()
    const current = activeBoard
    const isEmpty = current.nodes.length === 0
    pushHistory()
    if (isEmpty) {
      setStore((prev) => ({
        ...prev,
        activeId: created.id,
        boards: prev.boards.map((board) =>
          board.id === current.id
            ? {
                ...created,
                title: board.title === 'Untitled canvas' ? created.title : board.title,
              }
            : board,
        ),
      }))
      setSelection([])
      setEditing(null)
      setQuery('')
      setStatusFilter('all')
      setModal(null)
      toastMessage(tr('Board created'))
      return
    }
    setStore((prev) => ({ ...prev, activeId: created.id, boards: [...prev.boards, created] }))
    setSelection([])
    setEditing(null)
    setQuery('')
    setStatusFilter('all')
    setModal(null)
    toastMessage(tr('Board created'))
  }

  function createEmptyBoard() {
    const board = createBlankBoard(nextBoardTitle(storeRef.current.boards))
    pushHistory()
    setStore((prev) => ({ ...prev, activeId: board.id, boards: [...prev.boards, board] }))
    setSelection([])
    setEditing(null)
    setQuery('')
    setStatusFilter('all')
    setModal(null)
    toastMessage(tr('Board created'))
  }

  function duplicateBoard() {
    const copy = cloneJSON(activeBoard)
    copy.id = uid('board')
    copy.title = `${activeBoard.title} copy`
    copy.createdAt = new Date().toISOString()
    copy.updatedAt = new Date().toISOString()
    copy.camera = null
    pushHistory()
    setStore((prev) => ({ ...prev, activeId: copy.id, boards: [...prev.boards, copy] }))
    setSelection([])
    setEditing(null)
    setMenu(null)
    toastMessage(tr('Board duplicated'))
  }

  function requestDeleteBoard() {
    setMenu(null)
    if (storeRef.current.boards.length <= 1) {
      toastMessage(tr('Keep at least one board'))
      return
    }
    setConfirmState({
      title: tr('Delete this board?'),
      body: `${tr('This permanently removes')} “${activeBoard.title}” ${tr('and everything on it.')}`,
      confirmLabel: tr('Delete board'),
      tone: 'danger',
      action() {
        const current = storeRef.current
        const remaining = current.boards.filter((board) => board.id !== current.activeId)
        pushHistory()
        setStore({ ...current, activeId: remaining[0].id, boards: remaining })
        setSelection([])
        setEditing(null)
        setConfirmState(null)
        toastMessage(tr('Board deleted'))
      },
    })
  }

  function exportJSON() {
    setMenu(null)
    downloadText(
      JSON.stringify({ version: SCHEMA_VERSION, activeId: activeBoard.id, boards: storeRef.current.boards }, null, 2),
      `${fileSafe(activeBoard.title)}.canvas.json`,
    )
    toastMessage(tr('JSON exported'))
  }

  function exportMarkdown() {
    setMenu(null)
    downloadText(markdownForBoard(activeBoard), `${fileSafe(activeBoard.title)}.md`, 'text/markdown')
    toastMessage(tr('Markdown exported'))
  }

  function exportPNG() {
    setMenu(null)
    try {
      renderBoardToPNG(activeBoard)
      toastMessage(tr('PNG exported'))
    } catch (error) {
      toastMessage(tr('Could not export the image'))
    }
  }

  function handleImportFile(event) {
    const file = event.target.files && event.target.files[0]
    event.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ''))
        const normalized = normalizeState(parsed)
        if (normalized) {
          pushHistory()
          const boards = normalized.boards.map((board) => ({
            ...board,
            id: storeRef.current.boards.some((existing) => existing.id === board.id) ? uid('board') : board.id,
            camera: null,
          }))
          setStore((prev) => ({
            version: SCHEMA_VERSION,
            activeId: boards[0].id,
            boards: [...prev.boards, ...boards],
          }))
          setSelection([])
          setMenu(null)
          toastMessage(`${boards.length} ${tr(boards.length === 1 ? 'board imported' : 'boards imported')}`)
          return
        }
        if (parsed && Array.isArray(parsed.nodes)) {
          const board = normalizeState({ version: SCHEMA_VERSION, activeId: 'import', boards: [{ ...parsed, id: 'import' }] })
          if (board) {
            const imported = { ...board.boards[0], id: uid('board'), camera: null }
            pushHistory()
            setStore((prev) => ({ ...prev, activeId: imported.id, boards: [...prev.boards, imported] }))
            setSelection([])
            setMenu(null)
            toastMessage(tr('Board imported'))
            return
          }
        }
        toastMessage(tr('That file is not a canvas backup'))
      } catch (error) {
        toastMessage(tr('That file is not valid JSON'))
      }
    }
    reader.readAsText(file)
  }

  function openImport() {
    setMenu(null)
    if (importRef.current) importRef.current.click()
  }

  const historyState = historyRef.current.get(activeBoard.id)
  const canUndo = Boolean(historyState?.past.length)
  const canRedo = Boolean(historyState?.future.length)

  useEffect(() => {
    function handleKeyDown(event) {
      const key = event.key
      const lower = key.toLowerCase()
      const meta = event.metaKey || event.ctrlKey
      if (noteFocus) return
      if (meta && lower === 'k') {
        event.preventDefault()
        setPaletteOpen((open) => !open)
        setPaletteQuery('')
        setPaletteIndex(0)
        return
      }
      if (isEditableTarget(event.target)) {
        if (key === 'Escape') event.target.blur()
        return
      }
      if (meta && lower === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }
      if (meta && lower === 'y') {
        event.preventDefault()
        redo()
        return
      }
      if (meta && lower === 'g') {
        event.preventDefault()
        if (event.shiftKey) ungroupSelection()
        else groupSelection()
        return
      }
      if (meta && lower === 'd') {
        event.preventDefault()
        duplicateSelection()
        return
      }
      if (meta && lower === 'a') {
        event.preventDefault()
        setSelection(
          boardRef.current.nodes.filter((node) => node.type !== 'frame' && node.type !== 'lane').map((node) => node.id),
        )
        return
      }
      if (meta && lower === 'n') {
        event.preventDefault()
        openTemplates()
        return
      }
      if (meta && key === '0') {
        event.preventDefault()
        fitView()
        return
      }
      if (key === 'Escape') {
        if (shapePickerOpen) setShapePickerOpen(false)
        else if (paletteOpen) setPaletteOpen(false)
        else if (modal) setModal(null)
        else if (confirmState) setConfirmState(null)
        else if (menu) setMenu(null)
        else if (editing) setEditing(null)
        else setSelection([])
        endGesture()
        setIsPanning(false)
        setDragging(false)
        setMarquee(null)
        setCreatePreview(null)
        setConnectPreview(null)
        setConnectTarget(null)
        return
      }
      if (key === ' ' && !event.repeat) {
        event.preventDefault()
        setSpaceDown(true)
        return
      }
      if (key === '?') {
        event.preventDefault()
        setModal('shortcuts')
        return
      }
      if (!meta && (tool === 'shape' || shapePickerOpen) && /^[1-8]$/.test(key)) {
        const shape = SHAPE_TYPES[Number(key) - 1]
        if (shape) {
          event.preventDefault()
          chooseShape(shape.id)
          return
        }
      }
      const toolByKey = TOOL_DEFS.find((definition) => definition.key.toLowerCase() === lower)
      if (!meta && toolByKey) {
        event.preventDefault()
        selectTool(toolByKey.id)
        return
      }
      if (key === 'Enter' && selection.length === 1) {
        const node = boardRef.current.nodes.find((item) => item.id === selection[0])
        if (node?.type === 'task') startEditing(node, 'title')
        else if (node?.type === 'note') openNoteFocus(node)
        else if (node && (node.type === 'text' || node.type === 'shape')) startEditing(node, 'text')
        return
      }
      if ((key === 'Backspace' || key === 'Delete') && selection.length) {
        event.preventDefault()
        deleteSelection()
        return
      }
      if (!meta && (key === '=' || key === '+')) {
        event.preventDefault()
        zoomFromCenter(1.18)
        return
      }
      if (!meta && key === '-') {
        event.preventDefault()
        zoomFromCenter(1 / 1.18)
        return
      }
      if (!meta && key.startsWith('Arrow') && selection.length) {
        event.preventDefault()
        const step = event.shiftKey ? 10 : 1
        const ids = new Set(selection)
        commitBoard((board) => ({
          ...board,
          nodes: board.nodes.map((node) => {
            if (!ids.has(node.id)) return node
            if (key === 'ArrowLeft') return { ...node, x: node.x - step }
            if (key === 'ArrowRight') return { ...node, x: node.x + step }
            if (key === 'ArrowUp') return { ...node, y: node.y - step }
            return { ...node, y: node.y + step }
          }),
        }))
      }
    }
    function handleKeyUp(event) {
      if (event.key === ' ') setSpaceDown(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [
    activeBoard.id,
    activeBoard.updatedAt,
    selection,
    editing,
    tool,
    shapePickerOpen,
    noteFocus,
    paletteOpen,
    modal,
    confirmState,
    menu,
    viewport.w,
    viewport.h,
  ])

  function handleStagePointerDown(event) {
    if (event.button === 2) return
    if (shapePickerOpen) setShapePickerOpen(false)
    if (event.button === 1 || spaceDown || tool === 'hand') {
      beginPan(event)
      return
    }
    if (event.button !== 0) return
    if (tool === 'eraser') {
      event.preventDefault()
      beginErase(event)
      return
    }
    if (tool === 'pen') {
      event.preventDefault()
      beginPen(event)
      return
    }
    if (tool === 'frame') {
      event.preventDefault()
      beginFrame(event)
      return
    }
    if (tool === 'task' || tool === 'note' || tool === 'text' || tool === 'shape') {
      event.preventDefault()
      createNode(tool, worldFromClient(event.clientX, event.clientY))
      return
    }
    if (tool === 'connect') {
      setSelection([])
      return
    }
    beginMarquee(event)
  }

  function handleStageDoubleClick(event) {
    if (tool !== 'select') return
    if (event.target !== event.currentTarget) return
    createNode('text', worldFromClient(event.clientX, event.clientY))
  }

  function handleNodePointerDown(event, node) {
    if (event.button === 1 || spaceDown || tool === 'hand') {
      beginPan(event)
      return
    }
    if (event.button !== 0) return
    if (tool === 'eraser') {
      event.stopPropagation()
      event.preventDefault()
      deleteNode(node)
      return
    }
    if (tool === 'connect') {
      startConnect(event, node, 'auto')
      return
    }
    if (tool === 'pen') {
      event.stopPropagation()
      event.preventDefault()
      beginPen(event)
      return
    }
    if (tool === 'task' || tool === 'note' || tool === 'text' || tool === 'shape' || tool === 'frame') {
      return
    }
    event.stopPropagation()
    setShowHint(false)
    if (node.type === 'shape') {
      const shape = normalizeShapeVariant(node.variant)
      activeShapeRef.current = shape
      setActiveShape(shape)
    }
    const group = groupForNode(boardRef.current, node.id)
    const memberIds = (group?.childIds || [node.id]).filter(
      (id) => nodeMap.get(id) && nodeMap.get(id).type !== 'lane',
    )
    if (event.altKey) {
      const next = [node.id]
      setSelection(next)
      beginDrag(event, next)
      return
    }
    if (event.shiftKey) {
      const allSelected = memberIds.every((id) => selection.includes(id))
      const next = allSelected
        ? selection.filter((id) => !memberIds.includes(id))
        : Array.from(new Set([...selection, ...memberIds]))
      setSelection(next)
      if (!next.some((id) => memberIds.includes(id))) return
      beginDrag(
        event,
        next.filter((id) => nodeMap.get(id) && nodeMap.get(id).type !== 'lane'),
      )
      return
    }
    let nextSelection = selection
    if (!memberIds.some((id) => selection.includes(id))) {
      nextSelection = memberIds
      setSelection(nextSelection)
    }
    beginDrag(
      event,
      nextSelection.filter((id) => nodeMap.get(id) && nodeMap.get(id).type !== 'lane'),
    )
  }

  function handleNodeDoubleClick(event, node) {
    event.stopPropagation()
    if (node.type === 'note') {
      openNoteFocus(node)
      return
    }
    if (tool !== 'select') return
    if (node.type === 'task') startEditing(node, 'title')
    else if (node.type === 'shape' || node.type === 'text') startEditing(node, 'text')
  }

  function handleNodeChange(node, field, value) {
    if (field === 'checklist') {
      updateNode(node.id, { checklist: value }, { history: false })
      return
    }
    updateNode(node.id, { [field]: value }, { history: false, coalesce: `edit:${node.id}:${field}` })
  }

  function handleEdgePointerDown(event, edge) {
    event.stopPropagation()
    if (tool === 'eraser') {
      event.preventDefault()
      deleteEdge(edge)
      return
    }
    if (tool === 'connect') return
    setSelection([edge.id])
    setEditing(null)
  }

  function openTemplates() {
    setModal('templates')
    setMenu(null)
    setShowHint(false)
  }

  function openShortcuts() {
    setModal('shortcuts')
    setMenu(null)
  }

  function nodeMatchesFilter(node) {
    if (node.type === 'lane' || node.type === 'frame') return true
    if (node.type === 'task') return taskMatches(node, query, statusFilter)
    if (statusFilter !== 'all') return false
    if (!query) return true
    const haystack = [node.text, node.title, ...(node.tags || [])].join(' ').toLowerCase()
    return haystack.includes(query.toLowerCase())
  }

  const visibleTaskCount = activeBoard.nodes.filter((node) => node.type === 'task' && nodeMatchesFilter(node)).length
  const backgroundNodes = activeBoard.nodes.filter((node) => node.type === 'frame' || node.type === 'lane')
  const foregroundNodes = activeBoard.nodes.filter((node) => node.type !== 'frame' && node.type !== 'lane')
  const selectedTask = selectedNodes.find((node) => node.type === 'task')
  const selectedEdge = selectedEdges[0]
  const editorBoard = activeBoard

  const commands = []
  commands.push(
    { id: 'add-task', label: tr('Add task'), hint: 'T', icon: 'task', group: tr('Create'), run: () => createNode('task', viewportCenterWorld()) },
    { id: 'add-note', label: tr('Add sticky note'), hint: 'N', icon: 'note', group: tr('Create'), run: () => createNode('note', viewportCenterWorld()) },
    { id: 'add-frame', label: tr('Add frame'), hint: 'F', icon: 'frame', group: tr('Create'), run: () => { setTool('frame'); toastMessage(tr('Drag on the canvas to place a frame')) } },
    { id: 'add-shape', label: tr('Add diagram shape'), hint: shapeDefinition(activeShape).label, icon: 'shape', group: tr('Create'), run: () => createNode('shape', viewportCenterWorld()) },
    { id: 'group-selection', label: tr('Group selection'), hint: '⌘G', icon: 'group', group: tr('Edit'), run: groupSelection },
    { id: 'ungroup-selection', label: tr('Ungroup selection'), hint: '⇧⌘G', icon: 'ungroup', group: tr('Edit'), run: ungroupSelection },
    { id: 'fit', label: tr('Fit canvas to view'), hint: '⌘ 0', icon: 'fit', group: tr('View'), run: fitView },
    { id: 'zoom100', label: tr('Zoom to 100%'), icon: 'search', group: tr('View'), run: resetZoom },
    { id: 'export-png', label: tr('Export as PNG'), icon: 'download', group: tr('Export'), run: exportPNG },
    { id: 'export-json', label: tr('Export as JSON'), icon: 'download', group: tr('Export'), run: exportJSON },
    { id: 'export-md', label: tr('Export as Markdown'), icon: 'download', group: tr('Export'), run: exportMarkdown },
    { id: 'new-board', label: tr('New board from template'), icon: 'plus', group: tr('Board'), run: openTemplates },
    {
      id: 'toggle-inspector',
      label: tr(inspectorOpen ? 'Hide inspector' : 'Show inspector'),
      icon: 'panel',
      group: tr('View'),
      run: toggleInspector,
    },
    { id: 'shortcuts', label: tr('Keyboard shortcuts'), hint: '?', icon: 'keyboard', group: tr('Help'), run: openShortcuts },
  )
  for (const task of activeBoard.nodes.filter((node) => node.type === 'task')) {
    if (!taskMatches(task, paletteQuery, 'all')) continue
    commands.push({
      id: `go-${task.id}`,
      label: task.title,
      hint: STATUS[task.status].label,
      icon: 'arrowUpRight',
      group: tr('Go to task'),
      run: () => focusNode(task),
    })
  }
  const filteredCommands = commands.filter((command) => {
    if (!paletteQuery) return true
    return `${command.label} ${command.group}`.toLowerCase().includes(paletteQuery.toLowerCase())
  })
  const visibleCommands = filteredCommands.slice(0, 9)
  const safePaletteIndex = clamp(paletteIndex, 0, Math.max(0, visibleCommands.length - 1))

  function runCommand(command) {
    setPaletteOpen(false)
    setPaletteQuery('')
    command.run()
  }

  return h(
    'div',
    { className: 'ec-root', ref: rootRef },
    h('style', { key: 'style' }, CSS),
    h(TopBar, {
      t: tr,
      board: editorBoard,
      stats,
      saveState,
      query,
      setQuery,
      canUndo,
      canRedo,
      onUndo: undo,
      onRedo: redo,
      menu,
      setMenu,
      onNew: openTemplates,
      inspectorOpen,
      onToggleInspector: toggleInspector,
      onExportPNG: exportPNG,
      onExportJSON: exportJSON,
      onExportMarkdown: exportMarkdown,
      onDuplicateBoard: duplicateBoard,
      onDeleteBoard: requestDeleteBoard,
      onImport: openImport,
      onShortcuts: openShortcuts,
      onTitle(value) {
        commitBoard((board) => ({ ...board, title: value }), { coalesce: 'board-title' })
      },
      onTitleBlur(value) {
        if (!String(value || '').trim()) commitBoard((board) => ({ ...board, title: 'Untitled canvas' }))
      },
    }),
    h(
      'div',
      { className: 'ec-body' },
      h(ToolRail, {
        t: tr,
        tool,
        activeShape,
        shapePickerOpen,
        onSelectTool: selectTool,
        onChooseShape: chooseShape,
        onCloseShapePicker: () => setShapePickerOpen(false),
        onHelp: openShortcuts,
      }),
      h(
        'main',
        {
          ref: stageRef,
          className: cx(
            'ec-stage',
            tool === 'hand' || spaceDown ? 'is-hand' : '',
            tool === 'pen' ? 'is-pen' : '',
            tool === 'eraser' ? 'is-eraser' : '',
            tool === 'connect' ? 'is-connect' : '',
            tool !== 'select' && tool !== 'hand' ? 'is-creator' : '',
            isPanning ? 'is-panning' : '',
            dragging ? 'is-dragging' : '',
          ),
          style: {
            backgroundImage: 'radial-gradient(circle, var(--ec-dot) 1px, transparent 1.15px)',
            backgroundSize: `${Math.max(10, 24 * camera.zoom)}px ${Math.max(10, 24 * camera.zoom)}px`,
            backgroundPosition: `${camera.x}px ${camera.y}px`,
          },
          onPointerDown: handleStagePointerDown,
          onDoubleClick: handleStageDoubleClick,
        },
        h(
          'div',
          {
            className: 'ec-world',
            style: {
              transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
              transformOrigin: '0 0',
            },
          },
          backgroundNodes.map((node) =>
            node.type === 'frame'
              ? h(FrameView, {
                  key: node.id,
                  node,
                  selected: selectionSet.has(node.id),
                  t: tr,
                  onPointerDown: handleNodePointerDown,
                  onDoubleClick: handleNodeDoubleClick,
                })
              : h(LaneView, {
                  key: node.id,
                  node,
                  board: activeBoard,
                  active: dropTarget === node.id,
                  t: tr,
                }),
          ),
          activeBoard.edges.map((edge) => {
            const fromNode = nodeMap.get(edge.from)
            const toNode = nodeMap.get(edge.to)
            const dimmed = filterActive && ((fromNode && !nodeMatchesFilter(fromNode)) || (toNode && !nodeMatchesFilter(toNode)))
            return h(EdgeView, {
              key: edge.id,
              edge,
              nodeMap,
              selected: selectionSet.has(edge.id),
              dimmed,
              t: tr,
              onPointerDown: handleEdgePointerDown,
            })
          }),
          foregroundNodes.map((node) =>
            h(NodeView, {
              key: node.id,
              node,
              selected: selectionSet.has(node.id),
              dimmed: filterActive && !nodeMatchesFilter(node),
              editing: editing && editing.id === node.id ? editing.field : null,
              tool,
              t: tr,
              hideChrome: groupedNodeIds.has(node.id),
              connectTarget: connectTarget === node.id,
              onPointerDown: handleNodePointerDown,
              onDoubleClick: handleNodeDoubleClick,
              onChange: handleNodeChange,
              onPort: startConnect,
              onResize: beginResize,
              onFinishEditing: finishEditing,
            }),
          ),
          selectedGroups.map((group) =>
            h(GroupOutline, {
              key: group.id,
              group,
              board: activeBoard,
              canResize: Boolean(activeGroup),
              t: tr,
              onResize: beginGroupResize,
            }),
          ),
          marquee
            ? h('div', {
                className: 'ec-marquee',
                style: {
                  left: Math.min(marquee.x0, marquee.x1),
                  top: Math.min(marquee.y0, marquee.y1),
                  width: Math.abs(marquee.x1 - marquee.x0),
                  height: Math.abs(marquee.y1 - marquee.y0),
                },
              })
            : null,
          createPreview
            ? h('div', {
                className: 'ec-create-preview',
                style: {
                  left: createPreview.x,
                  top: createPreview.y,
                  width: createPreview.w,
                  height: createPreview.h,
                },
              })
            : null,
        ),
        connectPreview
          ? h(
              'svg',
              { className: 'ec-connect-layer', width: '100%', height: '100%', 'aria-hidden': 'true' },
              h('line', {
                x1: connectPreview.start.x,
                y1: connectPreview.start.y,
                x2: connectPreview.current.x,
                y2: connectPreview.current.y,
                stroke: 'var(--dsw-alias-brand-primary)',
                strokeWidth: 2,
                strokeDasharray: '6 5',
                strokeLinecap: 'round',
              }),
              h('circle', {
                cx: connectPreview.start.x,
                cy: connectPreview.start.y,
                r: 4,
                fill: 'var(--dsw-alias-brand-primary)',
              }),
              h('circle', {
                cx: connectPreview.current.x,
                cy: connectPreview.current.y,
                r: 4,
                fill: 'var(--dsw-alias-bg-layer-1)',
                stroke: 'var(--dsw-alias-brand-primary)',
                strokeWidth: 2,
              }),
            )
          : null,
        !inspectorOpen && selection.length
          ? h(
              'button',
              {
                type: 'button',
                className: 'ec-details-pill',
                onPointerDown: stop,
                onClick: () => { refitOnResizeRef.current = true; setInspectorOpen(true) },
                title: tr('Show inspector'),
              },
              h(Icon, { name: 'panel', size: 14 }),
              tr('Details'),
            )
          : null,
        filterActive
          ? h(
              'div',
              { className: 'ec-filter-chip', onPointerDown: stop },
              h(Icon, { name: 'filter', size: 14 }),
              h('span', null, `${visibleTaskCount} ${tr(visibleTaskCount === 1 ? 'matching task' : 'matching tasks')}`),
              h(
                'button',
                {
                  className: 'ec-icon-btn ec-filter-clear',
                  'aria-label': tr('Clear filters'),
                  onClick: () => {
                    setQuery('')
                    setStatusFilter('all')
                  },
                },
                h(Icon, { name: 'close', size: 13 }),
              ),
            )
          : null,
        h(Minimap, { board: activeBoard, camera, viewport, t: tr, onJump: (point) => updateCamera({ x: viewport.w / 2 - point.x * camera.zoom, y: viewport.h / 2 - point.y * camera.zoom, zoom: camera.zoom }) }),
        h(ZoomControls, {
          t: tr,
          zoom: camera.zoom,
          onZoomIn: () => zoomFromCenter(1.18),
          onZoomOut: () => zoomFromCenter(1 / 1.18),
          onReset: resetZoom,
          onFit: fitView,
          onHelp: openShortcuts,
        }),
        showHint && activeBoard.nodes.length > 0
          ? h(
              'div',
              { className: 'ec-hint', onPointerDown: stop },
              h('kbd', null, 'Space'),
              h('span', null, tr('+ drag to pan')),
              h('i', null),
              h('kbd', null, 'Scroll'),
              h('span', null, tr('to zoom')),
              h('i', null),
              h('kbd', null, 'Double-click'),
              h('span', null, tr('to edit')),
              h(
                'button',
                { className: 'ec-icon-btn ec-hint-close', 'aria-label': tr('Dismiss hint'), onClick: () => setShowHint(false) },
                h(Icon, { name: 'close', size: 12 }),
              ),
            )
          : null,
        activeBoard.nodes.length === 0
          ? h(EmptyCanvas, {
              t: tr,
              onAddTask: () => createNode('task', viewportCenterWorld()),
              onTemplates: openTemplates,
            })
          : null,
        toast ? h('div', { className: 'ec-toast', role: 'status' }, h(Icon, { name: 'check', size: 14 }), toast) : null,
      ),
      inspectorOpen
        ? h(Inspector, {
            t: tr,
            board: activeBoard,
            boards: store.boards,
            selection,
            selectedNodes,
            selectedEdges,
            selectedTask,
            selectedEdge,
            selectedGroup: activeGroup,
            selectedGroups,
            stats,
            statusFilter,
            setStatusFilter,
            onSelect: selectOnly,
            onToggleSelected: toggleSelected,
            onUpdateNode: updateNode,
            onUpdateEdge: updateEdge,
            onDeleteSelection: deleteSelection,
            onDuplicate: duplicateSelection,
            onAlign: alignSelection,
            onDistribute: distributeSelection,
            onBringFront: bringToFront,
            onSendBack: sendToBack,
            onFocusNode: focusNode,
            onNewBoard: openTemplates,
            onActivateBoard: activateBoard,
            onOpenShortcuts: openShortcuts,
            onOpenNote: openNoteFocus,
            onGroup: groupSelection,
            onUngroup: ungroupSelection,
            onRenameGroup: renameGroup,
            onClearSelection: () => {
              setSelection([])
              setEditing(null)
            },
          })
        : null,
    ),
    paletteOpen
      ? h(CommandPalette, {
          t: tr,
          query: paletteQuery,
          setQuery(value) {
            setPaletteQuery(value)
            setPaletteIndex(0)
          },
          index: safePaletteIndex,
          setIndex: setPaletteIndex,
          commands: visibleCommands,
          onRun: runCommand,
          onClose: () => setPaletteOpen(false),
        })
      : null,
    modal === 'templates'
      ? h(TemplateDialog, {
          t: tr,
          onClose: () => setModal(null),
          onChoose: addBoard,
          onCreateBlank: createEmptyBoard,
        })
      : null,
    modal === 'shortcuts' ? h(ShortcutsDialog, { t: tr, onClose: () => setModal(null) }) : null,
    confirmState
      ? h(ConfirmDialog, {
          t: tr,
          state: confirmState,
          onClose: () => setConfirmState(null),
          onConfirm: confirmState.action,
        })
      : null,
    noteFocus && noteDetail
      ? h(NoteDetail, {
          key: noteFocus.id,
          note: noteDetail,
          t: tr,
          origin: noteFocus.origin,
          bounds: noteFocus.bounds,
          onChange: (patch, options) => updateNoteContent(noteDetail.id, patch, options),
          onClose: () => setNoteFocus(null),
          onDuplicate: () => {
            duplicateSelection()
            setNoteFocus(null)
          },
          onDelete: () => {
            removeNodes([noteDetail.id])
            setNoteFocus(null)
          },
        })
      : null,
    h('input', {
      ref: importRef,
      type: 'file',
      accept: 'application/json,.json',
      className: 'ec-hidden-input',
      onChange: handleImportFile,
    }),
  )
}

function TopBar(props) {
  const {
    t,
    board,
    stats,
    saveState,
    query,
    setQuery,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    menu,
    setMenu,
    onNew,
    inspectorOpen,
    onToggleInspector,
    onExportPNG,
    onExportJSON,
    onExportMarkdown,
    onDuplicateBoard,
    onDeleteBoard,
    onImport,
    onShortcuts,
    onTitle,
    onTitleBlur,
  } = props
  const circumference = 2 * Math.PI * 15
  const offset = circumference - (stats.percent / 100) * circumference
  const saveLabel = saveState === 'saving' ? t('Saving…') : saveState === 'error' ? t('Save failed') : t('Saved')
  return h(
    'header',
    { className: 'ec-topbar' },
    h(
      'div',
      { className: 'ec-brand' },
      h('span', { className: 'ec-brand-mark' }, h(BrandGlyph, { size: 34 })),
      h(
        'div',
        { className: 'ec-brand-copy' },
        h('span', { className: 'ec-eyebrow' }, t('Engineering Canvas')),
        h('input', {
          className: 'ec-board-title',
          value: board.title,
          'aria-label': t('Board title'),
          spellCheck: false,
          onChange: (event) => onTitle(event.target.value),
          onBlur: (event) => onTitleBlur(event.target.value),
        }),
      ),
      h(
        'span',
        { className: `ec-save ec-save--${saveState}` },
        h('span', { className: 'ec-save-dot' }),
        saveLabel,
      ),
    ),
    h(
      'div',
      { className: 'ec-top-actions' },
      h(
        'div',
        { className: 'ec-progress-pill', title: `${stats.done}/${stats.total} ${t('tasks done')}` },
        h(
          'svg',
          { width: 34, height: 34, viewBox: '0 0 36 36', className: 'ec-progress-ring', 'aria-hidden': 'true' },
          h('circle', { cx: 18, cy: 18, r: 15, fill: 'none', stroke: 'var(--ec-ring-track)', strokeWidth: 3 }),
          h('circle', {
            cx: 18,
            cy: 18,
            r: 15,
            fill: 'none',
            stroke: 'var(--dsw-alias-brand-primary)',
            strokeWidth: 3,
            strokeLinecap: 'round',
            strokeDasharray: `${circumference} ${circumference}`,
            strokeDashoffset: offset,
            transform: 'rotate(-90 18 18)',
          }),
        ),
        h(
          'div',
          { className: 'ec-progress-copy' },
          h('strong', null, `${stats.percent}%`),
          h('span', null, `${stats.done}/${stats.total} ${t('done')}`),
        ),
      ),
      h(
        'label',
        { className: 'ec-search' },
        h(Icon, { name: 'search', size: 15 }),
        h('input', {
          value: query,
          placeholder: t('Find tasks, notes, people…'),
          'aria-label': t('Find tasks, notes, people'),
          onChange: (event) => setQuery(event.target.value),
        }),
        query
          ? h(
              'button',
              {
                type: 'button',
                className: 'ec-search-clear',
                'aria-label': t('Clear search'),
                onClick: () => setQuery(''),
              },
              h(Icon, { name: 'close', size: 12 }),
            )
          : h('kbd', { className: 'ec-search-kbd' }, '⌘K'),
      ),
      h(
        'div',
        { className: 'ec-history' },
        h(
          'button',
          {
            type: 'button',
            className: 'ec-icon-btn',
            disabled: !canUndo,
            onClick: onUndo,
            title: `${t('Undo')}  ⌘Z`,
            'aria-label': t('Undo'),
          },
          h(Icon, { name: 'undo', size: 16 }),
        ),
        h(
          'button',
          {
            type: 'button',
            className: 'ec-icon-btn',
            disabled: !canRedo,
            onClick: onRedo,
            title: `${t('Redo')}  ⇧⌘Z`,
            'aria-label': t('Redo'),
          },
          h(Icon, { name: 'redo', size: 16 }),
        ),
      ),
      h(
        'button',
        {
          type: 'button',
          className: `ec-icon-btn ec-inspector-toggle ${inspectorOpen ? 'is-open' : ''}`,
          onClick: onToggleInspector,
          title: t(inspectorOpen ? 'Hide inspector' : 'Show inspector'),
          'aria-label': t(inspectorOpen ? 'Hide inspector' : 'Show inspector'),
          'aria-pressed': inspectorOpen,
        },
        h(Icon, { name: 'panel', size: 17 }),
      ),
      h(
        'button',
        { type: 'button', className: 'ec-new-btn', onClick: onNew, title: t('New board') },
        h(Icon, { name: 'plus', size: 15 }),
        h('span', null, t('New')),
      ),
      h(
        'div',
        { className: 'ec-menu-wrap' },
        h(
          'button',
          {
            type: 'button',
            className: `ec-btn ${menu === 'export' ? 'is-open' : ''}`,
            onClick: () => setMenu(menu === 'export' ? null : 'export'),
            'aria-expanded': menu === 'export',
            'aria-haspopup': 'menu',
          },
          h(Icon, { name: 'download', size: 15 }),
          h('span', null, t('Export')),
          h(Icon, { name: 'chevronDown', size: 13 }),
        ),
        menu === 'export'
          ? h(
              'div',
              { className: 'ec-popover ec-popover--export', role: 'menu' },
              h('div', { className: 'ec-popover-label' }, t('Export board')),
              h(MenuItem, { icon: 'download', label: t('PNG image'), hint: '2×', onClick: onExportPNG }),
              h(MenuItem, { icon: 'download', label: t('JSON backup'), hint: '.json', onClick: onExportJSON }),
              h(MenuItem, { icon: 'download', label: t('Markdown snapshot'), hint: '.md', onClick: onExportMarkdown }),
            )
          : null,
      ),
      h(
        'div',
        { className: 'ec-menu-wrap' },
        h(
          'button',
          {
            type: 'button',
            className: `ec-icon-btn ec-more ${menu === 'board' ? 'is-open' : ''}`,
            onClick: () => setMenu(menu === 'board' ? null : 'board'),
            'aria-label': t('Board menu'),
            'aria-expanded': menu === 'board',
            'aria-haspopup': 'menu',
          },
          h(Icon, { name: 'more', size: 18 }),
        ),
        menu === 'board'
          ? h(
              'div',
              { className: 'ec-popover', role: 'menu' },
              h(MenuItem, { icon: 'plus', label: t('New board'), hint: '⌘N', onClick: onNew }),
              h(MenuItem, { icon: 'copy', label: t('Duplicate board'), onClick: onDuplicateBoard }),
              h(MenuItem, { icon: 'upload', label: t('Import canvas'), onClick: onImport }),
              h('div', { className: 'ec-popover-sep' }),
              h(MenuItem, { icon: 'keyboard', label: t('Keyboard shortcuts'), hint: '?', onClick: onShortcuts }),
              h('div', { className: 'ec-popover-sep' }),
              h(MenuItem, { icon: 'trash', label: t('Delete board'), danger: true, onClick: onDeleteBoard }),
            )
          : null,
      ),
    ),
  )
}

function MenuItem({ icon, label, hint, onClick, danger }) {
  return h(
    'button',
    {
      type: 'button',
      role: 'menuitem',
      className: `ec-menu-item ${danger ? 'is-danger' : ''}`,
      onClick,
    },
    h(Icon, { name: icon, size: 15 }),
    h('span', { className: 'ec-menu-label' }, label),
    hint ? h('kbd', null, hint) : null,
  )
}

function GroupOutline({ group, board, canResize, t, onResize }) {
  const bounds = groupBounds(board, group)
  if (!bounds) return null
  return h(
    'div',
    {
      className: 'ec-group-outline',
      style: {
        left: bounds.x - 8,
        top: bounds.y - 8,
        width: bounds.w + 16,
        height: bounds.h + 16,
      },
    },
    h(
      'span',
      { className: 'ec-group-label' },
      h(Icon, { name: 'group', size: 12 }),
      h('span', null, group.name || t('Group')),
      h('em', null, String(group.childIds.length)),
    ),
    canResize
      ? h(
          'button',
          {
            type: 'button',
            className: 'ec-group-resize',
            'aria-label': t('Resize group'),
            title: t('Resize group'),
            onPointerDown: (event) => onResize(event, group),
          },
          h('span', null),
        )
      : null,
  )
}

function ToolRail({ t, tool, activeShape, shapePickerOpen, onSelectTool, onChooseShape, onCloseShapePicker, onHelp }) {
  let previousGroup = null
  const buttons = []
  for (const definition of TOOL_DEFS) {
    if (previousGroup !== null && definition.group !== previousGroup) {
      buttons.push(h('span', { key: `sep-${definition.id}`, className: 'ec-rail-sep' }))
    }
    previousGroup = definition.group
    const isShape = definition.id === 'shape'
    const activeDefinition = shapeDefinition(activeShape)
    const label = isShape ? `${t(definition.label)}: ${t(activeDefinition.label)}` : t(definition.label)
    const button = h(
      'button',
      {
        key: definition.id,
        type: 'button',
        className: `ec-tool ${tool === definition.id ? 'is-active' : ''}`,
        onClick: () => onSelectTool(definition.id),
        'aria-pressed': tool === definition.id,
        'aria-label': `${label} (${definition.key})`,
        'aria-haspopup': isShape ? 'menu' : undefined,
        'aria-expanded': isShape ? shapePickerOpen : undefined,
        'data-tip': `${label}  ${definition.key}`,
      },
      isShape ? h(ShapeGlyph, { variant: activeShape, size: 19 }) : h(Icon, { name: definition.icon, size: 19 }),
      h('span', { className: 'ec-tool-key' }, definition.key),
    )
    if (isShape) {
      buttons.push(
        h(
          'div',
          { key: definition.id, className: 'ec-tool-wrap' },
          button,
          shapePickerOpen
            ? h(ShapePicker, {
                t,
                activeShape,
                onChoose: onChooseShape,
                onClose: onCloseShapePicker,
              })
            : null,
        ),
      )
    } else {
      buttons.push(button)
    }
  }
  return h(
    'aside',
    { className: 'ec-rail', role: 'toolbar', 'aria-label': t('Canvas tools'), onPointerDown: stop },
    h('div', { className: 'ec-rail-tools' }, buttons),
    h(
      'div',
      { className: 'ec-rail-foot' },
      h(
        'button',
        { type: 'button', className: 'ec-tool', onClick: onHelp, 'data-tip': `${t('Shortcuts')}  ?`, 'aria-label': t('Keyboard shortcuts') },
        h(Icon, { name: 'help', size: 18 }),
      ),
    ),
  )
}

function ShapePicker({ t, activeShape, onChoose, onClose }) {
  return h(
    'div',
    { className: 'ec-shape-picker', role: 'menu', 'aria-label': t('Diagram shapes'), onPointerDown: stop },
    h(
      'div',
      { className: 'ec-shape-picker-head' },
      h('div', null, h('span', { className: 'ec-eyebrow' }, t('Diagram shapes')), h('strong', null, t('Choose a shape'))),
      h('button', { type: 'button', className: 'ec-icon-btn', onClick: onClose, 'aria-label': t('Close shapes') }, h(Icon, { name: 'close', size: 14 })),
    ),
    h(
      'div',
      { className: 'ec-shape-picker-grid' },
      SHAPE_TYPES.map((shape, index) =>
        h(
          'button',
          {
            key: shape.id,
            type: 'button',
            role: 'menuitemradio',
            'aria-checked': activeShape === shape.id,
            className: `ec-shape-option ${activeShape === shape.id ? 'is-active' : ''}`,
            onClick: () => onChoose(shape.id),
          },
          h('span', { className: 'ec-shape-option-icon' }, h(ShapeGlyph, { variant: shape.id, size: 25 })),
          h('span', { className: 'ec-shape-option-label' }, t(shape.label)),
          h('kbd', null, String(index + 1)),
        ),
      ),
    ),
    h('div', { className: 'ec-shape-picker-foot' }, t('Pick a shape, then click the canvas.')),
  )
}

function Minimap({ board, camera, viewport, t, onJump }) {
  if (viewport.w < 700) return null
  const bounds = contentBounds(board, true)
  const pad = 18
  const width = 174
  const height = 112
  const scale = Math.min((width - pad * 2) / bounds.w, (height - pad * 2) / bounds.h)
  const offsetX = (width - bounds.w * scale) / 2
  const offsetY = (height - bounds.h * scale) / 2
  const mapX = (x) => offsetX + (x - bounds.x) * scale
  const mapY = (y) => offsetY + (y - bounds.y) * scale
  const vx = -camera.x / camera.zoom
  const vy = -camera.y / camera.zoom
  const vw = viewport.w / camera.zoom
  const vh = viewport.h / camera.zoom
  return h(
    'div',
    { className: 'ec-minimap', onPointerDown: stop },
    h('div', { className: 'ec-minimap-head' }, h('span', null, t('Overview')), h('span', null, `${Math.round(camera.zoom * 100)}%`)),
    h(
      'svg',
      {
        width,
        height,
        viewBox: `0 0 ${width} ${height}`,
        className: 'ec-minimap-svg',
        onPointerDown(event) {
          const rect = event.currentTarget.getBoundingClientRect()
          const x = event.clientX - rect.left
          const y = event.clientY - rect.top
          onJump({ x: bounds.x + (x - offsetX) / scale, y: bounds.y + (y - offsetY) / scale })
        },
      },
      h('rect', { x: 0, y: 0, width, height, rx: 6, fill: 'var(--ec-minimap-bg)' }),
      board.nodes.map((node) => {
        if (node.type === 'frame' || node.type === 'lane') {
          return h('rect', {
            key: node.id,
            x: mapX(node.x),
            y: mapY(node.y),
            width: Math.max(1, node.w * scale),
            height: Math.max(1, node.h * scale),
            rx: 2,
            fill: node.type === 'lane' ? 'var(--ec-minimap-lane)' : 'transparent',
            stroke: 'var(--ec-minimap-frame)',
            strokeWidth: 0.6,
          })
        }
        return h('rect', {
          key: node.id,
          x: mapX(node.x),
          y: mapY(node.y),
          width: Math.max(1, node.w * scale),
          height: Math.max(1, node.h * scale),
          rx: 1,
          fill: node.type === 'task' ? STATUS[node.status].color : 'var(--ec-minimap-node)',
          opacity: node.type === 'task' ? 0.9 : 0.6,
        })
      }),
      h('rect', {
        x: mapX(vx),
        y: mapY(vy),
        width: Math.max(4, vw * scale),
        height: Math.max(4, vh * scale),
        fill: 'transparent',
        stroke: 'var(--dsw-alias-brand-primary)',
        strokeWidth: 1.2,
        rx: 2,
      }),
    ),
  )
}

function ZoomControls({ t, zoom, onZoomIn, onZoomOut, onReset, onFit, onHelp }) {
  return h(
    'div',
    { className: 'ec-zoom', onPointerDown: stop },
    h(
      'button',
      { type: 'button', className: 'ec-icon-btn', onClick: onZoomOut, title: t('Zoom out'), 'aria-label': t('Zoom out') },
      h(Icon, { name: 'minus', size: 15 }),
    ),
    h('button', { type: 'button', className: 'ec-zoom-value', onClick: onReset, title: t('Reset to 100%') }, `${Math.round(zoom * 100)}%`),
    h(
      'button',
      { type: 'button', className: 'ec-icon-btn', onClick: onZoomIn, title: t('Zoom in'), 'aria-label': t('Zoom in') },
      h(Icon, { name: 'plus', size: 15 }),
    ),
    h('span', { className: 'ec-zoom-sep' }),
    h(
      'button',
      { type: 'button', className: 'ec-icon-btn', onClick: onFit, title: t('Fit canvas'), 'aria-label': t('Fit canvas') },
      h(Icon, { name: 'fit', size: 15 }),
    ),
    h(
      'button',
      { type: 'button', className: 'ec-icon-btn', onClick: onHelp, title: t('Keyboard shortcuts'), 'aria-label': t('Keyboard shortcuts') },
      h(Icon, { name: 'help', size: 15 }),
    ),
  )
}

function EmptyCanvas({ t, onAddTask, onTemplates }) {
  return h(
    'div',
    { className: 'ec-empty', onPointerDown: stop },
    h('span', { className: 'ec-empty-mark' }, h(Icon, { name: 'sparkles', size: 24 })),
    h('h2', null, t('Your canvas is blank')),
    h('p', null, t('Start with a task, sketch the system, or open a sprint template.')),
    h(
      'div',
      { className: 'ec-empty-actions' },
      h('button', { type: 'button', className: 'ec-btn ec-btn--primary', onClick: onAddTask }, h(Icon, { name: 'plus', size: 15 }), t('Add a task')),
      h('button', { type: 'button', className: 'ec-btn', onClick: onTemplates }, h(Icon, { name: 'layers', size: 15 }), t('Browse templates')),
    ),
  )
}

function CommandPalette({ t, query, setQuery, index, setIndex, commands, onRun, onClose }) {
  const inputRef = useRef(null)
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [])
  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIndex(Math.min(commands.length - 1, index + 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setIndex(Math.max(0, index - 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (commands[index]) onRun(commands[index])
    } else if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
  }
  let lastGroup = null
  const rows = []
  commands.forEach((command, commandIndex) => {
    if (command.group !== lastGroup) {
      rows.push(h('div', { key: `group-${command.group}`, className: 'ec-palette-group' }, command.group))
      lastGroup = command.group
    }
    rows.push(
      h(
        'button',
        {
          key: command.id,
          type: 'button',
          className: `ec-palette-row ${index === commandIndex ? 'is-active' : ''}`,
          onMouseEnter: () => setIndex(commandIndex),
          onClick: () => onRun(command),
        },
        h('span', { className: 'ec-palette-icon' }, h(Icon, { name: command.icon, size: 16 })),
        h('span', { className: 'ec-palette-label' }, command.label),
        command.hint ? h('kbd', null, command.hint) : null,
      ),
    )
  })
  return h(
    'div',
    { className: 'ec-overlay ec-overlay--palette', onPointerDown: onClose },
    h(
      'div',
      {
        className: 'ec-palette',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': t('Command palette'),
        onPointerDown: stop,
      },
      h(
        'div',
        { className: 'ec-palette-search' },
        h(Icon, { name: 'search', size: 17 }),
        h('input', {
          ref: inputRef,
          value: query,
          placeholder: t('Search commands or jump to a task…'),
          onChange: (event) => setQuery(event.target.value),
          onKeyDown: handleKeyDown,
        }),
        h('kbd', null, 'Esc'),
      ),
      h('div', { className: 'ec-palette-list' }, commands.length ? rows : h('div', { className: 'ec-palette-empty' }, t('No matches'))),
      h('div', { className: 'ec-palette-foot' }, h('span', null, h('kbd', null, '↑'), h('kbd', null, '↓'), t('to navigate')), h('span', null, h('kbd', null, '↵'), t('to run'))),
    ),
  )
}

function TemplateDialog({ t, onClose, onChoose, onCreateBlank }) {
  const preview = (template) =>
    h(
      'div',
      { className: `ec-template-preview ec-template-preview--${template.kind}` },
      template.kind === 'sprint'
        ? h(
            Fragment,
            null,
            h('span', { className: 'tp-lane' }),
            h('span', { className: 'tp-lane' }),
            h('span', { className: 'tp-lane' }),
            h('span', { className: 'tp-lane' }),
            h('span', { className: 'tp-card tp-card--a' }),
            h('span', { className: 'tp-card tp-card--b' }),
            h('span', { className: 'tp-card tp-card--c' }),
          )
        : template.kind === 'flow'
          ? h(
              Fragment,
              null,
              h('span', { className: 'tp-flow-start' }),
              h('span', { className: 'tp-flow-process' }),
              h('span', { className: 'tp-flow-decision' }),
              h('span', { className: 'tp-flow-io' }),
              h('span', { className: 'tp-line tp-line--c' }),
              h('span', { className: 'tp-line tp-line--d' }),
              h('span', { className: 'tp-line tp-line--e' }),
            )
          : template.kind === 'architecture'
          ? h(
              Fragment,
              null,
              h('span', { className: 'tp-node tp-node--a' }),
              h('span', { className: 'tp-node tp-node--b' }),
              h('span', { className: 'tp-node tp-node--c' }),
              h('span', { className: 'tp-line tp-line--a' }),
              h('span', { className: 'tp-line tp-line--b' }),
            )
          : template.kind === 'incident'
            ? h(
                Fragment,
                null,
                h('span', { className: 'tp-alert' }),
                h('span', { className: 'tp-card tp-card--a' }),
                h('span', { className: 'tp-card tp-card--c' }),
                h('span', { className: 'tp-note' }),
              )
            : h('span', { className: 'tp-blank' }, h(Icon, { name: 'sparkles', size: 22 })),
    )
  return h(
    'div',
    { className: 'ec-overlay', onPointerDown: onClose },
    h(
      'div',
      { className: 'ec-dialog ec-dialog--templates', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('New board'), onPointerDown: stop },
      h(
        'div',
        { className: 'ec-dialog-head' },
        h(
          'div',
          { className: 'ec-dialog-titleblock' },
          h('span', { className: 'ec-eyebrow' }, t('Start something')),
          h('h2', null, t('New board')),
          h('p', { className: 'ec-dialog-sub' }, t('Start from a template, or a clean canvas.')),
        ),
        h('button', { type: 'button', className: 'ec-icon-btn', onClick: onClose, 'aria-label': t('Close') }, h(Icon, { name: 'close', size: 17 })),
      ),
      h(
        'div',
        { className: 'ec-template-grid' },
        TEMPLATES.map((template) =>
          h(
            'button',
            {
              key: template.id,
              type: 'button',
              className: 'ec-template-card',
              onClick: () => onChoose(template),
              style: { '--template-accent': template.accent },
            },
            preview(template),
            h('span', { className: 'ec-template-name' }, t(template.name)),
            h('span', { className: 'ec-template-desc' }, t(template.description)),
            h('span', { className: 'ec-template-arrow' }, h(Icon, { name: 'arrowUpRight', size: 15 })),
          ),
        ),
      ),
      h(
        'div',
        { className: 'ec-dialog-foot' },
        h('span', null, t('Every board autosaves locally. Export any time.')),
        h('button', { type: 'button', className: 'ec-btn', onClick: onCreateBlank }, t('Start blank')),
      ),
    ),
  )
}

function ShortcutsDialog({ t, onClose }) {
  const groups = [
    [t('Tools'), [['V', t('Select')], ['H', t('Pan')], ['T', t('Task card')], ['N', t('Sticky note')], ['X', t('Text')], ['R', t('Shape')], ['F', t('Frame')], ['C', t('Connect')], ['P', t('Draw')], ['E', t('Eraser')]]],
    [t('Canvas'), [['Space + drag', t('Pan')], ['Scroll', t('Pan')], ['⌘ Scroll', t('Zoom')], ['+ / −', t('Zoom')], ['⌘ 0', t('Fit canvas')], ['Double-click', t('Create text')]]],
    [t('Edit'), [['⌘ Z', t('Undo')], ['⇧⌘ Z', t('Redo')], ['⌘ G', t('Group')], ['⇧⌘ G', t('Ungroup')], ['⌥ Click', t('Select one inside group')], ['⌘ D', t('Duplicate')], ['⌘ A', t('Select all')], ['Double-click note', t('Open note editor')], ['Delete', t('Delete selection')], ['Enter', t('Edit selected')], ['⌘ K', t('Command palette')]]],
  ]
  return h(
    'div',
    { className: 'ec-overlay', onPointerDown: onClose },
    h(
      'div',
      { className: 'ec-dialog ec-dialog--shortcuts', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('Keyboard shortcuts'), onPointerDown: stop },
      h(
        'div',
        { className: 'ec-dialog-head' },
        h('div', null, h('span', { className: 'ec-eyebrow' }, t('Reference')), h('h2', null, t('Keyboard shortcuts'))),
        h('button', { type: 'button', className: 'ec-icon-btn', onClick: onClose, 'aria-label': t('Close') }, h(Icon, { name: 'close', size: 17 })),
      ),
      h(
        'div',
        { className: 'ec-shortcut-grid' },
        groups.map(([title, rows]) =>
          h(
            'div',
            { key: title, className: 'ec-shortcut-group' },
            h('h3', null, title),
            rows.map(([keys, label]) =>
              h(
                'div',
                { key: label, className: 'ec-shortcut-row' },
                h('span', null, label),
                h('kbd', null, keys),
              ),
            ),
          ),
        ),
      ),
      h('div', { className: 'ec-dialog-foot' }, h('span', null, t('Tip: hold Space to pan from anywhere.')), h('button', { type: 'button', className: 'ec-btn', onClick: onClose }, t('Done'))),
    ),
  )
}

function ConfirmDialog({ t, state, onClose, onConfirm }) {
  return h(
    'div',
    { className: 'ec-overlay', onPointerDown: onClose },
    h(
      'div',
      { className: 'ec-dialog ec-dialog--confirm', role: 'alertdialog', 'aria-modal': 'true', 'aria-label': state.title, onPointerDown: stop },
      h('span', { className: 'ec-confirm-icon' }, h(Icon, { name: 'trash', size: 20 })),
      h('h2', null, state.title),
      h('p', null, state.body),
      h(
        'div',
        { className: 'ec-dialog-actions' },
        h('button', { type: 'button', className: 'ec-btn', onClick: onClose }, t('Cancel')),
        h(
          'button',
          { type: 'button', className: `ec-btn ${state.tone === 'danger' ? 'ec-btn--danger' : 'ec-btn--primary'}`, onClick: onConfirm },
          state.confirmLabel,
        ),
      ),
    ),
  )
}

/* Board objects: frames, lanes, connectors, nodes, and the PNG renderer. */

function FrameView({ node, selected, t, onPointerDown, onDoubleClick }) {
  return h(
    'div',
    {
      className: `ec-frame ${selected ? 'is-selected' : ''}`,
      style: { left: node.x, top: node.y, width: node.w, height: node.h },
    },
    h('div', { className: 'ec-frame-surface' }),
    h(
      'div',
      {
        className: 'ec-frame-label',
        role: 'button',
        tabIndex: 0,
        'aria-label': `${t('Frame')}: ${node.title}`,
        onPointerDown: (event) => {
          event.stopPropagation()
          onPointerDown(event, node)
        },
        onDoubleClick: (event) => onDoubleClick(event, node),
        onKeyDown: (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onPointerDown(event, node)
          }
        },
      },
      h(Icon, { name: 'frame', size: 15, className: 'ec-frame-icon' }),
      h(
        'div',
        { className: 'ec-frame-copy' },
        h('span', { className: 'ec-frame-title' }, node.title || t('Frame')),
        node.subtitle ? h('span', { className: 'ec-frame-subtitle' }, node.subtitle) : null,
      ),
    ),
  )
}

function LaneView({ node, board, active, t }) {
  const color = STATUS[node.status]?.color || '#8b95a7'
  const count = board.nodes.filter((item) => item.type === 'task' && item.status === node.status).length
  return h(
    'div',
    {
      className: `ec-lane ${active ? 'is-drop-target' : ''}`,
      style: { left: node.x, top: node.y, width: node.w, height: node.h, '--lane-color': color },
    },
    h(
      'div',
      { className: 'ec-lane-head' },
      h('span', { className: 'ec-lane-dot' }),
      h('span', { className: 'ec-lane-title' }, t(STATUS[node.status]?.label || node.title)),
      h('span', { className: 'ec-lane-count' }, count),
    ),
    count === 0 ? h('div', { className: 'ec-lane-empty' }, t('Drop cards here')) : null,
  )
}

function EdgeView({ edge, nodeMap, selected, dimmed, t, onPointerDown }) {
  const geometry = edgeGeometry(edge, nodeMap)
  if (!geometry) return null
  const { start, end, c1, c2, mid } = geometry
  const pad = 30
  const minX = Math.min(start.x, end.x, c1.x, c2.x, mid.x) - pad
  const minY = Math.min(start.y, end.y, c1.y, c2.y, mid.y) - pad
  const maxX = Math.max(start.x, end.x, c1.x, c2.x, mid.x) + pad
  const maxY = Math.max(start.y, end.y, c1.y, c2.y, mid.y) + pad
  const width = Math.max(1, maxX - minX)
  const height = Math.max(1, maxY - minY)
  const local = (point) => `${point.x - minX} ${point.y - minY}`
  const path = `M ${local(start)} C ${local(c1)}, ${local(c2)}, ${local(end)}`
  const arrow = arrowHead(end, c2, 10).map(local).join(' L ')
  const arrowPolygon = `M ${arrow} L ${local(end)} Z`
  const labelLeft = mid.x - minX
  const labelTop = mid.y - minY
  return h(
    'div',
    {
      className: `ec-edge ${selected ? 'is-selected' : ''} ${dimmed ? 'is-dimmed' : ''} ${edge.dashed ? 'is-dashed' : ''}`,
      style: { left: minX, top: minY, width, height },
    },
    h(
      'svg',
      { width, height, viewBox: `0 0 ${width} ${height}`, className: 'ec-edge-svg', 'aria-hidden': 'true' },
      h('path', { d: path, className: 'ec-edge-hit', onPointerDown: (event) => onPointerDown(event, edge) }),
      h('path', { d: path, className: 'ec-edge-line' }),
      h('path', { d: arrowPolygon, className: 'ec-edge-arrow' }),
      selected ? h('circle', { className: 'ec-edge-anchor', cx: start.x - minX, cy: start.y - minY, r: 3.5 }) : null,
    ),
    edge.label
      ? h(
          'span',
          {
            className: 'ec-edge-label',
            style: { left: labelLeft, top: labelTop },
            onPointerDown: (event) => onPointerDown(event, edge),
          },
          edge.label,
        )
      : null,
  )
}

function NodeView({
  node,
  selected,
  dimmed,
  editing,
  tool,
  t,
  hideChrome = false,
  connectTarget,
  onPointerDown,
  onDoubleClick,
  onChange,
  onPort,
  onResize,
  onFinishEditing,
}) {
  const className = cx(
    'ec-node',
    `ec-node--${node.type}`,
    selected ? 'is-selected' : '',
    dimmed ? 'is-dimmed' : '',
    editing ? 'is-editing' : '',
    connectTarget ? 'is-connect-target' : '',
    node.status ? `is-status-${node.status}` : '',
  )
  return h(
    'div',
    {
      className,
      style: {
        left: node.x,
        top: node.y,
        width: node.w,
        height: node.h,
        zIndex: selected ? 9 : 4,
        '--ec-tone': TONES[node.tone]?.color || TONES.slate.color,
      },
      'data-node-id': node.id,
      onPointerDown: (event) => {
        if (event.target.closest('input, textarea, button, .ec-resize, .ec-port')) {
          event.stopPropagation()
          return
        }
        onPointerDown(event, node)
      },
      onDoubleClick: (event) => {
        if (event.target.closest('input, textarea, button, .ec-resize, .ec-port')) {
          event.stopPropagation()
          return
        }
        onDoubleClick(event, node)
      },
    },
    node.type === 'task'
      ? h(TaskContent, { node, editing, t, onChange, onFinishEditing })
      : node.type === 'note'
        ? h(NoteContent, { node, editing, onChange, onFinishEditing })
        : node.type === 'text'
          ? h(TextContent, { node, editing, t, onChange, onFinishEditing })
          : node.type === 'shape'
            ? h(ShapeContent, { node, editing, t, onChange, onFinishEditing })
            : h(DrawContent, { node }),
    !editing && node.type !== 'draw' && !hideChrome
      ? h(NodePorts, { node, onPort })
      : null,
    selected && !editing && node.type !== 'draw' && !hideChrome
      ? h(
          'button',
          {
            type: 'button',
            className: 'ec-resize',
            'aria-label': t('Resize'),
            title: t('Resize'),
            onPointerDown: (event) => {
              event.stopPropagation()
              event.preventDefault()
              onResize(event, node)
            },
          },
          h('span', null),
        )
      : null,
  )
}

function NodePorts({ node, onPort }) {
  return h(
    Fragment,
    null,
    ['top', 'right', 'bottom', 'left'].map((side) =>
      h(
        'button',
        {
          key: side,
          type: 'button',
          className: `ec-port ec-port--${side}`,
          'aria-label': `Connect from ${side}`,
          title: 'Drag to connect',
          onPointerDown: (event) => onPort(event, node, side),
        },
        h('span', null),
      ),
    ),
  )
}

function TaskContent({ node, editing, t, onChange, onFinishEditing }) {
  const status = STATUS[node.status] || STATUS.todo
  const priority = PRIORITY[node.priority] || PRIORITY.P2
  const done = (node.checklist || []).filter((item) => item.done).length
  const total = (node.checklist || []).length
  const percent = total ? Math.round((done / total) * 100) : 0
  return h(
    'div',
    { className: 'ec-task' },
    h(
      'div',
      { className: 'ec-task-top' },
      h(
        'span',
        { className: 'ec-status-pill', style: { '--status-color': status.color } },
        h('span', { className: 'ec-status-dot' }),
        t(status.label),
      ),
      h(
        'span',
        { className: 'ec-task-priority', style: { '--priority-color': priority.color }, title: `${priority.name} priority` },
        h('span', { className: 'ec-priority-dot' }),
        priority.label,
      ),
      node.estimate ? h('span', { className: 'ec-task-estimate' }, node.estimate) : null,
    ),
    editing === 'title'
      ? h('input', {
          className: 'ec-task-title-input ec-node-editor',
          value: node.title,
          autoFocus: true,
          'aria-label': t('Task title'),
          onFocus: (event) => event.currentTarget.select(),
          onChange: (event) => onChange(node, 'title', event.target.value),
          onBlur: onFinishEditing,
          onKeyDown: (event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.blur()
            } else if (event.key === 'Escape') {
              event.currentTarget.blur()
            }
          },
        })
      : h('div', { className: 'ec-task-title', title: node.title }, node.title || t('Untitled task')),
    node.tags && node.tags.length
      ? h(
          'div',
          { className: 'ec-task-tags' },
          node.tags.slice(0, 2).map((tag) => h('span', { key: tag, className: 'ec-tag' }, tag)),
          node.tags.length > 2 ? h('span', { className: 'ec-tag ec-tag--more' }, `+${node.tags.length - 2}`) : null,
        )
      : h('div', { className: 'ec-task-tags ec-task-tags--empty' }, total ? `${total} ${t(total === 1 ? 'subtask' : 'subtasks')}` : t('No checklist')),
    total
      ? h(
          'div',
          { className: 'ec-task-progress' },
          h(
            'div',
            { className: 'ec-task-progress-track' },
            h('span', { style: { width: `${percent}%` }, className: percent === 100 ? 'is-complete' : '' }),
          ),
          h('span', { className: 'ec-task-progress-label' }, `${done}/${total}`),
        )
      : h('div', { className: 'ec-task-progress ec-task-progress--empty' }, h('span', null, t('Add a checklist to track progress'))),
    h(
      'div',
      { className: 'ec-task-foot' },
      h(
        'span',
        { className: 'ec-assignee', title: node.assignee || t('Unassigned') },
        h(
          'span',
          {
            className: 'ec-avatar',
            style: {
              '--avatar-bg': `hsl(${avatarHue(node.assignee)} 42% 46%)`,
            },
          },
          initials(node.assignee),
        ),
        h('span', { className: 'ec-assignee-name' }, node.assignee || t('Unassigned')),
      ),
      node.due
        ? h(
            'span',
            { className: `ec-due ${isOverdue(node.due) ? 'is-overdue' : ''}`, title: `${t('Due')} ${formatDue(node.due)}` },
            h(Icon, { name: 'calendar', size: 12 }),
            formatDue(node.due),
          )
        : null,
    ),
  )
}

function NoteContent({ node, editing, onChange, onFinishEditing }) {
  const lines = String(node.text || '').split('\n')
  const first = node.title || lines[0] || ''
  const blocks = Array.isArray(node.blocks) ? node.blocks : []
  const preview = blocks
    .filter((block) => String(block.text || '').trim())
    .slice(0, 3)
    .map((block) => {
      if (block.type === 'bulleted') return `• ${block.text}`
      if (block.type === 'numbered') return `1. ${block.text}`
      if (block.type === 'todo') return `${block.checked ? '☑' : '☐'} ${block.text}`
      if (block.type === 'quote') return `“${block.text}`
      return block.text
    })
  const rest = preview.join('\n') || lines.slice(1).join('\n').replace(/^\n+/, '')
  return h(
    'div',
    { className: 'ec-note', title: 'Double-click to open note' },
    h('span', { className: 'ec-note-mark' }, h(Icon, { name: 'note', size: 12 }), 'NOTE'),
    h('span', { className: 'ec-note-open', 'aria-hidden': 'true' }, h(Icon, { name: 'arrowUpRight', size: 12 })),
    editing === 'text'
      ? h('textarea', {
          className: 'ec-note-editor ec-node-editor',
          value: node.text,
          autoFocus: true,
          'aria-label': 'Note text',
          onChange: (event) => onChange(node, 'text', event.target.value),
          onBlur: onFinishEditing,
          onKeyDown: (event) => {
            if (event.key === 'Escape') event.currentTarget.blur()
          },
        })
      : h(
          Fragment,
          null,
          first ? h('strong', { className: 'ec-note-title' }, first) : null,
          rest ? h('div', { className: 'ec-note-body' }, rest) : null,
        ),
  )
}

function TextContent({ node, editing, t, onChange, onFinishEditing }) {
  const color = node.tone && node.tone !== 'slate' ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-label-primary)'
  return h(
    'div',
    { className: 'ec-text-block', style: { color } },
    editing === 'text'
      ? h('textarea', {
          className: 'ec-text-editor ec-node-editor',
          value: node.text,
          autoFocus: true,
          'aria-label': t('Text'),
          style: { fontSize: node.size, fontWeight: node.weight, textAlign: node.align },
          onChange: (event) => onChange(node, 'text', event.target.value),
          onBlur: onFinishEditing,
          onKeyDown: (event) => {
            if (event.key === 'Escape') event.currentTarget.blur()
          },
        })
      : h(
          'div',
          {
            className: 'ec-text-value',
            style: { fontSize: node.size, fontWeight: node.weight, textAlign: node.align },
          },
          node.text || t('Type something'),
        ),
  )
}

function ShapeContent({ node, editing, t, onChange, onFinishEditing }) {
  const variant = normalizeShapeVariant(node.variant)
  return h(
    'div',
    { className: `ec-shape-inner ec-shape-inner--${variant}` },
    h(
      'svg',
      {
        className: 'ec-shape-svg',
        viewBox: '0 0 100 100',
        preserveAspectRatio: variant === 'terminator' ? 'xMidYMid meet' : 'none',
        'aria-hidden': 'true',
      },
      shapeFigure(variant),
    ),
    editing === 'text'
      ? h('textarea', {
          className: 'ec-shape-editor ec-node-editor',
          value: node.text,
          autoFocus: true,
          'aria-label': t('Shape label'),
          onChange: (event) => onChange(node, 'text', event.target.value),
          onBlur: onFinishEditing,
          onKeyDown: (event) => {
            if (event.key === 'Escape') event.currentTarget.blur()
          },
        })
      : h(
          'span',
          { className: `ec-shape-label ec-shape-label--${variant}` },
          node.text || t('Shape'),
        ),
  )
}

function DrawContent({ node }) {
  const color = TONES[node.tone]?.color || TONES.blue.color
  return h(
    'svg',
    { className: 'ec-draw', width: node.w, height: node.h, viewBox: `0 0 ${node.w} ${node.h}`, 'aria-hidden': 'true' },
    h('path', {
      d: strokePath(node.points || []),
      fill: 'none',
      stroke: color,
      strokeWidth: node.width || 2.6,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
  )
}

function strokePath(points) {
  if (!points || points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} l 0.1 0.1`
  let path = `M ${points[0].x} ${points[0].y}`
  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index]
    const next = points[index + 1]
    const mid = { x: (current.x + next.x) / 2, y: (current.y + next.y) / 2 }
    path += ` Q ${current.x} ${current.y} ${mid.x} ${mid.y}`
  }
  const last = points[points.length - 1]
  path += ` L ${last.x} ${last.y}`
  return path
}

/* ---------- PNG export ---------- */

function hexToRgba(hex, alpha) {
  const value = String(hex).replace('#', '')
  if (value.length !== 6) return `rgba(100,100,100,${alpha})`
  const red = parseInt(value.slice(0, 2), 16)
  const green = parseInt(value.slice(2, 4), 16)
  const blue = parseInt(value.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function roundedRect(ctx, x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function wrapCanvasLines(ctx, text, maxWidth) {
  const paragraphs = String(text || '').split('\n')
  const lines = []
  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push('')
      continue
    }
    const words = paragraph.split(/\s+/)
    let line = ''
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (ctx.measureText(candidate).width > maxWidth && line) {
        lines.push(line)
        line = word
      } else {
        line = candidate
      }
    }
    if (line) lines.push(line)
  }
  return lines
}

function drawCanvasLines(ctx, text, x, y, maxWidth, lineHeight, maxLines, color) {
  const lines = wrapCanvasLines(ctx, text, maxWidth)
  ctx.fillStyle = color
  const count = typeof maxLines === 'number' ? Math.min(lines.length, maxLines) : lines.length
  for (let index = 0; index < count; index += 1) {
    let line = lines[index]
    if (index === count - 1 && lines.length > count) line = `${line.slice(0, Math.max(0, line.length - 1))}…`
    ctx.fillText(line, x, y + index * lineHeight)
  }
  return y + count * lineHeight
}

function renderBoardToPNG(board) {
  const bounds = contentBounds(board, true)
  const pad = 64
  const worldWidth = bounds.w + pad * 2
  const worldHeight = bounds.h + pad * 2
  const maxDimension = 8192
  const scale = Math.min(2, maxDimension / worldWidth, maxDimension / worldHeight)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(worldWidth * scale))
  canvas.height = Math.max(1, Math.round(worldHeight * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No canvas context')
  ctx.scale(scale, scale)
  ctx.translate(-bounds.x + pad, -bounds.y + pad)

  const colors = {
    bg: '#fbfbf9',
    frame: '#f7f7f4',
    frameLine: '#dfdfda',
    lane: '#f4f4f1',
    laneLine: '#e3e3de',
    card: '#fdfdfb',
    cardLine: '#deded8',
    ink: '#24272d',
    muted: '#6d7380',
    faint: '#9a9fa9',
    edge: '#9ba2af',
  }

  ctx.fillStyle = colors.bg
  ctx.fillRect(bounds.x - pad, bounds.y - pad, worldWidth, worldHeight)

  for (const node of board.nodes.filter((item) => item.type === 'frame')) {
    roundedRect(ctx, node.x, node.y, node.w, node.h, 18)
    ctx.fillStyle = colors.frame
    ctx.fill()
    ctx.strokeStyle = colors.frameLine
    ctx.lineWidth = 1.2
    ctx.stroke()
    ctx.fillStyle = colors.ink
    ctx.font = '700 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.fillText(node.title || 'Frame', node.x + 20, node.y + 30)
    if (node.subtitle) {
      ctx.fillStyle = colors.muted
      ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.fillText(node.subtitle, node.x + 20, node.y + 50)
    }
  }

  for (const node of board.nodes.filter((item) => item.type === 'lane')) {
    const status = STATUS[node.status] || STATUS.todo
    roundedRect(ctx, node.x, node.y, node.w, node.h, 18)
    ctx.fillStyle = hexToRgba(status.color, 0.055)
    ctx.fill()
    ctx.strokeStyle = hexToRgba(status.color, 0.18)
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.fillStyle = status.color
    ctx.beginPath()
    ctx.arc(node.x + 22, node.y + 25, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = colors.ink
    ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.fillText(String(status.label).toUpperCase(), node.x + 34, node.y + 29)
    const count = board.nodes.filter((item) => item.type === 'task' && item.status === node.status).length
    ctx.fillStyle = colors.faint
    ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(String(count), node.x + node.w - 18, node.y + 28)
    ctx.textAlign = 'left'
  }

  const nodeMap = nodeMapOf(board)
  for (const edge of board.edges) {
    const geometry = edgeGeometry(edge, nodeMap)
    if (!geometry) continue
    ctx.beginPath()
    ctx.moveTo(geometry.start.x, geometry.start.y)
    ctx.bezierCurveTo(geometry.c1.x, geometry.c1.y, geometry.c2.x, geometry.c2.y, geometry.end.x, geometry.end.y)
    ctx.strokeStyle = colors.edge
    ctx.lineWidth = 1.6
    if (edge.dashed) ctx.setLineDash([6, 5])
    else ctx.setLineDash([])
    ctx.stroke()
    ctx.setLineDash([])
    const head = arrowHead(geometry.end, geometry.c2, 9)
    ctx.beginPath()
    ctx.moveTo(head[0].x, head[0].y)
    ctx.lineTo(geometry.end.x, geometry.end.y)
    ctx.lineTo(head[2].x, head[2].y)
    ctx.closePath()
    ctx.fillStyle = colors.edge
    ctx.fill()
    if (edge.label) {
      ctx.font = '600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      const width = ctx.measureText(edge.label).width + 14
      roundedRect(ctx, geometry.mid.x - width / 2, geometry.mid.y - 10, width, 20, 9)
      ctx.fillStyle = colors.bg
      ctx.fill()
      ctx.strokeStyle = colors.cardLine
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.fillStyle = colors.muted
      ctx.textAlign = 'center'
      ctx.fillText(edge.label, geometry.mid.x, geometry.mid.y + 3.5)
      ctx.textAlign = 'left'
    }
  }

  for (const node of board.nodes.filter((item) => item.type !== 'frame' && item.type !== 'lane')) {
    const tone = TONES[node.tone] || TONES.blue
    if (node.type === 'task') {
      roundedRect(ctx, node.x, node.y, node.w, node.h, 14)
      ctx.fillStyle = colors.card
      ctx.fill()
      ctx.strokeStyle = colors.cardLine
      ctx.lineWidth = 1.2
      ctx.stroke()
      const status = STATUS[node.status] || STATUS.todo
      const pillWidth = Math.max(54, String(status.label).length * 6.2 + 24)
      roundedRect(ctx, node.x + 13, node.y + 13, pillWidth, 22, 11)
      ctx.fillStyle = hexToRgba(status.color, 0.14)
      ctx.fill()
      ctx.fillStyle = status.color
      ctx.beginPath()
      ctx.arc(node.x + 24, node.y + 24, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = colors.ink
      ctx.font = '600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.fillText(status.label, node.x + 31, node.y + 27.5)
      const priority = PRIORITY[node.priority] || PRIORITY.P2
      ctx.fillStyle = priority.color
      ctx.font = '700 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(priority.label, node.x + node.w - 14, node.y + 27.5)
      ctx.textAlign = 'left'
      ctx.fillStyle = colors.ink
      ctx.font = '600 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      let y = drawCanvasLines(ctx, node.title, node.x + 14, node.y + 57, node.w - 28, 19, 2, colors.ink)
      if (node.tags && node.tags.length) {
        ctx.font = '600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        let tagX = node.x + 14
        for (const tag of node.tags.slice(0, 2)) {
          const tagWidth = ctx.measureText(tag).width + 14
          roundedRect(ctx, tagX, node.y + 91, tagWidth, 18, 9)
          ctx.fillStyle = '#f0f1f3'
          ctx.fill()
          ctx.fillStyle = colors.muted
          ctx.fillText(tag, tagX + 7, node.y + 103.5)
          tagX += tagWidth + 6
        }
      }
      const checklist = node.checklist || []
      const done = checklist.filter((item) => item.done).length
      const percent = checklist.length ? done / checklist.length : 0
      roundedRect(ctx, node.x + 14, node.y + 130, node.w - 28, 4, 2)
      ctx.fillStyle = '#ecece8'
      ctx.fill()
      if (percent > 0) {
        roundedRect(ctx, node.x + 14, node.y + 130, (node.w - 28) * percent, 4, 2)
        ctx.fillStyle = status.color
        ctx.fill()
      }
      ctx.fillStyle = colors.faint
      ctx.font = '600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.fillText(checklist.length ? `${done}/${checklist.length} subtasks` : 'No checklist', node.x + 14, node.y + 149)
      if (node.due) {
        ctx.textAlign = 'right'
        ctx.fillStyle = isOverdue(node.due) ? '#cf3f3f' : colors.muted
        ctx.fillText(formatDue(node.due), node.x + node.w - 14, node.y + 149)
        ctx.textAlign = 'left'
      }
      const avatarColor = `hsl(${avatarHue(node.assignee)} 42% 46%)`
      ctx.beginPath()
      ctx.arc(node.x + 24, node.y + 177, 10, 0, Math.PI * 2)
      ctx.fillStyle = avatarColor
      ctx.fill()
      ctx.fillStyle = '#fdfdfb'
      ctx.font = '700 8px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(initials(node.assignee), node.x + 24, node.y + 180)
      ctx.textAlign = 'left'
      ctx.fillStyle = colors.muted
      ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.fillText(node.assignee || 'Unassigned', node.x + 40, node.y + 181)
    } else if (node.type === 'note') {
      roundedRect(ctx, node.x, node.y, node.w, node.h, 12)
      ctx.fillStyle = hexToRgba(tone.color, 0.15)
      ctx.fill()
      ctx.strokeStyle = hexToRgba(tone.color, 0.35)
      ctx.lineWidth = 1.2
      ctx.stroke()
      ctx.fillStyle = tone.color
      ctx.fillRect(node.x, node.y + 12, 3, node.h - 24)
      ctx.fillStyle = tone.color
      ctx.font = '700 9px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.fillText('NOTE', node.x + 16, node.y + 22)
      const lines = String(node.text || '').split('\n')
      ctx.fillStyle = colors.ink
      ctx.font = '700 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      let textY = node.y + 45
      if (lines[0]) {
        textY = drawCanvasLines(ctx, lines[0], node.x + 16, textY, node.w - 32, 18, 2, colors.ink)
      }
      if (lines.length > 1) {
        ctx.fillStyle = colors.muted
        ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        drawCanvasLines(ctx, lines.slice(1).join('\n').trim(), node.x + 16, textY + 6, node.w - 32, 15, 5, colors.muted)
      }
    } else if (node.type === 'text') {
      ctx.fillStyle = node.tone && node.tone !== 'slate' ? tone.color : colors.ink
      ctx.font = `${node.weight || 500} ${node.size || 14}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
      drawCanvasLines(ctx, node.text, node.x, node.y + (node.size || 14), node.w, (node.size || 14) * 1.35, 6, ctx.fillStyle)
    } else if (node.type === 'shape') {
      const x = node.x
      const y = node.y
      const w = node.w
      const h = node.h
      const variant = normalizeShapeVariant(node.variant)
      const cy = y + h / 2
      const cx = x + w / 2
      ctx.fillStyle = hexToRgba(tone.color, 0.15)
      ctx.strokeStyle = hexToRgba(tone.color, 0.8)
      ctx.lineWidth = 1.4
      ctx.beginPath()
      if (variant === 'decision') {
        ctx.moveTo(cx, y)
        ctx.lineTo(x + w, cy)
        ctx.lineTo(cx, y + h)
        ctx.lineTo(x, cy)
        ctx.closePath()
      } else if (variant === 'terminator') {
        ctx.arc(cx, cy, Math.min(w, h) / 2, 0, Math.PI * 2)
      } else if (variant === 'io') {
        ctx.moveTo(x + w * 0.18, y)
        ctx.lineTo(x + w, y)
        ctx.lineTo(x + w * 0.82, y + h)
        ctx.lineTo(x, y + h)
        ctx.closePath()
      } else if (variant === 'manual') {
        ctx.moveTo(x + w * 0.18, y)
        ctx.lineTo(x + w * 0.82, y)
        ctx.lineTo(x + w, y + h)
        ctx.lineTo(x, y + h)
        ctx.closePath()
      } else if (variant === 'document') {
        ctx.moveTo(x, y)
        ctx.lineTo(x + w, y)
        ctx.lineTo(x + w, y + h * 0.82)
        ctx.bezierCurveTo(x + w * 0.72, y + h * 1.02, x + w * 0.58, y + h * 0.72, x + w * 0.46, y + h * 0.84)
        ctx.bezierCurveTo(x + w * 0.3, y + h * 0.98, x + w * 0.16, y + h * 0.94, x, y + h * 0.84)
        ctx.closePath()
      } else if (variant === 'database') {
        const ry = Math.min(h * 0.13, 16)
        ctx.moveTo(x, y + ry)
        ctx.lineTo(x, y + h - ry)
        ctx.quadraticCurveTo(x, y + h, cx, y + h)
        ctx.quadraticCurveTo(x + w, y + h, x + w, y + h - ry)
        ctx.lineTo(x + w, y + ry)
        ctx.closePath()
      } else {
        roundedRect(ctx, x, y, w, h, 10)
      }
      ctx.fill()
      ctx.stroke()
      if (variant === 'database') {
        const ry = Math.min(h * 0.13, 16)
        ctx.beginPath()
        ctx.ellipse(cx, y + ry, w / 2, ry, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      }
      if (variant === 'subprocess') {
        ctx.beginPath()
        ctx.moveTo(x + 12, y)
        ctx.lineTo(x + 12, y + h)
        ctx.moveTo(x + w - 12, y)
        ctx.lineTo(x + w - 12, y + h)
        ctx.stroke()
      }
      ctx.fillStyle = colors.ink
      ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.textAlign = 'center'
      const maxWidth = variant === 'decision' ? w * 0.58 : variant === 'io' || variant === 'manual' ? w * 0.72 : w * 0.8
      const lines = wrapCanvasLines(ctx, node.text || '', maxWidth).slice(0, 3)
      const lineHeight = 14
      const startY = cy - ((Math.max(1, lines.length) - 1) * lineHeight) / 2 + 4
      lines.forEach((line, index) => ctx.fillText(line, cx, startY + index * lineHeight))
      ctx.textAlign = 'left'
    } else if (node.type === 'draw') {
      ctx.beginPath()
      const points = node.points || []
      if (points.length) {
        ctx.moveTo(node.x + points[0].x, node.y + points[0].y)
        for (let index = 1; index < points.length; index += 1) {
          const point = points[index]
          ctx.lineTo(node.x + point.x, node.y + point.y)
        }
      }
      ctx.strokeStyle = tone.color
      ctx.lineWidth = node.width || 2.4
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
    }
  }

  ctx.fillStyle = '#b3b6bc'
  ctx.font = '500 9px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('Engineering Canvas', bounds.x + bounds.w + pad - 18, bounds.y + bounds.h + pad - 18)
  ctx.textAlign = 'left'

  canvas.toBlob((blob) => {
    if (!blob) return
    downloadBlob(blob, `${fileSafe(board.title)}.png`)
  }, 'image/png')
}

/* The right-side inspector: task detail, object detail, connectors, multi-select, board overview. */

function Inspector(props) {
  const {
    t,
    board,
    boards,
    selection,
    selectedNodes,
    selectedEdges,
    selectedTask,
    selectedEdge,
    selectedGroup,
    selectedGroups = [],
    stats,
    statusFilter,
    setStatusFilter,
    onSelect,
    onToggleSelected,
    onUpdateNode,
    onUpdateEdge,
    onDeleteSelection,
    onDuplicate,
    onAlign,
    onDistribute,
    onBringFront,
    onSendBack,
    onFocusNode,
    onNewBoard,
    onActivateBoard,
    onOpenShortcuts,
    onOpenNote,
    onGroup,
    onUngroup,
    onRenameGroup,
    onClearSelection,
  } = props

  const single = selectedNodes.length === 1 ? selectedNodes[0] : null
  const mode = selectedGroup
    ? t('Group')
    : selectedEdges.length && selectedNodes.length === 0
      ? t('Connection')
      : selectedNodes.length > 1
        ? `${selectedNodes.length} ${t('selected')}`
        : single
          ? t(typeLabel(single.type))
          : t('Board overview')
  const icon = selectedGroup
    ? 'group'
    : selectedEdges.length && !selectedNodes.length
      ? 'connect'
      : single
        ? typeIcon(single.type)
        : selectedNodes.length > 1
          ? 'layers'
          : 'board'
  const title = selectedGroup
    ? selectedGroup.name || t('Group')
    : selectedEdge && !single
      ? t('Dependency')
      : single
        ? single.title || single.text || t('Untitled')
        : selectedNodes.length > 1
          ? t('Multiple selection')
          : t('Sprint health')
  const canGroup = selectedNodes.filter((node) => node.type !== 'frame' && node.type !== 'lane').length >= 2
  const canUngroup = selectedGroups.length > 0

  return h(
    'aside',
    { className: 'ec-inspector', 'aria-label': t('Inspector'), onPointerDown: stop },
    h(
      'div',
      { className: 'ec-inspector-head' },
      h('span', { className: 'ec-inspector-mark' }, h(Icon, { name: icon, size: 17 })),
      h(
        'div',
        { className: 'ec-inspector-title' },
        h('span', { className: 'ec-eyebrow' }, mode),
        h('h2', null, title),
      ),
      selection.length
        ? h(
            'button',
            { type: 'button', className: 'ec-icon-btn', onClick: onClearSelection, 'aria-label': t('Clear selection') },
            h(Icon, { name: 'close', size: 15 }),
          )
        : null,
    ),
    h(
      'div',
      { className: 'ec-inspector-body' },
      selectedGroup
        ? h(GroupInspector, {
            t,
            group: selectedGroup,
            children: selectedNodes,
            onRenameGroup,
            onUngroup,
            onDuplicate,
            onDeleteSelection,
            onFocusNode,
          })
        : single && single.type === 'task'
        ? h(TaskInspector, {
            t,
            board,
            node: single,
            onUpdateNode,
            onDeleteSelection,
            onDuplicate,
            onFocusNode,
          })
        : selectedEdge && selectedNodes.length === 0
          ? h(EdgeInspector, { t, board, edge: selectedEdge, onUpdateEdge, onDeleteSelection, onFocusNode })
          : single
            ? h(ObjectInspector, { t, node: single, onUpdateNode, onDeleteSelection, onDuplicate, onOpenNote })
            : selectedNodes.length > 1
              ? h(MultiInspector, {
                  t,
                  nodes: selectedNodes,
                  onAlign,
                  onDistribute,
                  onBringFront,
                  onSendBack,
                  onDuplicate,
                  onDeleteSelection,
                  onFocusNode,
                  onGroup,
                  onUngroup,
                  canGroup,
                  canUngroup,
                })
              : h(BoardInspector, {
                  t,
                  board,
                  boards,
                  stats,
                  statusFilter,
                  setStatusFilter,
                  onNewBoard,
                  onActivateBoard,
                  onOpenShortcuts,
                }),
    ),
    h(
      'div',
      { className: 'ec-inspector-foot' },
      h(Icon, { name: 'keyboard', size: 12 }),
      h('span', null, t('Autosaved locally')),
      h('span', { className: 'ec-foot-sep' }),
      h('button', { type: 'button', className: 'ec-link-btn', onClick: onOpenShortcuts }, t('Shortcuts')),
    ),
  )
}

function typeLabel(type) {
  if (type === 'task') return 'Task'
  if (type === 'note') return 'Note'
  if (type === 'frame') return 'Frame'
  if (type === 'text') return 'Text'
  if (type === 'shape') return 'Shape'
  if (type === 'draw') return 'Drawing'
  return 'Object'
}

function typeIcon(type) {
  if (type === 'task') return 'task'
  if (type === 'note') return 'note'
  if (type === 'frame') return 'frame'
  if (type === 'text') return 'text'
  if (type === 'shape') return 'shape'
  if (type === 'draw') return 'pen'
  return 'layers'
}

function TaskInspector({ t, board, node, onUpdateNode, onDeleteSelection, onDuplicate, onFocusNode }) {
  const status = STATUS[node.status] || STATUS.todo
  const done = (node.checklist || []).filter((item) => item.done).length
  const total = (node.checklist || []).length
  const percent = total ? Math.round((done / total) * 100) : 0
  const nodeMap = nodeMapOf(board)
  const blockers = board.edges
    .filter((edge) => edge.to === node.id)
    .map((edge) => nodeMap.get(edge.from))
    .filter(Boolean)
  const blocks = board.edges
    .filter((edge) => edge.from === node.id)
    .map((edge) => nodeMap.get(edge.to))
    .filter(Boolean)

  function patch(value, options) {
    onUpdateNode(node.id, value, options)
  }

  function toggleChecklist(itemId) {
    const next = (node.checklist || []).map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item,
    )
    patch({ checklist: next })
  }

  function editChecklist(itemId, text) {
    const next = (node.checklist || []).map((item) => (item.id === itemId ? { ...item, text } : item))
    patch({ checklist: next }, { coalesce: `check:${node.id}:${itemId}` })
  }

  function removeChecklist(itemId) {
    patch({ checklist: (node.checklist || []).filter((item) => item.id !== itemId) })
  }

  function addChecklist() {
    patch({ checklist: [...(node.checklist || []), checklistItem('New subtask')] })
  }

  return h(
    Fragment,
    null,
    h(
      'div',
      { className: 'ec-inspector-section' },
      h(
        'div',
        { className: 'ec-task-status-line' },
        h(
          'span',
          { className: 'ec-status-pill ec-status-pill--large', style: { '--status-color': status.color } },
          h('span', { className: 'ec-status-dot' }),
          t(status.label),
        ),
        h(
          'button',
          { type: 'button', className: 'ec-icon-btn ec-focus-btn', onClick: () => onFocusNode(node), title: t('Focus on canvas') },
          h(Icon, { name: 'fit', size: 14 }),
        ),
      ),
      h('input', {
        className: 'ec-field-input ec-task-title-field',
        value: node.title,
        'aria-label': t('Task title'),
        placeholder: t('Task title'),
        onChange: (event) => patch({ title: event.target.value }, { coalesce: `task-title:${node.id}` }),
      }),
      h('textarea', {
        className: 'ec-field-textarea',
        value: node.description || '',
        'aria-label': t('Description'),
        placeholder: t('Add context, acceptance criteria, links…'),
        rows: 3,
        onChange: (event) => patch({ description: event.target.value }, { coalesce: `task-desc:${node.id}` }),
      }),
    ),
    h(
      'div',
      { className: 'ec-inspector-section' },
      h('h3', { className: 'ec-section-title' }, t('Status')),
      h(
        'div',
        { className: 'ec-status-grid' },
        STATUS_ORDER.map((key) =>
          h(
            'button',
            {
              key,
              type: 'button',
              className: `ec-status-choice ${node.status === key ? 'is-active' : ''}`,
              style: { '--status-color': STATUS[key].color },
              onClick: () => patch({ status: key }),
            },
            h('span', { className: 'ec-status-dot' }),
            t(STATUS[key].label),
          ),
        ),
      ),
      h('h3', { className: 'ec-section-title ec-section-title--spaced' }, t('Priority')),
      h(
        'div',
        { className: 'ec-priority-grid' },
        PRIORITY_ORDER.map((key) =>
          h(
            'button',
            {
              key,
              type: 'button',
              className: `ec-priority-choice ${node.priority === key ? 'is-active' : ''}`,
              style: { '--priority-color': PRIORITY[key].color },
              title: t(PRIORITY[key].name),
              onClick: () => patch({ priority: key }),
            },
            h('span', { className: 'ec-priority-bar' }),
            h('strong', null, key),
            h('span', null, t(PRIORITY[key].name)),
          ),
        ),
      ),
    ),
    h(
      'div',
      { className: 'ec-inspector-section' },
      h('h3', { className: 'ec-section-title' }, t('Details')),
      h(
        'div',
        { className: 'ec-field-grid' },
        h(
          'label',
          { className: 'ec-field' },
          h('span', null, t('Assignee')),
          h('input', {
            className: 'ec-field-input',
            value: node.assignee || '',
            placeholder: t('Unassigned'),
            onChange: (event) => patch({ assignee: event.target.value }, { coalesce: `assignee:${node.id}` }),
          }),
        ),
        h(
          'label',
          { className: 'ec-field' },
          h('span', null, t('Due')),
          h('input', {
            className: 'ec-field-input',
            type: 'date',
            value: node.due || '',
            onChange: (event) => patch({ due: event.target.value }),
          }),
        ),
        h(
          'label',
          { className: 'ec-field' },
          h('span', null, t('Estimate')),
          h('input', {
            className: 'ec-field-input',
            value: node.estimate || '',
            placeholder: t('e.g. 2d'),
            onChange: (event) => patch({ estimate: event.target.value }, { coalesce: `estimate:${node.id}` }),
          }),
        ),
        h(
          'label',
          { className: 'ec-field' },
          h('span', null, t('Tags')),
          h(TagsField, { t, node, onUpdateNode }),
        ),
      ),
    ),
    h(
      'div',
      { className: 'ec-inspector-section' },
      h(
        'div',
        { className: 'ec-section-head' },
        h('h3', { className: 'ec-section-title' }, t('Checklist')),
        h('span', { className: 'ec-section-meta' }, `${done}/${total}`),
      ),
      h(
        'div',
        { className: 'ec-checks' },
        (node.checklist || []).map((item) =>
          h(
            'div',
            { key: item.id, className: `ec-check ${item.done ? 'is-done' : ''}` },
            h(
              'button',
              {
                type: 'button',
                className: 'ec-check-box',
                role: 'checkbox',
                'aria-checked': item.done,
                'aria-label': item.text,
                onClick: () => toggleChecklist(item.id),
              },
              item.done ? h(Icon, { name: 'check', size: 11 }) : null,
            ),
            h('input', {
              className: 'ec-check-input',
              value: item.text,
              'aria-label': t('Subtask'),
              onChange: (event) => editChecklist(item.id, event.target.value),
            }),
            h(
              'button',
              { type: 'button', className: 'ec-check-delete', onClick: () => removeChecklist(item.id), 'aria-label': t('Remove subtask') },
              h(Icon, { name: 'close', size: 11 }),
            ),
          ),
        ),
        h(
          'button',
          { type: 'button', className: 'ec-add-row', onClick: addChecklist },
          h(Icon, { name: 'plus', size: 13 }),
          t('Add subtask'),
        ),
      ),
      total
        ? h(
            'div',
            { className: 'ec-inspector-progress' },
            h('div', { className: 'ec-task-progress-track' }, h('span', { style: { width: `${percent}%` }, className: percent === 100 ? 'is-complete' : '' })),
            h('span', null, `${percent}%`),
          )
        : null,
    ),
    h(
      'div',
      { className: 'ec-inspector-section' },
      h(
        'div',
        { className: 'ec-section-head' },
        h('h3', { className: 'ec-section-title' }, t('Dependencies')),
        h('span', { className: 'ec-section-meta' }, `${blockers.length + blocks.length}`),
      ),
      blockers.length
        ? h(
            'div',
            { className: 'ec-dep-group' },
            h('span', { className: 'ec-dep-label' }, t('Blocked by')),
            blockers.map((other) =>
              h(
                'button',
                { key: other.id, type: 'button', className: 'ec-dep-row', onClick: () => onFocusNode(other) },
                h('span', { className: 'ec-status-dot', style: { '--status-color': STATUS[other.status]?.color || '#8b95a7' } }),
                h('span', null, other.title),
                h(Icon, { name: 'arrowUpRight', size: 12 }),
              ),
            ),
          )
        : null,
      blocks.length
        ? h(
            'div',
            { className: 'ec-dep-group' },
            h('span', { className: 'ec-dep-label' }, t('Blocks')),
            blocks.map((other) =>
              h(
                'button',
                { key: other.id, type: 'button', className: 'ec-dep-row', onClick: () => onFocusNode(other) },
                h('span', { className: 'ec-status-dot', style: { '--status-color': STATUS[other.status]?.color || '#8b95a7' } }),
                h('span', null, other.title),
                h(Icon, { name: 'arrowUpRight', size: 12 }),
              ),
            ),
          )
        : null,
      !blockers.length && !blocks.length
        ? h('p', { className: 'ec-hint-copy' }, t('Draw a connector between two cards to record a dependency.'))
        : null,
    ),
    h(
      'div',
      { className: 'ec-inspector-section ec-inspector-section--actions' },
      h('button', { type: 'button', className: 'ec-btn ec-btn--full', onClick: onDuplicate }, h(Icon, { name: 'copy', size: 14 }), t('Duplicate')),
      h('button', { type: 'button', className: 'ec-btn ec-btn--full ec-btn--danger-quiet', onClick: onDeleteSelection }, h(Icon, { name: 'trash', size: 14 }), t('Delete task')),
    ),
  )
}

function TagsField({ t, node, onUpdateNode }) {
  const [value, setValue] = useState((node.tags || []).join(', '))
  useEffect(() => {
    setValue((node.tags || []).join(', '))
  }, [node.id, (node.tags || []).join('|')])

  function commit() {
    const tags = value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 8)
    onUpdateNode(node.id, { tags })
    setValue(tags.join(', '))
  }

  return h(
    'span',
    { className: 'ec-tags-field' },
    h('input', {
      className: 'ec-field-input',
      value,
      placeholder: t('payments, api'),
      'aria-label': t('Tags'),
      onChange: (event) => setValue(event.target.value),
      onBlur: commit,
      onKeyDown: (event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          event.currentTarget.blur()
        }
      },
    }),
    (node.tags || []).length
      ? h('span', { className: 'ec-tags-preview' }, (node.tags || []).slice(0, 4).map((tag) => h('span', { key: tag, className: 'ec-tag' }, tag)))
      : null,
  )
}

function EdgeInspector({ t, board, edge, onUpdateEdge, onDeleteSelection, onFocusNode }) {
  const map = nodeMapOf(board)
  const from = map.get(edge.from)
  const to = map.get(edge.to)
  const sides = [
    ['auto', t('Auto')],
    ['top', t('Top')],
    ['right', t('Right')],
    ['bottom', t('Bottom')],
    ['left', t('Left')],
  ]
  return h(
    Fragment,
    null,
    h(
      'div',
      { className: 'ec-inspector-section' },
      h(
        'div',
        { className: 'ec-edge-endpoints' },
        h(
          'button',
          { type: 'button', className: 'ec-endpoint', onClick: () => from && onFocusNode(from) },
          h('span', { className: 'ec-endpoint-label' }, t('From')),
          h('strong', null, from?.title || from?.text || t('Missing')),
        ),
        h(Icon, { name: 'connect', size: 18 }),
        h(
          'button',
          { type: 'button', className: 'ec-endpoint', onClick: () => to && onFocusNode(to) },
          h('span', { className: 'ec-endpoint-label' }, t('To')),
          h('strong', null, to?.title || to?.text || t('Missing')),
        ),
      ),
      h(
        'label',
        { className: 'ec-field' },
        h('span', null, t('Relationship label')),
        h('input', {
          className: 'ec-field-input',
          value: edge.label || '',
          placeholder: t('blocks, enables, informs…'),
          onChange: (event) => onUpdateEdge(edge.id, { label: event.target.value }, { coalesce: `edge-label:${edge.id}` }),
        }),
      ),
      h(
        'label',
        { className: 'ec-switch-row' },
        h('span', null, t('Dashed line')),
        h(
          'button',
          {
            type: 'button',
            className: `ec-switch ${edge.dashed ? 'is-on' : ''}`,
            role: 'switch',
            'aria-checked': Boolean(edge.dashed),
            onClick: () => onUpdateEdge(edge.id, { dashed: !edge.dashed }),
          },
          h('span', null),
        ),
      ),
    ),
    h(
      'div',
      { className: 'ec-inspector-section' },
      h('h3', { className: 'ec-section-title' }, t('Anchors')),
      h(
        'div',
        { className: 'ec-field-grid' },
        h(
          'label',
          { className: 'ec-field' },
          h('span', null, t('Start side')),
          h(
            'select',
            { className: 'ec-field-input', value: edge.fromSide || 'auto', onChange: (event) => onUpdateEdge(edge.id, { fromSide: event.target.value }) },
            sides.map(([value, label]) => h('option', { key: value, value }, label)),
          ),
        ),
        h(
          'label',
          { className: 'ec-field' },
          h('span', null, t('End side')),
          h(
            'select',
            { className: 'ec-field-input', value: edge.toSide || 'auto', onChange: (event) => onUpdateEdge(edge.id, { toSide: event.target.value }) },
            sides.map(([value, label]) => h('option', { key: value, value }, label)),
          ),
        ),
      ),
    ),
    h(
      'div',
      { className: 'ec-inspector-section ec-inspector-section--actions' },
      h(
        'button',
        {
          type: 'button',
          className: 'ec-btn ec-btn--full',
          onClick: () => onUpdateEdge(edge.id, { from: edge.to, to: edge.from, fromSide: edge.toSide, toSide: edge.fromSide }),
        },
        h(Icon, { name: 'redo', size: 14 }),
        t('Reverse direction'),
      ),
      h('button', { type: 'button', className: 'ec-btn ec-btn--full ec-btn--danger-quiet', onClick: onDeleteSelection }, h(Icon, { name: 'trash', size: 14 }), t('Delete connection')),
    ),
  )
}

function ObjectInspector({ t, node, onUpdateNode, onDeleteSelection, onDuplicate, onOpenNote }) {
  const update = (patch, options) => onUpdateNode(node.id, patch, options)
  return h(
    Fragment,
    null,
    node.type === 'frame'
      ? h(
          'div',
          { className: 'ec-inspector-section' },
          h('h3', { className: 'ec-section-title' }, t('Frame')),
          h(
            'label',
            { className: 'ec-field' },
            h('span', null, t('Title')),
            h('input', {
              className: 'ec-field-input',
              value: node.title || '',
              onChange: (event) => update({ title: event.target.value }, { coalesce: `frame-title:${node.id}` }),
            }),
          ),
          h(
            'label',
            { className: 'ec-field' },
            h('span', null, t('Subtitle')),
            h('input', {
              className: 'ec-field-input',
              value: node.subtitle || '',
              placeholder: t('Optional context'),
              onChange: (event) => update({ subtitle: event.target.value }, { coalesce: `frame-sub:${node.id}` }),
            }),
          ),
          h(
            'div',
            { className: 'ec-field-grid' },
            h(
              'label',
              { className: 'ec-field' },
              h('span', null, t('Width')),
              h('input', {
                className: 'ec-field-input',
                type: 'number',
                min: 220,
                value: Math.round(node.w),
                onChange: (event) => update({ w: clamp(Number(event.target.value) || 220, 220, 4000) }),
              }),
            ),
            h(
              'label',
              { className: 'ec-field' },
              h('span', null, t('Height')),
              h('input', {
                className: 'ec-field-input',
                type: 'number',
                min: 160,
                value: Math.round(node.h),
                onChange: (event) => update({ h: clamp(Number(event.target.value) || 160, 160, 4000) }),
              }),
            ),
          ),
        )
      : node.type === 'note'
        ? h(
            'div',
            { className: 'ec-inspector-section' },
            h('h3', { className: 'ec-section-title' }, t('Note')),
            h(
              'div',
              { className: 'ec-note-inspector-preview' },
              h('strong', null, node.title || t('Untitled note')),
              h(
                'p',
                null,
                (node.blocks || []).find((block) => String(block.text || '').trim())?.text || t('No note content yet'),
              ),
            ),
            h(
              'button',
              { type: 'button', className: 'ec-btn ec-btn--full', onClick: () => onOpenNote(node) },
              h(Icon, { name: 'arrowUpRight', size: 14 }),
              t('Open note editor'),
            ),
            h(TonePicker, { t, node, update }),
          )
        : node.type === 'text'
          ? h(
              'div',
              { className: 'ec-inspector-section' },
              h('h3', { className: 'ec-section-title' }, t('Text')),
              h('textarea', {
                className: 'ec-field-textarea',
                value: node.text || '',
                rows: 4,
                onChange: (event) => update({ text: event.target.value }, { coalesce: `text:${node.id}` }),
              }),
              h(
                'div',
                { className: 'ec-field-grid' },
                h(
                  'label',
                  { className: 'ec-field' },
                  h('span', null, t('Size')),
                  h('input', {
                    className: 'ec-field-input',
                    type: 'number',
                    min: 10,
                    max: 72,
                    value: node.size || 14,
                    onChange: (event) => update({ size: clamp(Number(event.target.value) || 14, 10, 72) }),
                  }),
                ),
                h(
                  'label',
                  { className: 'ec-field' },
                  h('span', null, t('Weight')),
                  h(
                    'select',
                    { className: 'ec-field-input', value: node.weight || 500, onChange: (event) => update({ weight: Number(event.target.value) }) },
                    h('option', { value: 400 }, t('Regular')),
                    h('option', { value: 500 }, t('Medium')),
                    h('option', { value: 600 }, t('Semibold')),
                    h('option', { value: 700 }, t('Bold')),
                  ),
                ),
              ),
              h(TonePicker, { t, node, update }),
            )
          : node.type === 'shape'
            ? h(
                'div',
                { className: 'ec-inspector-section' },
                h('h3', { className: 'ec-section-title' }, t('Shape')),
                h('input', {
                  className: 'ec-field-input',
                  value: node.text || '',
                  onChange: (event) => update({ text: event.target.value }, { coalesce: `shape-text:${node.id}` }),
                }),
                h(ShapeTypeGrid, { t, node, update }),
                h(TonePicker, { t, node, update }),
              )
            : h(
                'div',
                { className: 'ec-inspector-section' },
                h('h3', { className: 'ec-section-title' }, t('Drawing')),
                h('p', { className: 'ec-hint-copy' }, t('Freehand stroke. Adjust its color or weight, then keep sketching.')),
                h(TonePicker, { t, node, update }),
                h(
                  'label',
                  { className: 'ec-field' },
                  h('span', null, t('Weight')),
                  h('input', {
                    className: 'ec-range',
                    type: 'range',
                    min: 1,
                    max: 10,
                    step: 0.5,
                    value: node.width || 2.6,
                    onChange: (event) => update({ width: Number(event.target.value) }),
                  }),
                ),
              ),
    h(
      'div',
      { className: 'ec-inspector-section ec-inspector-section--actions' },
      h('button', { type: 'button', className: 'ec-btn ec-btn--full', onClick: onDuplicate }, h(Icon, { name: 'copy', size: 14 }), t('Duplicate')),
      h('button', { type: 'button', className: 'ec-btn ec-btn--full ec-btn--danger-quiet', onClick: onDeleteSelection }, h(Icon, { name: 'trash', size: 14 }), t('Delete')),
    ),
  )
}

function ShapeTypeGrid({ t, node, update }) {
  const active = normalizeShapeVariant(node.variant)
  return h(
    'div',
    { className: 'ec-shape-type-grid', role: 'group', 'aria-label': t('Shape type') },
    SHAPE_TYPES.map((shape) =>
      h(
        'button',
        {
          key: shape.id,
          type: 'button',
          className: `ec-shape-type ${active === shape.id ? 'is-active' : ''}`,
          'aria-pressed': active === shape.id,
          title: t(shape.label),
          onClick: () => {
            const patch = { variant: shape.id }
            if (shape.id === 'terminator') {
              patch.w = shape.w
              patch.h = shape.h
            } else {
              if (node.w < shape.w) patch.w = shape.w
              if (node.h < shape.h) patch.h = shape.h
            }
            update(patch)
          },
        },
        h(ShapeGlyph, { variant: shape.id, size: 24 }),
        h('span', null, t(shape.label)),
      ),
    ),
  )
}

function TonePicker({ t, node, update }) {
  return h(
    'div',
    { className: 'ec-tone-field' },
    h('span', { className: 'ec-field-label' }, t('Color')),
    h(
      'div',
      { className: 'ec-swatches' },
      TONE_ORDER.map((tone) =>
        h(
          'button',
          {
            key: tone,
            type: 'button',
            className: `ec-swatch ${node.tone === tone ? 'is-active' : ''}`,
            style: { '--swatch': TONES[tone].color },
            'aria-label': t(TONES[tone].label),
            title: t(TONES[tone].label),
            onClick: () => update({ tone }),
          },
        ),
      ),
    ),
  )
}

function GroupInspector({ t, group, children, onRenameGroup, onUngroup, onDuplicate, onDeleteSelection, onFocusNode }) {
  return h(
    Fragment,
    null,
    h(
      'div',
      { className: 'ec-inspector-section' },
      h(
        'div',
        { className: 'ec-group-summary' },
        h('span', { className: 'ec-group-summary-icon' }, h(Icon, { name: 'group', size: 18 })),
        h(
          'div',
          null,
          h('strong', null, `${children.length} ${t('components')}`),
          h('span', null, t('Selected as one unit')),
        ),
      ),
      h(
        'label',
        { className: 'ec-field' },
        h('span', null, t('Group name')),
        h('input', {
          className: 'ec-field-input',
          value: group.name || '',
          placeholder: t('Group'),
          onChange: (event) => onRenameGroup(group.id, event.target.value),
        }),
      ),
      h('p', { className: 'ec-hint-copy' }, t('Alt-click a component to select it alone.')),
      h('h3', { className: 'ec-section-title ec-section-title--spaced' }, t('Components')),
      h(
        'div',
        { className: 'ec-selection-list' },
        children.map((node) =>
          h(
            'button',
            { key: node.id, type: 'button', className: 'ec-selection-row', onClick: () => onFocusNode(node) },
            h(Icon, { name: typeIcon(node.type), size: 13 }),
            h('span', null, node.title || node.text || t(typeLabel(node.type))),
          ),
        ),
      ),
    ),
    h(
      'div',
      { className: 'ec-inspector-section ec-inspector-section--actions' },
      h(
        'button',
        { type: 'button', className: 'ec-btn ec-btn--full', onClick: onUngroup },
        h(Icon, { name: 'ungroup', size: 14 }),
        t('Ungroup'),
      ),
      h('button', { type: 'button', className: 'ec-btn ec-btn--full', onClick: onDuplicate }, h(Icon, { name: 'copy', size: 14 }), t('Duplicate group')),
      h(
        'button',
        { type: 'button', className: 'ec-btn ec-btn--full ec-btn--danger-quiet', onClick: onDeleteSelection },
        h(Icon, { name: 'trash', size: 14 }),
        t('Delete group'),
      ),
    ),
  )
}

function MultiInspector({ t, nodes, onAlign, onDistribute, onBringFront, onSendBack, onDuplicate, onDeleteSelection, onFocusNode, onGroup, onUngroup, canGroup, canUngroup }) {
  const counts = {}
  for (const node of nodes) counts[node.type] = (counts[node.type] || 0) + 1
  return h(
    Fragment,
    null,
    h(
      'div',
      { className: 'ec-inspector-section' },
      h(
        'div',
        { className: 'ec-multi-summary' },
        Object.entries(counts).map(([type, count]) =>
          h('span', { key: type, className: 'ec-summary-chip' }, `${count} ${t(typeLabel(type))}`),
        ),
      ),
      h('h3', { className: 'ec-section-title' }, t('Group')),
      h(
        'div',
        { className: 'ec-btn-row' },
        h(
          'button',
          { type: 'button', className: 'ec-btn ec-btn--full', disabled: !canGroup, onClick: onGroup },
          h(Icon, { name: 'group', size: 14 }),
          t('Group'),
        ),
        h(
          'button',
          { type: 'button', className: 'ec-btn ec-btn--full', disabled: !canUngroup, onClick: onUngroup },
          h(Icon, { name: 'ungroup', size: 14 }),
          t('Ungroup'),
        ),
      ),
      h('h3', { className: 'ec-section-title ec-section-title--spaced' }, t('Align')),
      h(
        'div',
        { className: 'ec-align-grid' },
        [
          ['left', 'Left'],
          ['hcenter', 'Center'],
          ['right', 'Right'],
          ['top', 'Top'],
          ['vcenter', 'Middle'],
          ['bottom', 'Bottom'],
        ].map(([value, label]) =>
          h('button', { key: value, type: 'button', className: 'ec-align-btn', onClick: () => onAlign(value) }, t(label)),
        ),
      ),
      h(
        'div',
        { className: 'ec-btn-row' },
        h('button', { type: 'button', className: 'ec-btn ec-btn--full', onClick: () => onDistribute('x') }, t('Distribute horizontally')),
        h('button', { type: 'button', className: 'ec-btn ec-btn--full', onClick: () => onDistribute('y') }, t('Distribute vertically')),
      ),
      h(
        'div',
        { className: 'ec-btn-row' },
        h('button', { type: 'button', className: 'ec-btn ec-btn--full', onClick: onBringFront }, t('Bring to front')),
        h('button', { type: 'button', className: 'ec-btn ec-btn--full', onClick: onSendBack }, t('Send to back')),
      ),
    ),
    h(
      'div',
      { className: 'ec-inspector-section' },
      h('h3', { className: 'ec-section-title' }, t('Selection')),
      h(
        'div',
        { className: 'ec-selection-list' },
        nodes.map((node) =>
          h(
            'button',
            { key: node.id, type: 'button', className: 'ec-selection-row', onClick: () => onFocusNode(node) },
            h(Icon, { name: typeIcon(node.type), size: 13 }),
            h('span', null, node.title || node.text || t(typeLabel(node.type))),
          ),
        ),
      ),
    ),
    h(
      'div',
      { className: 'ec-inspector-section ec-inspector-section--actions' },
      h('button', { type: 'button', className: 'ec-btn ec-btn--full', onClick: onDuplicate }, h(Icon, { name: 'copy', size: 14 }), t('Duplicate selection')),
      h('button', { type: 'button', className: 'ec-btn ec-btn--full ec-btn--danger-quiet', onClick: onDeleteSelection }, h(Icon, { name: 'trash', size: 14 }), t('Delete selection')),
    ),
  )
}

function BoardInspector({ t, board, boards, stats, statusFilter, setStatusFilter, onNewBoard, onActivateBoard, onOpenShortcuts }) {
  const circumference = 2 * Math.PI * 32
  const offset = circumference - (stats.percent / 100) * circumference
  return h(
    Fragment,
    null,
    h(
      'div',
      { className: 'ec-inspector-section ec-board-health' },
      h(
        'div',
        { className: 'ec-health-ring' },
        h(
          'svg',
          { width: 86, height: 86, viewBox: '0 0 86 86', 'aria-hidden': 'true' },
          h('circle', { cx: 43, cy: 43, r: 32, fill: 'none', stroke: 'var(--ec-ring-track)', strokeWidth: 5 }),
          h('circle', {
            cx: 43,
            cy: 43,
            r: 32,
            fill: 'none',
            stroke: 'var(--dsw-alias-brand-primary)',
            strokeWidth: 5,
            strokeLinecap: 'round',
            strokeDasharray: `${circumference} ${circumference}`,
            strokeDashoffset: offset,
            transform: 'rotate(-90 43 43)',
          }),
        ),
        h(
          'div',
          { className: 'ec-health-ring-copy' },
          h('strong', null, `${stats.percent}%`),
          h('span', null, t('complete')),
        ),
      ),
      h(
        'div',
        { className: 'ec-health-stats' },
        h(StatRow, { label: t('Tasks'), value: stats.total }),
        h(StatRow, { label: t('In progress'), value: stats.doing, color: STATUS.doing.color }),
        h(StatRow, { label: t('Blocked'), value: stats.blocked, color: STATUS.blocked.color }),
        h(StatRow, { label: t('Done'), value: stats.done, color: STATUS.done.color }),
      ),
    ),
    h(
      'div',
      { className: 'ec-inspector-section' },
      h('h3', { className: 'ec-section-title' }, t('Work by status')),
      h(
        'div',
        { className: 'ec-status-bars' },
        STATUS_ORDER.map((key) => {
          const count = board.nodes.filter((node) => node.type === 'task' && node.status === key).length
          const percent = stats.total ? Math.round((count / stats.total) * 100) : 0
          return h(
            'button',
            {
              key,
              type: 'button',
              className: `ec-status-bar-row ${statusFilter === key ? 'is-active' : ''}`,
              onClick: () => setStatusFilter(statusFilter === key ? 'all' : key),
            },
            h('span', { className: 'ec-status-dot', style: { '--status-color': STATUS[key].color } }),
            h('span', { className: 'ec-status-bar-label' }, t(STATUS[key].label)),
            h(
              'span',
              { className: 'ec-status-bar-track' },
              h('span', { style: { width: `${percent}%`, background: STATUS[key].color } }),
            ),
            h('span', { className: 'ec-status-bar-count' }, count),
          )
        }),
      ),
      statusFilter !== 'all'
        ? h(
            'button',
            { type: 'button', className: 'ec-link-btn', onClick: () => setStatusFilter('all') },
            t('Clear status filter'),
          )
        : null,
    ),
    h(
      'div',
      { className: 'ec-inspector-section' },
      h(
        'div',
        { className: 'ec-section-head' },
        h('h3', { className: 'ec-section-title' }, t('Boards')),
        h('button', { type: 'button', className: 'ec-mini-btn', onClick: onNewBoard }, h(Icon, { name: 'plus', size: 12 }), t('New')),
      ),
      h(
        'div',
        { className: 'ec-board-list' },
        h(BoardList, { t, boards, activeId: board.id, onActivateBoard }),
      ),
    ),
    h(
      'div',
      { className: 'ec-inspector-section ec-inspector-section--tip' },
      h(Icon, { name: 'sparkles', size: 15 }),
      h('p', null, t('Drag a card into another lane to change its status. Drag from a card port to draw a dependency.')),
    ),
    h(
      'div',
      { className: 'ec-inspector-section ec-inspector-section--actions' },
      h('button', { type: 'button', className: 'ec-btn ec-btn--full', onClick: onNewBoard }, h(Icon, { name: 'plus', size: 14 }), t('New board from template')),
      h('button', { type: 'button', className: 'ec-btn ec-btn--full', onClick: onOpenShortcuts }, h(Icon, { name: 'keyboard', size: 14 }), t('Keyboard shortcuts')),
    ),
  )
}

function BoardList({ t, boards, activeId, onActivateBoard }) {
  return boards.map((board) => {
    const count = board.nodes.filter((node) => node.type === 'task').length
    const isActive = board.id === activeId
    return h(
      'button',
      {
        key: board.id,
        type: 'button',
        className: `ec-board-row ${isActive ? 'is-active' : ''}`,
        onClick: () => onActivateBoard(board.id),
      },
      h('span', { className: 'ec-board-row-icon' }, h(Icon, { name: isActive ? 'board' : 'layers', size: 14 })),
      h(
        'span',
        { className: 'ec-board-row-copy' },
        h('strong', null, board.title || t('Untitled canvas')),
        h('span', null, `${count} ${t(count === 1 ? 'task' : 'tasks')} · ${board.nodes.length} ${t('objects')}`),
      ),
      isActive ? h('span', { className: 'ec-board-row-dot' }) : null,
    )
  })
}

function StatRow({ label, value, color }) {
  return h(
    'div',
    { className: 'ec-stat-row' },
    h('span', { className: 'ec-stat-label' }, color ? h('span', { className: 'ec-status-dot', style: { '--status-color': color } }) : null, label),
    h('strong', null, value),
  )
}

/* Rich note detail: zoom transition, block editor, slash commands. */

const NOTE_COMMANDS = [
  { type: 'text', label: 'Text', group: 'Text', hint: 'T' },
  { type: 'heading1', label: 'Heading 1', group: 'Headings', hint: '#' },
  { type: 'heading2', label: 'Heading 2', group: 'Headings', hint: '##' },
  { type: 'heading3', label: 'Heading 3', group: 'Headings', hint: '###' },
  { type: 'bulleted', label: 'Bulleted list', group: 'Lists', hint: '-' },
  { type: 'numbered', label: 'Numbered list', group: 'Lists', hint: '1.' },
  { type: 'todo', label: 'To-do list', group: 'Lists', hint: '[ ]' },
  { type: 'quote', label: 'Quote', group: 'Blocks', hint: '>' },
  { type: 'code', label: 'Code', group: 'Blocks', hint: '```' },
  { type: 'math', label: 'Math block', group: 'Blocks', hint: '$' },
]

function NoteBlockGlyph({ type }) {
  if (type === 'heading1') return h('span', { className: 'ec-block-glyph' }, 'H1')
  if (type === 'heading2') return h('span', { className: 'ec-block-glyph' }, 'H2')
  if (type === 'heading3') return h('span', { className: 'ec-block-glyph' }, 'H3')
  if (type === 'bulleted') return h('span', { className: 'ec-block-glyph' }, '•')
  if (type === 'numbered') return h('span', { className: 'ec-block-glyph' }, '1.')
  if (type === 'todo') return h('span', { className: 'ec-block-glyph ec-block-glyph--todo' }, h(Icon, { name: 'check', size: 10 }))
  if (type === 'quote') return h('span', { className: 'ec-block-glyph' }, '”')
  if (type === 'code') return h('span', { className: 'ec-block-glyph ec-block-glyph--code' }, '</>')
  if (type === 'math') return h('span', { className: 'ec-block-glyph ec-block-glyph--math' }, 'ƒ')
  return h('span', { className: 'ec-block-glyph' }, 'T')
}

function notePanelGeometry(origin, bounds) {
  const viewportW = bounds?.w || window.innerWidth
  const viewportH = bounds?.h || window.innerHeight
  const width = Math.min(820, Math.max(280, viewportW - 48))
  const height = Math.min(800, Math.max(280, viewportH - 48))
  const cx = viewportW / 2
  const cy = viewportH / 2
  const ox = (origin?.x || 0) + (origin?.w || 0) / 2
  const oy = (origin?.y || 0) + (origin?.h || 0) / 2
  const sx = clamp((origin?.w || 40) / width, 0.04, 1)
  const sy = clamp((origin?.h || 40) / height, 0.04, 1)
  return {
    width,
    height,
    transform: `translate(${ox - cx}px, ${oy - cy}px) scale(${sx}, ${sy})`,
  }
}

function NoteDetail({ note, t, origin, bounds, onChange, onClose, onDuplicate, onDelete }) {
  const parsed = !Array.isArray(note.blocks) || note.blocks.length === 0 ? parseNoteText(note.text, note.title || 'Note') : null
  const blocks = parsed ? parsed.blocks : note.blocks
  const title = note.title || parsed?.title || ''
  const [focusBlockId, setFocusBlockId] = useState(() => blocks[0]?.id || null)
  const [slash, setSlash] = useState(null)
  const [slashIndex, setSlashIndex] = useState(0)
  const [entered, setEntered] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [geometry] = useState(() => notePanelGeometry(origin, bounds))
  const closingRef = useRef(false)
  const closeRef = useRef(null)
  const noteRef = useRef(note)
  noteRef.current = note

  function close() {
    if (closingRef.current) return
    closingRef.current = true
    setLeaving(true)
    setEntered(false)
    window.setTimeout(() => onClose(), 320)
  }
  closeRef.current = close

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setEntered(true))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (slash) {
          setSlash(null)
        } else {
          closeRef.current?.()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slash])

  const wordCount = `${title} ${blocks.map((block) => block.text).join(' ')}`.trim().split(/\s+/).filter(Boolean).length

  function setBlocks(next, options) {
    onChange({ blocks: next }, options)
  }

  function updateBlockText(blockId, text) {
    const next = blocks.map((block) => (block.id === blockId ? { ...block, text } : block))
    onChange({ blocks: next }, { coalesce: `note-block:${blockId}` })
    if (text.startsWith('/') && !text.includes('\n')) {
      setSlash({ blockId, query: text.slice(1) })
      setSlashIndex(0)
    } else if (slash?.blockId === blockId) {
      setSlash(null)
    }
  }

  function toggleTodo(blockId) {
    onChange(
      {
        blocks: blocks.map((block) => (block.id === blockId ? { ...block, checked: !block.checked } : block)),
      },
      { coalesce: `note-todo:${blockId}` },
    )
  }

  function insertBlock(afterId, options = {}) {
    const index = Math.max(0, blocks.findIndex((block) => block.id === afterId))
    const block = makeNoteBlock(options.type || 'text', options.text || '')
    const next = blocks.slice()
    next.splice(index + 1, 0, block)
    setBlocks(next)
    setFocusBlockId(block.id)
    setSlash(null)
    return block
  }

  function addBlock() {
    const last = blocks[blocks.length - 1]
    insertBlock(last ? last.id : null, { type: 'text' })
  }

  function removeBlock(blockId) {
    if (blocks.length <= 1) return
    const index = blocks.findIndex((block) => block.id === blockId)
    const next = blocks.filter((block) => block.id !== blockId)
    const previous = blocks[Math.max(0, index - 1)]
    setBlocks(next)
    setFocusBlockId(previous ? previous.id : null)
  }

  function handleBlockKeyDown(event, block, index) {
    if (slash?.blockId === block.id) {
      const commands = NOTE_COMMANDS.filter((command) =>
        `${command.label} ${command.group} ${command.type}`.toLowerCase().includes(slash.query.toLowerCase()),
      )
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSlashIndex((current) => Math.min(commands.length - 1, current + 1))
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSlashIndex((current) => Math.max(0, current - 1))
        return
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        const command = commands[slashIndex]
        if (command) applyCommand(block.id, command.type)
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        setSlash(null)
        return
      }
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      if (block.type === 'code' || block.type === 'math') return
      event.preventDefault()
      const position = event.currentTarget.selectionStart || 0
      const before = block.text.slice(0, position)
      const after = block.text.slice(position)
      const nextType = ['bulleted', 'numbered', 'todo'].includes(block.type) ? block.type : 'text'
      const nextBlock = makeNoteBlock(nextType, after)
      const next = blocks.map((item) => (item.id === block.id ? { ...item, text: before } : item))
      next.splice(index + 1, 0, nextBlock)
      setBlocks(next)
      setFocusBlockId(nextBlock.id)
      setSlash(null)
      return
    }
    if (event.key === 'Backspace' && block.text === '' && blocks.length > 1) {
      event.preventDefault()
      removeBlock(block.id)
    }
  }

  function applyCommand(blockId, type) {
    const block = blocks.find((item) => item.id === blockId)
    if (!block) return
    const cleaned = block.text.replace(/^\/[^\s]*\s?/, '')
    setBlocks(
      blocks.map((item) =>
        item.id === blockId ? { ...item, type, text: type === 'text' ? cleaned : cleaned, checked: false } : item,
      ),
    )
    setSlash(null)
    setFocusBlockId(blockId)
  }

  return h(
    'div',
    {
      className: `ec-note-focus ${entered && !leaving ? 'is-open' : ''}`,
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': t('Note editor'),
      onPointerDown: (event) => {
        if (event.target === event.currentTarget) close()
      },
    },
    h(
      'div',
      {
        className: 'ec-note-focus-panel',
        style: {
          width: geometry.width,
          height: geometry.height,
          transform: entered && !leaving ? 'translate(0, 0) scale(1)' : geometry.transform,
          opacity: entered && !leaving ? 1 : 0.25,
        },
        onPointerDown: stop,
      },
      h(
        'header',
        { className: 'ec-note-detail-head' },
        h(
          'button',
          { type: 'button', className: 'ec-note-back', onClick: close, 'aria-label': t('Back to canvas') },
          h(Icon, { name: 'arrowLeft', size: 16 }),
          h('span', null, t('Canvas')),
        ),
        h(
          'div',
          { className: 'ec-note-detail-heading' },
          h('span', { className: 'ec-eyebrow' }, t('Note')),
          h('span', null, `${blocks.length} ${t(blocks.length === 1 ? 'block' : 'blocks')}`),
        ),
        h(
          'div',
          { className: 'ec-note-detail-actions' },
          h(
            'div',
            { className: 'ec-note-colors', role: 'group', 'aria-label': t('Note color') },
            TONE_ORDER.map((tone) =>
              h(
                'button',
                {
                  key: tone,
                  type: 'button',
                  className: `ec-note-color ${note.tone === tone ? 'is-active' : ''}`,
                  style: { '--swatch': TONES[tone].color },
                  'aria-label': t(TONES[tone].label),
                  title: t(TONES[tone].label),
                  onClick: () => onChange({ tone }),
                },
              ),
            ),
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'ec-icon-btn',
              onClick: onDuplicate,
              title: t('Duplicate note'),
              'aria-label': t('Duplicate note'),
            },
            h(Icon, { name: 'copy', size: 15 }),
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'ec-icon-btn ec-note-delete',
              onClick: onDelete,
              title: t('Delete note'),
              'aria-label': t('Delete note'),
            },
            h(Icon, { name: 'trash', size: 15 }),
          ),
          h(
            'button',
            { type: 'button', className: 'ec-icon-btn', onClick: close, 'aria-label': t('Close note') },
            h(Icon, { name: 'close', size: 16 }),
          ),
        ),
      ),
      h(
        'div',
        { className: 'ec-note-detail-body' },
        h(
          'div',
          { className: 'ec-note-editor-inner' },
          h('input', {
            className: 'ec-note-detail-title',
            value: title,
            placeholder: t('Untitled note'),
            'aria-label': t('Note title'),
            onChange: (event) => onChange({ title: event.target.value }, { coalesce: `note-title:${note.id}` }),
          }),
          h(
            'div',
            { className: 'ec-note-detail-meta' },
            h('span', null, `${wordCount} ${t(wordCount === 1 ? 'word' : 'words')}`),
            h('span', { className: 'ec-foot-sep' }),
            h('span', null, t('Autosaved locally')),
          ),
          h(
            'div',
            { className: 'ec-note-blocks' },
            blocks.map((block, index) =>
              h(NoteBlockRow, {
                key: block.id,
                block,
                index,
                blocks,
                t,
                focusBlockId,
                setFocusBlockId,
                slash,
                slashIndex,
                setSlashIndex,
                onText: updateBlockText,
                onToggle: toggleTodo,
                onKeyDown: handleBlockKeyDown,
                onInsert: insertBlock,
                onRemove: removeBlock,
                onCommand: applyCommand,
              }),
            ),
          ),
          h(
            'button',
            { type: 'button', className: 'ec-note-add-block', onClick: addBlock },
            h(Icon, { name: 'plus', size: 14 }),
            t('Add block'),
          ),
          h(
            'div',
            { className: 'ec-note-editor-foot' },
            h('span', null, t('Type / at the start of a block to change its type.')),
            h('span', null, t('Esc to close')),
          ),
        ),
      ),
    ),
  )
}

function NoteBlockRow({
  block,
  index,
  blocks,
  t,
  focusBlockId,
  setFocusBlockId,
  slash,
  slashIndex,
  setSlashIndex,
  onText,
  onToggle,
  onKeyDown,
  onInsert,
  onRemove,
  onCommand,
}) {
  const textRef = useRef(null)
  const focusedRef = useRef(false)

  useEffect(() => {
    if (focusBlockId === block.id && textRef.current) {
      const node = textRef.current
      node.focus()
      node.setSelectionRange(node.value.length, node.value.length)
      setFocusBlockId(null)
    }
  }, [focusBlockId, block.id, setFocusBlockId])

  useLayoutEffect(() => {
    const node = textRef.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${Math.max(24, node.scrollHeight)}px`
  }, [block.text, block.type])

  const numbered = blocks.slice(0, index + 1).filter((item) => item.type === 'numbered').length
  const placeholder =
    block.type === 'heading1'
      ? t('Heading 1')
      : block.type === 'heading2'
        ? t('Heading 2')
        : block.type === 'heading3'
          ? t('Heading 3')
          : block.type === 'code'
            ? t('Code')
            : block.type === 'quote'
              ? t('Quote')
              : block.type === 'math'
                ? t('Math block')
                : t("Type '/' for commands")
  const commands = slash?.blockId === block.id
    ? NOTE_COMMANDS.filter((command) =>
        `${command.label} ${command.group} ${command.type}`.toLowerCase().includes((slash.query || '').toLowerCase()),
      )
    : []

  return h(
    'div',
    {
      className: `ec-note-block ec-note-block--${block.type} ${block.checked ? 'is-checked' : ''}`,
    },
    h(
      'div',
      { className: 'ec-note-block-gutter' },
      h(
        'button',
        {
          type: 'button',
          className: 'ec-note-block-plus',
          onClick: () => onInsert(block.id, { type: 'text' }),
          'aria-label': t('Add block below'),
          title: t('Add block below'),
        },
        h(Icon, { name: 'plus', size: 12 }),
      ),
      h('span', { className: 'ec-note-block-handle', 'aria-hidden': 'true' }, '⋮'),
    ),
    h(
      'div',
      { className: 'ec-note-block-prefix' },
      block.type === 'todo'
        ? h(
            'button',
            {
              type: 'button',
              className: `ec-note-todo-box ${block.checked ? 'is-checked' : ''}`,
              role: 'checkbox',
              'aria-checked': block.checked,
              'aria-label': block.text || t('To-do'),
              onClick: () => onToggle(block.id),
            },
            block.checked ? h(Icon, { name: 'check', size: 11 }) : null,
          )
        : block.type === 'bulleted'
          ? h('span', { className: 'ec-note-bullet' }, '•')
          : block.type === 'numbered'
            ? h('span', { className: 'ec-note-number' }, String(numbered))
            : block.type === 'quote'
              ? h('span', { className: 'ec-note-quote-mark' }, '”')
              : block.type === 'code'
                ? h('span', { className: 'ec-note-code-mark' }, '</>')
                : block.type === 'math'
                  ? h('span', { className: 'ec-note-math-mark' }, 'ƒ')
                  : null,
    ),
    h(
      'div',
      { className: 'ec-note-block-content' },
      h('textarea', {
        ref: textRef,
        className: 'ec-note-block-text',
        value: block.text,
        rows: 1,
        placeholder,
        'aria-label': t('Note block'),
        onChange: (event) => onText(block.id, event.target.value),
        onKeyDown: (event) => onKeyDown(event, block, index),
        onKeyUp: (event) => {
          if (event.key === 'Escape' && slash?.blockId === block.id) setSlashIndex(0)
        },
      }),
      commands.length
        ? h(NoteSlashMenu, {
            t,
            commands,
            index: clamp(slashIndex, 0, Math.max(0, commands.length - 1)),
            setIndex: setSlashIndex,
            onChoose: (command) => onCommand(block.id, command.type),
            onClose: () => setSlashIndex(0),
          })
        : null,
    ),
  )
}

function NoteSlashMenu({ t, commands, index, setIndex, onChoose }) {
  let lastGroup = null
  const rows = []
  commands.forEach((command, commandIndex) => {
    if (command.group !== lastGroup) {
      rows.push(h('div', { key: `group-${command.group}`, className: 'ec-note-command-group' }, t(command.group)))
      lastGroup = command.group
    }
    rows.push(
      h(
        'button',
        {
          key: command.type,
          type: 'button',
          className: `ec-note-command ${index === commandIndex ? 'is-active' : ''}`,
          onMouseDown: (event) => event.preventDefault(),
          onMouseEnter: () => setIndex(commandIndex),
          onClick: () => onChoose(command),
        },
        h('span', { className: 'ec-note-command-icon' }, h(NoteBlockGlyph, { type: command.type })),
        h('span', { className: 'ec-note-command-label' }, t(command.label)),
        h('kbd', null, command.hint),
      ),
    )
  })
  return h(
    'div',
    {
      className: 'ec-note-slash',
      role: 'menu',
      'aria-label': t('Block types'),
      onPointerDown: stop,
    },
    h('div', { className: 'ec-note-slash-head' }, t('Turn into')),
    h('div', { className: 'ec-note-slash-list' }, rows),
    h('div', { className: 'ec-note-slash-foot' }, t('↑↓ navigate  ·  ↵ choose  ·  esc close')),
  )
}

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

/* Host-visible label, Chinese copy, and slot registration. */

const EN = {}
const ZH = {
  'Engineering Canvas': '工程画布',
  'New': '新建',
  'Export': '导出',
  'Export board': '导出画板',
  'PNG image': 'PNG 图片',
  'JSON backup': 'JSON 备份',
  'Markdown snapshot': 'Markdown 快照',
  'Saved': '已保存',
  'Saving…': '保存中…',
  'Save failed': '保存失败',
  'Could not save this board locally': '无法在本地保存此画板',
  'Board title': '画板标题',
  'Find tasks, notes, people…': '搜索任务、便签、成员…',
  'Find tasks, notes, people': '搜索任务、便签、成员',
  'Clear search': '清除搜索',
  'Undo': '撤销',
  'Redo': '重做',
  'Undid last change': '已撤销上一步',
  'Redid change': '已重做',
  'Board menu': '画板菜单',
  'Board overview': '画板概览',
  'Sprint health': '冲刺健康度',
  'complete': '完成',
  'Tasks': '任务',
  'In progress': '进行中',
  'Blocked': '受阻',
  'Done': '已完成',
  'Backlog': '待办池',
  'To do': '待开始',
  'Work by status': '按状态分布',
  'Clear status filter': '清除状态筛选',
  'Boards': '画板',
  'New board': '新建画板',
  'New board from template': '从模板新建画板',
  'Start something': '开始创作',
  'Sprint board': '冲刺画板',
  'Service map': '服务地图',
  'Incident command': '事故指挥',
  'Blank canvas': '空白画布',
  'Start blank': '从空白开始',
  'Process flow': '流程图',
  'Process, condition, input/output, document, and data-store shapes.': '流程、条件、输入/输出、文档和数据存储等图形。',
  'Start from a template, or a clean canvas.': '从模板开始，或从一张空白画布开始。',
  'Shape selected': '已选择图形',
  'Process': '流程',
  'Condition': '条件',
  'Start / End': '开始 / 结束',
  'Input / Output': '输入 / 输出',
  'Document': '文档',
  'Data store': '数据存储',
  'Subprocess': '子流程',
  'Manual input': '手动输入',
  'Diagram shapes': '图形库',
  'Choose a shape': '选择图形',
  'Pick a shape, then click the canvas.': '选择图形，然后在画布上点击。',
  'Close shapes': '关闭图形库',
  'Shape type': '图形类型',
  'Shape label': '图形标签',
  'Group': '编组',
  'Group name': '编组名称',
  'Group selection': '编组所选内容',
  'Ungroup': '取消编组',
  'Ungroup selection': '取消所选编组',
  'Ungrouped': '已取消编组',
  'Grouped': '已编组',
  'components': '个组件',
  'Selected as one unit': '作为一个整体选中',
  'Alt-click a component to select it alone.': '按住 Option 点击组件可单独选中。',
  'Select one inside group': '选中组内单个组件',
  'Select at least two components to group': '请至少选择两个组件进行编组',
  'Select a group first': '请先选择一个编组',
  'Duplicate group': '复制编组',
  'Delete group': '删除编组',
  'Resize group': '调整编组大小',
  'Add diagram shape': '添加图形',
  'Every board autosaves locally. Export any time.': '每个画板都会自动保存在本地，可随时导出。',
  'Keyboard shortcuts': '键盘快捷键',
  'Reference': '参考',
  'Tools': '工具',
  'Canvas': '画布',
  'Edit': '编辑',
  'Select': '选择',
  'Pan': '平移',
  'Task card': '任务卡',
  'Sticky note': '便签',
  'Text': '文本',
  'Shape': '形状',
  'Frame': '画框',
  'Connect': '连接',
  'Draw': '绘制',
  'Eraser': '橡皮擦',
  'Pan': '平移',
  'Zoom': '缩放',
  'Fit canvas': '适应画布',
  'Create text': '创建文本',
  'Duplicate': '复制',
  'Select all': '全选',
  'Delete selection': '删除所选',
  'Edit selected': '编辑所选',
  'Command palette': '命令面板',
  'Tip: hold Space to pan from anywhere.': '提示：按住空格键即可在任意位置平移。',
  'Done': '完成',
  'Cancel': '取消',
  'Delete this board?': '删除此画板？',
  'This permanently removes': '这将永久删除',
  'and everything on it.': '及其所有内容。',
  'Delete board': '删除画板',
  'Keep at least one board': '至少保留一个画板',
  'Board deleted': '画板已删除',
  'Board created': '画板已创建',
  'Board duplicated': '画板已复制',
  'Board imported': '画板已导入',
  'boards imported': '个画板已导入',
  'board imported': '个画板已导入',
  'That file is not a canvas backup': '该文件不是画布备份',
  'That file is not valid JSON': '该文件不是有效的 JSON',
  'JSON exported': 'JSON 已导出',
  'Markdown exported': 'Markdown 已导出',
  'PNG exported': 'PNG 已导出',
  'Could not export the image': '无法导出图片',
  'Delete': '删除',
  'Deleted': '已删除',
  'Duplicated': '已复制',
  'Connected': '已连接',
  'Node': '节点',
  'Focus on canvas': '在画布中聚焦',
  'Inspector': '检查器',
  'Task': '任务',
  'Note': '便签',
  'Note editor': '便签编辑器',
  'Open note editor': '打开便签编辑器',
  'Back to canvas': '返回画布',
  'Note color': '便签颜色',
  'Duplicate note': '复制便签',
  'Delete note': '删除便签',
  'Close note': '关闭便签',
  'Untitled note': '未命名便签',
  'Note title': '便签标题',
  'block': '块',
  'blocks': '块',
  'word': '字',
  'words': '字',
  'Add block': '添加块',
  'Add block below': '在下方添加块',
  'Type / at the start of a block to change its type.': '在块开头输入 / 可更改块类型。',
  'Esc to close': '按 Esc 关闭',
  "Type '/' for commands": "输入 / 查看命令",
  'Heading 1': '标题 1',
  'Heading 2': '标题 2',
  'Heading 3': '标题 3',
  'Bulleted list': '无序列表',
  'Numbered list': '有序列表',
  'To-do list': '待办列表',
  'To-do': '待办',
  'Quote': '引用',
  'Code': '代码',
  'Math block': '数学块',
  'Block types': '块类型',
  'Turn into': '转换为',
  'Note block': '便签块',
  '↑↓ navigate  ·  ↵ choose  ·  esc close': '↑↓ 选择  ·  ↵ 确认  ·  esc 关闭',
  'Drawing': '绘制',
  'Selection': '所选内容',
  'Multiple selection': '多选',
  'Untitled': '未命名',
  'Untitled task': '未命名任务',
  'Untitled canvas': '未命名画布',
  'Task title': '任务标题',
  'Description': '描述',
  'Add context, acceptance criteria, links…': '补充背景、验收标准、链接…',
  'Status': '状态',
  'Priority': '优先级',
  'Details': '详情',
  'Assignee': '负责人',
  'Unassigned': '未指派',
  'Due': '截止',
  'Estimate': '估时',
  'Tags': '标签',
  'Checklist': '检查清单',
  'Subtask': '子任务',
  'Remove subtask': '删除子任务',
  'Add subtask': '添加子任务',
  'Dependencies': '依赖关系',
  'Blocked by': '被阻塞于',
  'Blocks': '阻塞',
  'Draw a connector between two cards to record a dependency.': '在两卡片之间绘制连接以记录依赖关系。',
  'Delete task': '删除任务',
  'Relationship label': '关系标签',
  'Dashed line': '虚线',
  'Anchors': '锚点',
  'Start side': '起点方向',
  'End side': '终点方向',
  'Reverse direction': '反转方向',
  'Delete connection': '删除连接',
  'Connection': '连接',
  'Dependency': '依赖',
  'From': '从',
  'To': '到',
  'Missing': '缺失',
  'Auto': '自动',
  'Top': '上',
  'Right': '右',
  'Bottom': '下',
  'Left': '左',
  'Title': '标题',
  'Subtitle': '副标题',
  'Optional context': '可选说明',
  'Width': '宽度',
  'Height': '高度',
  'Size': '字号',
  'Weight': '粗细',
  'Regular': '常规',
  'Medium': '中等',
  'Semibold': '半粗',
  'Bold': '加粗',
  'Rectangle': '矩形',
  'Ellipse': '椭圆',
  'Diamond': '菱形',
  'Freehand stroke. Adjust its color or weight, then keep sketching.': '自由笔迹。可调整颜色或粗细后继续绘制。',
  'Color': '颜色',
  'Amber': '琥珀',
  'Blue': '蓝色',
  'Rose': '玫红',
  'Slate': '石板灰',
  'Green': '绿色',
  'Align': '对齐',
  'Center': '居中',
  'Middle': '垂直居中',
  'Distribute horizontally': '水平分布',
  'Distribute vertically': '垂直分布',
  'Bring to front': '置于顶层',
  'Send to back': '置于底层',
  'Duplicate selection': '复制所选',
  'Multiple selection': '多选',
  'selected': '已选',
  'objects': '个对象',
  'task': '个任务',
  'tasks': '个任务',
  'subtask': '个子任务',
  'subtasks': '个子任务',
  'Add a checklist to track progress': '添加检查清单以跟踪进度',
  'Drop cards here': '将卡片拖到这里',
  'Type something': '输入内容',
  'Drag a card into another lane to change its status. Drag from a card port to draw a dependency.': '将卡片拖入其他泳道即可更改状态；从卡片连接点拖出即可绘制依赖。',
  'Autosaved locally': '已自动保存到本地',
  'Shortcuts': '快捷键',
  'Drag on the canvas to place a frame': '在画布上拖拽以放置画框',
  'Add task': '添加任务',
  'Add sticky note': '添加便签',
  'Add frame': '添加画框',
  'Fit canvas to view': '缩放至全览',
  'Zoom to 100%': '缩放至 100%',
  'Export as PNG': '导出为 PNG',
  'Export as JSON': '导出为 JSON',
  'Export as Markdown': '导出为 Markdown',
  'Go to task': '跳转到任务',
  'Search commands or jump to a task…': '搜索命令或跳转到任务…',
  'No matches': '没有匹配项',
  'to navigate': '导航',
  'to run': '执行',
  'Clear filters': '清除筛选',
  'matching task': '个匹配任务',
  'matching tasks': '个匹配任务',
  'Your canvas is blank': '画布还是空的',
  'Start with a task, sketch the system, or open a sprint template.': '从一个任务开始，绘制系统草图，或打开冲刺模板。',
  'Add a task': '添加任务',
  'Browse templates': '浏览模板',
  'Dismiss hint': '关闭提示',
  'Space': '空格',
  '+ drag to pan': '+ 拖拽平移',
  'Scroll': '滚动',
  'to zoom': '缩放',
  'Double-click': '双击',
  'to edit': '编辑',
  'Overview': '概览',
  'Fit canvas': '适应画布',
  'Zoom in': '放大',
  'Zoom out': '缩小',
  'Hide inspector': '隐藏检查器',
  'Show inspector': '显示检查器',
  'Reset to 100%': '重置为 100%',
  'Shortcuts': '快捷键',
  'Canvas tools': '画布工具',
  'Import canvas': '导入画布',
  'Undo': '撤销',
  'Redo': '重做',
  'Copy': '复制',
  'New': '新建',
  'tasks done': '个任务已完成',
  'done': '已完成',
  'Board': '画板',
  'Drag to connect': '拖拽以连接',
  'Resize': '调整大小',
  'Create': '创建',
  'View': '视图',
  'Board': '画板',
  'Help': '帮助',
  'Delete board': '删除画板',
}

function EngineeringCanvasIcon({ size = 20, active = false }) {
  return h(
    'span',
    {
      className: `ec-sidebar-glyph ${active ? 'is-active' : ''}`,
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    },
    h(BrandGlyph, { size }),
  )
}

function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { en: EN, zh: ZH }), 'engineering-canvas: dictionaries')
  const t = ctx.locale.bind(NS)
  ctx.slots.inject('main', () =>
    ctx.slots.register(
      {
        name: 'main',
        key: PANEL_ID,
        locale: NS,
      },
      EngineeringCanvas,
    ),
  )
  ctx.slots.inject('sidebar.panellist', () =>
    ctx.slots.register(
      {
        name: 'sidebar.panellist',
        id: PANEL_ID,
        order: 20,
        locale: NS,
        label: () => t('Engineering Canvas'),
      },
      EngineeringCanvasIcon,
    ),
  )
}

    return { inject: ['slots', 'locale'], apply }
  },
})
