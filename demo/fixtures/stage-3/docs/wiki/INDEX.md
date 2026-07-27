# praxis-pet — grounding wiki index

Code-grounded corpus for the praxis-pet CLI. Load a note just-in-time when its concept
is in play; every note is pinned to the commit it was verified against.

## System

- [[overview]] — what praxis-pet is, its layout, and how the pieces compose.

## Components

- [[pet-state-machine]] — the pure pet state machine: stats, verbs, mood, death.
- [[pet-cli]] — the command-line entry point and its verb dispatch.
- [[pet-store]] — JSON persistence: where the pet lives between commands.

## Quality

- [[pet-test-suite]] — the node:test suite and what it proves.
