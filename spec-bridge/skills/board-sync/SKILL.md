---
name: board-sync
version: 0.1.0
description: Refresh .board/links.json from an MCP-backed board (Jira) so the bridge gate has a fresh receipt to check. Use when .board.json names a requiresSync provider and the gate reports the mirror missing or stale, when the user says "sync the mirror", "refresh the board mirror", or before trusting any status claim on a Jira host.
---

# board-sync — MCP board → `.board/links.json`

**Why this skill lives in spec-bridge, not pdlc.** It maintains `.board/links.json` — the
artifact the *bridge gate* reads to decide whether a status claim outruns its evidence. That
file is spec-bridge's domain. `pdlc` owns lifecycle verbs (sweep, triage, bootstrap); it does
not own board plumbing. The rule of thumb: the plugin that READS an artifact as evidence owns
the skill that WRITES it.

**Why a skill at all.** `lib/` is network-free and MCP-free by design (invariant 4,
`docs/design/board-provider-seam.md`). A `backlog` host recomputes its mirror deterministically
with `node lib/board-mirror.mjs --check`; an MCP-backed host cannot — the projection needs a
model to make tool calls. That is exactly what `providers.jira.project === null` states at the
type level. This skill is the missing projector.

**Direction.** Board → mirror, read-only against the board. This skill never writes to Jira;
writing the reconciling edits back is `spec-bridge:sync`'s job. Keep them separate: a sync that
"fixed" the board to make its own gate pass would destroy the evidence it exists to produce.

## Precondition gate

1. **Find the project root** and read `.board.json`. If absent, or its provider's
   `requiresSync` is `false` (i.e. `backlog`), **STOP**: that host recomputes deterministically
   with `node lib/board-mirror.mjs --check --root <root>` and needs no skill. Say so and stop —
   do not "sync anyway".
2. **Validate the config.** `validateBoardConfig` (from `lib/board-mirror.mjs`) must return
   `[]`. Any problem is a **STOP with the problems printed verbatim** — notably a non-injective
   `statusMap`, which would make status verdicts depend on key order.
3. **Confirm the MCP tools are reachable** with ONE read-only call
   (`getAccessibleAtlassianResources`). If it fails, or returns HTML rather than a tool result
   (an auth wall or a WAF challenge — observed as finding F2 on this project), **STOP with the
   stated reason**. A missing MCP server is never a partial sync: a mirror written from a failed
   query is a receipt for work nobody looked at.

## Work

1. **Query the board.** JQL scoped to `projectKey`, requesting only the fields needed:
   `summary`, `status`, `description`, `labels`. Not `*all`.
2. **Page to completion.** The response is `{ issues, nextPageToken, isLast }` — token-based,
   **not** `startAt` offsets. Keep requesting with `nextPageToken` until `isLast` is `true`.
   **Verify the collected count against the reported total.** A truncated sync silently drops
   links, and a dropped link is a card the gate stops checking — a silent enforcement hole,
   which is worse than a loud failure.
3. **Read descriptions as markdown.** `contentFormat: "markdown"` on every read, and check the
   response's `appliedContentFormat` rather than assuming the format you asked for is the one
   you got. **An `html` read of the phase block is a contract violation** (`docs/board-verbs.md`
   R2): it returns the markers as escaped entities, converts the checkboxes to a native ADF
   task-list, and swallows the END marker inside the final `<li>`.
4. **Extract, per issue:**
   - `id` ← the issue key.
   - `specDir` ← the `Spec: <dir>` marker in the description.
   - `status` ← the site status mapped back to the bridge vocabulary with `toBridgeStatus`
     (`lib/board-mirror.mjs`), which prefers `statusReadMap` and falls back to inverting
     `statusMap`. Unmapped falls through unchanged, and the gate then reports `unknown` for it
     rather than guessing.
   - `acs` ← `parseSpecPhasesBlock(description)` (`lib/board-mirror.mjs`). It already tolerates
     the two normalizations Jira applies to every read: a blank line after `BEGIN`, and trailing
     whitespace on the last checkbox line.
   - `labels` ← the issue's labels. Omit the key entirely when empty, so an unlabelled link stays
     byte-identical to a pre-`labels` mirror.
5. **Skip unlinked issues.** An issue with no `Spec:` marker is not bridged work — it belongs on
   the board but not in the mirror. **Report the count** so the operator can see what was
   excluded rather than wondering.
6. **Two issues claiming the same `specDir` is a STOP, not a choice.** Observed live on
   2026-09-10: a superseded scratch card and its replacement both carried
   `Spec: specs/056-jira-provider`. `validateMirror` rejects it (`duplicate specDir: <dir>`),
   and that is the correct outcome — picking the newer, the higher-keyed, or the first-seen
   would make the gate's verdict depend on an arbitrary tiebreak nobody declared. **Report both
   issue keys and stop**; the operator un-links one. Do not write a mirror that drops either.
7. **Write the mirror** with `writeMirror`, stamping `observedAt` (now, ISO) and `observedSha`
   (`git rev-parse HEAD`) on **every** link. Never hand-edit the JSON — `writeMirror` is
   byte-deterministic and the `--check` path byte-compares.
8. **Commit it.** An uncommitted mirror is invisible to CI, which is where enforcement actually
   lives. Under a sweep's no-main-push mode, follow that mode's existing degradation (the commit
   rides the next claimed branch) — do not invent a second rule.

## Output gate

1. `node lib/board-mirror.mjs --check --root <root>` exits 0 — valid, and not stale.
2. `node spec-bridge/gates/cli.mjs check <root>` exits 0, **or** its findings are reported to the
   operator **verbatim**. This is the load-bearing one: **a sync that reveals a dishonest status
   has done its job.** It must never "fix" the board to make the gate pass. A card set Done in
   the Jira UI over unchecked `tasks.md` boxes is *supposed* to produce a blocking finding here.
3. `git status` shows the mirror committed and the tree clean.

## The write direction (`spec-bridge:sync` under Jira)

This skill does not write to Jira — but the write path shares its primitives, so the mechanics
live here where they are verified. `spec-bridge:sync` computes reconciling edits with
`planBridge`, renders them with `renderJira` (`spec-bridge/gates/bridge.mjs`), and executes the
resulting `{ tool, args, why }` list **in the returned order**. Later calls assume earlier ones
landed — the same discipline as the Backlog path, for the same reason.

**Status moves are two calls, resolved by ID.** `renderJira` emits
`{ tool: "transitionJiraIssue", args: { issueIdOrKey, status } }` naming a *target status*, not
a transition. Resolve it:

1. `listJiraIssueTransitions(issue)` — find the entry whose **`to.name`** equals the target.
2. `transitionJiraIssue(issue, transitionId)` — execute by that **`id`**.

**Never match on the transition's own `name`.** Verified live: two transitions on one workflow
share the name `Ready for Dev`, and a transition named `Closed (2)` targets the status `Closed`.
Transition names are neither unique nor equal to their target status.

**After a backwards move out of a `done`-category status, clear the resolution:**
`editJiraIssue(issue, { resolution: null })`. The forward transition into a done status silently
sets `resolution` via a workflow post-function, and the backwards move does **not** clear it —
leaving a card that reads as resolved while the bridge considers it unfinished. Verified live
(`specs/056-jira-provider/findings/phase-3-resolution-quirk.md`); the step is a harmless no-op
when no resolution was set. Note the backwards move itself was **not** blocked on that
workflow — a different Jira workflow may block it, which this step also handles.

**Resolving an AC edit against the live block.** `renderJira`'s `editJiraIssue` call carries the
**raw diff** (`acAdd`/`acRemove`/`acCheck`/`acUncheck`), not a finished description — being pure,
it cannot fetch the issue to resolve a surviving AC's text. Resolving it is the executor's job:

```
getJiraIssue(issue, markdown)  ->  parseSpecPhasesBlock(description)
                               ->  apply the raw diff
                               ->  renderSpecPhasesBlock(items)
                               ->  editJiraIssue with the rebuilt description
```

Splice the rebuilt block back **between its existing markers**, leaving every byte outside them
untouched — text outside the block is human-authored and is never modified.

**After executing, re-sync** (the Work steps above), so the mirror reflects post-edit Jira rather
than the state that motivated the edits. And assert the one-way contract: `git status` must show
**no** modification under any spec dir. Files are truth; the board is the view.

## The trust boundary

> The mirror is a receipt of what Jira said at `observedSha`. A status claim is only as good as
> the last sync. The gate can prove the mirror is stale; it cannot prove a hand-edited mirror
> entry is a lie.

State this when reporting results. An operator who believes the gate is stronger than it is will
trust a green check that means less than they think.

## Handing off

A fresh mirror makes the bridge gate meaningful again. What is now possible:
- `spec-bridge:sync` — push the reconciling edits back to the board (the write direction).
- `pdlc:sweep` — claim and drive tasks, now that their statuses are backed by a real receipt.
