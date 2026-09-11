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
size_budget_exempt: over cap and growing — 7998/8000 at spec 058 (TASK-104, the
  working-tree/git-ref resolver), then spec 061's project-gate content, now spec 066's opt-in
  dispatch-record check; each is load-bearing for a verdict this note describes and cannot be
  omitted. Every increment has been written at minimum length and trims recover only ~30 chars
  each, so the note is past what trimming can fix: it needs the real summary-style split
  TASK-103/95 already own for this note family (the opt-in checks — strictDone, statusVocabulary,
  projectGates, requireDispatchRecord — are the natural child, ~2,500 chars of substance, well
  over the ~1,500-char minimum-content counter-rule). Fold this note into that split and remove
  the exemption; do not treat the exemption as a licence to keep appending.
verified_against: ab9e2a0fd7c690f538f235134167cc0c6f7f580b
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
reasoned**: `cli.mjs plan <root>` prints, in execution order, the exact `backlog task edit`
commands that reconcile every linked task — status moves (backwards included; `Done-eligible`
plans `-s Done` with a derived final summary, the only path to Done), `Spec phase:` AC
removals highest-index-first, additions, check/uncheck at post-edit indexes, and one
change-only progress note (`Setup: 2/2 · Core: 4/7`) per touched task. Human-authored ACs
(no `Spec phase:` prefix) are structurally untouchable; verdict-unknown tasks go to stderr,
never guessed; a reconciled board plans nothing. The planner (`planLinkedTask` / `planBridge`
in `gates/bridge.mjs`, fed by `parseLinkedTask` — now in `lib/board-mirror.mjs`, re-exported
here — which also reads the task's AC:BEGIN/END block) stays read-only: plan prints, the skill
executes and re-verifies.

**The gate.** `gates/bridge.mjs` finds project roots downwards (`findRootsDownwards` +
`hasChild("backlog")`), parses linked tasks, and compares each task's frontmatter status to
its derived status: **exceeds** (status claims more than the artifacts prove) blocks the
Stop; **lags** (artifacts ahead of status) warns to run sync, never blocks; **ok** is
silent — except the strict-mode near-miss: an honest task with every checkbox checked whose
ONLY shortfall from Done-eligible is the analysis requirement gets a lag-style warning
naming the missing `analysis.md` (and where to save it) or the unresolved CRITICAL findings
verbatim, so "Done is out of reach" is never a silent state; **unknown** (a status outside
To Do / In Progress / Done) neither blocks nor warns.
A linked task whose spec dir is gone from the tree **and** every searched ref derives `To Do`
and blocks anything above it. **Branch-held specs still derive** (spec 058): `spec-source.mjs`
reads a dir the tree lacks out of `HEAD` or a pushed `refs/remotes/origin/task-*` (read-only
`git show`, memoized), so the claim protocol's unmerged window is not a false **exceeds**.
Tree wins when present; `source` names the origin (`worktree`/`ref`/`none`).
`hooks/hooks.json` wires the Stop hook through the standard `gate.sh` shim (node resolved
via `command -v` with a login-shell fallback; when unavailable, a one-time stderr notice
then exit 0) into `scripts/stop.mjs`
on `runStopHook`; the gate is a no-op in projects with no `backlog/` dir or no linked tasks.

**Strict Done (opt-in).** Checked boxes are weak proof. With `{ "strictDone": true }` in
`.spec-bridge.json`, Done-eligible also requires the `/speckit.analyze` report saved as
`<specDir>/analysis.md` (a durable artifact, not chat output) with no unresolved CRITICAL
findings — the scan is line-based, a `CRITICAL` line counting unless it says `resolved` or
carries a checked box. Missing or malformed config means checkbox-only mode.

**Phase-level status (opt-in).** The derivation always names a finer *stage* under the
3-status collapse — `specifying` → `planning` → `implementing` → `validating` (only the final
phase unchecked, needing ≥2 phases, or all boxes checked with strict-mode analysis
outstanding) → `reviewing` (identical to Done-eligible; `coarseStatus` is the fixed collapse).
A `statusVocabulary` map (stage → the board's status name; partial maps overlay defaults;
malformed or rename-free maps opt out) makes the board speak that ladder: `stageVerdict` ranks
the same four verdicts on stage spans (a name covering several stages spans all; "Done" always
covers the top, so Done-eligibility is unchanged), and plan targets the mapped names — a
*mapped* `reviewing` is planned instead of auto-Done, keeping the move to Done deliberate.
Absent the config every path is bit-for-bit the 3-status contract — praxis P3 applied to the
board as a pipeline's observability surface.

**Project gates (opt-in, spec 050/061).** A ticked checkbox IS status here, so a box may not
claim a greenness the project's gates would deny (field case: a ticked green claim over a red
freshness gate). A `projectGates` map makes the rule *data*, two buckets: `required` green
before Done-eligible; `redByConstruction` (freshness) MAY be red mid-PR, enforced once the
re-pin box is ticked. Each `command` is an **argv array** via `spawnSync`
`shell:false`; ENOENT/timeout is *failed, never green* (fail-closed). `projectGatesProfile`
mirrors `vocabularyProfile` — absent/malformed ⇒ `null` ⇒ byte-identical. `collapsedGateProblems`
feeds both entry points — **Stop hook** (`checkBridge`) at Done-eligible, both buckets; CLI
**`verify`** (`verifyBridge`), mid-PR, `required` only, both now `{ problems, warnings }` —
running each command **once per invocation** and emitting exactly **ONE** finding per non-green
gate (gate + bucket + reason + affected count), never one per spec. A dirty tree
(`isTreeDirty`, fail-closed to clean) routes it to `warnings`, non-blocking (this note's F6,
inverted). `evaluateProjectGates` stays exported as the pure per-spec evaluator.
`SPEC_BRIDGE_GATE_ACTIVE` short-circuits the **default** runner so a gate command re-invoking
the bridge can't recurse; an injected `run` bypasses it, so the check dogfoods itself.

**The board provider seam (052-056).** The board isn't assumed to be Backlog.md: a
`providers` registry in `lib/board-mirror.mjs` keys on `requiresSync`, `.board/links.json` is
the gate's read surface for every provider, and Jira's MCP-backed projection lives in a skill
so `lib/` stays network-free. See [[board-provider-seam]].

**The dispatch record (opt-in, spec 066).** `checkBridge` also judges whether a card proves
its implementation was *dispatched* rather than done inline — an axis independent of status
honesty. The marker (`Dispatch: tier=… pinned=… served=…`) is [[pdlc-grounding-block]]
doctrine; the check lives here because the record rides a card this gate already walks via
`parseLinkedTask` — no new gate or surface. `servedModel` accepts only a **bare ID**:
whitespace or a placeholder (`TBD`, `pending`, …) names no served model, since filling that
field from the transcript is the step enforced. Scope narrows twice — the host must set
`"requireDispatchRecord": true` (absent, it does not run and every verdict is bit-identical),
and only **not-yet-Done** cards qualify, so no historical card is flagged *by construction*.
Stated hole: a card reaching Done without a record leaves scope for good.

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
