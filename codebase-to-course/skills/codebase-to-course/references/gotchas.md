# Gotchas — Common Failure Points

> **When to read this:** During Phase 3 (writing module HTML) and Phase 4 (review). Check every one of these before considering a course complete.

These are real problems encountered when building courses. Check every one before considering a course complete.

### Tooltip Clipping
Translation blocks use `overflow: hidden` for code wrapping. If tooltips use `position: absolute` inside the term element, they get clipped by the container. **Fix:** Tooltips must use `position: fixed` and be appended to `document.body`. Calculate position from `getBoundingClientRect()`. This is already handled by `main.js` but is the #1 bug that appears in every build.

### Not Enough Tooltips
The most common failure is under-tooltipping. Non-technical learners don't know terms like REPL, JSON, flag, entry point, PATH, pip, namespace, function, class, module, PR, E2E, or even software names like Blender/GIMP. **Rule of thumb:** if a term wouldn't appear in everyday conversation with a non-technical friend, tooltip it. Err heavily on the side of too many. BUT: don't tooltip terms the user already knows well from their domain (e.g., AI/ML concepts for someone in AI).

### Walls of Text
The course looks like a textbook instead of an infographic. This happens when you write more than 2-3 sentences in a row without a visual break. Every screen must be at least 50% visual. Convert any list of 3+ items into cards, any sequence into step cards or flow diagrams, any code explanation into a code↔English translation block.

### Recycled Metaphors
Using "restaurant" or "kitchen" for everything. Every module needs its own metaphor that feels inevitable for that specific concept. If you catch yourself reaching for the same metaphor twice, stop and find one that fits the concept organically.

### Code Modifications
Trimming, simplifying, or "cleaning up" code snippets from the codebase. The learner should be able to open the real file and see the exact same code. Instead of editing code to be shorter, *choose* naturally short snippets (5-10 lines) from the codebase that illustrate the point. When a snippet genuinely must skip material, don't rewrite the code — elide from within per the next gotcha.

### Truncated Code Blocks (Unbalanced Brackets)
A translation block whose code stops mid-structure — opened `(`/`[`/`{` never closed, or a stray leading `}` from a mid-function cut — reads as *broken* to anyone who knows code. Never end an excerpt mid-structure. Skip material from **within** the block instead: a `// … <short note on what's skipped> …` comment code-line (with its own paired `.tl` note) where the elided code was, and keep every closing bracket. `validate.mjs` enforces this — `build.sh` and the course gate both fail on unbalanced blocks. `node validate.mjs --fix modules/*.html` mechanically appends missing closers (plus paired notes); truly fragmentary pseudo-code can opt out with `data-validate="off"` on the block, but reserve that for pseudo-code, never real source.

### Stale Chrome (Check the Version Stamp)
`styles.css` and `main.js` open with a version stamp (`chrome v2 — inline translation engine (comments-on-top)`). A vendored copy with **no** stamp is v1 — the retired side-by-side renderer — and will silently ignore the inline contract. Never treat an existing course's chrome as the template; the plugin's `references/` is the only legitimate source. The check is automatic now: `build.sh` and the course gate fail unstamped or version-mixed chrome, and when `CLAUDE_PLUGIN_ROOT` (or `C2C_REFERENCES`) is set, `build.sh` refreshes the chrome from `references/` before every build. **Upgrade recipe for an existing course:** copy `styles.css`, `main.js`, `build.sh`, and `validate.mjs` from `references/` over the course directory, run `bash build.sh` (validates every translation block, then reassembles `index.html`), fix anything flagged, and re-run the course gate.

### Quiz Questions That Test Memory
Asking "What does API stand for?" or "Which file handles X?" — those test recall, not understanding. Every quiz question should present a new scenario the learner hasn't seen and ask them to *apply* what they learned.

### Scroll-Snap Mandatory
Using `scroll-snap-type: y mandatory` traps users inside long modules. Always use `proximity`.

### Module Quality Degradation
Trying to write all modules in one pass causes later modules to be thin and rushed. Build one module at a time and verify each before moving on. For complex codebases, use the parallel path with module briefs.

### Missing Interactive Elements
A module with only text and code blocks, no interactivity. Every module needs at least one of: quiz, data flow animation, group chat, architecture diagram, drag-and-drop. These aren't decorations — they're how non-technical learners actually process information.

### Hardcoded Light-Only Colors (Breaks Dark Mode)
The design system ships with a dark theme (`:root[data-theme="dark"]` in `styles.css`; toggle + system detection handled by `main.js`). It works by overriding tokens — so it only works if module HTML uses tokens. Never write inline styles with hardcoded light-only values like `background: #FFF`, `color: #2C2A28`, or pastel hexes; use `var(--color-surface)`, `var(--color-text)`, `var(--color-accent-light)`, etc. If you need a tint of an accent or semantic color, use `color-mix(in srgb, var(--color-accent) 15%, transparent)` rather than a baked-in pastel hex. Verify every module in both themes before calling it done (the nav has a 🌙/☀️ toggle).
