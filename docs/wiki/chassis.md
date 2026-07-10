---
name: chassis
description: The shared zero-dependency Node module layer in lib/, reached from each plugin through a committed lib -> ../lib symlink that installers and packaging dereference into a real copy.
kind: component
sources:
  - lib/README.md
  - scripts/build.mjs
  - lib/toolkit/README.md
verified_against: ab6e3fd6377e2472c7e8db3af1abfe66ed7300d7
---

# Chassis

The chassis is the repo-root `lib/` directory: zero-dependency Node (`.mjs`) modules shared by
every praxisflux plugin. It exists so common plumbing — root discovery, the Stop-hook gate harness,
markdown parsing, lifecycle rules — is written once instead of per plugin, while each shipped
plugin still installs as a self-contained unit with no runtime dependency on the repo or on
sibling plugins.

## How it works

Every plugin directory carries a committed `lib -> ../lib` symlink, so plugin code imports the
chassis as `../lib/…` (every importer sits in a depth-1 subdirectory of its plugin, `scripts/`
or `gates/`) and skills reference `${CLAUDE_PLUGIN_ROOT}/lib/…`. The same path works in both
worlds:

- **In the repo**, the symlink resolves to repo-root `lib/` — no build step during development.
- **When installed from the marketplace**, Claude Code copies only the plugin's source dir into
  its cache, but the plugins spec dereferences any symlink whose target resolves elsewhere in
  the same marketplace: the cache copy gets a *real* `lib/` directory in the symlink's place.
  A path escaping the plugin root (the old `../../lib/…` imports) would not survive that copy —
  that was exactly the shipped-plugin `ERR_MODULE_NOT_FOUND` bug fixed in 0.3.2.
- **When packaged**, `node scripts/build.mjs [--plugin <name>|all]` (plugin list derived from
  `.claude-plugin/marketplace.json`, the single source of truth) copies each plugin to
  `dist/<plugin>/` and swaps the copied `lib` symlink for a real copy of the chassis — Node's
  `cpSync` `dereference` option doesn't materialize directory symlinks met mid-recursion, so
  the script does the swap explicitly. It wipes `dist/` before building and warns about drift:
  any top-level directory with a `.claude-plugin/plugin.json` that is not registered in
  `marketplace.json` would silently not be built.

The module roster in `lib/`:

- `project-root.mjs` — locate project roots by walking the filesystem ([[project-root]])
- `gate-runner.mjs` — the shared Stop-hook harness ([[gate-runner]])
- `markdown.mjs` — frontmatter/wikilink/code-span parsing for gates ([[markdown-module]])
- `selfcontained.mjs` — HTML self-containment verifier ([[selfcontained-verifier]])
- `lifecycle.mjs` — status-cannot-exceed-proven-artifacts rules ([[lifecycle-engine]])
- `installer.mjs` — project bootstrap/install helpers ([[installer]])
- `spec-derive.mjs` — pure Spec Kit `specDir` → derived kanban status, the interpretation
  layer of [[spec-bridge-plugin]]
- `dates.mjs`, `template.mjs`, `handoff.mjs`, `cli.mjs` — small utilities for dates, file
  templating, the inter-plugin handoff transport, and the symlink-safe run-as-CLI guard
  ([[chassis-utilities]])
- `html/base.html` — the shared CSS custom-property token schema referenced by toolkit snippets
- `toolkit/` — shared *content* rather than plumbing ([[toolkit]]): authoring guidance and
  copy-paste CSS/JS modules a skill reads while producing decks/courses/briefings
  (`tooltip.md`, `pedagogy.md`, `svg-diagrams.md`, `code-translation.md`, `quiz-patterns.md`,
  `diagrams.md`). Gate code never imports from `toolkit/`; skills reference it as
  `${CLAUDE_PLUGIN_ROOT}/lib/toolkit/<module>.md` and must degrade gracefully when a module
  is absent. Its README also indexes plugin-owned versioned chrome (currently
  codebase-to-course's course chrome), which lives with its owning plugin rather than in `lib/`.

## Connections

The chassis is consumed by every plugin's gates and scripts ([[gates-convention]]) — notably
[[research-plugin]], [[grounding-wiki-plugin]], [[educate-plugin]], [[build-plugin]],
[[codebase-to-course-plugin]], and [[spec-bridge-plugin]] — and reaches installed and packaged
copies through each plugin's `lib` symlink, dereferenced by the marketplace installer and by
[[build-and-release]]. Its modules are individually documented in [[project-root]],
[[gate-runner]], [[markdown-module]], [[selfcontained-verifier]], [[lifecycle-engine]],
[[installer]], [[chassis-utilities]], and [[toolkit]]. Behavior is covered by [[test-suite]].

## Operational notes

- Zero external dependencies by design; only `node:` built-ins.
- `dist/` holds packaged copies only — never edit there; the canonical copy is repo-root `lib/`.
- Building an unknown plugin name exits with status 1 (`no such plugin`).
- The per-plugin `lib` symlinks must stay committed *as symlinks* — replacing one with a plain
  file or directory breaks the install-time dereference. Windows contributors need symlink
  support enabled (Developer Mode) to check them out correctly; installers are unaffected.
