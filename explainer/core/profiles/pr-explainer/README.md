# PR Explainer profile

Explains a large pull request to a team — what changed, why, and how to explore it — from a diff and the repo it lands in.

## Page types

| id | purpose |
|---|---|
| `start-here` | Give a reader (live or async) a one-screen kickoff: what this artifact is, who should read which page, and how to ask questions. |
| `overview` | Answer, in a few sentences, what changed and why — the one-screen version for someone who reads nothing else. |
| `architecture-overview` | Show how the changed pieces fit into the system as a whole, before diving into any one of them. |
| `components` | Introduce each new or changed port/component: what it does, who calls it, and what it replaces. |
| `real-examples` | Show real, generator-sourced payloads or command output proving the new behavior — never hand-typed. |
| `scenario-walkthrough` | Walk one real call through the system end to end: the call, the result, and who handles it next. |
| `comparison-matrix` | Compare old vs. new behavior (or option A vs. option B) cell by cell instead of in prose. |
| `file-map` | Show every changed file, bucketed by concern, generated fresh from the real diff — never hand-maintained. |
| `tests-ci` | Summarize what tests cover the change and what CI now checks, so a reviewer can trust the coverage claim. |
| `generated-terms` | Auto-built from contents.json's terms[] — every defined term in one place. Not hand-authored. |
| `generated-sources` | Auto-built from contents.json's sources[] and every <x-cite> used in the artifact. Not hand-authored. |

Every page type's guide lives at `guides/<id>.md`. `start-here` is the
kickoff page every profile ships: a "Start
here" page suited to presenting the artifact live, pairing with the
`presenter` pattern when `live.presenter` is on.

## Default sources

- **diff** — The PR's changed files against its base branch (git diff / branch range — the primary source for a PR explainer)
- **code** — The repo checkout on the PR's own branch (modules, interfaces, configs, tests touched by the diff)

A build always also offers a free-form **Other** source in the
interview, regardless of the defaults above.

## Interview

- **Audience** (audience) — Who is this PR explainer mainly for?
- **Purpose** (purpose) — What should this explainer mainly accomplish?
- **Emphasis** (emphasis) — Which parts of the PR deserve the most depth?
- **Sources** (where-to-look) — Where should the fact-gatherer look?

Answers are saved to `interview.json` beside `contents.json` and reused
on a rebuild or a follow-up request — the interview never re-runs for a
kind that already has one.

## Skeleton

`explainer.mjs new <name> --kind pr-explainer` copies
`skeleton.contents.json` into `docs/explainers/<name>/contents.json` and
writes a placeholder `pages/<id>.html` for every authored page (every
page type except `generated-terms`/`generated-sources`, which the build
writes itself). Replace every placeholder's TODO before publishing.

## Generators

`generators.manifest` ships with a **placeholder** range (`HEAD`, which diffs against the working tree — safe and empty until you point it at a real base) and one catch-all bucket (`match: ["**"]`) so the very first build never hard-fails on an unmatched path. Before a real run, set `range` to the PR's actual base (e.g. `"origin/master...HEAD"`) and split `buckets` by concern — the catch-all can stay last as a safety net.
