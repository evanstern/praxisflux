---
name: reorient-plugin
description: The reorient plugin — a corpus-grounded reorientation loop where N parallel evaluators judge research branches under a stated lens against the project's wiki and board, the operator steers between rounds, and one synthesis lands as board moves; proven by an output gate over per-branch analyses and synthesis sections. Runs are session-owned, worktree-first, and target-rooted — records live at the TARGET project's root, wherever the CLI is invoked from (reorient-run-ownership).
kind: component
sources:
  - reorient/.claude-plugin/plugin.json
  - reorient/skills/reorient/SKILL.md
  - reorient/gates/reorient.mjs
  - reorient/hooks/hooks.json
  - reorient/scripts/gate.sh
  - reorient/scripts/stop.mjs
  - reorient/scripts/run.mjs
verified_against: 0323b7722d7a272377ad39cf3e47fbf18ae1a86d
---

# reorient plugin

The `reorient` plugin (lockstep with the marketplace version; skill at its own
`version: 0.5.0`) runs a **corpus-grounded reorientation** of a project's direction: the
lead takes N already-gathered corpus branches and a **lens** (the project's purpose
statement), fans out one evaluator subagent per branch to judge the corpus against the
project's wiki and board, checkpoints operator decisions between rounds, has the
evaluators cross-ground each other's converged drafts, and merges everything into one
synthesis that ends as concrete board moves. It owns the **judging and merging** loop
only — gathering corpus is the research plugin's EMBED phase, and the skill stops and
names that phase when the corpus is missing (phase-separated composition through files,
[[skill-patterns]] §1).

Unlike [[team-review-plugin]] — its closest structural relative — reorient operates **on
the invoking project itself and is allowed to write into it** (analysis notes into vault
branches, the synthesis into the project's docs). Its gate therefore proves
**presence-and-merge, not untouched-ness**. Run records ride the gitignored
`.handoff/reorient/runs/` transport at the **target project's root**, never the
invoking cwd — so the run is visible to the target's sessions and their Stop gates;
the durable residue is the analyses, the synthesis, and the board.

## How it works

**Everything-optional grounding.** `begin` records a manifest of what the host project
offers: corpus entries are classified `vault-branch` (an ancestor carries the research
plugin's `.research-vault` sentinel) or `adhoc` (`classifyCorpus`), and
`detectGrounding` records whether a `docs/wiki/` and a `backlog/` board exist. Nothing
is required; the skill states its degradation (no wiki → evaluators ground on
README/docs; no board → board moves become a proposed-tasks list) and the gate scales
its demands to the manifest — the "Board moves" synthesis section is only required when
a board was detected, and only `vault-branch` entries must carry an analysis note.

**The run record is the manifest the gate verifies against — session-owned and
worktree-first** ([[reorient-run-ownership]] has the full model). `scripts/run.mjs` (the
plugin's only writer) opens a run with
`begin <root> --lens "<purpose>" --corpus <path> [...] [--shared-checkout]`
— every subcommand resolves the runs registry from the **resolved target root** —
refusing an empty lens or corpus, and refusing a TARGET whose registry root is a
shared primary checkout unless `--shared-checkout` is given (the override lands on
the manifest and rides `list`/owner provenance). It records lens, classified corpus, detected
grounding, the owner (session id + user@host, heartbeat kept fresh by the owner's
Stop hook), and the synthesis path (default `docs/design/reorient-<run-id>.md` —
**run-id-keyed, never date-keyed**, so same-day runs can't collide). `finish` runs the
output gate and marks the run `done` only on pass; `abandon <id> <reason>` (owner-only)
closes with durable residue; `takeover <id>` explicitly adopts a foreign run.
`$REORIENT_HOME` overrides the runs dir (tests).

**The output gate never writes.** `gates/reorient.mjs` exports the pure pieces
(`runsDirFor`, `hasAnalysisNote`, `checkReorient`) and checks: the lens is recorded; every
declared `vault-branch` carries an `Analysis-*.md` with `type: analysis` frontmatter
(shape only — deep validity belongs to the research plugin's own gates); the synthesis
exists **outside every corpus branch** (the merge document is cross-branch connective
tissue the vault's isolation rule forbids the branches from holding) and carries the
required sections (TL;DR/verdict, Decisions, Course of action, Open questions, and Board
moves when a board was detected); and the synthesis **names every corpus branch** — a
merge that doesn't mention a branch didn't merge it.

**Stop-hook enforcement scopes to the owner.** `reorientGate` consumes the
[[gate-runner]] session `ctx`: an in-flight run blocks **only its owning session**
(finish/abandon guidance appended); a foreign run never blocks — at most a non-blocking
"looks orphaned" notice once its heartbeat goes stale. `scripts/stop.mjs`
is a thin `runStopHook({ gates: [reorientGate], before })` entry — `before` heartbeats
this session's runs — through the standard `gate.sh` shim (`hooks/hooks.json`; node
missing = one-time stderr notice, then exit 0).

**The skill** (`skills/reorient/SKILL.md`) walks six phases in the gate→work→gate shape:
precondition gate (capture the lens, select corpus branches, detect grounding,
`run.mjs begin` — worktree-first, with the override as the stated exception); Phase 1
lead orientation (the lead reads the briefs/groundings itself — the deepest finding is
often a mismatch between the corpus's original framing and the lens); Phase 2
evaluate ×N (one read-only subagent per branch, dispatched in one message, each with
persona, the verbatim lens, its beat, and a fixed report structure ending in
**open questions for the operator**); Phase 3 steer (checkpointed relay: digest, spot-check
bold claims, put decisions to the user, relay answers into the *same* agents as fixed
constraints, record each decision durably as it's made); Phase 4 cross-ground (each
evaluator reconciles with siblings' drafts — duplicated inline per vault isolation, no
cross-branch wikilinks — writes its branch's analysis note, and names any conflict it
cannot reconcile rather than papering over it); Phase 5 synthesize (the lead writes the
merge document, never an agent); Phase 6 execute (sign-off, then board moves via the
`backlog` CLI only, implementation handed to the host project's own machinery). A
no-subagent fallback runs evaluations sequentially in-session; every script states an
inline fallback.

Since skill 0.2.0 the flow consumes the project wiki per [[grounded-corpus-spec]] v2:
orientation and evaluator grounding take the `CAPSULES.md` view when present, loading
full notes only for cited claims, with `INDEX.md`-first just-in-time loading as the v1
fallback (README/docs when no wiki at all). The skill carries the open A/B question
(capsule-only vs full-note evaluator grounding) for the next run to record.

## Connections

- Composes with the research plugin strictly through files: reads what `research-vault`
  produced (the `.research-vault` sentinel, `_grounding.md`, neutral notes) and writes
  `analyze-vault`-conventional `Analysis-*.md` notes those gates can verify — never
  invokes a sibling skill ([[skill-patterns]] §1, [[research-plugin]]).
- A deliberate variation on [[team-review-plugin]]'s caller-supplied-target model:
  same `.handoff/` run-record shape at the target root, but writes into the target are
  the point, so the gate proves artifacts exist rather than untouched-ness.
- The gate rides [[gate-runner]] and the run-as-CLI guard from [[chassis-utilities]];
  packaged by [[build-and-release]], registered generatively by `gen-marketplace.mjs`.
- Instantiates the [[gates-convention]] per run rather than per project state.
- Covered by [[test-suite]] (`test/reorient.test.mjs` + the install-path fixture).
- Provenance: formalized from a live promptworld reorientation (2026-07-25); ownership
  and worktree-first followed from the 2026-07-26 concurrency incident
  ([[reorient-run-ownership]]).

## Operational notes

- Run lifecycle CLI: `node ${CLAUDE_PLUGIN_ROOT}/scripts/run.mjs begin <root> --lens
  "<purpose>" --corpus <path> [--corpus <path> ...] [--synthesis <path>] [--session <id>]
  [--shared-checkout] | finish <id|root> | abandon <id|root> [reason] |
  takeover <id|root> | list [root]`; a directory key selects that target's registry.
- Gate CLI (read-only): `node ${CLAUDE_PLUGIN_ROOT}/gates/reorient.mjs <run.json>` —
  exit 0 pass, 2 with problems on stderr.
- The default synthesis path is under the project's `docs/design/`; `checkReorient`
  enforces the outside-every-corpus-branch rule even when a caller overrides the path.
