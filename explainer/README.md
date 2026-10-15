# explainer

Produces explainer artifacts — PR explainers, architecture sites, decision
briefings, onboarding guides — in a consistent house style from cited facts.
Structure is generated rather than hand-written, and checks block a broken
publish.

## Prerequisites

- **Node ≥ 20.** The build and check scripts (`scripts/explainer.mjs` and
  `scripts/lib/*.mjs`) use Node built-ins only — no npm dependencies.
- **A browser for the `browser.*` checks** (phone-width scroll, SVG
  overflow, light/dark screenshots) — detected in this order, each with a
  hard kill timeout (default 15s, `EXPLAINER_BROWSER_TIMEOUT_MS`; a timed-out
  driver is treated as unavailable and detection falls through to the next):
  1. **`playwright`** (optional — never a package.json dependency; detected
     via a dynamic `import("playwright")`), driving `chrome-headless-shell`
     or an installed Chromium-family browser by executable path if either is
     found, else Playwright's own bundled Chromium.
  2. **`chrome-headless-shell`** — the zero-package option. Install it with
     `npx @puppeteer/browsers install chrome-headless-shell@stable`, or
     `npx playwright install chromium-headless-shell` if Playwright is
     already present. Found via `EXPLAINER_BROWSER`, `PATH`, Playwright's
     cache, or the `@puppeteer/browsers` cache.
  3. **A full Chromium-family browser's CLI** (Chromium, Chrome, Edge,
     Brave) with `--headless=new` — last resort. On at least one current
     macOS (Darwin 25) these hang under `--headless=new` entirely; the hard
     timeout above is what keeps that from hanging the build, not a fix for
     the browser itself. Prefer installing `chrome-headless-shell`.
  4. **None found or all timed out** — `browser.*` checks report `skipped`,
     never `passed`.

  `EXPLAINER_NO_BROWSER=1` forces no browser (useful for CI without one, or
  for deterministic test runs).

## Commands

- `/explain <kind> [sources…] [--yes] [--multi] [--name <slug>]` — build a new
  explainer artifact: interview, gather facts, draft and approve an outline,
  write pages, build, check, and publish.
- `/explain-answer <artifact url | name>` — answer open comment threads on an
  already-published explainer artifact. Resolves the artifact (a URL as-is,
  or a name via `docs/explainers/<name>/contents.json`'s `publish.url`),
  reads open threads, answers each from `facts.json` first and cited sources
  second (grepped by section, never read whole), batches more than 3 open
  questions across parallel `answer-helper` dispatches (at most 3 questions
  per dispatch), then posts replies and resolves answered threads. Runs once
  and exits; refuses to run under `/loop` or any recurring/self-scheduling
  invocation.

## Layout

| Path | Purpose |
| --- | --- |
| `.claude-plugin/plugin.json` | Manifest. |
| `commands/explain.md` | `/explain` — parses arguments and loads the `explainer` skill. |
| `commands/explain-answer.md` | `/explain-answer` — parses the artifact url/name and loads the `explainer-answer` skill. |
| `skills/explainer/SKILL.md` | Coordinator skill for the full build pipeline. |
| `skills/explainer/references/` | House style, pipeline, and markup references. |
| `skills/explainer-answer/SKILL.md` | Answers open comment threads on a published artifact from its facts and sources. |
| `agents/fact-gatherer.md` | Gathers cited facts from sources. |
| `agents/page-writer.md` | Writes one page at a time, in parallel, from only its own facts. |
| `agents/fact-checker.md` | Independently verifies built claims against facts and sources (first pass and re-check rounds). |
| `agents/answer-helper.md` | Drafts cited answers for one batch of at most 3 comment questions; read-only, never posts replies. |
| `scripts/explainer.mjs` | CLI: `new \| build \| approve \| check \| fact-merge \| plant`. |
| `scripts/lib/` | State-mutating build modules (build, generators, browser runs, report writes). |
| `gates/check.mjs` | The read-only checks `check` runs. Never writes to disk. |
| `gates/explainer.mjs` | The Stop-hook gate: built `dist/` pages stay self-contained. |
| `templates/AGENTS.md` | The marked always-on block `plant` lands in a host project's `AGENTS.md` (with a `CLAUDE.md` pointer). |
| `lib` | Symlink to the shared praxisflux chassis (`selfcontained`, `markdown`, `project-root`, `gate-runner`, `template`). |
| `core/` | Lowest layer of the lookup: patterns, diagrams, profiles, brand, rules, shell. |

Every reference to a bundled file uses `${CLAUDE_PLUGIN_ROOT}`, never `~/`, an
absolute path, or a cwd-relative one.

## Grounding wiki

When the host project has a grounding-wiki corpus (`docs/wiki/INDEX.md`), the
fact-gatherer reads it before code and cites notes as `file` sources. The
fact-checker checks wiki-cited facts against the code the note lists. The
`wiki.fresh` check warns when a cited note's sources changed after its
`verified_against` pin. A project without a wiki loses nothing.

Tests live at the repo root in `test/explainer/`.

## Status

Ships end to end: the `/explain` build pipeline (interview, fact-gathering,
outline approval, parallel page-writing, build, fact-checking, a bounded
per-page fix loop, publish) and `/explain-answer`'s comment-answering flow,
with their agents (`fact-gatherer`, `page-writer`, `fact-checker`,
`answer-helper`). The live layer ships the `comments` composer and
`presenter` patterns (owner/follower toggle, "Presenting" badge), each wired
only when `contents.live.comments`/`.presenter` is on, plus the `info`
component (terms and detail panels). The check suite covers markup, house
style, and brand rules plus three `browser.*` checks (phone-width scroll,
SVG overflow, light/dark screenshots) that `skipped` rather than fail when no
browser is available. `fact-merge` folds a fact-checker re-check
(`dist/fact-check.recheck.json`) into `dist/fact-check.json`. The CLI's

