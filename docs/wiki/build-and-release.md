---
name: build-and-release
description: Repo-level build tooling, the hub of the release story — packages each plugin self-contained into dist/ (build.mjs) and keeps the marketplace catalog, lockstep versions, stamped shared regions, and grounding docs consistent. Load for how in-repo plugin sources become installable packages; the merge-to-main release mechanics live in [[release-pipeline]] and the external npm-package/composite-action surface in [[gates-consumption-surface]].
kind: pipeline
sources:
  - scripts/build.mjs
  - scripts/sync-lib.mjs
  - scripts/sync-shared.mjs
  - scripts/gen-marketplace.mjs
  - scripts/sync-version.mjs
  - scripts/check-docs.mjs
  - scripts/stop-docs.mjs
  - .claude/settings.json
  - .claude-plugin/marketplace.json
  - .githooks/pre-commit
verified_against: 7a3051e7624d902028f0e39152e1e5373267d3c7
---

# Build and release

The repo-level pipeline that turns in-repo plugin sources (each carrying a real, committed
copy of the shared chassis at `<plugin>/lib/`, kept in sync with repo-root `lib/` by
`scripts/sync-lib.mjs` and imported as `../lib/…`) into independently installable packages,
while keeping four things from drifting: the marketplace catalog, the version numbers, the
literal copies of shared visual-contract regions, and the per-plugin chassis copies. Plugins
carry no `package.json` and never self-build; the scripts live in repo-root `scripts/`, and
GitHub Actions turns them into an automated release pipeline: every substantive merge to
`main` publishes exactly one GitHub Release named after the marketplace version.

## How it works

**Plugin discovery** — `.claude-plugin/marketplace.json` is the single source of truth. Its
`plugins[]` array (one entry per plugin dir) drives every script below; registering a plugin
there is enough to have it packaged.

**Packaging — [[dist-packaging]].** `scripts/build.mjs` (exported core
`buildPlugins(repo, only)`) copies each target plugin to gitignored `dist/<plugin>/` with a
plain recursive copy — each plugin's `lib/` is already a real, vendored directory, so there
is no symlink to dereference. Cleaning is scoped: a full build wipes `dist/` first, while
`--plugin <name>` cleans and rebuilds only that plugin's dir (sibling packages and
`dist/npm` survive). The mechanics and the argv/exit-code contract live in [[dist-packaging]].

**Chassis-copy consistency** (`scripts/sync-lib.mjs`). Each registered plugin's `<plugin>/lib/`
must be byte-identical to repo-root `lib/` — replaces the pre-TASK-0147 `lib -> ../lib`
symlink, which the Claude desktop app's marketplace sync (no symlink support) flattened into
a 6-byte text file, breaking every `../lib/…` import. Default mode overwrites every plugin's
copy (`syncLib`); `--check` (`driftReport`) exits 1, listing missing/stale/drifted files with
a fix hint. Guarded by `test/sync-lib.test.mjs`.

**Catalog consistency** (`scripts/gen-marketplace.mjs`). Generative, not just a re-sync: the
exported `genMarketplace(repo)` regenerates each entry's `name`/`description` from that
plugin's own `plugin.json` (preserving hand-set `category`/`tags`) and appends an entry for
any unregistered top-level dir with a `plugin.json`. `--check` exits 1 if the file would
change; guarded by `test/gen-marketplace.test.mjs`.

**Version consistency** (`scripts/sync-version.mjs`). Exactly one argument, validated before
any file is touched: a strict `x.y.z` (`0.3.0`) sets every plugin.json, the marketplace, and
`action.yml`'s `npx @praxisflux/gates@<version>` pin to that version; `--check` exits 1 on any
disagreement. It also stamps the repo's planted pdlc version (`AGENTS.md` marker, `.pdlc`).
Anything else — no argument, `--help`-style flags, non-semver — is a usage error: exit 2, zero
files written (guarded by `test/sync-version.test.mjs`; a target at or below the current value
stays allowed for repair/rollback). Versions are **lockstep**: the marketplace `version` is
the single release version and everything else follows it.

**Release mechanics — [[release-pipeline]].** Merges to `main` release automatically: CI
verifies every PR, the bump gate (`scripts/check-version-bump.mjs`) refuses released-surface
changes whose marketplace version didn't increase, and the release workflow publishes the npm
package before creating the tag `v<version>` and its GitHub Release. The workflows, bump
rules, OIDC publishing, and re-run behavior live in [[release-pipeline]].

**Docs-sync enforcement** (`scripts/check-docs.mjs`, `scripts/stop-docs.mjs`). The grounding
docs are treated as release artifacts too. `check-docs.mjs` verifies README.md names every
marketplace plugin (table row + `/plugin install` line) and every `lib/*.mjs` chassis module,
runs a two-way plugin census (a row or install line for an unregistered name is a problem,
and every `<N> plugins` count claim must equal the registered count), and checks that
`AGENTS.md` links `docs/releasing.md`; the freshness gate covers the semantic half. Both run
in CI on every PR, in the local hooks, and in a repo Stop hook (`stop-docs.mjs` on
`lib/gate-runner`, wired by the tracked `.claude/settings.json`). `check-docs` always blocks;
freshness blocks **except inside the re-pin window** (spec 057) — commits that staled a note
but are themselves unmerged owe the re-pin later, not now. Unexplained staleness still blocks,
and every unknown fails closed.

**External consumption — [[gates-consumption-surface]].** The gates run in repos that don't
carry praxisflux: `scripts/build-npm.mjs` stages the `@praxisflux/gates` npm package
(version lockstep by construction), and `action.yml` makes the repo double as a composite
GitHub Action that runs `npx @praxisflux/gates@<pin>` at a pinned release tag. The shared
runner (`scripts/run-gates.mjs`), the package contents, and the exit-code contract are
described in [[gates-consumption-surface]].

**Shared-region stamping** (`scripts/sync-shared.mjs`). Some shared content must live as a
literal copy inside consumer files (a planted template can't import at runtime). `SYNCS` maps
canonical sources to consumers: `praxisflux:tokens`/`praxisflux:theme` from `lib/html/base.html`
and `praxisflux:tooltip-css`/`praxisflux:tooltip-js` from `lib/toolkit/tooltip.md`, stamped into
`educate/templates/.template/deck.html`; and `praxisflux:handoff-protocol`,
`docs/handoff-protocol.md` → `lib/handoff-protocol.md`. Regions are delimited by `<name>:start` /
`<name>:end` marker lines; `extractRegion`/`stampRegion` copy the body between them. Default
mode re-stamps every consumer; `--check` (via `driftReport`) exits 1 on any byte difference.

## Connections

- Distributes the [[chassis]] (all of `lib/`, including the [[toolkit]]) by vendoring a real,
  stamped copy into each plugin's `lib/` (`scripts/sync-lib.mjs`) — there is no runtime
  cross-plugin lookup.
- Packages [[research-plugin]], [[educate-plugin]], [[build-plugin]],
  [[codebase-to-course-plugin]], [[grounding-wiki-plugin]], [[spec-bridge-plugin]],
  [[pdlc-plugin]], and [[team-review-plugin]], as registered in the marketplace file.
- The stamped theme regions originate in the HTML base described in [[chassis-utilities]];
  the tooltip regions come from the [[toolkit]].
- Split summary-style per `docs/corpus-spec.md` v2: [[dist-packaging]] carries the
  build.mjs packaging mechanics; [[release-pipeline]] carries the bump gate + CI + release
  workflows; [[gates-consumption-surface]] carries the npm package and the composite action.
- Guarded by [[test-suite]]: `sync-shared.test.mjs` and `sync-lib.test.mjs` each run their
  own `driftReport`; pre-commit also runs `board-mirror.mjs --check` (spec 071) — CI stays
  authoritative (`core.hooksPath` per-clone).
- The repo-level-tooling rule itself is part of [[skill-patterns]].

## Operational notes

- All scripts are zero-dependency Node (`node:` builtins plus the `lib/` chassis) and locate
  the repo root relative to their own file, so they work from any cwd.
- Every script's run-as-CLI entry uses `runAsCli` from `lib/cli.mjs`, which realpaths both
  `import.meta.url` and `process.argv[1]` before comparing, so invocation through a
  symlinked checkout path still runs the CLI body (the failure mode this fixed is detailed
  in [[gates-consumption-surface]]).
- Check modes for CI/hooks: `gen-marketplace.mjs --check`, `sync-version.mjs --check`,
  `sync-shared.mjs --check`, `sync-lib.mjs --check` — each exits 1 naming the fix.
- Hooks are opt-in per clone: `git config core.hooksPath .githooks`.
- Marketplace version at any commit: `.claude-plugin/marketplace.json`'s `version` (`v0.2.0` was the pipeline's first
  self-published release; `0.5.0` is the first to publish `@praxisflux/gates` to npm).
