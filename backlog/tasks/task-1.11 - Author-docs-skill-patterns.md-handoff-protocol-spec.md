---
id: TASK-1.11
title: Author docs/skill-patterns.md + handoff protocol spec
status: Done
assignee:
  - '@claude'
created_date: '2026-07-06 17:06'
updated_date: '2026-07-06 19:31'
labels:
  - docs
  - handoff
dependencies:
  - TASK-1.6
parent_task_id: TASK-1
priority: low
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The leverage doc for future plugins: encode the shared authoring philosophy (phase-separated skills; precondition-gate -> work -> output-gate shape; plant-a-CLAUDE.md; the 'handing off' section; self-healing gate installs) plus the handoff protocol spec (envelope, .handoff/ transport, evidence-in-tracked-state, payload-schema-per-pair). Referenced from README/CLAUDE.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 doc covers the core principles + a skill-authoring template
- [x] #2 handoff protocol spec documents envelope, transport, and evidence rules
- [x] #3 README/CLAUDE.md link to it
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Write docs/skill-patterns.md: the shared authoring philosophy for praxis plugins — phase-separated skills composing through files+gates; the precondition-gate -> work -> output-gate skill shape + a 'Handing off' section; plant-a-CLAUDE.md (no always-on slot); gates enforce 'status can't exceed proven artifacts' (lib/lifecycle); plugin-hosted gates via CLAUDE_PLUGIN_ROOT; the two placement models (fixed-home topics/ marker vs drop-anywhere sentinel); what the chassis shares vs what stays per-plugin; a new-plugin checklist; link to handoff-protocol.md. Link it from README + CLAUDE.md. Then finalize the epic.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Wrote docs/skill-patterns.md: phase-separated skills composing through files+gates; the precondition-gate->work->output-gate->handoff skill shape; plant-a-CLAUDE.md; lifecycle 'status can't exceed proven artifacts' + evidence+residue; plugin-hosted gates via CLAUDE_PLUGIN_ROOT; the two placement models (fixed-home vs drop-anywhere sentinel); shared-chassis-vs-per-plugin; a new-plugin checklist. Linked from README + CLAUDE.md. handoff-protocol.md (from 1.7) is the companion spec.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
docs/skill-patterns.md authored — the shared authoring philosophy + a new-plugin checklist, linked from README and CLAUDE.md, with handoff-protocol.md as the companion. Future plugins copy a proven shape instead of reinventing it.
<!-- SECTION:FINAL_SUMMARY:END -->
