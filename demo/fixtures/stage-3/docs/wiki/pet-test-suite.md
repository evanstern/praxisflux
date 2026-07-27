---
name: pet-test-suite
description: The node:test suite (test/pet.test.mjs) — what each test proves about the state machine: starting stats, clamping, stat trades, fatal neglect, dead-pet no-ops, mood priorities, rename rules, and the moodFace emoji mapping with its fallback. Load before changing game rules to see which behaviors are pinned.
kind: pattern
sources:
  - test/pet.test.mjs
verified_against: 395b50af9518c1f7bc0ba9871da74c9c7d5a5da6
---

# Pet test suite

`test/pet.test.mjs` pins the state machine's behavior with plain `node:test` +
`node:assert/strict` — no runner dependencies, `node --test` runs everything.

## How it works

The suite covers, in order: sane starting stats; `feed` clamping hunger at 0;
`play`'s happiness-for-energy trade; `rest` capping energy at 100; starvation death
under repeated `tick` (and `mood === "gone"`); every verb being a no-op on a dead
pet; and `mood`'s priority order (happy / hungry / tired). Sweep additions: `rename`
(trimmed set, empty-keep, dead-pet refusal) and `moodFace` (one face per mood plus
the 😐 unknown-mood fallback).

Tests exercise only the pure layer — no store, no CLI — so they run with zero setup.

## Connections

Proves [[pet-state-machine]]. The CLI and store ([[pet-cli]], [[pet-store]]) are
currently exercised only manually.

## Operational notes

`npm test` / `node --test` from the repo root. The suite is the stage-0 gate the
praxisflux demo rig asserts on this project.
