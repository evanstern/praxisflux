---
id: TASK-0124
title: >-
  Port shunt's read-size gate to a praxis-native redirect (capsule-first + tier
  dispatch)
status: To Do
assignee: []
created_date: '2026-09-10 14:14'
labels:
  - gates
  - feature
  - sweep-cost
dependencies: []
ordinal: 155000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Spotify's shunt plugin (portal-ai-plugins@add-shunt-claude) gates large reads with two PreToolUse hooks and redirects them to a remote summarizer. The redirect target is Spotify-internal (portal-cli + AiKA modes) and is not usable here, but the gate itself is the reusable idea: intercept a bulk read at the tool boundary and point the session at the cheap path instead of letting it spend orchestrator context.

Port the gate, drop the transport. Two PreToolUse hooks (Read, Bash) that fire above a configurable line threshold and deny with a reason naming OUR cheap path — capsule-first corpus loading (CAPSULES.md / INDEX.md, measured 96.7% cheaper than reading the 43-note praxis corpus) and Agent dispatch at .claude/model-tiers.json defaultTier — rather than an external service.

Two findings from the upstream read that this port must not inherit:

1. Upstream's hooks emit a top-level {"decision": "block"} which is not the current PreToolUse schema (hookSpecificOutput.permissionDecision: deny). As written they fail OPEN — the read proceeds silently. Verify live before porting; the port must use the current schema and have a test that catches a fail-open regression.

2. A blanket size gate is actively hostile to grounding-wiki. wiki-build/wiki-update require reading actual source to earn a note's verified_against pin; a summarized read behind a real pin is corpus rot the freshness gate cannot detect (it checks pins are current, not earned). Same for design-rounds Phase 2, which reads implementation comments precisely because the load-bearing reasoning looks like noise to a summarizer.

So the gate needs exemptions, not just a threshold: docs/wiki/, specs/, .worktrees/ and .claude/worktrees/, plus an env kill-switch for wiki-build/wiki-update/design-rounds passes. The gate is a nudge toward the cheap path for ordinary reads, never a wall in front of grounding.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 PreToolUse hooks for Read and Bash deny above a configurable line threshold using the current hookSpecificOutput.permissionDecision schema
- [ ] #2 The deny reason names the praxis cheap path (capsule-first corpus loading and tier dispatch), not any external service
- [ ] #3 Exemptions cover docs/wiki/, specs/, worktree roots, and targeted reads (offset/limit set, piped or redirected bash)
- [ ] #4 An env kill-switch disables the gate for grounding-wiki and design-rounds passes, documented where the corpus-loading doctrine lives
- [ ] #5 A test asserts the hooks actually deny (fail-closed) so an upstream-style schema drift cannot silently fail open
- [ ] #6 check-docs, wiki-freshness, and spec-bridge gates green
<!-- AC:END -->
