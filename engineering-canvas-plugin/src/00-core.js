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
