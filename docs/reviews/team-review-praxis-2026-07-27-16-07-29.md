# praxis (praxisflux) — team review

Run: praxis-2026-07-27-16-07-29 · target @ 9a61d34 · lens: **"drift and tech debt since
bfd01e0..3e96cd7; clobbered design decisions, slap-dash conflict resolutions"** (PR #97,
TASK-72 — the range that shipped `pdlc:refactor-triage`). Team: 2 seniors (pdlc-surface
intent drift; wiki re-ground honesty) + 2 scouts (tests/hygiene; cross-surface
enumeration drift), synthesized by the lead. Self-review: this review runs inside the
repo it reviews, orchestrated by the new skill's own first invocation.

**TL;DR:** The merged work is disciplined at its core — the new skill is a faithful
instantiation of the agreed four-phase design, the version lockstep is fully coherent at
0.40.0, and the wiki re-ground is honest end to end (every pin bump audited against the
diff it covers; zero dishonest re-pins; the two-hop re-pin staging is exemplary). The
debt is at the edges: the release that added pdlc's third skill left every
*enumerating* surface it didn't directly touch still teaching a two-verb pdlc — most
consequentially `pdlc/templates/CLAUDE.md`, the grounding block bootstrap plants into
every consumer project. The one thing to worry about: `pdlc/skills/refactor-triage/SKILL.md`
silently assumes team-review ≥0.39.0 behavior (tracked report copy-on-finish) that older
independently-installed siblings don't have, with no stated fallback — an undeclared
version coupling in a suite whose composition story is "independently installable."

## What we like

- **Faithful four-phase build.** `pdlc/skills/refactor-triage/SKILL.md` matches the
  card's agreed design and `docs/skill-patterns.md` §2 exactly; the precondition gate is
  unusually concrete for prose (real `git rev-list --count` check; unresolvable range is
  "a stop, not a silent fallback"; missing board stops *and names the remedy*).
- **Disposition memory** (`pdlc/skills/refactor-triage/SKILL.md:97`) — prior triage
  records consulted before re-presenting a finding, overturns recorded. The best idea in
  the file; it's what makes periodic mode livable.
- **Honest re-grounding, verified.** All 14 changed notes audited: content-bearing
  re-pins landed with prose amendments (3bc4899/15517ef); the stamp-only batch (6c02c04)
  covers exactly one-line version stamps per source; `docs/wiki/pdlc-plugin.md` got a
  textbook two-hop re-pin. `docs/wiki/CAPSULES.md` is a genuine regen (gate re-renders at
  the header-named commit). The new note `docs/wiki/pdlc-refactor-triage.md` was verified
  claim-by-claim against its source — no overstatement.
- **Version lockstep fully coherent** at 0.40.0 across `.claude-plugin/marketplace.json`,
  all nine plugin.json files, `action.yml`, both edited SKILL.md versions; no debt
  markers left in the range; `.handoff/` gitignored.
- **R8 delivered exactly as promised**: `pdlc/skills/sweep/SKILL.md` Handing off names
  the new skill, version 0.8.0 → 0.9.0, nothing else disturbed.

## What could be improved

1. **Two-verb enumeration drift across the shipped surface.** The release's headline is
   a third pdlc skill, but every surface that *enumerates* pdlc's verbs and wasn't in
   the diff still says bootstrap + sweep: `pdlc/templates/CLAUDE.md:32` (the grounding
   bootstrap PLANTS — every project bootstrapped at 0.40.0 inherits a mis-enumeration;
   highest blast radius), `pdlc/.claude-plugin/plugin.json:4` and the mirrored
   `.claude-plugin/marketplace.json` pdlc description (the `/plugin` install surface —
   it now disagrees with `pdlc/README.md`'s "Three skills"), `README.md:29`'s pdlc role
   cell (describes bootstrap only — sweep was already missing, pre-existing),
   `CLAUDE.md:127` (this repo's own planted block, also still stamped v0.36.0 — never
   re-planted after the upgrade), and `docs/wiki/overview.md:39` ("pdlc sits before the
   loop" — now doubly wrong, and freshness-green only because its pinned sources are
   themselves the stale files).
2. **Undeclared team-review version coupling in Evaluate.**
   `pdlc/skills/refactor-triage/SKILL.md:72` asserts unconditionally that on self-review
   team-review lands a tracked report at `docs/reviews/team-review-<run-id>.md` — true
   only for team-review ≥0.39.0 (copy-on-finish, TASK-70) on the default report path.
   Older installed siblings strand the evaluation report in gitignored `.handoff/`; the
   skill's own "two artifacts of record, both tracked" promise
   (`pdlc/skills/refactor-triage/SKILL.md:19`) is not enforced by its output gate, and
   inline-degraded mode never names where its report lands. One-sentence fix: make the
   landing a check, not a claim — "if no tracked copy landed, copy the proven report to
   `docs/reviews/` yourself and commit it." (This review hit the exact path: engine ran
   at cache 0.36.0, no tracked copy landed, the lead copied the report manually.)
3. **Headless mode has doctrine but no syntax.** No policy argument is named anywhere,
   `pdlc/README.md` shows invocation examples for only two of the three modes, and
   nothing states how the skill distinguishes a headless run from an operator run. The
   "no policy declared → refuse" rule is good doctrine with no invocable surface; AC #2
   ("three modes work") arguably exceeds its artifacts.
4. **`<run-id>` is load-bearing and undefined**
   (`pdlc/skills/refactor-triage/SKILL.md:102`): when team-review ran, is it that run's
   id (so the report/record pair correlates)? In degraded mode there is no minting rule
   at all. Prescribe: team-review's run id when it ran; else `<repo>-<ISO-stamp>` per
   team-review's convention.
5. **Tests are header-deep.** The three new tests (`test/pdlc.test.mjs:41`) enforce four
   tokens and two headers; phases 2–4 (R3–R6 — the engine orchestration, the triage
   record path, the whole Execute contract) could be gutted with tests green. The
   sibling standard (`test/new-plugin.test.mjs:71` — full four-section skeleton,
   `parseFrontmatter`) wasn't followed; the cross-skill `docs/reviews/` path contract
   between refactor-triage and team-review is pinned by no test; the new
   `description:` assertion wasn't backported to the bootstrap test.
6. **A signed-off runbook line was reinterpreted without an amendment.**
   `docs/design/refactor-triage-runbook.md:96` required root README/CLAUDE.md updates
   "at minimum the pdlc plugin's skill list in README";
   `specs/033-refactor-triage/plan.md` softened this to "only if check-docs demands,"
   and the merged diff touches neither root file. The implementer's decision was
   recorded (good) but the runbook — signed-off state — was never amended, and runbook
   deviations are defined as operator checkpoints. Process drift, and the row is stale
   regardless (see 1).
7. **Deferred work lives only in prose.** Range-aware `orient.mjs` (`--since`) is named
   as a "possible evidence-backed follow-up" in four places (skill, spec, wiki note,
   card) and carded nowhere — for a skill whose entire purpose is carding deferred
   debt, the omission is self-referential.
8. **Near-budget wiki artifacts invite the next slap-dash fix.** The new note's
   description is 499/500 chars; `docs/wiki/test-suite-catalog-plugins.md` is 7695/8000
   and grows by appending — the next honest amendment collides with the budget gates,
   incentivizing shave-a-word fixes. Plan the summary-style split now. Related: the new
   note's sweep-version claims cite `pdlc/skills/sweep/SKILL.md`, which is not in its
   `sources:` — prose that can rot with the freshness gate green.
9. **The sweep's `.specify/` stop rule has now been informally overridden three times**
   (board-clearing → downstream-bugfix → sweep-followups precedent, cited again by
   `docs/design/refactor-triage-runbook.md:75`): hand-authored
   `specs/NNN/{spec,plan,tasks}.md` is de facto sanctioned. `pdlc/skills/sweep/SKILL.md:35`
   should learn its own escape hatch instead of granting it per-runbook.

## What should be removed

- The unenforced adjective in "two artifacts of record, **both tracked**"
  (`pdlc/skills/refactor-triage/SKILL.md:19`) — either the output gate checks the
  evaluation report's trackedness or the promise goes; a promise the gate doesn't check
  is exactly the debt this skill hunts.
- The duplicated "(team-review's precedent)" parenthetical and the pdlc-plugin note's
  re-summaries of both sibling skills (`docs/wiki/pdlc-plugin.md:25`) — the wikilinks
  exist so prose doesn't have to repeat itself.

## Stealing for later

- **Two-hop re-pinning** (content re-pin + amendment first; then a stamp-only batch
  whose commit message *declares* the review performed — 6c02c04). The commit message as
  honesty artifact; portable to any pinned-docs repo.
- **"A harness that cannot state its policy gets an operator, not a guess"**
  (`pdlc/skills/refactor-triage/SKILL.md:58`) — the cleanest headless-automation
  doctrine in the suite; belongs in `docs/skill-patterns.md`.
- **Disposition memory with recorded overturns** — portable to any recurring review
  loop, including team-review itself.
- **Copy-on-finish strictly after the output gate** (`team-review/scripts/run.mjs:105`)
  — tracked evidence that can never deadlock the gate proving it.

## New ideas — toward the lens

Build-ordered, each reusing what exists:

1. Fix the enumeration drift in one pass (finding 1): amend `pdlc/templates/CLAUDE.md`,
   the plugin/marketplace descriptions, and the root README row; then re-run
   `pdlc:bootstrap` here (it exists for exactly this) to refresh `CLAUDE.md`, and let
   the freshness gate pull `docs/wiki/overview.md` through the wiki-update loop.
2. Harden the skill's Evaluate/headless edges (findings 2–4) as a 0.2.0 of
   refactor-triage — three sentences and a README example, no structural change.
3. Deepen the pdlc tests to the `new-plugin.test.mjs` standard (finding 5), pinning the
   cross-skill path contract while at it.
4. Teach sweep the hand-authored-specs escape hatch (finding 9) — turn three precedents
   into doctrine.

## Questions for you

- Runbook line vs plan reinterpretation (finding 6): should sweeps treat any plan-time
  softening of a signed-off runbook gate as a mandatory runbook amendment + operator
  ping, even when the implementer records the decision on the spec? (The doctrine says
  yes; the practice drifted.)
- Root README's pdlc role cell (finding 1): roles-only prose (no skill enumeration
  anywhere in the table) or full verb list per plugin? Either is defensible; today it's
  neither consistently.
