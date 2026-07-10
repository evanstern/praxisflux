---
name: analyze-vault
version: 0.1.0
description: >-
  Evaluate an existing topic branch in an Obsidian-style Markdown "thinking vault" and write a
  grounded, opinionated analysis — the QUERY phase: reason ACROSS the already-gathered corpus to
  answer a question, form a working thesis, weigh tradeoffs, and reach a recommendation. Use this
  whenever the user wants to make sense of, evaluate, compare, decide, or "get a take on" a topic
  that already exists in the vault, or says "analyze the X branch", "what should I pick given my
  notes on Y", "weigh the options in Z", "what does my research on … actually say", "synthesize
  this branch", or "give me a recommendation from the vault". This skill reads what's there and
  adds an analysis note; it does NOT gather new research (that's research-vault) or build charts /
  HTML pages (that's vault-artifact). It requires a branch that already has grounding + notes.
---

# Analyze Vault — the QUERY phase

Read an existing wiki branch and produce an **opinionated analysis**: reason across the gathered
knowledge to answer a specific question and take a position. This skill is deliberately blind to
*how* the branch was built — it only requires that a valid branch **exists**. It composes with the
rest of the pipeline through the vault's files and gates, not by calling any other skill.

## Why this is a separate phase

Gathering facts and judging them are different acts, and mixing them corrupts both. The research
phase lays down *what is known*, neutrally. This phase is where opinion is allowed — a thesis, a
verdict, a recommendation — built openly **on top of** that corpus and citing it. Keeping them
apart means a reader can always separate the evidence from your call on it.

## Step 1 — PRECONDITION GATE: a valid branch must exist

You can't analyze what isn't there. Before anything else, confirm the target branch is well-formed:

```
node ${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs branch <vault> <Branch>
```

- **If it passes**, proceed.
- **If it fails or the branch/grounding is missing**, stop and tell the user the branch needs to be
  researched first (that's the `research-vault` skill's job) — don't gather the research yourself;
  that's a different phase. Report exactly what the gate said.
- The gate is **hosted in the research plugin** (`${CLAUDE_PLUGIN_ROOT}/gates/`); if `node` can't
  find it, the plugin is misinstalled — say so rather than trying to reconstruct it.

Read the branch's `CLAUDE.md` too, and follow its conventions where they differ from this skill.

## Step 2 — Absorb the corpus

Read the MOC, `_grounding.md`, and every knowledge note. Build a picture of what the branch
actually establishes — and note where it's thin (a gap is a legitimate finding, and a reason the
analysis might be low-confidence). Don't re-derive facts; cite them.

## Step 3 — Scope the question
Pin the exact question you're answering. If the user was vague ("analyze this"), infer the decision
that matters from the brief/MOC and state it explicitly at the top of the analysis so it can be
challenged. One analysis answers one question; a branch can hold several.

## Step 4 — Write the analysis note
Create `<Branch>/Analysis-<Slug>.md` from `_templates/analysis.md` (`type: analysis`). Take a real
position:
- **Verdict** up front — the answer/recommendation, not hedged into mush.
- **Reasoning** — the argument, built by reasoning *across* the knowledge notes; reference them
  with `[[wikilinks]]`.
- **Tensions & tradeoffs** — the honest counter-case and what the verdict gives up.
- **Confidence & open questions** — how sure you are and what would change your mind.
- **Basis** — cite `[[_grounding]]` and the specific notes you leaned on.

Surface the counter-intuitive findings the corpus supports; a synthesis that just restates the
notes adds nothing. Every claim must trace to the branch — if you need a fact that isn't grounded,
say so as a gap rather than inventing it.

## Step 5 — Wire it in
Add the analysis to the MOC's **Analyses** section; set `related:` (in-branch only); bump
`updated:` dates.

## Step 6 — OUTPUT GATE: verify the analysis
```
node ${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs analysis <vault> <Branch>
```
It confirms a grounded `type: analysis` note exists and its links stay in the branch. Fix anything
it flags. (If the script is missing, install this skill's bundled copy as in Step 1.)

## Handing off
Give the user the verdict and the key tensions in prose. Mention they can **render** the analysis
as a visual page (the separate `vault-artifact` skill) if it's the kind of decision that benefits
from charts — but don't build it here.

## Bundled resources
- `${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs branch` — precondition gate (plugin-hosted, Node).
- `${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs analysis` — output gate (plugin-hosted, Node).
