---
id: TASK-105
title: >-
  grounding: re-ground BEFORE the PR, and gate it with a sign-off artifact
  (freshness is arithmetic, not proof of review)
status: To Do
assignee: []
created_date: '2026-08-10 02:41'
labels:
  - gates
  - grounding
  - debt
dependencies:
  - TASK-102
priority: high
ordinal: 137000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Operator finding 2026-08-09, after a repeat miss of the wiki re-grounding step. Two separate defects, one persistent symptom.

(1) ORDERING — the always-on grounding contradicts itself. Root CLAUDE.md:35 (repo-native section) says 'finish each PR with a /grounding-wiki:wiki-update pass when the freshness gate fails'. Root CLAUDE.md:138, inside the planted PDLC block, says re-ground 'after merging changes that touch files any note lists as sources'. The planted line comes from pdlc/templates/CLAUDE.md:23 and the loop diagram above it (template:11, root:131) draws re-ground downstream of build with no PR in the picture. A session following the planted line defers re-grounding past the merge, which is what happened. Operator ruling: re-ground BEFORE the PR. The post-merge refresh in pdlc/skills/sweep/SKILL.md:253-262 (step 9) stays valid for merge-induced drift, but it must not read as the primary home of the obligation.

(2) ENFORCEMENT HONESTY + THE ACTUAL HOLE — the sentence at root CLAUDE.md:173 / pdlc/templates/CLAUDE.md:58 ('grounding-wiki's freshness gate runs as check scripts and CI, not a hook') is TRUE for this repo: grounding-wiki/gates/freshness.mjs runs at .github/workflows/ci.yml:33, .githooks/pre-push:12, scripts/stop-docs.mjs:37-52, and scripts/run-gates.mjs:38 (all from 8ea73a2a, TASK-14). It reads as false to a session because the gate it names cannot detect the failure mode it is being blamed for.

Freshness is arithmetic: 'git log <pin>..HEAD -- <sources>' empty => green. Three ways it is green while nobody looked at the corpus: (a) the PR introduces a concept that has NO note — absence has no pin, so the gate is structurally blind to it; (b) a pin is bumped without reading the covered diff — TASK-58 made honest re-pins doctrine, nothing enforces it; (c) the corpus is simply never opened because the PR happened not to touch any pinned source, which is a legitimate outcome but indistinguishable from neglect. In all three the gate proves the pins are internally consistent and proves nothing about whether the re-grounding pass occurred.

What is missing is a SIGN-OFF ARTIFACT: a durable record that a wiki-update pass was deliberately run, WHEN, and AGAINST WHAT COMMIT — and a gate that refuses a PR whose sign-off does not cover its head.

Shape (not prescriptive — the spec decides): a tracked status file under the corpus (e.g. docs/wiki/.status.json) carrying at minimum a timestamp, the commit id the pass was run against, and a digest binding it to the corpus state it signed off (so the file cannot be stamped once and left). A new gate — sibling to wiki-freshness in grounding-wiki/gates/, exported through scripts/run-gates.mjs, action.yml and @praxisflux/gates — fails when the sign-off's commit is not an ancestor of HEAD, when HEAD carries commits touching any pinned source since it, or when the digest does not match. /grounding-wiki:wiki-update writes the sign-off as the last step of its pass; nothing else may write it by hand. The escape valve for 'the corpus genuinely needed no change' must be an explicit signed no-op, not silence — that is the whole point.

PLACEMENT CONSTRAINT (why this deps on TASK-102): the new gate is a repo-STATE self-check, exactly the class TASK-102 shows is unsatisfiable in the per-commit path — a sign-off cannot cover a HEAD that does not exist yet, so wiring it into .githooks/pre-commit or the 'node --test' repo self-check would block every intermediate commit and train sessions to --no-verify it. It belongs at pre-push / CI / PR head. Land TASK-102's placement ruling first and follow it.

HOTSPOT: TASK-96 also re-plants the root CLAUDE.md block and edits pdlc/templates/CLAUDE.md. Same lane, sequence these two — do not run them as parallel branches. Where the ordering wording lands relative to TASK-96's re-plant is a lane-ordering decision, not a second edit of the same lines.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Root CLAUDE.md and pdlc/templates/CLAUDE.md state one ordering: re-ground BEFORE opening the PR; no surviving text instructs deferring the pass to after the merge as the primary obligation
- [ ] #2 The loop diagram in both files reflects that ordering (re-ground sits inside the build->PR leg, not downstream of the merge)
- [ ] #3 pdlc/skills/sweep/SKILL.md step 9's post-merge refresh survives only as merge-induced-drift handling, with an explicit back-pointer to the pre-PR pass as the primary obligation
- [ ] #4 A sign-off artifact exists under the corpus carrying at minimum a timestamp, the commit it was verified against, and a digest binding it to the corpus state signed off
- [ ] #5 A new gate in grounding-wiki/gates/ fails when the sign-off does not cover HEAD (not an ancestor, superseded by source-touching commits, or digest mismatch) and is exported through scripts/run-gates.mjs, action.yml and docs/consuming-gates.md alongside wiki-freshness
- [ ] #6 An explicit signed no-op is the only way to pass when the corpus needed no change; silence fails the gate
- [ ] #7 /grounding-wiki:wiki-update writes the sign-off as the closing step of its pass; the skill documents that nothing else writes it by hand
- [ ] #8 The new gate is wired only where a HEAD exists to sign off against (pre-push / CI / PR head), never the per-commit path, per TASK-102's placement ruling
- [ ] #9 The enforcement sentence at root CLAUDE.md:173 / pdlc/templates/CLAUDE.md:58 names both gates and what each one can and cannot prove
- [ ] #10 Tests cover the gate's four verdicts (covered, stale sign-off, digest mismatch, absent) and the signed no-op path
- [ ] #11 Released-surface version bumps: grounding-wiki + pdlc skill versions as touched, plus the lockstep marketplace bump
<!-- AC:END -->
