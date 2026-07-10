---
name: chassis-utilities
description: The two smallest chassis modules — lib/dates.mjs (ISO date helpers today/bumpUpdated) and lib/template.mjs ({{PLACEHOLDER}} render for planted boilerplate)
kind: component
sources:
  - lib/dates.mjs
  - lib/template.mjs
verified_against: 5934860e2021d1d3b096d3c6d7a30bf5d434c003
---

# Chassis utilities

`lib/dates.mjs` and `lib/template.mjs` are the two smallest modules on the shared praxis
chassis: pure, dependency-free string helpers that keep date stamping and boilerplate
substitution consistent across every plugin instead of being re-implemented per skill.

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

Neither module touches the filesystem or process state.

## Connections

- Both are part of the shared [[chassis]] and are vendored into plugin `dist/` trees by
  [[build-and-release]].
- `today` feeds date stamps in [[educate-plugin]] tooling: the progress tracker CLI and
  the wiki renderers default their `date` to `today()`.
- `render` backs the template-planting step of plugin start skills described in
  [[skill-patterns]], filling `{{VARS}}` in planted `CLAUDE.md` and scaffolding files
  installed via [[installer]].
- `bumpUpdated` keeps `updated:` frontmatter honest in note-shaped Markdown, the same
  frontmatter convention parsed by [[markdown-module]].
- Both are exercised by the [[test-suite]].

## Operational notes

- No environment variables, no configuration, no I/O — pure functions.
- `today` uses `toISOString`, so the date is UTC; near local midnight it can differ from
  the caller's wall-clock date.
- `render` coerces values with `String(...)`, so `0` and `false` substitute as `"0"` and
  `"false"` rather than being skipped.
- Failure behavior: both `bumpUpdated` and `render` return the input (or `""` for nullish
  input) unchanged when nothing matches; neither throws on missing patterns or variables.
