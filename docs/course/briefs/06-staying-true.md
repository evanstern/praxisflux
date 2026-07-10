# Module 6: Staying True — Maps, Coastlines, and the Big Picture

Module file to write: `modules/06-staying-true.html` — a single `<section class="module" id="module-6">` block (even module: add class `module-alt`). ~6 screens. **Final module — it closes the course.**

## Course-wide context (same in every brief)

- **Course:** "Inside praxis — Prompts, Gates & Handoffs" — teaches the praxis repo, a Claude Code plugin marketplace: five plugins (research, grounding-wiki, educate, build, codebase-to-course) on a shared chassis (`lib/`), composing only through files and gates.
- **Learner:** a "vibe coder," zero CS background. Tooltip aggressively. Tone: smart friend.
- **Accent color:** teal. Plugins by lowercase name.

## Teaching Arc

- **Metaphor:** nautical charts. Every chart is stamped "surveyed as of…" — a chart isn't wrong because it's *old*, it's wrong when the **coastline actually changed** since the survey. Documentation about code works the same way: a note about a file isn't stale by date, it's stale when that file changed after the note was written. And git — the project's complete history ledger — can answer "did the coastline move?" precisely.
- **Opening hook:** "Module 5 solved copies drifting apart in *space*. One enemy left: truth drifting in *time*. Code changes every day — how do you trust documentation written last month?" (Bonus true detail: three plugin READMEs in this very repo still say 'scaffold — not yet implemented' while their skills are fully written — docs rot even here, which is exactly the disease this module's gate cures.)
- **Key insight:** a claim about code should carry a **pin** — "verified against snapshot X" plus the exact files it describes — so a dumb check can ask git "did any of those files change since X?" and flag the note as STALE the moment its subject moves. Presumed lying until re-verified.
- **Why should I care?** Stale context is one of the top ways AI assistants go wrong — they confidently act on yesterday's truth. Pinning claims to commits (and to sources generally) is the antidote, and it's the same discipline you should demand of any AI-generated summary: *what exactly did you look at, and when?* Then: the wrap-up — five stealable principles for every AI project you'll ever build.

## Screens (suggested)

1. **Hook** — drift in time; the stale-README confession; what grounding-wiki builds (one note per concept of a codebase, in `docs/wiki/`).
2. **The pin** — code↔English of the note template frontmatter: `sources:` (the exact files this note describes) + `verified_against:` (the commit — tooltip: a saved snapshot of the whole project with a unique ID — it was checked against).
3. **Asking git** — code↔English of the freshness check: `git log <pin>..HEAD -- <sources>` = "list every change to these files since that snapshot." Empty answer ⇒ fresh; any answer ⇒ STALE, with the guilty commits named. Callout: fresh ≠ correct — it means "nothing it describes has changed"; a warning (not a failure) covers notes with no sources at all: "staleness is unverifiable."
4. **HERO: the whole machine** — full architecture recap diagram (all six modules' pieces in one map — see data below). Walk it once, connecting every part to the module that taught it.
5. **Steal these five** — pattern cards: the course's takeaways as principles for the learner's own AI projects.
6. **Final quiz** — 4 questions spanning the course + a short goodbye screen/paragraph (the goodbye can share screen 6).

## Code Snippets (pre-extracted — use verbatim, never edit)

File: `grounding-wiki/templates/note.md` (lines 1-8), language `yaml`:
```yaml
---
name: <kebab-case, matches filename>
description: <one line — used to decide relevance during recall>
kind: component | concept | pipeline | pattern
sources:
  - <repo-relative path whose change invalidates this note>
verified_against: <full commit hash>
---
```
Translation: every wiki note declares up front which files it's describing and exactly which snapshot of the project it was verified against. The template's own words: a source is a path "whose change invalidates this note."

File: `grounding-wiki/gates/freshness.mjs` (lines 73-83), language `javascript`:
```javascript
let changed = "";
try {
  changed = git(repoRoot, ["log", "--oneline", `${pin}..HEAD`, "--", ...sources]);
} catch (e) {
  fails.push(`${rel}: git log failed for its sources (${String(e).split("\n")[0]})`);
  continue;
}
if (changed) {
  const lines = changed.split("\n");
  fails.push(`${rel}: STALE — sources changed since ${pin.slice(0, 12)} (${lines.length} commit(s), e.g. ${lines[0]})`);
}
```
Translation: ask git's history ledger, "since the snapshot this note was verified against, has anyone committed changes to the files it describes?" A non-empty answer means the note is describing old code — stale, flagged, with the guilty commits named so the fixer knows where to look.

Real failure message shape: `docs/wiki/alpha.md: STALE — sources changed since abc123def456 (3 commit(s), e.g. abc1234 fix parser)`.

Supporting facts: the `wiki-update` skill is the repair loop — re-verify each stale note against the actual changes and re-pin it. The freshness check runs at phase boundaries (when building/updating a wiki or a course), not on every Stop — cheap universal invariants ride the Stop hook, contextual checks run at milestones. There's a real automated test that proves it: one commit editing `src/a.txt` flips its note to STALE while a sibling note over an untouched file stays fresh (`test/grounding-wiki.freshness.test.mjs`). Also true and satisfying: when codebase-to-course finds a `docs/wiki/` corpus, it uses those pre-verified notes as its primary input instead of re-reading raw code — the loop feeding itself.

Architecture recap data (screen 4 hero — build as HTML/CSS boxes/arrows, all taught already):
- Center: **the shared chassis `lib/`** (project-root · gate-runner · lifecycle · handoff · installer · selfcontained · markdown — 9 files, ~455 lines) — vendored into every shipped plugin (M5).
- Around it, the five plugins (M1): research + grounding-wiki (the two fact-gatherers) → educate → (SPEC via `.handoff/`) → build → (findings via `.handoff/`) → educate; grounding-wiki → `docs/wiki/` corpus → codebase-to-course → `docs/course/`.
- Overlays: every plugin's inspector fires on Stop (exit 0 / exit 2) (M3); evidence logbooks (`progress.json`) beside the mailbox (M4); freshness pins on the wiki notes (M6).
- One caption-level meta-note: "the page you're reading is that `docs/course/` box."

"Steal these five" cards (screen 5):
1. **Status can't exceed proven artifacts** — make your AI produce checkable evidence; verify with dumb code, not vibes (M3).
2. **Compose through files, not calls** — phases that read/write files can be run, skipped, replaced, and audited — and work with any tool, including a human (M1/M4).
3. **Flags aren't proof — demand residue** — double-lock the step the AI most wants to skip (M4).
4. **Share the source, vendor the artifact, robot-check the copies** — duplication is fine when a machine verifies it (M5).
5. **Pin every claim to what it looked at** — "verified against snapshot X" turns "trust me" into a checkable statement (M6).

## Interactive Elements

- [x] **Code↔English translation** — the note frontmatter (screen 2) and the freshness check (screen 3).
- [x] **Quiz (final)** — 4 questions spanning the course, application-style: (1) "A wiki note describes `parser.mjs`, pinned to commit `abc123`. Someone commits a change to `README.md` only. Fresh or stale?" (fresh — staleness tracks the note's own sources, not the repo); (2) "Your teammate's AI marked a lesson `done` and the gate let it through. Skeptical, what do you now know is true *without opening a single file*?" (the evidence files exist on disk, the handoff was returned AND folded in with real residue — the gate derives status from proof); (3) "You're designing your own two-step AI workflow (draft → fact-check). Using praxis's playbook, how do the steps communicate?" (through files — a request/response mailbox plus tracked evidence — never one step invoking the other); (4) "An AI hands you a confident summary of a codebase it read 'a while ago.' What praxis-style question do you ask before trusting it?" (what exactly did you look at and against which version/snapshot — is the pin still fresh?).
- [x] **Architecture recap diagram** — screen 4 hero (static HTML/CSS; interactive hover highlights welcome but optional).
- [x] **Pattern cards** — the five stealable principles (screen 5).
- [x] **Glossary tooltips** — commit, commit hash, git log, HEAD (the current latest snapshot), stale/staleness, pin, corpus (re-tooltip), frontmatter (re-tooltip), invalidate.
- [x] **Callout boxes** — "Fresh means 'nothing it describes has changed' — not 'correct'"; the goodbye callout: "You now know how praxis works — and you watched it work: this course is `docs/course/`, generated by the codebase-to-course plugin, checked by `gates/course.mjs` before it reached you. Status can't exceed proven artifacts — and this page is the artifact."
- [x] **Numbered step cards** (optional) — the wiki-update repair loop: find stale → re-verify against the diff → re-pin.

## Reference Files to Read

- `references/interactive-elements.md` → "Code ↔ English Translation Blocks", "Multiple-Choice Quizzes", "Pattern/Feature Cards", "Interactive Architecture Diagram", "Glossary Tooltips", "Callout Boxes", "Numbered Step Cards"
- `references/content-philosophy.md` → all
- `references/gotchas.md` → all

## Connections

- **Previous:** everything is fair game — M1 the loop & five plugins; M2 anatomy, SKILL.md prose-programs, lib/ chassis; M3 gates, Stop hook, exit codes, lifecycle ladder; M4 handoffs, evidence vs. payload, return-leg double lock; M5 vendoring, drift checks, self-contained HTML. The final quiz should deliberately span M3-M6.
- **Next:** none — close warmly. After the final quiz, a short send-off: they can now read a plugin folder, predict what a gate will say, and steal the five principles. Point at the repo's own docs (`docs/skill-patterns.md`) as the "if you want to go deeper" trail.
- **Tone note:** the recap must feel like a reward (the map finally assembled), not a rehash. Keep the goodbye short and warm — no new concepts after the quiz.
