---
name: gate-runner
description: The shared Stop-hook harness in lib/gate-runner.mjs — reads Claude Code hook input, runs a plugin's gates over their resolved roots, and blocks (exit 2) or allows (exit 0) the stop.
kind: component
sources:
  - lib/gate-runner.mjs
verified_against: ee95e70091ec1719a250fee57cf2925622c16ff1
---

# Gate Runner

`lib/gate-runner.mjs` is the shared harness behind every plugin's Stop hook. Each plugin ships
a one-line Node entry (its `scripts/stop.mjs`) that calls `runStopHook` with that plugin's
gates; when several plugins are installed each fires its own hook, so "run every applicable
gate" happens naturally across plugins without any plugin calling another. Within one plugin,
the runner runs that plugin's gates additively over every root they resolve.

## How it works

A gate is a plain object:
`{ name, resolveRoots(startDir) -> string[], check(root) -> string[] (problems), warn?(root) -> string[] (non-blocking notices) }`.

Three exports:

- `readStdin()` — promise-reads all of stdin as a string. On a TTY it resolves immediately to
  `""`, so the hook script is safe to run by hand.

- `evaluate(input, gates, { cwd })` — the pure, unit-testable core. Given parsed hook input it
  returns `{ block, message, warnings }`:
  - If `input.stop_hook_active === true` it short-circuits to `{ block: false }` — the hook is
    already re-firing after a block, and honoring this flag prevents infinite stop loops.
  - The start directory is resolved in priority order: `CLAUDE_PROJECT_DIR` env var, then
    `input.cwd` from the hook payload, then `process.cwd()`.
  - For each gate it calls `resolveRoots(start)`; a throw or falsy result is coerced to `[]`,
    and **a gate that resolves no roots is a no-op** ("this isn't its kind of project") — with
    no roots anywhere, nothing blocks.
  - For each resolved root it collects `check(root)` problems; a crashing `check` becomes the
    problem string `[<gate name>] crashed on <root>: <message>` rather than a silent pass.
  - If the gate defines `warn`, its notices are collected too; a crashing `warn` is ignored
    (warnings are best-effort).
  - `block` is true iff any problems were collected; problems and warnings are each joined
    with newlines into `message` and `warnings`.

- `runStopHook({ gates, exit = process.exit })` — the full harness: read stdin, `JSON.parse`
  it (malformed or empty input degrades to `{}`), call `evaluate`, then exit.

The exit/output contract Claude Code Stop hooks expect: **exit 0** allows the model to stop;
**exit 2** blocks, and whatever was written to stderr becomes the message the model sees. On
block, the runner writes problems plus any warnings to stderr and exits 2. On allow, warnings
(if any) are still written to stderr — freshness reminders and the like — but the exit code
stays 0, so they never refuse to let the model finish. Stdout is never used.

## Connections

Invoked from each plugin's `scripts/stop.mjs` per [[gates-convention]]. Root resolution inside
each gate's `resolveRoots` is built on [[project-root]]. Gate `check` bodies in
[[research-plugin]], [[grounding-wiki-plugin]], and [[educate-plugin]] lean on
[[markdown-module]] for note parsing, and status gates lean on [[lifecycle-engine]]. Ships in
every plugin as part of the [[chassis]]; covered by the [[test-suite]].

## Operational notes

- Environment: `CLAUDE_PROJECT_DIR` overrides the hook payload's `cwd` as the search start.
- Failure posture is asymmetric by design: a crashing `check` **blocks** (surfaced as a
  problem), a crashing `warn` or `resolveRoots` does not.
- `exit` is injectable for tests; default is `process.exit`.
- Because a no-root gate no-ops, installing a plugin in an unrelated repo costs nothing at
  stop time beyond the root walk.
