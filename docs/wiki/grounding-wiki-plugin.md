---
name: grounding-wiki-plugin
description: The grounding-wiki plugin — builds and maintains a code-grounded corpus at docs/wiki in a target repo, with notes pinned to commits, a git-based freshness gate that also enforces the corpus-spec v2 token budgets (capsule/body size, CAPSULES.md currency), and a generator for the CAPSULES.md capsule rollup.
kind: component
sources:
  - grounding-wiki/.claude-plugin/plugin.json
  - grounding-wiki/skills/wiki-build/SKILL.md
  - grounding-wiki/skills/wiki-update/SKILL.md
  - grounding-wiki/gates/freshness.mjs
  - grounding-wiki/gates/capsules.mjs
  - grounding-wiki/gates/cli.mjs
  - grounding-wiki/scripts/capsules.mjs
  - grounding-wiki/scripts/repin.mjs
  - grounding-wiki/templates/note.md
verified_against: 22da4bbec6da2eb1363f08d0ed66cf4030231375
---

# Grounding-wiki plugin

The `grounding-wiki` plugin (lockstep with the marketplace version) builds and maintains a **code-grounded corpus** at
`docs/wiki/` in a target repo: one Markdown note per concept or component, each pinned to the
commit it was verified against and listing the source files whose change invalidates it. Two
skills split the lifecycle — `wiki-build` generates the corpus, `wiki-update` refreshes it in
place — and one read-only gate decides staleness from git history and enforces the
corpus-spec v2 token budgets. A generator (`scripts/capsules.mjs`) owns the corpus's
`CAPSULES.md` capsule rollup.

## How it works

**Note shape** (`grounding-wiki/templates/note.md`): frontmatter `name` (kebab-case, matches
filename), `description` (used for relevance during recall), `kind`
(component|concept|pipeline|pattern), a `sources:` YAML block list of repo-relative paths, and
`verified_against:` (a full commit hash), then Title / How it works / Connections /
Operational notes sections.

**Build vs update routing.** `wiki-build` pins the pass to `git rev-parse HEAD`, but if
`docs/wiki/INDEX.md` already exists it stops — that is an update job for `wiki-update`.
Build writes `INDEX.md` first (grouped one-liners doubling as the plan), then an `overview`
note, then the rest (typically 15–25 notes, 40–90 lines each, code read before writing, paths
and symbols but never line numbers), then generates `CAPSULES.md` — every build pass ends
with `scripts/capsules.mjs`, and note authoring carries the v2 budgets (capsule ≤500 chars
written for routing, body ≤8,000 chars with summary-style splits, `size_budget_exempt:
<reason>` for the unsplittable). `wiki-update` starts from the **plan
command** (`gates/cli.mjs plan <repo-root> [corpus-dir]`): silence means "wiki fresh, stop";
"not a corpus" means offer `wiki-build`; otherwise plan splits the stale set into computed
bookkeeping and judgment — **RE-PIN-ONLY** entries (the one provably safe class: every changed
line since the pin is a lockstep version stamp AND the note quotes no semver literal, scanned
on the raw body since notes quote versions in backticks) print runnable
`scripts/repin.mjs <note> <head>` commands, while everything else defaults to
**NEEDS-REVIEW** with a per-file `+/-` work order. For review notes the skill reads the diff
(`git diff P..HEAD -- <sources>`), updates every claim to match current source, then re-pins
via `repin.mjs` — the hard rule is **never bump a pin without reading the diff**, except
through plan's RE-PIN-ONLY lines whose point is that the planner proved the diff safe.
`scripts/repin.mjs` is the pin loop's one writer (full 40-char hashes only, which must name a
real commit in the note's repo — probed with `git cat-file -e` before any write — and refuses
pinless or missing notes, or a note outside any git repo); the planner itself stays read-only. Update passes end by regenerating
`CAPSULES.md` when the corpus has one (a corpus without one predates v2; the skill offers
adoption, noting it flips budget enforcement on).

**Capsule tier** (`gates/capsules.mjs` + `scripts/capsules.mjs`, corpus-spec v2):
`renderCapsules(repoRoot, corpusDir, { commit })` computes `CAPSULES.md` deterministically —
a header naming the generator and the corpus commit it was generated at, then, in `INDEX.md`
order, each note's INDEX line followed by its capsule (its `description:`); on-disk notes
missing from INDEX are appended sorted, INDEX-only reserved names are skipped
(`indexLineTarget` resolves `[[wikilink]]` and `[name](name.md)` list lines). The gate module
stays read-only; `scripts/capsules.mjs <repo-root> [corpus-dir]` (`writeCapsules`) is the one
writer. `checkCapsuleTier` enforces the budgets, keyed on **adoption = CAPSULES.md exists**:
adopted corpora FAIL on a `description:` over `CAPSULE_BUDGET` (500 chars), a body over
`NOTE_BODY_BUDGET` (8,000 chars, measured by `noteBody` below the frontmatter; a
`size_budget_exempt: <reason>` frontmatter key downgrades that one to WARN), and a stale or
hand-edited `CAPSULES.md` — detected by re-rendering at the commit the header names and
byte-comparing, with the regeneration command in the failure. Render and check both
canonicalize the corpus dir first (`normalizeCorpusDir`: repo-relative, forward slashes, no
trailing slash) before embedding it in the header, so regenerate-and-compare is invariant to
how the generator was invoked; a pre-normalization header whose only difference is that
spelling degrades to a WARN naming the regeneration command, not a hand-edit failure.
Unadopted corpora get the same checks as WARN-only notices, so v1 corpora stay green until
they adopt.

**Freshness gate** (`gates/freshness.mjs`, `validateFreshness(repoRoot, corpusDir = "docs/wiki")`):
- Missing `INDEX.md` fails as `not a corpus`. Every other `.md` in the dir is checked.
- A note fails if it has no frontmatter, no `verified_against` pin, or a pin that is not a
  known commit (`git cat-file -e <pin>^{commit}`).
- `noteSources` reads both sanctioned `sources:` spellings — inline `[a, b]` arrays via
  `lib/markdown.mjs` `parseFrontmatter`, YAML block lists via `parseSourcesBlock` — so both
  staleness-check identically.
- A source path absent from the working tree fails the note, naming note + path: `git log`
  over a nonexistent pathspec is silently empty, which would otherwise report FRESH forever
  after a rename, delete, or typo. `plan` surfaces the same case as a `# problem:` instead of
  planning over it.
- Staleness: `git log --oneline <pin>..HEAD -- <sources>`; any output fails the note as STALE,
  reporting the commit count and first commit. Empty `sources:` only warns ("staleness is
  unverifiable").
- Wikilink resolution: `extractWikilinks(stripCode(text))` targets that are not sibling note
  names produce warnings, not failures.
- `INDEX.md` and the generated `CAPSULES.md` are never checked as notes (`noteFiles`), and
  every run ends by merging `checkCapsuleTier`'s budget fails/warns (above) into its result.

`gates/cli.mjs` exposes two subcommands — `freshness <repo-root> [corpus-dir]` (warns, exit 1
on any failing note, 2 on usage error) and `plan <repo-root> [corpus-dir]` (`planFreshness` +
the pure `classifyNote`; prints nothing on a fresh corpus, `# problem:` lines and exit 1 on
structural failures like unknown pins). The gates never write to disk — emitted edits run
through `scripts/repin.mjs`.

## Connections

The corpus format the plugin produces and enforces is [[grounded-corpus-spec]] — including
its v2 capsule tier and note size budget; this repo's own `docs/wiki/` is an instance
(adopted: `CAPSULES.md` present, so the budgets enforce hard). The corpus feeds downstream consumers — [[codebase-to-course-plugin]]
grounds course content on it, and [[educate-plugin]] lessons can draw on it. Skills follow
[[skill-patterns]]; the gate follows [[gates-convention]] and builds on [[markdown-module]]
(`parseFrontmatter`, `stripCode`, `extractWikilinks`). Packaged with the [[chassis]] by
[[build-and-release]].

## Operational notes

Gate command: `node ${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs freshness <repo-root> [corpus-dir]`,
corpus dir defaulting to `docs/wiki`. The target must be a git repo (staleness is computed with
git plumbing run in `repoRoot`). Both skills suggest wiring the same command as unattended
enforcement — a Stop/pre-commit hook or a CI pre-merge check — but offer rather than assume.
Recommended refresh commits pair the wiki with the code change that staled it:
`wiki: re-verify <notes> against <short-hash>`.
