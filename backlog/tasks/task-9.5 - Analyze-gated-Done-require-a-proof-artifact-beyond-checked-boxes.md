---
id: TASK-9.5
title: 'Analyze-gated Done: require a proof artifact beyond checked boxes'
status: Done
assignee:
  - '@claude'
created_date: '2026-07-10 02:26'
updated_date: '2026-07-10 03:16'
labels: []
dependencies:
  - TASK-9.3
  - TASK-9.4
parent_task_id: TASK-9
priority: low
ordinal: 38000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Strict mode for Done derivation. All-checkboxes-checked is necessary but weak proof; this slice adds an optional requirement that a Spec Kit analysis report exists as a FILE in the spec dir (e.g. specs/NNN-feature/analysis.md, saved by the model when running /speckit.analyze) with no unresolved CRITICAL findings, before derivation returns Done-eligible. Since /speckit.analyze is a slash command with chat output, the sync/link skills must instruct that its report be saved into the spec dir so the gate can read it — artifacts, not vibes. Configurable: projects can run in checkbox-only mode.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 With strict mode on, a spec with all boxes checked but no analysis report derives as In Progress, not Done-eligible
- [x] #2 An analysis report containing unresolved CRITICAL findings blocks Done-eligibility with a problem naming the findings
- [x] #3 Checkbox-only mode preserves the prior behavior
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. lib/spec-derive.mjs: deriveSpecState(specDir, { requireAnalysis }) — strict mode makes Done-eligible additionally require analysis.md in the spec dir with no unresolved CRITICAL findings; expose analysis: { present, criticals } in the derived state; findCriticalFindings = lines with \bCRITICAL\b not marked resolved (line-based, documented)
2. spec-bridge/gates/bridge.mjs: loadBridgeConfig(root) reads .spec-bridge.json ({ strictDone: true }); checkBridge passes requireAnalysis; shortfall names missing report / the CRITICAL findings
3. cli state: resolve project root upwards from the spec dir to honor the same config
4. sync SKILL.md + READMEs: instruct saving the /speckit.analyze report as analysis.md (artifacts, not chat output); document the config
5. Tests: AC1 (all checked, no report -> In Progress), AC2 (CRITICAL named in gate problem), AC3 (no config -> prior behavior), resolved-CRITICAL passes
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Strict mode implemented in the derivation (chassis-side): deriveSpecState(specDir, {requireAnalysis}) — Done-eligible additionally needs analysis.md with no unresolved CRITICAL findings (line-based scan, exact-case CRITICAL, cleared by same-line 'resolved' or a checked box); derived state now carries analysis:{required,present,criticals}. Opt-in via .spec-bridge.json {strictDone:true} at the project root, read by checkBridge and by cli state (root found upwards from the spec dir). Gate messages name the missing report (with the save-the-report fix) or the finding lines verbatim. sync SKILL.md + READMEs instruct saving /speckit.analyze output as <specDir>/analysis.md — artifacts, not chat. Suite 57/57; live smoke through real stop.mjs: no report -> exit 2, CRITICAL -> exit 2 naming the finding, clean report -> exit 0.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Analyze-gated strict Done: opt-in .spec-bridge.json {strictDone:true} makes Done-eligibility require a saved analysis.md with zero unresolved CRITICAL findings; checkbox-only mode unchanged without the config. Verified by unit tests (AC1-3) and live Stop-hook runs.
<!-- SECTION:FINAL_SUMMARY:END -->
