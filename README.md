# DSH plugins

Four UI plugins for [DeepSeek Harness](https://github.com/deepseek-ai) (DSH), the
agent harness behind the DeepSeek desktop and web clients. All are plain DSH
bundles: a `package.json` manifest, a `cordis.patch.yml` row insert, a Host half
(`index.js`) and a Client half (`client.js`) that the Web client's module loader
injects into a slot.

| Plugin | Package | What it adds |
| --- | --- | --- |
| [`engineering-canvas-plugin`](engineering-canvas-plugin) | `@local/engineering-canvas` | An infinite task canvas page: sprint lanes, dependency arrows, sticky notes, shapes, freehand pen, undo/redo, templates, JSON/PNG/Markdown export. |
| [`git-graph-plugin`](git-graph-plugin) | `@local/git-graph` | A Git history View inside each conversation: commit lanes, branches, tags, and the working tree of the session's own directory or worktree. |
| [`usage-stats-plugin`](usage-stats-plugin) | `@local/dsh-usage-stats` | A usage ledger page: token composition, estimated spend, monthly budget, bucketed timeline, per-conversation rows, and CPU telemetry. |
| [`token-farm-plugin`](token-farm-plugin) | `@local/dsh-token-bloom` | Token Farm: a pastel 3D farm that levels up, unlocks crops, and grows wildlife from the same usage numbers. |

None of the plugins calls a network service. Canvas boards and farms autosave to
browser `localStorage`; the Git Graph reads the session directory with read-only
Git plumbing through the Host's subprocess and connection admission; Usage
Statistics folds the local session logs and samples CPU on the Host. Token Farm
has no data source of its own: it reads the Usage Statistics route, so install
`@local/dsh-usage-stats` alongside it.

## Install into another DSH client

The plugins are installed into a **profile**, the same way DSH ships its own
bundles. From a checkout of this repo:

1. Add the plugin to the profile's dependencies. The simplest form is a link:

   ```jsonc
   // ~/.dsh/profiles/<profile>/package.json
   {
     "dependencies": {
       "@local/engineering-canvas": "link:/absolute/path/to/engineering-canvas-plugin",
       "@local/git-graph": "link:/absolute/path/to/git-graph-plugin",
       "@local/dsh-usage-stats": "link:/absolute/path/to/usage-stats-plugin",
       "@local/dsh-token-bloom": "link:/absolute/path/to/token-farm-plugin"
     },
     "dsh": {
       "profile": {
         "bundles": [
           "@deepseek-ai/dsh-base",
           "@deepseek-ai/dsh-web-app",
           "@local/engineering-canvas",
           "@local/git-graph",
           "@local/dsh-usage-stats",
           "@local/dsh-token-bloom"
         ]
       }
     }
   }
   ```

   Keep the Usage Statistics row ahead of the Token Farm row: the farm fetches
   `/plugins/dsh-stats/overview` from it.

2. Install (the profile needs the link materialized), then restart the client:

   ```bash
   cd ~/.dsh/profiles/<profile> && pnpm install
   ```

   If your DSH build ships the plugin manager, `dsh plugin --profile <profile>
   add /absolute/path/to/<plugin>` performs steps 1–2 and appends the bundle row
   for you.

3. Restart DSH. None of the plugins needs credentials or config keys. Usage
   Statistics injects the Host services `webServer`, `sessionQuery`, and
   `sessionPersistence`, which the standard DSH web bundles provide. The Client
   half is loaded by the client module loader at runtime, and the Host half
   registers its route through the bundle patch.

### Adapting to your client

- **Package names** are `@local/*` because they are linked from disk rather than
  published. Any scope works as long as the `name` in the plugin `package.json`,
  the `id` in the `cordis.patch.yml` row, the `id` at the top of `client.js`, and
  the profile `bundles` entry agree.
- **Injected services** are declared in the `dsh.client.inject` array of each
  `package.json` (`@deepseek-ai/dsh-client-locale`, plus the UI packages for the
  canvas). Drop or rename an entry only if your build renamed those packages.
- **Slot placement** lives entirely in `client.js`. The canvas, Usage Statistics,
  and Token Farm register a sidebar entry plus a main-panel page; the Git Graph
  registers a workspace View. Search `VIEW_ID`, `PANEL_ID`, `API`, and `NS` at the
  top of each `client.js` to retarget them.
- **Theme** comes from Harness theme tokens (CSS variables), so all four follow
  light/dark without extra work.

## Development

`engineering-canvas-plugin/src/` holds the readable, numbered sections of the
canvas client. Rebuild the single-file module the loader consumes with:

```bash
cd engineering-canvas-plugin
node build.mjs          # concatenates src/*.js into client.js
node --check client.js  # syntax check
```

`git-graph-plugin` is hand-written: `git.js` contains the read-only Git parsing
(unit-testable, it takes a `run(cwd, args)` function), `index.js` the Host route,
and `client.js` the View.

`usage-stats-plugin` is hand-written in two halves: `index.js` folds session logs
and serves one JSON route, `client.js` renders the page and polls it every 6s.

`token-farm-plugin` is client-only (`index.js` is an empty Host half). `client.js`
is one self-contained module: React from the module loader, a hand-rolled canvas
2D isometric renderer, and `localStorage` for the farm state.

## License

MIT. See [LICENSE](LICENSE).
