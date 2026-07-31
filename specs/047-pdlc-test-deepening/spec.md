# 047-pdlc-test-deepening — spec

**Board task:** TASK-76 · **Finding source:** refactor-triage run praxis-2026-07-27-16-07-29
(group C; report §improved 5); triage record
docs/reviews/refactor-triage-praxis-2026-07-27-16-07-29.md. Depends on TASK-75
(merged, PR #110): the 0.2.0 prose — plus TASK-80's 0.3.0 additions (merged, PR #112)
— is what the deepened tests pin.

## Problem

The pdlc test coverage lags the new-plugin standard: `test/pdlc.test.mjs`'s
refactor-triage tests enforce four tokens and two headers, so phases 2–4 of the skill
(engine orchestration, triage record path, the Execute contract) could be gutted with
tests green. The sibling standard (`test/new-plugin.test.mjs`) asserts the full
four-section skeleton and parses frontmatter with the chassis `parseFrontmatter`; the
pdlc tests use a raw regex pinned to exact key order. The cross-skill path contract
(refactor-triage's `docs/reviews/team-review-<run-id>.md` must agree with
team-review's own spelling) is pinned by no test. The description assertion added for
refactor-triage was never backported to the bootstrap test.

## Requirements (map 1:1 to the card's ACs)

- **R1 (AC #1):** the refactor-triage SKILL tests assert the full four-section
  skeleton (per the new-plugin standard) and parse frontmatter via the chassis
  `parseFrontmatter`, not a key-order-pinned regex.
- **R2 (AC #2):** phase-content anchors pin what refactoring must not silently drop:
  the triage-record path string (`docs/reviews/…`), the backlog-CLI-only Execute
  contract, and the lens framing — anchored on the current 0.3.0 prose (which now
  also carries the tracked-copy fallback, `--policy` headless syntax, run-id rule,
  and last-run-at mark; anchor whichever of these the card's three named anchors
  cover — do not grow scope beyond the three).
- **R3 (AC #3):** a test pins refactor-triage's and team-review's `docs/reviews/`
  path spelling to agree (the cross-plugin contract both skills must keep).
- **R4 (AC #4):** the bootstrap frontmatter test gains the description assertion
  (backport of the pattern the refactor-triage test already has); `node --test`
  green.

## Non-goals

- Test-only → **no version bump** (test/ is not released surface).
- No SKILL.md prose changes — tests pin what 0.3.0 ships; if a test can't pass
  without a prose change, that's a finding to report, not an edit to make.
- No new test files unless the suite's conventions demand one — prefer deepening
  test/pdlc.test.mjs in place.

## Done means

All four ACs checked on TASK-76; gutting a refactor-triage phase or diverging the
docs/reviews spelling now fails `node --test`; the wiki's test-catalog note reflects
the deepened coverage; PR merged (no bump).
