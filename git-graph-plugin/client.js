window.__ModuleLoader__.load({
  id: '@local/git-graph',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useMemo, useCallback, useRef } = React

    /* ---------------------------------------------------------------- */
    /* Constants                                                        */
    /* ---------------------------------------------------------------- */

    const NS = 'git.graph'
    const VIEW_ID = 'git-graph'
    const API = 'git-graph'
    const ROW = 44
    const LANE = 14
    const PAD = 20
    const REFRESH_MS = 20000

    const LANE_COLORS = [
      '#4f7cf7',
      '#e8830c',
      '#2f9e63',
      '#df5f7c',
      '#8b5cf6',
      '#0e95b5',
      '#b7791f',
      '#7c8899',
    ]

    const EN = {
      'Git Graph': 'Git Graph',
      'History for this conversation, in its own working directory. Read-only.':
        'History for this conversation, in its own working directory. Read-only.',
      'Git': 'Git',
      'Refresh': 'Refresh',
      'No workspace': 'No workspace',
      '{n} commits': '{n} commits',
      '{n} branches': '{n} branches',
      '{n} tags': '{n} tags',
      '{n} changes': '{n} changes',
      'Working tree clean': 'Working tree clean',
      '{n} ahead': '{n} ahead',
      '{n} behind': '{n} behind',
      'detached HEAD': 'detached HEAD',
      'Uncommitted changes': 'Uncommitted changes',
      'Not a Git repository': 'Not a Git repository',
      'This conversation is not working inside a Git repository, so there is no history to draw.':
        'This conversation is not working inside a Git repository, so there is no history to draw.',
      'Run {cmd} in this directory, then refresh.': 'Run {cmd} in this directory, then refresh.',
      'No commits yet': 'No commits yet',
      'Files staged or modified here will appear under Changes until the first commit is made.': 'Files staged or modified here will appear under Changes until the first commit is made.',
      'Loading history…': 'Loading history…',
      'Could not read Git history': 'Could not read Git history',
      'Try again': 'Try again',
      'Copy': 'Copy',
      'Copied': 'Copied',
      'Commit': 'Commit',
      'Changes': 'Changes',
      'Author': 'Author',
      'Committed': 'Committed',
      'Parents': 'Parents',
      'Message': 'Message',
      'Files changed': 'Files changed',
      '{n} files': '{n} files',
      'No file changes recorded.': 'No file changes recorded.',
      'Select a commit to see its message and files.': 'Select a commit to see its message and files.',
      'Search commits, authors, or SHAs': 'Search commits, authors, or SHAs',
      'No commits match this search.': 'No commits match this search.',
      'No conversation is selected.': 'No conversation is selected.',
      '(no message)': '(no message)',
      'History': 'History',
      'Root commit': 'Root commit',
      'Head': 'HEAD',
      'untracked': 'untracked',
      'staged': 'staged',
      'modified': 'modified',
      'Graph': 'Graph',
      'Show changes': 'Show changes',
      'Show commit': 'Show commit',
    }

    const ZH = {
      'Git Graph': 'Git 图谱',
      'History for this conversation, in its own working directory. Read-only.':
        '该对话所在目录的历史，只读查看。',
      'Git': 'Git',
      'Refresh': '刷新',
      'No workspace': '无工作区',
      '{n} commits': '{n} 次提交',
      '{n} branches': '{n} 个分支',
      '{n} tags': '{n} 个标签',
      '{n} changes': '{n} 处改动',
      'Working tree clean': '工作区干净',
      '{n} ahead': '领先 {n}',
      '{n} behind': '落后 {n}',
      'detached HEAD': '游离 HEAD',
      'Uncommitted changes': '未提交的改动',
      'Not a Git repository': '不是 Git 仓库',
      'This conversation is not working inside a Git repository, so there is no history to draw.':
        '该对话不在 Git 仓库中工作，因此没有可绘制的历史。',
      'Run {cmd} in this directory, then refresh.': '在此目录运行 {cmd}，然后刷新。',
      'No commits yet': '还没有提交',
      'Files staged or modified here will appear under Changes until the first commit is made.': '在首次提交前，暂存或修改的文件会显示在“改动”中。',
      'Loading history…': '正在加载历史…',
      'Could not read Git history': '无法读取 Git 历史',
      'Try again': '重试',
      'Copy': '复制',
      'Copied': '已复制',
      'Commit': '提交',
      'Changes': '改动',
      'Author': '作者',
      'Committed': '提交时间',
      'Parents': '父提交',
      'Message': '提交信息',
      'Files changed': '变更文件',
      '{n} files': '{n} 个文件',
      'No file changes recorded.': '没有记录文件改动。',
      'Select a commit to see its message and files.': '选择一个提交以查看其信息与文件。',
      'Search commits, authors, or SHAs': '搜索提交、作者或 SHA',
      'No commits match this search.': '没有匹配的提交。',
      'No conversation is selected.': '没有选中的对话。',
      '(no message)': '（无提交信息）',
      'History': '历史',
      'Root commit': '根提交',
      'Head': 'HEAD',
      'untracked': '未跟踪',
      'staged': '已暂存',
      'modified': '已修改',
      'Graph': '图谱',
      'Show changes': '查看改动',
      'Show commit': '查看提交',
    }

    /* ---------------------------------------------------------------- */
    /* Icons                                                            */
    /* ---------------------------------------------------------------- */

    const ICONS = {
      graph: [
        ['circle', { cx: 6, cy: 6, r: 2.2 }],
        ['circle', { cx: 6, cy: 18, r: 2.2 }],
        ['circle', { cx: 18, cy: 9, r: 2.2 }],
        ['path', { d: 'M6 8.2v7.6' }],
        ['path', { d: 'M18 11.2c0 3.1-2.6 5.1-5.6 5.4' }],
      ],
      branch: [
        ['circle', { cx: 6, cy: 5, r: 2.2 }],
        ['circle', { cx: 6, cy: 19, r: 2.2 }],
        ['circle', { cx: 18, cy: 8, r: 2.2 }],
        ['path', { d: 'M6 7.2v9.6' }],
        ['path', { d: 'M18 10.2c0 3.4-2.4 5.6-5.6 6.2' }],
      ],
      tag: [
        ['path', { d: 'M4 4h7l9 9-7 7-9-9V4z' }],
        ['circle', { cx: 8.5, cy: 8.5, r: 1.4 }],
      ],
      refresh: [
        ['path', { d: 'M20 11a8 8 0 1 0-.7 4.6' }],
        ['path', { d: 'M20 5v6h-6' }],
      ],
      alert: [
        ['path', { d: 'M12 4.5 21 20H3l9-15.5z' }],
        ['path', { d: 'M12 10v4.5' }],
        ['circle', { cx: 12, cy: 17.4, r: 0.9, fill: 'currentColor', stroke: 'none' }],
      ],
      copy: [
        ['rect', { x: 9, y: 9, width: 11, height: 11, rx: 2.4 }],
        ['path', { d: 'M15 6.5A2.5 2.5 0 0 0 12.5 4H6.4A2.4 2.4 0 0 0 4 6.4v6.1A2.5 2.5 0 0 0 6.5 15' }],
      ],
      check: [['path', { d: 'M5 12.5 9.5 17 19 7' }]],
      search: [
        ['circle', { cx: 10.5, cy: 10.5, r: 6 }],
        ['path', { d: 'm15 15 4.5 4.5' }],
      ],
      folder: [
        ['path', { d: 'M3.5 7.5A2 2 0 0 1 5.5 5.5h4l2 2.4h7a2 2 0 0 1 2 2v7.6a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7.5z' }],
      ],
      commit: [
        ['circle', { cx: 12, cy: 12, r: 4 }],
        ['path', { d: 'M2.5 12h5.4M16.1 12h5.4' }],
      ],
    }

    function Icon({ name, size = 16, strokeWidth = 1.6 }) {
      const shapes = ICONS[name] || []
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
          'aria-hidden': 'true',
          focusable: 'false',
        },
        shapes.map(([tag, props], index) => h(tag, { key: index, ...props })),
      )
    }

    /* ---------------------------------------------------------------- */
    /* Formatting helpers                                               */
    /* ---------------------------------------------------------------- */

    const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
    const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

    function relativeTime(ms) {
      const diff = ms - Date.now()
      const abs = Math.abs(diff)
      const units = [
        ['year', 31536000000],
        ['month', 2592000000],
        ['week', 604800000],
        ['day', 86400000],
        ['hour', 3600000],
        ['minute', 60000],
      ]
      for (const [unit, size] of units) {
        if (abs >= size) return relativeFormatter.format(Math.round(diff / size), unit)
      }
      return relativeFormatter.format(0, 'second')
    }

    function absoluteTime(ms) {
      try {
        return dateFormatter.format(new Date(ms))
      } catch {
        return ''
      }
    }

    function initials(name) {
      return String(name || '?')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    }

    function shortOid(oid) {
      return String(oid || '').slice(0, 7)
    }

    function classifyRef(ref) {
      if (ref === 'HEAD') return { kind: 'head', label: 'HEAD' }
      if (ref.startsWith('HEAD -> ')) return { kind: 'head', label: ref.slice(8) }
      if (ref.startsWith('tag: ')) return { kind: 'tag', label: ref.slice(5) }
      if (ref.includes('/')) return { kind: 'remote', label: ref }
      return { kind: 'branch', label: ref }
    }

    const STATUS_TONE = {
      A: 'add',
      M: 'mod',
      D: 'del',
      R: 'ren',
      C: 'ren',
      T: 'mod',
      U: 'con',
      '?': 'new',
    }

    function changeTone(change) {
      if (change.conflicted) return 'con'
      if (change.untracked) return 'new'
      const code = change.y && change.y !== '.' ? change.y : change.x
      return STATUS_TONE[code] || 'mod'
    }

    function changeLabel(change) {
      if (change.conflicted) return 'U'
      if (change.untracked) return '?'
      if (change.renamed) return 'R'
      const code = change.y && change.y !== '.' ? change.y : change.x
      return code && code !== '.' ? code : 'M'
    }

    /* ---------------------------------------------------------------- */
    /* Data access                                                      */
    /* ---------------------------------------------------------------- */

    /** Localised sentence with one React node swapped into a `{key}` slot. */
    function fillText(template, key, node) {
      const parts = String(template).split(`{${key}}`)
      const children = parts.flatMap((part, index) => (index === 0 ? [part] : [node, part])).filter((value) => value !== '')
      return h('span', null, ...children)
    }

    function endpoint(name, params) {
      const url = new URL(`${API}/${name}`, document.baseURI)
      for (const [key, value] of Object.entries(params || {})) {
        if (value === undefined || value === null || value === '') continue
        url.searchParams.set(key, String(value))
      }
      return url.toString()
    }

    async function getJson(url, signal) {
      const response = await fetch(url, {
        signal,
        credentials: 'same-origin',
        headers: { accept: 'application/json' },
      })
      const type = response.headers.get('content-type') || ''
      const text = await response.text()
      if (!type.includes('application/json')) {
        throw new Error('The Git Graph host service is not available yet. Reload the page once the plugin is running.')
      }
      let payload
      try {
        payload = JSON.parse(text)
      } catch {
        throw new Error('The Git Graph host service returned an unreadable response.')
      }
      if (!response.ok) throw new Error(payload && payload.message ? payload.message : `Request failed (${response.status})`)
      return payload
    }

    /* ---------------------------------------------------------------- */
    /* Graph layout                                                     */
    /* ---------------------------------------------------------------- */

    function laneX(lane) {
      return PAD + lane * LANE
    }

    function laneColor(lane) {
      return LANE_COLORS[lane % LANE_COLORS.length]
    }

    function curve(x1, y1, x2, y2) {
      const mid = y1 + (y2 - y1) / 2
      return `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`
    }

    function layoutGraph(commits) {
      const lanes = []
      const rows = []

      for (const commit of commits) {
        const before = lanes.slice()
        let lane = lanes.indexOf(commit.oid)
        if (lane === -1) {
          lane = lanes.indexOf(null)
          if (lane === -1) {
            lanes.push(commit.oid)
            lane = lanes.length - 1
          } else {
            lanes[lane] = commit.oid
          }
        }
        for (let index = 0; index < lanes.length; index += 1) {
          if (index !== lane && lanes[index] === commit.oid) lanes[index] = null
        }

        const parents = (commit.parents || []).filter(Boolean)
        const parentLanes = []
        if (parents.length > 0) {
          let firstLane = lanes.findIndex((waiting, index) => index !== lane && waiting === parents[0])
          if (firstLane !== -1) {
            lanes[lane] = null
          } else {
            lanes[lane] = parents[0]
            firstLane = lane
          }
          parentLanes.push(firstLane)
          for (let index = 1; index < parents.length; index += 1) {
            const existing = lanes.indexOf(parents[index])
            if (existing !== -1) {
              parentLanes.push(existing)
              continue
            }
            let free = lanes.indexOf(null)
            if (free === -1) {
              lanes.push(parents[index])
              free = lanes.length - 1
            } else {
              lanes[free] = parents[index]
            }
            parentLanes.push(free)
          }
        } else {
          lanes[lane] = null
        }

        rows.push({ commit, lane, before, after: lanes.slice(), parentLanes, parents })
      }

      let laneCount = 1
      for (const row of rows) laneCount = Math.max(laneCount, row.before.length, row.after.length, row.lane + 1)

      const edges = []
      const nodes = []
      rows.forEach((row, index) => {
        const yTop = index * ROW
        const yMid = yTop + ROW / 2
        const yBottom = yTop + ROW

        row.before.forEach((waiting, lane) => {
          if (!waiting) return
          const x = laneX(lane)
          if (waiting === row.commit.oid) {
            const target = laneX(row.lane)
            edges.push({
              key: `in-${index}-${lane}`,
              d: target === x ? `M ${x} ${yTop} L ${x} ${yMid}` : curve(x, yTop, target, yMid),
              color: laneColor(lane),
              opacity: 0.95,
            })
          } else {
            edges.push({ key: `pass-${index}-${lane}`, d: `M ${x} ${yTop} L ${x} ${yBottom}`, color: laneColor(lane), opacity: 0.62 })
          }
        })

        row.parents.forEach((parent, parentIndex) => {
          const targetLane = row.parentLanes[parentIndex]
          if (targetLane === undefined) return
          const x1 = laneX(row.lane)
          const x2 = laneX(targetLane)
          edges.push({
            key: `out-${index}-${parentIndex}`,
            d: x1 === x2 ? `M ${x1} ${yMid} L ${x2} ${yBottom}` : curve(x1, yMid, x2, yBottom),
            color: laneColor(targetLane),
            opacity: 0.95,
          })
        })

        nodes.push({
          key: row.commit.oid,
          x: laneX(row.lane),
          y: yMid,
          color: laneColor(row.lane),
          merge: row.parents.length > 1,
          root: row.parents.length === 0,
        })
      })

      return { rows, laneCount, edges, nodes, height: rows.length * ROW }
    }

    /* ---------------------------------------------------------------- */
    /* Panel                                                            */
    /* ---------------------------------------------------------------- */

    function GitGraphPanel({ t, sessionId }) {
      const [data, setData] = useState(null)
      const [phase, setPhase] = useState('loading')
      const [error, setError] = useState(null)
      const [reloadToken, setReloadToken] = useState(0)
      const [selected, setSelected] = useState(null)
      const [detail, setDetail] = useState(null)
      const [detailPhase, setDetailPhase] = useState('idle')
      const [mode, setMode] = useState('commit')
      const [query, setQuery] = useState('')
      const [copied, setCopied] = useState(false)
      const copyTimer = useRef(0)
      const hasData = useRef(false)
      const loadedSession = useRef(null)

      const tx = useCallback(
        (key, vars) => {
          let value = t(key)
          if (vars) {
            for (const [name, replacement] of Object.entries(vars)) {
              value = value.split(`{${name}}`).join(String(replacement))
            }
          }
          return value
        },
        [t],
      )

      const repo = data && data.repo ? data.repo : null
      const commits = (repo && repo.commits) || []
      const changes = (repo && repo.changes) || []

      /* ----- state loading ----- */
      useEffect(() => {
        if (!sessionId) {
          setPhase('error')
          setError(t('No conversation is selected.'))
          return undefined
        }
        if (loadedSession.current !== sessionId) {
          loadedSession.current = sessionId
          hasData.current = false
          setData(null)
          setSelected(null)
          setDetail(null)
          setQuery('')
        }
        const controller = new AbortController()
        let alive = true
        if (!hasData.current) {
          setPhase('loading')
          setError(null)
        }
        getJson(endpoint('state', { session: sessionId }), controller.signal)
          .then((payload) => {
            if (!alive) return
            hasData.current = true
            setData(payload)
            setPhase('ready')
            setError(null)
            setSelected((current) => {
              const list = (payload.repo && payload.repo.commits) || []
              if (current && list.some((commit) => commit.oid === current)) return current
              return list.length > 0 ? list[0].oid : null
            })
          })
          .catch((failure) => {
            if (!alive || controller.signal.aborted) return
            setError(failure.message || String(failure))
            setPhase('error')
          })
        return () => {
          alive = false
          controller.abort()
        }
      }, [sessionId, reloadToken])

      /* ----- refresh on focus and on a slow interval ----- */
      useEffect(() => {
        const refresh = () => {
          if (document.visibilityState === 'visible') setReloadToken((value) => value + 1)
        }
        const timer = window.setInterval(refresh, REFRESH_MS)
        window.addEventListener('focus', refresh)
        return () => {
          window.clearInterval(timer)
          window.removeEventListener('focus', refresh)
        }
      }, [])

      /* ----- commit detail ----- */
      useEffect(() => {
        if (!selected || mode !== 'commit' || !data) {
          if (!selected) {
            setDetail(null)
            setDetailPhase('idle')
          } else if (mode !== 'commit') {
            setDetailPhase('idle')
          }
          return undefined
        }
        const controller = new AbortController()
        let alive = true
        setDetailPhase('loading')
        getJson(endpoint('commit', { session: sessionId, oid: selected }), controller.signal)
          .then((payload) => {
            if (!alive) return
            if (payload && payload.error) {
              setDetail(null)
              setDetailPhase('error')
              return
            }
            setDetail(payload)
            setDetailPhase('ready')
          })
          .catch(() => {
            if (alive) setDetailPhase('error')
          })
        return () => {
          alive = false
          controller.abort()
        }
      }, [selected, mode, sessionId])

      useEffect(() => () => window.clearTimeout(copyTimer.current), [])

      const copy = useCallback((value) => {
        const fallback = () => {
          setCopied(true)
          window.clearTimeout(copyTimer.current)
          copyTimer.current = window.setTimeout(() => setCopied(false), 1400)
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(value).then(fallback, fallback)
        } else {
          fallback()
        }
      }, [])

      const refresh = useCallback(() => setReloadToken((value) => value + 1), [])

      const selectCommit = useCallback((oid) => {
        setSelected(oid)
        setMode('commit')
      }, [])

      const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase()
        if (!needle) return commits
        return commits.filter((commit) => {
          return (
            commit.subject.toLowerCase().includes(needle) ||
            commit.author.name.toLowerCase().includes(needle) ||
            commit.author.email.toLowerCase().includes(needle) ||
            commit.oid.startsWith(needle)
          )
        })
      }, [commits, query])

      const graph = useMemo(() => layoutGraph(filtered), [filtered])
      const graphWidth = Math.max(58, laneX(graph.laneCount - 1) + 24)
      const headOid = repo && repo.head ? repo.head.oid : null
      const detailByOid = useMemo(() => {
        const map = new Map()
        for (const commit of commits) map.set(commit.oid, commit)
        return map
      }, [commits])

      /* ----- header ----- */
      const header = h(
        'header',
        { className: 'gg-head' },
        h(
          'div',
          { className: 'gg-head-row' },
          h('span', { className: 'gg-mark' }, h(Icon, { name: 'graph', size: 17 })),
          h(
            'div',
            { className: 'gg-titles' },
            h('h1', { className: 'gg-title' }, t('Git Graph')),
            h(
              'div',
              { className: 'gg-sub' },
              h('span', { className: 'gg-sub-title' }, t('History for this conversation, in its own working directory. Read-only.')),
              repo && repo.path
                ? h('code', { className: 'gg-path', title: repo.path }, repo.path)
                : null,
            ),
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'gg-btn gg-icon-btn',
              onClick: refresh,
              title: t('Refresh'),
              'aria-label': t('Refresh'),
            },
            h(Icon, { name: 'refresh', size: 15 }),
          ),
        ),
        repo && repo.exists
          ? h(
              'div',
              { className: 'gg-chips' },
              h(
                'span',
                { className: 'gg-chip is-branch', title: repo.head && repo.head.detached ? t('detached HEAD') : '' },
                h(Icon, { name: 'branch', size: 12, strokeWidth: 1.9 }),
                repo.head && repo.head.detached
                  ? t('detached HEAD')
                  : (repo.head && repo.head.branch) || shortOid(headOid),
              ),
              repo.head && repo.head.ahead > 0
                ? h('span', { className: 'gg-chip' }, tx('{n} ahead', { n: repo.head.ahead }))
                : null,
              repo.head && repo.head.behind > 0
                ? h('span', { className: 'gg-chip' }, tx('{n} behind', { n: repo.head.behind }))
                : null,
              h(
                'button',
                {
                  type: 'button',
                  className: `gg-chip is-action${changes.length > 0 ? ' is-warn' : ''}${mode === 'changes' ? ' is-on' : ''}`,
                  onClick: () => setMode(mode === 'changes' ? 'commit' : 'changes'),
                  title: t('Show changes'),
                },
                h(Icon, { name: 'alert', size: 12, strokeWidth: 1.8 }),
                changes.length > 0 ? tx('{n} changes', { n: changes.length }) : t('Working tree clean'),
              ),
              h('span', { className: 'gg-chip is-quiet' }, tx('{n} commits', { n: commits.length })),
              repo.counts && repo.counts.branches > 0
                ? h('span', { className: 'gg-chip is-quiet' }, tx('{n} branches', { n: repo.counts.branches }))
                : null,
              repo.counts && repo.counts.tags > 0
                ? h('span', { className: 'gg-chip is-quiet' }, tx('{n} tags', { n: repo.counts.tags }))
                : null,
              h('span', { className: 'gg-spacer' }),
              commits.length > 0
                ? h(
                    'label',
                    { className: 'gg-search' },
                    h(Icon, { name: 'search', size: 13 }),
                    h('input', {
                      type: 'search',
                      value: query,
                      placeholder: t('Search commits, authors, or SHAs'),
                      onChange: (event) => setQuery(event.target.value),
                      'aria-label': t('Search commits, authors, or SHAs'),
                    }),
                  )
                : null,
            )
          : null,
      )

      /* ----- main column ----- */
      let mainContent = null
      if (!data && phase === 'loading') {
        mainContent = h(
          'div',
          { className: 'gg-skeleton', 'aria-busy': 'true', 'aria-label': t('Loading history…') },
          Array.from({ length: 7 }, (_, index) =>
            h(
              'div',
              { key: index, className: 'gg-sk-row' },
              h('span', { className: 'gg-sk-dot' }),
              h('span', {
                className: 'gg-sk-line',
                style: { width: `${38 + ((index * 17) % 44)}%`, animationDelay: `${index * 90}ms` },
              }),
            ),
          ),
        )
      } else if (!data && error) {
        mainContent = h(
          'div',
          { className: 'gg-empty' },
          h('span', { className: 'gg-empty-icon' }, h(Icon, { name: 'alert', size: 22 })),
          h('h2', null, t('Could not read Git history')),
          h('p', null, error),
          h('button', { type: 'button', className: 'gg-btn', onClick: refresh }, t('Try again')),
        )
      } else if (data && repo && !repo.exists) {
        mainContent = h(
          'div',
          { className: 'gg-empty' },
          h('span', { className: 'gg-empty-icon' }, h(Icon, { name: 'folder', size: 22 })),
          h('h2', null, t('Not a Git repository')),
          h('p', null, t('This conversation is not working inside a Git repository, so there is no history to draw.')),
          h(
            'p',
            null,
            fillText(t('Run {cmd} in this directory, then refresh.'), 'cmd', h('code', { className: 'gg-code' }, 'git init')),
          ),
          h(
            'code',
            { className: 'gg-code gg-empty-path', title: repo.path },
            repo.path,
          ),
        )
      } else if (data && repo && repo.exists && commits.length === 0) {
        mainContent = h(
          'div',
          { className: 'gg-empty' },
          h('span', { className: 'gg-empty-icon' }, h(Icon, { name: 'commit', size: 22 })),
          h('h2', null, t('No commits yet')),
          h('p', null, t('Files staged or modified here will appear under Changes until the first commit is made.')),
        )
      } else if (data && repo && repo.exists) {
        mainContent = h(
          React.Fragment,
          null,
          filtered.length === 0
            ? h('div', { className: 'gg-empty' }, h('p', null, t('No commits match this search.')))
            : null,
          h(
            'div',
            { className: 'gg-scroll' },
            h(
              'div',
              { className: 'gg-list', style: { minHeight: graph.height } },
              h(
                'svg',
                {
                  className: 'gg-canvas',
                  width: graphWidth,
                  height: graph.height,
                  viewBox: `0 0 ${graphWidth} ${graph.height}`,
                  'aria-hidden': 'true',
                },
                graph.edges.map((edge) =>
                  h('path', {
                    key: edge.key,
                    d: edge.d,
                    fill: 'none',
                    stroke: edge.color,
                    strokeOpacity: edge.opacity,
                    strokeWidth: 1.7,
                    strokeLinecap: 'round',
                  }),
                ),
                graph.nodes.map((node) =>
                  h(
                    'g',
                    { key: node.key },
                    node.key === headOid
                      ? h('circle', {
                          cx: node.x,
                          cy: node.y,
                          r: 8.6,
                          fill: 'none',
                          stroke: node.color,
                          strokeOpacity: 0.4,
                          strokeWidth: 1.3,
                        })
                      : null,
                    h('circle', {
                      cx: node.x,
                      cy: node.y,
                      r: node.merge ? 5.4 : 4.6,
                      fill: 'var(--gg-node-bg)',
                      stroke: node.color,
                      strokeWidth: 2,
                    }),
                    node.merge ? h('circle', { cx: node.x, cy: node.y, r: 2, fill: node.color }) : null,
                  ),
                ),
              ),
              h(
                'div',
                { className: 'gg-rows', style: { paddingLeft: graphWidth } },
                graph.rows.map((row) => {
                  const commit = row.commit
                  const isSelected = commit.oid === selected && mode === 'commit'
                  const refs = (commit.refs || []).map(classifyRef)
                  return h(
                    'button',
                    {
                      key: commit.oid,
                      type: 'button',
                      className: `gg-row${isSelected ? ' is-selected' : ''}`,
                      style: { height: ROW },
                      onClick: () => selectCommit(commit.oid),
                      'aria-pressed': isSelected,
                      title: commit.subject,
                    },
                    h(
                      'span',
                      { className: 'gg-subject-line' },
                      h('span', { className: 'gg-subject' }, commit.subject || t('(no message)')),
                      refs.length > 0
                        ? h(
                            'span',
                            { className: 'gg-refs' },
                            refs.map((ref, index) =>
                              h(
                                'span',
                                { key: `${ref.kind}-${ref.label}-${index}`, className: `gg-pill is-${ref.kind}` },
                                ref.label,
                              ),
                            ),
                          )
                        : null,
                    ),
                    h(
                      'span',
                      { className: 'gg-row-meta' },
                      h('span', { className: 'gg-avatar' }, initials(commit.author.name)),
                      h('span', { className: 'gg-author' }, commit.author.name),
                      h('span', { className: 'gg-dot' }, '·'),
                      h('span', null, relativeTime(commit.time)),
                      h('span', { className: 'gg-dot' }, '·'),
                      h('code', { className: 'gg-sha' }, shortOid(commit.oid)),
                    ),
                  )
                }),
              ),
            ),
          ),
        )
      } else if (error) {
        mainContent = null
      }

      /* ----- detail column ----- */
      const sideContent = h(
        'aside',
        { className: 'gg-side', 'aria-label': mode === 'changes' ? t('Changes') : t('Commit') },
        h(
          'div',
          { className: 'gg-side-head' },
          h(Icon, { name: mode === 'changes' ? 'alert' : 'commit', size: 14 }),
          h('span', { className: 'gg-side-heading' }, mode === 'changes' ? t('Changes') : t('Commit')),
          h('span', { className: 'gg-spacer' }),
          mode === 'changes'
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'gg-btn gg-small',
                  onClick: () => setMode('commit'),
                  disabled: !selected,
                },
                t('Show commit'),
              )
            : null,
        ),
        h(
          'div',
          { className: 'gg-side-body' },
          mode === 'changes'
            ? changes.length === 0
              ? h('p', { className: 'gg-muted' }, t('Working tree clean'))
              : h(
                  'div',
                  { className: 'gg-files' },
                  changes.map((change, index) =>
                    h(
                      'div',
                      { key: `${change.path}-${index}`, className: 'gg-file' },
                      h('span', { className: `gg-status is-${changeTone(change)}` }, changeLabel(change)),
                      h('span', { className: 'gg-file-path', title: change.path }, change.path),
                      h(
                        'span',
                        { className: 'gg-file-tag' },
                        change.untracked ? t('untracked') : change.staged ? t('staged') : t('modified'),
                      ),
                    ),
                  ),
                )
            : detailPhase === 'ready' && detail
              ? h(CommitDetail, { key: detail.oid, t, tx, detail, copied, copy, detailByOid, selectCommit })
              : detailPhase === 'error'
                ? h('p', { className: 'gg-muted' }, t('Could not read Git history'))
                : detailPhase === 'loading'
                  ? h(
                      'div',
                      { className: 'gg-detail-skeleton' },
                      h('span', { className: 'gg-sk-line', style: { width: '70%' } }),
                      h('span', { className: 'gg-sk-line', style: { width: '92%' } }),
                      h('span', { className: 'gg-sk-line', style: { width: '48%' } }),
                    )
                  : h('p', { className: 'gg-muted' }, t('Select a commit to see its message and files.')),
        ),
      )

      return h(
        'div',
        { className: 'gg-root' },
        h('style', { key: 'style' }, CSS),
        header,
        error && data
          ? h(
              'div',
              { className: 'gg-banner', role: 'alert' },
              h(Icon, { name: 'alert', size: 14 }),
              h('span', { className: 'gg-banner-text' }, error),
              h(
                'button',
                { type: 'button', className: 'gg-btn gg-small', onClick: refresh },
                t('Try again'),
              ),
            )
          : null,
        h(
          'div',
          { className: 'gg-body' },
          h('section', { className: 'gg-main' }, mainContent),
          repo && repo.exists && commits.length > 0 ? sideContent : null,
        ),
      )
    }

    function CommitDetail({ t, tx, detail, copied, copy, detailByOid, selectCommit }) {
      const [showAllFiles, setShowAllFiles] = useState(false)
      const files = showAllFiles ? detail.files : detail.files.slice(0, 8)
      const hasMore = detail.files.length > files.length
      return h(
        'div',
        { className: 'gg-detail' },
        h('h2', { className: 'gg-side-title' }, detail.subject || t('(no message)')),
        h(
          'div',
          { className: 'gg-sha-row' },
          h('code', { className: 'gg-sha-full', title: detail.oid }, detail.oid),
          h(
            'button',
            {
              type: 'button',
              className: 'gg-btn gg-small',
              onClick: () => copy(detail.oid),
            },
            h(Icon, { name: copied ? 'check' : 'copy', size: 12 }),
            copied ? t('Copied') : t('Copy'),
          ),
        ),
        (detail.refs || []).length > 0
          ? h(
              'div',
              { className: 'gg-refs gg-refs-block' },
              detail.refs.map((ref) => {
                const parsed = classifyRef(ref)
                return h(
                  'span',
                  { key: ref, className: `gg-pill is-${parsed.kind}` },
                  parsed.label,
                )
              }),
            )
          : null,
        h(
          'dl',
          { className: 'gg-kv' },
          h('dt', null, t('Author')),
          h(
            'dd',
            null,
            h('span', { className: 'gg-kv-strong' }, detail.author.name),
            h('span', { className: 'gg-kv-muted' }, detail.author.email),
          ),
          h('dt', null, t('Committed')),
          h(
            'dd',
            null,
            h('span', null, absoluteTime(detail.committer.time || detail.author.time)),
            h('span', { className: 'gg-kv-muted' }, relativeTime(detail.committer.time || detail.author.time)),
          ),
          h('dt', null, t('Parents')),
          h(
            'dd',
            { className: 'gg-parents' },
            (detail.parents || []).length === 0
              ? h('span', { className: 'gg-kv-muted' }, t('Root commit'))
              : detail.parents.map((parent) =>
                  detailByOid.has(parent)
                    ? h(
                        'button',
                        {
                          key: parent,
                          type: 'button',
                          className: 'gg-btn gg-small',
                          onClick: () => selectCommit(parent),
                        },
                        h('code', null, shortOid(parent)),
                      )
                    : h('code', { key: parent, className: 'gg-kv-muted' }, shortOid(parent)),
                ),
          ),
        ),
        detail.body
          ? h(
              'div',
              { className: 'gg-section' },
              h('h3', { className: 'gg-section-title' }, t('Message')),
              h('pre', { className: 'gg-body-text' }, detail.body),
            )
          : null,
        h(
          'div',
          { className: 'gg-section' },
          h(
            'div',
            { className: 'gg-section-head' },
            h('h3', { className: 'gg-section-title' }, t('Files changed')),
            h(
              'span',
              { className: 'gg-section-meta' },
              tx('{n} files', { n: detail.stats.files }),
              ' ',
              h('span', { className: 'gg-add' }, `+${detail.stats.insertions}`),
              ' ',
              h('span', { className: 'gg-del' }, `−${detail.stats.deletions}`),
            ),
          ),
          detail.files.length === 0
            ? h('p', { className: 'gg-muted' }, t('No file changes recorded.'))
            : h(
                'div',
                { className: 'gg-files' },
                files.map((file, index) =>
                  h(
                    'div',
                    { key: `${file.path}-${index}`, className: 'gg-file' },
                    h('span', { className: 'gg-file-path', title: file.path }, file.path),
                    file.binary
                      ? h('span', { className: 'gg-file-tag' }, 'bin')
                      : h(
                          'span',
                          { className: 'gg-file-stat' },
                          h('span', { className: 'gg-add' }, `+${file.additions ?? 0}`),
                          h('span', { className: 'gg-del' }, `−${file.deletions ?? 0}`),
                        ),
                  ),
                ),
                hasMore
                  ? h(
                      'button',
                      { type: 'button', className: 'gg-more', onClick: () => setShowAllFiles(true) },
                      `+${detail.files.length - files.length}`,
                    )
                  : null,
              ),
        ),
      )
    }

    /* ---------------------------------------------------------------- */
    /* Styles                                                           */
    /* ---------------------------------------------------------------- */

    const CSS = String.raw`
.gg-root {
  --gg-node-bg: var(--dsw-alias-bg-base);
  --gg-soft: color-mix(in srgb, var(--dsw-alias-label-secondary) 9%, transparent);
  --gg-soft-strong: color-mix(in srgb, var(--dsw-alias-label-secondary) 15%, transparent);
  --gg-brand-soft: color-mix(in srgb, var(--dsw-alias-brand-primary) 11%, transparent);
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 480px;
  overflow: hidden;
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif;
  font-size: 13px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
}
.gg-root *, .gg-root *::before, .gg-root *::after { box-sizing: border-box; }
.gg-root button, .gg-root input, .gg-root select { font: inherit; color: inherit; }
.gg-root button { border: 0; background: transparent; cursor: pointer; }
.gg-root code, .gg-root pre { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; }
.gg-root :focus-visible { outline: 2px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 55%, transparent); outline-offset: 1px; border-radius: 6px; }
.gg-spacer { flex: 1 1 auto; }
.gg-muted { margin: 0; color: var(--dsw-alias-label-secondary); font-size: 12.5px; }

.gg-head {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 11px;
  padding: 15px 20px 12px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.gg-head-row { display: flex; align-items: center; gap: 11px; min-width: 0; }
.gg-mark {
  flex: none;
  width: 32px; height: 32px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 9px;
  background: var(--gg-brand-soft);
  color: var(--dsw-alias-brand-primary);
}
.gg-titles { flex: 1 1 auto; min-width: 0; }
.gg-title { margin: 0; font-size: 15px; font-weight: 600; letter-spacing: -0.011em; line-height: 1.25; }
.gg-sub { margin-top: 1px; display: flex; align-items: baseline; gap: 8px; min-width: 0; color: var(--dsw-alias-label-secondary); font-size: 11.5px; }
.gg-sub-title { flex: none; }
.gg-path {
  min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-size: 11px;
  color: color-mix(in srgb, var(--dsw-alias-label-secondary) 88%, transparent);
}

.gg-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 28px; padding: 0 10px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1);
  font-size: 12px; white-space: nowrap;
}
.gg-btn:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); }
.gg-btn:disabled { opacity: .45; cursor: default; }
.gg-icon-btn { width: 28px; padding: 0; justify-content: center; }
.gg-small { height: 24px; padding: 0 8px; font-size: 11.5px; gap: 4px; }

.gg-chips { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.gg-chip {
  display: inline-flex; align-items: center; gap: 5px;
  height: 22px; padding: 0 8px;
  border-radius: 999px;
  background: var(--gg-soft);
  color: var(--dsw-alias-label-secondary);
  font-size: 11.5px; white-space: nowrap;
}
.gg-chip.is-branch { background: var(--gg-brand-soft); color: var(--dsw-alias-brand-primary); }
.gg-chip.is-quiet { background: transparent; padding: 0 4px; }
.gg-chip.is-action { height: 22px; cursor: pointer; }
.gg-chip.is-action:hover { background: var(--gg-soft-strong); }
.gg-chip.is-warn { background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 13%, transparent); color: var(--dsw-alias-state-warn-primary); }
.gg-chip.is-on { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-state-warn-primary) 45%, transparent); }
.gg-search {
  display: inline-flex; align-items: center; gap: 6px;
  height: 26px; padding: 0 9px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px;
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-secondary);
  min-width: 170px;
}
.gg-search input { width: 100%; border: 0; outline: 0; background: transparent; font-size: 12px; color: var(--dsw-alias-label-primary); }
.gg-search input::placeholder { color: color-mix(in srgb, var(--dsw-alias-label-secondary) 85%, transparent); }

.gg-banner {
  flex: none;
  display: flex; align-items: center; gap: 8px;
  margin: 10px 20px 0; padding: 8px 11px;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 24%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 9%, transparent);
  color: var(--dsw-alias-state-error-primary);
  font-size: 12px;
}
.gg-banner-text { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }
.gg-banner .gg-btn { border-color: transparent; background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, transparent); color: inherit; }

.gg-body { flex: 1 1 auto; min-height: 0; display: flex; }
.gg-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; overflow: hidden; }
.gg-scroll { flex: 1 1 auto; min-height: 0; overflow: auto; overscroll-behavior: contain; }
.gg-list { position: relative; }
.gg-canvas { position: absolute; left: 0; top: 0; pointer-events: none; }
.gg-rows { display: flex; flex-direction: column; }

.gg-row {
  position: relative;
  display: flex; flex-direction: column; justify-content: center; gap: 1px;
  width: 100%; padding: 0 14px 0 0;
  text-align: left; color: inherit;
  border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-border-l1) 55%, transparent);
}
.gg-row:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary) 3.4%, transparent); }
.gg-row.is-selected { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 8.5%, transparent); }
.gg-row.is-selected::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px;
  background: var(--dsw-alias-brand-primary);
}
.gg-subject-line { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
.gg-subject { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.8px; font-weight: 500; }
.gg-refs { display: flex; align-items: center; gap: 4px; flex: 0 1 auto; max-width: 52%; overflow: hidden; }
.gg-refs-block { max-width: none; flex-wrap: wrap; overflow: visible; margin-top: -4px; }
.gg-pill {
  display: inline-flex; align-items: center;
  height: 17px; padding: 0 6px;
  border-radius: 5px;
  font-size: 10.5px; font-weight: 500; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}
.gg-pill.is-head { background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-bg-base); }
.gg-pill.is-branch { background: var(--gg-brand-soft); color: var(--dsw-alias-brand-primary); }
.gg-pill.is-remote { background: var(--gg-soft-strong); color: var(--dsw-alias-label-secondary); }
.gg-pill.is-tag { background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 15%, transparent); color: var(--dsw-alias-state-warn-primary); }
.gg-row-meta { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 11.2px; color: var(--dsw-alias-label-secondary); }
.gg-avatar {
  flex: none;
  width: 16px; height: 16px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--gg-soft-strong);
  font-size: 8px; font-weight: 700; letter-spacing: .02em;
}
.gg-author { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px; }
.gg-dot { opacity: .5; }
.gg-sha { font-size: 10.5px; color: color-mix(in srgb, var(--dsw-alias-label-secondary) 90%, transparent); }

.gg-side {
  flex: none;
  width: 336px;
  display: flex; flex-direction: column;
  min-height: 0;
  border-left: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1);
}
.gg-side-head { flex: none; display: flex; align-items: center; gap: 7px; padding: 11px 14px; border-bottom: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary); }
.gg-side-heading { font-size: 11.5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; }
.gg-side-body { flex: 1 1 auto; min-height: 0; overflow: auto; padding: 14px; display: flex; flex-direction: column; gap: 14px; }
.gg-detail { display: flex; flex-direction: column; gap: 12px; }
.gg-side-title { margin: 0; font-size: 13.5px; font-weight: 600; line-height: 1.4; overflow-wrap: anywhere; }
.gg-sha-row { display: flex; align-items: center; gap: 8px; min-width: 0; }
.gg-sha-full { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; font-size: 10.8px; color: var(--dsw-alias-label-secondary); }
.gg-kv { display: grid; grid-template-columns: 68px minmax(0, 1fr); gap: 7px 10px; margin: 0; font-size: 12px; }
.gg-kv dt { color: var(--dsw-alias-label-secondary); }
.gg-kv dd { margin: 0; min-width: 0; display: flex; flex-direction: column; gap: 1px; overflow-wrap: anywhere; }
.gg-kv-strong { font-weight: 500; }
.gg-kv-muted { color: var(--dsw-alias-label-secondary); font-size: 11.5px; }
.gg-parents { flex-direction: row; flex-wrap: wrap; gap: 5px; align-items: center; }
.gg-section { display: flex; flex-direction: column; gap: 7px; border-top: 1px solid var(--dsw-alias-border-l1); padding-top: 12px; }
.gg-section-head { display: flex; align-items: baseline; gap: 8px; }
.gg-section-title { margin: 0; font-size: 11.5px; font-weight: 600; letter-spacing: .03em; text-transform: uppercase; color: var(--dsw-alias-label-secondary); }
.gg-section-meta { margin-left: auto; font-size: 11px; color: var(--dsw-alias-label-secondary); display: inline-flex; gap: 5px; }
.gg-body-text { margin: 0; padding: 9px 10px; border-radius: 8px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); font-size: 11.8px; line-height: 1.55; white-space: pre-wrap; max-height: 200px; overflow: auto; }
.gg-files { display: flex; flex-direction: column; gap: 1px; }
.gg-file { display: flex; align-items: center; gap: 7px; padding: 3px 5px; border-radius: 6px; font-size: 11.8px; }
.gg-file:hover { background: var(--gg-soft); }
.gg-file-path { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.2px; }
.gg-file-tag { flex: none; color: var(--dsw-alias-label-secondary); font-size: 10.5px; }
.gg-file-stat { flex: none; display: inline-flex; gap: 5px; font-size: 10.8px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.gg-add { color: var(--dsw-alias-state-success-primary); }
.gg-del { color: var(--dsw-alias-state-error-primary); }
.gg-more { align-self: flex-start; margin-top: 3px; padding: 2px 6px; border-radius: 6px; color: var(--dsw-alias-label-secondary); font-size: 11px; }
.gg-more:hover { background: var(--gg-soft); }
.gg-status {
  flex: none; width: 16px; height: 16px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 4px;
  font-size: 9.5px; font-weight: 700;
  background: var(--gg-soft-strong);
  color: var(--dsw-alias-label-secondary);
}
.gg-status.is-add { background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 15%, transparent); color: var(--dsw-alias-state-success-primary); }
.gg-status.is-mod { background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 16%, transparent); color: var(--dsw-alias-state-warn-primary); }
.gg-status.is-del, .gg-status.is-con { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 15%, transparent); color: var(--dsw-alias-state-error-primary); }
.gg-status.is-new { background: var(--gg-brand-soft); color: var(--dsw-alias-brand-primary); }
.gg-status.is-ren { background: var(--gg-soft-strong); color: var(--dsw-alias-label-secondary); }

.gg-empty {
  margin: auto;
  max-width: 380px;
  padding: 30px 24px;
  display: flex; flex-direction: column; align-items: center; gap: 9px;
  text-align: center;
  color: var(--dsw-alias-label-secondary);
}
.gg-empty-icon {
  width: 44px; height: 44px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 13px;
  background: var(--gg-brand-soft);
  color: var(--dsw-alias-brand-primary);
  margin-bottom: 2px;
}
.gg-empty h2 { margin: 0; font-size: 14px; font-weight: 600; color: var(--dsw-alias-label-primary); }
.gg-empty p { margin: 0; font-size: 12.5px; line-height: 1.6; }
.gg-code { font-size: 11.5px; padding: 1px 5px; border-radius: 5px; background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-primary); }
.gg-empty-path { margin-top: 2px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: center; }

.gg-skeleton { display: flex; flex-direction: column; }
.gg-sk-row { height: 44px; display: flex; align-items: center; gap: 12px; padding: 0 20px; }
.gg-sk-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--gg-soft-strong); }
.gg-sk-line { display: block; height: 9px; border-radius: 5px; background: var(--gg-soft-strong); animation: gg-pulse 1.5s ease-in-out infinite; }
.gg-detail-skeleton { display: flex; flex-direction: column; gap: 10px; }
@keyframes gg-pulse { 0%, 100% { opacity: .5; } 50% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .gg-sk-line { animation: none; }
}

@media (max-width: 1000px) {
  .gg-side { width: 290px; }
  .gg-sub-title { display: none; }
}
@media (max-width: 780px) {
  .gg-body { flex-direction: column; }
  .gg-side { width: auto; max-height: 46%; border-left: 0; border-top: 1px solid var(--dsw-alias-border-l1); }
  .gg-search { display: none; }
}
`

    /* ---------------------------------------------------------------- */
    /* Registration                                                     */
    /* ---------------------------------------------------------------- */

    /** Keep one render fault inside the panel instead of blanking the main column. */
    class PanelBoundary extends React.Component {
      constructor(props) {
        super(props)
        this.state = { error: null }
      }

      static getDerivedStateFromError(error) {
        return { error }
      }

      componentDidCatch(error, info) {
        console.error('git-graph: panel render failed', error, info)
      }

      render() {
        if (!this.state.error) return this.props.children
        return h(
          'div',
          { className: 'gg-root' },
          h('style', null, CSS),
          h(
            'div',
            { className: 'gg-empty' },
            h('span', { className: 'gg-empty-icon' }, h(Icon, { name: 'alert', size: 22 })),
            h('h2', null, 'Git Graph failed to render'),
            h('p', null, String(this.state.error && this.state.error.message ? this.state.error.message : this.state.error)),
          ),
        )
      }
    }

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { en: EN, zh: ZH }), 'git-graph: dictionaries')
      const t = ctx.locale.bind(NS)
      const Page = (props) => h(PanelBoundary, null, h(GitGraphPanel, { ...props, t }))

      // One View per conversation: it reads that session's own working
      // directory (a worktree included), so there is nothing to choose.
      ctx.slots.inject('conversation.view', () =>
        ctx.slots.register(
          {
            name: 'conversation.view',
            id: VIEW_ID,
            order: 20,
            label: () => t('Git'),
          },
          Page,
        ),
      )
    }

    return { inject: ['slots', 'locale'], apply }
  },
})
