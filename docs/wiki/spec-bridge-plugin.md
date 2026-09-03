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
verified_against: d86d6c8bef763bf13bed23f2f33debba0536baad
---

# spec-bridge plugin

The `spec-bridge` plugin (lockstep with the marketplace version) makes the Backlog.md board a **derived kanban view over
GitHub Spec Kit specs** — composed through files and gates, forking neither tool. One
Backlog task per spec directory: the task's `Spec phase:` acceptance criteria
mirror `tasks.md`'s phases, its status follows the spec's artifacts, and a Stop-hook gate
enforces the house rule that status can't exceed proven artifacts.

## How it works

**One-way derivation.** The spec dir (`specs/NNN-feature/`) is the source of truth; the task
is a derived view. `lib/spec-derive.mjs` (on the chassis) is the *only* place the spec
lifecycle is interpreted, a pure, stateless read — every call re-reads
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
reasoned**: `cli.mjs plan <root>` computes, in execution order, the same reconciliation for
every linked task — status moves (backwards included; `Done-eligible` plans `-s Done` with
a derived final summary, the only path to Done), `Spec phase:` AC removals highest-index-first,
additions, check/uncheck at post-edit indexes, and one change-only progress note
(`Setup: 2/2 · Core: 4/7`) per touched task, rendered as exact `backlog task edit` command
strings for the `backlog` provider (other providers get the same reconciliation as
structured intents plus a notice, since command rendering is provider-specific — spec 053
R5, spec 055 owns that verb table). Human-authored ACs (no `Spec phase:` prefix) are
structurally untouchable; verdict-unknown tasks are reported on stderr, never guessed; a
reconciled board plans nothing. The planner (`planLinkedTask` / `planBridge` in
`gates/bridge.mjs`, fed by `parseLinkedTask` — now in `lib/board-mirror.mjs`, re-exported
here — which also reads the task's AC:BEGIN/END block) stays read-only — plan computes, the
skill executes and re-verifies.

**The gate.** `gates/bridge.mjs` finds project roots downwards (`findRootsDownwards` +
`hasAnyChild(".board", "backlog")`), reads tasks via `boardLinks(root)` — **mirror first**:
`.board/links.json` when present (fail-closed if malformed), else a live `backlog/tasks/`
projection, else `[]` — and compares each task's status to its derived
status: **exceeds** (status claims more than the artifacts prove) blocks the Stop; **lags**
(artifacts ahead of status) warns to run sync, never blocks; **ok** is silent — except the
strict-mode near-miss: an honest task with every checkbox checked whose ONLY shortfall from
Done-eligible is the analysis requirement gets a lag-style warning naming the missing
`analysis.md` (and where to save it) or the unresolved CRITICAL findings verbatim, so "Done
is out of reach" is never a silent state; **unknown** (a status outside To Do / In Progress
/ Done) neither blocks nor warns.
A linked task whose spec dir is gone from the tree **and** every searched ref derives `To Do`
and blocks anything above it. **Branch-held specs still derive** (spec 058): `spec-source.mjs`
reads a dir the tree lacks out of `HEAD` or a pushed `refs/remotes/origin/task-*` (read-only
`git show`, memoized), so the claim protocol's unmerged window is not a false **exceeds**.
Tree wins when present; `source` names the origin (`worktree`/`ref`/`none`). A stale or
missing mirror under a declared `requiresSync` provider (Jira) is itself a blocking
**R3/R4** finding, independent of any task — `backlog` never needs this (self-heals).
`hooks/hooks.json` wires the Stop hook through the standard `gate.sh` shim (node missing →
one-time stderr notice, then exit 0) into `scripts/stop.mjs` on `runStopHook`; the gate is a
no-op with no board root or no linked tasks.

**Strict Done (opt-in).** Checked boxes are necessary but weak proof. With
`{ "strictDone": true }` in `.spec-bridge.json` at the project root, Done-eligible
additionally requires the `/speckit.analyze` report saved as `<specDir>/analysis.md` with no
unresolved CRITICAL findings — the scan is
line-based, a `CRITICAL` line counting unless it says `resolved` or carries a checked box.
Missing/malformed config means checkbox-only mode.

**Phase-level status (opt-in).** The derivation always names a finer *stage* under the
3-status collapse — `specifying` → `planning` → `implementing` → `validating` (only
`tasks.md`'s final phase unchecked, needing ≥2 phases, or all boxes checked with strict-mode
analysis outstanding) → `reviewing` (identical to Done-eligible; `coarseStatus` is the fixed
collapse). A `statusVocabulary` map in `.spec-bridge.json` (stage → the board's own status
name; partial maps overlay the defaults; malformed or rename-free maps opt out) makes the
board speak that ladder: `stageVerdict` ranks the same four verdicts on stage spans (a name
covering several stages spans all of them), and plan targets the mapped names — a *mapped*
`reviewing` plans instead of auto-Done, keeping the move to Done deliberate. Absent the
config, every path is bit-for-bit the 3-status contract — praxis P3 applied to the board as
observability.

**Project gates (opt-in, spec 050).** A ticked `tasks.md` checkbox IS status here — the
derivation reads Done-eligibility from those boxes — so a box may not claim a greenness the
project's gates would deny (field case: a spec ticked fully green while freshness sat red).
A `projectGates` map (`.spec-bridge.json`) makes the rule
*data*, two buckets: `required` gates must be green before Done-eligible; `redByConstruction`
(freshness, between a source edit and its re-pin) MAY be red mid-PR (allowed silently), enforced
again at Done-eligible once the re-pin box is ticked. Each `command` runs as an **argv
array** via `spawnSync` `shell:false`; ENOENT/timeout fails closed, never green.
`projectGatesProfile` mirrors `vocabularyProfile` — absent/malformed ⇒ `null` ⇒ every message
byte-identical. `evaluateProjectGates` feeds two entry points: the **Stop hook**
(`checkBridge`, Done-eligible, both buckets) and the CLI **`verify`** (`verifyBridge`,
mid-PR, `required` only). Gates are project-wide, so each command runs **once per
invocation**, shared across specs — findings stay per spec (else the set reran per spec,
costly at scale). `SPEC_BRIDGE_GATE_ACTIVE` short-circuits the **default** runner so a gate
command re-invoking the bridge can't recurse; an injected `run` bypasses it — the check
dogfoods itself.

## Connections

- The plugin's whole premise is the [[gates-convention]] applied to Spec Kit artifacts; the
  gate rides [[gate-runner]] and [[project-root]] from the [[chassis]], where its
  derivation layer `spec-derive.mjs` also lives.
- Skills follow [[skill-patterns]] (phase-separated; gates read, `backlog` CLI writes);
  packaged by [[build-and-release]].
- Covered by the [[test-suite]] (`test/spec-derive.test.mjs`, `test/spec-bridge.test.mjs`,
  `test/phase-status.test.mjs`, `test/spec-source.test.mjs`, `test/branch-held-specs.test.mjs`).
- Unlike [[research-plugin]]/[[educate-plugin]] lifecycles, the state vocabulary here is
  Backlog.md's own (To Do / In Progress / Done by default; optionally the board's own
  phase-level names) judged against derived Spec Kit stages.

## Operational notes

- Read-only CLI backbone: `node ${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs state <specDir> |
  links <root> | check <root> | verify <root> | plan <root>`. `verify` checks declared
  `projectGates` against ticked boxes, exiting nonzero on any red/unrunnable gate.
- Known tradeoff: Spec Kit works branch-per-feature, so a linked task file lives on the
  feature branch until merge — `main`'s board lags in-flight work; the board is
  authoritative per branch.
