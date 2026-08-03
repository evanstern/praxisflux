---
name: test-suite-catalog-plugins-gates
description: Per-file coverage of the single-plugin output-gate suites — grounding-wiki's capsule tier and freshness gate, pdlc's plant surface and root-guard hook, phase-status's vocabulary ladder, reorient's output gate and run lifecycle, research's branch/analysis gates, spec-bridge's bridge gate, spec-derive's pure derivation, and team-review's output gate — one bullet per file. Split summary-style from test-suite-catalog-plugins; the pipeline/handoff half lives in test-suite-catalog-plugins-pipeline.
kind: pattern
sources:
  - test/grounding-wiki.capsules.test.mjs
  - test/grounding-wiki.freshness.test.mjs
  - test/pdlc.test.mjs
  - test/phase-status.test.mjs
  - test/reorient.test.mjs
  - test/research-gates.test.mjs
  - test/root-guard-hook.test.mjs
  - test/root-guard-scan.test.mjs
  - test/spec-bridge.test.mjs
  - test/spec-derive.test.mjs
  - test/team-review.test.mjs
verified_against: 1f873c59283170aba72925e5a7fe0e3ca7d61520
---

# Test suite — per-file coverage catalog (single-plugin output gates)

One half of the plugin catalog, split summary-style from [[test-suite-catalog-plugins]]: the
suites that prove one plugin's own output gate against its own fixtures, no cross-plugin
seam involved. One bullet per `test/*.test.mjs` file:

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
- `test/pdlc.test.mjs` — pdlc's plant surface (`pdlc/scripts/plant.mjs`): plugin
  registration + bootstrap SKILL frontmatter (name/version/description, the last
  backported from the refactor-triage pattern below — spec 047), template markers
  well-formed and carrying the 101 principles from `docs/principles.md`,
  `renderGrounding` token substitution with non-opted peer blocks stripped; the
  model-tier rubric contract (spec 048) — the template's `## Model tiers` section sits
  inside the grounding markers before the peer blocks, names the
  `.claude/agents/<tier>-implementer.md` frontmatter `model:` pin and cites the
  2026-07-31 field case, marks the agent definition authoritative over the planted-default
  table, with the bootstrap SKILL resolving IDs against the live harness (`claude-api`)
  and sweep's Phase 1 item 2 naming the same planted location; planting
  fresh/append/idempotent, a drifted block never overwritten without `--force` (the
  sentinel doesn't advance past drift), peer-change drift, `--check` writing nothing and
  exiting 1 while pending; the `peersOmitted` trace (sentinel field, one stderr notice
  per omitted peer, legacy sentinels stay readable); the `resolveProjectName` ladder —
  override > recorded > worktree gitdir parse > basename — so worktree plants render the
  PRIMARY checkout's name and re-plants from either side stay unchanged, never drifted; the
  opt-in root-guard hook planting (spec 051) — `--hook root-guard` copying BOTH hook files
  into `.claude/hooks/` and merging the two `PreToolUse` entries into `.claude/settings.json`,
  idempotent, preserving a host's pre-existing hooks, `--check` writing nothing, unknown-hook
  rejection; and the refactor-triage skill shape (spec 033, deepened to the new-plugin standard by
  spec 047) — frontmatter parsed via the chassis `parseFrontmatter` (not a key-order
  regex) plus the full phase skeleton (`## Precondition gate` through the four numbered
  phases, `## Output gate`, `## Handing off`) so a gutted phase drops a header and fails
  loud; phase-content anchors pinning the triage-record path template
  (`docs/reviews/refactor-triage-<run-id>.md`), the backlog-CLI-only Execute contract,
  and the team-review lens framing; the three entry modes + declared-policy headless
  rule; sweep's Handing off naming refactor-triage; and a cross-plugin test extracting
  the `docs/reviews/team-review-<run-id>.md` path template from both refactor-triage's
  and team-review's own SKILL.md and asserting they still spell it identically.
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
- `test/root-guard-scan.test.mjs` — the quote-state shell scanner (spec 051) as a pure
  function: separators bound only OUTSIDE quotes; single/double, ANSI-C and locale runs,
  escapes, line continuation; the verbatim Co-Authored-By trailer tokenizing to FOUR tokens
  with the message as ONE; command-position detection; fail-closed on unbalanced input.
- `test/root-guard-hook.test.mjs` — the planted root-guard hook over its `PreToolUse` stdin
  contract (spec 051), every hazard BOTH ways: newline, `)`, `'`, `"`, `;`, `|`, backtick each
  ALLOWED `backlog/`-scoped and still BLOCKED out of scope; heredocs, cross-repo jurisdiction,
  the content false-positive, unparseable-implies-unexecutable vs `bash -n`, and the deny set.
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
- Sibling: [[test-suite-catalog-plugins-pipeline]] — the content-authoring pipeline and
  cross-plugin handoff suites.
- Grandparent: [[test-suite]] — conventions, pre-commit/pre-push hooks, and the CI layer.
- `reorient.test.mjs` proves the [[reorient-run-ownership]] doctrine; `pdlc.test.mjs` pins
  the [[pdlc-plugin]] plant surface.
