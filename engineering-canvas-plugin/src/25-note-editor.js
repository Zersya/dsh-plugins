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
