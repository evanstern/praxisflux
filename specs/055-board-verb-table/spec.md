# 055 — The board verb table: one vocabulary every skill resolves against

Board task: **TASK-112** · epic: **TASK-108** · design of record:
`docs/design/board-provider-seam.md` · depends on: **054** (`.board.json` declares the
provider a verb resolves under)

## Problem

Specs 052–054 make the **gate** provider-neutral. The **skills** are not. Every skill that
touches the board writes `backlog` CLI commands into its prose as literal instructions:

| Skill | `backlog ` command strings |
|---|---|
| `spec-bridge:link` | 6 |
| `pdlc:sweep` | 3 |
| `pdlc:refactor-triage` | 3 |
| `spec-bridge:sync` | 2 |
| `pdlc:bootstrap` | 2 |
| `reorient:reorient` | 1 |

These are not incidental mentions — they are the operative instruction. `spec-bridge:link`
says *"Create with the marker as the last line of the description:
`backlog task create "<title>" -d "..."`"*. A Jira host following that skill runs a command
that does not exist.

Two bad ways to fix this, both of which must be avoided:

1. **Fork every skill per provider.** Six skills × N providers of near-duplicate prose that
   drifts the first time any rule changes. The repo already learned this lesson with the
   parser (spec 052 moves rather than copies) and with the peer blocks.
2. **Sprinkle `if provider == jira` into each skill.** Every skill grows a conditional it
   must keep in sync, and adding a provider means editing all six.

The right fix is the one the repo already uses for planted doctrine: **one canonical home
per rule**. A skill should say *"claim the card"*, and exactly one document should say what
"claim the card" means on this host.

## Requirements

### R1 — `docs/board-verbs.md`: the canonical verb table

A tracked doc, structured as one row per verb, one column per provider. Verbs are named for
the **intent**, never the tool:

| Verb | What it means | `backlog` | `jira` |
|---|---|---|---|
| `board:list` | enumerate open work | `backlog task list --plain` | JQL search, project + open statuses |
| `board:view` | read one item fully | `backlog task view <id> --plain` | `getJiraIssue` |
| `board:create` | spike a new item | `backlog task create "<t>"` | `createJiraIssue` with config coordinates |
| `board:claim` | mark in-progress + own it | `task edit <id> -s "In Progress" -a @claude` | `transitionJiraIssue` + set assignee |
| `board:status` | move status | `task edit <id> -s "<s>"` | `transitionJiraIssue` via `statusMap` |
| `board:note` | append progress | `task edit <id> --append-notes "<n>"` | `addCommentToJiraIssue` |
| `board:plan` | record the plan | `task edit <id> --plan "<p>"` | comment, or a configured field |
| `board:ac-set` | set/refresh phase criteria | `task edit <id> --ac "<t>"` | rewrite the marked description block |
| `board:ac-check` | tick a criterion | `task edit <id> --check-ac <n>` | tick the box in the marked block |
| `board:label` | add/remove a label | `task edit <id> --add-label <l>` | `editJiraIssue` labels field |
| `board:final` | record the final summary | `task edit <id> --final-summary "<s>"` | comment + transition to Done |
| `board:link-spec` | plant the `Spec: <dir>` marker | last line of the description | last line of the description |
| `board:sync-mirror` | refresh `.board/links.json` | recompute (`board-mirror --check`) | the `board:sync` skill (MCP) |

Each row states its **preconditions and its evidence** — what must be true before the verb
runs, and what artifact proves it ran. A verb with no evidence is not a verb; it is a wish
(P1).

### R2 — Phase criteria under Jira: the marked description block

The operator's chosen mechanism (2026-08-27): spec phases mirror into a
**marker-delimited block the bridge owns exclusively** inside the issue description.

```
<whatever the human wrote — never touched>

<!-- spec-phases BEGIN -->
- [x] Phase 1 — Seam
- [ ] Phase 2 — Provider
<!-- spec-phases END -->
Spec: specs/052-board-adapter-seam
```

Rules, which are the same marked-block doctrine `pdlc:bootstrap` already uses for
`CLAUDE.md`:

- Text **outside** the markers is human-authored and is **never** modified. This is the
  Jira analogue of the planner's existing "ACs that don't start with `Spec phase: ` are
  human-authored and are never touched" rule (`bridge.mjs:400`).
- The block is **replaced wholesale** on each sync — it is derived state, so there is no
  merge problem to solve.
- The `Spec: <dir>` marker line stays outside the block (it is the *link*, not a phase), and
  keeps its exact current syntax so `MARKER` (`bridge.mjs:238`) matches unchanged.
- One block per issue. Two blocks is a validation error, not a merge.

Because the mirror carries `acs` as `[{ index, checked, text }]` (spec 052 R1), parsing this
block yields exactly that shape — the gate's AC handling needs no Jira awareness at all.

### R3 — Skills reference verbs; they stop naming a CLI

Rewrite each of the six skills' board sentences to name a verb and link the table. Concretely,
`spec-bridge:link`'s create step becomes:

> Create the item with the `Spec: <specDir>` marker as the last line of its description
> (`board:create` + `board:link-spec` — see `docs/board-verbs.md`).

**Constraints on the rewrite, all load-bearing:**

- **No behavior change for a `backlog` host.** The verb's `backlog` column *is* the command
  that is there today, verbatim. A reader on a Backlog host follows the table to the same
  command they follow today.
- **No skill gains a provider conditional.** A skill names the verb; the table resolves it.
- **Every skill's `version:` bumps** (the per-skill rule in `docs/releasing.md`).
- The **rules** the skills carry — one-task-one-PR, two-track landing, paused-lane doctrine,
  the `Spec:` marker contract — do **not** change. Only the spelling of the actions does.

### R4 — The `paused` marker survives provider-neutrally

`pdlc:sweep`'s paused-lane doctrine is **machine-read**: the sweep and the merge-drift gates
exclude `paused`-labelled tasks from lane-conflict analysis, and `docs/task-labels.md` marks
it Reserved. Under Backlog, `paused` is a label in task-file frontmatter. Under Jira it is a
Jira label.

The mirror must therefore carry labels: **spec 052's schema gains an optional `labels: []`
per link**, and both providers project it. Without this, a sweep on a Jira host cannot find a
paused task and would happily claim a parked branch — a real, destructive failure, not a
cosmetic gap.

This is a **schema addition to 052's file format** and must be recorded as such: additive,
optional, and round-tripped by the unknown-key rule if an older writer omits it.

### R5 — `docs/task-labels.md` becomes provider-neutral

The doc opens *"Backlog.md labels are praxisflux's selector surface over the board"* and its
rules name `backlog task edit --add-label`. The vocabulary itself is provider-independent —
only its plumbing sentences need the verb treatment (`board:label`). The label **list** does
not change.

### R6 — The planner renders per provider

Spec 053 R5 split the planner into `planIntents` + `renderBacklog`. This spec adds
`renderJira(id, intents, config)` returning the **MCP call descriptions** a skill executes —
not command strings, because there is no Jira CLI. Shape: an ordered array of
`{ tool, args, why }`, so the sync skill executes them in order and the `why` lands in the
progress note.

`renderJira` must be **pure and MCP-free** — it *describes* calls; spec 056's skill makes
them. This keeps `lib/` network-free (design invariant 4) and keeps the renderer unit-testable
without a Jira site.

## Non-goals

- **Does not** implement the Jira projector or the `board:sync` skill. Spec **056**.
- **Does not** change any board rule — only how actions are spelled.
- **Does not** add a provider abstraction layer to `lib/` beyond `renderJira`. The table is
  documentation the model reads; the code stays thin.
- **Does not** rewrite skill prose beyond board-action sentences. Untouched paragraphs stay
  byte-identical.

## Acceptance criteria

1. `docs/board-verbs.md` exists with every verb in R1's table, each row naming its
   preconditions and its evidence artifact.
2. Each of the six skills references verbs and links the table; a grep for `backlog ` across
   `*/skills/**/SKILL.md` returns **only** occurrences inside the `backlog` column of the
   table, or explicit "on a Backlog host" illustrations.
3. Every rewritten skill's `version:` is bumped; each skill's non-board prose is otherwise
   unchanged (verified by reviewing the diff, which must contain no unrelated edits).
4. R2's marked-block contract documented in `docs/board-verbs.md` and in the
   `pdlc:peer:jira` block: text outside markers never touched, block replaced wholesale,
   `Spec:` line outside, one block per issue, two blocks = validation error.
5. A parser for the marked block yields `[{ index, checked, text }]` matching the mirror's
   `acs` shape, proven by a round-trip test (render → parse → identical).
6. Spec 052's mirror schema gains optional `labels: []`; both providers project it; a mirror
   written without it still validates (additive, round-tripped).
7. `pdlc:sweep`'s paused-lane doctrine works from mirror labels — asserted by a test where a
   mirror-only project with a `paused`-labelled link is excluded from conflict analysis.
8. `docs/task-labels.md` plumbing sentences are provider-neutral; the label list is unchanged
   (diff shows no table rows added or removed).
9. `renderJira(id, intents, config)` returns ordered `{ tool, args, why }` descriptions, is
   pure, makes **no** MCP or network call, and is unit-tested against fixture intents;
   `renderBacklog` still produces today's exact strings.
10. `node scripts/check-docs.mjs` green; `docs/wiki/` re-pinned for every note whose
    `sources:` lists a rewritten skill — at minimum `pdlc-sweep`,
    `pdlc-sweep-history-recent`, `pdlc-refactor-triage`, `spec-bridge-plugin`,
    `reorient-plugin`; new note or INDEX row added for the verb table if the corpus needs one.
