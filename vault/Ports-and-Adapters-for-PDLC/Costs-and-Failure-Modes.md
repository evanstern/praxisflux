---
title: Costs and Failure Modes
aliases: [overengineering, leaky abstraction, lowest common denominator]
tags: [hexagonal, risks]
type: note
created: 2026-10-11
updated: 2026-10-11
related: ["[[Ports-and-Adapters-for-PDLC]]", "[[Implementation-Mechanics]]", "[[Real-World-Precedents]]"]
---

# Costs and Failure Modes

Documented ways port/adapter layers go wrong, each with its source. Listed neutrally; weighing
them against pdlc is analysis work.

| Failure mode | What the sources report | Source |
|---|---|---|
| **Overengineering** | "applying it 'by the book' can lead to overengineering"; not for CRUD-like complexity | G4 (Rentea, AWS) |
| **Interface sprawl** | "every layer exposes and consumes only interfaces" from misreading "depend on abstractions" | G4 |
| **Change scatter** | a simple change spans many files and directories | G4 |
| **Lowest common denominator** | exposing only shared features hides each backend's strengths | G4 (tante, commons-os) |
| **Leaky abstraction** | backend details surface through the port anyway | G4 |
| **Semantic mismatch** | same value means different things per backend (status names; numeric vs `KEY-123` ids) | G4, G6 |
| **Fake drift** | in-memory fake behaves differently from the real adapter; caught by shared contract tests | G4 |
| **Silent transport failure** | `tea api` exits 0 on HTTP error; MCP-less fallback with no token fails writes silently | G5 |
| **Partial migration** | port declared, but most call sites still shell to the old tool directly (vibey: one command routed) | G5 |
| **Nested hexagons** | "hexagons within hexagons easily create difficulty" | G2 |
| **Too many ports** | complexity up, value down with each split | G2 |
| **Session ≠ task success** | a headless run exits 0 regardless; only gates over artifacts judge it | G10 |
| **Default flip burden** | changing the default adapter forces existing adopters to declare the old one (vibey: GitHub users must set `kind = "github"`) | G5 |

## Counter-measures recorded alongside

- Shared contract tests per port, fake included (G4).
- Capability sets / `NotSupported` / raw passthrough (G5).
- Partial providers with fallthrough (G6).
- Byte-identical-behaviour invariant for the incumbent adapter (praxisflux board seam: "no behavior
  change for a `backlog` host"; vibey: "GitHub behavior byte-for-byte unchanged") (G5, G10).
- Architecture rules as CI tests (G4).
- Few ports — Cockburn's "two, three or four" (G1).

## Grounding

- [[_grounding]] — G1, G2, G4, G5, G6, G10
- [Rentea — overengineering](https://victorrentea.ro/blog/overengineering-in-onion-hexagonal-architectures/)
- [tante — LCD](https://tante.cc/2009/02/15/abstractions-and-the-lowest-common-denominator/)
