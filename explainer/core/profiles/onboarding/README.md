# Onboarding profile

Teaches a codebase or workflow to someone new — concepts in order, a guided tour, and a toy walkthrough.

## Page types

| id | purpose |
|---|---|
| `start-here` | Give a reader (live or async) a one-screen kickoff: what this artifact is, who should read which page, and how to ask questions. |
| `concepts-in-order` | Introduce every concept a newcomer needs, each defined before it's relied on. |
| `guided-tour` | Walk the real codebase in a sensible order, pointing out what matters and what to skip. |
| `toy-code-walkthrough` | Illustrate the hardest concept with small, concrete toy code (at most 50 lines per file). |
| `exercises-next-steps` | Give the newcomer something to try, plus where to look when they get stuck. |

Every page type's guide lives at `guides/<id>.md`. `start-here` is the
kickoff page every profile ships: a "Start
here" page suited to presenting the artifact live, pairing with the
`presenter` pattern when `live.presenter` is on.

## Default sources

- **code** — The codebase itself (modules, structure, conventions, tests)
- **docs** — Existing onboarding docs or READMEs (README, CONTRIBUTING, docs/)

A build always also offers a free-form **Other** source in the
interview, regardless of the defaults above.

## Interview

- **Audience** (audience) — Who is onboarding?
- **Purpose** (purpose) — What should onboarding mainly accomplish?
- **Emphasis** (emphasis) — Which parts deserve the most depth?
- **Sources** (where-to-look) — Where should the fact-gatherer look?

Answers are saved to `interview.json` beside `contents.json` and reused
on a rebuild or a follow-up request — the interview never re-runs for a
kind that already has one.

## Skeleton

`explainer.mjs new <name> --kind onboarding` copies
`skeleton.contents.json` into `docs/explainers/<name>/contents.json` and
writes a placeholder `pages/<id>.html` for every authored page (every
page type except `generated-terms`/`generated-sources`, which the build
writes itself). Replace every placeholder's TODO before publishing.
