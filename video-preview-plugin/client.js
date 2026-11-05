/**
 * Browser half: register `video` as a document previewer for the Files panel.
 *
 * The Sidebar's preview system already handles Office, PDF, Markdown, code,
 * images and text; each of those is a *document preview implementation* in
 * `ctx.documentPreviews`, and its body renders in the keyed
 * `sidebar.right.tab.document` slot under the implementation's `id`. A file is
 * matched to an implementation by suffix, so adding one does not touch the
 * Sidebar, the files browser, or the text preview that hosts it.
 *
 * Loading is `bytes-complete`: the owner hands this previewer the file's bytes,
 * and this body turns them into a Blob URL. A Blob URL needs no server route and
 * supports seeking, so the player works over the same Tailscale connection the
 * rest of the GUI uses.
 */

window.__ModuleLoader__.load({
  id: '@local/dsh-video-preview',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    /** The implementation id, also the key its body registers under. */
    const VIDEO_ID = 'video'

    /** Suffixes this previewer claims. Every one is binary. */
    const VIDEO_EXTENSIONS = ['mp4', 'm4v', 'webm', 'mov', 'ogv', 'ogg', 'mkv']

    /** Content types browsers accept for each suffix; mkv/ogv are best-effort. */
    const MIME_BY_SUFFIX = {
      mp4: 'video/mp4',
      m4v: 'video/x-m4v',
      webm: 'video/webm',
      mov: 'video/quicktime',
      ogv: 'video/ogg',
      ogg: 'video/ogg',
      mkv: 'video/x-matroska',
    }

    /** @param address - a file resource address ending in the file's name. */
    function mimeOf(address) {
      const match = /\.([a-z0-9]+)$/i.exec(String(address || '').split('?')[0])
      return (match && MIME_BY_SUFFIX[match[1].toLowerCase()]) || 'video/mp4'
    }

    /** @param address - a file resource address. */
    function basenameOf(address) {
      const clean = String(address || '').split('?')[0]
      const leaf = clean.slice(clean.lastIndexOf('/') + 1)
      try {
        return decodeURIComponent(leaf)
      } catch {
        return leaf
      }
    }

    /**
     * The player itself.
     *
     * The owner passes `content` in the mode the implementation declared; this
     * one declares `bytes-complete`, so a loaded document arrives as
     * `{ kind: 'bytes', data: Uint8Array }`. A Blob URL is created once per
     * revision and revoked on unmount, so switching tabs does not leak buffers.
     *
     * @param props - the document preview props supplied by the Sidebar owner.
     */
    function VideoBody(props) {
      const content = props && props.content
      const address = (props && props.resourceAddress) || ''
      const bytes = content && content.kind === 'bytes' ? content.data : null
      const [failed, setFailed] = React.useState(false)

      const url = React.useMemo(() => {
        if (!bytes || !bytes.byteLength) return null
        return URL.createObjectURL(new Blob([bytes], { type: mimeOf(address) }))
      }, [bytes, address])

      React.useEffect(() => {
        setFailed(false)
        return () => {
          if (url) URL.revokeObjectURL(url)
        }
      }, [url])

      // The document toolbar's wrap preference has no meaning for a video, and
      // the body is the scrollport: keep the player inside it without scrolling.
      const frameStyle = {
        position: 'absolute',
        inset: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        overflow: 'hidden',
      }

      if (failed) {
        return h(
          'div',
          { style: { ...frameStyle, background: 'transparent' } },
          h(
            'p',
            { style: { margin: 0, padding: '0 16px', textAlign: 'center', opacity: 0.75 } },
            'This browser cannot play this video’s codec. Open the file externally instead.',
          ),
        )
      }

      if (!url) {
        return h(
          'div',
          { style: { ...frameStyle, background: 'transparent' } },
          h('p', { style: { margin: 0, opacity: 0.7 } }, `Loading ${basenameOf(address) || 'video'}…`),
        )
      }

      return h(
        'div',
        { style: frameStyle },
        h('video', {
          src: url,
          controls: true,
          autoPlay: false,
          playsInline: true,
          preload: 'metadata',
          style: { maxWidth: '100%', maxHeight: '100%', width: '100%', height: '100%', objectFit: 'contain' },
          onError: () => setFailed(true),
        }),
      )
    }

    /**
     * @param ctx - the client root context carrying the preview registry and slots.
     */
    function apply(ctx) {
      // Marker so the plugin's activation is observable from the console or a
      // headless check; it survives as long as this plugin is loaded.
      globalThis.__dshVideoPreview = { id: VIDEO_ID, extensions: VIDEO_EXTENSIONS }

      ctx.effect(() => {
        const dispose = ctx.documentPreviews.register({
          id: VIDEO_ID,
          extensions: VIDEO_EXTENSIONS,
          binaryExtensions: VIDEO_EXTENSIONS,
          // External implementations win over the product's own: without this
          // the text preview's fallback band would claim the file first.
          priority: 'extension',
          title: () => 'Video',
          loading: 'bytes-complete',
        })
        globalThis.__dshVideoPreview.registered = true
        return dispose
      }, 'video-preview: definition')

      ctx.effect(
        () =>
          ctx.slots.inject('sidebar.right.tab.document', () => {
            const dispose = ctx.slots.register(
              { name: 'sidebar.right.tab.document', key: VIDEO_ID },
              VideoBody,
            )
            globalThis.__dshVideoPreview.body = true
            return dispose
          }),
        'video-preview: body',
      )
    }

    return { inject: ['slots', 'documentPreviews'], apply }
  },
})
