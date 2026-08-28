# Handoff — Jira as the main board (TASK-108 epic)

**Written:** 2026-08-28 · **For:** a fresh session picking up the goal below · **Repo state at
handoff:** root on `main` at `247a1fb`, clean, pushed, marketplace **v0.57.0**

## The goal (still active)

> As a developer using pdlc I want to be able to use Jira as the main board for tasks.

Two operator considerations that shape the design:

1. **Spike speed.** Backlog.md's value is that carding a thought costs nothing. Whatever
   replaces it must keep that.
2. **Users and assignees matter in Jira** in a way they don't in Backlog.md.

**Operator ruling (2026-08-27) that widened it:** unify the mechanism for **all** board types,
not just Jira — *"I don't like having two pathways or sources of truth for our tasks and where
the specs live."*

## Read these first, in this order

1. `docs/design/board-provider-seam.md` — the **design of record**. The decision, the honest
   cost table, the lanes, and five invariants every spec inherits. Do not re-derive it.
2. `specs/052-board-adapter-seam/spec.md` — the contract-shaped spine.
3. This file's **"What a fresh session must not repeat"** section below.

## The design in one paragraph

Board-status honesty is enforced by a **Node script with no network** (Stop hook + CI). It
reads `backlog/tasks/*.md` off disk, so it cannot see Jira — the Atlassian MCP tools are
model-callable only, and CI holds no credentials. Worse, it fails **silently**:
`bridgeGate.resolveRoots` keys on `hasChild("backlog")`, so a Jira-only host resolves zero
roots and the gate passes with nothing checked. The fix is a tracked mirror,
`.board/links.json`, that every provider projects into; the verdict engine reads only that.
Backlog.md becomes a provider behind the same interface rather than the gate's native input.

## Work breakdown — all specs authored, none implemented

| Spec | Task | Delivers | Deps |
|---|---|---|---|
| 052 | TASK-109 | `lib/board-mirror.mjs` — schema, read/write/validate, staleness, Backlog projector, `--check` | — |
| 053 | TASK-110 | `bridge.mjs` reads the mirror; fail-closed on stale/missing board | 109 |
| 054 | TASK-111 | `.board.json` config + `pdlc:peer:jira` planted block + `--peer jira` | 109 |
| 055 | TASK-112 | `docs/board-verbs.md` — skills name intents, not CLIs | 111 |
| 056 | TASK-113 | Jira provider: `board:sync` skill, one-call spiking, assignees | 109, 111, 112 |

**TASK-108** is the epic and gets **no PR** (`docs/principles.md` P2). Each spec dir has
`spec.md` + `plan.md` + `tasks.md` with phased checkboxes; each card carries 10 ACs.

**Lanes:** 052 → 053 is the spine and goes first. 054 develops in parallel with 053 (disjoint
files). 055 follows 054. 056 merges last and is the only spec touching MCP.

## Before sweeping — the gate is mechanical, not advisory

TASK-108 and TASK-109 both depend on **TASK-107** and **TASK-104**. Since 110–113 all reach
109, no task in the epic is claimable until those land. That wiring is deliberate; don't
route around it.

| Blocker | Status | What it costs |
|---|---|---|
| ~~TASK-102~~ | **Done** — PR #129, v0.57.0 | The repo-state wedge. Removed. |
| **TASK-107** | To Do | ~10 min. One throwaway dispatch per tier, comparing the served model against `.claude/model-tiers.json`. **Needs a session started after the last tier regeneration** — the agent registry is read at session start. |
| **TASK-104** | To Do | The bridge reads spec dirs from the root filesystem; the sweep's claim protocol authors each spec **on a branch**, where the gate can't see it. Recommended, less severe than 107. |

Also true of this host, recorded so it isn't rediscovered:

- **No `scripts/check-merge-drift.mjs`.** The sweep falls back to raw git and loses
  claim-collision detection plus the drift matrix.
- **`.specify/` is absent.** Spec Kit artifacts are hand-authored under the sweep runbook's
  operator-signed escape line. The five specs above were authored that way.

## What a fresh session must not repeat

**Verify the tool before believing what it says.** Ratified as a standing rule 2026-08-28.
Four times in one session a tool's answer looked settled and was wrong: `core.hooksPath`
pointed at a nonexistent directory so hooks ran *nothing*; a green `tiers.mjs --check` proves
the file names a model, not that the harness served it; an unquoted shell variable made four
stale notes look fresh; a broken loop reported all eight gates failing seconds after they
passed. Prove a hook fires by making it block something. Prove a pin serves by reading the
transcript. When a result is implausibly uniform, suspect the harness and re-run one case
directly.

**The claim is atomic.** Card flip + spec dir + `spec-bridge:link` in **one commit on the
branch**. Two-track landing's "board commits direct to `main`" covers notes, AC ticks, labels,
and new cards — **never** the status flip that claims a task, which is deliverable state. This
is now planted doctrine (`pdlc/skills/sweep/SKILL.md` claim step; the `pdlc:peer:backlog`
block). Splitting it in this session put root and branch in different states and produced
**~50 gate findings from one status flip**.

**Re-pin volume is larger than it looks.** A marketplace version bump touches every
`plugin.json`, so a released-surface PR can stale ~17 notes. Use the classifier —
`node grounding-wiki/gates/cli.mjs plan . docs/wiki` — which computes RE-PIN-ONLY vs
NEEDS-REVIEW and prints executable re-pin commands for the safe half. Amend prose **before**
moving a pin; a merge commit is the *target* of an honest re-pin, never its *justification*.

**Note budgets bite.** Several notes sit near the 8,000-char cap and capsules near 500. When
an addition overflows, take the summary-style split or a genuine trim — `size_budget_exempt`
is for content that cannot be split, not for prose you just added.

## The one open risk in the design

**Spec 056 Phase 1 is a knowledge-only phase, and it must run first.** Spec 055's entire
phase-AC mechanism assumes HTML comment markers (`<!-- spec-phases BEGIN -->`) survive a Jira
description write→read cycle. That is **untested**. Phase 1 tests it against a scratch issue in
both `markdown` and `adf` content formats. **If the markers do not survive: stop and surface
it** — a delimiter change amends spec 055; it is not a local workaround.

Two Jira mechanics worth confirming in that same phase, both classic integration failures:
`transitionJiraIssue` takes a transition **id**, not a status name (so a status move is two
calls), and a set `resolution` can block a backwards transition — which the bridge *does*
perform when a regenerated `tasks.md` moves a card back.

## Starting the work

```sh
backlog task view TASK-107 --plain     # do this first, in a fresh session
backlog task view TASK-104 --plain
# then:
/pdlc:sweep  →  "sweep TASK-109 through TASK-113"
```

The sweep will author its own runbook from the five cards and ask for lane sign-off before
executing. Its Phase 1 reads `.claude/model-tiers.json` for tiers — the default is `sonnet`;
`opus` is escalation-gated and needs a recorded operator checkpoint before dispatch.
