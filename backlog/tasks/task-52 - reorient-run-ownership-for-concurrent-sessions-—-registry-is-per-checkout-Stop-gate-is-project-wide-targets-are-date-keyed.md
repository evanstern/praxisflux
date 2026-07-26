---
id: TASK-52
title: >-
  reorient: run ownership for concurrent sessions — registry is per-checkout,
  Stop gate is project-wide, targets are date-keyed
status: Done
assignee:
  - '@claude'
created_date: '2026-07-26 16:31'
updated_date: '2026-07-26 18:06'
labels:
  - reorient
  - design
dependencies: []
priority: medium
ordinal: 87000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Observed live in promptworld 2026-07-26 (see promptworld TASK-148 for the incident): two same-day reorient runs collided while unrelated sessions worked the repo. Three defects in the reorient plugin's run model: (1) .handoff/reorient/runs/ is per-checkout shared mutable state and gates/gate.sh fires on EVERY session stop for ANY in-flight run — sessions that don't own the run get nagged forever and cannot distinguish mine/theirs/orphaned (an operator abandoned a live run believing it orphaned; the owning session re-began it minutes later). (2) The synthesis target is date-keyed (docs/design/reorient-YYYY-MM-DD-<slug>.md) so two same-day runs collide on one output path — key it by run id instead. (3) No claim/liveness primitive: run manifests carry no owner (session id), no heartbeat, no origin-visible claim artifact, so liveness is guesswork; compare spec-claim-before-work (pushed artifact + push-rejection mutex). Design directions: owner+heartbeat on the manifest with the Stop gate scoped to the owning session; run-id-keyed synthesis targets; begin/abandon/takeover semantics that print who began the run, from where, and when. Interim operator doctrine until fixed: begin reorient runs from inside a worktree — .handoff/ is gitignored and therefore checkout-local, so the registry and its gate stay lane-local and never nag other sessions.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Run manifests carry ownership (session identity) and the Stop gate nags only the owning session/checkout
- [x] #2 Synthesis target paths are unique per run (run-id-keyed), never date-keyed
- [x] #3 begin/list/abandon surface owner + provenance so orphan-vs-live is decidable; takeover is explicit
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Branch task-52-reorient-run-ownership off main.
2. lib/gate-runner.mjs — additive gate-contract extension: evaluate() builds ctx { sessionId (input.session_id || $CLAUDE_CODE_SESSION_ID || null), input } and passes it to resolveRoots(start, ctx), check(root, ctx), warn(root, ctx); add optional before(input) callback to runStopHook so a plugin's stop entry can do owned-state upkeep (writes stay in the plugin's writer module). Existing gates ignore the extra args — backward compatible.
3. reorient/scripts/run.mjs — begin records owner { sessionId, user, host } + heartbeatAt on the manifest (--session overrides env), prints owner/provenance, and lists any other in-flight runs for the same root with owner + heartbeat age; default synthesis path becomes run-id-keyed docs/design/reorient-<run-id>.md (never date-keyed); list shows owner, origin, started, heartbeat age; abandon refuses a run owned by a different live-identifiable session and points at the new explicit `takeover <id>` command (which reassigns ownership and prints who held it, from where, since when); finish prints an ownership note; export heartbeat helper for the stop path.
4. reorient/gates/reorient.mjs — resolveRoots returns all in-flight runs under the checkout; check(root, ctx) blocks ONLY the owning session (fallback to legacy cwd-scoping when either session id is unknown); new warn(root, ctx) emits a non-blocking orphan notice for non-owned runs whose heartbeat is stale (>60 min), naming owner, origin, began-at, heartbeat age, and the takeover/abandon commands.
5. reorient/scripts/stop.mjs — before gating, refresh heartbeatAt on runs owned by this session (via run.mjs export through runStopHook's before hook).
6. SKILL.md — document ownership, provenance, takeover, run-id-keyed synthesis; bump skill version 0.2.0 -> 0.3.0.
7. Tests — reorient.test.mjs: owner+heartbeat recorded, run-id-keyed synthesis (two same-day runs don't collide), gate blocks owner only, non-owner not nagged, stale non-owned run warns, abandon-by-non-owner refused until takeover, heartbeat refresh; chassis.test.mjs: evaluate threads ctx.
8. Versions — sync-version to 0.22.0 (minor), skill 0.3.0; wiki-update pass (reorient-plugin.md, gate-runner note) + check-docs; PR per one-task-one-PR. Aware TASK-53/54 (pdlc) are in flight — marketplace version bumps will need serial merge ordering.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented: manifests carry owner {sessionId,user,host} + heartbeatAt (begin stamps, owner's Stop hook refreshes via run.mjs heartbeatOwnedRuns); gate-runner threads ctx {sessionId,input} to resolveRoots/check/warn; reorient gate blocks only the owning session (legacy checkout scoping when identity unknown), non-owned runs warn non-blockingly once heartbeat >1h stale; synthesis default now docs/design/reorient-<run-id>.md; begin/list/abandon print owner+provenance; abandon owner-only; explicit takeover command. 201 tests pass incl. 5 new. Release 0.22.0, skill 0.3.0.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Reorient runs are now session-owned. begin stamps the manifest with owner (sessionId from $CLAUDE_CODE_SESSION_ID or --session, plus user@host provenance) and heartbeatAt, which the owning session's Stop hook refreshes every turn (heartbeatOwnedRuns via runStopHook's new before hook — writes stay in run.mjs). The gate-runner threads ctx {sessionId, input} to resolveRoots/check/warn (additive contract change); reorientGate blocks only the owning session, keeps legacy checkout scoping for ownerless records/identity-less sessions, and emits a non-blocking 'looks orphaned' warn with full provenance once a foreign run's heartbeat is >1h stale. Synthesis defaults are run-id-keyed (docs/design/reorient-<run-id>.md), never date-keyed. begin/list/abandon surface owner+provenance+heartbeat age; abandon is owner-only; takeover <id> is the explicit adoption path and prints who held the run, from where, since when. Verified with 5 new reorient tests + 1 gate-runner ctx test (201 total pass), bump gate ok (0.21.0→0.22.0, skill 0.3.0), wiki re-grounded (new reorient-run-ownership note, 28 notes fresh).
<!-- SECTION:FINAL_SUMMARY:END -->
