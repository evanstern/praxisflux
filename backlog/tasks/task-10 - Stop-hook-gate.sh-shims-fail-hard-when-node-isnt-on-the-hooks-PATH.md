---
id: TASK-10
title: Stop hook gate.sh shims fail hard when node isn't on the hook's PATH
status: Done
assignee:
  - '@claude'
created_date: '2026-07-10 02:40'
updated_date: '2026-07-10 02:43'
labels: []
dependencies: []
ordinal: 40000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
research/scripts/gate.sh and educate/scripts/gate.sh both do 'exec node ...'. Both plugins register their Stop hook with matcher "*", so it fires in every session, in every project — not just research/educate ones. Claude Code runs hook commands in a minimal, non-login/non-interactive subprocess that doesn't source ~/.zshrc or ~/.zprofile, so PATH additions from Homebrew/nvm/volta aren't present there even though 'node' resolves fine in an interactive terminal. The shim fails at 'exec node' before gate-runner.mjs's own no-op-outside-target-project logic ever gets a chance to run, producing a Stop hook error banner ('node: not found') in unrelated projects. Do not hardcode a node path (e.g. /opt/homebrew/bin/node) — that breaks portability across machines/node managers and isn't praxis's place to assume. Instead resolve node the way an interactive shell would (falling back to the user's login shell to pick up nvm/volta/Homebrew PATH setup), and if node still can't be found, no-op (exit 0) instead of erroring, consistent with the gate's existing 'no-op outside target projects' contract.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 gate.sh in both research and educate resolve node via command -v first, falling back to $SHELL -lc 'command -v node' (or equivalent) — no hardcoded interpreter path
- [x] #2 If no node binary can be resolved at all, the shim exits 0 (allow) silently rather than erroring, so Stop never shows a 'node: not found' banner
- [x] #3 Behavior is unchanged on systems where node resolves normally (gate logic still runs via stop.mjs exactly as before)
- [x] #4 Manually verified by temporarily shadowing PATH to exclude node's real location and confirming the hook no-ops instead of failing, then restoring PATH and confirming the gate still functions
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Update research/scripts/gate.sh and educate/scripts/gate.sh to resolve node via command -v, falling back to $SHELL -lc 'command -v node'.
2. If node still can't be resolved, exit 0 (silent no-op) instead of erroring.
3. Manually verify by shadowing PATH to hide node and confirming the hook no-ops (exit 0, no stderr), then restoring PATH and confirming stop.mjs still runs normally.
4. Commit, push, open PR into main.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Resolved node via 'command -v node', falling back to "${SHELL:-/bin/sh} -lc 'command -v node'" to pick up nvm/volta/Homebrew PATH set up in the user's shell rc, without hardcoding any path. If neither resolves a binary, the shim exits 0 (silent no-op) instead of erroring. Verified manually: (1) normal PATH -> gate runs stop.mjs and allows; (2) env -i with PATH stripped to /usr/bin:/bin but real SHELL set -> fallback correctly resolves /opt/homebrew/bin/node; (3) env -i with PATH stripped and SHELL=/bin/sh (no rc) -> both resolution attempts fail, shim exits 0 with no output, no error banner.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Both research/scripts/gate.sh and educate/scripts/gate.sh now resolve node via command -v with a login-shell fallback instead of assuming bare 'node' is on the Stop hook's (minimal, non-login) PATH, and no-op (exit 0) instead of erroring if node can't be found at all. Fixes the 'node: not found' Stop hook error that fired in every session (matcher: "*") regardless of project type. No hardcoded interpreter path.
<!-- SECTION:FINAL_SUMMARY:END -->
