---
id: TASK-72
title: 'pdlc: refactor-triage skill — eval merged work, card debt tasks onto the board'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-27 14:29'
updated_date: '2026-07-27 14:51'
labels: []
dependencies: []
ordinal: 107000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
<!-- SECTION:DESCRIPTION:BEGIN -->
Add a new pdlc skill (working name refactor-triage; refactor/debt-triage acceptable) that closes the unowned post-sweep seam: evaluate a body of merged work for tech debt and drift, triage findings with the operator, and execute accepted items onto the Backlog board as sweepable tasks. Completes the loop sweep → refactor-triage → debt tasks → next sweep.

Why pdlc and not a new plugin or team-review change: pdlc is the orchestrator plugin and the only place where invoking sibling skills (team-review, backlog CLI) is architecturally allowed — domain plugins compose only through files + gates. team-review stays as-is: its lens parameter already carries a commit range as context, so it needs zero changes; it becomes this skill's evaluation engine (second consumer after reorient's template use).

Design (agreed 2026-07-27):
- Phase 1 Scope — three entry modes: (a) --range xxx..yyy post-sweep, (b) whole-repo periodic, (c) headless/harness with args + declared triage policy instead of conversation.
- Phase 2 Evaluate — orchestrate team-review:team-review when installed, lens = 'drift and tech debt since <range>; clobbered design decisions, slap-dash conflict resolutions'. Range mode adds an intent-drift pass team-review cannot do: diff the range against the intent record (sweep runbook, each merged PR's spec, pinned docs/wiki notes); drift = merged code contradicting what those artifacts say was decided. Degrade gracefully (own eval pass) when team-review is absent.
- Phase 3 Triage — walk findings with the operator: accept / reject / defer, each with a one-line disposition recorded so the next run does not re-litigate. Harness mode applies the declared policy (e.g. auto-accept >= severity N) and records it in the triage artifact.
- Phase 4 Execute — accepted findings become backlog tasks via the CLI, each citing its finding (report path + file:line evidence), labeled (e.g. debt) and dependency-noted so they are immediately sweepable.
- Gate — usual shape per docs/skill-patterns.md: no board task without a finding it cites; no 'triage done' without the team-review report + tracked triage record existing (status can never exceed artifacts).

Explicitly out of scope: folding team-review into pdlc, rebuilding its review engine, or giving it commit-range mechanics (--since on orient.mjs is a possible evidence-backed follow-up); splitting eval-orchestration and triage-to-board into two skills (start as one, split later if harness use wants eval-only runs).
<!-- SECTION:DESCRIPTION:END -->

Spec: specs/033-refactor-triage
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 New skill pdlc/skills/refactor-triage/SKILL.md (frontmatter name/version/description) follows the precondition gate → phases → output gate shape per docs/skill-patterns.md
- [ ] #2 Three entry modes work: commit range (post-sweep), whole-repo (periodic), and headless with a declared triage policy (harness/orchestration)
- [ ] #3 Evaluate phase orchestrates team-review:team-review when installed (range rides in via the lens) and degrades to an inline eval pass when absent; team-review itself is unchanged
- [ ] #4 Range mode grounds an intent-drift pass against the sweep runbook, merged PR specs, and pinned docs/wiki notes
- [ ] #5 Triage produces a tracked triage record with an accept/reject/defer disposition and rationale for every finding
- [ ] #6 Accepted findings become backlog tasks via the CLI, each citing its finding (report + file evidence) and labeled for later sweeps
- [ ] #7 Output gate enforces: no created task without a cited finding, no completion without report + triage record
- [ ] #8 pdlc:sweep's Handing off section names refactor-triage as the post-sweep review step
- [ ] #9 Version bumps (skill + marketplace) per docs/releasing.md; tests under test/ green via node --test; wiki freshness gate and check-docs pass
- [ ] #10 Spec phase: Spec
- [ ] #11 Spec phase: Implement
- [ ] #12 Spec phase: Prove
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
dispatch: default implementer tier — doctrine-heavy skill authoring but a single cohesive deliverable bounded by nine explicit ACs and a card-recorded agreed design (runbook docs/design/refactor-triage-runbook.md, signed off 2026-07-27)
<!-- SECTION:NOTES:END -->
