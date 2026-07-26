# 017-plant-name-override — PROJECT_NAME stops depending on basename(root)

Board: TASK-54 · Sweep: `docs/design/lane-hardening-runbook.md` (Lane 2, after TASK-53
merged — plant.mjs now carries the peersOmitted trace; build on that state) ·
Direction: TASK-43 dogfood finding #2. The trap fired twice more, live, during the
2026-07-26 planted-artifact refresh (a worktree plant rendered `# replant — …`).

## Requirements (map 1:1 to board ACs)

R1 (AC #1) — `pdlc/scripts/plant.mjs` stops trusting `basename(root)` blindly:
- An explicit `--name <name>` flag wins when given.
- Otherwise derive the name from repo metadata with basename as the last fallback —
  the natural candidate: for a git WORKTREE (`.git` is a `gitdir:` file), resolve the
  primary checkout's basename (parse the gitdir path up past `.git/worktrees/<x>`);
  a plain repo or non-git folder keeps `basename(root)`.
- The rendered heading and any name-bearing content match the resolved name; the
  `.pdlc` sentinel may record the resolved name if that helps drift semantics (design
  judgment — record it).
- Tests, house style, INCLUDING the worktree case: plant from a worktree whose dir
  name differs from the primary checkout's → block renders the primary's name; a
  subsequent `--check`/re-plant from the primary checkout reports `unchanged`, never
  `drifted`. Also: `--name` beats derivation; legacy behavior for plain dirs intact.

R2 (AC #2) — `pdlc/skills/bootstrap/SKILL.md` documents the override + derivation;
re-plant from a differently-named checkout is not spuriously drifted (that's the
worktree test above, stated as the doctrine).

R3 (AC #3) — versions: pdlc:bootstrap SKILL.md bump + marketplace
`scripts/sync-version.mjs 0.24.0` (0.23.0 released; sibling-collision re-bump is the
orchestrator's — TASK-56/55 are still merging). Wiki: re-verify + re-pin `pdlc-plugin`
(body budget!) + lockstep stales; CAPSULES regen if descriptions change. No course.

## Non-goals

Renaming already-planted blocks in consumer repos (their next bootstrap update picks
the fix up); peer-trace changes (TASK-53, merged).
