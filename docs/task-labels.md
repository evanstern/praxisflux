# Task labels — the canonical vocabulary

Backlog.md labels are praxisflux's **selector surface over the board**. Their working purpose
is to make a set of cards addressable as a set — most concretely so `/pdlc:sweep` can be handed
a label instead of a hand-typed list of ids ("sweep the demo-rig tasks"), which the sweep skill
already accepts as an input mode alongside task ids and a synthesis doc.

That purpose sets the rule: **labels name what the work is about, not how it feels.** A label
earns its place only if you would plausibly sweep, filter, or report on the whole set it names.

```
backlog task list --labels demo-rig --plain      # the set
/pdlc:sweep  →  "sweep the demo-rig tasks"       # the set, executed
```

## The rule for picking labels

1. **Always pick from the list below.** It is the permanent vocabulary.
2. **Only mint a new label when more than two open cards would carry it** — a third card is the
   evidence that a category exists rather than a one-off adjective. Add it to this file in the
   same change that applies it, so the list never drifts behind the board.
3. **Every card gets at least one Area label**; Kind and Provenance are additive and optional.
4. Label the work's *substance*, not its incidental touches. Nearly every task ends with a wiki
   re-pin and a version bump — that does not make it `wiki` or `tooling`. Ask what a sweep of
   that label should have picked up.
5. Set labels through the CLI only (`backlog task edit TASK-x --add-label <label>`), never by
   hand-editing files under `backlog/`. Note that `--add-label` honors only the **last** flag
   per invocation — run it once per label and read back the result.

## Area — where the work lands

The stable half of the vocabulary: it tracks the repo's actual surfaces, so it does not churn.

| Label | Covers |
| --- | --- |
| `pdlc` | `pdlc/` generally — bootstrap, and the plugin's own plumbing |
| `pdlc-sweep` | The `pdlc:sweep` orchestrator specifically — dispatch, lanes, runbook doctrine |
| `grounding-wiki` | `grounding-wiki/` — the corpus generator and its freshness gate |
| `spec-bridge` | `spec-bridge/` — the Spec Kit ↔ Backlog bridge |
| `team-review` | `team-review/` |
| `reorient` | `reorient/` |
| `educate` | `educate/` |
| `research` | `research/` |
| `build` | `build/` |
| `codebase-to-course` | `codebase-to-course/` |
| `chassis` | `lib/` — the shared Node chassis every plugin rides |
| `gates` | Gate scripts, Stop hooks, and the CI enforcement surface |
| `tooling` | `scripts/`, build/release tooling, CI workflows, `.claude-plugin/` |
| `demo-rig` | `demo/` — the checkpointed demo project and its fixtures |
| `wiki` | `docs/wiki/` as content — the corpus itself, not the generator |
| `docs` | Prose docs, `README.md`, `CLAUDE.md`, spec/plan/tasks text |
| `tests` | `test/` — the suite as the deliverable |

## Kind — what shape the work is

| Label | Covers |
| --- | --- |
| `debt` | Carded tech debt, typically from a `pdlc:refactor-triage` run |
| `bug` | Something is wrong now, with a reproduction or a named hazard |
| `feature` | New capability |
| `refactor` | Restructuring with behavior held constant |
| `doctrine` | Skill prose, policy, and the rules sessions obey — no runtime code |
| `epic` | Grouping card; gets no PR of its own (see `docs/principles.md`) |

## Provenance — where the card came from

| Label | Covers |
| --- | --- |
| `sweep-followup` | Deferred out of a `pdlc:sweep` run |
| `downstream-bug-find` | Surfaced by a downstream consumer hitting it for real |
| `dogfood` | Running praxisflux on praxisflux |
| `sweep-cost` | The sweep cost-reduction initiative — model tiering, phase-scoped dispatch, per-task accounting |

## Reserved

| Label | Covers |
| --- | --- |
| `paused` | **Machine-read.** `pdlc:sweep` and the merge-drift gates exclude paused tasks from lane-conflict analysis. Never a category — set and cleared only via the CLI, with a matching note. |

## Retired

Present on closed cards, not to be applied to new ones: `wiki-token-economy` (→ `wiki`),
`sweep` (→ `pdlc-sweep`), `handoff`, `design`, `html`.
