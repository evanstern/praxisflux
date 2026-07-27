---
name: dist-packaging
description: How scripts/build.mjs packages each registered plugin self-contained into dist/<plugin>/ — full-build vs --plugin scoped cleaning, the lib-symlink dereference, the drift warning, and the argv/exit-code contract. Split summary-style from [[build-and-release]]; load when packaging plugins or debugging dist/ output.
kind: pipeline
sources:
  - scripts/build.mjs
  - test/build.test.mjs
verified_against: 25d53c222befab08aa10e8ef18463c2efe4df314
---

# dist/ packaging (scripts/build.mjs)

The packaging leg of [[build-and-release]]: `node scripts/build.mjs [--plugin <name>|all]`
turns in-repo plugin sources into self-contained copies under `dist/<plugin>/`. The core is
the exported `buildPlugins(repo, only)` (CLI entry via `runAsCli`); the plugin list is
derived from `.claude-plugin/marketplace.json`, the single source of truth — registering a
plugin there is enough to have it packaged.

**Per target.** Copies the plugin sources to `dist/<plugin>/` and swaps the copied `lib`
symlink for a real copy of repo-root `lib/` (explicitly — Node's `cpSync` `dereference`
option doesn't materialize directory symlinks met mid-recursion). No import rewriting:
plugin code already imports `../lib/…`, which resolves identically through the in-repo
symlink, the packaged copy, and a marketplace install (the plugins spec dereferences
marketplace-internal symlinks into the cache copy).

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
- Distributes the [[chassis]] by dereferencing each plugin's `lib` symlink into a real copy.
- The same dereference is simulated by the install-path e2e in the [[test-suite]];
  `test/build.test.mjs` pins the scoped-clean and usage-error contract.
