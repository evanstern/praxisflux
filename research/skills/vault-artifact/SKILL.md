---
name: vault-artifact
version: 0.1.1
description: >-
  Render an existing analysis from an Obsidian-style Markdown "thinking vault" into a
  self-contained, theme-aware HTML page with charts — the RENDER phase: visualize the argument an
  analysis already made. Use this whenever the user wants a visual, a chart, a dashboard, a
  "pretty page", a briefing, or a shareable write-up OF a vault branch/analysis, or says
  "make a page for the X analysis", "chart the tradeoffs in Y", "turn my Z branch into a briefing",
  "visualize the recommendation", or "build the HTML for this". This skill only renders an analysis
  that already exists; it does NOT gather research (research-vault) or form the judgment being
  visualized (analyze-vault). It requires a branch that already contains a type: analysis note.
---

# Vault Artifact — the RENDER phase

Turn an analysis's argument into a **self-contained visual page**. This skill is the optional tail
of the pipeline. It is blind to how the analysis was produced — it only requires that one
**exists** in the branch. It composes with the rest through the vault's files and gates, never by
calling another skill.

## Why it's its own phase
Rendering is a distinct craft from judging. Keeping it separate means an analysis can stand on its
own as text, and a visual is layered on only when the decision earns one — without the analysis
skill ever needing to know about charts, CSP rules, or theming.

## Step 1 — PRECONDITION GATE: an analysis must exist
You render an argument, so there must be one to render:
```
node ${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs analysis <vault> <Branch>
```
- **Passes** → proceed; identify which `type: analysis` note you're rendering (ask the user if the
  branch has several).
- **Fails / no analysis** → stop and tell the user the branch needs to be **analyzed** first (the
  `analyze-vault` skill) — don't form the judgment yourself; that's a different phase. Report what
  the gate said.
- **Gate not found** → the gate is hosted in the research plugin (`${CLAUDE_PLUGIN_ROOT}/gates/`);
  if `node` can't find it, the plugin is misinstalled — say so rather than reconstructing it.

Read the branch `CLAUDE.md` and follow its conventions where they differ.

## Step 2 — Decide if a visual is warranted
Read the analysis. If it's a comparison / budget / benchmark / decision, a page helps. If it's
purely conceptual, say a chart would be decoration and stop — that's a valid outcome.

## Step 3 — Build the page
Follow `references/artifact-layer.md` closely. In short: load the `artifact-design` and `dataviz`
skills first; **lead with the analysis's verdict**; every number traces to the analysis/grounding
(include an auditable data table); make it **self-contained** (inline everything — the CSP blocks
external hosts) and **theme-aware** (light + dark). Save it in the branch folder, named for the
analysis (e.g. `<slug>-briefing.html`).

## Step 4 — OUTPUT GATE: verify self-containment
Before publishing, confirm the page won't break under the Artifact CSP:
```
node ${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs artifact <Branch>/<slug>-briefing.html
```
It fails on any external resource load (script/font/style/image/fetch) and a missing `<title>`, and
warns on no theme handling or no data table. Fix failures before publishing. (Install the bundled
gate copy if the script is missing, as in Step 1.)

## Step 5 — Publish and wire in
Publish with the `Artifact` tool. Put the returned URL **and** the filename in the MOC, under the
analysis it renders, so the branch points at both. Bump `updated:` dates.

## Handing off
Give the user the published link and a one-line description. The page's job is to make the
analysis's verdict land at a glance — confirm it does.

## Bundled resources
- `references/artifact-layer.md` — how to build the page well (design, data fidelity, CSP, theming).
- `${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs analysis` — precondition gate (plugin-hosted, Node).
- `${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs artifact` — output gate (plugin-hosted, Node).
