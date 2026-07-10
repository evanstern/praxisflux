---
name: chassis-utilities
description: The smallest chassis modules — lib/dates.mjs (ISO date helpers today/bumpUpdated), lib/template.mjs ({{PLACEHOLDER}} render for planted boilerplate), and lib/cli.mjs (symlink-safe run-as-CLI guard)
kind: component
sources:
  - lib/dates.mjs
  - lib/template.mjs
  - lib/cli.mjs
verified_against: ab6e3fd6377e2472c7e8db3af1abfe66ed7300d7
---

# Chassis utilities

`lib/dates.mjs`, `lib/template.mjs`, and `lib/cli.mjs` are the smallest modules on the shared
praxis chassis: dependency-free helpers that keep date stamping, boilerplate substitution,
and the run-as-CLI entry check consistent across every plugin instead of being re-implemented
per skill.

## How it works

**`lib/dates.mjs`** — ISO date helpers shared across the suite:

- `today(date = new Date())` — returns the date as an ISO `YYYY-MM-DD` string via
  `date.toISOString().slice(0, 10)`. The optional argument makes it injectable for tests
  and for rendering with a fixed date.
- `bumpUpdated(text, date = new Date())` — rewrites an `updated:` frontmatter line in
  `text` to today's date using the multiline regex `/^(updated:\s*).*$/m`. It is a no-op
  when no such line is present, and tolerates `null`/`undefined` input (treated as `""`).

**`lib/template.mjs`** — the tiny `{{PLACEHOLDER}}` substitution used when planting
boilerplate:

- `render(text, vars = {})` — replaces `{{NAME}}` tokens with `String(vars[NAME])`.
  Token names are restricted to `[A-Z0-9_]+` and may have interior whitespace inside the
  braces. Lookup uses `Object.prototype.hasOwnProperty`, so prototype properties never
  leak in, and **unknown tokens are left verbatim** — a deliberate choice so a template
  can be rendered in multiple passes, each pass filling in the variables it knows.

**`lib/cli.mjs`** — the symlink-safe run-as-CLI guard for dual-use modules (importable
library + executable script):

- `runAsCli(moduleUrl)` — pass `import.meta.url`; returns true only when that module is the
  script Node was asked to run. It realpaths **both** sides of the comparison
  (`fileURLToPath(moduleUrl)` and `process.argv[1]`) because Node resolves `import.meta.url`
  through symlinks while `argv[1]` stays as typed — the naive
  `import.meta.url === `file://${argv[1]}`` idiom it replaces compared unequal through any
  symlinked invocation path, so a gate CLI would exit 0 having run nothing (the silent skip
  the [[gates-convention]] forbids). Returns false when there is no entry script
  (`node -e`, REPL) or `argv[1]` doesn't resolve to a real path.

`dates` and `template` touch no filesystem or process state; `cli` reads `process.argv` and
resolves paths but never writes.

## Connections

- All three are part of the shared [[chassis]] and are vendored into plugin `dist/` trees by
  [[build-and-release]].
- `runAsCli` guards every repo script's CLI entry (see [[build-and-release]]) and the
  CLI entries of the [[educate-plugin]] scripts; the planted codebase-to-course
  `validate.mjs` inlines the same realpath comparison because a planted copy can't import
  the chassis ([[codebase-to-course-plugin]]).
- `today` feeds date stamps in [[educate-plugin]] tooling: the progress tracker CLI and
  the wiki renderers default their `date` to `today()`.
- `render` backs the template-planting step of plugin start skills described in
  [[skill-patterns]], filling `{{VARS}}` in planted `CLAUDE.md` and scaffolding files
  installed via [[installer]].
- `bumpUpdated` keeps `updated:` frontmatter honest in note-shaped Markdown, the same
  frontmatter convention parsed by [[markdown-module]].
- Both are exercised by the [[test-suite]].

## Operational notes

- No environment variables, no configuration; `dates` and `template` are pure functions,
  and `cli` only reads `process.argv[1]` plus the filesystem metadata realpath needs.
- `today` uses `toISOString`, so the date is UTC; near local midnight it can differ from
  the caller's wall-clock date.
- `render` coerces values with `String(...)`, so `0` and `false` substitute as `"0"` and
  `"false"` rather than being skipped.
- Failure behavior: both `bumpUpdated` and `render` return the input (or `""` for nullish
  input) unchanged when nothing matches; neither throws on missing patterns or variables.
