# 003-version-flag — praxis-pet --version

## The seam being closed

The CLI has no way to say which praxis-pet it is. Bug reports and demos need
`praxis-pet --version` to print the version and exit cleanly.

## Requirements

R1 — `praxis-pet --version` (and `version`) prints `praxis-pet <version>` from
`package.json` and exits 0.
R2 — the change is confined to `bin/pet.mjs` (one file): the CLI reads its own
package.json; no state-machine or store change.
R3 — the flag works without a stored pet (it must not call `requirePet`).

## Non-goals

`--help` output beyond the existing usage line; semver policy.
