# Spec 056 — operator rulings for Phases 2–4 (2026-09-10)

The three checkpoints `docs/design/lane-4-handoff.md` left owed, asked and answered in one
batch before the first mutation. This file is the durable record; the chat turn is not.

Site coordinates stay OUT of this file per finding F7 (praxisflux is public and
auto-publishes a Release on every merge to `main`). The project is the operator's
sanctioned one; its key, `cloudId`, and `accountId` live in untracked local config. Ask the
operator.

## Ruling 1 — write scope: WRITES AUTHORIZED, own scratch issues only

The handoff's reading is confirmed. This session may **create issues, edit descriptions, and
execute transitions (including a backwards move)** — but **only on issues it created itself**,
titled `[SCRATCH — praxisflux spec 056] …`. No pre-existing issue is touched. The
orchestrator has **no delete authorization**; closing the scratch issues is owed to the
operator at the end.

The mutually-exclusive "read-only, defer all writes" selection in the earlier recorded answer
is **superseded** by this explicit confirmation.

## Ruling 2 — `statusMap` shape: keep it bridge→site; ADD `statusReadMap`

**This is a stated amendment to spec 054.** Spec 054 R1 declares `statusMap` as
bridge-vocabulary → site-workflow-name. The bridge vocabulary has exactly three members
(`bridge.mjs`'s `RANK`: `to do` / `in progress` / `done`); the live workflow has **fifteen**
statuses. One field cannot carry both directions: the write direction must be injective (one
canonical target per bridge status) while the read direction is inherently many-to-one.

Resolution, ratified by the operator:

- **`statusMap`** — unchanged in meaning and type. Three entries, injective, naming the
  canonical **write** target per bridge status. Spec 056 Phase 2's non-injective check
  guards **this** field, as written.
- **`statusReadMap`** — NEW, optional, additive. Site status name → bridge status, many-to-one
  by design and therefore explicitly **exempt** from the injectivity check. Absent ⇒ read
  falls back to inverting `statusMap`, preserving today's behavior for any host that has one.

Rejected alternatives and why:
- *`statusMap` values become arrays* — changes 054's declared value type AND forces an edit to
  `renderJira`, which already shipped merged in spec 055. Wider blast radius across landed work.
- *Three entries, everything else falls through* — 12 of 15 statuses would yield verdict
  `unknown`, silently skipping those cards. That is exactly the enforcement hole this feature
  exists to close.

## Ruling 3 — `statusMap` / `statusReadMap` CONTENT: ratified as proposed

Derived from the live workflow (not copied from the handoff's preview, which predated six of
these statuses), then ratified by the operator as a policy call about the team's workflow
semantics:

| Bridge status | Site statuses that read back to it |
|---|---|
| `To Do` | Open · Waiting for Info · Requirements clarification · On Hold · Transferred to Support |
| `In Progress` | Ready for Dev · Functional Design · Technical Design · In Dev · Code Review · In Testing · Ready for UAT |
| `Done` | Deployed to UAT · Closed · Archived |

Canonical **write** targets: `To Do → Open`, `In Progress → In Dev`, `Done → Closed`.

Two rulings the operator was explicitly offered and declined, so they are settled, not open:
- `Ready for UAT` stays **In Progress** (not Done).
- `Ready for Dev` stays **In Progress** (not To Do) — this is the handoff preview's own
  ruling, re-confirmed against six live cards sitting in that status.

## Live findings this derivation produced (beyond Phase 1's)

1. **`In Dev` is the real working status and the handoff's preview did not contain it.**
   Seven live issues sit in it. It is the canonical `In Progress` write target. A map built
   from the preview verbatim would have left active work unreadable — which is precisely why
   the operator's ruling was "derive from the live workflow, then present".
2. **Six statuses existed beyond the preview:** In Dev, Code Review, In Testing,
   Ready for UAT, Transferred to Support, Archived.
3. **Transition NAMES are not unique on this workflow.** On one issue, transition ids `221`
   and `241` are BOTH named `Ready for Dev` and both target status `Ready for Dev`; on
   another, id `331` is named `Closed (2)` while targeting status `Closed`. So a transition
   cannot be resolved by name here — **Phase 3 must resolve through the listed transition
   `id`**, matching on `to.name`, never on the transition's own `name`. Phase 1 reached the
   same conclusion from the wrapper's docs; this is independent live confirmation with a
   sharper reason.
4. **Status vocabulary was read by paging to `isLast: true`** (121 issues, two pages) — the
   token-based pagination Phase 1 recorded. A single-page read would have missed
   `Deployed to UAT`, which appeared only on the final page.

## Discharged: the Phase 1 scratch issue

Phase 1 left "the operator deletes or closes the scratch issue" owed. It is **`Closed`** as
of this session's read. Nothing further owed on it.
