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
- [x] T004 versions: bootstrap skill 0.4.0 → 0.5.0 (still an increase over main's 0.4.0
  after rebase); marketplace first synced to 0.24.0 per spec, then — TASK-56 (0.24.0) and
  TASK-55 (0.25.0) merged ahead — post-rebase re-bump `node scripts/sync-version.mjs
  0.26.0` (marketplace + all nine plugin.json + action.yml npx pin) (R3)
- [x] T005 wiki: pdlc-plugin re-verified against the new plant.mjs + SKILL.md. On the
  post-rebase pass the rebase conflict was resolved by taking MAIN's twice-re-condensed
  body wholesale (TASK-53's 0.23.0 trace paragraph and TASK-55's 0.25.0 paused-lane
  paragraph intact, sweep sections byte-identical to main) and re-inserting only the
  name-override paragraph, re-cited to 0.26.0 — the release it actually ships in; the
  three Since citations (0.23.0 trace / 0.25.0 paused / 0.26.0 name) each name their
  real release. Budget funded by bootstrap-side condensation only: 7,996/8,000, no
  summary-style split, no exemption. Honest pins stepped through real post-rebase
  commits (cdaddc5 → 4014fad → final bump commit); the 10 lockstep stales from
  sync-version (educate/build/codebase-to-course/grounding-wiki/spec-bridge/research/
  team-review/reorient plugins, build-and-release, gates-consumption-surface) verified
  stamp-only per note (`version`/npx-pin lines only, no falsified semver literals) and
  re-pinned. CAPSULES.md untouched — no note description or INDEX change

## Prove

- [x] T006 gates green: `node --test` 208/208 pass; check-docs "README.md and CLAUDE.md
  are in sync with the repo"; wiki-freshness "OK: 28 note(s) fresh against their pinned
  sources" with zero warnings; bump gate: every substantive check passes (released
  surface touched ⇒ marketplace 0.23.0 → 0.24.0, bootstrap skill 0.4.0 → 0.5.0 — the
  gate's ONLY complaint is "v0.24.0 is already released (tag exists)": TASK-56 merged
  mid-flight and took 0.24.0, the exact sibling collision spec R3 pre-assigns to the
  orchestrator's post-rebase re-bump; this branch stays internally consistent at 0.24.0)
- [ ] T007 board finalized; PR opened — serial merge recorded by the orchestrator
