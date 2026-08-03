---
name: test-suite-catalog-plugins
description: Entry point for the plugin half of the per-file test-suite map, split summary-style into two children — test-suite-catalog-plugins-gates (single-plugin output-gate suites: grounding-wiki, pdlc, phase-status, reorient, research, spec-bridge, spec-derive, team-review) and test-suite-catalog-plugins-pipeline (content-authoring pipeline and cross-plugin handoff suites: codebase-to-course, educate, toolkit-borrow). Repo-tooling suites live in test-suite-catalog.
kind: pattern
sources:
  - docs/wiki/test-suite-catalog-plugins-gates.md
  - docs/wiki/test-suite-catalog-plugins-pipeline.md
verified_against: 3448c7edba2cd004e10a2daaa7c4f1dd69c33363
---

# Test suite — per-file coverage catalog (plugin gates & seams)

The plugin half of the per-file [[test-suite]] map, split summary-style from
[[test-suite-catalog]] (which holds the chassis, tooling, and release files). This half grew
past comfortable headroom and split again, summary-style, into two children:

- [[test-suite-catalog-plugins-gates]] — the single-plugin output-gate suites: each
  plugin's own gate proven against its own fixtures — grounding-wiki's capsule tier and
  freshness gate, pdlc's plant surface, phase-status's vocabulary ladder, reorient's
  output gate and run lifecycle, research's branch/analysis gates, spec-bridge's bridge
  gate, spec-derive's pure derivation, and team-review's output gate and run CLI.
- [[test-suite-catalog-plugins-pipeline]] — the content-authoring pipeline and
  cross-plugin handoff suites: codebase-to-course's two gates, educate's deck
  self-containment and topic-wiki roll-up, the build↔educate handoff/return-leg seam
  (TASK-63), and toolkit-borrow's cross-plugin DoD proof.

## Connections

- Parent note: [[test-suite]] — conventions, pre-commit/pre-push hooks, and the CI layer.
- Sibling half: [[test-suite-catalog]] — chassis, tooling, and release files.
- Children: [[test-suite-catalog-plugins-gates]], [[test-suite-catalog-plugins-pipeline]].
