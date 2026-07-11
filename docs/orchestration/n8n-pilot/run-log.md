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
| 04:01:51 | **finish: approved by evan** — `pilot/run-mrftwdca-2yerm` merged `--no-ff` into the tamagotchi's main, HEAD `d88c7e7`. T002/T003 remain on its board for future pipeline runs |

## Scenario 3 — Done promotion lands through the human node (`run-mrfu9vrl-6ik7p`)

Fixture: scratch `done-eligible` — spec fully proven (all tasks checked), board lagging at
**In Progress**. The pipeline's agent round runs sync, whose derivation is the ONLY path
that moves a linked task to Done; the human then approves the landing.

| t | event |
|---|---|
| 04:02:55 | checkout: scratch fixture `done-eligible` |
| 04:02:55 | **Gate 0: FAIL** — plan non-empty (the Done promotion is pending) |
| 04:02:56 | Agent round 1 — sync |
| 04:03:52 | **Gate 1: PASS** — verified in the fixture: task `✔ Done`, final summary "All spec tasks complete (Setup: 1/1 · Core: 1/1). Derived Done by spec-bridge sync." |
| 04:04:33 | **finish: approved by evan**, HEAD `60f2c1d`. Done was promoted by sync's derivation inside the pipeline; the human approved the landing — the tier boundary the flow is built around |

## Addendum — the gate node consumes the published npm artifact (`run-mrfudcxk-nlnao`)

After the three workflow runs, the runner's gate step was switched from the local checkout
CLI to **`npx -y @praxisflux/gates --gates spec-bridge`** — the same published surface any
external orchestrator would consume — and re-verified directly against the runner on a fresh
`exceeds` fixture: npx gate FAIL (exit 1, full failure text — which now also carries the
plan's exact reconciling commands) → agent round (6 turns, $0.64) → npx gate PASS.

### Findings from scenario 2's inspection window

1. **`git add -A` at finish means the tree at approval time is what ships.** Inspection had
   hatched a `pet.json` (runtime state) that would have been swept into the merge. Fixed by
   gitignoring it — and it's a *spec gap*: 001-pet-core never said runtime state must be
   ignored. The human approval window caught what no gate checks.
2. **The spec-bridge gate proves the board, not the code.** T001 "passing" the gate means the
   bookkeeping is honest; whether `pet.mjs` is any good is exactly what the approval pause
   exists for. Tier boundaries held.

## Run 4 — T002 through the work-mode round (`run-mrfv1d62-ph4fb`, post-TASK-22)

The first "do new work" run exposed a shape gap: with an honest board, the
reconciliation-driven workflow skipped the agent and parked with nothing to approve
(run-mrfuvl23, cancelled). The work-mode round fixed it: a trigger prompt now runs
**Agent 0 before the gate ladder**.

| t | event |
|---|---|
| 04:24:17 | checkout: tamagotchi on `pilot/run-mrfv1d62-ph4fb` |
| 04:24:17 | Work Given? → **Agent 0**: implement T002 (feed / play with energy guard / sleep, honest exits) |
| 04:26:25 | agent done: exit 0, **18 turns, ~2 min, $1.36** |
| 04:26:26 | **Gate 0: PASS** — T002 checked, board reconciled |
| — | human inspection: feed→100 hunger, play→100 happiness, sleep→100 energy; unknown verb exits 2 with usage, no-pet exits 1. Mid-run incident: a human branch-switch under the running agent (recovered; finding recorded) |
| 04:28:00 | **finish: approved by evan**, merged to main `4e00bbd` — 2/3 spec tasks done, T003 remains |

## Run 5 — the finale: T003 and a completed spec (`run-mrfvzgvk-v8d3g`)

| t | event |
|---|---|
| 04:52 | trigger: implement T003 (smoke.sh + README) via the work-mode round |
| 04:54:01 | agent done: exit 0, **20 turns, ~2 min, $1.80** — wrote smoke.sh (which tests the pet's *feelings*: the exhausted face, the too-tired-to-play guard, a sad pet after neglect), a README that independently absorbed run 2's pet.json hygiene finding, ran the smoke suite green, and synced a now-fully-proven spec |
| 04:54:02 | **Gate: PASS** — board derived `✔ Done`: "All spec tasks complete (Alive: 2/2 · Proven: 1/1)" |
| 04:55:11 | **finish: approved by evan**, merged `9a69021` — **spec 001-pet-core complete** |

Totals for the tamagotchi: empty directory → done-and-documented in three pipeline runs
(T001 $1.38 · T002 $1.36 · T003 $1.80 ≈ **$4.54 of model time**), three gate verdicts,
three human approvals, zero hand-written lines.
