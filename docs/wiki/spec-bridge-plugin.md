---
name: spec-bridge-plugin
description: The spec-bridge plugin — Backlog.md as the derived kanban view over GitHub Spec Kit specs, with pure one-way derivation (lib/spec-derive.mjs), link/sync skills, a Stop-hook gate blocking status that exceeds spec artifacts, and an opt-in phase-level status vocabulary judged on the same derivation.
kind: component
sources:
  - spec-bridge/.claude-plugin/plugin.json
  - spec-bridge/README.md
  - spec-bridge/skills/link/SKILL.md
  - spec-bridge/skills/sync/SKILL.md
  - spec-bridge/gates/bridge.mjs
  - spec-bridge/gates/cli.mjs
  - spec-bridge/hooks/hooks.json
  - spec-bridge/scripts/gate.sh
  - spec-bridge/scripts/stop.mjs
  - lib/spec-derive.mjs
verified_against: 67bba3df054e747cdc8257df02f642fa6791cfce
---

# spec-bridge plugin

The `spec-bridge` plugin (lockstep with the marketplace version) makes the Backlog.md board a **derived kanban view over
GitHub Spec Kit specs** — composed the praxisflux way, through files and gates, forking neither
tool. One Backlog task per spec directory: the task's `Spec phase:` acceptance criteria
mirror `tasks.md`'s phases, its status follows the spec's artifacts, and a Stop-hook gate
enforces the house rule that status can't exceed proven artifacts.

## How it works

**One-way derivation.** The spec dir (`specs/NNN-feature/`) is the source of truth; the task
is a derived view. `lib/spec-derive.mjs` (on the chassis) is the *only* place the spec
lifecycle is interpreted, and it is a pure, stateless read — every call re-reads
`spec.md`/`plan.md`/`tasks.md` and re-derives, so a regenerated `tasks.md` is a non-event
(including honest status *regressions* when checkboxes get wiped). Rules: no `spec.md` →
`To Do`; `spec.md` present but not all proven → `In Progress`; `plan.md` present and ≥1 task
in `tasks.md` with all checked → `Done-eligible`. "Done-eligible" is deliberately not
"Done" — only the sync skill moves a task to Done, and only when the derivation says so.

**Linking.** A task is linked by a `Spec: <dir>` marker line in its description (dir
relative to the project root, the one holding `backlog/`). The **link** skill plants the
marker and seeds `Spec phase: <name>` ACs from `tasks.md` — always via the `backlog` CLI,
never by hand-editing task files; `gates/bridge.mjs` only reads them.

**Syncing.** The **sync** skill reconciles one way, and its edits are **computed, not
reasoned**: `cli.mjs plan <root>` prints, in execution order, the exact `backlog task edit`
commands that reconcile every linked task — status moves (backwards included; `Done-eligible`
plans `-s Done` with a derived final summary, the only path to Done), `Spec phase:` AC
removals highest-index-first, additions, check/uncheck at post-edit indexes, and one
change-only progress note (`Setup: 2/2 · Core: 4/7`) per touched task. Human-authored ACs
(no `Spec phase:` prefix) are structurally untouchable; verdict-unknown tasks are reported on
stderr, never guessed; a reconciled board plans nothing. The planner (`planLinkedTask` /
`planBridge` in `gates/bridge.mjs`, fed by `parseLinkedTask` which also reads the task's
AC:BEGIN/END block) stays read-only — plan prints, the skill executes and re-verifies.

**The gate.** `gates/bridge.mjs` finds project roots downwards (`findRootsDownwards` +
`hasChild("backlog")`), parses linked tasks, and compares each task's frontmatter status to
its derived status: **exceeds** (status claims more than the artifacts prove) blocks the
Stop; **lags** (artifacts ahead of status) warns to run sync, never blocks; **ok** is
silent — except the strict-mode near-miss: an honest task with every checkbox checked whose
ONLY shortfall from Done-eligible is the analysis requirement gets a lag-style warning
naming the missing `analysis.md` (and where to save it) or the unresolved CRITICAL findings
verbatim, so "Done is out of reach" is never a silent state; **unknown** (a status outside
To Do / In Progress / Done) neither blocks nor warns.
A linked task whose spec dir was deleted derives `To Do` and blocks anything above it.
`hooks/hooks.json` wires the Stop hook through the standard `gate.sh` shim (node resolved
via `command -v` with a login-shell fallback; when unavailable, a one-time stderr notice
then exit 0) into `scripts/stop.mjs`
on `runStopHook`; the gate is a no-op in projects with no `backlog/` dir or no linked tasks.

**Strict Done (opt-in).** Checked boxes are necessary but weak proof. With
`{ "strictDone": true }` in `.spec-bridge.json` at the project root, Done-eligible
additionally requires the `/speckit.analyze` report saved as `<specDir>/analysis.md` (a
durable artifact, not chat output) with no unresolved CRITICAL findings — the scan is
line-based, a `CRITICAL` line counting unless it says `resolved` or carries a checked box.
Missing or malformed config means checkbox-only mode.

**Phase-level status (opt-in).** The derivation always names a finer *stage* under the
3-status collapse — `specifying` → `planning` → `implementing` → `validating` (only
`tasks.md`'s final phase unchecked, needing ≥2 phases, or all boxes checked with strict-mode
analysis outstanding) → `reviewing` (identical to Done-eligible; `coarseStatus` is the fixed
collapse). A `statusVocabulary` map in `.spec-bridge.json` (stage → the board's own status
name; partial maps overlay the defaults; malformed or rename-free maps opt out) makes the
board speak that ladder: `stageVerdict` ranks the same four verdicts on stage spans (a name
covering several stages spans all of them; "Done" always covers the top stage, so
Done-eligibility is unchanged), and plan targets the mapped names — a *mapped* `reviewing`
(say "In Review") is planned instead of auto-Done, moving to Done staying a deliberate act
the gate accepts. Absent the config, every path is bit-for-bit the 3-status contract — this
is praxis P3 (artifact-gated seams, `docs/principles.md`) applied to the board as a
pipeline's observability surface.

## Connections

- The plugin's whole premise is the [[gates-convention]] applied to Spec Kit artifacts; the
  gate rides [[gate-runner]] and [[project-root]] from the [[chassis]], where its
  derivation layer `spec-derive.mjs` also lives.
- Skills follow [[skill-patterns]] (link and sync are phase-separated; gates read, the
  `backlog` CLI writes); packaged by [[build-and-release]].
- Covered by the [[test-suite]] (`test/spec-derive.test.mjs`, `test/spec-bridge.test.mjs`,
  `test/phase-status.test.mjs`).
- Unlike [[research-plugin]]/[[educate-plugin]] lifecycles, the state vocabulary here is
  Backlog.md's own (To Do / In Progress / Done by default; optionally the board's own
  phase-level names) judged against derived Spec Kit stages.

## Operational notes

- Read-only CLI backbone: `node ${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs state <specDir> |
  links <root> | check <root> | plan <root>`.
- Known tradeoff (from the README): Spec Kit works branch-per-feature, so a linked task file
  lives on the feature branch until merge — `main`'s board lags in-flight spec work; the
  board is authoritative per branch.
