# 002-mood-emoji — plan

1. Add `moodFace(pet)` to `src/pet.mjs`: a mood→emoji table over `mood(pet)` with 😐
   as the unknown-mood fallback.
2. `bin/pet.mjs` status line renders `mood: <face> <word>`.
3. Tests: one face per mood, fallback for an unknown mood.
4. Wiki: `pet-state-machine` + `pet-cli` notes re-verified and re-pinned after merge.
