---
id: TASK-1.3
title: 'Port research gates Python -> Node, folded into lib/'
status: Done
assignee:
  - '@claude'
created_date: '2026-07-06 17:06'
updated_date: '2026-07-06 18:39'
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
- [x] #1 Node gates reproduce the Python checks: branch well-formedness + wikilink isolation, analysis presence, artifact self-containment
- [x] #2 no Python remains in the research plugin
- [x] #3 each gate has a single source of truth (no duplicated copies)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
In praxis/research/gates/: vault.mjs (shared note loading: loadNotes, localNames, listBranches, KNOWN_TYPES) built on lib/markdown; branch.mjs (port verify_branch.py: MOC, grounding, frontmatter sanity, wikilink isolation, orphan warns); analysis.mjs (port verify_analysis.py: >=1 type:analysis, title, cites corpus or ## Basis, isolation); artifact.mjs (wrap lib/selfcontained.checkHtml over a file); cli.mjs (dispatch branch|analysis|artifact, print warns/fails, exit 0/1/2). Add test/research-gates.test.mjs with a fixture vault. Parity-check the Node branch gate against the real vault at ~/Claude/Research vs the Python gate. Commit. Imports use repo-root ../../lib during dev; 1.10 vendors lib per-plugin.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Ported all 3 research gates to Node in research/gates/ on the lib chassis: vault.mjs (shared loading), branch.mjs (verify_branch), analysis.mjs (verify_analysis), artifact.mjs (wraps lib/selfcontained), cli.mjs (dispatch). 4 gate tests + 8 chassis tests = 12/12 pass. PARITY VERIFIED against Python on the real vault ~/Claude/Research: branch, analysis (Homelab-AI-Buildout), and artifact (which-build-briefing.html) all produce identical OK/exit-0 results as the Python gates. artifact gate has a single source (reuses lib/selfcontained) — no duplication.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Research gates ported Python->Node on the chassis (research/gates/{vault,branch,analysis,artifact,cli}.mjs). Node output is byte-for-byte parity with the Python gates on the real vault across all three checks. 12/12 tests pass. Single source of truth per gate; no Python in the research plugin.
<!-- SECTION:FINAL_SUMMARY:END -->
