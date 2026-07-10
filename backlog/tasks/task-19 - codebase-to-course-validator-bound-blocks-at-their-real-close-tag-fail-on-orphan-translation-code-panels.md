---
id: TASK-19
title: >-
  codebase-to-course validator: bound blocks at their real close tag + fail on
  orphan translation-code panels
status: Done
assignee:
  - '@claude'
created_date: '2026-07-10 22:04'
updated_date: '2026-07-10 22:53'
labels:
  - codebase-to-course
  - bug
dependencies: []
priority: high
ordinal: 51000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Field report from the-stacks (course 007 rebuild): v1-era modules had orphan .translation-code panels sitting outside any .translation-block, and the validator silently mis-attributed their contents to neighboring blocks.

Root cause: findBlocks() in codebase-to-course/skills/codebase-to-course/references/validate.mjs treats each block's chunk as running from its open tag to the NEXT block's open tag (or EOF) instead of the block's actual closing </div>, on the assumption that tracked classes (.code-line, .tl, .translation-code) only occur inside blocks. Orphan panels break that assumption. The file already has a correct extent-finder (findElements, nesting-aware) that findBlocks does not use.

Three confirmed failure modes (repro'd against the shipped validator):
1. Misattributed blame — an orphan panel between two healthy blocks makes the validator report a pairing mismatch in the preceding healthy block.
2. False green — an orphan .tl after a block with a REAL missing-note bug cancels the count mismatch; the validator passes and the inline engine renders every note after the gap on the wrong code line.
3. Unvalidated territory — orphan panels before the first block (or in block-free files) are never checked at all, even with unbalanced brackets.

Blast radius: the course gate (codebase-to-course/gates/course.mjs) imports checkTranslationBlocks from this file, so CI has the same blind spots; --fix computes insertion offsets from the inflated chunks; docs/course/ carries a vendored verbatim copy. No chrome-version bump needed — the rendering contract is unchanged; this is validator-only. Repo copy of the repro cases exists from the investigating session and should become tests.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 findBlocks bounds each translation-block's chunk at the block's actual closing tag (via the existing nesting-aware extent finder), not at the next block's open tag
- [x] #2 An orphan .translation-code panel, .code-line, or .tl outside every translation-block fails validation with a line-numbered message telling the author to wrap or delete it
- [x] #3 The three repro scenarios (misattributed blame, false green, orphan before first block) are covered by tests in test/codebase-to-course.validate.test.mjs and fail against the old logic
- [x] #4 The course gate (gates/course.mjs) surfaces the new orphan failures unchanged, and --fix still auto-closes fixable blocks correctly with the tighter chunk bounds
- [x] #5 The vendored copy in docs/course/validate.mjs is re-synced verbatim and the repo's own course still passes the gate
- [x] #6 Marketplace version and the codebase-to-course skill version are bumped per docs/releasing.md; wiki freshness gate green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. findBlocks -> findElements('div','translation-block') for real close-tag extents (attrs extracted from the open-tag slice, n preserved); detect never-closed block opens and fail them loudly (they'd otherwise vanish from validation and their contents would read as orphans).
2. checkTranslationBlocks: after per-block checks, scan the whole doc for open tags with tracked classes (translation-code, code-line, tl — exact-token) outside every block extent; each is a line-numbered orphan failure telling the author to wrap or delete.
3. Tests: three repro scenarios in test/codebase-to-course.validate.test.mjs (misattributed blame, false green, orphan-before-first-block/block-free), each asserted to fail the OLD logic in the description; plus --fix with an orphan present (tight bounds keep insertion offsets correct).
4. Re-sync docs/course/validate.mjs verbatim; repo course gate green.
5. Bumps: codebase-to-course skill 0.1.2->0.1.3, marketplace 0.6.2 via sync-version; wiki re-pin cadence per source commit.
6. Finalize + PR.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fix: findBlocks -> findElements real extents (attrs from open-tag slice); checkTranslationBlocks fails unmatched .translation-block opens and orphan .translation-code/.code-line/.tl outside every extent (line-numbered, wrap-or-delete named). 5 repro tests proven 5/5 red on the shipped validator, 13/13 green on the fix; --fix offset test with orphan present. Vendored docs/course/validate.mjs re-synced; repo course passes (6 modules). Skill 0.1.3, marketplace 0.6.2. Full suite 100 pass; 8 wiki notes re-pinned.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
findBlocks now bounds each translation block at its own nesting-aware closing tag via the existing findElements, so content between blocks belongs to no chunk; checkTranslationBlocks flags never-closed block opens and orphan tracked content (.translation-code/.code-line/.tl) outside every block extent with line-numbered wrap-or-delete failures. All three field-reported failure modes (misattributed blame, false green, invisible orphans) plus unclosed-open and --fix-offset cases are covered by tests that fail 5/5 against the shipped validator and pass with the fix. Course gate surfaces the new failures unchanged; vendored docs/course/validate.mjs re-synced verbatim and the repo's own course passes. No chrome bump (rendering contract unchanged). codebase-to-course skill 0.1.3, marketplace 0.6.2, wiki re-verified (8 notes). PR pending CI.
<!-- SECTION:FINAL_SUMMARY:END -->
