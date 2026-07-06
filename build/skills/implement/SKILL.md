---
name: implement
description: Implement a build SPEC handed off from a learning lesson (or any producer), verify it works, and return findings for the lesson to fold back in. Use when a lesson has handed off a SPEC to build, when the user says "run build", "/build-me", "build the spec", or points at a pending handoff request. This plugin OWNS the implementation leg — educate teaches and authors the SPEC; build implements it and returns what it learned.
---

# build:implement — the implementation leg

educate teaches and writes the **SPEC**; this plugin **builds it** and returns **findings**. The
two never call each other — they compose through the shared handoff transport (`.handoff/`, see
`docs/handoff-protocol.md`). Keeping build separate means the thing that has the context to say
*what* to build (educate) stays distinct from the thing that *builds* it and reports back.

## Step 1 — Pick up the SPEC (a handoff request)
Find the pending request addressed to build:
```
node ${CLAUDE_PLUGIN_ROOT}/../lib/handoff.mjs   # (library, not a CLI) — list via the lesson skill
```
In practice the lesson skill tells you the id; read `.handoff/<id>.md` (kind: `request`, to:
`build`). Its body is the SPEC — what to build, constraints, done-criteria. If no request exists,
say so and stop; do not invent a spec.

## Step 2 — Build it, and verify it works
Implement the SPEC in the target location. **Verify by exercising it**, not just by writing code —
run it, drive the affected path, observe the behavior. Note what the SPEC got wrong or under-specified,
and any decision you had to make: that is the valuable part of the return trip.

## Step 3 — Return findings (a handoff response)
Write a response handoff correlated to the request:
- `kind: response`, `from: build`, `to: educate`, `ref: <request id>`.
- Body = **findings**: what was built, how it was verified, corrections the lesson should absorb
  (things that differed from the SPEC, gotchas, better framings discovered while building).

Then point back: **"return to the lesson (teach-me) for the return leg + deck."** Do **not** write
the deck or edit the lesson yourself — folding findings back in is educate's return leg, and the
DoD gate checks that it actually happened (evidence + durable residue).

## What this plugin does NOT do
- It does not teach, form the lesson plan, or write the deck/guide (that's educate).
- It does not mark the lesson done. It returns findings; educate closes the loop.

## Bundled resources
- Uses the shared transport `lib/handoff.mjs` (write/read/list/consume `.handoff/` payloads).
