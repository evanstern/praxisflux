# 065 — wiki-update freshness triage as the structured-offload seam's first (and only) consumer

**Board task:** TASK-0127 · **Lane:** 2 · **Runbook:** `docs/design/sweep-cost-offload-runbook.md`
**Depends on:** TASK-0126 (spec 063, merged PR #141 — `lib/structured-offload.mjs`)

Spec Kit is not installed on this host (`.specify/` absent); this spec is hand-authored
under the sweep's operator-signed escape line, per established precedent (specs 052–064).

## Problem

wiki-update's plan loop already splits stale notes on exactly the axis the seam serves:
`classifyNote` (`grounding-wiki/gates/freshness.mjs`) mechanically routes REPIN (stamp-only
diff, no version literals in the note) vs REVIEW. Everything REVIEW today costs a Claude
read of the note plus its diff — high-volume (a version bump stales ~15 notes at once,
observed on PRs #141/#142), mechanically shaped, and cheap to check. Land exactly ONE
consumer of the structured-offload seam there, and MEASURE it; the measurement — not
intuition — decides whether a second consumer gets built or the seam gets reverted.

## Where the offload sits (the design, precisely)

The deterministic `classifyNote` stays untouched and runs first — its REPIN verdict is
provably safe and needs no model. The offload triages the **REVIEW pile**: for each
REVIEW entry, ask the local model whether the diff can invalidate the note's prose,
returning per note a closed enum (`computed-re-pin` | `needs-review`) plus the deciding
file path. This replaces the in-session judgment Claude makes today over the same pile:

- Routed `needs-review` → unchanged: Claude reads the note and the full diff, amends
  prose if needed, re-pins. This is the path today for every REVIEW entry.
- Routed `computed-re-pin` with a valid deciding path → the pass re-pins the way
  Claude's own "this is churn, re-pin" call would.

**The invariant (AC #3):** the local model only ROUTES. It never writes a note body,
never sets a `verified_against` pin itself, never decides a pin is earned — and source
reads for needs-review notes are unchanged. Offloading the routing narrows what Claude
reads; offloading the verification would forge the pin (the TASK-0124 hazard).

## Requirements (mapped to the card's ACs)

1. **Opt-in wiring (AC #1):** wiki-update's triage routes through the seam when
   `.claude/structured-offload.json` is configured; unconfigured, behavior is exactly
   today's (the seam returns `unconfigured` and the pass proceeds in-session).
2. **Checkable response (AC #2):** the schema is a closed enum per note plus a
   `deciding_path` string; the caller verifies the path appears in the plan entry's
   actual changed-file list (`files` from `planFreshness`), on top of the seam's own
   schema validation. Either check failing → the seam's fail-soft path → in-session
   classification for that note.
3. **Routing only (AC #3):** as stated above — no note bodies, no pins, no earned-pin
   decisions from the model; needs-review source reads unchanged.
4. **Conservative bias (AC #4):** the prompt states the asymmetry (a false
   `computed-re-pin` is the expensive error; `needs-review` just costs a read that was
   happening anyway) and instructs: when uncertain, `needs-review`. The measurement
   reports directional misroutes separately.
5. **Measurement (AC #5):** a real wiki-update classification pass over the praxis
   corpus, seam-on vs seam-off over identical inputs, recording tokens, wall-clock,
   fallback rate, and misroute rate against Claude's own classification as ground truth.
6. **Verdict (AC #6):** the measurement is written up with an explicit verdict on
   whether a second consumer is justified.
7. **Gates (AC #7):** check-docs, wiki-freshness, and spec-bridge gates green.

**Operator rulings (runbook checkpoints 1–2):** backend Ollama `http://localhost:11434`,
model `deepseek-r1:latest`. If the endpoint is unreachable when the measurement runs:
land the code, leave ACs #5/#6 unticked, park the task short of Done, surface to the
operator — never tick a measurement that did not run.

## Done means

Triage offload script + wiki-update skill wiring landed, opt-in and fail-soft; tests
green with no live model; the measurement executed and written up with a verdict (or the
task honestly parked per the ruling); versions and skill `version:` bumped per
`docs/releasing.md`; wiki re-pinned honestly.
