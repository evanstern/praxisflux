# 034-demo-rig — PDLC demo rig: checkpointed throwaway project for a repeatable 30-minute full-loop demo

Board: TASK-73 · Direction: the TASK-73 card (commit 755dc70, operator-ratified design
2026-07-27); sweep runbook `docs/design/demo-rig-runbook.md`, signed off 2026-07-27.
The design is decided — this spec instantiates it, it does not reopen it.

## The seam being closed

The PDLC can only be shown to a coworker by running it live, which takes hours and
isn't repeatable. The rig makes the loop demoable in ~30 minutes: a generator
materializes a throwaway demo project (tiny Node tamagotchi CLI — continuity with the
TASK-25 presentation) as a real git repo whose HISTORY is the demo — one tag per
lifecycle stage. The presenter time-travels between stages in seconds; every artifact
at every stage is real, captured once from genuine plugin runs and replayed
deterministically ever after. The repo's own enforcement covers the rig, so the demo
cannot rot silently.

## Requirements (map 1:1 to board ACs)

R1 (AC #1) — a single generator/reset command (`node demo/generate.mjs`, alias
`--reset`) materializes the demo project from tracked fixtures as a fresh git repo
with one tag per stage — `stage-0` bare app → `stage-1` grounded (research vault
branch + docs/wiki built and pinned) → `stage-2` planned (board tasks, spec dirs,
spec-bridge links, signed-off sweep runbook) → `stage-3` swept (merged PRs, board
synced, wiki re-pinned) → `stage-4` triaged (refactor-triage record + debt cards) —
and jump-to-stage (`git checkout stage-N` or a `--stage N` convenience) lands in
seconds. Commits are deterministic: author/committer identity and dates are pinned by
the generator, so pins captured in fixtures stay valid across regenerations.

R2 (AC #2) — every stage's artifacts are REAL captures from genuine plugin runs
(grounding-wiki wiki-build, spec-bridge link/sync, a real sweep, a real
refactor-triage), captured ONCE into `demo/fixtures/` and replayed by the generator —
regeneration never re-runs the plugins. Each stage passes its own gates when checked
out: wiki freshness green at stages 1/3/4; spec-bridge derivation consistent (no
status exceeding artifacts) at stages 2/3 — assertable via this repo's
`scripts/run-gates.mjs` pointed at the generated repo.

R3 (AC #3) — scratch GitHub sandbox remote wired: the reset command force-pushes stage
state to a sandbox repo the OPERATOR names before anything is created (runbook
checkpoint — outward-facing act); the canned stage-3 history carries the real merged
PRs from the one genuine capture run, and the live demo task opens a genuine PR
there. Remote wiring is presenter tooling behind an explicit flag/config — never a CI
step, never default-on.

R4 (AC #4) — live-thread support: one tiny pre-specced one-file task exists UNMERGED
at stage-2, ready to sweep live during the demo (kicked off ~minute 5); stage-3
contains that same task MERGED as the canned fallback, so the presenter can pivot if
the live thread stalls.

R5 (AC #5) — `demo/RUNSHEET.md` scripts the 30 minutes: stage walk order; the live
gate-break moment (touch a pinned source on camera → freshness gate goes red → repin)
and the spec-bridge block moment (hand-set a status above the artifacts → gate
blocks); the background live-task kickoff and close; the refactor-triage beat
(headless policy run or live debt-carding); and the fallback pivot per live moment.

R6 (AC #6) — a CI test (new `test/demo-rig.test.mjs`, riding the existing `node
--test` job — no workflow change, no secrets, no network) regenerates the demo repo
and asserts the stage tags exist and each stage passes its per-stage gates (R2's
matrix), so the demo cannot rot silently.

R7 (AC #7) — a `docs/wiki/` note pins the rig — sources: the generator, the fixture
manifest, the runsheet, AND the demoed skill files (pdlc sweep + refactor-triage,
grounding-wiki build/update, spec-bridge link/sync, research vault SKILL.mds) — so
the freshness gate flags the demo whenever a demoed skill changes. INDEX entry +
CAPSULES regen in the same slice.

R8 (AC #8) — repeatability proven: two consecutive resets yield identical stage state
— same demo-board task IDs, same tags, same narrative (asserted in the CI test by
generating twice and comparing tag targets / board task IDs / stage tree hashes).

## Placement & isolation

- The rig lives in a new top-level `demo/` dir (`generate.mjs`, `fixtures/`,
  `RUNSHEET.md`) — repo-internal tooling, NOT released surface; the version-bump gate
  (`scripts/check-version-bump.mjs`) is the arbiter, believed over this prediction.
- The demo project's inner git is never this repo's git: the generator creates the
  demo repo in a caller-supplied (default: temp/sibling) directory OUTSIDE the
  praxisflux checkout and runs every git command with explicit cwd — no command may
  ever land on the praxisflux checkout; the CI test asserts against the GENERATED
  repo's tags, never this repo's.

## Non-goals

- No changes to any plugin or skill — the rig only DRIVES them (capture) and replays
  their artifacts (regeneration).
- No persistent demo project — throwaway by design; reset = regenerate.
- No CI secrets or network: the sandbox remote is presenter tooling only.
- TASK-74..79 debt items stay untouched (out of this sweep's scope).
- No per-task course (per-feature policy; not requested).
