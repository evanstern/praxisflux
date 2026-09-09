# 055 — tasks

Phases are the dispatch unit: one fresh implementer per phase, re-grounded from this spec
dir plus the branch's commits. Nothing rides chat context between phases.

**Precondition:** specs 052–054 merged. `lib/board-mirror.mjs` has the mirror + config;
`bridge.mjs` reads the mirror and the planner is split into `planIntents` + `renderBacklog`.

## Phase 1 — Enumerate the real call sites, author the verb table

- [x] Enumerate **every** board command across the six skills (`spec-bridge:link` 6,
      `pdlc:sweep` 3, `pdlc:refactor-triage` 3, `spec-bridge:sync` 2, `pdlc:bootstrap` 2,
      `reorient:reorient` 1) and record the list in Notes with file:line for each
- [x] Group them by **intent** and derive the smallest verb set that covers the real call
      sites — no speculative verbs (`board:assign`, `board:reprioritize`) that no skill uses
- [x] Author `docs/board-verbs.md` with one row per verb and, for each,
      **all four** columns: verb name, per-provider resolution, **preconditions**, and
      **evidence artifact**
- [x] Audit the table: any row whose evidence column would read "none" is a design smell —
      find the artifact or drop the verb. Record any dropped verb and why
- [x] Document R2's marked-block contract in the table doc: text outside markers never
      touched, block replaced wholesale, `Spec:` line stays outside, one block per issue,
      two blocks = validation error
- [x] Commit

## Phase 2 — Mirror labels and the paused-lane fix (correctness, early)

- [x] Add optional `labels: []` per link to the mirror schema in `lib/board-mirror.mjs`;
      additive and round-tripped when an older writer omits it
- [x] Project `labels` in the `backlog` projector (from task-file frontmatter `labels:`)
- [x] Record the schema addition in `lib/board-mirror.mjs`'s header **and** in
      `docs/design/board-provider-seam.md`, so a reader of spec 052 alone is not misled
- [x] Test AC #6: a mirror written without `labels` still validates; one with them
      round-trips
- [x] Test AC #7: a mirror-only project whose link carries `paused` is **excluded** from
      lane-conflict analysis — this is the destructive bug the fix prevents (a sweep claiming
      an operator's parked branch)
- [x] Commit

## Phase 3 — The block render/parse pair and `renderJira`

- [x] Implement render + parse for the `<!-- spec-phases -->` block **as a pair in one
      module**, reusing `lib/spec-derive.mjs`'s `TASK_LINE` regex family — do **not** write a
      third checkbox parser
- [x] Document in the header that block indexes are **positional** (1-based within the
      block), not identities — a reordered block renumbers
- [x] Round-trip test (AC #5): render → parse → identical `[{ index, checked, text }]`,
      matching the mirror's `acs` shape
- [x] Verify the `Spec: <dir>` marker still matches `MARKER`
      (`/^Spec:\s*(\S+?)\/?\s*$/m`, `bridge.mjs:238`) when it follows the block in a
      description — **confirm with a fixture, do not assume**; that regex arms the whole gate
- [x] Implement `renderJira(id, intents, config)` → ordered `{ tool, args, why }`; **pure, no
      MCP, no network**
- [x] Map intents to tools: `statusTo` → `transitionJiraIssue` via `statusMap`; all AC
      operations → **one** `editJiraIssue` rewriting the block wholesale; `note` →
      `addCommentToJiraIssue`. Comment the AC collapse — a reader who knows the Backlog path
      will look for the index-ordering dance and correctly not find it
- [x] Unit-test `renderJira` against fixture intents; confirm `renderBacklog` still produces
      today's exact strings (AC #9)
- [x] Commit

## Phase 4 — The six skill rewrites, labels doc, versions, re-ground

- [ ] Rewrite board-action sentences in each skill to name a verb + link the table:
      `spec-bridge:link`, `spec-bridge:sync`, `pdlc:sweep`, `pdlc:refactor-triage`,
      `pdlc:bootstrap`, `reorient:reorient`
- [ ] **Do not reflow surrounding paragraphs.** The diff must contain only board-action
      sentences (AC #3); rationale prose about *reconciliation* (e.g. sync's "the order is
      load-bearing") is not about the CLI and stays byte-identical
- [ ] Confirm no skill gained a provider conditional — a skill names the verb; the table
      resolves it
- [ ] Make `docs/task-labels.md`'s plumbing sentences provider-neutral (`board:label`); the
      label **list** is unchanged (AC #8 — diff shows no rows added or removed)
- [ ] Grep check (AC #2): `backlog ` across `*/skills/**/SKILL.md` appears only in the
      table's `backlog` column or in explicitly-scoped "on a Backlog host" illustrations
- [ ] Bump **every** rewritten skill's own `version:`; run
      `node scripts/check-version-bump.mjs` locally to confirm the per-skill rule is satisfied
- [ ] Bump the marketplace version; run `node scripts/sync-version.mjs`
- [ ] Re-pin `docs/wiki/` notes whose `sources:` list a rewritten skill — at minimum
      `pdlc-sweep`, `pdlc-sweep-history-recent`, `pdlc-refactor-triage`,
      `spec-bridge-plugin`, `reorient-plugin`; classify each **RE-PIN-ONLY** or
      **NEEDS-REVIEW** and amend prose before bumping
- [ ] Add a corpus note or INDEX row for the verb table if the corpus needs one
- [ ] All four project gates green: `node --test`, `check-docs.mjs`,
      `sync-version.mjs --check`, freshness
- [ ] Commit

## Notes

(Implementers append findings here — the phase-to-phase handoff artifact.)

### Phase 1 (2026-09-09)

Full call-site enumeration (file:line, operative-vs-incidental classification) recorded in
`specs/055-board-verb-table/findings/phase-1-call-sites.md` — not inline here, since Phase 4
needs to grep/scan it per skill and a separate file is easier to diff against as skills get
rewritten.

**Spec.md's claimed counts, verified against the actual files:**

| Skill | Spec claim | Raw `backlog ` grep | Real operative call sites |
|---|---|---|---|
| `spec-bridge:link` | 6 | 6 | 6 |
| `pdlc:sweep` | 3 | 3 | 3 |
| `pdlc:refactor-triage` | 3 | 3 | **1** (2 of 3 hits are incidental prose) |
| `spec-bridge:sync` | 2 | 2 | 2 |
| `pdlc:bootstrap` | 2 | **3** | **1** (raw count is wrong; 2 of 3 hits are incidental) |
| `reorient:reorient` | 1 | 1 | 1 |

`pdlc:bootstrap`'s raw grep count is 3, not the 2 spec.md claims. Separately, two skills
(`pdlc:bootstrap`, `pdlc:refactor-triage`) have grep hits that turn out to be incidental
mentions (a cross-skill reference, a quoted error message, a "backlog task" noun phrase) —
not commands to replace. One real operative call site (`spec-bridge:link`'s `--ac "Spec
phase: Setup"`, line 44) is invisible to a `backlog ` grep entirely. Full detail and
per-line classification in the findings file above.

**Verb set:** 13 verbs — `board:list`, `board:view`, `board:create`, `board:link-spec`,
`board:ac-set`, `board:ac-check`, `board:status`, `board:claim`, `board:final`, `board:note`,
`board:label`, `board:sync-mirror`, `board:init` — authored in `docs/board-verbs.md`.
Dropped `board:plan` (no real call site in any of the six skills — a `CLAUDE.md`-level
convention, not one these skills resolve). Added `board:init` beyond spec.md's sketch table
(real call site: `pdlc:bootstrap`'s peer-initialization step, with a genuine per-provider
resolution, precondition, and evidence artifact).

### Phase 2 (2026-09-09)

`labels` added to `LINK_KEYS` (optional — a missing key round-trips through
`orderedObject`/`serializeMirror` unchanged, no code path requires it). `validateMirror` only
checks `labels` when the key is present: not-an-array or a non-string entry is an error naming
`links[i].labels[j]`; a link with no `labels` key at all passes clean (proven against this
repo's own `.board/links.json`, which has none). `parseLinkedTask` parses frontmatter's
`labels:` (both the real Backlog.md block-list form and an inline `[]`/`[a, b]` form) but
**omits the key** when the list is empty — load-bearing, because `test/spec-bridge.test.mjs`
(frozen per the design doc's invariant 1) asserts `parseLinkedTask`'s exact return shape for an
unlabelled task; `projectBacklog` rides the same omission through unchanged. Added
`isPausedLink(link)` — reads `labels` off a mirror link only, never `backlog/tasks/*.md` — as
the primitive AC #7 needs: proven with a mirror-only fixture (no `backlog/tasks/` on disk at
all) whose one link carries `labels: ["paused"]`, filtered out of a stand-in "conflict
analysis" list using only `isPausedLink`. **Scope note:** wiring this primitive into
`pdlc:sweep`'s actual runbook-authoring prose (today it reads `paused` from Backlog frontmatter
directly) is Phase 4's skill-rewrite job, not Phase 2's — `isPausedLink` is the mirror-side
half of the fix; the sweep-side consumer is unchanged here.

Running `node lib/board-mirror.mjs --check --root .` after this change: still reports exactly
one drifted id, `TASK-112` — pre-existing before this phase (Phase 1's commit ticked ACs #1/#4
in the task file's frontmatter without re-running `board:sync-mirror`; unrelated to labels).
Separately, and expectedly, 50 already-linked tasks now carry real frontmatter labels the
committed mirror predates — recomputing shows a `labels` diff for each (the CLI's per-id
drilldown doesn't surface them, since it compares only `{id,status,specDir,acs}`, but the
overall byte comparison correctly fails). This is the intended effect of AC #6/#7, not a bug:
the mirror is now stale w.r.t. labels until the next `board:sync-mirror` regenerates it — left
undone here as out of this phase's scope (regenerating 50 entries' worth of label data is a
bigger, unrelated diff than a schema-and-projector phase should carry).

### Phase 3 (2026-09-09)

**Placement, decided against the README chassis-registration gate:** `scripts/check-docs.mjs`
requires every `lib/*.mjs` file to be named in README's chassis section, so a brand-new `lib/`
module for the block pair would force an out-of-scope README edit (Phase 4 owns doc/version
work). Both new pieces therefore landed inside **existing** modules instead: the render/parse
pair (`renderSpecPhasesBlock`/`parseSpecPhasesBlock`) in `lib/board-mirror.mjs`, right after
`isPausedLink` — it produces and consumes exactly that file's own `acs` shape and needs nothing
else; `renderJira` in `spec-bridge/gates/bridge.mjs`, immediately after `renderBacklog` (its
literal sibling, same file, same `(id, intents[, config])` shape). `TASK_LINE` was exported
from `lib/spec-derive.mjs` (one-word change, `const` → `export const`) rather than duplicated —
the parser reuses it verbatim.

**A real architectural gap, resolved and documented in `renderJira`'s own header:** given only
`(id, intents, config)` — no task snapshot, no `derived` — `renderJira` cannot know a surviving
AC's original text (only its post-edit index), so it cannot resolve a literal final description
string for the wholesale block rewrite. Its `editJiraIssue` call therefore carries the **raw
diff** (`acRemove`/`acAdd`/`acCheck`/`acUncheck`, exactly as intents holds them) as `args`, not a
computed description. Resolving that diff against the block's *current* live text — read via
`getJiraIssue`, `parseSpecPhasesBlock`, apply the diff, `renderSpecPhasesBlock`, write via
`editJiraIssue` — needs live data a pure function neither has nor is allowed to fetch; it is
spec 056's skill's job. This is exactly why the render/parse pair is a separate, independently
reusable primitive rather than something `renderJira` calls internally.

**Ordering:** status move → AC block (collapsed to one call) → note, mirroring
`renderBacklog`'s order. Done is special-cased per `docs/board-verbs.md`'s `board:final` row,
jira column: comment the final summary, *then* transition — Backlog's single combined
`-s Done --final-summary` has no Jira analogue, so it splits into two ordered calls. The
separate progress `note` (always present when anything changed, independent of `finalSummary`)
still lands as its own trailing comment either way — same redundancy Backlog's renderer already
has (a `--append-notes` call fires whether or not the same turn set `--final-summary`).

**Round-trip proof (AC #5) and both live Jira normalizations, tested as one fixture**
(`test/board-mirror.test.mjs`): a block with a blank line right after `<!-- spec-phases BEGIN
-->` and two trailing spaces on the *last* checkbox line parses to the clean
`[{ index, checked, text }]` shape with no special-casing needed — blank lines are skipped
outright, and `TASK_LINE`'s own `(\S.*?)\s*$` already strips trailing whitespace from the
captured text (spec-derive.mjs's own guarantee, now cited from its export comment). A second
round-trip test proves `renderSpecPhasesBlock(parseSpecPhasesBlock(x))` is idempotent once
normalized. "Two blocks is an error" is enforced by counting BEGIN/END occurrences before doing
anything else. The `Spec: <dir>` marker fixture confirms `MARKER` still matches with a block
preceding it (the regex is per-line-anchored, so this was never really in doubt, but it's now
proven rather than assumed, per the phase brief).

**`renderBacklog` is untouched** — confirmed both by the unmodified protected tests passing and
by a direct AST-adjacent byte comparison of the function body against `HEAD` (identical).

**Scope note for Phase 4:** `renderJira` is not wired into `planBridge`'s non-backlog branch
(that still returns the AC #8 `intents` + notice shape, unchanged) — spec 056's skill is the
stated consumer of `renderJira`, and wiring it into `planBridge` isn't asked for by any AC here;
doing so would also require deciding how the skill's live-fetched data reaches `renderJira`,
which is 056's design, not this phase's.
