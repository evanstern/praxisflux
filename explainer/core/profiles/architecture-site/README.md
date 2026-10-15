# Architecture Site profile

Explains a system from its own repository — components, flows, and contracts — for a team that needs to work in it.

## Page types

| id | purpose |
|---|---|
| `start-here` | Give a reader (live or async) a one-screen kickoff: what this artifact is, who should read which page, and how to ask questions. |
| `overview` | Answer what this system is and does, in a few sentences, before any detail. |
| `architecture-overview` | Show the system's major components and how they relate, before drilling into any one. |
| `components` | Introduce each major component: its responsibility, its interfaces, and what depends on it. |
| `real-examples` | Show real, generator-sourced examples of the system's actual inputs and outputs. |
| `scenario-walkthrough` | Walk one real request or event through the system end to end. |
| `comparison-matrix` | Compare components or approaches cell by cell (for example, capability × component). |
| `flow-traces` | Trace a control or data flow across several components in sequence. |
| `data-contracts` | Document the data shapes and contracts the system relies on. |
| `tests-ci` | Summarize what tests cover the system and what CI checks on every change. |
| `generated-terms` | Auto-built from contents.json's terms[] — every defined term in one place. Not hand-authored. |
| `generated-sources` | Auto-built from contents.json's sources[] and every <x-cite> used in the artifact. Not hand-authored. |

Every page type's guide lives at `guides/<id>.md`. `start-here` is the
kickoff page every profile ships: a "Start
here" page suited to presenting the artifact live, pairing with the
`presenter` pattern when `live.presenter` is on.

## Default sources

- **code** — The system's own repo checkout (modules, interfaces, schemas, configs, tests)
- **docs** — The repo's design docs and decision records (docs/design, README, ADRs)

A build always also offers a free-form **Other** source in the
interview, regardless of the defaults above.

## Interview

- **Audience** (audience) — Who needs to work in this system?
- **Purpose** (purpose) — What should this site mainly accomplish?
- **Emphasis** (emphasis) — Which parts of the system deserve the most depth?
- **Sources** (where-to-look) — Where should the fact-gatherer look?

Answers are saved to `interview.json` beside `contents.json` and reused
on a rebuild or a follow-up request — the interview never re-runs for a
kind that already has one.

## Skeleton

`explainer.mjs new <name> --kind architecture-site` copies
`skeleton.contents.json` into `docs/explainers/<name>/contents.json` and
writes a placeholder `pages/<id>.html` for every authored page (every
page type except `generated-terms`/`generated-sources`, which the build
writes itself). Replace every placeholder's TODO before publishing.
