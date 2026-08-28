---
name: test-suite
description: The zero-dependency node --test suite under test/ that covers the chassis, every plugin's gates, the handoff return leg, and shared-region drift.
kind: pattern
sources:
  - .githooks/pre-commit
  - .githooks/pre-push
verified_against: d6be2b825da7ce417bbe38392e44c1e09c5ca941
---

# Test suite

The test files under `test/` keep the chassis and every plugin's gate logic honest. The suite
is deliberately minimal: plain `node --test` with `node:test` and `node:assert/strict`, zero npm
dependencies (the repo has no `package.json`), and fixtures built in throwaway `mkdtempSync`
directories rather than checked-in test data.

## How it works

Conventions shared across the files:

- Runner: `node --test` from the repo root; files are named `<area>.test.mjs`.
- Fixtures are synthesized per-test in `os.tmpdir()` scratch dirs (a `scratch()` or `project()`
  helper per file); the git-facing tests even spin up throwaway git repos with
  `execFileSync("git", …)`.
- Tests import the real gate/chassis modules directly (e.g.
  `../educate/gates/dod.mjs`, `../lib/gate-runner.mjs`), so they exercise the same code the
  Stop hooks run.

**What each file covers** is cataloged summary-style in [[test-suite-catalog]] — one bullet
per `test/*.test.mjs` file, from chassis smoke tests and per-plugin gates to the
install-path e2e and the release tooling; that child note carries the pins on `test/*`.

**Hook and CI enforcement.** A tracked hook at `.githooks/pre-commit` (enabled once per clone
with `git config core.hooksPath .githooks`) runs, in order: `node --test` (wrapped in
`env -u GIT_DIR -u GIT_WORK_TREE -u GIT_INDEX_FILE` so worktree checkouts don't leak an
absolute `GIT_DIR` into the suite's tmpdir fixture repos), then
`node scripts/gen-marketplace.mjs --check`, `node scripts/sync-version.mjs --check`, then
`node scripts/check-docs.mjs`; it is `set -e`, so any failure blocks the commit. A sibling
`.githooks/pre-push` runs the version-bump gate (`check-version-bump.mjs --base
origin/main`) and the wiki freshness gate, but **warns and exits 0** on findings — both are
red by construction mid-PR (spec 057) — while a check that *cannot run* still blocks it (exit
code alone can't separate findings from a crash, so each declares a marker its real output
carries). Because `core.hooksPath` is per-clone — and, if it points at a stale path, silently
runs nothing at all — the authoritative layer is CI: `.github/workflows/ci.yml` repeats the
suite, both `--check` validators, `check-docs.mjs`, **the repo's own spec-bridge and
wiki-freshness self-checks** (moved out of `node --test` by spec 057, since they assert repo
state rather than code behavior), a full package build, and the bump gate on every PR (see
[[build-and-release]]).

## Connections

- Covers the [[chassis]] end to end, including [[project-root]], [[markdown-module]],
  [[selfcontained-verifier]], [[lifecycle-engine]], [[gate-runner]], and [[installer]].
- Exercises each plugin's instantiation of the [[gates-convention]]: [[research-plugin]],
  [[educate-plugin]], [[grounding-wiki-plugin]], [[codebase-to-course-plugin]],
  [[spec-bridge-plugin]], [[team-review-plugin]].
- The per-file map — including the [[handoff-protocol]] transport tests and the
  region-drift check from [[build-and-release]] — lives in [[test-suite-catalog]].

## Operational notes

- Run: `node --test` at the repo root; no install step, no config file.
- The new-plugin checklist in [[skill-patterns]] requires tests under `test/` and a green
  `node --test`.
- The hooks path is opt-in per clone; without `core.hooksPath` set, nothing enforces the suite
  locally.
