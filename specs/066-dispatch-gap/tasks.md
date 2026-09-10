# 066 — tasks

Phases are dispatch boundaries: **one fresh implementer per phase**, re-grounded from this
spec dir plus the branch's commits. Nothing passes between phases via chat context — if the
next phase needs it, it lives in a ticked box, a committed slice, or a note in this dir.

Phase order is **binding**: Phase 4 (re-plant) must land before Phase 5 (wire the check), or
the new gate fails this repo immediately.

## Phase 1 — Verify the premises, then the doctrine prose (R1, R4)

- [x] Re-verify finding F1 first-hand: run `node pdlc/scripts/plant.mjs --root . --peer backlog --check`, then `echo $?` **with no pipe**. Confirm it exits 1 on this repo's drifted block. If it exits 0, STOP — the spec's correction is itself wrong and the operator needs to know
- [x] Re-verify finding F2: confirm no lane-handoff template exists (`pdlc/skills/sweep/templates/` holds only `runbook.md`) and that `docs/handoff-protocol.md` + `lib/handoff.mjs` are the inter-plugin `.handoff/` transport, not a lane handoff
- [x] Rewrite the opening of `pdlc/templates/CLAUDE.md`'s `## Model tiers` section so its grammatical subject is the reader, not "a sweep" — a standing obligation on whoever is implementing, however they arrived (sweep, handoff doc, or direct request)
- [x] Keep the rest of that section intact (config location, host-form model IDs, the two pin mechanisms, verify-the-served-model, registry-read-at-session-start, which surface is authoritative)
- [x] Apply the R1 test to the new text: would a session that arrived via a handoff document, never having loaded `pdlc:sweep`, read this as binding on itself right now?
- [x] Land the R4 rejection record as **positive text**: the inline carve-out was considered and refused, with the reasoning and the TASK-86/87/88 precedent; ensure no doctrine surface contradicts it. Silence does not satisfy AC #4
- [x] Commit

## Phase 2 — The lane-handoff template (R2, R5)

- [x] Create `pdlc/skills/sweep/templates/lane-handoff.md`
- [x] **First line assigns the role** — orchestrator, not implementer; dispatch to `<tier>-implementer`; verify the served model — before the reader learns anything about the work. Not a field, not a table row
- [x] In the body, express the tier as an instruction to **dispatch**, never as a bare label, with the verify-the-served-model step attached
- [x] Mirror `runbook.md`'s `{{PLACEHOLDER}}` conventions so the templates read as one family
- [x] Reference the template from `pdlc/skills/sweep/SKILL.md` (bundled resources + where it discusses handing a lane off) — a template nothing references is a file, not a mechanism
- [x] Bump the sweep skill's own `version:` per `docs/releasing.md`
- [x] Commit

## Phase 3 — The dispatch record and its fail-closed check (R3)

- [ ] Specify the record's marker line **exactly** in the doctrine (planted block and/or sweep skill), machine-findable like the existing `Spec:` marker, carrying at minimum the model that actually served
- [ ] Extend `checkBridge` in `spec-bridge/gates/bridge.mjs`, reusing `parseLinkedTask` from `lib/board-mirror.mjs`. No new gate script, no new surface
- [ ] Scope the requirement honestly: `checkBridge` runs over all 63 linked cards via Stop hook, pre-commit/pre-push, and CI — a blanket rule fails ~62 historical cards. Bind tasks claimed under this doctrine, not every card that ever existed
- [ ] Write down what the chosen scoping does **not** catch. An honest narrow gate beats a broad one that gets softened later
- [ ] **If a defensible scoping still flags historical cards: STOP and surface it.** Do not retrofit records onto old cards; do not weaken the rule to make the suite green
- [ ] Prove it fails closed: a claimed card with no dispatch record must be **reported**, not passed
- [ ] Use TASK-0125's own card (which carries a dispatch record from this task's dispatch) as the passing fixture — the task must satisfy its own rule
- [ ] Tests for both directions: missing record reported, present record clean
- [ ] Commit

## Phase 4 — Re-plant and re-pin (R6) — MUST precede Phase 5

- [ ] Re-plant: `node pdlc/scripts/plant.mjs --root . --peer backlog --force`. Pass exactly this peer set — `spec-kit` and `jira` are `peersOmitted` here, and a different set would strip or add block sections
- [ ] Confirm `.pdlc`'s `version` advances off `0.57.0` and the block's BEGIN marker stamps the new version
- [ ] Amend `docs/wiki/pdlc-grounding-block.md`'s prose where R1 changed what it describes — **NEEDS-REVIEW, not RE-PIN-ONLY.** Read the diff you are pinning over (`git diff <old-pin>..HEAD -- pdlc/templates/CLAUDE.md`) before touching the pin
- [ ] Only then bump that note's `verified_against`
- [ ] Check whether `docs/wiki/pdlc-sweep.md`'s pinned sources were touched by Phase 2/3; if so, same classify-then-pin treatment
- [ ] Commit

## Phase 5 — The upgrade path (R7) — AFTER Phase 4

- [ ] **R7a:** add the re-plant/upgrade section to `docs/releasing.md` — the concrete sequence (update plugin → re-run `pdlc:bootstrap` → block reports `drifted` → diff → consent → `--force`), the `.pdlc` staleness test (`planted version < plugin version`), and the warning that user edits belong OUTSIDE the markers or a re-plant discards them
- [ ] **R7b:** wire `plant --check` into a surface that actually runs it — nothing does today (verified over `.github/`, `.githooks/`, `scripts/`). Put it where this repo's other doctrine checks live
- [ ] **Do NOT change `plant --check`'s exit-code contract** — it already exits 1 on drift. No breaking-change bump, no "downstream CI may start failing" warning; both obligations are withdrawn with the false premise
- [ ] Verify the failure line names its fix (re-run `pdlc:bootstrap`; diff; `--force`); add it if absent
- [ ] Confirm `--check` remains read-only — no sentinel advance, no write
- [ ] Tests: a drifted block fails the newly-wired surface; a clean one passes. Do not test a behavior change that isn't happening
- [ ] **R7c:** note the shared defect shape with R3 in the rationale; keep the two mechanisms separate
- [ ] Commit

## Phase 6 — Release obligations and close (all ACs)

- [ ] Marketplace version bump + every edited skill's own `version:` per `docs/releasing.md` — an **ordinary** bump, not breaking
- [ ] Test suite green: `env -u GIT_DIR -u GIT_WORK_TREE -u GIT_INDEX_FILE node --test`. **There is no `npm test` in this repo — no root `package.json` exists.** The env-scrub is mandatory in a worktree: git hands worktree hooks an absolute `GIT_DIR`, which the suite's fixture repos would inherit and commit onto the real branch (`.githooks/pre-commit:8-11`)
- [ ] `node scripts/check-docs.mjs` green
- [ ] `node scripts/run-gates.mjs --gates spec-bridge,wiki-freshness` green
- [ ] `README.md` / `CLAUDE.md` updated if what the repo ships changed
- [ ] Reconcile with fresh `origin/main` (merge **in** — pin-carrying branch; never rebase/squash/force-push), then re-run every gate above **and** the freshness probe unconditionally
- [ ] Tick all six ACs on TASK-0125, honoring the two sufficiency tests: AC #4 is a positive rejection record; AC #3 is a fail-closed check
- [ ] Open the PR from the worktree; it must land as a **merge commit**
