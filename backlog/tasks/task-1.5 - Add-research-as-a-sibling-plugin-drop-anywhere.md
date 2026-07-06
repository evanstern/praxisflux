---
id: TASK-1.5
title: Add research as a sibling plugin (drop-anywhere)
status: Done
assignee:
  - '@claude'
created_date: '2026-07-06 17:06'
updated_date: '2026-07-06 19:14'
labels:
  - research
dependencies:
  - TASK-1.2
  - TASK-1.3
parent_task_id: TASK-1
priority: medium
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Package research as its own plugin manifest; keep the planted vault CLAUDE.md; add an unambiguous drop-anywhere sentinel marker so the global Stop hook can detect a vault without false positives; make the hook dispatch ADDITIVE (run every applicable gate) so a tree that is both an educate project and contains research vaults gates both.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 research bootstraps a vault in any folder (drop-anywhere preserved)
- [x] #2 Stop hook detects a vault via the sentinel with no false positives in unrelated folders
- [x] #3 a tree that is both an educate project and contains nested research vaults runs both gates
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Copy research skills (research-vault, analyze-vault, vault-artifact) into praxis/research/skills/ and the planted vault CLAUDE.md + templates into praxis/research/templates/. Define a drop-anywhere sentinel '.research-vault' at vault root. Add research/scripts/stop.mjs (research gate: resolveRoots via findRootsDownwards(sentinel); check = all *.html in the vault must pass lib/selfcontained) + gate.sh shim + hooks/hooks.json. Update skill prose + planted CLAUDE.md to invoke plugin-hosted Node gates (node CLAUDE_PLUGIN_ROOT/research/gates/cli.mjs ...) and to plant the sentinel instead of copying python gates into the vault. Verify: bootstrap a vault anywhere -> branch gate passes; sentinel detection no false positives; both educate+research gates fire on a combined tree.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Copied research skills (research-vault/analyze-vault/vault-artifact) + planted vault CLAUDE.md + note templates into praxis/research/. Rewired all gate invocations from python _scripts to node ${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs; removed the copy-gates-into-vault bootstrap and self-heal prose (gates are plugin-hosted now). Bootstrap plants a .research-vault sentinel. Added research/scripts/stop.mjs (gate: findRootsDownwards(sentinel) -> self-containment of every *.html in the vault) + gate.sh shim + hooks/hooks.json. VERIFIED: (1) vault bootstrapped in an arbitrary nested folder, branch gate passes; (2) Stop hook exit 2 on external-loading html, exit 0 with no sentinel (no false positive) and on clean html; (3) combined tree with topics/ + a nested .research-vault: educate hook and research hook each fire and block independently. Suite green.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
research is now a drop-anywhere sibling plugin on the chassis. Skills + planted vault CLAUDE.md + templates copied in; gates are plugin-hosted Node (no per-vault python). A .research-vault sentinel marks a vault anywhere; a Stop hook enforces artifact self-containment via lib/gate-runner. Verified drop-anywhere bootstrap, sentinel detection without false positives, and independent dual-gate firing on a combined educate+research tree.
<!-- SECTION:FINAL_SUMMARY:END -->
