# Constitution candidates — discussion input for TASK-0133 (2026-09-11)

**Status:** discussion input — not a decision record. The operator picks which candidates
are constitutional; the picks land in a decision record (AC #1), then drafting dispatches
(`speckit-constitution` is the tool; the ratified text replaces the unratified record in
`.specify/memory/constitution.md`).

**The framing rule, from the corpus itself:** `docs/principles.md` is the canonical
statement of the 101 principles and says downstream governance artifacts "should reference
this document and add only its domain-specific application — not re-derive or duplicate
the rationale." So every article below is proposed as a **short binding statement + a
pointer to its canonical home**, never a restatement. The constitution's job in Spec Kit
is specific: it is what `speckit-plan`'s constitution-check step checks a plan against.
That gives a selection test: **a candidate earns an article only if a plan could violate
it and the check could catch that.** Posture that no plan decision can violate is
doctrine, not constitution.

Each candidate: what the article would bind · canonical source · recommendation.

---

## Tier A — recommended constitutional (plan-checkable, load-bearing)

**A1. Artifact-grounded action (P1).** No work or decision without a durable artifact;
state is derived from artifacts, never from claims; an answered question is resolved from
the artifact, not re-asked. — Source: `docs/principles.md` P1; planted block "Rules that
always hold". A plan violates this by proposing chat-only decisions or untracked state;
the check catches it.

**A2. One TASK, one PR + the reason-to-approve test (P2).** TASK↔PR is 1:1; EPICs and
SUBTASKs get no PR; a PR exists only where it carries a stated reason for a human to
approve. — Source: `docs/principles.md` P2. Plans that propose multi-PR tasks or
subtask PRs violate it directly.

**A3. Artifact-gated seams (P3).** Pipeline stages re-derive state from artifacts at
every boundary; triggers are doorbells, payloads are untrusted hints. — Source:
`docs/principles.md` P3; `docs/wiki/handoff-protocol.md` (the `.handoff/` transport is
its implementation: payloads gitignored, evidence tracked). Plans for anything
inter-plugin or orchestrated can violate this by designing payload contracts.

**A4. Gates: status never exceeds proven artifacts.** Every tracked status must be
backed by disk evidence; when a gate blocks, produce the missing artifact — never argue
with the gate or hand-edit derived state. — Source: `docs/wiki/gates-convention.md`;
planted block. Plans violate it by proposing hand-set statuses or derived-state writes
(the bridge's Done flip being sync-only is this article applied).

**A5. Composition through files + gates only.** Plugins never call each other; they
compose through files and gates; shared plumbing in `lib/`, domain content per-plugin.
— Source: `docs/wiki/overview.md`, `docs/wiki/handoff-protocol.md`,
`docs/skill-patterns.md`. A plan proposing a cross-plugin import or direct call is the
violation.

**A6. Enforcement posture: advisory local, authoritative CI.** Stop hooks are opt-in
local pressure; CI is the authoritative enforcement point; the only hard-blocking local
surface is the opt-in root-guard hook, planted never wired. — Source: root `CLAUDE.md`
enforcement block; `docs/wiki/gates-consumption-surface.md`. Plans violate it by making
a local hook load-bearing or mandatory.

**A7. Tiered execution: thinking Opus/Fable, execution dispatched at the cheapest
holding tier.** Implementation is dispatched, never inline (no knowledge-shaped
exemption); escalation is an operator checkpoint recorded before the work; served model
verified and recorded (`Dispatch:` line) per dispatch. — Source: planted block "Model
tiers"; `.claude/model-tiers.json`; `docs/wiki/pdlc-grounding-block.md`. Plans violate
it by budgeting inline implementation or unpinned dispatches.

**A8. Grounding freshness is part of done.** Changes touching pinned sources aren't done
until the wiki is re-pinned honestly (classify against the diff — RE-PIN-ONLY vs
NEEDS-REVIEW; a merge commit is a re-pin target, never a justification). Docs are
load-bearing; every PR keeps them in sync. — Source: root `CLAUDE.md` docs block;
`docs/wiki/grounding-wiki-plugin.md`; sweep concurrency doctrine. Plans violate it by
scoping a source-touching change without its re-ground.

## Tier B — candidates the discussion should settle (arguably doctrine)

**B1. Worktree discipline.** All branch work in worktrees; root stays on main, clean —
the shared read surface. — Source: root + user `CLAUDE.md`. Plan-checkable (a plan
proposing root-checkout branch work violates it), but it's workflow mechanics more than
a design principle — and it's already enforced by the opt-in root-guard hook and
standing instructions. Constitutionalizing it is redundant unless you want the plan
check to catch it too.

**B2. Two-track landing.** Board/bookkeeping commits direct to main; deliverables by PR;
the claim flip rides the branch. — Source: planted peer block. Same shape as B1:
real rule, but it's P2 applied to a peer, and the peer block already carries it.
Principle-of-application, not principle.

**B3. Released-surface versioning.** Any released-surface edit bumps skill + marketplace
versions in lockstep; merge commits only (pins). — Source: `docs/releasing.md`;
`docs/wiki/release-pipeline.md`. CI already enforces it mechanically; an article adds
plan-time visibility but no new bindingness. Suggest: doctrine, referenced from the
constitution's "enforced elsewhere" preamble if at all.

**B4. Corpus loading discipline.** INDEX/CAPSULES-first, notes just-in-time, never
bulk-load. — Source: planted block; `docs/wiki/grounded-corpus-spec.md`. This binds
session behavior, not plan content — a plan can't really violate it. Suggest: doctrine.

## Tier C — noted and recommended against (not constitution material)

- **Procedural-prose style, turn hygiene, commit-message form** — operational habits;
  no plan-time check.
- **Specific tool choices** (Backlog.md, 9router model-ID spellings, `specify` CLI) —
  the principles doc deliberately states rules tool-agnostically; tools are peers and
  config, revisable without amendment.
- **Sweep/design-rounds/refactor-triage procedure** — lives in versioned skills with
  their own doctrine history; freezing it in a constitution creates a second source
  that drifts.

## Open questions for the discussion

1. Tier B: which, if any, get promoted? (My recommendation: none — B1/B2 are enforced
   applications of A-tier articles; B3/B4 are mechanically enforced or unenforceable
   at plan time.)
2. Does the constitution carry a preamble pointing at `docs/principles.md` as upstream
   (per its own instruction), with articles as domain-specific application only?
   (Recommended: yes — it keeps the no-duplication rule and gives Coda-style consumers
   the same pattern.)
3. Amendment procedure: Spec Kit's template expects one. Proposal: amendments are
   operator-signed PRs touching `.specify/memory/constitution.md`, one-task-one-PR,
   with the version bump — i.e. the house rules apply to the constitution itself.
4. Does A7 (tiers) belong in a constitution that outlives model families? The ladder
   lives in `.claude/model-tiers.json` precisely so doctrine survives model churn —
   the article would bind the *posture* (dispatch, verify, record), not the models.
