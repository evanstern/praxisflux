---
name: test-suite-catalog-plugins-pipeline
description: Per-file coverage of the content-authoring pipeline and cross-plugin handoff test suites — codebase-to-course's course-gate and chrome validator, educate's deck self-containment and topic-wiki roll-up, the build↔educate handoff/return-leg seam (TASK-63), and toolkit-borrow's cross-plugin DoD proof — one bullet per file. Split summary-style from test-suite-catalog-plugins; the single-plugin gate half lives in test-suite-catalog-plugins-gates.
kind: pattern
sources:
  - test/codebase-to-course.course-gate.test.mjs
  - test/codebase-to-course.validate.test.mjs
  - test/educate-deck-selfcontained.test.mjs
  - test/handoff.test.mjs
  - test/return-leg.test.mjs
  - test/toolkit-borrow.test.mjs
  - test/wiki.test.mjs
verified_against: 3bc4899531e62df1b3f0442fec753bf30023f8b0
---

# Test suite — per-file coverage catalog (content pipeline & handoff seams)

The other half of the plugin catalog, split summary-style from [[test-suite-catalog-plugins]]:
the content-authoring pipeline (codebase-to-course, educate's deck and topic-wiki) and the
cross-plugin handoff seams (build↔educate, toolkit↔educate). One bullet per
`test/*.test.mjs` file:

- `test/codebase-to-course.course-gate.test.mjs` — the course output gate (`validateCourse`)
  against minimal fixture HTML with modules, quizzes, and translation blocks.
- `test/codebase-to-course.validate.test.mjs` — the course chrome's own validator
  (`references/validate.mjs`): translation-block pairing, bracket balance, `--fix`
  auto-close, chrome version-stamp checks, and the orphan-content repros field-reported
  by the-stacks.
- `test/educate-deck-selfcontained.test.mjs` — a deck.html must honor its "single
  self-contained file, no CDN" contract via the DoD gate's shared verifier.
  Also the deck-requirement config: `decksStandardForEveryLesson` is array-or-flag
  tolerant like `isDelegated` (an empty array requires no deck+guide, end to end
  through the gate).
- `test/handoff.test.mjs` — the shared handoff transport (round-trip, opaque body,
  gitignored `.handoff/`) plus educate's `progress.json` evidence gate, including the
  delegated round trip with each leg doing exactly what its skill instructs: build writes
  only the response, and the gate stays blocked at `built` until educate's return-leg
  evidence write (`handoff.returned`) lands — TASK-63 seam ownership.
- `test/return-leg.test.mjs` — at `done`, a delegated build needs `foldedIn` evidence AND
  durable on-disk residue; a flag alone can't rubber-stamp the return leg.
- `test/toolkit-borrow.test.mjs` — a deck that borrows toolkit modules (code-translation panel,
  reveal quiz) still passes educate's DoD gate and stays self-contained.
- `test/wiki.test.mjs` — educate's corpus-index roll-up (`topics/<topic>/WIKI.md` +
  `topics/WIKI.md`): parsing, rendering, staleness warnings; plus the spawned wiki CLI's
  check/sync contract — a vault-less single-topic `--check` converges with `--sync`
  (distinct no-vaults verdict, exit 0), a vaulted stale topic still exits 1 and is fixed
  by the `--sync` its message names.

## Connections

- Parent note: [[test-suite-catalog-plugins]] — the plugin-half entry point.
- Sibling: [[test-suite-catalog-plugins-gates]] — the single-plugin output-gate suites.
- Grandparent: [[test-suite]] — conventions, pre-commit/pre-push hooks, and the CI layer.
- `handoff.test.mjs` and `return-leg.test.mjs` pin down the [[handoff-protocol]] transport and
  its evidence-plus-residue return leg.
