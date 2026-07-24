---
id: doc-1
title: Team review 2026-07-23 — praxisflux vs its own tenets
type: other
created_date: '2026-07-23 17:25'
updated_date: '2026-07-23 17:26'
tags:
  - team-review
  - architecture
---
# praxisflux — team review

Reviewed at commit `0f947d1` (2026-07-23). Lens: evaluate the marketplace against its own
tenets — P1 artifact-grounded action, P2 one-TASK-one-PR, phase-separated skills composing
only through files + gates, "status can't exceed proven artifacts." Team: 2 senior deep-dives
(chassis/gates; skills/composition), 2 scouts (marketplace surface; tests/docs hygiene),
plus the lead's own reading. All 138 tests pass; the wiki freshness gate is green at HEAD.

**TL;DR:** The enforcement machinery is genuinely marketplace-grade — the gates are real
checks engineered against their own failure modes, version lockstep holds by construction,
and the methodology is load-bearing wherever it's deterministic. You should be happy with
this codebase. The one thing to worry about: **the suite enforces its tenets downstream more
strictly than at home.** The repo never ran its own bootstrap (`.handoff/` isn't gitignored,
no `.pdlc` sentinel), the largest doc surface (~2.2MB of generated courses) has no freshness
mechanism while the wiki beside it is gate-enforced, the README drifts on countable facts,
and — proven live during this review — team-review's own gate trips on its own run record
when self-reviewing its host repo. Secondary risk: the symlinked-`lib/` install path is an
unverified bet (no CI simulates a marketplace install; Windows unaddressed).

## What we like

- **The gate contract is tiny and composable by shape.** `{name, resolveRoots, check, warn?}`
  with "no roots = no-op" (`lib/gate-runner.mjs:8-12`) lets N independently installed plugins
  each ship a Stop hook with zero coordination. The pure `evaluate()` core is separated from
  process I/O and unit-tested. Crashed checks **block** rather than silently pass
  (`lib/gate-runner.mjs:41-42`); a typo'd gate name fails CI loudly (`scripts/run-gates.mjs:52-56`).
- **`lib/lifecycle.mjs` is "status can't exceed evidence" in 67 dependency-free lines** —
  ordered states + artifact→file map + per-state requirements, vocabulary per-plugin,
  mechanism shared. The cleanest generic form of the repo's core tenet.
- **Version lockstep by construction, not convention.** The npm manifest is generated from
  `marketplace.json` (`scripts/build-npm.mjs:57-69`); `scripts/sync-version.mjs` stamps all
  surfaces and hard-fails if the `action.yml` pin vanishes; npm publishes before the tag so
  the Action pin is race-free. All 8 plugins sit at 0.9.0 across every surface; two
  independent drift guards (`scripts/gen-marketplace.mjs`, `scripts/build.mjs`) make silent
  catalog drift impossible.
- **Automation only claims what it can prove.** The freshness gate auto-repins exactly one
  provably-safe diff class (version stamps) and defaults everything else to human review,
  deliberately scanning the raw note body because stripping code would err in the unsafe
  direction (`grounding-wiki/gates/freshness.mjs:109-117`). This is P1 implemented, not recited.
- **Skill authoring discipline is uniform and mature.** Every skill instantiates the same
  gate→work→gate skeleton (`docs/skill-patterns.md:17-26`); precondition gates route upstream
  by name and refuse to do the upstream phase's job; fallbacks name their own failure modes;
  the "computed, not reasoned" pattern (spec-bridge's `plan` emitting exact commands,
  wiki-update's RE-PIN-ONLY vs NEEDS-REVIEW split) reserves the model for judgment. The
  recursion guard in `team-review/skills/team-review/SKILL.md:90-93` was validated by this
  very engagement.
- **CI and hygiene are honest.** `.github/workflows/ci.yml` runs tests, catalog sync, version
  lockstep, doc checks, and wiki freshness on every PR; board final-summaries spot-checked
  true against the files they claim; tests are behavioral, not smoke (9 of 10 gate files
  covered; `test/chassis.test.mjs` exercises 8 lib modules directly).

## What could be improved

1. **The self-hosting gap — the repo fails its own P1 at home.** `.gitignore` lacks
   `.handoff/` even though CLAUDE.md states the transport is gitignored; there is no `.pdlc`
   sentinel because praxis never ran `pdlc:bootstrap` on itself. Live consequence, hit during
   this review: `team-review/scripts/run.mjs` snapshots the target **before** writing its own
   run record into `.handoff/` at the invoking root, so when invoking root == target the
   porcelain comparison in `team-review/gates/review.mjs:99-103` can never match again — the
   plugin's own paper trail trips its own read-only gate, and a self-review cannot pass
   without manual intervention. Fix in the plugin (exclude `.handoff/` from the comparison,
   or hard-fail `begin` when the transport isn't ignored), and bootstrap the repo itself.
2. **Courses are the doc class that violates the doctrine.** `docs/courses/` (~1.6MB, 10 task
   dirs) plus `docs/course/` (~600KB) claim to teach the code but carry no pins and no
   freshness gate — the exact problem the wiki was built to solve, unsolved for the largest
   doc surface. And `docs/task-courses.md` overclaims: "every completed task" vs reality
   (courses for ~10 of 66 Done tasks, adopted mid-stream at ~TASK-20, some gaps unexplained).
3. **Gate enforcement isn't uniform across plugins, and the README implies it is.** Four
   plugins wire real Stop hooks; grounding-wiki and codebase-to-course ship gates as CLI/CI
   only (no `hooks/` dir), yet the README reads as if enforcement arrives on install. Related
   honesty gaps: `gate.sh` exits 0 silently when node is missing (a silent skip the doctrine
   forbids — one stderr notice would fix it), and local Stop gates are inherently advisory
   (`stop_hook_active` honored). The tenet actually delivered is "gates make dishonest status
   expensive locally and impossible in CI" — the docs should say that.
4. **The biggest structural bet is unverified.** The symlinked-`lib/` scheme rests on
   marketplace installs dereferencing `lib -> ../lib`; no CI job simulates the install path
   and runs a hook from the copied tree. On Windows the symlinks and the four bash Stop shims
   don't work at all — gates would be silently absent. One spawn-based e2e test per shim and
   one install-simulation CI job would convert the bet into a checked invariant.
5. **Stale text a model will act on.** Verified: `educate/skills/lesson/SKILL.md:54-55`
   defines lifecycle states by `HANDOFF.md written` / `POST_BUILD_HANDOFF.md returned` while
   lines 74-76 of the same file forbid loose handoff files — a model following the glossary
   writes the forbidden artifact. Also: README says "seven plugins" and omits team-review
   from the enumeration while listing 8 elsewhere; `build/skills/implement/SKILL.md:16-18`
   puts a non-runnable library path in an executable code fence; `docs/handoff-protocol.md`
   claims the transport for seams that don't use it.
6. **Chassis edges.** `resolveRoots()` crashes are swallowed to `[]` (`lib/gate-runner.mjs:39`)
   — a crashing resolver silently disables a gate while a crashing check blocks; spec-bridge
   resolves roots downward-only, so a session cd'd into a subdirectory no-ops the bridge
   gate; `spec-bridge/gates/bridge.mjs:235-240` evaluates the full bridge twice per Stop;
   `research/gates/artifact.mjs` is the one gate with zero test coverage; two frontmatter
   parsers exist (`lib/markdown.mjs` inline-only, freshness's own block-list parser).
7. **Gates verify existence more than adequacy.** `lib/lifecycle.mjs` checks `existsSync`; an
   empty `guide.md` passes educate's DoD. The suite already knows how to check content (the
   greppable `## Post-build` residue rule, citation resolution, byte-for-byte snapshots) —
   the tenet should acknowledge the existence→adequacy spectrum and push more gates rightward.
8. **Two tenets need rewording to match the (better) implementation.** "Skills know nothing
   of each other" is false as stated — skills name each other for routing, and that's what
   makes precondition gates work; what's enforced is no invocation, no shared state. And the
   suite's strongest seams (grounding-wiki→codebase-to-course, spec-bridge↔Backlog) skip
   `.handoff/` entirely and read the other plugin's tracked artifacts directly — the
   methodology should name both seam kinds (transient request/response vs published-artifact
   consumption) instead of implying the transport is universal.

## What should be removed

- **The per-task course mandate.** It's the methodology's heaviest ceremony: every historical
  course fails its gate on the next chrome bump (acknowledged in `docs/task-courses.md:45-58`),
  the decision-only exemption shows the convention consuming itself, and 85% of Done tasks
  don't comply anyway. Keep courses for epics/milestones, or adopt the snapshot-exempt gate now.
- **Marketing copy and self-contradiction in `codebase-to-course/skills/codebase-to-course/SKILL.md`**
  (243 lines, 2-5× its siblings): the canned welcome blockquote, "stunning/beautiful"
  repetition, and "menu, not a checklist" colliding with "must ALWAYS be present — no exceptions."
- **The `check-docs` backtick census** (`scripts/check-docs.mjs:30-35`): naming ≠ describing;
  satisfied by a stale one-liner; the wiki gate covers the semantic half. Keep the plugin-table
  checks. Notably it also failed to catch the "seven plugins" drift — the check that exists
  didn't check the fact that mattered.
- **`dist/` release zips**, if nobody installs from them — keep `build.mjs` as the
  "plugins package cleanly" CI check. The stale local `dist/` (5 of 8 plugins, old hook
  wiring) is a standing drift magnet.
- **Near-verbatim principle restatements in four places** — the canonical-upstream design in
  `docs/principles.md` is sound; the planted template could quote P1/P2 in a line each and link.

## Stealing for later

- **The 4-field gate contract + "no roots = no-op"** (`lib/gate-runner.mjs`) — additive
  enforcement across independently installed tools with zero coordination; portable to any
  hook/CI system because it's just data plus two functions.
- **Lifecycle-as-data** (`lib/lifecycle.mjs`) — a 60-line rehostable engine for "status can't
  exceed proven artifacts."
- **The `plan` command pattern** (spec-bridge) — a deterministic planner emits exact commands,
  the model executes verbatim, and re-running `plan` until it prints nothing makes idempotence
  the output gate. Portable to any agent reconciling two stores.
- **Provably-safe diff-class auto-reconciliation** (`grounding-wiki/gates/freshness.mjs`) —
  automation whitelists what it can prove, defaults the rest to humans.
- **Flag + durable-residue double evidence** (`educate/gates/dod.mjs:45-52`) — a boolean can
  be rubber-stamped; greppable prose on disk cannot (as easily).
- **Marker-block CLAUDE.md planting with drift consent** (pdlc) — `--check` preview, explicit
  consent before `--force`, never silently discard user text: the right answer to "plugins
  have no always-on slot."
- **`runAsCli` realpath guard** (`lib/cli.mjs:16-23`) — every dual-use ESM script should have it.
- **Headless verification doctrine** (`docs/headless-runner.md:44-56`) — "exit code means the
  session completed, nothing more; success is only what the gates confirm."
- **Anti-trigger skill descriptions** (research) and the **recursion-guard sentence** for
  subagent prompts (team-review).

## New ideas — toward a marketplace others adopt

Roughly build-ordered; each reuses pieces that already exist.

1. **Run `pdlc:bootstrap` on praxis itself.** Fixes the `.gitignore` gap, plants the sentinel,
   and is the strongest possible proof of the bootstrap's idempotent-append claim. One session.
2. **Make team-review self-review-safe:** in `team-review/gates/review.mjs`, filter `.handoff/`
   lines out of the porcelain comparison (or snapshot after writing the run record; or
   hard-fail `begin` when invoking root == target and the transport isn't ignored). This
   review is the repro case.
3. **Install-path e2e in CI:** one job that copies a plugin with symlink dereference (the
   marketplace behavior), then spawns its `gate.sh`/`stop.mjs` with fake stdin against a
   fixture — closing both the symlink bet and the untested-hook gap at once. `sync-shared.mjs`
   already models the "mechanical stamp + CI-enforced" pattern to follow.
4. **Course freshness via the wiki mechanism you already own:** pin each course dir to a
   `verified_against` commit and extend the freshness gate to cover `docs/courses/` — or land
   `task-courses.md` option 2 (snapshot-exempt) now and scope the mandate to epics.
5. **Mechanical README↔marketplace consistency in `check-docs`:** derive the plugin count and
   enumeration from `marketplace.json` — replacing the backtick census with a check that
   would actually have caught the "seven plugins" drift.
6. **Name the two seam kinds** in `docs/handoff-protocol.md` (transient request/response on
   `.handoff/` vs published-artifact consumption) — TASK-34's artifact-gated-seams work is
   already heading here; fix the educate glossary lines in the same pass.
7. **Per-plugin enforcement column in the README table:** "Stop-hook enforced" vs "CI/CLI
   gate," so install expectations match reality; add the one-line stderr notice to `gate.sh`
   when node is missing.

## Questions for you

1. **Is praxisflux meant to go public?** Today every documented install path (marketplace
   add, release zips, `npx @praxisflux/gates`) fails for anyone without repo access, and the
   praxis/praxisflux naming split plus 8-plugin lockstep versioning read "built for its
   author." If public adoption is the goal, items 3/7 above and Windows support become P1;
   if it's personal infrastructure, they're fine to skip — but then the README's adoption
   framing oversells.
2. **Per-task courses: keep, scope down, or make them cheap?** They're the largest recurring
   ceremony cost and the weakest-enforced doc class. Idea 4 makes them honest; dropping the
   mandate makes them optional. Which way you go changes idea 4's priority.
3. **Should local Stop gates stay advisory by design?** If yes, reframe the docs ("expensive
   locally, impossible in CI") and add the missing-node notice; if no, that's a much bigger
   piece of work.
