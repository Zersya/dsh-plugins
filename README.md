# DSH plugins

Two UI plugins for [DeepSeek Harness](https://github.com/deepseek-ai) (DSH), the
agent harness behind the DeepSeek desktop and web clients. Both are plain DSH
bundles: a `package.json` manifest, a `cordis.patch.yml` row insert, a Host half
(`index.js`) and a Client half (`client.js`) that the Web client's module loader
injects into a slot.

| Plugin | Package | What it adds |
| --- | --- | --- |
| [`engineering-canvas-plugin`](engineering-canvas-plugin) | `@local/engineering-canvas` | An infinite task canvas page: sprint lanes, dependency arrows, sticky notes, shapes, freehand pen, undo/redo, templates, JSON/PNG/Markdown export. |
| [`git-graph-plugin`](git-graph-plugin) | `@local/git-graph` | A Git history View inside each conversation: commit lanes, branches, tags, and the working tree of the session's own directory or worktree. |

Neither plugin calls a network service. Canvas boards autosave to browser
`localStorage`; the Git Graph reads the session directory with read-only Git
plumbing through the Host's subprocess and connection admission.

## Install into another DSH client

The plugins are installed into a **profile**, the same way DSH ships its own
bundles. From a checkout of this repo:

1. Add the plugin to the profile's dependencies. The simplest form is a link:

   ```jsonc
   // ~/.dsh/profiles/<profile>/package.json
   {
     "dependencies": {
       "@local/engineering-canvas": "link:/absolute/path/to/engineering-canvas-plugin",
       "@local/git-graph": "link:/absolute/path/to/git-graph-plugin"
     },
     "dsh": {
       "profile": {
         "bundles": [
           "@deepseek-ai/dsh-base",
           "@deepseek-ai/dsh-web-app",
           "@local/engineering-canvas",
           "@local/git-graph"
         ]
       }
     }
   }
   ```

2. Install (the profile needs the link materialized), then restart the client:

   ```bash
   cd ~/.dsh/profiles/<profile> && pnpm install
   ```

   If your DSH build ships the plugin manager, `dsh plugin --profile <profile>
   add /absolute/path/to/<plugin>` performs steps 1–2 and appends the bundle row
   for you.

3. Restart DSH. Neither plugin needs credentials, config keys, or a rebuild of
   the packaged app: the Client half is loaded by the client module loader at
   runtime, and the Host half registers its route through the bundle patch.

### Adapting to your client

- **Package names** are `@local/*` because they are linked from disk rather than
  published. Any scope works as long as the `name` in the plugin `package.json`,
  the `cordis.patch.yml` row, and the profile `bundles` entry agree.
- **Injected services** are declared in the `dsh.client.inject` array of each
  `package.json` (`@deepseek-ai/dsh-client-locale`, plus the UI packages for the
  canvas). Drop or rename an entry only if your build renamed those packages.
- **Slot placement** lives entirely in `client.js`. The canvas registers a
  sidebar entry and a main-panel page; the Git Graph registers a workspace View.
  Search `VIEW_ID`, `API`, and `NS` at the top of each `client.js` to retarget
  them.
- **Theme** comes from Harness theme tokens (CSS variables), so both plugins
  follow light/dark without extra work.

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

## License

MIT. See [LICENSE](LICENSE).
