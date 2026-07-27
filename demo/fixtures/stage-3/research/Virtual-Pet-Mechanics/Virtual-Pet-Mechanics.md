---
title: Virtual Pet Mechanics
aliases: []
tags: []
type: moc
created: 2026-07-27
updated: 2026-07-27
related: []
---

# Virtual Pet Mechanics

How tamagotchi-style virtual pets model care stats, decay, neglect, and death — and why
those loops retain players. Grounds the domain praxis-pet implements. Descriptive only;
verdicts belong in analyses.

## Scope

In: care-meter design (hunger/happiness/energy style stats), decay and refill balance,
care mistakes, death/ending design, and the retention theory behind care loops.
Out: collection/breeding metagames, monetization design, any praxis-pet implementation
decision (that's the codebase's wiki, not this branch).

## What is known

Care play is meters decaying on timers plus verbs that trade between meters
([[Care-Meters-and-Decay]]). Neglect is made legible as "care mistakes" and, on the
classic hardware, fatal ([[Neglect-and-Death]]). The whole loop is an appointment
mechanic with a moral stake, which is why it retains — and why pure punishment loops
eventually repel ([[Care-Loops-and-Appointment-Mechanics]]).

## Notes

- [[Care-Meters-and-Decay]] — stats, decay rates, refill trade-offs.
- [[Neglect-and-Death]] — care mistakes, lifespans, the death-design spectrum.
- [[Care-Loops-and-Appointment-Mechanics]] — why the loop retains; failure modes.

## Analyses

_Opinionated evaluations built on this branch (added by the analyze phase). Empty until then._

## Open questions

- What decay-rate curves feel fair in a CLI pet a user visits a few times a day?
- Where should a small demo pet sit on the death spectrum (permadeath vs revive)?

## Grounding

- [[_grounding]] — the research pass this branch is built on
