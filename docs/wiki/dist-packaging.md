---
name: dist-packaging
description: How scripts/build.mjs packages each registered plugin self-contained into dist/<plugin>/ — full-build vs --plugin scoped cleaning, the plain recursive copy (each plugin already vendors a real lib/), the drift warning, and the argv/exit-code contract. Split summary-style from [[build-and-release]]; load when packaging plugins or debugging dist/ output.
kind: pipeline
sources:
  - scripts/build.mjs
  - test/build.test.mjs
verified_against: 7a3051e7624d902028f0e39152e1e5373267d3c7
---

# dist/ packaging (scripts/build.mjs)

The packaging leg of [[build-and-release]]: `node scripts/build.mjs [--plugin <name>|all]`
turns in-repo plugin sources into self-contained copies under `dist/<plugin>/`. The core is
the exported `buildPlugins(repo, only)` (CLI entry via `runAsCli`); the plugin list is
derived from `.claude-plugin/marketplace.json`, the single source of truth — registering a
plugin there is enough to have it packaged.

**Per target.** A plain recursive `cpSync` of the plugin sources to `dist/<plugin>/` — no
symlink to dereference, since each plugin already carries a real, committed copy of
repo-root `lib/` at `<plugin>/lib/` (kept in sync by `scripts/sync-lib.mjs`, see
[[chassis]]). No import rewriting: plugin code already imports `../lib/…`, which resolves
identically in the repo, the packaged copy, and any install.

**Cleaning is scoped to what's being built.** A full build (`all`, the default) deletes
`dist/` outright; `--plugin <name>` cleans and rebuilds only that plugin's `dist/<name>/`
dir — sibling packaged copies and unrelated dist output (e.g. `dist/npm` from
`build-npm.mjs`) survive. Each target's own dir is removed before repackaging so stale
files never merge over.

**Argv and exit codes.** `--plugin` with a missing value (last argv, or followed by another
flag) prints usage and exits 2 — never a `targets=[undefined]` crash. An unknown plugin
name throws before anything is cleaned (CLI exit 1). A drift guard warns about any
top-level directory carrying a `.claude-plugin/plugin.json` but missing from
marketplace.json, since it would silently not be built.

**dist/ is not committed.** `dist/` is gitignored — throwaway build output, recreated from
scratch on every full run.

## Connections

- Child of [[build-and-release]] (split summary-style per `docs/corpus-spec.md` v2); the
  catalog/version/docs-sync legs and the release story stay there.
- Distributes the [[chassis]], whose vendored `lib/` copies `scripts/sync-lib.mjs` keeps
  in sync — packaging itself does no dereferencing.
- The install-path e2e in the [[test-suite]] simulates both a Claude Code cache install and
  a symlink-unaware marketplace extraction; `test/build.test.mjs` pins the scoped-clean and
  usage-error contract.
