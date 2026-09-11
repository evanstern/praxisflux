# 067 — tasks

## Phase 1: Install Spec Kit tooling

- [x] Run `specify init --here --integration claude --ignore-agent-tools --force` in the task worktree
- [x] Review installer writes; revert any touch to `.claude/agents/*`, `.claude/model-tiers.json`, `CLAUDE.md`, `specs/**`, existing house files
- [x] Confirm `.specify/` present (templates, scripts, memory) and `/speckit.*` command files installed for Claude Code
- [x] Commit the reviewed install

## Phase 2: Reconcile templates and verify bridge derivation

- [ ] Edit `.specify/templates/` in place to the house format: board-task header, no escape-line header, phased checkbox `tasks.md`
- [ ] Generate a spec dir from the reconciled templates and run `node spec-bridge/gates/cli.mjs state <dir>` against it
- [ ] Record command + derived output in `specs/067-speckit-install/bridge-verification.md`; remove any scratch dir
- [ ] Commit

## Phase 3: Record constitution state

- [ ] Write the unratified record into `.specify/memory/constitution.md`: unratified; planning runs against `docs/wiki/` + `CLAUDE.md`; ratification is an operator follow-up
- [ ] Commit

## Phase 4: Retire the escape line from sweep doctrine

- [ ] Amend `pdlc/skills/sweep/SKILL.md`: precondition gate satisfied by `.specify/` presence; escape line reverts to rare operator-signed exception, host precedent retired
- [ ] Bump the skill `version:` and marketplace version; `node scripts/sync-version.mjs --check` green
- [ ] Honest re-pin pass over wiki notes staled by the SKILL.md edit (classify RE-PIN-ONLY vs NEEDS-REVIEW against the diff; amend prose before bumping where needed)
- [ ] Commit
