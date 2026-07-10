---
id: TASK-16
title: >-
  CI consumption surface: composite GitHub Action running the praxis gates for
  consumer repos
status: Done
assignee:
  - '@claude'
created_date: '2026-07-10 18:32'
updated_date: '2026-07-10 18:38'
labels: []
dependencies: []
priority: high
ordinal: 48000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Consumer repos (first: the-stacks) want the praxis way — spec-bridge check, grounding-wiki freshness, course gate — enforced in their CI, where locally-installed plugins don't exist. Rather than each consumer hand-rolling a pinned checkout of this repo and calling repo-internal gate paths, praxis ships the surface itself: a composite action at the repo root so consumers write 'uses: evanstern/praxis@v<tag>' with a gates: input. GitHub fetches the praxis tree at that tag onto the runner; the action runs the gate CLIs from github.action_path against the consumer workspace (the per-plugin lib symlinks from TASK-15 make a plain checkout runnable). This makes gate paths/args/exit codes praxis's versioned contract, upgrades a one-token pin bump (Dependabot-compatible), and adoption a three-line snippet. Local enforcement in consumer repos stays with the installed plugins' Stop hooks; CI is authoritative at the pin — same split praxis itself uses.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 action.yml (composite) at repo root with inputs: gates (comma-separated, validated — unknown names fail loudly), path (default .), plus per-gate dirs as needed
- [x] #2 A gate-runner entry script maps gate names to the existing gate CLIs/modules; each failure names its fix, exit nonzero on any failure
- [x] #3 wiki-freshness gate detects a shallow clone and fails with the exact fix (fetch-depth: 0)
- [x] #4 Tests cover the runner (unknown gate, passing fixture, failing fixture)
- [x] #5 Docs: a consuming-gates doc with the consumer snippet, README mention, wiki updated; marketplace version bumped (minor)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Branch task-16-gates-action
2. Read the three gate interfaces (spec-bridge cli, grounding-wiki cli, course gate) and design scripts/run-gates.mjs mapping gate names -> invocations
3. Write scripts/run-gates.mjs (validated gates input, shallow-clone guard for freshness, failure-names-fix messages) + action.yml composite at repo root
4. Tests: test/run-gates.test.mjs (unknown gate, pass fixture, fail fixture)
5. Docs: docs/consuming-gates.md + README + wiki (extend build-and-release note), bump minor 0.3.2 -> 0.4.0
6. Gates green, push, PR
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Slice 1 committed: action.yml + scripts/run-gates.mjs + 5 tests (90 total green). Runner imports gate functions directly (course gate has no CLI, only validateCourse). Smoke: praxis itself passes spec-bridge + wiki-freshness via the runner; unknown gate exits 2.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shipped the CI consumption surface: action.yml (composite) at repo root + scripts/run-gates.mjs mapping validated gate names (spec-bridge, wiki-freshness, course) onto the existing gate functions. Unknown gates exit 2 loudly; failures exit 1 with fix-naming lines; wiki-freshness detects shallow clones and names the fetch-depth: 0 fix. 5 new tests (90 total green), consumer doc at docs/consuming-gates.md with the uses: snippet and the local/CI enforcement split, README pointers, wiki updated, bumped 0.4.0 (minor). The uses: path itself is provable only against a published tag — first consumer run (the-stacks) is the live proof. TASK-17 documents the @praxis/gates npm migration that swaps the runner transport without changing this contract.
<!-- SECTION:FINAL_SUMMARY:END -->
