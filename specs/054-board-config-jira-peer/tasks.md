# 054 — tasks

Phases are the dispatch unit: one fresh implementer per phase, re-grounded from this spec
dir plus the branch's commits. Nothing rides chat context between phases.

**Precondition:** spec 052 is merged (`lib/board-mirror.mjs` and its `providers` registry
exist).

## Phase 1 — The config module

- [x] Read `lib/board-mirror.mjs` (052), `pdlc/templates/model-tiers.json`, and
      `pdlc/skills/bootstrap/SKILL.md`'s "Model tiers" section; record in Notes the
      operator-owned-config rules being copied (plant only when absent, outside markers,
      doctrine points at config)
- [x] Implement `loadBoardConfig(root)` in `lib/board-mirror.mjs`: `{ provider: "backlog" }`
      when absent; **throws** on malformed JSON; **throws naming the known providers** on an
      unknown provider name
- [x] Confirm there is no silent fallback path for an unknown provider — a typo'd provider
      must never be treated as `backlog` (that reintroduces the silent no-op through a typo)
- [x] Implement `validateBoardConfig(config)` for R2's cases: `provider` as an array,
      unknown provider, `jira` missing each of `cloudId`/`projectKey`/`issueTypeName`,
      non-object `statusMap`
- [x] Document the R3 status-mapping composition (stage → bridge status → site status) in the
      module header with the diagram
- [x] Tests for ACs 1–3, including `{ "provider": "backlog" }` as a complete valid config
- [x] Commit

## Phase 2 — `plant.mjs` peer plumbing and the grounding block

- [x] Write the AC #6 grep test **first**: the rendered `pdlc:peer:jira` block contains zero
      occurrences of the string `backlog ` (the mechanical guard against copy-paste drift)
- [x] Add `jira` to `PEERS` in `pdlc/scripts/plant.mjs`
- [x] Add the mutual-exclusion check immediately after the existing unknown-peer validation,
      in the same block, with a message carrying the **reason** (one board is the plan of
      record), not just the rule
- [x] Author the `pdlc:peer:jira` block in `pdlc/templates/CLAUDE.md` by walking
      `pdlc:peer:backlog` line by line and writing each line's Jira form. The two lines that
      change in **kind**: hand-edit prohibition (now `.board/links.json` / `board:sync`) and
      two-track landing (Jira board changes produce **no commit**, so state the mechanics
      differently while preserving intent)
- [x] Cover all six R5 points; include the R3 composition; include the pointer to the verb
      table (spec 055) without restating it — one home per rule
- [x] Verify the block renders with `--peer jira` and strips without it (AC #4)
- [x] Verify `--peer backlog --peer jira` errors (AC #5)
- [x] Verify `.pdlc` records `jira` under `peers` / `peersOmitted` with **no** sentinel
      schema change (AC #7)
- [x] Extend `test/pdlc.test.mjs` for ACs 4–7; existing cases pass **unedited** — WITH ONE
      NAMED DEVIATION: see Phase 2 notes below. Adding `jira` to `PEERS` (now 3 members, one
      pair mutually exclusive) mechanically invalidated the *content* of 5 pre-existing cases
      whose literal expectations assumed exactly 2, mutually-compatible peers; those 5 were
      edited (never their intent) so the suite stays honest rather than green-by-omission.
- [x] Commit

## Phase 3 — Bootstrap skill prose, docs sync, re-ground

- [ ] Rewrite `bootstrap/SKILL.md`'s peer section to handle a third peer whose availability is
      **MCP-tool presence, not `command -v`** — state the difference in kind explicitly so the
      skill never tells an operator to install a nonexistent Jira CLI
- [ ] Document discover-don't-ask resolution, citing the SDLC-pipeline precedent:
      `getAccessibleAtlassianResources` → `cloudId`;
      `getVisibleJiraProjects` → `projectKey`;
      `getJiraProjectIssueTypesMetadata` → `issueTypeName`;
      `atlassianUserInfo` → the account id for `defaultAssignee: "self"`
- [ ] Document write-`.board.json`-only-when-absent (the `model-tiers.json` rule)
- [ ] Document the `backlog`+`jira` refusal and its reason
- [ ] Extend the skill's Output gate: `.board.json` valid, planted block present, and for a
      `requiresSync` provider a stated reminder that `board:sync` must run before the gate has
      any evidence at all
- [ ] Bump `bootstrap`'s skill `version:` (per-skill rule, `docs/releasing.md`)
- [ ] Bump the marketplace version; run `node scripts/sync-version.mjs`
- [ ] Update `README.md` and `CLAUDE.md` wherever they enumerate the peers —
      `check-docs.mjs` enforces this
- [ ] Re-pin `docs/wiki/` notes: `pdlc-plugin`, `pdlc-grounding-block`, plus any note listing
      `plant.mjs` or the template as a source; classify each **RE-PIN-ONLY** or
      **NEEDS-REVIEW**
- [ ] All four project gates green: `node --test`, `check-docs.mjs`,
      `sync-version.mjs --check`, freshness
- [ ] Commit

## Notes

### Phase 1 (sonnet-implementer, re-dispatch)

**Operator-owned-config rules copied from the `model-tiers.json` precedent** (per
`pdlc/templates/model-tiers.json` + `bootstrap/SKILL.md`'s "Model tiers" section):
1. Plant/write **only when absent** — a re-run must never revert an operator-changed value.
2. Live **outside every marker** — a plain tracked file, one-line edits, no drift, no
   `--force`, no re-plant.
3. The planted doctrine block **points at** the config; it never restates its contents.
4. The config is what you edit; something generated/derived is what holds.
`.board.json` follows the same four rules — it is operator config, not planted doctrine.

**Design ruling applied (from the dispatching orchestrator, resolving a real tension the
spec text left implicit):** kept the projector `providers` registry in `board-mirror.mjs`
untouched (`backlog` only — spec 056 still owns adding `jira`'s `project`/`requiresSync`
entry there) and added a **separate**, smaller `BOARD_CONFIG_PROVIDERS` table
(`{ backlog: { requiredFields: [] }, jira: { requiredFields: [...] } }`) that
`loadBoardConfig`/`validateBoardConfig` consult. The split is commented at both the table's
declaration and in the module header so a later reader doesn't "tidy" the two tables into one
and re-couple config validation to projector implementation.

**Implemented in `lib/board-mirror.mjs`:**
- `loadBoardConfig(root)` — `{ provider: "backlog" }` when `.board.json` is absent; throws
  `"<path>: malformed JSON (...)"` on bad JSON; throws
  `"<path>: unknown board provider ... (known: backlog, jira)"` on an unrecognized provider.
- `validateBoardConfig(config)` — returns `string[]`; covers provider-as-array, unknown
  provider, missing `jira` required fields (one problem per missing field), non-object
  `statusMap`. `{ provider: "backlog" }` validates to `[]`.
- R3's stage→bridge-status→site-status diagram documented in the module header, next to a
  paragraph distinguishing `.board.json` (config) from `.board/links.json` (state).

**No-silent-fallback verification:** `loadBoardConfig` has exactly one branch that reaches a
`return` for an unrecognized provider name — there is none; the only path is
`if (!BOARD_CONFIG_PROVIDERS[name]) throw ...` executed *before* the function's only `return
config` line, so an unknown name can never reach a return. Confirmed by a test asserting the
throw for both a clearly-wrong name (`"trello"`) and a Jira-typo name (`"typo-of-jira"`), and
by reading the function top-to-bottom: no `|| "backlog"`, no `??`, no catch-and-default
anywhere in the load path. `validateBoardConfig`'s unknown-provider branch is likewise a
terminal `problems.push(...)` in an `else if` chain — it never falls through to the
required-fields check for a name `BOARD_CONFIG_PROVIDERS` doesn't have.

**Ambiguity resolved:** none beyond the providers-table split, which the dispatch prompt had
already ruled on (recorded above for Phase 2/3's grounding, since the `pdlc:peer:jira` block
in Phase 2 references this same split).

**For Phase 2/3:** `BOARD_CONFIG_PROVIDERS` and `loadBoardConfig`/`validateBoardConfig` are
in place and tested; nothing else in `lib/board-mirror.mjs` changed. `providers` (the spec
052/056 projector registry) is exactly as it was — still `backlog`-only. Baseline suite was
468/468 before this phase; 479/479 after (11 new tests, all in `board-mirror.test.mjs`).

### Phase 2 (sonnet-implementer)

**Implemented:**
- `pdlc/scripts/plant.mjs`: `PEERS` grew `jira` (`["backlog", "spec-kit", "jira"]`); the
  mutual-exclusion check landed immediately after the existing unknown-peer throw, in the
  same validation block: `if (peers.includes("backlog") && peers.includes("jira")) throw new
  Error("peers backlog and jira are mutually exclusive — one board is the plan of record")`.
  Usage strings (top-of-file comment + CLI `usage:` error) updated to list `--peer jira`.
- `pdlc/templates/CLAUDE.md`: a new `<!-- pdlc:peer:jira BEGIN/END -->` block, placed
  immediately after `pdlc:peer:backlog` (grouping the two board-provider peers together,
  ahead of the differently-shaped `spec-kit` peer). Covers R5's six points: (1) Jira as
  board/plan-of-record with `.board/links.json` as the hand-edit-forbidden receipt refreshed
  by `board:sync`; (2) the pointer to the spec-055 verb table, not restated; (3) One
  TASK/one PR in Jira's spelling (Epic → no PR, Sub-task → rides parent's PR); (4) two-track
  landing restated for "no commit at all"; (5) the mirror's staleness contract; (6) the
  `statusVocabulary`/`statusMap` composition diagram from R3.

**The two lines that change in kind (verbatim, and why):**
1. *Hand-edit prohibition* — "**Never hand-edit** `.board/links.json` — always `board:sync`,
   so the mirror and Jira stay consistent." (Backlog's form names a CLI; Jira's has no
   markdown files to protect — the derived artifact is the sync'd link mirror, and the verb
   that regenerates it is a skill, not a CLI subcommand.)
2. *Two-track landing* — "**Two-track landing, restated for Jira:** board/bookkeeping state
   (status, comments, assignee) lives in Jira and produces **no commit at all** — there is
   no git-side board track to land. Deliverable work still lands by PR; what changes is that
   one of the two tracks has no commit to speak of, not the split itself." Chose to state
   this as "one track has no commit" rather than trying to force a Jira analogue of "direct
   to main" — under Backlog the board track *is* a git commit; under Jira there is no git
   object to point at, so restating the rule with fabricated git mechanics would be false.
   The intent preserved is the *separation* (bookkeeping vs. deliverable), not the mechanism.

**Mutual-exclusion error message:** `"peers backlog and jira are mutually exclusive — one
board is the plan of record"` — carries the reason (design invariant 2) per R4/AC #5, not
just "these two can't combine."

**Verified:** `renderGrounding(... peers: ["jira"])` includes `pdlc:peer:jira BEGIN` and the
block (isolated by its markers) contains zero occurrences of `"backlog "`; `peers: []`
strips it; `plant(root, { peers: ["backlog", "jira"] })` throws the message above;
`plant(root, { peers: ["jira"] })` sentinel gets `peers: ["jira"]`,
`peersOmitted: ["backlog", "spec-kit"]`, with the sentinel's key set unchanged (`planted`,
`version`, `name`, `peers`, `peersOmitted`, `hooks`, `plantedAt` — no new fields).

**Spec ambiguity / conflict, named and resolved:** the dispatch instructed that
`test/pdlc.test.mjs`'s **existing** cases must "pass unedited." That is not jointly
satisfiable with R4 as specified, because growing `PEERS` to 3 members with one
mutually-exclusive pair mechanically invalidates the *literal content* of pre-existing
tests that assumed exactly 2, freely-combinable peers:
- `"unknown peers are rejected"` used `peers: ["jira"]` as its example of an unknown peer —
  `"jira"` is no longer unknown. Changed the example to `"trello"` (matching the naming
  Phase 1 already used for the same purpose in `board-mirror.test.mjs`); the test's
  behavior/intent (reject an unrecognized peer) is unchanged.
- `"sentinel records peersOmitted …"` hardcoded `peersOmitted === ["spec-kit"]` for
  `peers: ["backlog"]`, and asserted `plant(root, { peers: [...PEERS] })` yields
  `peersOmitted: []` ("nothing omitted when every known peer is opted in") — the latter is
  now categorically unreachable, since `[...PEERS]` always contains both `backlog` and
  `jira`, which the mutual-exclusion check now rejects outright. Updated the literal
  `["spec-kit"]` → `["spec-kit", "jira"]`, and changed the "opt into everything" step to opt
  into `PEERS.filter(p => p !== "backlog")` (the largest peer set jira is compatible with),
  asserting the one remaining omission is `["backlog"]` — the same *shape* of assertion
  (maximal opt-in ⇒ minimal omission), adjusted to what's actually reachable.
- `"CLI emits a one-line stderr notice …"` had the same two problems in its `--peer backlog`
  case (one stale line → two) and its "both peers, no notice" case (`--peer backlog --peer
  spec-kit` can never again mean "every known peer," since `jira` always remains omitted).
  Reworked the second case to `--peer spec-kit --peer jira`, asserting the sole remaining
  notice names `backlog` — again the same intent (the maximal-compatible-set case produces
  the fewest possible notices), not a new one.
- `"legacy sentinels without peersOmitted …"` hardcoded the same stale `["spec-kit"]` for a
  `peers: ["backlog"]` upgrade; updated to `["spec-kit", "jira"]`.

None of these four edits changed what a test verifies — each verifies the exact same
property against the exact same peer combinations' *actual* post-R4 behavior. All were
necessary consequences of R4 itself (a required, specified behavior change), not of any
choice made in authoring the `jira` block. Full suite: 479 (Phase 1 baseline) → 483 (4 new:
the AC #6 grep test, AC #4 render-both-ways, AC #5 mutual-exclusion, AC #7 sentinel-schema),
all green, zero failures. `test/spec-bridge.test.mjs`, `test/project-gates.test.mjs`,
`test/phase-status.test.mjs` untouched (confirmed via `git diff --stat` — empty).

**For Phase 3:** the bootstrap `SKILL.md` peer section, docs sync, version bumps, and
re-grounding are still entirely open. Nothing in `lib/board-mirror.mjs` or the `providers`
projector registry changed in this phase.
