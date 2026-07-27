---
id: TASK-81
title: >-
  demo rig: enforce isolation on every mutating CLI path and close the
  env-injection determinism holes
status: To Do
assignee: []
created_date: '2026-07-27 17:51'
labels:
  - debt
dependencies: []
priority: medium
ordinal: 116000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Findings F1+F2 of refactor-triage run praxis-2026-07-27-17-33-15 (range b4e8e09..52b5abd) — evaluation report docs/reviews/team-review-praxis-2026-07-27-17-33-15.md §improved 1-2, triage record docs/reviews/refactor-triage-praxis-2026-07-27-17-33-15.md.

F1: assertOutsideCheckout is called only from generate() (demo/generate.mjs:154); the --stage (demo/generate.mjs:273) and standalone --check (demo/generate.mjs:277) branches run git checkout against ANY --dir with a .git — a real repo gets its HEAD detached and worktree rewritten (demo/generate.mjs:223). The assertion itself is a string compare with no realpathSync (demo/generate.mjs:148): a symlink into the checkout, or a case-variant path on case-insensitive darwin, passes. This narrows the runbook's hard rule (docs/design/demo-rig-runbook.md, Concurrency doctrine: "No rig command may ever run against the praxisflux checkout"). Fix shape: one resolveTarget() guard — realpath, outside-checkout assert, and (for non-generate paths) require the .git/praxisflux-demo-rig marker — called by all three mutating branches.

F2: gitEnv scrubs only GIT_DIR/GIT_WORK_TREE/GIT_INDEX_FILE (demo/generate.mjs:67); GIT_CONFIG_COUNT/GIT_CONFIG_KEY_n/GIT_CONFIG_VALUE_n (autocrlf/gpgsign → different objects), GIT_DEFAULT_HASH (sha256 → every fixture pin unresolvable), and GIT_TEMPLATE_DIR (hook injection) survive — contradicting the header's hash-identical-across-machines claim (demo/generate.mjs:24). And runGate's run-gates branch inherits the caller's env wholesale (demo/generate.mjs:207) while its app-test branch scrubs (demo/generate.mjs:204) — a set GIT_DIR makes freshness/spec-bridge gate the WRONG repo. Fix: widen the scrub to the GIT_CONFIG_*/GIT_DEFAULT_HASH/GIT_TEMPLATE_DIR family and thread gitEnv through both runGate branches.

While in the file (deferred F9 rides along only if trivially in reach — not required): duplicate node:os imports (demo/generate.mjs:44-45), runGate's redundant loadManifest() re-read (demo/generate.mjs:204).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All three mutating CLI paths (generate/--reset, --stage, --check) pass one shared guard: realpathSync'd outside-checkout assertion, and non-generate paths additionally require the rig marker
- [ ] #2 gitEnv scrubs the GIT_CONFIG_COUNT/KEY/VALUE family, GIT_DEFAULT_HASH, and GIT_TEMPLATE_DIR; runGate's run-gates branch runs under the same scrubbed env as its app-test branch
- [ ] #3 test/demo-rig.test.mjs covers the guard (a --stage/--check against a non-rig dir dies with a named message, not a crash) and node --test stays green
<!-- AC:END -->
