# 029-repin-commit-existence — repin must refuse a commit that does not exist

Board: TASK-68 · Direction: incident reported by TASK-59's implementer during the
downstream-bugfix sweep (`docs/design/downstream-bugfix-runbook.md`); carding approved
by the operator 2026-07-27; dispatched by `docs/design/sweep-followups-runbook.md`.

## The incident

During the TASK-59 reconcile, a wrongly-typed but format-valid 40-char hash was passed
to `grounding-wiki/scripts/repin.mjs` and written verbatim into a note's
`verified_against`. The freshness gate caught it downstream, but the repin tool itself
accepted a commit that does not exist. A pin is a verification claim
(`repin.mjs` header, line 8): the ONE writer in the wiki-plan loop must not be able to
write a claim that names no commit.

## Requirements (map 1:1 to board ACs)

R1 (AC #1) — `repin()` refuses a well-formed 40-char hash that names no commit in the
corpus repo, with a named error carrying the hash. Mechanics: probe existence with
`git cat-file -e <hash>^{commit}` run against the repo containing the note (resolve
from the note's directory, e.g. `git -C <dirname(notePath)>`). A note that does not sit
inside a git repo also refuses with its own named error — a commit claim that cannot be
verified must not be written. The probe runs before any write; on refusal the note is
untouched.

R2 (AC #2) — existing refusals unchanged: short/non-hex hash (format error), missing
note, file without a `verified_against` line, and the CLI usage error (exit 2) keep
their current messages and exit behavior. Valid repins still print `old → new` and
return the old pin.

R3 (AC #3) — regression test in `test/grounding-wiki.freshness.test.mjs` (repin's
existing home): a well-formed hash naming no commit is refused with the hash in the
error and the note left byte-identical; the existing-refusals test stays green.

## Non-goals

- No change to the plan/classify loop (`gates/cli.mjs plan` emits repin commands as
  before), no CLI signature change, no short-hash resolution.
- No validation that the commit is the *right* one — existence only; rightness stays
  the freshness gate's job.
