# Releasing praxisflux — versions, bumps, and the automated pipeline

praxisflux ships as **one release**: the `version` in `.claude-plugin/marketplace.json` is the
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
  re-verify, publish **`@praxisflux/gates@<version>`** to npm (`build-npm.mjs` staging, then
  `npm publish` via **OIDC trusted publishing** — the trusted publisher on npmjs.com names
  this repo + `release.yml`, `id-token: write` supplies the attestation, and provenance is
  automatic; an `NPM_TOKEN` repo secret, if present, is used instead as a bootstrap/break-glass
  fallback and should stay deleted normally — npm is deprecating publish-capable tokens),
  then `build.mjs`, zip each `dist/<plugin>` as `<plugin>-v<version>.zip`, and publish the
  GitHub Release with generated notes. npm deliberately publishes **before** the release step creates the tag, so
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

## Re-planting a downstream project after an upgrade

A release changes more than code: `pdlc:bootstrap` **plants** an always-on grounding block into
every downstream project's `CLAUDE.md`, and that block is versioned. Upgrading the plugin does
not touch what was already planted — so a host that upgrades and stops there keeps running last
release's doctrine. This is the upgrade path for those hosts.

**The staleness test.** `.pdlc` in the project root stamps the version that planted the block,
and the block's own BEGIN marker repeats it:

```sh
node -e 'console.log(JSON.parse(require("fs").readFileSync(".pdlc")).version)'   # planted
grep -m1 'pdlc:grounding BEGIN' CLAUDE.md                                        # same, in the block
```

`<planted version> < <installed plugin version>` means stale. The field case is this repo
itself: praxis sat at a planted `0.57.0` against a `0.63.1` marketplace — **six versions stale,
unnoticed** — until spec 066 re-planted it and wired the check below.

**The sequence.** Update the plugin, then:

1. Re-run **`pdlc:bootstrap`** in the project. It plants nothing blind: it runs
   `plant.mjs --check` first and reports the block as `unchanged` or `drifted`.
2. `drifted` means the on-disk block differs from what the new version plants — a plugin
   upgrade, user edits inside the markers, or both.
3. **Diff it** against the new render before agreeing to anything.
4. Consent, and only then re-plant with **`--force`**. Without `--force` nothing is overwritten
   and `.pdlc` does not advance past the drift.

`pdlc:bootstrap`'s own *"the refresh path"* section owns the drift/consent semantics in full —
including what `--check` reports for the sentinel, the peer opt-ins, and the optional root-guard
hook. Read it there; this section is the *when and why*, not a second copy of the *how*.

**Keep project edits OUTSIDE the markers.** The block between
`<!-- pdlc:grounding BEGIN … -->` and `<!-- pdlc:grounding END -->` is refreshed **wholesale**
by design, so a re-plant discards anything added inside it. Project-specific rules belong in the
surrounding `CLAUDE.md` — that text survives byte-for-byte across re-plants.

**Detecting staleness without being told.** `plant.mjs --check` exits **1** whenever planting
would change something and **0** when the footprint is current, so any host can gate on it:

```sh
node <path-to-pdlc>/scripts/plant.mjs --root . --peer backlog --check
```

Pass the same peer set `.pdlc` records — a different set strips or adds block sections, which
reads as drift. This repo runs exactly that in `.github/workflows/ci.yml`; a downstream host can
wire it into its own CI the same way.
