# Decision Briefing profile

Argues a recommendation from research — the evidence, the options weighed, and what the team should do next.

## Page types

| id | purpose |
|---|---|
| `start-here` | Give a reader (live or async) a one-screen kickoff: what this artifact is, who should read which page, and how to ask questions. |
| `verdict-list` | State the recommendation as a short numbered list of verdicts, most important first. |
| `needs-register` | List every need or requirement the recommendation must satisfy, so a reader can check the argument against them. |
| `option-comparison` | Compare every option considered, cell by cell, against the same criteria. |
| `same-direction-refinements` | When refining an existing plan, show what stays the same and justify each individual change in detail. |
| `breakage-matrix` | Show what breaks under each option, so the cost of being wrong is visible up front. |
| `plan-timeline` | Lay out the plan or rollout as a sequence of phases or dates. |
| `case-study-evidence` | Back the recommendation with real case-study data, generated from the source material. |
| `open-questions` | List what's still unresolved, each with an explicit confidence level. |
| `generated-sources` | Auto-built from contents.json's sources[] and every <x-cite> used in the artifact. Not hand-authored. |

Every page type's guide lives at `guides/<id>.md`. `start-here` is the
kickoff page every profile ships: a "Start
here" page suited to presenting the artifact live, pairing with the
`presenter` pattern when `live.presenter` is on.

## Default sources

- **vault** — The research vault's grounded notes and analyses (MOC first, then notes/analyses, grepped by section)
- **docs** — Decision records and design docs (docs/design, ADRs)

A build always also offers a free-form **Other** source in the
interview, regardless of the defaults above.

## Interview

- **Audience** (audience) — Who is this briefing for?
- **Purpose** (purpose) — What should this briefing mainly accomplish?
- **Emphasis** (emphasis) — Which parts of the argument deserve the most depth?
- **Sources** (where-to-look) — Where should the fact-gatherer look?

Answers are saved to `interview.json` beside `contents.json` and reused
on a rebuild or a follow-up request — the interview never re-runs for a
kind that already has one.

## Skeleton

`explainer.mjs new <name> --kind decision-briefing` copies
`skeleton.contents.json` into `docs/explainers/<name>/contents.json` and
writes a placeholder `pages/<id>.html` for every authored page (every
page type except `generated-terms`/`generated-sources`, which the build
writes itself). Replace every placeholder's TODO before publishing.
