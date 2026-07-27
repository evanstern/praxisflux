# 022-educate-check-convergence — vault-less --check must converge; template must run as written

Board: TASK-62 · Direction: downstream bug-find sweep from promptworld (2026-07-27)
against praxis decaa14 (v0.27.0); carded 6c053c2; executed under
`docs/design/downstream-bugfix-runbook.md` (Lane D, first — TASK-63 shares
`educate/gates/dod.mjs` + `educate/templates/CLAUDE.md` and waits on this merge).

## The failures

1. **Permanent stale loop (live).** `educate/scripts/wiki.mjs:96` — the named-topic
   `--check` branch calls `isStale` with no vault-count guard, so a topic with no
   research vaults has no WIKI.md and reports `stale (run --sync)`, exit 1; but
   `wiki.mjs:56 syncTopicWiki` returns `skipped` for vault-less topics and never
   writes the file. Reproduced loop: check exit 1 → sync skipped exit 0 → check
   exit 1, forever; the tool's remedy message is a no-op. (`--all --check` masks it by
   pre-filtering to vaulted topics; only the single-topic form is broken.)
2. **DoD array truthiness.** `educate/gates/dod.mjs:28` tests bare truthiness on
   `decksStandardForEveryLesson`, so an empty array `[]` (truthy) still requires
   deck+guide — inconsistent with the array-tolerant `isDelegated` at `:36-38`.
3. **Planted template not runnable.** `educate/templates/CLAUDE.md:52-53,74-75` ship
   literal `${CLAUDE_PLUGIN_ROOT}` commands that are undefined in a user-project Bash
   environment; and `skills/start/SKILL.md:34` says copy the template with no
   instruction to substitute the `{{PROJECT_NAME}}` placeholder.

## Requirements (map 1:1 to board ACs)

R1 (AC #1) — single-topic `--check` on a vault-less topic converges with `--sync`: a
distinct no-vaults verdict (exit 0, message naming the state) consistent with sync's
`skipped`; the check/sync exit-code contract is consistent (a state sync cannot fix
must not exit 1 telling you to run sync).

R2 (AC #2) — empty-array `decksStandardForEveryLesson` is handled consistently with
`isDelegated`'s array tolerance (an empty array must not read as "decks required").

R3 (AC #3) — planted CLAUDE.md gate/sync commands are runnable as written in a user
project: no unresolved `${CLAUDE_PLUGIN_ROOT}` in commands the user is told to run
(resolve at plant time, or express via a path that exists in an installed-plugin
context).

R4 (AC #4) — the start skill instructs `{{PROJECT_NAME}}` substitution when planting
the template (or plants via the chassis `template.mjs` render so the placeholder never
survives).

Regression tests cover R1 and R2; the template/start changes are covered by the
existing plant/e2e tests where applicable. Versions per `docs/releasing.md`: edited
educate skill `version:` bumps + marketplace `sync-version` next free. Wiki: re-verify
+ re-pin `docs/wiki/educate-plugin.md` (+ lockstep stales); CAPSULES regen if the
description changes.

## Non-goals

- The educate↔build handoff seam (`handoff.returned` ownership, loose HANDOFF.md
  doctrine, protocol refs) — that's TASK-63 (spec 026), the second half of Lane D.
- Renaming or redefining topic wiki semantics — only the vault-less convergence
  defect.
