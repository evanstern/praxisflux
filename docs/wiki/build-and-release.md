---
name: build-and-release
description: Repo-level tooling and CI/CD — packages each plugin self-contained into dist/, keeps catalog and versions consistent, enforces version bumps on released-surface PRs, and auto-publishes a GitHub Release per merged version.
kind: pipeline
sources:
  - scripts/build.mjs
  - scripts/sync-shared.mjs
  - scripts/gen-marketplace.mjs
  - scripts/sync-version.mjs
  - scripts/check-version-bump.mjs
  - scripts/check-docs.mjs
  - scripts/stop-docs.mjs
  - .claude/settings.json
  - .claude-plugin/marketplace.json
  - .github/workflows/ci.yml
  - .github/workflows/release.yml
  - .githooks/pre-commit
  - .githooks/pre-push
  - docs/releasing.md
verified_against: 3b52ce895223a0c76e9610ad39a7683471cb6f10
---

# Build and release

The repo-level pipeline that turns in-repo plugin sources (which import the shared chassis as
`../../lib/…`) into independently installable packages, while keeping three things from
drifting: the marketplace catalog, the version numbers, and the literal copies of shared
visual-contract regions. Plugins carry no `package.json` and never self-build; the scripts
live in repo-root `scripts/`, and GitHub Actions turns them into an automated release
pipeline: every substantive merge to `main` publishes exactly one GitHub Release named after
the marketplace version.

## How it works

**Plugin discovery** — `.claude-plugin/marketplace.json` is the single source of truth. Its
`plugins[]` array (currently educate, research, build, codebase-to-course, grounding-wiki,
spec-bridge, each with `name`, `source`, `description`, `category`, `tags`) drives every
script below; registering
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
to the marketplace's version; `--check` exits 1 on any disagreement. Versions are **lockstep**:
the marketplace `version` is the single release version and every plugin.json follows it.

**Bump enforcement** (`scripts/check-version-bump.mjs`, `--base <ref>` defaulting to
`origin/main`). Evaluates the committed range `merge-base(base, HEAD)..HEAD` with a pure
`evaluate()` core over git-gathered data. If the diff touches **released surface** — any
registered plugin dir, `lib/`, `scripts/`, or `.claude-plugin/` — the marketplace version must
be a strict semver increase over the base's, and the tag `v<version>` must not already exist;
`docs/`, `backlog/`, `test/`, `.github/`, `.githooks/`, and root markdown are exempt. A change
under `<plugin>/skills/<skill>/` additionally requires that skill's SKILL.md frontmatter
`version:` to increase (a skill gaining its first `version:` counts as bumped; a deleted skill
is skipped). Every SKILL.md carries a `version:` for this purpose.

**Docs-sync enforcement** (`scripts/check-docs.mjs`, `scripts/stop-docs.mjs`). The grounding
docs are treated as release artifacts too. `check-docs.mjs` verifies README.md names every
marketplace plugin (table row + `/plugin install` line) and every `lib/*.mjs` chassis module,
and that CLAUDE.md links `docs/releasing.md`; the wiki freshness gate
(`node grounding-wiki/gates/cli.mjs freshness . docs/wiki`) covers the semantic half. Both
run in CI on every PR, in the local hooks, and in a repo Stop hook (`stop-docs.mjs` on
`lib/gate-runner`, wired by the tracked `.claude/settings.json`) that blocks ending a session
turn while either fails.

**CI and release workflows.** `.github/workflows/ci.yml` runs on every PR (and main):
`node --test`, `gen-marketplace.mjs --check`, `sync-version.mjs --check`, a full `build.mjs`
package run, `check-docs.mjs`, the wiki freshness gate, and — PRs only — the bump gate
against `origin/<base branch>` (checkout uses `fetch-depth: 0` so merge-base and tags
resolve). `.github/workflows/release.yml` runs on
each push to `main`: it reads the marketplace version and, when tag `v<version>` is new,
re-verifies, builds, zips each `dist/<plugin>` as `<plugin>-v<version>.zip`, and publishes a
GitHub Release `v<version>` with generated notes (`gh release create`, `contents: write`).
When the tag already exists (a docs-only merge or re-run) it publishes nothing — idempotent
by construction. Bump-size guidance (patch/minor/major, the skill rule, recipes) lives in
`docs/releasing.md`, linked from `CLAUDE.md`.

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
  [[codebase-to-course-plugin]], [[grounding-wiki-plugin]], and [[spec-bridge-plugin]], as
  registered in the marketplace file.
- The stamped theme regions originate in the HTML base described in [[chassis-utilities]];
  the tooltip regions come from the [[toolkit]].
- Guarded by the [[test-suite]]: `test/sync-shared.test.mjs` runs `driftReport`,
  `test/version-bump.test.mjs` covers the bump gate (including an end-to-end run over a
  throwaway git repo), the pre-commit hook runs the `--check` validators, and the pre-push
  hook mirrors the bump gate locally (CI stays authoritative — `core.hooksPath` is per-clone).
- The bump gate is the release-side instance of the [[gates-convention]] ("status can't
  exceed proven artifacts", here: a release can't ship without its version bump).
- The repo-level-tooling rule itself is part of [[skill-patterns]].

## Operational notes

- All scripts are zero-dependency Node (`node:fs`, `node:path`) and locate the repo root
  relative to their own file, so they work from any cwd.
- Check modes for CI/hooks: `gen-marketplace.mjs --check`, `sync-version.mjs --check`,
  `sync-shared.mjs --check` — each exits 1 with a message naming the fix.
- `build.mjs` exits 1 on an unknown `--plugin` name; the unregistered-plugin case only warns.
- `check-version-bump.mjs` exits 0 on pass, 1 on failures (each error names the fix), 2 when
  the base ref can't be resolved (fetch it first).
- Hooks are opt-in per clone: `git config core.hooksPath .githooks`.
- Marketplace version at this commit: `0.3.1` (`v0.2.0` was the pipeline's first
  self-published release).
