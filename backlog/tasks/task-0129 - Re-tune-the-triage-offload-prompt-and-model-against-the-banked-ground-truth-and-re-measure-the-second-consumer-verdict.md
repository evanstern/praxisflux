---
id: TASK-0129
title: >-
  Re-tune the triage-offload prompt and model against the banked ground truth,
  and re-measure the second-consumer verdict
status: To Do
assignee: []
created_date: '2026-09-10 20:02'
labels:
  - grounding-wiki
  - sweep-cost
  - feature
dependencies:
  - TASK-0127
ordinal: 160000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up to TASK-0127's measurement (docs/design/triage-offload-measurement.md, PR #143), which returned an honest negative verdict: deepseek-r1:latest routed all 9 REVIEW notes to needs-review (0/4 computed-re-pin recall, 55.6% fallback from a deciding_path degenerate echo), so the seam's first consumer saved no Claude-side reads. The measurement banked Claude's per-note verdicts as ground truth and the staleness window is reproducible (scratch clone, pins reset to 390ca61), so re-tuning is a mechanical eval loop — no new Claude ground-truth pass needed.

Plan (operator-approved 2026-09-10):
1. Fix the two known prompt defects in grounding-wiki/scripts/triage-offload.mjs's prompt: (a) deciding_path echo — describe the field concretely, enumerate valid paths in the prompt, add one worked example of a correct response; (b) zero recall — state the actual decision rule (do any quoted version literals in the note refer to the thing whose version changed?) with one example per answer; keep the conservative bias as tiebreak only.
2. Build a small bench harness: set up the scratch-clone window once, run a (prompt variant x model) matrix over the same 9 REVIEW entries, print a scoreboard (computed-re-pin recall, false-pin count, fallback rate, mean latency) scored against the recorded ground truth.
3. Sweep the locally-pulled models: deepseek-r1:latest (baseline), deepseek-r1:32b, qwen3.6, gemma4:12b-mlx, cogito:3b (floor). This separates model ceiling from prompt overshoot.
4. Validate the winner on a second, mixed-staleness window (including real prose-invalidating changes) before flipping the verdict — zero false computed-re-pin is the gate no candidate may fail.

Success criteria written up front: recall meaningfully above zero (4/4 on the banked window is the target), zero false computed-re-pin on BOTH windows, fallback under ~10%, per-call latency that beats Claude just reading the diff. Finish by updating docs/design/triage-offload-measurement.md with the re-measure and an explicit updated verdict (second consumer justified / still not / revert).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Prompt defects fixed: deciding_path field concretely specified with enumerated valid paths and a worked example; the decision rule stated positively with one example per answer, conservative bias demoted to tiebreak
- [ ] #2 A bench harness runs a (prompt variant x model) matrix over the reproducible 9-note window and scores recall, false-pin count, fallback rate, and mean latency against the banked ground-truth verdicts
- [ ] #3 Model sweep run across deepseek-r1:latest, deepseek-r1:32b, qwen3.6, gemma4:12b-mlx, and cogito:3b, answering whether the zero recall was model ceiling or prompt overshoot
- [ ] #4 The winning (prompt, model) pair validated on a second mixed-staleness window containing real prose-invalidating changes, with zero false computed-re-pin on both windows
- [ ] #5 docs/design/triage-offload-measurement.md updated with the re-measure results and an explicit updated verdict on the second consumer (justified / not justified / revert)
- [ ] #6 check-docs, wiki-freshness, and spec-bridge gates green
<!-- AC:END -->
