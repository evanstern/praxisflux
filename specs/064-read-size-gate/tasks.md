# 064 — tasks

Phases are the dispatch unit: one fresh implementer per phase, re-grounded from this spec
dir plus the branch's commits. Nothing rides chat context between phases. Push after every
phase's commit. Run the suite as bare `node --test`.

## Phase 1 — The hook and its fail-closed tests

- [ ] Add `pdlc/hooks/read-size-gate.mjs` (`pre-read` | `pre-bash` by argv), current
      `hookSpecificOutput.permissionDecision` schema, zero deps, no hooks.json beside it
- [ ] pre-read: threshold from env `PRAXIS_READ_GATE_LINES` / `.claude/read-size-gate.json`
      / default 500; streaming line count that stops at the threshold; exemptions for
      offset/limit, `docs/wiki/`, `specs/`, `.worktrees/`, `.claude/worktrees/`, and
      `PRAXIS_READ_GATE_OFF=1`
- [ ] pre-bash: shell-scan-based `cat` detection, piped/redirected segments exempt, same
      path exemptions and kill-switch
- [ ] Deny reason names capsule-first loading (CAPSULES.md / INDEX.md) and Agent dispatch
      at the config's `defaultTier` — no external service
- [ ] Add `test/read-size-gate.test.mjs`: end-to-end spawn per case — deny asserted on
      the exact current schema path with an obsolete-schema negative control, every
      exemption, under-threshold allow, config precedence
- [ ] Full suite green (`node --test`)
- [ ] Commit and push

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
