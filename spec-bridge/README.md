# spec-bridge

Backlog.md as the kanban view over [GitHub Spec Kit](https://github.com/github/spec-kit)
specs — composed the praxisflux way, through files + gates, with no fork of either tool.

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

### Strict Done (opt-in)

Checked boxes are necessary but weak proof. With `{ "strictDone": true }` in a
`.spec-bridge.json` at the project root, Done-eligible additionally requires the
`/speckit.analyze` report saved as **`<specDir>/analysis.md`** — an artifact the gate can
read, not chat output — with no unresolved CRITICAL findings (line-based: a line containing
`CRITICAL` counts unless that line says `resolved` or carries a checked box). Without the
config, checkbox-only mode is unchanged.

### Phase-level status (opt-in)

The 3-status vocabulary collapses everything between "spec started" and "all proven" into
one In Progress — fine for small boards, blind for a board that is a pipeline's
observability surface. Underneath it, the derivation always names a finer **stage**, still
derived only from the spec artifacts:

| stage | proven by |
|---|---|
| `specifying` | nothing yet (no `spec.md`) |
| `planning` | `spec.md` present, no `plan.md` |
| `implementing` | `plan.md` present; unchecked work outside `tasks.md`'s final phase |
| `validating` | only the final phase still unchecked (≥2 phases), or all boxes checked with strict-mode analysis outstanding |
| `reviewing` | everything proven — identical to Done-eligible |

A board MAY opt into speaking that ladder by mapping stages to its own status names in
`.spec-bridge.json`:

```json
{
  "statusVocabulary": {
    "planning": "Planning",
    "validating": "Validating",
    "reviewing": "In Review"
  }
}
```

Partial maps are fine — unmapped stages keep their defaults (`specifying` → To Do;
`planning`/`implementing`/`validating` → In Progress; `reviewing` → Done). Under the opt-in:

- **The gate enforces at phase granularity** — same verdicts, finer ruler. A status naming a
  later stage than the artifacts prove (say "Validating" while earlier phases have unchecked
  tasks) **blocks**, naming the task, the spec dir, and the shortfall; a lagging status
  warns to run sync; agreement is silent; a status outside the vocabulary is never guessed.
- **Sync speaks the board's names** — `plan` targets the mapped stage names. If `reviewing`
  is mapped (e.g. "In Review"), an all-checked spec is planned to that status and **moving
  to Done stays a deliberate act** (the gate accepts Done there — Done-eligibility is
  unchanged); left unmapped, `reviewing` plans `-s Done` with the derived final summary,
  exactly as without the config.
- **Backward compatibility is absolute**: no `statusVocabulary` (or a malformed/rename-free
  one) is bit-for-bit the 3-status behavior above.

This is [praxis P3 — artifact-gated seams](../docs/principles.md) applied to the board: the
finer statuses are still *derived from durable artifacts*, never asserted, so the board can
serve as a pipeline's observability surface without ever outrunning the evidence.

### Project gates (opt-in)

A ticked `tasks.md` checkbox **is** status here — the derivation reads Done-eligibility out of
exactly those boxes. So a box may not claim a greenness the project's own gates would deny. The
field case that carded this (2026-08-01, spec 048 phases 1-2): an implementer reported
`node --test — 254 pass, 0 fail` and ticked its "node --test green" box while four wiki notes were
staled and the freshness gate was red; nothing caught it until the next phase re-ran the suite and
saw the failure the tick had claimed away. Prose is not a gate, so this makes the rule **data the
check reads**. Declare the project's gates in `.spec-bridge.json`:

```json
{
  "projectGates": {
    "required":          [ { "name": "tests",     "command": ["node", "--test"] } ],
    "redByConstruction": [ { "name": "freshness", "command": ["node", "grounding-wiki/gates/cli.mjs", "freshness", ".", "docs/wiki"] } ]
  }
}
```

- **`command` is an argv array, never a shell string.** Declared commands run via `spawnSync`
  with `shell: false` and `cwd` = the project root — no interpolation, no injection surface. A
  string `command` is rejected as malformed (there is no safe general split), and a command that
  **cannot execute** (ENOENT) or **times out** is treated as *failed, never green* — the
  fail-closed contract, one level down from the gate runner.
- **`required`** — gates that must be green before a linked spec may be Done-eligible.
- **`redByConstruction`** — gates a mid-PR phase MAY leave red: the freshness gate is red *by
  construction* from the commit that touches a pinned source until the re-pin commit lands, and
  that is correct sequencing, not a regression. Declared, not inferred — "red until the re-pin" is
  not a property the checker can see, so the host states it. These are silently allowed mid-PR (a
  warning here would only train you to ignore the channel) and enforced again at Done-eligible,
  when the re-pin box is itself ticked.
- **When the commands run.** The Stop hook executes declared gates **only when a linked spec is
  Done-eligible** — the one bounded moment a red gate under a ticked box changes an outcome, so
  ordinary turns pay zero subprocess cost (`node --test` in this repo is ~5.7s, far too dear to
  run every turn). The blocking finding names **the phase, the box, and the failing gate**. The
  mid-PR case — a tick claiming greenness before the final phase — is served by the explicit
  `cli.mjs verify <root>` verb (which holds mid-PR specs to `required` only), called by the sweep's
  per-phase loop and CI.
- **Advisory vs. blocking.** `CLAUDE.md` calls Stop hooks *advisory*, yet this check blocks; the
  two are reconciled, not in tension. "Advisory" names the hook's *optionality* — it may not be
  installed, and CI is what guarantees enforcement — not a promise it never blocks. `checkBridge`
  already blocks (an `exceeds` verdict exits 2); the project-gate check adopts that exact posture.
- **No-config parity is absolute**: with no `projectGates` key (or a malformed one), every message
  and plan output is bit-for-bit the behavior above — the feature is wholly inert without the opt-in.
- **Host constraint:** don't declare a gate command whose purpose is to invoke the bridge itself. A
  `SPEC_BRIDGE_GATE_ACTIVE` env guard breaks the recursion structurally, but such a command is
  meaningless.

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
  `node gates/cli.mjs state <specDir> | links <root> | check <root> | verify <root> | plan <root>`.
  `verify` runs the declared `projectGates` against every ticked box (the mid-PR counterpart to the
  Done-eligible Stop-hook check), exiting nonzero on a tick that stands over a red gate.

## Known tradeoff

Spec Kit works branch-per-feature, so the linked task file lives on the feature branch until
merge — `main`'s board lags in-flight spec work. Accepted for now; the board is authoritative
per branch.
