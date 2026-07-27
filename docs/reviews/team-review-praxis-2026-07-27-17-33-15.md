# praxisflux — team review (range b4e8e09..52b5abd, the TASK-73 demo-rig sweep)

Run: praxis-2026-07-27-17-33-15 · Lens: drift and tech debt since b4e8e09..52b5abd —
clobbered design decisions, slap-dash conflict resolutions. Team: 1 senior deep-dive
(engine/test/fixtures/intent), 1 scout (docs surface), lead intent-drift pass over the
runbook + spec + pinned notes. Requested by pdlc:refactor-triage as its evaluation engine.

**TL;DR:** The demo rig is well-built and its central cleverness is sound: fixture wiki
pins double as golden hashes, so the consumer-facing freshness gate transitively proves
cross-machine determinism in CI — verified by regeneration, not just asserted. The docs
surface is honest (pins verified against real diffs, fixtures clean, runsheet's quoted
failure lines match the real gate output). The one thing to worry about: the runbook's
hard isolation rule ("no rig command may ever run against the praxisflux checkout") is
enforced on only one of three mutating CLI paths — `--stage` and `--check` trust `--dir`
completely, and the outside-checkout assertion is a string compare a symlink or
case-variant path defeats. Second-order debt: residual env-injection determinism holes
the header comment claims don't exist, and a gate-matrix intent record (spec/plan/tasks)
that three shipped artifacts now contradict — in the benign, superset direction — without
an amendment.

## What we like

- **Pins-as-golden-hashes.** Stage-1/3/4 fixtures pin `verified_against` to replayed
  commits (`demo/fixtures/stage-1/docs/wiki/pet-state-machine.md:7`), so `--check`'s
  wiki-freshness runs (`demo/generate.mjs:212`) transitively assert hash identity across
  machines. Senior regenerated locally: stage-0 replays to exactly the `0e26ad95…` the
  fixtures pin.
- **Determinism posture.** Identity + date ladder per commit (`demo/generate.mjs:65`),
  gitconfig disabled (`demo/generate.mjs:68`), lightweight tags (`demo/generate.mjs:188`),
  `writeFileSync` normalizing mode bits (`demo/generate.mjs:141`).
- **Destructive-op care.** Marker-guarded wipe (`demo/generate.mjs:157`),
  `assertOutsideCheckout` (`demo/generate.mjs:147`), `--remote` refused under CI
  (`demo/generate.mjs:231`).
- **Cheap CI.** Two generations + the 8-gate matrix in ~4.3s (`test/demo-rig.test.mjs`),
  riding the existing job with zero workflow change.
- **Honest docs.** `docs/wiki/demo-rig.md` accurate against the shipped CLI and matrix
  (body 3,901/8,000, capsule 430/500); catalog bullet accurate and re-pinned to the exact
  commit that added the test (`docs/wiki/test-suite-catalog.md:54`); fixtures free of
  secrets/absolute paths/junk; runsheet failure lines match
  `grounding-wiki/gates/freshness.mjs:100` and `spec-bridge/gates/bridge.mjs:189`.
- **The `.fxt` trick** keeps the demo app's suite out of the host's recursive
  `node --test` while fixtures stay reviewable text (`demo/generate.mjs:36`), with a
  capture-side ambiguity guard (`demo/generate.mjs:252`).

## What could be improved

1. **Isolation guards skipped on two of three mutating paths.**
   `assertOutsideCheckout` is called only from `generate()` (`demo/generate.mjs:154`);
   the `--stage` branch (`demo/generate.mjs:273`) and standalone `--check` branch
   (`demo/generate.mjs:277`) run `git checkout` against any `--dir` with a `.git` —
   including a real repo, whose HEAD gets detached and worktree rewritten
   (`demo/generate.mjs:223`). The assertion itself is a string compare with no
   `realpathSync` (`demo/generate.mjs:148`), so a symlink into the checkout — or a
   case-variant path on case-insensitive darwin — passes. Narrows the runbook's hard
   rule (`docs/design/demo-rig-runbook.md:156`).
2. **Env-injection determinism holes.** `gitEnv` scrubs only
   `GIT_DIR/GIT_WORK_TREE/GIT_INDEX_FILE` (`demo/generate.mjs:67`); surviving
   `GIT_CONFIG_COUNT/KEY_n/VALUE_n` (autocrlf/gpgsign → different objects),
   `GIT_DEFAULT_HASH` (sha256 → every pin unresolvable), `GIT_TEMPLATE_DIR` (hook
   injection) contradict the header's hash-identical claim (`demo/generate.mjs:24`).
   And `runGate`'s run-gates branch inherits the caller's env wholesale
   (`demo/generate.mjs:207`) — a set `GIT_DIR` resolves pins against the wrong repo,
   the exact class `gitEnv` exists to prevent (the app-test branch scrubs,
   `demo/generate.mjs:204`).
3. **Gate-matrix intent drift, three artifacts deep.** Spec R2
   (`specs/034-demo-rig/spec.md:34`), plan step 5 (`specs/034-demo-rig/plan.md:33`),
   ticked T005 (`specs/034-demo-rig/tasks.md:12`), and board AC #2 all say spec-bridge
   at 2/3 and app tests at 0 only; shipped is spec-bridge 2/3/4 + app-test 0/3
   (`demo/fixtures/manifest.json:35`). Strict superset — right direction — but in a
   repo whose doctrine is "the spec dir is the truth" the record was never amended.
   Residual: no stage-4 gate watches `bin/` (stage-4 runs no app-test; freshness pins
   cover `src/` only).
4. **R4's live thread can rot without CI noticing.** The fingerprint compares run A to
   run B (`test/demo-rig.test.mjs:28`) — nothing asserts the live task is unmerged at
   stage-2 and merged at stage-3; a fixture edit checking stage-2's boxes reads as a
   spec-bridge *warning*, not a failure (`spec-bridge/gates/bridge.mjs:193`), so the
   matrix stays green while the demo's live thread dies. `demo-live-base` is likewise
   asserted nowhere and silently no-ops if a ladder label changes
   (`demo/generate.mjs:193`). The manifest's narrative fields (`taskIds`, `liveTask`,
   `prNumbers`, `debtTaskIds` — `demo/fixtures/manifest.json:9`) are consumed by no
   code; the test hardcodes `task-1..5` (`test/demo-rig.test.mjs:56`).
5. **Freshness coverage gaps around the rig's own wiki note.**
   `docs/wiki/demo-rig.md` cites but does not pin `scripts/run-gates.mjs` (the rail its
   matrix rides, `docs/wiki/demo-rig.md:47`) or `test/demo-rig.test.mjs` (whose contract
   it paraphrases, `docs/wiki/demo-rig.md:64`); and only `demo/fixtures/manifest.json`
   is pinned, so a fixture-only recapture bypasses freshness entirely while the note's
   Operational-notes section is all about fixtures (`docs/wiki/demo-rig.md:74`). The
   runsheet's replay literals (quoted hash `demo/RUNSHEET.md:87`, diff beat
   `demo/RUNSHEET.md:126`) are gated by nothing — a re-capture leaves the presenter
   quoting history that no longer exists, discovered on camera.
6. **CLI robustness below the house bar.** Raw stack traces on: `--stage` with no value,
   `--stage --dir X` (flag-shaped value consumed, `demo/generate.mjs:266`), `--check`
   on a non-rig repo, `--reset` on a file path. `--check` exits before `--remote` runs
   so `--reset --check --remote X` silently skips the push (`demo/generate.mjs:281`);
   `--remote` on an existing repo is unreachable without a full wipe
   (`demo/generate.mjs:279`); bare `--check` on a missing dir silently *generates*.
   House ethos is "each failure line names its fix" (`scripts/run-gates.mjs:11`).
7. **`.fxt` round-trip asymmetries + a missing write guard.** `loadTree` strips `.fxt`
   from any file (`demo/generate.mjs:98`) while `snapshot` adds it only to JS
   (`demo/generate.mjs:253`); `foo.mjs.fxt` + `foo.mjs` in one fixture tree silently
   collide (`demo/generate.mjs:94`); `snapshot`'s `cpSync` preserves exec bits that
   replay drops; `syncTree` would write under `.git/` if a fixture ever carried such a
   path (`demo/generate.mjs:137`).
8. **Two doc nits.** `demo/RUNSHEET.md:69` uses BSD-only `sed -i ''` and
   `demo/RUNSHEET.md:50` re-clones to a fixed `/tmp/pet-live` that collides on a
   same-day rerun; `docs/wiki/overview.md` was re-pinned for the README diff without
   gaining a demo-rig routing mention despite enumerating comparable surfaces
   (`docs/wiki/overview.md:88`).

## What should be removed

- `trees` in the test fingerprint — tag-commit equality already implies tree equality
  (`test/demo-rig.test.mjs:33`).
- Duplicate `node:os` imports (`demo/generate.mjs:44`).
- `runGate`'s redundant `loadManifest()` re-read (`demo/generate.mjs:204`).
- Or: consume the manifest's narrative fields instead of deleting them — either fix
  half of improvement 4 or mark them as lore.

## Stealing for later

- **Pins-as-golden-hashes** — let a consumer-facing freshness gate double as the
  determinism oracle; portable to any fixture-replay system whose artifacts carry
  commit references.
- **`.git/<marker>` wipe-guard** (`demo/generate.mjs:157`) — for any tool owning a
  destructive reset.
- **`.fxt` suffixing** — hide fixture code from recursive test discovery while keeping
  it reviewable.
- **A runsheet that plans its own failures** — per-beat fallback pivots with
  pre-quoted failure lines.
- **Demoed-skills-as-sources** (`docs/wiki/demo-rig.md:9`) — pinning the *subjects* of
  a demo so subject drift flags the demo.

## New ideas — toward a rot-proof demo

- Extend `test/demo-rig.test.mjs` with three cheap asserts reusing the existing
  fingerprint plumbing: stage-2 `bin/pet.mjs` lacks `--version` / stage-3 has it (pins
  R4); `demo-live-base` resolves to the stage-2 commit; task IDs read from the
  manifest's `taskIds`/`debtTaskIds` instead of hardcoding.
- Centralize every mutating entry point through one guard: `resolveTarget()` that
  `realpathSync`s, asserts outside-checkout, and (for non-generate paths) requires the
  rig marker — one function, all three branches call it.
- Widen `gitEnv`'s scrub to the `GIT_CONFIG_*`/`GIT_DEFAULT_HASH`/`GIT_TEMPLATE_DIR`
  family and thread it through `runGate`'s run-gates branch.
- Add a `demo/fixtures/` sentinel source (or a fixtures checksum in the manifest) to
  `docs/wiki/demo-rig.md`'s sources so recaptures flag the note; pin
  `scripts/run-gates.mjs` and `test/demo-rig.test.mjs` while there.

## Questions for you

- Should the spec/plan/tasks text be amended post-hoc to the shipped superset matrix
  (the honest-record move), or is the board note's mention enough?
- Is the stage-4 `bin/` blind spot worth a stage-4 `app-test` gate (one manifest line),
  or accepted as residual?
