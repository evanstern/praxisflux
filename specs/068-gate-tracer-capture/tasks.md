# 068 — Tasks

**Spec:** `specs/068-gate-tracer-capture/spec.md` · **Plan:** `plan.md` · **Board:** TASK-0121

Phases are internal work breakdown on one branch (`task-0121-gate-tracer`) and merge in
one PR — no phase gets its own PR (constitution II).

## Phase 1 — capTrace preserves the tail (R1)

- [x] Rewrite `capTrace` (`spec-bridge/gates/bridge.mjs`) to keep head + tail with the
      middle elided, total within the existing `TRACE_CAP` budget; the tail gets the
      larger share since it carries the `node --test` verdict
- [x] Truncation marker names which part was dropped (elided middle), not just a byte count
- [x] Strings at or under `TRACE_CAP` still pass through unchanged, no marker
- [x] Non-string input keeps its current pass-through behaviour

## Phase 2 — child env drops the trace var (R2)

- [x] `runGateCommand` builds a child env with `SPEC_BRIDGE_GATE_TRACE` absent (not `""`,
      not `"0"` — `tracePath()` treats any truthy value as on)
- [x] `SPEC_BRIDGE_GATE_ACTIVE: "1"` still set on the child
- [x] Parent `process.env` not mutated — the strip is child-scoped only

## Phase 3 — regression tests, negative-controlled (R3)

- [x] Test: a capped capture whose failure text is in the last ~1000 chars still contains
      that text
- [x] Test: a spawned gate child's env lacks `SPEC_BRIDGE_GATE_TRACE` and still carries
      `SPEC_BRIDGE_GATE_ACTIVE` (via the injectable `spawn`, no real subprocess)
- [x] Negative-control both: revert each fix, confirm the matching test actually FAILS,
      restore; record in the commit that the control really broke the behaviour
- [x] `node --test` green

## Phase 4 — release obligations and re-ground

- [ ] Marketplace version bump + touched skill `version:`; `sync-version.mjs --check` green
- [ ] New tests cataloged in `docs/wiki/test-suite-catalog*` AND pinned as sources
- [ ] Honest re-pin of notes sourcing `bridge.mjs` (classify RE-PIN-ONLY vs NEEDS-REVIEW
      against the real diff; amend prose before bumping)
- [ ] All project gates green: `node --test`, `check-docs.mjs`, `sync-version.mjs --check`,
      `gen-marketplace.mjs --check`, wiki freshness
