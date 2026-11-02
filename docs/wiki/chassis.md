---
name: chassis
description: The shared zero-dependency Node module layer in lib/, vendored into each plugin as a real, committed copy (scripts/sync-lib.mjs) rather than a symlink.
kind: component
sources:
  - lib/README.md
  - scripts/build.mjs
  - scripts/sync-lib.mjs
  - lib/toolkit/README.md
  - lib/structured-offload.mjs
verified_against: 7a3051e7624d902028f0e39152e1e5373267d3c7
---

# Chassis

The chassis is the repo-root `lib/` directory: zero-dependency Node (`.mjs`) modules shared by
every praxisflux plugin. It exists so common plumbing — root discovery, the Stop-hook gate harness,
markdown parsing, lifecycle rules — is written once instead of per plugin, while each shipped
plugin still installs as a self-contained unit with no runtime dependency on the repo or on
sibling plugins.

## How it works

Every plugin directory carries a real, committed copy of repo-root `lib/` at `<plugin>/lib/`,
so plugin code imports the chassis as `../lib/…` (every importer sits in a depth-1
subdirectory of its plugin, `scripts/` or `gates/`) and skills reference
`${CLAUDE_PLUGIN_ROOT}/lib/…`. `scripts/sync-lib.mjs` keeps every plugin's copy byte-identical
to repo-root `lib/`: default mode overwrites each copy, `--check` (`driftReport`) exits 1
listing drift, and `test/sync-lib.test.mjs` fails the suite on divergence — edit `lib/`, then
run the script, never hand-edit a plugin's copy.

This replaced a committed `lib -> ../lib` symlink (pre-TASK-0147): it resolved fine in the
repo and Claude Code's cache install (which dereferences any symlink into a real directory),
but the Claude desktop app's marketplace sync extracts the repo without symlink support,
writing the symlink as a 6-byte text file holding its target — every `../lib/…` import then
failed with `ERR_MODULE_NOT_FOUND`.

**When packaged**, `node scripts/build.mjs [--plugin <name>|all]` (plugin list derived from
`.claude-plugin/marketplace.json`) plainly copies each target to `dist/<plugin>/` — no
symlink to dereference, since `lib/` is already real. A full build wipes `dist/` first;
`--plugin` cleans only its own target dir. Scoped-clean and argv details: [[dist-packaging]].

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
- `port-registry.mjs`, `pdlc-config.mjs`, `receipts.mjs`, `contract-harness.mjs`,
  `credentials.mjs` — decision-0002's **ports chassis**: port/adapter declaration and
  `resolve`, `.pdlc.json` adapter selection, byte-deterministic `.<port-dir>/<noun>.json`
  receipts, one contract suite run against every adapter, and a `git credential fill` →
  env-var token resolver. Driven by `pdlc/scripts/pdlc.mjs` (`doctor`). See [[ports-chassis]].
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
copies as a real, vendored `lib/` in each plugin, stamped by [[build-and-release]]'s
`scripts/sync-lib.mjs`. Its modules are individually documented in [[project-root]],
[[gate-runner]], [[markdown-module]], [[selfcontained-verifier]], [[lifecycle-engine]],
[[installer]], [[chassis-utilities]], and [[toolkit]]. The ports-chassis modules are covered
in full by [[ports-chassis]]. Behavior is covered by [[test-suite]].

## Operational notes

- Zero external dependencies by design; only `node:` built-ins.
- `dist/` holds packaged copies only — never edit there; the canonical copy is repo-root `lib/`.
- Building an unknown plugin name exits with status 1 (`no such plugin`).
- Never hand-edit a plugin's `lib/` copy — edit repo-root `lib/`, then run
  `node scripts/sync-lib.mjs` to re-stamp every plugin; `--check` catches drift in CI/hooks.
