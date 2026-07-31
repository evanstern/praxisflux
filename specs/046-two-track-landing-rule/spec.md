# 046-two-track-landing-rule — spec

**Board task:** TASK-85 · **Finding source:** surfaced while sweeping infinitynode.media
(a PDLC-bootstrapped host) on 2026-07-28 — that host spent a full triage cycle
rediscovering a convention praxisflux already follows.

## Problem

praxisflux follows a clear two-track landing convention — **board/bookkeeping commits
land direct on main; deliverable work lands by PR** — but `pdlc:bootstrap` never plants
it. The planted block's "One task, one PR" reads as "everything reaches main by PR",
so bootstrapped hosts drift (infinitynode.media's wiki asserted PR-only while all five
of its board commits went direct), get flagged by their own reviews, and re-derive the
rule praxisflux already lives by.

## Requirements (map 1:1 to the card's ACs)

- **R1 (AC #1) — plant the rule:** `pdlc/templates/CLAUDE.md`'s `pdlc:peer:backlog`
  block states the two-track landing rule: board/bookkeeping commits (cards, status
  flips, notes, AC ticks) go direct to main; deliverable work goes by PR.
- **R2 (AC #2) — derived, not exceptional:** the wording derives the rule from the
  block's existing no-PR-for-its-own-sake principle (a PR exists only where it carries
  a stated reason for a human to approve; a board card carries no reviewable decision)
  so it cannot be read as an exception to one-task-one-PR.
- **R3 (AC #3) — replant path:** `pdlc:bootstrap`'s update path refreshes the block on
  already-bootstrapped hosts (verify the planted block's marker/versioning mechanics
  make this true automatically via plant.mjs; state it in the bootstrap skill if it
  isn't already explicit).
- **R4 (AC #4) — sweep references, not restates:** `pdlc/skills/sweep/SKILL.md`
  references the planted rule instead of restating it, so sweeps stop ratifying it
  per-host. TASK-90's mode section already carries the degraded form ("board track
  rides the next branch / wrap-up PR when main-push is unavailable") — the reference
  must compose with that sentence, not duplicate it. ONE tight hunk in the sweep file.
- **R5 (AC #5) — release mechanics:** bootstrap skill version bump (template is its
  surface; 0.7.0 → 0.8.0) + sweep skill 0.16.0-or-current → next minor if its file
  changed + marketplace lockstep; pdlc wiki note(s) re-verified; gates green.

## Non-goals

- No behavioral change to sweep doctrine beyond the reference line (TASK-90 shipped
  the mode; TASK-79 is concurrently editing the same file — keep the hunk minimal).
- No repo CLAUDE.md replant here (TASK-74 just re-planted at 0.45.0; hosts pick the
  rule up at their next `pdlc:bootstrap` update).

## Done means

All five ACs checked on TASK-85; a freshly bootstrapped (or re-planted) host's
CLAUDE.md states the two-track rule derived from the approval principle; the sweep
skill points at it; PR merged with bumps and re-verified notes.
