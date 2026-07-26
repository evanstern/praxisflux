# 017-plant-name-override — tasks

## Spec

- [x] T000 claim: board TASK-54 → In Progress + spec dir stub, pushed
- [x] T001 spec.md / plan.md / tasks.md authored

## Implement

- [x] T002 --name flag wins; worktree-aware derivation (primary checkout's name);
  basename fallback; tests incl. worktree round-trip not spuriously drifted (R1).
  **Design decision — `.pdlc` DOES store the resolved name** (`name` field), and it
  sits in the ladder: `--name` > sentinel-recorded name > worktree `gitdir:` parse
  (`…/.git/worktrees/<x>` → the primary checkout's basename) > `basename(root)`.
  Rationale: recording makes the name *sticky*, which is the drift semantics R1 asks
  for — once planted, a re-plant from ANY differently-named checkout (worktree, renamed
  clone) reproduces the same block → `unchanged`; the name changes only when `--name`
  says so, and that change surfaces as honest `drifted` + `--force`, mirroring every
  other block change. Legacy sentinels without the field are tolerated exactly like
  pre-`peersOmitted` ones: never rewritten just to gain it; a real update gains it.
  Tests: resolveProjectName ladder (incl. relative gitdir + submodule fallback), real
  git-worktree round-trip (plant in worktree → primary's name; `--check` re-plant from
  worktree AND from primary after "merge" both `unchanged`), `--name` beats derivation +
  rename-is-honest-drift, plain-dir basename + CLI `--name`; TASK-53 peersOmitted tests
  untouched and green (18/18 in test/pdlc.test.mjs)
- [x] T003 bootstrap SKILL.md documents override + derivation (R2): Plant step 2 states
  the full ladder + when to pass `--name`, and the sticky-name doctrine (re-plant from a
  differently-named checkout is never spuriously drifted); output gate verifies the
  heading names the project and `.pdlc` records `name`. Skill 0.4.0 → 0.5.0
- [x] T004 versions: bootstrap skill 0.4.0 → 0.5.0; `node scripts/sync-version.mjs 0.24.0`
  (marketplace + all nine plugin.json + action.yml npx pin; 0.23.0 was released —
  sibling-collision re-bump after TASK-56/55 merge is the orchestrator's) (R3)
- [x] T005 wiki: pdlc-plugin re-verified against the new plant.mjs + SKILL.md (0.24.0
  paragraph added; body trimmed 7,998 → 7,990/8,000 without touching sweep content — no
  summary-style split, no exemption) and re-pinned via honest two-step pins
  (5007567 → 377c9a2 → 61885dd as each source commit landed); the 10 lockstep stales
  from sync-version (educate/build/codebase-to-course/grounding-wiki/spec-bridge/
  research/team-review/reorient plugins, build-and-release, gates-consumption-surface)
  verified stamp-only (`version`/npx-pin lines only, no falsified semver literals) and
  re-pinned to 61885dd. CAPSULES.md untouched — no note description or INDEX change

## Prove

- [ ] T006 gates green: node --test, check-docs, wiki-freshness, bump gate
- [ ] T007 board finalized; PR opened — serial merge recorded by the orchestrator
