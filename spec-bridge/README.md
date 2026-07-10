# spec-bridge

Backlog.md as the kanban view over [GitHub Spec Kit](https://github.com/github/spec-kit)
specs — composed the praxis way, through files + gates, with no fork of either tool.

One Backlog task per spec directory. The task's `Spec phase:` acceptance criteria mirror
`tasks.md`'s phases, its status follows the spec's artifacts, and a Stop-hook gate enforces
the house rule: **status can't exceed proven artifacts.**

## The contract: one-way derivation

The spec dir (`specs/NNN-feature/`) is the **source of truth**; the Backlog task is a
**derived view**. Nothing the bridge does ever writes into a spec dir, and nothing you do on
the board changes a spec. Derivation (`lib/spec-derive.mjs`) is stateless — every check
re-reads and re-derives, so `/speckit.tasks` regenerating `tasks.md` simply re-derives
(including honest status *regressions* when checkboxes get wiped).

| spec artifacts | derived status |
|---|---|
| no `spec.md` | To Do |
| `spec.md` present, not all proven | In Progress |
| `plan.md` + ≥1 task in `tasks.md`, all checked | Done-eligible |

"Done-eligible" is deliberately not "Done": only the **sync** skill moves a linked task to
Done, and only when the derivation says so.

## Parts

- **link** (skill) — attach exactly one Backlog task to a spec dir: plants the `Spec: <dir>`
  marker line in the task description (via the `backlog` CLI — task files are never
  hand-edited) and seeds `Spec phase: <name>` ACs from `tasks.md`.
- **sync** (skill) — one-way reconcile: status strictly follows the derivation (backwards
  moves included), phase ACs are re-mirrored wholesale (human-authored ACs untouched), and a
  progress note (`Setup: 2/2 · Core: 4/7`) is appended when anything changed.
- **gate** (Stop hook) — `gates/bridge.mjs` on the shared gate-runner: a linked task whose
  status *exceeds* its derived status blocks the stop; one that *lags* only warns (run sync).
  No-op in projects without a `backlog/` dir or without linked tasks.
- **cli** — the skills' deterministic backbone (read-only):
  `node gates/cli.mjs state <specDir> | links <root> | check <root>`.

## Known tradeoff

Spec Kit works branch-per-feature, so the linked task file lives on the feature branch until
merge — `main`'s board lags in-flight spec work. Accepted for now; the board is authoritative
per branch.
