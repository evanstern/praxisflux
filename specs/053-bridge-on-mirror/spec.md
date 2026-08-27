# 053 — The bridge reads the mirror: gate parity for every provider

Board task: **TASK-110** · epic: **TASK-108** · design of record:
`docs/design/board-provider-seam.md` · depends on: **052** (the mirror must exist first)

## Problem

Spec 052 makes `.board/links.json` exist and be trustworthy. Nothing reads it yet. The gate
still scans `backlog/tasks/*.md`, so the silent-no-op hole is still open:

```js
// spec-bridge/gates/bridge.mjs:561
resolveRoots: (startDir) => findRootsDownwards(startDir, hasChild("backlog")),
```

A Jira-only host has no `backlog/` dir, resolves **zero roots**, and the Stop hook passes
with nothing checked. Meanwhile `checkBridge`, `verifyBridge`, and `planBridge` each call
`findLinkedTasks(root)` directly, hardcoding the board's storage into three places.

This spec closes the hole by swapping the **input**, not the logic.

## Requirements

### R1 — One board-reading seam, used by all three entry points

Introduce `boardLinks(root)` in `bridge.mjs`, the single place the bridge learns what is on
the board. Resolution order:

1. `.board/links.json` present → return its `links` (via `readMirror`).
2. No mirror, but `backlog/tasks/` present → **project it live** through
   `providers.backlog.project(root)`. This is the backward-compatibility path: an existing
   host that never adopts the mirror keeps working, byte-identically, forever.
3. Neither → `[]`.

`checkBridge`, `verifyBridge`, and `planBridge` all call `boardLinks` instead of
`findLinkedTasks`. **No other line in any of them changes.** `verdict`, `stageVerdict`,
`planLinkedTask`, `evaluateProjectGates`, `shortfall` — untouched, because the shape they
consume is identical by 052's construction.

### R2 — Root resolution stops meaning "has a backlog dir"

`bridgeGate.resolveRoots` must find a root that has **either** sentinel:

```js
hasChild(".board") || hasChild("backlog")   // expressed via a combining predicate
```

`lib/project-root.mjs`'s `hasChild` returns a predicate, so the combination belongs there or
beside it — not as an inline lambda duplicated at each call site. `spec-bridge/gates/cli.mjs`
resolves roots the same way (`findRootUpwards(resolve(target), hasChild("backlog"))`,
line 27) and must be updated in lockstep, or the CLI and the hook will disagree about what
a project is.

### R3 — A stale mirror is a blocking finding

For a `requiresSync: true` provider (Jira), the mirror is the only evidence the gate has. So
`checkBridge` runs `mirrorStaleness` and, when stale, emits **one blocking problem** naming
the reason and the fix:

```
[spec-bridge] board mirror is stale (observedSha 9f3c1a2 is not an ancestor of HEAD) —
run the board:sync skill to refresh .board/links.json before claiming status.
```

For `requiresSync: false` (Backlog), a stale mirror is **not** blocking: the live projection
in R1 step 2 is available, so the gate prefers recomputation over complaint. Reflect that
asymmetry deliberately — it is the honest-staleness table from the design doc, enforced.

### R4 — A declared-but-missing mirror is a blocking finding

If `.board.json` (spec 054) declares a `requiresSync: true` provider and `.board/links.json`
is **absent**, that is a blocking problem, not an empty board:

```
[spec-bridge] provider "jira" is declared but .board/links.json is missing — the gate has
no board evidence to check. Run the board:sync skill.
```

Fail closed: "I cannot see the board" must never render as "the board is fine". This is the
exact failure mode the whole feature exists to eliminate, so it gets its own message.

Spec 054 owns `.board.json`; this spec reads it if present and treats its absence as
"provider = backlog", so 052→053 can land and be tested before 054 merges.

### R5 — The planner's output must stay provider-neutral

`planLinkedTask` emits literal `backlog task edit …` command strings (`bridge.mjs:407`).
Under Jira those commands are meaningless. This spec does **not** rewrite the planner — that
is spec 055's verb table. What it must do is stop `planBridge` from **silently emitting
wrong commands** for a non-`backlog` provider: when the resolved provider is not `backlog`,
`planBridge` returns its computed reconciliation as **structured intents** alongside a stated
notice that command rendering is provider-specific.

Minimum shape, so 055 has something to render:

```js
{ id, statusFrom, statusTo, acAdd: [], acRemove: [], acCheck: [], acUncheck: [], note }
```

`backlog` keeps emitting today's exact command strings from those same intents — proven by
the existing planner tests passing unedited.

### R6 — Backlog.md hosts see zero behavior change

Same verdicts, same messages, same planned command bytes. `test/spec-bridge.test.mjs`,
`test/project-gates.test.mjs`, and `test/phase-status.test.mjs` pass **unmodified**. This is
the third spec in a row to carry this AC; it is the invariant that makes the seam safe to
land incrementally.

## Non-goals

- **Does not** add the Jira provider or any MCP call. Spec 056.
- **Does not** define the provider-neutral verb vocabulary. Spec 055.
- **Does not** change how status is *derived* from spec artifacts. `lib/spec-derive.mjs` is
  untouched — the derivation half of the bridge was never provider-coupled.
- **Does not** make the gate write anything. `gates/` stays read-only
  (`docs/skill-patterns.md` §5).

## Acceptance criteria

1. `boardLinks(root)` exists and implements R1's three-step resolution; `checkBridge`,
   `verifyBridge`, and `planBridge` each call it and no longer call `findLinkedTasks`
   directly.
2. A host with **only** `backlog/tasks/` (no mirror) produces verdicts, messages, and
   planned commands **byte-identical** to today — proven by the existing suite passing
   unedited.
3. A host with **only** `.board/links.json` produces the same verdicts for equivalent board
   state — proven by a fixture pair: one Backlog-dir project and one mirror-only project
   with matching content, asserted to yield identical `problems` and `warnings`.
4. `bridgeGate.resolveRoots` resolves a `.board/`-only root, a `backlog/`-only root, and a
   root with both; `spec-bridge/gates/cli.mjs` resolves identically (asserted for all three).
5. A stale `requiresSync: true` mirror yields exactly one blocking problem naming the
   staleness reason and the refresh action.
6. A stale `requiresSync: false` mirror yields **no** staleness problem (the live projection
   is preferred).
7. A declared `requiresSync: true` provider with an absent mirror yields the R4 blocking
   problem — asserted by message content, so the fail-closed path can never be mistaken for
   an empty board.
8. `planBridge` returns structured intents for a non-`backlog` provider plus the stated
   notice; for `backlog` it returns today's exact command strings.
9. `test/spec-bridge.test.mjs`, `test/project-gates.test.mjs`, `test/phase-status.test.mjs`
   pass **with no edits to those files**.
10. New coverage in `test/board-mirror.test.mjs` (or a sibling) for ACs 3–8, and `docs/wiki/`
    re-pinned for every note whose `sources:` this change touches — at minimum
    `spec-bridge-plugin`, `gates-convention`, `project-root`.
