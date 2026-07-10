---
name: test-suite
description: The zero-dependency node --test suite under test/ that covers the chassis, every plugin's gates, the handoff return leg, and shared-region drift.
kind: pattern
sources:
  - test/chassis.test.mjs
  - test/codebase-to-course.course-gate.test.mjs
  - test/educate-deck-selfcontained.test.mjs
  - test/grounding-wiki.freshness.test.mjs
  - test/handoff.test.mjs
  - test/html-base.test.mjs
  - test/research-gates.test.mjs
  - test/return-leg.test.mjs
  - test/sync-shared.test.mjs
  - test/toolkit-borrow.test.mjs
  - test/wiki.test.mjs
  - .githooks/pre-commit
verified_against: 5934860e2021d1d3b096d3c6d7a30bf5d434c003
---

# Test suite

Eleven test files under `test/` keep the chassis and every plugin's gate logic honest. The suite
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

- `test/chassis.test.mjs` — smoke tests for shared `lib/`: project-root finders, markdown
  frontmatter/wikilinks, dates, template render, `checkHtml`, `createLifecycle`, installer
  helpers, and gate-runner `evaluate`.
- `test/codebase-to-course.course-gate.test.mjs` — the course output gate (`validateCourse`)
  against minimal fixture HTML with modules, quizzes, and translation blocks.
- `test/educate-deck-selfcontained.test.mjs` — a deck.html must honor its "single
  self-contained file, no CDN" contract; the DoD gate runs the shared verifier over it.
- `test/grounding-wiki.freshness.test.mjs` — the wiki freshness gate (`validateFreshness`,
  `parseSourcesBlock`) against a throwaway git repo.
- `test/handoff.test.mjs` — the shared handoff transport (write/read round-trip, opaque body,
  gitignored `.handoff/`) plus educate's `progress.json` evidence gate.
- `test/html-base.test.mjs` — `lib/html/base.html` and the deck template pass the
  self-contained verifier with zero warnings (theme-aware, has a data table).
- `test/research-gates.test.mjs` — research's branch/analysis gates (`validateVault`,
  `validateBranch`, `validateAnalysis`) against a synthetic fixture vault.
- `test/return-leg.test.mjs` — at `done`, a delegated build needs `foldedIn` evidence AND
  durable on-disk residue; a flag alone can't rubber-stamp the return leg.
- `test/sync-shared.test.mjs` — stamped visual-contract regions in consumers match their
  canonical sources (`driftReport` must be empty) and `stampRegion` replaces only marked bodies.
- `test/toolkit-borrow.test.mjs` — a deck that borrows toolkit modules (code-translation panel,
  reveal quiz) still passes educate's DoD gate and stays self-contained.
- `test/wiki.test.mjs` — educate's corpus-index roll-up (`topics/<topic>/WIKI.md` +
  `topics/WIKI.md`): table parsing, rendering, and staleness warnings.

**Pre-commit enforcement.** A tracked hook at `.githooks/pre-commit` (enabled once per clone
with `git config core.hooksPath .githooks`) runs, in order: `node --test`, then
`node scripts/gen-marketplace.mjs --check`, then `node scripts/sync-version.mjs --check` —
"keep the suite green and the catalog honest before every commit." It is `set -e`, so any
failure blocks the commit.

## Connections

- Covers the [[chassis]] end to end, including [[project-root]], [[markdown-module]],
  [[selfcontained-verifier]], [[lifecycle-engine]], [[gate-runner]], and [[installer]].
- Exercises each plugin's instantiation of the [[gates-convention]]: [[research-plugin]],
  [[educate-plugin]], [[grounding-wiki-plugin]], [[codebase-to-course-plugin]].
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
