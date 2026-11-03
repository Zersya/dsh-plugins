# Token Farm

A pastel 3D farm for DeepSeek Harness that grows from your real token usage. It
reads the [Usage Statistics](../usage-stats-plugin) ledger, turns it into a level
and a seed drawer, and lets you plant, grow, and harvest a small isometric field
in the main panel. It appears as **Farm** in the sidebar.

## What it does

- **Level** comes straight from token totals: `floor(tokens / 5M) + 1`, capped at
  50. The rail shows the current level, the token window, the progress bar, and
  how many tokens are left to the next one.
- **Seeds** are earned from usage: `max(6, floor(tokens / 2M) + conversations × 2)`.
  Planting spends one. Harvesting a bloom returns one seed plus one pollen.
- **Nine crops** unlock as you level up. A locked seed shows its unlock level and
  cannot be planted.

  | Crop | Unlocks at | | Crop | Unlocks at |
  | --- | --- | --- | --- | --- |
  | Daisy | level 1 | | Pumpkin | level 12 |
  | Tulip | level 2 | | Moonflower | level 16 |
  | Lavender | level 4 | | Cosmos | level 24 |
  | Sunflower | level 6 | | Bluebell | level 30 |
  | Strawberry | level 9 | | | |

- **The field** grows with you: 6×6 plots, 7×7 from level 15, 8×8 from level 30.
  Plants move through four stages on a per-level timer — 42s per stage at level 1,
  easing to 9s at high levels — and are harvestable once fully bloomed.
- **Wildlife** arrives as the field comes alive: bees scale with blooms,
  butterflies with conversations and pollen, ladybugs with harvests, and fireflies
  appear only when the cache hit rate is at least 95%. Above 90% cache hit the sky
  grows an aurora.
- **The rail** also tracks pollen, field occupancy, growing vs. blooming counts,
  the current stage time, the next few locked seeds, a wildlife census, and six
  small goals (first harvest, three blooms, five species, four bees, ten harvests,
  level 30).

## Controls

| Action | How |
| --- | --- |
| Orbit the field | Drag on the scene |
| Zoom | Scroll |
| Plant | Click an empty plot (uses the selected seed) |
| Harvest | Click a fully grown bloom |
| Compost | Right-click a plant |
| Pick a seed | Click its packet, or press `1`–`9` |
| Sow next free plot | **Sow** |
| Reset camera | **Reset view**, or `R` |
| Undo the last change | **Undo**, or `Z` |
| Clear the field | **Clear field**, then **Confirm clear** |

The canvas is focusable, so keyboard shortcuts work after you click into the
scene. The HUD shows level, tokens, free/earned seeds, bloom count, and a
`Usage offline` chip when the stats route cannot be reached; the last cached
snapshot keeps the farm rendering until it recovers.

## Requires the Usage Statistics plugin

The farm has no data source of its own. It fetches
`/plugins/dsh-stats/overview` from `@local/dsh-usage-stats` every 8 seconds and
keeps the last payload in `localStorage`. Install both, with the Usage Statistics
bundle row ahead of the farm row:

```jsonc
// ~/.dsh/profiles/<profile>/package.json
{
  "dependencies": {
    "@local/dsh-usage-stats": "link:/absolute/path/to/usage-stats-plugin",
    "@local/dsh-token-bloom": "link:/absolute/path/to/token-farm-plugin"
  },
  "dsh": { "profile": { "bundles": [
    "@deepseek-ai/dsh-base",
    "@deepseek-ai/dsh-web-app",
    "@local/dsh-usage-stats",
    "@local/dsh-token-bloom"
  ] } }
}
```

See the repository [README](../README.md) for the full install and adaptation
notes.

## Data

Everything is local. The farm, the selected seed, the camera, and the last stats
snapshot live in browser `localStorage`:

| Key | Holds |
| --- | --- |
| `dsh.token-farm.state.v2` | Plants, planted/harvested counters, pollen |
| `dsh.token-farm.selected.v1` | Selected seed |
| `dsh.token-farm.camera.v3` | Orbit yaw/pitch/distance |
| `dsh.token-bloom.stats.v1` | Last usage snapshot, so the farm still draws offline |
| `dsh.usage-stats.budgetUsd` | Budget shared with the Usage Statistics page |

No account, network request, or file write is involved.

## Rendering

`client.js` is a single self-contained module: React comes from the module loader,
and the farm is drawn with the canvas 2D API through a small hand-rolled isometric
camera (projection, ground picking, cell lookup, depth-sorted plants). There is no
WebGL, no WebGL-adjacent dependency, and no extra package to install. Animation is
one `requestAnimationFrame` loop that repaints sky, island, fence, plants,
wildlife, and drifting petals, and it pauses the drawing work when the page is not
visible.

## Files

- `index.js`: empty Host half. The farm is entirely client-side.
- `client.js`: the page, its renderer, the farm model, and the slot registration
  (`main` page plus the `sidebar.panellist` entry).
- `cordis.patch.yml`, `package.json`, `locale/*.json`, `icon.svg`: bundle
  manifest, row insert, display title/description, original icon.

`client.js` also keeps an older block-sandbox renderer (`Legacy*` helpers,
`PALETTE`, `SPECIALS`) that the Farm page never calls. It is dormant, kept only so
the file still contains the previous experiment; delete those sections if you want
the module to be only the farm.
