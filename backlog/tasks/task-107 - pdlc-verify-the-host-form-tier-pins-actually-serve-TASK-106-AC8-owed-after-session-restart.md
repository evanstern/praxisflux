---
id: TASK-107
title: >-
  pdlc: verify the host-form tier pins actually serve (TASK-106 AC#8, owed after
  session restart)
status: To Do
assignee: []
created_date: '2026-08-10 17:17'
updated_date: '2026-08-10 17:17'
labels:
  - pdlc
  - verification
  - debt
dependencies: []
priority: high
ordinal: 139000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-106 shipped the config-driven tier mechanism (PR #128, v0.56.0) with one proof outstanding.

The live dispatch proof found three real defects and all were fixed — but the POSITIVE proof was never obtainable in that session. Finding 3 of TASK-106: the agent registry is read at session start, so the newly generated `haiku-implementer` dispatched as "agent type not found" and `opus-implementer` dispatched reporting its PRE-regeneration pin (`claude-opus-4-8[1m]`) while the file on disk already said `claude-opus-5`.

So the last link in the chain — config -> generator -> agent def -> **harness actually serving that model** — is verified for the first three hops and unverified for the fourth. `tiers.mjs --check` is green and the pins are correct on disk, but a green check proves the file says Sonnet, not that Sonnet ran. That distinction is the whole doctrine TASK-106 added.

Cheap to close: one throwaway dispatch per tier in any session started after ce38bee, asking the agent to state its model, compared against `.claude/model-tiers.json`.

Host context: this checkout routes through 9router (ANTHROPIC_BASE_URL -> 127.0.0.1:20128), so the config carries `cc/…[1m]` forms rather than bare API IDs. The bare `claude-sonnet-5` and the `sonnet` alias were both REJECTED in agent-def frontmatter on 2026-08-10.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A dispatch to sonnet-implementer returns and the transcript confirms it was served by cc/claude-sonnet-5[1m] (the config's value), not the session model
- [ ] #2 Same confirmed for haiku-implementer (cc/claude-haiku-4-5-20251001) — the tier that was 'not found' at generation time
- [ ] #3 Same confirmed for opus-implementer (cc/claude-opus-5[1m]) — the tier that dispatched with a stale pin at generation time
- [ ] #4 If any tier's served model differs from its config value, the discrepancy is recorded and the config or doctrine corrected
- [ ] #5 TASK-106 AC#8 closed with the served-model evidence recorded on this card
<!-- AC:END -->
