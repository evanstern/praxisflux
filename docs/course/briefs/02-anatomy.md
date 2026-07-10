# Module 2: Anatomy of a Plugin — The Program Is Written in English

Module file to write: `modules/02-anatomy.html` — a single `<section class="module" id="module-2">` block (even module: add class `module-alt` for the alternate background). ~6 screens.

## Course-wide context (same in every brief)

- **Course:** "Inside praxis — Prompts, Gates & Handoffs" — teaches the praxis repo, a Claude Code plugin marketplace: five plugins (research, grounding-wiki, educate, build, codebase-to-course) forming a research → teach → build loop on a shared chassis of tiny Node.js modules (`lib/`). Plugins never call each other — they compose through files and gates.
- **Learner:** a "vibe coder," zero CS background assumed. Tooltip every technical term aggressively. Tone: smart friend.
- **Accent color:** teal. Plugins by lowercase name. The AI is "Claude" / "Claude Code".

## Teaching Arc

- **Metaphor:** a cordless power-tool platform. One battery system (the shared chassis, `lib/`) powers many different tools (the plugins). Each tool box contains: the tool head (skills — instruction documents), a label on the box (plugin.json — the manifest), an inspector's checklist (gates — small read-only checker programs; teased here, starring in Module 3), and starter jigs/templates it leaves in your workshop. The surprise inside the box: the "tool head" is a *written manual the AI follows*, not machinery.
- **Opening hook:** "Open the educate plugin's folder expecting thousands of lines of code. You'll find something stranger: the main program is a 133-line English document." (True: `educate/skills/lesson/SKILL.md` is 133 lines of prose.)
- **Key insight:** in AI-native software, carefully engineered English prose IS source code — version-controlled, reviewed, even tested. The JavaScript that ships alongside it is small and exists mostly to *check the AI's work*, not to do the work.
- **Why should I care?** When you write instructions for an AI tool (a custom prompt, a CLAUDE.md, a workflow), you are programming. Praxis shows what disciplined prompt-programming looks like: one job per document, explicit triggers, deterministic code only where trust matters. Also teaches you to *navigate* any plugin/AI project you download.

## Screens (suggested)

1. **Hook** — the 133-line English program. What "the code is prose" means.
2. **The tour** — hero: visual file tree of the educate plugin folder, annotated (`.claude-plugin/plugin.json` = the label on the box · `skills/lesson/SKILL.md`, `skills/start/SKILL.md` = the manuals Claude follows · `gates/dod.mjs` = the inspector's checklist (Module 3) · `scripts/` = the wiring that runs the inspector · `templates/` = starter files it plants in your project · `hooks/hooks.json` = "run my inspector when Claude finishes" — one-line tease).
3. **A skill up close** — code↔English translation of the implement skill's frontmatter: the description is simultaneously documentation, the trigger phrase list, AND a turf declaration ("This plugin OWNS the implementation leg").
4. **The shared battery** — `lib/`: nine tiny files, 455 lines total, zero downloaded dependencies; every plugin snaps onto it. Icon-label rows or small cards for a few modules (project-root = "find where the project lives", lifecycle = "status can't exceed proof" (Module 3), handoff = "the mail system" (Module 4), installer = "plant starter files honestly").
5. **How a plugin finds home** — two placement models, code↔English translation of `hasChild` + `findRootUpwards`: educate walks UP the folders looking for a `topics/` landmark; research walks DOWN finding every folder marked `.research-vault`. (Like git finding your repo from any subfolder.)
6. **Quiz** — drag-and-drop matching + or a 3-question quiz.

## Code Snippets (pre-extracted — use verbatim, never edit)

File: `build/skills/implement/SKILL.md` (lines 1-4), language `yaml`:
```yaml
---
name: implement
description: Implement a build SPEC handed off from a learning lesson (or any producer), verify it works, and return findings for the lesson to fold back in. Use when a lesson has handed off a SPEC to build, when the user says "run build", "/build-me", "build the spec", or points at a pending handoff request. This plugin OWNS the implementation leg — educate teaches and authors the SPEC; build implements it and returns what it learned.
---
```

File: `educate/.claude-plugin/plugin.json` (lines 1-7), language `json`:
```json
{
  "name": "educate",
  "version": "0.1.0",
  "description": "Turn a folder into a Socratic learning project: teach, author a build SPEC, and gate each lesson done on auditable artifacts.",
  "author": { "name": "Evan Stern", "email": "evanmicahstern@gmail.com" },
  "keywords": ["learning", "teach-me", "socratic", "curriculum", "orchestration"]
}
```

File: `lib/project-root.mjs` (lines 12-15), language `javascript`:
```javascript
/** A marker function: presence of a child file/dir named `name`. */
export function hasChild(name) {
  return (dir) => existsSync(join(dir, name));
}
```

File: `lib/project-root.mjs` (lines 21-29), language `javascript`:
```javascript
export function findRootUpwards(startDir, markerFn) {
  let dir = resolve(startDir);
  const { root: fsRoot } = parse(dir);
  for (;;) {
    if (markerFn(dir)) return dir;
    if (dir === fsRoot) return null;
    dir = dirname(dir);
  }
}
```
Translation angles: `hasChild("topics")` manufactures a little checker function — "does this folder contain something named topics?"; `findRootUpwards` keeps asking "is this the project's home?" and steps up to the parent folder until it finds the landmark or hits the top of the disk.

File tree data for screen 2 (real structure of `educate/`):
```
educate/
├── .claude-plugin/plugin.json
├── hooks/hooks.json
├── skills/
│   ├── lesson/SKILL.md    (133 lines)
│   └── start/SKILL.md     (84 lines)
├── gates/
│   ├── dod.mjs
│   └── wiki.mjs
├── scripts/
│   ├── gate.sh · stop.mjs · progress.mjs · wiki.mjs
└── templates/
    ├── CLAUDE.md · progress.schema.json
    └── .template/  (checklist.md, raw-notes.md)
```

Fact for screen 4 (from the chassis): `lib/` is nine files, 455 lines total, none over 81 lines, using nothing but what ships with Node.js (zero downloaded dependencies). At packaging time the whole `lib/` folder is *copied into* each plugin so every installed plugin is self-contained (one-sentence tease — Module 5 owns this).

One more real detail for screen 2 or 3: plugins have no "always-on" slot — their skills load lazily — so a plugin that needs standing rules **plants a project CLAUDE.md** into your folder via its start skill (that's what `templates/CLAUDE.md` is for; tooltip CLAUDE.md: a notes file Claude automatically reads at the start of every session in that folder).

## Interactive Elements

- [x] **Code↔English translation** — the SKILL.md frontmatter (screen 3) and the project-root pair (screen 5). plugin.json can be a translation block or an annotated code card.
- [x] **Drag-and-drop** — items: `SKILL.md`, `plugin.json`, `gates/dod.mjs`, `templates/CLAUDE.md`, `lib/`; targets: "The manual Claude follows", "The label on the box", "The inspector's checklist", "Standing rules planted in your project", "The shared battery every plugin snaps onto".
- [x] **Quiz** — 2-3 questions if room, e.g.: "You downloaded a new praxis-style plugin and want to know what phrases wake it up — where do you look?" (the skill's description frontmatter); "You're 5 folders deep inside a learning project and ask Claude to resume the lesson — how does educate find the project root?" (walks up until it sees `topics/`).
- [x] **Visual file tree** — hero of screen 2.
- [x] **Icon-label rows / cards** — the lib/ modules (screen 4).
- [x] **Glossary tooltips** — frontmatter, manifest, YAML, dependency, function, directory/folder tree, root, CLAUDE.md, sentinel/marker, zero-dependency, source code, version control. (Terms from module 1 — plugin, skill, marketplace — may be reused without re-explaining, but re-tooltip on first use in this module.)
- [x] **Callout box** — "455 lines run five plugins. Infrastructure doesn't have to be huge — every one of the nine shared files is smaller than this page's HTML."

## Reference Files to Read

- `references/interactive-elements.md` → "Visual File Tree", "Code ↔ English Translation Blocks", "Drag-and-Drop Matching", "Multiple-Choice Quizzes", "Icon-Label Rows", "Glossary Tooltips", "Callout Boxes"
- `references/content-philosophy.md` → all
- `references/gotchas.md` → all

## Connections

- **Previous:** Module 1 covered: what praxis is, the five plugins and their roles, the loop (SPEC → build → findings), plugins are independently installable and compose through files. Taught tooltips: plugin, marketplace, skill, SPEC, corpus, Claude Code.
- **Next:** Module 3 "Gates: The Inspector" — how the little JavaScript checkers physically stop Claude from declaring work done that isn't. Screen 2's `gates/` + `hooks/` annotations should point forward to it.
- **Tone note:** keep gates to teasers; do not explain exit codes or the Stop hook here.
