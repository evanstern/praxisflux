---
name: explain
description: "Use when the user wants to build a new explainer artifact (a PR explainer, architecture site, decision briefing, or onboarding guide) from cited facts — e.g. \"/explain pr-explainer poc/vcs-port\", \"explain this architecture\", or \"build an onboarding guide for this repo\"."
argument-hint: "<kind> [sources…] [--yes] [--multi] [--name <slug>]"
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Task, ToolSearch, Artifact
---

# /explain

**Arguments:** $ARGUMENTS

Parse `$ARGUMENTS` as `<kind> [sources…] [--yes] [--multi] [--name <slug>]`:

- `<kind>` — a profile id (`pr-explainer`, `architecture-site`,
  `decision-briefing`, `onboarding`, or a project/pack override).
- `[sources…]` — free-form positionals naming what to explain (a branch
  range, a repo path, a URL) — handed to the interview's where-to-look
  question as additional context, not parsed further here.
- `--yes` — headless: skip the interview and the outline approval gate,
  never approve a generator, and skip publish if the Artifact tool isn't
  available (report "not published" instead of guessing).
- `--multi` — build the multi-file shape (`dist/<name>/<id>.html` + shared
  `site.css`/`site.js`) instead of the default single-file shape.
- `--name <slug>` — the artifact folder name under `docs/explainers/`; if
  omitted, the `explain` skill derives one.

Load the `explainer` skill (`explainer:explainer`) and hand it these
parsed arguments. The skill owns the entire flow from here — interview,
gather, plan (with the outline approval gate), write, build, check, the
bounded fix loop, publish, commit, and report — as documented in its own
`references/pipeline.md`. Do not reimplement any part of that flow in this
command; it exists only to parse `$ARGUMENTS` and load the skill.
