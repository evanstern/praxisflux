---
id: TASK-1.3
title: 'Port research gates Python -> Node, folded into lib/'
status: To Do
assignee: []
created_date: '2026-07-06 17:06'
labels:
  - research
  - chassis
dependencies:
  - TASK-1.2
parent_task_id: TASK-1
priority: medium
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Reimplement verify_branch / verify_analysis / verify_artifact on lifecycle.mjs + selfcontained.mjs + markdown.mjs. Eliminate research's 4 drifting copies (per-skill self-heal bundles + installed vault copy) in favor of one plugin-hosted source referenced via CLAUDE_PLUGIN_ROOT.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Node gates reproduce the Python checks: branch well-formedness + wikilink isolation, analysis presence, artifact self-containment
- [ ] #2 no Python remains in the research plugin
- [ ] #3 each gate has a single source of truth (no duplicated copies)
<!-- AC:END -->
