---
id: TASK-6.2
title: 'Corpus-aware analysis: read docs/wiki as primary input'
status: To Do
assignee: []
created_date: '2026-07-09 18:48'
labels: []
dependencies: []
parent_task_id: TASK-6
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Slice 2. Phase 1 of the skill: if target repo has a corpus (docs/wiki/INDEX.md per docs/corpus-spec.md), read INDEX + notes as primary analysis input, fall back to raw-code reading only for gaps. Phase 2.5: module briefs gain a grounding: frontmatter listing the [[note]] names drawn from (briefs are the sidecar; NEVER write course fields into wiki notes — spec guardrail 1). Corpus must remain optional: no corpus → today's behavior (guardrail 2).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 With a corpus present, Phase 1 instructions direct analysis through INDEX.md + notes before raw code
- [ ] #2 Module briefs carry grounding: frontmatter listing consumed [[note]] names
- [ ] #3 Wiki notes are never written to by the skill (sidecar-only, guardrail 1)
- [ ] #4 Without a corpus, behavior is unchanged from the standalone skill
<!-- AC:END -->
