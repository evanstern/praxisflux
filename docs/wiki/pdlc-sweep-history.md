---
name: pdlc-sweep-history
description: Entry point and release→child index for the pdlc:sweep skill's doctrine history, split summary-style into pdlc-sweep-history-early (0.12.1–0.42.0) and pdlc-sweep-history-recent (0.47.0 onward, the child that receives new releases). Parent keeps the framing paragraph and a superseded-conventions summary spanning both children. Load when tracing a rule's origin, not for current doctrine — that's pdlc-sweep.
kind: note
sources:
  - pdlc/skills/sweep/SKILL.md
  - pdlc/skills/sweep/templates/runbook.md
verified_against: 47251d443613f69264061c61fa2ccda51d0628cb
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

- [[pdlc-sweep-history-early]] — 0.12.1 through 0.44.0: merge-drift gates,
  capsule-first orientation, paused lanes, pin-aware reconciliation, honest re-pins,
  claim-step reconciliation, refactor-triage handoff, model-ID pinning, phase-scoped
  dispatch.
- [[pdlc-sweep-history-recent]] — 0.47.0 onward: doctrine-seam reconciliation,
  background-job mode, two-track landing, the hand-authored-specs hatch, the
  config-driven tier rubric, the claim/board-commit boundary, and the gate-readable
  dispatch record plus lane-handoff template. This is the child that receives new
  entries.

## Superseded conventions

Two threads run across releases rather than living inside a single one:

- **Pin-on-merge, superseded 0.28.0.** 0.27.0 introduced pin-carrying branches that
  merge `origin/main` in and mechanically re-pin conflicted pins to the merge commit.
  0.28.0 supersedes the mechanical re-pin: a merge-in licenses no pin bump on its
  own — every staled or conflicted pin routes through the wiki-update classifier
  ([[grounding-wiki-plugin]]) against the main-side diff, RE-PIN-ONLY or
  NEEDS-REVIEW. Old-convention hosts should drop the mechanical re-pin and treat
  previously bumped pins as suspect.
- **The hand-authored-specs precedent, retired 0.65.0.** 0.51.0 let a missing `.specify/`
  pass the precondition gate on a host's established hand-authored-specs precedent,
  recorded as an operator-signed escape line. Every praxisflux sweep from spec 052 on
  resolved that clause the same way, so the hatch became the default path — what an
  escape hatch must not be. 0.65.0 (skill 0.24.0, TASK-0128, spec 067) removes the
  precedent: `.specify/` present satisfies the gate plainly, and absent it the sweep stops
  and names `specify init` as the remedy, because the tooling is installable. An escape
  line survives as what it was designed to be — one task, one signed runbook, never a
  standing sanction that rolls forward. Old-convention hosts should install Spec Kit
  rather than re-sign the precedent.
- **Drifted doctrine, reconciled 0.34.0.** TASK-60 folded three independently-evolved
  threads (the claim step, the drift-gate inventory, tick-before-sync in re-ground)
  back into agreement across SKILL, template, and this history note, after each had
  drifted out of step release by release.
- **A reliable model pin, superseded 0.55.0.** 0.35.0 established pinning explicit model
  IDs on the dispatch call; 0.52.0 moved the authority to the agent definition's
  frontmatter after the 2026-07-31 field case caught the dispatch parameter being silently
  ignored. 0.55.0 supersedes the idea that *either* is reliable: on 2026-08-10 the reverse
  failure appeared — a host whose frontmatter pin rejected an ID the dispatch parameter
  resolved fine. Doctrine now prefers the frontmatter pin (durable across sessions where
  the parameter is per-call) but treats **verifying the served model from the transcript**
  as the load-bearing step. Old-convention hosts should stop reading a green config or a
  green `--check` as proof that a dispatch ran on the intended model. **0.63.1 extends the
  same thread past verification to residue:** the served model is recorded on the card as a
  machine-findable `Dispatch:` line a gate reads, because nothing before it could prove a
  dispatch happened *at all* — an inline-implemented task leaves identical commits, specs,
  and ticks. Superseded: recording the tier as prose justification, which nothing reads
  back.

## Connections

- Children: [[pdlc-sweep-history-early]], [[pdlc-sweep-history-recent]].
- [[pdlc-sweep]] states current doctrine and cross-references this note for the
  per-release detail behind it.
