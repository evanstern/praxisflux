---
name: test-suite-catalog-plugins
description: Per-file coverage catalog of the node --test suite, plugin half — what each plugin-gate and cross-plugin-seam test file pins down (spec-bridge/spec-derive/phase-status, grounding-wiki, educate/build handoff legs, codebase-to-course, research, reorient, team-review, pdlc plant, wiki roll-up), one bullet per file. Repo-tooling suites live in test-suite-catalog.
kind: pattern
sources:
  - test/codebase-to-course.course-gate.test.mjs
  - test/codebase-to-course.validate.test.mjs
  - test/educate-deck-selfcontained.test.mjs
  - test/grounding-wiki.capsules.test.mjs
  - test/grounding-wiki.freshness.test.mjs
  - test/handoff.test.mjs
  - test/pdlc.test.mjs
  - test/phase-status.test.mjs
  - test/reorient.test.mjs
  - test/research-gates.test.mjs
  - test/return-leg.test.mjs
  - test/spec-bridge.test.mjs
  - test/spec-derive.test.mjs
  - test/team-review.test.mjs
  - test/toolkit-borrow.test.mjs
  - test/wiki.test.mjs
verified_against: 6d39b8d0406b331df38aff625654d5dd1e38f253
---

# Test suite — per-file coverage catalog (plugin gates & seams)

The plugin half of the per-file [[test-suite]] map, split summary-style from
[[test-suite-catalog]] (which holds the chassis, tooling, and release files). One bullet
per `test/*.test.mjs` file:

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
- `test/grounding-wiki.capsules.test.mjs` — the capsule tier (corpus-spec v2): CAPSULES.md
  generation (deterministic, headered, INDEX-ordered, corpusDir-spelling-invariant across
  relative/absolute/trailing-slash invocations, pre-normalization headers degrading to a
  WARN with regeneration guidance) and the freshness gate's adoption-keyed budget
  enforcement (capsule/body overages, `size_budget_exempt` downgrade, stale/hand-edited
  rollup, warn-only before adoption).
- `test/grounding-wiki.freshness.test.mjs` — the wiki freshness gate (`validateFreshness`,
  `noteSources`/`parseSourcesBlock` — inline `[a, b]` arrays and block lists
  staleness-check identically; missing/renamed source paths block naming note + path)
  against a throwaway git repo, plus the plan loop (`classifyNote` truth table,
  stamp-only re-pin round-trip through `repin.mjs`, code-diff work orders,
  fresh-corpus silence, repin refusals — incl. a well-formed hash naming no commit
  and notes outside git, note untouched).
- `test/handoff.test.mjs` — the shared handoff transport (round-trip, opaque body,
  gitignored `.handoff/`) plus educate's `progress.json` evidence gate, including the
  delegated round trip with each leg doing exactly what its skill instructs: build writes
  only the response, and the gate stays blocked at `built` until educate's return-leg
  evidence write (`handoff.returned`) lands — TASK-63 seam ownership.
- `test/pdlc.test.mjs` — pdlc's plant surface (`pdlc/scripts/plant.mjs`): plugin
  registration + bootstrap SKILL frontmatter, template markers well-formed and carrying
  the 101 principles from `docs/principles.md`, `renderGrounding` token substitution with
  non-opted peer blocks stripped; planting fresh/append/idempotent, a drifted block never
  overwritten without `--force` (the sentinel doesn't advance past drift), peer-change
  drift, `--check` writing nothing and exiting 1 while pending; the `peersOmitted` trace
  (sentinel field, one stderr notice per omitted peer, legacy sentinels stay readable);
  and the `resolveProjectName` ladder — override > recorded > worktree gitdir parse >
  basename — so worktree plants render the PRIMARY checkout's name and re-plants from
  either side stay unchanged, never drifted.
- `test/phase-status.test.mjs` — the opt-in phase-grain status vocabulary (additive to the
  spec-derive/spec-bridge suites): the five-stage derivation ladder (specifying →
  planning → implementing → validating → reviewing, incl. single-phase tasks.md and
  strict-mode `analysis.md` holds), status as the fixed collapse of the stage
  (`coarseStatus` parity by construction); `vocabularyProfile` (absent/malformed/
  rename-free config opts out, partial maps overlay defaults, cover spans merge
  same-named stages); `stageVerdict` exceeds/lags/ok/unknown, reproducing `verdict()`
  everywhere on an unrenamed vocabulary; the gate and `planBridge` speaking the board's
  vocabulary (a named review stage plans no auto-Done); and config-absent gate + plan
  output byte-identical to the 3-status contract.
- `test/reorient.test.mjs` — reorient end to end: the output gate (`checkReorient` blocks
  until analyses + synthesis exist, demands every corpus branch named plus the sections,
  refuses in-corpus syntheses and empty lenses; adhoc corpus needs no analysis note),
  corpus classification + grounding detection, and the run-lifecycle CLI under
  `$REORIENT_HOME`: begin/finish/abandon with owner + heartbeat stamping and run-id-keyed
  syntheses, worktree-first refusal keyed to the TARGET checkout (the `--shared-checkout`
  override recorded on the manifest and surfaced by list/provenance), the registry rooted
  at the target root — never the invoking cwd, owner-only abandon with explicit
  `takeover`, `heartbeatOwnedRuns` refreshing only owned in-flight runs, and Stop-hook
  scoping: the owner is nagged, foreign runs warn only once the heartbeat is stale,
  legacy ownerless records keep checkout-scoped blocking (doctrine:
  [[reorient-run-ownership]]).
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
- `test/team-review.test.mjs` — the output gate (`checkReview`: sections, citation
  resolution, in-target rejection with `.handoff/` exempt, untouched vs mutated snapshot),
  the run CLI (begin/finish/abandon, id collisions, self-review regressions: default-report
  round trip, same-day uniqueness, tracked-copy policy — pure-defaults finish lands
  `docs/reviews/`, `--report` never copies), and the Stop-hook paths via gate-runner.
- `test/toolkit-borrow.test.mjs` — a deck that borrows toolkit modules (code-translation panel,
  reveal quiz) still passes educate's DoD gate and stays self-contained.
- `test/wiki.test.mjs` — educate's corpus-index roll-up (`topics/<topic>/WIKI.md` +
  `topics/WIKI.md`): parsing, rendering, staleness warnings; plus the spawned wiki CLI's
  check/sync contract — a vault-less single-topic `--check` converges with `--sync`
  (distinct no-vaults verdict, exit 0), a vaulted stale topic still exits 1 and is fixed
  by the `--sync` its message names.

## Connections

- Parent note: [[test-suite]] — conventions, pre-commit/pre-push hooks, and the CI layer.
- Sibling half: [[test-suite-catalog]] — chassis, tooling, and release files.
- `handoff.test.mjs` and `return-leg.test.mjs` pin down the [[handoff-protocol]] transport and
  its evidence-plus-residue return leg.
- `reorient.test.mjs` proves the [[reorient-run-ownership]] doctrine; `pdlc.test.mjs` pins the
  [[pdlc-plugin]] plant surface.
