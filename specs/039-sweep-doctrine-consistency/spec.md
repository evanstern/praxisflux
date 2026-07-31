# 039-sweep-doctrine-consistency — spec

**Board task:** TASK-89 · **Finding source:** refactor-triage run praxis-2026-07-31-11-12-22
(range 9d5b81d..f3abebe); evaluation report
docs/reviews/team-review-sweep-close-84-2026-07-31-15-12-53.md; triage record
docs/reviews/refactor-triage-praxis-2026-07-31-11-12-22.md.

## Problem

Specs 035–038 stacked four doctrine changes into the same two files
(`pdlc/skills/sweep/SKILL.md`, `pdlc/skills/sweep/templates/runbook.md`) in four
consecutive PRs. Seven seam findings survived the stack — places where the two files
now disagree with each other, where a newer rule left an older qualifier stranded, or
where the same rationale is stated twice. Each is a one-clause fix; together they are
one card because they edit the same two files.

## Requirements (map 1:1 to the card's ACs)

- **R1 (AC #1, finding F1) — log cadence:** SKILL.md step 10 says one log line at merge
  while the template requires the in-flight row updated at each dispatch boundary
  (spec 036's phase-scoped resumability). Fix: step 5 gains the dispatch-boundary
  log-row clause; step 10 and the template state the same cadence.
- **R2 (AC #2, finding F2) — skip-path qualifier:** "every non-trivial task"
  (SKILL.md "What it does NOT do") predates 038 and leaks a cycle-skip with no escape
  line. Fix: remove the qualifier or route it explicitly through the operator-signed
  escape line (the Output gate's only sanctioned substitute).
- **R3 (AC #3, finding F3) — lost-link Output gate:** the Output gate never re-checks
  that each scoped card still carries its Spec marker at sweep end; the template
  end-check scopes itself away from the link line. Fix: Output gate re-checks every
  scoped card's Spec marker at sweep end; template end-check matches.
- **R4 (AC #4, finding F4) — model fallback slot:** Phase 1 item 2 pins an explicit
  model ID with no availability-fallback slot; the operator's 2026-07-31 ruling
  (`claude-opus-4-8` when `claude-opus-5` is unavailable in the subscription) lives
  only in docs/design/speckit-degradation-runbook.md. Fix: Phase 1 item 2 gains the
  fallback-ID slot — record a fallback for subscription-unavailability and which model
  actually served each dispatch.
- **R5 (AC #5, finding F6) — template parity on escape lines:** SKILL.md's
  "never as a second mechanism" clause is missing from the template's escape-line
  section. Fix: template carries the clause.
- **R6 (AC #6, findings T1/T2) — trims:** the context-read rationale is stated twice
  in step 5, and the tier-note obligation twice (Phase 1 item 2 vs step 5). Fix: state
  each once; drop no spec-mandated rationale.
- **R7 (AC #7) — release mechanics:** sweep skill `version:` bump (0.13.0 → next
  minor) + marketplace lockstep bump per docs/releasing.md; `docs/wiki/pdlc-sweep.md`
  re-verified against the diff (NEEDS-REVIEW, never mechanical); all gates green.

## Non-goals

- No new doctrine — this card only reconciles what 035–038 already ratified.
- TASK-90 (background-job mode) and TASK-79 (hand-authored-specs hatch) edit the same
  files next in this lane; do not pre-implement either.

## Done means

All seven ACs checked on TASK-89; the two files agree with each other everywhere the
seven findings named; PR merged as a merge commit with bumps and a re-verified wiki
note.
