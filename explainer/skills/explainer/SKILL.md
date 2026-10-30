---
name: explainer
version: 0.1.1
description: "Use when coordinating the explainer pipeline end to end — interview, fact gathering, outline approval, page writing, build, check and publish — for /explain and /explain-answer. Use when the user wants to build or update a cited, house-style explainer artifact from a codebase or design docs."
allowed-tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "Task", "ToolSearch", "AskUserQuestion", "Artifact", "Skill"]
---

# explainer

You are the coordinator for the explainer pipeline — the only thing that
dispatches `fact-gatherer`, `page-writer`, and `fact-checker`, the only thing
that runs `${CLAUDE_PLUGIN_ROOT}/scripts/explainer.mjs`, and the only thing
that calls the Artifact tool for this plugin. `/explain` and `/explain-answer`
both load this skill; the full step-by-step flow, with every gate, lives in
`references/pipeline.md` — read it before running a build, not just this
file.

## Before anything else

Read `references/house-style.md` before writing or reviewing any page
content yourself (e.g. drafting the outline, or judging a fix-loop result) —
you are bound by the same rules a page-writer is. Read `references/markup.md`
before drafting `contents.json`'s page list, so you know what each page type
and pattern can actually express.

## The flow, in brief

interview → gather → plan (**outline approval gate**) → write → build →
fact-checker → check (**bounded fix loop, re-dispatching fact-checker in
re-check mode plus `fact-merge` each round**) → publish → commit → report.
Every gate, its exact skip condition, and the fix loop's **per-page
budget** (not one shared artifact-wide cap) are spelled out in
`references/pipeline.md` — this file is the map, not the manual.
Plan also sets `contents.json`'s `title` and `repo` before that gate —
the Plan section of `references/pipeline.md` has the exact derivation.

## Dispatching the agents

- `fact-gatherer` — once per artifact, after the interview (or its reuse),
  before the outline is drafted.
- `page-writer` — once per page, **in parallel**, each with only that page's
  fact ids. Never hand one page-writer another page's facts or another
  page-writer's own dispatch.
- `fact-checker` — its first pass once per build, after `explainer.mjs
  build` succeeds and before `explainer.mjs check`. Never hand it a
  page-writer's prompt — only the built HTML text, `facts.json`, and
  `contents.json`'s `sources[]`. In the fix loop, re-dispatch it in
  **re-check mode** instead, for only the pages a `page-writer` just
  edited, handing it those pages' prior flagged entries too; it writes a
  separate recheck file that `explainer.mjs fact-merge` folds back in —
  each page's rounds (build-failure and check/fact-check alike) are bounded
  together, per page, not by one shared cap.

## The CLI you drive

`${CLAUDE_PLUGIN_ROOT}/scripts/explainer.mjs`:

| Verb | Use |
|---|---|
| `new <name> --kind <k>` | Scaffold a fresh artifact folder from a profile's skeleton, when `docs/explainers/<name>/` doesn't exist yet. |
| `build --dir <artifact> [--multi] [--yes]` | Expand every page, run generators, assemble the shell, write `dist/`. |
| `approve <id> --dir <artifact>` | Record approval for one command generator at its current fingerprint. **Never pass `--yes` to skip this** — `--yes` on `build` never approves anything, by design. |
| `check --dir <artifact>` | Run every check against an already-built `dist/` — requires `build` to have run first; never rebuilds for you. The read-only checks live in `${CLAUDE_PLUGIN_ROOT}/gates/check.mjs`. |
| `plant [--check] [--force]` | Plant or refresh the marked explainer block in the project's `AGENTS.md`, keeping a `@AGENTS.md` pointer in `CLAUDE.md`. Run `--check` at step 0 of the pipeline; `--force` migrates a legacy `CLAUDE.md`-resident block after its diff is reviewed. |

Exit codes from `check`: `0` clean, `1` any error-level check failed, `2`
usage error (e.g. no `dist/` yet), `3` nothing failed but `fact.checker` is
still pending (you haven't dispatched it, or haven't re-run `check` since).

`wiki.fresh` warns when a cited `docs/wiki/` note is stale against its
`verified_against` pin. It never blocks. Re-verify the facts citing that note,
or suggest `/grounding-wiki:wiki-update` in the final report.

A Stop hook blocks the session from ending while any built page under an
artifact's `dist/` loads an external resource.

## Supporting files

- `references/house-style.md` — writing rules with stable ids, read before
  drafting or reviewing page content.
- `references/pipeline.md` — the full step-by-step flow, every gate, and the
  bounded fix loop.
- `references/markup.md` — the `x-*` authoring markup and pattern vocabulary
  page-writers use; read this before drafting an outline so you know what a
  page type can actually express.

## Headless / `--yes`

`--yes` skips the interview (if `interview.json` doesn't already exist, the
profile's defaults are used as given, with no free-form "Other") and the
outline approval gate. It **never** approves a generator — an unapproved
command generator still stops the build and is reported, not silently
skipped. With no Artifact tool available (a genuinely headless run), publish
is skipped entirely: build, check, and commit still happen, and the final
report says "not published" rather than guessing at a URL.
