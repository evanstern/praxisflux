---
name: board-provider-seam
description: The board provider seam (specs 052-056) — how spec-bridge's gate reads a board it cannot recompute. A providers registry keyed on requiresSync, the .board/links.json mirror as the single read surface, two status maps with deliberately different shapes, and the MCP-free boundary that puts Jira's projection in a skill rather than lib/.
kind: component
sources:
  - lib/board-mirror.mjs
  - spec-bridge/gates/bridge.mjs
  - spec-bridge/skills/board-sync/SKILL.md
  - docs/board-verbs.md
  - docs/design/board-provider-seam.md
verified_against: 409422e7533e6313aae100e406789704daf9b6bd
---

# The board provider seam

Split from [[spec-bridge-plugin]] (spec 056) — the bridge gate's premise is that a task's
status can be compared against the artifacts that prove it, and that comparison needs the
board's state. When the board is Backlog.md, the state is files in the repo. When it is Jira,
it is behind an API. This note is how one gate serves both.

## The mirror is the only read surface

 — the **mirror** (spec 052) — is what the gate reads. Never the provider.
Each link carries `id`, `status`, `specDir`, `acs`, optional `labels`, and for
MCP-backed providers `observedAt`/`observedSha`. `writeMirror` is byte-deterministic
(explicit key order, sorted links, trailing newline) so `--check` can byte-compare.

The gate therefore has exactly one shape to understand, and adding a provider never touches
the gate.

## `providers`, keyed on `requiresSync`

```js
export const providers = {
  backlog: { requiresSync: false, project: projectBacklog },
  jira:    { requiresSync: true,  project: null },
};
```

The **type of `project`** carries the distinction, so no `if (provider === "…")` branch
belongs anywhere:

- `requiresSync: false` — the projection is deterministic. `project(root)` recomputes it
  from `backlog/tasks/*.md` and `--check` byte-compares against disk, so drift is
  *detectable*. A stale mirror is deliberately **not** blocking here: the live projection is
  preferred over the stale receipt, so the gate recomputes instead of complaining.
- `requiresSync: true` — no node-only recompute exists, so `project` is `null` and the
  mirror **is** the evidence. A stale one **blocks**. Same staleness fact, opposite
  consequence — that asymmetry is the design, not an inconsistency.

Registering `jira` is what activates every staleness and missing-mirror path specs 052-053
had already built. That is the whole diff a new provider needs on the `lib/` side.

## The MCP-free boundary

`lib/` and `gates/` make **no network or MCP calls** (design invariant 4). A Jira
projection needs tool calls, so it lives in the **`spec-bridge:board-sync` skill** — a model
does what `node` cannot. The skill belongs to spec-bridge rather than pdlc by the rule *the
plugin that reads an artifact as evidence owns the skill that writes it*.

This keeps the gate testable offline and CI-runnable with no credentials.

## Two status maps, different shapes on purpose

A real workflow had **fifteen** statuses against the bridge's three (`RANK`: to do / in
progress / done). One field cannot honestly carry both directions:

```
bridge status ──statusMap──▶ site status      WRITE: injective, one canonical target
site status ──statusReadMap──▶ bridge status  READ:  many-to-one BY DESIGN
```

`validateBoardConfig` **rejects a non-injective `statusMap`**, naming the colliding pair —
a silent first-wins would make verdicts depend on key order. `statusReadMap` is deliberately
**exempt** from that check, because collapsing many statuses onto three is its job. Both fall
through unchanged on a miss, so a host with neither field behaves exactly as before either
existed. This composes with `.spec-bridge.json`'s `statusVocabulary`:
`derivation stage ──statusVocabulary──▶ bridge status ──statusMap──▶ site status`.

## The write direction describes; it never dispatches

`renderJira(id, intents, config)` returns ordered `{ tool, args, why }` descriptions and
makes no calls — that is what keeps the gate pure. Because it is pure it cannot resolve a
surviving AC's text against the live issue, so its `editJiraIssue` entry carries the **raw
diff**. Resolving it is the skill's job:
`getJiraIssue → parseSpecPhasesBlock → apply → renderSpecPhasesBlock → write`.

Executing in the **returned order** is load-bearing: later calls assume earlier ones landed.

## The trust boundary

> The mirror is a receipt of what the board said at `observedSha`. A status claim is only as
> good as the last sync. The gate can prove the mirror is stale; it cannot prove a hand-edited
> mirror entry is a lie.

The same honesty [[grounding-wiki-plugin]]'s `verified_against` pins carry. What the seam
*does* buy is the case it was built for, verified live: a card moved to Done in the Jira UI
over unchecked `tasks.md` boxes produces a **blocking** finding — while
`board-mirror --check` exits 0, because the mirror is valid and fresh. The dishonesty is a
status outrunning its evidence, not a broken artifact, so only the bridge gate sees it.

## Connections

- [[spec-bridge-plugin]] — the gate and skills this seam serves; the parent of this note.
- [[gates-convention]] — the fail-closed convention the staleness rules follow.
- [[pdlc-grounding-block]] — the planted `pdlc:peer:jira` block stating the same boundary
  to an operator.
