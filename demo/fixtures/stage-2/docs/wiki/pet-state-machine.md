---
name: pet-state-machine
description: The pure pet state machine in src/pet.mjs — stats (hunger/happiness/energy, 0–100 clamped), care verbs (feed/play/rest), time (tick, with fatal neglect), and mood derivation. Load when reasoning about pet behavior, stat arithmetic, or death rules.
kind: component
sources:
  - src/pet.mjs
verified_against: 0e26ad9546dfd8035b5a53c692d8e0afe24807c8
---

# Pet state machine

`src/pet.mjs` holds every rule of the pet's life as pure functions: each verb takes a
pet object and returns a new one, so the module is trivially testable and does no I/O.

## How it works

- `newPet(name = "Mochi")` → `{ name, hunger: 30, happiness: 70, energy: 80, age: 0,
  alive: true }`.
- All stat writes pass through a private `clamp` to the integer range 0–100.
- `feed` lowers hunger (−25) and nudges happiness up (+5); `play` trades energy (−15)
  for happiness (+20) and raises hunger (+10); `rest` restores energy (+30) at a small
  hunger cost (+5).
- `tick(pet)` is one unit of time: `age` +1, hunger +10, energy −5, happiness −5. If
  hunger reaches 100 or energy reaches 0, `alive` flips false — neglect is fatal.
- Every verb (including `tick`) is a no-op on a dead pet: it returns the same object.
- `mood(pet)` derives a single word in priority order: `gone` (dead) → `hungry`
  (hunger ≥ 70) → `tired` (energy ≤ 30) → `happy` (happiness ≥ 60) → `okay`.

## Connections

Wrapped by [[pet-cli]]; persisted by [[pet-store]]; behavior proven by
[[pet-test-suite]].

## Operational notes

No configuration, no I/O, no dependencies — changes here change the game rules and
should show up in the test suite in the same change.
