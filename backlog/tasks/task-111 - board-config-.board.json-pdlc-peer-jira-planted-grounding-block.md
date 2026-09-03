---
id: TASK-111
title: 'board config (.board.json) + pdlc:peer:jira planted grounding block'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-27 16:14'
updated_date: '2026-09-03 18:56'
labels:
  - feature
  - pdlc
  - chassis
dependencies:
  - TASK-109
priority: high
ordinal: 143000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Declare which provider a project uses, and let pdlc:bootstrap opt a project into Jira.

.board.json carries provider + site coordinates (cloudId/projectKey/issueTypeName/defaultAssignee/statusMap) so spiking a card is ONE MCP call with no discovery — the operator's spike-speed requirement. plant.mjs grows a jira peer, mutually exclusive with backlog (one board, singular). New pdlc:peer:jira block carries zero backlog verbs.

Spec: specs/054-board-config-jira-peer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 .board.json schema implemented; {"provider":"backlog"} is a complete valid config
- [ ] #2 loadBoardConfig defaults to backlog when absent, throws on malformed JSON, throws naming known providers on unknown provider
- [ ] #3 validateBoardConfig catches provider-as-array, unknown provider, jira missing each coordinate, non-object statusMap
- [ ] #4 PEERS includes jira; --peer jira keeps the block and omitting it strips it
- [ ] #5 --peer backlog --peer jira ERRORS with a message naming the one-board invariant
- [ ] #6 pdlc:peer:jira block contains ZERO backlog command strings (grep-asserted) and covers all six R5 points
- [ ] #7 .pdlc records jira under peers/peersOmitted with no sentinel schema change
- [ ] #8 bootstrap/SKILL.md documents MCP-presence detection, discover-dont-ask, write-only-when-absent, the refusal, and the extended output gate; version bumped
- [ ] #9 test/pdlc.test.mjs extended for AC 4-7 with existing cases unedited; config tests for AC 1-3
- [ ] #10 README.md and CLAUDE.md peer enumeration updated (check-docs green); docs/wiki re-pinned
- [ ] #11 Spec phase: Phase 1 — The config module
- [ ] #12 Spec phase: Phase 2 — `plant.mjs` peer plumbing and the grounding block
- [ ] #13 Spec phase: Phase 3 — Bootstrap skill prose, docs sync, re-ground
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
CLAIMED by sweep orchestrator 2026-09-01 (Lane 2, signed off; TASK-109 dep Done). Branch task-111-board-config off origin/main tip 5a9fce0; worktree .claude/worktrees/task-111 (background-job mode). specs/054-board-config-jira-peer already complete on main (spec.md + plan.md + tasks.md, hand-authored under the operator-signed escape line) and the card already carried its Spec marker, so this claim carries the status flip + three phase ACs seeded from tasks.md. TIER: sonnet · cc/claude-sonnet-5[1m] (defaultTier). DEVELOPS IN PARALLEL with TASK-110 (verified disjoint footprints: 110 touches spec-bridge/gates/*, lib/gate-runner.mjs, lib/project-root.mjs; 111 touches pdlc/scripts/plant.mjs, pdlc/skills/bootstrap/SKILL.md, pdlc/templates/*). Shared files are lib/board-mirror.mjs (read-only consumer) and docs/releasing.md. GUARANTEED CONFLICT at merge on .claude-plugin/marketplace.json + every plugin.json since both PRs bump the version — that is why Lane 2 MERGES SERIALLY, smallest PR first.

ENVIRONMENT INCIDENT AND FULL RECOVERY (2026-09-03). Mid-Phase-3, the entire repo relocated on disk from /Users/evanstern/projects/praxis to /Users/evanstern/projects/evanstern/praxis (an extra path segment inserted; a sandbox remount, not any command run by this sweep). The Phase 3 implementer detected it, stopped with zero edits and zero commits, and reported rather than attempting a cross-worktree infra repair it was not scoped to make — correct call, and its diagnosis was accurate in every particular (verified independently: the old path is gone, the new one exists, and the copied worktree dirs carried stale 'gitdir:' pointers to the old path). NOTHING WAS LOST. Recovery, in order: (1) confirmed the main repo intact and functional at the new path; (2) confirmed all three sweep branch tips safe on origin — task-110 d1d9258, task-114 fb0a754, task-111 f5525f8 — which is the payoff for the runbook's push-the-claim-immediately rule; (3) found TASK-111's Phase 1 (db31501) and Phase 2 (471801d) commits were local-only and NOT yet pushed, but their objects survived in the main repo's object store and the branch ref still pointed at 471801d; (4) PUSHED them immediately (f5525f8..471801d) so they could not be lost twice; (5) git worktree prune removed the three stale admin records; (6) rm -rf'd the three orphaned copied directories after operator approval, leaving the unrelated refactor-triage-2026-07-31 worktree untouched since it belongs to an earlier sweep; (7) re-cut .claude/worktrees/task-111 at the new path from the pushed tip. VERIFIED AFTER RECOVERY: both phase commits present, working tree clean, Phase 1/2 artifacts intact in lib/board-mirror.mjs and pdlc/templates/CLAUDE.md, and the suite at 483/483 — identical to the pre-incident count. Phase 3 is unstarted and re-dispatchable. LESSON FOR THE RUNBOOK: the push-immediately rule saved this, but it only covers the CLAIM commit. Phase commits sat unpushed across four phase dispatches on three branches; had the object store been lost rather than just the worktrees, that work was gone. Push after every phase, not just at claim.
<!-- SECTION:NOTES:END -->
