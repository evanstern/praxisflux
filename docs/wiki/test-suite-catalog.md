---
name: test-suite-catalog
description: Per-file coverage catalog of the node --test suite — what each test/*.test.mjs file pins down, from chassis smoke tests and plugin gates to the install-path e2e and release tooling.
kind: pattern
sources:
  - test/build.test.mjs
  - test/chassis.test.mjs
  - test/check-docs.test.mjs
  - test/gate-shim.test.mjs
  - test/codebase-to-course.course-gate.test.mjs
  - test/codebase-to-course.validate.test.mjs
  - test/educate-deck-selfcontained.test.mjs
  - test/gen-marketplace.test.mjs
  - test/grounding-wiki.capsules.test.mjs
  - test/grounding-wiki.freshness.test.mjs
  - test/handoff.test.mjs
  - test/html-base.test.mjs
  - test/install-path.test.mjs
  - test/research-gates.test.mjs
  - test/return-leg.test.mjs
  - test/spec-bridge.test.mjs
  - test/spec-derive.test.mjs
  - test/sync-shared.test.mjs
  - test/team-review.test.mjs
  - test/toolkit-borrow.test.mjs
  - test/version-bump.test.mjs
  - test/wiki.test.mjs
verified_against: abadcf4f08acde96dc6635afc05eb7535dbd771e
---

# Test suite — per-file coverage catalog

The per-file map of the [[test-suite]] (conventions, hook and CI enforcement live there).
One bullet per `test/*.test.mjs` file:

- `test/check-docs.test.mjs` — the docs-sync structural gate: fixtures for each omission
  (missing plugin row / install line / chassis module / releasing link), the plugin census
  ("<N> plugins" count claims vs `marketplace.json`, in words and digits; ghost rows and
  install lines for unregistered names), "the praxisflux repo itself is in sync", and
  stop-docs' `underRepo` root match (symlinked launch fires; siblings never match).
- `test/gate-shim.test.mjs` — every shipped Stop-hook shim's node-missing path
  (catalog-derived): with no resolvable node, `gate.sh` still exits 0 but emits its
  one-time stderr notice; the suite-wide `TMPDIR` sentinel keeps later runs — and other
  plugins' shims — silent.
- `test/build.test.mjs` — `scripts/build.mjs` packaging (`buildPlugins`): full builds wipe
  `dist/` and dereference `lib`; `--plugin` cleans only its target (siblings and `dist/npm`
  survive, stale target files don't); unknown plugins throw before cleaning; a bare
  `--plugin` exits 2 with usage, never a TypeError.
- `test/chassis.test.mjs` — smoke tests for shared `lib/`: project-root finders, markdown
  frontmatter/wikilinks, dates, template render, `checkHtml`, `createLifecycle`, installer
  helpers, and gate-runner `evaluate` (incl. crashing `resolveRoots`/`check` blocking as
  named problems).
- `test/codebase-to-course.course-gate.test.mjs` — the course output gate (`validateCourse`)
  against minimal fixture HTML with modules, quizzes, and translation blocks.
- `test/codebase-to-course.validate.test.mjs` — the course chrome's own validator
  (`references/validate.mjs`): translation-block pairing, bracket balance, `--fix`
  auto-close, chrome version-stamp checks, and the orphan-content repros field-reported
  by the-stacks.
- `test/educate-deck-selfcontained.test.mjs` — a deck.html must honor its "single
  self-contained file, no CDN" contract; the DoD gate runs the shared verifier over it.
  Also the deck-requirement config: `decksStandardForEveryLesson` is array-or-flag
  tolerant like `isDelegated` (an empty array requires no deck+guide, end to end
  through the gate).
- `test/gen-marketplace.test.mjs` — the generative catalog: an unregistered plugin dir gets
  a marketplace entry, hand-set category/tags survive, regeneration is idempotent, and the
  repo's own catalog is never stale.
- `test/grounding-wiki.capsules.test.mjs` — the capsule tier (corpus-spec v2): CAPSULES.md
  generation (deterministic, headered, INDEX-ordered, corpusDir-spelling-invariant across
  relative/absolute/trailing-slash invocations, pre-normalization headers degrading to a
  WARN with regeneration guidance) and the freshness gate's adoption-keyed budget
  enforcement (capsule/body overages, `size_budget_exempt` downgrade, stale/hand-edited
  rollup, warn-only before adoption).
- `test/grounding-wiki.freshness.test.mjs` — the wiki freshness gate (`validateFreshness`,
  `noteSources`/`parseSourcesBlock` — inline `[a, b]` arrays and block lists
  staleness-check identically; a source path missing from the working tree blocks naming
  note + path, including rename-after-pin) against a throwaway git repo, plus the plan
  loop (`classifyNote` truth table, stamp-only re-pin round-trip through `repin.mjs`,
  code-diff work orders, missing sources surfaced as problems, fresh-corpus silence,
  repin refusals — including a format-valid hash naming no commit, refused with the
  note left byte-identical, and a note outside any git repo).
- `test/handoff.test.mjs` — the shared handoff transport (round-trip, opaque body,
  gitignored `.handoff/`) plus educate's `progress.json` evidence gate, including the
  delegated round trip with each leg doing exactly what its skill instructs: build writes
  only the response, and the gate stays blocked at `built` until educate's return-leg
  evidence write (`handoff.returned`) lands — TASK-63 seam ownership.
- `test/html-base.test.mjs` — `lib/html/base.html` and the deck template pass the
  self-contained verifier with zero warnings (theme-aware, has a data table).
- `test/install-path.test.mjs` — the marketplace install path end to end: for every plugin
  shipping `hooks/hooks.json` (catalog-derived), simulate an install (`lib -> ../lib`
  dereferenced, no symlink survives), then spawn the exact Stop command from hooks.json
  with fake hook JSON on stdin — exit 0 clean, exit 2 with the gate's message on a
  per-plugin violating fixture, exit 0 under `stop_hook_active`, and exit 0 from an
  install path containing a space (the hooks.json command must quote the
  `${CLAUDE_PLUGIN_ROOT}` expansion). Runs hooks the way Claude Code spawns them rather
  than importing gate modules in-process; also its own CI job.
  Plus educate's plant simulation: the rendered `templates/CLAUDE.md` (placeholders
  substituted as `educate:start` instructs) leaves no `{{…}}`/`${CLAUDE_PLUGIN_ROOT}`
  behind, and every planted command runs as written from a user project with
  `CLAUDE_PLUGIN_ROOT` scrubbed from the environment.
- `test/research-gates.test.mjs` — research's branch/analysis gates (`validateVault`,
  `validateBranch`, `validateAnalysis`) against a synthetic fixture vault.
- `test/return-leg.test.mjs` — at `done`, a delegated build needs `foldedIn` evidence AND
  durable on-disk residue; a flag alone can't rubber-stamp the return leg.
- `test/spec-bridge.test.mjs` — the bridge gate: linked-task parsing (incl. the AC block),
  exceeds/lags/ok verdicts, `checkBridge` blocking, the Stop hook via gate-runner,
  `strictDone` mode (incl. the analysis-only near-miss warning), and the deterministic
  `plan` command (status move, Done summary, re-mirror, no-op board, shell quoting).
- `test/spec-derive.test.mjs` — pure Spec Kit derivation: lifecycle stages → status,
  per-phase checkbox counts, regenerated `tasks.md` re-deriving fresh, strict-mode
  `analysis.md` requirements, and graceful degradation on malformed files.
- `test/sync-shared.test.mjs` — stamped visual-contract regions in consumers match their
  canonical sources (`driftReport` must be empty) and `stampRegion` replaces only marked bodies.
- `test/team-review.test.mjs` — the output gate (`checkReview`: sections, citation
  resolution, in-target rejection with `.handoff/` exempt, untouched vs mutated snapshot),
  the run CLI (begin/finish/abandon, id collisions, self-review regressions incl. the
  default-report round trip, same-day default uniqueness), and the Stop-hook paths
  through gate-runner `evaluate`.
- `test/toolkit-borrow.test.mjs` — a deck that borrows toolkit modules (code-translation panel,
  reveal quiz) still passes educate's DoD gate and stays self-contained.
- `test/version-bump.test.mjs` — the release bump gate (`check-version-bump.mjs`): pure
  `evaluate()` scenarios (exempt/surface/tag-reuse/skill-version cases, incl. a non-semver
  base skill version failing loudly instead of skipping the increase check) plus an
  end-to-end run of the git wrapper over a throwaway git repo.
- `test/wiki.test.mjs` — educate's corpus-index roll-up (`topics/<topic>/WIKI.md` +
  `topics/WIKI.md`): parsing, rendering, staleness warnings; plus the spawned wiki CLI's
  check/sync contract — a vault-less single-topic `--check` converges with `--sync`
  (distinct no-vaults verdict, exit 0), a vaulted stale topic still exits 1 and is fixed
  by the `--sync` its message names.

## Connections

- Parent note: [[test-suite]] — conventions, pre-commit/pre-push hooks, and the CI layer.
- `handoff.test.mjs` and `return-leg.test.mjs` pin down the [[handoff-protocol]] transport and
  its evidence-plus-residue return leg.
- `sync-shared.test.mjs` imports `driftReport` from the [[build-and-release]] tooling, so
  hand-edited region drift fails the same suite the pre-commit hook runs.
