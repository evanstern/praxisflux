# 067 — plan

**Constitution check:** the host constitution is absent/unratified (that absence is
this task's AC #3). Per house rule, this plan is checked against the grounding docs
instead: `docs/wiki/` (pdlc-sweep, spec-bridge notes), `CLAUDE.md`, `docs/releasing.md`.

## Approach

Four phases, matching the card's ACs one-to-one. Each phase is a separate dispatch
(runbook doctrine): phases 1–3 at sonnet, phase 4 at opus (operator-signed escalation —
SKILL.md doctrine prose, per TASK-86/87/88 precedent).

### Phase 1 — install (sonnet)

- Snapshot the protected surface first: `git status` clean, then record
  `git stash`-free baseline via the worktree's clean tree (installer diffs are
  reviewable with plain `git status`/`git diff` afterwards).
- Run `specify init --here --integration claude --ignore-agent-tools --force` from the
  worktree root. (`--force` skips the non-empty-dir confirmation — this is an
  intentional merge into an existing repo; `--ignore-agent-tools` because the CLI's
  agent-detection is irrelevant here.)
- Review everything the installer wrote (`git status --porcelain`): keep `.specify/`
  and `.claude/commands/speckit.*` (or wherever it puts command defs); revert any
  touch to `.claude/agents/*`, `.claude/model-tiers.json`, `CLAUDE.md`, `specs/`,
  and any other house file (`git checkout -- <path>`).
- Commit the reviewed install as one slice.

### Phase 2 — reconcile templates + verify bridge (sonnet)

- Edit `.specify/templates/spec-template.md` (and siblings) in place: add the
  board-task header line, drop anything that conflicts with the house format,
  shape `tasks-template.md` into `## Phase N:` + checkbox sections.
- Generate a scratch spec dir from the reconciled templates (copy them as a
  `specs/z-template-check/` throwaway or render in `/tmp`), run
  `node spec-bridge/gates/cli.mjs state <dir>`, confirm phases derive.
- Record the actual command + output in `specs/067-speckit-install/bridge-verification.md`.
  Remove the scratch dir before commit (the verification record is the artifact).
- Commit.

### Phase 3 — constitution record (sonnet, small — may group with phase 2)

- Write the unratified record into `.specify/memory/constitution.md` per spec R3.
- Create the follow-up card is NOT this phase's job — the orchestrator asks the
  operator at sweep end (scope discipline: follow-up tasks need approval).
- Commit.

### Phase 4 — retire the escape line in sweep doctrine (opus)

- Amend `pdlc/skills/sweep/SKILL.md`: precondition gate clause + Output gate clause
  per spec R4. Bump the skill's `version:`; bump the marketplace version
  (`docs/releasing.md`; `node scripts/sync-version.mjs --check` green).
- This edit stales wiki pins over `pdlc/skills/sweep/SKILL.md`
  (`docs/wiki/pdlc-sweep.md` + sweep-history notes): run the honest re-pin pass —
  classify each staled note against `git diff <old-pin>..HEAD -- <sources>`,
  amend prose where NEEDS-REVIEW, then re-pin.
- Commit.

## Risks

- **Installer clobber:** mitigated by the phase-1 review step; the worktree isolates
  the blast radius and every write is diffable before staging.
- **Template drift from bridge expectations:** mitigated by the phase-2 real-check
  (derivation run recorded, not assumed).
- **Wiki pin thrash:** phase 4's SKILL.md edit is the only source-staling change;
  the re-pin pass rides the same PR per the runbook's gate list.
