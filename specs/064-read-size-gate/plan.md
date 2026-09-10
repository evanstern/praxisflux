# 064 — plan

**Constitution:** absent on this host (`.specify/` is not installed, so there is no
`memory/constitution.md`). Per the sweep's plan-step rule, this plan is checked against
the grounding docs — `CLAUDE.md` (the enforcement split: advisory local, authoritative
CI; the one hard-blocking local surface is opt-in and planted), `docs/principles.md`,
`docs/releasing.md`, and `docs/wiki/pdlc-plugin.md` + spec 051 (the root-guard hook — the
direct precedent for a pdlc-shipped, host-planted PreToolUse hook).

## Approach

One hook script, `pdlc/hooks/read-size-gate.mjs`, selected by argv (`pre-read` |
`pre-bash`), following root-guard-hook.mjs's shape exactly: Node >= 18, ESM, zero
dependencies, stdin JSON in, current-schema JSON out, **no hooks.json beside it** (planted,
never auto-registered). Reuse `pdlc/hooks/shell-scan.mjs` for quote-safe bash parsing —
the same upstream regex-parsing defect spec 051 fixed must not be re-imported here.

### Decisions the card left open, settled here (checkpoint 3 ruling)

- **Default threshold: 500 lines.** A Read call without limit is capped at 2000 lines by
  the harness; 500 is high enough that ordinary source files pass untouched and low
  enough that whole-corpus or generated-file reads trip. Configurable via
  `PRAXIS_READ_GATE_LINES` (env, wins) or `.claude/read-size-gate.json`
  (`{ "lines": 500 }`, beside the tier ladder per the config-as-data precedent).
- **Kill-switch env var: `PRAXIS_READ_GATE_OFF=1`.** Documented in the corpus-loading
  doctrine home: the `docs/wiki/grounded-corpus-spec.md` consumption-protocol vicinity is
  wiki (generated pins), so the durable doc home is `pdlc/hooks/README-read-size-gate.md`
  (planting instructions, like spec 051's planting doc) plus a line in `docs/wiki`'s
  re-pin pass where the consumption protocol is described.

### pre-read mode

Input: `{ tool_name: "Read", tool_input: { file_path, offset?, limit? } }`.

- Exempt: `offset` or `limit` present (targeted read); path under `docs/wiki/`, `specs/`,
  `.worktrees/`, `.claude/worktrees/` (prefix match against the resolved project-relative
  path); kill-switch set.
- Otherwise `wc -l`-equivalent count via `fs` line scan (stream, stop counting past the
  threshold — never load the file). Over threshold → deny with the cheap-path reason
  naming CAPSULES.md/INDEX.md and `defaultTier` dispatch (read the tier name from
  `.claude/model-tiers.json` when present; fall back to the literal "defaultTier").

### pre-bash mode

Input: `{ tool_input: { command } }`. Use shell-scan to find command-position invocations
of bulk readers (`cat`, `head -n <big>`, `tail -n <big>`, `sed -n`-ranges are NOT
gated — only `cat` with no pipe/redirect downstream in its segment). A segment whose
output is piped or redirected is exempt (AC #3: the read feeds a filter, not context).
Resolve file args against cwd; same path exemptions; count lines the same way. Deny in
the same schema.

ponytail: pre-bash gates only plain `cat` of over-threshold files; `awk`/`perl` slurps
pass. Widen the command list when field data shows another bulk-read spelling actually
costing context.

### Fail-closed test (the load-bearing AC)

`test/read-size-gate.test.mjs` spawns the hook as the harness would (`node
pdlc/hooks/read-size-gate.mjs pre-read` with JSON on stdin) and asserts on stdout JSON:

- over-threshold read → `hookSpecificOutput.permissionDecision === "deny"` — asserted on
  the exact current schema path, so a schema drift fails the test (the negative control:
  a deliberately obsolete-schema fixture emitting top-level `decision: block` must NOT
  count as a deny under the assertion helper);
- exemptions (each path prefix, offset/limit, piped bash, kill-switch) → allow (exit 0,
  no deny);
- under-threshold → allow;
- config precedence: env over config file over default.

## Released surface

`pdlc/` is released surface: marketplace + plugin version bumps per `docs/releasing.md`.
No skill edits → no skill `version:` bumps (hooks are not skills). Wiki notes pinned to
`pdlc/` sources (`pdlc-plugin`, `test-suite-catalog-plugins-gates-pdlc`) go stale —
same-PR honest re-pin pass.
