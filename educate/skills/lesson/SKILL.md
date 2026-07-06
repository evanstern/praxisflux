---
name: lesson
description: Orchestrate a learning lesson's lifecycle in an educate project — placement, scaffolding, the teach-me -> build-me -> deck handoff seam, and the Definition-of-Done gate. Use when starting, resuming, or finishing a lesson, or when the user asks where a lesson should live or whether it's done.
---

# educate:lesson — the orchestration layer

This is the *logic* that used to live in the project `CLAUDE.md`, lifted into a lazily-loaded
skill. It does not teach (that's `teach-me`) and does not build (that's `build-me`); it
**routes, sequences, and gates**. Pair it with the project `CLAUDE.md` that `educate:start`
planted — that file holds the always-on copy of these rules; this skill holds the procedure.

## Placement — resolve BEFORE teaching
Convention: `topics/<topic-slug>/<NNN>-<lesson-slug>/`.
- **Topic:** use the named topic if it exists; else derive a short kebab-case slug and create it.
- **Lesson number:** lowest unused at the 100 level (101, 102, …); a new topic starts at 101.
- **Slug:** from the lesson subject, kebab-case.
- **Scaffold at the start:** copy `topics/.template/` (dot-prefixed hidden scaffolding) into
  the new lesson folder so `checklist.md` and `raw-notes.md` exist from minute one. Use a copy
  that preserves dotfiles (`cp -R`).

## Lifecycle (use these exact words everywhere)
`scaffolded` -> `taught` -> `spec'd` -> `built` -> `decked` -> `done`
- **scaffolded** — folder copied from `.template/`.
- **taught** — Socratic session complete; every checklist item demonstrated.
- **spec'd** — `HANDOFF.md` written (delegated builds only).
- **built** — `/build-me` implemented it; `POST_BUILD_HANDOFF.md` returned.
- **decked** — `deck.html` (built FROM the deck template) + `guide.md` produced.
- **done** — all required artifacts exist AND verified on disk.

## Note-taking — enforced every turn (during `taught`)
The Socratic loop runs on a strict cadence: **every question→answer exchange produces exactly
one `raw-notes.md` entry, written before the next question is posed.** This is not a closing
summary; it is a live log. Enforce it the same way you enforce the checklist:
- After the learner answers, append a Session-log entry to `<lesson>/raw-notes.md` (the
  `.template` ships the structure: Q, answer gist, verdict, the note worth keeping), then ask
  the next question. A turn without a note is an incomplete turn — do not move on.
- Promote the strong beats into `Aha moments` / `Misconceptions corrected` as they happen, so
  a later pass can find them without re-reading everything.
- Why it's worth the friction: `raw-notes.md` is the richest artifact a lesson produces — the
  raw material for later review of this lesson and for tuning past/future lesson plans. Thin
  notes make that review worthless; that's why this is enforced, not encouraged.

## The teach-me <-> build-me seam
1. `teach-me` teaches -> checklist demonstrated -> writes `HANDOFF.md` -> status `spec'd`.
   Then tell the user: "run `/build-me` on `<lesson>/HANDOFF.md`."
2. `/build-me` builds + verifies -> writes `POST_BUILD_HANDOFF.md` -> status `built`.
   It points back: "return to teach-me for the return leg + deck."
3. Back in `teach-me` (the return leg, most-skipped step): read `POST_BUILD_HANDOFF.md`,
   apply any source corrections, then build the deck + guide -> `decked` -> `done`.

## The Definition-of-Done gate (git-agnostic)
A lesson is `done` only when every required artifact is on disk. The gate is enforced by
running the plugin's script, NOT by git:

    node ${CLAUDE_PLUGIN_ROOT}/scripts/progress.mjs --root <projectRoot> <topic> --check

- Run `--sync` at the START and END of every lesson (recomputes the derived artifacts map).
- Run `--check` to gate: it exits non-zero if a lesson is marked past its artifacts
  (e.g. `done` with no deck). The `hooks/hooks.json` hook runs this automatically so a
  premature `done` is refused.
- Never advance status past `built` while `deck`/`guide` are missing.

## On resume
Read `topics/<topic>/progress.json` -> `cursor` tells you the current lesson, its status,
and the single `nextAction`. That is the unambiguous "continue where we left off."
