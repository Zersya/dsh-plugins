# Git Graph

A Git history View inside each conversation of DeepSeek Harness. It answers
"what happened here?" for the directory the session is actually working in,
which may be a worktree the session created rather than the repo you started
from.

## What it shows

- Commit lanes for the session directory's branch graph, with a cap that you can
  raise (default 220 commits, max 800).
- Branch, tag, and `HEAD` refs on the commits they point at.
- Working-tree state: staged, unstaged, untracked, and conflicting paths, plus
  ahead/behind against the upstream.
- Detached `HEAD` and initial (unborn) repositories are handled explicitly.

## Install

Add the package to a DSH profile and register the bundle, then restart:

```jsonc
// ~/.dsh/profiles/<profile>/package.json
{
  "dependencies": { "@local/git-graph": "link:/absolute/path/to/git-graph-plugin" },
  "dsh": { "profile": { "bundles": ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app", "@local/git-graph"] } }
}
```

See the repository [README](../README.md) for the full install and adaptation
notes.

## Safety model

- Read-only plumbing only: `rev-parse`, `status`, `log`, `for-each-ref`,
  `rev-list`, `show`. No command mutates the repository, and `status` runs with
  `--no-optional-locks` so it does not refresh the index on disk.
- The directory is always the conversation's own working directory, taken from
  the session. The Client half never supplies a path, so a View cannot be
  pointed at an arbitrary directory.
- Every request passes `ctx.connection.admit` first, mirroring the shipped `/api`
  bridge, and subprocesses run with `GIT_TERMINAL_PROMPT=0` and a 12s timeout.

## Files

- `index.js`: Host half. Registers the `/git-graph` route and spawns Git through
  `ctx.subprocess`.
- `git.js`: parsing layer. Pure functions over a `run(cwd, args)` callback, so
  tests can feed fixtures without a repository.
- `client.js`: the View, injected into the conversation workspace slots.
- `cordis.patch.yml`, `package.json`, `locale/*.json`, `icon.svg`: bundle
  manifest, row insert, display title/description, icon.
