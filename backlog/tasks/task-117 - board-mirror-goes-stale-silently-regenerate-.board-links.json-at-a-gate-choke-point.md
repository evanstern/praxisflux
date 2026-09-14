---
id: TASK-117
title: >-
  board mirror goes stale silently: regenerate .board/links.json at a gate choke
  point
status: Done
assignee:
  - '@claude'
created_date: '2026-09-08 15:34'
updated_date: '2026-09-14 19:33'
labels:
  - tech-debt
  - spec-bridge
  - gates
dependencies: []
ordinal: 148000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The bridge gate reads `.board/links.json` (TASK-110 / spec 053 made it provider-neutral by reading the mirror instead of `backlog/` directly). Nothing regenerates that mirror automatically, so it goes stale whenever anyone edits the board without remembering to recompute it.

Field case 2026-09-08 (TASK-116 sweep): the mirror's `generatedAt` was 2026-08-28 — eleven days old. The bridge gate faithfully reported five tasks whose board status "lagged their specs" (TASK-109/110/111 To Do or In Progress vs Done-eligible), all of which were ALREADY correct on the live board. Two sessions' worth of diagnosis went into chasing phantom board drift, and an orchestrator reported the wrong root cause once before finding it. `node lib/board-mirror.mjs --check --root .` names the disagreement in one run and was what finally settled it.

The mirror is derived state whose provider (`backlog`) is `requiresSync: false` — a deterministic recompute via `projectBacklog(root)`, no model needed. So there is no reason a human has to remember.

Two candidate fixes (pick one; do not do both):
1. Regenerate in the bridge gate's own precondition, so the gate never reads a stale artifact it could have refreshed itself.
2. Fail the pre-commit hook on a stale mirror, the way it already fails on version drift — making the staleness loud and local rather than silently misreported.

Option 1 is self-healing but hides drift; option 2 surfaces it but costs a manual step. Worth an explicit decision rather than defaulting.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The backlog mirror can no longer be silently stale when the bridge gate reads it — either the gate regenerates it in its precondition or a hook fails on staleness (decision recorded)
- [x] #2 A stale mirror is distinguishable from real board drift in the gate's own output, so a session cannot chase phantom findings
- [x] #3 Regression test pins the chosen mechanism: a deliberately stale mirror produces the intended outcome (refresh or block), not misleading status findings
- [x] #4 Spec phase: Phase 1 — supported regenerate entry point (R3)
- [x] #5 Spec phase: Phase 2 — hook step and distinguishing output (R1, R2, R4)
- [x] #6 Spec phase: Phase 3 — prove it and close (R5, R6)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TWO MORE FIELD CASES (orchestrator, 2026-09-14, during TASK-0121 — the first task of the sweep that will later fix this).

Both are the same defect this card describes: .board/links.json is derived state with no automatic recompute, so any board edit silently staled it.

CASE 1 — at the claim commit. Flipping TASK-0121 to In Progress and setting its Spec marker changed the projection; the mirror was not regenerated. Consequence was not cosmetic: `spec-bridge/gates/cli.mjs links .` could not see TASK-0121 at all, so the bridge had no link to gate and the link step appeared to have failed. Diagnosed by `node lib/board-mirror.mjs --check --root .`, which named it in one run — the same tool that settled the 2026-09-08 case.

CASE 2 — at the phase-AC ticks. Ticking the four Spec phase ACs and appending the Dispatch: notes staled it again, caught only because the orchestrator ran --check as part of the pre-PR gate sweep. Nothing in the normal commit path would have reported it.

Twice in a single task, on the two most routine board operations there are (claim, tick). This is direct evidence for the ruling already recorded on this card: OPTION 2 (pre-commit fails on a stale mirror). Both cases would have surfaced at the commit that caused them rather than at a gate run two steps downstream.

ONE MORE THING FOR THE IMPLEMENTER — the regeneration path is easy to call wrongly, which is arguably part of the problem this card should address. There is no `--write`/`--fix` flag: `lib/board-mirror.mjs --check --root <dir>` is the only CLI surface, so regenerating means writing a throwaway script against the module. The obvious call is wrong: `projectBacklog(root)` returns the bare links ARRAY, not a mirror object, so `writeMirror(root, projectBacklog(root))` produces a file with no schema envelope, which `--check` then reports as `unknown schema undefined` — a malformed mirror that looks like a different bug. The correct shape is to read the existing mirror, replace `links` and `generatedAt`, run `validateMirror` before writing:

    const prev = readMirror(root);
    const next = { ...prev, generatedAt: new Date().toISOString(), links: projectBacklog(root) };
    if (validateMirror(next).length) throw new Error("refusing to write invalid mirror");
    writeMirror(root, next);

Whatever mechanism this card lands, consider exposing a supported regenerate entry point so the fix does not require every caller to rediscover that envelope contract.

Spec: specs/071-mirror-staleness

FIELD CASES 4 AND 5 (orchestrator, 2026-09-14, full-board sweep). The same defect fired twice more, at the claim commits for TASK-0131 and TASK-0123. In both cases 'spec-bridge/gates/cli.mjs links .' could not see the newly claimed task at all until the mirror was hand-regenerated with the four-line envelope-correct recipe from this card's own notes; 'lib/board-mirror.mjs --check' named it in one run each time. Five occurrences now, every one on a routine board write (claim, tick, claim, claim). Recorded because the count is the argument: this is not an edge case, it is the default outcome of editing the board.

Dispatch: tier=sonnet pinned=cc/claude-sonnet-5[1m] note=[Phases 1-2 — regenerate entry point + hook step; served verified from transcript, 164k tokens / 36 tool uses] served=claude-sonnet-5

WORKTREE HOOK FINDING (verified by the orchestrator, 2026-09-14) — matters to anyone editing .githooks/ from a worktree in this repo. core.hooksPath is set to an ABSOLUTE path into the ROOT checkout (/Users/.../praxis/.githooks), and that config is shared by every worktree. So a real 'git commit' inside a worktree runs the ROOT's hook, never the worktree's edited copy: a hook change cannot be exercised by committing on its own branch, and a 'real commit passed' claim from a worktree proves nothing about the edit. Test a hook edit by invoking it directly (bash .githooks/pre-commit); it only governs real commits repo-wide once merged to main, where the root copy IS the edited file. Not a defect in this task — a property of the repo's worktree hook setup, and adjacent to the .worktrees vs .claude/worktrees doctrine conflict TASK-120 is carded to resolve.

Dispatch: tier=sonnet pinned=cc/claude-sonnet-5[1m] note=[Phase 3 — regression test, release, re-ground; served verified from transcript, 231k tokens / 86 tool uses] served=claude-sonnet-5

NEGATIVE CONTROL reproduced independently by the orchestrator (not accepted from the dispatch): deleting the two 'this is the MIRROR FILE lagging' lines from lib/board-mirror.mjs fails exactly the two AC#2 tests — the drifted-mirror and the requiresSync-stale cases — and nothing else (62 pass / 2 fail). Restored; diff vs HEAD empty. That is the assertion doing real work: it pins the DISTINGUISHING text, so a future edit that drops the note cannot pass. The dispatch reported two further controls: stubbing validateMirror out of regenerateMirror fails the invalid-mirror test with 'Missing expected exception', and removing the requiresSync guard fails with 'provider.project is not a function' — i.e. it really does crash on a null recompute without the guard, which is the Jira-host risk R4 exists for.

HOOK TEST DELIBERATELY NOT ADDED, with reasoning. pre-push has its own test because it carries real classification logic (WARN vs block, 'could not run' vs findings) worth pinning apart from the scripts it calls. The new pre-commit step is one unconditional line with no branching of its own, and set -e is the only mechanism — already exercised by every other step in that file. Everything actually worth pinning (the distinguishing note, the fix line, the requiresSync degrade) lives in board-mirror.mjs's CLI, which the five new tests exercise directly via execFileSync — which also sidesteps the core.hooksPath-across-worktrees caveat recorded above, since they never go through git commit.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A stale .board/links.json now fails the commit that caused it, instead of being silently misreported downstream as board drift.

MECHANISM: the operator's option-2 ruling, implemented as written — the pre-commit hook fails on a stale mirror, the way it already fails on version drift. Option 1 (the gate self-heals in its own precondition) stays rejected: it hides the drift it repairs, and the eleven-day field case would have become invisible rather than legible. No self-heal was built anywhere; bridge.mjs is untouched (R6, verified by diff).

WHY IT MATTERED: five recorded field cases before the fix, every one on a routine board write (claim, AC tick, claim, claim, claim) — plus a sixth during this sweep's own closure commit. The 2026-09-08 case cost two sessions of phantom-drift diagnosis and a wrong root cause. The worst symptom is that spec-bridge plan reads the mirror, not the board, so a stale mirror makes an already-completed sync re-emit its actions.

WHAT LANDED: regenerateMirror(root) plus a --write CLI mode (read -> replace links+generatedAt -> validateMirror -> write, refusing to write an invalid mirror), because the hook's failure has to name a real fix and the obvious call was actively wrong — projectBacklog() returns a bare array, so writeMirror(root, projectBacklog(root)) writes an envelope-less file that --check then misreports as 'unknown schema undefined'. A pre-commit step beside the version-drift check. Output that cannot be confused with board drift: both failure branches name the MIRROR FILE explicitly and print a copy-pasteable fix. requiresSync degrades rather than breaking, so a Jira host can still commit.

PROVEN: five tests; negative controls reproduced independently by the orchestrator (deleting the distinguishing note fails exactly the two AC#2 tests, 62 pass / 2 fail). No dedicated hook test, deliberately — the step is one unconditional line whose only mechanism is set -e, while everything worth pinning lives in the CLI the tests call directly.

The feature proved itself three times during its own delivery: --write resolved this branch's own mirror conflicts at each merge-in.

Released 0.65.3 (0.65.2 was taken by #150 first). Merged via PR #151, d99cda4, a true merge commit.
<!-- SECTION:FINAL_SUMMARY:END -->
