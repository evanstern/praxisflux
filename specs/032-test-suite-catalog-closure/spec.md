# 032-test-suite-catalog-closure — every test file cataloged, every source pinned

Board: TASK-71 · Direction: gaps flagged by TASK-64's and TASK-66's implementers during
the downstream-bugfix sweep (`docs/design/downstream-bugfix-runbook.md`); carding
approved by the operator 2026-07-27; dispatched (tail lane, after all Lane A merges) by
`docs/design/sweep-followups-runbook.md`.

## The gap

`docs/wiki/test-suite-catalog.md` inherited the old pre-split `test-suite.md` source
list: files with no bullet AND no `sources:` entry never stale the catalog, so their
suites drift invisibly (TASK-64 hit exactly this: `test/reorient.test.mjs` gained
cross-directory tests unseen). At dispatch the live set is 29 `test/*.test.mjs` files
vs 23 cataloged sources — missing: `build-npm`, `new-plugin`, `pdlc`, `phase-status`,
`reorient`, `run-gates`. The card's 22/27 snapshot is stale by design: ENUMERATE THE
ACTUAL SET AT EXECUTION TIME and close whatever the enumeration finds.

## Requirements (map 1:1 to board ACs)

R1 (AC #1) — every `test/*.test.mjs` file present at execution time has a catalog
bullet (what the file pins down, house style: one bullet per file) and appears in the
catalog's `sources:`. The enumeration is recorded (count + the files that were missing)
in the board notes.

R2 (AC #2) — the note body stays within the 8000-char budget. It sits at ~7996 NOW, so
adding ~6 bullets forces a summary-style split (docs/corpus-spec.md): split along a
natural seam (e.g. chassis/tooling tests vs plugin-gate tests), each part within
budget, cross-linked with wikilinks, both indexed in `INDEX.md`; regenerate
`CAPSULES.md` in the same slice (new/changed `description:`). [[test-suite]] keeps
pointing at the catalog entry note.

R3 (AC #3) — the wiki freshness gate is green with the expanded source lists (all
split parts pinned to a commit covering their content; honest pins only — read the
covered diff).

## Non-goals

- No test changes, no code changes — wiki-only (NOT released surface: no version bump;
  check-version-bump must report "no bump required" on this PR).
- No rewriting of existing accurate bullets beyond what the split's seam requires.
