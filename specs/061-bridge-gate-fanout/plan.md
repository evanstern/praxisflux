# spec 061 — implementation plan

**Constitution check: this host has NO ratified constitution.** There is no `.specify/`
directory and no constitution document, ratified or template. Stating that plainly rather
than treating the check as ceremony. This plan is therefore checked against the project's
actual grounding artifacts:

- `CLAUDE.md` (repo orientation + the planted PDLC block) — artifact-grounded action, one
  TASK/one PR, gates, handoffs, grounding freshness.
- `docs/principles.md` — the canonical "101" rules.
- `docs/wiki/spec-bridge-plugin.md`, `docs/wiki/gate-runner.md`,
  `docs/wiki/test-suite-catalog-plugins-gates.md` — the code-grounded notes covering the
  surface this touches.
- `docs/design/bridge-gate-fanout-runbook.md` (signed-off) — the enumerated per-PR gates.

## Grounding check — what the corpus says about this surface

`spec-bridge-plugin.md` describes the bridge as *pure one-way derivation* with an
*exceeds-blocks* gate and an *opt-in project-gate check*. Two constraints follow, and this
plan is shaped by them:

1. **`gates/` is read-only.** It runs the host's declared subprocesses but writes nothing
   itself. R4's instrumentation is the one write this spec introduces, so it must be **opt-in,
   outside the tracked tree, and verdict-neutral** — otherwise it violates the plugin's own
   stated contract.
2. **The gate-runner already owns the block/warn split.** `evaluate()` collects `problems`
   (blocking) and `warnings` (stderr, exit 0). R2 needs no new channel — it needs to route a
   dirty-tree verdict into the channel that already exists. Prefer using that seam over
   changing `lib/gate-runner.mjs`.

## Design

### The shape of the collapse (R1)

Today: `evaluateProjectGates(link, gates, run)` is called inside the per-task loop and
returns per-link findings.

After: gate evaluation moves **out** of the per-task loop and runs **once** per invocation,
over the set of specs that qualify. The per-task loop's job narrows to what it already does
well — computing verdicts and collecting `exceeds`/`lags` findings.

Sketch (not prescriptive about names):

```
// pass 1 (existing loop): verdicts, exceeds/lags findings, and collect qualifying specs
//   - checkBridge:  specs where derived.status === DONE_ELIGIBLE
//   - verifyBridge: specs with >= 1 ticked box, partitioned by bucket eligibility
// pass 2 (new, once): for each distinct gate, run it; if not green, emit ONE finding
//   naming gate + reason + count of affected specs
```

The bucket asymmetry (R1) is preserved by tracking two counts — specs eligible for
`required` and specs eligible for both buckets — so a `redByConstruction` gate's finding
counts only the Done-eligible specs it actually applies to. This is why the collapse tracks
*counts per bucket* rather than one global count.

`memoizeRun` stays. It is now largely redundant for `checkBridge` (one pass = one run per
command) but remains correct and still matters if a future caller re-enters.

**Keep `evaluateProjectGates` exported.** `test/project-gates.test.mjs` imports it and it is
the documented pure evaluator. Options: keep it as the single-gate-set evaluator with a
collapsed return shape, or keep it intact and add a collapsing caller. The implementer picks,
with one hard constraint: **no silent behavior change for existing green-path callers**, and
if the export's shape changes, its doc comment and every call site change with it.

### The dirty-tree label (R2)

- One small helper: `isTreeDirty(root)` → `true` / `false`, via `spawnSync("git", ["status",
  "--porcelain"], { cwd: root })`. Non-empty stdout = dirty. **Any** failure (non-zero exit,
  spawn error, git absent) → `false` (treated clean, keeps blocking) per R2's fail-closed
  rule. Argv only, `shell:false`, matching `runGateCommand`'s existing posture.
- Compute **once per invocation**, not per gate or per spec.
- When dirty, the collapsed gate finding is emitted into `warnings` instead of `problems`,
  with the label. `bridgeGate.check` returns `.problems` and `.warn` returns `.warnings`, so
  routing there is enough — no change to `lib/gate-runner.mjs`.
- **The one wrinkle to get right:** `bridgeGate.warn` currently calls
  `checkBridge(root, { runGates: false })` — deliberately, so a Stop pays for the subprocesses
  once rather than twice. A dirty-tree gate warning must therefore **not** require running
  gates in the `warn` pass. Resolve by having `check` (which does run gates) return the
  dirty-tree gate warnings alongside its problems, and route them through — not by flipping
  `runGates: true` in `warn`, which would double every gate run and is exactly the cost
  regression spec 050 fixed. The implementer must state in `tasks.md` which mechanism was
  used and confirm the subprocess count did not increase.

### Instrumentation (R4)

- Env-gated: absent → not one extra syscall, byte-identical behavior.
- Writes one append-only JSONL record per invocation to a path outside the tracked tree
  (respect `CLAUDE_JOB_DIR`-style scratch if available; otherwise the OS temp dir). Never
  inside the repo — a Stop hook that dirties the tree would poison the very check R2 adds.
- Captures: timestamp, resolved roots, and per gate command argv/cwd/status/signal plus
  **bounded** stdout/stderr (cap the capture; a 45s suite's output is large).
- Verdict-neutral: instrumentation failure is swallowed. It never turns a green gate red.

## Phases (tasks.md carries the checkboxes)

Sequenced so **every commit leaves the suite green** — `.githooks/pre-commit` runs the full
bare `node --test` on every commit, so a phase that reds the suite blocks its own commit.

- **Phase 1 — Tests first (red), then collapse (R1, R3 part 1).** Write the fan-out
  regression with its negative control, watch it fail against current behavior, then
  implement the collapse until green. Tests-first is load-bearing here: the negative control
  is the only thing proving the fix does what it claims, and a test written after the fix
  tends to assert the new behavior rather than distinguish it from the old.
- **Phase 2 — Dirty-tree label (R2, R3 part 2).** `isTreeDirty` + routing + the fail-closed
  case + tests, including the clean-tree-still-blocks control.
- **Phase 3 — Instrumentation (R4).** Opt-in capture of roots + per-command detail; a test
  that the default path writes nothing and the verdict is unchanged.
- **Phase 4 — Dogfood, catalog, bump, re-ground.** Confirm this repo's own Stop output
  collapsed (the end-to-end check the change is *about*); catalog the test changes in
  `docs/wiki/test-suite-catalog-plugins-gates.md`; bump the marketplace version and re-sync
  every `plugin.json`; re-pin staled notes honestly; re-run the freshness gate **after** the
  re-pin commit for the cascade.

## Risks and the specific traps this repo has already paid for

- **Dogfood recursion.** This repo's `.spec-bridge.json` opts into four project gates, and
  `bridge.mjs` is the file being edited. The `SPEC_BRIDGE_GATE_ACTIVE` re-entrancy guard and
  its **injected-`run` bypass** (spec 050 defect 1) must keep working, or the suite reddens
  itself: `node --test` runs the injected-run tests with the flag set, and without the bypass
  every one fail-closes to `[]`.
- **`node --test` with a path argument** resolves `test` as a module and dies
  `Cannot find module '<root>/test'`, reporting `tests 1 / fail 1` — a fake red that has cost
  three wrong conclusions. Always bare.
- **Scratch files in the worktree get collected as test files.** Write throwaway output to
  the job scratch dir, never the worktree.
- **F6:** verify a commit's content with `git show HEAD:<file>`, never by reading disk. Every
  `--check` is a statement about the *tree* until `git status --porcelain` is empty. This task
  is F6 applied to the bridge, so it is held to F6 in its own verification.
- **`docs/wiki/spec-bridge-plugin.md` is already over budget (8,446 chars) and
  `size_budget_exempt`** while being the note this change's subject matter lands in. Its prose
  must come out **net-neutral-or-smaller**: say the new thing by replacing the sentence it
  supersedes. Do not extend the exemption to cover new growth; do not attempt TASK-95's owed
  split here.
- **Re-pins cascade.** `test-suite-catalog-plugins-gates.md` is a hub note pinning a test file
  this task edits, and the version bump touches every `plugin.json` (~17 notes staleable).
  One freshness pass is not enough — re-run after the re-pin commit.
- **TASK-113 is live** on `lib/board-mirror.mjs`. Read it; never edit it. On conflict in
  `bridge.mjs`'s import block, take main's side.

## Verification

- Bare `node --test` green (508 baseline + new cases).
- `node scripts/check-docs.mjs`, `node scripts/sync-version.mjs --check`, and
  `node grounding-wiki/gates/cli.mjs freshness . docs/wiki` all green — re-run after every
  history move, unconditionally.
- **Dogfood:** the repo's own Stop-hook gate, with a deliberately red gate, emits one finding
  rather than ~57. This is the acceptance evidence for R1 in situ.
- Branch is **pin-carrying** (it re-pins wiki notes to its own commits): merge `origin/main`
  **in**, never rebase/squash/force-push, and land the PR as a merge commit.
