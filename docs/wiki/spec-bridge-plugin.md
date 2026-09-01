---
name: spec-bridge-plugin
description: The spec-bridge plugin — Backlog.md as the derived kanban view over GitHub Spec Kit specs, with pure one-way derivation (lib/spec-derive.mjs) reading through a working-tree-or-git-ref resolver (lib/spec-source.mjs) so branch-held specs still derive, link/sync skills, a Stop-hook gate blocking status that exceeds spec artifacts, an opt-in phase-level status vocabulary, and an opt-in project-gate check (a ticked tasks.md box cannot outrun a red declared gate) — all judged on the same derivation.
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
  - lib/spec-source.mjs
  - lib/board-mirror.mjs
size_budget_exempt: at 7998/8000 on main with 2 chars of headroom; spec 058 (TASK-104) adds the
  working-tree/git-ref resolver, which is load-bearing for every verdict this note describes and
  cannot be omitted. The splittable unit would be ~500 chars — under the ~1,500-char
  minimum-content counter-rule in docs/corpus-spec.md, so a split would butcher the note rather
  than summarize it. Trims were attempted first and recovered only ~30 chars each. TASK-103/95
  already own this note family's owed summary-style split; fold this into it and remove.
verified_against: 5206515c5f118a291cfddcf01870a219ee28c3d9
---

# spec-bridge plugin

The `spec-bridge` plugin makes the Backlog.md board a **derived kanban view over
GitHub Spec Kit specs** — composed the praxisflux way, through files and gates, forking neither
tool. One Backlog task per spec directory: the task's `Spec phase:` acceptance criteria
mirror `tasks.md`'s phases, its status follows the spec's artifacts, and a Stop-hook gate
enforces the house rule that status can't exceed proven artifacts.

## How it works

**One-way derivation.** The spec dir (`specs/NNN-feature/`) is the source of truth; the task
is a derived view. `lib/spec-derive.mjs` (on the chassis) is the *only* place the spec
lifecycle is interpreted, and it is a pure, stateless read — every call re-reads
`spec.md`/`plan.md`/`tasks.md` (via `lib/spec-source.mjs`) and re-derives, so a regenerated
`tasks.md` is a non-event
(including honest status *regressions* when checkboxes get wiped). Rules: no `spec.md` →
`To Do`; `spec.md` present but not all proven → `In Progress`; `plan.md` present and ≥1 task
in `tasks.md` with all checked → `Done-eligible`. "Done-eligible" is deliberately not
"Done" — only the sync skill moves a task to Done, and only when the derivation says so.

**Linking.** A task is linked by a `Spec: <dir>` marker line in its description (dir
relative to the project root, the one holding `backlog/`). The **link** skill plants the
marker and seeds `Spec phase: <name>` ACs from `tasks.md` — always via the `backlog` CLI,
never by hand-editing task files; `gates/bridge.mjs` only reads them.

**Syncing.** The **sync** skill reconciles one way, and its edits are **computed, not
reasoned**, in two halves (spec 053): `planIntents` decides — status move (backwards
included; `Done-eligible` → `Done` with a derived final summary, the only path to Done),
`Spec phase:` AC removals highest-index-first, additions, check/uncheck at post-edit indexes,
one change-only progress note (`Setup: 2/2 · Core: 4/7`) — and `renderBacklog` renders those
intents as the exact `backlog task edit` commands `cli.mjs plan <root>` prints, in order.
`planLinkedTask` is now a thin compatibility wrapper over both. Human-authored ACs (no
`Spec phase:` prefix) are structurally untouchable; verdict-unknown tasks are reported on
stderr, never guessed; a reconciled board plans nothing. `planBridge` renders those command
strings only for the `backlog` provider; any other resolved provider gets the same
reconciliation back as structured intents plus a notice — no guessed verb table (spec 055
owns that). The planner stays read-only — plan prints, the skill executes and re-verifies.

**The gate.** `gates/bridge.mjs` finds project roots downwards (`findRootsDownwards` +
`hasAnyChild(".board", "backlog")` — a mirror or a Backlog dir either mark a project;
`cli.mjs` resolves in lockstep, spec 053 R2) and reads the board through `boardLinks`: a
`.board/links.json` mirror when present, else a live `backlog/tasks/*.md` projection, else
none (mirror-first, so an adopted mirror is exercised, not bypassed). Two fail-closed
findings guard the mirror itself: a stale mirror on a `requiresSync` provider (e.g. Jira)
blocks, naming the reason and the `board:sync` remedy; a `requiresSync` provider declared
(`.board.json`) with no mirror blocks as no-evidence — "cannot see the board" never
renders as "the board is fine". Backlog (`requiresSync: false`) prefers live re-derivation
over either complaint. Per task, compares frontmatter status to derived status: **exceeds** (status
claims more than the artifacts prove) blocks the Stop; **lags** (artifacts ahead of status)
warns to run sync, never blocks; **ok** is silent — except the strict-mode near-miss: an
honest task with every checkbox checked whose ONLY shortfall from Done-eligible is the
analysis requirement gets a lag-style warning naming the missing `analysis.md` (and where to
save it) or the unresolved CRITICAL findings verbatim, so "Done is out of reach" is never a
silent state; **unknown** (a status outside To Do / In Progress / Done) neither blocks nor
warns.
A linked task whose spec dir is gone from the tree **and** every searched ref derives `To Do`
and blocks anything above it. **Branch-held specs still derive** (spec 058): `spec-source.mjs`
reads a dir the tree lacks out of `HEAD` or a pushed `refs/remotes/origin/task-*` (read-only
`git show`, memoized), so the claim protocol's unmerged window is not a false **exceeds**.
Tree wins when present; `source` names the origin (`worktree`/`ref`/`none`).
`hooks/hooks.json` wires the Stop hook through the standard `gate.sh` shim (node resolved
via `command -v` with a login-shell fallback; when unavailable, a one-time stderr notice
then exit 0) into `scripts/stop.mjs`
on `runStopHook`; the gate is a no-op with neither sentinel, or with no linked tasks.

**Strict Done (opt-in).** Checked boxes are necessary but weak proof. With
`{ "strictDone": true }` in `.spec-bridge.json` at the project root, Done-eligible
additionally requires the `/speckit.analyze` report saved as `<specDir>/analysis.md` (a
durable artifact, not chat output) with no unresolved CRITICAL findings — the scan is
line-based, a `CRITICAL` line counting unless it says `resolved` or carries a checked box.
Missing or malformed config means checkbox-only mode.

**Phase-level status (opt-in).** The derivation always names a finer *stage* under the
3-status collapse — `specifying` → `planning` → `implementing` → `validating` → `reviewing`
(identical to Done-eligible; `coarseStatus` is the fixed collapse). A `statusVocabulary` map
in `.spec-bridge.json` (stage → the board's own status name; partial maps overlay the
defaults; malformed or rename-free maps opt out) makes the board speak that ladder:
`stageVerdict` ranks the same four verdicts on stage spans (a name covering several stages
spans all of them; "Done" always covers the top stage), and plan targets the mapped names —
a *mapped* `reviewing` (say "In Review") is planned instead of auto-Done. Absent the config,
every path is bit-for-bit the 3-status contract.

**Project gates (opt-in, spec 050).** A ticked `tasks.md` checkbox IS status here, so it may
not claim a greenness the project's own gates deny (spec 048's field case: a ticked box
outran a red freshness gate). A `projectGates` map (`.spec-bridge.json`) makes the rule
*data*: `required` gates must be green before Done-eligible; `redByConstruction` (freshness,
mid-re-pin) MAY be red mid-PR, but not once Done-eligible. Each `command` is an **argv array**
via `spawnSync` `shell:false` (no injection surface); ENOENT/timeout is *failed, never green*.
`projectGatesProfile` mirrors `vocabularyProfile` — absent/malformed ⇒ `null` ⇒ every message
byte-identical. `evaluateProjectGates` feeds both entry points — the Stop hook
(`checkBridge`, both buckets) and the CLI `verify` (`verifyBridge`, `required` only) — sharing
one memoized run per distinct command across every spec checked (else the set re-ran per
Done-eligible spec). `SPEC_BRIDGE_GATE_ACTIVE` stops a gate command that re-invokes the bridge
from recursing; an injected `run` (tests) bypasses it.

## Connections

- The plugin's whole premise is the [[gates-convention]] applied to Spec Kit artifacts; the
  gate rides [[gate-runner]] and [[project-root]] from the [[chassis]], where its
  derivation layer `spec-derive.mjs` also lives.
- Skills follow [[skill-patterns]] (link and sync are phase-separated; gates read, the
  `backlog` CLI writes); packaged by [[build-and-release]].
- Covered by the [[test-suite]] (`test/spec-derive.test.mjs`, `test/spec-bridge.test.mjs`,
  `test/phase-status.test.mjs`, `test/spec-source.test.mjs`, `test/branch-held-specs.test.mjs`).
- Unlike [[research-plugin]]/[[educate-plugin]] lifecycles, the state vocabulary here is
  Backlog.md's own (To Do / In Progress / Done by default; optionally the board's own
  phase-level names) judged against derived Spec Kit stages.

## Operational notes

- Read-only CLI backbone: `node ${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs state <specDir> |
  links <root> | check <root> | verify <root> | plan <root>`. `verify` runs the declared
  `projectGates` against every ticked box, exiting nonzero on a tick standing over a
  red/unrunnable gate.
- Known tradeoff (from the README): Spec Kit works branch-per-feature, so a linked task file
  lives on the feature branch until merge — `main`'s board lags in-flight spec work; the
  board is authoritative per branch.
