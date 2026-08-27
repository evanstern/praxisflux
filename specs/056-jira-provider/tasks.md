# 056 — tasks

Phases are the dispatch unit: one fresh implementer per phase, re-grounded from this spec
dir plus the branch's commits. Nothing rides chat context between phases.

**Precondition:** specs 052, 054, 055 merged. Mirror + config + verb table + `renderJira`
all exist.

## Phase 1 — Verify the MCP surface (output is knowledge, not code)

- [ ] Read the actual tool signatures for each of: `getAccessibleAtlassianResources`,
      `getVisibleJiraProjects`, `getJiraProjectIssueTypesMetadata`,
      `searchJiraIssuesUsingJql`, `getJiraIssue`, `createJiraIssue`, `editJiraIssue`,
      `transitionJiraIssue`, `addCommentToJiraIssue`, `atlassianUserInfo`,
      `lookupJiraAccountId`, `getTransitionsForJiraIssue`. Record required params per tool
- [ ] **THE CRITICAL TEST — do this first:** write a `<!-- spec-phases -->` block with
      checkboxes to a scratch issue's description, read it back, and confirm the HTML comment
      markers **and** the checkbox syntax survive. Test both `contentFormat: "markdown"` and
      `"adf"`; record which preserves them
- [ ] **If the markers do NOT survive: STOP and surface it.** A delimiter change is an
      amendment to spec 055, not a local workaround. Do not invent a substitute silently
- [ ] Confirm the transition two-step: `transitionJiraIssue` takes a transition **id**, not a
      status name, and available transitions depend on current status + workflow. Record the
      `getTransitionsForJiraIssue` → `transitionJiraIssue` sequence
- [ ] Confirm the resolution quirk: a set `resolution` can block a reopen/backwards
      transition, and clearing it via `editJiraIssue` is the fix. The bridge **does** move
      statuses backwards, so record how to handle it
- [ ] Confirm `searchJiraIssuesUsingJql` pagination (`maxResults` cap, `nextPageToken`) and
      which `fields` are needed (`summary`, `status`, `description`, `labels` — not `*all`)
- [ ] Record every finding in Notes; commit (findings only, no implementation)

## Phase 2 — Read path: provider, JQL, extraction, mirror

- [ ] Register `providers.jira = { requiresSync: true, project: null }` in
      `lib/board-mirror.mjs` — and change nothing else there
- [ ] Assert `lib/` stays MCP-free and network-free: `grep -rn "mcp__\|fetch(" lib/` returns
      nothing (AC #1)
- [ ] Create `spec-bridge/skills/board-sync/SKILL.md` in the gate → work → gate pattern;
      record in its header **why it lives in spec-bridge, not pdlc** (it maintains the
      artifact the bridge gate reads)
- [ ] Precondition gate: `.board.json` with a `requiresSync: true` provider (else STOP —
      a backlog host recomputes and needs no skill); config valid; MCP reachable, and a
      missing MCP server **stops with a stated reason**, never a partial sync
- [ ] Implement the JQL query scoped to `projectKey` + open statuses, requesting only the
      needed fields, and **page to completion** via `nextPageToken`
- [ ] Verify the link count matches the JQL total — a truncated sync silently drops links,
      and a dropped link is a card the gate stops checking (a silent enforcement hole)
- [ ] Extract per issue: key → `id`; status reverse-mapped through `statusMap` → the bridge
      vocabulary; the `Spec: <dir>` marker; the `<!-- spec-phases -->` block → `acs` via
      055's parser; labels → `labels`
- [ ] Build the inverse `statusMap` at load and **error on a non-injective map**, naming the
      colliding pair — a silent "first wins" makes verdicts depend on key order. If this
      belongs in 054's validator, record it as an amendment rather than doing it quietly
- [ ] **Skip unlinked issues** (no `Spec:` marker) and report the count (AC #4)
- [ ] Write the mirror with `observedAt` + `observedSha` (`git rev-parse HEAD`) on every link
- [ ] **Commit the mirror** — an uncommitted mirror is invisible to CI, where enforcement
      lives. Under the sweep's no-main-push mode, follow the mode's existing degradation
      (rides the next claimed branch); do not invent a second rule
- [ ] Output gate: `board-mirror --check` exits 0; `spec-bridge/gates/cli.mjs check` exits 0
      **or** its findings are reported verbatim — a sync that reveals a dishonest status has
      done its job and must **not** "fix" the board to make the gate pass
- [ ] Tests for ACs 3, 4, 5 (both mapping directions, unmapped falls through)
- [ ] Commit

## Phase 3 — Write path: execute the renderer's calls

- [ ] Extend `spec-bridge:sync` to execute `renderJira`'s `{ tool, args, why }` list when the
      provider is `jira`, **in the returned order** (later calls assume earlier ones landed —
      same discipline as the Backlog path)
- [ ] Use the phase-1 transition sequence for status moves; handle the resolution-blocks-reopen
      case for backwards moves
- [ ] Re-sync the mirror after execution, so it reflects post-edit Jira rather than the state
      that motivated the edits
- [ ] Assert the one-way contract: `git status` shows **no** modification under any spec dir
      (AC #6)
- [ ] Test a backwards status move end-to-end (regenerated `tasks.md` → honest backwards move)
- [ ] Commit

## Phase 4 — Spike, assignees, sweep proof, re-ground

- [ ] Implement `board:create` as exactly **one** MCP call using config coordinates, with
      **zero** discovery calls; a missing coordinate is a config error naming the field
- [ ] Confirm spiking does **not** trigger a sync (a spiked card has no `Spec:` marker and is
      not mirror content) — slow spiking is the thing this requirement exists to prevent
- [ ] Resolve `defaultAssignee: "self"` via `atlassianUserInfo` **once per session**; an
      explicit id skips resolution
- [ ] `board:claim` sets assignee **and** status; document that a display name is **not** an
      account id and must go through `lookupJiraAccountId`
- [ ] Document the spike path in `docs/board-verbs.md`'s `board:create` row
- [ ] **R6 proof — all four, evidenced not reasoned.** Against a live site, or recorded
      fixtures with the substitution **stated in Notes**:
      (1) claim transitions + assigns and the `Spec:` marker survives;
      (2) a `paused`-labelled issue projects into `labels` and is excluded from lane conflict
      analysis;
      (3) **a card set Done in the Jira UI over unchecked `tasks.md` boxes produces a
      blocking gate finding after sync** — its own test;
      (4) a UI move with no sync produces the staleness finding, not a false pass
- [ ] State R7's trust boundary **verbatim** in both `docs/board-verbs.md` and the
      `pdlc:peer:jira` block: the mirror is a receipt at `observedSha`; a claim is only as
      good as the last sync; the gate can prove staleness, not honesty
- [ ] Set the new skill's `version:`; bump the marketplace version; run
      `node scripts/sync-version.mjs` and `node scripts/check-version-bump.mjs`
- [ ] Update `README.md` / `CLAUDE.md` where they describe the board
- [ ] Re-pin `docs/wiki/`: `spec-bridge-plugin`, `pdlc-grounding-block`, plus any note listing
      a touched file; classify each **RE-PIN-ONLY** or **NEEDS-REVIEW**
- [ ] All four project gates green: `node --test`, `check-docs.mjs`,
      `sync-version.mjs --check`, freshness
- [ ] Commit

## Notes

(Implementers append findings here — the phase-to-phase handoff artifact. Phase 1's findings
are load-bearing for every later phase: record them fully.)
