---
id: TASK-69
title: >-
  sync-version.mjs: validate argv — refuse non-semver values instead of stamping
  them into all version files
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-27 04:33'
updated_date: '2026-07-27 14:00'
labels:
  - sweep-followup
dependencies: []
priority: low
ordinal: 104000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
scripts/sync-version.mjs stamps its first argv verbatim into all 11 version files (marketplace.json, 9 plugin.json, action.yml npx pin) with no validation — during TASK-63, `sync-version.mjs --help` happily wrote the literal string "--help" as the version everywhere (reverted before commit; nothing landed). Add argument validation: refuse a missing value or anything that is not strict x.y.z semver, print usage, exit nonzero; optionally also refuse a version at or below the current lockstep value unless a flag overrides (check-version-bump already gates increases at PR time, so the CLI-side rule can stay minimal — decide and record). TASK-66 established the same pattern for build.mjs's bare --plugin (usage error, exit 2) — follow it. Origin: incident reported by TASK-63's implementer during the downstream-bugfix sweep (runbook docs/design/downstream-bugfix-runbook.md); carding approved by operator 2026-07-27.

Spec: specs/030-sync-version-argv
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Non-semver or missing argv (incl. --help style flags) prints usage and exits nonzero without touching any file
- [x] #2 Valid x.y.z behavior unchanged (all 11 files stamped, sync --check unchanged)
- [x] #3 Regression test covers the refusal and the no-files-touched guarantee
- [ ] #4 Spec phase: Spec
- [ ] #5 Spec phase: Implement
- [ ] #6 Spec phase: Prove
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Author spec 030-sync-version-argv (spec/plan/tasks). 2. Validate argv in scripts/sync-version.mjs: missing value or non-strict-x.y.z (incl. --help-style flags) prints usage and exits nonzero with zero files touched; record the minimal stance on <=current versions (check-version-bump gates increases at PR time) — follow the TASK-66 build.mjs usage-error pattern. 3. Regression test covering refusal + no-files-touched guarantee; valid x.y.z behavior unchanged incl. --check. 4. node --test, check-docs, freshness, version bump + same-PR wiki re-pins (build-and-release/release-pipeline; catalog bullet if a new test file is born).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sweep dispatch (runbook docs/design/sweep-followups-runbook.md): model tier = default implementer — argv-guard pattern already established by TASK-66 for build.mjs; bounded, three ACs.

Call-site audit (T002, grep across .githooks, .github/workflows, scripts, docs, test, specs): every live invocation is either --check or an explicit x.y.z — .githooks/pre-commit:15 (--check), .github/workflows/ci.yml:27 (--check), .github/workflows/release.yml:46 (--check), scripts/new-plugin.mjs:216 (advises --check), scripts/check-version-bump.mjs:68 (advises 'sync-version.mjs <new>'), docs/releasing.md:48 (example '0.3.0'), runbooks/specs all cite explicit-version runs. test/build-npm.test.mjs imports stampNpxPin only (library, not CLI). NOTHING consumes the bare no-arg mode; only docs/wiki/build-and-release.md describes it — prose updated + re-pinned in this branch. Safe to remove.

Implemented in f2e0a36: argv validated before any file read/write — exactly one arg, --check or strict /^\d+\.\d+\.\d+$/; refusals print USAGE to stderr and exit 2 (build.mjs pattern), zero files written. Bare no-arg mode removed; header comment updated; --check drift hint now names an explicit-version rerun. Decision (recorded in spec 030): <=current targets allowed, no flag. New test/sync-version.test.mjs (4 tests, runs a COPY of the real script in a temp fixture repo so a stamping regression can never touch this repo): refusal matrix (missing arg, --help, -h, 1.2, v1.2.3, 1.2.3-beta, extra args) exit 2 + usage + version files byte-identical; valid 0.2.0 stamps marketplace + every plugin.json + action.yml pin; downgrade allowed; --check clean=0/drift=1 and never writes. Full suite 246 pass.

Wiki re-ground (496ff9e): build-and-release prose re-verified against the f2e0a36 diff — version-consistency paragraph now states the validated argv contract and drops the bare no-arg mode; test-suite-catalog gains the test/sync-version.test.mjs bullet + source (body 7995/8000 chars). Both re-pinned to f2e0a36. No description: changes, CAPSULES untouched. Gate status in worktree: node --test 246/246, check-docs OK, freshness 31/31 fresh, sync-version --check clean. Push pending: pre-push's check-version-bump fails (scripts/ changed, base=head 0.36.0) because the lockstep bump is the orchestrator's serialized merge-readiness step per the sweep dispatch — branch fully committed locally at 496ff9e; orchestrator to bump then push.
<!-- SECTION:NOTES:END -->
