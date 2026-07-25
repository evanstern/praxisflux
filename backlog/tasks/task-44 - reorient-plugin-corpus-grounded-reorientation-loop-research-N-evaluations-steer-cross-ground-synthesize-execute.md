---
id: TASK-44
title: >-
  reorient plugin: corpus-grounded reorientation loop (research -> N evaluations
  -> steer -> cross-ground -> synthesize -> execute)
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-25 05:22'
updated_date: '2026-07-25 05:32'
labels: []
dependencies: []
ordinal: 79000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Formalize the operator-steered reorientation process proven live in the promptworld learning-game session (2026-07-25): pick N research-vault branches (or ad-hoc corpus dirs) + a stated lens; fan out one evaluator subagent per branch grounded against the host project's wiki and board where present; checkpoint operator steering rounds relayed into the same agents; cross-ground evaluators against each other's converged drafts; write per-branch analysis notes (vault isolation respected); lead writes the cross-corpus synthesis outside the vault with decisions table, build-ordered course of action, refactor assessment, board-move table, open questions; approved moves execute via the host board CLI. Everything-optional dependency posture: research vault, docs/wiki, and Backlog board are each auto-detected; the run manifest records what was available and the skill states its degradation when absent. Shape: one orchestrator skill + tracked run in .handoff/reorient/runs (team-review precedent, caller-supplied-target placement rooted at the invoking project), begin/finish state writer in scripts/, read-only verification in gates/.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Plugin scaffolded per docs/skill-patterns.md checklist (plugin.json, marketplace entry, README row, lib symlink) and passes check-docs.mjs + gen-marketplace --check + sync-version --check
- [x] #2 SKILL.md orchestrator covers all six phases in gate->work->gate shape with everything-optional grounding detection, structured evaluator report template, steering-round protocol, isolation-safe cross-grounding, synthesis section contract, and inline fallbacks for every referenced script
- [x] #3 Run tracker (scripts/run.mjs begin/finish/abandon) writes .handoff/reorient/runs at the invoking root only; gates/ verifies runs read-only (manifest vs artifacts: per-branch analyses, synthesis sections, decisions recorded) and never writes
- [x] #4 Tests under test/ cover the run tracker and gate; node --test green
- [ ] #5 Docs synced: README + wiki note for reorient (freshness gate green); marketplace version bumped per docs/releasing.md
- [ ] #6 Per-task course at docs/courses/TASK-XX passing the course gate
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Scaffold via scripts/new-plugin.mjs reorient --with-gate; commit the stamped surface. 2. Write scripts/run.mjs (begin/finish/abandon; run manifest records lens, corpus branches, detected grounding surfaces: vault/wiki/board) mirroring team-review's tracker on lib/handoff.mjs. 3. Wire gates/reorient.mjs: read-only run verification — manifest vs artifacts (per-branch analysis notes exist where vault mode was declared, synthesis file has required sections, decisions recorded) + invoking-root-only residue. 4. Author SKILL.md: six-phase orchestrator (frame / evaluate xN / steer / cross-ground / synthesize / reorient-execute) in gate->work->gate shape, everything-optional grounding detection with stated degradation, evaluator report template, steering protocol (decisions-as-constraints relay to same agents), isolation-safe cross-grounding, synthesis contract, no-subagent + hand-copied fallbacks. 5. Tests under test/. 6. Version bumps + marketplace + README row verified (check-docs, gen-marketplace --check, sync-version --check). 7. Wiki note for reorient + freshness gate. 8. Per-task course docs/courses/TASK-44. 9. PR (merge-commit flow).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Slice 1 committed: plugin core (gate/tracker/skill), 9 reorient tests + install-path fixture, full suite 157 green, drift gates green, v0.11.0. Remaining: wiki note + course + PR.
<!-- SECTION:NOTES:END -->
