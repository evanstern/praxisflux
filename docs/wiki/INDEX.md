# praxisflux — grounding wiki index

One line per note. This corpus follows the code dialect of `docs/corpus-spec.md`: every
note pins `verified_against` to a commit and lists the `sources:` whose change invalidates it.

## System

- [[overview]] — what praxisflux is: a plugin marketplace on a shared chassis forming a research → teach → build loop
- [[grounded-corpus-spec]] — the interchange contract (spec v1): corpus layout, note core, provenance dialects, freshness semantics
- [[handoff-protocol]] — how plugins hand work to each other: gitignored `.handoff/` payloads, durable evidence in tracked state
- [[skill-patterns]] — the shared authoring patterns: phase-separated skills, gate→work→gate shape, planted CLAUDE.md, placement models
- [[gates-convention]] — "status can't exceed proven artifacts": gates/ vs scripts/, lifecycle enforcement, additive Stop hooks

## Chassis (lib/)

- [[chassis]] — the zero-dependency shared Node modules, vendored into each plugin at build time
- [[project-root]] — root discovery: findRootUpwards (favored home) and findRootsDownwards (drop-anywhere sentinel)
- [[gate-runner]] — the Stop-hook harness: resolves roots, runs gate fns, blocks or no-ops
- [[markdown-module]] — frontmatter/wikilink/code-stripping primitives shared by gates
- [[selfcontained-verifier]] — checks HTML output is fully self-contained (no external requests)
- [[lifecycle-engine]] — ordered states + artifact evidence maps; flags status that outruns proof
- [[installer]] — plants project CLAUDE.md/templates: copyDir, installMode, ensureGitignore, verifyPresent
- [[chassis-utilities]] — the small shared utilities: dates.mjs, template.mjs, and cli.mjs (symlink-safe run-as-CLI guard)
- [[toolkit]] — shared *content* modules (pedagogy, diagrams, tooltips) skills read while authoring

## Plugins

- [[research-plugin]] — thinking-vault branches: EMBED → QUERY → RENDER skills with per-phase gates
- [[grounding-wiki-plugin]] — builds/updates code-grounded corpora; ships the freshness gate
- [[educate-plugin]] — Socratic learning projects: lesson lifecycle, DoD gate, teach→build seam
- [[build-plugin]] — implements a handed-off SPEC and returns findings (scaffold split from educate)
- [[codebase-to-course-plugin]] — turns a codebase into an interactive HTML course; corpus-aware, gated output
- [[spec-bridge-plugin]] — Backlog.md as the derived kanban view over GitHub Spec Kit specs; one-way derivation, exceeds-blocks gate

## Repo operations

- [[build-and-release]] — repo-level tooling + CI/CD: vendoring lib/ into dist/, marketplace generation, version sync, the bump gate, and auto-published GitHub Releases
- [[test-suite]] — node --test suite conventions covering chassis, gates, and cross-plugin seams
