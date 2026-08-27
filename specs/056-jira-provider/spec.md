# 056 — The Jira provider: `board:sync`, spike defaults, assignees

Board task: **TASK-113** · epic: **TASK-108** · design of record:
`docs/design/board-provider-seam.md` · depends on: **052** (mirror), **054** (config),
**055** (verb table + renderer)

## Problem

Everything is in place except the provider itself. After 052–055:

- the gate reads `.board/links.json` and blocks on a stale or missing one (053 R3/R4),
- `.board.json` declares `provider: "jira"` with site coordinates (054),
- verbs resolve to MCP tools and `renderJira` describes the calls (055).

But nothing **makes** those calls. `providers.jira` does not exist, so a Jira host's gate
reports "provider declared but mirror missing" forever, correctly and uselessly. There is no
way to refresh the mirror, and no way to spike a card.

This spec supplies the model-side half — the part that cannot live in `lib/` because it needs
MCP, and therefore needs a **skill**.

## Requirements

### R1 — Register `providers.jira` as `requiresSync: true`

```js
jira: { requiresSync: true, project: null }
```

`project: null` is not an omission; it is the **type-level statement** that this provider
cannot be projected by `node` alone. Spec 052 R5 already keys `--check`'s behavior on it, and
053 R3/R4 key the staleness and missing-mirror findings on it. Registering the provider is
what activates every one of those paths.

No other `lib/` change. `lib/` stays network-free and MCP-free (design invariant 4).

### R2 — `board:sync` skill: Jira → mirror

A new skill (home: **`spec-bridge/skills/board-sync/`** — it maintains the artifact the
bridge gate reads, which is spec-bridge's domain; `pdlc` owns lifecycle verbs, not board
plumbing). Shape follows the repo's gate → work → gate skill pattern
(`docs/skill-patterns.md`).

**Precondition gate:**
1. `.board.json` present with a `requiresSync: true` provider. Otherwise STOP — a `backlog`
   host recomputes with `board-mirror --check` and needs no skill.
2. `validateBoardConfig` clean; the Atlassian MCP tools reachable. A missing MCP server is a
   **stop with a stated reason**, never a partial sync.

**Work:**
1. Query the project's open work: JQL over `projectKey`, statuses per `statusMap`.
2. For each issue, extract: key (→ `id`), status (reverse-mapped through `statusMap` to the
   **bridge's** vocabulary), the `Spec: <dir>` marker from the description, the
   `<!-- spec-phases -->` block (→ `acs` via 055's parser), and labels (→ `labels`).
3. **Skip unlinked issues.** An issue with no `Spec:` marker is not bridged work; it belongs
   on the board but not in the mirror. Report the count so the operator can see it.
4. Build the mirror and write it with `writeMirror`, stamping `observedAt` and `observedSha`
   (`git rev-parse HEAD`) on every link.
5. Commit the mirror. It is tracked evidence — an unsynced-but-uncommitted mirror is invisible
   to CI, which is where enforcement lives.

**Output gate:**
1. `node lib/board-mirror.mjs --check --root <root>` exits 0 (valid and not stale).
2. `node spec-bridge/gates/cli.mjs check <root>` exits 0, **or** its findings are reported
   verbatim to the operator — a sync that reveals a dishonest status has done its job; it must
   not "fix" the board to make the gate pass.
3. The mirror is committed; `git status` shows it clean.

### R3 — The reverse direction: mirror-derived edits back to Jira

`spec-bridge:sync` currently executes the planner's `backlog task edit` commands. Under Jira
it must execute `renderJira`'s `{ tool, args, why }` list instead. That is 055's renderer
plus this spec's execution:

- Execute in the returned **order** — same discipline as the Backlog path ("execute verbatim,
  in order"), for the same reason: later calls assume earlier ones landed.
- After execution, **re-sync the mirror** (R2), so the mirror reflects post-edit Jira rather
  than the state that motivated the edits.
- **Never write inside a spec dir.** The one-way contract (`spec-bridge:sync`'s "files are
  truth, the board is the view") is unchanged and must be asserted the same way: `git status`
  shows no modifications under any spec dir.

### R4 — Spike speed: one call, config-supplied

The operator's stated requirement. `board:create` under Jira must be **one MCP call** with
nothing to look up:

```js
createJiraIssue({
  cloudId, projectKey, issueTypeName,   // ← all from .board.json
  summary: "<the thing you just thought of>",
  additional_fields: { assignee: { id: <resolved defaultAssignee> } },
})
```

Requirements:
- **Zero discovery calls** at spike time. `cloudId`, `projectKey`, `issueTypeName` come from
  config (054 wrote them at bootstrap). If any is missing, that is a config error naming the
  missing field — not a discovery conversation.
- `defaultAssignee: "self"` resolves via `atlassianUserInfo` **once per session** and is
  reused; an explicit account id skips even that.
- A spiked card is **not** in the mirror (it has no `Spec:` marker yet) and does **not**
  require a sync. Spiking must never trigger the full sync path — that is what would make it
  slow, and slow spiking is the thing this requirement exists to prevent.
- Document the spike path in `docs/board-verbs.md`'s `board:create` row so it is discoverable
  without reading this spec.

### R5 — Assignees are first-class

The operator named users/assignees as newly important under Jira. Where they land:

- **`.board.json`** — `defaultAssignee` (054 R1), so spiking assigns without asking.
- **`board:claim`** — sets the assignee alongside the status transition, mirroring the
  Backlog path's `-a @claude`. Under a sweep, the assignee is whoever the operator configured;
  the *implementer tier* is a separate record (a note/comment), not an assignee.
- **Not in the mirror.** No verdict depends on who owns a card, and putting `assignee` in the
  mirror invites the gate to grow opinions about people (design doc, "Assignees and users").
  If a future need arises, it is an additive schema field then — not speculatively now.
- `lookupJiraAccountId` is the resolution path for a named human; document that a display
  name is **not** an account id and must be resolved, because passing a name where an id is
  required is the most common Jira integration error.

### R6 — Sweep compatibility, proven not assumed

`pdlc:sweep` claims cards, sets tiers, reads `paused`, and moves statuses. After 055 it does
this through verbs, so it *should* work. Prove the four load-bearing points against a Jira
host (or a recorded fixture where a live site is unavailable, with the substitution stated):

1. **Claim** — `board:claim` transitions status **and** assigns, and the claim's `Spec:`
   marker survives on the issue.
2. **Paused** — a `paused`-labelled issue projects into `labels` and is excluded from lane
   conflict analysis (055 R4's mechanism, end-to-end here).
3. **Status honesty** — a card moved to Done in the Jira UI while its `tasks.md` has unchecked
   boxes produces a **blocking** gate finding after the next sync. This is the whole feature's
   reason for existing; it gets an explicit test.
4. **Mirror staleness** — a card moved in the UI **without** a sync produces the R3 staleness
   finding from spec 053, not a false pass.

### R7 — Document the trust boundary honestly

`docs/board-verbs.md` and the `pdlc:peer:jira` block must state plainly:

> The mirror is a receipt of what Jira said at `observedSha`. A status claim is only as good
> as the last sync. The gate can prove the mirror is stale; it cannot prove a hand-edited
> mirror entry is a lie.

This is the same honesty the wiki's `verified_against` doctrine carries. Stating it is a
requirement, not a caveat — an operator who believes the gate is stronger than it is will
trust a green check that means less than they think.

## Non-goals

- **Does not** migrate an existing Backlog board into Jira. Separate task if wanted.
- **Does not** support two boards at once (design invariant 2).
- **Does not** add MCP calls to `lib/` or `gates/`. Only this skill talks to Jira.
- **Does not** implement Confluence, sprints, or boards-as-in-Jira-Agile. Issues only.
- **Does not** build GitHub Issues or Linear providers.

## Acceptance criteria

1. `providers.jira = { requiresSync: true, project: null }` registered; no other `lib/`
   change; `lib/` remains free of MCP and network calls (asserted by grep for `mcp__` and
   `fetch` across `lib/`).
2. `spec-bridge/skills/board-sync/SKILL.md` exists in the repo's gate → work → gate pattern,
   with the R2 precondition gate, work steps, and output gate.
3. `board:sync` writes a valid mirror with `observedAt` + `observedSha` on every link, and
   commits it.
4. Unlinked issues (no `Spec:` marker) are **excluded** from the mirror and their count is
   reported.
5. Status round-trips through `statusMap` in both directions: a site status maps into the
   bridge vocabulary on read, and a bridge status maps to the site's on write; an unmapped
   status falls through unchanged.
6. The reverse direction executes `renderJira`'s calls **in order**, then re-syncs; `git
   status` shows **no** modification under any spec dir (the one-way contract).
7. `board:create` performs exactly **one** MCP call with no discovery calls, using config
   coordinates; a missing coordinate is a config error naming the field; spiking does **not**
   trigger a sync.
8. `defaultAssignee: "self"` resolves once per session; an explicit id skips resolution;
   `board:claim` sets assignee **and** status; `lookupJiraAccountId`'s
   name-is-not-an-id caveat is documented.
9. R6's four sweep points each proven — against a live site, or against a recorded fixture
   with the substitution **stated in the notes**. Point 3 (Done over unchecked boxes ⇒
   blocking) has its own test.
10. R7's trust boundary stated verbatim in both `docs/board-verbs.md` and the
    `pdlc:peer:jira` block; the new skill's `version:` set; marketplace version bumped;
    `docs/wiki/` re-pinned for `spec-bridge-plugin`, `pdlc-grounding-block`, and any note
    listing the touched files; `README.md`/`CLAUDE.md` updated where they describe the board.
