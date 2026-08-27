# 054 — tasks

Phases are the dispatch unit: one fresh implementer per phase, re-grounded from this spec
dir plus the branch's commits. Nothing rides chat context between phases.

**Precondition:** spec 052 is merged (`lib/board-mirror.mjs` and its `providers` registry
exist).

## Phase 1 — The config module

- [ ] Read `lib/board-mirror.mjs` (052), `pdlc/templates/model-tiers.json`, and
      `pdlc/skills/bootstrap/SKILL.md`'s "Model tiers" section; record in Notes the
      operator-owned-config rules being copied (plant only when absent, outside markers,
      doctrine points at config)
- [ ] Implement `loadBoardConfig(root)` in `lib/board-mirror.mjs`: `{ provider: "backlog" }`
      when absent; **throws** on malformed JSON; **throws naming the known providers** on an
      unknown provider name
- [ ] Confirm there is no silent fallback path for an unknown provider — a typo'd provider
      must never be treated as `backlog` (that reintroduces the silent no-op through a typo)
- [ ] Implement `validateBoardConfig(config)` for R2's cases: `provider` as an array,
      unknown provider, `jira` missing each of `cloudId`/`projectKey`/`issueTypeName`,
      non-object `statusMap`
- [ ] Document the R3 status-mapping composition (stage → bridge status → site status) in the
      module header with the diagram
- [ ] Tests for ACs 1–3, including `{ "provider": "backlog" }` as a complete valid config
- [ ] Commit

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

(Implementers append findings here — the phase-to-phase handoff artifact.)
