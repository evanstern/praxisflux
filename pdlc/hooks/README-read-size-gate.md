# read-size-gate — planting doc

`pdlc/hooks/read-size-gate.mjs` (spec `specs/064-read-size-gate`) is a `PreToolUse` hook
pair — `pre-read` (Read) and `pre-bash` (Bash) — that denies a read above a configurable
line threshold, redirecting the session to the cheap path this repo already prefers:
capsule-first corpus loading (`CAPSULES.md` / `INDEX.md`, just-in-time notes) or dispatching
an Agent at the `.claude/model-tiers.json` `defaultTier` to read and summarize instead of
spending orchestrator context on the whole file. It never redirects to an external service.

Same posture as the root-guard hook (spec 051): **planted into an adopting host, never
auto-registered.** There is deliberately no `hooks.json` beside `read-size-gate.mjs`, so
installing `pdlc` never wires this by default.

## Planting it

Copy **both** `read-size-gate.mjs` and its scanner `shell-scan.mjs` (the hook `import`s
`./shell-scan.mjs`; a planted hook missing its scanner is broken) into the host's
`.claude/hooks/`, then merge two `PreToolUse` entries into the host's `.claude/settings.json`,
preserving anything already wired there:

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Read", "hooks": [{ "type": "command", "command": "node .claude/hooks/read-size-gate.mjs pre-read" }] },
      { "matcher": "Bash", "hooks": [{ "type": "command", "command": "node .claude/hooks/read-size-gate.mjs pre-bash" }] }
    ]
  }
}
```

(Unlike root-guard, there is no `plant.mjs --hook` automation for this one yet — wire it by
hand as above.)

## Threshold config

Default **500 lines**. Overridable, env wins:

1. `PRAXIS_READ_GATE_LINES` (env)
2. `.claude/read-size-gate.json` — `{ "lines": 500 }`, beside the tier ladder
3. `500` (default)

## Exemptions (allow, no deny)

- Path prefixes (resolved project-relative): `docs/wiki/`, `specs/`, `.worktrees/`,
  `.claude/worktrees/`
- A Read call with `offset` or `limit` set — the session already scoped itself
- A `cat` in a bash command whose segment is piped downstream (`|`) or whose args redirect
  output/input (`>`, `>>`, `<`) — the read is feeding a filter, not session context

## Kill-switch — required for grounding passes

`PRAXIS_READ_GATE_OFF=1` disables the gate entirely. **Set it for
`grounding-wiki:wiki-build`, `grounding-wiki:wiki-update`, and `pdlc:design-rounds` passes.**
Those skills must read real source to earn an honest `verified_against` pin (wiki-build/
wiki-update) or to read implementation comments deliberately (design-rounds Phase 2) — this
gate is a nudge for ordinary reads, never a wall in front of grounding.

## Fail-open, not fail-closed

Malformed/unparseable stdin, an unreadable file, or any internal hook error all allow the
read (exit 0, no deny output) — this hook only ever blocks on a proven over-threshold read.
