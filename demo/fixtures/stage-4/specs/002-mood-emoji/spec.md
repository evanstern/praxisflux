# 002-mood-emoji — show the mood as an emoji in status

## The seam being closed

`status` prints the mood as a bare word (`happy`, `hungry`, …). The word is accurate
but flat — the pet's state should be readable at a glance. Each mood gets a face.

## Requirements

R1 — the status line shows an emoji next to the mood word: happy 😊, okay 😐,
hungry 😋, tired 😴, gone 🪦.
R2 — the mapping lives in the state machine (`moodFace(pet)` in `src/pet.mjs`) so the
CLI stays a thin renderer.
R3 — every mood has a face; an unknown mood falls back to 😐 rather than crashing.
R4 — tests cover the mapping (including the fallback).

## Non-goals

Configurable emoji sets; terminal-capability detection.
