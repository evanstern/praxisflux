# Spec 072 — tasks

**Task:** TASK-0132 · Phases are internal breakdown; they ride this one branch and merge in
this task's single PR.

## Phase 1 — remove the redundant CI step

- [x] `.github/workflows/ci.yml`'s `- name: tests` / `run: node --test` step (`:22-23`) is removed
- [x] A comment in its place names the gate that now covers the suite (spec-bridge's `tests`
      project gate) and this spec, so the absence reads as deliberate and nobody "restores" it
- [x] `.spec-bridge.json` is untouched — the `tests` required-gate entry stays exactly as declared
- [x] `install-path`'s targeted `node --test test/install-path.test.mjs` (`:79`) is untouched —
      different job, packaged-install check, not a duplicate of the full suite
- [x] No local invocation path changed: `.githooks/pre-commit`, the Stop hook, and hand-run are
      byte-identical (verified by diff, not asserted)

## Phase 2 — prove the enforcement survives in CI

- [ ] A deliberately red suite is shown to FAIL the spec-bridge gate in CI, with the run named
      and its output quoted — this is AC#2's "proven by a deliberate red-suite run, not reasoned"
      · **stage 1 done (local, labelled): the gate reported the red suite as BLOCKING.** Stage 2
      pending: the real CI run, which needs the PR to exist (ci.yml triggers on `pull_request`)
- [x] The proof exercises the CI path after the deletion (proving it while the dedicated step
      still existed would prove nothing — that step would fail first)
- [x] The red state is fully reverted; no broken test is left behind, verified by diff
- [x] Exactly what was run, what CI reported, and how it was reverted is recorded on the card
- [x] If the landed evidence is local-only rather than a real CI run, it is LABELLED as the
      weaker evidence it is, never presented as a CI proof

## Phase 3 — re-ground and close

- [ ] The suite runs ONCE per CI run, confirmed by reading the workflow logs (AC#1 says measured,
      not assumed) — the run's step list shows a single `node --test`
      · **pending the PR's own CI run.** The workflow file is verified to contain exactly one
      full-suite invocation, but AC#1 says *measured from the logs*, so the file is not the proof
- [x] `test/run-gates.test.mjs:35-44` is intact, unmodified, and still passing — the finding says
      it covers `spec-bridge`/`wiki-freshness` and not `tests`, so verify rather than assume
- [x] AC#5 is addressed explicitly: `docs/consuming-gates.md` needs no behavioural change because
      the `projectGates` contract is untouched — stated and justified, never silently skipped
- [x] Freshness probe run WITH its exit code checked (it prints a non-blocking `warn:` first and
      its verdict last, so a partial tail reads green at exit 1)
- [x] Any note whose `sources:` include `.github/workflows/ci.yml` is re-pinned honestly —
      RE-PIN-ONLY vs NEEDS-REVIEW classified against the real diff, and prose amended FIRST where
      a note enumerates CI's steps
- [x] Version-bump status verified against `check-version-bump.mjs --base origin/main` rather
      than assumed either way
- [x] Full suite green: `node --test`, raw counts recorded
