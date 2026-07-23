---
name: build-and-release
description: Repo-level tooling and CI/CD — packages each plugin self-contained into dist/, stages the @praxisflux/gates npm package, keeps catalog and versions consistent, enforces version bumps on released-surface PRs, and auto-publishes npm + a GitHub Release per merged version.
kind: pipeline
sources:
  - scripts/build.mjs
  - scripts/build-npm.mjs
  - scripts/run-gates.mjs
  - action.yml
  - docs/consuming-gates.md
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
verified_against: 4af419050c5aa2aedb2a515173f301aef9440623
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
`plugins[]` array (one entry per plugin dir, each with `name`, `source`, `description`,
`category`, `tags`) drives every script below; registering
a plugin there is enough to have it packaged.

**Packaging** (`scripts/build.mjs`, run as `node scripts/build.mjs [--plugin <name>|all]`).
Deletes `dist/` outright, then for each target: copies the plugin sources to `dist/<plugin>/`
and swaps the copied `lib` symlink for a real copy of repo-root `lib/` (explicitly — Node's
`cpSync` `dereference` option doesn't materialize directory symlinks met mid-recursion). No
import rewriting: plugin code already imports `../lib/…`, which resolves identically through
the in-repo symlink, the packaged copy, and a marketplace install (the plugins spec
dereferences marketplace-internal symlinks into the cache copy). A drift guard warns about any
top-level directory that has a `.claude-plugin/plugin.json` but is missing from
marketplace.json, since it would silently not be built.

**npm package staging** (`scripts/build-npm.mjs`, run as
`node scripts/build-npm.mjs [--out <dir>]`, default `dist/npm/`). Carves the gate surface into
an installable npm package (`PACKAGE_NAME`, `@praxisflux/gates`): the same `scripts/run-gates.mjs`
the action uses, root `lib/`, each gate plugin's `gates/` dir, the plugin-local `lib` symlinks
materialized as real copies (npm cannot pack symlinks — the build fails on any symlink in the
output), and the course gate's `validate.mjs` reference. `package.json` is generated from
`marketplace.json`, so the npm version is lockstep by construction; `docs/consuming-gates.md`
ships as the README, root `LICENSE` (MIT) rides along, and the bin `praxisflux-gates` points at the
runner. `test/build-npm.test.mjs` packs the tree and drives the bin through a
`node_modules/.bin` symlink, asserting the contract exit codes.

**Catalog consistency** (`scripts/gen-marketplace.mjs`). Generative, not just a re-sync: the
exported `genMarketplace(repo)` regenerates each registered entry's `name` and `description`
from that plugin's own `.claude-plugin/plugin.json` (preserving the marketplace's top-level
fields and hand-set per-plugin `category`/`tags`) **and appends an entry for any top-level dir
that carries a `plugin.json` but isn't registered yet** (default category `productivity`, tags
from the plugin's `keywords`) — so the new-plugin checklist's "run gen-marketplace.mjs" is
true as written. `--check` exits 1 if the file would change; guarded by
`test/gen-marketplace.test.mjs`, including a repo-own-catalog staleness check.

**Version consistency** (`scripts/sync-version.mjs`). With an argument (`0.3.0`) it sets every
plugin.json, the marketplace, and `action.yml`'s `npx @praxisflux/gates@<version>` pin to that
version; with no argument it syncs those to the marketplace's version; `--check` exits 1 on any
disagreement. The pin rewrite is the pure exported `stampNpxPin(text, name, target)`, which also
reports the pins it found — a vanished pin fails loudly in both modes. Versions are
**lockstep**: the marketplace `version` is the single release version and everything else
follows it.

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
re-verifies, publishes the npm package, builds, zips each `dist/<plugin>` as
`<plugin>-v<version>.zip`, and publishes a GitHub Release `v<version>` with generated notes
(`gh release create`, `contents: write`). The npm step (`build-npm.mjs` then
`npm publish --access public`, authenticated by **OIDC trusted publishing** — `id-token:
write` plus the npmjs.com trusted-publisher entry for this repo/workflow, which also names
the `npm` GitHub environment (the release job declares `environment: npm` so the OIDC token
carries the matching claim); provenance is
automatic, npm is upgraded in-step since trusted publishing needs >= 11.5.1, and a present
`NPM_TOKEN` secret acts only as bootstrap/break-glass fallback) deliberately runs **before**
the release step that creates the tag, so a released tag can never exist whose npm version
isn't already live. When the tag already exists (a docs-only merge or re-run) it publishes nothing, and a
re-run after a partial failure skips the npm half if that version is already on the registry —
idempotent by construction. Bump-size guidance (patch/minor/major, the skill rule, recipes) lives in
`docs/releasing.md`, linked from `CLAUDE.md`.

**CI consumption surface** (`action.yml` + `scripts/run-gates.mjs` + `@praxisflux/gates`). The
repo doubles as a composite GitHub Action: consumer repos run the gates at a pinned release
tag with `uses: evanstern/praxisflux@v<version>` and a validated `gates:` input (`spec-bridge`,
`wiki-freshness`, `course`; unknown names fail loudly). The action's internals run
`npx --yes @praxisflux/gates@<pin>` — the npm package staged by `build-npm.mjs`, its pin stamped
in lockstep by `sync-version.mjs` and guaranteed live before the tag exists by the release
ordering above (the TASK-17 migration; the run-from-checkout era ended with it). Non-GitHub
CI and local one-offs call `npx @praxisflux/gates` directly. Either way `run-gates.mjs` maps gate
names onto the existing gate functions against the consumer workspace. Exit codes are the
contract (0 pass · 1 gate failure · 2 usage error); `wiki-freshness` detects shallow clones
and names the `fetch-depth: 0` fix. Consumer-facing docs: `docs/consuming-gates.md`.

**Shared-region stamping** (`scripts/sync-shared.mjs`). Some shared content must live as a
literal copy inside consumer files (a planted template can't import at runtime). The `SYNCS`
table maps canonical sources to consumers: the `praxisflux:tokens` and `praxisflux:theme` regions of
`lib/html/base.html`, and the `praxisflux:tooltip-css`/`praxisflux:tooltip-js` regions of
`lib/toolkit/tooltip.md`, all stamped into `educate/templates/.template/deck.html`. Regions are
delimited by `<name>:start` / `<name>:end` marker lines; `extractRegion`/`stampRegion` copy the
body between them. Default mode re-stamps every consumer; `--check` (via `driftReport`) exits 1
on any byte difference.

**dist/ is not committed.** `dist/` is listed in `.gitignore` and `git ls-files dist` returns
nothing — it is throwaway build output, recreated from scratch on every `build.mjs` run.

## Connections

- Distributes the [[chassis]] (all of `lib/`, including the [[toolkit]]) by dereferencing each
  plugin's `lib` symlink into a real copy — there is no runtime cross-plugin lookup.
- Packages [[research-plugin]], [[educate-plugin]], [[build-plugin]],
  [[codebase-to-course-plugin]], [[grounding-wiki-plugin]], [[spec-bridge-plugin]],
  [[pdlc-plugin]], and [[team-review-plugin]], as registered in the marketplace file.
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

- All scripts are zero-dependency Node (`node:` builtins plus the `lib/` chassis) and locate
  the repo root relative to their own file, so they work from any cwd.
- Every script's run-as-CLI entry uses `runAsCli` from `lib/cli.mjs`, which realpaths both
  `import.meta.url` and `process.argv[1]` before comparing — Node resolves the former through
  symlinks but leaves the latter as typed, so the naive equality check made any invocation
  through a symlinked checkout path silently run zero of the CLI body (for `run-gates.mjs`,
  a green exit having checked nothing). `test/run-gates.test.mjs` regression-covers the
  symlinked invocation.
- Check modes for CI/hooks: `gen-marketplace.mjs --check`, `sync-version.mjs --check`,
  `sync-shared.mjs --check` — each exits 1 with a message naming the fix.
- `build.mjs` exits 1 on an unknown `--plugin` name; the unregistered-plugin case only warns.
- `check-version-bump.mjs` exits 0 on pass, 1 on failures (each error names the fix), 2 when
  the base ref can't be resolved (fetch it first).
- Hooks are opt-in per clone: `git config core.hooksPath .githooks`.
- Marketplace version at any commit: `.claude-plugin/marketplace.json`'s `version` (`v0.2.0` was the pipeline's first
  self-published release; `0.5.0` is the first to publish `@praxisflux/gates` to npm).
