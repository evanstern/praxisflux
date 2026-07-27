# 020-freshness-gate-holes — silent passes and a false block in the wiki gates

Board: TASK-59 · Direction: downstream bug-find sweep from promptworld (2026-07-27)
against praxis decaa14 (v0.27.0); carded 6c053c2; executed under
`docs/design/downstream-bugfix-runbook.md` (Lane B). All three defects reproduced live.

## The failures

1. **Missing sources pass silently.** `grounding-wiki/gates/freshness.mjs:72-87` feeds
   every `sources:` path to `git log` with no existence check. A typo or a path left
   behind by a rename yields empty log output — the note reports FRESH forever
   (fixture: a `sources` list containing `no-such-file.txt` → `OK: 2 note(s) fresh`,
   exit 0, zero warnings). The gate's whole point — status can't exceed proof — is
   inverted: proof can silently stop existing.
2. **Inline-array `sources:` are invisible.** `parseSourcesBlock`
   (`freshness.mjs:22-35`) handles only YAML block lists; `sources: [a, b]` — a shape
   `lib/markdown.mjs:35-36 parseFrontmatter` accepts elsewhere — is ignored, so a
   genuinely stale note exits 0 with only a non-blocking `warn: no sources listed`.
3. **CAPSULES corpusDir false-block.** `gates/capsules.mjs:89` embeds the invoking
   `corpusDir` string verbatim in the generated header and `:141-148` byte-compares
   against a re-render with the *checker's* corpusDir — regenerate with an absolute
   path or trailing slash, then gate with default `docs/wiki`, and a fresh CAPSULES.md
   false-blocks as "hand-edited".

## Requirements (map 1:1 to board ACs)

R1 (AC #1) — a note listing a source path absent from the working tree is a
**blocking finding** naming the note and the missing path (blocking preferred over a
loud warning: a phantom source is indistinguishable from vanished proof). Paths that
existed historically but were renamed/deleted must fail the same way until the note's
sources are corrected.

R2 (AC #2) — inline-array `sources: [a, b]` frontmatter is parsed and
staleness-checked identically to block lists (reuse/align with
`lib/markdown.mjs` `parseFrontmatter` semantics rather than growing a second parser
dialect).

R3 (AC #3) — CAPSULES regenerate-and-compare is corpusDir-spelling-invariant:
regenerating with an absolute path or trailing slash produces byte-identical output to
the default relative spelling (normalize before embedding, and/or compare on the
normalized form). Existing corpora with the old header must not false-block after the
fix.

R4 (AC #4) — regression tests cover all three shapes: missing source path, inline
array sources, corpusDir spelling variants (absolute, trailing slash).

Versions per `docs/releasing.md`: gate behavior change → grounding-wiki skill
`version:` bumps as applicable + marketplace `sync-version` to the next free. Wiki:
re-verify + re-pin `docs/wiki/grounding-wiki-plugin.md` (+ lockstep stales); CAPSULES
regen if descriptions change.

## Non-goals

- Sweep-doctrine honesty about *when* to re-pin (TASK-58 / spec 019, Lane A).
- Any change to the corpus spec (`docs/corpus-spec.md`) — this is gate conformance to
  the existing contract, not a contract change.
