---
name: research-plugin
description: The research plugin — a three-phase thinking-vault pipeline (EMBED, QUERY, RENDER) with drop-anywhere vault detection, per-phase gates, and a self-containment Stop hook.
kind: component
sources:
  - research/.claude-plugin/plugin.json
  - research/skills/research-vault/SKILL.md
  - research/skills/analyze-vault/SKILL.md
  - research/skills/vault-artifact/SKILL.md
  - research/skills/vault-artifact/references/artifact-layer.md
  - research/gates/branch.mjs
  - research/gates/analysis.mjs
  - research/gates/artifact.mjs
  - research/gates/vault.mjs
  - research/gates/cli.mjs
  - research/hooks/hooks.json
  - research/scripts/gate.sh
  - research/scripts/stop.mjs
verified_against: 9047a2897ed3c173b2e0e6ed407e46b13a410e3f
---

# Research plugin

The `research` plugin (v0.3.1) turns research requests into Obsidian-style Markdown "thinking
vaults": isolated, grounded, interlinked topic branches. Its defining discipline is separating
*gathering* knowledge from *judging* it, enforced by a three-phase pipeline of skills that know
nothing about each other and compose only through the vault's files and gates.

## How it works

**Phase split.** `research-vault` (EMBED) gathers cited facts into `<Topic>/_grounding.md`
(`type: source`) plus neutral notes and a MOC — no verdicts. `analyze-vault` (QUERY) reasons
across an existing branch and writes an opinionated `Analysis-<Slug>.md` (`type: analysis`)
with a verdict, reasoning, tradeoffs, and a Basis citing the corpus. `vault-artifact` (RENDER)
optionally turns one analysis into a self-contained, theme-aware HTML briefing
(`<slug>-briefing.html`), built per `references/artifact-layer.md` on the shared
`lib/html/base.html` foundation, verdict first, every number traced to the branch. Each phase
opens by running the previous phase's gate as a precondition and refuses to do the earlier
phase's work itself.

**Drop-anywhere placement.** A vault can live in any folder; it is marked by an empty
`.research-vault` sentinel file at its root, which is what the Stop hook detects. On bootstrap,
`research-vault` plants `templates/CLAUDE.md` (the vault orchestrator), `Home.md` (the trunk),
and `_templates/` (moc, note, grounding, analysis). Gates stay plugin-hosted in
`${CLAUDE_PLUGIN_ROOT}/gates/` — never copied per vault.

**Gates** (`research/gates/`, entered via `cli.mjs branch|analysis|artifact`):
- `branch.mjs` `validateBranch` — MOC named `<Branch>.md` with `type: moc`; a `_grounding*`
  file with `type: source`; every note has `title` and a type in `KNOWN_TYPES`
  (`moc|note|source|analysis`, from `vault.mjs`); isolation — every `[[wikilink]]` resolves to
  an in-branch name (`localNames`, which includes aliases via `namesFor`); orphan notes warn.
- `analysis.mjs` `validateAnalysis` — at least one `type: analysis` note exists; each must cite
  the corpus (a link to `[[_grounding]]`/a note, or a Basis/Grounding/Evidence/Sources heading
  matched by `BASIS_RE`) and keep links in-branch.
- `artifact.mjs` `validateArtifact` — reads an HTML file into the shared `lib/selfcontained.mjs`
  `checkHtml` (external loads fail; missing theme handling or data table warn).
- `cli.mjs` prints warns, exits 1 on any fail, 2 on usage error.

**Stop hook.** `hooks.json` wires a `Stop` hook (matcher `*`) to `scripts/gate.sh`, a shim that
execs `scripts/stop.mjs` — resolving `node` via `command -v` with a login-shell fallback, and
no-opping (exit 0) when node is unavailable, so the gate never blocks Stop over a missing
runtime. That script runs `runStopHook` from `lib/gate-runner.mjs` with one
gate: find vault roots downwards from cwd via `findRootsDownwards(startDir, hasChild(".research-vault"))`
from `lib/project-root.mjs`, then check every `.html` under each vault (depth ≤ 8, skipping
dotfiles and `node_modules`) with `validateArtifact`. Only self-containment blocks Stop — the
branch/analysis gates are phase gates, since a half-built branch mid-research is normal.

## Connections

Vault branches are a corpus in the sense of [[grounded-corpus-spec]] (grounding + isolation,
though pinned to sources rather than commits). Skills follow [[skill-patterns]]; gates follow
[[gates-convention]] and build on [[markdown-module]] (`parseFrontmatter`, `extractWikilinks`,
`namesFor`); the artifact gate wraps [[selfcontained-verifier]]; the Stop hook rides
[[gate-runner]] and [[project-root]]. Briefings draw pedagogy and SVG rules from [[toolkit]]
and the base page contract from the [[chassis]]. Packaged by [[build-and-release]].

## Operational notes

Gate commands: `node ${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs branch <vault> [Branch]`, `analysis
<vault> <Branch>`, `artifact <file.html>`. The Stop hook honors `stop_hook_active` (via the
gate-runner) and is a no-op when no `.research-vault` sentinel is found, so it coexists with
educate's Stop hook. `research-vault`'s grounding pass prefers the `deep-research` skill but
must fall back to a direct WebSearch fan-out (6–10 parallel searches) on internal errors.
