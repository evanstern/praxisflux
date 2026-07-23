---
id: TASK-39
title: 'Adoption readiness: prove the marketplace install path end-to-end'
status: To Do
assignee: []
created_date: '2026-07-23 17:25'
updated_date: '2026-07-23 17:26'
labels: []
dependencies: []
references:
  - >-
    backlog/docs/reviews/doc-1 -
    Team-review-2026-07-23-—-praxisflux-vs-its-own-tenets.md
priority: high
ordinal: 74000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Owner decision (2026-07-23, team-review follow-up): praxisflux is intended for consumption by others — opinionated about its own internal tool choices, opt-in for third-party stuff, but the consumption surface must actually work. The team review found the biggest structural bet unverified: the symlinked-lib scheme rests on marketplace installs dereferencing lib -> ../lib, and no CI job simulates that path; the four Stop shims are bash and repo symlinks assume core.symlinks, so Windows users would get gates that are silently absent. Convert the bet into a checked invariant.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A CI job simulates a marketplace install (copies a plugin with symlinks dereferenced) and spawns its gate.sh/stop.mjs with fake stdin against a fixture, asserting exit codes — covering both the symlink bet and the currently-untested hook path
- [ ] #2 README Install section accurately states the supported install surfaces and their access prerequisites (including the private-repo caveat until the repo goes public)
- [ ] #3 Windows support is an explicit recorded decision (supported, or declared out of scope in README/docs), not silence
<!-- AC:END -->
