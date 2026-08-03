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
- [[build-plugin]] — skill-only implementation leg: implements a handed-off SPEC and returns findings for educate to fold in
- [[codebase-to-course-plugin]] — turns a codebase into an interactive HTML course; corpus-aware, gated output
- [[spec-bridge-plugin]] — Backlog.md as the derived kanban view over GitHub Spec Kit specs; one-way derivation, exceeds-blocks gate
- [[pdlc-plugin]] — the suite-level installer plus the lifecycle orchestrator: bootstrap plants the always-on PDLC grounding as a marked CLAUDE.md block and opts into the peer utilities (Backlog.md, Spec Kit)
- [[pdlc-sweep]] — the board-sweep orchestrator skill: a signed-off, dependency-laned runbook executed through claim+link → spec → PR → serial merge → re-ground, with claim-before-work, paused-lane, and pin-aware reconciliation doctrine and a per-task spec+plan+tasks-or-escape-line Output gate
- [[pdlc-sweep-history]] — entry point and release→child index for the sweep skill's doctrine history, split summary-style into [[pdlc-sweep-history-early]] and [[pdlc-sweep-history-recent]]
- [[pdlc-sweep-history-early]] — doctrine history, 0.12.1 through 0.42.0: merge-drift gates, capsule-first orientation, paused lanes, pin-aware reconciliation, honest re-pins, claim-step reconciliation, refactor-triage handoff, model-ID pinning, phase-scoped dispatch
- [[pdlc-sweep-history-recent]] — doctrine history, 0.43.0 onward: cost levers, Spec-Kit degradation hardening, doctrine-seam reconciliation, background-job/no-main-push mode, two-track landing, hand-authored-specs hatch — the child that receives new releases
- [[pdlc-refactor-triage]] — the post-sweep debt-triage skill: evaluate merged work (range / whole-repo / headless+policy) via team-review's lens plus a range-only intent-drift pass, disposition every finding in a tracked triage record, card accepted findings as sweepable backlog tasks
- [[team-review-plugin]] — lead-plus-subagent architecture review of a caller-supplied codebase; read-only, proven by an output gate over run records at the invoking root
- [[reorient-plugin]] — corpus-grounded reorientation loop: N evaluator subagents under a stated lens, operator-steered rounds, cross-grounded analyses, one synthesis landing as board moves
- [[reorient-run-ownership]] — worktree-first, session-owned reorient runs: shared-primary-checkout refusal with the recorded --shared-checkout override, owner + heartbeat on the manifest, owner-scoped Stop nag, stale-orphan notices, run-id-keyed synthesis targets, explicit takeover

## Repo operations

- [[build-and-release]] — repo-level tooling + CI/CD: vendoring lib/ into dist/, marketplace generation, version sync, the bump gate, and auto-published GitHub Releases
- [[dist-packaging]] — build.mjs packaging mechanics: full vs --plugin scoped cleans, the lib-symlink dereference, and the argv/exit-code contract
- [[release-pipeline]] — the merge-to-main release mechanics: the version-bump gate, ci.yml's PR checks, and release.yml's npm-before-tag publish ordering
- [[gates-consumption-surface]] — how consumer repos run the gates: the @praxisflux/gates npm package and the composite GitHub Action, pinned in lockstep
- [[test-suite]] — node --test suite conventions covering chassis, gates, and cross-plugin seams
- [[test-suite-catalog]] — per-file coverage catalog, repo-tooling half: chassis, packaging, scaffolding, docs-drift, install-path, and CI-runner test files, one bullet per file
- [[test-suite-catalog-plugins]] — plugin-half catalog entry point, split summary-style into [[test-suite-catalog-plugins-gates]] and [[test-suite-catalog-plugins-pipeline]]
- [[test-suite-catalog-plugins-gates]] — per-file coverage, single-plugin output-gate suites: grounding-wiki, pdlc, phase-status, reorient, research, spec-bridge, spec-derive, team-review
- [[test-suite-catalog-plugins-pipeline]] — per-file coverage, content-authoring pipeline & cross-plugin handoff suites: codebase-to-course, educate deck/wiki roll-up, handoff/return-leg seam, toolkit-borrow
