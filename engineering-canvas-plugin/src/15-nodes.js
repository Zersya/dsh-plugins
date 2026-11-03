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
