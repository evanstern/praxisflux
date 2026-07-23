---
name: test-suite
description: The zero-dependency node --test suite under test/ that covers the chassis, every plugin's gates, the handoff return leg, and shared-region drift.
kind: pattern
sources:
  - test/chassis.test.mjs
  - test/check-docs.test.mjs
  - test/codebase-to-course.course-gate.test.mjs
  - test/codebase-to-course.validate.test.mjs
  - test/educate-deck-selfcontained.test.mjs
  - test/gen-marketplace.test.mjs
  - test/grounding-wiki.freshness.test.mjs
  - test/handoff.test.mjs
  - test/html-base.test.mjs
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
verified_against: f239615f94d67b076d14392f1659091e1f464ced
---

# Test suite

The test files under `test/` keep the chassis and every plugin's gate logic honest. The suite
is deliberately minimal: plain `node --test` with `node:test` and `node:assert/strict`, zero npm
dependencies (the repo has no `package.json`), and fixtures built in throwaway `mkdtempSync`
directories rather than checked-in test data.

## How it works

Conventions shared across the files:

- Runner: `node --test` from the repo root; files are named `<area>.test.mjs`.
- Fixtures are synthesized per-test in `os.tmpdir()` scratch dirs (a `scratch()` or `project()`
  helper per file); `test/grounding-wiki.freshness.test.mjs` even spins up a throwaway git repo
  with `execFileSync("git", …)`.
- Tests import the real gate/chassis modules directly (e.g.
  `../educate/gates/dod.mjs`, `../lib/gate-runner.mjs`), so they exercise the same code the
  Stop hooks run.

What each file covers:

- `test/check-docs.test.mjs` — the docs-sync structural gate: fixtures for each omission
  (missing plugin row / install line / chassis module / releasing link) plus "the praxisflux
  repo itself is in sync".
- `test/chassis.test.mjs` — smoke tests for shared `lib/`: project-root finders, markdown
  frontmatter/wikilinks, dates, template render, `checkHtml`, `createLifecycle`, installer
  helpers, and gate-runner `evaluate`.
- `test/codebase-to-course.course-gate.test.mjs` — the course output gate (`validateCourse`)
  against minimal fixture HTML with modules, quizzes, and translation blocks.
- `test/codebase-to-course.validate.test.mjs` — the course chrome's own validator
  (`references/validate.mjs`): translation-block pairing, bracket balance, `--fix`
  auto-close, the chrome version-stamp checks, and the orphan-content repros (panels
  outside any block, unclosed block opens) field-reported by the-stacks.
- `test/educate-deck-selfcontained.test.mjs` — a deck.html must honor its "single
  self-contained file, no CDN" contract; the DoD gate runs the shared verifier over it.
- `test/gen-marketplace.test.mjs` — the generative catalog: an unregistered plugin dir gets
  a marketplace entry, hand-set category/tags survive, regeneration is idempotent, and the
  repo's own catalog is never stale.
- `test/grounding-wiki.freshness.test.mjs` — the wiki freshness gate (`validateFreshness`,
  `parseSourcesBlock`) against a throwaway git repo, plus the plan loop (`classifyNote`
  truth table, stamp-only re-pin round-trip through `repin.mjs`, code-diff work orders,
  fresh-corpus silence, repin refusals).
- `test/handoff.test.mjs` — the shared handoff transport (write/read round-trip, opaque body,
  gitignored `.handoff/`) plus educate's `progress.json` evidence gate.
- `test/html-base.test.mjs` — `lib/html/base.html` and the deck template pass the
  self-contained verifier with zero warnings (theme-aware, has a data table).
- `test/research-gates.test.mjs` — research's branch/analysis gates (`validateVault`,
  `validateBranch`, `validateAnalysis`) against a synthetic fixture vault.
- `test/return-leg.test.mjs` — at `done`, a delegated build needs `foldedIn` evidence AND
  durable on-disk residue; a flag alone can't rubber-stamp the return leg.
- `test/spec-bridge.test.mjs` — the bridge gate: linked-task parsing (including the task's
  AC block), exceeds/lags/ok verdicts, `checkBridge` blocking, the Stop hook via gate-runner,
  `strictDone` mode (including the near-miss warning when only the analysis requirement
  blocks Done), and the deterministic `plan` command (status move, Done summary,
  post-regeneration re-mirror, no-op board, shell quoting).
- `test/spec-derive.test.mjs` — pure Spec Kit derivation: lifecycle stages → status,
  per-phase checkbox counts, regenerated `tasks.md` re-deriving fresh, strict-mode
  `analysis.md` requirements, and graceful degradation on malformed files.
- `test/sync-shared.test.mjs` — stamped visual-contract regions in consumers match their
  canonical sources (`driftReport` must be empty) and `stampRegion` replaces only marked bodies.
- `test/team-review.test.mjs` — the review output gate (`checkReview`: sections, citation
  resolution with repeated-basename tolerance, report-inside-target rejection, untouched vs
  mutated snapshot), the run lifecycle CLI (begin/finish/abandon, same-second id collision)
  under `$TEAM_REVIEW_HOME`, and the Stop-hook paths through gate-runner `evaluate`.
- `test/toolkit-borrow.test.mjs` — a deck that borrows toolkit modules (code-translation panel,
  reveal quiz) still passes educate's DoD gate and stays self-contained.
- `test/version-bump.test.mjs` — the release bump gate (`check-version-bump.mjs`): pure
  `evaluate()` scenarios (exempt/surface/tag-reuse/skill-version cases) plus an end-to-end
  run of the git wrapper over a throwaway git repo.
- `test/wiki.test.mjs` — educate's corpus-index roll-up (`topics/<topic>/WIKI.md` +
  `topics/WIKI.md`): table parsing, rendering, and staleness warnings.

**Hook and CI enforcement.** A tracked hook at `.githooks/pre-commit` (enabled once per clone
with `git config core.hooksPath .githooks`) runs, in order: `node --test` (wrapped in
`env -u GIT_DIR -u GIT_WORK_TREE -u GIT_INDEX_FILE` — in a worktree checkout git hands hooks
an absolute `GIT_DIR` that the suite's tmpdir fixture repos would otherwise inherit,
committing onto the real branch), then
`node scripts/gen-marketplace.mjs --check`, `node scripts/sync-version.mjs --check`, then
`node scripts/check-docs.mjs` — "keep the suite green and the catalog honest before every
commit." It is `set -e`, so any failure blocks the commit. A sibling `.githooks/pre-push`
runs the version-bump gate (`scripts/check-version-bump.mjs --base origin/main`) and the
wiki freshness gate before every push. Because
`core.hooksPath` is per-clone, the authoritative layer is CI: `.github/workflows/ci.yml`
repeats the suite, both `--check` validators, `check-docs.mjs`, the wiki freshness gate, a
full package build, and the bump gate on every PR (see [[build-and-release]]).

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
- The hooks path is opt-in per clone; without `core.hooksPath` set, nothing enforces the suite
  locally.
