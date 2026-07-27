---
name: pet-cli
description: The praxis-pet command-line entry point (bin/pet.mjs) — verb dispatch for new/status/feed/play/rest/tick, the status line format, and exit codes. Load when changing commands, output, or CLI error behavior.
kind: component
sources:
  - bin/pet.mjs
verified_against: 0e26ad9546dfd8035b5a53c692d8e0afe24807c8
---

# Pet CLI

`bin/pet.mjs` is the only executable surface: it reads one verb (plus an optional name
argument), applies it, persists the result, and prints a one-line status.

## How it works

- Care verbs are a lookup table `VERBS = { feed, play, rest, tick }` straight from the
  state machine — adding a verb there is one table entry.
- `new [name]` creates and saves a fresh pet; `status` prints without mutating.
- `statusLine(pet)` renders `<name> — mood: <mood> · hunger N · happiness N · energy N
  · age N` — the single output format every command shares.
- `requirePet()` loads the stored pet and exits 1 with a hint (`run: praxis-pet new`)
  when none exists; an unknown verb prints usage and exits 2.
- After a care verb, a dead pet earns a farewell line pointing at `new`.

## Connections

Dispatches into [[pet-state-machine]]; persistence is [[pet-store]]'s job. See
[[overview]] for the layering rule: the CLI stays thin.

## Operational notes

Exit codes: 0 success, 1 no pet, 2 usage. All output is plain text on stdout;
errors go to stderr.
