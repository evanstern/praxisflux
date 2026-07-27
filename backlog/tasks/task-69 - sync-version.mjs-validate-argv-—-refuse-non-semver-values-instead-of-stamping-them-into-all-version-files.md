---
id: TASK-69
title: >-
  sync-version.mjs: validate argv — refuse non-semver values instead of stamping
  them into all version files
status: To Do
assignee: []
created_date: '2026-07-27 04:33'
labels:
  - sweep-followup
dependencies: []
priority: low
ordinal: 104000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
scripts/sync-version.mjs stamps its first argv verbatim into all 11 version files (marketplace.json, 9 plugin.json, action.yml npx pin) with no validation — during TASK-63, `sync-version.mjs --help` happily wrote the literal string "--help" as the version everywhere (reverted before commit; nothing landed). Add argument validation: refuse a missing value or anything that is not strict x.y.z semver, print usage, exit nonzero; optionally also refuse a version at or below the current lockstep value unless a flag overrides (check-version-bump already gates increases at PR time, so the CLI-side rule can stay minimal — decide and record). TASK-66 established the same pattern for build.mjs's bare --plugin (usage error, exit 2) — follow it. Origin: incident reported by TASK-63's implementer during the downstream-bugfix sweep (runbook docs/design/downstream-bugfix-runbook.md); carding approved by operator 2026-07-27.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Non-semver or missing argv (incl. --help style flags) prints usage and exits nonzero without touching any file
- [ ] #2 Valid x.y.z behavior unchanged (all 11 files stamped, sync --check unchanged)
- [ ] #3 Regression test covers the refusal and the no-files-touched guarantee
<!-- AC:END -->
