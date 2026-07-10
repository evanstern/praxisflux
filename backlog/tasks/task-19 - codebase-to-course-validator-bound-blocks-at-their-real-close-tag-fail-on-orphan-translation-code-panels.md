---
id: TASK-19
title: >-
  codebase-to-course validator: bound blocks at their real close tag + fail on
  orphan translation-code panels
status: To Do
assignee: []
created_date: '2026-07-10 22:04'
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
- [ ] #1 findBlocks bounds each translation-block's chunk at the block's actual closing tag (via the existing nesting-aware extent finder), not at the next block's open tag
- [ ] #2 An orphan .translation-code panel, .code-line, or .tl outside every translation-block fails validation with a line-numbered message telling the author to wrap or delete it
- [ ] #3 The three repro scenarios (misattributed blame, false green, orphan before first block) are covered by tests in test/codebase-to-course.validate.test.mjs and fail against the old logic
- [ ] #4 The course gate (gates/course.mjs) surfaces the new orphan failures unchanged, and --fix still auto-closes fixable blocks correctly with the tighter chunk bounds
- [ ] #5 The vendored copy in docs/course/validate.mjs is re-synced verbatim and the repo's own course still passes the gate
- [ ] #6 Marketplace version and the codebase-to-course skill version are bumped per docs/releasing.md; wiki freshness gate green
<!-- AC:END -->
