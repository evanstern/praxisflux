---
name: demo-rig
description: The PDLC demo rig (demo/) — a deterministic replay generator materializing the throwaway praxis-pet project as a real git repo with one tag per lifecycle stage, fixtures captured once from genuine plugin runs, a per-stage gate matrix, the 30-minute runsheet, and the CI repeatability test. Load when changing the rig, re-capturing fixtures, prepping the demo, or when a demoed skill's change flags this note stale.
kind: pipeline
sources:
  - demo/generate.mjs
  - demo/fixtures/manifest.json
  - demo/RUNSHEET.md
  - pdlc/skills/sweep/SKILL.md
  - pdlc/skills/refactor-triage/SKILL.md
  - grounding-wiki/skills/wiki-build/SKILL.md
  - grounding-wiki/skills/wiki-update/SKILL.md
  - spec-bridge/skills/link/SKILL.md
  - spec-bridge/skills/sync/SKILL.md
  - research/skills/research-vault/SKILL.md
verified_against: 74e476718a21d998bedad05bd08d240849e58434
---

# The PDLC demo rig

`demo/` makes the whole lifecycle demoable in ~30 minutes (specs/034-demo-rig, TASK-73):
`demo/generate.mjs` materializes a throwaway demo project — praxis-pet, a tiny tamagotchi
CLI — as a real git repo whose **history is the demo**, one tag per stage: `stage-0` bare
app → `stage-1` grounded (research vault + wiki) → `stage-2` planned (board, linked
specs, signed-off runbook) → `stage-3` swept (merged PRs, board synced, wiki re-pinned)
→ `stage-4` triaged (triage record + debt cards).

## How it works

- **Replay, never re-run:** every stage's artifacts were captured ONCE from genuine
  plugin runs (wiki-build, research-vault, spec-bridge link/sync, a real mini-sweep with
  merged sandbox PRs #1–#3, a headless refactor-triage) into `demo/fixtures/stage-N/`;
  the generator replays them as a manifest-driven commit ladder. `manifest.json` carries
  the per-stage narrative (task IDs, PR numbers, gate matrix) and the ladder itself,
  including per-PR branch+merge steps (`fixtures/prs/pr-N/`) that reproduce the sweep's
  merge topology.
- **Deterministic by construction:** pinned author/committer identity, a fixed date
  ladder (`baseDate` + N×`stepSeconds`), user/system gitconfig disabled — regeneration
  is hash-identical across runs and machines, so the wiki pins captured in fixtures
  keep resolving against replayed history.
- **Isolation:** the demo repo lives outside the checkout (default
  `<tmpdir>/praxisflux-demo`); every git call has explicit cwd and a scrubbed env; a
  target inside the checkout is refused; `--reset` only wipes marker-carrying dirs.
  Fixture JS is stored `.fxt`-suffixed so bare `node --test` here never discovers the
  demo app's suite.
- **CLI:** `--reset` (wipe+regenerate) · `--stage N` (jump) · `--check` (per-stage gate
  matrix: app tests at 0/3, wiki-freshness at 1/3/4, spec-bridge at 2/3/4, asserted via
  `scripts/run-gates.mjs`) · `--remote <owner/repo>` (force-push main, stage tags, and
  `demo-live-base` — the stage-2 branch the live demo task's genuine PR targets on the
  sandbox `evanstern/praxisflux-demo-sandbox`; presenter tooling only, refused under CI)
  · `--snapshot N --from <dir>` (capture tooling).
- **The demoed skills are sources of this note** — pdlc sweep + refactor-triage,
  grounding-wiki wiki-build/wiki-update, spec-bridge link/sync, research research-vault —
  so the freshness gate flags the demo whenever a demoed skill changes: re-verify the
  captured artifacts still match what the skill now prescribes before re-pinning.
- `demo/RUNSHEET.md` scripts the 30 minutes: stage walk, the live freshness gate-break
  (touch a pinned source → red → honest repin), the spec-bridge block (hand-set Done →
  blocked), the background live task (kickoff ~min 5 off `demo-live-base`, closed ~min
  20; stage-3 carries its merged twin as the canned fallback), the triage beat, and a
  fallback pivot per live moment.

## Connections

- [[test-suite-catalog]] — `test/demo-rig.test.mjs`: regenerate → tags → gate matrix →
  regenerate again, identical (the R8 repeatability contract).
- [[pdlc-sweep]] / [[pdlc-refactor-triage]] — the orchestration skills the capture run drove.
- [[grounding-wiki-plugin]] / [[spec-bridge-plugin]] / [[research-plugin]] — the gates and
  skills the demo exercises per stage.
- [[gates-consumption-surface]] — `--check` asserts through the same `run-gates.mjs`
  consumers use.

## Operational notes

Re-capturing (only when a demoed skill's contract changes what a stage should contain):
drive the plugins genuinely in a generated repo, `--snapshot` each stage, then rewrite
fixture pins to the REPLAYED hashes (two-pass: generate, read the printed label→hash
ladder, pin, regenerate) — honest because the trees are identical. The sandbox keeps the
real merged PR records; regeneration never touches the network.
