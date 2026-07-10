---
name: chassis
description: The shared zero-dependency Node module layer in lib/, vendored into each plugin at build time so shipped plugins are self-contained.
kind: component
sources:
  - lib/README.md
  - scripts/build.mjs
  - lib/toolkit/README.md
verified_against: 5934860e2021d1d3b096d3c6d7a30bf5d434c003
---

# Chassis

The chassis is the repo-root `lib/` directory: zero-dependency Node (`.mjs`) modules shared by
every praxis plugin. It exists so common plumbing — root discovery, the Stop-hook gate harness,
markdown parsing, lifecycle rules — is written once instead of per plugin, while each shipped
plugin still installs as a self-contained unit with no runtime dependency on the repo or on
sibling plugins.

## How it works

During development, plugin code imports the chassis by relative path as `../../lib/…` (every
importer sits in a depth-1 subdirectory of its plugin, `scripts/` or `gates/`). A shipped plugin
cannot see a repo-root sibling, so `scripts/build.mjs` **vendors** the chassis at package time:

- `node scripts/build.mjs [--plugin <name>|all]` derives the plugin list from
  `.claude-plugin/marketplace.json` (the single source of truth), so registering a plugin there
  is enough to have it packaged.
- For each target it copies the plugin sources to `dist/<plugin>/`, copies `lib/` wholesale to
  `dist/<plugin>/lib/`, then `rewriteLibImports` rewrites `../../lib/` to `../lib/` in every
  `.mjs` file (skipping the vendored `lib/` itself). The rewrite is uniform because all
  importers are at depth 1.
- At runtime inside an installed plugin, `${CLAUDE_PLUGIN_ROOT}/lib/…` therefore resolves to
  that plugin's own vendored copy.
- The script wipes `dist/` before building and warns about drift: any top-level directory with
  a `.claude-plugin/plugin.json` that is not registered in `marketplace.json` would silently
  not be built, so it prints a warning.

The module roster in `lib/`:

- `project-root.mjs` — locate project roots by walking the filesystem ([[project-root]])
- `gate-runner.mjs` — the shared Stop-hook harness ([[gate-runner]])
- `markdown.mjs` — frontmatter/wikilink/code-span parsing for gates ([[markdown-module]])
- `selfcontained.mjs` — HTML self-containment verifier ([[selfcontained-verifier]])
- `lifecycle.mjs` — status-cannot-exceed-proven-artifacts rules ([[lifecycle-engine]])
- `installer.mjs` — project bootstrap/install helpers ([[installer]])
- `dates.mjs`, `template.mjs`, `handoff.mjs` — small utilities for dates, file templating,
  and the inter-plugin handoff transport ([[chassis-utilities]])
- `html/base.html` — the shared CSS custom-property token schema referenced by toolkit snippets
- `toolkit/` — shared *content* rather than plumbing ([[toolkit]]): authoring guidance and
  copy-paste CSS/JS modules a skill reads while producing decks/courses/briefings
  (`tooltip.md`, `pedagogy.md`, `svg-diagrams.md`, `code-translation.md`, `quiz-patterns.md`,
  `diagrams.md`). Gate code never imports from `toolkit/`; skills reference it as
  `${CLAUDE_PLUGIN_ROOT}/lib/toolkit/<module>.md` and must degrade gracefully when a module
  is absent.

## Connections

The chassis is consumed by every plugin's gates and scripts ([[gates-convention]]) — notably
[[research-plugin]], [[grounding-wiki-plugin]], [[educate-plugin]], [[build-plugin]], and
[[codebase-to-course-plugin]] — and is distributed into `dist/<plugin>/lib` by
[[build-and-release]]. Its modules are individually documented in [[project-root]],
[[gate-runner]], [[markdown-module]], [[selfcontained-verifier]], [[lifecycle-engine]],
[[installer]], [[chassis-utilities]], and [[toolkit]]. Behavior is covered by [[test-suite]].

## Operational notes

- Zero external dependencies by design; only `node:` built-ins.
- `dist/` holds packaged copies only — never edit there; the canonical copy is repo-root `lib/`.
- Building an unknown plugin name exits with status 1 (`no such plugin`).
- Forgetting to run the build before packaging a `.plugin` ships stale or missing vendored lib.
