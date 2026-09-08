---
name: test-suite-catalog-plugins-gates
description: Per-file coverage of single-plugin output-gate suites — grounding-wiki's capsule + freshness gate, phase-status's vocabulary ladder, project-gates' tick-vs-red check, reorient's output gate and run lifecycle, research's branch/analysis gates, spec-bridge's bridge gate, spec-derive's pure derivation, and team-review's output gate. pdlc's own gate suites (plant surface + root-guard hook) split out to test-suite-catalog-plugins-gates-pdlc.
kind: pattern
sources:
  - test/grounding-wiki.capsules.test.mjs
  - test/grounding-wiki.freshness.test.mjs
  - test/phase-status.test.mjs
  - test/project-gates.test.mjs
  - test/reorient.test.mjs
  - test/research-gates.test.mjs
  - test/spec-bridge.test.mjs
  - test/spec-derive.test.mjs
  - test/team-review.test.mjs
verified_against: 026347a5275ba011e9c740a220848d801f4f0d7a
---

# Test suite — per-file coverage catalog (single-plugin output gates)

One half of the plugin catalog, split summary-style from [[test-suite-catalog-plugins]]: the
suites that prove one plugin's own output gate against its own fixtures, no cross-plugin
seam involved. pdlc's own gate suites — its plant surface and its opt-in root-guard hook —
outgrew this note on their own and split further into
[[test-suite-catalog-plugins-gates-pdlc]] (`test/pdlc.test.mjs`, `root-guard-hook.test.mjs`,
`root-guard-scan.test.mjs`). One bullet per remaining `test/*.test.mjs` file:

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
- `test/phase-status.test.mjs` — the opt-in phase-grain status vocabulary (additive to the
  spec-derive/spec-bridge suites): the five-stage derivation ladder (specifying →
  planning → implementing → validating → reviewing, incl. single-phase tasks.md and
  strict-mode `analysis.md` holds), status as the fixed collapse of the stage
  (`coarseStatus` parity by construction); `vocabularyProfile` (absent/malformed/
  rename-free config opts out, partial maps overlay defaults, cover spans merge
  same-named stages); `stageVerdict` exceeds/lags/ok/unknown, reproducing `verdict()`
  everywhere on an unrenamed vocabulary; the gate and `planBridge` speaking the board's
  vocabulary (a named review stage plans no auto-Done); and config-absent gate + plan
  output byte-identical to the 3-status contract. Also (spec 050) `projectGatesProfile` cases
  (opt-out, string-command rejection, bucket normalization, name-trim, malformed drop).
- `test/project-gates.test.mjs` — the tick-vs-red-gate check (spec 050) plus its fan-out and
  dirty-tree fixes (spec 061): a ticked box can't outrun a red declared gate, and one red gate
  now yields exactly **one** collapsed finding per invocation (naming gate + bucket + reason +
  affected count), never one per linked spec. Drives `evaluateProjectGates`/`collapsedGateProblems`
  via injected `run`; `runGateCommand` real only where tested. Cases: **blocking** (Done-eligible
  + red `required` ⇒ one collapsed finding); **fan-out** (N ≥ 2 Done-eligible specs still yield
  ONE finding, not N — negative control asserts the count is *not* N); **allowance** (`verifyBridge`
  mid-PR runs `required` only, `checkBridge` none), preserving the bucket asymmetry under the
  collapse (`redByConstruction` counts only the Done-eligible subset); **boundary**
  (`redByConstruction` red at Done-eligible ⇒ blocks, both entry points agree); **fail-closed**
  (ENOENT/timeout ⇒ never green; `isTreeDirty` itself fails closed to clean/blocking on any spawn
  error); **dirty-tree label** (a red gate on a dirty tree ⇒ labeled, non-blocking warning; the
  same red gate on a clean tree ⇒ still blocks, the control; both `checkBridge` and `verifyBridge`,
  the latter now `{ problems, warnings }` rather than a flat array, T018a); **no-config parity**
  (0 gate calls; frozen 3-status strings); **guard/sharing** (injected `run` bypasses
  `SPEC_BRIDGE_GATE_ACTIVE` while the default runner short-circuits; each command spawned once);
  **`bridgeGate` wiring** (the dirty-tree warning reaches `warn()` from `check()`'s single gate
  run, subprocess count unchanged; a `gateActive` seam lets these tests call the real Stop-hook
  wrapper honestly even when the suite itself runs as this repo's own `tests` gate child under
  `SPEC_BRIDGE_GATE_ACTIVE=1`); **R4 trace** (opt-in `SPEC_BRIDGE_GATE_TRACE`: absent ⇒ no file
  written, verdict unchanged; set ⇒ one JSONL record naming resolved roots + bounded per-command
  argv/status/stdout/stderr; a write failure is swallowed, never affecting the verdict).
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

## Connections

- Parent note: [[test-suite-catalog-plugins]] — the plugin-half entry point.
- Child: [[test-suite-catalog-plugins-gates-pdlc]] — pdlc's own plant + root-guard suites.
- Sibling: [[test-suite-catalog-plugins-pipeline]] — the content-authoring pipeline and
  cross-plugin handoff suites.
- Grandparent: [[test-suite]] — conventions, pre-commit/pre-push hooks, and the CI layer.
- `reorient.test.mjs` proves the [[reorient-run-ownership]] doctrine.
