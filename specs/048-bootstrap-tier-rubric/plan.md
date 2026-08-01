# 048 — implementation plan

## Constitution check

**No ratified constitution exists in this repo** — there is no `.specify/memory/constitution.md`
and no `.specify/` directory at all (this host authors specs by hand; see spec.md). Stating that
plainly rather than treating the plan step as ceremony, this plan is checked against the
project's grounding docs instead:

- **`docs/principles.md`** — artifact-grounded action (the argument for planting rather than
  telling, spec.md); one TASK, one PR (everything below lands on one branch, one PR).
- **`CLAUDE.md`** — commit-often rule with task-id-led subjects and the `Co-Authored-By` trailer;
  worktree discipline (this work happens in `.worktrees/task-91`, root stays on `main`); merge
  commits, never squash.
- **`docs/releasing.md`** — released surface (plugin dirs, `lib/`, `scripts/`, `.claude-plugin/`)
  requires a marketplace bump plus every edited skill's own `version:`.
- **`docs/corpus-spec.md` / the freshness gate** — wiki notes are re-pinned in the same PR that
  changes their sources, and only after the prose is verified against the diff.
- **`docs/wiki/pdlc-plugin.md`, `pdlc-sweep.md`** — the notes whose sources this work edits.

## Surfaces this touches

| File | Change | Requirement |
|---|---|---|
| `pdlc/templates/CLAUDE.md` | new `## Model tiers — who does what work` section inside the `pdlc:grounding` markers | R1–R4 |
| `pdlc/skills/bootstrap/SKILL.md` | resolve-then-plant guidance for the IDs; the refresh path; `version:` bump | R3, R4 |
| `pdlc/skills/sweep/SKILL.md` | Phase 1 item 2 names the rubric's location; `version:` bump | R5 |
| `test/pdlc.test.mjs` | contract assertions for the new section and skill guidance | R6 |
| `CLAUDE.md` (repo root) | re-plant — the template edit drifts this repo's own block | per-PR gate |
| `docs/wiki/pdlc-plugin.md`, `docs/wiki/pdlc-sweep.md` | same-PR re-pins, classified | per-PR gate |
| `.claude-plugin/marketplace.json`, every `plugin.json`, `action.yml` | version lockstep via `scripts/sync-version.mjs` | per-PR gate |

**Not touched** (spec.md non-goals): `pdlc/scripts/plant.mjs` — the planting contract does not
widen to `.claude/agents/`. `.claude/agents/*.md` — this repo's defs already exist and are
correct; the work is doctrine, not re-pinning this repo.

## Approach

**Order matters: template first, then the skills that describe it, then the tests that pin it,
then the grounding that must agree with all three.** Each phase leaves the tree green.

1. **Template section (R1–R4).** Author the `## Model tiers` section. Keep it tight — the block
   is always-on context in every bootstrapped project. Content: the three-row ladder; the
   frontmatter mechanism with the 2026-07-31 citation; the authority rule (table = planted
   default, agent-def `model:` = authoritative at dispatch) with the one-line-edit refresh path.
   Placed after "Rules that always hold" and before the peer blocks, so it is inside the
   grounding markers and unaffected by peer stripping.

2. **Bootstrap skill (R3, R4).** Add the resolve-then-plant step: consult the `claude-api` skill
   for current IDs, check availability against the harness's agent-definition surface, use the
   fallback when the primary is unavailable, and record what resolved. Add the refresh path
   (re-run bootstrap for the doctrine; edit the agent def's frontmatter for a pin). Bump
   `version:` 0.8.0 → 0.9.0.

3. **Sweep skill (R5).** Phase 1 item 2 gains the location sentence naming both halves. One
   clause, no procedure change. Bump `version:` 0.17.0 → 0.18.0. **Read the result against the
   template section before moving on** — the two-way contract in R5 is the thing most likely to
   drift, and it is verified by reading, not by a test.

4. **Tests (R6).** Add to `test/pdlc.test.mjs` alongside the existing template-content tests.
   Assert the contract, not the prose: markers contain the section; the section names
   `.claude/agents` and a `model:` frontmatter pin; the field-case citation is present; the
   bootstrap skill instructs live resolution. Regex on stable anchors (paths, the marker names,
   `model:`), never on full sentences.

5. **Re-plant + version bump.** `node pdlc/scripts/plant.mjs --root . --peer backlog --check`
   first; diff the drift; re-plant with `--force`. **Standing operator convention: this repo's
   block may carry deliberate hand edits — diff against the old rendered template and relocate
   them, never clobber.** Note `spec-kit` is *not* an opted-in peer here. Then
   `node scripts/sync-version.mjs <next>` at merge-readiness (0.51.0 → next free).

6. **Re-ground.** Re-run the freshness gate; classify each staled pin against
   `git diff <old-pin>..HEAD -- <sources>`. Expect `pdlc-plugin.md` NEEDS-REVIEW (bootstrap
   SKILL + template are its sources and its prose describes what bootstrap plants) and
   `pdlc-sweep.md` NEEDS-REVIEW (Phase 1 item 2 is described in its body). Amend prose *before*
   bumping either pin. Version-stamp churn on lockstep siblings is RE-PIN-ONLY. Regenerate
   `CAPSULES.md` if any `description:` changes.

## Risks and how the plan answers them

| Risk | Answer |
|---|---|
| The two-way contract (R5) silently diverges — sweep names one path, bootstrap plants another | Phase 3 explicitly re-reads the template section; the test (R6) asserts the path string in the template, and the sweep edit is reviewed against it |
| The planted section bloats the always-on block | Scope capped at ladder + mechanism + authority rule; no procedure restated. Reviewed for length at phase 1 |
| The test becomes a prose copy and fails on any reword | Assert stable anchors only (paths, marker names, `model:`, the date of the field case) |
| The re-plant clobbers this repo's hand edits | `--check` and diff first; relocate hand edits outside the markers; `--force` only after |
| A pin is bumped without reading the diff | Phase 6 classifies each note explicitly; the merge commit is never the justification for a re-pin |
| Model IDs in the planted table go stale as models ship | This is the point of R3's split — the table is doctrine, the agent def is the pin; superseding a model is a one-line edit outside the markers |

## Verification

Per-PR gates from the runbook, run in the worktree and again after every history move:

- `node --test` (254 passing before this work; the new tests add to that)
- `node scripts/check-docs.mjs`
- `node grounding-wiki/gates/cli.mjs freshness . docs/wiki`
- `node scripts/sync-version.mjs --check` after the bump
- `node pdlc/scripts/plant.mjs --root . --peer backlog --check` must exit 0 reporting
  `claudeMd: unchanged` once the re-plant has landed

Manual verification that no test can do: read the template section and sweep's Phase 1 item 2
together and confirm they name the same location.
