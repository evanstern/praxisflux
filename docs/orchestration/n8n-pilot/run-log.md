# Pilot run log — 2026-07-10/11

The pilot's actual first runs, preserved. Raw event stream: `runner.log` (gitignored per
run; this file is the curated record).

## Scenario 1 — forced failure → corrective loop → human approval (`run-mrfts734-nqmxl`)

Fixture: scratch `exceeds` — the board claims **Done** while the spec proves **In Progress**
(one unchecked task). The dishonest state is real, not staged.

| t | event |
|---|---|
| 03:49:10 | checkout: scratch fixture `exceeds` |
| 03:49:10 | **Gate 0: FAIL** — `[spec-bridge] TASK-1 is "Done" but specs/001-pay only proves "In Progress"` |
| 03:49:10 | Agent round 1 — the gate's failure text is the corrective prompt, verbatim |
| 03:50:00 | agent done: exit 0, **6 turns, ~49 s, $0.61** |
| 03:50:00 | **Gate 1: PASS** — plan empty, check clean |
| 03:50:00 | APPROVAL NEEDED — workflow parked at the Wait node |
| 03:51:49 | **finish: approved by evan** (a real human ran the resume curl), HEAD `83b8e92` |

The loop the ADR promised, observed end-to-end: gate rejects → agent repairs → gate accepts
→ human (and only a human) lands it.

## Scenario 2 — real work: the tamagotchi (`run-mrftwdca-2yerm`)

Target: `~/Claude/Code/tamagotchi` — a real standing project with a genuine Spec Kit spec
(`specs/001-pet-core/`), checked out by the runner onto branch `pilot/run-mrftwdca-2yerm`.
Prompt: implement ONLY the next unchecked task (T001: state layer + hatch + status with
mood faces), verify by running it, check the box, sync the board.

| t | event |
|---|---|
| 03:52:25 | checkout: real target on `pilot/run-mrftwdca-2yerm` |
| 03:52:25 | **Gate 0: FAIL** — board lags the spec (plan non-empty) |
| 03:52:25 | Agent round 1 — implement T001 + correction |
| 03:55:00 | agent done: exit 0, **14 turns, ~2.5 min, $1.38** |
| 03:55:00 | **Gate 1: PASS** — T001 checked, board In Progress, phase ACs mirrored, plan empty |
| 03:55:00 | APPROVAL NEEDED — parked at the Wait node |
| — | human inspection before approving: `node pet.mjs hatch Praxis && node pet.mjs status` → a happy ASCII cat at 80/80/100. Two hygiene findings (below), fixed pre-approval |
| *(pending)* | approval + merge to the tamagotchi's main |

### Findings from scenario 2's inspection window

1. **`git add -A` at finish means the tree at approval time is what ships.** Inspection had
   hatched a `pet.json` (runtime state) that would have been swept into the merge. Fixed by
   gitignoring it — and it's a *spec gap*: 001-pet-core never said runtime state must be
   ignored. The human approval window caught what no gate checks.
2. **The spec-bridge gate proves the board, not the code.** T001 "passing" the gate means the
   bookkeeping is honest; whether `pet.mjs` is any good is exactly what the approval pause
   exists for. Tier boundaries held.
