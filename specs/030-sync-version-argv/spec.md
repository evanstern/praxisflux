# 030-sync-version-argv — sync-version must refuse what it cannot stamp

Board: TASK-69 · Direction: incident reported by TASK-63's implementer during the
downstream-bugfix sweep (`docs/design/downstream-bugfix-runbook.md`); carding approved
by the operator 2026-07-27; dispatched by `docs/design/sweep-followups-runbook.md`.

## The incident

`scripts/sync-version.mjs` stamps its first argv verbatim into all 11 version files
(marketplace.json, 9 plugin.json, action.yml npx pin) with no validation — during
TASK-63, `sync-version.mjs --help` happily wrote the literal string `--help` as the
version everywhere (reverted before commit; nothing landed). The lockstep stamper is
release surface; it must refuse input it cannot honestly stamp.

## Requirements (map 1:1 to board ACs)

R1 (AC #1) — argv is validated before any file is touched: the CLI accepts exactly
`--check` or one strict `x.y.z` semver (`/^\d+\.\d+\.\d+$/`). Anything else — a missing
value, `--help`-style flags, non-semver strings — prints usage to stderr and exits
nonzero (exit 2, the TASK-66 `build.mjs` usage-error pattern) with ZERO files written.
This deliberately removes the current undocumented bare-invocation mode (no arg = sync
to the marketplace's version); the header comment is updated to match, and an audit of
call sites (hooks, CI, docs) confirms nothing consumes the removed mode.

R2 (AC #2) — valid behavior unchanged: a strict `x.y.z` stamps all 11 files exactly as
today; `--check` still exits 1 on drift and 0 with `all versions = <v>` when clean.

R3 (AC #3) — regression test covers the refusal (usage + exit 2) AND the
no-files-touched guarantee (version-file contents byte-identical after a refused run);
valid-stamp and `--check` behavior covered. If the test lands in a NEW test file, its
`docs/wiki/test-suite-catalog.md` bullet + source entry land in the same PR.

## Decision recorded (per the card's "decide and record")

A target at or below the current lockstep value is ALLOWED: the CLI stays a dumb,
minimal stamper so repair/rollback stays possible; `check-version-bump.mjs` already
gates increases at PR time. No override flag is added.

## Non-goals

- No semver-range or prerelease support; strict `x.y.z` only, as today.
- No change to `stampNpxPin`'s exported contract or to which files ride the lockstep.
