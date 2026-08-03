# pdlc — bootstrap a project for the praxis development lifecycle, then run it

The suite-level installer plus the lifecycle's orchestrator. Three skills:
`bootstrap` stamps a **new or existing** folder as a PDLC project; `sweep` runs a set of
that project's board tasks through the whole lifecycle automatically; `refactor-triage`
closes the loop after a sweep — evaluate the merged work for debt and drift, triage the
findings, and card accepted items back onto the board as sweepable tasks.

`bootstrap`:

- Plants the always-on grounding into the project's `CLAUDE.md` — the praxisflux loop, each
  plugin's role and entry skill, the gates principle, the `.handoff/` transport — inside
  `<!-- pdlc:grounding BEGIN/END -->` markers, so an existing `CLAUDE.md` is appended to,
  never clobbered, and updates refresh the block wholesale (drift is diffed and confirmed,
  never silently overwritten).
- Gitignores `.handoff/` and stamps a `.pdlc` sentinel recording the plugin version and peer
  choices (the marker `installMode` keys fresh vs. update on).
- Treats **Backlog.md** and **GitHub Spec Kit** as officially supported peer utilities:
  recommends installing them when their CLIs are absent; when present, asks the user to opt
  in and, on opt-in, runs their init (`backlog init` / `specify init`, skipping when
  `backlog/` or `.specify/` already exist) and plants their convention blocks.

Deterministic planting lives in `scripts/plant.mjs` (chassis: `lib/installer.mjs`,
`lib/template.mjs`); the skill supplies the judgment around it. Phase separation holds:
bootstrap sets the table and hands off to `wiki-build`, `spec-bridge:link`, and
`codebase-to-course` — it never invokes them.

```
/pdlc:bootstrap          # fresh install, or idempotent update after a plugin upgrade
```

`sweep` — the board-sweep orchestrator. Given a set of board tasks (ids, a label, or a
synthesis doc naming them), it **authors a dependency-laned runbook** — develop-parallel /
merge-serial lanes, model tiers per the host rubric, the project's per-PR gates enumerated,
concurrency doctrine for repos with other agents live, operator checkpoints, done-means —
commits it to `docs/design/<slug>-runbook.md`, and stops for operator sign-off. Given an
**existing signed-off runbook**, it executes: per task, spec → `spec-bridge:link` → worktree
→ delegated implementation → PR → serial merge → re-ground, logging each landing in the
runbook so a fresh session can resume the sweep from the runbook + board alone. A runbook is
an instruction-bearing artifact, so the adopt path refuses one that isn't verifiably
signed-off, committed, and board-backed.

```
/pdlc:sweep TASK-12 TASK-13 TASK-15            # author the runbook, stop at sign-off
/pdlc:sweep docs/design/payments-runbook.md    # adopt + execute a signed-off runbook
```

`refactor-triage` — the post-sweep (and periodic) debt evaluator: sweep → refactor-triage
→ debt tasks → next sweep. Three entry modes — a commit **range** (post-sweep), **whole-repo**
(periodic), or **headless** with a declared triage policy in place of conversation. It
orchestrates `team-review:team-review` as the evaluation engine when installed (the range
and drift framing ride in through the lens; an inline eval pass when absent — team-review
itself is unchanged), and range mode adds an intent-drift pass against the sweep runbook,
merged PR specs, and pinned `docs/wiki/` notes. Every finding gets an accept / reject /
defer disposition with rationale in a tracked triage record
(`docs/reviews/refactor-triage-<run-id>.md`); accepted findings become labeled,
finding-citing backlog tasks via the CLI — immediately sweepable.

```
/pdlc:refactor-triage --range v0.38.0..v0.39.0   # post-sweep: triage the merged range
/pdlc:refactor-triage                            # periodic whole-repo debt pass
/pdlc:refactor-triage --range v0.38.0..v0.39.0 --policy "accept sev≥high, defer rest"   # headless: declared policy, no operator
```

## Planted enforcement — the opt-in root-guard hook

`bootstrap` can also plant a hardened **root-guard `PreToolUse` hook** (spec 051 / TASK-101).
It enforces the **root-read-only + worktree-only** workflow doctrine the suite already
plants as prose: at the root checkout it blocks `git commit` **except** board-sync commits
scoped entirely to `backlog/` and merge-concluding commits (`MERGE_HEAD` present), blocks
`rebase` and force-`push` repo-wide, and blocks `--amend`/`cherry-pick`/`revert`/`am`/
`merge --squash`/branch-creation at root; its `pre-write` half blocks Write/Edit of tracked
root files. Worktrees under `.worktrees/` have their own toplevel and pass. It is the
suite's **first `PreToolUse` hook** — every other shipped hook is an advisory Stop gate
routed through `lib/gate-runner.mjs`; this one hard-blocks a tool call (exit 2).

**Opt-in, never default-on.** A hard blocker enforcing praxisflux's own convention would
break bootstrap's "safe to install anywhere" property in any host that has not adopted
worktree discipline, so nothing is wired unless a host asks for it (spec 051 Phase 1). To
enable it, bootstrap offers it like a peer; the plant is:

```
node ${CLAUDE_PLUGIN_ROOT}/scripts/plant.mjs --root <dir> --hook root-guard
```

which **copies BOTH** `pdlc/hooks/root-guard-hook.mjs` **and** its scanner
`pdlc/hooks/shell-scan.mjs` (the hook `import`s `./shell-scan.mjs` — a planted hook missing
its scanner is broken) into `<root>/.claude/hooks/`, and **merges** two `PreToolUse` entries
into `<root>/.claude/settings.json` — `Bash → … pre-bash`, `Write|Edit|NotebookEdit → …
pre-write` — preserving any hooks already there. The choice is recorded in the `.pdlc`
sentinel's `hooks` array and re-presented as a default on update. There is deliberately **no
env-var bypass**; emergencies go through the operator editing the hook config.

**Workarounds for a host still running an UNPATCHED copy.** The upstream promptworld hook
mis-parses a commit message that contains a newline or a `)` — which the standard
`Co-Authored-By: Claude Opus 5 (1M context) <noreply@…>` trailer carries at once — and
wrongly reads the shattered message words as out-of-scope pathspecs, blocking a legitimate
`backlog/` board-sync commit. Until a host adopts this replacement, two workarounds get a
board-sync commit through the old copy:

- **`-F <file>`** — pass the message via a file (or `git commit -F - <<'EOF' … EOF`) so the
  hazardous characters never sit on the command line the classifier scans.
- **`-C <repo>`** — for the cross-repo false-positive (the old hook fired on commits
  targeting a *different* repository than `CLAUDE_PROJECT_DIR`, resolving the staged set
  against the wrong repo), pass `-C <the-repo-being-written-to>` so it resolves the correct
  toplevel.

The hardened hook needs **neither** workaround — the verbatim trailer commits at root
unmodified, and out-of-jurisdiction invocations pass.

**What changed vs the promptworld copy** (AC #6 — so an adopting host can tell what it is
replacing). The **policy is ported verbatim in behavior**; only the parsing changed:

- The two quote-blind regexes (boundary class ``[;|&\n`)]`` + tokenizer
  ``("[^"]*"|'[^']*'|\S+)``) are replaced by a single-pass **quote-state scanner**
  (`shell-scan.mjs`) that honors single quotes, double quotes, and backslash escapes across
  newlines, so a separator *inside* a quoted string is not a command boundary.
- **Heredoc bodies are stripped before scanning**, so `git commit -F - <<'EOF' … EOF` (the
  sanctioned workaround) parses to `git commit -F -` and is evaluated normally instead of
  having its body misread as shell text.
- The scanner models **ANSI-C `$'…'`** (including `\'`), **locale `$"…"`**, and a
  **trailing line-continuation backslash**, so those executable forms scan as parseable and
  are gated normally rather than waved through (spec 051 R2a — the residual fail-open is now
  narrowed to forms `bash -n` itself rejects).
- **Jurisdiction keys on the resolved repo toplevel** via a correctly-resolved `effDir`
  (`cd`/`-C` threaded through the scanner), so an invocation targeting another repository is
  out of jurisdiction and passes (R5(a)).
- The `git` token must be in **command position**, so prose that merely mentions "git
  commit" inside a quoted argument is not classified as a VCS write (R5(b)).
- Refusals are **self-diagnosing**: a correct denial names the specific token read as an
  out-of-scope pathspec (R3), not just the rule.

No lifecycle of its own, so no Stop hook — the plugins it wires in bring their own gates
(and `sweep` defers to the host project's own gates per task; `refactor-triage` ships a
prose output gate: no created task without a cited finding, no "triage done" without the
report + triage record on disk). The opt-in root-guard hook above is the one enforcement
`pdlc` itself ships: a `PreToolUse` blocker planted into a host, distinct from the plugins'
advisory Stop gates.
