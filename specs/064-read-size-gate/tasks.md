# 064 — tasks

Phases are the dispatch unit: one fresh implementer per phase, re-grounded from this spec
dir plus the branch's commits. Nothing rides chat context between phases. Push after every
phase's commit. Run the suite as bare `node --test`.

## Phase 1 — The hook and its fail-closed tests

- [x] Add `pdlc/hooks/read-size-gate.mjs` (`pre-read` | `pre-bash` by argv), current
      `hookSpecificOutput.permissionDecision` schema, zero deps, no hooks.json beside it
- [x] pre-read: threshold from env `PRAXIS_READ_GATE_LINES` / `.claude/read-size-gate.json`
      / default 500; streaming line count that stops at the threshold; exemptions for
      offset/limit, `docs/wiki/`, `specs/`, `.worktrees/`, `.claude/worktrees/`, and
      `PRAXIS_READ_GATE_OFF=1`
- [x] pre-bash: shell-scan-based `cat` detection, piped/redirected segments exempt, same
      path exemptions and kill-switch
- [x] Deny reason names capsule-first loading (CAPSULES.md / INDEX.md) and Agent dispatch
      at the config's `defaultTier` — no external service
- [x] Add `test/read-size-gate.test.mjs`: end-to-end spawn per case — deny asserted on
      the exact current schema path with an obsolete-schema negative control, every
      exemption, under-threshold allow, config precedence
- [x] Full suite green (`node --test`)
- [x] Commit and push

## Phase 2 — Planting doc, versions, wiki

- [x] Add `pdlc/hooks/README-read-size-gate.md`: what the gate does, how a host plants it
      (settings.json PreToolUse wiring for Read and Bash), threshold config, exemptions,
      and the kill-switch documented for wiki-build/wiki-update/design-rounds passes
- [x] Bump versions per `docs/releasing.md` (marketplace + plugin lockstep)
- [x] Honest re-pin pass over wiki notes whose sources this branch touched
      (`pdlc-plugin`, `test-suite-catalog-plugins-gates-pdlc`; kill-switch pointer where
      the consumption protocol is described): classify per diff, amend prose, re-pin
- [x] `node scripts/check-docs.mjs`, `gen-marketplace --check`, `sync-version --check`,
      freshness gate all green
- [x] Commit and push

### Phase 2 deviations from plan.md

- The reconcile-merge (main moved under this branch, TASK-0126's PR #141: structured-offload
  seam, 0.63.0 → 0.63.1) landed first via `git merge origin/main` — clean, no conflicts —
  so this phase bumps from 0.63.1, not 0.63.0.
- Ten wiki notes went STALE from the version-stamp bump alone (`plugin.json`/
  `marketplace.json`/`action.yml` churn only). Four (`build-and-release`,
  `pdlc-plugin`, `reorient-plugin`, `team-review-plugin`) tripped the freshness planner's
  conservative NEEDS-REVIEW heuristic (a note quoting ANY semver literal anywhere, even an
  unrelated historical one, is never auto-classified REPIN) — each diff was read by hand
  and confirmed version-stamp-only against sources; the quoted literals are unrelated past
  milestones (e.g. "Since 0.23.0", "`v0.2.0` was the pipeline's first release"), so all four
  were re-pinned after manual confirmation. The other six were genuine RE-PIN-ONLY, applied
  via the planner's emitted `repin.mjs` commands.
- `pdlc-plugin.md` and `test-suite-catalog-plugins-gates-pdlc.md` needed real prose
  amendment (new sources added: `pdlc/hooks/read-size-gate.mjs`,
  `pdlc/hooks/README-read-size-gate.md`, `test/read-size-gate.test.mjs`) — the freshness
  gate can't see this on its own since those files weren't previously in either note's
  `sources:` list. Adding the read-size-gate paragraph pushed `pdlc-plugin.md` over the
  8,000-char body budget (8,682); trimmed existing prose (root-guard section, peer-utilities
  section, local-only section) rather than split summary-style or claim
  `size_budget_exempt`, landing at 7,913 chars.
- `test-suite-catalog-plugins-gates-pdlc.md`'s `description:` frontmatter changed (now names
  the read-size-gate suite), so `CAPSULES.md` was regenerated
  (`node grounding-wiki/scripts/capsules.mjs . docs/wiki`) per the description-changed rule —
  no other note's description changed.

## Phase 1 deviations from plan.md

- `pdlc/hooks/shell-scan.mjs`'s `scanCommand` now also returns `terminators`
  (the unquoted separator character — `|`, `;`, `&`, …, or `null` at EOF —
  that ended each segment), alongside the unchanged `segments`. Plan.md's
  pre-bash section says a `cat` segment is exempt when "no pipe or redirect
  downstream", but `scanCommand`'s segments alone can't distinguish a `cat
  file | grep x` pipe from a `cat file; echo done` — both just end a segment.
  Recording the terminator lets read-size-gate.mjs gate the `;` case (still
  spends full context) while exempting the `|` case (feeds a filter), per AC
  #3's own wording. Purely additive — `segments` is unchanged, so
  root-guard-hook.mjs and its two existing test files are unaffected (full
  suite verified green post-change).
- Deny output is written via `fs.writeSync(1, …)` rather than
  `process.stdout.write` — the latter, followed immediately by
  `process.exit(0)`, was observed truncating the JSON when stdout is piped
  (a real async-flush race, caught by this phase's own end-to-end tests).
  `writeSync` sidesteps it entirely; noted since it's a small departure from
  root-guard-hook.mjs's own `process.stderr.write` + `process.exit` shape
  (that hook has the same latent race on stderr, unexercised by its tests,
  and is out of this task's scope to fix).
