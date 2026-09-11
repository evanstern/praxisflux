# 067 — Install GitHub Spec Kit tooling and retire the hand-authored-specs escape line

**Board task:** TASK-0128 · **Runbook:** `docs/design/speckit-install-runbook.md`
(signed off 2026-09-11)

Spec Kit is not installed on this host (`.specify/` absent); this spec is hand-authored
under the runbook's operator-signed escape line — deliberately the **last** use of that
precedent: the spec's own subject is ending it.

## Problem

The repo has Spec Kit's `specs/NNN-slug` artifact **layout** but not the **tooling**: no
`.specify/` (templates, memory, constitution) and no `/speckit.*` commands. Every sweep
since spec 052 has run under the hand-authored-specs escape-line precedent as a result.
The sweep skill's Output gate resolves "spec-or-escape-line" to the escape line on every
task, permanently — the escape hatch has become the default path, which is exactly what
an escape hatch must not be.

## Requirements (mapped to the card's ACs)

1. **AC #1 — tooling installed.** `.specify/` exists at the repo root with templates,
   scripts, and memory; `/speckit.*` commands are available to Claude Code in this repo
   (installed via `specify init --here --integration claude`, CLI already on PATH).
   The init run must not clobber house files: `.claude/agents/*`,
   `.claude/model-tiers.json`, `CLAUDE.md`, existing `.claude/commands/*` (if any),
   and `specs/001-066` stay byte-identical; anything the installer tries to overwrite
   takes the house side.
2. **AC #2 — templates reconciled; bridge verified.** `.specify/templates/` edited
   in place to match the house format specs 001–066 established:
   - spec header carries the board-task line (`**Board task:** TASK-<n> · **Runbook:** …`),
   - no hand-authored escape-line header paragraph,
   - `tasks.md` template produces phased checkbox sections the bridge derives from
     (`## Phase N: <name>` + `- [ ]` items — the shape `parseSpecPhasesBlock` /
     `cli.mjs state` reads).
   Verification is a real check: generate a spec dir from the installed templates,
   run `node spec-bridge/gates/cli.mjs state <dir>` against it, and record the derived
   output in this spec dir (`bridge-verification.md`).
3. **AC #3 — constitution state recorded.** Per the operator's signed decision:
   the constitution is NOT ratified in this PR. `.specify/memory/constitution.md`
   (or the file the installer scaffolds) explicitly records: unratified; planning
   runs against `docs/wiki/` + `CLAUDE.md` per house rule; ratification carded as a
   follow-up question for the operator.
4. **AC #4 — escape line retired from sweep doctrine.** `pdlc/skills/sweep/SKILL.md`
   amended: the precondition gate's missing-`.specify/` clause and the Output gate's
   escape-line clause no longer offer the hand-authored path as this host's standing
   precedent — the escape line reverts to what it was designed to be (a rare,
   operator-signed exception), and `.specify/` presence satisfies the precondition
   gate. Skill `version:` and marketplace version bumped per `docs/releasing.md`.

## Non-goals

- No reformatting of specs 001–066 (reconciliation edits templates, never history).
- No constitution ratification (operator decision — follow-up card instead).
- No changes to spec-bridge derivation code; if the tool-generated layout doesn't
  parse, the fix is the template, not the bridge.

## Done means

All four ACs checked on the card via the bridge's derived plan; one merged PR; gates
green on main; wiki re-pins honest over the touched sources.
