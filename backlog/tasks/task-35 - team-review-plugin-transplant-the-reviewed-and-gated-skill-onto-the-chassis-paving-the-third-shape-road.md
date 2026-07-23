---
id: TASK-35
title: >-
  team-review plugin: transplant the reviewed-and-gated skill onto the chassis,
  paving the third-shape road
status: To Do
assignee: []
created_date: '2026-07-23 05:15'
labels: []
dependencies: []
priority: high
ordinal: 67000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Adopt team-review — the lead+subagent codebase-review skill developed and hardened outside this repo (v0.4.0 at ~/.claude/skills/team-review) — as a praxisflux marketplace plugin. The skill was battle-tested through three graded eval iterations (6/6 shepherded → 8/9 → 10/10 unshepherded; workspace at ~/.claude/skills/team-review-workspace) and already speaks this repo's conventions: precondition gate → work → output gate, gates/ never writes, scripts/ is the only mutator, run records ride the gitignored .handoff/ transport at the INVOKING root, and its vendored stop/finish machinery mirrors the @praxisflux/gates contract ({name, resolveRoots, check}; stdin JSON; exit 0 allow / 2 block) precisely so this transplant is a move, not a rewrite.

SPEC INPUT: the skill reviewed THIS repo through its own gate (run praxis-2026-07-23-04-51-15, target @ e2a99b9, 10/10 assertions) — report at ~/.claude/skills/team-review-workspace/iteration-3/eval-1-praxis-fresh-eyes/with_skill/outputs/review.md (+ process-log.md). That report is this task's design input and must be vendored into the repo by the PR. Its load-bearing findings for this task: (1) gen-marketplace.mjs only re-syncs registered entries and silently no-ops on a new plugin dir (scripts/gen-marketplace.mjs:15-21), contradicting the skill-patterns checklist step 1; (2) team-review is a third placement shape — caller-supplied target, state at the invoking root — that docs/skill-patterns.md §6 does not name, and lib/handoff.mjs ensureGitignore is only safe rooted at the invoking project; (3) the right scaffolding template is spec-bridge (read-only truth + separate write surface) plus pdlc's invoking-root installer toolkit, with NO lifecycle, NO planted CLAUDE.md, and the gate IN-SKILL (a target-installed Stop hook would itself be the forbidden write).

Shape of the transplant: team-review/{.claude-plugin/plugin.json, skills/team-review/SKILL.md (v1.0.0), gates/review.mjs, scripts/{run.mjs,orient.mjs,stop.mjs,gate.sh}, hooks/hooks.json, lib -> ../lib symlink}; swap the vendored ~30-line stop-runner for lib/gate-runner.mjs runStopHook + lib/cli.mjs runAsCli; keep gitSnapshot/checkReview/runsDirFor domain logic. Subtasks carry the paved-road fixes the review demands so the next plugin author does not hit them. Out-of-scope follow-ups (need separate approval per scope discipline): new-plugin.mjs scaffolder (review idea 6); the build/-stub listing decision; docs/handoffs vs .handoff naming collision.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 team-review installs from the marketplace and its skill runs end-to-end (begin → review → finish) against a sample target with the target untouched
- [ ] #2 The iteration-3 review report + process log are vendored into the repo as this task's spec input, at a documented location
- [ ] #3 Vendored runner replaced by lib/gate-runner.mjs + lib/cli.mjs; gates/ still provably write-free; node --test covers checkReview (sections, citations, untouched) and the run lifecycle (begin/finish/abandon/collision)
- [ ] #4 docs/skill-patterns.md §6 names the third placement model (caller-supplied target, state at invoking root) with the handoff rooting rule inline
- [ ] #5 gen-marketplace.mjs registers unregistered plugin dirs (checklist step 1 becomes true as written), with a drift test
- [ ] #6 marketplace.json entry, README row, marketplace version bump, and skill version 1.0.0 per docs/releasing.md; wiki-update pass green
<!-- AC:END -->
