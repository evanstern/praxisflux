# 023-reorient-target-root — run records belong to the target, not the invoking cwd

Board: TASK-64 · Direction: downstream bug-find sweep from promptworld (2026-07-27)
against praxis decaa14 (v0.27.0); carded 6c053c2; executed under
`docs/design/downstream-bugfix-runbook.md` (Lane E). Reproduced live.

## The failure

`reorient/scripts/run.mjs:34` sets `RUNS = runsDirFor(process.cwd())` at module load,
while `:126` resolves the `begin <root>` target separately. Live repro:
`cd /tmp/a && run.mjs begin /tmp/b` writes the manifest under
`/tmp/a/.handoff/reorient/runs/` and `/tmp/b` gets no registry — a session working in
`/tmp/b` never resolves the run in `reorientGate.resolveRoots`
(`gates/reorient.mjs:133-151`), so the "may not be left dangling" Stop gate never
fires, and `finish /tmp/b <run>` from `/tmp/b` finds nothing. The worktree-first
refusal (`run.mjs:133-137`) likewise inspects the INVOKING checkout, not the target —
`begin` from a worktree targeting the primary checkout is accepted, inverting TASK-56's
rule. `skills/reorient/SKILL.md:21` states records live at the project root,
contradicting the behavior.

## Requirements (map 1:1 to board ACs)

R1 (AC #1) — run manifests are written under the **resolved target root**, regardless
of invoking cwd (`REORIENT_HOME` override semantics unchanged). All subcommands that
locate runs (`begin`, `finish`, `abandon`, `list`, `takeover`, heartbeat) resolve the
registry from the same target root, not module-load cwd.

R2 (AC #2) — the dangling-run Stop gate fires for a session working in the target
project: a run begun from anywhere targeting root R is visible to
`reorientGate.resolveRoots` for sessions in R.

R3 (AC #3) — `finish <root> <run>` run from the target resolves the run; the
worktree-first refusal evaluates the TARGET checkout (begin from a worktree *targeting
a shared primary checkout* is refused without the recorded `--shared-checkout`
override; begin from anywhere targeting a worktree is accepted).

R4 (AC #4) — a cross-directory test: begin from dir A targeting root B → manifest
under B; gate sees it from B; finish from B passes; worktree-first refusal keyed to
B's checkout shape.

SKILL.md's "records live at the project root" claim becomes true; amend any wording
that described the old behavior. Versions per `docs/releasing.md`: reorient skill
`version:` bump + marketplace `sync-version` next free. Wiki: re-verify + re-pin
`docs/wiki/reorient-plugin.md` and `docs/wiki/reorient-run-ownership.md` (+ lockstep
stales); CAPSULES regen if descriptions change.

## Non-goals

- Ownership/heartbeat/takeover semantics (TASK-52/56 — shipped; unchanged here beyond
  where the registry lives).
- team-review's report-path defect (TASK-61 / spec 021 — separate lane, same *class*).
