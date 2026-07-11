---
name: wiki-update
version: 0.1.1
description: Refresh a code-grounded corpus (docs/wiki) in place after code changes — plan the reconciliation (computed re-pins vs review work), re-verify what needs judgment against the actual diff, and re-pin. Use when the user asks to update/refresh/sync the wiki, when the freshness gate fails, or before merging changes that touch files listed in any note's sources.
---

# wiki-update — refresh a grounding wiki against the current code

The in-place update loop for a corpus built by `wiki-build` (format:
`docs/corpus-spec.md`). Notes pin the commit they were last verified against
(`verified_against:`) and the paths that invalidate them (`sources:`); this skill closes
the gap between those pins and HEAD.

## Precondition gate — the plan command is the backbone

Run `node ${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs plan <repo-root> docs/wiki`.

- Prints **nothing** → the corpus is fresh; report that and stop (unless the user asked
  for a content review anyway).
- `# problem:` lines (missing/unknown pins, not a corpus) → fix those first — a broken pin
  is a gate failure, not a planning input. "not a corpus" → STOP and offer `wiki-build`.
- Otherwise the output IS the work split, computed rather than reasoned:
  - **`# RE-PIN-ONLY <note>`** followed by a runnable `node …/scripts/repin.mjs …` line —
    the diff since the pin is provably safe (version stamps only, and the note quotes no
    version literals). The bookkeeping is done for you.
  - **`# NEEDS-REVIEW <note>`** with the pin, commit count, reason, and a per-file `+/-`
    summary — these are the notes that need actual judgment.

## Work

1. **Execute the RE-PIN-ONLY lines verbatim, in order.** Each `repin.mjs` command updates
   one note's pin and refuses malformed input; don't re-derive or "improve" them.
2. **For each NEEDS-REVIEW note:**
   1. Read the note; run `git diff <pin>..HEAD -- <sources>` and READ it.
   2. Update the body so every claim matches current source: symbols, defaults, env vars,
      behavior, verbatim snippets, quoted version numbers. Keep the neutral tone; paths +
      symbols, never line numbers. Update `sources:` if code moved or split.
   3. Re-pin: `node ${CLAUDE_PLUGIN_ROOT}/scripts/repin.mjs <note-path> $(git rev-parse HEAD)`.

Structural drift:
- **New subsystem** no note covers → write a new note (`templates/note.md`), link it with
  `[[name]]` from related notes, add its INDEX.md line.
- **Deleted subsystem** → remove its note + INDEX line; mention the removal in notes that
  linked to it.

Hard rule: **never bump a pin without reading the diff — except through plan's RE-PIN-ONLY
lines, whose whole point is that the planner proved the diff couldn't invalidate prose.**
The pin is a claim that the content was verified at that commit; a dishonest pin is worse
than a stale note. The planner is deliberately conservative (anything not provably safe is
NEEDS-REVIEW), and the code — not the old note text — is ground truth: verify claims you
keep, not just the ones the diff obviously touched.

## Output gate

1. Re-run `plan` — must print nothing for the notes you touched (idempotent; leftovers mean
   a step failed).
2. Re-run the freshness gate (`cli.mjs freshness <repo-root> docs/wiki`) — must exit 0.
   Spot-check that every `[[link]]` you added resolves (the gate warns on broken links).

## Handing off

Suggest committing the wiki refresh together with (or immediately after) the code change
that staled it: `wiki: re-verify <notes> against <short-hash>`. For unattended enforcement,
the same gate command works as a Claude Code Stop/pre-commit hook or a GitHub Actions
pre-merge check — offer to wire it, don't assume.
