# Engineering Canvas

An infinite task canvas for engineering work, delivered as a DeepSeek Harness UI plugin. It appears as a **Engineering Canvas** icon in the sidebar and opens a full main-panel page.

## What is in it

- Infinite pan/zoom board with a dot grid, minimap, fit-to-view, and 20–250% zoom.
- Four-column sprint lanes. Drag a task between lanes to change its status.
- Task cards with status, priority, assignee, due date, estimate, tags, and checklists.
- Dependency arrows by dragging from a card port. Edges follow cards and update automatically.
- Rich sticky notes, frames, text, and a semantic diagram shape library: process, condition, start/end, input/output, document, data store, subprocess, and manual input. Freehand pen and eraser included.
- Double-click any note to zoom into a full block editor with headings, lists, todos, quotes, code, math, slash commands, title editing, and note colors. Type `/` at the start of a block to switch its type.
- Marquee and shift multi-select, group/ungroup with group move and resize, resize handles, align/distribute, z-order, duplicate, delete.
- Undo/redo (per board), keyboard shortcuts, command palette (`⌘K`), search, and status filter.
- Four starter templates: sprint board, process flow, service map, and incident command. Use **Start blank** for an empty canvas.
- Local autosave, multiple boards, JSON import/export, PNG export, and Markdown export.
- Light/dark theme support using Harness theme tokens; simplified Chinese UI copy.

## Open it

Click the **Engineering Canvas** icon in the left sidebar. If the inspector is closed, select a card and click **Details**, or use the panel toggle in the top bar.

## Shortcuts

| Key | Action |
| --- | --- |
| `V` | Select |
| `H` | Pan |
| `Space` + drag | Pan from anywhere |
| `T` | Task card |
| `N` | Sticky note |
| `X` | Text |
| `R` | Shape picker |
| `1`–`8` | Choose a diagram shape while the shape tool is active |
| `F` | Frame |
| `C` | Connect |
| `P` | Pen |
| `E` | Eraser |
| `⌘K` | Command palette |
| `⌘Z` / `⇧⌘Z` | Undo / redo |
| Double-click note | Open note editor |
| `⌘G` | Group selection |
| `⇧⌘G` | Ungroup |
| `⌥` + click | Select one component inside a group |
| `⌘D` | Duplicate |
| `⌘A` | Select all |
| `⌘0` | Fit canvas |
| `⌘N` | New board from template |
| `?` | Shortcut reference |

Scroll to pan; `⌘`/`Ctrl` + scroll to zoom. Double-click a task to edit its title, a note to open its detail editor, or empty canvas to create text.

## Data

Boards autosave to browser `localStorage` under `dsh.engineering-canvas.v1`. Export a JSON backup from the **Export** menu; import it from the board menu. PNG and Markdown exports are generated locally and never uploaded.

## Development

`src/` contains the readable client sections. Run:

```bash
node build.mjs
node --check client.js
```

to rebuild the self-contained `client.js` module loaded by the Harness Client module loader.

## Files

- `package.json`: bundle manifest, Client platform declaration, exports, and display metadata.
- `cordis.patch.yml`: inserts the plugin row.
- `index.js`: empty Host half; the browser half owns the page.
- `client.js`: built browser module.
- `locale/en.json`, `locale/zh.json`: plugin display title and description.
- `icon.svg`: original scalable icon.
