# build — implement a handed-off SPEC, return findings

The implementation leg of the research → teach → build loop. One skill, `implement`:
educate teaches and authors the **SPEC**; build **implements it** and returns **findings**
for the lesson to fold back in. Split out of educate in TASK-1.8 so the plugin with the
context to say *what* to build stays distinct from the one that builds it and reports back.

`implement` runs the leg in three steps:

1. **Pick up the SPEC** — read the pending handoff request addressed to build
   (`.handoff/<id>.md`, `kind: request`, `to: build`); its body is the SPEC — what to
   build, constraints, done-criteria. No pending request, no work — it never invents a spec.
2. **Build and verify** — implement the SPEC in the target location and verify by
   *exercising* the result (run it, drive the affected path), not just by writing code.
   Deviations from the SPEC and decisions made along the way are noted deliberately:
   that is the valuable part of the return trip.
3. **Return findings** — write the correlated response handoff (`kind: response`,
   `from: build`, `to: educate`, `ref: <request id>`) — what was built, how it was
   verified, corrections the lesson should absorb — then point back to `educate:lesson`
   for the return leg + deck. Folding findings in is educate's job, and its DoD gate
   checks that it actually happened.

The two plugins never call each other — both legs ride the shared handoff transport
(gitignored `.handoff/`, chassis module `lib/handoff.mjs`; see `docs/handoff-protocol.md`).

**Skill-only by design.** build ships no gates, scripts, or hooks — like `pdlc`, it is a
skill-only plugin, a supported shape in this suite. It has no lifecycle of its own to
gate: enforcement of the round trip lives on the educate side, whose DoD gate holds the
evidence that the SPEC went out and the findings came back.

```
/build:implement        # pick up the pending SPEC request and run the implementation leg
```
