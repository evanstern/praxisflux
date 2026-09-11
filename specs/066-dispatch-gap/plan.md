# 066 — implementation plan

## Constitution check

**No ratified constitution** (`.specify/` absent; this spec set is hand-authored under the
runbook's operator-signed escape line). Planned against the project's grounding docs
instead, per the sweep's plan-step rule:

| Grounding doc | What it binds here |
|---|---|
| `docs/principles.md` | **artifact-grounded action** — the whole task is an application of it: a dispatch that leaves no artifact did not happen. Also **one TASK, one PR** (operator ruling R1 keeps all fixes in this one PR). |
| `docs/wiki/gates-convention.md` | fail closed; a failure line **names its fix** — binds both R3's dispatch check and R7b's wiring. |
| `docs/wiki/pdlc-grounding-block.md` | the planted block's marked-block mechanism (compose, refresh wholesale, honest drift) — R1 edits inside those markers; R6 re-pins this note. |
| `docs/skill-patterns.md` | shared authoring patterns for the template R2/R5 create. |
| `docs/handoff-protocol.md` | the **inter-plugin `.handoff/` transport** — explicitly NOT what R2's lane-handoff template is (finding F2). Do not conflate. |
| `docs/releasing.md` | released surface (`pdlc/`, `lib/`, `spec-bridge/`) ⇒ marketplace bump **plus** each edited skill's own `version:`; CI enforces. |
| `CLAUDE.md` (planted block) | the very text R1 rewrites; also the two-track landing rule this PR follows. |

**Tension, named and resolved: does the dispatch check belong to `pdlc` or `spec-bridge`?**
`pdlc` owns the lifecycle verbs and the doctrine; `spec-bridge` owns the gate that reads
board cards. The dispatch record lives **on a board card**, and `checkBridge` already walks
every linked card (finding F3) — so the check belongs in `spec-bridge/gates/bridge.mjs`,
with the doctrine that mandates the record in `pdlc`'s planted block and sweep skill. Record
that rationale where the check lands; a future reader will ask why a "dispatch" check is not
in `pdlc`.

## Approach

### Read before writing — two premises this plan corrects

This plan's own earlier draft carried a **false finding**, and the correction is instructive
for the implementer:

1. **`plant --check` already exits 1 on a drifted block.** The earlier claim ("exits 0") came
   from piping node's output to `head` and reading `head`'s exit status. Verify yourself:
   `node pdlc/scripts/plant.mjs --root . --peer backlog --check` then `echo $?` **with no
   pipe**. R7b is therefore *wiring*, not a contract change.
2. **There is no lane-handoff template.** `docs/design/lane-4-handoff.md` and
   `jira-board-handoff.md` are one-offs; `docs/handoff-protocol.md` + `lib/handoff.mjs` are
   the unrelated `.handoff/` transport. R2/R5 **create** a template.

**Do not take either on faith — re-verify both before you build on them.** The measurement
error above is exactly the kind of thing that produced this task in the first place.

### R1 — the planted block's Model tiers section

Edit `pdlc/templates/CLAUDE.md`. The section currently opens *"A sweep dispatches each task's
implementation to a subagent; which model that subagent runs on drives both cost and
quality."* The problem is grammatical subject: the sentence's subject is *a sweep*, so a
session not running a sweep reads it as inapplicable.

Rewrite the opening so the subject is **the reader**, and so the obligation is stated
independent of how the work arrived. Keep everything downstream in that section (the config
location, host-form ID rules, the two pin mechanisms, verify-the-served-model, the
registry-read-at-session-start warning, and which surface is authoritative) — those are all
still correct and load-bearing. This is a targeted opening rewrite plus a standing-obligation
sentence, **not** a rewrite of the whole section.

The new text must survive the test that broke the old text: *would a session that reached its
work through a handoff document, having never loaded `pdlc:sweep`, read this as binding on
itself right now?*

### R2 + R5 — the lane-handoff template

Create `pdlc/skills/sweep/templates/lane-handoff.md`, beside `runbook.md`.

**R5 governs its shape: the FIRST line assigns the role, before any content.** Not a field,
not a table row, not a section the reader reaches after learning what the work is. The
diagnosis is role ambiguity at resume — a handoff is prose a session reads and then acts on,
so by the time a tier field appears the reader has already become the implementer.

Then, in the body, the tier is expressed as **an instruction to dispatch** (*dispatch to
`<tier>-implementer`*), never as a bare label, with the verify-the-served-model step
attached. Mirror `runbook.md`'s `{{PLACEHOLDER}}` conventions so the two templates read as
one family.

Wire the template into `pdlc/skills/sweep/SKILL.md`'s bundled-resources list, and have the
skill point at it where it discusses handing a lane off. A template nothing references is a
file, not a mechanism.

### R3 — the dispatch record and its check

**The record's shape** must be machine-findable on a board card, like the `Spec:` marker
already is. Choose a marker line and specify it exactly in the doctrine so producer and
consumer cannot drift. It must carry, at minimum, **the model that actually served** —
that is the fact the whole task exists to make checkable.

**The check** extends `checkBridge` in `spec-bridge/gates/bridge.mjs`, reusing
`parseLinkedTask` in `lib/board-mirror.mjs` (finding F3 — no new gate script, no new
surface).

**Fail closed, and mind the blast radius.** `checkBridge` runs over *every* linked task in
this repo — 63 of them — via the Stop hook, the pre-commit/pre-push hooks, and CI. A naive
"every linked card must carry a dispatch record" would fail on ~62 historical cards at once.
The runbook makes that an **operator checkpoint**, so:

- Scope the requirement to what it can honestly claim. The rule is about a task's PR being
  merge-ready, so the check should bind tasks that are *claimed under this doctrine*, not
  every card that ever existed.
- Whatever scoping you choose, **write down what it does NOT catch.** An honest narrow gate
  beats a broad one that has to be softened later — softening a gate mid-flight is precisely
  the failure this repo keeps re-learning.
- **If a defensible scoping still flags historical cards, STOP and surface it.** Do not
  retrofit records onto old cards, and do not weaken the rule to make the suite green.

**TASK-0125 must satisfy its own rule** — its card carries a dispatch record from this
task's dispatch. Use it as the fixture that proves the check passes on a compliant card.

### R4 — the rejection record

Land positive text stating the inline carve-out was considered and refused, with the
reasoning and the TASK-86/87/88 precedent. `docs/design/lane-4-dispatch-gap.md` already
carries the analysis; the job here is making sure the **doctrine surface** (planted block
and/or sweep skill) does not contradict it and that the refusal is discoverable from where
someone would look for permission. **Silence does not satisfy AC #4.**

### R6 — re-plant and re-pin

1. Re-plant: `node pdlc/scripts/plant.mjs --root . --peer backlog --force` (this repo opts
   into the `backlog` peer only; `spec-kit` and `jira` are recorded as `peersOmitted` — pass
   the same peer set or you will strip the block's Backlog section).
2. Confirm `.pdlc`'s `version` advances off `0.57.0` and the block's BEGIN marker stamps the
   new version.
3. Re-pin `docs/wiki/pdlc-grounding-block.md` — **NEEDS-REVIEW, not RE-PIN-ONLY**: its prose
   makes claims about the Model tiers section that R1 rewrites. **Amend the prose first,
   then bump `verified_against`.** Read the diff you are pinning over
   (`git diff <old-pin>..HEAD -- pdlc/templates/CLAUDE.md`).
4. `docs/wiki/pdlc-sweep.md` also pins sweep sources — if R2/R5's template or SKILL.md edits
   touch its listed sources, it needs the same treatment. Check; don't assume.

### R7 — the upgrade path

- **R7a:** add a re-plant/upgrade section to `docs/releasing.md` (which says nothing about
  re-planting today). Concrete sequence, the `.pdlc` staleness test, and the
  edits-outside-the-markers warning.
- **R7b:** wire `plant --check` into a surface that runs. **After** the R6 re-plant, or the
  repo fails its own new gate (R4 sequencing).
- **R7c:** note the shared defect shape with R3 in the rationale; keep the mechanisms
  separate.

## Sequencing (binding — see runbook R4)

Re-plant (R6) **before** wiring the check (R7b). Otherwise the new gate fails praxis
immediately, and the tempting fix is to weaken it.

## Gates before PR

`env -u GIT_DIR -u GIT_WORK_TREE -u GIT_INDEX_FILE node --test` ·
`node scripts/check-docs.mjs` ·
`node scripts/run-gates.mjs --gates spec-bridge,wiki-freshness` ·
`node scripts/sync-version.mjs --check` · marketplace + skill
`version:` bumps per `docs/releasing.md` — an **ordinary** bump, not breaking.

**The test command is `node --test`, NOT `npm test`** — this repo has no root
`package.json`. In a worktree the env-scrub is mandatory: git hands worktree hooks an
absolute `GIT_DIR`, which the suite's fixture repos (which `execFileSync` git with a tmpdir
cwd) would inherit and commit onto the real branch. `.githooks/pre-commit:8-11` documents
it. (Corrected after Phase 1 reported that an earlier draft of this plan said `npm test`.)

## Concurrency

A sibling sweep (TASK-0126/0124/0127, specs 063/064/065) is in flight and collides on
`.claude-plugin/marketplace.json`, every `*/plugin.json` version field, `CLAUDE.md`, and
`docs/wiki/` pins. This branch is **pin-carrying**: merge `origin/main` **in**; never
rebase, squash, or force-push. Re-run every gate after each merge-in. Smaller PR merges
first.
