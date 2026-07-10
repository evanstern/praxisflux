---
name: sync
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
   linked yet — offer the **link** skill. Otherwise the array (each entry carries the task id,
   its current status, the derived state, and a verdict) is your work queue. The user may scope
   sync to one task/spec; then filter the queue to it.

## Work — per linked task, in queue order

Skip entries whose verdict is `ok` and whose phase ACs already mirror the derived phases
(nothing to do); process the rest. All writes via `backlog task edit` — never touch the files.

1. **Status** — set it to exactly what the derivation proves:
   - derived `To Do` → `-s "To Do"`; derived `In Progress` → `-s "In Progress"`. Yes, this can
     move a task *backwards* (e.g. after `/speckit.tasks` regenerated `tasks.md` and wiped
     checkboxes) — an honest regression is the point of the bridge.
   - derived `Done-eligible` → `-s Done`. This is the ONLY path that moves a linked task to
     Done. Also write a final summary from the derived state, e.g.
     `--final-summary "All spec tasks complete (<progressNote>). Derived Done by spec-bridge sync."`
   - Verdict `unknown` (custom status outside To Do/In Progress/Done): don't guess — report it
     to the user and leave the status alone.
2. **Re-mirror phase ACs** — the ACs spelled `Spec phase: <name>` belong to the bridge; sync
   owns them wholesale. Read the current list with `backlog task view <id> --plain`, then
   reconcile against the derived `phases`:
   - a derived phase with no matching AC → add it (`--ac "Spec phase: <name>"`);
   - a `Spec phase:` AC whose phase no longer exists in the derivation → remove it
     (`--remove-ac <index>`; indexes shift after removal — remove highest-index first);
   - check each phase AC whose phase is fully done (`done === total`), uncheck any checked one
     that no longer is (`--check-ac` / `--uncheck-ac`).
   Never add, remove, check, or uncheck an AC that doesn't start with `Spec phase:` — those are
   human-authored.
3. **Progress note** — if (and only if) this task's status or any AC changed, append one line:
   `--append-notes "spec-bridge sync: <progressNote>[ — status <old> → <new>]"`. An unchanged
   task gets no note (no churn in the task history).

## Output gate

Run `node ${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs check <root>`: exit 0, and the tasks you synced
must no longer appear in its `warn:` lines (a lag you just synced away shouldn't still warn).
If a problem or leftover lag names a task you touched, fix it before declaring the sync done.

Confirm the one-way contract held: `git status` inside the project must show no modifications
under any spec dir from this sync (Backlog files under `backlog/` will have changed — that's
the CLI's doing and expected).

## Handing off

Report per task: old → new status and the progress line. Remind the user that the Stop-hook
gate keeps enforcing this bridge between syncs, and that a task the derivation moved to Done
stays Done only as long as the spec artifacts keep proving it.
