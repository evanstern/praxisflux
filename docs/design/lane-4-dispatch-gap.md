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

## What will close it — TRIAGED, then AMENDED on review (2026-09-10)

Triaged by the operator on 2026-09-10 (initially: adopt all four), then **amended the same
day** after a sister session that had independently found this gap reviewed the analysis. The
amended set is authoritative; TASK-0125's ACs and comment #2 carry the same decision.

**The correction that matters: these are not alternatives.** Fixes 1, 2 and 5 are
**necessary**; only fix 3 is **sufficient**. Doctrine placement closes the *honest* miss —
a session that would have complied had it known — while leaving the gap fully open to a
session under time pressure. Only a residue makes a skipped dispatch *detectable*. The
original AC phrased this as "residue OR carve-out", which let the cheap half satisfy it:
precisely the failure mode of naming a tier and then implementing inline.

**Adopted: 1, 2, 3, and a fifth candidate. Rejected: 4.** Sequencing: 1, 2 and 5 are prose
changes to planted/template surface and can ride one PR; **3 changes enforcement and gets its
own spec.**

In rough order of leverage:

1. **Move the obligation into the always-on block.** Rewrite the Model tiers section's
   opening so it binds any session doing implementation work, not just a sweep: *"Implementation
   work is dispatched to an implementer agent at the task's tier. This holds whether you
   reached the work through `pdlc:sweep`, a handoff document, or a direct request."* One-line
   change to `pdlc/templates/CLAUDE.md`; costs a re-plant.
2. **Make the handoff template name the dispatch, not just the tier.** A "Model tier" section
   saying `sonnet` invites an executing session to read it as a label. It should read
   *"dispatch to `sonnet-implementer`"* with the verification step attached — the handoff is
   the only artifact a resumed lane is guaranteed to read.
3. **Give the dispatch a residue, so a gate can see it — THE SUFFICIENT FIX.** Today it has
   none. The cheapest honest option needs **no new machinery**, because the record already
   exists in doctrine: the sweep already requires **tier + model ID + justification recorded
   on the board task at dispatch time**. So the rule is:

   > A task's PR is not merge-ready until its board task carries a dispatch record naming the
   > model that actually served.

   It **fails closed** — no record, no merge — and the check reads a card the gate already
   reads, so it adds no surface. (An earlier draft of this doc proposed the runbook's
   execution-log line instead; the board-task record is strictly better, since the runbook
   line is prose in a document nothing parses.) This is artifact-grounded action applied to
   the sweep's own conduct.
4. **~~Accept inline for genuinely knowledge-shaped lanes~~ — REJECTED, and worth recording
   as rejected.** The tempting version: some of Lane 4 was live-MCP probing and operator
   negotiation, arguably orchestrator work by the doctrine's own split. But **"knowledge-shaped"
   is not a boundary** — every lane can be argued into it after the fact, which is exactly how
   the Lane 4 miss would be retroactively legitimized. A written carve-out is a written excuse.

   The decisive evidence is this repo's own history: `docs/design/sweep-cost-levers-runbook.md`
   dispatched **TASK-86, TASK-87 and TASK-88** — all pure doctrine/prose edits to
   `pdlc/skills/sweep/SKILL.md` — to an **opus implementer** rather than doing them inline,
   logging each one's subagent token count. The precedent already refutes "knowledge work is
   orchestrator work."

   If inline is ever right, it should be an **operator checkpoint recorded before the work**,
   structurally identical to how escalation is already handled: same shape, same audit trail,
   no new category.

5. **Make the handoff document itself the dispatch — the highest-leverage fix, and the one
   this analysis originally missed.** The other fixes add information; this one fixes *role*.
   A handoff is prose a session reads and then acts on, so by the time a resumed session
   reaches a "Model tier: `sonnet`" field it has *already become* the implementer — the field
   reads as a label on work it is doing, not an instruction about who should do it. Put the
   role assignment in the **opening line**, before the reader learns what the work is:

   > You are the **orchestrator** for this lane, not its implementer. Dispatch the
   > implementation to `<tier>-implementer` and verify the served model before proceeding.

   This targets the actual mechanism — **role ambiguity at resume** — rather than missing
   information, and it is the precise diagnosis of what happened in Lane 4.

## Honest scope of the miss

The **code** — registering the provider, the two mapping helpers, the validator extension,
~12 tests, and the skill authoring — is squarely *"work to an existing pattern or a written
spec, where the judgment calls are already made"*: `sonnet`'s stated scope, verbatim. It
should have been dispatched, and the cost difference is real.

A first draft of this section also claimed the live-MCP probing, the operator negotiation,
and the wiki classification were legitimately orchestrator work. **That claim is withdrawn**
— it is the carve-out of rejected fix 4, arriving through the back door as a
scope-of-the-miss argument. Two reasons it does not hold:

- The repo's own precedent goes the other way (TASK-86/87/88: pure doctrine edits,
  dispatched to an implementer).
- More tellingly, it is *self-serving and unfalsifiable*. Every category I placed outside
  the miss happened to be a category I had already done inline. A boundary drawn after the
  work, by the party that did the work, is not a boundary.

What survives: the operator negotiation was genuinely orchestrator work, because the
doctrine makes operator checkpoints the orchestrator's own responsibility and a subagent
cannot hold them. Everything else in this lane was dispatchable. The gap in
`docs/design/lane-4-handoff.md` that produced the miss is that its "Model tier" section
named a tier without ever saying *dispatch* — fix 5 above.
