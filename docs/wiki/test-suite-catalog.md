---
name: test-suite-catalog
description: Per-file coverage catalog of the node --test suite, repo-tooling half — what each chassis, packaging, scaffolding, docs-drift, install-path, and CI-runner test file pins down, one bullet per file. Plugin-gate and cross-plugin-seam suites are cataloged in test-suite-catalog-plugins.
kind: pattern
sources:
  - test/build.test.mjs
  - test/build-npm.test.mjs
  - test/chassis.test.mjs
  - test/check-docs.test.mjs
  - test/demo-rig.test.mjs
  - test/gate-shim.test.mjs
  - test/gen-marketplace.test.mjs
  - test/html-base.test.mjs
  - test/install-path.test.mjs
  - test/new-plugin.test.mjs
  - test/run-gates.test.mjs
  - test/sync-shared.test.mjs
  - test/sync-version.test.mjs
  - test/version-bump.test.mjs
verified_against: 440cd007ae6e6ebce24541dbbe38a8f3d179a4ea
---

# Test suite — per-file coverage catalog (chassis, tooling & release)

The per-file map of the [[test-suite]] (conventions, hook and CI enforcement live there),
split summary-style across two notes. This half: the repo's own machinery — the shared
chassis, packaging and release tooling, docs drift, scaffolding, the CI gate runner, and
the marketplace install path. The plugin-gate and cross-plugin-seam suites (spec-bridge,
grounding-wiki, educate/build, codebase-to-course, research, reorient, team-review, pdlc)
are cataloged one-bullet-per-file in [[test-suite-catalog-plugins]].

One bullet per `test/*.test.mjs` file:

- `test/build.test.mjs` — `scripts/build.mjs` packaging (`buildPlugins`): full builds wipe
  `dist/` and dereference `lib`; `--plugin` cleans only its target (siblings and `dist/npm`
  survive, stale target files don't); unknown plugins throw before cleaning; a bare
  `--plugin` exits 2 with usage, never a TypeError.
- `test/build-npm.test.mjs` — `scripts/build-npm.mjs` (the `@praxisflux/gates` carve): the
  staging tree is symlink-free, lockstep-versioned, and carries the contract files;
  `stampNpxPin` rewrites only the named package's pins, and action.yml's npx pin matches
  the marketplace version; the integration proof packs the staging tree, lays the tarball
  out exactly as npm install would, and drives the bin through a `node_modules/.bin`
  symlink — usage exit 2, a passing gate exit 0 (proving the whole packed import graph
  resolves), a failing gate exit 1 with the fix named.
- `test/chassis.test.mjs` — smoke tests for shared `lib/`: project-root finders, markdown
  frontmatter/wikilinks, dates, template render, `checkHtml`, `createLifecycle`, installer
  helpers, and gate-runner `evaluate` (incl. crashing `resolveRoots`/`check` blocking as
  named problems).
- `test/check-docs.test.mjs` — the docs-sync structural gate: fixtures for each omission
  (missing plugin row / install line / chassis module / releasing link), the plugin census
  ("<N> plugins" count claims vs `marketplace.json`, in words and digits; ghost rows and
  install lines for unregistered names), "the praxisflux repo itself is in sync", and
  stop-docs' `underRepo` root match (symlinked launch fires; siblings never match).
- `test/demo-rig.test.mjs` — the PDLC demo rig cannot rot silently: regenerates the demo
  repo from `demo/fixtures/` into the OS temp dir, asserts the five stage tags, runs the
  per-stage gate matrix (`--check`: app tests, wiki-freshness, spec-bridge), then
  generates again and asserts identical tag commits, stage tree hashes, and demo-board
  task IDs (R8 repeatability). No network, no secrets — the generated repos' git only.
- `test/gate-shim.test.mjs` — every shipped Stop-hook shim's node-missing path
  (catalog-derived): with no resolvable node, `gate.sh` still exits 0 but emits its
  one-time stderr notice; the suite-wide `TMPDIR` sentinel keeps later runs — and other
  plugins' shims — silent.
- `test/gen-marketplace.test.mjs` — the generative catalog: an unregistered plugin dir gets
  a marketplace entry, hand-set category/tags survive, regeneration is idempotent, and the
  repo's own catalog is never stale.
- `test/html-base.test.mjs` — `lib/html/base.html` and the deck template pass the
  self-contained verifier with zero warnings (theme-aware, has a data table).
- `test/install-path.test.mjs` — the marketplace install path end to end: for every plugin
  shipping `hooks/hooks.json` (catalog-derived), simulate an install (`lib -> ../lib`
  dereferenced, no symlink survives), then spawn the exact Stop command from hooks.json
  with fake hook JSON on stdin — exit 0 clean, exit 2 with the gate's message on a
  per-plugin violating fixture, exit 0 under `stop_hook_active`, and exit 0 from an
  install path containing a space (the hooks.json command must quote the
  `${CLAUDE_PLUGIN_ROOT}` expansion). Runs hooks as Claude Code spawns them, not
  in-process; also its own CI job.
  Plus educate's plant simulation: the rendered `templates/CLAUDE.md` (placeholders
  substituted as `educate:start` instructs) leaves no `{{…}}`/`${CLAUDE_PLUGIN_ROOT}`
  behind, and every planted command runs as written from a user project with
  `CLAUDE_PLUGIN_ROOT` scrubbed from the environment.
- `test/new-plugin.test.mjs` — `scripts/new-plugin.mjs` scaffolding: the stamped plugin
  passes `checkDocs` unmodified (README row + install line inserted, "<N> plugins" count
  claims rewritten in words and digits) and `genMarketplace` regenerates as a no-op;
  the plugin version rides the marketplace's (sync-version lockstep), SKILL.md carries
  the frontmatter the bump gate keys on plus the gate→work→gate sections, and the
  `lib -> ../lib` symlink is committed; rerunning fails safely instead of clobbering,
  `--with-gate` stamps the Stop-hook trio as a safe no-op (quoted `${CLAUDE_PLUGIN_ROOT}`
  expansion, executable `gate.sh`, dependency-free stub gate resolving no roots), and
  non-kebab-case names are rejected before touching disk.
- `test/run-gates.test.mjs` — `scripts/run-gates.mjs` (the CI consumption surface behind
  action.yml): unknown or empty gate lists are usage errors (exit 2), never silent skips;
  the praxisflux repo passes its own spec-bridge + wiki-freshness gates; failures name the
  fix (course's missing index.html, shallow clone → `fetch-depth: 0`); an exception thrown
  WHILE a gate runs exits 1 (gate failure), never 2; the `GATES` registry and action.yml's
  documented gate list are drift-checked against each other; and the realpathed run-as-CLI
  guard fires through a symlinked checkout — no silent zero-gate pass.
- `test/sync-shared.test.mjs` — stamped visual-contract regions in consumers match their
  canonical sources (`driftReport` empty); `stampRegion` replaces only marked bodies.
- `test/sync-version.test.mjs` — sync-version's argv guard: refusals exit 2 + usage, version
  files byte-identical (fixture copy); valid stamp, downgrade, `--check` covered.
- `test/version-bump.test.mjs` — the release bump gate (`check-version-bump.mjs`): pure
  `evaluate()` scenarios (exempt/surface/tag-reuse/skill-version cases, incl. a non-semver
  base skill version failing loudly instead of skipping the increase check) plus an
  end-to-end run of the git wrapper over a throwaway git repo.

## Connections

- Parent note: [[test-suite]] — conventions, pre-commit/pre-push hooks, and the CI layer.
- Sibling half: [[test-suite-catalog-plugins]] — the plugin-gate and cross-plugin-seam files.
- `sync-shared.test.mjs` imports `driftReport` from the [[build-and-release]] tooling, so
  hand-edited region drift fails the same suite the pre-commit hook runs.
- `build-npm.test.mjs` and `run-gates.test.mjs` pin the [[gates-consumption-surface]] — the
  npm package and composite action consumers run.
