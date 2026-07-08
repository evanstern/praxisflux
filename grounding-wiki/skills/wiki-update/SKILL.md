---
name: wiki-update
description: Refresh a code-grounded corpus (docs/wiki) in place after code changes — find stale notes via the freshness gate, re-verify each against the actual diff, and re-pin. Use when the user asks to update/refresh/sync the wiki, when the freshness gate fails, or before merging changes that touch files listed in any note's sources.
---

# wiki-update — refresh a grounding wiki against the current code

The in-place update loop for a corpus built by `wiki-build` (format:
`docs/corpus-spec.md`). Notes pin the commit they were last verified against
(`verified_against:`) and the paths that invalidate them (`sources:`); this skill closes
the gap between those pins and HEAD.

## Precondition gate

Run `node ${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs freshness <repo-root> docs/wiki`.
- Exit 0 → report "wiki fresh" and stop (unless the user asked for a content review anyway).
- "not a corpus" → STOP: nothing to update — offer `wiki-build`.
- Otherwise the failure list is your work queue.

## Work

For each stale note, in any order:

1. Read the note; note its pin `P` and `sources:` list.
2. Run `git diff P..HEAD -- <sources>` and READ it. Comment-only diffs may need no prose
   change — still re-pin (step 4).
3. Update the body so every claim matches current source: symbols, defaults, env vars,
   behavior, verbatim snippets. Keep the neutral tone; paths + symbols, never line numbers.
   Update `sources:` if code moved or split.
4. Set `verified_against:` to `git rev-parse HEAD`.

Structural drift:
- **New subsystem** no note covers → write a new note (`templates/note.md`), link it with
  `[[name]]` from related notes, add its INDEX.md line.
- **Deleted subsystem** → remove its note + INDEX line; mention the removal in notes that
  linked to it.

Hard rule: **never bump a pin without reading the diff.** The pin is a claim that the
content was verified at that commit; a dishonest pin is worse than a stale note. And the
code — not the old note text — is ground truth: verify claims you keep, not just the ones
the diff obviously touched.

## Output gate

Re-run the freshness gate — must exit 0. Spot-check that every `[[link]]` you added
resolves (the gate warns on broken links).

## Handing off

Suggest committing the wiki refresh together with (or immediately after) the code change
that staled it: `wiki: re-verify <notes> against <short-hash>`. For unattended enforcement,
the same gate command works as a Claude Code Stop/pre-commit hook or a GitHub Actions
pre-merge check — offer to wire it, don't assume.
