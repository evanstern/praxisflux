---
name: team-review
version: 1.0.0
description: Run a lead-engineer-plus-team architecture review of a codebase using parallel subagents, producing one consolidated, evidence-backed report — what's good, what could be improved, what should be removed, steal-worthy patterns, new ideas, and open questions. Use whenever the user asks to review, audit, assess, or critique a codebase, repo, or project ("what do you think of this code", "give me a code review of this repo", "fresh eyes on this", "what would you keep/change/remove", "what's worth stealing from this"), wants a second opinion on an architecture, or asks how well a codebase serves a stated product goal — even if they don't use the word "review". Not for reviewing a single diff or PR (use a diff-review flow for that).
---

# Team codebase review

You are the lead engineer of a small review team. You open a tracked run, orient yourself, form
your own opinion on the codebase's crux, fan out specialist subagents in parallel, synthesize one
consolidated report, and prove it through the output gate. The engagement is **read-only**: never
modify, create, or delete files in the target repo — the gate verifies this against a git snapshot.

Why a team: a single context can't hold a whole codebase, and a single reader anchors on the first
files they open. Independent deep-dives with different beats, forced to bring file:line evidence,
surface findings one pass would miss — and the lead's own reading keeps the synthesis from being a
mere aggregation of reports.

Helper scripts live in this plugin's base directory (`${CLAUDE_PLUGIN_ROOT}`). Every script has a
stated inline fallback — the skill must still work hand-copied without them. `gates/` only
verifies and never writes; `scripts/run.mjs` is the only state writer. Run records ride the
gitignored `.handoff/team-review/runs/` transport at the *invoking* project's root — transient
plumbing, never inside the reviewed repo; the report is the durable residue.

## Precondition gate — open the run

1. Confirm the target is a codebase directory you can read, and that the ask is a whole-repo
   review (a single diff/PR belongs to a diff-review flow — say so and stop).
2. Capture the lens: if the user stated a goal ("this will eventually be X"), it becomes the
   review's lens — every agent gets it, and the report pressure-tests the architecture against it;
   this is routinely the most valuable part. No stated goal → infer one from the README/docs and
   *declare the inference in the report*; ask only when the repo gives no signal at all.
3. Open the tracked run — the durable record that a review is in flight, and the evidence base
   (git snapshot) the output gate later checks the read-only rule against:
   `node ${CLAUDE_PLUGIN_ROOT}/scripts/run.mjs begin <target-repo>` (add `--report <path>` to
   choose where the report file lands; the default is the current directory, never inside the
   target).
   *Fallback if the script is missing:* note the target's `git rev-parse HEAD` + `git status
   --porcelain` yourself and pick a report path outside the target; self-check at the end.

## Phase 1 — lead orientation (before any delegation)

Get the lay of the land: `node ${CLAUDE_PLUGIN_ROOT}/scripts/orient.mjs <target-repo>` prints
layout, line-weight per directory, test weight, and recent commits — the facts that size the team
and suggest the beats. *Fallback:* gather the same facts with `ls`, `find | wc`,
`git log --oneline -5`. Also skim the README and any docs index or design docs.

Then **read one or two load-bearing files yourself** — the design doc, the core loop, whatever the
crux is. You need an independent opinion strong enough to pressure-test what the agents report,
and to spot the strategic tension the beats might each only half-see.

Tell the user what you found and what team you're dispatching before you dispatch it.

## Phase 2 — fan out the team

Spawn all agents **in one message** (they run concurrently, in the background). Size the team to
the repo (non-test source lines, from orientation):

| Repo size | Team |
|---|---|
| under ~5k lines | 1 senior deep-dive + 1 scout |
| ~5k–50k lines | 2 senior deep-dives + 2 scouts |
| over ~50k lines | 2–3 seniors + 3–4 scouts, beats split by subsystem |

- **Seniors** (`general-purpose` agent, a strong model): depth on the seams that matter — typically
  (a) the core engine/domain logic and (b) whichever layer the user's goal makes most important.
- **Scouts** (`Explore` agent, the cheapest model): breadth sweeps — typically (a) the user-facing
  surface (CLI/UI/API) and (b) tests + process/docs hygiene (load-bearing or drifting?).

Derive the actual beats from the seams found in Phase 1, not from this table verbatim.

**No-subagent fallback:** if the harness has no Agent/Task tool, dispatch the same team as
concurrent `claude -p` processes with a read-only toolset, feeding each prompt via **stdin** —
`--allowedTools` is variadic and will swallow a trailing positional prompt:
`claude -p --model <opus|haiku> --allowedTools "Read,Glob,Grep" < prompt.txt > report.txt &`.
Same beats, same report structure, same caps.

**Dispatch mode — match how you yourself are running.** If you are the top-level session,
background dispatch (Agent tool or `&`) is fine: the harness wakes you when teammates finish. If
you are yourself a subagent, do NOT park the turn waiting on background children — nested
wake-ups are unreliable and you may stall until someone external nudges you. Instead launch the
`claude -p` teammates concurrently and wait for them in the foreground of a single shell call
(`... & ... & wait`), or poll their output files in a bounded loop. Never end a turn with the
team still out and the report unwritten.

### Agent prompt template

Every agent prompt must include, adapted to its beat:

1. Persona + ground rules: "veteran <domain> engineer, READ-ONLY review, do not modify files.
   You are a teammate, not a lead: do NOT invoke the team-review skill (or any review skill) and
   do NOT spawn your own sub-team — produce your report yourself, inline in your reply." (Without
   this, a teammate that has this skill installed will recurse into a full nested engagement.)
2. The beat: exact packages/dirs to cover, plus any design docs stating intent — and an
   instruction to verify the code matches the stated intent, not just read the docs.
3. Project context: what the codebase is, and the user's goal (the lens).
4. The report structure — seniors get all five sections, scouts a trimmed version:
   - **What's good** — with file:line evidence and *why* it's good, not flattery.
   - **What could be improved** — complexity hotspots, coupling, missing abstractions, risks;
     evidence required.
   - **What should be removed/simplified** — dead code, YAGNI, over-engineering.
   - **Steal-worthy ideas** — patterns portable to other projects, and what makes them portable.
   - **Gaps vs the goal** — what would have to change for the stated goal; seniors' most
     important section.
5. A word cap (~1500 seniors, ~800 scouts) and "dense, evidence-backed".

## Phase 3 — relay, spot-check, and shepherd

As each report lands, give the user a short plain-language digest — lead with the verdict. If a
finding contradicts your own Phase 1 reading or another agent's claim, spot-check the cited file
before carrying it into the synthesis; agents' plausible-but-wrong claims are your responsibility
to catch, and refuting one is worth telling the user about.

**Don't wait passively.** If a teammate goes quiet well past the others (rule of thumb: more than
twice the last completion), check on it — nudge it, or inspect its output artifacts on disk. Judge
liveness by the *process*, not the file: `claude -p` buffers stdout until completion, so an empty
report file mid-run is not evidence of death (`ps` the pid before declaring it stalled). If it
is genuinely stalled or its result is unrecoverable, proceed to Phase 4 with what you have and
**declare the coverage gap explicitly in the report** rather than blocking forever. A stalled
agent must cost the review a section, never the whole engagement.

## Phase 4 — synthesize

Write the report to the run's report path (never inside the target repo). Selective rather than
exhaustive — include a finding only if it would change what the reader does next. Keep file:line
citations on load-bearing claims (the gate requires them to resolve to real files). Structure:

```
# <repo> — team review

**TL;DR:** <the verdict in 3–6 sentences, including the single biggest gap vs the goal>

## What we like
## What could be improved      (numbered, most important first)
## What should be removed
## Stealing for later          (portable patterns, each with why it's portable)
## New ideas — <toward the goal>   (concrete proposals, roughly build-ordered)
## Questions for you           (only decisions genuinely the user's to make)
```

The TL;DR must answer "should I be happy with this codebase, and what's the one thing to worry
about" on its own. "New ideas" should build on what exists (name the existing pieces each idea
reuses) rather than proposing greenfield rewrites.

## Output gate — prove the run

`node ${CLAUDE_PLUGIN_ROOT}/scripts/run.mjs finish <run-id>` — verifies the report has all
sections, its citations resolve into the target repo, and the target is byte-for-byte untouched
since `begin`. If it blocks, **produce the missing artifact** (fix the report, investigate any
repo mutation) — don't argue with the gate. If the user cancels the review midway, close with
residue: `run.mjs abandon <run-id> <reason>`. *Fallback if the script is missing:* self-check the
same three properties by hand and say so.

Then hand off: present the report to the user, answer with the assessment, and stop — fixes to
the reviewed codebase happen only if the user asks.
