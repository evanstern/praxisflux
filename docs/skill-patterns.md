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

## 6. Two placement models

- **Favored home** (educate): a fixed project marked by a child dir (`topics/`). Find it with
  `findRootUpwards(dir, hasChild("topics"))`.
- **Drop-anywhere** (research): a project can live in any folder, marked by an unambiguous
  **sentinel** (`.research-vault`). Find all of them with `findRootsDownwards(dir, hasChild(sentinel))`.

## 7. Shared chassis vs. per-plugin

**Shared** (`lib/`): project-root, gate-runner, markdown, selfcontained, lifecycle, installer,
dates, template, handoff; plus the HTML base (`lib/html/base.html`). **Per-plugin**: the domain
vocabulary (lifecycle state names), the knowledge model, and handoff **payload** schemas. Shared
plumbing, domain-specific content.

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
