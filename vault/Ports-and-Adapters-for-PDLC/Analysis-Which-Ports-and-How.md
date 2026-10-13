---
title: Analysis — Which Ports, in What Form, in What Order
aliases: [pdlc ports recommendation]
tags: [analysis]
type: analysis
created: 2026-10-12
updated: 2026-10-12
related: ["[[Ports-and-Adapters-for-PDLC]]", "[[PDLC-Seam-Inventory]]", "[[Pipeline-Stages-as-Seams]]", "[[Agent-Environment-Targets]]", "[[Implementation-Mechanics]]", "[[Real-World-Precedents]]", "[[Costs-and-Failure-Modes]]", "[[Pattern-Fundamentals]]", "[[Related-Patterns]]", "[[Code-Examples]]"]
---

# Analysis — Which Ports, in What Form, in What Order

**Question:** How should pdlc be refactored along ports-and-adapters lines (which ports, in what
form, in what order) so it supports forge and tracker adapters and runs in agent environments
other than Claude Code?

## Verdict

**Use three driven ports: Tracker, Forge and Harness.** Build them the way the board seam is
already built: a verb table, not a code interface layer. Ship them in this order: Harness first
(it is mostly TASK-0134), then Forge, then more tracker adapters.

1. **Generalise the board seam; don't invent a new architecture.** `docs/board-verbs.md`, the
   `.board/links.json` mirror and the `providers` registry already form a working port with two
   adapters, a configurator, capability flags and a translator layer
   ([[PDLC-Seam-Inventory]]). Each new port copies that shape:
   - a canonical verb table where every verb names an **evidence artifact**;
   - one column per provider;
   - a declared provider in a repo file, with detection as the fallback;
   - a byte-identical guarantee for the current provider.
2. **The port is "Forge", not "VCS."** Local git is the same everywhere: worktrees, branches,
   merge commits, `merge-base`. Only the hosting layer varies: PR/MR creation, the merged check,
   merge execution. Keep `git` calls as they are and put only the `gh`-shaped verbs behind a port.
3. **Most adapters should be prose; Node code only where a gate needs evidence.** Skills, which
   a model executes, are pdlc's real consumers. The adapter for a model is a column of literal
   commands, as in `board-verbs.md` and claude-plugin-sdd #261. Node adapters belong only where
   `lib/`/`gates/` must compute something offline. Even then, the established answer is a
   **receipt the adapter writes** (the mirror), not a live call.
4. **The Harness port is the one the "other AI environments" goal depends on.** In practice it
   means:
   - **always-on context →** `AGENTS.md` (TASK-0134);
   - **procedures →** standard SKILL.md;
   - **external tools →** MCP or plain CLIs;
   - **enforcement →** gates as CLIs and CI;
   - Claude Code hooks are an optional local extra, not something to port.
5. **Order:**
   1. Harness (TASK-0134, then a SKILL.md portability pass).
   2. Extract `forge-verbs.md` with a `github` column that is byte-identical to today, and
      rewrite sweep and root-guard prose against it.
   3. Add a `gitlab` column, verified live.
   4. Add `gitea` (Forgejo).
   5. Add a `linear` tracker column via its MCP server.
   6. Write a lint for the verb tables, which stands in for contract tests.
   7. Only if decision-1's headless-orchestrator direction is chosen: compile the tables into
      Node adapters.
6. **Don't build** a spec-format port, a model-provider port (`model-tiers.json` already covers
   it), a VCS port over local git, or one hexagon per plugin.

## Reasoning

**The template already exists, and it fits better than the textbook.** The textbook port is a
code interface the core calls ([[Pattern-Fundamentals]]). pdlc's core isn't code, though: the
lifecycle is doctrine that a model carries out ([[Pipeline-Stages-as-Seams]]). The board seam
handled this in two ways no textbook example does ([[PDLC-Seam-Inventory]]):

- adapters are split by **who runs them**: Node runs the Backlog.md adapter; a model runs the Jira
  adapter through MCP;
- the core reads a **receipt** instead of calling the adapter.

Those two moves keep gates offline, deterministic and CI-runnable, and still serve a provider
that only a model can reach. A Renovate-style `Platform` interface ([[Real-World-Precedents]])
would put the abstraction in the one place pdlc's real consumer, a model reading a skill, never
looks. The working precedent in this exact setting (claude-plugin-sdd #261) went the other way:
from vague tool-routing to **naming the exact command per forge in the skill**, after silent
failures ([[Implementation-Mechanics]]).

**"VCS" is the wrong boundary.** In the inventory, `git` calls (worktree, push, switch, merge
`--no-ff`) and forge calls (`gh pr create`, `gh pr merge`, `gh api … .merged`) show up as
separate couplings ([[PDLC-Seam-Inventory]]). Every precedent abstracts the forge and leaves git
alone: Renovate, vibey, Nesbitt's `forge`, gitforge ([[Real-World-Precedents]]). Self-hosted
repos are covered by Gitea/Forgejo or GitLab CE adapters, which means "self-hosted" is a forge
choice, not a separate port.

**One core invariant must be a required capability, not an optional one.** pdlc merges with merge
commits, never squash, because wiki notes pin `verified_against` SHAs ([[PDLC-Seam-Inventory]]).
The forge-less patch flow (`format-patch` → `send-email` → `git am`) rewrites commit SHAs
([[Real-World-Precedents]]), which orphans those pins exactly as squashing does. So a forge
adapter must declare `merge-commit` support or pdlc must refuse it. That is the
lowest-common-denominator trap run backwards ([[Costs-and-Failure-Modes]]): here the core sets a
floor and adapters must meet it, instead of the core shrinking to fit them. vibey's "a verdict
binds to a SHA, never to a moving head" invariant ([[Implementation-Mechanics]]) belongs in the
port for the same reason. The `merge` verb should carry the expected SHA (`gh pr merge
--match-head-commit`, as in [[Code-Examples]]).

**Harness first because it unlocks the most and is already specified.** Other environments agree
on AGENTS.md, SKILL.md and MCP, and on little else. Hooks, sub-agent dispatch with a pinned
model, plugin paths and config all differ ([[Agent-Environment-Targets]]). pdlc's
harness-neutral parts are already the authoritative ones (gates as CLIs, CI as enforcement).
pdlc's own doctrine already says hooks are advisory and CI decides. So harness portability needs
no new abstraction, just less reliance on what isn't portable:

- move the planted block to AGENTS.md;
- remove Claude-only tool names from skill bodies where a verb would do;
- treat `${CLAUDE_PLUGIN_ROOT}` script paths and tier-dispatch as the two **Claude-specific
  adapter columns** in a harness verb table.

TASK-0134 already does the first step, with acceptance criteria written.

**Dispatch gets its own harness verb.** Tier dispatch (Agent tool plus generated
`.claude/agents/*.md`) has no cross-harness standard ([[Agent-Environment-Targets]]). The
evidence artifact is already harness-neutral: the `Dispatch: tier= pinned= served=` line
([[Pipeline-Stages-as-Seams]]). That fits the board-verb template exactly: the verb is
`harness:dispatch`, the evidence is that line, and each harness column says how it is done
(Agent tool, an SDK spawn, a CI job matrix). An environment that can't pin a model declares the
capability missing, and its `served=` line records the truth.

**Mixed providers come free.** codev's hybrid tracker (issues in Jira, PRs on GitHub) needed an
explicit fallthrough mechanism ([[Real-World-Precedents]]). In pdlc, Tracker and Forge are
separate ports with separate configurators (`.board.json` vs a forge key), so Jira + GitHub or
Linear + GitLab is simply two independent choices. Keep them separate; don't merge them into one
"platform" config as Renovate and vibey do.

**Few ports, no nesting.** Cockburn favours "two, three or four" ports, and the book warns that
hexagons don't nest ([[Pattern-Fundamentals]]). One hexagon (the praxisflux core: `lib/` plus
lifecycle doctrine) with three driven ports matches that advice. A port per plugin, or a spec
port with only Spec Kit behind it, is the interface sprawl the overengineering critique describes
([[Costs-and-Failure-Modes]]).

**The verb table is also the anti-corruption layer.** Neutral nouns (change request, check
result, approval) and the two status maps translate *meaning*, not only call shape
([[Related-Patterns]]). Writing them into the table header keeps "PR" from being the core's
noun, even though "one TASK, one PR" is written that way today. The doctrine wording should move
to "change request" when the forge table lands.

## Tensions & tradeoffs

- **Prose adapters can't be contract-tested like code.** A shared suite run against a fake
  ([[Implementation-Mechanics]]) has no direct equivalent for a column of commands. The
  substitutes are weaker:
  - a table lint (every verb has evidence; every column is filled or marked `unsupported`);
  - **live verification per column**, as spec 056 did for Jira;
  - headless runs judged by gates.

  If adapter bugs start costing more than a lint and a one-time live check, that argues for code
  adapters sooner.
- **The headless-orchestrator direction flips step 3 of the verdict.** If decision-1 becomes the
  goal, Node code drives the pipeline instead of a model, and Node-callable adapters become the
  main form. The verb tables are still the right first step: they are the spec that code adapters
  would compile from, and vibey's partial migration shows the cost of writing code before the
  vocabulary is settled ([[Costs-and-Failure-Modes]]).
- **Lost GitHub-specific features.** A neutral forge table makes it tempting to stop using
  GitHub-specific features (environment-protection approvals, the composite Action). Renovate's
  answer is "neutral, while also taking advantage of good platform-specific features"
  ([[Real-World-Precedents]]). Capability flags let the GitHub column keep them.
- **Migration risk.** Rewriting sweep and root-guard prose against verbs touches the most-used,
  most-tuned doctrine. The byte-identical invariant for the `github` column is what makes this
  reviewable. Without it, the change is a rewrite.
- **The patch-flow adapter may never be worth building** given the merge-commit floor. Self-hosted
  needs are likely met by Gitea/Forgejo or GitLab CE.

## Confidence & open questions

**Confidence: medium-high** on the shape (generalise the board seam; Forge not VCS; Harness
first; few ports). **Medium** on the order past step 3, which depends on demand you haven't
stated (GitLab vs Gitea vs Linear first).

What would change it:

- **Choosing headless orchestration** as the main target moves code adapters earlier. This is the
  biggest open question in [[Brief-and-Assumptions]].
- **Hook parity** in Codex or Gemini CLI that turns out close to Claude Code's could make a
  portable hook adapter worthwhile. The branch didn't find their event lists
  ([[Agent-Environment-Targets]]).
- **The `glab`/`tea` command spellings** are unverified ([[Code-Examples]]). If a forge lacks a
  head-SHA-guarded merge, the SHA-binding verb needs an emulation path (check head, then merge)
  with a race window.
- **Linear's MCP tool surface** isn't mapped at verb level, so the Linear column's effort is
  unknown.

## Basis

- [[_grounding]] — G1–G2 (pattern, port count, no nesting), G4 (contract tests, overengineering,
  LCD), G5 (forge precedents, #261, vibey SHA invariant, patch flow), G6 (hybrid tracker), G9
  (harness surfaces), G10 (board seam, couplings, headless spike, TASK-0134, decision-1)
- [[PDLC-Seam-Inventory]] — the board seam as a hexagon; couplings in prose
- [[Pipeline-Stages-as-Seams]] — drivers; Dispatch record as evidence
- [[Agent-Environment-Targets]] — what is and isn't portable
- [[Implementation-Mechanics]] · [[Real-World-Precedents]] · [[Costs-and-Failure-Modes]]
- [[Pattern-Fundamentals]] · [[Related-Patterns]] · [[Code-Examples]]
