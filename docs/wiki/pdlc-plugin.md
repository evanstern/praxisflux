---
name: pdlc-plugin
description: The pdlc plugin — suite-level installer plus the lifecycle's orchestrator; bootstrap plants the always-on PDLC grounding as a version-stamped CLAUDE.md block (scripts/plant.mjs, whose --check exits 1 with a remedy line and is what a bump forces a re-plant against), stamps the .pdlc sentinel, gitignores .handoff/ (tracked, or local-only), opts into the peers (Backlog.md, Spec Kit, Jira), and can plant two opt-in PreToolUse hooks; the three lifecycle skills have their own notes.
kind: component
sources:
  - pdlc/.claude-plugin/plugin.json
  - pdlc/README.md
  - pdlc/skills/bootstrap/SKILL.md
  - pdlc/skills/design-rounds/SKILL.md
  - pdlc/scripts/plant.mjs
  - pdlc/scripts/tiers.mjs
  - pdlc/templates/CLAUDE.md
  - pdlc/templates/model-tiers.json
  - pdlc/hooks/read-size-gate.mjs
  - pdlc/hooks/README-read-size-gate.md
verified_against: 9b410267ee638ee2d16e8dc4aba28e29808ccf54
---

# pdlc plugin

The `pdlc` plugin (lockstep with the marketplace version) is the **suite-level installer plus
the lifecycle's own orchestrator**: `pdlc:bootstrap` stamps a folder (new or existing) as a
**praxis-development-lifecycle project** whose always-on context knows the whole loop — the
suite-wide application of the [[skill-patterns]] rule "plant a project CLAUDE.md" (a plugin
has no always-on slot). Three further skills run the lifecycle it installs.

## The sibling skills — covered in their own notes

Three seams, three notes, each carrying its own skill's pins: `design-rounds` owns the seam
**before** the spec, where sweep's ordering cannot start — work whose deliverable is
unknowable until an operator picks among options ([[pdlc-design-rounds]]); `sweep`
orchestrates a set of board tasks into merged PRs, parallel lanes and serial merges
([[pdlc-sweep]]); `refactor-triage` closes the seam **after** the merge, evaluating merged
work for debt and intent drift and carding accepted findings back
([[pdlc-refactor-triage]]).

## The planted grounding is a marked block, not a file

Everything planted rides between `<!-- pdlc:grounding BEGIN/END -->` markers rendered from
`pdlc/templates/CLAUDE.md` — composing with an existing `CLAUDE.md`, refreshed wholesale,
drift never overwritten without `--force`; peer conventions ride nested `pdlc:peer:*`
sub-blocks, stripped unless opted in. [[pdlc-grounding-block]] owns both that mechanism in
full and what the block *says* (the 101 principles and per-peer mappings, corpus-loading and
Gates rules, `## Model tiers` and its `Dispatch:` record marker).

One property belongs here, because `plant.mjs` is where it bites: the BEGIN marker **stamps
the planting version**, so a marketplace bump drifts every planted block by construction and
forces the re-plant into the same PR ([[release-pipeline]]).

## Deterministic core: scripts/plant.mjs

A dual-use module (library + CLI, [[chassis-utilities]]' `runAsCli`) on the [[installer]]
chassis and `template.mjs`:

```
node ${CLAUDE_PLUGIN_ROOT}/scripts/plant.mjs --root <dir> [--name <n>] [--peer <p>]…
       [--hook root-guard] [--local-only] [--check] [--force]
```

renders the expected block and lands it (`created` | `appended` | `replaced` | `unchanged` |
`drifted`), gitignores `.handoff/` (the [[handoff-protocol]] transport — tracked or
local-only, below), and stamps the `.pdlc` sentinel — a JSON record of version + resolved
name + peer choices + mode that fresh-vs-update keys on. Two load-bearing properties: the
sentinel never advances past an unconfirmed drifted block; `--check` writes nothing and exits
1 while planting is pending (the skill's output gate).

Since 0.64.0 (spec 066) that failing path prints its **remedy** on stderr, not just the state
(`drifted`) — a gate not naming the fix is half a gate ([[gates-convention]]). Two variants,
since the states need different first steps: a `drifted` footprint must be DIFFED before
anyone consents to losing it, a merely-behind one just needs the plant run; both name
`pdlc:bootstrap`, `--force`, `docs/releasing.md`. `--check` stays read-only (every write is
`!check`-guarded), and this repo now runs it in `ci.yml` — the surface that makes that exit
code mean something ([[release-pipeline]]).

Since 0.23.0 absent peers leave a **deterministic trace** (TASK-43 #1: omission stays the
opt-out, never silent) — `peersOmitted` in the sentinel plus one stderr notice per omitted
peer naming its stripped block. It derives from the peer choices, so a same-peers re-plant
stays `unchanged`.

Since 0.26.0 the rendered PROJECT_NAME stops trusting `basename(root)` (TASK-43 #2: a
worktree plant otherwise bakes the worktree's name into the heading, spuriously drifting the
real root). Ladder: `--name` > the sentinel-recorded name > a worktree's PRIMARY checkout
basename (its `gitdir:` pointer) > `basename(root)`. The recorded `name` is **sticky** — a
re-plant from a differently-named checkout stays `unchanged`, which is also what keeps the CI
gate from firing on a renamed `actions/checkout` directory; only `--name` changes it, as
honest drift. Legacy sentinels missing either field are never rewritten to gain it.


## Peer utilities are first-class, not assumed

Backlog.md, GitHub Spec Kit, and Jira are **officially supported peers**. Backlog.md and
Spec Kit are detected by CLI (`backlog`, `specify`); Jira differs **in kind** — no CLI to
detect, so availability means the Atlassian MCP server's tools are present, never
`command -v`. Absent a CLI peer the skill recommends installation (the plant's trace is the
durable record); present, it asks opt-in and runs its init (`backlog init` / `specify init
--here`) or, for Jira, resolves `cloudId`/`projectKey` by discovery, skipping if already
initialized. **Backlog.md and Jira are mutually exclusive** — one board, singular (design
invariant 2) — so `plant.mjs` throws naming that reason. Opt-ins select which convention
blocks render, recorded in `.pdlc`; an update re-presents them as defaults.

## Local-only planting mode — tracked vs. guest (spec 060)

By default artifacts land tracked and `.handoff/` joins `.gitignore` via `ensureGitignore`
([[installer]]) — wrong for a repo the operator is a **guest** in, not owns. `--local-only`
(bootstrap 0.13.0) redirects the footprint into `<gitdir>/info/exclude` via `ensureExclude`
instead — per-clone, never committed. The skill offers rather than assumes (recommended when
the tracked tree shows no prior PDLC adoption; update defaults to the sentinel's choice).

`excludeSet({ peers, hooks })` scopes the excluded lines to exactly what was opted into
(`/backlog/` and `/.specify/` per peer, the `.claude/` settings+hooks pair per hook) on top of
the always-on footprint — never the whole possible set. `plant()` writes it **first** (R3), so
there is never a dirty working tree for a beat. `gitignore`/`exclude` are complementary report
fields (one `skipped` per mode); `exclude: "no-git"` surfaces [[installer]]'s pre-init
degradation (R6), leaving `--check` pending until a re-plant once the repo exists.

The sentinel records `localOnly` (absent-tolerant like `name`/`hooks`). A **mode switch** —
sentinel vs. requested mode disagreeing — is drift on its own `modeSwitch` field
(`none`|`drifted`|`applied`), diagnosable apart from `claudeMd: "drifted"` (content, not
mode); unconfirmed it doesn't advance, and `--force` is the consent path drift already needs
— no migration command.

## Two opt-in PreToolUse hooks

Since 0.53.0 (bootstrap 0.10.0) bootstrap can plant a hardened **root-guard `PreToolUse`
hook** (spec 051 / TASK-101) enforcing root-read-only + worktree-only — the suite's **first**
`PreToolUse` hook (every other is an advisory Stop gate via [[gate-runner]]), a shape that
hard-blocks a tool call (exit 2). `--hook root-guard` copies BOTH `root-guard-hook.mjs` and
`shell-scan.mjs` into `.claude/hooks/` plus two merged `PreToolUse` entries into
`.claude/settings.json` — **opt-in, never default-on**, recorded in `.pdlc`'s `hooks`.

Since 0.63.2 (spec 064) a **second** planted hook, `read-size-gate.mjs`, denies Read/Bash
reads over a configurable line threshold (default 500), redirecting to capsule-first loading
or `defaultTier` Agent dispatch. Same posture, plus its own kill-switch
(`PRAXIS_READ_GATE_OFF=1`, required for grounding-wiki/design-rounds passes) and no
`plant.mjs` automation yet — wired by hand. Full policy: `pdlc/README.md`,
`pdlc/hooks/README-read-size-gate.md`.

## What it deliberately does not do

Phase separation ([[skill-patterns]]) holds: bootstrap creates no `docs/wiki/`
([[grounding-wiki-plugin]]) and no `docs/course/` ([[codebase-to-course-plugin]]), and never
invokes sibling skills — it sets the table and hands off. No **Stop** hook either: pdlc has
no lifecycle of its own, the wired-in plugins bring their own gates ([[gates-convention]]),
and its shipped enforcement is the two hooks above.
