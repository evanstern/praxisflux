---
title: Analysis — Rebuild Architecture
aliases: [pdlc rebuild, four ports]
tags: [analysis]
type: analysis
created: 2026-10-12
updated: 2026-10-12
related: ["[[Ports-and-Adapters-for-PDLC]]", "[[Analysis-Which-Ports-and-How]]", "[[PDLC-Seam-Inventory]]", "[[Pipeline-Stages-as-Seams]]", "[[Agent-Environment-Targets]]", "[[Implementation-Mechanics]]", "[[Real-World-Precedents]]", "[[Costs-and-Failure-Modes]]", "[[Pattern-Fundamentals]]", "[[Related-Patterns]]", "[[Code-Examples]]"]
---

# Analysis — Rebuild Architecture

**Question:** If pdlc is rebuilt around ports and adapters, with three constraints from the
operator (scripted adapters over prose, no dependence on optional host tooling, a spec-writer
port), what is the target architecture and how is it built?

> **Supersedes parts of [[Analysis-Which-Ports-and-How]].** That note stays as history. Three of
> its verdicts are overridden here: adapters as prose (now: code), "don't build a spec port"
> (now: build it), and the implicit assumption that `gh`/`backlog` are present (now: only `git`,
> `node`, a POSIX shell). Its other verdicts stand: Forge rather than VCS; Harness as a port;
> few ports; no nesting; the merge-commit floor.

## Constraints taken as given (operator, 2026-10-12)

1. **Scripted adapters.** The difference between a GitHub PR and a GitLab MR is handled by code
   and gates, not prose. Skills route; they do not adapt.
2. **Tool agnosticism.** Required: `git`, `node`, a POSIX shell. Not assumable: `gh`, `glab`,
   `tea`, `backlog`, `rg`, `jq`, or any other CLI.
3. **Spec-writer port.** Spec Kit and the native fallback (hand-authored spec/plan/tasks under an
   operator-signed escape line) are two adapters of one port.
4. **Harness port** — agreed.
5. A full rebuild of the plugin is on the table.

## Verdict

**One hexagon, one driving port, four driven ports.**

```
 DRIVING ADAPTERS                  CORE                                DRIVEN PORTS → ADAPTERS
 skills (any harness) ──┐                                              ForTrackingWork → backlog-md · jira · linear · github-issues · fake
 CI / composite action ─┼─▶ pdlc CLI ─▶ lifecycle + derivation (pure)  ForHostingChanges → github · gitlab · gitea · none · fake
 headless / orchestr. ──┘   (JSON)      gates over receipts (pure)     ForWritingSpecs → speckit · native · fake
                                        doctrine (harness-neutral)     ForHostingAgents → claude-code · agents-md · headless
```

1. **The `pdlc` CLI is the driving port.** Every actor calls it: skills in any harness, CI,
   orchestrators. Subcommands are the verbs (`pdlc board claim`, `pdlc forge open`,
   `pdlc spec author`, `pdlc doctor`). Output is JSON. Each verb writes or names its **evidence
   artifact**. No skill names `gh`, `backlog`, `rg` or `jq` again.
2. **Four driven ports, each a Node module contract** in `lib/ports/` with a registry, a shared
   contract-test suite, and an in-memory fake. Adapters live in `lib/adapters/<port>/<name>.mjs`.
3. **Default transport is HTTP over Node's built-in `fetch`.** Credentials come from
   `git credential fill` for the remote's host, then env vars. A provider CLI found on `PATH` is
   an optional fast path, never required.
4. **MCP-only providers use a plan/execute split.** The adapter returns an ordered effect list
   (`{tool, args, why}`, as `renderJira` does today). The harness executes it. A sync step writes
   the receipt back. Prefer a REST mode where the provider offers one, so MCP is an alternative
   route rather than the only one.
5. **Gates read receipts, never providers.** The `.board/links.json` rule extends to every port:
   `.board/links.json` (tracker), `.forge/changes.json` (forge: change id, head SHA, merged SHA,
   merge strategy), the spec dir itself (spec). Gates stay offline and CI-runnable.
6. **The core sets floors that adapters must declare.** A forge adapter must support
   `merge-commit` and SHA-guarded merge, or `pdlc` refuses it at configure time. A spec adapter
   must produce derivable phases.
7. **Build order (one TASK, one PR each):**
   1. Chassis: port registry, configurator (`.pdlc.json`), receipt conventions, contract-test
      harness, `pdlc doctor`, `git credential` helper.
   2. Harness port: TASK-0134 (AGENTS.md) plus skill de-Claude-ing.
   3. Forge port: `github` adapter over REST, byte-identical outcomes to today; sweep and
      root-guard rewritten against `pdlc forge …`.
   4. Tracker port: move the board seam onto the chassis; add a `backlog-md` adapter that edits
      task files directly so `backlog` CLI is optional; keep `jira`.
   5. Spec port: `speckit` and `native` adapters; derivation behind the port.
   6. Further adapters, one per PR: `gitlab`, `gitea`, `linear`, `github-issues`.

## Reasoning

**Why code adapters win once tooling is not assumed.** A prose adapter is a column of commands;
it fails on any host missing that command ([[Implementation-Mechanics]]: transport is an adapter
detail, and #261's silent failures came from a missing transport). Under constraint 2, the only
transport guaranteed everywhere is the one Node ships: `fetch`. Prose cannot carry that; code
can. Code adapters also buy the three properties the earlier analysis conceded it could not
deliver ([[Analysis-Which-Ports-and-How]] Tensions): shared contract tests run against a fake
([[Implementation-Mechanics]]), quirks handled once (the `tea api` exit-0 trap,
[[Real-World-Precedents]]), and results a gate can consume.

**Why a CLI is the driving port, not the skills.** The pattern's driving side is whatever starts
the application ([[Pattern-Fundamentals]]). pdlc has at least four drivers: operator in a harness,
headless agent, CI, orchestrator ([[Pipeline-Stages-as-Seams]]). A CLI with JSON output is the one
interface all four can call. Skills become **driving adapters**: they turn an operator's intent
into `pdlc` calls and choose the order. This is the "skills route, scripts adapt, gates verify"
split.

**Why receipts everywhere.** The board seam's strongest property is that the gate never touches
the provider ([[PDLC-Seam-Inventory]]). That is what keeps `lib/`/`gates/` network-free and
CI-runnable. Extending it to forge and spec means one rule for all ports, and it makes MCP-only
providers fit naturally: the model executes the effects, the receipt records the outcome, the gate
judges the receipt.

**Why `git credential fill`.** Git is the one tool guaranteed present, and it already holds the
token for the remote it pushes to. Using it avoids a new auth story per forge and works on any
host the operator can already push to. (Inference from git's documented credential interface;
not one of this branch's grounded sources — verify per forge during the chassis task.)

**Why the spec port is real.** Two adapters exist in practice: Spec Kit, and the native path the
sweep falls back to with an operator-signed escape line ([[PDLC-Seam-Inventory]]). Two is the
threshold. The design choice is where derivation lives. `lib/spec-derive.mjs` reads Spec Kit's
`tasks.md` format directly. Putting `derive(specDir) → phases` behind the port lets a future spec
system keep its own format. The cheaper option, requiring every adapter to emit Spec Kit's format,
is a lowest-common-denominator choice ([[Costs-and-Failure-Modes]]) that the rebuild has room to
avoid.

**Why still one hexagon.** Cockburn's "two, three or four" ports and the book's no-nesting rule
([[Pattern-Fundamentals]]) argue against a hexagon per plugin. spec-bridge, grounding-wiki and
the gates are inside the one core, sharing `lib/`. Four driven ports is at the limit of the
author's guidance, which is a reason to resist a fifth (model provider stays config in
`model-tiers.json`; local git stays unported).

**Why floors, not lowest common denominator.** The merge-commit requirement exists because wiki
notes pin commit SHAs ([[PDLC-Seam-Inventory]]). The SHA-guarded merge follows vibey's invariant
([[Implementation-Mechanics]]). Declaring both as required capabilities turns an adapter that
cannot meet them into a configure-time error, not a silent degradation.

## Tensions & tradeoffs

- **HTTP adapters are more code than CLI shims.** Pagination, rate limits, auth scopes and API
  versions become pdlc's problem. The `fetch`-first rule trades installation burden for
  maintenance burden. The optional CLI fast path does not remove that burden; it only adds a
  second code path.
- **The `backlog-md` adapter writing task files directly** conflicts with the standing rule
  "never hand-edit Backlog markdown". The rule exists to keep metadata consistent. A code adapter
  that reproduces the format is acceptable only if contract tests pin its output against files the
  `backlog` CLI produces. Otherwise keep the CLI as a required dependency of that one adapter.
- **A rebuild touches everything.** Sweep is 462 lines of tuned doctrine. The byte-identical rule
  for the incumbent adapters (Backlog.md, GitHub, Spec Kit, Claude Code) is the only thing that
  keeps each step reviewable. vibey's partial migration shows the failure mode: a port declared
  and most call sites never moved ([[Costs-and-Failure-Modes]]). Each step must move all call
  sites for its port before it merges.
- **MCP-only providers stay second-class.** Their adapters cannot be contract-tested end to end
  without a model in the loop. The REST mode mitigates this where it exists.
- **Four ports is the ceiling the author recommends.** A fifth port request (model provider, CI,
  notifications) should be challenged, not absorbed.

## Confidence & open questions

**Confidence: medium-high** on the shape (CLI driving port, four driven ports, receipts, floors,
fetch-first). **Medium** on build order past step 3, which depends on which non-incumbent adapter
the operator needs first.

Open:

- Whether `git credential fill` returns usable API tokens for each target forge in practice.
- Jira's and Linear's REST/GraphQL surfaces at verb level (not grounded in this branch).
- Hook equivalents in Codex and Gemini CLI — decides whether the Harness port carries enforcement
  or only context ([[Agent-Environment-Targets]]).
- Whether derivation behind the spec port changes the bridge gate's contract (`tasks.md` phase
  headings are read by `bridge.mjs` today).
- `.pdlc.json` vs extending `.pdlc` (the existing sentinel) vs `.board.json` as the configurator
  file.

## Basis

- [[_grounding]] — G1–G2, G4, G5, G6, G9, G10
- [[Analysis-Which-Ports-and-How]] — the prior verdict this note revises
- [[PDLC-Seam-Inventory]] · [[Pipeline-Stages-as-Seams]] · [[Agent-Environment-Targets]]
- [[Implementation-Mechanics]] · [[Real-World-Precedents]] · [[Costs-and-Failure-Modes]]
- [[Pattern-Fundamentals]] · [[Related-Patterns]] · [[Code-Examples]]
