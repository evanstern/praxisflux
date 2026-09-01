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

- [ ] Write the AC #6 grep test **first**: the rendered `pdlc:peer:jira` block contains zero
      occurrences of the string `backlog ` (the mechanical guard against copy-paste drift)
- [ ] Add `jira` to `PEERS` in `pdlc/scripts/plant.mjs`
- [ ] Add the mutual-exclusion check immediately after the existing unknown-peer validation,
      in the same block, with a message carrying the **reason** (one board is the plan of
      record), not just the rule
- [ ] Author the `pdlc:peer:jira` block in `pdlc/templates/CLAUDE.md` by walking
      `pdlc:peer:backlog` line by line and writing each line's Jira form. The two lines that
      change in **kind**: hand-edit prohibition (now `.board/links.json` / `board:sync`) and
      two-track landing (Jira board changes produce **no commit**, so state the mechanics
      differently while preserving intent)
- [ ] Cover all six R5 points; include the R3 composition; include the pointer to the verb
      table (spec 055) without restating it — one home per rule
- [ ] Verify the block renders with `--peer jira` and strips without it (AC #4)
- [ ] Verify `--peer backlog --peer jira` errors (AC #5)
- [ ] Verify `.pdlc` records `jira` under `peers` / `peersOmitted` with **no** sentinel
      schema change (AC #7)
- [ ] Extend `test/pdlc.test.mjs` for ACs 4–7; existing cases pass **unedited**
- [ ] Commit

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
