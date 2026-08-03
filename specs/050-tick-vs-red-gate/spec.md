# 050 — Gate: a ticked tasks.md checkbox must not outrun a red project gate

Board task: **TASK-100** · runbook: `docs/design/gates-and-doctrine-sweep-runbook.md`
(Lane 1, default implementer tier) · governing ruling: **operator ruling A, 2026-08-02**

## Problem

**The field case (2026-08-01, spec 048 phases 1-2, PR #122).** A dispatched implementer
reported `node --test — 254 pass, 0 fail` and ticked its `tasks.md` "node --test green"
checkbox. At that moment four wiki notes were already staled and the freshness gate was
red. Nothing caught it. The next phase's agent noticed only because it re-ran the suite
and saw 258/259 — with a failure the previous phase had claimed did not exist. The tick
was corrected by hand and the per-phase boxes were qualified in prose.

**Prose is not a gate.** The next sweep's implementer will not read spec 048's tasks.md.
The correction did not generalize, which is why this is carded.

**Why it matters beyond one bad tick.** "A status can never exceed the artifacts that
prove it" is this repo's central integrity rule (`docs/wiki/gates-convention.md`,
`docs/skill-patterns.md` §4-5). **A ticked `tasks.md` checkbox IS status**: spec-bridge
derives a linked card's phase acceptance criteria *and* its board status from exactly
those boxes (`lib/spec-derive.mjs:deriveSpecState` — `allChecked` drives the
`REVIEWING`/Done-eligible stage; `spec-bridge/gates/bridge.mjs:checkBridge` blocks any
status that exceeds it). A green tick over a red gate is therefore the precise failure the
convention exists to make impossible, and it **propagates**: the bridge will happily
derive Done-eligible from boxes that were never true.

### The two things that must stay separated

The card is explicit that a naive rule breaks phased work, and the design must honor it:

1. **The freshness gate is red BY CONSTRUCTION** from the first commit that touches a
   pinned source until the re-pin commit lands. That is *correct sequencing* — this
   repo's doctrine requires re-pinning only after the commit that touched the sources —
   not a regression. A rule of "block any tick while any gate is red" would make phased
   work impossible.
2. **What is NOT acceptable** is a phase claiming a gate is green when it is red, or a
   task reaching Done-eligible while a gate the project enforces is failing.

## Operator ruling A (2026-08-02) — binding, not re-litigable

The card deliberately left the fix shape open ("not prescriptive — the spec decides").
The operator closed it at sweep sign-off. This spec implements the ruling; it does not
re-open it:

- **(a) Home — the spec-bridge Stop gate** (`spec-bridge/gates/bridge.mjs`). It already
  reads `tasks.md`, already blocks status-over-artifacts, and already owns the
  Done-eligible derivation this defect corrupts. **Not** a repo-local check script; not a
  second parallel surface.
- **(b) Host-declared via `.spec-bridge.json`** — following the exact contract the
  existing `strictDone` and `statusVocabulary` opt-ins set: **absent or malformed config
  ⇒ behavior bit-for-bit unchanged.** spec-bridge ships to consumer repos and must not
  assume praxisflux's gate set.
- **(c) Blocks, not warns** — an all-boxes-ticked (Done-eligible) spec while any declared
  *required* gate is red is a **blocking** finding. Ticks over a gate the host declared
  red-by-construction stay allowed.

## Requirements

### R1 — the config surface (enables AC #1-#3)

`.spec-bridge.json` gains one new optional key. Proposed shape — the implementer may
refine the spelling, but the *properties* below are requirements:

```json
{
  "projectGates": {
    "required":          [ { "name": "tests",     "command": "node --test" } ],
    "redByConstruction": [ { "name": "freshness", "command": "node grounding-wiki/gates/cli.mjs freshness . docs/wiki" } ]
  }
}
```

- `required` — gates that MUST be green before a spec may be Done-eligible.
- `redByConstruction` — gates a mid-PR phase MAY leave red (the freshness gate between a
  source edit and its re-pin commit). **Declared, not inferred**: "red until the re-pin
  commit" is not a property the checker can see, so the host states it.
- **The rule is data the check reads, not prose.** A design that documents which gates
  may be red without encoding it fails this requirement.
- **No-config parity is a hard requirement**, mirroring the existing
  `no statusVocabulary: … byte-identical` tests: with no `projectGates` key, every
  existing message and plan output stays byte-identical to today's.

### R2 — detection and the blocking finding (AC #1, AC #3)

- The check detects **ticked `tasks.md` checkboxes standing over a red required gate** and
  **blocks**, naming — as AC #1 requires — **the phase, the box, and the failing gate**.
  A message saying only "a gate is red" fails this criterion.
- **Done-eligible derivation is covered (AC #3):** an all-boxes-ticked spec while any
  declared required gate fails is a blocking finding, so the bridge cannot derive Done
  from boxes that were never true.

### R3 — phased work stays possible (AC #2)

- A tick while only `redByConstruction` gates are red is **allowed** — silently, not as a
  warning; the sequencing is correct, and nagging about it trains the reader to ignore
  the channel.
- Required gates must be green before the **final** phase ticks / before Done-eligible.
- Tests pin that a mid-PR phase with the freshness gate red still passes, and that the
  same state at Done-eligible blocks.

### R4 — when the gate commands actually run (the recorded design choice)

Ruling A fixed the home, the config, and the posture. It did **not** fix *when* the
declared commands execute — that is the remaining real decision, and the implementer must
record it in this spec dir with its rationale.

**The constraint that makes it a decision:** the bridge gate is a **Stop hook**, running
at every turn's end. `node --test` in this repo takes **~5.7 seconds**, against a ~103 ms
ordinary bridge Stop-hook run — a ~55× tax (measured 2026-08-02, Phase 1, 3-run median;
recorded in tasks.md's Notes). Executing declared gate commands on every Stop is not
acceptable — it would tax every turn in every consumer repo, and Stop hooks are
advisory-by-design here.

*(Correction, Phase 1: this spec originally said "3-5 seconds" from an unmeasured
estimate. The measured figure is ~5.7s. Any doc or code comment that cites the number
must use the measured one — a claim that fails re-measurement discredits the rule it
supports.)*

**Recommended design** (implement unless found unworkable, in which case record why):

- The Stop gate evaluates `required` commands **only when at least one linked task's spec
  is Done-eligible** (all boxes ticked). That is the bounded moment where the answer
  changes an outcome, and it satisfies AC #3 directly. Cost on an ordinary turn: zero
  commands run.
- AC #1's broader case — a tick claiming greenness mid-PR — is served by an explicit
  **CLI verb** (e.g. `node spec-bridge/gates/cli.mjs verify <root>`) checking every ticked
  box against the declared gates, exiting nonzero on a violation. The sweep's per-phase
  loop and CI call it.
- **This is one evaluator with two entry points, not two mechanisms** — exactly the shape
  `checkBridge` already has (Stop hook + `cli.mjs check`). Keep the pure evaluation
  function shared so both entry points agree by construction.
- It also matches the repo's stated split (`CLAUDE.md`): hooks are advisory/opt-in local
  pressure, CI is the authoritative enforcement point.

**Fail-closed, and respect the read-only convention.**
`docs/wiki/gates-convention.md` is explicit that `<plugin>/gates/` never writes to disk.
Executing a host-declared command is a subprocess, not a write by the gate — but the spec
must state that declared commands are the host's responsibility, are run without shell
interpolation of untrusted data, and that **a command which fails to execute is reported
as a problem, never silently treated as green**. This matches `gate-runner`'s existing
contract that a crashing check becomes a blocking problem rather than a silent no-op.

### R5 — tests and docs (AC #4)

- Tests pin: the blocking case; the red-by-construction allowance; the Done-eligible case;
  no-config byte-identical parity; a command that cannot execute failing closed.
- The docs describing the gates convention **name the rule** — `docs/skill-patterns.md`
  (§4-5) and `docs/wiki/gates-convention.md`, the latter as a NEEDS-REVIEW amendment
  honestly re-pinned in this same PR, never a stamp-only bump.
- `spec-bridge/README.md` documents the new config key.

### R6 — the field case is cited literally (AC #5)

Whatever ships names the 2026-08-01 case in the card's own words: **spec 048 phases 1-2,
"254 pass, 0 fail" reported and ticked while four notes were staled and the freshness gate
was red.** A fix without the citation leaves the next operator no reason to believe it.
This belongs in the shipped doc/code comment, not only in this spec.

### R7 — this repo declares its own set

Add a `.spec-bridge.json` at the praxisflux root declaring:
- `required`: `node --test`, `node scripts/check-docs.mjs`,
  `node scripts/sync-version.mjs --check`
- `redByConstruction`: the wiki freshness gate

This is the dogfooding proof — without it the feature ships untested against the very repo
whose field case produced it.

## Out of scope

- Changing what `deriveSpecState` derives. The stage ladder is correct; the defect is that
  nothing checks the boxes against reality.
- A repo-local check script duplicating this logic (ruling A (a) excludes it).
- Any change to `strictDone` or `statusVocabulary` semantics.
- Making CI run gate commands through this feature — CI already runs the real gates
  directly; this feature reconciles *ticks* against them.

## Version bump

Touches released surface (`spec-bridge/`, possibly `lib/`) ⇒ marketplace bump via
`node scripts/sync-version.mjs <next-free>` **at merge-readiness**, plus the edited
spec-bridge skill's own `version:` if a SKILL.md changes. Current lockstep 0.52.0;
readiness wins over prediction because serial merges keep moving the floor.

## Definition of done

All five card ACs checked; R4's design choice recorded with rationale; tests green;
`docs/wiki/gates-convention.md` amended and honestly re-pinned in the same PR; the
praxisflux `.spec-bridge.json` present and the gate green against it.
