---
name: release-pipeline
description: The merge-to-main release mechanics, split from [[build-and-release]] — the version-bump gate on released-surface PRs (check-version-bump.mjs, mirrored by pre-push), ci.yml's per-PR checks including the planted-PDLC-block drift gate a bump forces a re-plant for, and release.yml's npm-before-tag publish ordering with OIDC trusted publishing. Load when touching the workflows, the bump gate, or the hooks, when deciding if a change needs a bump or a re-plant, or when a publish misbehaves.
kind: pipeline
sources:
  - scripts/check-version-bump.mjs
  - .github/workflows/ci.yml
  - .github/workflows/release.yml
  - .githooks/pre-push
  - docs/releasing.md
verified_against: 9b410267ee638ee2d16e8dc4aba28e29808ccf54
---

# Release pipeline

The enforce-then-publish half of [[build-and-release]]: how a PR is forced to arrive with an
honest version, and how a merge to `main` turns into exactly one published release with no
manual step. The invariant the ordering protects: **a released tag can never exist whose npm
version isn't already live.**

## Bump enforcement

`scripts/check-version-bump.mjs` (`--base <ref>` defaulting to `origin/main`) evaluates the
committed range `merge-base(base, HEAD)..HEAD` with a pure `evaluate()` core over
git-gathered data — uncommitted edits don't count, a bump must ship with the commits it
covers. If the diff touches **released surface** — any registered plugin dir, `lib/`,
`scripts/`, or `.claude-plugin/` — the marketplace version must be a strict semver increase
over the base's, and the tag `v<version>` must not already exist; `docs/`, `backlog/`,
`test/`, `.github/`, `.githooks/`, and root markdown are exempt. A change under
`<plugin>/skills/<skill>/` additionally requires that skill's SKILL.md frontmatter
`version:` to increase (a skill gaining its first `version:` counts as bumped; a deleted
skill is skipped; a non-semver base version like `v0.1.0` is a named failure — never a
silent skip of the increase check). Every SKILL.md carries a `version:` for this purpose. Bump-size guidance
(patch/minor/major, the skill rule, recipes) lives in `docs/releasing.md`, linked from
`CLAUDE.md` — as does the **re-plant obligation** a bump carries for downstream hosts
("Re-planting a downstream project after an upgrade": the `.pdlc`-vs-installed staleness test,
the bootstrap → `--check` → diff → consent → `--force` sequence, and the rule that project
edits belong outside the markers because the block refreshes wholesale).

## CI workflow

`.github/workflows/ci.yml` runs on every PR (and main): `node --test`,
`gen-marketplace.mjs --check`, `sync-version.mjs --check`, a full `build.mjs` package run,
`check-docs.mjs`, **this repo's own spec-bridge and wiki-freshness self-checks** (both via
`scripts/run-gates.mjs --path .`), **`plant.mjs --root . --peer backlog --check`** — the
repo's own planted PDLC block (below) — and, PRs only, the bump gate against
`origin/<base branch>` (checkout uses `fetch-depth: 0` so merge-base and tags resolve). A
second job, `install-path`, re-runs `test/install-path.test.mjs` on its own: the marketplace
install simulation that copies each hook-shipping plugin with its `lib` symlink dereferenced
and spawns its Stop hook end-to-end — the file also runs inside the main `node --test` step,
but the separate job keeps the install-path signal its own visible check.

The two self-check steps landed with spec 057, which moved them out of `node --test`: they
assert **repo state**, not code behavior, and mid-PR they are red by construction (see
[[gates-convention]]). `spec-bridge` had no CI step before that — its only enforcement was the
test spec 057 removed — so `test/run-gates.test.mjs` now asserts both steps stay in `ci.yml`.

The **planted-block** step (spec 066) is the third of that kind, and the same reasoning put it
here: `plant.mjs --check` had always exited 1 on a stale or drifted footprint, but **nothing
invoked it**, which is how this repo ran a `v0.57.0` block against a `v0.63.1` marketplace —
six versions stale, unnoticed. Its placement is forced rather than preferred: the block's
BEGIN marker quotes the planted version, so **a marketplace bump drifts the block by
construction** until the re-plant lands in the same PR, which would make the per-commit
surfaces (pre-commit, `check-docs.mjs`, the repo Stop hook) red between the two — exactly the
mid-PR redness spec 057 moved out of that path. `pre-push` was wrong for the mirror-image
reason: its harness downgrades findings to warnings, and a drifted block must fail loudly.
`--peer backlog` must match the peer set `.pdlc` records, since a different set strips or adds
block sections and reads as drift. `test/pdlc.test.mjs` asserts the step stays in `ci.yml`
(mutation-tested: deleting it fails), the drifted/clean exit codes, and — the CI-specific
hazard — that a renamed `actions/checkout` directory stays clean, because `resolveProjectName`
takes the name from `.pdlc` ahead of `basename(root)`.

The pre-push hook (`.githooks/pre-push`) runs the same bump and freshness checks locally but
**warns and exits 0** on findings, because both are legitimately red mid-PR; a check that
*cannot run* still blocks it (exit code alone can't tell findings from a crash, so each check
declares a marker its real output carries). CI stays authoritative — and `core.hooksPath` is
per-clone, so a local hook may be absent or, if it points at a stale path, silently run nothing
at all (observed 2026-08-27).

## Release workflow

`.github/workflows/release.yml` runs on each push to `main`: it reads the marketplace
version and, when tag `v<version>` is new, re-verifies (`node --test` plus the two `--check`
validators), publishes the npm package, builds, zips each `dist/<plugin>` as
`<plugin>-v<version>.zip`, and publishes a GitHub Release `v<version>` with generated notes
(`gh release create`, `contents: write`). The npm step (`build-npm.mjs` then
`npm publish --access public`) authenticates by **OIDC trusted publishing** — `id-token:
write` plus the npmjs.com trusted-publisher entry for this repo/workflow, which also names
the `npm` GitHub environment (the release job declares `environment: npm` so the OIDC token
carries the matching claim); provenance is automatic, npm is upgraded in-step since trusted
publishing needs >= 11.5.1, and a present `NPM_TOKEN` secret acts only as
bootstrap/break-glass fallback. It deliberately runs **before** the release step that
creates the tag, so a released tag can never exist whose npm version isn't already live —
that ordering is what lets the composite action's `npx @praxisflux/gates@<pin>` resolve
race-free (see [[gates-consumption-surface]]). When the tag already exists (a docs-only
merge or a re-run) it publishes nothing, and a re-run after a partial failure skips the npm
half if that version is already on the registry — idempotent by construction.

## Connections

- Split summary-style from [[build-and-release]], which keeps the packaging, catalog,
  version-lockstep, and docs-sync tooling this pipeline re-verifies and publishes.
- The npm package and composite action this ordering exists for are described in
  [[gates-consumption-surface]].
- The bump gate is the release-side instance of the [[gates-convention]] ("status can't
  exceed proven artifacts", here: a release can't ship without its version bump).
- Guarded by the [[test-suite]]: `test/version-bump.test.mjs` covers the bump gate
  (including an end-to-end run over a throwaway git repo).

## Operational notes

- `check-version-bump.mjs` exits 0 on pass, 1 on failures (each error names the fix), 2 when
  the base ref can't be resolved (fetch it first).
- Hooks are opt-in per clone: `git config core.hooksPath .githooks`.
