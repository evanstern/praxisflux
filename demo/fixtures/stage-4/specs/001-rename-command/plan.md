# 001-rename-command — plan

1. Add `rename(pet, name)` to `src/pet.mjs`: trims the name, keeps the old name when
   the trimmed name is empty, no-ops on a dead pet (returns the same object).
2. Wire `rename` into `bin/pet.mjs`: it takes the argument slot `new` already uses;
   missing/empty argument → usage error, exit 2.
3. Tests in `test/pet.test.mjs`: happy rename, empty-name keep, dead-pet no-op.
4. Wiki: `docs/wiki/pet-state-machine.md` and `docs/wiki/pet-cli.md` list the touched
   files as sources — re-verify and re-pin after merge.
