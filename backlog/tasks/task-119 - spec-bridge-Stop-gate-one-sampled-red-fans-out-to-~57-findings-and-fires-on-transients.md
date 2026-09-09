---
id: TASK-119
title: >-
  spec-bridge Stop gate: one sampled red fans out to ~57 findings, and fires on
  transients
status: Done
assignee:
  - '@claude'
created_date: '2026-09-08 15:35'
updated_date: '2026-09-09 14:02'
labels:
  - tech-debt
  - spec-bridge
  - gates
dependencies: []
ordinal: 150000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The spec-bridge Stop hook fired five times during one task (TASK-116, 2026-09-08), each time emitting ~57 near-identical findings — one per Done-eligible spec — all downstream of a SINGLE red `tests` gate. Every firing cost real diagnosis time. Four causes were identified; one was never reproduced.

**Two distinct problems.**

**1. Fan-out.** One red project gate produces one finding PER linked Done-eligible spec (~57 here, and it grows with the spec count). The findings are indistinguishable from each other and none names the actual cause. The signal "your test suite is red" arrives as 57 lines about ticked checkboxes in specs 001–059, most of them merged months ago and none of them at fault. A single "the `tests` gate is red — N ticked phases are affected" would carry the same information.

**2. Transient sampling.** The gate runs `node --test` at Stop time against whatever the tree happens to be. Observed causes across the five firings:
   - **Rounds 1, 2, 4:** sampled a worktree holding an implementer's UNCOMMITTED mid-dispatch edits. The commit was fine; the sample was not. This is the mirror image of the repo's own F6 finding ("a gate run against a dirty working tree proves nothing about the commit") — here it produced a false RED rather than a false green.
   - **Round 3:** a genuine test failure (spec 054's sentinel guard vs spec 060's new field). Correctly reported, and the only firing that was real.
   - **Round 5:** NOT REPRODUCIBLE. Both trees clean, root suite exit 0, `gate.sh` run manually from root AND from the worktree gave 0 findings, a concurrent-run test gave 0 findings, no stray root files, and CI passed. No explanation found. Recorded as unexplained rather than guessed at.

The ratio matters: one of five firings was actionable. A gate that cries wolf four times in five trains its reader to skip it, which is exactly the opposite of what "status can't exceed proven artifacts" is for.

Suggested directions (not decided): collapse the fan-out to one finding per red gate; skip or explicitly label the project-gate run when the working tree is dirty (a dirty tree cannot prove anything about a commit); and consider whether the Stop hook is the right place to run a ~45-second full suite at all.

Spec: specs/061-bridge-gate-fanout
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A single red project gate produces ONE finding naming that gate, not one per linked spec
- [x] #2 The project-gate run either skips or explicitly labels its verdict when the working tree is dirty, so a mid-dispatch sample cannot read as a real failure
- [x] #3 Regression test: a red gate plus N Done-eligible specs yields one finding, not N; and a dirty tree yields a labeled/skipped verdict rather than a bare red
- [x] #4 The unexplained round-5 firing is either reproduced and explained, or explicitly recorded as unreproduced with what was ruled out
- [x] #5 Spec phase: Phase 1 — Collapse the fan-out (R1, R3.1)
- [x] #6 Spec phase: Phase 2 — Label the dirty-tree sample (R2, R3.2)
- [x] #7 Spec phase: Phase 3 — Instrumentation for the unreproduced firings (R4)
- [x] #8 Spec phase: Phase 4 — Dogfood, catalog, bump, re-ground
- [x] #9 Spec phase: Phase 3b — Fix the dogfood red this task's own tests introduced (BLOCKING for merge)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Round 6 (2026-09-08, after TASK-116 merged): fired again, now including TASK-116's own Phase 5 box. Ruled out, each with the command run:

- Dirty tree: root and worktree both clean (`git status --porcelain` empty).
- Real failure: `node --test` exit 0, 508/508 on the branch, 496/496 at root.
- My earlier manual reproductions were INVALID — `stop.mjs` reads hook input from stdin, so bare `bash gate.sh` may no-op instead of running the gate. Re-run correctly with `echo '{"stop_hook_active":false,"cwd":"..."}' | gate.sh`: still 0 findings, exit 0.
- Minimal non-login shell env (the hook's actual environment): `env -i PATH=<node dir>:/usr/bin:/bin HOME=$HOME node --test` -> exit 0, 508/508. Not an env/PATH difference.
- Load-sensitive flake: four concurrent full-suite runs, all 508/508 fail 0. Not contention.
- Gate timeout: GATE_TIMEOUT_MS is 120000 and a timeout reports as "timed out", not "exited 1". The message says exited 1, a genuine nonzero.
- Re-entrancy guard: SPEC_BRIDGE_GATE_ACTIVE unset in the calling shell, so the gate was not being skipped in my runs for that reason.

STILL UNREPRODUCED. Six firings, one actionable. Whatever produces the nonzero happens only in the harness's own Stop invocation and not in any invocation reachable from a shell — which is itself the most useful clue for whoever picks this up: instrument the gate to log its captured stdout/stderr and exit code at Stop time, rather than trying to reproduce it from outside.

Round 7 (2026-09-08, during TASK-119 sweep runbook authoring): fired again, ~57 findings, all downstream of `tests` red (exited 1). STILL UNREPRODUCED, but this round eliminated two more candidates AND found a real hazard.

Newly ruled out (each with the command run):
- `SPEC_BRIDGE_GATE_ACTIVE=1` on the child: round 6 only checked the flag was UNSET in the calling shell, never ran the suite WITH it set — which is what the gate actually does. `SPEC_BRIDGE_GATE_ACTIVE=1 node --test` -> exit 0, 508/508. Not the re-entrancy flag leaking into the child.
- Worktree cwd: the gate resolved its root to a worktree this time (orchestrator was isolated in .claude/worktrees/task-119, a condition no earlier round had). `node --test` from the worktree -> exit 0, 508/508. Root checkout also 0, 508/508.
- Faithful spawn replay: a probe replicating runGateCommand exactly (spawnSync, argv, shell:false, SPEC_BRIDGE_GATE_ACTIVE=1, cwd) against BOTH the root and the worktree returned status 0 / fail 0 / no error for each. The gate command as the gate invokes it does not reproduce the nonzero.

NEW HAZARD FOUND (real, independent of this bug): `.claude/worktrees/refactor-triage-2026-07-31/` is a months-old leftover tree that is NOT a registered worktree (`git worktree list` shows only the root) but DOES contain a `backlog/` dir and a `docs/wiki/`. Its suite exits 1 — 36 wiki notes whose pins are 'not a known commit' in that tree. So a red `backlog/`-bearing tree is sitting inside the checkout.

This is a CANDIDATE MECHANISM, not a confirmed one, and the distinction matters: bridgeGate resolves roots via findRootsDownwards, whose defaultSkip skips dot-dirs, so from the root checkout OR from task-119 the resolver returns exactly ONE root (verified by calling it directly). The stale tree is only reachable if some invocation starts the walk at `.claude/worktrees/` itself, where neither child name is dot-prefixed and BOTH would resolve as roots — one of them red. Whether the harness ever passes such a startDir is exactly what cannot be determined from outside, and is what AC #4's instrumentation should capture: log the resolved roots alongside the captured stdout/stderr and exit code at Stop time.

Round tally: seven firings, one actionable. Recommend the stale tree be removed on its own merits regardless of whether it is this bug's cause.

Round 7 addendum (2026-09-08): the stale tree is an ORPHAN, not a registered worktree. Its pointer file references a PREVIOUS repo location (/Users/evanstern/neumo/projects/praxis) that no longer exists — a test for that directory fails. It is a detached copy left behind by the repo relocation: the current repo has no registration for it, which is why the worktree listing never showed it and why its 36 wiki pins read 'not a known commit' — the objects those pins name live in an object store that is gone, not in this repo. This REFINES the candidate mechanism rather than confirming it: the orphan sits under .claude/, which findRootsDownwards's defaultSkip skips, so it is still reachable only if some invocation starts its walk at .claude/worktrees/ itself. AC #4's instrumentation logging resolved roots remains the way to settle it. Operator approved removal 2026-09-08; the harness's destructive-action guard declined to execute the removal without the path named explicitly in an operator turn, so removal is pending an operator hand. It is independent of this task's deliverable.

Dispatch record (2026-09-08): tier sonnet, model ID cc/claude-sonnet-5[1m], via the generated agent definition .claude/agents/sonnet-implementer.md (frontmatter pin is what this harness honors). Rubric justification: defaultTier — the card's ACs plus spec 061's three orchestrator-settled design rulings leave no judgment call for the implementer; this is work to a written spec against an existing in-repo pattern (memoizeRun already de-duplicates the gate RESULT across specs; this extends the same de-duplication to the FINDING). No escalation, no operator checkpoint owed for tier. Served model to be recorded from the first dispatch's transcript before any sibling dispatch.

SOLVED (2026-09-08, round 8, during Phase 1) — the 'transient' firings were NEVER transient. The fan-out was MISLABELING which gate was red.

Round 8 fired with my worktree clean and the suite green (508/508, exit 0), so the dirty-tree hypothesis was out. Running the bridge's own path from that same clean tree: checkBridge(runGates:true) -> 58 problems, every one of them naming the 'tests' gate as red. But running each declared gate individually via runGateCommand in the same process: tests {ok:true}, docs-in-sync {ok:true}, versions-consistent {ok:true}, wiki-freshness {ok:true}. A flat contradiction.

Phase 1's collapse resolved it. Post-collapse, the same invocation returns exactly ONE problem: 'the red-by-construction gate wiki-freshness is red (exited 1) - 58 linked specs affected'. Confirmed directly: the freshness gate exits 1 with two STALE notes (spec-bridge-plugin.md and test-suite-catalog-plugins-gates.md, both staled by Phase 1's own commit 0956e9b).

So the red gate was ALWAYS wiki-freshness — a redByConstruction gate that is legitimately red mid-PR between a source edit and its re-pin commit. The pre-collapse finding text attributed it to 'tests' and repeated that attribution 57 more times. Six of the eight firings were the freshness gate doing exactly its job, reported under the wrong gate's name, which is precisely why every attempt to reproduce a red 'tests' from a shell came back green: tests was never red.

This closes AC #4 by REPRODUCTION AND EXPLANATION rather than by 'recorded as unreproduced'. The earlier nine eliminations were all correct AND all irrelevant — they were eliminating causes of a red that did not exist. The orphaned worktree (round 7) is a real hazard but NOT this bug's cause.

Consequence for the spec: R1 is not just noise reduction, it is a CORRECTNESS fix. One finding per gate names the gate that is actually red; the fan-out actively misdirected diagnosis for eight firings across two days. Worth stating in spec.md and in the wiki note.

Round 9 (2026-09-08, mid-Phase-2) — fully accounted for, no new mystery. Two separate reasons the old output persists:

1. THE STOP HOOK RUNS THE INSTALLED PLUGIN, NOT THE BRANCH. hooks.json invokes gate.sh from the plugin cache (~/.claude/plugins/cache/praxisflux/spec-bridge/0.59.6). Verified: the installed gates/bridge.mjs has ZERO occurrences of collapsedGateProblems; the branch copy has four. So the collapse cannot affect Stop output until this PR merges AND the installed plugin is updated. Every firing between now and then will show the old ~57-line fan-out naming the wrong gate. This is expected and is NOT evidence the fix failed — the in-process check (checkBridge from the branch) returns exactly 1 finding.

2. The underlying red is STILL wiki-freshness, and it is MINE. Phase 1's commit 0956e9b edited spec-bridge/gates/bridge.mjs and test/project-gates.test.mjs, which staled the two notes that pin them: spec-bridge-plugin.md (since 985ec436ff11) and test-suite-catalog-plugins-gates.md (since fc8cac785cef). That is a redByConstruction gate being legitimately red mid-PR between a source edit and its re-pin commit — exactly the window the bucket exists to license. Phase 4 (T020/T022/T023/T024) closes it.

Tests remain green throughout: 510/510, exit 0.

Worth carrying into the wiki note: a plugin-supplied Stop hook always evaluates the INSTALLED version, so a repo that dogfoods its own plugin cannot observe its own gate fix from the branch that makes it. The in-process call is the only local proof available pre-merge.

DEFECT FOUND IN VERIFICATION (2026-09-08, after Phase 3) — spec 050 defect 1, recurring in a new form. Found by exercising the new R4 instrumentation rather than by a test, which is itself the argument for R4.

The trace record from a real bridgeGate.check invocation reported: node --test -> status 1, while a direct bare node --test in the same tree was green 525/525. Chasing that contradiction: the suite exits 1 under SPEC_BRIDGE_GATE_ACTIVE=1 — precisely the env the gate sets on every child it spawns.

Five tests fail under that flag, all added by Phases 2-3, all of which call bridgeGate.check / bridgeGate.warn DIRECTLY:
- bridgeGate: a dirty-tree gate warning reaches warn() from check()'s single gate run
- R4: SPEC_BRIDGE_GATE_TRACE unset => no trace file written
- R4: SPEC_BRIDGE_GATE_TRACE set => one JSONL record naming resolved roots
- R4: bounded capture — stdout longer than the cap is truncated
- R4 verdict-neutral: an unwritable trace path is swallowed

Mechanism: checkBridge's execGates predicate is (runGates && gatesProfile && (injected || SPEC_BRIDGE_GATE_ACTIVE !== '1')). An INJECTED run bypasses the guard (spec 050 defect 1's fix), but bridgeGate.check has no injection seam — it hardcodes checkBridge(root,{runGates:true}). So under the flag these tests get execGates=false and see zero gate findings, and their assertions fail.

Confirmed NEW, not pre-existing: both Phase 1's test file and origin/main's have ZERO occurrences of bridgeGate (git show <ref>:test/project-gates.test.mjs). The pre-sweep suite never exercised bridgeGate directly, so it never tripped this.

Why it matters beyond the test suite: this repo's own  gate IS bare node --test, and the gate runs it with the flag set. So the repo's dogfood reddens its own tests gate whenever a bridgeGate-touching test exists — the exact failure mode spec 050 Phase 5 fixed for injected-run tests, reintroduced through a path with no injection seam. It also means the freshness gate was NOT the only red: rounds 8-10 had BOTH wiki-freshness (mine, legitimately mid-PR) and a genuine tests red that the collapse correctly reported as ONE finding but attributed to freshness because freshness is evaluated in the same pass.

Remedy dispatched as Phase 3b: give bridgeGate.check/.warn an injection seam (or make the flag-guard aware that a test-owned invocation is not a re-entrant spawn), so a bridgeGate test is honest under the flag. Non-negotiable: the guard must still stop real recursive spawning.

T019 dogfood evidence (Phase 4, 2026-09-08): forced this repo's own 'tests' gate red via an injected run (only 'tests' red, other 3 gates left green) and called checkBridge(root) in-process against this repo's real board (58 Done-eligible linked specs). AFTER (collapsed, spec 061 R1): exactly 1 finding — '[spec-bridge] the required gate "tests" is red (exited 1) — 58 linked specs affected. ...'. BEFORE (reconstructed): the pre-collapse per-spec loop (evaluateProjectGates called once per Done-eligible linked task) would have produced 58 findings, one per spec, all naming the ticked box rather than the gate. Caveat: the INSTALLED plugin under ~/.claude/plugins/cache/ still runs the pre-fix code, so the live Stop hook cannot show this collapse until this PR merges and the cache refreshes — this evidence is from the in-process call against the worktree's own source, not from triggering a real Stop hook.

Round 13 (2026-09-08, after PR #137 opened, CI green) — UNREPRODUCED from a shell, and it matters that I say so rather than reuse the round 9-12 explanation. What was eliminated this time, each with the command:

- My worktree, branch code, all four gates: SPEC_BRIDGE_GATE_TRACE captured node --test => 0, check-docs => 0, sync-version --check => 0, freshness => 0. Every declared gate green.
- The shared root checkout (on main, without the fix): node --test 508/508 exit 0, freshness exit 0. Also green.
- Resolved roots: exactly ONE (my worktree). CLAUDE_PROJECT_DIR is EMPTY in this session, so gate-runner falls back to input.cwd/cwd; findRootsDownwards returned a single root. The orphan tree is gone from consideration (still on disk, but dot-dir skipped).
- INSTALLED plugin code (0.59.6, pre-collapse) run in-process against my worktree: 0 problems. So it is not simply old-code-vs-new-code: the old code, pointed at this tree, also finds nothing.

So: two trees, two code versions, four combinations, all green — and the harness's own Stop invocation still emitted the ~57-line fan-out naming tests red. That is EXACTLY the round 5/6 signature: unreproducible from any invocation reachable from a shell.

Correcting myself: my rounds 9-12 accounting attributed the firings to (a) the installed plugin lacking the collapse plus (b) a genuinely red freshness/tests gate. Both were true THEN and verified at the time. Neither explains round 13, where everything is green. I should not have implied the general mystery was closed — AC #4's reproduction closed the ROUND 5-8 case (freshness misattributed as tests), and that finding stands on its own evidence. Whatever produces a red exit inside the harness's Stop invocation specifically, with a clean tree and green gates, is STILL not explained.

Which is precisely why R4's instrumentation shipped, and it is now the tool for this: the next firing can be diagnosed from the inside once 0.61.0 is the installed version and SPEC_BRIDGE_GATE_TRACE is set in the hook's environment. Until then the Stop hook runs 0.59.6, which has no tracer.

Recommend after merge: set SPEC_BRIDGE_GATE_TRACE in the hook env and let the next firing write its record. That is the first time this bug will be observable where it actually happens.

spec-bridge sync: Phase 1 — Collapse the fan-out (R1, R3.1): 7/7 · Phase 2 — Label the dirty-tree sample (R2, R3.2): 6/6 · Phase 3 — Instrumentation for the unreproduced firings (R4): 6/6 · Phase 3b — Fix the dogfood red this task's own tests introduced (BLOCKING for merge): 4/4 · Phase 4 — Dogfood, catalog, bump, re-ground: 8/8 — status In Progress → Done

Round 15 (2026-09-09, first firing with 0.61.0 INSTALLED) — THE COLLAPSE WORKS IN PRODUCTION.

The entire Stop-hook output was ONE line: 'the required gate tests is red (exited 1) — 59 linked specs affected'. Previous fourteen firings emitted ~57 near-identical lines each. That is R1 delivering exactly what it promised, in the live hook, on the real board. The count reads 59 rather than 58 because TASK-119 itself became Done-eligible.

The residual (round 13's) mystery is UNCHANGED and still unreproduced. Eliminated this round:
- Root checkout: node --test 526/526 exit 0, tree clean (git status --porcelain empty).
- Root under the hook's own env: SPEC_BRIDGE_GATE_ACTIVE=1 node --test -> 526/526, exit 0.
- Full R4 trace from the root via the INSTALLED 0.61.0: all four declared gates status 0 (tests, check-docs, sync-version --check, freshness). Resolved roots: exactly one, the root checkout.
- The task-119 worktree (still on pre-merge 8f3430f): node --test 526/526 exit 0, and bridgeGate.check from inside it returns 0 findings.

One NEW fact found, which is a real hazard even if it is not proven to be the cause: the task-119 worktree is DIRTY — it carries a modified TASK-119 task file (round 13/14 notes, superseded by the merge). So there is a second backlog/-bearing tree on disk with uncommitted state. findRootsDownwards skips dot-dirs, so from the root the resolver still returns one root, and running the gate from inside that worktree returns 0 findings. It is therefore still not a demonstrated path to the red — but a dirty backlog-bearing sibling tree is exactly the shape R2's dirty-tree label exists to neutralize, and it should not be left lying around.

Net: R1 is proven in production. R2 and R4 are shipped and exercised. The harness-only red remains unexplained after fifteen firings, and is now cheap rather than expensive to live with — one line, correctly attributed to a named gate, instead of 57 misattributed ones. Next diagnostic step unchanged: set SPEC_BRIDGE_GATE_TRACE in the HOOK's own environment (not a shell) so the next firing writes its record from inside the invocation that actually produces the nonzero.

Round 14 (2026-09-09, after PR #137 merged as ab0755b) — recovered from the task-119 worktree, where it was written on the branch after the merge and so never reached main. Expected behavior; it named the two remaining install steps rather than any code defect.

Two independent staleness layers, both verified at the time:
1. PLUGIN CACHE held 0.56.0, 0.59.0, 0.59.6, 0.60.0 — not 0.61.0, where the collapse shipped. Checked 0.60.0's gates/bridge.mjs: zero occurrences of collapsedGateProblems. The Stop hook was still executing pre-collapse code.
2. ROOT CHECKOUT also had zero occurrences and marketplace.json still read 0.60.0 — it had not been fast-forwarded since the merge.

The merge itself was correct: gh api reported merged=true, merge_commit_sha ab0755b, and origin/main's log showed a MERGE COMMIT (not a squash), so the hashes the wiki notes pin as verified_against stayed reachable.

Both layers are now resolved: /reload-plugins pulled 0.61.0 (5 occurrences of collapsedGateProblems) and the root was fast-forwarded to ab0755b, then to 44a8096 with the closure. Round 15 is the first firing on the fixed code — and it emitted ONE line.

TRACER ARMED (2026-09-09, operator-approved). Added to the env block of ~/.claude/settings.json:

  SPEC_BRIDGE_GATE_TRACE=/Users/evanstern/.claude/spec-bridge-gate-trace.jsonl

An explicit path rather than '1' deliberately: '1' resolves to CLAUDE_JOB_DIR-or-tmpdir, which scatters records across per-job scratch dirs and makes them hard for a later session to find. The pinned path is stable and outside every tracked tree.

Settings edit verified: valid JSON, 7 env keys and 13 top-level keys intact, backup at the job's tmp dir. The var lives in the HOOK's environment, which is the whole point — fifteen firings were diagnosed from shells that could not reproduce the red.

WHAT THE NEXT SESSION SHOULD DO when the gate next fires: read that JSONL file. Each record carries the resolved ROOTS, and per gate command the argv, cwd, exit status, signal, and captured stdout/stderr (capped at 4000 chars each). That is the first observation from inside the invocation that actually produces the nonzero.

Specifically worth checking in the record: (a) whether 'roots' contains more than the one root a shell resolves — the orphan tree at .claude/worktrees/refactor-triage-2026-07-31 carries its own backlog/ and its suite exits 1; (b) whether the tests command's status is 1 (a genuine nonzero) or null with an ENOENT error (the PATH mechanism now recorded on TASK-10); (c) the captured stderr, which no shell reproduction has ever seen.

Note the tracer is only in 0.61.0+, so it works from now on and could not have been used for rounds 1-15.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All spec tasks complete (Phase 1 — Collapse the fan-out (R1, R3.1): 7/7 · Phase 2 — Label the dirty-tree sample (R2, R3.2): 6/6 · Phase 3 — Instrumentation for the unreproduced firings (R4): 6/6 · Phase 3b — Fix the dogfood red this task's own tests introduced (BLOCKING for merge): 4/4 · Phase 4 — Dogfood, catalog, bump, re-ground: 8/8). Derived Done by spec-bridge sync.
<!-- SECTION:FINAL_SUMMARY:END -->
