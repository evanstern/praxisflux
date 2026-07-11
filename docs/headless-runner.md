# Running a praxisflux skill headlessly

The TASK-20 spike: prove a skill runs to completion non-interactively — input files in,
`claude -p` drives the skill in a project, output artifacts + meaningful exit out, no human
in the chat. This is decision-1's extraction step 2: the agent-node recipe an orchestrator
(n8n, GHA, Temporal) wraps in a container.

**Verification doctrine:** a headless run is judged by its artifacts through the gates
(`plan` empty, `check` clean), never by reading the transcript. The transcript is
diagnostics; the gate is the verdict.

## The recipe (proven 2026-07-10, claude CLI 2.1.207)

From the project root the skill should operate on:

```sh
claude -p "/spec-bridge:sync" \
  --allowedTools "Bash(node:*),Bash(backlog:*),Bash(git:*),Read,Glob,Grep" \
  --output-format json > run.json
```

Then the verdict, by artifacts:

```sh
node <praxisflux>/spec-bridge/gates/cli.mjs plan .    # must print nothing
node <praxisflux>/spec-bridge/gates/cli.mjs check .   # must exit 0, no lag warnings
```

Three scenarios ran to completion this way against a fixture Backlog + Spec Kit project,
each gate-verified afterward:

| scenario | outcome | turns | wall-clock | cost |
|---|---|---|---|---|
| lagging task (fresh link) | status → In Progress, phase ACs mirrored | 8 | 49 s | $0.71 |
| regenerated tasks.md, all checked | stale AC replaced, status → Done + derived final summary | 6 | 43 s | $0.67 |
| new unchecked phase after Done | honest backwards move Done → In Progress, phase added | 10 | 45 s | $0.75 |

The one-way contract held unattended: zero writes under the spec dir in every run
(methodology: commit fixture edits before a run so `git status` under the spec dir is an
unambiguous check).

## Observed behavior

- **Exit semantics are about the session, not the task.** Every run exited 0 with
  `is_error: false, subtype: "success"` — including one launched with a deliberately
  too-narrow `--allowedTools`. The exit code means "the session completed", nothing more.
  Success is only what the gates confirm afterward. (This is why the praxisflux doctrine —
  status can't exceed proven artifacts — is the right substrate for orchestration: the
  orchestrator's condition node re-derives instead of trusting.)
- **`--allowedTools` is additive, not a sandbox.** The "restricted" run (only
  `Read,Glob,Grep`) still executed `node` and `backlog` freely with zero
  `permission_denials`, because the developer machine's own settings already allowed them.
  Flags can only *add* permissions on top of the inherited user/project config. Real least
  privilege for an agent node requires environment isolation: a container (or clean
  `$HOME`/config) where the only permissions are the ones the orchestrator grants.
- **Plugins were inherited from the machine's marketplace install.** The fixture had no
  praxisflux setup; `/spec-bridge:sync` resolved because the dev machine has the plugin
  installed. An orchestrator container must install the plugin explicitly
  (`/plugin marketplace add` + `/plugin install`, or a baked image) — nothing headless will
  conjure it.
- **The skill's own output gate ran unattended.** The `-p` transcript shows sync finishing
  with its SKILL.md output gate (re-run `plan` → empty, `check` → clean, `git status` spec-dir
  audit) before ending the session. The skill-patterns shape — precondition gate → work →
  output gate → handoff report — is exactly the headless-ready shape: the session's last act
  is self-verification, and the `result` field carries a handoff report an orchestrator can
  log (but must not trust — see doctrine).
- **The `plan` command kept the agent cheap.** 6–10 turns and ≲$0.75 per run for a skill
  whose bookkeeping is computed (`cli.mjs plan`) rather than reasoned. Tier-1-ing the
  mechanical parts of a skill directly cuts the agent node's cost and variance.
- **JSON output is orchestrator-friendly**: `num_turns`, `duration_ms`, `total_cost_usd`,
  `permission_denials`, `modelUsage`, and the final `result` text all land in one parseable
  document per run.

## Headless-readiness checklist

Check a skill against these before putting it behind an agent node:

1. **Ends with an output gate, not a question.** The skill's final step must be
   self-verification against artifacts (its SKILL.md "Output gate" section). A skill whose
   happy path ends in "ask the user whether…" stalls or no-ops headlessly.
2. **All decisions derivable from files.** Any point where the skill would need mid-run
   human input (an approval, a naming choice, an ambiguous scope) must instead read an
   artifact (config file, task frontmatter, handoff payload) or be split out as a human
   node in the orchestration.
3. **Fails loudly into artifacts.** When the skill can't proceed, the failure must be
   visible to the *gate* afterward (board still lagging, missing artifact), not just stated
   in the transcript — exit 0 tells the orchestrator nothing.
4. **No environment assumptions.** Declares what it needs (CLI tools like `backlog`, the
   plugin itself, git identity for commits) so a container image can provide them; never
   assumes the dev machine's installed plugins or permission config.
5. **Deterministic core, agent shell.** Everything mechanical is a tier-1 CLI (`plan`-style
   planners, gates); the model only handles the genuinely creative residue. Fewer turns,
   lower cost, less variance.
6. **Scoped writes.** The skill's write surface is declared and auditable (`backlog/` yes,
   spec dirs never), so the orchestrator can verify the contract with `git status` after
   the run.

## Not yet exercised (follow-up candidates)

- **Blocking Stop-hook behavior in `-p` mode**: all runs ended with gates passing, so the
  "Stop refused, model forced to continue fixing" loop — the built-in retry that makes gates
  an orchestration primitive — hasn't been observed headlessly.
- **The container recipe**: a minimal image (node + git + backlog CLI + claude CLI + the
  praxisflux plugins + a clean permission config) that makes the isolation findings above
  the default. This is TASK-22's checkout-service input.
