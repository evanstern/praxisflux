---
id: TASK-21
title: 'grounding-wiki ''plan'' command: compute the wiki re-pin edits'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-11 01:30'
updated_date: '2026-07-11 03:14'
labels: []
dependencies: []
priority: medium
ordinal: 53000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Apply TASK-9.7's computed-not-reasoned pattern to the wiki freshness loop, which burned real time across TASK-17/18/19: every source-touching commit stales notes, and the re-verify pass is mostly mechanical (diff the pinned sources, re-pin when the diff can't invalidate prose, surface only the notes needing human/model judgment). Add 'plan <root> [wiki-dir]' to grounding-wiki/gates/cli.mjs: for each stale note, print the sources diff summary since its pin and classify — RE-PIN ONLY (e.g. version-stamp-only or comment-only diffs by heuristic: no source prose the note cites changed... conservative: only when the diff touches no lines the note quotes) vs NEEDS REVIEW (diff summary attached). Emit the exact sed/edit for re-pin-only notes (verified_against -> HEAD) and a per-note work order for the rest. gates/ stays read-only: plan prints, the wiki-update skill executes. The wiki-update SKILL.md gains plan as its precondition step. Keep the hard rule: a pin bump is a verification claim — plan may only auto-re-pin when the classification is provably safe, and the default is NEEDS REVIEW.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 plan <root> lists every stale note with its pin, the commits since, and a RE-PIN-ONLY vs NEEDS-REVIEW classification (default NEEDS-REVIEW; auto class only for provably-safe diffs)
- [ ] #2 Emitted re-pin edits run verbatim and leave the freshness gate green for those notes; NEEDS-REVIEW notes come with the relevant diff summary as a work order
- [ ] #3 On a fresh corpus plan emits nothing (idempotent no-op)
- [ ] #4 wiki-update SKILL.md rewritten with plan as its backbone; tests cover safe re-pin, needs-review, and no-op; skill + marketplace versions bumped
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. freshness.mjs (read-only): pure classifyStampDiff(changedLines, noteBody) — the ONE provably-safe class is 'every changed line is a lockstep version stamp (json/yaml version keys, npx @pkg@semver pins) AND the note body contains no semver literal'; everything else NEEDS-REVIEW (default). planFreshness(root, corpusDir) walks stale notes and returns entries {note, pin, head, commits, files(+/-), cls, reason}.
2. grounding-wiki/scripts/repin.mjs — the writer the plan emits (gates stay read-only, spec-bridge/backlog precedent): sets verified_against to a validated full hash; runAsCli + exported repin() for tests.
3. cli.mjs plan <root> [corpus-dir]: RE-PIN-ONLY entries print runnable 'node .../repin.mjs <note> <head>' lines with a # reason; NEEDS-REVIEW entries print a # work-order line (pin, commits since, per-file +/- summary). Fresh corpus prints nothing, exit 0.
4. Tests in test/grounding-wiki.freshness.test.mjs (throwaway git repo fixture already there): stamp-only -> REPIN + emitted command runs verbatim -> gate green; stamp-only but note mentions a semver -> REVIEW; code diff -> REVIEW with summary; fresh -> silent.
5. wiki-update SKILL.md rewritten around plan (bump 0.1.1 -> 0.1.2); marketplace 0.6.4; wiki re-pin cadence.
6. Finalize + per-task course (docs/courses/TASK-21) + PR.
<!-- SECTION:PLAN:END -->
