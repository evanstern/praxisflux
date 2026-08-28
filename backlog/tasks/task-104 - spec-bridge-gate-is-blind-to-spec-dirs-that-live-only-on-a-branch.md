---
id: TASK-104
title: spec-bridge gate is blind to spec dirs that live only on a branch
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-03 19:31'
updated_date: '2026-08-28 18:05'
labels: []
dependencies: []
ordinal: 136000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The spec-bridge gate decides whether a board task's status is honest by reading the spec
directory off the filesystem. When the spec lives on a task branch and hasn't merged yet,
the gate looks at the project root, finds nothing, and reports a task as claiming more
than it can prove — even though the spec, plan and tasks are all complete on the branch.

## Use cases

- As a maintainer working a spec on a task branch, I want the gate to see the spec I am
  actually working on, so it stops telling me a finished spec is missing.
- As an operator running a freeform or polish session, I want to escalate an item to a
  spec mid-session without being forced to either unlink it from the board or merge
  unreviewed code onto main just so a gate can see it.
- As a plugin author, I want the gate's spec resolution to match the claim protocol the
  suite already teaches, which explicitly expects a spec dir to exist on a branch before
  it lands.

## What happens today

`deriveSpecState(specDir)` in `lib/spec-derive.mjs` (line ~148) resolves everything through
`existsSync` / `readFileSync` on a working-tree path:

```js
const has = (name) => existsSync(join(specDir, name));
```

There is no git awareness anywhere in the path. The Stop gate consequently fires:

> [spec-bridge] TASK-195 is "In Progress" but specs/115-chronicle-feed-wrap only proves
> "To Do": spec.md missing, plan.md missing, no tasks in tasks.md.

…while that spec directory contains a complete spec.md, plan.md, research.md,
data-model.md, contracts/ and a 32-task tasks.md with 31 ticked — on the branch.

## Precedent for the fix

promptworld's own claim gate had exactly this hole and closed it in its spec 111:
`branchHeldSpecNumbers` in `scripts/check-merge-drift.mjs` enumerates
`refs/remotes/origin/task-*` and reads each branch's tree with `git ls-tree`, so a pushed
branch's spec directory is visible to every clone. The same shape applies here — read the
spec dir at a ref with `git show <ref>:<path>` when it is absent from the working tree.

## Notes

- Found in promptworld on 2026-08-03 (its TASK-195 / spec 115). Worked around there by
  unlinking the spec from the board until the branch merges, plus a repo-level rule that a
  session which might escalate lands its spec stub on main before any code. Both are
  workarounds for this gap, not fixes.
- Worth checking whether the same filesystem-only assumption affects the `link` skill's
  phase-AC seeding and `sync`, which read the same derivation.
- The gate should stay conservative: if a spec cannot be found at any ref either, today's
  behavior is correct and should not change.

Spec: specs/058-branch-held-specs
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The gate derives spec state for a spec directory that exists only on a pushed task branch, not solely from the project root's working tree
- [ ] #2 A task linked to a branch-only spec no longer reports as exceeding its artifacts when those artifacts are complete on the branch
- [ ] #3 A spec directory that exists at no ref and no working tree still derives as today — the gate does not become permissive
- [ ] #4 The branch-aware resolution is covered by a test using a real git fixture, following the repo's existing gate-test pattern
- [ ] #5 Spec phase: Phase 1 — the git spec-source resolver
- [ ] #6 Spec phase: Phase 2 — wire the resolver into the derivation
- [ ] #7 Spec phase: Phase 3 — prove the branch-held scenario
- [ ] #8 Spec phase: Phase 4 — grounding and release
<!-- AC:END -->



## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Widen deriveSpecState's two I/O closures (has/read) behind a resolver that falls back to git when the spec dir is absent from the working tree. Phase 1: lib/spec-source.mjs + unit tests against a real scratch repo. Phase 2: wire into deriveSpecState, existing tests untouched. Phase 3: prove the branch-held scenario end to end. Phase 4: grounding re-pins + version bump. Spec: specs/058-branch-held-specs.
<!-- SECTION:PLAN:END -->
