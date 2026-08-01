# 048 — tasks

Phased work breakdown. The spec-bridge derives the board card's phase acceptance criteria and
its status from these headings and checkboxes, so the phases are real slices — each leaves the
tree green and is committed before the next begins.

## Phase 1: Plant the rubric

- [x] Add `## Model tiers — who does what work` to `pdlc/templates/CLAUDE.md`, inside the
      `pdlc:grounding` markers, after "Rules that always hold" and before the peer blocks
- [x] Section carries the three-row tier ladder: default implementer `claude-opus-5`,
      mechanical `claude-sonnet-5`, fallback `claude-opus-4-8`
- [x] Section names the pinning mechanism — an explicit `model:` in an agent definition's
      frontmatter at `.claude/agents/<tier>-implementer.md`
- [x] Section cites the 2026-07-31 field case (the dispatch-call `model` parameter silently
      ignored; `docs/design/board-cost-test-runbook.md`, TASK-74 row)
- [x] Section states the authority rule: the table is the planted default, the agent
      definition's `model:` is authoritative at dispatch, and changing a tier's model is a
      one-line edit there — outside every marker, no `--force`
- [x] Section stays tight (always-on context in every bootstrapped project) — ladder,
      mechanism, authority rule; no restatement of sweep's dispatch procedure
- [x] `node --test` green

## Phase 2: Teach it in bootstrap

- [x] `pdlc/skills/bootstrap/SKILL.md` gains resolve-then-plant guidance: consult the
      `claude-api` skill for current model IDs; never author them from memory
- [x] Availability check named — the harness's own agent-definition surface; a tier whose ID
      the harness will not accept is unavailable and the fallback applies
- [x] Fallback behavior named, including recording which model actually served
- [x] Refresh path documented both ways: re-run `pdlc:bootstrap` for the planted doctrine
      (drift → diff → consent → `--force`); edit the agent definition's frontmatter for a pin
- [x] Bootstrap skill `version:` 0.8.0 → 0.9.0
- [x] `node --test` and `node scripts/check-docs.mjs` green

## Phase 3: Point sweep at it

- [x] `pdlc/skills/sweep/SKILL.md` Phase 1 item 2 names where a bootstrapped project's rubric
      lives — the planted `## Model tiers` section and `.claude/agents/<tier>-implementer.md`
- [x] No change to sweep's dispatch procedure (that is TASK-97's scope)
- [x] Sweep skill `version:` 0.17.0 → 0.18.0
- [x] **Two-way contract verified by reading**: the location sweep names and the location
      bootstrap plants to are the same — confirmed by reading both edits together
- [x] `node --test` and `node scripts/check-docs.mjs` green

## Phase 4: Pin the contract in tests

- [ ] `test/pdlc.test.mjs` asserts the template carries the model-tier section inside the
      grounding markers
- [ ] Asserts the section names the frontmatter-pinning mechanism (`.claude/agents`, `model:`)
      and cites the field case
- [ ] Asserts the section names the agent-definition path as authoritative
- [ ] Asserts the bootstrap skill instructs resolving IDs against the live harness
- [ ] Assertions anchor on stable strings (paths, marker names, `model:`, the field-case date),
      never on full sentences — the test must survive a reword
- [ ] Matches the existing plugin test standard (the file's template-content tests are the model)
- [ ] `node --test` green

## Phase 5: Re-plant, bump, re-ground

- [ ] `node pdlc/scripts/plant.mjs --root . --peer backlog --check` run first; drift diffed
- [ ] Any deliberate hand edits in this repo's block relocated outside the markers, never
      clobbered (standing operator convention)
- [ ] Re-plant with `--force`; `--check` then exits 0 reporting `claudeMd: unchanged`
- [ ] `node scripts/sync-version.mjs <next>` at merge-readiness (0.51.0 → next free);
      `--check` green
- [ ] Freshness gate run; each staled pin classified against
      `git diff <old-pin>..HEAD -- <sources>` as RE-PIN-ONLY or NEEDS-REVIEW
- [ ] `docs/wiki/pdlc-plugin.md` prose amended against the diff, then re-pinned
- [ ] `docs/wiki/pdlc-sweep.md` prose amended against the diff, then re-pinned
- [ ] `CAPSULES.md` regenerated if any note's `description:` changed
- [ ] `node --test`, `node scripts/check-docs.mjs`, and the freshness gate all green
