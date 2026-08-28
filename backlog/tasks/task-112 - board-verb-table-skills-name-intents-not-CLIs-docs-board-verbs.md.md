---
id: TASK-112
title: 'board verb table: skills name intents, not CLIs (docs/board-verbs.md)'
status: To Do
assignee: []
created_date: '2026-08-27 16:14'
updated_date: '2026-08-28 19:21'
labels:
  - feature
  - doctrine
  - pdlc
  - spec-bridge
dependencies:
  - TASK-111
priority: high
ordinal: 144000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The gate is provider-neutral after 052-054; the SKILLS are not. Six skills carry literal backlog CLI commands as their operative instruction (link 6, sweep 3, refactor-triage 3, sync 2, bootstrap 2, reorient 1) — a Jira host following spec-bridge:link runs a command that does not exist.

One canonical home per rule: docs/board-verbs.md resolves each intent per provider. Skills reference verbs. No skill gains a provider conditional; no skill is forked.

Includes the correctness fix: mirror gains optional labels[] so the machine-read 'paused' marker survives — without it a sweep on Jira would claim an operator's parked branch.

Spec: specs/055-board-verb-table
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 docs/board-verbs.md exists; every row names its preconditions AND its evidence artifact
- [ ] #2 All six skills reference verbs; grep for 'backlog ' in skills hits only table columns or scoped illustrations
- [ ] #3 Every rewritten skill version bumped; diffs contain no unrelated edits (no paragraph reflow)
- [ ] #4 Marked-block contract documented: outside-markers never touched, block replaced wholesale, Spec: line outside, two blocks = error
- [ ] #5 Block parser yields [{index,checked,text}] matching mirror acs shape; round-trip test passes
- [ ] #6 Mirror schema gains optional labels[]; both providers project it; a mirror without it still validates
- [ ] #7 Paused-lane doctrine works from mirror labels — mirror-only project with paused link excluded from conflict analysis
- [ ] #8 docs/task-labels.md plumbing is provider-neutral; the label list is unchanged (no rows added or removed)
- [ ] #9 renderJira returns ordered {tool,args,why}, is pure with no MCP/network, unit-tested; renderBacklog unchanged bytes
- [ ] #10 check-docs green; docs/wiki re-pinned for every note sourcing a rewritten skill
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
SWEEP HOLD (2026-08-28, orchestrator precondition gate). NOT signed off; do not claim. Finding F1 — ORDERING INVERSION: this spec (055) BUILDS the <!-- spec-phases --> block render/parse pair and renderJira, but the premise those rest on — that HTML comment markers and checkbox syntax survive a Jira description write->read cycle — is only ever tested by spec 056 (TASK-113) Phase 1, which merges LAST in the runbook's lane order. 055's own Phase 3 round-trips against fixtures only, which cannot detect Jira normalizing or stripping the markers. Gate: do not claim TASK-112 until either (a) 056 Phase 1's live marker test has run and recorded that markers survive, naming the contentFormat that preserved them, or (b) the operator signs written acceptance of the fixture-only risk in docs/design/jira-board-runbook.md. If markers do NOT survive, that is an AMENDMENT to spec 055 — not a local workaround in 056. Full detail: runbook findings F1/F2.
<!-- SECTION:NOTES:END -->
