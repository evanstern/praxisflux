# 064 — read-size gate: praxis-native redirect to the cheap path

**Board task:** TASK-0124 · **Lane:** 1 · **Runbook:** `docs/design/sweep-cost-offload-runbook.md`

Spec Kit is not installed on this host (`.specify/` absent); this spec is hand-authored
under the sweep's operator-signed escape line, per established precedent (specs 052–062).

## Problem

Bulk reads at the tool boundary spend orchestrator context that capsule-first corpus
loading (measured 96.7% cheaper on the 43-note praxis corpus) or a tier-dispatched agent
would spend instead. Spotify's shunt plugin proves the interception idea but its redirect
target is internal, and its hooks emit the obsolete top-level `{"decision": "block"}`
schema, which the current harness ignores — they fail OPEN silently.

Port the gate, drop the transport: two PreToolUse hooks (Read, Bash) that deny above a
configurable line threshold with a reason naming OUR cheap path — capsule-first loading
and `defaultTier` Agent dispatch — never an external service.

## The two hazards this port must not inherit (from the card)

1. **Fail-open schema drift:** the port uses the current
   `hookSpecificOutput.permissionDecision: "deny"` schema, and a test asserts the hooks
   actually deny — so an upstream-style schema drift cannot silently fail open.
2. **Corpus rot via blocked grounding reads:** wiki-build/wiki-update must read real
   source to earn a `verified_against` pin; design-rounds Phase 2 reads implementation
   comments deliberately. The gate is a nudge for ordinary reads, never a wall in front
   of grounding — hence exemptions plus a kill-switch, not just a threshold.

## Requirements (mapped to the card's ACs)

1. **Deny above threshold, current schema (AC #1):** PreToolUse hooks for Read and Bash
   deny above a configurable line threshold using
   `hookSpecificOutput.permissionDecision: "deny"` with `permissionDecisionReason`.
2. **Praxis-native reason (AC #2):** the deny reason names capsule-first corpus loading
   (CAPSULES.md / INDEX.md) and Agent dispatch at the `.claude/model-tiers.json`
   `defaultTier` — no external service.
3. **Exemptions (AC #3):** `docs/wiki/`, `specs/`, `.worktrees/` and `.claude/worktrees/`
   path prefixes; targeted Read calls (offset/limit set); targeted bash reads (piped or
   redirected output — the read is feeding a filter, not the session context).
4. **Kill-switch (AC #4):** an env var disables the gate entirely, for
   wiki-build/wiki-update/design-rounds passes; documented where the corpus-loading
   doctrine lives.
5. **Fail-closed test (AC #5):** a test drives each hook end-to-end over stdin and
   asserts the deny lands in the current schema — a schema drift breaks the test, not
   the gate.
6. **Gates green (AC #6):** check-docs, wiki-freshness, and spec-bridge gates green.

**Operator ruling (runbook checkpoint 3):** the default threshold and the kill-switch
env var name are settled in `plan.md`; operator reviews via the PR.

## Posture

Like spec 051's root-guard: shipped from pdlc, **planted into an adopting host, never
auto-registered** — no `hooks.json` beside the hook files, so the marketplace never
wires it by default. Advisory local posture holds for hosts that don't adopt it.

## Done means

Hook script(s) under `pdlc/hooks/`, fail-closed tests in `test/`, exemption and
kill-switch behavior covered, planting documented, versions bumped per
`docs/releasing.md`, wiki re-pinned honestly.
