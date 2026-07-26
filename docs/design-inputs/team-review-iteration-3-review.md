# praxisflux — team review

**TL;DR:** This is a small, disciplined, unusually honest plugin suite: the chassis is ~1.2k lines of
zero-dependency Node you can read in one sitting, the "gates never write / scripts mutate" split is
actually honored everywhere (zero `writeFileSync` in any `gates/` dir), and drift checks are real
gates wired identically into pre-commit, CI, and Stop hooks — not documentation theater. You should
be happy with it. The one thing to worry about, given your goal: **the paved road was paved for
artifact-producing, project-stamping plugins, and team-review is neither.** A read-only reviewer
that takes a caller-supplied target and stores state at the invoking root doesn't match either
documented placement model, can't be added by `gen-marketplace.mjs` despite what the checklist
implies, and needs a plugin shape (no lifecycle, no planted CLAUDE.md, no target-installed hook)
that no existing plugin models — spec-bridge comes closest. The chassis won't fight you; the docs
will mislead you in two specific places before you notice you're the exception.

**Lens declared:** readiness of the marketplace chassis for adding a new team-review plugin
(read-only toward its target, multi-subagent, report written outside the reviewed repo).

## What we like

- **Registries are derived where the authors bothered, and it pays off.** `scripts/build.mjs`,
  `scripts/sync-version.mjs`, and `scripts/check-version-bump.mjs` all read the plugin list from
  `.claude-plugin/marketplace.json` — register a plugin once and most tooling picks it up for free.
- **Drift-as-a-gate, triple-wired.** `scripts/check-docs.mjs` (README table/install/chassis rows),
  `scripts/gen-marketplace.mjs --check`, `scripts/sync-version.mjs --check`, and
  `scripts/sync-shared.mjs --check` each run from `.githooks/pre-commit` and
  `.github/workflows/ci.yml` (and the repo's own Stop hook via `scripts/stop-docs.mjs`). The same
  pure check invoked from every seam is why the docs actually track the code here.
- **The Stop-hook contract genuinely composes.** `lib/gate-runner.mjs:32-50` — pure `evaluate()`,
  and a gate whose `resolveRoots()` returns `[]` is a true no-op — so independently installed
  plugins' hooks stack with no coordinator, and a new plugin's hook can't break another's.
- **`lib/lifecycle.mjs` is a real abstraction, not a rename.** Ranked states + artifact evidence
  map, with `extraRequires` (`lib/lifecycle.mjs:33`) letting a delegate (build → educate) inject
  requirements without the base plugin knowing about it.
- **Evidence + durable residue over bare flags.** `educate/gates/dod.mjs:102-106` blocks `done`
  unless the fold-in flag is set *and* a `## Post-build` heading exists on disk — a flag alone
  can't satisfy the gate.
- **Per-skill version discipline is enforced, not aspirational.** `scripts/check-version-bump.mjs:12-13`
  fails a PR that touches `<plugin>/skills/<skill>/` without bumping that skill's SKILL.md
  frontmatter version.
- **`lib/cli.mjs`'s `runAsCli`** — a two-line `realpathSync` guard fixing symlink-broken
  `import.meta.url` entry-point detection, used consistently; exactly what a chassis should carry.
- **`docs/skill-patterns.md` is a genuine leverage doc** — the uniform gate→work→gate skill shape,
  the gates/scripts directory contract, and a concrete new-plugin checklist. Most marketplaces have
  nothing like it.

## What could be improved

1. **The new-plugin checklist's step 1 is wrong for the common case.** `docs/skill-patterns.md:141-142`
   says "add it to marketplace.json (or run `scripts/gen-marketplace.mjs`)" as if equivalent — but
   `scripts/gen-marketplace.mjs:15-21` only re-syncs entries *already* in `marketplace.json`;
   pointed at an unregistered `team-review/`, it is a silent no-op. First thing a new-plugin author
   hits, and it costs real time. (Lead spot-checked and confirmed.)
2. **No placement model fits team-review, and nothing says so.** `lib/project-root.mjs` offers
   exactly two shapes — favored-home (marker walk-up) and drop-anywhere (sentinel walk-down) —
   and `docs/skill-patterns.md` §6 presents them as exhaustive. A "caller-supplied target,
   state at the invoking root" plugin is a third shape. Related trap: `lib/handoff.mjs:20-25`
   calls `ensureGitignore` on whatever root it's given — rooted at the invoking project it's the
   correct transport for run records; pointed at the review target it would be a forbidden write.
3. **Hand-maintained registries sit beside derived ones with nothing distinguishing them.**
   `scripts/run-gates.mjs:32-47`'s `GATES` map and `action.yml`'s gate lists are hardcoded in
   three places with no test asserting agreement; `scripts/sync-shared.mjs:21-28`'s `SYNCS` is
   hand-curated. A fully wired plugin is up to 5 hand-edits (marketplace.json, README row, and —
   if CI-gated — run-gates + action.yml twice), several with no drift check tying them together.
4. **Deviations from the authoring doc that a copier inherits.** `spec-bridge/gates/bridge.mjs:32-33`
   reimplements rank comparison rather than using `lib/lifecycle.mjs`, and the doc doesn't note the
   exception; grounding-wiki ships no Stop hook at all despite a freshness invariant and checklist
   item 4 implying it should; codebase-to-course's `references/validate.mjs` stamps-checks only 2 of
   the 5 chrome files `docs/skill-patterns.md:117` names. None is fatal; all will confuse the next
   author about what's load-bearing.
5. **Educate's strongest gate has two soft spots.** The return-leg requirement only fires when a
   human-set `delegatedBuild` flag is true (`educate/gates/dod.mjs:35-38`), and the Stop-hook path
   skips staleness reporting, so only an explicit `--check` catches a lying artifacts map.
6. **Test parity is uneven.** spec-bridge and the release tooling carry most of the ~1.9k test
   lines; `build/`, research's `analyze-vault`, and educate's skills have little to none. Whatever
   the norm is, team-review will inherit the expectation — decide it explicitly.

## What should be removed

- **`build/` as an installable listing.** It is a stub — no gates, no scripts, no hooks; its own
  README says "Scaffold — not yet implemented" (`build/README.md:3`) — yet it's a discoverable
  marketplace entry. Finish it or pull it from `.claude-plugin/marketplace.json`.
- **Stale plugin READMEs**: `research/README.md` still calls itself a migrating scaffold though
  it's fully built; `codebase-to-course/README.md` lists shipped features as "upcoming."
- **Process residue**: `docs/orchestration/n8n-pilot/` one-time run logs (keep the README and
  workflow); the `docs/handoffs/` (session notes) vs `.handoff/` (transport) naming collision —
  rename one.
- Not removals, for the record: `dist/` is gitignored and untracked (a scout flagged it as
  committed noise — refuted), and there is no marketplace/plugin.json description drift (also
  refuted on spot-check).

## Stealing for later

- **The gates/scripts split** — verification code that provably never writes, beside mutation code
  that is the only thing allowed to. No domain assumptions; portable to any tool suite.
- **Drift-as-a-gate with local/CI parity** — one pure problem-reporting function, invoked
  byte-identically from pre-commit and CI. Cheaper and more honest than a Makefile culture.
- **No-op-when-no-roots hook composition** (`lib/gate-runner.mjs`) — additive hooks with zero
  coordination; the right shape for any multi-plugin hook system.
- **Evidence + durable residue** (educate's return leg) — require the flag *and* grep-able residue
  in tracked content for any "did you actually fold X in" step.
- **The git-status-diff read-only verification doctrine** (`docs/headless-runner.md`) — commit
  fixture state, then `git status` under the protected path is an unambiguous "nothing changed"
  check. This is literally the mechanism a team-review output gate needs, already proven here.
- **`runAsCli` (`lib/cli.mjs`)** — fixes a bug class most repos don't know they have.

## New ideas — toward the team-review plugin

Roughly build-ordered; each names the existing pieces it reuses.

1. **Name the third placement model first.** Add "operates on a caller-supplied root, stores state
   at the invoking root" to `docs/skill-patterns.md` §6, with the `lib/handoff.mjs` rooting rule
   (invoking root only) stated inline. One paragraph, prevents both documented dead ends.
2. **Make `gen-marketplace.mjs` actually generative.** It already syncs registered entries;
   `scripts/build.mjs` already *warns* about unregistered `plugin.json` dirs — promote that warning
   into generation (scan for `*/. claude-plugin/plugin.json`, append missing entries with default
   category/tags). Then checklist step 1 becomes true as written.
3. **Scaffold team-review from spec-bridge's mechanics, not educate's.** spec-bridge is the
   existing "read-only truth + separate write surface" plugin (`lib/spec-derive.mjs` reads, the
   board is written elsewhere) and is already proven headless. Take pdlc's invoking-root installer
   toolkit (`ensureGitignore`, `verifyPresent`, drift-diff planting from `pdlc/scripts/plant.mjs`)
   for standing up the run-tracker; skip `lib/lifecycle.mjs` and CLAUDE.md-planting entirely —
   pdlc's own "no lifecycle of its own" posture is the precedent that opting out is legitimate.
4. **Team-review's gate is in-skill, not a planted hook.** A target-installed Stop hook would
   itself be the forbidden write; the correct shape is the precondition-gate → work → output-gate
   skeleton the suite already mandates, with the output gate running the git-status-diff check
   against the target plus citation/section checks on the report.
5. **Add the missing registry drift test** — a small `test/` case asserting `run-gates.mjs`'s
   `GATES` keys appear in `action.yml`'s documented list, closing the one hand-edit cluster with
   no check (whether or not team-review ever exports a CI gate).
6. **Turn the checklist into a scaffolder** (`scripts/new-plugin.mjs`): stamp
   `<name>/.claude-plugin/plugin.json`, `skills/<name>/SKILL.md` skeleton in the gate→work→gate
   shape, the `lib -> ../lib` symlink, the marketplace entry, and the README row — i.e. exactly
   the set `check-docs.mjs` and `check-version-bump.mjs` will demand anyway. Team-review becomes
   its first consumer and the 9th plugin gets a paved road.

## Questions for you

- Should `build/` stay listed while unimplemented, or come out of the marketplace until it has
  real gates/scripts?
- The ~10k lines of committed course HTML under `docs/courses/` + `docs/course/`: deliverable
  (per `docs/task-courses.md`) or build artifact? If deliverable, fine — but say so where a
  cleanup-minded contributor will look.
- Should team-review export a repo-consumable CI gate at all? Its gate is per-run (report +
  untouched target), not per-repo state like wiki freshness — plausibly the first plugin that
  correctly ships none, and worth writing that reasoning down either way.
- spec-bridge's bespoke rank comparison: intentional exception to `lib/lifecycle.mjs`, or should
  the chassis grow a cross-directory comparison so the next gated plugin doesn't reinvent it?
