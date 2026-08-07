---
name: build-and-release
description: Repo-level build tooling, the hub of the release story — packages each plugin self-contained into dist/ (build.mjs) and keeps the marketplace catalog, lockstep versions, stamped shared regions, and grounding docs consistent. Load for how in-repo plugin sources become installable packages; the merge-to-main release mechanics live in [[release-pipeline]] and the external npm-package/composite-action surface in [[gates-consumption-surface]].
kind: pipeline
sources:
  - scripts/build.mjs
  - scripts/sync-shared.mjs
  - scripts/gen-marketplace.mjs
  - scripts/sync-version.mjs
  - scripts/check-docs.mjs
  - scripts/stop-docs.mjs
  - .claude/settings.json
  - .claude-plugin/marketplace.json
  - .githooks/pre-commit
verified_against: 33b6fb248fc56c1697fce87098b2785343e2b496
---

# Build and release

The repo-level pipeline that turns in-repo plugin sources (which reach the shared chassis
through a committed `lib -> ../lib` symlink, importing it as `../lib/…`) into independently
installable packages, while keeping three things from
drifting: the marketplace catalog, the version numbers, and the literal copies of shared
visual-contract regions. Plugins carry no `package.json` and never self-build; the scripts
live in repo-root `scripts/`, and GitHub Actions turns them into an automated release
pipeline: every substantive merge to `main` publishes exactly one GitHub Release named after
the marketplace version.

## How it works

**Plugin discovery** — `.claude-plugin/marketplace.json` is the single source of truth. Its
`plugins[]` array (one entry per plugin dir) drives every script below; registering a plugin
there is enough to have it packaged.

**Packaging — [[dist-packaging]].** `scripts/build.mjs` (exported core
`buildPlugins(repo, only)`) copies each target plugin to gitignored `dist/<plugin>/` with
the `lib` symlink dereferenced into a real copy of the chassis. Cleaning is scoped: a full
build wipes `dist/` first, while `--plugin <name>` cleans and rebuilds only that plugin's
dir (sibling packages and `dist/npm` survive). The mechanics, the drift warning, and the
argv/exit-code contract live in [[dist-packaging]].

**Catalog consistency** (`scripts/gen-marketplace.mjs`). Generative, not just a re-sync: the
exported `genMarketplace(repo)` regenerates each registered entry's `name` and `description`
from that plugin's own `.claude-plugin/plugin.json` (preserving the marketplace's top-level
fields and hand-set per-plugin `category`/`tags`) **and appends an entry for any top-level dir
that carries a `plugin.json` but isn't registered yet** (default category `productivity`, tags
from the plugin's `keywords`) — so the new-plugin checklist's "run gen-marketplace.mjs" is
true as written. `--check` exits 1 if the file would change; guarded by
`test/gen-marketplace.test.mjs`, including a repo-own-catalog staleness check.

**Version consistency** (`scripts/sync-version.mjs`). Exactly one argument, validated before
any file is touched: a strict `x.y.z` (`0.3.0`) sets every plugin.json, the marketplace, and
`action.yml`'s `npx @praxisflux/gates@<version>` pin to that version; `--check` exits 1 on any
disagreement. Anything else — no argument, `--help`-style flags, non-semver — is a usage
error: exit 2, zero files written (guarded by `test/sync-version.test.mjs`; a target at or
below the current value stays allowed for repair/rollback — the bump gate polices increases).
The pin rewrite is the pure exported `stampNpxPin(text, name, target)`, which also
reports the pins it found — a vanished pin fails loudly in both modes. Versions are
**lockstep**: the marketplace `version` is the single release version and everything else
follows it.

**Release mechanics — [[release-pipeline]].** Merges to `main` release automatically, no
manual step: CI verifies every PR, the bump gate (`scripts/check-version-bump.mjs`) refuses
released-surface changes whose marketplace version didn't increase, and the release workflow
publishes the npm package **before** creating the tag `v<version>` and its GitHub Release —
so a released tag always resolves a live npm version. The workflows, the bump and skill-bump
rules, OIDC trusted publishing, and the idempotent re-run behavior live in
[[release-pipeline]].

**Docs-sync enforcement** (`scripts/check-docs.mjs`, `scripts/stop-docs.mjs`). The grounding
docs are treated as release artifacts too. `check-docs.mjs` verifies README.md names every
marketplace plugin (table row + `/plugin install` line) and every `lib/*.mjs` chassis module,
runs a two-way plugin census (a row or install line for a name `marketplace.json` doesn't
register is a problem, and every `<N> plugins` count claim in README prose — digits or
number words — must equal the registered count, so count drift fails the gate), and checks
that CLAUDE.md links `docs/releasing.md`; the wiki freshness gate
(`node grounding-wiki/gates/cli.mjs freshness . docs/wiki`) covers the semantic half. Both
run in CI on every PR, in the local hooks, and in a repo Stop hook (`stop-docs.mjs` on
`lib/gate-runner`, wired by the tracked `.claude/settings.json`) that blocks ending a session
turn while either fails. The Stop gate's `underRepo` (exported for tests) realpaths both
sides and requires a separator boundary: symlinked launches still fire; `praxis-anything`
siblings don't.

**External consumption — [[gates-consumption-surface]].** The gates run in repos that don't
carry praxisflux: `scripts/build-npm.mjs` stages the `@praxisflux/gates` npm package
(version lockstep by construction), and `action.yml` makes the repo double as a composite
GitHub Action that runs `npx @praxisflux/gates@<pin>` at a pinned release tag. The shared
runner (`scripts/run-gates.mjs`), the package contents, and the exit-code contract are
described in [[gates-consumption-surface]].

**Shared-region stamping** (`scripts/sync-shared.mjs`). Some shared content must live as a
literal copy inside consumer files (a planted template can't import at runtime). `SYNCS`
maps canonical sources to consumers: `praxisflux:tokens`/`praxisflux:theme` from
`lib/html/base.html` and `praxisflux:tooltip-css`/`praxisflux:tooltip-js` from
`lib/toolkit/tooltip.md`, stamped into `educate/templates/.template/deck.html`; and
`praxisflux:handoff-protocol`, `docs/handoff-protocol.md` → `lib/handoff-protocol.md`.
Regions are
delimited by `<name>:start` / `<name>:end` marker lines; `extractRegion`/`stampRegion` copy the
body between them. Default mode re-stamps every consumer; `--check` (via `driftReport`) exits 1
on any byte difference.

## Connections

- Distributes the [[chassis]] (all of `lib/`, including the [[toolkit]]) by dereferencing each
  plugin's `lib` symlink into a real copy — there is no runtime cross-plugin lookup.
- Packages [[research-plugin]], [[educate-plugin]], [[build-plugin]],
  [[codebase-to-course-plugin]], [[grounding-wiki-plugin]], [[spec-bridge-plugin]],
  [[pdlc-plugin]], and [[team-review-plugin]], as registered in the marketplace file.
- The stamped theme regions originate in the HTML base described in [[chassis-utilities]];
  the tooltip regions come from the [[toolkit]].
- Split summary-style per `docs/corpus-spec.md` v2: [[dist-packaging]] carries the
  build.mjs packaging mechanics; [[release-pipeline]] carries the bump gate + CI + release
  workflows; [[gates-consumption-surface]] carries the npm package and the composite action.
- Guarded by the [[test-suite]]: `test/sync-shared.test.mjs` runs `driftReport`, and the
  pre-commit hook runs the `--check` validators (CI stays authoritative —
  `core.hooksPath` is per-clone).
- The repo-level-tooling rule itself is part of [[skill-patterns]].

## Operational notes

- All scripts are zero-dependency Node (`node:` builtins plus the `lib/` chassis) and locate
  the repo root relative to their own file, so they work from any cwd.
- Every script's run-as-CLI entry uses `runAsCli` from `lib/cli.mjs`, which realpaths both
  `import.meta.url` and `process.argv[1]` before comparing, so invocation through a
  symlinked checkout path still runs the CLI body (the failure mode this fixed is detailed
  in [[gates-consumption-surface]]).
- Check modes for CI/hooks: `gen-marketplace.mjs --check`, `sync-version.mjs --check`,
  `sync-shared.mjs --check` — each exits 1 with a message naming the fix.
- Hooks are opt-in per clone: `git config core.hooksPath .githooks`.
- Marketplace version at any commit: `.claude-plugin/marketplace.json`'s `version` (`v0.2.0` was the pipeline's first
  self-published release; `0.5.0` is the first to publish `@praxisflux/gates` to npm).
