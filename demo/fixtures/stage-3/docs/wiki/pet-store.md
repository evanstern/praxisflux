---
name: pet-store
description: JSON persistence for the pet (src/store.mjs) — storePath resolution (.pet.json, PET_STORE override), loadPet's null-on-anything contract, savePet's pretty-printed write. Load when changing where or how pet state is stored.
kind: component
sources:
  - src/store.mjs
verified_against: 0e26ad9546dfd8035b5a53c692d8e0afe24807c8
---

# Pet store

`src/store.mjs` is the entire persistence layer: one JSON file holding the current pet.

## How it works

- `storePath()` returns `process.env.PET_STORE` when set, else `.pet.json` in the
  working directory — tests point `PET_STORE` at a temp file to stay isolated.
- `loadPet()` reads and parses the store, returning `null` on ANY failure (missing
  file, bad JSON) — "no pet yet" and "corrupt store" are deliberately the same case.
- `savePet(pet)` writes pretty-printed JSON (2-space indent, trailing newline) and
  returns the pet for chaining.

## Connections

Used only by [[pet-cli]]; the [[pet-state-machine]] never touches it (purity rule in
[[overview]]).

## Operational notes

The store file is gitignored (`.pet.json`). There is no locking — last write wins.
