# 042-refactor-triage-last-run-at — plan

**Constitution:** none ratified in this repo — planning against the grounding docs
(docs/principles.md, docs/releasing.md, docs/wiki/pdlc-refactor-triage.md) per sweep
doctrine's absent-constitution rule.

## Approach

One skill file (`pdlc/skills/refactor-triage/SKILL.md`, now 0.2.0 after TASK-75), two
insertions into surfaces 0.2.0 just settled.

1. **R1 — record format:** in the section that specifies the tracked triage record's
   contents, add a required, machine-findable line — recommended shape: a frontmatter
   key or a fixed-prefix line `last-run-at: <full 40-char commit id>` — defined
   exactly once, with the rule for what the id is: the resolved right endpoint of the
   scanned range (`git rev-parse` of the range end), or HEAD at scan time for
   whole-repo mode. State that the id must be a full hash (short ids rot).
2. **R2 — Scope phase entry:** alongside the existing explicit-range and whole-repo
   entries, add "since last triage": locate the newest triage record in
   `docs/reviews/` (by the run-id timestamp convention 0.2.0 defines), extract
   last-run-at per R1's format, verify `git rev-parse <id>` and that `<id>..HEAD`
   resolves; on success scan `<id>..HEAD`; on any failure (no records, no
   last-run-at line, unresolvable id) STOP and tell the operator — never fall back to
   a guessed range. Cross-reference TASK-75's run-id rule; do not restate it.
3. **R3 — release:** skill 0.2.0 → 0.3.0; `node scripts/sync-version.mjs <next free
   minor vs origin/main>` at merge-readiness (expect 0.47.0 or the next free — check
   `git show origin/main:.claude-plugin/marketplace.json` at bump time; siblings are
   merging concurrently). Re-verify `docs/wiki/pdlc-refactor-triage.md` (NEEDS-REVIEW:
   its only source is the skill file) — its `description:` must NOT grow (499/500;
   TASK-78 trims it next). Lockstep stamps → classify siblings (expect RE-PIN-ONLY).
4. **Gates:** node --test, check-docs, freshness, version-bump — green in worktree;
   re-run after any history move.

## Risks

- TASK-78 (wiki headroom) follows in this lane and trims the same note's description —
  keep description untouched here.
- Sibling merges (TASK-89 lane) will move main mid-flight; take the next free version
  and re-pin, as TASK-75 did.
