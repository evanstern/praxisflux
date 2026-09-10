# 066 — Close the dispatch gap

**Task:** TASK-0125 · **Runbook:** `docs/design/dispatch-gap-runbook.md` (signed off
2026-09-10) · **Analysis:** `docs/design/lane-4-dispatch-gap.md`

## Problem

On 2026-09-10, during Lane 4 of the TASK-108 sweep, an entire task's implementation ran
**inline on the orchestrator's Opus session** instead of being dispatched to the `sonnet`
implementer its handoff explicitly assigned. Three written sources all said to dispatch;
none of them reached the session that mattered.

**The root cause is placement, not absence.** The dispatch obligation lives only in
`pdlc/skills/sweep/SKILL.md`, and the lane was resumed by pointing at a handoff document —
so that skill was never loaded. The always-on planted block *was* in context, but its Model
tiers section opens *"A sweep dispatches each task's implementation to a subagent"*, which
reads as a description of what the sweep skill does rather than an obligation on whoever is
implementing right now. The handoff named the tier (`sonnet`) but never said *dispatch*, so
the session could satisfy its letter — right tier named, `tiers.mjs --check` green — while
doing the work itself.

**No gate could catch it.** An inline-implemented task leaves artifacts *identical* to a
dispatched one: same commits, same specs, same ticks. `tiers.mjs --check` verifies that
agent definitions match the config; it cannot observe whether a dispatch happened. A wrong
model *pin* is caught; a *skipped dispatch* is caught by nothing.

The rule failed the sweep's own design test — *"if a decision lives only in chat, the next
session doesn't have it"* — with a twist: it was written, but in the one place a resumed
session does not read.

## Requirements

Mapped to TASK-0125's acceptance criteria. R1/R2/R5 are **necessary** (they close the honest
miss); **only R3 is sufficient** (it makes a skipped dispatch detectable). Both halves are
required — an earlier draft of the card let the cheap half satisfy the AC, which is the same
failure mode as naming a tier and then implementing inline.

### R1 — The always-on block binds any implementing session (AC #1)

`pdlc/templates/CLAUDE.md`'s Model tiers section must state a **standing obligation on
whoever is doing implementation work**, however they arrived — via `pdlc:sweep`, a handoff
document, or a direct request — rather than describing what a sweep does. It must not open
with "A sweep dispatches…".

### R2 — The handoff template names the dispatch, not the tier (AC #1)

A "Model tier: `sonnet`" field is a **label** a session can satisfy while working inline.
The template must say *dispatch to `<tier>-implementer`*, with the verify-the-served-model
step attached.

**Finding F2:** there is **no lane-handoff template in this repo** —
`docs/design/lane-4-handoff.md` and `docs/design/jira-board-handoff.md` are hand-authored
one-offs, and `docs/handoff-protocol.md` + `lib/handoff.mjs` are the *inter-plugin
`.handoff/` transport*, a different mechanism entirely. So this requires **creating** a
template. Home: `pdlc/skills/sweep/templates/`, beside `runbook.md`.

### R3 — The dispatch gets a residue a gate can check (AC #3) — THE SUFFICIENT FIX

> A task's PR is not merge-ready until its board task carries a dispatch record naming the
> model that actually served.

**It must fail closed: no record, no merge.** Documenting the expectation does not satisfy
this requirement — there must be a check that *reports a missing record*.

**Finding F3 — this needs no new surface.** `parseLinkedTask` (`lib/board-mirror.mjs:361`)
already parses a linked card's raw text and frontmatter, and `checkBridge`
(`spec-bridge/gates/bridge.mjs`) already walks every linked card. The sweep already mandates
tier + model ID + justification recorded on the board task at dispatch time. So the check
reads a card the gate already reads. **Do not invent a new gate script.**

### R4 — The inline carve-out is REJECTED, recorded as rejected (AC #4)

This must land as a **positive written artifact** — text stating the carve-out was considered
and refused, with its reasoning. **Silence does not satisfy it.**

Why refused: *"knowledge-shaped"* is not a boundary — any lane can be argued into it after
the fact, **by the party that did the work**, which is precisely how the Lane 4 miss would
be retroactively legitimized. The decisive evidence is this repo's own history: on
**2026-07-30** (`docs/design/sweep-cost-levers-runbook.md`, execution-log rows 189–191, PRs
#100–#102, v0.41.0–v0.43.0) **TASK-86, TASK-87 and TASK-88** — all pure doctrine/prose edits
to a SKILL.md — were dispatched to an **opus implementer** rather than done inline, logging
~408k / ~98k / ~116k subagent tokens respectively. **Cite that date, not a guessed one** —
verified against the runbook 2026-09-10 after Phase 1's first draft invented 2026-08-04. If
inline is ever right it is an **operator checkpoint recorded before the work**, structurally
identical to how escalation is already handled.

### R5 — The handoff's OPENING LINE fixes the reader's role (AC #2)

The highest-leverage requirement, because it targets the actual mechanism: **role ambiguity
at resume.** A handoff is prose a session reads and then acts on, so by the time a resumed
session reaches a tier field it has *already become* the implementer. The role assignment
must come **before the reader learns what the work is**:

> You are the **orchestrator** for this lane, not its implementer. Dispatch the
> implementation to `<tier>-implementer` and verify the served model before proceeding.

Role before content — not a tier field in a table.

### R6 — Re-plant and re-pin (AC #6)

Any planted-block change must be **re-planted** into this repo's own `CLAUDE.md`, and
`docs/wiki/pdlc-grounding-block.md` **re-pinned**. Per operator ruling **R2** these ride
this same PR.

The re-pin is **NEEDS-REVIEW, not RE-PIN-ONLY**: that note's prose makes claims about the
Model tiers section's content, and this work rewrites it. Amend the prose to match *before*
bumping the pin.

### R7 — The downstream upgrade path (operator ruling R3)

Raised by the operator mid-authoring: changing the planted block means **every downstream
dependant needs a way to update**. Three parts:

- **R7a — instructions.** A downstream host must be able to learn *how* to update a stale
  planted block without reading `plant.mjs`. `docs/releasing.md` is the natural home and
  today says **nothing** about re-planting. Land the concrete sequence: update the plugin →
  re-run `pdlc:bootstrap` → the block reports `drifted` → **diff it** → consent → re-plant
  with `--force`. Note that `.pdlc` stamps the planted version, so
  `<planted version> < <plugin version>` is the staleness test, and that **user edits belong
  OUTSIDE the markers** or a re-plant discards them.
- **R7b — enforcement: WIRE the existing check; change no contract.**

  **Finding F1, CORRECTED.** An earlier draft of this spec and of the runbook's ruling R3b
  claimed `plant --check` "reports `drifted` but exits 0", and asked for a breaking
  exit-code change. **That was a measurement error** — the probe piped node's output to
  `head`, so the shell reported `head`'s status. Measured correctly, `--check` **exits 1**
  on a drifted block, and `plant.mjs:324` has carried
  `if (check && pending) process.exit(1)` — `pending` including `claudeMd !== "unchanged"`
  and `modeSwitch === "drifted"` — all along.

  **What is actually broken is invocation, not the contract.** Nothing runs
  `plant --check`: not `.github/workflows/ci.yml`, not a git hook, not
  `scripts/check-docs.mjs` (verified by grep over `.github/`, `.githooks/`, `scripts/`).
  A working gate that no surface invokes is why praxis has been running a **v0.57.0 block
  against a v0.63.0 marketplace — six versions stale, unnoticed.**

  Requirements:
  - **Do NOT change `plant --check`'s exit-code contract.** It is already correct. There is
    **no breaking change**, so the breaking-change bump and the "downstream CI may start
    failing" warning that rode the false premise are **withdrawn** — do not implement them.
  - **Wire `plant --check` into a surface that actually runs**, where this repo's other
    doctrine checks already live, so a drifted block fails loudly.
  - **Sequencing:** praxis's own block is drifted right now, so the R6 re-plant must land
    **before** the check is wired, or the repo's own suite fails.
  - **Verify the failure line names the fix** (re-run `pdlc:bootstrap`; diff; `--force`)
    per this repo's gate convention. Adding that if absent is in scope.
  - **`--check` must remain read-only** — no sentinel advance, no write. Confirm; do not
    "improve" it.
  - Tests: a drifted block fails the newly-wired surface, a clean one passes. **Do not
    write a test asserting a behavior change that isn't happening.**
  - The non-`--check` plant path keeps its current behavior (report `drifted`, never
    overwrite without `--force`) — unchanged.
- **R7c — keep it distinct from R3.** A stale planted block and a skipped dispatch are the
  same *defect shape* (written doctrine, no residue a gate enforces) over **different
  artifacts**. Note the parallel in the rationale; **do not merge the mechanisms.**

## Out of scope

- Retrofitting dispatch records onto already-Done linked cards. If R3's fail-closed check
  would flag historical cards, that is an **operator checkpoint** (see the runbook), not an
  implementer decision.
- Changing what `tiers.mjs` checks. It verifies definitions against config; that is correct
  and unchanged.
- The sibling sweep's tasks (TASK-0126/0124/0127, specs 063/064/065). Do not touch their
  branches, worktrees, or spec dirs.

## Definition of done

All six ACs checked, with the two sufficiency tests honored — **AC #4 as a positive rejection
record**, **AC #3 as a fail-closed check**.
`env -u GIT_DIR -u GIT_WORK_TREE -u GIT_INDEX_FILE node --test` (**not `npm test` — no root
`package.json` exists here**; the env-scrub is mandatory in a worktree per
`.githooks/pre-commit:8-11`), `node scripts/check-docs.mjs`, and
the wiki freshness gate green. Marketplace version bumped per `docs/releasing.md` plus any
edited skill's own `version:` (an ordinary bump — **not** a breaking-change bump; see the
R7b correction). praxis's own block re-planted so `.pdlc` is no longer stale, and
`plant --check` wired into a surface that runs.
