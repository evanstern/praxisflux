# Module 3: Gates — The Inspector Who Can't Be Sweet-Talked

Module file to write: `modules/03-gates.html` — a single `<section class="module" id="module-3">` block (odd module: default background). ~6 screens. **This module owns the course's mandatory FLOW ANIMATION.**

## Course-wide context (same in every brief)

- **Course:** "Inside praxis — Prompts, Gates & Handoffs" — teaches the praxis repo, a Claude Code plugin marketplace: five plugins on a shared chassis (`lib/`), composing only through files and gates.
- **Learner:** a "vibe coder," zero CS background. Tooltip aggressively. Tone: smart friend.
- **Accent color:** teal. Plugins by lowercase name. The AI is "Claude".

## Teaching Arc

- **Metaphor:** a building inspector and the certificate of occupancy. The builder (Claude) can *say* the wiring is done, but the certificate only comes when the inspector physically walks the site and checks the actual walls against a fixed checklist. The inspector doesn't negotiate, doesn't care how confident the builder sounds, and shows up automatically at the end of every job. Separate inspectors (one per installed plugin) each check their own specialty on the same house.
- **Opening hook:** "AI assistants have a bad habit: declaring 'done!' when it isn't. Praxis's answer is a piece of code so simple it can't be argued with." Connect to lived experience: every vibe coder has caught an AI claiming something works when it doesn't.
- **Key insight:** **a status can't exceed the artifacts that prove it** — and the enforcement works precisely because the enforcer is *dumber* than the thing it checks. A 70-line deterministic script comparing claims against actual files on disk can't be persuaded by a confident-sounding summary. `existsSync(deckPath)` has no vibes.
- **Why should I care?** This is the single most stealable pattern for working with AI: never trust the AI's claim of "done" — make it produce checkable evidence, and check with dumb code. It also teaches you exit codes, which you'll meet constantly when debugging anything.

## Screens (suggested)

1. **Hook** — the "done!" problem; the motto "status can't exceed proven artifacts."
2. **The claim vs. the disk** — educate's lesson ladder (`planned → scaffolded → taught → spec'd → built → decked → done`, shown as a visual ladder/step diagram) and the evidence files each rung requires (checklist.md, raw-notes.md, deck.html, guide.md). Code↔English: `computeArtifacts` — "don't believe the label, look at the disk."
3. **The moment of truth: the Stop hook** — Claude Code lets you register programs that run the instant Claude tries to finish. Registration is pure configuration (hooks.json translation). Introduce exit codes: every program ends with one number; 0 = "all fine", 2 (here) = "block — and whatever was printed becomes the message Claude reads."
4. **HERO: flow animation** — the full journey (steps below).
5. **The verdict code** — code↔English of the gate-runner verdict + the gate declaring itself (stop.mjs). Aha callouts: a *crashing* gate reports itself as a problem (fails closed, never waves work through); the `stop_hook_active` flag prevents an infinite blocking loop; a gate that finds no project of its kind is a silent no-op, so installed plugins' inspectors stack additively.
6. **Quiz** — 3-4 debugging-scenario questions.

## Code Snippets (pre-extracted — use verbatim, never edit)

File: `educate/hooks/hooks.json` (lines 3-15), language `json`:
```json
"hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/scripts/gate.sh"
          }
        ]
      }
    ]
  }
```
Translation: "Dear Claude Code: every time Claude tries to stop, no matter what, run this script first." The whole registration is configuration, not code.

File: `lib/gate-runner.mjs` (lines 14-15), language `javascript` (present as the contract):
```javascript
// Contract (Claude Code Stop hook): stdin is JSON with { stop_hook_active, cwd, … };
// exit 0 = allow the model to stop; exit 2 = block, and stderr becomes the message it sees.
```

File: `lib/lifecycle.mjs` (lines 13-17), language `javascript`:
```javascript
/** Derive { key: bool } for each artifact by checking its filename on disk in `dir`. */
export function computeArtifacts(dir, artifactFiles) {
  const out = {};
  for (const [key, file] of Object.entries(artifactFiles)) out[key] = existsSync(join(dir, file));
  return out;
}
```
Translation: for every claim ("there's a deck", "there are notes"), just ask the disk whether that file exists. Truth is derived from what's observable, never from what's declared.

File: `lib/gate-runner.mjs` (lines 61-68), language `javascript`:
```javascript
const { block, message, warnings } = evaluate(input, gates);
if (block) {
  process.stderr.write([message, warnings].filter(Boolean).join("\n") + "\n");
  exit(2);
} else {
  if (warnings) process.stderr.write(warnings + "\n");
  exit(0);
}
```
Translation: the verdict. Problems? Print the list where Claude Code will read it and exit 2 — Claude is refused permission to stop and receives that exact text as its to-do list. Clean? Exit 0 — allowed to stop (soft warnings ride along without blocking).

File: `educate/scripts/stop.mjs` (lines 14-26), language `javascript`:
```javascript
const educateGate = {
  name: "educate",
  resolveRoots: (startDir) => {
    const root = findRootUpwards(startDir, hasChild("topics"));
    return root ? [root] : [];
  },
  check: (root) => gateProblemsForProject(root),
  // Corpus-index freshness is a reminder, not a DoD violation — warn (never block) if a WIKI.md
  // has drifted from the vaults on disk. Run wiki.mjs --sync (or progress.mjs --sync) to refresh.
  warn: (root) => wikiStalenessWarnings(root),
};

runStopHook({ gates: [educateGate] });
```
Translation: a gate is three answers — "am I relevant here?" (walk up looking for `topics/` — the same `findRootUpwards` from Module 2), "what's broken?", and "what's merely worth mentioning?" Then hand it to the shared engine.

File: `educate/gates/dod.mjs` (lines 82-83), language `javascript`:
```javascript
// a status may not exceed the artifacts that prove it
for (const p of lifecycle.check(lessonDir, lesson.status)) problems.push(`${lesson.id}: ${p}`);
```

Real failure message a blocked Claude sees (from the gate, use in the flow animation or a callout):
`[git-basics] 002-branching: status=done but the return leg is unrecorded (handoff.foldedIn=false) — fold the build findings back into the lesson first` — mention `handoff` only as "evidence of work passed between plugins — Module 4's whole story."

## Interactive Elements

- [x] **Data flow animation (MANDATORY — course requirement lives here).** `.flow-animation` with `data-steps` JSON. Actors: **Claude** → **Claude Code** → **gate.sh** (tiny relay) → **the gate** (stop.mjs + checkers) → **the disk**. Steps (~7): (1) Claude: "Lesson marked done — finishing up!" (2) Claude Code intercepts the stop and runs every registered Stop hook. (3) The hook relays to the gate program. (4) The gate walks up the folders, finds the `topics/` project. (5) It checks the disk: status says `done`… but `deck.html` doesn't exist. (6) Verdict: exit 2 — "you may not stop", and the printed problem list is handed to Claude. (7) Claude writes the missing deck, tries again → checks pass → exit 0, allowed to finish.
- [x] **Code↔English translation** — computeArtifacts (screen 2), verdict block (screen 5); hooks.json as a translation or annotated block (screen 3).
- [x] **Quiz** — 3-4 questions, debugging scenarios: (1) "A lesson's progress file says `decked` but deck.html was never created. What happens when Claude tries to finish?" (blocked with a message naming the missing file); (2) "The gate script itself crashes halfway. Does Claude get to stop?" (no — a crash becomes a reported problem; the inspector fails closed); (3) "You open a random photos folder with no `topics/` anywhere and Claude finishes a rename job — does educate's gate interfere?" (no — resolves no roots, silent no-op); (4) "Could Claude talk its way past the gate with a really convincing summary?" (no — the gate never reads the conversation, only the disk).
- [x] **Visual ladder/step diagram** — the lesson lifecycle with evidence files per rung (screen 2 hero).
- [x] **Glossary tooltips** — gate, Stop hook, exit code, stderr (the error channel), stdin, deterministic, script, shell/bash, JSON (re-tooltip), artifact (a file that proves work happened), read-only.
- [x] **Callout boxes** — "The gate can't be sweet-talked" (deterministic vs. vibes); "Fails closed: a broken inspector halts the line rather than waving everything through."

## Reference Files to Read

- `references/interactive-elements.md` → "Message Flow / Data Flow Animation", "Code ↔ English Translation Blocks", "Multiple-Choice Quizzes", "Glossary Tooltips", "Callout Boxes", "Numbered Step Cards"
- `references/content-philosophy.md` → all
- `references/gotchas.md` → all (note flow-animation gotchas: `data-steps` must be valid JSON in a single attribute)

## Connections

- **Previous:** Module 1 (the five plugins, the loop, SPEC/findings at one-sentence level); Module 2 (plugin anatomy: SKILL.md prose-programs, gates/ + scripts/ folders, plugin.json, `lib/` chassis, `findRootUpwards`/`hasChild` walking up to `topics/`). You may rely on all of that.
- **Next:** Module 4 "Handoffs" — how educate mails a SPEC to build and why the gate demands handoff evidence. The failure message on screen 5/6 mentioning `handoff.foldedIn` is the perfect cliffhanger.
- **Tone note:** exit codes are this module's one big new mechanical concept — land them well; modules 5-6 assume them.
