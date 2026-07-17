---
name: grounding-wiki-plugin
description: The grounding-wiki plugin — builds and maintains a code-grounded corpus at docs/wiki in a target repo, with notes pinned to commits and a git-based freshness gate.
kind: component
sources:
  - grounding-wiki/.claude-plugin/plugin.json
  - grounding-wiki/skills/wiki-build/SKILL.md
  - grounding-wiki/skills/wiki-update/SKILL.md
  - grounding-wiki/gates/freshness.mjs
  - grounding-wiki/gates/cli.mjs
  - grounding-wiki/templates/note.md
verified_against: 6b37e2fbf4a81cd696b779d4282519849cfde30f
---

# Grounding-wiki plugin

The `grounding-wiki` plugin (lockstep with the marketplace version) builds and maintains a **code-grounded corpus** at
`docs/wiki/` in a target repo: one Markdown note per concept or component, each pinned to the
commit it was verified against and listing the source files whose change invalidates it. Two
skills split the lifecycle — `wiki-build` generates the corpus, `wiki-update` refreshes it in
place — and one read-only gate decides staleness from git history.

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
and symbols but never line numbers). `wiki-update` starts from the **plan
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
`scripts/repin.mjs` is the loop's one writer (full 40-char hashes only, refuses pinless or
missing notes); the planner itself stays read-only.

**Freshness gate** (`gates/freshness.mjs`, `validateFreshness(repoRoot, corpusDir = "docs/wiki")`):
- Missing `INDEX.md` fails as `not a corpus`. Every other `.md` in the dir is checked.
- A note fails if it has no frontmatter, no `verified_against` pin, or a pin that is not a
  known commit (`git cat-file -e <pin>^{commit}`).
- `parseSourcesBlock` extracts the `sources:` YAML block list from raw frontmatter text —
  needed because `lib/markdown.mjs` parses only inline `[a, b]` arrays.
- Staleness: `git log --oneline <pin>..HEAD -- <sources>`; any output fails the note as STALE,
  reporting the commit count and first commit. Empty `sources:` only warns ("staleness is
  unverifiable").
- Wikilink resolution: `extractWikilinks(stripCode(text))` targets that are not sibling note
  names produce warnings, not failures.

`gates/cli.mjs` exposes two subcommands — `freshness <repo-root> [corpus-dir]` (warns, exit 1
on any failing note, 2 on usage error) and `plan <repo-root> [corpus-dir]` (`planFreshness` +
the pure `classifyNote`; prints nothing on a fresh corpus, `# problem:` lines and exit 1 on
structural failures like unknown pins). The gates never write to disk — emitted edits run
through `scripts/repin.mjs`.

## Connections

The corpus format the plugin produces and enforces is [[grounded-corpus-spec]]; this repo's own
`docs/wiki/` is an instance. The corpus feeds downstream consumers — [[codebase-to-course-plugin]]
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
