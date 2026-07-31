# 047-pdlc-test-deepening — plan

**Constitution:** none ratified — planning against the suite's own conventions
(test/new-plugin.test.mjs as the stated standard, docs/wiki/test-suite-catalog*.md)
per sweep doctrine's absent-constitution rule.

## Approach

One test file substantively (`test/pdlc.test.mjs`), one wiki-catalog amendment.

1. **Read the standard first:** test/new-plugin.test.mjs's skeleton + frontmatter
   assertions, and the chassis `parseFrontmatter` (lib/markdown.mjs) import pattern
   used there. Mirror that shape.
2. **R1:** replace the raw key-order regex in the refactor-triage SKILL tests with
   `parseFrontmatter`; assert the four-section skeleton the new-plugin standard
   checks (name/version/description frontmatter + the skill's phase sections).
3. **R2:** add anchors as content assertions against
   pdlc/skills/refactor-triage/SKILL.md at 0.3.0: (a) the literal triage-record path
   shape (`docs/reviews/refactor-triage-` prefix or the documented record template
   string), (b) the Execute phase's backlog-CLI-only contract sentence token, (c) the
   lens framing token. Anchor on stable phrases, not line numbers.
4. **R3:** one test that extracts the `docs/reviews/team-review-<run-id>.md` spelling
   from BOTH pdlc/skills/refactor-triage/SKILL.md and
   team-review/skills/team-review/SKILL.md and asserts they agree (string equality of
   the shared path template), so either side diverging fails.
5. **R4:** backport the description assertion to the bootstrap frontmatter test
   (assert `description` non-empty / matches the plugin.json teaching, per the
   refactor-triage test's existing pattern).
6. **Wiki:** editing test/pdlc.test.mjs stales `test-suite-catalog-plugins-gates.md`
   (its sources include that file post-TASK-78-split) — amend its pdlc bullet to
   reflect the deepened coverage (NEEDS-REVIEW, not mechanical), re-pin. No CAPSULES
   regen unless its description changes.
7. **Gates:** node --test, check-docs, freshness — green in worktree; re-run after
   any history move. No version bump (test/ + docs/wiki only).

## Risks

- TASK-79/85 are merging concurrently — they don't touch test/ or the catalog notes;
  reconcile at merge should be runbook-log-only.
- Anchor tokens must survive future honest rewording better than exact sentences:
  prefer short distinctive phrases the skill cannot lose without losing the contract.
