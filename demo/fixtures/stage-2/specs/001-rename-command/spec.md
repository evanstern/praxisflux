# 001-rename-command — let the keeper rename their pet

## The seam being closed

A pet's name is set once at `new` and can never change. Keepers who mistype a name (or
whose pet outgrows it) have to abandon the pet and start over — which kills it. The CLI
needs a `rename <name>` verb.

## Requirements

R1 — `praxis-pet rename <name>` sets the pet's name and prints the updated status line.
R2 — renaming is a pure state-machine operation (`rename(pet, name)` in `src/pet.mjs`),
so it is unit-testable and works on the stored pet like every other verb.
R3 — a missing name argument is a usage error (exit 2); renaming a dead pet is refused
(the no-op rule for dead pets holds).
R4 — the test suite covers R2 and R3's state-machine half.

## Non-goals

Name validation beyond non-emptiness; name history.
