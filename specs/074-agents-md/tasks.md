# Spec 074 — tasks

**Task:** TASK-0134 · Phases are internal breakdown; they ride this one branch and merge in
this task's single PR. Each phase is one fresh implementer dispatch.

## Phase 1 — plant.mjs plants AGENTS.md with a CLAUDE.md pointer

- [x] Rename `pdlc/templates/CLAUDE.md` → `pdlc/templates/AGENTS.md` (content unchanged); `plant()`'s default `templatePath` follows
- [x] `plant()` writes the block into `<root>/AGENTS.md` with `created/appended/replaced/unchanged/drifted` reported as `agentsMd`
- [x] `plant()` ensures `CLAUDE.md`'s first line is `@AGENTS.md`; reports `claudeMd` as `created/pointer-added/unchanged/migrated/drifted`; text below the pointer survives
- [x] Legacy block in `CLAUDE.md`: `drifted` without `--force` (nothing written, sentinel held, `--check` exits 1 with the drifted remedy); `migrated` with `--force` (block to AGENTS.md, surrounding text kept below the pointer)
- [x] Both files marked: AGENTS.md authoritative; CLAUDE.md copy drifted until `--force`
- [x] `missing` requires `AGENTS.md` and `CLAUDE.md`; CLI `pending` includes `agentsMd`
- [x] `excludeSet` unchanged; local-only first plant leaves `git status` clean (existing test still green)
- [x] `test/pdlc.test.mjs` updated and extended: target, pointer content, project-text survival, drift+consent on AGENTS.md, migration with and without `--force`, both-marked case, rendered block byte-identical to the pre-change render

## Phase 2 — repo tooling follows the load-bearing file

- [x] `scripts/sync-version.mjs` stamps the BEGIN marker in `AGENTS.md`, falling back to `CLAUDE.md` when AGENTS.md has no marker; `test/sync-version.test.mjs` covers both
- [x] `scripts/check-docs.mjs` reads `AGENTS.md` for the releasing.md link rule and asserts `CLAUDE.md`'s first line is `@AGENTS.md`; `test/check-docs.test.mjs` updated
- [x] Wording in `scripts/stop-docs.mjs`, `.githooks/pre-commit`, `.githooks/pre-push`, `.github/workflows/ci.yml` names AGENTS.md as the load-bearing file (CI's plant command unchanged)
- [x] Full suite green

## Phase 3 — dogfood this repo, and bootstrap teaches it

- [x] `node pdlc/scripts/plant.mjs --root . --peer backlog --force` migrates the root block
- [x] Root orientation text and Backlog.md guidelines moved by hand into `AGENTS.md` above the BEGIN marker; `CLAUDE.md` is exactly `@AGENTS.md`
- [x] Record on the card whether `backlog` targets AGENTS.md for its guidelines (read its help/config; no guessing)
- [x] `plant.mjs --root . --peer backlog --check` exits 0; `check-docs.mjs` and `sync-version.mjs --check` pass
- [x] `pdlc/skills/bootstrap/SKILL.md` teaches AGENTS.md-first + pointer purpose; report names both files and which is load-bearing; Output gate verifies markers in AGENTS.md and pointer in CLAUDE.md; `version:` bumped
- [x] `pdlc/README.md` updated to match

## Phase 4 — cross-plugin planters and prose (haiku-suitable)

- [x] `educate/templates/CLAUDE.md` → `AGENTS.md`; `educate:start` plants AGENTS.md + pointer, detects existing projects by AGENTS.md, CLAUDE.md or topics/, update path reconciles AGENTS.md; `version:` bumped
- [x] `research/templates/CLAUDE.md` → `AGENTS.md`; `research:research-vault` recognizes AGENTS.md or CLAUDE.md, scaffolds AGENTS.md + pointer; `analyze-vault` and `vault-artifact` wording; versions bumped
- [x] Tests assert each template's new path and that each planter SKILL.md names AGENTS.md as the planted file
- [x] Prose corrected: `README.md`, `docs/principles.md`, `docs/skill-patterns.md`, `docs/releasing.md`, `docs/task-courses.md`, `docs/board-verbs.md`, `docs/task-labels.md`, `lib/installer.mjs` header, `pdlc/skills/sweep/SKILL.md` (+ version bump)
- [x] `pdlc/hooks/root-guard-hook.mjs` blocking messages (`:458`, `:654`) point at AGENTS.md (or CLAUDE.md on hosts not yet re-planted); root-guard tests still green
- [x] Constitution source citations (Articles IV, VI, VII) point at root `AGENTS.md`; version 1.0.0 → 1.0.1, Last Amended updated

## Phase 5 — release, re-ground, gates

- [ ] `node scripts/sync-version.mjs 0.67.0`; re-plant so the block stamp matches
- [ ] Every edited skill's `version:` increased; `check-version-bump.mjs --base origin/main` passes
- [ ] `/grounding-wiki:wiki-update` run; every stale note classified and re-pinned honestly (prose saying the block lives in CLAUDE.md amended before re-pin)
- [ ] All gates green: `node --test`, `check-docs`, `sync-version --check`, `gen-marketplace --check`, `build.mjs`, `plant.mjs --check`, `run-gates spec-bridge`, `run-gates wiki-freshness`
