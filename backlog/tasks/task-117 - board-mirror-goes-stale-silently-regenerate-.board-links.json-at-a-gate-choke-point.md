---
id: TASK-117
title: >-
  board mirror goes stale silently: regenerate .board/links.json at a gate choke
  point
status: In Progress
assignee:
  - '@claude'
created_date: '2026-09-08 15:34'
updated_date: '2026-09-14 17:43'
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
- [ ] #1 The backlog mirror can no longer be silently stale when the bridge gate reads it — either the gate regenerates it in its precondition or a hook fails on staleness (decision recorded)
- [ ] #2 A stale mirror is distinguishable from real board drift in the gate's own output, so a session cannot chase phantom findings
- [ ] #3 Regression test pins the chosen mechanism: a deliberately stale mirror produces the intended outcome (refresh or block), not misleading status findings
- [x] #4 Spec phase: Phase 1 — supported regenerate entry point (R3)
- [x] #5 Spec phase: Phase 2 — hook step and distinguishing output (R1, R2, R4)
- [ ] #6 Spec phase: Phase 3 — prove it and close (R5, R6)
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

Dispatch: tier=sonnet pinned=cc/claude-sonnet-5[1m] served=claude-sonnet-5 (Phases 1-2 — regenerate entry point + hook step; served verified from transcript, 164k tokens / 36 tool uses)
<!-- SECTION:NOTES:END -->
