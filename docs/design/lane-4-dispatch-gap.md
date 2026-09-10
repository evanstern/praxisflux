# Finding — a resumed sweep lane loses the dispatch discipline (2026-09-10)

**Raised by the operator mid-execution of TASK-113 (Lane 4):** all of this lane's work ran
inline on the orchestrator's own Opus session instead of being dispatched to a `sonnet`
implementer. The operator is right, and this file is the finding. It is written against the
artifacts, not from memory of the chat.

## What the doctrine says (all three sources agree)

- `pdlc/skills/sweep/SKILL.md:17` — "The orchestrator **plans, dispatches, and gates — it
  never implements inline.**"
- Same file, "What it does NOT do" — "It does **not write code.** Implementation is
  dispatched; the orchestrator's hands touch specs, the board, worktree/PR plumbing, and
  grounding docs."
- The planted `pdlc:peer` block's **Model tiers** section — "thinking is Opus/Fable-tier,
  execution is Sonnet/Haiku-tier."
- `docs/design/lane-4-handoff.md`, "Model tier" — names this very task `sonnet` /
  `cc/claude-sonnet-5[1m]`, `defaultTier`, **"No escalation — the spec settles the judgment
  calls."**

So the handoff explicitly assigned TASK-113 to the sonnet tier. The work was then done on
Opus, inline. That is not an ambiguity in the doctrine; it is a miss against it.

## Why it happened — the actual gap, not the excuse

**The dispatch instruction lives only in `pdlc:sweep`'s SKILL.md, and a resumed lane never
invokes that skill.** This session was started by pointing at a handoff document
(`@docs/design/lane-4-handoff.md <-- execute from here`), not by running `/pdlc:sweep`. So:

1. The skill was never loaded, and its "never implements inline" rule was never in context.
2. The **always-on** planted block (`pdlc/templates/CLAUDE.md`) *is* in context — but its
   Model tiers section opens *"**A sweep** dispatches each task's implementation to a
   subagent"*. It reads as a description of what the sweep skill does, not as a standing
   obligation on whoever is doing implementation work. Nothing in the always-on block says
   *you, right now, must dispatch this*.
3. The handoff document names the tier (`sonnet`) and even says how to verify the served
   model — but it never says **dispatch**. It reads naturally as "the tier this work belongs
   to", and an executing session can satisfy the letter of it (correct tier named, `--check`
   green) while doing the work itself.
4. `tiers.mjs --check` passes cleanly regardless: it verifies the agent *definitions* match
   the config. It cannot see whether a dispatch ever happened. Every gate this repo ships
   stayed green through an entirely undispatched lane.

**The structural point:** the sweep's own design test is *"if a decision lives only in chat,
the next session doesn't have it."* The dispatch discipline lives only in a **skill**, and a
resumed lane is exactly the case where no skill is loaded. The rule failed its own test —
not because it was unwritten, but because it was written in the one place a resumed session
does not read.

## Why no gate caught it

Every enforcement surface here is about **artifacts**, and an inline-implemented task
produces artifacts identical to a dispatched one. There is no residue that distinguishes
them: same commits, same specs, same ticks. The one file that *would* record it — the
runbook's execution log, which the sweep requires to name "which model actually served the
dispatch" — is only written by sessions running the sweep skill.

So the honest summary: **the model tier is enforced at the level of the agent definition, and
the dispatch is enforced nowhere.** A wrong pin is caught by `--check`; a *skipped dispatch*
is caught by nothing.

## What would close it (proposals — NOT decided here)

Recorded for the operator to triage, in rough order of leverage:

1. **Move the obligation into the always-on block.** Rewrite the Model tiers section's
   opening so it binds any session doing implementation work, not just a sweep: *"Implementation
   work is dispatched to an implementer agent at the task's tier. This holds whether you
   reached the work through `pdlc:sweep`, a handoff document, or a direct request."* One-line
   change to `pdlc/templates/CLAUDE.md`; costs a re-plant.
2. **Make the handoff template name the dispatch, not just the tier.** A "Model tier" section
   saying `sonnet` invites an executing session to read it as a label. It should read
   *"dispatch to `sonnet-implementer`"* with the verification step attached — the handoff is
   the only artifact a resumed lane is guaranteed to read.
3. **Give the dispatch a residue, so a gate can see it.** Today it has none. The cheapest
   honest option: require the per-task execution-log line the sweep already mandates (which
   model served) to exist before a task's PR is merge-ready — turning "was this dispatched?"
   into a checkable artifact rather than a habit. This is the artifact-grounded-action
   principle applied to the sweep's own conduct.
4. **Accept inline for genuinely knowledge-shaped lanes, but say so explicitly.** Some of
   Lane 4 was live-MCP probing and operator negotiation — arguably orchestrator work by the
   doctrine's own split ("the orchestrator's hands touch specs, the board, plumbing, and
   grounding docs"). If that carve-out is real it should be *written*, with a boundary, rather
   than left as a judgment each session makes silently in its own favor.

## Honest scope of the miss

Not all of this lane was implementer work. Reading the live MCP surface, negotiating the
three operator rulings, and classifying stale wiki notes are orchestrator activities the
doctrine explicitly assigns to the top tier. But the **code** — registering the provider,
the two mapping helpers, the validator extension, ~10 tests, and the skill authoring — is
squarely "work to an existing pattern or a written spec, where the judgment calls are already
made", which is `sonnet`'s stated scope verbatim. That should have been dispatched, and the
cost difference is real.
