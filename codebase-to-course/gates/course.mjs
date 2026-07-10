// course.mjs — read-only output gate for a built codebase-to-course course (SKILL.md Phase 4).
//
// Checks the assembled index.html: it exists, is self-contained (lib/selfcontained.mjs;
// Google Fonts is the ONE allowed external host), nav dots match module count, every module
// carries >=1 quiz and >=1 code translation block, the course as a whole has >=1 group
// chat and >=1 flow animation, every translation block honors the pairing + bracket-balance
// contracts, and the vendored chrome carries the current version stamp.
// Never writes to disk (gates/ contract).
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { checkHtml } from "../lib/selfcontained.mjs";
import { checkTranslationBlocks, checkChrome } from "../skills/codebase-to-course/references/validate.mjs";

const GOOGLE_FONTS = /https?:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com)[^'")\s>]*/gi;
// Any of these container classes counts as a quiz (multiple-choice, drag-and-drop,
// spot-the-bug, scenario — per SKILL.md "any quiz type counts").
const QUIZ_CLASSES = ["quiz-container", "dnd-container", "bug-challenge", "scenario-block"];

const count = (html, marker) => html.split(marker).length - 1;
const hasAny = (html, classes) => classes.some((c) => html.includes(`class="${c}`));

/** Gate a built course directory. Returns { ok, fails, warns, modules }. */
export function validateCourse(courseDir) {
  const fails = [], warns = [];
  const indexPath = join(courseDir, "index.html");
  if (!existsSync(indexPath)) {
    return { ok: false, fails: [`no index.html in ${courseDir} — run build.sh to assemble the course`], warns, modules: 0 };
  }
  const html = readFileSync(indexPath, "utf8");

  // Self-contained, with Google Fonts masked out first — it is the one allowed external.
  const sc = checkHtml(html.replaceAll(GOOGLE_FONTS, "allowed-google-fonts"));
  fails.push(...sc.fails); // sc.warns are artifact-page guidance (data table etc.) — not course concerns

  const moduleChunks = html.split(/<section[^>]+class="module[\s"]/).slice(1);
  const modules = moduleChunks.length;
  const dots = count(html, 'class="nav-dot"');
  if (modules === 0) fails.push('no <section class="module"> found — the course has no modules');
  if (dots !== modules) fails.push(`nav dots (${dots}) != modules (${modules}) — fix NAV_DOTS in _base.html and rebuild`);

  moduleChunks.forEach((chunk, i) => {
    if (!hasAny(chunk, QUIZ_CLASSES)) fails.push(`module ${i + 1} has no quiz (need one of: ${QUIZ_CLASSES.join(", ")})`);
    if (!chunk.includes('class="translation-block')) fails.push(`module ${i + 1} has no code translation block (.translation-block)`);
  });

  if (!html.includes('class="chat-window')) fails.push("course has no group chat animation (.chat-window) — at least one is mandatory");
  if (!html.includes('class="flow-animation')) fails.push("course has no flow animation (.flow-animation) — at least one is mandatory");

  // Translation-block contracts (same checks build.sh runs pre-assembly via the
  // course's copied validate.mjs): 1:1 .tl/.code-line pairing + bracket balance.
  fails.push(...checkTranslationBlocks(html, "index.html").fails);

  // Vendored chrome must match the plugin's generation — unstamped (v1) or
  // mixed-version chrome is the fossilization this gate exists to catch.
  fails.push(...checkChrome(courseDir));

  return { ok: fails.length === 0, fails, warns, modules };
}
