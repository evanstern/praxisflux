# 049 — implementation plan

## Constitution check

**This project has no ratified constitution.** `.specify/` is absent (this repo authors
its Spec Kit artifacts by hand under the sweep runbook's operator-signed escape line), so
there is no `constitution.md` to check this plan against. Stating that plainly is the
required substitute — the plan step is not ceremony, so it is checked against the
project's actual grounding instead:

| Grounding doc | What it binds here |
|---|---|
| `docs/corpus-spec.md` | the summary-style split rule, the 8,000-char body cap, the 500-char capsule cap, CAPSULES.md as derived state |
| `CLAUDE.md` (PDLC block) | corpus loading is INDEX/CAPSULES-first; `docs/wiki/` is load-bearing, not decoration |
| `docs/principles.md` | artifact-grounded action — every release entry cites real evidence, never recollection |
| `docs/releasing.md` | released surface ⇒ version bump; this task touches none, so no bump |
| `docs/design/gates-and-doctrine-sweep-runbook.md` | Lane 1, mechanical tier, zero-warn gate requirement, merge-commit landing |

**Conflicts found: none.** The one tension worth naming: the corpus spec's size cap is
what forces the split, and the split is what makes the note's own contract satisfiable.
The cap is doing its job here rather than obstructing — no exemption is sought, and
`size_budget_exempt` must **not** be used to dodge R1.

## Approach

Split first, backfill second. Reversing the order means writing entries into a note that
cannot hold them, then splitting under size pressure — which is how the parent ends at
7,9xx/8,000 again.

### Split shape (the design decision)

TASK-78's precedent is a summary-style parent with topic children. Applied here, the
natural axis is **chronological**, because the note is consumed by "when did rule X
arrive?" — a reader scans forward from a release. Proposed:

- **`pdlc-sweep-history.md`** (parent, keeps the name — inbound `[[pdlc-sweep-history]]`
  links must keep resolving): the entry point. Keeps the framing paragraph, a compact
  release→child index, and the superseded-conventions summary that downstream hosts need
  without loading detail.
- **`pdlc-sweep-history-early.md`**: the older releases through the split point.
- **`pdlc-sweep-history-recent.md`**: the newer releases, including the three backfilled
  ones — this is the child that must retain headroom, since it receives every future
  sweep-doctrine release.

The exact split point is the implementer's call, chosen so both children land
comfortably under cap **with the three new entries already written in**, not before.
If the arithmetic shows two children are not enough to leave R1's headroom, three is
fine — record the reason in the phase notes.

**Naming constraint:** `pdlc-sweep-history` must remain the parent's name. Renaming it
breaks `[[pdlc-sweep-history]]` in `pdlc-sweep.md` and any other inbound link, and the
freshness gate only *warns* on broken wikilinks — it would not catch the regression.

### Sources and pins

Each note carries honest `sources:` and a `verified_against:` pin. The children inherit
the parent's sources (`pdlc/skills/sweep/SKILL.md`,
`pdlc/skills/sweep/templates/runbook.md`) because they describe exactly that surface's
history. **Pin discipline:** pins are set to this branch's own commits, and only after
the commit that wrote the prose — never to a merge commit as justification. This branch
is pin-carrying, so it merges `origin/main` in and never rebases.

### Hub note sources (R3)

Recommend **real sources**: list the two (or three) child note paths plus
`test-suite-catalog-plugins-gates.md` / `-pipeline.md`. The hub asserts those children
exist and are named as stated, which is a genuine invalidation condition — rename a
child and the hub should go stale. Confirm against `docs/corpus-spec.md` that note paths
are legal sources; if the spec restricts sources to code, fall back to the `test/` files
the children catalog and record why in the phase notes.

## Risks

- **Regenerating CAPSULES.md is mandatory and easy to forget** — every `description:`
  change (three new notes, at least one edited) invalidates it, and the gate fails on a
  stale one. Regenerate as the last step of the last phase, then re-run the gate.
- **Broken wikilinks only warn.** The gate will not fail on a dangling `[[link]]`, so
  reciprocal-link verification (R2) is a manual read, not a gate pass. Check both
  directions explicitly.
- **Body-length measurement must match the gate's**, i.e. frontmatter excluded. Measure
  with the gate itself rather than by eye.

## Verification

Run in the worktree, and again after any history move:

```
node --test
node scripts/check-docs.mjs
node grounding-wiki/gates/cli.mjs freshness . docs/wiki    # must be 0 warns
```

The zero-warn requirement is the sharp edge: today's run reports one warn, and it is
this task's to clear.
