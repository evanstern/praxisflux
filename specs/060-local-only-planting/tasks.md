# Tasks — spec 060, local-only planting mode

Phased breakdown. One fresh implementer dispatch per phase; each phase ends green and
committed and **pushed** (runbook F4).

## Phase 1 — The exclude helper and the scoped set

- [ ] Read `lib/installer.mjs` (`ensureGitignore` is the ancestor) and `pdlc/scripts/plant.mjs`
      end to end, plus the `--hook root-guard` opt-in as the pattern being followed.
- [ ] Add `ensureExclude(root, entries)` to `lib/installer.mjs`: targets
      `<root>/.git/info/exclude`, appends only lines not already present, creates
      `.git/info/` if missing, returns what it did. Handles `.git` as a **file** (worktree
      pointer, `gitdir:` shape — see `resolveProjectName` in plant.mjs) as well as a
      directory. Returns a `no-git` result when `.git` is absent — never throws (R6).
- [ ] Add the exclude-set builder to `pdlc/scripts/plant.mjs`: takes `{ peers, hooks }`,
      returns the scoped line list per spec R2 — always-on lines plus `/backlog/` only for
      the backlog peer, `/.specify/` only for spec-kit, `/.claude/settings.json` +
      `/.claude/hooks/` only for the root-guard hook. Export it; the tests pin it directly.
- [ ] `lib/` is chassis — run `node scripts/sync-shared.mjs` if it vendors `lib/` into
      plugin dirs, so the copies do not drift.
- [ ] Tests: the scoped set (peers/hooks off ⇒ the conditional lines absent; each opt-in
      adds exactly its lines); `ensureExclude` idempotence; the `.git`-as-file case; the
      no-git degradation.
- [ ] Bare `node --test` green. Commit and **push**.

## Phase 2 — Wire local-only into plant(), ordering first

- [ ] Add the `localOnly` option to `plant()` and the `--local-only` CLI flag (usage string
      and the `--check` pending logic included).
- [ ] **Move the ignore-write to the top of `plant()`**, before the `CLAUDE.md` write, the
      sentinel write, and `wireRootGuard` (R3). In local-only mode call `ensureExclude` with
      the scoped set and write **nothing** to `.gitignore`; in tracked mode keep today's
      `ensureGitignore(root, ".handoff/")` and touch no exclude file.
- [ ] Report the outcome in the returned object alongside `gitignore` — including the
      pre-git degradation — so `--check` and the skill can both surface it.
- [ ] Tests: local-only writes the exclude file and leaves `.gitignore` absent; tracked mode
      is byte-for-byte unchanged from today; **`git status --porcelain` is empty after a
      first local-only plant into a real git repo** (the ordering assertion, R3).
- [ ] Bare `node --test` green. Commit and **push**.

## Phase 3 — Sentinel round-trip and mode-switch drift

- [ ] Record `localOnly` in the `.pdlc` sentinel's `desired` object.
- [ ] Extend the `same` comparison with an absent-tolerant clause, mirroring how `name` and
      `hooks` already tolerate legacy sentinels (R4).
- [ ] A **mode switch** (sentinel disagrees with the requested mode) is honest drift:
      reported through its own field, not applied without `--force`, and the sentinel does
      not advance past an unconfirmed switch. Keep it diagnosable apart from
      `claudeMd: "drifted"`, which means something else.
- [ ] Tests: sentinel records the field; re-plant reports `unchanged` and the bytes do not
      churn; a legacy sentinel without the field re-plants `unchanged`; the mode switch
      surfaces as drift and applies only with `--force`.
- [ ] Bare `node --test` green. Commit and **push**.

## Phase 4 — The bootstrap question

- [ ] Add the planting-mode section to `pdlc/skills/bootstrap/SKILL.md`, positioned and
      voiced like "Root-guard hook — opt-in enforcement (advanced)": offer, do not assume;
      ask "a project we own" (tracked, default) vs "a repo we are a guest in" (local-only);
      recommend from what is observable — a repo whose remote/tracked tree shows no prior
      PDLC adoption is the guest case; present the previous `.pdlc` choice as the default in
      update mode; pass `--local-only` on opt-in (R5).
- [ ] Extend the skill's Precondition gate step 3 (the not-a-git-repo case) to state the
      local-only degradation and its next step (R6).
- [ ] Extend the skill's Output gate: in local-only mode assert `.git/info/exclude` carries
      the scoped set and `.gitignore` was **not** written.
- [ ] Update the plant-step command line and the skill's `description:` frontmatter to name
      the new opt-in.
- [ ] Test: `SKILL.md` contains the bootstrap question (doc-presence assertion, R7).
- [ ] Bare `node --test` green. Commit and **push**.

## Phase 5 — Bump, re-ground, PR

- [ ] Bump: marketplace version + `pdlc/skills/bootstrap/SKILL.md` `version:` 0.12.0 →
      0.13.0 (`docs/releasing.md`). Verify with `git show HEAD:<file>`, never the on-disk
      file (runbook F6).
- [ ] `node scripts/check-docs.mjs` — update `README.md`/`CLAUDE.md` if what the repo ships
      changed.
- [ ] `node grounding-wiki/gates/cli.mjs plan . docs/wiki` — classify every stale note
      RE-PIN-ONLY or NEEDS-REVIEW against its own diff; amend prose before bumping any pin.
      Expect `pdlc-plugin`, `installer`, `pdlc-grounding-block`,
      `test-suite-catalog-plugins-gates`, plus ~17 from the version bump.
- [ ] **`test-suite-catalog-plugins-gates.md` is at 7987/8000** — take a genuine trim or a
      summary-style split for the pdlc test-file bullet. Not `size_budget_exempt`.
- [ ] Re-run the freshness gate **after** the re-pin commit exists — re-pins cascade through
      hub notes; expect a possible second pass.
- [ ] Full bare `node --test` green; commit, push, open the PR (merge commit, never squash).
