---
id: TASK-83
title: >-
  demo rig: honest intent record + freshness coverage — amend spec matrix text,
  pin the rig's rails, sentinel the fixtures
status: To Do
assignee: []
created_date: '2026-07-27 17:52'
labels:
  - debt
dependencies: []
priority: medium
ordinal: 118000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Findings F3(part a) + F5 of refactor-triage run praxis-2026-07-27-17-33-15 (range b4e8e09..52b5abd) — evaluation report docs/reviews/team-review-praxis-2026-07-27-17-33-15.md §improved 3,5, triage record docs/reviews/refactor-triage-praxis-2026-07-27-17-33-15.md.

F3a: the shipped gate matrix (spec-bridge at 2/3/4, app-test at 0/3 — demo/fixtures/manifest.json:35,43) is a strict superset of what the intent record states: spec R2 (specs/034-demo-rig/spec.md:34), plan step 5 (specs/034-demo-rig/plan.md:33), and ticked T005 (specs/034-demo-rig/tasks.md:12) all still say spec-bridge 2/3 + app-test 0 only. In a repo whose doctrine is "the spec dir is the truth", amend the spec/plan/tasks TEXT post-hoc to describe the shipped matrix (note the amendment date + this finding as the reason). Do NOT change tasks.md checkbox state — TASK-73's Done derivation must be unaffected. If TASK-82 lands its stage-4 app-test first, amend to THAT matrix (coordinate wording).

F5: the rig's drift-proofing has three blind spots. docs/wiki/demo-rig.md cites but does not pin scripts/run-gates.mjs (its matrix rides it — docs/wiki/demo-rig.md:47) or test/demo-rig.test.mjs (whose contract it paraphrases — docs/wiki/demo-rig.md:64); and only demo/fixtures/manifest.json is pinned, so a fixture-only recapture bypasses the freshness gate entirely while the note's Operational-notes section is about recapture (docs/wiki/demo-rig.md:74) and the RUNSHEET's replay literals (quoted stale hash demo/RUNSHEET.md:87, diff beat demo/RUNSHEET.md:126) go stale with no gate noticing — the presenter discovers it on camera. Fix: add scripts/run-gates.mjs and test/demo-rig.test.mjs to the note's sources; add a fixtures sentinel source (or a manifest fixtures-checksum) so recaptures stale the note; re-pin honestly (classify against the real diff, per doctrine).

Docs-only footprint (specs/034 text + docs/wiki + possibly RUNSHEET note) — no released surface expected; believe check-version-bump.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 spec.md/plan.md/tasks.md text describes the shipped gate matrix, amendment noted with date and finding citation, checkbox state untouched, spec-bridge derivation for TASK-73 unchanged (still Done)
- [ ] #2 docs/wiki/demo-rig.md pins scripts/run-gates.mjs, test/demo-rig.test.mjs, and a fixtures sentinel; wiki freshness green; CAPSULES regenerated if the description changed
- [ ] #3 A fixture-only change now stales the demo-rig note (demonstrated in the PR or covered by a test)
<!-- AC:END -->
