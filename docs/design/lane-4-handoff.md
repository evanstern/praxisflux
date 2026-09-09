# Handoff — Lane 4: TASK-113 (spec 056, the Jira provider)

**Written:** 2026-09-09 · **For:** a fresh session finishing the last task of the
TASK-108 epic's sweep · **Repo state:** root on `main` at `68ec2ab`, clean, pushed,
marketplace **v0.62.0**, CI green.

You are picking up **one task**: TASK-113, Phases 2–4. Everything else the operator asked
for is done. This file plus `docs/design/jira-board-runbook.md` and the board are the whole
contract — no decision below lives only in a chat log.

## Read first, in this order

1. `docs/design/jira-board-runbook.md` — the sweep runbook. Its **RESUME HERE** block and
   its findings F1–F7 are checkable gate lines, not prose. Lanes 3–4 are **signed off**.
2. `specs/056-jira-provider/{spec,plan,tasks}.md` — your spec. All three are real.
3. **`specs/056-jira-provider/findings/phase-1-mcp-surface.md`** — the live MCP findings.
   **Read it; do not re-derive it.** It is on the branch, not on `main`.
4. `backlog task view TASK-113 --plain` — live state.
5. `docs/board-verbs.md` — shipped by TASK-112. Your write path resolves against it.

## Where the work sits

Branch **`task-113-jira-provider`** exists, is pushed, and is parked at `287039e` in the
worktree `.claude/worktrees/task-113`. It carries Phase 1's findings commit, the tasks.md
tick (6/7), and a board note. **It is BEHIND `main` by the whole TASK-0122 + TASK-112 range**
— merge `origin/main` into it before doing anything (merge, never rebase: the branch is
pin-adjacent and this repo bans rebasing pushed claim branches).

TASK-113 is already claimed: card **In Progress**, `Spec: specs/056-jira-provider` marker
present, phase ACs seeded. **Do not re-claim it.** One task, one PR — Phases 2–4 ride this
same branch and merge in its single PR, with Phase 1's commit as its first.

## What Phase 1 already proved (spend nothing re-testing this)

- **The `<!-- spec-phases -->` markers SURVIVE** a Jira description write→read cycle in
  `contentFormat: markdown`, idempotently across a second write. This discharged finding
  **F1** and is why spec 055 needed no amendment.
- **Two silent normalizations your code must tolerate** (already handled by TASK-112's
  parser, but know them): a blank line inserted after `BEGIN`, and trailing whitespace on
  the last checkbox line.
- **The block contract is MARKDOWN-ONLY.** An `html` read returns the markers as escaped
  entities, converts checkboxes to a native ADF task-list with server UUIDs, and swallows
  the `END` marker inside the final `<li>`.
- **Real tool names** (two in the spec are wrong): `listJiraIssueTransitions` (not
  `getTransitionsForJiraIssue`), `listJiraProjectIssueTypesMetadata` (not
  `getJiraProjectIssueTypesMetadata`).
- **JQL pagination is token-based** — `nextPageToken`/`isLast`, not `startAt`. Page to
  completion; a truncated sync silently drops links, and a dropped link is a card the gate
  stops checking.
- **The host workflow is NON-INJECTIVE on `statusCategory`** — 9+ transitions from `Open`
  with several distinct statuses sharing one category. **Map on status NAME**, and make the
  non-injective check run against real names.

**Still OWED from Phase 1 (box 5, deliberately unticked):** the **resolution quirk** — a set
`resolution` can block a backwards transition. Untested; the permission boundary declined the
transition at the time. It is owed **before Phase 3** relies on backwards moves.

## What TASK-112 handed you (all on `main` now)

- `docs/board-verbs.md` — 13 verbs, each with preconditions + evidence artifact.
- `lib/board-mirror.mjs`: mirror **`labels[]`** (optional; a labels-less mirror still
  validates), **`isPausedLink`**, and **`renderSpecPhasesBlock` / `parseSpecPhasesBlock`**.
- `spec-bridge/gates/bridge.mjs`: **`renderJira(id, intents, config)`** — pure, ordered
  `{tool, args, why}`.
- **The architectural note that shapes your Phase 3:** given only `(id, intents, config)`
  and no task snapshot, `renderJira` **cannot** resolve a surviving AC's original text, so
  its `editJiraIssue` call carries the **raw diff** (`acAdd`/`acRemove`/`acCheck`/
  `acUncheck`), not a finished description. **Resolving that against the live block is YOUR
  job:** `getJiraIssue` → `parseSpecPhasesBlock` → apply → `renderSpecPhasesBlock` → write.
  That is exactly why the render/parse pair is a standalone primitive.
- `renderJira` is **not yet wired** into `planBridge`'s non-backlog branch. No Phase 3 AC
  asked for it; wiring it is your call.

## OPERATOR-AUTHORIZED SCOPE (2026-09-09) — read before any MCP write

**Site and project: AICOE only.** The operator has write access to Jira + Confluence for
**AICOE** and to GitHub. ESubmission access is *in progress* (~a day out as of 2026-09-09) —
**do not target ESubmission**, and do not wait for it: AICOE is the sanctioned scope.

**The site is a real corporate instance.** Per finding **F7**, its `cloudId`, `accountId`,
and project keys must **never** land in a tracked file — this repo is public and
auto-publishes a Release on every merge to `main`. Keep coordinates in untracked local
config or ask the operator. Grep any doc quoting MCP output before committing it.

**Writes: authorized, with one confirmation owed.** The operator's answer selected all three
write permissions *and* "read-only, defer all writes", which are mutually exclusive. The
reading recorded here is **writes authorized, scoped to the session's OWN scratch issues in
AICOE** — create, edit descriptions, execute transitions including a backwards move — since
that is what the other three selections say and read-only would block Phases 2–3 entirely.
**Confirm this in one line with the operator before the first mutation.** Do not treat this
paragraph as the authorization itself.

Within that scope: title scratch issues obviously (`[SCRATCH — praxisflux spec 056] …`),
touch only issues the session created, and **clean up or close them at the end**. The
orchestrator has no delete authorization — closing is the operator's, so ask.

**`statusMap`: propose, then get ratified.** The operator's ruling is that the next session
**derives a candidate** from AICOE's live transitions and writes it into `.board.json` with
its reasoning, then **the operator confirms before any write path uses it**. The mapping is a
policy call about the team's workflow semantics — whether `Technical Design` counts as
In Progress is not yours to decide. The candidate shape the operator previewed:

```
Open, Waiting for Info, Requirements clarification, On Hold  -> To Do
Ready for Dev, Functional Design, Technical Design           -> In Progress
Deployed to UAT, Closed                                      -> Done
```

Derive it from the live workflow rather than copying this verbatim, present it, and wait.

**The UI-Done sweep proof: ask the operator at that point.** Phase 4 requires proving that a
card set **Done in the Jira UI** over unchecked `tasks.md` boxes yields a **BLOCKING**
finding. The operator chose to be asked when you get there: set up the scratch card, say
exactly what to click, then verify the gate blocks. Keep it genuine — the point is that a
human bypassing the artifacts gets caught.

## Execution rules that bit this sweep (do not relearn these)

- **F3 — dispatch SERIALLY.** One orchestrator session cannot host concurrent dispatches
  across sibling worktrees on this harness: switching worktrees breaks the Bash tool of every
  running dispatch. Park the session in the target worktree for the whole dispatch.
- **F4 — push after EVERY phase**, not just the claim. Two near-misses this session: a prior
  session's TASK-0122 rewrite sat unpushed, and PR #139 merged while an approved fix was
  mid-push (recovered by cherry-pick at `85560c7`).
- **Re-run the freshness gate after EVERY history move** — merge-in, cherry-pick, anything.
  Skipping it after a cherry-pick is exactly how CI caught what the local gate missed here.
- **Honest re-pins only.** Amend prose FIRST, commit it, then pin to that commit. Classify
  every stale pin RE-PIN-ONLY vs NEEDS-REVIEW by reading the diff over its sources. A
  mechanical re-pin greens the gate over notes that contradict the code.
- **Re-pins CASCADE, one hop further than documented:** amending a note's frontmatter
  **description** stales `CAPSULES.md` (generated from descriptions + INDEX). Regenerate with
  `grounding-wiki/scripts/capsules.mjs`, never hand-edit — the gate regenerates-and-compares.
- **The board mirror stales on EVERY board change**, including the status flip that closes a
  task. Regenerate via `projectBacklog` + `writeMirror` (never hand-edit the JSON), and
  expect to do it twice at closure: once to make the plan derivable, once after executing it.
- **Run the suite as bare `node --test`** — no path argument. There is no `package.json`; a
  path makes node resolve `test` as a module and die with a fake failure that reads like a
  red suite. Run it **both with and without `CLAUDE_PROJECT_DIR` set** (TASK-0122's fix makes
  both pass; only one of them ever reproduced the old defect).
- **Verify a version bump with `git show HEAD:<file>`**, never a working-tree read (F6).
- **Tick a box only against evidence you checked yourself.** Two implementer reports this
  session were subtly wrong in the safe direction, and one of my own instructions was wrong
  (I told an agent `grep -rn "mcp__\|fetch(" lib/` "must return nothing" — it never did:
  `lib/selfcontained.mjs` holds a detector regex containing `fetch(`. Scope that check to
  changed files).

## Model tier

`sonnet` / `cc/claude-sonnet-5[1m]` (`defaultTier`; `tiers.mjs --check` exit 0, all three
`unchanged`). No escalation — the spec settles the judgment calls. **Verify the served model
from the first dispatch's transcript** before launching siblings; all five dispatches this
session served `claude-sonnet-5`, read from per-request records, not self-report.

## Done means

TASK-113 **Done on the board via `spec-bridge:sync`'s derived plan** (never hand-set), one
merged PR (**merge commit, never squash** — squashing orphans the commits wiki notes pin),
all four project gates green on `main`, wiki fresh, `git worktree list` showing no stale
sweep worktrees, and the runbook's execution log closed. Then **TASK-108, the epic, closes
with NO PR of its own** (`docs/principles.md` P2).

Anything short of that gets reported as exactly what remains — the resolution quirk and any
live-write AC included — not rounded up.

## Known open, not blocking

- **TASK-0123** — a CI-only teardown flake (`ENOTEMPTY` on `rmdir .git` in
  `test/stop-docs-window.test.mjs`). **Proven a flake:** the same commit failed then passed
  on rerun with no code change. If CI goes red on something unrelated to your diff, check
  this before diagnosing your own work.
- `docs/wiki/spec-bridge-plugin.md` sits 443 chars over the 8,000 budget, already
  `size_budget_exempt` with 2 chars of headroom on `main`. Pre-existing; a warning, not a
  failure. **Do not widen the exemption** — split or trim if you add to it.
