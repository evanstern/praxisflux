# 051 — tasks

Phases are the dispatch unit: one fresh implementer per phase, re-grounded from this spec
dir plus the branch's commits. Nothing rides chat context between phases — if the next
phase needs it, it is a ticked box, a committed slice, or a note in this dir.

## Phase 1 — Read the source, decide the home, record the decisions

- [ ] Read `/Users/evanstern/Claude/Code/promptworld/scripts/hooks/root-guard-hook.mjs` in
      full (522 lines, read-only — never modify another repo) and record in the Notes
      section: the policy tables, the ordering constraints, and the pre-bash/pre-write
      asymmetry that must be preserved
- [ ] Verify the defect first-hand: confirm the boundary regex and the tokenizer regex
      behave as spec.md describes on the verbatim Co-Authored-By trailer; record the
      reproduction
- [ ] Confirm praxisflux ships zero `PreToolUse` hooks today; record how you verified it
- [ ] **Decide and record R6's home** — `pdlc/hooks/` vs `scripts/` vs extending
      `docs/skill-patterns.md` §5's convention — with rationale
- [ ] **Decide and record the default-on vs opt-in wiring choice** for
      `.claude/settings.json`, with rationale. Ruling B said "ship it", not necessarily
      "enabled by default in every host"
- [ ] **Decide and record** whether R5(a) cross-repo and R5(b) content-false-positive are
      both fixed in scope (both recommended); a deferral needs a stated reason
- [ ] Commit the recorded decisions (spec-dir only; no implementation yet)

## Phase 2 — The quote-state scanner

- [ ] Implement the single-pass quote-state scanner: single quotes, double quotes,
      backslash escapes, and separators (`;` `|` `&` newline backtick `)`) that are
      boundaries **only outside quotes**
- [ ] Unbalanced quote ⇒ parse failure ⇒ **fail closed** (an unparseable command is not an
      allowed command); defined and tested
- [ ] Require the `git` token to be in **command position** (R5(b))
- [ ] Export the scanner as a pure function so it is unit-testable without the stdin
      contract
- [ ] Unit tests for the scanner alone: quoted separators, nested/escaped quotes,
      multi-line messages, unbalanced input
- [ ] Commit

## Phase 3 — Port the policy and wire the hook

- [ ] Port the policy tables and their ordering **verbatim in behavior**: `--amend` denied
      before both allow paths; MERGE_HEAD checked before the board-sync rule; the
      `COMMIT_LONG_WITH_VALUE` / `COMMIT_SHORT_WITH_VALUE` / `COMMIT_LONG_DENY` sets; the
      git-global `-p` (paginate) vs post-subcommand `-p` (`--patch`) distinction
- [ ] Preserve every existing deny path: rebase and force-push repo-wide;
      `merge --squash`, `cherry-pick`, `revert`, `am`, branch creation at root
- [ ] R5(a): an invocation whose resolved toplevel is outside `CLAUDE_PROJECT_DIR` is out
      of jurisdiction and passes
- [ ] R3: a correct denial names **the specific token read as an out-of-scope pathspec**
- [ ] Zero npm dependencies, Node ≥18, ESM
- [ ] Commit

## Phase 4 — The both-directions hazard suite

- [ ] Table-driven test over hazard characters — newline, `)`, `'`, `"`, `;`, `|`,
      backtick — each row asserting **both**: legitimate board-sync commit with the hazard
      in its message is **allowed**, AND a genuinely out-of-scope commit with the same
      hazard is **still blocked**
- [ ] The verbatim `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`
      trailer pinned as its own named case — it is the field failure
- [ ] R5(b) tested directly: `backlog task edit "…git commit…"` is not classified as a git
      invocation
- [ ] R5(a) tested directly: an invocation targeting a different repository passes
- [ ] Confirm no previously-blocked scoping violation became allowed — enumerate the deny
      cases covered
- [ ] `node --test` green; report the real count
- [ ] Commit

## Phase 5 — Plant, posture, docs, re-ground

- [ ] Wire the hook per Phase 1's recorded planting decision; `pdlc/scripts/plant.mjs`
      updated if it plants the hook
- [ ] `pdlc/README.md` documents the hook and its wiring
- [ ] Record the **`-F` and `-C` workarounds** in the planted grounding for hosts still on
      an unpatched copy
- [ ] Note the **promptworld copy's divergence** (AC #6) — what changed, so that host can
      tell what it is replacing
- [ ] **Ruling B obligation:** check root `CLAUDE.md`'s "Enforcement is split by design"
      sentence. If this PR makes it false, amend it here. Record the check either way
- [ ] If `pdlc/templates/CLAUDE.md` changed: re-plant this repo's block in the same PR
      (`plant.mjs --check` first, then `--force` after diffing) — **relocate hand edits,
      never clobber**
- [ ] Amend `docs/wiki/pdlc-plugin.md` as **NEEDS-REVIEW** — re-verify prose against the
      diff, amend, THEN re-pin. Same for `docs/wiki/gates-convention.md` if the hook lands
      as a new gate shape
- [ ] Regenerate `CAPSULES.md` if any `description:` changed
- [ ] Bump at merge-readiness: `node scripts/sync-version.mjs <next-free>` + each edited
      skill's own `version:`
- [ ] All gates green: `node --test`, `check-docs`, `sync-version --check`, freshness
- [ ] Manual proof of R1: in a scratch repo, a `backlog/`-scoped commit with the verbatim
      multi-line trailer is accepted through the hook with **no workaround**
- [ ] Commit; PR opens only after every box above is ticked

## Notes

(Implementers append recorded decisions here — this section is part of the phase handoff
artifact set. Phase 1's four recorded decisions are required entries.)
