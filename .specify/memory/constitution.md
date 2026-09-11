# praxisflux constitution

## Preamble

`docs/principles.md` is the upstream canonical statement of praxisflux's foundational
("101") principles. Per that document's own instruction, a downstream governance artifact
"should reference this document and add only its domain-specific application — not
re-derive or duplicate the rationale." This constitution is that downstream artifact: each
article below is a short binding statement plus a pointer to its canonical source, not a
restatement of the reasoning behind it.

**Scope.** This constitution binds plans checked by `speckit-plan`'s constitution-check
step. An article earns its place here only because a plan could violate it and the check
could catch that violation — that is the test Tier A passed and Tier B/C failed in
`docs/design/constitution-candidates.md`.

**Doctrine, not constitution.** Worktree discipline, two-track landing, released-surface
versioning, and corpus-loading discipline are real rules, but they bind session and
workflow mechanics that a plan document does not decide — they are enforced where they
already live (the planted `CLAUDE.md` block, peer blocks, CI, hooks) and are deliberately
**not** articles here. The model-tier dispatch posture is likewise not an article:
`.claude/model-tiers.json` is the sole source of truth for tiers, by design, so the ladder
survives model churn without a second authority beside the config to keep in sync.

## Articles

### I. Artifact-Grounded Action

No work or decision happens without a durable artifact; state is derived from what exists,
never from a claim; a question an existing artifact or principle already answers is
resolved from it, not re-asked as a preference.

**Source:** `docs/principles.md` P1.
**Violation:** a plan that proposes a chat-only decision, untracked state, or re-asks a
question the plan of record already settles.

### II. One TASK, One PR

A TASK maps 1:1 to a pull request; an EPIC gets no PR of its own; a SUBTASK never gets its
own PR and lands as commits on its parent TASK's branch. A PR exists only where it carries
a stated reason for a human to approve.

**Source:** `docs/principles.md` P2.
**Violation:** a plan proposing multiple PRs for one TASK, a PR for a subtask, or a PR with
no reason-to-approve.

### III. Artifact-Gated Seams

Every pipeline-stage boundary re-derives its state from durable artifacts — never from what
arrived with the invocation. A trigger is a doorbell, never a contract; a payload is an
untrusted hint.

**Source:** `docs/principles.md` P3; `docs/wiki/handoff-protocol.md`.
**Violation:** a plan for inter-plugin or orchestrated work that has a stage trust a
payload's contents instead of re-reading the artifacts.

### IV. Gates: Status Never Exceeds Proven Artifacts

Every tracked status must be backed by disk evidence. When a gate blocks, the response is
to produce the missing artifact — never to argue with the gate or hand-edit derived state.

**Source:** `docs/wiki/gates-convention.md`; root `CLAUDE.md` "Rules that always hold".
**Violation:** a plan proposing a hand-set status, or a write to derived state in place of
the artifact that would prove it.

### V. Composition Through Files and Gates Only

Plugins never call each other directly. They compose only through files and gates; shared
plumbing lives in `lib/`, domain-specific content stays per-plugin.

**Source:** `docs/wiki/overview.md`; `docs/wiki/handoff-protocol.md`; `docs/skill-patterns.md`.
**Violation:** a plan proposing a cross-plugin import or a direct call between plugins.

### VI. Enforcement Posture: Advisory Local, Authoritative CI

Stop hooks are opt-in local pressure, never guaranteed present. CI is the authoritative
enforcement point. The one hard-blocking local surface is the opt-in root-guard hook,
planted but never wired by default.

**Source:** root `CLAUDE.md` enforcement block; `docs/wiki/gates-consumption-surface.md`.
**Violation:** a plan that makes a local hook load-bearing or treats it as mandatory
enforcement.

### VII. Grounding Freshness Is Part of Done

A change that touches a wiki note's pinned sources is not done until the wiki is re-pinned.
Docs are load-bearing, not decoration; every PR keeps them in sync.

**Source:** root `CLAUDE.md` docs block; `docs/wiki/grounding-wiki-plugin.md`.
**Violation:** a plan that scopes a source-touching change without its re-ground step.

### VIII. Amendment Procedure

Amendments to this constitution land as operator-signed PRs touching this file, under the
same one-task-one-PR rule as any other TASK, carrying a version bump — the house rules
apply to the constitution itself. Bump MAJOR for a redefinition or removal of an article,
MINOR for an added or materially expanded article, PATCH for wording or pointer
corrections.

**Source:** `docs/design/constitution-decision.md` (Q3).
**Violation:** an edit to this file outside a PR, without operator sign-off, or without a
version bump.

## Ratification

Ratified 2026-09-11 by operator decision, recorded in
`docs/design/constitution-decision.md`. Supersedes the unratified record left open by
TASK-0128.

**Version**: 1.0.0 | **Ratified**: 2026-09-11 | **Last Amended**: 2026-09-11
