# 025-sweep-doctrine-reconcile — one story across SKILL, template, wiki, and planted claims

Board: TASK-60 · Direction: downstream bug-find sweep from promptworld (2026-07-27)
against praxis decaa14 (v0.27.0); carded 6c053c2; executed under
`docs/design/downstream-bugfix-runbook.md` (Lane A, second — works on the
post-TASK-58 text at main ≥ 7c2b6cd).

## The contradictions

1. **Claim ordering.** The sweep SKILL's Phase 2 loop authors the full Spec Kit cycle
   before any branch or commit exists (and cuts the worktree from `origin/main`, which
   will not contain the spec), while `templates/runbook.md`'s claim protocol requires
   the FIRST commit of any task to claim it BEFORE any spec authoring; the SKILL loop
   has no claim step at all, and `docs/wiki/pdlc-sweep.md` papers over it with a merged
   sequence neither file states.
2. **Rebase leftover in the claim remedy.** The runbook template still says "rebase and
   re-push the claim" for an unrelated push rejection — TASK-57 amended the doctrine to
   merge-over-rebase and names rebase a pin-breaking move; as written the remedy is
   unexecutable on hosts that hook-block rebase (promptworld) and, for an
   already-pushed claim branch, requires the force-push the same paragraph forbids; the
   TASK-57 wiki re-ground quietly softened this to "reconcile-and-repush" so wiki and
   shipped template disagree.
3. **Drift-gate mode inventory.** The SKILL documents a 3-mode host drift gate
   (session/worktree/pr, three invocations recorded verbatim) while the runbook
   template mandates a 4th mode (`claim --dir`) the SKILL never probes for.
4. **Re-ground order / Done ownership.** The SKILL orders `spec-bridge:sync` BEFORE
   ticking tasks.md (sync sees unchecked boxes, moves nothing) then marks Done
   manually, while spec-bridge's sync SKILL declares sync the ONLY path to Done.
5. **Planted-hook overclaim.** `pdlc/templates/CLAUDE.md` plants "Plugins ship Stop
   hooks that enforce this," but grounding-wiki ships no hook at all — hosts are told a
   gate exists that nothing installs.

## Requirements (map 1:1 to board ACs)

R1 (AC #1) — the SKILL Phase 2 loop gains an explicit claim step, and both files state
ONE ordering: the claim commit (board card → In Progress + spec-number dir stub, pushed
-u) precedes spec authoring; the worktree-cut instruction stops implying the spec
exists on origin/main. The wiki then describes the sequence the files actually state.

R2 (AC #2) — the rejected-claim-push remedy is merge-based (fetch + merge origin/main
into the claim branch + re-push), executable under a repo-wide rebase ban, and never
requires a force-push; template and wiki agree word-for-word on the rule (not
necessarily the phrasing).

R3 (AC #3) — the drift-gate mode inventory is identical between SKILL and runbook
template: all four modes (session / worktree / pr / claim --dir), probed for at the
precondition gate, with the four invocations recorded.

R4 (AC #4) — the re-ground step orders ticks before sync (tick the spec's tasks.md,
then `spec-bridge:sync` moves the task), and Done ownership matches spec-bridge
doctrine (sync is the path to Done; the sweep stops hand-setting Done where sync
should).

R5 (AC #5) — the planted CLAUDE.md's enforcement sentence matches what plugins
actually ship (per-plugin hook reality; grounding-wiki's freshness gate runs via
check scripts/CI, not a Stop hook).

Versions per `docs/releasing.md`: sweep SKILL.md `version:` bump; pdlc bootstrap
SKILL.md bump only if `templates/CLAUDE.md` is part of that skill's surface (check
precedent); marketplace `sync-version` next free. Wiki: re-verify + re-pin
`docs/wiki/pdlc-sweep.md` and `docs/wiki/pdlc-plugin.md` (+ lockstep stales); CAPSULES
regen if descriptions change.

## Non-goals

- Re-pin honesty semantics (TASK-58, merged — build on its text, don't re-litigate).
- Changing spec-bridge's sync/gate behavior — the sweep conforms TO spec-bridge
  doctrine, not the reverse.
- Host-side drift-gate implementations (promptworld's gate is theirs).
