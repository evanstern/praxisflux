# 063 — structured-offload seam: schema-validated local-model calls with fail-soft

**Board task:** TASK-0126 · **Lane:** 1 · **Runbook:** `docs/design/sweep-cost-offload-runbook.md`

Spec Kit is not installed on this host (`.specify/` absent); this spec is hand-authored
under the sweep's operator-signed escape line, per established precedent (specs 052–062).

## Problem

Narrow, mechanically-checkable work (classification into a closed enum, path lookups)
currently spends orchestrator context. A local model (Ollama on this machine, or any
OpenAI-compatible endpoint) could do it for free — but only if its output is checkable
WITHOUT trusting the model, and only if a down or wrong local model can never block a
sweep. No such seam exists in the chassis.

The selection rule this seam enforces: offload work whose output is verifiable against
a schema and checkable referents — never free-text summaries, which behind a
`verified_against` pin become corpus rot the freshness gate cannot detect (the TASK-0124
hazard). Scope is the SEAM ONLY; no consumers land in this task (TASK-0127 lands the
first one and measures it).

## Requirements (mapped to the card's ACs)

1. **Helper signature (AC #1):** a chassis module exports an async function taking a
   prompt, a JSON schema, and endpoint config, returning the validated object — or a
   fallback signal, never a throw the caller must handle.
2. **Constrained decoding (AC #2):** where the backend supports it, the schema is passed
   to the backend itself (Ollama `format`, OpenAI-compatible
   `response_format: json_schema`) so the model is structurally prevented from returning
   prose — never prompt instructions alone.
3. **Fail-soft (AC #3):** invalid JSON, schema mismatch, timeout, connection refused, and
   unset endpoint all degrade to the caller doing the work in-session. No error surfaces
   to the user; no sweep blocks.
4. **Opt-in, absent by default (AC #4):** with no config present, behavior is
   byte-identical to today — the helper reports "not configured" and the caller proceeds
   as it always has.
5. **Config as data (AC #5):** endpoint and model live in a config file beside
   `.claude/model-tiers.json` (the existing "model routing lives in config, not code"
   precedent), never hardcoded; the config surface is documented next to the model-tier
   ladder.
6. **Residue (AC #6):** every call records backend used and validated-vs-fell-back (with
   reason), so TASK-0127 can be measured rather than assumed.
7. **Tests without a live model (AC #7):** fallback paths — invalid JSON, schema
   mismatch, timeout, refused connection — covered by tests against a local stub server,
   no model required.

**Operator ruling (runbook checkpoint 1):** the reference backend is Ollama at
`http://localhost:11434`, model `deepseek-r1:latest`; the config home is settled in
`plan.md` and placed beside the tier ladder.

## Out of scope, permanently

Anything whose output IS judgment — design-rounds grounding, note bodies, spec authoring,
merge and gate decisions. Not a capability limit; the artifact's value is that a
reasoning agent stands behind it.

## Done means

`lib/structured-offload.mjs` on the chassis with the contract above; tests green with no
network dependency; config surface documented; versions bumped per `docs/releasing.md`;
wiki re-pinned honestly for the chassis notes this touches.
