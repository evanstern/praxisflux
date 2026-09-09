# Board verbs — the vocabulary every skill resolves against

**Status:** canonical reference, spec 055 R1 · design of record: `docs/design/board-provider-seam.md`

Six skills (`spec-bridge:link`, `spec-bridge:sync`, `pdlc:sweep`, `pdlc:refactor-triage`,
`pdlc:bootstrap`, `reorient:reorient`) write board actions into their prose. Until now those
sentences named a `backlog` CLI command literally — a command that doesn't exist on a Jira
host. This table is the one canonical home for what each action *means*: a skill says
"claim the card" or links a verb here; this document says what "claim the card" resolves to
on the host's configured provider (`.board.json`'s `provider`, spec 054).

**Invariant (spec 055 R3): no behavior change for a `backlog` host.** Every `backlog` column
below is the exact command a Backlog.md host runs today — reading this table and following it
produces byte-identical behavior to reading the skill's old prose directly.

The verb set below was derived from the real call sites in the six skills, not invented —
see `specs/055-board-verb-table/findings/phase-1-call-sites.md` for the full enumeration,
including which literal `backlog ` grep hits turned out to be incidental prose rather than
real instructions, and which real call sites the naive grep missed.

## The table

| Verb | Intent | Preconditions | Evidence artifact | `backlog` | `jira` |
|---|---|---|---|---|---|
| `board:list` | Enumerate or search open work | Board configured (`.board.json`, or the `backlog` default); a query string for the search form | The printed listing itself (read-only; the caller inspects it in the same turn) | `backlog task list --plain` (enumerate) / `backlog search "<query>" --plain` (search by title) | JQL scoped to `projectKey` + open `statusMap` values; add `text ~ "<query>"` for the search form |
| `board:view` | Read one item fully | The id/key exists on the board | The returned item body | `backlog task view <id> --plain` | `getJiraIssue` |
| `board:create` | Spike a new item | `board:list`/search already ruled out an existing duplicate | The new item's id, printed/returned by the create call | `backlog task create "<title>" -d "<description>"` | `createJiraIssue` with `.board.json`'s `projectKey`/`issueTypeName` |
| `board:link-spec` | Plant or replant the `Spec: <dir>` marker | A spec dir exists under `specs/` | `MARKER` (`bridge.mjs:238`, `/^Spec:\s*(\S+?)\/?\s*$/m`) matches the item's description | Last line of the description at create time, or `task edit <id> -d "..."` preserving existing text and appending the marker when it's missing | Last line of the description, same rule — **outside** the `<!-- spec-phases -->` block (see R2 below) |
| `board:ac-set` | Seed or refresh phase acceptance criteria (add/remove) | `tasks.md` exists with phase headings; skip if absent; never touch a human-authored AC | The item's AC list shows one `Spec phase: <name>` entry per phase | `--ac "Spec phase: <name>"` at create or `task edit <id> --ac "Spec phase: <name>"` | Rewrite the `<!-- spec-phases BEGIN/END -->` block wholesale (R2) — **markdown-only**, see the note below the table |
| `board:ac-check` | Tick or untick one phase criterion | The criterion at that index already exists (`board:ac-set` ran first) | The item's checkbox state at that (1-based, positional) index | `task edit <id> --check-ac <n>` / `--uncheck-ac <n>` | Same wholesale block rewrite as `board:ac-set` — R2 collapses add/remove/check/uncheck into one description write, because the block has no partial-edit form |
| `board:status` | Move status (any transition except the final one to Done) | The target status is workflow-valid from the current one | The item's status field | `task edit <id> -s "<status>"` | `transitionJiraIssue`, resolved through `.board.json`'s `statusMap` |
| `board:claim` | Mark in-progress and own it — the first commit of a task | No other live branch already claims this id (merge-drift `claim` check) | The claim commit: board card `In Progress` + spec dir stub + link, landed together as the branch's first commit | `task edit <id> -s "In Progress" -a @claude` | `transitionJiraIssue` + set assignee |
| `board:final` | Record the final summary and move to Done — the only path that sets Done | All phase ACs checked / Done-eligible per the spec's derived state | The item's status = Done, plus the final-summary text (backlog) or the comment (jira) | `task edit <id> --final-summary "<summary>" -s Done` | Comment the summary (`addOrEditJiraIssueComment`), then `transitionJiraIssue` to the Done-mapped status |
| `board:note` | Append a progress note | The item exists | The new note/comment, timestamped | `task edit <id> --append-notes "<note>"` | `addOrEditJiraIssueComment` |
| `board:label` | Add or remove a label | For anything but ad-hoc use, the label is one of `docs/task-labels.md`'s vocabulary | The label present/absent in the item's `labels` (mirrored into `.board/links.json`'s `labels: []`) | `task edit <id> --add-label <label>` (one label per invocation; frontmatter `labels:`) | `editJiraIssue`'s `labels` field |
| `board:sync-mirror` | Refresh `.board/links.json` from the provider | `.board.json` names this provider | `.board/links.json` matches the recomputed projection (backlog), or carries a fresh `observedSha` that is an ancestor of `HEAD` (jira) | `node lib/board-mirror.mjs --check --root <dir>` (deterministic recompute + drift check) | Run the `board:sync` skill (spec 056; MCP-backed, evidentiary — no node-only recompute exists) |
| `board:init` | Stand up the board for this project (one-time, per peer) | The peer was opted into during `pdlc:bootstrap`'s peer prompt | `backlog/` directory exists (backlog), or `.board.json` exists and `validateBoardConfig` reports no problems (jira) | `backlog init "<project name>"` (skip if `backlog/` already exists) | Discover `cloudId`/`projectKey`/`issueTypeName` (+ assignee default) via the Atlassian MCP tools, confirm with the operator, write `.board.json` (skip if it already exists) |

A row with no real evidence artifact is a wish, not a verb (`docs/principles.md` P1) — every
row above names one. **Dropped from consideration:** `board:plan` (a task's `--plan` field).
No skill among the six reads or writes it — it's a `CLAUDE.md`-level standing convention for
how this repo runs its own board, not something any audited skill resolves. See the findings
doc for the full reasoning; add it back the day a skill actually needs it.

## R2 — the marked description block (Jira phase ACs)

Under Jira, `board:ac-set`/`board:ac-check` write a **marker-delimited block the bridge owns
exclusively**, inside the issue description:

```
<whatever the human wrote — never touched>

<!-- spec-phases BEGIN -->
- [x] Phase 1 — Seam
- [ ] Phase 2 — Provider
<!-- spec-phases END -->
Spec: specs/052-board-adapter-seam
```

Rules:

- Text **outside** the markers is human-authored and is **never** modified — the Jira
  analogue of the planner's existing "ACs that don't start with `Spec phase: ` are
  human-authored and never touched" rule (`bridge.mjs:400`).
- The block is **replaced wholesale** on each sync — it is derived state, so there is no
  merge problem to solve.
- The `Spec: <dir>` marker line stays **outside** the block (it is the *link*, not a phase),
  keeping its exact current syntax so `MARKER` (`bridge.mjs:238`) matches unchanged.
- **One block per issue.** Two blocks is a validation error, not a merge.
- **Markdown-only, not `html`.** Reading or writing this block as `html` is a contract
  violation, not a formatting choice: an `html` read returns the markers as escaped
  entities, converts the checkbox lines into a native ADF task-list, and swallows the END
  marker inside the final `<li>` — silently breaking the parser. Every `board:ac-set` /
  `board:ac-check` call against Jira must use the markdown content format. (Verified live
  against Jira, spec 056 phase 1 — `specs/056-jira-provider/findings/phase-1-mcp-surface.md`
  on branch `task-113-jira-provider`.)

Because the mirror carries `acs` as `[{ index, checked, text }]` (spec 052 R1), parsing this
block yields exactly that shape — indexes are **positional within the block** (1-based, not
an identity): a reordered block renumbers.

## Preconditions common to every verb

A provider's tooling must be reachable before any verb resolves against it — `backlog
--help` succeeding (Backlog.md CLI installed) or `.board.json` naming a configured provider.
This is a one-time check per skill run, not a per-verb precondition, so it isn't repeated in
every row above.
