---
id: TASK-28
title: >-
  Approval surface: parked runs visible and approvable by humans who are not
  running curl
status: Done
assignee: []
created_date: '2026-07-12 01:23'
updated_date: '2026-07-13 20:18'
labels: []
dependencies: []
priority: medium
ordinal: 250
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Pilot finding: the Wait-node resume URL works but is a signed curl in a log file — fine for the pilot, wrong for any second human. Build the minimal real surface: a small local approvals page (runner-served) listing parked runs with context (run id, target, gate output, agent receipt) and an Approve button that posts to the resume URL with the approver's name; optionally a webhook notification (Slack-shaped) when a run parks. Keep tier-3 semantics: approval identity recorded, structurally required.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A parked run is visible on an approvals surface with enough context to review (gate output, agent receipt, diff stat)
- [ ] #2 One click/tap approves with a recorded approver identity; the workflow resumes and finishes
- [ ] #3 A notification fires when a run parks (webhook or local notification), pointing at the surface
- [ ] #4 Docs updated; the signed-URL mechanism remains as the fallback
<!-- AC:END -->
