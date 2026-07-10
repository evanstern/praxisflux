# Module 4: Handoffs — Interoffice Mail and the Signed Logbook

Module file to write: `modules/04-handoffs.html` — a single `<section class="module" id="module-4">` block (even module: add class `module-alt`). ~6 screens. **This module owns the course's mandatory GROUP CHAT ANIMATION.**

## Course-wide context (same in every brief)

- **Course:** "Inside praxis — Prompts, Gates & Handoffs" — teaches the praxis repo, a Claude Code plugin marketplace: five plugins on a shared chassis (`lib/`), composing only through files and gates.
- **Learner:** a "vibe coder," zero CS background. Tooltip aggressively. Tone: smart friend.
- **Accent color:** teal. Plugins by lowercase name.

## Teaching Arc

- **Metaphor:** interoffice mail plus a signed logbook. Two departments that never meet route manila envelopes through a mail room (`.handoff/`): from/to on the front, "in reply to memo #…" (`ref`) for responses. Reading your mail means moving the envelope to the "answered" drawer (`consumed/`) — archived, never shredded. But envelopes prove nothing: what the auditor reads is each department's own **logbook** (`progress.json`) and the actual work filed in the records (`## Post-build` in the lesson notes). If it isn't in the logbook, it didn't happen.
- **Opening hook:** "In Module 1 you saw educate hand a SPEC to build. But plugins never call each other — so how does a work order actually travel between two programs that have never met?" Answer: it's literally a text file in a mailbox folder.
- **Key insight:** **transient payload, durable evidence.** The messages are disposable plumbing hidden from git; the *proof* a handoff happened lives in tracked state that gates can check — and a checkbox alone doesn't count, the gate demands physical residue on disk.
- **Why should I care?** Two practical superpowers: (1) when an AI workflow "loses" work between steps, you now know to look for the queue (the files) and the receipts (the tracked state) — they're separate things; (2) the double-lock trick (flag + residue) is how you stop any AI from rubber-stamping the step it most wants to skip.

## Screens (suggested)

1. **Hook** — how do two programs that never call each other pass work? A file. Show the envelope idea.
2. **The envelope** — code↔English of `writeHandoff`: sending a message = writing a Markdown file with an address label (id, kind: request|response, from, to, ref) on top. The body is the payload — the chassis (the mail room) never reads it; only the plugin pair understands it. Visual: a rendered "envelope" card.
3. **HERO: group chat** — the full SPEC → build → findings → fold-in conversation (script below).
4. **Reading your mail** — code↔English of `markConsumed`: consumed mail is *moved* to `.handoff/consumed/`, never deleted. And the mailbox is gitignored (tooltip: a list of files git pretends not to see) — there's even a unit test asserting the mailbox is invisible to git.
5. **The double lock (the return leg)** — the most-skipped step: folding build's findings back into the lesson. The gate refuses `done` unless BOTH the logbook flag `handoff.foldedIn` is true AND a real `## Post-build` section exists in the lesson's files. Code↔English of the rubber-stamp detector. Ladder recap tie-in from Module 3: `spec'd → built → decked → done` each backed by handoff evidence.
6. **Quiz** — 3 questions.

## Code Snippets (pre-extracted — use verbatim, never edit)

File: `lib/handoff.mjs` (lines 34-41), language `javascript`:
```javascript
export function writeHandoff(root, { id, kind, from, to, ref = "", title = "", body = "" }) {
  if (!id || !kind || !from || !to) throw new Error("handoff requires id, kind, from, to");
  const dir = ensureHandoffDir(root);
  const fm = [`id: ${id}`, `kind: ${kind}`, `from: ${from}`, `to: ${to}`, `ref: ${ref}`, `title: ${title}`].join("\n");
  const path = join(dir, `${id}.md`);
  writeFileSync(path, `---\n${fm}\n---\n${body}\n`);
  return path;
}
```
Translation: the entire mail system. An address label (six lines of text) stapled on top of an otherwise opaque letter, dropped into `.handoff/`.

File: `lib/handoff.mjs` (lines 68-75), language `javascript`:
```javascript
export function markConsumed(root, id) {
  const src = join(handoffDir(root), `${id}.md`);
  if (!existsSync(src)) return false;
  const cdir = join(handoffDir(root), "consumed");
  mkdirSync(cdir, { recursive: true });
  renameSync(src, join(cdir, `${id}.md`));
  return true;
}
```
Translation: consuming a message = moving the envelope to the answered drawer. Archived, never shredded — you can always do archaeology later. Writing the receipt in the logbook is the *recipient's* job; the mail room never writes in anyone's books.

File: `docs/handoff-protocol.md` (lines 9-17, excerpt), language `text`:
```
A handoff message is *plumbing*, not a work product — it must not clutter `git status`. So:

- **Payloads** live in a **gitignored `.handoff/`** at the project root (the installer adds the
  ignore). They are opaque markdown files with a small envelope; consuming one moves it to
  `.handoff/consumed/`.
- **Evidence** that a handoff happened — and what it changed — is recorded in the consumer's own
  **tracked state** (e.g. educate's `progress.json`). Gates read the evidence, never the loose
  payload files.
```

File: `educate/gates/dod.mjs` (lines 104-105), language `javascript`:
```javascript
} else if (lesson.status === "done" && h.foldedIn && !hasReturnLegResidue(lessonDir)) {
  problems.push(`${lesson.id}: status=done with handoff.foldedIn=true but no durable return-leg residue on disk — add a "## Post-build" section to guide.md or raw-notes.md; the return leg can't be rubber-stamped`);
```
Translation: even when the logbook swears the findings were folded in, the gate demands a real "## Post-build" section written into a tracked document. A checkbox can't be checked into truth.

File: `test/handoff.test.mjs` (lines 20-22), language `javascript`:
```javascript
  // .handoff/ is gitignored so it never pollutes git status
  assert.match(readFileSync(join(root, ".gitignore"), "utf8"), /^\.handoff\/$/m);
```
Translation: the mailbox's invisibility to git is part of the contract — so there's an automated test for it.

Layout visual (screen 1 or 4) — where things live:
```
your-project/
├── .handoff/              ← the mailbox (gitignored, invisible)
│   ├── spec-101.md        ← a pending request
│   └── consumed/          ← answered mail, archived
├── topics/git-basics/
│   ├── progress.json      ← the tracked logbook (evidence)
│   └── 101-branching/
│       ├── guide.md       ← the work itself, incl. "## Post-build"
│       └── raw-notes.md
```

## Interactive Elements

- [x] **Group chat animation (MANDATORY — course requirement lives here).** Container needs an `id`. Participants: **educate**, **build**, **DoD gate** (the inspector from Module 3, one cameo at the end). Script (compress to ~10 bubbles; all filenames/fields real):
  1. educate: "Lesson 101 taught, every checklist item demonstrated. Writing the work order."
  2. educate: "📨 Dropped `spec-101.md` in `.handoff/` — kind: request, from: educate, to: build. Body: what to build + done-criteria."
  3. educate: "Stamped my logbook: `handoff.specd: true`, status → `spec'd`. Now I tell the *user* to run build — I never call build myself."
  4. build: "User woke me. Anything in the mailbox addressed to me? …found `spec-101.md`."
  5. build: "Built it. Now verifying by actually *running* it, not eyeballing the code… huh, the SPEC missed an edge case. That goes in my report."
  6. build: "📨 Response filed — kind: response, ref: spec-101. Body: what I built, how I verified, what the SPEC got wrong. Moved your request to `consumed/`."
  7. build: "My logbook: `handoff.returned: true`, status → `built`. User — back to educate for the return leg. I don't write lessons. Not my leg."
  8. educate: "Reading your findings… folding the corrections into the lesson. Writing a `## Post-build` section into the notes and setting `handoff.foldedIn: true`."
  9. DoD gate: "*(checks the logbook AND scans the disk for `## Post-build`)* Both present. You may call it done. Skip that next time and I block the whole lesson."
- [x] **Code↔English translation** — writeHandoff (screen 2), markConsumed (screen 4), the rubber-stamp detector (screen 5).
- [x] **Quiz** — 3 questions: (1) "You peek at `git status` mid-handoff — why is the SPEC file nowhere in it, and is that a bug?" (gitignored by design: payloads are plumbing; evidence lives in tracked progress.json); (2) "A lesson shows `handoff.foldedIn: true` but no `## Post-build` section anywhere. Claude tries to finish — what happens?" (blocked: flag without residue is a rubber-stamp); (3) "Someone deletes the whole `.handoff/` folder after a lesson is done. Does the done status survive its gate check?" (yes — gates read evidence in tracked state, never the loose mail).
- [x] **Envelope visual** (screen 2) and **file-layout tree** (screen 1 or 4).
- [x] **Glossary tooltips** — handoff, payload, envelope/frontmatter, gitignore, `git status`, tracked vs. untracked files, correlation id (`ref`), unit test, ledger/logbook, residue (durable trace of work on disk).
- [x] **Callout box** — "The human is part of the protocol: no plugin ever triggers another. Each one finishes, stamps its logbook, and tells *you* what to run next. The loop's invisible participant is the user."

## Reference Files to Read

- `references/interactive-elements.md` → "Group Chat Animation", "Code ↔ English Translation Blocks", "Multiple-Choice Quizzes", "Visual File Tree", "Glossary Tooltips", "Callout Boxes"
- `references/content-philosophy.md` → all
- `references/gotchas.md` → all (note group-chat gotchas: container `id` required)

## Connections

- **Previous:** Module 1 (the loop, SPEC/findings), Module 2 (plugin anatomy, lib/ chassis), Module 3 (gates, Stop hook, exit codes, "status can't exceed proven artifacts", the lesson ladder, the `handoff.foldedIn` failure message cliffhanger). Resolve that cliffhanger explicitly.
- **Next:** Module 5 "One Copy Everywhere" — how the shared chassis physically ships inside every plugin (vendoring) and how the repo stops copies from drifting.
- **Tone note:** this module has the most heart — the system *distrusts its own AI's checkbox-ticking*. Let the group chat carry personality (build is laconic and proud; educate is diligent; the gate is deadpan).
