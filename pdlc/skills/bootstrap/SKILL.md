---
name: bootstrap
version: 0.1.0
description: Bootstrap a NEW or EXISTING project folder for the praxis development lifecycle (PDLC), OR update an already-bootstrapped one after a plugin upgrade. Use when the user wants to set up praxisflux in a project, says "bootstrap this project for praxis/PDLC", "init the praxis lifecycle here", "wire this repo for grounding-wiki/spec-bridge/codebase-to-course", or asks how to get a folder ready for the plugin suite. Plants the always-on PDLC grounding (CLAUDE.md block), gitignores the .handoff/ transport, and handles the officially supported peer utilities — Backlog.md and GitHub Spec Kit — recommending installation when absent and offering opt-in (running their inits) when present.
---

# pdlc:bootstrap — stamp a project for the praxis development lifecycle

This skill turns any folder — brand-new and empty, or an existing codebase with history and
its own `CLAUDE.md` — into a **PDLC project**: one whose always-on context knows the
praxisflux loop, each plugin's role, the gates principle, and the `.handoff/` transport. It
is the suite-level answer to "a plugin has no always-on slot": instead of bundling always-on
context, plant it.

Everything it plants rides inside `<!-- pdlc:grounding BEGIN/END -->` markers, so it composes
with an existing `CLAUDE.md` (appended, never clobbered) and can be refreshed wholesale on
update. The heavy lifting is deterministic — `scripts/plant.mjs` on the chassis
(`lib/installer.mjs` + `lib/template.mjs`) — this skill's job is the judgment around it.

## What it does NOT do

- It does **not** run sibling skills or create their outputs. No `docs/wiki/` (that's
  `/grounding-wiki:wiki-build`), no `docs/course/` (codebase-to-course), no lessons
  (educate has its own `educate:start`). Bootstrap sets the table and **hands off**.
- It does **not** copy `plant.mjs` or any gate into the project — scripts live in the plugin
  and are run as `${CLAUDE_PLUGIN_ROOT}/scripts/plant.mjs`.

## Precondition gate

1. **Pick the project root.** Ask the user where (default: the current working directory).
   Call it `<root>`. It may be empty or an existing project — both are supported.
2. **Detect the mode.** `<root>/.pdlc` exists → **update** (re-bootstrap after a plugin
   upgrade, or changing peer opt-ins; read the file — it records the previous choices).
   Absent → **fresh** (even if the folder already has code and a `CLAUDE.md`).
3. If `<root>` is not a git repository, say so and continue — planting still works; the
   `.gitignore` entry becomes meaningful once they `git init`.

## Peer utilities — Backlog.md and Spec Kit

Backlog.md (task board) and GitHub Spec Kit (spec-driven development) are **officially
supported peer utilities** of the PDLC — spec-bridge exists to join them. Handle each:

1. **Detect:** `command -v backlog` and `command -v specify`.
2. **Absent →** tell the user it is an officially supported peer and recommend installing:
   - Backlog.md: `npm i -g backlog.md`
   - Spec Kit: `uv tool install specify-cli --from git+https://github.com/github/spec-kit.git`
   Offer to wait while they install (re-run detection afterwards); declining is fine — the
   grounding is planted without that peer's block and opting in later is one re-run away.
3. **Present →** ask whether to opt this project in (one question per peer; in update mode,
   present the previous choice from `.pdlc` as the default). Opting in means bootstrap does
   the setup:
   - **Backlog.md:** if `<root>/backlog/` already exists, skip (already initialized).
     Otherwise run `backlog init "<project name>"` from `<root>`; it may prompt — accept
     defaults unless the user directs otherwise.
   - **Spec Kit:** if `<root>/.specify/` already exists, skip. Otherwise check
     `specify init --help` and run its init for **the current directory** with the
     **claude** assistant option (e.g. `specify init --here --ai claude`).
4. Peer opt-ins decide which convention blocks the planted grounding carries — that wiring
   happens in the plant step via `--peer` flags.

## Plant

1. Preview first: run
   `node ${CLAUDE_PLUGIN_ROOT}/scripts/plant.mjs --root <root> [--peer backlog] [--peer spec-kit] --check`
   (one `--peer` per opt-in). The JSON report says what would happen: `created`, `appended`
   (existing `CLAUDE.md` gains the marked block at the end), `replaced`, `unchanged`, or
   `drifted`.
2. **`drifted`** means the on-disk block differs from what this plugin version plants —
   either a plugin upgrade or user edits inside the markers. Diff the block against the
   rendered template, show the user what would change, and get explicit consent. Carry any
   project-specific edits **outside** the markers (that's their supported home), then re-run
   with `--force`. Never silently discard user text.
3. Run the plant for real (same command without `--check`, plus `--force` only after the
   consent above). This writes the `CLAUDE.md` block, the `.pdlc` sentinel (version + peer
   choices), and gitignores `.handoff/` — all idempotent.

## Output gate

1. Re-run with `--check`: it must exit 0 (nothing left to change) and report
   `claudeMd: unchanged`.
2. Verify on disk — never claim success without looking: `<root>/CLAUDE.md` contains the
   `pdlc:grounding` markers (and each opted peer's `pdlc:peer:` block), `<root>/.pdlc` records
   the right peers, `.gitignore` contains `.handoff/`.
3. Report exactly what was **created**, **refreshed**, **skipped** (e.g. `backlog init`
   skipped because `backlog/` existed), and **left untouched** (everything outside the
   markers; all user content).

## Handing off

The project is now grounded; its `CLAUDE.md` governs from the next session. Tell the user
what the loop makes possible next — without doing any of it here:

- **Ground the codebase:** `/grounding-wiki:wiki-build` → `docs/wiki/` (do this first on an
  existing codebase; everything downstream reads it).
- **Spec-driven work** (if Spec Kit opted in): author a spec with `specify`, then put it on
  the board with `spec-bridge:link` (if Backlog.md opted in) and `spec-bridge:sync` as you work.
- **Teach it:** `/codebase-to-course:codebase-to-course` once a wiki exists.
- Re-run `pdlc:bootstrap` any time — after plugin upgrades, or to change peer opt-ins.
