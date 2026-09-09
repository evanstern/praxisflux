---
name: link
version: 0.2.0
description: Attach a Backlog.md task to a GitHub Spec Kit spec directory so the spec drives the task across the kanban. Use when the user wants a spec on the board, says "link specs/NNN-feature to backlog", "track this spec in Backlog", or "put this feature on the board". Creates or updates the task with a machine-findable Spec marker and seeds phase acceptance criteria from tasks.md.
---

# link — put a Spec Kit spec on the Backlog board

Creates (or attaches to) exactly one Backlog task per spec directory and plants the marker
the sync skill and the Stop-hook gate key on. After linking, the spec's artifacts — not
anyone's opinion — drive the task across the board.

**The contract you are joining:** the spec dir is the source of truth; the Backlog task is a
derived view. Never set a linked task's status by hand beyond what
`node ${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs state <specDir>` reports — the Stop gate blocks
statuses the artifacts don't prove.

## Precondition gate

1. Find the project root: the directory containing `backlog/`. The spec dir the user names
   (e.g. `specs/001-payment-flow/`) must exist under it. If the user didn't name one, list
   `specs/*/` and ask which to link; if `specs/` doesn't exist, STOP — this project has no
   Spec Kit layout (offer `specify init`).
2. The provider's tooling must be reachable (`docs/board-verbs.md`'s common preconditions —
   `backlog --help` succeeding, or `.board.json` naming a configured provider). If not, STOP
   and say so.
3. Run `node ${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs links <root>` — if a task already links this
   spec dir, you are in **update mode**: reuse that task; never create a second one.

## Work

All Backlog writes go through the `backlog` CLI. Never edit files under `backlog/` directly.

1. **Create mode** — no task links this spec dir yet:
   - Derive the feature title from the spec dir name or `spec.md`'s heading.
   - `board:list` (search form — see `docs/board-verbs.md`) first: an existing unlinked task
     that clearly IS this feature gets updated instead of duplicated (confirm with the user
     if ambiguous).
   - Create the item with the marker as the last line of the description (`board:create` +
     `board:link-spec` — see `docs/board-verbs.md`; the marker line is exactly `Spec: ` + the
     spec dir path relative to the project root).
2. **Update mode** — task exists (found via `links` or search): read its description
   (`board:view`); if the marker line is missing, re-set the description (`board:link-spec`)
   preserving the existing text and appending the marker line.
3. **Seed phase ACs** (`board:ac-set`) from `node ${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs state <specDir>`: for each
   phase, add an acceptance criterion spelled exactly `Spec phase: <name>`. Add only the ones not already present — phase ACs belong to the
   bridge (sync re-mirrors them); leave any human-authored ACs untouched. If the spec has no
   `tasks.md` yet, skip — sync will seed them when phases appear.
4. **Set the honest starting status** from the same `state` output: derived `To Do` → `To Do`;
   anything further → `In Progress`. Do NOT set `Done` here even if the derivation says
   Done-eligible — moving to Done is the sync skill's job.

## Output gate

Run `node ${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs check <root>`: it must exit 0 and list the new
link. Then read the item (`board:view`) and confirm the marker line and phase ACs are
present. Fix anything missing before declaring the link done.

## Handing off

Tell the user: the spec is on the board; run the **sync** skill after working the spec (or any
time the board looks stale) to move the task, check phase ACs, and record progress. The
Stop-hook gate will refuse to let a linked task's status exceed what the spec artifacts prove.
