# 053 — implementation plan

## Constitution check

**This project has no ratified constitution.** `.specify/` is absent; artifacts are
hand-authored under the sweep runbook's operator-signed escape line. Checked instead against:

| Grounding doc | What it binds here |
|---|---|
| `docs/design/board-provider-seam.md` | invariant 1 (Backlog unchanged), 3 (mirror is a receipt), 4 (gate never networks) |
| `docs/wiki/gates-convention.md` | **fail closed** — "cannot see the board" must never render as "board is fine" (R3, R4) |
| `docs/wiki/spec-bridge-plugin.md` | the one-way derivation contract this spec must preserve |
| `docs/wiki/project-root.md` | `findRootsDownwards` / `hasChild` semantics that R2 extends |
| `docs/skill-patterns.md` §5 | `gates/` stays **read-only** — this spec adds no writes |
| `docs/releasing.md` | `spec-bridge/` and `lib/` are released surface ⇒ bump required |

**Tension to resolve, and it is real.** R5 exposes that `planLinkedTask` currently
*renders* `backlog task edit …` strings — the planner conflates *deciding* the
reconciliation with *expressing* it in one provider's CLI. The honest fix is to separate
those two responsibilities. Do the separation **here**, minimally (intents + a `backlog`
renderer that reproduces today's bytes), and let spec 055 add the second renderer. Do not
defer it: a planner that emits `backlog` commands to a Jira host is a wrong-answer bug, not
a missing feature.

## Approach

### Swap the input; touch nothing else

The whole spec is one function plus its three call sites. Resist scope creep here — the
verdict logic is correct and heavily tested, and its input shape is identical by 052's
construction.

```js
function boardLinks(root) {
  const mirror = readMirror(root);            // throws on malformed — fail closed, correct
  if (mirror) return mirror.links;
  if (existsSync(join(root, "backlog", "tasks"))) return providers.backlog.project(root);
  return [];
}
```

Note the deliberate ordering: mirror **first**. A host that has adopted the mirror is
answered from its receipt, not from a live scan — otherwise a Backlog host's mirror would
never be exercised and `--check`'s drift detection would guard a file nothing reads.

The three replacements are mechanical (`checkBridge:290`, `verifyBridge:~350`,
`planBridge:~470`). After each, re-run `node --test` — the existing suite is the oracle.

### R2: one predicate, two call sites, no duplication

`hasChild` returns a predicate, so combine predicates rather than inlining a lambda twice:

```js
// lib/project-root.mjs
export const hasAnyChild = (...names) => (dir) => names.some((n) => hasChild(n)(dir));
```

Then `bridge.mjs` uses `hasAnyChild(".board", "backlog")` and `gates/cli.mjs` uses the same.
Two call sites with one definition is the point — if the hook and the CLI disagree about what
a project is, a developer gets blocked by one tool and cleared by the other, which is the
worst possible failure for a gate's credibility.

Check whether `findRootUpwards` and `findRootsDownwards` share the predicate type before
writing this; `docs/wiki/project-root.md` documents both.

### R3/R4: the two fail-closed messages are the deliverable

These two messages *are* the feature from the operator's perspective — they are what turns a
silent hole into a loud one. Write them first, test them by **content** (AC #7 says so
explicitly), and make each name the exact remedial action. A finding that says "stale" without
saying "run board:sync" costs the reader a lookup every time.

The asymmetry in R3 deserves a comment in the code, not just in the spec: a Backlog mirror
being stale is *recoverable in-process* (recompute), a Jira mirror being stale is *not*
(needs a model). Same word, different consequence — a future reader will otherwise "fix" the
inconsistency.

### R5: intents, then a renderer

Split `planLinkedTask` in two:

- `planIntents(task, derived, profile)` → the structured intents. This is today's function
  with the `edit(...)` calls replaced by pushes into a typed object. **All the ordering logic
  stays here** — removals highest-index-first, check/uncheck at post-edit indexes. That
  ordering is load-bearing and hard-won (see the existing header comment); it is *reconciliation
  logic*, not rendering, so it belongs on this side of the split.
- `renderBacklog(id, intents)` → today's exact `backlog task edit …` strings.

The proof of a faithful split is AC #9: the planner tests compare command strings and must
pass unedited. If they fail, the split moved logic across the line.

For non-`backlog` providers, return intents plus the notice. Do **not** invent a Jira renderer
here — 055 owns the verb vocabulary, and guessing it now means writing it twice.

### Fixture pair for AC #3

The strongest available evidence that the seam is behavior-preserving is a **differential
test**: build two temp projects with equivalent board state — one as `backlog/tasks/*.md`,
one as `.board/links.json` — point the same spec dirs at both, and assert `problems` and
`warnings` are equal. That test is worth more than any number of single-path assertions,
because it tests the *equivalence* the design claims rather than each path separately.

## Phasing rationale

Three phases:

1. **The seam + root resolution** — `boardLinks`, `hasAnyChild`, both call sites updated.
   Existing suite green is the gate.
2. **Fail-closed findings** — R3 and R4, message-content tested. Separate because these are
   *new behavior* and must not be entangled with phase 1's *unchanged behavior* proof.
3. **Planner split + differential test + re-ground.**

## Risks

| Risk | Mitigation |
|---|---|
| Mirror-first ordering surprises a Backlog host mid-adoption | A Backlog mirror that drifts is caught by 052's `--check` in CI; document the ordering in `boardLinks`' comment. |
| Hook and CLI disagree on root resolution | One `hasAnyChild` definition, both sites; AC #4 asserts all three layouts against **both** resolvers. |
| Planner split moves ordering logic | AC #9 — planner tests compare exact command strings, unedited. |
| `readMirror` throwing breaks a Stop hook | Correct per fail-closed doctrine; verify the gate-runner surfaces the throw as a blocking problem rather than crashing the hook — read `lib/gate-runner.mjs` and confirm before relying on it. |
| Released surface | Bump marketplace version; `sync-version.mjs` stamps the rest. |

## Verification

- `node --test` green, with the three named test files **unedited**.
- `node scripts/check-docs.mjs`, `node scripts/sync-version.mjs --check` green.
- `node spec-bridge/gates/cli.mjs check .` behaves identically to pre-change on this repo.
- `node lib/board-mirror.mjs --check --root .` still green (052's dogfood mirror).
- Freshness gate green by Done.
