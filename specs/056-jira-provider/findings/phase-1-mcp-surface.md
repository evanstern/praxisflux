# Spec 056 Phase 1 — MCP surface findings (live, 2026-09-09)

Knowledge-only phase. No implementation. Run by the sweep orchestrator against a live
Jira site under the operator's sign-off (`docs/design/jira-board-runbook.md`, Lanes 3–4,
2026-09-09), in the ONE operator-named scratch project. Site coordinates and the project
key are deliberately absent: praxisflux is public and auto-publishes a Release on every
merge to `main`, and the host is a real corporate instance. Ask the operator.

**This phase exists to discharge finding F1** — spec 055 builds the `<!-- spec-phases -->`
block render/parse pair on a premise (that the markers survive a Jira description
write→read cycle) that nothing else tests. Verdict below.

## THE CRITICAL TEST — VERDICT: markers SURVIVE, in `markdown` only

Wrote a `<!-- spec-phases -->` block with three checkboxes (mixed `[ ]`/`[x]`) plus
trailing text to a scratch issue's description, then read it back.

**`contentFormat: "markdown"` — PASS. This is the format spec 055's mechanism requires.**
Round-tripped, then written a second time with a different tick pattern and re-read:

- `<!-- spec-phases BEGIN -->` and `<!-- spec-phases END -->` both survive verbatim, as
  literal HTML comment text.
- Checkbox syntax survives as `- [ ]` / `- [x]`; the checked/unchecked distinction is
  preserved exactly.
- The `Spec: specs/056-jira-provider` marker line survives.
- Text after the END marker is not swallowed.
- **The write→read→write cycle is idempotent, not degrading.** A second write with `#1`
  flipped `[ ]`→`[x]` persisted correctly, and the normalization was byte-identical to the
  first cycle's. This matters more than the first read: the bridge rewrites this block
  repeatedly, so a normalization that compounded per cycle would rot the block over time.
  It converges.

**Two normalizations the parser MUST tolerate** (present in every read, both formats):

1. A blank line is inserted immediately after `<!-- spec-phases BEGIN -->`. A parser that
   requires the first checkbox on the very next line will fail on every real read.
2. Trailing whitespace (two spaces) is appended to the LAST checkbox line. Item text must
   be right-trimmed before comparison, or the last phase's text never matches its source.

Neither is fatal; both are silent. 055's fixture round-trip would not have produced either,
which is precisely the gap F1 named.

**`contentFormat: "html"` — the markers survive only as ESCAPED TEXT, and the END marker is
STRUCTURALLY CAPTURED. Do not use it for this block.** Reading the same description as
html returns:

- The comments as escaped entities — `&lt;!-- spec-phases BEGIN --&gt;` in a `<p>` — i.e.
  text, NOT an HTML comment node. Anything grepping for `<!--` finds nothing.
- The checkboxes converted into a native ADF task list:
  `<ul data-type="task-list"><li data-type="task-item"><input type="checkbox" checked>`,
  each carrying a server-assigned `data-local-id` UUID.
- **`<!-- spec-phases END -->` swallowed INSIDE the final `<li>`**, on a newline after that
  item's text — so the end delimiter is no longer a sibling of the block, and a naive
  "text between BEGIN and END" slice captures a partial last item.

The write path in this phase used markdown, so the ADF task-list conversion is Jira's own
storage representation surfacing through the html read — not something the write introduced.
The consequence for spec 055 is the same either way: **the block contract is
markdown-only**. Record it in the verb table as such.

## Transition semantics — confirmed, and ONE REAL FINDING

`listJiraIssueTransitions` (this MCP's name for the "get transitions" call; the spec's
`getTransitionsForJiraIssue` does not exist on this surface — use the real name) returns
entries shaped `{id, name, to: {name, statusCategory}, hasScreen, isAvailable}`.

- Confirmed: a transition is identified by **`id`**, and `id` is NOT the target status.
  A status move is therefore two calls — list, then transition — exactly as the spec
  predicted. (This MCP's `transitionJiraIssue` also accepts `transitionName`, but the
  wrapper's own docs warn the transition name and the target status name often differ, so
  resolving through the listed `id` stays the correct approach.)
- Confirmed: available transitions depend on the issue's current status and its workflow.

**FINDING — the host workflow is NOT the three-status vocabulary `statusMap` assumes.**
From `Open`, this project offers nine transitions to statuses including `Waiting for Info`,
`On Hold`, `Requirements clarification`, `Ready for Dev`, `Functional Design`,
`Technical Design`, `Deployed to UAT`, and `Closed`. Several distinct statuses share one
`statusCategory` — four map to category `new`, three to `indeterminate`. So a `statusMap`
keyed on `statusCategory` is **many-to-one and non-injective**, which is exactly the
condition spec 056 Phase 2 says must raise an error rather than silently pick a winner.
Phase 2 should map on **status name**, not category, and the non-injective check must run
against the real workflow's names. This is a live-site fact 055's fixtures could not show.

**Not tested: the resolution quirk.** Spec 056 lists "a set `resolution` can block a
backwards transition" as a Phase 1 item. Verifying it requires transitioning the scratch
issue to a resolved state and back. The operator's sign-off authorized a description
round-trip, not workflow writes on a real corporate project, so the transition test was
declined by the permission boundary and NOT performed. It remains **unverified** and is
owed before Phase 3 (the write path) relies on backwards transitions. Do not record it as
confirmed.

## JQL pagination — confirmed

`searchJiraIssuesUsingJql` returns `{issues, nextPageToken, isLast}`. With `maxResults: 3`
the response came back `isLast: false` plus an opaque `nextPageToken` — token-based
cursoring, not `startAt` offsets. **Page until `isLast` is true**; a sync that stops at the
first page silently drops links, and a dropped link is a card the gate stops checking.
Requesting `fields: ["summary","status","labels"]` returned exactly those, so the
field-scoping the spec wants works and `*all` is unnecessary.

## Tool-name corrections for the implementer

The spec's Phase 1 tool list was written from memory and two names are wrong on this
surface. Real names, verified by call:

- `listJiraIssueTransitions` — NOT `getTransitionsForJiraIssue`.
- `listJiraProjectIssueTypesMetadata` — NOT `getJiraProjectIssueTypesMetadata`.
- Confirmed present and callable as named: `getAccessibleAtlassianResources`,
  `atlassianUserInfo`, `getVisibleJiraProjects`, `searchJiraIssuesUsingJql`,
  `getJiraIssue`, `createJiraIssue`, `editJiraIssue`, `transitionJiraIssue`.
- `getJiraIssue` and `editJiraIssue` both take `responseContentFormat`, and the response
  echoes `appliedContentFormat` — read that field rather than assuming the format you
  asked for is the one you got.
- `createJiraIssue` takes `projectKey` + `issueType` (by name) and returns `{id, key}`.

## Consequence for spec 055 (TASK-112)

**No amendment required.** The premise holds: markers and checkbox syntax survive, and the
cycle is idempotent. TASK-112 is clear to claim. Two obligations ride along:

1. The block parser must tolerate the blank-line-after-BEGIN and trailing-whitespace
   normalizations (test both against these observed shapes, not just clean fixtures).
2. The block contract is **markdown-only** — state it in `docs/board-verbs.md`, because an
   html read silently returns escaped text and a structurally captured END marker.

## Scratch issue disposal

One scratch issue was created, as authorized. It is titled `[SCRATCH — praxisflux spec 056
Phase 1] marker survival test, safe to delete` and left `Open` in the operator's project;
the orchestrator has no delete authorization. **Owed: the operator deletes or closes it.**
