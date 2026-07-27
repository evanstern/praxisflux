# refactor-triage record — praxis-2026-07-27-16-07-29

First run of `pdlc:refactor-triage` (skill 0.1.0, followed from repo source at 9a61d34 —
the installed pdlc cache predates the skill).

- **Scope / mode:** range `bfd01e0..3e96cd7` (PR #97, TASK-72 — the sweep that shipped
  this skill), 11 commits. Interactive (operator walk), 2026-07-27.
- **Evaluation engine:** team-review:team-review (installed cache 0.36.0), lens
  "drift and tech debt since bfd01e0..3e96cd7; clobbered design decisions, slap-dash
  conflict resolutions". Run `praxis-2026-07-27-16-07-29`, output gate passed.
  The 0.36.0 engine predates copy-on-finish, so the proven report was copied to
  tracked state by the lead (the exact degradation finding 2 describes, applied as
  its own remedy).
- **Evaluation report:** `docs/reviews/team-review-praxis-2026-07-27-16-07-29.md`
- **Intent-drift pass:** run as structured senior beats inside the engine review
  (pdlc surface vs card/spec/runbook; wiki re-pin honesty vs covered diffs) — range
  mode's added pass per the skill, not skipped.
- **Prior triage records consulted:** none exist (first run).
- **Dispositions:** made by the operator (accept/reject/defer per consolidated
  finding group); no declared policy (interactive mode).

## Dispositions

Report findings ("What could be improved" 1–9) were consolidated into six candidate
tasks; the operator triaged the groups 2026-07-27. Every finding has a disposition.

| # | finding (report §improved) | disposition | rationale | board task |
|---|---------------------------|-------------|-----------|------------|
| 1 | two-verb enumeration drift (template, plugin/marketplace desc, root README row, stale plant, overview cascade) | **accept** (group A) | planted-grounding blast radius: every 0.40.0 bootstrap inherits the mis-enumeration | TASK-74 |
| 6 | runbook line reinterpreted without amendment (root README gate) | **accept** (folded into A for the stale row; process rule into F) | the stale surface is A's to fix; the process rule is doctrine, F's to record | TASK-74 / TASK-79 |
| 2 | undeclared team-review ≥0.39.0 coupling; degraded report homeless | **accept** (group B) | manifested live in this very run; one-sentence fix known | TASK-75 |
| 3 | headless mode named but not invocable | **accept** (group B) | AC #2's status exceeds artifacts until a syntax exists | TASK-75 |
| 4 | run-id load-bearing and undefined | **accept** (group B) | future sessions will mint inconsistently | TASK-75 |
| 5 | tests header-deep; cross-skill path contract unpinned | **accept** (group C) | sibling standard (new-plugin.test.mjs) already shows the shape | TASK-76 |
| 7 | orient.mjs --since deferral lives only in prose | **accept** (group D) | carding the deferral is the skill's own doctrine; card ≠ commitment to build | TASK-77 |
| 8 | near-budget wiki artifacts (7695/8000 catalog, 499/500 capsule); gate-invisible cross-source claims | **accept** (group E) | defuse the shave-a-word incentive before the next honest amendment hits it | TASK-78 |
| 9 | sweep's .specify/ stop rule informally overridden three times | **accept** (group F) | three precedents are doctrine pretending to be exceptions | TASK-79 |

Rejected: none. Deferred: none.

## Output gate (verified at close)

1. Every created task cites this record + the evaluation report + file:line evidence. ✓
2. Both artifacts on disk and tracked: the evaluation report and this record. ✓
3. Every finding above carries a disposition + rationale. ✓
4. Board delta this run = TASK-74..79, all labeled `debt`, dependency-noted (TASK-76 → after TASK-75). TASK-73 pre-existed (another session's card, not this run's). ✓
