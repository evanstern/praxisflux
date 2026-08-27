# The board-provider seam — one mirror interface for every ticketing system

**Status:** design of record, authored 2026-08-27 · **Epic:** TASK-108 · **Specs:** 052–056

This document is the design the five specs implement. It exists because the specs are
per-task and this decision spans all of them: it is the load-bearing choice a resuming
session must not re-derive.

## The ask

> As a developer using pdlc I want to be able to use Jira as the main board for tasks.

Two considerations came with it, and both shape the design:

1. **Spike speed.** Backlog.md's value is that carding a thought costs nothing. Whatever
   replaces it must keep that.
2. **Users and assignees matter in Jira** in a way they don't in Backlog.md.

## The problem the ask exposes

Board-status honesty is enforced today by a **Node script with no network access**:

```
turn ends  →  Stop hook  →  node spec-bridge/scripts/stop.mjs
PR opens   →  CI         →  node spec-bridge/gates/cli.mjs check <root>
```

`checkBridge()` (`spec-bridge/gates/bridge.mjs`) reads `backlog/tasks/*.md` off disk, finds
each card's `Spec: <dir>` marker, derives the spec dir's proven state, and blocks when a
status **exceeds** what the artifacts prove. Every input is a file. That is precisely why CI
can enforce it — CI just runs `node`.

Jira is not a file. It is an HTTP resource behind auth, and the only reach this suite has to
it is the **Atlassian MCP tools**, which are *model-callable only*: a Node script cannot call
them, and CI holds no Atlassian credentials. So under Jira, the gate's step 1 has nothing to
read — and it does not fail loudly. `bridgeGate.resolveRoots` keys on `hasChild("backlog")`,
so a Jira-only host resolves **zero roots** and the gate **silently no-ops**. Enforcement
evaporates without a sound, which is worse than failing.

## The decision

**One interface for all boards: a tracked mirror at `.board/links.json`.** The gate stops
knowing what a board is. Every provider projects into the same shape; the verdict engine
reads only that.

```
backlog/tasks/*.md      ──project (deterministic, in node)──▶ ┐
Jira      (MCP, in-skill; needs a model)              ──────▶ ├──▶ .board/links.json
GitHub Issues / Linear / …  (future projectors)       ──────▶ ┘         │
                                                                        ▼
                                              gate: verdict engine (node, offline)
                                              planner · Stop hook · CI  — unchanged
```

**Operator ruling (2026-08-27), recorded because it widened the scope:** unify this for
*all* board types, not just Jira — "I don't like having two pathways or sources of truth for
our tasks and where the specs live." The mirror is the interface; Backlog.md becomes a
provider behind it rather than the gate's native input.

### Why this is more than tidiness

The mirror's entry shape is **already** what the gate consumes. `findLinkedTasks()` returns
`{ id, status, specDir, acs, file }` today. Adopt that as the mirror schema and
`verdict()`, `stageVerdict()`, `planLinkedTask()`, `planBridge()`, `evaluateProjectGates()`,
and `bridgeGate` need **no logic change at all** — only their input swapped from a directory
scan to a file read. A new ticketing system then becomes a *projector*, not a fork of the
gate. That is the property that makes the seam worth building.

### The cost, stated honestly

Backlog.md does not *need* a mirror: its cards are already files the gate can read. Routing
it through one adds a file that can drift from the files beside it. That is acceptable only
because the two providers have **honestly different staleness stories**, and each gets the
strongest mechanism its nature allows:

| | Backlog.md | Jira |
|---|---|---|
| Projection | deterministic, pure node | needs a model (MCP) |
| Refresh | recomputed on demand | `board:sync` skill run |
| Drift check | **mechanized** — `--check` recomputes from `backlog/tasks/*.md` and fails on any difference | **evidentiary** — entry carries `observedAt` + `observedSha`; a stale mirror is itself a blocking finding |
| Can CI catch a hand-edited mirror? | yes, always | yes, as staleness — not as a wrong value |

A determined liar can still hand-edit a Jira mirror entry. So can a determined liar bump a
wiki pin without reading the diff — and the suite's answer there is the same: the mechanism
stops the *accident*, and the accident is what the field cases are made of. This is the
`verified_against` doctrine applied to board state, not a new kind of trust.

## The five specs

| Spec | Task | Delivers | Depends on |
|---|---|---|---|
| 052 | TASK-109 | `lib/board-mirror.mjs` — the schema, read/write, staleness, the Backlog projector, `--check` | — |
| 053 | TASK-110 | `bridge.mjs` reads the mirror; `resolveRoots` no longer keys on `backlog/`; Backlog hosts unchanged | 052 |
| 054 | TASK-111 | `.board.json` config + `pdlc:peer:jira` planted block + `plant.mjs --peer jira` | 052 |
| 055 | TASK-112 | Provider-neutral **board verb table** — the one doc every skill's board sentences resolve against | 054 |
| 056 | TASK-113 | The Jira projector: `board:sync` skill (MCP → mirror), spike defaults, assignee support | 052, 054, 055 |

Lanes: **052 → 053** is the contract-shaped spine and goes first (a published interface
unblocks consumers; its internals don't — sweep Phase 1 rule). **054** can develop in
parallel with 053 (disjoint files). **055** follows 054. **056** merges last and is the only
spec that touches MCP.

## Pre-sweep gate — do not sweep this epic until these land

Found 2026-08-27 by running `pdlc:sweep`'s own precondition gate against this host. Recorded
here because a resuming session reads the design doc before the board:

| Blocker | Why it stops this epic |
|---|---|
| **TASK-102** | `core.hooksPath` is active and `.githooks/pre-commit` runs full `node --test`, which asserts the repo passes wiki-freshness (`test/run-gates.test.mjs:20`). `docs/wiki/spec-bridge-plugin.md` pins `spec-bridge/gates/bridge.mjs`, which spec 053 Phase 1 edits — so commit 1 stales the note, reddens the suite, and blocks every later commit until the re-pin doctrine sequences **last**. Unsatisfiable. Specs 052–055 each touch pinned sources across several phases. |
| **TASK-107** | `tiers.mjs --check` proves the files say the right model, not that the harness served it — the fourth hop is still unverified (TASK-106 finding 3). A wrong pin across a 5-task lane is the lane's budget. |
| **TASK-104** | The gate reads spec dirs from the root filesystem; the sweep's claim protocol authors each spec **on a branch**, where the gate cannot see it. Recommended, less severe than the first two. |

Order: **TASK-102 → TASK-107 → TASK-104 → sweep**. TASK-105 also deps on TASK-102.

Not blocking, but worth knowing: this host ships no `scripts/check-merge-drift.mjs` (the sweep
falls back to raw git and loses claim-collision detection plus the drift matrix), and a
prunable worktree from 2026-07-31 points at a different checkout path.

## Invariants every spec inherits

1. **Backlog.md hosts see zero behavior change.** Same verdicts, same messages, same plan
   bytes. Every spec states this as an AC and proves it against the existing test suite —
   `test/spec-bridge.test.mjs`, `test/project-gates.test.mjs`, `test/phase-status.test.mjs`
   must pass unmodified. This mirrors how `vocabularyProfile` and `projectGatesProfile`
   were added: return `null`, change nothing.
2. **The board is singular.** `provider` is one value, not a list. Two boards means two
   plans of record, which is the thing artifact-grounded action forbids. Spike speed is
   solved by *config defaults*, not by a second board.
3. **The mirror is a receipt, never the source.** Jira (or `backlog/`) is the plan of
   record. The mirror records what the provider said and when. Nothing may treat the mirror
   as authoritative over its provider.
4. **The gate never touches the network.** Not in a Stop hook, not in CI, not once. Any
   design pressure toward an HTTP call inside `gates/` is a design error, not a trade-off.
5. **One TASK, one PR** (`docs/principles.md` P2). The epic TASK-108 gets no PR.

## Assignees and users — why they land in 056, not the seam

Jira's assignee is a **provider concern**, not a gate concern: no verdict depends on who
owns a card. Putting `assignee` in the mirror schema would invite the gate to grow opinions
about people. So the seam carries only what verdicts need, and 056 handles assignees where
they actually matter — at spike time (a config default), at claim time (`board:claim` sets
the assignee), and in the sweep's dispatch record. The mirror stays a status-and-artifacts
receipt.

## What this does NOT do

- It does **not** deprecate Backlog.md. Existing hosts keep it; `.pdlc` records
  `peers: ["backlog"]` and nothing about their board changes.
- It does **not** build GitHub Issues or Linear providers. The seam makes them cheap; the
  ask was Jira.
- It does **not** put MCP calls in `gates/` or in any `lib/` module. Only the 056 skill
  talks to Jira, and it talks to it as a model.
- It does **not** invent a promotion path between two boards. See invariant 2.
