# Phase 1 findings — the real board call sites

Method: `grep -n "backlog " */skills/*/SKILL.md` for each of the six skills spec.md names,
then read every hit in context and classify it:

- **operative** — a command the reader is told to run right now. These are what
  `docs/board-verbs.md` must give a resolvable verb.
- **incidental** — a mention, cross-reference, or noun-phrase that happens to contain the
  string `backlog `, but isn't an instruction to run a command. These may legitimately stay
  (AC #2's "on a Backlog host" carve-out, or simply prose that was never a CLI instruction).

## Per-skill results

### `spec-bridge:link` — spec claims 6, raw grep 6, operative 6

| Line | Text | Class | Verb |
|---|---|---|---|
| 24 | `` `backlog --help` must work (Backlog.md CLI installed). If not, STOP `` | operative | *(tooling precondition — not a table verb; see below)* |
| 34 | `` `backlog search "<title>" --plain` `` (dedup before create) | operative | `board:list` (search form) |
| 37 | `` `backlog task create "<title>" -d "...Spec: <specDir>"` `` | operative | `board:create` + `board:link-spec` |
| 40 | `` `backlog task view <id> --plain` `` (update-mode read) | operative | `board:view` |
| 41 | `` `backlog task edit <id> -d "..."` `` (replant marker) | operative | `board:link-spec` |
| 54 | `` `backlog task view <id> --plain` `` (output-gate confirm) | operative | `board:view` |

Matches spec.md's claimed count exactly. **Not caught by the `backlog ` grep** but a real
operative call site: line 44, `` `--ac "Spec phase: Setup"` `` (seeding phase ACs) — the
literal text never contains the word "backlog" on that line, so a naive grep undercounts by
one here. Maps to `board:ac-set`.

Line 24's `backlog --help` isn't a board *action* (it doesn't read or write an item) — it is
a one-time "is the CLI installed" tooling check. It doesn't get a verb row; Phase 4 should
generalize it to a provider-tooling precondition stated once, not per-verb.

### `spec-bridge:sync` — spec claims 2, raw grep 2, operative 2

| Line | Text | Class | Verb |
|---|---|---|---|
| 29 | "prints... the exact `` `backlog task edit` `` commands that reconcile every linked task" | operative | describes the rendered output covering `board:status`, `board:ac-set`, `board:ac-check`, `board:final`, `board:note` collectively |
| 38 | "every line must be `` `backlog task edit <linked-task-id> …` ``" | operative | same set (shape-check rule) |

Matches spec.md's claim. Neither line is a single verb — both describe the *rendered output*
of `planIntents`/`renderBacklog` (spec 053) as a whole, which is exactly what spec 055 R6's
`renderJira` replaces for a Jira host. Phase 4's rewrite should name the rendering step once
("the provider's rendered reconciling actions — see `docs/board-verbs.md`") rather than
naming a single verb.

### `pdlc:sweep` — spec claims 3, raw grep 3, operative 3

| Line | Text | Class | Verb |
|---|---|---|---|
| 71 | `` `backlog task view <id> --plain` `` | operative | `board:view` |
| 357 | `` `backlog task edit TASK-<n> --labels …` `` (set/clear `paused`) | operative | `board:label` |
| 360 | `` `backlog task edit TASK-<n> --append-notes "..."` `` (pause/resume provenance) | operative | `board:note` |

Matches spec.md's claim. **Not caught by the grep**: sweep's "claim" doctrine (lines
155-212) is real and central to the skill — "board card → In Progress" (line 168), first
commit of a task — but is written narratively, never as a literal `-s "In Progress" -a
@claude` flag string. This is the call site behind `board:claim`; Phase 4 should tighten the
prose to name the verb explicitly. No literal `--plan` (task-level, not spec-level) or
`--final-summary` call site exists in this skill.

### `pdlc:refactor-triage` — spec claims 3, raw grep 3, **operative only 1**

| Line | Text | Class | Verb |
|---|---|---|---|
| 38 | "STOP and name what must run first (`pdlc:bootstrap` with the Backlog.md peer, or `` `backlog init` ``)" | incidental | cross-reference to another skill's escape hatch, not an instruction this skill runs |
| 143 | "Each accepted finding becomes a **backlog task** via the `` `backlog` `` CLI" | incidental | "backlog task" is a noun phrase (a task that lives on the Backlog.md board), not a command — the grep matched only this occurrence (the backtick-wrapped `` `backlog` `` right after has no trailing space, so it doesn't independently match) |
| 170 | "the board reflects exactly the accepted set — `` `backlog task list --plain` `` shows each accepted finding's task" | operative | `board:list` (output-gate verification) |

**Discrepancy:** the raw grep count (3) matches spec.md's claim, but only **one** of the
three hits is a genuine operative instruction. The other two are a cross-skill reference and
a noun-phrase that happens to contain the literal string. AC #2's grep-based test ("returns
only occurrences inside the table's `backlog` column, or explicit 'on a Backlog host'
illustrations") will still pass once Phase 4 rewrites line 170 — lines 38 and 143 don't need
to change at all; they were never CLI instructions.

### `pdlc:bootstrap` — spec claims 2, **raw grep 3**, operative 1

| Line | Text | Class | Verb |
|---|---|---|---|
| 70 | "Otherwise run `` `backlog init "<project name>"` `` from `<root>`" | operative | `board:init` (new verb — see below) |
| 90 | "*peers backlog and jira are mutually exclusive...*" (quoted error message) | incidental | "backlog" is a peer name here, not a command |
| 263 | "Report exactly what was created... (e.g. `` `backlog init` `` skipped because `backlog/` existed)" | incidental | illustrative "e.g." referencing line 70's action, not a new instruction |

**Discrepancy, both dimensions:**
1. The raw `backlog ` grep count is **3**, not the 2 spec.md claims.
2. Of those 3, only **1** (line 70) is an actual operative instruction; the other two are an
   incidental quoted-error mention and an illustrative example.

Line 70 is real but is peer **initialization** (one-time board setup), not one of R1's
routine board actions (list/view/create/status/etc.) — its Jira analogue already exists a
few lines later in the same skill (discover `cloudId`/`projectKey`/`issueTypeName` via MCP,
write `.board.json`). Given it has a genuine per-provider resolution, a precondition (peer
opted in), and an evidence artifact (`backlog/` exists, or `.board.json` validates), it earns
its own row: `board:init`. This is the one new verb this enumeration adds beyond spec.md's
sketch table.

### `reorient:reorient` — spec claims 1, raw grep 1, operative 1

| Line | Text | Class | Verb |
|---|---|---|---|
| 104-105 | "scan the board via `` `backlog task list --plain` `` / `` `task view` `` (skip when no board)" | operative | `board:list` + `board:view` |

Matches spec.md's claim.

## Summary — does spec.md's table hold up?

| Skill | Spec claim | Raw grep | Operative | Verdict |
|---|---|---|---|---|
| `spec-bridge:link` | 6 | 6 | 6 | matches |
| `pdlc:sweep` | 3 | 3 | 3 | matches |
| `pdlc:refactor-triage` | 3 | 3 | **1** | raw count matches; operative count does not — 2 of 3 hits are incidental |
| `spec-bridge:sync` | 2 | 2 | 2 | matches |
| `pdlc:bootstrap` | 2 | **3** | **1** | raw count is wrong (3, not 2); operative count is also lower than the raw count (1) |
| `reorient:reorient` | 1 | 1 | 1 | matches |

**Bottom line:** spec.md's counts are literal `grep -c "backlog "` tallies, and five of six
are exactly right as raw tallies. `pdlc:bootstrap` is the one raw-count error (3, not 2).
Separately — and this is the more useful finding for Phase 4 — a "real call site" is not the
same thing as a `backlog ` grep hit in either direction: two skills (`refactor-triage`,
`bootstrap`) have grep hits that are actually incidental prose, while `spec-bridge:link` has
a real operative call site (`--ac "Spec phase: ..."`, line 44) that the naive grep misses
entirely, and `pdlc:sweep`'s claim doctrine is real but written narratively rather than as a
literal flagged command. Phase 4 should rewrite based on the **operative** column above, not
a raw grep count.

## Verb set derived from the above

Real operative call sites (including the two the naive grep misses) group into 13 verbs:
`board:list`, `board:view`, `board:create`, `board:link-spec`, `board:ac-set`,
`board:ac-check`, `board:status`, `board:claim`, `board:final`, `board:note`, `board:label`,
`board:sync-mirror`, `board:init`. Full definitions, preconditions, and evidence in
`docs/board-verbs.md`.

**Dropped from spec.md's sketch table:** `board:plan` (`task edit <id> --plan "<p>"`). No
call site in any of the six skills exercises a task's `--plan` field — it's a
`CLAUDE.md`-level standing convention for how *this repo* runs its own board, not something
any of the six audited skills reads or writes. Per the smallest-verb-set rule (plan.md), it
is dropped; add it back the day a skill actually needs to resolve it.

**Added beyond spec.md's sketch table:** `board:init` (see `pdlc:bootstrap` above) — a real,
already-branching (by peer) call site with a genuine per-provider resolution.
