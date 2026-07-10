# Module 5: One Copy Everywhere — Every Truck Carries Its Own Generator

Module file to write: `modules/05-one-copy.html` — a single `<section class="module" id="module-5">` block (odd module: default background). ~5 screens.

## Course-wide context (same in every brief)

- **Course:** "Inside praxis — Prompts, Gates & Handoffs" — teaches the praxis repo, a Claude Code plugin marketplace: five plugins on a shared chassis (`lib/`), composing only through files and gates.
- **Learner:** a "vibe coder," zero CS background. Tooltip aggressively. Tone: smart friend.
- **Accent color:** teal. Plugins by lowercase name.

## Teaching Arc

- **Metaphor:** a food-truck fleet. During development all trucks park at one depot and plug into the depot's power (the repo-root `lib/`). But a truck that *ships out* can't drag an extension cord back to the depot — so at packaging time each truck gets its **own generator installed** (a full copy of `lib/`) and a **photocopy of the master recipe binder** (shared content). And because photocopies drift, a robot compares every truck's binder to the master **every night** — drift fails the check before the truck ever leaves.
- **Opening hook:** "Every programmer is taught 'never copy-paste code — share it.' Praxis deliberately copies its shared code into all five plugins. On purpose. And it's the right call." A rule-breaking hook lands great after four modules of rules.
- **Key insight:** duplication isn't the sin — **unchecked** duplication is. Praxis shares the *source of truth* (one canonical `lib/`), duplicates the *shipped artifact* (each plugin carries its own copy), and pays for it with robots that verify the copies can never drift.
- **Why should I care?** "Should this be shared or copied?" is one of the most common architecture questions you'll ever put to an AI assistant — now you can steer it: share the source, vendor the artifact, and demand an automated drift check. Also explains why your `node_modules`-style installs are so big — self-containment costs disk and buys reliability.

## Screens (suggested)

1. **Hook** — the forbidden thing done on purpose. Set up dev-mode vs shipped-mode.
2. **Vendoring** — hero: side-by-side file trees, development vs. packaged (below). Code↔English of the packaging loop: copy plugin, copy `lib/` inside it, rewrite the import paths (`../../lib/` → `../lib/`) because the shared folder now lives one level closer.
3. **The nightly binder check** — some shared content must live as a literal copy *inside* consumer files (a planted template can't reach out and import at runtime). `sync-shared.mjs` stamps marked regions from the canonical source into every consumer; a test compares them, so hand-edited drift fails the pre-commit check (tooltip: a check that runs before every save-point). Code↔English of `extractRegion`.
4. **Self-contained all the way down** — the same philosophy applies to the HTML the plugins *produce*: pages are published to a host whose security policy blocks all outside connections, so a shared checker scans for anything that phones home. Code↔English of `checkHtml`. Meta-beat: THIS course page passed a version of that check (its one documented exception: Google Fonts).
5. **Quiz** — 3 questions. (Optional half-screen before it: the toolkit — shared *content* modules like pedagogy and tooltip snippets ride along in `lib/toolkit/`, and every skill that uses one must state a fallback and still work without it — "graceful degradation.")

## Code Snippets (pre-extracted — use verbatim, never edit)

File: `scripts/build.mjs` (lines 50-57), language `javascript`:
```javascript
for (const plugin of targets) {
  const src = join(repo, plugin), out = join(dist, plugin);
  if (!existsSync(src)) { console.error(`no such plugin: ${plugin}`); process.exit(1); }
  cpSync(src, out, { recursive: true });                 // plugin sources
  cpSync(join(repo, "lib"), join(out, "lib"), { recursive: true }); // vendor the chassis
  rewriteLibImports(out);                                // ../../lib → ../lib
  console.log(`packaged ${plugin} → dist/${plugin} (lib vendored, imports rewritten)`);
}
```
Translation: for each plugin — copy its folder into the shipping area, copy the entire shared chassis *inside* it (install the generator), then fix up every "where do I find the shared code?" path, because the shared code now lives inside the truck instead of back at the depot.

File: `scripts/build.mjs` (lines 23-33), language `javascript`:
```javascript
function rewriteLibImports(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "lib") rewriteLibImports(p); continue; }
    if (extname(p) === ".mjs") {
      const s = readFileSync(p, "utf8");
      const r = s.replaceAll("../../lib/", "../lib/");
      if (r !== s) writeFileSync(p, r);
    }
  }
}
```
Translation: walk every code file in the packaged plugin and replace "go up two folders to find lib" with "go up one" — a find-and-replace performed by code, at packaging time, so humans never maintain two versions of the paths.

File: `scripts/sync-shared.mjs` (lines 20-27), language `javascript`:
```javascript
export const SYNCS = [
  { source: "lib/html/base.html",
    regions: ["praxis:tokens", "praxis:theme"],
    consumers: ["educate/templates/.template/deck.html"] },
  { source: "lib/toolkit/tooltip.md",
    regions: ["praxis:tooltip-css", "praxis:tooltip-js"],
    consumers: ["educate/templates/.template/deck.html"] },
];
```
Translation: the master list of "what gets photocopied where": this region of that canonical file must appear, byte-for-byte, inside these consumer files.

File: `scripts/sync-shared.mjs` (lines 29-34), language `javascript`:
```javascript
/** The text between the `<name>:start` and `<name>:end` marker lines (markers excluded). */
export function extractRegion(text, name) {
  const re = new RegExp(`^.*${name}:start.*$\\n([\\s\\S]*?)^.*${name}:end.*$`, "m");
  const m = text.match(re);
  return m ? m[1] : null;
}
```
Translation: both the master and every copy carry the same "start"/"end" marker lines around the shared block, so a program can cut the block out of each and compare. If a copy drifted, the check names the file and the fix ("run scripts/sync-shared.mjs").

File: `lib/selfcontained.mjs` (lines 22-29), language `javascript`:
```javascript
export function checkHtml(html, { substantialBytes = 6000 } = {}) {
  const fails = [], warns = [];
  if (!/<title>\s*\S/i.test(html)) fails.push("no <title> — the artifact needs a name");
  for (const [rx, label] of CHECKS) {
    if (rx.test(html)) {
      fails.push(`loads a resource from an external host: ${label} — the Artifact CSP blocks this; inline it or embed as a data: URI`);
    }
  }
```
Translation: scan a finished web page for eight forbidden patterns — scripts, fonts, images, or data fetched from the internet — because the publishing host blocks all outside connections, and a page that phones home would silently break. Each failure message even tells you the fix.

Side-by-side file-tree data (screen 2 hero):
```
DEVELOPMENT (the depot)          SHIPPED (dist/educate — self-contained)
praxis/                          dist/educate/
├── lib/          ← one copy     ├── lib/          ← its own copy
│   ├── gate-runner.mjs          │   ├── gate-runner.mjs
│   └── …                        │   └── …
├── educate/                     ├── skills/  gates/  scripts/
│   └── imports ../../lib/…      │   └── imports ../lib/…   ← rewritten
├── research/                    (research ships separately,
└── …                             with its own lib/ copy)
```

Real supporting facts: `lib/` is ~455 lines across nine files (Module 2 taught this — safe to reference). The drift comparison also runs as a test (`test/sync-shared.test.mjs`), so the pre-commit suite fails on drift. codebase-to-course keeps one documented exception to self-containment: Google Fonts.

## Interactive Elements

- [x] **Code↔English translation** — the packaging loop (screen 2), extractRegion or SYNCS (screen 3), checkHtml (screen 4). At least one must be a proper translation block; others may be annotated code.
- [x] **Quiz** — 3 questions: (1) "A bug is found in `gate-runner.mjs`. Where does the fix happen, and how do already-packaged plugins get it?" (fix once in repo-root lib/ — the source of truth; re-run packaging so each plugin gets a fresh vendored copy); (2) "You hand-tweak the tooltip CSS inside educate's deck template to 'improve' it. What catches you?" (the drift check/test — the region no longer matches the canonical source; the fix command is named in the failure); (3) "Your AI assistant proposes having the educate plugin import code directly from the installed research plugin at runtime. Based on this repo's philosophy, what's wrong?" (plugins must stay independently installable/self-contained; share via the build step or files, never a live wire between plugins).
- [x] **Side-by-side comparison** — dev vs shipped trees (screen 2 hero).
- [x] **Glossary tooltips** — vendoring, import, artifact (shipped file — note different sense from Module 3's evidence-artifact; the course has used both, disambiguate honestly), pre-commit hook, drift, canonical/source of truth, CSP/security policy, CDN, data: URI, regular expression (a search pattern for text), self-contained.
- [x] **Callout boxes** — "The sin isn't duplication — it's unchecked duplication"; "Same philosophy, three layers: plugins ship self-contained, shared regions are robot-stamped copies, and even the HTML output must carry everything it needs."

## Reference Files to Read

- `references/interactive-elements.md` → "Code ↔ English Translation Blocks", "Multiple-Choice Quizzes", "Visual File Tree", "Glossary Tooltips", "Callout Boxes", "Pattern/Feature Cards"
- `references/content-philosophy.md` → all
- `references/gotchas.md` → all

## Connections

- **Previous:** Module 1 (five plugins, independently installable), Module 2 (the `lib/` chassis, nine files/455 lines, "vendored" teased), Module 3 (gates, exit codes, tests exist), Module 4 (handoffs, evidence, the installer adding gitignore entries). All fair game.
- **Next:** Module 6 "Staying True" — the last enemy: time. Code changes and documentation silently rots; praxis pins notes to commits and lets git prove staleness. Tease: "copies drifting in *space* are solved. What about truth drifting in *time*?"
- **Tone note:** this is the contrarian module — lean into the "breaking the rule you were taught" energy, then resolve it with the checked-duplication insight.
