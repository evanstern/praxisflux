---
name: research-vault
version: 0.1.0
description: >-
  Research a topic and file it into an Obsidian-style Markdown "thinking vault" as an isolated,
  grounded, interlinked wiki branch — the EMBED phase: gather cited facts and structure them into
  neutral, descriptive notes (no verdicts). Use this whenever the user wants to research /
  investigate / look into / gather / "read up on" a subject and KEEP the result, especially when
  a vault CLAUDE.md is present, or when they say "research X", "spin up a wiki/branch on Y", "add
  notes on Z to the vault", "gather what's known about…", "ground this topic", or "set up a
  research vault". Prefer this over a plain chat answer whenever the research should be filed and
  kept, not just spoken. This skill only gathers and wikifies; evaluating the corpus or drawing a
  recommendation is the separate analyze-vault skill, and charts/pages are the separate
  vault-artifact skill — do not do those here.
---

# Research Vault — the EMBED phase

Turn a research request into a **self-contained, grounded, interlinked wiki branch**. This skill
does one job: **gather cited facts and structure them into neutral notes.** It deliberately does
*not* form a verdict or build visuals — those are separate, later phases (`analyze-vault`,
`vault-artifact`) that this skill knows nothing about. They compose only through the vault's files
and gates, which the vault's `CLAUDE.md` orchestrates.

## Why the boundary matters

The vault's whole value is that a reader can tell **established fact** from **someone's judgment**.
If research notes smuggle in recommendations, that line blurs and the vault becomes just another
pile of opinions. So here you stay descriptive: lay out *what is known*, cite it, and stop. The
moment you catch yourself writing "so the best option is…", that belongs in an analysis, not here.

## Step 0 — Locate or bootstrap the vault, and honor its CLAUDE.md

1. Look for a vault: a `CLAUDE.md` describing a thinking vault, plus `Home.md` / `_templates/`.
   Usually the current working directory.
2. **If a vault `CLAUDE.md` exists, it wins.** Read it and follow *its* conventions over anything
   here — the user may have tuned frontmatter, naming, or the pipeline. Defer to it.
3. **If there's no vault, scaffold one** (a vault can live in **any** folder — drop it wherever
   you like):
   - `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.md` → `<vault>/CLAUDE.md`
   - `${CLAUDE_PLUGIN_ROOT}/templates/*` (moc, note, grounding, analysis) → `<vault>/_templates/`
   - `${CLAUDE_PLUGIN_ROOT}/templates/Home.md` → `<vault>/Home.md`
   - create an empty `<vault>/.research-vault` **sentinel** — this is what marks the folder as a
     vault so the plugin's Stop hook can find it (drop-anywhere detection, no false positives).
   Then tell the user a new vault was set up, and proceed.
4. The verification gates are **hosted in the plugin** (`${CLAUDE_PLUGIN_ROOT}/gates/`), not copied
   into the vault — so every vault shares one canonical, updatable copy. Nothing to install per
   vault beyond the sentinel above. (Bootstrapping an existing pre-praxis vault? Just add the
   `.research-vault` sentinel; leave any legacy `_scripts/` in place, it is no longer used.)

## The embed workflow

### 1. Place it
Extend an existing branch or start a new one. New → create `<Topic>/` (folder in
`Title-Case-With-Hyphens`) and its MOC `<Topic>/<Topic>.md` from `_templates/moc.md`.

### 2. Capture the brief (only when the request carries constraints)
If the user handed you facts, filters, a budget, or current state — not just "tell me about X" —
write `Brief-and-Assumptions.md` first: restate the requirements verbatim, then **document your
assumptions and flag ambiguities as open questions.** This makes silent guesses visible so the
user can correct course early. Skip it for a purely open-ended explore.

### 3. Seed the grounding
Produce `<Topic>/_grounding.md` (`type: source`) from `_templates/grounding.md` — the cited,
source-of-truth research pass. Keep it factual and close to verbatim; conclusions come later.

- **Primary path:** run the `deep-research` skill on a *scoped* question; save its report verbatim.
- **Fallback (important):** the `deep-research` harness sometimes fails on an internal error. Do
  **not** get stuck retrying it — fall back to a direct **`WebSearch` fan-out** (6–10 parallel
  searches across the distinct angles of the question), then synthesize into `_grounding.md` with
  a real **Sources** list of URLs. Note which method you used.
- Small extension of an already-grounded branch → skip the heavy pass; do a few targeted searches.

### 4. Structure the knowledge (neutral notes)
Write the MOC and supporting notes from `_templates/note.md`. Organize *what is known*: how things
work, how the pieces relate, the established numbers — each claim citing into `_grounding.md`.
Split into multiple notes when one would sprawl; keep each focused. Fill the MOC's **Scope** and
**What is known**. Leave the **Analyses** section empty — that's the next phase's job.

### 5. Wire the branch
MOC lists every note under **Notes**; `related:` links set (in-folder only); `updated:` dates
current; add/refresh the topic's one-line entry in `Home.md` (the trunk).

### 6. GATE — verify the branch
Run the branch gate; it must pass before you're done:
```
node ${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs branch <vault> <Topic>
```
It checks the MOC, the grounding file, frontmatter, and isolation (no cross-branch/broken links).
Fix anything it reports. A passing branch is what makes the analyze phase possible.

## Handing off

When the branch is green, tell the user what you gathered and any open questions — and that they
can **analyze** it (evaluate / get a recommendation) as a separate step whenever they want. Don't
evaluate it yourself here.

## Bundled resources
- `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.md` — the vault orchestrator (planted on bootstrap).
- `${CLAUDE_PLUGIN_ROOT}/templates/` — `moc`, `note`, `grounding`, `analysis`, `Home`.
- `${CLAUDE_PLUGIN_ROOT}/gates/` — the Node gates (`cli.mjs branch|analysis|artifact`), shared by
  all three phases and enforced by the plugin's Stop hook. Plugin-hosted; never copied per-vault.
