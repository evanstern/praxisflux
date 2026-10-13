---
title: Related Patterns
aliases: [Onion, Clean Architecture, Anti-Corruption Layer, Functional Core Imperative Shell]
tags: [hexagonal, clean-architecture, ddd, fcis]
type: note
created: 2026-10-11
updated: 2026-10-11
related: ["[[Ports-and-Adapters-for-PDLC]]", "[[Pattern-Fundamentals]]", "[[Implementation-Mechanics]]"]
---

# Related Patterns

Patterns that share or extend the hexagon's core rule, and where each differs.

## One rule, three vocabularies

Hexagonal (2005), Onion (2008) and Clean (2012) share the **dependency rule**: source
dependencies point inward to the domain; infrastructure depends on the domain, never the reverse.
Commentators summarise the choice between them as "choosing to apply the dependency rule and
picking the vocabulary" (G3).

| | Emphasis | Adds |
|---|---|---|
| Hexagonal | Connecting the core to many external systems | ports/adapters vocabulary, driving/driven |
| Onion | Rich domain model in concentric rings | domain services as contracts |
| Clean | Explicit use cases | a use-case ring between entities and adapters |

## Functional Core / Imperative Shell

Bernhardt (2012) described FC/IS as inspired by Ports & Adapters, "on a lower level — dealing
with functions, not services" (G3).

- Hexagonal **inverts dependencies** (the core owns interfaces; adapters implement them).
- FC/IS **reorders calls**: the shell reads values → the pure core decides → the shell performs
  effects.
- Commentators note FC/IS "tells you what should live inside the hexagon" (G3).

Illustrative shape (not from a source; Node ESM):

```js
// core: pure — values in, decision out
export function decideMerge({ prMerged, checksGreen, behindBase }) {
  if (prMerged) return { action: "noop" };
  if (behindBase) return { action: "rebase" };
  return checksGreen ? { action: "merge" } : { action: "wait" };
}
// shell: effects — gathers values through ports, executes the decision
const facts = await forge.changeRequestState(id);      // driven port
const d = decideMerge(facts);
if (d.action === "merge") await forge.merge(id, { strategy: "merge-commit" });
```

praxisflux's chassis already describes several modules in FC/IS terms: `lib/lifecycle.mjs` and
`lib/spec-derive.mjs` are pure reads (files → status), and decision-1 calls them "pure,
stateless reads" (G10).

## Anti-Corruption Layer (DDD)

"An Adapter changes the shape of a call. An ACL changes the meaning." (G3)

- An ACL has a **Facade** (simplifies the external system), an **Adapter** (implements the
  domain's interface), and a **Translator** (maps concepts).
- It applies "when the models differ enough that importing the external vocabulary would
  constrain your local design."

Where this shows up in the forge/tracker space (G5, G6, G10):

| Domain concept | External vocabularies |
|---|---|
| change request | GitHub *pull request*, GitLab *merge request*, Gitea *pull*, email *patch series* |
| check result | GitHub *checks*, GitLab *pipelines* |
| approval | GitHub *reviews*, GitLab *approvals* |
| task status (3 states) | Backlog.md statuses; a Jira workflow observed with **15** statuses |
| task id | Backlog `TASK-12`, Jira `KEY-123`, Linear `ENG-42`, GitHub `#12` |

The praxisflux board seam's two status maps — `statusMap` (write, injective) and
`statusReadMap` (read, many-to-one) — are a translator in this sense (G10).

## Grounding

- [[_grounding]] — G3 (relatives), G5/G6 (vocabulary pairs), G10 (local seams)
- [Jovanović — Clean vs Onion vs Hexagonal](https://milanjovanovic.tech/blog/clean-architecture-vs-onion-vs-hexagonal)
- [Jovanović — Anti-Corruption Layer](https://milanjovanovic.tech/blog/anti-corruption-layer-ddd)
- [FC/IS README](https://github.com/kbilsted/Functional-core-imperative-shell/blob/master/README.md)
