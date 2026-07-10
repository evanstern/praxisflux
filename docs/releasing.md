# Releasing praxis — versions, bumps, and the automated pipeline

praxis ships as **one release**: the `version` in `.claude-plugin/marketplace.json` is the
release version, and every plugin's `plugin.json` — plus `action.yml`'s
`npx @praxisflux/gates@<version>` pin — stays in lockstep with it (`scripts/sync-version.mjs`
enforces and stamps all three). Releases are git tags + GitHub Releases named
`v<version>`, published automatically — there is no manual release step.

## The pipeline

- **Every PR** (`.github/workflows/ci.yml`): tests, catalog + version consistency checks, a
  clean `build.mjs` package run, and the **bump gate** — `scripts/check-version-bump.mjs`
  compares the PR against its merge-base with `main`:
  - If the diff touches **released surface** — any registered plugin dir, `lib/`, `scripts/`,
    or `.claude-plugin/` — the marketplace version must be a semver *increase* over main's,
    and the tag `v<version>` must not already exist.
  - Anything else (`docs/`, `backlog/`, `test/`, `.github/`, `.githooks/`, root markdown) is
    exempt: no bump needed.
  - A change under `<plugin>/skills/<skill>/` additionally requires that skill's own
    `version:` (SKILL.md frontmatter) to increase.
- **Every merge to main** (`.github/workflows/release.yml`): if `v<version>` is a new tag,
  re-verify, publish **`@praxisflux/gates@<version>`** to npm (`build-npm.mjs` staging,
  `npm publish --provenance`, authenticated by the `NPM_TOKEN` repo secret), then `build.mjs`,
  zip each `dist/<plugin>` as `<plugin>-v<version>.zip`, and publish the GitHub Release with
  generated notes. npm deliberately publishes **before** the release step creates the tag, so
  a released tag always resolves a live npm version — that ordering is what lets `action.yml`
  run `npx @praxisflux/gates@<pin>` race-free. If the tag exists (docs-only merge, re-run), it
  publishes nothing; a re-run after a partial failure skips the npm half if that version is
  already on the registry. So: **substantive PR merged ⇒ exactly one release — one git tag,
  one npm version — named after the marketplace version.**

## When and how much to bump

Bump **once per PR**, whatever the commit count. Sizes:

| Bump  | When |
|-------|------|
| patch | fixes, copy tweaks, internal refactors — no behavior anyone depends on changes |
| minor | a new skill or plugin, new gate, or a behavior change users would notice |
| major | breaking changes to conventions other plugins/projects rely on (handoff protocol, gate contracts, planted-file schemas) |

Recipe — one command sets the marketplace version and re-syncs every `plugin.json`:

```sh
node scripts/sync-version.mjs 0.3.0
```

**Skill versions** follow the same patch/minor/major intuition but scope to the one skill.
Editing anything under a skill's dir means bumping that skill's `version:` in its SKILL.md
frontmatter — the gate fails the PR otherwise. (A skill gaining its first `version:` counts
as bumped.)

**Course chrome is separate.** codebase-to-course's chrome has its own `chrome v<N>` stamp
and `CHROME_VERSION` convention (see `docs/skill-patterns.md`) that tracks the *rendering
contract*, not the release; it bumps only when old chrome must not mix with new.

## Local guards

CI is authoritative, but hooks catch problems before a push. Enable once per clone:

```sh
git config core.hooksPath .githooks
```

`pre-commit` runs the tests + consistency checks; `pre-push` runs the bump gate against
`origin/main`. Run the gate by hand anytime:

```sh
node scripts/check-version-bump.mjs            # vs origin/main
node scripts/check-version-bump.mjs --base main
```
