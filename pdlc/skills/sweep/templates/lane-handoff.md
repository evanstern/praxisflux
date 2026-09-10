# {{LANE_TITLE}} — lane handoff ({{DATE}})

**You (the session reading this) are the ORCHESTRATOR for this lane, not its implementer.**
Dispatch the implementation to `{{TIER}}-implementer` and verify the served model before
proceeding.

<!-- R5: this role assignment is the FIRST thing on the page, before the reader learns
     anything about the work, and it is prose — not a field, not a table row, not a
     "Model tier" section near the bottom. A handoff is prose a session reads and then
     ACTS ON: by the time a tier appears as a label, the reader has already cast itself as
     the implementer and the label reads as a note about work it is already doing. Field
     case: 2026-09-10, Lane 4 of the TASK-108 sweep ran an entire task inline on the
     orchestrator's Opus session while `docs/design/lane-4-handoff.md` named `sonnet` in a
     field two screens down (`docs/design/lane-4-dispatch-gap.md`, fix 5). Role before
     content, or this template does not fix that bug. Do not move these lines. -->

**Not the `.handoff/` transport.** This file is a *session-portable lane contract* — prose one
orchestrator session writes for the next. It has nothing to do with `docs/handoff-protocol.md`
or `lib/handoff.mjs`, which are the **inter-plugin** `.handoff/` payload transport (gitignored,
machine-written, consumed by a peer plugin). Same word, different mechanism; a future reader
will conflate them.

**Lane:** {{lane name/number}} · **Scope:** {{task ids + which phases remain}} ·
**Runbook:** `{{path/to/runbook.md}}` · **Repo state when written:** root on `main` at
{{sha}}, {{clean|dirty}}, {{pushed|unpushed}}, {{version stamp}}, CI {{green|red — why}}

This file plus the runbook plus the board are the whole contract. **No decision below lives
only in a chat log** — if it is not here, in the runbook, in the spec dir, or on the card, the
next session does not have it.

## How to use this file

Everything below is **dispatch-prompt material, not a work order for you.** You assemble it
into per-phase implementer prompts, run the gates, hold the operator checkpoints, and merge.
Your own hands touch specs, the board, worktree/PR plumbing, and grounding docs — never the
implementation. See the always-on PDLC grounding block's **Model tiers** section, which binds
you however you arrived here.

## Dispatch

**Dispatch every remaining phase to `{{TIER}}-implementer`** — model `{{MODEL_ID}}`, fallback
`{{FALLBACK_MODEL_ID}}` if the subscription lacks the primary. Justification:
{{rubric justification — why this tier and not the one above}}.

<!-- R2: the tier appears here as an INSTRUCTION with the verification step attached, never
     as `Model tier: {{TIER}}`. A bare label is satisfiable by a session working inline
     (right tier named, `tiers.mjs --check` green, zero dispatches). Keep the imperative. -->

- **Escalation:** {{none — the spec settles the judgment calls | ESCALATED to <tier>, operator
  checkpoint recorded <where> on <date>}}. An escalation tier is an operator checkpoint
  recorded **before** dispatch, never an implementer's or orchestrator's own call.
- **Verify the served model from the first dispatch's transcript before launching siblings.**
  A green `tiers.mjs --check` proves the file says `{{TIER}}`; it cannot prove `{{TIER}}` ran,
  and it cannot see whether a dispatch happened at all. Read the per-request record, not the
  agent's self-report.
- **Record the dispatch on the board task** — tier, the model ID pinned, and the model that
  **actually served** — at dispatch time. That record is the only residue distinguishing a
  dispatched task from an inline-implemented one: the commits, specs, and ticks are identical.
- **Dispatch phase-scoped:** one fresh implementer per `tasks.md` phase, re-grounded from the
  spec dir plus the branch's commits. Nothing passes between phases via chat context.
- {{HOST_DISPATCH_NOTES — harness quirks that bit this sweep, e.g. "dispatch serially: one
  session cannot host concurrent dispatches across sibling worktrees on this harness", or
  "none"}}

## Read first, in this order

1. `{{path/to/runbook.md}}` — {{which lanes are signed off; which findings are checkable gate
   lines rather than prose}}
2. `specs/{{NNN}}-{{slug}}/{spec,plan,tasks}.md` — {{note anything that is a stub vs real}}
3. {{branch-only artifacts a resuming session would miss — e.g. `specs/NNN-*/findings/*.md`
   that exist on the branch and NOT on `main`; say so explicitly, or "none"}}
4. `{{board view command for the scoped tasks}}` — live state; other sessions move it.
5. {{host docs the work resolves against, or "none"}}

## Where the work sits

- **Branch `{{branch}}`** — {{exists and pushed | not yet cut}}, parked at {{sha}} in worktree
  `{{.worktrees/... path}}`. It carries {{what has landed: which phases, ticks, notes}}.
- **Relative to `main`:** {{behind by <what range> — merge `origin/main` in before anything
  (merge, never rebase: pin-carrying/pushed-claim branch) | current}}.
- **Claim state:** {{already claimed — card In Progress, `Spec: specs/NNN-slug` marker
  present, phase ACs seeded; DO NOT re-claim | unclaimed — the first commit claims it}}.
- **One task, one PR:** the remaining phases ride this same branch and merge in its single PR.

## Already proven — do not re-derive (spend nothing re-testing this)

<!-- The most expensive thing a resuming session does is re-establish what the last one
     already measured. Each line is a fact with the artifact that carries it. -->

- {{finding, and the artifact it discharged — e.g. "marker block survives a write→read cycle
  idempotently; discharges runbook finding F1"}}
- {{constraint the implementation must tolerate, with why}}
- {{corrections to the spec discovered in flight — wrong tool names, wrong API shapes}}

## Still owed

- {{deliberately-unticked box, why it is unticked, and which phase must not proceed without
  it — e.g. "the resolution quirk: untested, permission boundary declined the transition;
  owed BEFORE Phase 3 relies on backwards moves"}}
- {{work the last session judged out of scope but a later phase needs}}

## Operator-authorized scope — read before any {{write|mutation|external call}}

<!-- Authorization is an artifact, not a memory. State what was authorized, by whom, when,
     and what is explicitly NOT authorized. If two operator answers conflict, say so and
     name the reading you are acting on plus the confirmation still owed — never present a
     reconstruction as the authorization itself. -->

- **In scope:** {{sites/projects/systems, and the operations authorized}}
- **NOT in scope:** {{explicitly excluded targets, and do not wait on pending access}}
- **Confirmations still owed before the first {{mutation}}:** {{one-liners, or "none"}}
- **Never-commit list:** {{secrets/coordinates/identifiers that must not land in a tracked
  file, and why — e.g. this repo is public and auto-publishes a Release on every merge}}
- **Decisions that are the operator's, not yours:** {{policy calls to propose-then-ratify,
  each with the moment it resurfaces, or "none"}}

## Gates and execution rules that already bit this sweep

<!-- Only rules a session HERE learned the hard way. Generic doctrine lives in the runbook
     and the planted block; duplicating it here dilutes the ones that cost something. -->

- {{rule, with the near-miss or failure that produced it}}
- **Gates before PR:** {{verbatim invocations, in order}}
- {{re-ground obligations the merge triggers}}

## Done means

{{The checkable end state: which tasks Done via which mechanism (never hand-set on a linked
card), how the PR must land (merge commit vs squash), which gates green on which branch,
grounding fresh, no stale worktrees, runbook log closed and status flipped.}}

Anything short of that gets reported as **exactly what remains** — every owed item above
included — not rounded up.

## Known open, not blocking

- {{pre-existing failure/flake a session would otherwise misdiagnose as its own, with the
  evidence that it is pre-existing, or "none"}}
