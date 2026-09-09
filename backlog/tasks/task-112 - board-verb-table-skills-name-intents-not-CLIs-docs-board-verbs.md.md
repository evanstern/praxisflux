---
id: TASK-112
title: 'board verb table: skills name intents, not CLIs (docs/board-verbs.md)'
status: In Progress
assignee: []
created_date: '2026-08-27 16:14'
updated_date: '2026-09-09 17:50'
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
- [x] #6 Mirror schema gains optional labels[]; both providers project it; a mirror without it still validates
- [ ] #7 Paused-lane doctrine works from mirror labels — mirror-only project with paused link excluded from conflict analysis
- [ ] #8 docs/task-labels.md plumbing is provider-neutral; the label list is unchanged (no rows added or removed)
- [ ] #9 renderJira returns ordered {tool,args,why}, is pure with no MCP/network, unit-tested; renderBacklog unchanged bytes
- [ ] #10 check-docs green; docs/wiki re-pinned for every note sourcing a rewritten skill
- [x] #11 Spec phase: Phase 1 — Enumerate the real call sites, author the verb table
- [x] #12 Spec phase: Phase 2 — Mirror labels and the paused-lane fix (correctness, early)
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

PHASE 1 DONE AND ORCHESTRATOR-VERIFIED (55df892). docs/board-verbs.md authored: 13 verbs — board:list, view, create, link-spec, ac-set, ac-check, status, claim, final, note, label, sync-mirror, init — each carrying intent, PRECONDITIONS, EVIDENCE ARTIFACT, and both provider resolutions. Verified by inspection: 13 rows, none thin, and the markdown-only constraint from spec 056's live test landed on the ac-set/ac-check rows where it belongs (AC#1, AC#4 ticked).

THE CENSUS IN spec.md IS WRONG, and Phase 1 was right to check rather than trust it. Verified both claims myself with grep:
- pdlc:bootstrap has THREE raw 'backlog ' hits, not the spec's 2.
- More useful than the raw counts: a grep hit and an operative instruction are not the same thing IN EITHER DIRECTION. pdlc:refactor-triage greps 3 but has only 1 real call site (the other two are a cross-skill reference and a 'backlog task' noun phrase); bootstrap greps 3 but has 1 (a quoted error message and an 'e.g.' illustration). Conversely spec-bridge:link line 44 carries a REAL call site — --ac "Spec phase: Setup" — that NO 'backlog ' grep can find at all. Verified: that line exists as described.

Operative call sites, corrected: link 6, sweep 3, refactor-triage 1, sync 2, bootstrap 1, reorient 1. Phase 4's rewrites should work from this enumeration (specs/055-board-verb-table/findings/phase-1-call-sites.md, per-line classification) rather than from spec.md's table or from a fresh grep — a grep alone both over- and under-counts.

Two deliberate deviations from spec.md's sketched table, both justified and both recorded: DROPPED board:plan (no call site among the six skills exercises a task's --plan field) and ADDED board:init (pdlc:bootstrap's peer-initialization step is a real call site that already branches per peer, with a genuine per-provider resolution/precondition/evidence). Findings filed in the spec dir rather than inlined in the canonical doc, matching the precedent spec 056 set — keeps docs/board-verbs.md forward-facing.

Gates at Phase 1: suite 527/527, check-docs 0, sync-version --check 0 (0.61.1), check-version-bump no bump required (docs/specs are exempt surface). No --no-verify.

Tier held sonnet / cc/claude-sonnet-5[1m]; ~190k subagent tokens, 43 tool uses.

PHASE 2 DONE AND ORCHESTRATOR-VERIFIED (eb1b150) — the correctness slice, deliberately early. Suite 536/536 (527 baseline + 9 new tests).

AC#6 PROVEN AGAINST THE HARDEST AVAILABLE CASE, not a fixture: this repo's OWN committed mirror carries 62 links and ZERO labels keys, and validateMirror returns no problems on it. Backward compatibility holds on real data. The schema adds 'labels' to LINK_KEYS as optional; validateMirror only enters the labels branch when the key is present, so a labels-less mirror never touches it. Both providers project it (the jira projector is spec 056's, and the schema supports it without requiring it).

A DESIGN DETAIL THAT TURNED OUT LOAD-BEARING, worth keeping: parseLinkedTask OMITS the labels key entirely for an unlabelled task rather than emitting labels: []. That is not cosmetic — the frozen test/spec-bridge.test.mjs asserts parseLinkedTask's exact return shape for an unlabelled task, and an always-present labels: [] broke it on the first run. The omission is what keeps the protected file's byte assertions true.

AC#7's mirror-side primitive landed as a new export isPausedLink(link), which reads labels off a MIRROR LINK only and never off backlog/tasks/*.md — verified directly: paused label true, other labels false, absent key false. Tested against a mirror-only fixture (temp dir with .board/links.json and NO backlog/tasks/ at all), which is the shape AC#7 actually names. HONEST SCOPE NOTE from the implementer, and it is right: pdlc:sweep's SKILL.md prose still reads 'paused' from Backlog frontmatter directly, and rewiring the sweep to consult the mirror is Phase 4's skill-rewrite territory. So AC#7 is HALF DONE — primitive proven, consumer not yet rewired — and I have NOT ticked it. AC#6 ticked; AC#7 stays open until Phase 4.

WHY THIS SLICE MATTERS (from spec.md): without labels[] on the mirror, a sweep running on a Jira host would CLAIM AN OPERATOR'S PARKED BRANCH. That is the bug this phase closes.

EXPECTED, NOT A DEFECT — the committed mirror is now knowingly stale in two ways, both verified by me: (1) TASK-112's own AC ticks from Phase 1 drifted it, and (2) label projection now surfaces labels for 50 already-linked tasks the committed mirror predates (live projection 62 links, 50 carrying labels; mirror 62 links, 0 carrying labels). board-mirror --check therefore FAILS right now by design. Regenerating is board:sync-mirror's job at closure, not a mid-phase edit — a 50-entry diff would bury the phase's real change. Phase 3 was told explicitly not to 'fix' it.

Also amended docs/design/board-provider-seam.md with a Schema amendments section recording the addition. check-docs clean. Version bump and wiki re-pin correctly deferred to Phase 4 (the pre-push hook already flags docs/wiki/spec-bridge-plugin.md as stale, since it pins lib/board-mirror.mjs).

Tier held sonnet / cc/claude-sonnet-5[1m]; ~222k subagent tokens, 71 tool uses.
<!-- SECTION:NOTES:END -->
