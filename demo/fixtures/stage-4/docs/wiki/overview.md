---
name: overview
description: The shape of praxis-pet — a tiny tamagotchi-style virtual pet CLI. Three layers: a pure state machine (src/pet.mjs), a JSON store (src/store.mjs), and a thin CLI (bin/pet.mjs), tested with node:test. Load first for orientation; route to component notes for specifics.
kind: concept
sources:
  - README.md
  - package.json
verified_against: 0e26ad9546dfd8035b5a53c692d8e0afe24807c8
---

# Overview

praxis-pet is a deliberately small Node CLI: a virtual pet whose stats drift over time
and respond to care verbs. It exists as a real, testable project — small enough to read
in minutes, real enough to have state, I/O, and a test suite.

## How it works

Three layers, strictly ordered:

- **State machine** (`src/pet.mjs`) — pure functions over a plain pet object; no I/O.
- **Store** (`src/store.mjs`) — loads/saves the pet as JSON (`.pet.json`, `PET_STORE`
  overrides).
- **CLI** (`bin/pet.mjs`) — parses one verb, applies it via the state machine, persists
  via the store, prints a status line.

`package.json` declares ESM (`"type": "module"`), the `praxis-pet` bin, and
`node --test` as the test script. No dependencies anywhere.

## Connections

[[pet-state-machine]] is the core; [[pet-cli]] and [[pet-store]] wrap it;
[[pet-test-suite]] proves the core's behavior.

## Operational notes

Run `node bin/pet.mjs new [name]` to adopt a pet; state persists per working directory
unless `PET_STORE` points elsewhere.
