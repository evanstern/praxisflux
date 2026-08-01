# 048 — pdlc:bootstrap plants a model-tier rubric

**Board card:** TASK-91 — *pdlc:bootstrap plants no model-tier rubric, but pdlc:sweep hard-requires one*
**Runbook:** `docs/design/bootstrap-tier-rubric-runbook.md` (signed-off 2026-08-01)
**Spec Kit:** absent (`.specify/`) — hand-authored per this host's recorded precedent, sanctioned by
the runbook's operator-signed escape line. All three artifacts are still required in full.

## Problem

A project bootstrapped for the PDLC has nothing that says which model does what — yet
`pdlc:sweep` refuses to dispatch without exactly that. `pdlc/skills/sweep/SKILL.md` Phase 1
item 2 requires "model tier per task, from the host project's rubric (e.g. a constitution's
tiered-workflow principle)" plus an explicit model ID and a fallback ID per task, and step 5
requires the runbook's pinned model ID at dispatch. Both treat the host rubric as a given.
`pdlc/skills/bootstrap/SKILL.md` contains no mention of tiers, models, or a rubric — `rg -i
'tier|rubric'` returns nothing. Bootstrap plants the PDLC `CLAUDE.md` block, gitignores
`.handoff/`, and handles the Backlog.md and Spec Kit peers; model tiering is not part of the
grounding it stamps.

The gap is invisible until a sweep is already running, and the failure mode is silent:
Phase 1 item 2 has no source, nothing gates it, and dispatches fall back to whatever model the
orchestrator happens to be on. SKILL.md's own warning ("a bare tier name is not a valid runbook
entry") is the only thing standing between the operator and an unpinned dispatch. The sweep
skill already documents the field case where "Opus tier" implementers ran on the orchestrator's
Fable session model at 2× the unit price.

A second, compounding failure is recorded in `docs/design/board-cost-test-runbook.md` (TASK-74
row, 2026-07-31): **the Agent tool's `model` parameter was observed to be silently ignored in
this harness** — three Fable dispatches were killed early, and pinning was moved to
`.claude/agents/opus-implementer.md` with an explicit `model:` in frontmatter. A rubric that
teaches the dispatch-call parameter as the pinning mechanism would therefore teach a mechanism
that does not hold.

## The design choice, and why (AC #1)

AC #1 offers two shapes and requires the choice be *recorded with its rationale*:

- **(a) Plant a rubric in the grounding bootstrap stamps** — durable, greppable, re-plantable;
  costs always-on context in every session of every bootstrapped project.
- **(b) Detect an absent rubric and tell the operator what to author and where** — cheaper
  context; the notice lives only in the bootstrap session's chat.

**Chosen: (a), plant it.** Argued from `docs/principles.md` **artifact-grounded action**: a
decision living only in a chat turn did not happen. A bootstrap-time verbal notice evaporates
when the bootstrap session ends, leaving the sweep three tasks later with the same missing
source — precisely the failure this task exists to close. A planted section is durable,
greppable, re-plantable, and gives sweep's Phase 1 item 2 a real location to name (AC #3). The
context cost is real and is answered by keeping the section tight: a short ladder plus the
mechanism, not a treatise.

*Operator ruling, sign-off 2026-08-01: plant, with two added constraints (R-A and R-B below).*
*Rejected (b) and the pointer-only hybrid for the same durability reason.*

## Requirements

Each requirement maps to a board acceptance criterion or an operator ruling recorded as a
runbook gate line.

### R1 — bootstrap plants a model-tier rubric (AC #1)

`pdlc/templates/CLAUDE.md` gains a **`## Model tiers — who does what work`** section **inside**
the `pdlc:grounding` markers, so it refreshes wholesale on re-plant like the rest of the block.
It carries, and no more:

1. The **tier ladder** — a default tier → model-ID table (see R4).
2. The **pinning mechanism** that actually holds (R2).
3. The **authority rule** — where the live pin lives, and therefore where to edit (R3).

It does **not** restate sweep's dispatch procedure; that stays in the sweep skill.

### R2 — the mechanism named is frontmatter pinning, with the field case cited (AC #2)

Whatever bootstrap teaches must name **an explicit model ID in an agent definition's
frontmatter** (`.claude/agents/<name>.md`, `model: <id>`) as the pinning mechanism, and must
**cite the 2026-07-31 field case** in which the dispatch-call `model` parameter was silently
ignored (`docs/design/board-cost-test-runbook.md`, TASK-74 row). The citation is not decoration:
without it the next operator has no reason to prefer frontmatter over the parameter, and will
reach for the parameter because it is the more obvious API.

The planted prose must not present the dispatch-call parameter as an equivalent alternative. It
may note that the parameter works on hosts where it is verified to work — but the default it
teaches is the frontmatter pin.

### R3 — refreshing the rubric is quick and easy, and the path is named (operator ruling B)

The planted section sits inside the `pdlc:grounding` markers, where a hand edit reads as drift
and a re-plant needs `--force` (`pdlc/scripts/plant.mjs`: a block differing from what the
current version plants is reported `drifted` and never overwritten without `--force`; the skill
shows the diff and gets consent). That tension must be **resolved by the design, not inherited**.

Resolution — **split doctrine from pin**:

- **The planted section is doctrine**: the tier ladder, the mechanism, and the defaults
  bootstrap recommends. It changes only when the *doctrine* changes, which is rare. Refreshing
  it is one step: re-run `pdlc:bootstrap` (drift → diff → consent → `--force`), the same path
  every other block change already takes.
- **The authoritative pin is the agent definition** — `.claude/agents/<tier>-implementer.md`,
  `model:` in frontmatter. That file sits **outside every marker**, is a plain tracked file, and
  is edited freely with no drift and no `--force`. Changing which model a tier resolves to is a
  one-line edit there.
- The planted section states this explicitly: the table is the **planted default**, the agent
  definition's `model:` is **authoritative at dispatch**. A reader who changes one knows which
  one to change and that the other is prose.

This is what makes "quick and easy" true rather than asserted: the thing an operator actually
edits when a model is superseded is a one-line frontmatter field in an ordinary file.

### R4 — the ladder's IDs are grounded, not authored from memory (operator ruling A)

The `pdlc:bootstrap` skill must **resolve the model IDs against what the running
harness/subscription actually exposes at plant time** — never author them from memory — and must
say what to do when a pinned ID is unavailable. Concretely:

- The skill names the standing source for current model IDs (the `claude-api` skill) and
  instructs a resolve-then-plant order.
- The **availability check** is the harness's own agent-definition surface: a tier whose ID the
  harness will not accept in an agent definition is not available, and the fallback applies.
- The **fallback slot exists for exactly this**: when the primary ID is unavailable to the
  running subscription, the documented fallback is used and *which model actually served* is
  recorded (this is the 2026-07-31 operator ruling the sweep skill already carries).

**Planted defaults (operator ruling C, sign-off 2026-08-01) — latest-generation:**

| Tier | Default model ID | For |
|---|---|---|
| default implementer | `claude-opus-5` | design work, cross-surface doctrine, anything with a real judgment call |
| mechanical | `claude-sonnet-5` | work to an existing pattern — tests to a sibling standard, corpus hygiene |
| fallback | `claude-opus-4-8` | when the subscription does not surface the primary |

A hard-coded table the skill never checks fails this requirement.

### R5 — sweep names where the rubric lives (AC #3)

`pdlc/skills/sweep/SKILL.md` Phase 1 item 2 must name the location a bootstrapped project's
rubric lives, so "the host project's rubric" resolves to a defined artifact rather than the
orchestrator's judgment. It names both halves of R3: the planted `## Model tiers` section (the
ladder) and `.claude/agents/<tier>-implementer.md` (the authoritative pin).

**This is a two-way contract.** The location sweep names and the location bootstrap plants to
must be the same. They are verified by reading the two edits together, not separately.

### R6 — a test pins the new contract (AC #4)

`test/pdlc.test.mjs` gains coverage matching the existing plugin test standard (the file's
current template-content assertions — e.g. *"template carries the foundational (101) principles
from docs/principles.md"* — are the model). At minimum the test pins:

- the template carries the model-tier section inside the grounding markers;
- the section names the frontmatter-pinning mechanism and cites the field case;
- the section names the agent-definition path as authoritative;
- the bootstrap skill instructs resolving IDs against the live harness rather than from memory.

The test asserts the **contract**, not exact prose — it must not become a copy of the template
that fails on any reword.

## Non-goals

- **Bootstrap does not write `.claude/agents/*.md`.** Widening the planting contract to a new
  directory is a separate change with its own drift and consent semantics. Bootstrap *teaches*
  the agent-definition mechanism and gives the shape; the operator authors the file. (This repo
  already carries both defs, from the 2026-07-31 sweep.)
- **No change to sweep's dispatch procedure.** R5 is a location reference in Phase 1 item 2
  only. Reworking how sweep teaches dispatch-time pinning is TASK-97, carded separately by the
  2026-07-31 refactor-triage run.
- **No new gate.** Nothing blocks a sweep whose host lacks a rubric; that would be a behavior
  change to the sweep's precondition gate, not a bootstrap change.

## Acceptance criteria mapping

| Card AC | Requirement |
|---|---|
| #1 plant-or-detect, choice recorded with rationale | R1 + "The design choice, and why" |
| #2 names frontmatter pinning, cites the 2026-07-31 field case | R2 |
| #3 sweep Phase 1 item 2 names where the rubric lives | R5 |
| #4 test in `test/pdlc.test.mjs` to the existing standard | R6 |
| Operator ruling A (IDs grounded in the live harness) | R4 |
| Operator ruling B (refresh quick, easy, and named) | R3 |
| Operator ruling C (latest-generation defaults) | R4 table |

## Done means

All six requirements land on `task-91-bootstrap-tier-rubric` in one PR, with the runbook's
enumerated per-PR gates green: `node --test`, `scripts/check-docs.mjs`, the wiki freshness gate,
the marketplace version bump in lockstep with both edited skills' `version:` fields, this repo's
own planted block re-planted (the template edit drifts it), and same-PR wiki re-pins classified
against the actual diff.
