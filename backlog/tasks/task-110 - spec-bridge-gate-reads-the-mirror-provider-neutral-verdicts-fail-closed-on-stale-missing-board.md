---
id: TASK-110
title: >-
  spec-bridge gate reads the mirror: provider-neutral verdicts, fail-closed on
  stale/missing board
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-27 16:14'
updated_date: '2026-09-01 18:04'
labels:
  - feature
  - gates
  - spec-bridge
dependencies:
  - TASK-109
priority: high
ordinal: 142000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Swap the bridge's INPUT, not its logic. boardLinks(root) becomes the single board-reading seam for checkBridge/verifyBridge/planBridge; resolveRoots stops meaning "has a backlog dir"; a stale or declared-but-missing mirror becomes a BLOCKING finding instead of a silent pass.

Backlog.md hosts see zero behavior change — the three existing test files must pass unedited.

Spec: specs/053-bridge-on-mirror
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 boardLinks(root) implements mirror-first / live-backlog / empty; all three entry points use it
- [ ] #2 backlog-only host produces byte-identical verdicts, messages, and planned commands
- [ ] #3 mirror-only host yields identical problems+warnings for equivalent state (differential fixture pair)
- [ ] #4 resolveRoots handles .board-only, backlog-only, and both; gates/cli.mjs resolves identically
- [ ] #5 stale requiresSync mirror yields one blocking problem naming reason and remedy
- [ ] #6 stale non-requiresSync mirror yields NO staleness problem (live projection preferred)
- [ ] #7 declared requiresSync provider with absent mirror yields the blocking no-evidence problem (asserted by message content)
- [ ] #8 planBridge returns structured intents for non-backlog providers; exact command strings for backlog
- [ ] #9 test/spec-bridge, test/project-gates, test/phase-status pass with NO edits to those files
- [ ] #10 New coverage for AC 3-8; docs/wiki re-pinned (spec-bridge-plugin, gates-convention, project-root)
- [ ] #11 Spec phase: Phase 1 — The seam and root resolution (behavior must not change)
- [ ] #12 Spec phase: Phase 2 — The fail-closed findings (new behavior, isolated)
- [ ] #13 Spec phase: Phase 3 — Planner split, differential proof, re-ground
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
CLAIMED by sweep orchestrator 2026-09-01 (Lane 2, signed off; TASK-109 dep is Done). Branch task-110-bridge-on-mirror off origin/main tip 5a9fce0; worktree .claude/worktrees/task-110 (background-job mode). specs/053-bridge-on-mirror already carries a complete spec.md + plan.md + tasks.md on main (hand-authored under the runbook's operator-signed escape line), and the card already carried its Spec marker, so this claim commit carries the status flip + the three phase ACs seeded from tasks.md. TIER: sonnet · cc/claude-sonnet-5[1m] (defaultTier); the spec settles the judgment calls. Dispatch is phase-scoped: one fresh sonnet-implementer per phase (3 phases). NOTE for implementers: spec-bridge/gates/bridge.mjs contains a literal NUL byte at line 217 so plain grep prints NOTHING and exits 1 on it — always grep -a/-na. Spec 053 edits that file directly.

PHASE 1 COMPLETE (commit 52c4b6b), verified independently by the orchestrator. Suite 468 -> 472/472, 0 fail (4 new tests). Verified in the code, not taken on report: (a) boardLinks(root) at bridge.mjs:282 implements the exact three-step order — readMirror first, live providers.backlog.project(root) second, [] third — with the mirror-first rationale commented; (b) all three entry points swapped — 4 occurrences of 'boardLinks(root)' (definition + checkBridge + verifyBridge + planBridge) and ZERO leftover 'findLinkedTasks(root)' calls; (c) LOCKSTEP HOLDS: hasAnyChild('.board','backlog') is used in BOTH resolvers — bridge.mjs:547 (resolveRoots) and cli.mjs:29 (findRootUpwards) — with a comment at cli.mjs:27 cross-referencing the other, so a future editor sees the coupling; (d) hasAnyChild is ONE definition in lib/project-root.mjs:21 composed from hasChild; (e) AC#9 HOLDS — the three protected test files are byte-identical across the whole branch. The AC#4 test went into a new sibling file test/board-provider-seam.test.mjs rather than chassis.test.mjs, because proving hook and CLI AGREE needs bridgeGate plus a real cli.mjs subprocess — spec-bridge-shaped, not chassis-shaped. Sound call, recorded in tasks.md. ORCHESTRATOR CORRECTION: the implementer's commit trailer read 'Co-Authored-By: Claude Sonnet 5' — it substituted its own model name for the repo's convention (12 of the last 13 commits use 'Claude Opus 5'). Amended before pushing (unpushed, so no history rewrite risk); sha changed 104176f -> 52c4b6b. Worth noting for future dispatches: state the trailer as a literal to copy, since an implementer may otherwise personalize it. OPEN QUESTION LEFT FOR PHASE 2 (correctly not pre-decided): whether checkBridge re-reads the mirror itself (cheap duplicate fs read) or boardLinks changes shape to also expose the mirror object, to feed mirrorStaleness for R3/R4. Phase 1 kept boardLinks returning a plain links array because AC#1/#2 require the three call sites unchanged.

PHASE 2 COMPLETE (commit 051793e), verified independently. Suite 472 -> 477/477, 0 fail (5 new tests). THE LOAD-BEARING CHECK PASSES: both R3 and R4 findings use problems.push (bridge.mjs:377 and :391) — NOT warnings. That was the one way this phase could have silently defeated itself, since gate-runner.mjs:56 swallows warnings in a bare catch{}; a fail-closed finding returned as a warning would have reproduced the exact silent pass this spec exists to remove. Also verified: (a) the requiresSync:false asymmetry is commented at length and ends 'this asymmetry is R3's point, not an inconsistency to "fix" into symmetry' — precisely the guard the checkbox asked for, and it enforces the asymmetry by NOT CALLING mirrorStaleness at all rather than calling and discarding; (b) BOTH branches fail closed on an unknown provider name ('providers[x] ? .requiresSync : true', commented 'unknown name: fail closed') — so a typo'd provider blocks instead of being treated as backlog; (c) readMirror's throw is deliberately left to propagate, with a comment citing lib/gate-runner.mjs:52-54; (d) AC#9 HOLDS — three protected files byte-identical across the whole branch; (e) commit trailer correct this time (the literal-string instruction worked). DoD#6 verification was stronger than asked: an end-to-end test writing a real malformed .board/links.json to a temp dir and driving the REAL bridgeGate through the REAL evaluate() from lib/gate-runner.mjs with no mocks, asserting verdict.block===true and the message matching /crashed on .*malformed JSON/. That proves the integration, not just the generic mechanism chassis.test.mjs already covers with synthetic gates. R3/R4 scoped to checkBridge only; verifyBridge/planBridge untouched, which matches the spec's wording.

PHASE 3 COMPLETE (commits 6c77479 planner split + differential proof, 5206515 version bump, 639a10f re-ground). Suite 477 -> 480/480, 0 fail. All four gates verified independently by the orchestrator: node --test 480/480; check-docs exit 0; sync-version --check 'all versions = 0.59.1'; freshness 40 notes fresh, no new warns. AC#9 HOLDS across the whole branch (three protected files byte-identical) — which is also what proves the planner split is byte-faithful, since those files assert exact command strings. THE SPLIT'S HARD LINE HOLDS: grep for index/sort/reverse/slice inside renderBacklog finds NOTHING — all ordering arithmetic stayed in planIntents. The ordering test is real proof, not a formality: it asserts acRemove deepEquals [4,2] (highest-index-first) and acUncheck deepEquals [2] (Setup renumbered post-removal), then asserts renderBacklog(id, intents) deepEquals planLinkedTask(task, derived) — so the split is proven both structurally and byte-for-byte. planLinkedTask survives as a thin wrapper because the PROTECTED test file imports it by name; keeping it was correct, not laziness. Differential test (AC#3) builds two temp projects over identical spec dirs — one backlog/tasks/*.md, one .board/links.json with matching id/status/specDir — and asserts problems and warnings deepEqual AND non-empty on both channels, so it cannot pass trivially on two empty results. ORCHESTRATOR ERROR CAUGHT BY THE IMPLEMENTER: my dispatch asserted main had moved to 0.59.1 because PR #133 merged. It has NOT — #133 is still OPEN and origin/main is 0.59.0 (verified: gh pr view 133 state=OPEN mergedAt=null; git show origin/main:.claude-plugin/marketplace.json = 0.59.0). The agent trusted the tool output over my prompt and flagged it rather than reconciling, which is exactly right. CONSEQUENCE: task-110 and task-114 BOTH claim 0.59.1 — a real collision. Whichever PR merges second must renumber to 0.59.2 and re-pin the notes that bump stales. Operator decision on merge order pending. Also: gates-convention.md never appeared in either freshness plan run (its sources were untouched by phases 1-3), so it was correctly NOT re-pinned despite my dispatch naming it — tool output over prompt anticipation again.

PR #134 OPENED (https://github.com/evanstern/praxisflux/pull/134), branch task-110-bridge-on-mirror, 7 commits c9a5354..e27c9d1. OWED BEFORE MERGE (operator ruling 2026-09-01, merge #133 first): renumber 0.59.1 -> 0.59.2 and re-pin the ~12 notes that bump stales, after #133 lands and this branch reconciles with fresh origin/main. The PR body carries a merge-order warning at the top so a reviewer cannot merge it out of order by accident. NOT self-merged. MUST MERGE AS A MERGE COMMIT, never squash — 639a10f re-pins 12 notes to 5206515, and squashing orphans those hashes and breaks the freshness gate. This branch is PIN-CARRYING, so at reconcile time it MERGES origin/main IN (never rebase, never force-push): rebasing would rewrite the hashes its own re-pins reference. Per the honest-re-pin rule, the merge-in itself licenses no pin bump — classify each staled pin RE-PIN-ONLY vs NEEDS-REVIEW against the main-side diff over that note's sources and amend prose before bumping.
<!-- SECTION:NOTES:END -->
