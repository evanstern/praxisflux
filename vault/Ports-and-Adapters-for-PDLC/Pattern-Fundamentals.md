---
title: Pattern Fundamentals
aliases: [Hexagonal Architecture, Ports and Adapters]
tags: [hexagonal, ports-adapters, pattern]
type: note
created: 2026-10-11
updated: 2026-10-11
related: ["[[Ports-and-Adapters-for-PDLC]]", "[[Related-Patterns]]", "[[Implementation-Mechanics]]"]
---

# Pattern Fundamentals

What Ports and Adapters is, in its author's terms, as of the 2005 article and the 2024 book.

## Intent

Cockburn's stated intent: "Allow an application to equally be driven by users, programs,
automated test or batch scripts, and to be developed and tested in isolation from its eventual
run-time devices and databases." ([[_grounding]] G1)

Two properties sit in that sentence: **many drivers** (human, program, test, batch) and
**isolation from devices** (databases, external services).

## The elements

| Element | Definition | Source |
|---|---|---|
| Application (hexagon) | Technology-agnostic core | G2 |
| Port | A purposeful conversation boundary; "any device that adheres to the protocols of a port can be plugged into it" | G1 |
| Adapter | "converts the API definition to the signals needed by that device and vice versa" | G1 |
| Actor | Anything outside with behaviour — driving or driven | G2 |
| Configurator | Wires app, adapters, actors together; **outside** the pattern, unspecified | G2 |

## Driving vs driven

```
 driving actors          driving ports   ┌──────────────┐   driven ports         driven actors
 (user, test, CLI,  ──▶  adapter ──▶ [P] │  application │ [P] ◀── adapter  ──▶  (DB, forge,
  orchestrator)                          │              │                       tracker, LLM)
                                         └──────────────┘
```

- **Driving (primary) ports** are interfaces the application *provides*. A driving adapter
  calls them.
- **Driven (secondary) ports** are interfaces the application *requires*. A driven adapter
  implements them.
- Left/right placement mirrors use-case diagrams; it is "not fundamental architectural
  difference" (G1). But the book notes the code is **asymmetric**: the app knows nothing of its
  drivers, and it must be *handed* its driven adapters by the configurator (G2).

## Naming

The book's convention names ports by purpose: `For + verb-ing + purpose` — `ForParkingCars`,
`ForStoringTickets`, `ForConfiguringApp` (G2). A port's name and signature use business
language only; technology names belong to adapters.

## How many ports

- Cockburn: "no particular damage in choosing the 'wrong' number of ports … My selection tends to
  favor a small number, two, three or four ports." (G1)
- The book: start with **one port per actor**; driven-port count follows the number of external
  systems; further splitting raises complexity and lowers value (G2).

## Testing is built into the definition

The book's sequence for bringing a hexagon up (G2):

1. test driver → app → test double (architecture now exists)
2. real driver → app → test double
3. test driver → app → real driven actor
4. real → real (production)

## What the pattern does not say

Explicitly unspecified (G2): how the configurator works, port granularity and naming strategy,
internal app structure, how adapters are designed, whether DDD is used.

Corrected misconceptions (G2): the six sides are meaningless; **the pattern does not nest**
("hexagons within hexagons easily create difficulty"); it is not DDD-only; it has two layers
(inside/outside), not N vertical layers.

## Grounding

- [[_grounding]] — G1 (Cockburn 2005), G2 (Cockburn & Garrido de Paz 2024)
- [Cockburn — Hexagonal architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Book notes](https://github.com/ebarbeito/learning-notes/blob/master/books/hexagonal-architecture-explained.md)
