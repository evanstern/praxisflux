# Pipeline

The full `/explain` flow, step by step, with every gate called out
explicitly. A stage never advances past a gate it didn't
pass — the praxisflux gate→work→gate discipline.

All paths below are resolved via `${CLAUDE_PLUGIN_ROOT}` for bundled files
(`core/`, `scripts/`, this skill's own `references/`); artifact-local files
resolve inside `docs/explainers/<name>/`.

## 0. Locate or scaffold the artifact folder

- Run `explainer.mjs plant --check` once per project. When it exits 1, run
  `explainer.mjs plant` and tell the operator. It plants the marked
  always-on block in the project's `CLAUDE.md`. Text outside the block is
  never touched.

- Given `--name <slug>`, the artifact folder is `docs/explainers/<slug>/`.
  Without `--name`, derive a short kebab-case slug from the kind and the
  first source argument (e.g. `pr-explainer` on `poc/vcs-port` →
  `vcs-port`), and tell the operator what you chose.
- If `docs/explainers/<name>/contents.json` does not exist yet, run
  `explainer.mjs new <name> --kind <kind>` to scaffold it from the profile's
  skeleton. If it already exists, this is either a resumed run or a
  follow-up — read the existing `contents.json`, `interview.json`, and
  `facts.json` before doing anything else, and do not re-scaffold over them.

## 1. Interview

**GATE — interview:** skipped entirely with `--yes`, or reused as-is when
`docs/explainers/<name>/interview.json` already exists (never re-ask).
Otherwise, run it:

- Ask in rounds of **up to 4 multiple-choice questions**, sourced from the
  profile's own `profile.json` `interview[]` (audience, purpose, emphasis,
  and **where to look**), via `AskUserQuestion`.
- The **where-to-look** question pre-selects the profile's
  `default_sources[]` as defaults and always offers a free-form **Other**
  option (a wiki, a ticket system, a URL, or another tool the session can
  reach) — per the profile's own `interview[]` entry (see
  `core/profiles/<kind>/profile.json`).
- Write the answers to `interview.json` in the artifact folder. This file is
  part of the committed artifact source (never regenerated once it exists,
  except by deleting it and re-running the interview on purpose).

## 2. Gather

Dispatch `fact-gatherer` (single dispatch, not parallel) with: the
interview answers (or, under `--yes`, the profile's own defaults with no
"Other"), the profile's `default_sources[]`, and the artifact's current
`contents.json`. When `docs/wiki/INDEX.md` exists, say so in the dispatch —
the fact-gatherer reads the grounding wiki before code. It writes
`facts.json` and appends to `contents.json`
`sources[]`, and returns a receipt (counts, any unreachable sources, any
gaps). Fold that receipt into your own running report — don't lose the list
of gaps; the outline step and the final report both need it.

## 3. Plan — draft the outline

Draft (or, on a resumed run, update) `contents.json`'s `groups[]` and
`pages[]` from the profile's `skeleton.contents.json` plus what
`facts.json` actually contains — drop a page type the gathered facts can't
support, and don't add one the profile doesn't suggest without a reason.

- **Dropping a page deletes its file, in the same step.** Whenever the
  outline drops a page that `new`'s scaffold already wrote a placeholder
  for (or a prior round wrote for real), delete its `pages/<id>.html`
  immediately — never leave it behind once it's no longer in `pages[]`.
  `build` surfaces any such leftover as an "Orphan page files" warning
  (`dist/build-report.md`), but by then it's already too late to have
  caught it cleanly; delete at the moment you drop the page, not later.

- **`pr-explainer` specifically:** set `generators.manifest.range` to
  `<base>...HEAD` — detect the base branch from the repo's default branch
  (`git symbolic-ref refs/remotes/origin/HEAD`, or `git remote show origin`),
  and ask the operator if it can't be detected cleanly rather than guessing.
  Tighten `generators.manifest.buckets[]` from the real diff's shape (the
  skeleton's catch-all `match: ["**"]` bucket is a placeholder — replace it
  with buckets that actually describe the change, keeping a catch-all only
  as a true last resort).
- Write diagram data files (`diagrams/<id>.json`) and generator declarations
  for anything the outline will need, matching each page's suggested
  diagrams/patterns from the profile's `page_types[]`.

- **Before the first build, set `title` and `repo`.** Both belong on
  `contents.json` before the operator reviews the outline below, not patched
  in afterward:
  - `title` — a 2–4-word name for the artifact (a name, not a summary).
    Never leave the profile's skeleton placeholder in place (e.g. "New PR
    Explainer") — replace it with something that actually names this
    artifact.
  - `repo` — `{github, ref}`. Skip this if the project's own config already
    supplies a `repo` (it fills in whatever the artifact leaves unset, so
    there is nothing to add here). Otherwise derive `github` (owner/name)
    from the `origin` remote (`git remote get-url origin`, either its ssh
    or https form) and `ref` from the branch the artifact describes — a
    pull request's head branch for a `pr-explainer`, otherwise whatever
    branch is checked out. If either can't be derived cleanly (no `origin`
    remote, a detached HEAD, a remote that isn't on GitHub), ask the
    operator rather than guessing.

**GATE — outline approval:** stop here and show the operator the drafted
outline (pages, order, diagrams, generators) before writing a single page.
Skipped only with `--yes` (the drafted outline is accepted as-is). This is
the one point in the whole flow where the operator reviews structure before
any prose exists — do not write any `pages/<id>.html` file before this gate
passes.

## 4. Write

Before dispatching anyone, read `core/rules/house-style.json` and filter its
`rules[]` to the ones **applicable to a writer** — `applies_to: "writer"` or
`"both"` — then drop any id `contents.json`'s own `rules.off` disables and
add back only ids its `rules.on` actually lists if the artifact scopes rules
that way (same on/off semantics `lib/check.mjs`'s rule checks already use).
Keep each surviving rule's `id` and full `text`. Also read the page type's
own guide file for every page about to be dispatched.

The surviving set always includes the `info-for-*` house-style rules (when,
and when not, to reach for a popover/panel/sheet instead of showing detail
by default) alongside every other writer-applicable rule — there's nothing
special about them, they flow through this same filter.

Dispatch `page-writer` once per authored page (never for `generated-terms`/
`generated-sources` — the build writes those itself), **in parallel, in one
message**. Each dispatch gets only: that one page entry, only its assigned
fact ids (never the whole `facts.json`), **the filtered house-style rules
pasted inline** (every surviving id + its full text — never a path to
`house-style.md`; a behavioural run found page-writers skipping a path-only
reference instead of reading it), **that page's guide text pasted inline**
(never a path to the guide file either), and `references/markup.md` plus
the specific pattern/diagram READMEs its guide suggests **as paths** — those
stay reference material a writer reads on demand, not something every
dispatch needs reproduced verbatim. Tell each page-writer explicitly whether
a `voice` tone skill is available this session (see Tone, below) — never let
it guess.

Each `page-writer` ends its reply with a one-line `Applied: <rule ids>`
list. Fold any surprising omission (a rule you expected it to need but it
didn't list) into your own judgment before the check/fix loop — it's a
signal, not a hard failure by itself.

## 5. Build

**GATE — generator approval:** run `explainer.mjs build --dir <artifact>
[--multi]`. If it stops with `needs approval: <id> <cmd>`:
- **Interactive:** show the operator the generator's id and exact command,
  and ask for approval. On yes, run `explainer.mjs approve <id> --dir
  <artifact>`, then re-run `build`.
- **Headless (`--yes` / no way to ask):** stop here and report the pending
  approval. `--yes` **never** approves a generator itself — this is the one
  gate `--yes` cannot skip, by design.

A build failure whose errors are all **page-qualified** — every line
matches `pages/<id>.html:<line>: …` (a markup/expansion error: an unknown
x-* tag, a bad `x-diagram`/`x-include` reference, an unresolved term/cite/
panel key, and the like — `lib/markup.mjs`'s `MarkupError` shape) — is
**not** a stop. It enters the same bounded fix loop step 7 runs, but the
budget it spends is **per page, not shared artifact-wide**: each named
page's round counts against that page's own budget alongside any step-7
check/fact-check rounds already spent on it, never pooled with any other
page's count. Re-dispatch `page-writer` only for the named page(s), with
the exact error text (file:line included), re-run `build`, and repeat.
When a named page's own budget is exhausted, stop and report its
remaining build errors in full — do not attempt a further round for that
page. Step 7 spells out the full budget rule, including the shared
artifact-level share for failures that don't name a page and the overall
round cap.

Any other build failure — one that isn't page-qualified (a missing brand
token, a generator crash, anything not matching `pages/<id>.html:<line>`)
— is reported in full and the run stops immediately: do not attempt a fix
yourself, and do not fold it into the page fix loop.

## 6. Fact-check

Once `build` succeeds, dispatch `fact-checker` — built HTML text per page,
`facts.json`, and `contents.json`'s `sources[]` only. **Never** hand it any
page-writer's prompt or dispatch content. It writes
`dist/fact-check.json`. Do this **before** running `check` (build → fact-
checker → check) so `fact.checker`'s result is already in `dist/` for
`check` to read, instead of showing `pending`.

## 7. Check and the bounded fix loop

Run `explainer.mjs check --dir <artifact>`. Exit codes: `0` clean, `1` any
error-level check failed, `2` usage error, `3` nothing failed but
`fact.checker` is pending (you skipped step 6 — go back and run it).

**GATE — errors block publish:** a `1` or `3` exit blocks publish outright.
Enter the fix loop:

1. Read `dist/check.json` for the specific failing checks and which
   page(s) they name.
2. Re-dispatch `page-writer` **only for the pages with a failing check
   against them** — never every page, and never a page that passed.
3. Re-run `build`. Once it succeeds, dispatch `fact-checker` in **re-check
   mode** (see `agents/fact-checker.md`) for every page a `page-writer`
   edited this round — hand it those pages' built text, `facts.json`,
   `contents.json`'s `sources[]`, and the prior non-`supported` entries for
   those same pages, read from `dist/fact-check.json`. It writes
   `dist/fact-check.recheck.json` and never touches the base file itself.
   Run `explainer.mjs fact-merge --dir <artifact>` to fold the re-check
   into `dist/fact-check.json` (this also removes the recheck file), then
   re-run `check`.
4. **Budget: at most 2 rounds per page.** A page's round count is its
   page-qualified build-failure re-dispatches (step 5) and its
   check/fact-check re-dispatches (this step) added together — one count
   per page, never two separate caps, and never pooled across pages.
   Failures that `dist/check.json` doesn't attribute to any one page share
   a single **artifact-level** budget of 2 rounds. Whatever the per-page
   and artifact-level counts are individually, the whole loop stops after
   **4 rounds overall**, counting every round spent anywhere. A page that
   first fails in a later round (for example, a recurrence that re-check
   mode's cross-page grep turns up on a page round 1 never flagged) starts
   its own 2-round budget from that round, still bounded by the 4-round
   overall cap.

   When a page's own budget, the artifact-level budget, or the 4-round
   overall cap is reached and error-level failures are still outstanding:
   stop and report them in full. Do not attempt a further round once a
   budget is spent, and never publish a build with error-level failures
   outstanding.

Warnings (anything at `warning` level — `rule.paragraph-length`,
`rule.min-font-size`, `rule.define-before-use`,
`rule.chart-without-data-table`, and the warning half of `ref.term`/
`ref.github`) never block publish; list them in the final report instead.

## 8. Publish

**GATE — Artifact tool availability:**

- **Interactive, Artifact tool available:** publish via the Artifact tool.
  - Reuse `contents.json`'s existing `publish.url` on every republish — a
    publish without a `url` creates a second, separate artifact, which is
    exactly the duplicate-page failure mode this plugin exists to avoid.
  - On the **first** publish only, declare exactly these `capabilities`,
    and nothing else:
    - `comments: {composer_only: true}` whenever `contents.json`'s
      `live.comments` is `true` — grants `ask.live.js` (core/patterns/ask)
      the composer-only comments namespace, no consent prompt.
    - `db: {rules: LIVE_STATE_DB_RULES}` **and** `user: {}` whenever
      `contents.json`'s `live.presenter` is `true` — `presenter.live.js`
      (core/patterns/presenter) needs both: `db` for the one shared
      `live/state` document, `user` for `isOwner()`. `LIVE_STATE_DB_RULES`
      is the constant exported by
      `core/patterns/presenter/live-state.rules.js` — pass that array
      itself, never hand-retype it:
      ```js
      [{ path: "live/state", read: "view", write: "owner" }]
      ```
      (owner-only write of the one shared document; read left open to
      every admitted viewer so anyone can see who is presenting — see that
      file's own comment for why `write: "owner"` and not `"admin"`.)
  - **Omit `capabilities` entirely on a redeploy** unless `live.comments` or
    `live.presenter` actually changed since the last publish — a
    republish with no capability change never re-declares them.
  - Write the returned `url` back into `contents.json`'s `publish.url`
    immediately, before doing anything else, so a later step failing
    (commit, report) can never lose it.
  - **If `live.presenter` is on, verify the `db` rule actually took effect**
    before reporting success (per the `artifact-capabilities` skill's own
    contract for checking what a lower-privileged viewer can do): one
    `ArtifactData` `list` of the `live` collection (surfacing the
    `live/state` document), then the same `list` again with
    `as_level: "view"` — the lowest level, i.e. a viewer who can only view
    the artifact, never the owner. Both reads should succeed (`read:
    "view"` means every admitted viewer can see who is presenting); report
    both results. This confirms the rule is live, not merely declared —
    catching a typo in the rule or a capability that silently failed to
    register. (A write-side check — that the lower level can't write
    `live/state` — is job, on a real test artifact; this
    step is the read-side half the coordinator can do on every real
    publish.)
- **Headless (`--yes`, or no Artifact tool at all):** skip publish entirely.
  Do not attempt a partial or best-effort publish. The build and the commit
  (step 9) still happen.

## 9. Commit the source

Before committing, re-check `dist/build-report.md`'s "Orphan page files"
section and the last `check` run's `x.leftover` result: there must be no
orphan page file left in `pages/` and no page still carrying the `new`
placeholder TODO marker. Either one means step 3's page-deletion step was
missed, or a dispatched `page-writer` never actually wrote over its
placeholder — go back and fix it (delete the file, or re-dispatch the
writer) before committing, never commit a placeholder as if it were
reviewed content.

Commit the artifact's **source** folder only:
`docs/explainers/<name>/{contents.json,interview.json,facts.json,pages/,
.approvals.json,diagrams/,patterns/,...}` — never `dist/` (git-ignored by
design; it is a build output, not source). This happens whether or not
publish ran.

## 10. Report

Tell the operator, in one place:

- The published link (or "not published", with why — headless, or no
  Artifact tool).
- The check summary: which checks passed, which were skipped and why
  (no browser found, a rule disabled via `contents.json` `rules.off`), and
  every outstanding warning.
- `fact-gatherer`'s receipt: counts and any unreachable sources or gaps.
- The voice/tone status (see below): applied, or "voice skipped" with why.

## Follow-ups (no interview, no outline gate)

A request like "add a toy-code page" or "add a Start here page" on an
**existing** artifact never re-runs the interview or the outline approval
gate:

1. Edit `contents.json` directly — add the page (and any new group, term, or
   source it needs).
2. Dispatch `page-writer` only for the **new** page(s).
3. Re-run `build`, `fact-checker` (for the new page(s)), and `check`.
4. Commit and report, same as steps 9-10.

## Tone

Before dispatching any `page-writer`, check whether `contents.json`'s
`voice` names a skill (e.g. `acme-brand-voice`) that this session actually
has available. If it does, tell every `page-writer` dispatch to load and
apply it. If it does not — including when `voice` is `"none"` or the named
skill isn't present — tell every dispatch explicitly that no voice skill is
available, and say "voice skipped" (with the configured name, if any) in the
final report. Never have a page-writer imitate a named voice from its name
alone.
