# 054 — implementation plan

## Constitution check

**No ratified constitution** (`.specify/` absent; hand-authored under the sweep's escape
line). Checked against:

| Grounding doc | What it binds here |
|---|---|
| `docs/design/board-provider-seam.md` | invariant 2 (the board is **singular**) is the rule R4's mutual exclusion enforces |
| `docs/principles.md` P1 | assignee/coordinates get a durable home instead of being re-asked per card |
| `pdlc/templates/CLAUDE.md` | the marked-block mechanism the new peer block joins |
| `pdlc/skills/bootstrap/SKILL.md` — "Model tiers" | the precedent for an operator-owned config file written **only when absent** |
| `docs/releasing.md` | `pdlc/`, `lib/` released surface ⇒ marketplace bump **and** bootstrap's own skill `version:` bump |
| `docs/task-labels.md` | if this work needs labels, pick from the list; don't mint |

**Tension, named:** `bootstrap/SKILL.md`'s peer section is built on `command -v <cli>`.
Jira has no CLI — availability is "the Atlassian MCP server is connected". Do not force it
into the `command -v` shape; state the difference in kind explicitly in the prose. Getting
this wrong produces a skill that tells operators to install a Jira CLI that does not exist.

## Approach

### Follow the `model-tiers.json` precedent exactly

There is already a settled answer in this repo for "an operator-owned config the plugin
plants but never reverts": `.claude/model-tiers.json`. Its rules, all of which apply here:

- Plant **only when absent** — a re-bootstrap must never revert a value the host changed.
- Live **outside every marker**, so editing it is a one-line change with no drift and no
  `--force`.
- The planted doctrine block *points at* the config; it does not restate its contents.
- The config is what you edit; something generated/derived is what holds.

Copy that shape rather than inventing a parallel one. `.board.json` sits at the **project
root** (not under `.claude/`) because it is board configuration, peer to `.spec-bridge.json`
and `.pdlc` — and because the gate, which never reads `.claude/`, may read it (spec 053 R4).

### `loadBoardConfig` lives with the mirror, not with the bridge

It goes in `lib/board-mirror.mjs` (spec 052's module) because both the gate and the skills
need it, and `lib/` is the only place both can reach. Putting it in `spec-bridge/gates/`
would make the pdlc skills import from another plugin's gates dir — a coupling the suite's
"compose through files and gates, never calls" rule forbids.

### The unknown-provider throw is the load-bearing line

```js
if (!providers[name]) throw new Error(
  `unknown board provider "${name}" (known: ${Object.keys(providers).join(", ")})`);
```

Silently falling back to `backlog` on a typo'd provider means a Jira project is quietly
treated as a Backlog project — the gate scans a `backlog/` dir that isn't there, finds
nothing, and passes. That is the exact silent-no-op this whole feature exists to eliminate,
reintroduced through a typo. Throw, and name the known set so the fix is obvious.

### Mutual exclusion in `plant.mjs`

`plant()` already validates unknown peers (`plant.mjs:168`):

```js
const unknown = peers.filter((p) => !PEERS.includes(p));
if (unknown.length) throw new Error(`unknown peer(s): ...`);
```

Add the cross-peer rule immediately after, in the same style and the same place — one
validation block, so a reader finds all peer constraints together:

```js
if (peers.includes("backlog") && peers.includes("jira"))
  throw new Error("peers backlog and jira are mutually exclusive — one board is the plan of record");
```

The message must carry the *reason*, not just the rule. An operator hitting this is trying
to keep their Backlog spike workflow, and deserves to know why the answer is "config
defaults" rather than "two boards".

### The peer block: parallel structure, zero backlog verbs

Write `pdlc:peer:jira` by reading `pdlc:peer:backlog` line by line and asking, for each
line, what its Jira form is. Two lines change in **kind**, not wording:

- *"Never hand-edit files under `backlog/` — always the CLI"* becomes *"never hand-edit
  `.board/links.json` — always `board:sync`"*. Same rule (don't edit derived state by hand),
  different derived artifact.
- *"Two-track landing: board commits direct to main"* — under Jira, board changes produce
  **no commit at all**, so the two-track rule's mechanics differ while its intent holds.
  State that plainly; do not copy the Backlog phrasing, which would be false.

AC #6's grep test (`no "backlog " string in the jira block`) is the mechanical guard against
copy-paste drift. Write the test before the block.

### Bootstrap prose: discover, don't ask

The SDLC pipeline plugin in this environment already establishes the pattern —
"discovers Jira and Confluence values via the Atlassian MCP instead of asking the user for
custom-field and folder ids". Adopt the same posture and cite it as precedent:

- `getAccessibleAtlassianResources` → `cloudId`
- `getVisibleJiraProjects` → `projectKey` (present the list; the operator picks)
- `getJiraProjectIssueTypesMetadata` → valid `issueTypeName` values for that project
- `atlassianUserInfo` → the account id behind `defaultAssignee: "self"`

Asking an operator to type a `cloudId` when a tool can list it violates P1's "a question an
existing artifact already answers is resolved from it, not re-asked".

## Phasing rationale

Three phases with clean artifact boundaries:

1. **Config module** (`lib/`) — load/validate, fully unit-testable, no plant involvement.
2. **`plant.mjs` + the template block** — the peer plumbing and the grounding text.
3. **Bootstrap skill prose + docs sync + re-ground.**

Phase 1 first because phase 2's template block references the config's field names; writing
the block against a not-yet-existing schema invites a mismatch.

## Risks

| Risk | Mitigation |
|---|---|
| Peer block drifts into `backlog` verbs by copy-paste | AC #6 grep test, written **before** the block. |
| A re-bootstrap reverts an operator's `.board.json` | Write only when absent (the `model-tiers.json` rule); test it. |
| Unknown provider silently degrades to backlog | Throw naming the known set; AC #2 asserts the throw. |
| `check-docs.mjs` fails on peer enumeration | AC #10 — update `README.md`/`CLAUDE.md` in the same PR; the gate is one of the four required. |
| Two status mappings confuse a reader | R3's composition diagram appears in both the config docs and the peer block. |
| Released surface | Bump marketplace version **and** `bootstrap`'s skill `version:` (per-skill rule). |

## Verification

- `node --test` green; existing `test/pdlc.test.mjs` cases unedited.
- Render the template both ways and diff: `--peer jira` keeps the block, omitting strips it.
- `node pdlc/scripts/plant.mjs --root <tmp> --peer backlog --peer jira` exits nonzero with
  the invariant message.
- `node scripts/check-docs.mjs` green (README/CLAUDE peer enumeration in sync).
- `node scripts/sync-version.mjs --check` green.
- Freshness green by Done.
