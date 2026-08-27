# 055 — tasks

Phases are the dispatch unit: one fresh implementer per phase, re-grounded from this spec
dir plus the branch's commits. Nothing rides chat context between phases.

**Precondition:** specs 052–054 merged. `lib/board-mirror.mjs` has the mirror + config;
`bridge.mjs` reads the mirror and the planner is split into `planIntents` + `renderBacklog`.

## Phase 1 — Enumerate the real call sites, author the verb table

- [ ] Enumerate **every** board command across the six skills (`spec-bridge:link` 6,
      `pdlc:sweep` 3, `pdlc:refactor-triage` 3, `spec-bridge:sync` 2, `pdlc:bootstrap` 2,
      `reorient:reorient` 1) and record the list in Notes with file:line for each
- [ ] Group them by **intent** and derive the smallest verb set that covers the real call
      sites — no speculative verbs (`board:assign`, `board:reprioritize`) that no skill uses
- [ ] Author `docs/board-verbs.md` with one row per verb and, for each,
      **all four** columns: verb name, per-provider resolution, **preconditions**, and
      **evidence artifact**
- [ ] Audit the table: any row whose evidence column would read "none" is a design smell —
      find the artifact or drop the verb. Record any dropped verb and why
- [ ] Document R2's marked-block contract in the table doc: text outside markers never
      touched, block replaced wholesale, `Spec:` line stays outside, one block per issue,
      two blocks = validation error
- [ ] Commit

## Phase 2 — Mirror labels and the paused-lane fix (correctness, early)

- [ ] Add optional `labels: []` per link to the mirror schema in `lib/board-mirror.mjs`;
      additive and round-tripped when an older writer omits it
- [ ] Project `labels` in the `backlog` projector (from task-file frontmatter `labels:`)
- [ ] Record the schema addition in `lib/board-mirror.mjs`'s header **and** in
      `docs/design/board-provider-seam.md`, so a reader of spec 052 alone is not misled
- [ ] Test AC #6: a mirror written without `labels` still validates; one with them
      round-trips
- [ ] Test AC #7: a mirror-only project whose link carries `paused` is **excluded** from
      lane-conflict analysis — this is the destructive bug the fix prevents (a sweep claiming
      an operator's parked branch)
- [ ] Commit

## Phase 3 — The block render/parse pair and `renderJira`

- [ ] Implement render + parse for the `<!-- spec-phases -->` block **as a pair in one
      module**, reusing `lib/spec-derive.mjs`'s `TASK_LINE` regex family — do **not** write a
      third checkbox parser
- [ ] Document in the header that block indexes are **positional** (1-based within the
      block), not identities — a reordered block renumbers
- [ ] Round-trip test (AC #5): render → parse → identical `[{ index, checked, text }]`,
      matching the mirror's `acs` shape
- [ ] Verify the `Spec: <dir>` marker still matches `MARKER`
      (`/^Spec:\s*(\S+?)\/?\s*$/m`, `bridge.mjs:238`) when it follows the block in a
      description — **confirm with a fixture, do not assume**; that regex arms the whole gate
- [ ] Implement `renderJira(id, intents, config)` → ordered `{ tool, args, why }`; **pure, no
      MCP, no network**
- [ ] Map intents to tools: `statusTo` → `transitionJiraIssue` via `statusMap`; all AC
      operations → **one** `editJiraIssue` rewriting the block wholesale; `note` →
      `addCommentToJiraIssue`. Comment the AC collapse — a reader who knows the Backlog path
      will look for the index-ordering dance and correctly not find it
- [ ] Unit-test `renderJira` against fixture intents; confirm `renderBacklog` still produces
      today's exact strings (AC #9)
- [ ] Commit

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
