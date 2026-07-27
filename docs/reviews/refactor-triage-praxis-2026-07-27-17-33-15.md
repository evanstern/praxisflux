# refactor-triage — run praxis-2026-07-27-17-33-15

- **Scope:** range `b4e8e09..52b5abd` — the TASK-73 demo-rig sweep (18 commits, 182
  files, +6092/−13). Range end (last commit this run scanned): `52b5abd`.
- **Mode:** (a) range, interactive — dispositions by operator walk (accept / reject /
  defer per finding), 2026-07-27.
- **Evaluation engine:** team-review (installed), orchestrated via its lens; evaluation
  report: `docs/reviews/team-review-praxis-2026-07-27-17-33-15.md`. Lead intent-drift
  pass ran against the intent record: `docs/design/demo-rig-runbook.md`,
  `specs/034-demo-rig/`, and the pinned notes the range touched (`demo-rig`,
  `overview`, `test-suite-catalog`).
- **Prior art consulted:** `docs/reviews/refactor-triage-praxis-2026-07-27-16-07-29.md`
  — no matching dispositions to carry forward (different surface); adjacency noted on
  F8 (TASK-74 already scopes an `overview.md` amendment).
- **Why this range:** the prior triage (run …16-07-29) predates the TASK-73 merge; the
  operator directed a range starting at the prior sweep's close (`b4e8e09`) so the
  demo-rig work is not skipped. TASK-80 cards the general fix (a recorded last-run-at
  high-water mark).

## Dispositions

| # | finding (report §) | disposition | rationale | task |
|---|--------------------|-------------|-----------|------|
| F1 | isolation guards skipped on `--stage`/`--check`; assertOutsideCheckout has no realpath (§improved 1) | **accept** | narrows the runbook's hard rule; fat-fingered `--dir` can detach a real repo's HEAD | TASK-81 |
| F2 | env-injection determinism holes (GIT_CONFIG_*/GIT_DEFAULT_HASH/GIT_TEMPLATE_DIR); runGate env inheritance (§improved 2) | **accept** | contradicts the rig's core hash-identical claim; a direnv presenter gets an unexplained red `--check` | TASK-81 |
| F3 | gate-matrix intent drift (spec/plan/T005/AC#2 say 2/3 + 0; shipped 2/3/4 + 0/3) + stage-4 `bin/` blind spot (§improved 3) | **accept (both parts)** | "the spec dir is the truth" — amend the record post-hoc; one manifest line closes the blind spot | TASK-83 (text), TASK-82 (stage-4 gate) |
| F4 | R4 live thread unasserted (spec-bridge lag is a warning); `demo-live-base` unasserted; manifest narrative fields unconsumed (§improved 4) | **accept** | three cheap asserts protect the demo's centerpiece from silent rot | TASK-82 |
| F5 | freshness blind spots: demo-rig note unpinned rails (run-gates.mjs, the CI test), fixture-only recapture bypass, ungated RUNSHEET replay literals (§improved 5) | **accept** | drift-proofing is the rig's stated rationale; on-camera staleness is the exact failure the rig exists to prevent | TASK-83 |
| F6 | CLI robustness: raw stack traces on misuse; `--check`/`--remote` silent skip; unreachable `--remote`; bare `--check` silently generates (§improved 6) | **defer** | presenter tooling off the runsheet's supported path; polish when a presenter actually trips | — |
| F7 | `.fxt` round-trip asymmetries; collision not detected; exec-bit drop; `syncTree` lacks a `.git/` write guard (§improved 7) | **defer** | capture tooling runs only at deliberate recapture under operator eyes; fold into the next generator-touching task | — |
| F8 | RUNSHEET portability (`sed -i ''`, fixed `/tmp/pet-live`); `overview.md` lacks a demo-rig routing mention (§improved 8) | **defer** | cosmetic; overview amendment naturally rides TASK-74's existing overview.md scope | — |
| F9 | simplifications bundle: dead `trees` fingerprint weight, dup `node:os` imports, redundant `loadManifest()`, unconsumed narrative fields (§removed) | **defer** | too small to card; noted inside TASK-81/TASK-82 descriptions as optional ride-alongs | — |

## Outcome

- Accepted findings carded: **TASK-81** (F1+F2, generator hardening), **TASK-82**
  (F4+F3b, CI narrative asserts + stage-4 app-test), **TASK-83** (F3a+F5, intent-record
  amendment + freshness coverage). All labeled `debt`, each citing the report path and
  file:line evidence; TASK-82 notes its merge-ordering relationship to TASK-81
  (shared `demo/generate.mjs` touch).
- Rejected: none. Deferred: F6, F7, F8, F9 — recorded above, no board residue.
