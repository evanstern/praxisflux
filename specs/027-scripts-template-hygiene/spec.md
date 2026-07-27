# 027-scripts-template-hygiene — the tooling keeps its own promises

Board: TASK-66 · Direction: downstream bug-find sweep from promptworld (2026-07-27)
against praxis decaa14 (v0.27.0); carded 6c053c2; executed under
`docs/design/downstream-bugfix-runbook.md` (Lane G, tail — last by design, on the
quiet main at 0.35.0 after PRs #83–#90).

## The failures

1. **Unquoted hook expansion.** educate / research / spec-bridge / team-review /
   reorient `hooks/hooks.json` and the scaffold at `scripts/new-plugin.mjs` use
   `bash ${CLAUDE_PLUGIN_ROOT}/scripts/gate.sh` unquoted — an install path containing
   a space word-splits and the Stop hook errors on every turn. The repo's own
   `.claude/settings.json` already quotes the same expansion correctly.
2. **`build --plugin` scorched earth + argv crash.** `scripts/build.mjs` `rmSync(dist)`
   is unconditional, so `--plugin <name>` wipes ALL packaged copies and `dist/npm` to
   rebuild one plugin; and `--plugin` as the last argv yields `targets=[undefined]` →
   `join(repo, undefined)` TypeError instead of a usage message.
3. **Scaffolder's false header contract.** `scripts/new-plugin.mjs` claims a fresh
   plugin passes `check-docs.mjs` unmodified, but scaffolding never updates count-claim
   prose (README says "Nine plugins are registered") and check-docs gates every
   "<N> plugins" claim against the marketplace count — scaffolding a 10th plugin
   leaves check-docs failing. Untested because the fixture README in
   `test/new-plugin.test.mjs` carries no count claim.
4. **Bump-gate semver short-circuit.** `scripts/check-version-bump.mjs` — a skill
   whose BASE SKILL.md version is non-semver (e.g. `v0.1.0`) short-circuits the
   increase requirement entirely, so such a skill can be edited with no bump and pass.

## Requirements (map 1:1 to board ACs)

R1 (AC #1) — every shipped hook command (the five plugins' `hooks/hooks.json`) and the
scaffold template quote the plugin-root expansion; the gate-shim tests still pass.

R2 (AC #2) — `build --plugin <name>` rebuilds only its target (scoped clean of that
plugin's dist dir; other packaged copies and `dist/npm` untouched); `--plugin` with a
missing value prints usage and exits nonzero instead of crashing.

R3 (AC #3) — scaffolding keeps check-docs green: either new-plugin.mjs updates the
count-claim prose (README table row + count words/digits) or its header contract is
amended to state exactly what manual step remains; the fixture README gains a count
claim so the contract is actually tested. Prefer making the contract TRUE over
weakening it.

R4 (AC #4) — a non-semver base skill version fails the bump gate loudly (named
problem) instead of skipping the increase requirement; a valid bump over a non-semver
base is also handled sanely (validate, don't silently pass).

Tests cover all four (extend the gate-shim / build / new-plugin / check-version-bump
suites). Versions per `docs/releasing.md`: hooks.json changes touch five plugins'
released surface (no SKILL.md content change → no skill version bumps expected;
verify against precedent) + marketplace `sync-version` next free (expect 0.36.0;
verify). Wiki: re-verify + re-pin `build-and-release`, `release-pipeline`,
`skill-patterns`, `gates-convention` and any other note listing the touched files (+
lockstep stales); CAPSULES regen if descriptions change.

## Non-goals

- New scaffold features or hook redesigns — quoting and contract truthfulness only.
- sync-version.mjs argv validation (flagged by TASK-63 as a follow-up candidate —
  awaiting operator approval; NOT silently folded in here).
