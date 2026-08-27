# 054 — `.board.json` config and the `pdlc:peer:jira` planted grounding

Board task: **TASK-111** · epic: **TASK-108** · design of record:
`docs/design/board-provider-seam.md` · depends on: **052** (the provider registry)

## Problem

Two gaps remain once the mirror interface exists.

**1. Nothing declares which provider a project uses.** Spec 053 defaults to `backlog` when
no config is present — correct for backward compatibility, useless for a Jira host. And a
Jira host needs more than a name: `cloudId`, `projectKey`, and an issue type are required on
**every single MCP call** (`mcp__…__createJiraIssue` takes `cloudId`, `projectKey`,
`issueTypeName`, `summary` as required parameters). Without a config, every board action
starts with the model re-discovering site metadata — which is both slow and a fresh chance to
get it wrong.

This is the operator's spike-speed requirement, precisely:

> Backlog.md is useful because it is so easy to spike tasks. In Jira, I'd like the same level
> of control.

`backlog task create "thing"` is one command with no ceremony. The Jira equivalent is only
one call **if the site coordinates are already known**. Config is what makes carding a
thought cost one call instead of a discovery conversation.

**2. `pdlc:bootstrap` cannot opt a project into Jira.** `PEERS = ["backlog", "spec-kit"]`
(`pdlc/scripts/plant.mjs:46`) is a closed list, and the planted grounding carries a
`pdlc:peer:backlog` block whose every instruction is a `backlog` CLI command
(`pdlc/templates/CLAUDE.md`). A Jira project bootstrapped today is told to run
`backlog task edit`, which does not exist for it. The always-on grounding would be actively
wrong — and it is the one context that applies when no skill has triggered.

## Requirements

### R1 — `.board.json` at the project root

Tracked, hand-editable, outside every marker — the same posture as
`.claude/model-tiers.json` (operator's file, bumping a value is a one-line edit, no
re-plant). Shape:

```json
{
  "provider": "jira",
  "jira": {
    "cloudId": "your-site.atlassian.net",
    "projectKey": "PROJ",
    "issueTypeName": "Task",
    "defaultAssignee": "self",
    "statusMap": {
      "To Do": "To Do",
      "In Progress": "In Progress",
      "Done": "Done"
    }
  }
}
```

- `provider` is **singular** — one board, one plan of record (design invariant 2). A list is
  a validation error with a message saying why.
- The provider-named sub-object holds that provider's coordinates. `backlog` needs none, so
  `{ "provider": "backlog" }` is a complete config.
- `statusMap` maps the **bridge's** status vocabulary to the **site's** workflow status
  names, because Jira workflows are per-project and nobody's board is guaranteed to spell
  them "To Do"/"In Progress"/"Done". Unmapped statuses fall through unchanged.
- `defaultAssignee: "self"` resolves via `mcp__…__atlassianUserInfo` at spike time; an
  explicit account id is also accepted. This is the operator's assignee requirement given a
  durable home rather than being re-asked per card.

### R2 — `loadBoardConfig(root)` in `lib/board-mirror.mjs`

Returns the parsed config, or `{ provider: "backlog" }` when `.board.json` is absent — the
backward-compatible default 053 already assumes. Malformed JSON **throws** (fail closed).
An unknown `provider` name — one absent from the `providers` registry — is a **thrown error
naming the known providers**, never a silent fallback to `backlog`: silently treating a Jira
project as a Backlog project is exactly the class of failure this feature exists to remove.

`validateBoardConfig(config)` → `string[]` of problems: a `provider` array, an unknown
provider, a `requiresSync` provider missing its required coordinates (for `jira`: `cloudId`,
`projectKey`, `issueTypeName`), a non-object `statusMap`.

### R3 — `.spec-bridge.json`'s `statusVocabulary` composes, and the precedence is stated

`.spec-bridge.json` already carries an opt-in `statusVocabulary` mapping *derivation stages*
to *board status names* (`bridge.mjs:69`). `.board.json`'s `statusMap` maps *bridge statuses*
to *site workflow names*. These are different mappings at different layers and both are
legitimate:

```
derivation stage ──statusVocabulary──▶ bridge status ──statusMap──▶ Jira workflow status
   (reviewing)                          ("In Review")                 ("In Review")
```

State this composition explicitly in both the config's docs and the `pdlc:peer:jira` block.
Neither file's meaning changes; what this spec adds is the **written precedence**, because
two status mappings with no documented relationship is a bug factory.

### R4 — `plant.mjs` grows a `jira` peer

- `PEERS` becomes `["backlog", "spec-kit", "jira"]`.
- `--peer jira` keeps the `pdlc:peer:jira` block; absent, it is stripped (the existing
  `stripPeerBlock` mechanism, unchanged).
- **`backlog` and `jira` are mutually exclusive.** Passing both is an error naming design
  invariant 2 — one board, singular. This is the one place the plant script gains a
  cross-peer rule, so it must be explicit and tested.
- The `.pdlc` sentinel records the choice in `peers` / `peersOmitted` exactly as today; no
  sentinel schema change.

### R5 — The `pdlc:peer:jira` grounding block

A new marked block in `pdlc/templates/CLAUDE.md`, structurally parallel to
`pdlc:peer:backlog`, carrying:

- **Jira is the board and the plan of record**; `.board/links.json` is the tracked receipt
  the gate reads, refreshed by the `board:sync` skill — never hand-edited.
- The **two-track landing rule** restated for Jira: board/bookkeeping changes are Jira-side
  and land no commit; deliverable work lands by PR. (Under Backlog, board edits *are*
  commits; under Jira they are not, which changes the rule's mechanics while preserving its
  intent.)
- **One TASK, one PR**, with Jira's spelling: an **Epic** gets no PR; a **Sub-task** is
  internal breakdown and rides its parent's branch and PR.
- The mirror's staleness contract: a status claim is only as good as the last sync.
- A pointer to the board verb table (spec 055) as the canonical action vocabulary.
- The `statusVocabulary`/`statusMap` composition from R3.

It must **not** contain a `backlog` command, and must not restate the verb table inline —
one home per rule.

### R6 — Bootstrap's skill prose handles the third peer

`pdlc/skills/bootstrap/SKILL.md`'s "Peer utilities" section covers exactly two peers with
per-peer detection (`command -v backlog`, `command -v specify`). Jira differs in kind:
there is **no CLI to detect** — availability means the Atlassian MCP server is connected and
the site coordinates are known. So the skill must:

- Detect Jira availability by **MCP tool presence**, not `command -v`, and say so.
- On opt-in, resolve `cloudId` via `mcp__…__getAccessibleAtlassianResources` and
  `projectKey` via `mcp__…__getVisibleJiraProjects` rather than asking the operator to type
  ids — the same "discover, don't ask" posture the skill already takes for the SDLC
  pipeline's Jira fields.
- Write `.board.json` **only when absent** (operator's file, exactly like
  `model-tiers.json`).
- Refuse the `backlog` + `jira` combination with the invariant-2 reason.
- Extend the Output gate: `.board.json` valid, the planted block present, and — for a
  `requiresSync` provider — a stated reminder that `board:sync` must run before the gate has
  any evidence.

## Non-goals

- **Does not** implement the Jira projector or `board:sync`. Spec **056**.
- **Does not** define the verb vocabulary. Spec **055**.
- **Does not** migrate an existing Backlog board's cards into Jira. Out of scope; if wanted,
  it is a separate carded task.
- **Does not** touch `.claude/model-tiers.json` or the tier machinery.

## Acceptance criteria

1. `.board.json` schema documented and implemented per R1, with `{ "provider": "backlog" }`
   a complete valid config.
2. `loadBoardConfig` returns the `backlog` default when absent, **throws** on malformed
   JSON, and **throws naming the known providers** on an unknown provider name.
3. `validateBoardConfig` catches: `provider` as an array, unknown provider, `jira` missing
   each of `cloudId`/`projectKey`/`issueTypeName`, non-object `statusMap`.
4. `PEERS` includes `jira`; `--peer jira` keeps the block and omitting it strips it, verified
   by rendering both ways.
5. Passing `--peer backlog --peer jira` **errors** with a message naming the one-board
   invariant.
6. The `pdlc:peer:jira` block exists in the template, contains **zero** `backlog `
   command strings (asserted by grep in a test), and covers each of R5's six points.
7. The `.pdlc` sentinel records `jira` under `peers` when opted in and under `peersOmitted`
   when not — with no sentinel schema change.
8. `bootstrap/SKILL.md` documents MCP-presence detection, the discover-don't-ask resolution
   of `cloudId`/`projectKey`, write-only-when-absent, the mutual-exclusion refusal, and the
   extended Output gate; its `version:` is bumped.
9. `test/pdlc.test.mjs` extended for ACs 4–7 with the existing pdlc tests passing unedited;
   config tests added for ACs 1–3.
10. `README.md` and `CLAUDE.md` updated where they enumerate the peers (`check-docs.mjs`
    enforces this), and `docs/wiki/` re-pinned for `pdlc-plugin`,
    `pdlc-grounding-block`, and any note listing `plant.mjs` or the template as a source.
