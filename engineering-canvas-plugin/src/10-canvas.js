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
