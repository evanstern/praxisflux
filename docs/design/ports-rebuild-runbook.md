# pdlc ports-and-adapters rebuild, sweep 1 (chassis + AGENTS.md) — sweep runbook (2026-10-13)

**You (the session reading this) are the ORCHESTRATOR** for the tasks below. Run each
through the host project's full PDLC — spec → link → worktree → delegated implementation →
PR → merge → re-ground — parallelizing within lanes, merging serially, treating merge
conflicts as routine. Direction is decided; do not re-litigate it: decision-0002 (Accepted
2026-10-12) and `vault/Ports-and-Adapters-for-PDLC/Analysis-Rebuild-Architecture.md` win.
Plan-of-record is the board; this file carries only ordering, doctrine, and the log.

**Status:** draft · operator sign-off on lanes: pending
<!-- Only the OPERATOR flips draft → signed-off (the author never pre-fills it). An
     executing session must refuse a runbook whose status it cannot verify. -->

## Read first (in this order)

1. `backlog/decisions/decision-0002 - pdlc-rebuild-one-hexagon-…md` — the design of record.
2. `vault/Ports-and-Adapters-for-PDLC/Analysis-Rebuild-Architecture.md` — its reasoning.
3. `backlog task view TASK-0143 --plain` (EPIC), then TASK-0138 and TASK-0134.
4. `docs/wiki/CAPSULES.md`, then just-in-time: `docs/wiki/board-provider-seam.md`,
   `docs/wiki/pdlc-plugin.md`, `docs/wiki/pdlc-grounding-block.md`, `docs/wiki/chassis.md`.
5. `docs/releasing.md` (bump rules) and `.github/workflows/ci.yml` (the gates CI runs).
6. `backlog task list --plain` — live state; other sessions move it while you work.

## Binding constraints (decision-0002 — every task, every PR)

- Adapters are scripted Node code checked by gates. Skills route; they do not adapt.
- Assume only `git`, `node` and a POSIX shell. New code must not require `gh`, `glab`,
  `tea`, `backlog`, `rg` or `jq`.
- Use Node built-ins only. Add no runtime dependencies.
- `lib/` and `gates/` make no network or MCP calls. Gates read receipt files, never providers.
- Today's tools (Backlog.md, GitHub, Spec Kit, Claude Code) behave exactly as they do now.

## State when this runbook was written (2026-10-13, root at 472550d = origin/main)

- **Done already:** decision-0002 Accepted; EPIC TASK-0143 and children TASK-0138..0142
  carded (all To Do).
- **In flight in other sessions (do not duplicate; expect their merges):** no task In
  Progress, no open PRs. TASK-0137 (explainer plugin, To Do, unclaimed) has a large
  branch `task-0137-explainer-plugin` at `.worktrees/task-0137`. It touches `README.md`,
  every `plugin.json`, `marketplace.json`, `action.yml`, `lib/selfcontained.mjs`,
  `docs/wiki/{INDEX,CAPSULES,pdlc-plugin,overview,…}.md`. Expect it to land at any time.
  Two Warp worktrees (`chimney-burrowing-owl`, `cobalt-pumice`) carry no relevant diff.
- **Paused — untouched:** none.
- **Queued (this runbook's scope):** TASK-0138, TASK-0134 (parallel).
- **Out of scope (next sweep — see Follow-up):** TASK-0139, TASK-0140, TASK-0141, TASK-0142.

## Execution lanes (dependency-ordered; parallelize within a lane)

DEVELOP in parallel, MERGE serially. The two tasks have no dependency on each other but
share the version files, `README.md` and pdlc wiki notes, so the second PR to merge
reconciles against the first.

**Lane 1 — start immediately, in parallel (two worktrees):**

- **TASK-0138 — ports chassis** (sonnet · model `cc/claude-sonnet-5[1m]`, fallback: none
  declared in config — the work runs to a spec whose judgment calls are settled at the
  two operator checkpoints below and in spec/plan, which the orchestrator authors).
  Scope: port registry with floor-capability checks, configurator, receipt helper +
  convention doc, contract-test harness with a demo port and fake, the `pdlc` CLI with JSON
  output and `pdlc doctor`, the `git credential fill` helper. **Contract-shaped:** its
  registry/receipt/contract-harness APIs are what TASK-0139..0142 consume — publish those
  in spec.md first. **Blocked on checkpoints C1 and C2 before spec.md is finalized.**
  Spec number 073 (verify at claim).
- **TASK-0134 — AGENTS.md is the load-bearing planted file** (sonnet · model
  `cc/claude-sonnet-5[1m]`, fallback: none declared — the card already settles the shape,
  the migration path and every call site; it is work to a written spec). Scope:
  `plant.mjs` target + pointer + drift/consent on the new path + migration;
  educate/research planters; dogfood the praxisflux root; `check-docs.mjs`, hooks, CI,
  Stop hook; prose references. Not blocked; may start before C1/C2 are answered.
  Spec number 074 (verify at claim).

**Merge order:** whichever PR is green first merges first; the other merges `origin/main`
in (both are pin-carrying), re-bumps the marketplace version above main's, and re-runs
every gate. If both are ready together, the smaller diff merges first.

Tiers come from `.claude/model-tiers.json` (`defaultTier: sonnet`; `tiers.mjs --check`
exit 0 on 2026-10-13, no regeneration). Phases that are pure mechanical prose sweeps
(e.g. TASK-0134's #9 reference corrections) MAY drop to haiku (`cc/claude-haiku-4-5-20251001`)
as a recorded orchestrator call. Escalation to opus (`cc/claude-opus-5[1m]`, fallback
`cc/claude-opus-4-8[1m]`) is an operator checkpoint, recorded before dispatch.

At each dispatch, record on the board task:
`Dispatch: tier=<tier> pinned=<model-id> served=<model-id>` (served = bare ID from the
transcript). Verify the served model on the first dispatch before launching siblings.

## Per-PR gates this project enforces (enumerated — implementers cannot miss these)

- **Merge-drift gate: absent** (no `scripts/check-merge-drift.mjs`). Use raw git:
  `git fetch origin && git pull --ff-only` at root; `git diff origin/main...HEAD` before PR.
- `node --test` — full suite green.
- `node scripts/check-docs.mjs` — every top-level `lib/*.mjs` must be named in README's
  chassis section (TASK-0138 adds modules); README plugin census. After TASK-0134 merges,
  this script reads the load-bearing file it migrates to.
- `node scripts/sync-version.mjs --check` and `node scripts/gen-marketplace.mjs --check`.
- `node scripts/check-version-bump.mjs --base origin/main` — both PRs touch released
  surface: **minor** marketplace bump each (`node scripts/sync-version.mjs <x.y.0>`), plus
  each edited skill's `version:` (TASK-0134 edits `pdlc:bootstrap`, `educate:start`,
  `research:research-vault` at least).
- `node scripts/build.mjs` — clean package run.
- `node scripts/run-gates.mjs --gates spec-bridge --path .` — bridge gate;
  `requireDispatchRecord: true`, so a card without a `Dispatch:` line fails.
- `node scripts/run-gates.mjs --gates wiki-freshness --path .` — re-pin every note whose
  sources the PR touched, via `/grounding-wiki:wiki-update` (honest re-pins only).
- `node pdlc/scripts/plant.mjs --root . --peer backlog --check` — the marketplace bump
  drifts the planted block by construction; re-plant in the same PR. For TASK-0134 this
  check moves to AGENTS.md; CI's invocation must still pass.
- README.md / CLAUDE.md (or AGENTS.md, post-0134) updated when what the repo ships
  changes — TASK-0138 ships a `pdlc` CLI and new chassis modules.

## Per-task artifacts required before PR

**No PR opens for a task until each line below checks true for it.**

- [ ] `specs/<NNN>-<slug>/` carries real `spec.md`, `plan.md` (constitution-checked against
      `.specify/memory/constitution.md`), and `tasks.md` (phased checkboxes), committed on
      the task's branch. A claim stub satisfies nothing here.
- [ ] The card carries its Spec marker from the claim commit (`spec-bridge:link` against the
      stub), and phase ACs are seeded from tasks.md (link update mode) before dispatch.
- [ ] TASK-0138 only: the C1 and C2 rulings are recorded in the task notes (AC #2 requires
      the config-file choice there) **and** in spec.md before implementation dispatch.
- [ ] TASK-0138 only: a test or script asserts no new module under `lib/` or `gates/`
      imports `node:http`, `node:https`, `node:net`, or calls `fetch` (the credential helper
      uses only `child_process` → `git credential fill`).
- [ ] TASK-0134 only: a test proves an already-planted CLAUDE.md migrates as drift needing
      `--force`, and the sentinel does not advance without it.
- [ ] Both: a `Dispatch:` line per dispatch on the card.
- **Escape lines (operator-signed only):** none.

## Concurrency & conflict doctrine

- **Hotspots:** `.claude-plugin/marketplace.json`, `*/.claude-plugin/plugin.json`,
  `action.yml` (every version bump); `README.md`; `CLAUDE.md` (TASK-0134 turns it into a
  pointer — after that merges, TASK-0138's doc edits go to `AGENTS.md`);
  `docs/wiki/{INDEX,CAPSULES,pdlc-plugin,pdlc-grounding-block,chassis}.md`;
  `pdlc/scripts/plant.mjs` (TASK-0134 owns it in this sweep; TASK-0138 must not edit it);
  `.github/workflows/ci.yml`; `lib/selfcontained.mjs` (TASK-0137's branch).
- **Version-file conflicts are expected:** resolve by taking main's files, then re-run
  `node scripts/sync-version.mjs <next minor>` — never hand-merge version strings.
- Both branches are **pin-carrying** (they re-pin wiki notes): reconcile by merging
  `origin/main` in, never rebase/squash/force-push; PRs land as merge commits.
- **Honest re-pins only — a merge-in never justifies a pin bump.** For every pin the merge
  staled or conflicted: read `git diff <old-pin>..<merge-commit> -- <sources>`, classify
  RE-PIN-ONLY vs NEEDS-REVIEW, amend prose before bumping.
- After every history move: re-run all gates above AND the freshness probe,
  unconditionally.
- Conflict with a sibling session's PR (e.g. TASK-0137) → the smaller PR merges first.
- **Claim before work:** the branch's FIRST commit = card → In Progress + `specs/<NNN>-<slug>/`
  stub + `spec-bridge:link`. Push immediately (`git push -u origin <branch>`); never
  force-push a claim. A rejected push means you lost the race: fetch, re-read board and
  `specs/`; if the task or number is taken, STOP the lane and tell the operator.
- Check the spec number against `origin/main` AND every remote branch's `specs/` before
  claiming.
- Verify a PR merged (`gh api repos/evanstern/praxisflux/pulls/<n> --jq .merged`) before
  deleting its branch or worktree. (The orchestrator may use `gh`; new code may not.)
- **Worktrees:** `.worktrees/task-0138`, `.worktrees/task-0134`, cut with
  `git worktree add .worktrees/task-<N> -b task-<N>-<slug> origin/main`.
- **Execution mode:** decided by the executing session. Interactive with main-push rights:
  default flow (board notes direct to `main`). Background job: post-merge closures (tasks.md
  ticks, `spec-bridge:sync`, log rows) ride the other lane's open branch, and sweep-close
  lands via a small wrap-up PR.

## Operator checkpoints (do not proceed silently)

**C1 — TASK-0138: which file is the configurator.** Ask before finalizing spec.md.
Recommendation: **a new `.pdlc.json`**, operator-authored, one key per port
(`{"ports": {"tracker": "backlog-md", "forge": "github", …}}`). Absent file or absent key →
detection. Reasons:
- `.pdlc` is a **machine-written receipt** (`plant.mjs` rewrites it on every plant and
  holds it back on unconfirmed drift). Mixing operator config into it means plant must
  merge user keys, and TASK-0134 is rewriting that same sentinel logic in parallel in this
  sweep — a guaranteed collision.
- `.board.json` is the **tracker adapter's own settings** (spec-bridge owns it;
  `validateBoardConfig` validates it). Putting forge/spec/harness choices there couples
  three ports to one plugin and misnames the file. Keep it as tracker adapter config;
  TASK-0141 decides whether its `provider` key moves into `.pdlc.json`.
- An absent `.pdlc.json` means pure detection, so every existing host behaves as today
  (incumbent invariant), with nothing to migrate.
- Cost: `.pdlc` and `.pdlc.json` look alike. Mitigation: `pdlc doctor` names both and
  says which one is config and which one is the plant receipt.

**C2 — TASK-0138: receipt location convention.** Ask before finalizing spec.md.
Recommendation: **`.<port-dir>/<noun>.json`, tracked, written only through the chassis
helper** (byte-deterministic key order, sorted entries, trailing newline,
`observedAt`/`observedSha` when the source is remote). Concretely:
- tracker → `.board/links.json` (keeps its name; no rename);
- forge → `.forge/changes.json` (decision-0002's suggestion);
- spec → no receipt — the spec dir is the evidence;
- harness → no new file — the `Dispatch:` lines already ride the tracker receipt.

Tracked, not gitignored, because CI gates must read them offline. Open sub-question for
TASK-0140, not this sweep: a merge receipt cannot sit in the merge commit it records. It
rides the next commit, and that needs the forge task's own ruling.

**Also:**
- Tier escalations; lane amendments (amend this file, note why, tell the operator).
- Softening any gate enumerated above.
- If TASK-0137 lands mid-sweep and shifts `lib/` or README conventions, re-check
  TASK-0138's spec against it before dispatch.

## Done means

- TASK-0138 and TASK-0134 Done on the board via their own merged PRs (merge commits),
  Done set only by `spec-bridge:sync`.
- Both cards still carry their Spec markers; `specs/073-*` and `specs/074-*` (or the
  numbers actually claimed) each hold spec.md + plan.md + tasks.md.
- On `main`: `node --test`, `check-docs`, `sync-version --check`, `gen-marketplace --check`,
  `build.mjs`, `run-gates spec-bridge`, `run-gates wiki-freshness`, `plant.mjs --check` all
  green.
- C1 and C2 rulings recorded on TASK-0138.
- `git worktree list` shows no `.worktrees/task-0138` or `.worktrees/task-0134`.
- This log complete; status flipped to done.

## Follow-up — proposed lanes for the next sweep (not started here)

Dependencies: 0140 and 0141 need 0138. 0139 needs 0138 and 0134. 0142 needs 0141.

- **Lane 1 (parallel, after this sweep):** TASK-0140 (Forge — github REST adapter; moves
  every `gh` call site incl. sweep doctrine and root-guard; heaviest doctrine diff), and
  TASK-0141 (Tracker — board seam onto the chassis; settles the backlog-md direct-write
  question). Both are hotspot-heavy in `pdlc/skills/sweep/SKILL.md` and
  `docs/board-verbs.md`. Develop in parallel, merge 0141 first if smaller, with a
  reconcile between.
- **Lane 1b (parallel with Lane 1):** TASK-0139 (Harness — skills route through `pdlc`
  CLI; needs 0134's AGENTS.md). It rewrites the same skill bodies as 0140. Treat it as
  sharing 0140's footprint: merge whichever is smaller first, then reconcile the other.
- **Lane 2 (after 0141 merges):** TASK-0142 (Spec — derivation behind the port).
- Tier expectation: sonnet for all four once each spec is written. TASK-0140's merge
  receipt timing (C2 sub-question) and TASK-0141's backlog-md ruling are their operator
  checkpoints.

## Execution log

| date | task | PR | merge | tokens/cost (best-effort) | notes |
|------|------|----|-------|---------------------------|-------|
| 2026-10-13 | — | — | — | — | runbook authored (draft); awaiting operator sign-off + C1/C2 |
