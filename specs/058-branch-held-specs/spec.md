# 058 — The bridge gate must see spec dirs that live only on a branch

Board task: **TASK-104** · unblocks: **TASK-108** epic (specs 052–056)

## The problem

`deriveSpecState(specDir)` resolves every artifact through the working tree:

```js
const has = (name) => existsSync(join(specDir, name));
```

There is no git awareness in the path. So when a spec directory exists **on a task branch**
and has not merged yet, a gate run from the root checkout finds nothing and reports the task
as claiming more than it can prove:

> [spec-bridge] TASK-195 is "In Progress" but specs/115-chronicle-feed-wrap only proves
> "To Do": spec.md missing, plan.md missing, no tasks in tasks.md.

…while that directory on the branch holds a complete spec.md, plan.md and a 32-box tasks.md.

## Why this is load-bearing, not cosmetic

The suite's own claim protocol *creates* this state deliberately. `pdlc:sweep` requires the
claim commit — card flip + spec dir + link — to land **on the branch**, as its first commit.
So every task swept by this suite passes through a window where the board says In Progress
and the root filesystem has no spec dir. The gate that exists to keep status honest is blind
during exactly the window it is meant to police, and it fails in the **lenient** direction:
it reports a false "exceeds" that operators learn to ignore, which is how a gate stops being
read at all.

The two known workarounds are both worse than the gap: unlink the spec from the board until
the branch merges (disarms the gate), or land a spec stub on main before any code (splits
the atomic claim that doctrine now requires).

## Requirements

- **R1** — When a spec dir is absent from the working tree, the derivation MUST attempt to
  resolve it from git refs before concluding the artifacts do not exist.
- **R2** — A spec dir present in the working tree MUST continue to be read from the working
  tree. The working tree is the more current truth for a checkout actively working that
  spec; git is the fallback, never an override.
- **R3** — Ref search MUST cover pushed task branches (`refs/remotes/origin/task-*`) so that
  the spec is visible from **any** clone, not only the machine holding the worktree. This is
  what makes the fix work in CI.
- **R4** — Resolution MUST be read-only and MUST NOT mutate the repository: no fetch, no
  checkout, no index writes. The gate runs in a Stop hook and in CI; it may not move a
  user's HEAD or touch their staging area.
- **R5** — The derivation MUST NOT throw when git is unavailable, when the path is not a
  repository, or when no ref matches. It degrades to today's filesystem-only answer.
- **R6** — Behavior on hosts with no branch-held specs MUST be byte-identical to today.
  Every existing test in `test/spec-derive.test.mjs` and `test/phase-status.test.mjs` passes
  unchanged.
- **R7** — Git resolution MUST be bounded: results cached per (ref, path) within a run, and
  refs enumerated once. A Stop hook runs on every turn end and cannot afford a subprocess
  storm.
- **R8** — When a spec resolves from a ref rather than the working tree, the derived state
  MUST record that provenance so a caller can say *where* it read the spec from.

## Acceptance criteria

1. A spec dir that exists only on a pushed `origin/task-*` branch derives its true state
   (spec.md/plan.md/tasks.md present, boxes counted) from a root checkout that does not
   contain it.
2. A spec dir present in the working tree derives from the working tree, byte-identical to
   today, even when a ref also carries a different version of it.
3. No spec dir anywhere (neither tree nor ref) still derives as today's "To Do / nothing
   proven" — no crash, no throw.
4. Running the derivation leaves `git status`, HEAD, and the index unchanged.
5. The full existing test suite passes with no modifications to existing assertions.
6. Git resolution is cached: deriving the same branch-held spec dir twice in one process
   enumerates refs once.
7. Derived state carries provenance identifying the working tree or the specific ref the
   artifacts were read from.
8. A repository-free directory (no `.git`) derives without error.

## Out of scope

- The `.board/links.json` mirror (spec 052) and `resolveRoots`' `hasChild("backlog")` keying
  (spec 053). This spec changes **how a spec dir is read**, not how boards or roots are
  discovered.
- Reading spec dirs from arbitrary user-supplied refs. The ref set is the local HEAD plus
  pushed task branches.
- Any change to the verdict vocabulary or the status ladder.
