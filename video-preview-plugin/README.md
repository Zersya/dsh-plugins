# `@local/dsh-video-preview`

Inline video playback for the right Sidebar's **Files** panel.

Before this plugin the panel answered a `.mp4` with *"Preview is not available for
this file type yet."* The Sidebar's preview system already supports Office, PDF,
Markdown, code, images and text; each is a **document preview implementation** in
`ctx.documentPreviews`, dispatched by file suffix, whose body renders in the keyed
`sidebar.right.tab.document` slot under the implementation's `id`.

This plugin adds one implementation:

| | |
| --- | --- |
| id | `video` |
| extensions | `mp4 m4v webm mov ogv ogg mkv` |
| priority | `extension` (outranks the text preview's fallback band) |
| loading | `bytes-complete` — the owner supplies the file's bytes |

The body turns those bytes into a `Blob` URL and renders `<video controls>`. A Blob
URL needs no Host route and supports seeking, so playback works over whatever
connection the rest of the GUI uses (Tailscale included).

## Files

| File | Role |
| --- | --- |
| `client.js` | Browser half: registers the definition and the body component |
| `index.js` | Host half: no-op, the feature is entirely client-side |
| `cordis.patch.yml` | Inserts the plugin into the composed tree |

## Operational notes

- Install it like the other plugins here: a `link:` dependency plus a
  `dsh.profile.bundles` entry in `~/.dsh/profiles/<profile>/package.json`, then
  `pnpm install` in that directory.
- Loading it recomposes the plugin tree; **reload the browser page** afterwards.
  On a build with HMR the recompose happens in place, so no server restart is
  needed.
- Remembered bytes are per-tab state: switching tabs revokes the Blob URL, so a
  large video is re-read when you come back to it.
- Very large files are loaded whole (this is what `bytes-complete` means). For
  multi-hundred-MB sources consider opening the file externally instead.
