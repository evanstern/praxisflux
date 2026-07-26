# 003-wiki-capsules-enforcement — tasks

## Spec

- [x] T000 claim: board TASK-49 → In Progress + spec dir stub, pushed
- [x] T001 spec.md / plan.md / tasks.md authored

## Implement

- [x] T002 CAPSULES.md generator module + CLI (deterministic, header, INDEX order)
- [x] T003 wiki-build + wiki-update SKILL.md: regeneration wired into the pass
- [x] T004 gate: adoption-keyed budget enforcement (capsule 500, body 8000, exempt key)
- [x] T005 gate: CAPSULES.md staleness via regenerate-and-compare; unadopted → warn-only
- [x] T006 tests: generator + gate fixtures (adopted/unadopted/exempt/determinism)
- [x] T007 versions: wiki-build + wiki-update SKILL.md bumps + marketplace sync-version
- [x] T008 wiki: re-verify + re-pin grounding-wiki-plugin.md (two-step)

## Prove

- [x] T009 per-task course docs/courses/TASK-49/ — course gate green
- [ ] T010 gates green: node --test, check-docs, wiki-freshness, course
- [ ] T011 board finalized; PR opened — serial merge recorded by the orchestrator
