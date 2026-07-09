# Authoring praxis plugins — the shared patterns

praxis plugins look alike on purpose. A new plugin (or skill) that follows these patterns inherits
the chassis and composes with the others for free. This is the leverage doc; pair it with
[`handoff-protocol.md`](./handoff-protocol.md).

## 1. Phase-separated skills that compose through files, not calls

Each skill does **one phase** and knows nothing about the others. They compose only through the
files in the project and the **gates** between phases — never by one skill invoking another. This
keeps the boundary between *gathering*, *judging*, *implementing*, and *rendering* honest, and lets
any phase be run, skipped, or replaced on its own.

- research: EMBED (`research-vault`) → QUERY (`analyze-vault`) → RENDER (`vault-artifact`).
- educate: teach → author SPEC → (hand to build) → fold findings → deck.

## 2. The skill shape: precondition gate → work → output gate

Every phase skill has the same skeleton:

1. **Precondition gate** — verify the input state exists (e.g. analyze requires a valid branch).
   If it fails, stop and name the phase that must run first; don't do that phase's job here.
2. **Do the one phase.**
3. **Output gate** — verify what you produced before handing off (e.g. an artifact is
   self-contained). Fix failures before declaring done.
4. **Handing off** — tell the user what's now possible next (the next phase), without doing it.

## 3. Plant a project `CLAUDE.md` (a plugin has no always-on slot)

A plugin's skills are lazy-loaded; nothing of it is always in context. So the installer **plants a
project `CLAUDE.md`** that carries the always-on rules (lifecycle, placement, DoD). Use
`lib/installer.mjs` (`copyDir` is dotfile-safe; `installMode` picks fresh vs. idempotent update;
`ensureGitignore` adds `.handoff/`). Never claim success without verifying the files on disk
(`verifyPresent`).

## 4. Gates enforce "a status can't exceed the artifacts that prove it"

Model the plugin's lifecycle with `lib/lifecycle.mjs`: declare ordered states, an artifact→filename
map, and which artifacts each state requires. The engine derives the map from disk and flags any
item whose declared status outruns its evidence. A **Stop hook** (`lib/gate-runner.mjs`) makes it
binding; it honors `stop_hook_active` and is a **no-op when the gate resolves no roots**, so it
never fires outside its own project type. Each plugin ships its own hook → gates compose additively
across installed plugins.

Enforce judgment steps with **evidence + durable residue**, never a bare flag: educate's return leg
needs both `handoff.foldedIn` in `progress.json` *and* a `## Post-build` section on disk.

## 5. Gates and the chassis are plugin-hosted, never copied per-project

Scripts live once in the plugin and are referenced as `${CLAUDE_PLUGIN_ROOT}/…`; `lib/` is vendored
into each plugin at build time (`scripts/build.mjs`). Don't copy gates into the user's project — one
canonical, updatable copy per plugin.

**Directory convention (uniform across plugins):**
- **`<plugin>/gates/`** — the read-only verification logic (the "is this valid?" checkers) and any
  skill-invoked gate CLI. **gates/ never writes to disk.** (research: `branch/analysis/artifact.mjs`
  + `cli.mjs`; educate: `dod.mjs`.)
- **`<plugin>/scripts/`** — operational entrypoints only: the Stop-hook shim (`gate.sh`) + entry
  (`stop.mjs`), and any *state-mutating* tracker CLI (educate's `progress.mjs`, which writes the
  derived artifacts map on `--sync`).
- Build/release/version tooling is **repo-level** (`scripts/build.mjs`, `sync-version.mjs`,
  `gen-marketplace.mjs`) — a plugin does not carry its own `package.json` or self-build.

## 6. Two placement models

- **Favored home** (educate): a fixed project marked by a child dir (`topics/`). Find it with
  `findRootUpwards(dir, hasChild("topics"))`.
- **Drop-anywhere** (research): a project can live in any folder, marked by an unambiguous
  **sentinel** (`.research-vault`). Find all of them with `findRootsDownwards(dir, hasChild(sentinel))`.

## 7. Shared chassis vs. per-plugin

**Shared** (`lib/`): project-root, gate-runner, markdown, selfcontained, lifecycle, installer,
dates, template, handoff; plus the HTML base (`lib/html/base.html`) and the content toolkit
(`lib/toolkit/`, §8). **Per-plugin**: the domain vocabulary (lifecycle state names), the knowledge
model, and handoff **payload** schemas. Shared plumbing, domain-specific content — with the
toolkit as the one deliberate exception: content shared because the plugins teach with the same
tools.

## 8. Shared content modules — the toolkit (`lib/toolkit/`)

Where the rest of `lib/` is shared *plumbing* (code that gates and scripts import), `lib/toolkit/`
is shared *content*: educational methods and visual tools a skill reads while authoring a deck,
course, or briefing — tooltip snippets, pedagogy principles, diagram idioms. One canonical copy
serves every plugin, and single-owner tools become borrowable by siblings.

**Distribution.** Toolkit modules ship exactly like the chassis: `scripts/build.mjs` vendors
`lib/` wholesale into each packaged plugin, so every installed plugin carries its own copy and
stays independently installable. There is no runtime cross-plugin lookup.

**Referencing.** Skill prose and templates point at modules as
`${CLAUDE_PLUGIN_ROOT}/lib/toolkit/<module>.md`. Gate code never imports from `toolkit/` —
if something needs to be *executed or verified*, it belongs in `lib/` proper (like
`selfcontained.mjs`), not the toolkit.

**Graceful degradation (hard rule).** A toolkit module is an optional enhancer. Every skill that
references one must state a one-line inline fallback and still function when the module is absent
(e.g. a hand-copied skill without `lib/`): *"Gloss jargon with the toolkit tooltip module; if it's
missing, define terms in parentheses on first use."* A skill that breaks without the toolkit has
made it plumbing — move that part into `lib/` proper or inline it.

**Design policy: shared token schema, per-plugin palettes.** All visual output uses the same CSS
custom-property *names* and the same dark-mode contract (light default; dark via both
`@media (prefers-color-scheme: dark)` and `:root[data-theme=…]`; an auto→light→dark toggle) —
`lib/html/base.html` is the canonical spelling. Palette *values* stay per-plugin: educate and
research share the praxis palette; codebase-to-course keeps its warm palette and its documented
Google Fonts exception. Toolkit snippets are written against the token names only, so they inherit
whichever palette the consuming page defines. HTML page *shells* remain per-plugin — the earlier
decision (docs/handoffs/codebase-to-course-plugin.md) not to fold the course's `_base.html` into
`lib/html/base.html` stands; what's shared is the token schema and the content modules, not the
page skeleton.

Module index: [`lib/toolkit/README.md`](../lib/toolkit/README.md).

## New-plugin checklist

1. `<plugin>/.claude-plugin/plugin.json`; add it to `.claude-plugin/marketplace.json` (or run
   `scripts/gen-marketplace.mjs`).
2. Skills under `<plugin>/skills/<name>/SKILL.md`, each in the gate→work→gate shape.
3. If it stamps a project: a planted `CLAUDE.md` + templates, installed via `lib/installer.mjs`.
4. If it has a lifecycle to enforce: define it with `lib/lifecycle.mjs`; ship a Stop hook
   (`<plugin>/scripts/stop.mjs` → `lib/gate-runner.mjs`) + a `gate.sh` shim + `hooks/hooks.json`.
5. If it hands off to another plugin: use `lib/handoff.mjs`; define your payload; record evidence in
   tracked state (see [`handoff-protocol.md`](./handoff-protocol.md)).
6. Tests under `test/`; keep `node --test` green (the pre-commit hook enforces it).
