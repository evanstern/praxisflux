# Constitution decision record — TASK-0133 (2026-09-11)

**Status:** decided — operator ruled on every open item of
`docs/design/constitution-candidates.md` in session, 2026-09-11. This record is the
drafting contract; the constitution is written against it and nothing else.

## The rulings

- **Tier A:** constitutional, with one removal — **A7 (tiered execution) is OUT**
  (see Q4). Articles: A1 (artifact-grounded action / P1), A2 (one TASK, one PR +
  reason-to-approve / P2), A3 (artifact-gated seams / P3), A4 (gates — status never
  exceeds proven artifacts), A5 (composition through files + gates only), A6
  (enforcement posture — advisory local, authoritative CI), A8 (grounding freshness
  is part of done).
- **Tier B:** doctrine, 4 for 4 — B1 (worktree discipline), B2 (two-track landing),
  B3 (released-surface versioning), B4 (corpus loading) are NOT constitutionalized.
  They remain enforced where they live (planted block, peer blocks, CI, hooks).
- **Tier C:** agreed — not constitution material.
- **Q2 (preamble):** yes — the constitution opens with a preamble naming
  `docs/principles.md` as the upstream source, per that document's own instruction;
  articles are domain-specific application only, stated short with pointers, never
  re-derived rationale.
- **Q3 (amendment procedure):** agreed as proposed AND itself a constitutional
  article: amendments land as operator-signed PRs touching
  `.specify/memory/constitution.md`, one task one PR, with the version bump — the
  house rules apply to the constitution itself.
- **Q4 (model tiers):** **no article.** `.claude/model-tiers.json` is the source of
  truth by design, to ease adoption of non-Anthropic or local models (work already
  started on the board). Constitutionalizing even the posture would put a second
  authority beside the config; the dispatch obligation stays doctrine in the planted
  block.

## What the draft therefore contains

1. Preamble: upstream reference to `docs/principles.md`; scope (what this
   constitution binds: plans checked by `speckit-plan`'s constitution-check step);
   the doctrine/constitution boundary as ruled above.
2. Eight articles: A1, A2, A3, A4, A5, A6, A8, plus the amendment-procedure article
   (numbered last). Each: a short binding statement + canonical-source pointer +
   what a violating plan looks like.
3. Ratification block: ratified 2026-09-11 by operator decision (this record);
   supersedes the unratified record of TASK-0128.

Provenance: candidate list `docs/design/constitution-candidates.md` (capsule-grounded,
2026-09-11); operator rulings in session, quoted: "B1: Doctrine / B2: Doctrine / B3:
Doctrine / B4: Doctrine — 4 for 4"; Tier C "Agreed here as well, non doctrine"; Q2
"Yes"; Q3 "Agreed and should be a constitutional-level itself"; Q4 "No,
model-tiers.json is supposed to be the source of truth to ease use of non Anthropic
models or local models if/when we do add that".
