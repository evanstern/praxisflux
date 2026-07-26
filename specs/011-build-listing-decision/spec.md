# 011-build-listing-decision — build/ stays listed; docs tell one true story

Board: TASK-37 · Sweep: `docs/design/board-clearing-runbook.md` (Lane 3, before TASK-40) ·
Direction: operator decision at sweep sign-off 2026-07-26 — **(a) keep build/ listed as a
skill-only plugin; fix both READMEs to describe what actually ships.** The task executes
the choice; the review's open question (docs/design-inputs/team-review-iteration-3-review.md,
"What should be removed" + open question 1) is answered by it.

## Problem

build/'s README still opens "Scaffold — not yet implemented" and the repo README row
echoes "(scaffold — split out of educate)", but TASK-29 shipped the real implement skill
(build/skills/). The plugin legitimately has no gates/, scripts/, or hooks/ — like pdlc,
a skill-only plugin is a supported shape. The catalog, README row, and build/README.md
must tell one consistent story.

## Requirements

### R1 — record the decision with rationale (AC #1)

On the board task (orchestrator lands it at finalization): decision = keep listed,
skill-only; rationale = TASK-29 shipped `/build:implement` for real, the pdlc precedent
legitimizes plugins that opt out of lifecycle machinery, and delisting would hide a
working skill; answers the review's open question 1.

### R2 — the docs (AC #2)

- `build/README.md`: remove every stale "not yet implemented"/scaffold claim covering
  what TASK-29 shipped; describe what actually ships (the implement skill: consumes a
  SPEC handed off via `.handoff/`, implements, verifies, returns findings; explicitly a
  skill-only plugin — no gates/scripts/hooks, and why that's a supported shape).
- Repo `README.md` build row: drop "(scaffold — split out of educate)"; match the new
  story. Keep the row format consistent with the table.
- Check `.claude-plugin/marketplace.json`'s build entry description: if it repeats the
  stale claim, regenerate/update via the established path (`scripts/gen-marketplace.mjs`
  reads plugin manifests — fix the source manifest `build/.claude-plugin/plugin.json`
  description if stale, then regen; a test asserts the catalog isn't stale).

### R3 — proof + releasing (AC #3)

- `node --test`, `node scripts/check-docs.mjs`, wiki-freshness all green.
- Released surface (build/ files) → marketplace `scripts/sync-version.mjs 0.19.0`
  (0.18.0 released). The implement SKILL.md gets a version bump ONLY if edited.
- Wiki re-pins as the gate demands (expect `build-plugin`, `overview` if README changes
  what the repo ships, plus lockstep stales); budgets hard; CAPSULES regen if a
  description changes. No course (per-feature policy).

## Non-goals

Adding gates/scripts/hooks to build/; README enforcement-column work (TASK-40's, next
in this lane — do not touch the enforcement framing or plugin counts).

## Acceptance

Board ACs #1–#3 map to R1–R3.
