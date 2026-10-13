// Browser driver. Detection order
// per a browser-driver investigation
// (2026-10-07), confirmed by a real measurement run on this machine
// : full Chromium-family
// browsers hang under `--headless=new` on current macOS (Darwin 25);
// `chrome-headless-shell` works (40/40 correct measurements, 6/6 exact-size
// screenshots, ~150ms/run; dark mode via `--blink-settings=
// preferredColorScheme=0`, not `--force-dark-mode`; the measuring script
// must settle on a timer, not requestAnimationFrame, which never fires
// before `--dump-dom` in headless-shell).
//
//   1. `playwright` importable (dynamic `import("playwright")` — local or
//      global resolution, never a package.json dependency) → launched with
//      `executablePath` of the first found of: chrome-headless-shell, an
//      installed Chromium-family browser, else Playwright's own bundled
//      Chromium.
//   2. no Playwright (or it failed to launch/respond): `chrome-headless-shell`
//      CLI — found via `EXPLAINER_BROWSER`, PATH, Playwright's cache, or the
//      `@puppeteer/browsers` cache.
//   3. no headless-shell: a full Chromium-family browser's CLI with
//      `--headless=new` — last resort; testing found these hang on this macOS.
//   4. none respond: `{ available: false }` — every `browser.*` check is
//      reported `skipped`, never `passed`.
//
// Every real browser invocation (detection probes and real check runs alike)
// goes through `spawnWithTimeout`, which enforces a hard kill timeout
// (default 15000ms, `EXPLAINER_BROWSER_TIMEOUT_MS`) and kills the whole
// process tree (a detached process group on POSIX, `taskkill /T` on
// Windows) plus a `pkill -9 -f <profile-dir>` sweep — testing found that a
// Chromium-family browser forks GPU/renderer/utility helpers that keep the
// stdout pipe open after the main process is killed, and that a profile-dir
// sweep is required to avoid leaking them. A timed-out driver is reported
// unavailable and detection falls through to the next one; if nothing
// responds, the reason names it: "browser did not respond ...".
// `EXPLAINER_NO_BROWSER=1` forces `available: false` unconditionally (tests).
//
// One measuring script (`MEASURE_SCRIPT_SOURCE`, a JS function-expression
// source string) is shared by both drivers: Playwright evaluates it directly
// in-page (`page.evaluate`); the CLI drivers get it injected as an inline
// `<script>` into a temp copy of the built dist tree (a `<pre id="ex-check">`
// node receives its `JSON.stringify`'d result, read back from `--dump-dom`'s
// serialized DOM — the CLI can't otherwise retrieve a JS value).

import { execFileSync, spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const BROWSER_CHECK_IDS = ["browser.phone-scroll", "browser.svg-overflow", "browser.themes"];

const DEFAULT_TIMEOUT_MS = 15000;
const PLAYWRIGHT_BUNDLED_MARKER = "(playwright-bundled)";
const SCREENSHOT_HEIGHT = 900;
const WIDTHS = [1280, 400];
const THEMES = ["light", "dark"];

// ------------------------------------------------------------- measuring script
// Shared by both drivers (see header comment). A function-expression source
// string: Playwright's `page.evaluate(source)` invokes a function expression
// with no args and awaits the promise it returns; the CLI wrapper below
// calls it the same way and serializes the result into the DOM instead.
//
// "every SVG text bbox inside its parent shape or the viewBox" (FR of this
// dispatch; refined 2026-10-07 after a real diagram-generator run flagged
// free-standing captions/labels placed *beside* a shape as false
// positives — "nearest sibling shape" assigned them to shapes they were
// never inside). The rule is now anchor-based: a `<text>`'s own anchor
// point — its `x`/`y` attribute (the first `<tspan>`'s, if the text itself
// has none — `textLines()` emits both; `getBBox()`'s origin as a last
// resort) — is tested against every shape (rect/circle/ellipse/polygon/
// polyline/path) *anywhere in the same `<svg>`*, not just a sibling. Only
// when the anchor point actually lies inside some shape's bbox is the
// text's own bbox checked against *that* shape; otherwise (a label sitting
// next to, not inside, any shape — e.g. a timeline caption beside its
// marker, a bar chart's category/value label beside its bar) it only has
// to fit the SVG's own viewBox.
export const MEASURE_SCRIPT_SOURCE = `(function measurePage() {
  function colorSchemeIsDark() {
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function viewBoxOf(svg) {
    var vb = svg.viewBox && svg.viewBox.baseVal;
    if (vb && (vb.width || vb.height)) {
      return { x: vb.x, y: vb.y, width: vb.width, height: vb.height };
    }
    var w = svg.width && svg.width.baseVal ? svg.width.baseVal.value : svg.clientWidth;
    var h = svg.height && svg.height.baseVal ? svg.height.baseVal.value : svg.clientHeight;
    return { x: 0, y: 0, width: w || 0, height: h || 0 };
  }
  function numAttr(el, name) {
    var v = el && el.getAttribute ? parseFloat(el.getAttribute(name)) : NaN;
    return isNaN(v) ? null : v;
  }
  function textAnchorPoint(text) {
    var x = numAttr(text, 'x');
    var y = numAttr(text, 'y');
    if (x !== null && y !== null) return { x: x, y: y };
    var tspan = text.querySelector('tspan');
    if (tspan) {
      x = numAttr(tspan, 'x');
      y = numAttr(tspan, 'y');
      if (x !== null && y !== null) return { x: x, y: y };
    }
    var bb = text.getBBox();
    return { x: bb.x, y: bb.y };
  }
  function pointInBox(pt, box) {
    return pt.x >= box.x - 0.5 && pt.x <= box.x + box.width + 0.5 && pt.y >= box.y - 0.5 && pt.y <= box.y + box.height + 0.5;
  }
  function svgOverflows() {
    var out = [];
    var texts = document.querySelectorAll('svg text');
    for (var i = 0; i < texts.length; i += 1) {
      var textEl = texts[i];
      var tb;
      try { tb = textEl.getBBox(); } catch (e) { continue; }
      var svgEl = textEl.ownerSVGElement;
      var anchor = textAnchorPoint(textEl);
      var box = null;
      if (svgEl) {
        var shapes = svgEl.querySelectorAll('rect, circle, ellipse, polygon, polyline, path');
        for (var j = 0; j < shapes.length; j += 1) {
          var sb;
          try { sb = shapes[j].getBBox(); } catch (e) { continue; }
          if (pointInBox(anchor, sb)) {
            box = sb;
            break;
          }
        }
      }
      if (!box) box = svgEl ? viewBoxOf(svgEl) : { x: 0, y: 0, width: 0, height: 0 };
      var overflows =
        tb.x < box.x - 0.5 ||
        tb.y < box.y - 0.5 ||
        tb.x + tb.width > box.x + box.width + 0.5 ||
        tb.y + tb.height > box.y + box.height + 0.5;
      out.push({ text: (textEl.textContent || '').trim(), overflows: overflows });
    }
    return out;
  }
  // a control that starts hidden (presenter.js's
  // badge/toggle/follow, ask.js's button — see core/patterns/presenter/
  // presenter.css, core/patterns/ask/ask.css) must actually render nothing
  // when no live wiring ever flips .hidden to false — a display rule on
  // the same selector can out-cascade the [hidden] UA style and make it
  // visible anyway (the real bug: .ex-presenter-badge's own "display:
  // inline-flex" had no [hidden] override). getComputedStyle + a real
  // client rect both have to agree the element renders nothing.
  // NOTE: no backtick characters in this comment block — it lives inside
  // MEASURE_SCRIPT_SOURCE's own outer template literal, and an unescaped
  // backtick here would prematurely close it.
  var HIDDEN_CONTROL_SELECTORS = ['.ex-presenter-badge', '.ex-presenter-toggle', '.ex-presenter-follow', '.ex-ask'];
  function hiddenButVisible() {
    var out = [];
    HIDDEN_CONTROL_SELECTORS.forEach(function (sel) {
      var els = document.querySelectorAll(sel);
      for (var i = 0; i < els.length; i += 1) {
        var el = els[i];
        if (!el.hidden) continue; // only elements the build/runtime marked hidden
        var cs = window.getComputedStyle(el);
        var rendersSomething = cs.display !== 'none' && el.getClientRects().length > 0;
        if (rendersSomething) out.push(sel);
      }
    });
    return out;
  }
  // Phone-scroll self-diagnosis: "page has horizontal
  // scroll at 400px width" alone never told a page-writer which element to
  // fix. This walks the rendered DOM and names the outermost element(s)
  // actually responsible: a non-clipped element whose own right edge is
  // past the viewport. "Outermost" (skip a flagged element's own flagged
  // descendants — table/thead/tr/th all flagging for the same one root
  // cause is noise, not five separate problems) and "non-clipped" (an
  // element with a scrolling ancestor — overflow-x auto/scroll/hidden — is
  // legitimately scrolling *inside* that ancestor; that's the whole point
  // of e.g. the table/code/diagram patterns' own scroll wrappers, not a
  // page-level overflow) both matter for signal-to-noise: without them,
  // every interior cell of an intentionally-scrollable wide table would
  // get reported as if it were its own distinct bug.
  function hasClippingAncestor(el) {
    var cur = el.parentElement;
    while (cur) {
      var cs = window.getComputedStyle(cur);
      if (cs.overflowX === 'auto' || cs.overflowX === 'scroll' || cs.overflowX === 'hidden') return true;
      cur = cur.parentElement;
    }
    return false;
  }
  function textSnippet(el, max) {
    return (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, max);
  }
  // The nearest "where am I on the page" marker for a writer to act on:
  // walks up from el, and at each level also checks every preceding
  // sibling (and anything nested in it) for the last heading it contains
  // — document order, nearest-first. Most page sections have no id of
  // their own (confirmed on the real artifact: only a handful of headings
  // carry one), so this reports the heading's own text alongside its id
  // (null when absent) rather than coming up empty for most pages.
  function nearestHeading(el) {
    var HEADING_RE = /^h[1-6]$/i;
    function headingInfo(h) {
      return { id: h.id || null, text: textSnippet(h, 80) };
    }
    var cur = el;
    while (cur) {
      if (HEADING_RE.test(cur.tagName)) return headingInfo(cur);
      var sib = cur.previousElementSibling;
      while (sib) {
        if (HEADING_RE.test(sib.tagName)) return headingInfo(sib);
        var nested = sib.querySelectorAll ? sib.querySelectorAll('h1, h2, h3, h4, h5, h6') : [];
        if (nested.length) return headingInfo(nested[nested.length - 1]);
        sib = sib.previousElementSibling;
      }
      cur = cur.parentElement;
    }
    return null;
  }
  function phoneScrollOffenders() {
    var clientWidth = document.documentElement.clientWidth;
    var collected = [];
    var all = document.body.querySelectorAll('*');
    for (var i = 0; i < all.length; i += 1) {
      var el = all[i];
      if (!el.getClientRects().length) continue; // not rendered (display:none ancestor, closed <details>, etc.)
      var r = el.getBoundingClientRect();
      if (r.right <= clientWidth + 1 || r.width <= 1) continue;
      if (hasClippingAncestor(el)) continue;
      var isDescendantOfCollected = false;
      for (var j = 0; j < collected.length; j += 1) {
        if (collected[j].el !== el && collected[j].el.contains(el)) {
          isDescendantOfCollected = true;
          break;
        }
      }
      if (isDescendantOfCollected) continue;
      collected.push({
        el: el,
        tag: el.tagName.toLowerCase(),
        classes: el.className && el.className.toString ? el.className.toString() : '',
        id: el.id || null,
        heading: nearestHeading(el),
        right: Math.round(r.right),
        text: textSnippet(el, 60)
      });
    }
    collected.sort(function (a, b) { return b.right - a.right; }); // worst (furthest past the edge) first
    return collected.slice(0, 5).map(function (c) {
      return { tag: c.tag, classes: c.classes, id: c.id, heading: c.heading, right: c.right, text: c.text };
    });
  }
  function measure() {
    var scrollWidth = document.documentElement.scrollWidth;
    var horizontalScroll = scrollWidth > window.innerWidth;
    return {
      innerWidth: window.innerWidth,
      scrollWidth: scrollWidth,
      horizontalScroll: horizontalScroll,
      prefersDark: colorSchemeIsDark(),
      svgOverflows: svgOverflows(),
      hiddenButVisible: hiddenButVisible(),
      phoneScrollOffenders: horizontalScroll ? phoneScrollOffenders() : []
    };
  }
  return new Promise(function (resolve) {
    function settle(cb) { setTimeout(cb, 50); } // not requestAnimationFrame — never fires before --dump-dom
    function run() { resolve(measure()); }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { settle(run); }, function () { settle(run); });
    } else {
      settle(run);
    }
  });
})`;

function injectMeasureScript(html) {
  const snippet =
    `\n<pre id="ex-check" style="display:none" aria-hidden="true">pending</pre>\n` +
    `<script>(function(){\n` +
    `  function start(){ (${MEASURE_SCRIPT_SOURCE})().then(function(r){\n` +
    `    var el = document.getElementById('ex-check');\n` +
    `    if (el) el.textContent = JSON.stringify(r);\n` +
    `  }); }\n` +
    `  if (document.readyState === 'complete') start(); else window.addEventListener('load', start);\n` +
    `})();</script>\n`;
  const idx = html.lastIndexOf("</body>");
  if (idx === -1) return html + snippet;
  return html.slice(0, idx) + snippet + html.slice(idx);
}

function decodeDumpDomEntities(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

// ----------------------------------------------------------- process utilities

function isExecutable(p) {
  try {
    fs.accessSync(p, fs.constants.X_OK);
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function findOnPath(names, env = process.env) {
  const pathEnv = env.PATH || env.Path || "";
  const dirs = pathEnv.split(path.delimiter).filter(Boolean);
  const exeNames = process.platform === "win32" ? names.flatMap((n) => [n, `${n}.exe`]) : names;
  for (const dir of dirs) {
    for (const name of exeNames) {
      const candidate = path.join(dir, name);
      if (isExecutable(candidate)) return candidate;
    }
  }
  return null;
}

function findFileRecursive(dir, name, depth) {
  if (depth < 0) return null;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const entry of entries) {
    if (entry.isFile() && entry.name === name) return path.join(dir, entry.name);
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const found = findFileRecursive(path.join(dir, entry.name), name, depth - 1);
      if (found) return found;
    }
  }
  return null;
}

function globCacheDirs(root, prefix) {
  let entries;
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.filter((e) => e.isDirectory() && e.name.startsWith(prefix)).map((e) => path.join(root, e.name));
}

/**
 * `chrome-headless-shell`, found via (in order): `EXPLAINER_BROWSER`, PATH,
 * Playwright's cache (`~/Library/Caches/ms-playwright` on macOS,
 * `~/.cache/ms-playwright` on Linux, `%LOCALAPPDATA%\ms-playwright` on
 * Windows), or the `@puppeteer/browsers` cache (`~/Library/Caches/puppeteer`,
 * `~/.cache/puppeteer`, `%LOCALAPPDATA%\puppeteer\Cache`).
 */
export function findHeadlessShellExecutable(env = process.env) {
  if (env.EXPLAINER_BROWSER && isExecutable(env.EXPLAINER_BROWSER)) return env.EXPLAINER_BROWSER;

  const onPath = findOnPath(["chrome-headless-shell"], env);
  if (onPath) return onPath;

  const exeName = process.platform === "win32" ? "chrome-headless-shell.exe" : "chrome-headless-shell";
  const home = os.homedir();
  const roots = [];
  if (process.platform === "darwin") {
    roots.push({ dir: path.join(home, "Library", "Caches", "ms-playwright"), prefix: "chromium_headless_shell-" });
    roots.push({ dir: path.join(home, "Library", "Caches", "puppeteer"), prefix: "chrome-headless-shell" });
  } else if (process.platform === "win32") {
    const localAppData = env.LOCALAPPDATA || path.join(home, "AppData", "Local");
    roots.push({ dir: path.join(localAppData, "ms-playwright"), prefix: "chromium_headless_shell-" });
    roots.push({ dir: path.join(localAppData, "puppeteer", "Cache"), prefix: "chrome-headless-shell" });
  } else {
    roots.push({ dir: path.join(home, ".cache", "ms-playwright"), prefix: "chromium_headless_shell-" });
    roots.push({ dir: path.join(home, ".cache", "puppeteer"), prefix: "chrome-headless-shell" });
  }

  for (const { dir, prefix } of roots) {
    for (const versionDir of globCacheDirs(dir, prefix)) {
      const found = findFileRecursive(versionDir, exeName, 3);
      if (found) return found;
    }
  }
  return null;
}

/** An installed Chromium-family browser (Chromium, Chrome, Edge, Brave) by OS. */
export function findChromiumFamilyExecutable(env = process.env) {
  if (process.platform === "darwin") {
    const candidates = [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    ];
    return candidates.find(isExecutable) || null;
  }
  if (process.platform === "win32") {
    const bases = [env["ProgramFiles"], env["ProgramFiles(x86)"], env["LOCALAPPDATA"]].filter(Boolean);
    const relPaths = [
      ["Google", "Chrome", "Application", "chrome.exe"],
      ["Chromium", "Application", "chrome.exe"],
      ["Microsoft", "Edge", "Application", "msedge.exe"],
      ["BraveSoftware", "Brave-Browser", "Application", "brave.exe"],
    ];
    for (const base of bases) {
      for (const rel of relPaths) {
        const candidate = path.join(base, ...rel);
        if (isExecutable(candidate)) return candidate;
      }
    }
    return null;
  }
  return findOnPath(["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "microsoft-edge", "microsoft-edge-stable", "brave-browser"], env);
}

function freshProfileDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "explainer-check-profile-"));
}

function killProfileStragglers(profileDir) {
  if (process.platform === "win32") return;
  try {
    execFileSync("pkill", ["-9", "-f", profileDir], { stdio: "ignore" });
  } catch {
    // pkill exits non-zero when nothing matched — fine.
  }
}

/**
 * Spawns `executablePath` with `args`, enforcing a hard kill timeout that
 * reclaims the whole process tree (a SIGTERM to the main PID
 * alone leaves GPU/renderer/utility helpers alive, holding stdout open).
 * Resolves `{ status, stdout, stderr, timedOut }` — never rejects.
 */
function spawnWithTimeout(executablePath, args, timeoutMs) {
  return new Promise((resolve) => {
    let settled = false;
    let child;
    try {
      child = spawn(executablePath, args, {
        stdio: ["ignore", "pipe", "pipe"],
        detached: process.platform !== "win32",
      });
    } catch (err) {
      resolve({ status: null, stdout: "", stderr: "", timedOut: false, spawnError: err });
      return;
    }
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += d;
    });
    child.stderr.on("data", (d) => {
      stderr += d;
    });
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        if (process.platform === "win32") {
          execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"]);
        } else {
          process.kill(-child.pid, "SIGKILL");
        }
      } catch {
        // best-effort
      }
      resolve({ status: null, stdout, stderr, timedOut: true });
    }, timeoutMs);
    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ status: null, stdout, stderr, timedOut: false, spawnError: err });
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ status: code, stdout, stderr, timedOut: false });
    });
  });
}

async function runCli(executablePath, args, timeoutMs, profileDir) {
  const result = await spawnWithTimeout(executablePath, args, timeoutMs);
  killProfileStragglers(profileDir);
  try {
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch {
    // best-effort
  }
  return result;
}

/** Flags per the browser-driver investigation: headless-shell needs no `--headless=new` (it's headless-only); full browsers do. */
function buildFlags({ kind, width, height, theme, profileDir }) {
  const flags = [
    "--no-first-run",
    "--no-default-browser-check",
    `--user-data-dir=${profileDir}`,
    `--window-size=${width},${height}`,
    "--virtual-time-budget=3000",
    `--blink-settings=preferredColorScheme=${theme === "dark" ? 0 : 1}`,
  ];
  if (kind === "cli") flags.unshift("--headless=new", "--disable-gpu");
  return flags;
}

async function measureCli({ driver, url, width, height, theme, timeoutMs }) {
  const profileDir = freshProfileDir();
  const args = [...buildFlags({ kind: driver.kind, width, height, theme, profileDir }), "--dump-dom", url];
  const result = await runCli(driver.executablePath, args, timeoutMs, profileDir);
  if (result.timedOut) return { ok: false, reason: `browser did not respond within ${timeoutMs}ms` };
  if (result.spawnError) return { ok: false, reason: `browser failed to launch: ${result.spawnError.message}` };
  const match = result.stdout.match(/<pre id="ex-check"[^>]*>([\s\S]*?)<\/pre>/);
  if (!match) return { ok: false, reason: `no measurement output found (exit ${result.status})` };
  try {
    return { ok: true, json: JSON.parse(decodeDumpDomEntities(match[1])) };
  } catch (err) {
    return { ok: false, reason: `could not parse measurement JSON: ${err.message}` };
  }
}

async function screenshotCli({ driver, url, width, height, theme, timeoutMs, outPath }) {
  const profileDir = freshProfileDir();
  const args = [...buildFlags({ kind: driver.kind, width, height, theme, profileDir }), `--screenshot=${outPath}`, url];
  const result = await runCli(driver.executablePath, args, timeoutMs, profileDir);
  if (result.timedOut) return { ok: false, reason: `browser did not respond within ${timeoutMs}ms` };
  if (result.spawnError) return { ok: false, reason: `browser failed to launch: ${result.spawnError.message}` };
  if (!fs.existsSync(outPath) || fs.statSync(outPath).size === 0) {
    return { ok: false, reason: `browser exited with status ${result.status} and produced no screenshot` };
  }
  return { ok: true };
}

/** A cheap `--version` check plus a real `--dump-dom` round trip on a static page (an isolation test) — availability means a real measurement works, not just that the binary exists. */
async function probeCliLaunch({ executablePath, kind, timeoutMs }) {
  const versionResult = spawnSync(executablePath, ["--version"], { encoding: "utf8", timeout: Math.min(timeoutMs, 5000) });
  if (versionResult.error || typeof versionResult.status !== "number" || versionResult.status !== 0) {
    return { ok: false, reason: `--version failed (${versionResult.error?.message || `exit ${versionResult.status}`})` };
  }
  const version = (versionResult.stdout || versionResult.stderr || "").trim() || "unknown";

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-check-probe-"));
  try {
    const probePage = path.join(tmpDir, "probe.html");
    fs.writeFileSync(probePage, `<!doctype html><html><body><pre id="ex-check">ok</pre></body></html>`);
    const profileDir = freshProfileDir();
    const args = [...buildFlags({ kind, width: 400, height: 300, theme: "light", profileDir }), "--dump-dom", `file://${probePage}`];
    const result = await runCli(executablePath, args, timeoutMs, profileDir);
    if (result.timedOut) return { ok: false, reason: `probe timed out after ${timeoutMs}ms` };
    if (!/id="ex-check"[^>]*>ok</.test(result.stdout)) return { ok: false, reason: `probe failed (exit ${result.status})` };
    return { ok: true, version };
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // best-effort
    }
  }
}

// --------------------------------------------------------------- playwright

async function defaultImportPlaywright() {
  return import("playwright");
}

function withTimeout(promise, timeoutMs, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function probePlaywrightLaunch({ playwrightModule, executablePath, timeoutMs }) {
  let browser;
  try {
    const launchOptions = { headless: true };
    if (executablePath) launchOptions.executablePath = executablePath;
    browser = await withTimeout(playwrightModule.chromium.launch(launchOptions), timeoutMs, "playwright launch");
    const page = await browser.newPage();
    const sum = await withTimeout(page.evaluate(() => 1 + 1), timeoutMs, "playwright evaluate");
    await page.close();
    if (sum !== 2) throw new Error("sanity evaluate returned an unexpected result");
    return { ok: true, version: typeof browser.version === "function" ? browser.version() : "unknown" };
  } catch (err) {
    return { ok: false, reason: err.message };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

async function tryDetectPlaywright({ env, timeoutMs, importPlaywright }) {
  let playwrightModule;
  try {
    playwrightModule = await importPlaywright();
  } catch {
    return null;
  }
  if (!playwrightModule || !playwrightModule.chromium) return null;

  const headlessShellPath = findHeadlessShellExecutable(env);
  const chromiumFamilyPath = headlessShellPath ? null : findChromiumFamilyExecutable(env);
  const executablePath = headlessShellPath || chromiumFamilyPath || null;

  const probe = await probePlaywrightLaunch({ playwrightModule, executablePath, timeoutMs });
  if (!probe.ok) return null;

  return {
    available: true,
    kind: "playwright",
    executablePath: executablePath || PLAYWRIGHT_BUNDLED_MARKER,
    timeoutMs,
    version: probe.version,
    playwrightModule,
  };
}

// ----------------------------------------------------------------- detection

function resolveTimeoutMs(env) {
  const n = Number(env.EXPLAINER_BROWSER_TIMEOUT_MS);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TIMEOUT_MS;
}

/**
 * Resolves which browser driver (if any) is usable in this environment, per
 * the detection order in the header comment. Never throws; a probe failure
 * or timeout just falls through to the next option.
 *
 * @param {object} [opts]
 * @param {NodeJS.ProcessEnv} [opts.env] - injectable for tests; defaults to process.env
 * @param {() => Promise<any>} [opts.importPlaywright] - injectable for tests
 *   (never a real dependency in production — defaults to `import("playwright")`)
 * @returns {Promise<{available: true, kind: "playwright"|"headless-shell"|"cli", executablePath: string, timeoutMs: number, version: string, playwrightModule?: object} | {available: false, reason: string}>}
 */
export async function detectBrowser({ env = process.env, importPlaywright = defaultImportPlaywright } = {}) {
  if (env.EXPLAINER_NO_BROWSER === "1") {
    return { available: false, reason: "EXPLAINER_NO_BROWSER=1 (forced)" };
  }
  const timeoutMs = resolveTimeoutMs(env);

  const playwrightResult = await tryDetectPlaywright({ env, timeoutMs, importPlaywright });
  if (playwrightResult) return playwrightResult;

  const headlessShellPath = findHeadlessShellExecutable(env);
  if (headlessShellPath) {
    const probe = await probeCliLaunch({ executablePath: headlessShellPath, kind: "headless-shell", timeoutMs });
    if (probe.ok) {
      return { available: true, kind: "headless-shell", executablePath: headlessShellPath, timeoutMs, version: probe.version };
    }
  }

  const fullBrowserPath = findChromiumFamilyExecutable(env);
  if (fullBrowserPath) {
    const probe = await probeCliLaunch({ executablePath: fullBrowserPath, kind: "cli", timeoutMs });
    if (probe.ok) {
      return { available: true, kind: "cli", executablePath: fullBrowserPath, timeoutMs, version: probe.version };
    }
  }

  return { available: false, reason: "browser did not respond (checked Playwright, chrome-headless-shell, and Chromium-family browsers)" };
}

// ------------------------------------------------------------------- states

function htmlFiles(files) {
  return files.filter((f) => f.relPath.endsWith(".html"));
}

/**
 * One readable line per `phoneScrollOffenders()` entry (the shared
 * measuring script's self-diagnosis, above) — the actual element a
 * page-writer needs to fix, not just "page has horizontal scroll". A
 * `null` heading (most sections carry no id — confirmed on the real
 * artifact) still reports the heading's own text, so this names a
 * location even on a page with no heading ids at all.
 */
function formatPhoneScrollOffender(o) {
  const selector = `${o.tag}${o.classes ? `.${o.classes.split(/\s+/).join(".")}` : ""}${o.id ? `#${o.id}` : ""}`;
  const near = o.heading
    ? ` near "${o.heading.text}"${o.heading.id ? ` (#${o.heading.id})` : ""}`
    : " (no preceding heading on this page)";
  const text = o.text ? `: "${o.text}"` : "";
  return `${selector} extends to ${o.right}px${near}${text}`;
}

/** One state per routed page: single shape → each `#page-id` (shell.js's own hash router); multi shape → each file. */
function computeStates({ shape, contents, htmls }) {
  if (shape === "single") {
    const pages = contents?.pages || [];
    if (pages.length > 0) return pages.map((p) => ({ id: p.id, file: htmls[0] }));
    return [{ id: path.basename(htmls[0].relPath, ".html"), file: htmls[0], noHash: true }];
  }
  return htmls.map((f) => ({ id: path.basename(f.relPath, ".html"), file: f }));
}

function stateUrl(baseDir, state, shape) {
  const filePath = path.join(baseDir, state.file.relPath);
  const hash = shape === "single" && !state.noHash ? `#${state.id}` : "";
  return `file://${filePath}${hash}`;
}

function prepareCliCopy(files, artifactDir) {
  const distDir = path.join(artifactDir, "dist");
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-check-browser-"));
  fs.cpSync(distDir, tmpDir, {
    recursive: true,
    filter: (src) => !["screenshots", "check-report.md", "check.json", "gen"].includes(path.basename(src)),
  });
  for (const file of files) {
    if (!file.relPath.endsWith(".html")) continue;
    const target = path.join(tmpDir, file.relPath);
    fs.writeFileSync(target, injectMeasureScript(fs.readFileSync(target, "utf8")));
  }
  return {
    tmpDir,
    cleanup: () => {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {
        // best-effort
      }
    },
  };
}

// -------------------------------------------------------------------- runners

async function runBrowserChecksCli({ driver, files, shape, contents, artifactDir, timeoutMs }) {
  const htmls = htmlFiles(files);
  const states = computeStates({ shape, contents, htmls });
  const { tmpDir, cleanup } = prepareCliCopy(files, artifactDir);
  const screenshotsDir = path.join(artifactDir, "dist", "screenshots");
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const scrollMessages = [];
  const svgMessages = [];
  const themeMessages = [];
  const screenshots = [];
  // Not one of BROWSER_CHECK_IDS — a diagnostic-only field (
  // follow-up #1) a caller can read straight off this function's return,
  // same as every other field `measure()` computes; check.mjs's three
  // official ids are unaffected since it only ever looks up those by name.
  const hiddenControlMessages = [];
  const seenHiddenControls = new Set();

  try {
    for (const state of states) {
      const url = stateUrl(tmpDir, state, shape);
      for (const width of WIDTHS) {
        for (const theme of THEMES) {
          const screenshotPath = path.join(screenshotsDir, `${state.id}-${width}-${theme}.png`);
          // eslint-disable-next-line no-await-in-loop
          const shot = await screenshotCli({ driver, url, width, height: SCREENSHOT_HEIGHT, theme, timeoutMs, outPath: screenshotPath });
          if (!shot.ok) {
            themeMessages.push({ severity: "error", text: `${state.id}: could not produce ${theme} screenshot at ${width}px (${shot.reason})`, page: state.id });
          } else {
            screenshots.push(path.relative(path.join(artifactDir, "dist"), screenshotPath));
          }

          if (theme !== "light") continue; // measurement doesn't depend on theme — measure once per width
          // eslint-disable-next-line no-await-in-loop
          const measured = await measureCli({ driver, url, width, height: SCREENSHOT_HEIGHT, theme, timeoutMs });
          if (!measured.ok) {
            const target = width === 1280 ? svgMessages : scrollMessages;
            target.push({ severity: "error", text: `${state.id}: browser did not respond while measuring (${measured.reason})`, page: state.id });
            continue;
          }
          if (width === 1280) {
            for (const overflow of measured.json.svgOverflows || []) {
              if (overflow.overflows) {
                svgMessages.push({ severity: "error", text: `SVG text "${overflow.text}" overflows its parent shape/viewBox`, page: state.id });
              }
            }
            for (const sel of measured.json.hiddenButVisible || []) {
              const key = `${state.id}:${sel}`;
              if (seenHiddenControls.has(key)) continue;
              seenHiddenControls.add(key);
              hiddenControlMessages.push({
                severity: "error",
                text: `${sel} carries [hidden] but still renders — a CSS display rule overrides it`,
                page: state.id,
              });
            }
          } else if (width === 400 && measured.json.horizontalScroll) {
            scrollMessages.push({ severity: "error", text: "page has horizontal scroll at 400px width", page: state.id });
            for (const offender of measured.json.phoneScrollOffenders || []) {
              scrollMessages.push({ severity: "error", text: formatPhoneScrollOffender(offender), page: state.id });
            }
          }
        }
      }
    }
  } finally {
    cleanup();
  }

  return {
    "browser.phone-scroll": { messages: scrollMessages },
    "browser.svg-overflow": { messages: svgMessages },
    "browser.themes": { messages: themeMessages, screenshots },
    "browser.hidden-controls": { messages: hiddenControlMessages },
  };
}

async function runBrowserChecksPlaywright({ driver, files, shape, contents, artifactDir, timeoutMs }) {
  const htmls = htmlFiles(files);
  const states = computeStates({ shape, contents, htmls });
  const screenshotsDir = path.join(artifactDir, "dist", "screenshots");
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const scrollMessages = [];
  const svgMessages = [];
  const themeMessages = [];
  const screenshots = [];
  const hiddenControlMessages = [];
  const seenHiddenControls = new Set();

  const { chromium } = driver.playwrightModule;
  const launchOptions = { headless: true };
  if (driver.executablePath && driver.executablePath !== PLAYWRIGHT_BUNDLED_MARKER) launchOptions.executablePath = driver.executablePath;
  const browser = await withTimeout(chromium.launch(launchOptions), timeoutMs, "playwright launch");

  try {
    for (const state of states) {
      const fileUrl = stateUrl(path.join(artifactDir, "dist"), state, shape);
      const page = await browser.newPage();
      try {
        for (const width of WIDTHS) {
          for (const theme of THEMES) {
            try {
              // eslint-disable-next-line no-await-in-loop
              await page.setViewportSize({ width, height: SCREENSHOT_HEIGHT });
              // eslint-disable-next-line no-await-in-loop
              await page.emulateMedia({ colorScheme: theme });
              // eslint-disable-next-line no-await-in-loop
              await withTimeout(page.goto(fileUrl, { waitUntil: "load" }), timeoutMs, "playwright goto");
              const screenshotPath = path.join(screenshotsDir, `${state.id}-${width}-${theme}.png`);
              // eslint-disable-next-line no-await-in-loop
              await withTimeout(page.screenshot({ path: screenshotPath }), timeoutMs, "playwright screenshot");
              screenshots.push(path.relative(path.join(artifactDir, "dist"), screenshotPath));

              if (theme !== "light") continue;
              // eslint-disable-next-line no-await-in-loop
              const result = await withTimeout(page.evaluate(MEASURE_SCRIPT_SOURCE), timeoutMs, "playwright evaluate");
              if (width === 1280) {
                for (const overflow of result.svgOverflows || []) {
                  if (overflow.overflows) {
                    svgMessages.push({ severity: "error", text: `SVG text "${overflow.text}" overflows its parent shape/viewBox`, page: state.id });
                  }
                }
                for (const sel of result.hiddenButVisible || []) {
                  const key = `${state.id}:${sel}`;
                  if (seenHiddenControls.has(key)) continue;
                  seenHiddenControls.add(key);
                  hiddenControlMessages.push({
                    severity: "error",
                    text: `${sel} carries [hidden] but still renders — a CSS display rule overrides it`,
                    page: state.id,
                  });
                }
              } else if (width === 400 && result.horizontalScroll) {
                scrollMessages.push({ severity: "error", text: "page has horizontal scroll at 400px width", page: state.id });
                for (const offender of result.phoneScrollOffenders || []) {
                  scrollMessages.push({ severity: "error", text: formatPhoneScrollOffender(offender), page: state.id });
                }
              }
            } catch (err) {
              themeMessages.push({ severity: "error", text: `${state.id}: could not produce ${theme} screenshot at ${width}px via Playwright (${err.message})`, page: state.id });
              if (theme === "light" && width === 1280) svgMessages.push({ severity: "error", text: `${state.id}: could not measure SVG overflow via Playwright (${err.message})`, page: state.id });
              if (theme === "light" && width === 400) scrollMessages.push({ severity: "error", text: `${state.id}: could not measure phone scroll via Playwright (${err.message})`, page: state.id });
            }
          }
        }
      } finally {
        await page.close().catch(() => {});
      }
    }
  } finally {
    await browser.close().catch(() => {});
  }

  return {
    "browser.phone-scroll": { messages: scrollMessages },
    "browser.svg-overflow": { messages: svgMessages },
    "browser.themes": { messages: themeMessages, screenshots },
    "browser.hidden-controls": { messages: hiddenControlMessages },
  };
}

/**
 * Runs the three `browser.*` checks against the built dist files using
 * `driver` (a `detectBrowser()` result with `available: true`). Also
 * returns a `"browser.hidden-controls"` diagnostic (follow-up #1)
 * — not one of `BROWSER_CHECK_IDS`/`check.mjs`'s official checks, which
 * only ever look up the three ids above by name and so never see it, but a
 * real field on this function's own return value: every `[hidden]` control
 * `MEASURE_SCRIPT_SOURCE` knows about (`.ex-presenter-badge`,
 * `.ex-presenter-toggle`, `.ex-presenter-follow`, `.ex-ask`) that still
 * renders something despite being marked hidden — a CSS `display:` rule
 * out-cascading `[hidden]`, the real bug a shell-level `[hidden] {
 * display: none !important }` rule exists to prevent.
 *
 * @param {object} opts
 * @param {object} opts.driver - an available detectBrowser() result
 * @param {{relPath: string, content: string}[]} opts.files - built dist files
 * @param {"single"|"multi"} opts.shape
 * @param {object} opts.contents - loaded contents.json (for page ids, single shape)
 * @param {string} opts.artifactDir
 * @param {number} [opts.timeoutMs] - per-invocation hard kill timeout (defaults to driver.timeoutMs or 15000)
 * @returns {Promise<{"browser.phone-scroll": object, "browser.svg-overflow": object, "browser.themes": object, "browser.hidden-controls": object}>}
 */
export async function runBrowserChecks({ driver, files, shape, contents, artifactDir, timeoutMs }) {
  const effectiveTimeout = timeoutMs || driver.timeoutMs || DEFAULT_TIMEOUT_MS;
  if (driver.kind === "playwright") {
    return runBrowserChecksPlaywright({ driver, files, shape, contents, artifactDir, timeoutMs: effectiveTimeout });
  }
  return runBrowserChecksCli({ driver, files, shape, contents, artifactDir, timeoutMs: effectiveTimeout });
}
