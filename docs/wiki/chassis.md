---
name: chassis
description: The shared zero-dependency Node module layer in lib/, reached from each plugin through a committed lib -> ../lib symlink that installers and packaging dereference into a real copy.
kind: component
sources:
  - lib/README.md
  - scripts/build.mjs
  - lib/toolkit/README.md
  - lib/structured-offload.mjs
verified_against: b992693223645641ff989e180fa7b2a49f009293
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
  `.claude-plugin/marketplace.json`, the single source of truth) copies each target to
  `dist/<plugin>/` and swaps the copied `lib` symlink for a real copy of the chassis — Node's
  `cpSync` `dereference` option doesn't materialize directory symlinks met mid-recursion, so
  the script does the swap explicitly. A full build wipes `dist/` first; `--plugin` cleans
  only its own target dir. Scoped-clean, drift-warning, and argv details: [[dist-packaging]].

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
- `structured-offload.mjs` — schema-validated, fail-soft calls to a local Ollama or
  OpenAI-compatible endpoint (spec 063); see "Local-model offload" below
- `html/base.html` — the shared CSS custom-property token schema referenced by toolkit snippets
- `handoff-protocol.md` — a stamped copy of the canonical `docs/handoff-protocol.md`
  (re-stamped by `scripts/sync-shared.mjs`, drift-tested), shipped here so skills can cite
  the protocol as `${CLAUDE_PLUGIN_ROOT}/lib/handoff-protocol.md` from an installed plugin
- `toolkit/` — shared *content* rather than plumbing ([[toolkit]]): authoring guidance and
  copy-paste CSS/JS modules a skill reads while producing decks/courses/briefings
  (`tooltip.md`, `pedagogy.md`, `svg-diagrams.md`, `code-translation.md`, `quiz-patterns.md`,
  `diagrams.md`). Gate code never imports from `toolkit/`; skills reference it as
  `${CLAUDE_PLUGIN_ROOT}/lib/toolkit/<module>.md` and must degrade gracefully when a module
  is absent. Its README also indexes plugin-owned versioned chrome (currently
  codebase-to-course's course chrome), which lives with its owning plugin rather than in `lib/`.

## Local-model offload

`structured-offload.mjs` (`offload({ prompt, schema, config, timeoutMs })`) lets narrow,
mechanically-checkable work (classification into a closed enum, path lookups) run against
a local model instead of spending orchestrator context — but only work whose output is
verifiable against a schema; free-text summaries are permanently out of scope (they'd
become undetectable corpus rot behind a `verified_against` pin).

- **Config as data**, beside the model-tier ladder (`.claude/model-tiers.json` — see
  [[pdlc-grounding-block]] for the ladder itself): `.claude/structured-offload.json` with
  `endpoint`, `api` (`"ollama"` or `"openai"`), `model`, optional `timeoutMs`, and optional
  `residuePath` (a JSON-lines log of `{ backend, model, outcome, reason?, ms }` per call).
- **Opt-in, absent by default:** no config file (or one that's unreadable/malformed/missing
  a required field) means `loadConfig` returns `null` and `offload` reports
  `{ ok: false, reason: 'unconfigured' }` — behavior is byte-identical to a host that never
  installed this module.
- **Fail-soft, never throws:** every failure path — unconfigured, `timeout` (via
  `AbortSignal.timeout`), `refused` (connection error), `http-error` (non-2xx),
  `invalid-json`, `schema-mismatch` — resolves to `{ ok: false, reason, residue }`; the
  caller does the work in-session, exactly as if the module didn't exist. Constrained
  decoding (Ollama `format`, OpenAI-compatible `response_format: json_schema`) passes the
  schema to the backend itself, not just the prompt, so the model is structurally
  prevented from returning prose.
- The seam has no consumers yet — this task ships the mechanism only.

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
