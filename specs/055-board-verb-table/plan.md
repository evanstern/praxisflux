# 055 — implementation plan

## Constitution check

**No ratified constitution** (`.specify/` absent; hand-authored under the sweep's escape
line). Checked against:

| Grounding doc | What it binds here |
|---|---|
| `docs/design/board-provider-seam.md` | invariant 1 — a Backlog host's behavior must not change |
| `docs/principles.md` P1 | every verb names its **evidence artifact**; a verb without evidence is a wish |
| `docs/skill-patterns.md` | skill authoring conventions; one canonical home per rule |
| `docs/task-labels.md` | `paused` is **machine-read** and Reserved — R4 exists because of it |
| `docs/releasing.md` | every edited skill bumps its own `version:` **plus** the marketplace bump |
| `docs/corpus-spec.md` | rewriting a skill stales every note pinning it as a source |

**Tension, named and resolved:** this spec edits **six skills across three plugins** in one
PR. That looks like it strains one-task-one-PR — it does not. P2's test is whether the PR
carries *one* reason for a human to approve, and it does: *"board actions are named by intent,
not by CLI."* Splitting it per-skill would produce six PRs where five leave the repo in a
half-migrated state with two vocabularies live at once — strictly worse. Record this
reasoning in the PR body, because a reviewer will reasonably ask.

## Approach

### Write the table first, then let it drive the rewrites

The table is the contract; the skill edits are its consumers. Authoring rewrites first means
inventing verb names ad hoc and reconciling later.

For each row, fill **four** things — the two that are easy to skip are the two that matter:

1. the verb name (intent-shaped: `board:claim`, never `board:edit-status-flag`),
2. the per-provider resolution,
3. **preconditions** — what must hold before it runs,
4. **evidence** — the artifact that proves it ran.

(3) and (4) are what make the table a gate-compatible document rather than a cheat sheet. A
row whose evidence column reads "none" is a design smell: find the artifact or drop the verb.

### Derive verbs from what the skills actually do — don't invent a superset

Enumerate every board command in the six skills first (the counts are in spec.md's table),
then group by intent. The verb set should be the **smallest** that covers the real call
sites. Resist adding speculative verbs (`board:assign`, `board:reprioritize`) that no skill
uses — YAGNI, and an unused row invites a divergent implementation later.

### The rewrite is mechanical and must be visibly so

For each skill, the diff should contain **only** board-action sentences. Concretely:

- Replace the command with the verb name plus a table link.
- Keep the surrounding rule prose byte-identical.
- Where the current text explains *why* a command is shaped a certain way (e.g. the sync
  skill's "execute verbatim, in order — the order is load-bearing"), that rationale is about
  **reconciliation**, not about the CLI, so it stays exactly as written.

AC #3 asks the diff to contain no unrelated edits. That is enforceable by reading the diff;
make it easy by not reflowing paragraphs.

### `spec-bridge:link` needs the most care

Six command strings and the trickiest semantics: it plants the `Spec: <dir>` marker as the
**last line of the description**. Under Jira that description also hosts the phase block
(R2). So the ordering inside a Jira description is now:

```
human prose
<!-- spec-phases BEGIN --> … <!-- spec-phases END -->
Spec: specs/NNN-slug          ← still last
```

Verify against `MARKER = /^Spec:\s*(\S+?)\/?\s*$/m` (`bridge.mjs:238`) that this ordering
still matches — it is multiline-anchored, so it will, but **confirm it rather than assume**,
because that regex is what arms the entire gate.

### R2's block parser: symmetric by construction

Write render and parse as a pair in one module, with a round-trip test (AC #5). Reuse the
existing checkbox regex family from `lib/spec-derive.mjs` (`TASK_LINE`) rather than writing a
third checkbox parser — the repo already has two and a third would be the drift risk spec 052
was careful to avoid.

Indexes are **positional within the block** (1-based), matching how the planner already
computes post-edit AC indexes. Say this explicitly in the module header: the number is a
position, not an identity, and a reordered block renumbers.

### R4 is a correctness fix, not a nicety

Sequence this **early** in the phasing. Under Jira without mirror labels, a sweep cannot see
`paused` and will claim a parked branch — destroying an operator's in-flight state. That is
the most damaging bug latent in the whole feature, and it costs one optional schema field.

Because it amends spec 052's file format, record it as an additive schema note in
`lib/board-mirror.mjs`'s header **and** in `docs/design/board-provider-seam.md`, so a reader
of 052 alone is not misled about the current schema.

### `renderJira` describes; it never calls

Return `{ tool, args, why }`. The `tool` is the MCP tool name as a string; `args` a plain
object. This keeps `lib/` free of network and of MCP awareness (design invariant 4), makes
the renderer unit-testable with zero fixtures beyond intents, and gives spec 056's skill an
executable list plus a `why` for its progress note.

Map the intents from 053 to tools:

| intent | tool |
|---|---|
| `statusTo` | `transitionJiraIssue` (through `statusMap`) |
| `acAdd`/`acRemove`/`acCheck`/`acUncheck` | one `editJiraIssue` rewriting the whole block |
| `note` | `addCommentToJiraIssue` |

Note the collapse: **all** AC operations become **one** description rewrite, because the
block is replaced wholesale. That is a real simplification over Backlog's index-ordered
sequence — and it is worth a comment, since a reader who knows the Backlog path will look
for the ordering dance and correctly not find it.

## Phasing rationale

Four phases:

1. **Enumerate + author the table** — including preconditions/evidence per row.
2. **R4 mirror labels + paused-lane proof** — the correctness fix, early and isolated.
3. **The block render/parse pair + `renderJira`** — code, unit-tested, no MCP.
4. **The six skill rewrites + `task-labels.md` + version bumps + re-ground.**

Phase 2 before phase 3 because the paused fix is the highest-consequence slice and should not
wait behind rendering work.

## Risks

| Risk | Mitigation |
|---|---|
| A skill rewrite silently changes a rule | AC #3 — diff contains only board-action sentences; don't reflow paragraphs. |
| The `Spec:` marker stops matching under a Jira description | Confirm against the actual `MARKER` regex with a fixture; it arms the whole gate. |
| A third checkbox parser drifts | Reuse `spec-derive.mjs`'s `TASK_LINE` family. |
| Paused-lane gap ships | Phase 2, early; AC #7 asserts exclusion from a mirror-only project. |
| Six skills × version bumps missed | `check-version-bump.mjs` enforces per-skill bumps in CI — run it locally before the PR. |
| Wiki notes for six skills go stale | AC #10 lists the minimum set; classify each pin RE-PIN-ONLY / NEEDS-REVIEW. |

## Verification

- `node --test` green, including the round-trip and paused-exclusion tests.
- `grep -rn "backlog " */skills/**/SKILL.md` returns only table-column or explicitly-scoped
  occurrences.
- `node scripts/check-docs.mjs`, `node scripts/sync-version.mjs --check`,
  `node scripts/check-version-bump.mjs` green.
- Freshness green by Done.
