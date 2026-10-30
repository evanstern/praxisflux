# 074 pdlc:pr-review-sweep — spec

**Board task:** TASK-0145.

## Problem
Working a PR review (read comments, decide which are real, track the rest, fix, reply) was done by hand
for kofile/ai-coe-plugins PR #43. pdlc has the sweep (execute tasks) and refactor-triage (merged work) but
nothing for review feedback, and the manual run surfaced rules worth encoding: the code may live on a branch
other than the checkout; host standing orders (no PRs, push one branch) override sweep defaults; Spec Kit may
be root-local and git-excluded; "create the PR" for a deferral is ambiguous; public replies are outward-facing.

## Requirements
- R1: a pdlc skill `pr-review-sweep` (read → triage → card → sweep → reply) with a "Use when" description.
- R2: five dispositions (fix / pass-not-valid / pass-covered / defer / already-resolved), each with evidence.
- R3: standing orders and head-branch resolution passed into `pdlc:sweep`; merged/squash-merged PRs handled.
- R4: replies gated on operator go-ahead and on the fix being reachable.
- R5: registered in plugin.json, marketplace.json, pdlc README, planted template, root README; tests pin it;
  wiki re-verified; version bumped per docs/releasing.md.

## Evidence
Dry runs (read-only) on PR #43 and merged PR #44, v0.1.0 vs v0.2.0; trigger check 20/20 queries.
Findings drove the v0.2.0 edits (merged PRs, resolved reviews, id numbering, sibling sweep, tracker fallback).
