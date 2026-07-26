# 010-bootstrap-dogfood — tasks

## Spec

- [x] T000 claim: board TASK-43 → In Progress + spec dir stub, pushed
- [x] T001 spec.md / plan.md / tasks.md authored

## Implement

- [x] T002 .handoff/ gitignored; no tracked residue existed (`git ls-files` shows no
  `.handoff/` paths — nothing to untrack) (R1)
- [x] T003 plant run: marked block appended, hand-written CLAUDE.md byte-preserved
  (diff verified), .pdlc sentinel present (R2). `plant.mjs --peer backlog` reported
  `claudeMd: appended`; before/after diff is `+83 -0` — the entire original file
  (5452 bytes) is byte-identical as the new file's prefix, followed only by one
  blank-line join and the `<!-- pdlc:grounding BEGIN v0.17.0 …` block. Sentinel
  `.pdlc` records `{version: 0.17.0, peers: [backlog]}`. `scripts/check-docs.mjs`
  stays green with the block planted.
- [x] T004 idempotence proven: second plant run reported `claudeMd: unchanged`,
  `pdlcFile: unchanged`; byte-level diff of CLAUDE.md and .pdlc before/after the
  second run is empty, and `--check` exits 0 (R2)
- [x] T005 absent-Spec-Kit peer behavior recorded as dogfood finding (R2):
  - **The deterministic planter is peer-silent.** `pdlc/scripts/plant.mjs` neither
    detects peers nor recommends anything about an absent one — omitting
    `--peer spec-kit` simply strips the `pdlc:peer:spec-kit` block from the rendered
    grounding, with no warning or recommendation output. All absent-peer behavior
    (detect via `command -v specify`, recommend `uv tool install specify-cli --from
    git+https://github.com/github/spec-kit.git`, offer to wait, re-detect) lives only
    in `pdlc/skills/bootstrap/SKILL.md` prose ("Peer utilities" steps 1–2) — i.e. it
    is agent judgment, unverifiable by any gate. No extra flag is needed to skip an
    absent peer; omission IS the opt-out.
  - **Consequence observed here:** this host keeps hand-authored Spec Kit-STYLE dirs
    (`specs/NNN-*` + spec-bridge links) without `specify` installed, and the plant
    happily grounds the project with no Spec Kit block and no notice that the specs
    convention now lives nowhere in the planted grounding. Working as designed, but
    the "recommend when absent" behavior has no deterministic trace.
  - **Second finding — PROJECT_NAME comes from `basename(root)` with no override.**
    Planting from this worktree directly would have baked `# task-43 — praxis
    development lifecycle` into the block merged to main, and any later re-plant from
    the real root would render a different name → spurious `drifted`. Worked around
    without touching the plugin by invoking the planter through a scratch symlink
    named `praxis` pointing at this worktree (`path.resolve` is lexical, so
    `basename` sees the project name while all writes land here). A `--name` flag
    (or deriving the name from git remote/package metadata) would remove the trap.
- [x] T006 self-review begin → finish clean; run id + exit codes recorded here (R3):
  - run id `task-43-2026-07-26-14-48-50`, invoking root == target == the TASK-43
    worktree (git @ 57afc9e), report written OUTSIDE the reviewed repo (the gate
    rejects in-repo reports).
  - `run.mjs begin` exit **0**; `run.mjs finish` exit **0** ("done — report proven"),
    target untouched (clean porcelain before and after).
  - The escalated SELF-REVIEW warning did **not** fire — correct per team-review
    1.1.0: it triggers only when `.handoff/` is NOT gitignored at the invoking root,
    and R1 gitignored it; run records rode the ignored `.handoff/` transport without
    cluttering status, which is the fixed behavior working as designed.

## Prove

- [x] T007 gates green: `node --test` 169/169 pass; `scripts/check-docs.mjs` in
  sync; wiki freshness OK 27 notes, zero warnings (overview re-pinned
  39d5de7bdf2c → 9c64f26f680c after re-verification). Diff vs merge-base touches
  only `.gitignore`, `.pdlc`, `CLAUDE.md`, `docs/wiki/overview.md`, `specs/010-*`,
  and the backlog task file — no plugin dirs, `lib/`, `scripts/`, or
  `.claude-plugin/`, so no version bumps (docs+config-only diff).
- [x] T008 board finalized (ACs checked, Done, final summary); PR opened — serial merge
  (first of Lane 2) recorded by the orchestrator in the runbook execution log
