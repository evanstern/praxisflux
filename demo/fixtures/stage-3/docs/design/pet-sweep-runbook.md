# praxis-pet mini sweep — runbook (2026-07-27)

**You (the session reading this) are the ORCHESTRATOR** for the tasks below: run each
through the full loop — spec → link → branch → implement → PR → merge → board sync →
re-ground — merging serially. Direction is decided; the specs are the source of truth.

**Status:** done · operator sign-off on lanes: 2026-07-27
<!-- Only the OPERATOR flips draft → signed-off (the author never pre-fills it). -->

## Queued (this runbook's scope)

- task-1 — Add a rename command (specs/001-rename-command)
- task-2 — Show mood as an emoji in status (specs/002-mood-emoji)
- task-3 — Add a --version flag (specs/003-version-flag) — **the live demo thread**:
  pre-specced here; swept live during the demo, its merged twin is the canned fallback.

## Execution lanes (dependency-ordered)

**Lane A — start immediately:** task-1 → task-2 → task-3. No file overlap worth
parallelizing at this size; merge serially in id order.

## Per-PR gates this project enforces

- `node --test` green on the branch.
- Wiki freshness: any merged change touching a note's sources re-verifies and re-pins
  that note before the sweep closes (docs/wiki, gate: wiki-freshness).
- Board honesty: statuses move only via spec-bridge sync — never hand-set above what
  the spec artifacts prove (gate: spec-bridge).
- One task, one PR; merge commits, never squash.

## Done means

All three tasks Done on the board via merged PRs and spec-bridge sync; docs/wiki
re-pinned; every gate green at the final tree.

## Execution log

| date | task | PR | merge | notes |
|------|------|----|-------|-------|
| 2026-07-27 | task-1 | #1 | 78a5bf4 | rename command; tests 9/9 |
| 2026-07-27 | task-2 | #2 | 0cd322e | mood emoji; tests 10/10 |
| 2026-07-27 | task-3 | #3 | 395b50a | --version (live thread's canned twin); board synced, wiki re-pinned |
