---
id: TASK-59
title: >-
  grounding-wiki freshness gate: silent passes on missing and inline-array
  sources; CAPSULES corpusDir false-block
status: Done
assignee:
  - '@claude'
created_date: '2026-07-27 01:57'
updated_date: '2026-07-27 03:23'
labels:
  - downstream-bug-find
dependencies: []
priority: high
ordinal: 94000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Three gate defects. (1 live) gates/freshness.mjs:72-87 feeds sources: paths to git log with no existence check — a typo or a path left behind by a rename yields empty log output and the note reports FRESH forever (fixture: sources with no-such-file.txt -> OK: 2 note(s) fresh, exit 0, zero warnings). (2 live) parseSourcesBlock (freshness.mjs:22-35) handles only YAML block lists; inline sources: [a, b] — a shape lib/markdown.mjs:35-36 parseFrontmatter accepts elsewhere — is ignored, so a genuinely stale note exits 0 with only a non-blocking warn: no sources listed. (3 live) gates/capsules.mjs:89 embeds the invoking corpusDir string verbatim in the generated header and :141-148 byte-compares against a re-render with the checker corpusDir — regenerate with an absolute path or trailing slash, then gate with default docs/wiki, and a fresh CAPSULES.md false-blocks as hand-edited.

Spec: specs/020-freshness-gate-holes
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A note listing a source path absent from the tree is a blocking finding (or loud per-note warning), not a silent fresh
- [x] #2 Inline-array sources frontmatter is parsed and staleness-checked identically to block lists
- [x] #3 CAPSULES regenerate-and-compare is corpusDir-spelling-invariant (absolute path / trailing slash regenerates byte-equal)
- [x] #4 Regression tests cover all three (missing source, inline array, corpusDir spelling)
- [x] #5 Spec phase: Spec
- [x] #6 Spec phase: Implement
- [x] #7 Spec phase: Prove
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Spec 020-freshness-gate-holes (hand-authored spec/plan/tasks on branch task-59-wiki-gate-holes) drives. 1. freshness.mjs: existence-check every sources path — missing path becomes a blocking finding (or loud per-note warning per AC wording). 2. parseSourcesBlock: accept inline-array sources: [a, b] identically to block lists. 3. capsules.mjs: normalize corpusDir before embedding/comparing so regenerate-and-compare is spelling-invariant. 4. Regression tests for all three. 5. Versions + wiki re-ground (grounding-wiki-plugin note) + gates. See specs/020-freshness-gate-holes/plan.md.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Origin: downstream bug-find sweep run FROM promptworld (2026-07-27) against praxis decaa14 (v0.27.0, immediately post-TASK-57) — three parallel read-only finder agents (lib/scripts, core plugins, leaf plugins). Reported upstream because the TASK-57 cycle report was pasted into a promptworld session; the promptworld-side sibling gap is carded there as TASK-162. Items marked (live) were reproduced with live runs; the rest verified by reading code at decaa14.

Sweep dispatch (downstream-bugfix runbook, Lane B): tier = default implementer — gate code + regression tests with precise live repros already in the card.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Freshness/CAPSULES gate holes closed (branch task-59-wiki-gate-holes; PR pending merge). (1) grounding-wiki/gates/freshness.mjs existence-checks every source path — a missing/renamed path is a blocking finding naming note + path, and planFreshness surfaces the same case as a problem instead of planning over it. (2) New exported noteSources(): inline-array sources: [a, b] parsed via lib/markdown.mjs parseFrontmatter and staleness-checked identically to block lists in both validate and plan. (3) capsules.mjs: new exported normalizeCorpusDir applied in render and check — regenerate-and-compare is corpusDir-spelling-invariant (absolute/./trailing-slash byte-identical); pre-normalization headers degrade to a WARN naming the regen command, genuine staleness still blocks. (4) Seven regression tests across the freshness/capsules suites; one pre-existing fixture that relied on the missing-source hole corrected. Also fixed a stale factual claim in grounding-wiki-plugin.md (docs/wiki has been adopted/hard-enforced since TASK-50). No skill version bumps (gates live outside skill dirs; bump gate concurs). Reconciled with post-58/61/62/65 main by merge-in (67bba3d): 0.32.0, honest pin classification, test-suite fold honored main's split, and the new blocking behaviors live-verified to exit 1 through TASK-65's restructured run-gates CLI. Gates green at HEAD: node --test 228/228, check-docs, wiki freshness 30/30, bump gate 0.31.0 → 0.32.0. Hardening candidate surfaced for operator review (not carded): repin.mjs validates hash format only, not commit existence.
<!-- SECTION:FINAL_SUMMARY:END -->
