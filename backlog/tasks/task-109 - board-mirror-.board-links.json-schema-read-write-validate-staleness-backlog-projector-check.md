---
id: TASK-109
title: >-
  board mirror: .board/links.json schema, read/write/validate, staleness,
  backlog projector, --check
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-27 16:14'
updated_date: '2026-08-28 20:12'
labels:
  - feature
  - chassis
  - spec-bridge
dependencies:
  - TASK-102
  - TASK-107
  - TASK-104
priority: high
ordinal: 141000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Introduce lib/board-mirror.mjs — the tracked board interface every provider projects into, so the gate stops knowing what a board is.

Today findLinkedTasks() scans backlog/tasks/*.md and bridgeGate.resolveRoots keys on hasChild("backlog"), so a Jira-only host resolves zero roots and the Stop hook SILENTLY passes with nothing checked. This spec makes the mirror exist and be trustworthy.

Contract-shaped: goes first, unblocks TASK-110 and TASK-111.

Spec: specs/052-board-adapter-seam
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Schema documented and implemented with unknown keys round-tripping intact
- [ ] #2 readMirror returns null for absent and THROWS for malformed JSON or unknown schema
- [ ] #3 writeMirror is byte-deterministic; links sort naturally (TASK-9 before TASK-10)
- [ ] #4 validateMirror catches missing field, wrong type, duplicate id, duplicate specDir, non-monotonic ac index
- [ ] #5 mirrorStaleness returns stale+reason for non-ancestor sha, absent sha on requiresSync, and non-git root
- [ ] #6 backlog projector matches findLinkedTasks('.') entry-for-entry on id/status/specDir/acs
- [ ] #7 parseLinkedTask and the tasks-dir scan MOVED to lib/board-mirror.mjs; bridge.mjs re-exports; all import sites resolve
- [ ] #8 --check exits nonzero on a hand-edited backlog mirror naming the drifted id; 0 when fresh; 0 when absent
- [ ] #9 test/spec-bridge, test/project-gates, test/phase-status pass with NO edits to those files
- [ ] #10 test/board-mirror.test.mjs covers AC 2-8; docs/wiki re-pinned for every touched source
- [ ] #11 Spec phase: Phase 1 — Schema, read/write, validate
- [ ] #12 Spec phase: Phase 2 — Move the parser, prove nothing broke
- [ ] #13 Spec phase: Phase 3 — Staleness, provider registry, the Backlog projector
- [ ] #14 Spec phase: Phase 4 — The `--check` CLI, dogfood, and re-ground
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PRE-SWEEP GATE (2026-08-27, readiness check before sweeping TASK-109..113). Deps on TASK-102/107/104 are sweep-blockers found by running the sweep's own precondition gate, not scope:

(1) TASK-102 — HARD BLOCKER, verified concretely. core.hooksPath is active; .githooks/pre-commit runs full 'node --test', which includes test/run-gates.test.mjs:20 asserting the repo passes wiki-freshness. docs/wiki/spec-bridge-plugin.md pins spec-bridge/gates/bridge.mjs, which spec 053 Phase 1 edits. So commit 1 of that phase stales the note, turns node --test red, and pre-commit blocks EVERY subsequent commit until the re-pin — which doctrine sequences last. Unsatisfiable. Specs 052/053/054/055 each touch pinned sources across multiple phases, so this fires early and repeatedly. Same mechanism TASK-102 records behind the specs/048 field case ('254 pass, 0 fail' reported while four notes were staled).

(2) TASK-107 — tier pins unproven at the harness. tiers.mjs --check exits 0, but that proves the FILES say the right model, not that it served. TASK-106 finding 3: haiku-implementer dispatched 'agent type not found'; opus-implementer served its PRE-regeneration pin. Sweep doctrine: a wrong pin caught after one agent is a rounding error, after a lane it is the lane's budget. This is a 5-task lane.

(3) TASK-104 — gate blind to branch-local spec dirs. These five spec dirs are on main so they resolve today, but the sweep's claim protocol authors each spec ON A BRANCH; the gate reads from root and reports the task as exceeding its artifacts. Recommended before sweeping, less severe than (1).

Also noted, not blocking: no scripts/check-merge-drift.mjs on this host (sweep falls back to raw git; loses claim-collision + drift matrix). A prunable worktree from 2026-07-31 points at /Users/evanstern/neumo/projects/praxis/ — verify dead, then 'git worktree prune'.

CLAIMED by sweep orchestrator 2026-08-28 (Lane 1, signed off). Branch task-109-board-mirror off origin/main tip 679492c; worktree .claude/worktrees/task-109 (background-job mode). Spec dir specs/052-board-adapter-seam already carried a complete spec.md + plan.md + tasks.md on main (hand-authored under the runbook's operator-signed escape line, .specify/ absent on this host), so the claim commit carries the status flip + the four phase ACs seeded from tasks.md rather than a stub. TIER: sonnet · model cc/claude-sonnet-5[1m] · defaultTier per .claude/model-tiers.json; justification: the spec settles the judgment calls, so this is execution not design. tiers.mjs --check exited 0 with all three tiers 'unchanged' before dispatch. Dispatch is phase-scoped: one fresh sonnet-implementer per tasks.md phase (4 phases), each re-grounded from the spec artifacts + branch commits. Served model to be confirmed from the first dispatch transcript before siblings launch.

PHASE 1 COMPLETE (commit 14b4577). lib/board-mirror.mjs + test/board-mirror.test.mjs; all 10 Phase 1 boxes ticked; suite 458/458 verified independently by the orchestrator (baseline 449 + 9 new). Agent also added board-mirror to README.md's chassis module list, which check-docs.mjs required. SERVED MODEL — evidence quality note: the implementer reported the harness identity string 'cc/claude-sonnet-5[1m]' (dispatch header + system prompt), which is a SELF-REPORT, not the 9router per-request ledger evidence that TASK-107 established as the standard for this host. The orchestrator attempted to query the router ledger at 127.0.0.1:20128/api/requests for independent confirmation but the worktree-isolation guard refused every command shape needed (curl with auth header, redirect to file). Treated as UNCONFIRMED-BUT-CONSISTENT: the dispatch named agent type sonnet-implementer whose frontmatter pins cc/claude-sonnet-5[1m], tiers.mjs --check exited 0 with that tier 'unchanged', and ANTHROPIC_DEFAULT_SONNET_MODEL matches. Owed: ledger spot-check from the repo root (where the guard does not apply) before the lane's remaining dispatches are trusted on cost.

SERVED-MODEL VERIFICATION — RESOLVED, no debt owed (correcting the prior note's 'owed' framing). Re-read the runbook's actual rule: TASK-107 settled tier-pin verification for this host via the 9router ledger, and 'a resuming session need not re-derive this, but must still spot-check the first dispatch of any lane IF THE TIER CONFIG HAS CHANGED SINCE.' The config has NOT changed: tiers.mjs --check exited 0 with all three tiers 'unchanged' at sweep start, and .claude/model-tiers.json is untouched this session. So no ledger spot-check was required and none is owed; the earlier attempt was work the runbook did not ask for. For the record, the router admin API at 127.0.0.1:20128/api/requests (and /api/stats, /api/logs, /api/usage) rejects ANTHROPIC_AUTH_TOKEN with 401 — it uses a separate auth scheme, so a future session wanting ledger evidence needs the router's own API token from the operator. Not pursued further: locating that credential in ~/.9router is an operator-permission question, not something to work around. Standing evidence for phase dispatches this lane: agent type sonnet-implementer, frontmatter pin cc/claude-sonnet-5[1m], tier 'unchanged', ANTHROPIC_DEFAULT_SONNET_MODEL matches, plus implementer self-report agreeing.

PHASE 4 RE-GROUNDING SCOUT (orchestrator, before Phase 4 dispatches — so Phase 4's agent inherits it as an artifact). Re-pin surface for this task: 6 notes pin the touch surface directly (chassis-utilities, build-and-release, CAPSULES, educate-plugin, gates-consumption-surface, spec-bridge-plugin) and 12 more pin a plugin.json, which the mandatory marketplace version bump stales — so expect ~18 re-pins, consistent with the runbook's '~17 notes' warning. SPECIFIC HAZARD: docs/wiki/spec-bridge-plugin.md is ALREADY over budget at 8455/8000 chars on a size_budget_exempt granted during TASK-104, and it is unavoidably in scope twice over — it pins spec-bridge/gates/bridge.mjs (Phase 2 edits it) AND spec-bridge/.claude-plugin/plugin.json (the version bump touches it). Its own exemption text argues a split would butcher the note: the splittable unit is ~500 chars, under the ~1,500-char minimum-content counter-rule in docs/corpus-spec.md, and trims recovered only ~30 chars each. Note also test-suite-catalog-plugins-gates.md is at 8231/8000 on a second exemption, and Phase 4 adds tests. Phase 4 must NOT quietly stack a third exemption: per the runbook, size_budget_exempt is for content that cannot be split, not for prose just added. If Phase 4's additions push either note further, the honest options are a genuine trim, the summary-style split TASK-95/103 already own, or STOP and surface it to the operator — do not invent a fourth path. Also: honest re-pins only — classify each pin RE-PIN-ONLY vs NEEDS-REVIEW against the real diff over that note's sources; never set pin = merge commit to green the gate.

PHASE 2 COMPLETE (commit 5580d51), verified independently by the orchestrator rather than on report. parseLinkedTask + findLinkedTasks + the MARKER regex moved out of spec-bridge/gates/bridge.mjs into lib/board-mirror.mjs. Verified: (a) MOVE not copy — bridge.mjs is -46 lines and defines neither symbol (checked with grep -a per the NUL-byte trap); (b) re-export wired at bridge.mjs:26 (import) + :265 (export), which the implementer correctly noted must be an explicit import+export pair rather than a bare 'export ... from', because checkBridge/verifyBridge/planBridge call findLinkedTasks internally and a pure re-export binds no local name; (c) AC#9 HARD GATE HOLDS — git diff --stat 415d5c8..HEAD over test/spec-bridge.test.mjs, test/project-gates.test.mjs, test/phase-status.test.mjs is EMPTY across both phase commits; (d) suite 458/458, 0 fail. Also dropped bridge.mjs's now-unused readdirSync import. SERVED MODEL: this implementer was explicit that it had NO harness-provided evidence of its identity and that cc/claude-sonnet-5[1m] was its inference from the dispatch prompt text — exactly the self-report weakness TASK-107 documented (two of three probes could not see their own model). Per the runbook this needs no ledger re-derivation because the tier config is unchanged, but it is logged here as the honest evidence quality: pin-consistent, not ledger-proven.

GATE DIAGNOSIS (orchestrator, mid-Phase-3) — 55 Stop-hook findings investigated, NOT dismissed; conclusion: the gate is CORRECT and nothing is broken. The hook reported every finding as 'the required gate "tests" is red (exited 1)'. Verified against reality instead of trusting either side: (a) suite on the branch = 458/458 pass, 0 fail; (b) suite at root = 449/449 pass, 0 fail; (c) bridge gate run from ROOT = 0 findings; (d) bridge gate run from INSIDE THE WORKTREE = the same ~55 findings but naming 'the red-by-construction gate "wiki-freshness"', not 'tests'. Root cause is real and expected: node grounding-wiki/gates/cli.mjs freshness . docs/wiki exits 1 on this branch with exactly two STALE notes — docs/wiki/overview.md (sources changed by 14b4577, Phase 1) and docs/wiki/spec-bridge-plugin.md (sources changed by 5580d51, Phase 2). Phases 1-2 edited pinned sources; Phase 4 owns the re-pin, so the branch is legitimately red on freshness until then. This is the TASK-102 mechanism the pre-sweep gate note on this card already predicted, and it is why the version bump and re-pins are sequenced into Phase 4 rather than per-phase. DISCREPANCY WORTH A CARD (not fixed here, out of scope): the Stop hook attributed the failure to the 'tests' gate while a direct gate run attributed it to 'wiki-freshness'. A misnamed gate in the blocking message is expensive — the runbook already records three wrong conclusions on 2026-08-28 from chasing a phantom red 'tests' gate. Recommend carding it after this lane; needs operator approval per scope discipline.

PHASE 3 COMPLETE (commit 412c935), verified independently. mirrorStaleness + providers registry + projectBacklog; suite 458 -> 465/465, 0 fail (7 new tests). Verified by the orchestrator, not taken on report: (a) NO provider-name conditional anywhere in lib/ — the only grep match for 'provider ===' is the comment forbidding it (board-mirror.mjs:244); (b) registry is exactly the spec's shape: providers = { backlog: { requiresSync: false, project: projectBacklog } } at :245-247; (c) mirrorStaleness fails CLOSED on an unknown provider name (line 280: 'const requiresSync = provider ? provider.requiresSync : true' with the rationale commented) — that is the right default and it is real, not incidental. Implementer matched grounding-wiki/gates/repin-window.mjs:44-50's spawnSync argv shape rather than inventing a second git-shelling convention, but deliberately returns the raw exit status instead of that helper's collapsed boolean, because mirrorStaleness must distinguish exit 1 (valid commits, not an ancestor) from other failures (cannot verify at all) — the spec's three cases need different reason strings. Sound call. AC#6 parity test runs against this repo's own 58 real linked tasks rather than a fixture, which is stronger. Served model: self-report again, explicitly flagged by the implementer as having no harness-provided evidence — pin-consistent, not ledger-proven, same as phases 1-2.

PHASE 4 COMPLETE — all four gates verified INDEPENDENTLY by the orchestrator: node --test 468/468 0 fail; check-docs exit 0; sync-version --check 'all versions = 0.59.0'; wiki freshness EXIT 0, 40 notes fresh (only the two pre-existing size-budget WARNs remain, non-blocking). Commits: 19e7a67 (--check CLI + 3 AC#8 tests, 465->468), edea9b8 (dogfood .board/links.json, 58 links), 4694352 (0.58.0 -> 0.59.0), 990b61f (12-note re-ground), 5c47903 (tasks.md ticks + Notes). AC#9 HOLDS ACROSS THE WHOLE BRANCH: git diff --stat 415d5c8..HEAD over the three protected test files is EMPTY. THE OVER-BUDGET CONSTRAINT HELD, verified not assumed: git diff over docs/wiki/ shows ZERO added or widened size_budget_exempt lines. spec-bridge-plugin.md was handled by an HONEST re-pin — prose amended BEFORE the pin moved (lib/board-mirror.mjs added to sources:, the parseLinkedTask clause rewritten to say the symbol now lives in lib/board-mirror.mjs and is re-exported), paid for by trimming a genuinely redundant clause that restated the Project-gates paragraph; body net smaller, exemption text untouched. test-suite-catalog-plugins-gates.md correctly left alone — its sources: does not list test/board-mirror.test.mjs so it is not stale, and pushing an already-maxed note further would have been the dishonest option; the uncatalogued new test file is flagged as a gap for the TASK-95/103 split. Re-pin ledger: 6 RE-PIN-ONLY (pure version-stamp diffs), 6 NEEDS-REVIEW each verified against the real diff (build-and-release + pdlc-plugin + reorient-plugin + team-review-plugin quote historical/skill-scoped versions unaffected by the bump; overview needed no prose change; spec-bridge-plugin amended as above). chassis.md correctly NOT re-pinned despite the task item naming it — its sources were untouched, so it is genuinely fresh. Served model: implementer again explicit that it had no harness-provided evidence; pin-consistent, not ledger-proven.

PR #132 OPENED (https://github.com/evanstern/praxisflux/pull/132), branch task-109-board-mirror, 10 commits 415d5c8..94f86ea. origin/main had NOT moved since 679492c, so no reconcile/merge-in was needed and no pins required reclassification. Both pre-push gates green (version-bump vs origin/main, wiki freshness). MUST MERGE AS A MERGE COMMIT, never squash — this branch carries wiki pins referencing its own commits (990b61f re-pins 12 notes to 4694352), and squashing would orphan those hashes and break the freshness gate. Awaiting operator review/merge per the runbook's serial-merge rule and the Lane 0 precedent (PR #130 was operator-merged after review). NOT self-merged. After merge, the post-merge closures (tasks.md tick at root, spec-bridge:sync's derived board-Done, the runbook log row completion) ride the NEXT claimed task's branch per background-job execution mode.
<!-- SECTION:NOTES:END -->
