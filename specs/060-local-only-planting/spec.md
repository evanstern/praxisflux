# Spec 060 — local-only planting mode

**Task:** TASK-116 · **Branch:** `task-116-local-only-planting` · **Runbook:**
`docs/design/local-only-planting-runbook.md`

## Problem

`plant.mjs` assumes the host repo IS the praxisflux project. It appends `.handoff/` to the
host's **tracked** `.gitignore` and lands `CLAUDE.md`, `.pdlc`, `.claude/agents/`, and
`model-tiers.json` as ordinary files the host is expected to commit. That is correct when
you bootstrap your own project and wrong when PDLC is a tool an operator brings to a repo
shared with a team that has not adopted it. **There is no opt-out today.**

The alternative is already proven in the field, not invented here:
`kofile/ai-coe-plugins` has run it by hand since 2026-08-27 (`.pdlc` v0.56.0, peers
backlog + spec-kit). Every PDLC artifact is listed in `.git/info/exclude` instead of
`.gitignore`. Because `info/exclude` is per-clone and never committed, the host's tracked
tree and its own `.gitignore` stay untouched, `git status` stays clean, and nobody who
clones the repo inherits a PDLC-shaped project. The full lifecycle still runs — board,
specs, wiki, sweeps, worktrees — it just leaves no trace in shared history.

This spec exports that pattern from hand-operation into `plant.mjs` and the bootstrap
skill.

## Requirements

Mapped to TASK-116's acceptance criteria.

### R1 — a local-only mode on `plant.mjs` (AC #1)

`plant()` takes a mode selecting where ignore lines go. In local-only mode the PDLC
artifact set is appended to `<root>/.git/info/exclude`; **nothing is written to
`.gitignore`** — not `.handoff/`, not anything. In tracked mode (today's behaviour,
unchanged) `.handoff/` goes to `.gitignore` and the exclude file is untouched.

### R2 — the excluded set is complete and scoped (AC #2)

The set covers every artifact pdlc plants **or a peer init creates**:

    /.pdlc  /CLAUDE.md  /AGENTS.md  /.handoff/  /.worktrees/
    /backlog/  /specs/  /docs/wiki/  /.specify/
    /.claude/settings.json  /.claude/hooks/  /.claude/commands/
    /.claude/agents/  /.claude/skills/  /.claude/model-tiers.json

**Scoped to what was actually opted into.** A host that did not opt into `backlog` gets no
`/backlog/` line; one that did not opt into `spec-kit` gets no `/.specify/` line; one that
did not opt into the root-guard hook gets no `/.claude/hooks/` or `/.claude/settings.json`
line. Excluding a path the operator's own team tracks would hide *their* files from *their*
`git status` — the exact harm this mode exists to avoid, inverted.

Paths pdlc does not own are out of scope. `.claude/plans/` and `.claude/routes/` were the
only leakage observed downstream and belong to an unrelated plugin.

### R3 — excludes land BEFORE artifacts (AC #3)

The exclude entries are written before any artifact is created, so a **first** plant into a
clean host leaves `git status` clean. Writing them afterwards dirties the status in exactly
the repo where a clean status is the whole point. This is an ordering requirement inside
`plant()`, and it is testable by asserting write order, not merely end state.

### R4 — the mode is recorded and round-trips (AC #4)

The `.pdlc` sentinel records the mode. `--check` and re-plants are **idempotent** and report
`unchanged`. **Switching modes surfaces as honest drift needing consent** — the same
mechanism the grounding block and `--name` already use. A silent mode switch would either
strand exclude lines in a repo now planting tracked, or strand `.gitignore` lines in a repo
now planting local-only.

Legacy sentinels written before this field must keep re-planting as `unchanged`, exactly as
the `peersOmitted`/`name`/`hooks` fields already do — a host on an older `.pdlc` is in
tracked mode by definition, and gaining the field must not churn it.

### R5 — bootstrap ASKS (AC #5)

`pdlc:bootstrap` presents the choice as an explicit operator question in the same shape as
the existing peer and hook opt-ins — **not a flag you have to already know about**. It asks
whether this project is one **we own** (tracked planting, today's default) or one **we are
a guest in** (local-only), with a recommendation grounded in what it can observe: a repo
whose remote/tracked tree shows no prior PDLC adoption is the guest case. In update mode the
previous choice from `.pdlc` is presented as the default.

### R6 — pre-`git init` hosts degrade (AC #6)

`.git/info/exclude` does not exist before `git init`. Bootstrap already handles the pre-git
case for tracked planting (precondition gate step 3: say so and continue); local-only
degrades the same way — **no crash**, and a stated next step. There is no meaningful
local-only planting without a `.git/`, so the honest outcome is to name that plainly rather
than fabricate a git dir.

### R7 — tests pin the behaviour (AC #7)

`test/pdlc.test.mjs` pins: the exclude file is the write target; `.gitignore` is untouched;
the ordering of R3; the sentinel round-trip including legacy tolerance and the mode-switch
drift; and the presence of the bootstrap question in `SKILL.md`.

### R8 — gates green, grounding honest (AC #8)

Released surface is touched (`pdlc/`), so the marketplace version and the bootstrap skill's
own `version:` bump. Every wiki note whose sources this change touches is re-pinned
**honestly** — classified RE-PIN-ONLY or NEEDS-REVIEW against its own diff, never bumped to
a merge commit for convenience.

## Out of scope

- Changing which mode is the **default**. Tracked planting stays the default; the runbook
  makes flipping it an operator checkpoint, not an implementer's call.
- A migration command that moves an existing tracked plant to local-only (or back). Mode
  switching surfaces as drift and is handled by consent + `--force`; an automated migration
  is a separate deliverable if it is ever wanted.
- The `.claude/plans/` and `.claude/routes/` leakage — not pdlc's artifacts.
- `tiers.mjs`. It writes `.claude/agents/*` and `.claude/model-tiers.json`, both covered by
  R2's exclude lines, so no change to that script is required for `git status` to stay
  clean.
