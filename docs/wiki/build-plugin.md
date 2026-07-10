---
name: build-plugin
description: Implementation-leg plugin (scaffold) — picks up a SPEC handed off via .handoff/, builds and verifies it, and returns findings as a response handoff for educate to fold back in.
kind: component
sources:
  - build/.claude-plugin/plugin.json
  - build/README.md
  - build/skills/implement/SKILL.md
verified_against: 9047a2897ed3c173b2e0e6ed407e46b13a410e3f
---

# build plugin

The `build` plugin (v0.3.1) owns the implementation leg of the research → teach → build loop.
It was split out of `educate` (per `build/README.md`, in TASK-1.8) so that the plugin with the
context to say *what* to build (educate, which teaches and authors the SPEC) stays distinct
from the one that *builds* it and reports back. The two never call each other; they compose
only through the shared handoff transport.

## How it works

The single skill, `build:implement` (`build/skills/implement/SKILL.md`), runs three steps:

1. **Pick up the SPEC.** Read the pending handoff request addressed to build —
   `.handoff/<id>.md` with `kind: request`, `to: build` — whose body is the SPEC (what to
   build, constraints, done-criteria). In practice the lesson skill supplies the id. If no
   request exists, the skill says so and stops; it never invents a spec.
2. **Build and verify.** Implement the SPEC in the target location and verify by exercising
   the result — running it and driving the affected path, not just writing code. Deviations
   from the SPEC and decisions made along the way are treated as the valuable output.
3. **Return findings.** Write a correlated response handoff (`kind: response`, `from: build`,
   `to: educate`, `ref: <request id>`) whose body is the findings: what was built, how it was
   verified, and corrections the lesson should absorb. Then point the user back to
   `educate:lesson` for the return leg and deck.

Explicit non-goals, stated in the skill: it does not teach, plan lessons, write the deck or
guide, or mark the lesson done — educate closes the loop, and educate's DoD gate checks that
the fold-in actually happened.

**Scaffold status.** The README states plainly: "Scaffold — not yet implemented." What exists
today is the plugin manifest, the README, and the `implement` skill prose. The skill
references the shared transport `lib/handoff.mjs` (write/read/list/consume `.handoff/`
payloads) as a library, noting it is not a CLI; the plugin ships no gates, hooks, scripts, or
templates of its own yet.

## Connections

- Consumes SPEC requests from and returns findings responses to [[educate-plugin]], whose
  gate records the evidence (`handoff.specd/returned/foldedIn`) in `progress.json`.
- Both legs ride the gitignored `.handoff/` transport defined by [[handoff-protocol]],
  implemented in the [[chassis]] as `lib/handoff.mjs`.
- The skill's phase-separated, single-responsibility shape follows [[skill-patterns]].

## Operational notes

- No env vars, gates, or hooks — enforcement of the round trip lives on the educate side.
- Handoff payloads are transient (gitignored `.handoff/`); nothing build writes is tracked.
- Keywords in `build/.claude-plugin/plugin.json`: build, implement, handoff, spec.
