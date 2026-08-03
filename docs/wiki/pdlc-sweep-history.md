---
name: pdlc-sweep-history
description: Entry point and release→child index for the pdlc:sweep skill's doctrine history, split summary-style into pdlc-sweep-history-early (0.12.1–0.42.0) and pdlc-sweep-history-recent (0.43.0 onward, the child that receives new releases). Parent keeps the framing paragraph and a superseded-conventions summary spanning both children. Load when tracing a rule's origin, not for current doctrine — that's pdlc-sweep.
kind: note
sources:
  - pdlc/skills/sweep/SKILL.md
  - pdlc/skills/sweep/templates/runbook.md
verified_against: 608ccda
---

# pdlc:sweep — doctrine history

The sweep skill (added to the [[pdlc-plugin]] in marketplace 0.12.0) accreted its
doctrine release by release. [[pdlc-sweep]] states the current rules; this note tracks
when each arrived, the field evidence that forced it, and what superseded-convention
hosts inherited. Versions are the marketplace lockstep, with the skill's own version in
parentheses where it diverges.

## Children

The release-by-release record split summary-style, chronologically, when this note
neared the 8,000-char body cap:

- [[pdlc-sweep-history-early]] — 0.12.1 through 0.42.0: merge-drift gates,
  capsule-first orientation, paused lanes, pin-aware reconciliation, honest re-pins,
  claim-step reconciliation, refactor-triage handoff, model-ID pinning, phase-scoped
  dispatch.
- [[pdlc-sweep-history-recent]] — 0.43.0 onward: cost levers, Spec-Kit degradation
  hardening, doctrine-seam reconciliation, and the sweep's own backfilled releases as
  they land. This is the child with headroom reserved for new entries.

## Superseded conventions

Two threads run across releases rather than living inside a single one:

- **Pin-on-merge, superseded 0.28.0.** 0.27.0 introduced pin-carrying branches that
  merge `origin/main` in and mechanically re-pin conflicted pins to the merge commit.
  0.28.0 supersedes the mechanical re-pin: a merge-in licenses no pin bump on its
  own — every staled or conflicted pin routes through the wiki-update classifier
  ([[grounding-wiki-plugin]]) against the main-side diff, RE-PIN-ONLY or
  NEEDS-REVIEW. Old-convention hosts should drop the mechanical re-pin and treat
  previously bumped pins as suspect.
- **Drifted doctrine, reconciled 0.34.0.** TASK-60 folded three independently-evolved
  threads (the claim step, the drift-gate inventory, tick-before-sync in re-ground)
  back into agreement across SKILL, template, and this history note, after each had
  drifted out of step release by release.

## Connections

- Children: [[pdlc-sweep-history-early]], [[pdlc-sweep-history-recent]].
- [[pdlc-sweep]] states current doctrine and cross-references this note for the
  per-release detail behind it.
