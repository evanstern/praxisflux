---
id: TASK-111
title: 'board config (.board.json) + pdlc:peer:jira planted grounding block'
status: To Do
assignee: []
created_date: '2026-08-27 16:14'
updated_date: '2026-08-27 16:15'
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
<!-- AC:END -->
