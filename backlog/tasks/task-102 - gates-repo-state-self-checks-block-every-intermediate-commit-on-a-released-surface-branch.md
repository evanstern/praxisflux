---
id: TASK-102
title: >-
  gates: repo-state self-checks block every intermediate commit on a
  released-surface branch
status: To Do
assignee: []
created_date: '2026-08-03 02:12'
labels:
  - debt
  - gates
  - tests
dependencies: []
priority: high
ordinal: 134000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in execution during the gates+doctrine sweep (2026-08-02): TASK-100 Phase 1, reproduced independently by TASK-93 Phase 2. Runbook amendment 1 in docs/design/gates-and-doctrine-sweep-runbook.md records the interim softening this card retires.

Two of this repo's own rules are mutually unsatisfiable for any multi-commit task touching released surface:

(1) Doctrine sequences the wiki re-pin to AFTER the commit that touched the sources (one docs-only re-pin commit at the end), and the version bump to merge-readiness.

(2) .githooks/pre-commit runs the full 'node --test', which includes test/run-gates.test.mjs:22 asserting 'the praxisflux repo itself passes spec-bridge and wiki-freshness'. .githooks/pre-push independently runs the freshness gate AND check-version-bump.

So the first commit touching a pinned source turns 'node --test' red, and every subsequent commit and push on that branch is blocked until the re-pin and bump land - which doctrine says must come last. The only ways through are --no-verify, re-pinning dishonestly mid-task, or abandoning phase-scoped commits.

Why it matters: this is almost certainly the mechanism behind TASK-100's field case. specs/048's branch carries several source-touching commits before its re-pin commit 67f1172, and TASK-100 records the result - '254 pass, 0 fail' reported and ticked while four notes were staled and the freshness gate was red. The report was true when run and false once committed. A hook that cannot be satisfied trains sessions to bypass it, and a bypassed gate reports green while proving nothing.

Shape (not prescriptive - the spec decides): run-gates.test.mjs:22 is a repo-STATE self-check, not a test of code behavior. Mid-PR redness there is correct by construction. Candidate fix: move repo-state self-checks out of the per-commit path into pre-push/CI, where end-state invariants belong, leaving 'node --test' to test code. Note the same shape one level up in check-version-bump on pre-push: correct as a CI mirror, but it blocks intermediate pushes and so defeats the sweep's push-immediately-for-auditability rule.

Relationship to TASK-100: same confusion (treating red-by-construction as broken), one level down. Deliberately NOT folded into TASK-100 - that card is about ticks vs gates, and widening it would be scope creep.
<!-- SECTION:DESCRIPTION:END -->
