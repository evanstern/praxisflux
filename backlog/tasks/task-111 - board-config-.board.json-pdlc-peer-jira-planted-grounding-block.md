---
id: TASK-111
title: 'board config (.board.json) + pdlc:peer:jira planted grounding block'
status: Done
assignee:
  - '@claude'
created_date: '2026-08-27 16:14'
updated_date: '2026-09-03 19:32'
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
- [x] #11 Spec phase: Phase 1 — The config module
- [x] #12 Spec phase: Phase 2 — `plant.mjs` peer plumbing and the grounding block
- [x] #13 Spec phase: Phase 3 — Bootstrap skill prose, docs sync, re-ground
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
CLAIMED by sweep orchestrator 2026-09-01 (Lane 2, signed off; TASK-109 dep Done). Branch task-111-board-config off origin/main tip 5a9fce0; worktree .claude/worktrees/task-111 (background-job mode). specs/054-board-config-jira-peer already complete on main (spec.md + plan.md + tasks.md, hand-authored under the operator-signed escape line) and the card already carried its Spec marker, so this claim carries the status flip + three phase ACs seeded from tasks.md. TIER: sonnet · cc/claude-sonnet-5[1m] (defaultTier). DEVELOPS IN PARALLEL with TASK-110 (verified disjoint footprints: 110 touches spec-bridge/gates/*, lib/gate-runner.mjs, lib/project-root.mjs; 111 touches pdlc/scripts/plant.mjs, pdlc/skills/bootstrap/SKILL.md, pdlc/templates/*). Shared files are lib/board-mirror.mjs (read-only consumer) and docs/releasing.md. GUARANTEED CONFLICT at merge on .claude-plugin/marketplace.json + every plugin.json since both PRs bump the version — that is why Lane 2 MERGES SERIALLY, smallest PR first.

ENVIRONMENT INCIDENT AND FULL RECOVERY (2026-09-03). Mid-Phase-3, the entire repo relocated on disk from /Users/evanstern/projects/praxis to /Users/evanstern/projects/evanstern/praxis (an extra path segment inserted; a sandbox remount, not any command run by this sweep). The Phase 3 implementer detected it, stopped with zero edits and zero commits, and reported rather than attempting a cross-worktree infra repair it was not scoped to make — correct call, and its diagnosis was accurate in every particular (verified independently: the old path is gone, the new one exists, and the copied worktree dirs carried stale 'gitdir:' pointers to the old path). NOTHING WAS LOST. Recovery, in order: (1) confirmed the main repo intact and functional at the new path; (2) confirmed all three sweep branch tips safe on origin — task-110 d1d9258, task-114 fb0a754, task-111 f5525f8 — which is the payoff for the runbook's push-the-claim-immediately rule; (3) found TASK-111's Phase 1 (db31501) and Phase 2 (471801d) commits were local-only and NOT yet pushed, but their objects survived in the main repo's object store and the branch ref still pointed at 471801d; (4) PUSHED them immediately (f5525f8..471801d) so they could not be lost twice; (5) git worktree prune removed the three stale admin records; (6) rm -rf'd the three orphaned copied directories after operator approval, leaving the unrelated refactor-triage-2026-07-31 worktree untouched since it belongs to an earlier sweep; (7) re-cut .claude/worktrees/task-111 at the new path from the pushed tip. VERIFIED AFTER RECOVERY: both phase commits present, working tree clean, Phase 1/2 artifacts intact in lib/board-mirror.mjs and pdlc/templates/CLAUDE.md, and the suite at 483/483 — identical to the pre-incident count. Phase 3 is unstarted and re-dispatchable. LESSON FOR THE RUNBOOK: the push-immediately rule saved this, but it only covers the CLAIM commit. Phase commits sat unpushed across four phase dispatches on three branches; had the object store been lost rather than just the worktrees, that work was gone. Push after every phase, not just at claim.

PHASE 3 COMPLETE (commits d86d6c8 SKILL.md + docs + bump, 5beeb01 re-ground pass, 6049beb second-order cascade re-pin, 69c4f92 ticks + Notes) — all pushed as they landed, per the new F4 rule. Four gates verified INDEPENDENTLY by the orchestrator: node --test 483/483 0 fail; check-docs exit 0; sync-version --check 'all versions = 0.59.3'; freshness exit 0 with 40 notes fresh AND 'plan' now returns EMPTY (no re-pins outstanding). Also verified: AC#9 holds (three protected files byte-identical across the whole branch); local HEAD == origin/task-111-board-config; all 7 commits carry the correct 'Claude Opus 5' trailer; ZERO added or widened size_budget_exempt lines across docs/wiki/ on this branch. THE CASCADE FIRED TWICE and was handled correctly both times — vindicating the doctrine added during TASK-114. (1) The 0.59.3 bump itself staled 10 MORE notes beyond the original 4 (every plugin.json + action.yml + a README line), which the dispatch had not anticipated; the implementer found them by re-running 'plan' rather than trusting the prompt's list. (2) SECOND-ORDER: re-pinning test-suite-catalog-plugins-gates.md then staled its PARENT test-suite-catalog-plugins.md, which lists it as a source. Only a third 'plan' run came back clean. Honest re-pins throughout: two notes got genuine prose amendments (pdlc-grounding-block.md gained pdlc:peer:jira in its peer-conventions sentence; pdlc-plugin.md had its invocation example and whole 'Peer utilities' section rewritten for the third peer + mutual exclusion + MCP-presence detection), overview.md gained 'Jira' PAID FOR BY A TRIM (net -54 chars, bringing a note that had ZERO headroom back under the 8000 cap), and test-suite-catalog-plugins-gates.md's jira-peer addition was paid for by trimming redundant --force phrasing in the same bullet (net +10 on an already-exempt note, exemption untouched). spec-bridge-plugin.md was correctly RE-PIN-ONLY: its only source change since pin was Phase 1's lib/board-mirror.mjs addition, unrelated to what that note describes — which also meant its over-budget exemption needed no attention. CAPSULES.md regenerated since a description capsule changed. No test file was touched, so no existing expectation needed correcting. Out-of-scope observation left alone and reported: pdlc-plugin.md's description says 'across three skills' while pdlc/README.md says 'Four skills' (design-rounds) — a pre-existing inconsistency, not this phase's to fix.

PR #135 OPENED (https://github.com/evanstern/praxisflux/pull/135), branch task-111-board-config, 8 commits f5525f8..8a67a3e, version 0.59.3. MERGE ORDER (operator ruling): #133 (0.59.1) first, then #134 (renumbers to 0.59.2), then this one — the PR body carries that warning at the top so it cannot be merged out of order by accident. This branch deliberately took 0.59.3 rather than 0.59.1 so all three PRs are mergeable in sequence without a further renumber. MUST MERGE AS A MERGE COMMIT, never squash: 5beeb01 and 6049beb re-pin notes to this branch's own commits, and squashing orphans those hashes and breaks the freshness gate. This branch is PIN-CARRYING, so if it needs reconciling with a moved main it MERGES origin/main IN (never rebase, never force-push) — rebasing would rewrite the hashes its own re-pins reference — and the merge-in licenses no pin bump: classify each staled pin RE-PIN-ONLY vs NEEDS-REVIEW against the main-side diff and amend prose before bumping. NOT self-merged.

spec-bridge sync: Phase 1 — The config module: 7/7 · Phase 2 — `plant.mjs` peer plumbing and the grounding block: 10/10 · Phase 3 — Bootstrap skill prose, docs sync, re-ground: 11/11 — status In Progress → Done

MERGED — PR #135 merged 2026-09-03 as e0ea7b2, v0.59.3 on main. NOTE THE MERGE ORDER INVERTED from the operator's 2026-09-01 ruling (which was #133, then #134, then this): #135 merged FIRST and is the only one of the three in main. #133 and #134 remain open, both still claiming 0.59.1, which is now BELOW main's 0.59.3 — so both need renumbering above main before they can pass the version-bump gate. Operator ruling 2026-09-03: #134 -> 0.59.4 first, then #133 -> 0.59.5. Board moved to Done by spec-bridge:sync's derived plan (28/28 spec boxes ticked), never hand-set.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All spec tasks complete (Phase 1 — The config module: 7/7 · Phase 2 — `plant.mjs` peer plumbing and the grounding block: 10/10 · Phase 3 — Bootstrap skill prose, docs sync, re-ground: 11/11). Derived Done by spec-bridge sync.
<!-- SECTION:FINAL_SUMMARY:END -->
