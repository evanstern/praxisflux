# 049 — wiki: backfill pdlc-sweep-history; real sources for the test-suite-catalog hub

Board task: **TASK-93** · runbook: `docs/design/gates-and-doctrine-sweep-runbook.md`
(Lane 1, mechanical tier) · corpus contract: `docs/corpus-spec.md`

## Problem

Two corpus-integrity defects, both from refactor-triage run
`praxis-2026-07-31-18-47-56` (finding 3 + minor item (f)).

**1. The history note makes a false promise.** `docs/wiki/pdlc-sweep.md:92-97` tells the
reader that `[[pdlc-sweep-history]]` "carries the per-release detail". It does not: the
history note's last entry is **0.47.0**, while three releases have since shipped sweep
doctrine —

| release | doctrine it added |
|---|---|
| 0.48.0 | background-job / no-main-push execution mode |
| 0.50.0 | two-track landing reference |
| 0.51.0 | hand-authored-specs hatch + the gate-softening-requires-amendment rule |

A note whose stated contract is release-by-release history, missing the last three
releases, is not merely stale — the sibling note's cross-reference to it is **false**.
This is the failure the freshness gate cannot see: the pins are current, the prose is
wrong. TASK-90's execution-log row classified this note `reviewed-no-amend` while its
source had gained a 25-line doctrine section — a dishonest no-amend, the exact shape the
honest-re-pin rule exists to prevent.

**2. The note has no room to be fixed.** `pdlc-sweep-history.md`'s body is **7,992 of
8,000** characters (measured 2026-08-02). Three release entries cannot be added. The
corpus spec's answer is a **summary-style split**, and this repo has a fresh precedent:
TASK-78 split `test-suite-catalog-plugins` into a summary-style parent plus `-gates` and
`-pipeline` children.

**3. `test-suite-catalog-plugins.md` has `sources: []`.** It is the freshness gate's one
standing WARN — `no sources listed — staleness is unverifiable`. A note nothing can
invalidate is a note nothing can keep honest.

## Why this task is Lane 1, and first within it

Three later PRs in this sweep (TASK-97, TASK-98, TASK-96) each edit
`pdlc/skills/sweep/SKILL.md`, one of this note's two pinned sources. Each therefore
stales the note and owes it an honest re-pin — which, for a release-history note, means
**adding its own release entry**. Three PRs each adding an entry to a note nine
characters under its cap all fail the size budget. **This task's split is the headroom
those PRs spend.** Contract-shaped work: it unblocks consumers without their internals
depending on its own.

## Requirements

Mapped 1:1 to the board card's acceptance criteria.

### R1 — backfill via a summary-style split (AC #1)

- The history corpus carries entries for **0.48.0, 0.50.0, and 0.51.0**, each in the
  existing per-release style: what arrived, the field evidence that forced it, and any
  superseded convention downstream hosts inherited.
- Entries are **grounded in the actual releases**, never invented. Derive each from the
  sweep SKILL.md diff across that release plus the artifacts that produced it —
  `docs/design/board-cost-test-runbook.md` (0.48.0's background-job mode),
  `specs/046-two-track-landing-rule/` (0.50.0),
  `specs/045-sweep-hand-authored-specs-hatch/` (0.51.0). A release entry with no field
  evidence is a stub, not an entry.
- The split follows `docs/corpus-spec.md`'s summary-style rule and TASK-78's precedent:
  the parent stays the named entry point and summarizes; children carry the detail;
  **every resulting body ≤8,000 chars and every capsule ≤500**.
- **Leave headroom.** The parent and whichever child receives the newest releases must
  each end this task with room for at least three more release entries (~1,200 chars).
  A split landing at 7,9xx/8,000 has not solved the problem it was carded for — it has
  moved it. This is a requirement, not a nicety.

### R2 — links and generated files (AC #2)

- Reciprocal wikilinks resolve in both directions between parent and every child, and
  `[[pdlc-sweep]]`'s existing cross-reference resolves to a note that now actually
  carries what it promises.
- `INDEX.md` and `CAPSULES.md` are **regenerated**, never hand-edited —
  `node ${CLAUDE_PLUGIN_ROOT}/scripts/capsules.mjs <repo-root> docs/wiki` for CAPSULES.
  Both are derived state; a hand edit is a gate failure by construction.

### R3 — the hub note gets real sources (AC #3)

`docs/wiki/test-suite-catalog-plugins.md` either:
- pins **real sources** — its children's paths and/or the `test/` files it catalogs — so
  staleness becomes verifiable; **or**
- is explicitly marked index-kind, if `docs/corpus-spec.md` sanctions a source-free kind
  for pure entry-point notes.

Whichever is chosen, the choice and its rationale are recorded in this spec dir, and the
gate's WARN is gone. **Prefer real sources**: the note names specific children whose
existence and naming it asserts, so it has genuine invalidation conditions.

### R4 — gate green, no version bump (AC #4)

- `node grounding-wiki/gates/cli.mjs freshness . docs/wiki` exits 0 with **zero warns**
  (today: 36 notes fresh, one warn — that warn is this task's).
- `node --test` and `node scripts/check-docs.mjs` green.
- **Wiki-only: no released surface changes, so no marketplace bump and no skill
  `version:` edit.** If any change here would touch a plugin dir, `lib/`, `scripts/`, or
  `.claude-plugin/`, stop — that is out of scope and an operator question.

## Out of scope

- A release entry for **this sweep's own** releases (0.53.0+). Those belong to the PRs
  that ship them, per the runbook's gate line "every sweep-doctrine PR adds its own
  release entry". This task backfills 0.48.0/0.50.0/0.51.0 and leaves the room.
- Any edit to `pdlc/skills/sweep/SKILL.md`. The note's prose is what is wrong here, not
  its source.
- Re-pinning notes this task does not touch.

## Definition of done

All four ACs checked on TASK-93; freshness gate green with zero warns; both generated
files regenerated rather than edited; PR merged as a merge commit (this branch is
pin-carrying).
