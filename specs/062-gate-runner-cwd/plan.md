# 062 — plan

**Constitution:** absent on this host (`.specify/` is not installed, so there is no
`memory/constitution.md`). Per the sweep's plan-step rule, this plan is checked against the
project's grounding docs instead — `CLAUDE.md` (the PDLC block and the enforcement split),
`docs/principles.md` (artifact-grounded action; one TASK, one PR), `docs/releasing.md` (the
version-bump rule), and `docs/wiki/gate-runner.md` + `docs/wiki/gates-convention.md` (what
the gate contract currently claims). Not treated as ceremony: the releasing and
enforcement-split rules directly shape Phase 4 below.

## Approach

A one-line precedence change, plus the honesty work that makes it safe: a decoy test that
fails against today's code, an audit of eight workarounds, and the released-surface
obligations. The change is small; the *proof* is the work.

**Why this is lower-risk than "changes a contract nine plugins rest on" suggests.** The only
production caller — `runStopHook` at `lib/gate-runner.mjs:77` — passes **no** cwd, so it
lands in the unchanged branch of the precedence by construction. Every caller that *does*
pass a cwd is a test, and all eight already delete the env var to get the behaviour this
change makes the default. So the fix moves the code toward what every caller already wants.
Verified by enumerating `evaluate(` across `lib/`, `scripts/`, `*/gates/`, `*/scripts/`:
four hits, of which one is the definition, one is `runStopHook`, and two are an unrelated
same-named function in `scripts/check-version-bump.mjs`.

**The precedence, decided (R3).** Three inputs, most specific first:

```
explicit { cwd } option  →  input.cwd (the hook's report of where it fired)  →  process.cwd()
                                    ↑ env var CLAUDE_PROJECT_DIR sits here, as the
                                      harness's statement of the project root, ahead of
                                      input.cwd but behind an explicit argument
```

Rationale to state in the contract comment: an explicit argument is a caller naming a
directory on purpose and must never be silently overridden. `CLAUDE_PROJECT_DIR` is the
harness's authoritative statement of the project root and stays ahead of `input.cwd`,
because `input.cwd` is merely where the hook happened to fire (in a worktree, a subdir, or
wherever the session sat) while the env var names the project. Nothing-passed behaviour is
therefore byte-identical to today.

## Phases

Each phase is a dispatch unit: one fresh implementer, re-grounded from this spec dir plus
the branch's commits. Nothing rides chat context between phases. Push after every phase
(runbook F4). Run the suite as bare `node --test` — no path argument (runbook gate).

### Phase 1 — The decoy regression test, RED first (R4)

Write the test before the fix, and watch it fail. A regression test that never failed is
not evidence.

- Add to `test/board-provider-seam.test.mjs` (where the gate-runner integration tests
  already live): set `CLAUDE_PROJECT_DIR` to a decoy dir, pass an explicit `{ cwd }` at a
  real fixture, assert the gate resolved against the fixture and not the decoy.
- **Record the RED**: run it against unmodified `lib/` and capture the failure in the commit
  message. This is the artifact proving the defect is real, not inferred.
- Restore the env var in a `finally`, so the new test doesn't itself leak state.

### Phase 2 — The precedence change (R1, R2, R3)

- `lib/gate-runner.mjs:39` → explicit `{ cwd }` first, then `CLAUDE_PROJECT_DIR`, then
  `input.cwd`, then `process.cwd()`. The signature must distinguish "no cwd passed" from a
  passed value, so default the option to `undefined` and fall back inside the expression
  rather than in the destructuring default (today's `{ cwd = process.cwd() }` makes the two
  indistinguishable — that is the mechanical reason the bug was possible).
- State the ordering and its rationale in the contract comment at the top of the file (R3).
- Phase 1's decoy test must now pass. Re-run the full suite BOTH ways.

### Phase 3 — Audit the eight guards (R5)

For each of `install-path`, `spec-bridge`, `root-guard-hook`, `phase-status`, `pdlc`,
`team-review`, `reorient`, `board-provider-seam`: read what the guard protects, then remove
it if the fix makes it redundant, or keep it with a one-line comment stating why.

Expect keeps as well as removals — a test that spawns a **subprocess** still needs the env
var managed, because the precedence change only governs in-process resolution and a child
inherits the ambient environment regardless. Classify per file rather than assuming; a
blanket removal would reintroduce failures in exactly the subprocess-shaped tests.

Suite green both ways after the audit.

### Phase 4 — Release obligations and re-ground (R7)

- `node scripts/sync-shared.mjs` so all **nine** vendored copies match, then verify none
  drifted.
- Marketplace version bump per `docs/releasing.md`; `node scripts/sync-version.mjs --check`
  exits 0. **Verify the bump with `git show HEAD:<file>`, never by reading the working
  tree** (runbook F6 — a `--check` against a dirty tree proves nothing).
- Re-ground with the classifier: `node grounding-wiki/gates/cli.mjs plan . docs/wiki`,
  classify each stale pin RE-PIN-ONLY vs NEEDS-REVIEW by reading the diff over its sources,
  amend prose before bumping any pin. Expect a large set — a version bump touches every
  `plugin.json` — plus the ~10 notes sourcing `gate-runner.mjs`, of which
  `docs/wiki/gate-runner.md`, `chassis.md`, and `gates-convention.md` are NEEDS-REVIEW
  candidates because they describe the contract this spec changes.
- **Re-run the freshness gate AFTER committing the re-pins** (runbook: re-pins CASCADE — a
  note listed in another note's `sources:` propagates staleness when re-pinned).
- Update `docs/wiki/gate-runner.md`'s prose about resolution order; check whether
  `CAPSULES.md` needs a line.

## Risks

- **Subprocess-shaped tests.** Mitigated by Phase 3's per-file classification.
- **Re-pin volume.** Mitigated by using the classifier rather than hand-picking, and by the
  cascade re-run.
- **A downstream host pinning the old precedence.** No evidence any does — every in-repo
  caller that passes a cwd wants the new behaviour. Noted, not designed around.

## Test strategy

`node --test` (bare, no path) after every phase, run **both** with `CLAUDE_PROJECT_DIR` set
and unset — the defect only reproduces with it set, so a single run is not proof. Plus the
three required project gates (`check-docs`, `sync-version --check`, and the suite) and the
wiki freshness gate before the PR.
