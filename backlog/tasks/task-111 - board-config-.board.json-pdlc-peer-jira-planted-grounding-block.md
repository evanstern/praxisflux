---
id: TASK-111
title: 'board config (.board.json) + pdlc:peer:jira planted grounding block'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-27 16:14'
updated_date: '2026-09-01 14:35'
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
<!-- SECTION:NOTES:END -->
