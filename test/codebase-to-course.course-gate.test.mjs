// codebase-to-course.course-gate.test.mjs — the course output gate against a minimal fixture.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { validateCourse } from "../codebase-to-course/gates/course.mjs";
import { CHROME_VERSION } from "../codebase-to-course/skills/codebase-to-course/references/validate.mjs";

const quiz = '<div class="quiz-container" id="q"></div>';
// Minimal contract-honoring block: 1:1 .tl/.code-line pairing, balanced brackets.
const translation =
  '<div class="translation-block"><div class="translation-code"><pre><code>\n' +
  '<span class="code-line">start();</span>\n' +
  '</code></pre></div><div class="translation-english"><div class="translation-lines">' +
  '<p class="tl">Kick things off.</p></div></div></div>';

function module_(n, extra = "") {
  return `<section class="module" id="module-${n}">${quiz}${translation}${extra}</section>`;
}

function courseHtml({ modules = 2, dots = modules, chat = true, flow = true, external = "" } = {}) {
  const navDots = Array.from({ length: dots }, (_, i) => `<button class="nav-dot" data-target="module-${i + 1}"></button>`).join("");
  const body = Array.from({ length: modules }, (_, i) =>
    module_(i + 1, i === 0 ? `${chat ? '<div class="chat-window" id="c"></div>' : ""}${flow ? '<div class="flow-animation" data-steps=\'[]\'></div>' : ""}` : "")
  ).join("\n");
  return `<!doctype html><html><head><title>Fixture Course</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans">
<link rel="stylesheet" href="styles.css">${external}</head>
<body><nav>${navDots}</nav>${body}<script src="main.js"></script></body></html>`;
}

function makeCourse(html, { chromeStamp = `chrome v${CHROME_VERSION} — inline translation engine` } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "c2c-test-"));
  if (html !== null) writeFileSync(join(dir, "index.html"), html);
  const header = chromeStamp === null ? "" : `/* ${chromeStamp} */\n`;
  writeFileSync(join(dir, "styles.css"), `${header}body { margin: 0; }`);
  writeFileSync(join(dir, "main.js"), `${header}(function () {})();`);
  return dir;
}

test("course gate: complete fixture passes, Google Fonts allowed", (t) => {
  const dir = makeCourse(courseHtml());
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const r = validateCourse(dir);
  assert.equal(r.fails.length, 0, JSON.stringify(r.fails));
  assert.equal(r.modules, 2);
  assert.ok(r.ok);
});

test("course gate: missing index.html fails with a build hint", (t) => {
  const dir = makeCourse(null);
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const r = validateCourse(dir);
  assert.ok(!r.ok);
  assert.ok(r.fails[0].includes("build.sh"), r.fails[0]);
});

test("course gate: a non-Google-Fonts external load fails", (t) => {
  const dir = makeCourse(courseHtml({ external: '<script src="https://cdn.example.com/x.js"></script>' }));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const r = validateCourse(dir);
  assert.ok(r.fails.some((f) => f.includes("external")), JSON.stringify(r.fails));
});

test("course gate: nav dot / module count mismatch fails", (t) => {
  const dir = makeCourse(courseHtml({ modules: 3, dots: 2 }));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const r = validateCourse(dir);
  assert.ok(r.fails.some((f) => f.includes("nav dots (2) != modules (3)")), JSON.stringify(r.fails));
});

test("course gate: a module without quiz or translation fails; any quiz type counts", (t) => {
  const bare = courseHtml({ modules: 1 }).replace(quiz + translation, '<div class="dnd-container"></div>');
  const dir = makeCourse(bare);
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const r = validateCourse(dir);
  assert.ok(!r.fails.some((f) => f.includes("no quiz")), "dnd-container should count as a quiz");
  assert.ok(r.fails.some((f) => f.includes("no code translation")), JSON.stringify(r.fails));
});

test("course gate: missing group chat and flow animation fail course-wide", (t) => {
  const dir = makeCourse(courseHtml({ chat: false, flow: false }));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const r = validateCourse(dir);
  assert.ok(r.fails.some((f) => f.includes("group chat")), JSON.stringify(r.fails));
  assert.ok(r.fails.some((f) => f.includes("flow animation")), JSON.stringify(r.fails));
});

test("course gate: a translation block with unbalanced code fails", (t) => {
  const broken = courseHtml().replaceAll(
    '<span class="code-line">start();</span>',
    '<span class="code-line">register(handlers, {</span>'
  );
  const dir = makeCourse(broken);
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const r = validateCourse(dir);
  assert.ok(r.fails.some((f) => f.includes("never closed")), JSON.stringify(r.fails));
});

test("course gate: a .tl/.code-line pairing mismatch fails", (t) => {
  const mismatched = courseHtml().replaceAll(
    '<p class="tl">Kick things off.</p>',
    '<p class="tl">Kick things off.</p><p class="tl">One note too many.</p>'
  );
  const dir = makeCourse(mismatched);
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const r = validateCourse(dir);
  assert.ok(r.fails.some((f) => f.includes(".code-line vs")), JSON.stringify(r.fails));
});

test("course gate: unstamped chrome fails as v1 with the upgrade recipe named", (t) => {
  const dir = makeCourse(courseHtml(), { chromeStamp: null });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const r = validateCourse(dir);
  assert.ok(r.fails.some((f) => f.includes("no chrome version stamp")), JSON.stringify(r.fails));
  assert.ok(r.fails.some((f) => f.includes("Stale Chrome")), JSON.stringify(r.fails));
});

test("course gate: version-mixed chrome fails", (t) => {
  const dir = makeCourse(courseHtml(), { chromeStamp: "chrome v1 — side-by-side" });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const r = validateCourse(dir);
  assert.ok(r.fails.some((f) => f.includes("mixed chrome")), JSON.stringify(r.fails));
});
