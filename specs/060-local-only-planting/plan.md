# Plan — spec 060, local-only planting mode

## Constitution check

**This host has no ratified constitution.** There is no `.specify/` directory (Spec Kit is
not installed here; these artifacts are hand-authored under the runbook's operator-signed
escape line), and therefore no `memory/constitution.md` to check against. Stating that
plainly rather than treating the step as ceremony.

Planned instead against the project's grounding docs, which are load-bearing here:

- **`CLAUDE.md`** — artifact-grounded action; one TASK, one PR; gates ("a status can never
  exceed the artifacts that prove it"); the enforcement split (advisory local, authoritative
  CI); "never hand-edit files under `backlog/`".
- **`docs/principles.md`** — the two 101 rules in canonical form.
- **`docs/skill-patterns.md`** — planted `CLAUDE.md`, the gate→work→gate skill shape, and
  the opt-in shape this change follows.
- **`docs/releasing.md`** — released surface ⇒ marketplace bump + edited skill `version:`.
- **`docs/wiki/pdlc-plugin.md`**, **`pdlc-grounding-block.md`**, **`installer.md`** — the
  current grounded description of what `plant.mjs` and the installer helpers do.

## Approach

**Follow the `--hook root-guard` opt-in precedent exactly.** That is the sibling shape the
card points at, and it already solved every structural question this change raises: an
opt-in recorded in the sentinel, re-presented as a default on update, offered by the skill
as a question rather than hidden behind a flag, and covered by `--check` idempotence. This
change is that pattern applied to *where ignore lines go* instead of *whether a hook is
wired*.

### Shape of the change

1. **A `localOnly` boolean option on `plant()`**, surfaced as a `--local-only` CLI flag.
   Boolean, not a mode string: there are exactly two states, the sentinel field reads
   honestly as `localOnly: true|false`, and a two-value enum buys nothing a boolean does not
   already give. (Deliberate simplification — a third planting target would want an enum;
   nothing suggests one exists.)

2. **An `ensureExclude(root, entries)` helper.** `ensureGitignore` in `lib/installer.mjs` is
   the right ancestor but wrong on two counts: it targets `.gitignore` and takes one entry.
   Add a sibling in the same module that targets `.git/info/exclude`, takes the whole set,
   appends only lines not already present, and returns what it did. Reusing the existing
   line-membership logic keeps the two honest with each other. **`lib/` is chassis** — this
   is the module whose whole job is dotfile-safe idempotent planting helpers, so it belongs
   there rather than private to `plant.mjs`.

3. **The exclude set is derived from the opt-ins, not a constant.** A function taking
   `{ peers, hooks }` and returning the scoped line list (R2). Always-on lines (`/.pdlc`,
   `/CLAUDE.md`, `/AGENTS.md`, `/.handoff/`, `/.worktrees/`, `/specs/`, `/docs/wiki/`,
   `/.claude/agents/`, `/.claude/model-tiers.json`, `/.claude/commands/`, `/.claude/skills/`)
   plus peer-conditional (`/backlog/` for backlog, `/.specify/` for spec-kit) plus
   hook-conditional (`/.claude/settings.json`, `/.claude/hooks/` for root-guard).

   *Judgment recorded:* `/specs/` and `/docs/wiki/` are always-on even though they are
   created by spec-kit and grounding-wiki respectively. Both are PDLC lifecycle artifacts
   the sweep creates regardless of whether the peer CLI is installed — this repo itself
   hand-authors `specs/` with no `.specify/`. Excluding them is correct in a guest repo;
   omitting them would dirty `git status` on the first sweep.

4. **Ordering (R3).** The exclude write moves to the **top** of `plant()`, before the
   `CLAUDE.md` write, the sentinel write, and `wireRootGuard`. In `check` mode it writes
   nothing and reports what it would do, like every other step.

5. **Sentinel round-trip (R4).** Add `localOnly` to `desired`. The `same` comparison gains a
   clause tolerating an absent field — `existing.localOnly === undefined || existing.localOnly
   === desired.localOnly` — mirroring exactly how `name` and `hooks` already tolerate legacy
   sentinels. A **mode switch** (sentinel says one thing, this plant asks for the other) is
   honest drift: reported, not silently applied, and requiring `--force`.

   *Judgment recorded:* drift on mode switch is reported through the existing sentinel/report
   channel rather than by hijacking `claudeMd: "drifted"`, which means something specific
   (the on-disk block differs from what this version renders). A separate report field keeps
   the two diagnosable apart.

6. **Pre-git degradation (R6).** `ensureExclude` checks for `<root>/.git`. Absent → return a
   `no-git` result, write nothing, no throw. The CLI and the skill surface the stated next
   step: `git init`, then re-run. A `.git` **file** (worktree pointer) rather than a
   directory is the one edge worth handling — `resolveProjectName` already parses that
   shape, so follow it and resolve the real gitdir rather than assuming a directory.

7. **The bootstrap question (R5).** A new SKILL.md section in the same voice and position as
   "Root-guard hook — opt-in enforcement (advanced)": offer, do not assume; recommend from
   what is observable; present the previous choice as the default in update mode; pass
   `--local-only` to the plant step on opt-in. The Output gate gains the local-only
   assertions (exclude file carries the scoped set; `.gitignore` untouched).

### Test plan (R7)

Extend `test/pdlc.test.mjs` in the existing style (temp-dir fixtures, real `git init`, the
`opts()` helper already there):

- local-only plant writes `.git/info/exclude` and leaves `.gitignore` **absent/untouched**
- tracked plant is unchanged — `.gitignore` gets `.handoff/`, exclude file untouched
- the scoped set: peers/hooks off ⇒ no `/backlog/`, `/.specify/`, `/.claude/hooks/`
- **ordering (R3):** after a first local-only plant in a real git repo, `git status
  --porcelain` is empty — the strongest available statement of the ordering requirement,
  and the one the card actually cares about
- sentinel records `localOnly`; re-plant reports `unchanged`; bytes do not churn
- legacy sentinel without the field re-plants as `unchanged`
- mode switch surfaces as drift and is not applied without `--force`
- pre-git host: no throw, nothing written, the degradation is reported
- `SKILL.md` contains the bootstrap question (grep-shaped assertion, as the suite already
  does for other doc-presence pins)

### Gates and grounding (R8)

- Bare `node --test` after every slice — the pre-commit hook runs the full suite on **every**
  commit, so each commit must leave it green.
- `sync-version.mjs` bump: marketplace + `pdlc/skills/bootstrap/SKILL.md`'s `version:`
  (0.12.0 → 0.13.0 — new operator-facing behaviour, not a fix).
- Wiki: `pdlc-plugin` and `installer` are certain (their sources change);
  `pdlc-grounding-block` and `test-suite-catalog-plugins-gates` likely. Classify each with
  `node grounding-wiki/gates/cli.mjs plan . docs/wiki`, then re-pin honestly.
- **`test-suite-catalog-plugins-gates.md` is at 7987/8000 chars** and this change adds tests
  to a file it describes. Budget a genuine trim or a summary-style split in this PR;
  `size_budget_exempt` is not the answer.
- Re-run the freshness gate **after** the re-pin commit — re-pins cascade through hub notes.
- Verify committed content with `git show HEAD:<file>`, never the on-disk file (F6).

## Risks

- **Over-excluding.** A path in the set that the host's team actually tracks would hide
  their files from their own `git status`. Mitigated by R2's scoping and by keeping the set
  to paths pdlc/its peers create.
- **Ordering regression.** Nothing structurally prevents a future edit from moving a write
  above the exclude call. The `git status --porcelain` assertion is the guard.
- **Note-budget overflow** blocking the commit late. Handled in its own phase rather than
  discovered at push time.
