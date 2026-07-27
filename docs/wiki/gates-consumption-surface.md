---
name: gates-consumption-surface
description: How consumer repos run praxisflux gates, split from [[build-and-release]] — the @praxisflux/gates npm package staged by build-npm.mjs, the composite GitHub Action (action.yml) that runs it at a pinned release via npx, and the shared runner scripts/run-gates.mjs with its exit-code contract (0 pass, 1 gate failure, 2 usage error). Load when changing build-npm.mjs, action.yml, run-gates.mjs, or docs/consuming-gates.md, or when debugging a consumer repo's gate run.
kind: component
sources:
  - scripts/build-npm.mjs
  - scripts/run-gates.mjs
  - action.yml
  - docs/consuming-gates.md
verified_against: 54d35e6d5db24414611d3067b0cd87bc6c268167
---

# Gates consumption surface

The consumption half of [[build-and-release]]: how repos that don't carry praxisflux run its
gates. One runner (`scripts/run-gates.mjs`) is shipped two ways — as the bin of the
`@praxisflux/gates` npm package and behind the repo's composite GitHub Action — and the
consumer-facing contract is documented in `docs/consuming-gates.md`. That doc opens with
the enforcement split the suite delivers: installed Stop hooks are advisory/opt-in by
design (never blocking over a missing runtime), while this CI surface at a pinned release
is the authoritative enforcement point — gates make dishonest status expensive locally and
impossible in CI.

## npm package staging

`scripts/build-npm.mjs` (run as `node scripts/build-npm.mjs [--out <dir>]`, default
`dist/npm/`) carves the gate surface into an installable npm package (`PACKAGE_NAME`,
`@praxisflux/gates`): the same `scripts/run-gates.mjs` the action uses, root `lib/`, each
gate plugin's `gates/` dir, the plugin-local `lib` symlinks materialized as real copies (npm
cannot pack symlinks — the build fails on any symlink in the output), and the course gate's
`validate.mjs` reference. `package.json` is generated from `marketplace.json`, so the npm
version is lockstep by construction; `docs/consuming-gates.md` ships as the README, root
`LICENSE` (MIT) rides along, and the bin `praxisflux-gates` points at the runner.
`test/build-npm.test.mjs` packs the tree and drives the bin through a `node_modules/.bin`
symlink, asserting the contract exit codes.

## The composite action

`action.yml` + `scripts/run-gates.mjs` + `@praxisflux/gates` make the repo double as a
composite GitHub Action: consumer repos run the gates at a pinned release tag with
`uses: evanstern/praxisflux@v<version>` and a validated `gates:` input (`spec-bridge`,
`wiki-freshness`, `course`; unknown names fail loudly). The action's internals run
`npx --yes @praxisflux/gates@<pin>` — the npm package staged by `build-npm.mjs`, its pin
stamped in lockstep by `sync-version.mjs` and guaranteed live before the tag exists by the
release ordering in [[release-pipeline]] (the TASK-17 migration; the run-from-checkout era
ended with it). Non-GitHub CI and local one-offs call `npx @praxisflux/gates` directly.
Either way `run-gates.mjs` maps gate names onto the existing gate functions against the
consumer workspace. Exit codes are the contract (0 pass · 1 gate failure · 2 usage error);
`wiki-freshness` detects shallow clones and names the `fetch-depth: 0` fix.

## Connections

- Split summary-style from [[build-and-release]], which owns the packaging, catalog,
  version-lockstep, and docs-sync tooling; `sync-version.mjs` (described there) is what
  stamps this action's npx pin.
- The publish-before-tag ordering that makes the pinned `npx` call race-free is
  [[release-pipeline]]'s invariant.
- The gates the runner exposes are the [[gates-convention]] in consumer repos:
  `spec-bridge`, `wiki-freshness` (see [[grounding-wiki-plugin]]), and `course`. The
  `spec-bridge` gate honors the checked repo's own `.spec-bridge.json` — `strictDone` and
  the opt-in phase-level `statusVocabulary` ([[spec-bridge-plugin]]) — so consumer boards
  are judged at the granularity they opted into.
- Guarded by the [[test-suite]]: `test/build-npm.test.mjs` (packed-tarball bin contract) and
  `test/run-gates.test.mjs` (gate registry ↔ action.yml agreement, shallow-clone failure,
  symlinked-checkout invocation).

## Operational notes

- `run-gates.mjs`'s run-as-CLI entry uses `runAsCli` from `lib/cli.mjs`, which realpaths
  both `import.meta.url` and `process.argv[1]` before comparing — Node resolves the former
  through symlinks but leaves the latter as typed, so the naive equality check made any
  invocation through a symlinked checkout path silently run zero of the CLI body (a green
  exit having checked nothing). `test/run-gates.test.mjs` regression-covers the symlinked
  invocation.
- An empty or unknown `--gates` list is a usage error (exit 2), never a silent skip.
