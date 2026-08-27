# 056 — implementation plan

## Constitution check

**No ratified constitution** (`.specify/` absent; hand-authored under the sweep's escape
line). Checked against:

| Grounding doc | What it binds here |
|---|---|
| `docs/design/board-provider-seam.md` | invariant 3 (mirror is a receipt) and 4 (**gate never networks**) |
| `docs/skill-patterns.md` | gate → work → gate skill shape; `gates/` read-only, `scripts/` operational |
| `docs/wiki/gates-convention.md` | fail closed — a missing MCP server stops, never partially syncs |
| `docs/handoff-protocol.md` | plugins compose through files + gates, never calls — the mirror **is** the seam |
| `docs/principles.md` P1 | the committed mirror is the artifact; an uncommitted one is invisible to CI |
| `docs/releasing.md` | new skill ⇒ its own `version:` **plus** the marketplace bump |

**Tension, named and resolved:** where does `board:sync` live? `pdlc` owns *lifecycle verbs*
(bootstrap, sweep, triage); `spec-bridge` owns *the artifact the gate reads*. The mirror is
squarely the latter — the bridge gate consumes it, and `spec-bridge:sync` already owns the
board-writing direction. Put it in `spec-bridge/skills/board-sync/`. Record the rationale in
the skill header: a future reader will wonder why a "board" skill is not in `pdlc`.

## Approach

### Start by reading the actual MCP tool signatures, not from memory

The Atlassian tool set in this environment is specific and its required parameters are not
guessable. Before writing a line of skill prose, confirm the exact shape of each tool this
spec names:

`getAccessibleAtlassianResources` · `getVisibleJiraProjects` ·
`getJiraProjectIssueTypesMetadata` · `searchJiraIssuesUsingJql` · `getJiraIssue` ·
`createJiraIssue` · `editJiraIssue` · `transitionJiraIssue` · `addCommentToJiraIssue` ·
`atlassianUserInfo` · `lookupJiraAccountId` · `getTransitionsForJiraIssue`

Two field notes worth checking first-hand, because both are classic Jira integration failures
and both change the skill's steps:

1. **Transitions are not status assignments.** `transitionJiraIssue` takes a *transition id*,
   not a status name, and the available transitions depend on the issue's current status and
   the project workflow. So a status move is two calls: `getTransitionsForJiraIssue` then
   `transitionJiraIssue`. Confirm this and write it into the skill — a plan that assumes
   "set status = Done" will fail on the first non-trivial workflow.
2. **A resolution can block a reopen.** `editJiraIssue`'s docs note that clearing
   `resolution` is the fix when a reopened issue cannot transition. The bridge moves statuses
   *backwards* (honest backwards moves after a regenerated `tasks.md` are an explicit
   spec-bridge behavior), so this **will** be hit. Handle it, don't discover it.

### Content format: pick one and state it

Several tools accept `contentFormat: "markdown" | "adf"`. The `<!-- spec-phases -->` block is
markdown with HTML comment markers. Verify that a markdown round-trip through Jira preserves
both the comment markers and the checkbox syntax — if ADF normalizes HTML comments away, the
marker mechanism breaks and R2's block needs a different delimiter.

**Test this before building on it.** It is the single riskiest assumption in the spec: 055's
whole AC mechanism rests on those markers surviving a write→read cycle. Record the finding in
the notes either way; if markers do not survive, stop and surface it — a delimiter change is a
055 amendment, not a silent local workaround.

### Reverse-mapping status needs care

`statusMap` maps bridge → site. Reading requires the inverse, which is only well-defined if
the map is injective. Two site statuses mapping to one bridge status makes the inverse
ambiguous.

Handle it explicitly: build the inverse at load time and **error on a non-injective map**,
naming the colliding pair. A silent "first one wins" would make the gate's verdicts depend on
object key order. Consider whether this belongs in 054's `validateBoardConfig` — if so, it is
a small amendment to that spec, recorded as such rather than done quietly here.

### JQL scoping and pagination

`searchJiraIssuesUsingJql` caps `maxResults` at 100 and pages via `nextPageToken`. A real
project exceeds one page. Page to completion — a truncated sync silently drops links from the
mirror, and a dropped link is a card the gate stops checking. That is a **silent enforcement
hole**, the same class of bug this feature exists to close, so it gets an explicit step and a
verification.

Scope the JQL to the project and to non-archived work, and request only the fields needed
(`summary`, `status`, `description`, `labels`) rather than `*all` — the description carries
the marker and the block, and pulling every custom field on every sync is pure cost.

### Commit the mirror, and say why in the skill

The mirror must be **committed**, not merely written. CI is where enforcement lives, and CI
sees committed files. An operator who syncs and forgets to commit has a green local gate and
an unenforced PR. Make committing a step in the work section and a clause in the output gate.

Under the sweep's background-job / no-main-push mode, the mirror commit follows the same
degradation the sweep already documents for board commits — rides the next claimed task's
branch. Reference that mode rather than inventing a second rule.

### R6's proof, and what to do without a live site

The four points are the feature's actual acceptance. If no live Jira site is available at
implementation time, record fixtures captured from real tool responses and state the
substitution plainly in the notes (AC #9 permits this and requires the statement). What is
**not** acceptable is asserting the four points from reasoning — point 3 (Done over unchecked
boxes ⇒ blocking) is precisely the failure mode the whole epic exists to prevent, and
"it should work" is not evidence (P1).

## Phasing rationale

Four phases:

1. **Verify the MCP surface** — tool signatures, the transition two-step, the resolution
   quirk, and the **marker-survival test**. Produces findings, not code. It is a real phase
   because everything downstream is invalid if the markers do not survive.
2. **Read path** — `providers.jira`, JQL + pagination, extraction, mirror write + commit.
3. **Write path** — execute `renderJira`'s calls in order, re-sync, one-way assertion.
4. **Spike + assignees + sweep proof + re-ground.**

Phase 1 is deliberately non-productive: its output is knowledge recorded in the notes. Skipping
it means discovering the transition two-step halfway through phase 2.

## Risks

| Risk | Mitigation |
|---|---|
| HTML comment markers do not survive a Jira write→read | **Phase 1 tests this first.** If they don't, STOP and surface it — a delimiter change amends 055, it is not a local workaround. |
| Status set as a name instead of a transition id | Phase 1 confirms the two-step; the skill documents `getTransitionsForJiraIssue` → `transitionJiraIssue`. |
| Backwards status move blocked by a set resolution | Known from the tool docs; handle by clearing `resolution`; test a backwards move. |
| JQL pagination truncates the mirror | Explicit paging step + a verification that link count matches the JQL total. A dropped link is a silent enforcement hole. |
| Non-injective `statusMap` makes reads ambiguous | Build the inverse at load; **error** naming the colliding pair; consider amending 054's validator (record if so). |
| Mirror written but not committed | Commit is a work step **and** an output-gate clause. |
| No live site for R6 | Recorded fixtures with the substitution **stated**; never assert the four points from reasoning. |
| Released surface | New skill `version:` + marketplace bump; `check-version-bump.mjs` locally. |

## Verification

- `node --test` green, including the status round-trip, pagination, and point-3 blocking test.
- `grep -rn "mcp__\|fetch(" lib/` returns nothing (AC #1).
- `node lib/board-mirror.mjs --check --root <root>` exits 0 after a sync.
- `node spec-bridge/gates/cli.mjs check <root>` exits 0, or its findings are reported verbatim.
- `git status` clean under every spec dir after a reverse sync.
- `node scripts/check-docs.mjs`, `sync-version.mjs --check`, `check-version-bump.mjs` green.
- Freshness green by Done.
