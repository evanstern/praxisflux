# 020-freshness-gate-holes — tasks

## Spec

- [x] T000 claim: board TASK-59 → In Progress + spec dir, committed on the task branch
- [x] T001 spec.md / plan.md / tasks.md authored

## Implement

- [x] T002 freshness.mjs: missing source path is a blocking finding naming note + path (R1)
- [x] T003 freshness.mjs: inline-array sources parsed + staleness-checked like block lists,
  aligned with lib/markdown.mjs parseFrontmatter (R2)
- [x] T004 capsules.mjs: corpusDir normalized before embed + compare; spelling-invariant
  regenerate-and-compare; pre-fix headers degrade to regeneration guidance (R3)
- [x] T005 regression tests: missing source, inline array, corpusDir spellings (R4)
- [ ] T006 versions: skill version bump(s) + marketplace sync-version
- [ ] T007 wiki: grounding-wiki-plugin re-verified + re-pinned; CAPSULES if description
  changed

## Prove

- [ ] T008 gates green: node --test, check-docs, wiki freshness, bump gate
- [ ] T009 board finalized (ACs checked, Done, final summary); PR opened
