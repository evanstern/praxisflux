---
id: TASK-118
title: >-
  gate tests assert weaker than their stated intent: a negative-control
  convention for spec-mandated assertions
status: To Do
assignee: []
created_date: '2026-09-08 15:35'
labels:
  - tech-debt
  - doctrine
  - gates
  - tests
dependencies: []
ordinal: 149000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Three assertions in one task (TASK-116 / spec 060) each claimed to pin a behaviour and did not. Every one was found only by deliberately breaking the behaviour and checking the test failed — never by reading the code or the spec.

1. **Spec 060 R3 — write ordering.** The spec mandated `git status --porcelain` is empty after a first local-only plant. That end state is order-INDEPENDENT for any successful run: the assertion passes with the writes reordered. Verified by moving the ignore-write to the end of `plant()` — the mandated assertion still passed. An mtime-based companion assertion (`statSync(..., {bigint:true}).mtimeNs`) is what actually catches it.

2. **Spec 054 — sentinel schema.** The guard pinned a hardcoded key list (`["planted","version","name","peers","peersOmitted","hooks","plantedAt"]`) to assert "jira adds no sentinel fields of its own". A legitimate new non-peer field (spec 060's `localOnly`) therefore broke a jira test, and the reflex fix — append the name to the literal — weakens the guard one name at a time until it asserts nothing. Narrowed by operator ruling to state the intent differentially: a jira plant's key set must equal a baseline plant's.

3. **Spec 060 R5 — doc presence.** The test asserted its phrases against the WHOLE `SKILL.md`, and the same phase had added those phrases to the `description:` frontmatter. So it matched the description, passed, and the operator-facing section it existed to protect could be deleted with no test noticing. Fixed by asserting against the body with frontmatter stripped plus an anchored header match.

The common shape: **the spec states an observable, the test asserts that observable, and the observable does not actually depend on the behaviour.** All three passed review, CI, and a full green suite.

Also worth encoding, because it bit the orchestrator: a negative control that silently no-ops looks IDENTICAL to a real pass. Verifying #3 "failed" twice because the gutting script used `s.index("## Plant")`, which matches inside `"## Planting mode"` — the slice removed nothing and an intact file was being tested. A negative control must prove it actually broke the thing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The convention is written down where spec and test authors will read it (docs/skill-patterns.md, docs/principles.md, or the corpus spec — placement decided, not assumed)
- [ ] #2 It states the rule: an assertion pinning a behaviour must be shown to FAIL when that behaviour regresses, and the negative control must be shown to have actually broken it
- [ ] #3 It names the three concrete failure shapes from spec 060/054 as worked examples, so the rule is recognizable rather than abstract
- [ ] #4 The three fixed assertions are cited as the reference pattern for what a real guard looks like
<!-- AC:END -->
