---
name: sync
version: 0.1.1
description: Catch the Backlog board up to what the Spec Kit artifacts prove — move each linked task's status, re-mirror phase acceptance criteria from tasks.md, and record progress notes. Use after working a spec, when the user says "sync the board", "update the kanban from the specs", or when the spec-bridge Stop gate warns a task lags its spec.
---

# sync — one-way: spec artifacts → Backlog board

Reconciles every linked task to its spec dir's derived state. The direction is absolute:
**files are truth, the board is the view.** Sync reads the spec dir and writes the Backlog
task (via the `backlog` CLI only); it must make **zero writes inside any spec dir** — not
even a touch. If the derivation looks wrong, the fix happens in the spec workflow
(`/speckit.*`), never by nudging the board.

## Precondition gate

1. Find the project root (the directory containing `backlog/`).
2. Run `node ${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs links <root>`. Empty array → STOP: nothing is
   linked yet — offer the **link** skill.

## Work — the plan command is the backbone

The reconciling edits are **computed, not reasoned**. Run:

```sh
node ${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs plan <root>
```

It prints, in execution order, the exact `backlog task edit` commands that reconcile every
linked task — status moves (including honest *backwards* moves after a regenerated
`tasks.md`, and `Done-eligible → -s Done` with a derived final summary, the ONLY path that
moves a linked task to Done), `Spec phase:` AC add/remove/check/uncheck at correct post-edit
indexes, and one change-only progress note per touched task. An already-reconciled board
prints nothing. `plan` never executes anything; running the commands is this skill's job.

1. **Scope** — if the user scoped sync to one task/spec, keep only that task's lines
   (commands are grouped per task, in queue order).
2. **Sanity-check the lines** — every line must be `backlog task edit <linked-task-id> …` and
   must never name an AC that doesn't start with `Spec phase:` (those are human-authored; the
   planner is built to leave them alone — a line that touches one is a bug, stop and report).
3. **Execute verbatim, in order** — the order is load-bearing (removals are emitted
   highest-index-first; check/uncheck indexes assume the removals and additions already ran).
   Do not reorder, dedupe, or "improve" the commands.
4. **Skipped tasks** — `plan` reports tasks with a status outside To Do/In Progress/Done on
   stderr (`# <id>: … not planned`). Don't guess — surface them to the user unchanged.
5. **Strict mode** (`.spec-bridge.json` has `"strictDone": true`): the derivation demands
   `analysis.md` in the spec dir with no unresolved CRITICAL findings before Done. If `state`
   output shows `analysis.required` blocking Done, tell the user to run `/speckit.analyze`
   and **save its report as `<specDir>/analysis.md`** — the gate reads artifacts, not chat
   output. Resolving a CRITICAL means fixing it in the spec workflow and re-saving the
   report, never editing the board.

## Output gate

1. `node ${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs plan <root>` again — must print **nothing** for
   the tasks you synced (the plan is idempotent; leftover lines mean a command failed).
2. `node ${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs check <root>` — exit 0, and no `warn:` line may
   name a task you just synced.
3. One-way contract held: `git status` must show no modifications under any spec dir from
   this sync (changes under `backlog/` are the CLI's doing and expected).

## Handing off

Report per task: old → new status and the progress line (both are visible in the executed
commands). Remind the user that the Stop-hook gate keeps enforcing this bridge between
syncs, and that a task the derivation moved to Done stays Done only as long as the spec
artifacts keep proving it.
