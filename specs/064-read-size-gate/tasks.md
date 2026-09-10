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

- [ ] Add `pdlc/hooks/README-read-size-gate.md`: what the gate does, how a host plants it
      (settings.json PreToolUse wiring for Read and Bash), threshold config, exemptions,
      and the kill-switch documented for wiki-build/wiki-update/design-rounds passes
- [ ] Bump versions per `docs/releasing.md` (marketplace + plugin lockstep)
- [ ] Honest re-pin pass over wiki notes whose sources this branch touched
      (`pdlc-plugin`, `test-suite-catalog-plugins-gates-pdlc`; kill-switch pointer where
      the consumption protocol is described): classify per diff, amend prose, re-pin
- [ ] `node scripts/check-docs.mjs`, `gen-marketplace --check`, `sync-version --check`,
      freshness gate all green
- [ ] Commit and push

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
