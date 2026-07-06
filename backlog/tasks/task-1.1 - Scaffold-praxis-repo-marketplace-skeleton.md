---
id: TASK-1.1
title: Scaffold praxis repo + marketplace skeleton
status: Done
assignee:
  - '@claude'
created_date: '2026-07-06 17:05'
updated_date: '2026-07-06 17:12'
labels:
  - chassis
dependencies: []
parent_task_id: TASK-1
priority: high
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Establish the unified repo layout: .claude-plugin/marketplace.json listing educate/research/build with ./subdir sources; a per-plugin subdir each with its own .claude-plugin/plugin.json; top-level lib/ (shared chassis) and docs/. README + .gitignore already exist.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 marketplace.json lists the plugins with ./subdir sources and validates
- [x] #2 each plugin subdir has its own .claude-plugin/plugin.json
- [x] #3 lib/ and docs/ exist as the homes for shared code and authoring docs
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add .claude-plugin/marketplace.json at repo root listing educate/research/build with ./subdir sources. 2. Create each plugin subdir with a minimal valid .claude-plugin/plugin.json (scaffold) + a README stating its role and the migration task that fills it (1.4/1.5/1.8). 3. Create lib/ and docs/ with placeholder READMEs. 4. Validate all JSON parses. 5. Commit.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Created .claude-plugin/marketplace.json listing educate/research/build with ./subdir sources; each subdir has a scaffold plugin.json + README noting its migration task (1.4/1.5/1.8); added lib/ and docs/ placeholder READMEs. All 4 JSON files validated via node JSON.parse.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Laid down the praxis marketplace skeleton: root marketplace.json (3 plugins, ./subdir sources) + per-plugin scaffold manifests/READMEs + lib/ and docs/ homes. Verified all manifests parse. Real plugin content arrives in later tasks.
<!-- SECTION:FINAL_SUMMARY:END -->
