---
name: test-suite
description: The zero-dependency node --test suite under test/ that covers the chassis, every plugin's gates, the handoff return leg, and shared-region drift.
kind: pattern
sources:
  - test/chassis.test.mjs
  - test/check-docs.test.mjs
  - test/gate-shim.test.mjs
  - test/codebase-to-course.course-gate.test.mjs
  - test/codebase-to-course.validate.test.mjs
  - test/educate-deck-selfcontained.test.mjs
  - test/gen-marketplace.test.mjs
  - test/grounding-wiki.capsules.test.mjs
  - test/grounding-wiki.freshness.test.mjs
  - test/handoff.test.mjs
  - test/html-base.test.mjs
  - test/install-path.test.mjs
  - test/research-gates.test.mjs
  - test/return-leg.test.mjs
  - test/spec-bridge.test.mjs
  - test/spec-derive.test.mjs
  - test/sync-shared.test.mjs
  - test/team-review.test.mjs
  - test/toolkit-borrow.test.mjs
  - test/version-bump.test.mjs
  - test/wiki.test.mjs
  - .githooks/pre-commit
  - .githooks/pre-push
verified_against: 28c3dcb019ec83b5a806412a6d1cfb748ece0a9b
---

# Test suite

The test files under `test/` keep the chassis and every plugin's gate logic honest. The suite
is deliberately minimal: plain `node --test` with `node:test` and `node:assert/strict`, zero npm
dependencies (the repo has no `package.json`), and fixtures built in throwaway `mkdtempSync`
directories rather than checked-in test data.

## How it works

Conventions shared across the files:

- Runner: `node --test` from the repo root; files named `<area>.test.mjs`.
- Fixtures are synthesized per-test in `os.tmpdir()` scratch dirs (a `scratch()` or `project()`
  helper per file); `test/grounding-wiki.freshness.test.mjs` even spins up a throwaway git
  repo.
- Tests import the real gate/chassis modules directly (e.g. `../lib/gate-runner.mjs`), so
  they exercise the same code the Stop hooks run.

Per-file coverage:

- `test/check-docs.test.mjs` — the docs-sync structural gate: fixtures for each omission
  (missing plugin row / install line / chassis module / releasing link), the plugin census
  ("<N> plugins" count claims vs `marketplace.json`, in words and digits; ghost rows and
  install lines for unregistered names), "the praxisflux repo itself is in sync", and
  stop-docs' `underRepo` root match (symlinked launch fires; siblings never match).
- `test/gate-shim.test.mjs` — every shipped Stop-hook shim's node-missing path
  (catalog-derived): with no resolvable node, `gate.sh` still exits 0 but emits its
  one-time stderr notice; the suite-wide `TMPDIR` sentinel keeps later runs — and other
  plugins' shims — silent.
- `test/chassis.test.mjs` — smoke tests for shared `lib/`: project-root finders, markdown
  frontmatter/wikilinks, dates, template render, `checkHtml`, `createLifecycle`, installer
  helpers, and gate-runner `evaluate` (incl. crashing `resolveRoots`/`check` blocking as
  named problems).
- `test/codebase-to-course.course-gate.test.mjs` — the course output gate (`validateCourse`)
  against minimal fixture HTML with modules, quizzes, and translation blocks.
- `test/codebase-to-course.validate.test.mjs` — the course chrome's own validator
  (`references/validate.mjs`): translation-block pairing, bracket balance, `--fix`
  auto-close, chrome version-stamp checks, and the orphan-content repros field-reported
  by the-stacks.
- `test/educate-deck-selfcontained.test.mjs` — a deck.html must honor its "single
  self-contained file, no CDN" contract via the shared verifier.
- `test/gen-marketplace.test.mjs` — the generative catalog: an unregistered plugin dir gets
  an entry, hand-set category/tags survive, regeneration is idempotent, the repo's own
  catalog is never stale.
- `test/grounding-wiki.capsules.test.mjs` — the capsule tier (corpus-spec v2): CAPSULES.md
  generation (deterministic, headered, INDEX-ordered) and the freshness gate's
  adoption-keyed budget enforcement (capsule/body overages, `size_budget_exempt`
  downgrade, stale/hand-edited rollup, warn-only before adoption).
- `test/grounding-wiki.freshness.test.mjs` — the wiki freshness gate (`validateFreshness`,
  `parseSourcesBlock`) against a throwaway git repo, plus the plan loop (`classifyNote`
  truth table, stamp-only re-pin round-trip through `repin.mjs`, code-diff work orders,
  fresh-corpus silence, repin refusals).
- `test/handoff.test.mjs` — the shared handoff transport (round-trip, opaque body,
  gitignored `.handoff/`) plus educate's `progress.json` evidence gate.
- `test/html-base.test.mjs` — `lib/html/base.html` and the deck template pass the
  self-contained verifier with zero warnings (theme-aware, data table).
- `test/install-path.test.mjs` — the marketplace install path end to end: for every plugin
  shipping `hooks/hooks.json` (catalog-derived), simulate an install (`lib -> ../lib`
  dereferenced, no symlink survives), then spawn the exact Stop command from hooks.json
  with fake hook JSON on stdin — exit 0 clean, exit 2 with the gate's message on a
  per-plugin violating fixture, exit 0 under `stop_hook_active`. Runs hooks the way Claude
  Code spawns them rather than importing gate modules in-process; also its own CI job.
- `test/research-gates.test.mjs` — research's branch/analysis gates (`validateVault`,
  `validateBranch`, `validateAnalysis`) against a synthetic fixture vault.
- `test/return-leg.test.mjs` — at `done`, a delegated build needs `foldedIn` evidence AND
  durable on-disk residue; a flag alone can't rubber-stamp the return leg.
- `test/spec-bridge.test.mjs` — the bridge gate: linked-task parsing (incl. the AC block),
  exceeds/lags/ok verdicts, `checkBridge` blocking, the Stop hook via gate-runner,
  `strictDone` mode (incl. the analysis-only near-miss warning), and the deterministic
  `plan` command (status move, Done summary, re-mirror, no-op board, shell quoting).
- `test/spec-derive.test.mjs` — pure Spec Kit derivation: lifecycle stages → status,
  per-phase checkbox counts, regenerated `tasks.md` re-deriving fresh, strict-mode
  `analysis.md` requirements, and graceful degradation on malformed files.
- `test/sync-shared.test.mjs` — stamped visual-contract regions in consumers match their
  canonical sources (`driftReport` must be empty) and `stampRegion` replaces only marked bodies.
- `test/team-review.test.mjs` — the review output gate (`checkReview`: sections, citation
  resolution with repeated-basename tolerance, report-inside-target rejection, untouched
  vs mutated snapshot, `.handoff/` residue exempt), the run lifecycle CLI
  (begin/finish/abandon, id collisions, the self-review regression), and the Stop-hook
  paths through gate-runner `evaluate`.
- `test/toolkit-borrow.test.mjs` — a deck that borrows toolkit modules (code-translation panel,
  reveal quiz) still passes educate's DoD gate and stays self-contained.
- `test/version-bump.test.mjs` — the release bump gate (`check-version-bump.mjs`): pure
  `evaluate()` scenarios (exempt/surface/tag-reuse/skill-version cases) plus an end-to-end
  run of the git wrapper over a throwaway git repo.
- `test/wiki.test.mjs` — educate's corpus-index roll-up (`topics/**/WIKI.md`): parsing,
  rendering, staleness warnings.

**Hook and CI enforcement.** A tracked hook at `.githooks/pre-commit` (enabled once per clone
with `git config core.hooksPath .githooks`) runs, in order: `node --test` (wrapped in
`env -u GIT_DIR -u GIT_WORK_TREE -u GIT_INDEX_FILE` so worktree checkouts don't leak an
absolute `GIT_DIR` into the suite's tmpdir fixture repos), then
`node scripts/gen-marketplace.mjs --check`, `node scripts/sync-version.mjs --check`, then
`node scripts/check-docs.mjs`; it is `set -e`, so any failure blocks the commit. A sibling
`.githooks/pre-push` runs the version-bump gate (`check-version-bump.mjs --base
origin/main`) and the wiki freshness gate. Because `core.hooksPath` is per-clone, the
authoritative layer is CI: `.github/workflows/ci.yml` repeats the suite, both `--check`
validators, `check-docs.mjs`, the wiki freshness gate, a full package build, and the bump
gate on every PR (see [[build-and-release]]).

## Connections

- Covers the [[chassis]] end to end, including [[project-root]], [[markdown-module]],
  [[selfcontained-verifier]], [[lifecycle-engine]], [[gate-runner]], and [[installer]].
- Exercises each plugin's instantiation of the [[gates-convention]]: [[research-plugin]],
  [[educate-plugin]], [[grounding-wiki-plugin]], [[codebase-to-course-plugin]],
  [[spec-bridge-plugin]], [[team-review-plugin]].
- `handoff.test.mjs` and `return-leg.test.mjs` pin down the [[handoff-protocol]] transport and
  its evidence-plus-residue return leg.
- `sync-shared.test.mjs` imports `driftReport` from the [[build-and-release]] tooling, so
  hand-edited region drift fails the same suite the pre-commit hook runs.

## Operational notes

- Run: `node --test` at the repo root; no install step, no config file.
- The new-plugin checklist in [[skill-patterns]] requires tests under `test/` and a green
  `node --test`.
- The hooks path is opt-in per clone; without `core.hooksPath`, nothing enforces locally.
