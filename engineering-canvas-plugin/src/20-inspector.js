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
