---
id: TASK-107
title: >-
  pdlc: verify the host-form tier pins actually serve (TASK-106 AC#8, owed after
  session restart)
status: Done
assignee:
  - '@claude'
created_date: '2026-08-10 17:17'
updated_date: '2026-08-28 17:51'
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
- [x] #1 A dispatch to sonnet-implementer returns and the transcript confirms it was served by cc/claude-sonnet-5[1m] (the config's value), not the session model
- [x] #2 Same confirmed for haiku-implementer (cc/claude-haiku-4-5-20251001) — the tier that was 'not found' at generation time
- [x] #3 Same confirmed for opus-implementer (cc/claude-opus-5[1m]) — the tier that dispatched with a stale pin at generation time
- [x] #4 If any tier's served model differs from its config value, the discrepancy is recorded and the config or doctrine corrected
- [x] #5 TASK-106 AC#8 closed with the served-model evidence recorded on this card
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Served-model verification run 2026-08-28 in a fresh session (agent defs generated 2026-08-11 @ ce38bee; session start 2026-08-28, so the registry-read-at-session-start caveat is satisfied). tiers.mjs --root . --check: exit 0, all three tiers 'unchanged'.

METHOD — evidence is EXTERNAL, not self-report. One throwaway dispatch per tier (sonnet-/haiku-/opus-implementer). Two of the three agents' self-reports were explicitly NOT proof: sonnet cited only inherited $ANTHROPIC_DEFAULT_SONNET_MODEL, and opus honestly reported no harness evidence at all. Ground truth taken instead from the 9router request ledger (~/.9router/db/data.sqlite, table usageHistory, per-request 'model' column) — the proxy records what it actually served. NOTE: the readonly-open view of that DB lags (stops 2026-08-02) because a 330K WAL is unread; copy .sqlite + -wal together and checkpoint before querying, else you read stale rows and conclude nothing ran.

EVIDENCE — probe window 2026-08-28T17:46:00-17:46:45Z, filtered to subagent-sized requests (promptTokens 68k-96k; orchestrator turns are 146k-149k and separate cleanly). Three dispatches x 2 model turns = exactly 6 rows:
  17:46:02.741Z claude-sonnet-5              (90076/153)
  17:46:07.838Z claude-sonnet-5              (95778/274)
  17:46:07.686Z claude-haiku-4-5-20251001    (68045/248)
  17:46:14.505Z claude-haiku-4-5-20251001    (72141/396)
  17:46:07.507Z claude-opus-5                (83918/141)
  17:46:13.421Z claude-opus-5                (89183/227)

RESULT — all three tiers served the model their config names. The fourth hop (config -> generator -> agent def -> harness actually serving) is now verified. Specifically: opus served claude-opus-5, NOT the claude-opus-4-8 fallback that leaked through on 2026-08-10 (TASK-106 finding 3), and haiku dispatched normally rather than 'agent type not found'. Both defects are confirmed closed on this host. No discrepancy found, so AC#4 requires no config or doctrine correction.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All three tier pins verified to actually serve on this host, closing TASK-106 AC#8.

Dispatched one throwaway probe per tier in a fresh session (required: the agent registry is read at session start; defs were generated 2026-08-11 at ce38bee). Deliberately did NOT trust the agents' self-reports — two of three had no harness-provided evidence, and a model's belief about its own identity is exactly the claim under test. Ground truth came from the 9router request ledger's per-request model column, which records what the proxy actually served.

Result: sonnet -> claude-sonnet-5, haiku -> claude-haiku-4-5-20251001, opus -> claude-opus-5. All match .claude/model-tiers.json. The two defects from TASK-106 finding 3 are confirmed closed: opus no longer serves the stale opus-4-8 pin, and haiku no longer dispatches as 'agent type not found'. No discrepancy, so no config or doctrine correction was owed (AC#4).

Method note worth keeping: the router DB must be copied WITH its -wal and checkpointed before querying. A plain readonly open silently returns rows ending 2026-08-02 — it would have looked like the probes never ran. Another instance of the standing 'verify the tool before believing it' rule.
<!-- SECTION:FINAL_SUMMARY:END -->
