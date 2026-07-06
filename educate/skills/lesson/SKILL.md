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

## Grounding — optional, BEFORE teaching (the research seam)
When the user wants the lesson grounded in real sources ("teach me X, but research first — here are
the sources: …"), ground *before* teaching so the Socratic session rests on verified facts, not
model recall. This composes with the **research** plugin through files, never by calling it directly.

- **Scope it.** Ask/infer whether the sources inform the whole series or just this lesson:
  - series-wide → `topics/<topic>/research/` (one vault serving every lesson under the topic)
  - lesson-specific → `topics/<topic>/<NNN>-<lesson>/research/`
  A lesson **consults topic-scope grounding first, then its own.**
- **Hand off to research.** Point the `research` plugin (research-vault) at that folder with the
  user's sources; it produces a grounded `_grounding.md` + neutral notes there (drop-anywhere — the
  folder becomes a vault, `.research-vault` sentinel and all).
- **Soft dependency / fallback.** If the `research` plugin isn't installed, ground **inline** (a
  WebSearch fan-out synthesized into `<folder>/_grounding.md`) rather than blocking — same output
  location, so the lesson cites it identically whether or not research is present.
- **Then teach from it.** Cite the grounding during the loop; the lesson's claims trace to gathered
  facts instead of recall.

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

## The teach <-> build seam (a separate plugin, via the handoff transport)
Implementation is a **separate plugin** (`build`). educate teaches and authors the SPEC and folds
the findings back in; it does **not** build. Payloads ride the **gitignored `.handoff/`** transport
and the evidence lives in `progress.json` — never loose `HANDOFF.md` files (see
`docs/handoff-protocol.md`).
1. `teach-me` teaches -> checklist demonstrated -> writes the SPEC as a handoff **request**
   (`.handoff/<id>.md`, `kind: request`, `from: educate`, `to: build`), sets the lesson's
   `handoff.specd=true`, status `spec'd`. Then tell the user: "run the **build** plugin (`/build-me`)."
2. The `build` plugin reads the request, builds + verifies, writes a **findings response**
   (`kind: response`, `from: build`, `to: educate`, `ref: <id>`), sets `handoff.returned=true`,
   status `built`. It points back: "return to teach-me for the return leg + deck."
3. Return leg (most-skipped step): read the findings response, apply source corrections, and record
   **durable residue** — a `## Post-build` section in `guide.md`/`raw-notes.md` — then set
   `handoff.foldedIn=true`. Build the deck + guide -> `decked` -> `done`. The gate refuses `done`
   until `handoff.foldedIn` **and** that residue both exist, so the return leg can't be skipped.

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
