---
id: TASK-112
title: 'board verb table: skills name intents, not CLIs (docs/board-verbs.md)'
status: In Progress
assignee: []
created_date: '2026-08-27 16:14'
updated_date: '2026-09-09 17:37'
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
- [x] #1 docs/board-verbs.md exists; every row names its preconditions AND its evidence artifact
- [ ] #2 All six skills reference verbs; grep for 'backlog ' in skills hits only table columns or scoped illustrations
- [ ] #3 Every rewritten skill version bumped; diffs contain no unrelated edits (no paragraph reflow)
- [x] #4 Marked-block contract documented: outside-markers never touched, block replaced wholesale, Spec: line outside, two blocks = error
- [ ] #5 Block parser yields [{index,checked,text}] matching mirror acs shape; round-trip test passes
- [ ] #6 Mirror schema gains optional labels[]; both providers project it; a mirror without it still validates
- [ ] #7 Paused-lane doctrine works from mirror labels — mirror-only project with paused link excluded from conflict analysis
- [ ] #8 docs/task-labels.md plumbing is provider-neutral; the label list is unchanged (no rows added or removed)
- [ ] #9 renderJira returns ordered {tool,args,why}, is pure with no MCP/network, unit-tested; renderBacklog unchanged bytes
- [ ] #10 check-docs green; docs/wiki re-pinned for every note sourcing a rewritten skill
- [x] #11 Spec phase: Phase 1 — Enumerate the real call sites, author the verb table
- [ ] #12 Spec phase: Phase 2 — Mirror labels and the paused-lane fix (correctness, early)
- [ ] #13 Spec phase: Phase 3 — The block render/parse pair and `renderJira`
- [ ] #14 Spec phase: Phase 4 — The six skill rewrites, labels doc, versions, re-ground
<!-- AC:END -->



## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
SWEEP HOLD (2026-08-28, orchestrator precondition gate). NOT signed off; do not claim. Finding F1 — ORDERING INVERSION: this spec (055) BUILDS the <!-- spec-phases --> block render/parse pair and renderJira, but the premise those rest on — that HTML comment markers and checkbox syntax survive a Jira description write->read cycle — is only ever tested by spec 056 (TASK-113) Phase 1, which merges LAST in the runbook's lane order. 055's own Phase 3 round-trips against fixtures only, which cannot detect Jira normalizing or stripping the markers. Gate: do not claim TASK-112 until either (a) 056 Phase 1's live marker test has run and recorded that markers survive, naming the contentFormat that preserved them, or (b) the operator signs written acceptance of the fixture-only risk in docs/design/jira-board-runbook.md. If markers do NOT survive, that is an AMENDMENT to spec 055 — not a local workaround in 056. Full detail: runbook findings F1/F2.

spec-bridge sync: Phase 1 — Enumerate the real call sites, author the verb table: 0/6 · Phase 2 — Mirror labels and the paused-lane fix (correctness, early): 0/6 · Phase 3 — The block render/parse pair and `renderJira`: 0/8 · Phase 4 — The six skill rewrites, labels doc, versions, re-ground: 0/11 — status To Do → In Progress

LANE 3 CLAIMED 2026-09-09 on branch task-112-board-verb-table, cut from the merged tip 407e6fb (which contains PR #138's gate fix — the point of running Lane 2.5 first).

SWEEP HOLD LIFTED. The hold on this card was finding F1: spec 055 builds the <!-- spec-phases --> block render/parse pair while spec 056 Phase 1 was the only test of whether those markers survive a Jira write->read cycle, and it ran AFTER. Both blockers are now cleared:
- F2 CLEARED: the Atlassian MCP is reachable again (was AWS WAF CAPTCHA-walled on 2026-08-28); restored by an operator /mcp re-auth.
- F1 DISCHARGED via option (a) — the operator's ruling was to run the live test rather than sign acceptance of the fixture-only risk. 056 Phase 1 ran live 2026-09-09 and the markers SURVIVE in contentFormat markdown, idempotently across a second write. Spec 055 therefore needs NO amendment. Findings: specs/056-jira-provider/findings/phase-1-mcp-surface.md (branch task-113-jira-provider, d874b88).

TWO CONSTRAINTS THE LIVE TEST PUT ON THIS SPEC's implementation, neither derivable from 055's own fixtures:
1. The block parser must tolerate two silent Jira normalizations — a blank line inserted after the BEGIN marker, and trailing whitespace appended to the last checkbox line. 055's Phase 3 round-trips against fixtures only, which produce neither. This is exactly the gap F1 named.
2. The block contract is MARKDOWN-ONLY, and docs/board-verbs.md must say so. An html read returns the markers as escaped entities rather than comment nodes, converts the checkboxes to a native ADF task-list with server-assigned UUIDs, and swallows the END marker inside the final <li> — so a naive BEGIN..END slice captures a partial last item.

Tier: sonnet / cc/claude-sonnet-5[1m] (defaultTier per .claude/model-tiers.json; tiers.mjs --check exit 0, all three unchanged). No escalation — the spec settles the judgment calls. Served model verified claude-sonnet-5 on all four TASK-0122 dispatches this session, read from transcript request records rather than self-report.

Dispatch plan: 4 phases, one fresh implementer each (31 boxes total: 6/6/8/11). Phase 1 dispatched — enumerate the real call sites and author docs/board-verbs.md. Phase 1 is also asked to VERIFY the spec's claimed per-skill command counts (link 6, sweep 3, refactor-triage 3, sync 2, bootstrap 2, reorient 1) rather than trust them.
<!-- SECTION:NOTES:END -->
