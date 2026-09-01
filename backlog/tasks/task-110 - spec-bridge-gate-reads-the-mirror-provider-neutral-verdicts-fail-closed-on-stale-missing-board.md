---
id: TASK-110
title: >-
  spec-bridge gate reads the mirror: provider-neutral verdicts, fail-closed on
  stale/missing board
status: To Do
assignee: []
created_date: '2026-08-27 16:14'
updated_date: '2026-09-01 15:17'
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
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PHASE 1 RE-DISPATCH OWED (orchestrator error, not the agent's). The first Phase 1 dispatch lost its Bash sandbox mid-flight when the orchestrator session moved to a sibling worktree — see runbook finding F3. The agent made ZERO edits and ZERO commits and stopped correctly, refusing to operate in a worktree it had no authority over or to edit code it could not test or commit. This worktree is clean; nothing to revert. Its read-only grounding is preserved here so the retry starts informed: ROOT-RESOLUTION INVENTORY — (1) spec-bridge/gates/bridge.mjs:525 'bridgeGate.resolveRoots: (startDir) => findRootsDownwards(startDir, hasChild("backlog"))', the Stop-hook entry point via gate-runner.mjs; (2) spec-bridge/gates/cli.mjs:27 'findRootUpwards(resolve(target), hasChild("backlog"))' — used ONLY by the 'state' subcommand to locate .spec-bridge.json for requireAnalysis; links/check/verify/plan take target as the root directly, so there is no resolution there; (3) lib/project-root.mjs defines hasChild/findRootUpwards/findRootsDownwards and has NO hasAnyChild yet — both finders take a markerFn (dir)=>boolean, so one 'hasAnyChild(...names) => (dir) => names.some(n => hasChild(n)(dir))' composes into both call sites. THROWING-GATE BEHAVIOUR (load-bearing for Phase 2's fail-closed findings, INDEPENDENTLY VERIFIED by the orchestrator at lib/gate-runner.mjs:49 and :52-54): evaluate() wraps both gate.resolveRoots and gate.check in try/catch and pushes '[<gate>] crashed on <root>: <msg>' into PROBLEMS — i.e. blocking, never a silent pass. So a throwing readMirror(root) inside checkBridge surfaces correctly through the Stop hook with no extra plumbing. Note warnings are best-effort and swallowed (:56), so fail-closed evidence must be a PROBLEM, never a warning.
<!-- SECTION:NOTES:END -->
