---
name: skill-patterns
description: The shared authoring patterns for praxis plugins — phase-separated skills, the gate→work→gate skill shape, planted CLAUDE.md, placement models, shared-vs-per-plugin split, and the new-plugin checklist
kind: pattern
sources:
  - docs/skill-patterns.md
verified_against: 54964eac9c3ecc9c8e7f1b0e5563ded19d8d1ef9
---

# Skill patterns — how praxis plugins are authored

praxis plugins look alike on purpose: a new plugin that follows the patterns in
`docs/skill-patterns.md` inherits the chassis and composes with the others for free. This
is the leverage doc for authors, paired with [[handoff-protocol]].

## How it works

**Phase separation.** Each skill does one phase and knows nothing about the others; skills
compose only through project files and the gates between phases, never by invoking each
other. Examples: research's EMBED → QUERY → RENDER; educate's teach → author SPEC → (hand
to build) → fold findings → deck.

**The skill shape.** Every phase skill follows the same skeleton: (1) a *precondition
gate* verifying the input state exists — on failure, stop and name the phase that must run
first; (2) do the one phase; (3) an *output gate* verifying what was produced; (4) *hand
off* by telling the user what's now possible next, without doing it.

**Planted CLAUDE.md.** A plugin's skills are lazy-loaded, so nothing is always in context.
The installer plants a project `CLAUDE.md` carrying the always-on rules (lifecycle,
placement, DoD), using [[installer]] — and never claims success without `verifyPresent`.

**Two placement models.** *Favored home* (educate): a fixed project marked by a child dir
(`topics/`), found with `findRootUpwards(dir, hasChild("topics"))`. *Drop-anywhere*
(research): projects marked by a sentinel (`.research-vault`), found with
`findRootsDownwards` — both from [[project-root]].

**Shared vs per-plugin.** Shared (`lib/`): plumbing modules plus the HTML base
(`lib/html/base.html`) and the content [[toolkit]]. Per-plugin: domain vocabulary
(lifecycle state names), the knowledge model, and handoff payload schemas. Toolkit modules
are optional enhancers — every skill referencing one must state an inline fallback and
still work without it. Visual output shares the token *schema* and dark-mode contract;
palette *values* and page shells stay per-plugin.

**Versioned course chrome (plugin-owned toolkit citizen).** A second kind of shared visual
machinery doesn't fit the copy-into-every-plugin model: chrome that is heavy,
domain-specific, and copied into every *output directory* rather than into sibling plugins
(codebase-to-course's `styles.css`/`main.js`/`_footer.html`/`build.sh`/`validate.mjs`). It
keeps the toolkit spirit — one canonical copy, indexed in `lib/toolkit/README.md` — with a
versioning convention instead of chassis-style distribution: every rendering file opens with a
`chrome v<N>` stamp; the stamp bumps only when the *rendering contract* changes (same
authored markup, different meaning on screen), together with `CHROME_VERSION` in
`validate.mjs`; validation fails unstamped or version-mixed chrome both at course build time
and in the plugin's gate; and `build.sh` refreshes vendored copies from the canonical
`references/` when the plugin is reachable. Vendored copies are build artifacts, never
templates.

**New-plugin checklist** (abridged): a `.claude-plugin/plugin.json` registered in the
marketplace; skills in the gate→work→gate shape; a planted `CLAUDE.md` if it stamps a
project; a lifecycle + Stop hook if it enforces one; `lib/handoff.mjs` if it hands off;
tests under `test/` kept green.

## Connections

- [[gates-convention]] — the enforcement half of these patterns (gates/ vs scripts/, lifecycle).
- [[chassis]] — what a conforming plugin inherits through its `lib` symlink; [[build-and-release]] dereferences it into packaged copies.
- Applied by every plugin note: [[research-plugin]], [[grounding-wiki-plugin]],
  [[educate-plugin]], [[build-plugin]], [[codebase-to-course-plugin]].

## Operational notes

- Gates and chassis are plugin-hosted, referenced as `${CLAUDE_PLUGIN_ROOT}/…` — never
  copied into a user's project.
- Judgment steps are enforced with evidence + durable residue, never a bare flag (e.g.
  educate's return leg needs both `handoff.foldedIn` in `progress.json` and a
  `## Post-build` section on disk).
