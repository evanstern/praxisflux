---
id: TASK-104
title: spec-bridge gate is blind to spec dirs that live only on a branch
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-03 19:31'
updated_date: '2026-08-28 18:46'
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
- [x] #5 Spec phase: Phase 1 — the git spec-source resolver
- [x] #6 Spec phase: Phase 2 — wire the resolver into the derivation
- [x] #7 Spec phase: Phase 3 — prove the branch-held scenario
- [x] #8 Spec phase: Phase 4 — grounding and release
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Widen deriveSpecState's two I/O closures (has/read) behind a resolver that falls back to git when the spec dir is absent from the working tree. Phase 1: lib/spec-source.mjs + unit tests against a real scratch repo. Phase 2: wire into deriveSpecState, existing tests untouched. Phase 3: prove the branch-held scenario end to end. Phase 4: grounding re-pins + version bump. Spec: specs/058-branch-held-specs.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dispatch tier record (sweep doctrine): all phases of spec 058 dispatched at the **sonnet** tier, model `cc/claude-sonnet-5[1m]` — the `defaultTier` in .claude/model-tiers.json. Justification: the spec settles the judgment calls; this is implementation to a written contract, not design work. No escalation to `opus` (escalation: true) was needed or taken.

Served-model verification: the router request ledger confirms `claude-sonnet-5` actually served the dispatches, not the orchestrator's session model. This is the TASK-107 method applied per-dispatch rather than trusted from the agent's self-report.

Phase 1 complete (commit 0608633): lib/spec-source.mjs + test/spec-source.test.mjs (6 tests, real scratch git repos, no mocks) + README chassis-list entry. Suite 437 -> 443, all green. Phase 1 also caught a case the spec did not anticipate: on macOS `git rev-parse --show-toplevel` returns a realpath'd root while mkdtempSync/cwd can return the /var symlink form, so the repo-relative path had to be normalized through realpathSync or no ref would ever match.

Phase 2 dispatched: wire the resolver into deriveSpecState's two closures.

Phase 2 complete (commit c05631c): deriveSpecState's two fs-backed closures replaced by resolveSpecSource(specDir), with `source` threaded through additively. Net +3/-7 lines in lib/spec-derive.mjs — no derivation rule touched, no existing test assertion edited. Suite 443/443 green.

PROOF the fix actually works (the whole point of TASK-104), run from the CLEAN ROOT checkout on main, where specs/058-branch-held-specs does NOT exist on disk:
  status : In Progress
  stage  : implementing
  boxes  : 0/24   phases: 4
  source : {"kind":"ref","ref":"refs/remotes/origin/task-104-branch-held-specs"}
Before this change the same call derived "To Do / specifying / 0 of 0" — the false "exceeds" the gate has been reporting. The gate can now see a spec that lives only on an unmerged branch.

Method note: the first attempt at this proof was INVALID — it imported lib/spec-derive.mjs from the root checkout (still main's pre-fix code) and so measured the old behavior. Re-run importing the worktree's module with cwd set to the root. Verify which build you are exercising before believing a before/after.

Phase 3 dispatched: integration tests for AC1-AC8 through deriveSpecState.

Phases 3 and 4 complete; PR #130 open (https://github.com/evanstern/praxisflux/pull/130).

Phase 3 (1b3e6f8): 6 integration tests through deriveSpecState covering AC1-AC8 — branch-held derivation, worktree-wins-over-ref, absent-everywhere, repo-unchanged (git status + HEAD + raw .git/index bytes), no-.git, refs-enumerated-once across the caller boundary, and source provenance. Real scratch git repos, no mocks. Suite 443 -> 449.

Phase 4 (70716f9 + 0d8685f): grounding and release. Two notes amended after reading their real source diffs, then re-pinned. The 0.58.0 bump then staled 11 MORE notes (it touches every plugin.json) — the released-surface re-pin volume the handoff warned about. Classified with the plan command: 7 RE-PIN-ONLY applied from its emitted commands; the 4 NEEDS-REVIEW checked individually for current-version literals (none quotes one — they say "lockstep with the marketplace version", still true, or cite versions as history) before their pins moved. No pin moved without its diff being read.

spec-bridge-plugin.md took a size_budget_exempt at 8455/8000. It was at 7998/8000 — 2 chars of headroom — and the resolver is load-bearing for every verdict it describes. The splittable unit is ~500 chars, under the ~1,500 minimum-content counter-rule, so a split would butcher it; trims were tried first and bought ~30 chars each. Exemption names TASK-103/95's owed split as the exit.

Gates at PR: suite 449/449, freshness exit 0 (40 notes fresh), check-docs exit 0, version-bump 0.57.0 -> 0.58.0 ok.

Two host facts cost real time and are now recorded in docs/design/jira-board-runbook.md so the next session does not repay them: (1) the suite runs as bare `node --test` — passing a path makes node resolve `test` as a MODULE and die with MODULE_NOT_FOUND, which reads as a red suite but is not; this produced three wrong conclusions before .githooks/pre-commit was read. (2) grep suppresses matches in spec-bridge/gates/bridge.mjs because a literal NUL at line 217 marks the file binary — it prints "Binary file ... matches" with no line numbers; spec 053 edits that file directly.
<!-- SECTION:NOTES:END -->
