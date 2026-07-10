---
name: build-and-release
description: Repo-level tooling that packages each plugin self-contained into dist/, keeps the marketplace catalog and versions consistent, and stamps shared regions into consumers.
kind: pipeline
sources:
  - scripts/build.mjs
  - scripts/sync-shared.mjs
  - scripts/gen-marketplace.mjs
  - scripts/sync-version.mjs
  - .claude-plugin/marketplace.json
verified_against: 5934860e2021d1d3b096d3c6d7a30bf5d434c003
---

# Build and release

The repo-level pipeline that turns in-repo plugin sources (which import the shared chassis as
`../../lib/…`) into independently installable packages, while keeping three things from
drifting: the marketplace catalog, the version numbers, and the literal copies of shared
visual-contract regions. Plugins carry no `package.json` and never self-build; all of this
tooling lives in repo-root `scripts/`.

## How it works

**Plugin discovery** — `.claude-plugin/marketplace.json` is the single source of truth. Its
`plugins[]` array (currently educate, research, build, codebase-to-course, grounding-wiki, each
with `name`, `source`, `description`, `category`, `tags`) drives every script below; registering
a plugin there is enough to have it packaged.

**Packaging** (`scripts/build.mjs`, run as `node scripts/build.mjs [--plugin <name>|all]`).
Deletes `dist/` outright, then for each target: copies the plugin sources to `dist/<plugin>/`,
vendors repo-root `lib/` wholesale into `dist/<plugin>/lib/`, and rewrites every `.mjs` import
from `../../lib/` to `../lib/` (`rewriteLibImports`) — every lib importer sits in a depth-1
subdir (`scripts/` or `gates/`), so the rewrite is uniform. A drift guard warns about any
top-level directory that has a `.claude-plugin/plugin.json` but is missing from
marketplace.json, since it would silently not be built.

**Catalog consistency** (`scripts/gen-marketplace.mjs`). Regenerates each marketplace entry's
`name` and `description` from that plugin's own `.claude-plugin/plugin.json`, preserving the
marketplace's top-level fields and per-plugin `category`/`tags`. `--check` exits 1 if the file
would change.

**Version consistency** (`scripts/sync-version.mjs`). With an argument (`0.3.0`) it sets every
plugin.json and the marketplace to that version; with no argument it syncs all plugin.json files
to the marketplace's version; `--check` exits 1 on any disagreement.

**Shared-region stamping** (`scripts/sync-shared.mjs`). Some shared content must live as a
literal copy inside consumer files (a planted template can't import at runtime). The `SYNCS`
table maps canonical sources to consumers: the `praxis:tokens` and `praxis:theme` regions of
`lib/html/base.html`, and the `praxis:tooltip-css`/`praxis:tooltip-js` regions of
`lib/toolkit/tooltip.md`, all stamped into `educate/templates/.template/deck.html`. Regions are
delimited by `<name>:start` / `<name>:end` marker lines; `extractRegion`/`stampRegion` copy the
body between them. Default mode re-stamps every consumer; `--check` (via `driftReport`) exits 1
on any byte difference.

**dist/ is not committed.** `dist/` is listed in `.gitignore` and `git ls-files dist` returns
nothing — it is throwaway build output, recreated from scratch on every `build.mjs` run.

## Connections

- Distributes the [[chassis]] (all of `lib/`, including the [[toolkit]]) by vendoring it into
  each packaged plugin — there is no runtime cross-plugin lookup.
- Packages [[research-plugin]], [[educate-plugin]], [[build-plugin]],
  [[codebase-to-course-plugin]], and [[grounding-wiki-plugin]], as registered in the
  marketplace file.
- The stamped theme regions originate in the HTML base described in [[chassis-utilities]];
  the tooltip regions come from the [[toolkit]].
- Guarded by the [[test-suite]]: `test/sync-shared.test.mjs` runs `driftReport`, and the
  pre-commit hook runs `gen-marketplace.mjs --check` and `sync-version.mjs --check`.
- The repo-level-tooling rule itself is part of [[skill-patterns]].

## Operational notes

- All scripts are zero-dependency Node (`node:fs`, `node:path`) and locate the repo root
  relative to their own file, so they work from any cwd.
- Check modes for CI/hooks: `gen-marketplace.mjs --check`, `sync-version.mjs --check`,
  `sync-shared.mjs --check` — each exits 1 with a message naming the fix.
- `build.mjs` exits 1 on an unknown `--plugin` name; the unregistered-plugin case only warns.
- Marketplace version at this commit: `0.1.0`.
