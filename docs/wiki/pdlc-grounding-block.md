---
name: pdlc-grounding-block
description: What pdlc:bootstrap actually plants into a host CLAUDE.md — the marked-block mechanism (compose, refresh wholesale, honest drift), the 101 principles and their per-peer mappings, the corpus-loading and Gates rules, and the model-tier section whose ladder lives in .claude/model-tiers.json rather than the block itself.
kind: concept
sources:
  - pdlc/templates/CLAUDE.md
  - pdlc/templates/model-tiers.json
  - pdlc/scripts/tiers.mjs
verified_against: 9c4e990449912ee5e56c596794ac63e83ea4b686
---

# The planted PDLC grounding block

What [[pdlc-plugin]]'s `bootstrap` skill writes into a host's `CLAUDE.md`, and why each
rule is phrased the way it is. Split summary-style off the parent at the 8,000-char cap.

## A marked block, not a file

Everything planted rides between `<!-- pdlc:grounding BEGIN/END -->` markers rendered from
`pdlc/templates/CLAUDE.md` — one decision buying three behaviors:

- **Compose with an existing `CLAUDE.md`** — appended after the user's content, never clobbered.
- **Refresh wholesale on update** — the block is boilerplate; user edits belong *outside* the markers.
- **Honest drift handling** — a block differing from the current render reports `drifted`
  and is never overwritten without `--force`; the skill diffs and gets consent.

Peer conventions are nested `pdlc:peer:backlog` / `pdlc:peer:spec-kit` sub-blocks, stripped
at render time unless opted in.

## The 101 principles and their peer mappings

The block's "Rules that always hold" carry the foundational praxis principles from
`docs/principles.md` — **artifact-grounded action** (no action without a durable paper
trail / real evidence) and **one TASK, one PR** (a SUBTASK never gets its own PR) — so every
bootstrapped project inherits them; each peer sub-block adds that system's mapping
(Backlog.md dotted-id subtasks ride the parent's PR; Spec Kit phases are not PR boundaries).
Since 0.16.0 the one-TASK-one-PR rule carries P2's ratified refinements — the three-tier
model and the reason-to-approve test (no PR without a stated reason for a human to
approve); `test/pdlc.test.mjs` asserts both. Since 0.50.0 (bootstrap 0.8.0) the Backlog
peer block also carries the **two-track landing rule** (TASK-85): board/bookkeeping commits
(cards, status flips, notes, AC ticks) land direct on the default branch, deliverable work
by PR — derived from the reason-to-approve test (a board card carries no reviewable
decision), so it is one-TASK-one-PR applied, not an exception. The **claim flip is
carved out** (spec 057): "direct to `main`" covers notes, AC ticks, labels, and new cards,
never the status flip that claims a task — that belongs in the claim commit on the branch,
beside the spec dir and the link, or the board and the spec dir describe different states in
different checkouts. Where main-push is
unavailable it degrades to riding the next branch, matching [[pdlc-sweep]]'s
background-job / no-main-push mode.

## Corpus-loading and Gates

Since 0.14.0 the rules also carry a **corpus-loading** rule — [[grounded-corpus-spec]] v2
consumption always-on (INDEX-first routing, just-in-time notes, `CAPSULES.md` orientation).
Since 0.34.0 (bootstrap 0.6.0) the **Gates** rule states ship-reality instead of the blanket
"plugins ship Stop hooks" overclaim (TASK-60): spec-bridge, educate, research, reorient, and
team-review ship Stop hooks; grounding-wiki's freshness gate runs as check scripts and CI,
not a hook — so a bootstrapped host is never told a gate exists that nothing installs.

## Model tiers — posture in the block, ladder in config

Since 0.52.0 (bootstrap 0.9.0) the block plants a **`## Model tiers` section** (TASK-91),
and since 0.55.0 (bootstrap 0.11.0) it carries **posture, not a ladder** (TASK-106):
thinking is Opus/Fable-tier, execution is Sonnet/Haiku-tier, escalation an operator
checkpoint. The ladder moved to **`.claude/model-tiers.json`**, which
`pdlc/scripts/tiers.mjs` compiles into `.claude/agents/<tier>-implementer.md`. A generator
is needed because config alone cannot drive dispatch: only an agent definition's frontmatter
`model:` (or the dispatch-call parameter) reaches the harness. Keeping the ladder out of the
block is the point — a model bump becomes a one-line config edit plus a regenerate instead
of a re-plant + drift + `--force` — and the tier map is deliberately **open**, so a `fable`
tier, or a family that did not exist when the plugin shipped, is a config key rather than a
code change.

Three findings from the 2026-08-10 dogfood are doctrine here:

- **Model IDs are host-form.** A 9router host rejected both `claude-sonnet-5` and the
  `sonnet` alias in agent-def frontmatter, accepting `cc/claude-sonnet-5[1m]`. Bootstrap
  resolves the ID *and* the host's ID form against the live harness (standing source: the
  `claude-api` skill), never from memory.
- **Both pin mechanisms have failed in the field** — the dispatch-call parameter silently
  ignored on 2026-07-31, the frontmatter pin rejecting a valid ID on 2026-08-10 — so the
  load-bearing rule is verifying the **served** model from a transcript, not trusting either.
- **The agent registry is read at session start**, so a regenerated definition does not take
  effect until the session restarts; an edited tier keeps dispatching its old pin until then.

## Connections

- Parent note: [[pdlc-plugin]] — the plugin, its skills, and `scripts/plant.mjs`.
- [[pdlc-sweep]] — the consumer: Phase 1 reads the tier config this block points at.
- [[grounded-corpus-spec]] — the corpus-loading rule's contract.
- [[gates-convention]] — the Gates rule's wider shape across the suite.
