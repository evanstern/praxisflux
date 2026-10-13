// tests for : the
// `ask`/`presenter` live wiring and 's null-capability safety.
//
// Covers:
//   1. lib/shell.mjs's injectAskButtons() — the build-emitted `.ex-ask`
//      markup contract: per-heading when a page has
//      addressable sections, one page-level button as a fallback, never
//      a second button on a page that already hand-authored its own.
//   2. the real build() only inlines `ask.live.js`/`presenter.live.js`
//      when contents.live.comments/.presenter is on — the inert
//      ask.js/presenter.js hooks ship either way, unchanged from before
//  (patterns.test.mjs already covers that half).
//   3. null-capability safety: the real build's inlined <script>
//      block, run under node:vm against a minimal hand-rolled DOM stub
//      (no jsdom/equivalent dependency is available or wanted in this
//      plugin — a judgment call), with
//      `window.claude` undefined — must not throw, and must leave every
//      `.ex-ask`/`.ex-presenter-*` control hidden.
//   4. The same script, run against a fake `window.claude` shaped per
//      the `artifact-capabilities` skill's comments/db/user contracts
//      (runtime 0.2.74): the ask button's click opens the composer
//      anchored at its section; the owner's toggle writes `live/state`;
//      a follower's remote-state change navigates them.
//   5. lib/shell.mjs's presenterTopbarHtml() / the build-emitted presenter
//      topbar: unlike `ask`, `presenter` attaches to the whole artifact
//      via the live flag alone, with no page-level "where" to infer —
//      the build emits the pattern's own markup contract once, in the
//      shell's shared top bar, in both the single and --multi shapes, so
//      presenter.js + presenter.live.js are inlined even when no page
//      hand-authors `.ex-presenter` — and nothing ships when the flag is
//      off.

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { build } from "../../explainer/scripts/lib/build.mjs";
import { injectAskButtons, presenterTopbarHtml, PRESENTER_TOPBAR_HTML } from "../../explainer/scripts/lib/shell.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REAL_PLUGIN_ROOT = path.resolve(__dirname, "..", "..", "explainer");
const PATTERNS_ROOT = path.join(REAL_PLUGIN_ROOT, "core", "patterns");

function readExample(name) {
  return fs.readFileSync(path.join(PATTERNS_ROOT, name, "example.html"), "utf8");
}

// ===================================================== 1. injectAskButtons

test("injectAskButtons: one button right after each heading-with-id", () => {
  const html = '<h2 id="faq">FAQ</h2><p>Text.</p><h3 id="more">More</h3><p>Other.</p>';
  const out = injectAskButtons(html, "demo");
  assert.match(out, /<h2 id="faq">FAQ<\/h2><button type="button" class="ex-ask" data-ask-section="faq" hidden>Ask about this<\/button>/);
  assert.match(out, /<h3 id="more">More<\/h3><button type="button" class="ex-ask" data-ask-section="more" hidden>Ask about this<\/button>/);
  // Exactly 2 buttons — no stray page-level fallback once headings exist.
  assert.equal((out.match(/class="ex-ask"/g) || []).length, 2);
});

test("injectAskButtons: no addressable heading -> one page-level button, anchored to the page id", () => {
  const html = "<p>No headings here.</p>";
  const out = injectAskButtons(html, "overview");
  assert.equal(out, '<p>No headings here.</p><button type="button" class="ex-ask" data-ask-section="overview" hidden>Ask about this</button>');
});

test("injectAskButtons: a page that already hand-authors its own .ex-ask button is left untouched", () => {
  const html = readExample("ask"); // core/patterns/ask/example.html's own hand-authored contract
  const out = injectAskButtons(html, "whatever-page-id");
  assert.equal(out, html);
});

// ============================================ 2. build: live.js only when live is on

function makeLiveFixture(dir, { live }) {
  fs.mkdirSync(path.join(dir, "profiles", "test-profile"), { recursive: true });
  fs.writeFileSync(path.join(dir, "profiles", "test-profile", "README.md"), "fixture profile\n");
  fs.mkdirSync(path.join(dir, "pages"), { recursive: true });

  const introHtml = ['<h2 id="faq">Frequently asked</h2>', "<p>Some content.</p>", readExample("presenter")].join("\n");
  fs.writeFileSync(path.join(dir, "pages", "intro.html"), introHtml);
  fs.writeFileSync(path.join(dir, "pages", "appendix.html"), "<p>Appendix content.</p>\n");

  const contents = {
    schema: 1,
    title: "Live Demo",
    kind: "test-profile",
    brand: "neutral",
    voice: "none",
    groups: [{ id: "start", title: "Start here" }],
    pages: [
      { id: "intro", title: "Intro", group: "start", type: "short-answer" },
      { id: "appendix", title: "Appendix", group: "start", type: "short-answer" },
    ],
    terms: [],
    sources: [],
    rules: { off: [], on: [] },
    live,
    publish: { url: null, shape: "single" },
  };
  fs.writeFileSync(path.join(dir, "contents.json"), JSON.stringify(contents, null, 2));
}

async function buildLiveFixture(live) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-live-"));
  makeLiveFixture(dir, { live });
  try {
    const result = await build({ dir, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT });
    const html = result.ok ? fs.readFileSync(path.join(dir, "dist", path.basename(dir) + ".html"), "utf8") : null;
    return { result, html, dir };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test("build() inlines ask.live.js + presenter.live.js only when contents.live enables them", async () => {
  const on = await buildLiveFixture({ comments: true, presenter: true });
  assert.equal(on.result.ok, true, JSON.stringify(on.result.errors || on.result.missing));
  assert.match(on.html, /ExplainerAsk/); // the inert hook still ships
  assert.match(on.html, /ExplainerPresenter/);
  assert.match(on.html, /claude\.use\("comments"\)/); // ask.live.js
  assert.match(on.html, /claude\.use\("db"\)/); // presenter.live.js
  assert.match(on.html, /claude\.use\("user"\)/);
  const askUsed = on.result.patternsUsed.find((p) => p.name === "ask");
  const presenterUsed = on.result.patternsUsed.find((p) => p.name === "presenter");
  assert.equal(askUsed.live, true);
  assert.equal(presenterUsed.live, true);

  const off = await buildLiveFixture({ comments: false, presenter: false });
  assert.equal(off.result.ok, true, JSON.stringify(off.result.errors || off.result.missing));
  // With live.comments off the build never auto-emits a button, and this
  // fixture's pages carry no hand-authored one either, so "ask" isn't used
  // at all — not even its inert hook ships ('s usual "only an actually
  // used pattern is inlined" rule, unaffected by). `presenter`'s
  // markup is hand-authored (independent of the live flag), so its inert
  // hook still ships either way — only its *.live.js is flag-gated.
  assert.doesNotMatch(off.html, /ExplainerAsk/);
  assert.match(off.html, /ExplainerPresenter/);
  assert.doesNotMatch(off.html, /claude\.use\("comments"\)/);
  assert.doesNotMatch(off.html, /claude\.use\("db"\)/);
  assert.doesNotMatch(off.html, /claude\.use\("user"\)/);
  assert.equal(
    off.result.patternsUsed.find((p) => p.name === "ask"),
    undefined
  );
  const presenterUsedOff = off.result.patternsUsed.find((p) => p.name === "presenter");
  assert.equal(presenterUsedOff.live, false);

  // Build-emitted ask button: live.comments true put one after the intro
  // page's own <h2 id="faq">; live.comments false means none at all.
  assert.match(on.html, /data-ask-section="faq"/);
  assert.doesNotMatch(off.html, /data-ask-section="faq"/);
});

// ============================================ 2b. build-emitted presenter topbar
//
// Unlike `ask`, `presenter` attaches to the whole artifact via the live
// flag alone: no page here hand-authors `.ex-presenter` at all —
// proving the topbar injection, not the pre-existing "hand-authored markup
// ships regardless of the flag" path the fixture above already covers.

function makeNoPresenterFixture(dir, { live }) {
  fs.mkdirSync(path.join(dir, "profiles", "test-profile"), { recursive: true });
  fs.writeFileSync(path.join(dir, "profiles", "test-profile", "README.md"), "fixture profile\n");
  fs.mkdirSync(path.join(dir, "pages"), { recursive: true });
  fs.writeFileSync(path.join(dir, "pages", "intro.html"), "<p>No presenter markup on this page at all.</p>\n");
  fs.writeFileSync(path.join(dir, "pages", "appendix.html"), "<p>Appendix content.</p>\n");

  const contents = {
    schema: 1,
    title: "No Presenter Markup",
    kind: "test-profile",
    brand: "neutral",
    voice: "none",
    groups: [{ id: "start", title: "Start here" }],
    pages: [
      { id: "intro", title: "Intro", group: "start", type: "short-answer" },
      { id: "appendix", title: "Appendix", group: "start", type: "short-answer" },
    ],
    terms: [],
    sources: [],
    rules: { off: [], on: [] },
    live,
    publish: { url: null, shape: "single" },
  };
  fs.writeFileSync(path.join(dir, "contents.json"), JSON.stringify(contents, null, 2));
}

async function buildNoPresenterFixture(live, { multi = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "explainer-no-presenter-"));
  makeNoPresenterFixture(dir, { live });
  try {
    const result = await build({ dir, multi, repoRoot: dir, pluginRoot: REAL_PLUGIN_ROOT });
    let html = null;
    let siteJs = null;
    if (result.ok) {
      if (multi) {
        html = fs.readFileSync(path.join(dir, "dist", path.basename(dir), "intro.html"), "utf8");
        siteJs = fs.readFileSync(path.join(dir, "dist", path.basename(dir), "site.js"), "utf8");
      } else {
        html = fs.readFileSync(path.join(dir, "dist", path.basename(dir) + ".html"), "utf8");
      }
    }
    return { result, html, siteJs };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test("presenterTopbarHtml(): the pattern's own markup contract when contents.live.presenter is on, empty string otherwise", () => {
  assert.equal(presenterTopbarHtml({ live: { presenter: true } }), PRESENTER_TOPBAR_HTML);
  assert.equal(presenterTopbarHtml({ live: { presenter: false } }), "");
  assert.equal(presenterTopbarHtml({}), "");
  assert.match(PRESENTER_TOPBAR_HTML, /class="ex-presenter"/);
  assert.match(PRESENTER_TOPBAR_HTML, /class="ex-presenter-toggle"/);
  assert.match(PRESENTER_TOPBAR_HTML, /class="ex-presenter-badge"/);
  assert.match(PRESENTER_TOPBAR_HTML, /class="ex-presenter-follow"/);
});

test("build() (single-shape): live.presenter on emits the presenter topbar and inlines presenter.js + presenter.live.js with no page hand-authoring it", async () => {
  const on = await buildNoPresenterFixture({ comments: false, presenter: true });
  assert.equal(on.result.ok, true, JSON.stringify(on.result.errors || on.result.missing));
  assert.match(on.html, /<header class="ex-topbar">[\s\S]*?<div class="ex-presenter">/);
  assert.match(on.html, /ExplainerPresenter/);
  assert.match(on.html, /claude\.use\("db"\)/);
  assert.match(on.html, /claude\.use\("user"\)/);
  const presenterUsed = on.result.patternsUsed.find((p) => p.name === "presenter");
  assert.ok(presenterUsed, "presenter should be in patternsUsed purely from the topbar injection");
  assert.equal(presenterUsed.live, true);

  const off = await buildNoPresenterFixture({ comments: false, presenter: false });
  assert.equal(off.result.ok, true, JSON.stringify(off.result.errors || off.result.missing));
  assert.doesNotMatch(off.html, /ex-presenter/);
  assert.doesNotMatch(off.html, /ExplainerPresenter/);
  assert.equal(
    off.result.patternsUsed.find((p) => p.name === "presenter"),
    undefined
  );
});

test("build() (--multi): the presenter topbar and its scripts ship on every page file, from site.js shared once", async () => {
  const on = await buildNoPresenterFixture({ comments: false, presenter: true }, { multi: true });
  assert.equal(on.result.ok, true, JSON.stringify(on.result.errors || on.result.missing));
  assert.match(on.html, /<div class="ex-presenter">/); // every page's own topbar carries it
  assert.match(on.siteJs, /ExplainerPresenter/);
  assert.match(on.siteJs, /claude\.use\("db"\)/);

  const off = await buildNoPresenterFixture({ comments: false, presenter: false }, { multi: true });
  assert.equal(off.result.ok, true, JSON.stringify(off.result.errors || off.result.missing));
  assert.doesNotMatch(off.html, /ex-presenter/);
  assert.doesNotMatch(off.siteJs, /ExplainerPresenter/);
});

// ============================================ 3/4. runtime behaviour under node:vm
//
// A hand-rolled, minimal DOM — just enough of Element/Document/Window for
// shell.js + the ask/presenter pattern JS (inert + live) to run without
// throwing and to exercise the real selectors those scripts use
// (`.ex-ask[hidden]`, `.ex-presenter:not([data-ex-presenter-ready])`,
// `section.ex-page`, `.ex-menu a[data-page], .ex-pager a[data-page]`,
// `a.ex-term[data-term]`, `[data-panel]`, …). No jsdom-equivalent
// dependency exists in this plugin (built-ins only).

function extractInlineScript(html) {
  const m = /<script>\n([\s\S]*?)\n<\/script>/.exec(html);
  assert.ok(m, "expected one bare <script> block in the single-shape output");
  return m[1];
}

class FakeElement {
  constructor(tag, attrs = {}) {
    this.tagName = tag;
    this.attrs = { ...attrs };
    this.children = [];
    this.parent = null;
    this._listeners = {};
    this._text = "";
  }
  appendChild(child) {
    child.parent = this;
    this.children.push(child);
    return child;
  }
  get id() {
    return this.attrs.id || "";
  }
  set id(v) {
    this.attrs.id = v;
  }
  get hidden() {
    return Object.prototype.hasOwnProperty.call(this.attrs, "hidden");
  }
  set hidden(v) {
    if (v) this.attrs.hidden = "";
    else delete this.attrs.hidden;
  }
  get textContent() {
    return this._text;
  }
  set textContent(v) {
    this._text = String(v);
  }
  getAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null;
  }
  setAttribute(name, value) {
    this.attrs[name] = String(value);
  }
  removeAttribute(name) {
    delete this.attrs[name];
  }
  hasAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attrs, name);
  }
  addEventListener(type, fn) {
    (this._listeners[type] = this._listeners[type] || []).push(fn);
  }
  dispatch(type) {
    (this._listeners[type] || []).forEach((fn) => fn({ target: this, preventDefault() {} }));
  }
  closest() {
    return null; // never exercised at top-level load by any script this test runs
  }
  querySelector(sel) {
    const r = queryAll(this, sel);
    return r.length ? r[0] : null;
  }
  querySelectorAll(sel) {
    return queryAll(this, sel);
  }
}

function parseCompound(sel) {
  let s = sel.trim();
  const out = { tag: null, classes: [], attrsReq: [], attrsForbid: [] };
  let notMatch = s.match(/:not\(\[([a-zA-Z0-9-]+)\]\)/);
  while (notMatch) {
    out.attrsForbid.push(notMatch[1]);
    s = s.slice(0, notMatch.index) + s.slice(notMatch.index + notMatch[0].length);
    notMatch = s.match(/:not\(\[([a-zA-Z0-9-]+)\]\)/);
  }
  s = s.replace(/\[([a-zA-Z0-9-]+)\]/g, (_m, name) => {
    out.attrsReq.push(name);
    return "";
  });
  s = s.replace(/\.([a-zA-Z0-9-]+)/g, (_m, cls) => {
    out.classes.push(cls);
    return "";
  });
  s = s.trim();
  if (s) out.tag = s;
  return out;
}

function elementMatches(el, compound) {
  if (compound.tag && el.tagName !== compound.tag) return false;
  const classes = (el.getAttribute("class") || "").split(/\s+/).filter(Boolean);
  for (const c of compound.classes) if (!classes.includes(c)) return false;
  for (const a of compound.attrsReq) if (!el.hasAttribute(a)) return false;
  for (const a of compound.attrsForbid) if (el.hasAttribute(a)) return false;
  return true;
}

function queryAll(root, selector) {
  const branches = selector.split(",").map(parseCompound);
  const out = [];
  (function walk(el) {
    for (const child of el.children) {
      if (branches.some((b) => elementMatches(child, b))) out.push(child);
      walk(child);
    }
  })(root);
  return out;
}

function makeFakeDocument(topChildren) {
  const root = new FakeElement("#root");
  topChildren.forEach((c) => root.appendChild(c));
  return {
    readyState: "complete",
    _listeners: {},
    addEventListener(type, fn) {
      (this._listeners[type] = this._listeners[type] || []).push(fn);
    },
    getElementById(id) {
      let found = null;
      (function walk(el) {
        if (found) return;
        if (el.attrs && el.attrs.id === id) {
          found = el;
          return;
        }
        el.children.forEach(walk);
      })(root);
      return found;
    },
    querySelector(sel) {
      return root.querySelector(sel);
    },
    querySelectorAll(sel) {
      return root.querySelectorAll(sel);
    },
    createElement(tag) {
      return new FakeElement(tag);
    },
    body: new FakeElement("body"),
    documentElement: new FakeElement("html"),
  };
}

function makeFakeLocalStorage() {
  const store = new Map();
  return {
    getItem(k) {
      return store.has(k) ? store.get(k) : null;
    },
    setItem(k, v) {
      store.set(k, String(v));
    },
    removeItem(k) {
      store.delete(k);
    },
  };
}

// Builds the fixture DOM (2 `.ex-page` sections: "intro" visible, with an
// ask button + the presenter markup; "appendix" hidden) that mirrors
// buildLiveFixture()'s page content above closely enough for shell.js's
// real selectors to find the same elements a built page would.
function buildFixtureDom() {
  const heading = new FakeElement("h2", { id: "faq" });
  heading.textContent = "Frequently asked";

  const askBtn = new FakeElement("button", { type: "button", class: "ex-ask", "data-ask-section": "faq", hidden: "" });
  askBtn.textContent = "Ask about this";

  const toggleBtn = new FakeElement("button", { type: "button", class: "ex-presenter-toggle", "aria-pressed": "false", hidden: "" });
  const badge = new FakeElement("span", { class: "ex-presenter-badge", hidden: "" });
  const followBtn = new FakeElement("button", { type: "button", class: "ex-presenter-follow", "aria-pressed": "true", hidden: "" });
  const presenterContainer = new FakeElement("div", { class: "ex-presenter" });
  presenterContainer.appendChild(toggleBtn);
  presenterContainer.appendChild(badge);
  presenterContainer.appendChild(followBtn);

  const intro = new FakeElement("section", { class: "ex-page", id: "intro" });
  intro.appendChild(heading);
  intro.appendChild(askBtn);
  intro.appendChild(presenterContainer);

  const appendix = new FakeElement("section", { class: "ex-page", id: "appendix", hidden: "" });

  const document_ = makeFakeDocument([intro, appendix]);

  return { document: document_, intro, appendix, heading, askBtn, presenterContainer, toggleBtn, badge, followBtn };
}

function runScriptInSandbox(scriptSrc, { claude } = {}) {
  const dom = buildFixtureDom();
  const sandbox = {};
  sandbox.document = dom.document;
  sandbox.location = { hash: "", href: "http://example.test/artifact" };
  sandbox.history = { scrollRestoration: "", pushState() {} };
  sandbox.localStorage = makeFakeLocalStorage();
  sandbox.requestAnimationFrame = (fn) => fn();
  sandbox.scrollTo = () => {};
  sandbox.console = console;
  sandbox.claude = claude;
  sandbox._listeners = {};
  sandbox.addEventListener = function (type, fn) {
    (sandbox._listeners[type] = sandbox._listeners[type] || []).push(fn);
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(scriptSrc, sandbox, { timeout: 2000 });
  return { sandbox, dom };
}

function flush() {
  return new Promise((resolve) => setImmediate(resolve));
}

function makeFakeComments() {
  const calls = [];
  return {
    calls,
    openComposer(target) {
      calls.push(target);
      return Promise.resolve({ opened: true });
    },
  };
}

function makeFakeUser(isOwner) {
  return { isOwner: () => Promise.resolve(isOwner) };
}

function makeFakeDb() {
  let data = null;
  let exists = false;
  const subs = [];
  const writes = [];
  function snapshot() {
    const frozenData = data;
    return { exists, data: () => (exists ? frozenData : undefined) };
  }
  const docRef = {
    writes,
    set(body) {
      writes.push(body);
      data = body;
      exists = true;
      return Promise.resolve().then(() => {
        subs.forEach((fn) => fn(snapshot()));
      });
    },
    onSnapshot(next) {
      subs.push(next);
      Promise.resolve().then(() => next(snapshot()));
      return () => {
        const i = subs.indexOf(next);
        if (i >= 0) subs.splice(i, 1);
      };
    },
    // Test-only: simulate another viewer's (the owner's, from this
    // follower's point of view) write landing, without going through
    // this capability's own write path.
    _remoteSet(body) {
      data = body;
      exists = true;
      subs.forEach((fn) => fn(snapshot()));
    },
  };
  return {
    doc(p) {
      assert.equal(p, "live/state");
      return docRef;
    },
    docRef,
  };
}

let liveFixtureScript;
test("setup: build the live fixture once for the vm tests below", async () => {
  const { result, html } = await buildLiveFixture({ comments: true, presenter: true });
  assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
  liveFixtureScript = extractInlineScript(html);
  assert.match(liveFixtureScript, /claude\.use\("comments"\)/);
  assert.match(liveFixtureScript, /claude\.use\("db"\)/);
});

test("window.claude undefined -> the built script runs under node:vm with no throw, every control stays hidden", async () => {
  let dom;
  assert.doesNotThrow(() => {
    ({ dom } = runScriptInSandbox(liveFixtureScript, { claude: undefined }));
  });
  await flush();
  await flush();
  assert.equal(dom.askBtn.hidden, true);
  assert.equal(dom.toggleBtn.hidden, true);
  assert.equal(dom.badge.hidden, true);
  assert.equal(dom.followBtn.hidden, true);
});

test("a window.claude whose use() always resolves null -> no throw, every control stays hidden", async () => {
  const claude = { use: () => Promise.resolve(null) };
  let dom;
  assert.doesNotThrow(() => {
    ({ dom } = runScriptInSandbox(liveFixtureScript, { claude }));
  });
  await flush();
  await flush();
  assert.equal(dom.askBtn.hidden, true);
  assert.equal(dom.toggleBtn.hidden, true);
});

test("the topbar-only presenter build (no hand-authored .ex-presenter anywhere) is just as null-capability-safe", async () => {
  const { result, html } = await buildNoPresenterFixture({ comments: false, presenter: true });
  assert.equal(result.ok, true, JSON.stringify(result.errors || result.missing));
  const script = extractInlineScript(html);
  assert.match(script, /claude\.use\("db"\)/);

  let dom;
  assert.doesNotThrow(() => {
    ({ dom } = runScriptInSandbox(script, { claude: undefined }));
  });
  await flush();
  await flush();
  assert.equal(dom.toggleBtn.hidden, true);
  assert.equal(dom.badge.hidden, true);
  assert.equal(dom.followBtn.hidden, true);
});

test("ask: comments granted -> the button un-hides and its click opens the composer anchored at the section heading", async () => {
  const comments = makeFakeComments();
  const claude = {
    use: (name) => Promise.resolve(name === "comments" ? comments : null),
  };
  const { dom } = runScriptInSandbox(liveFixtureScript, { claude });
  await flush();
  await flush();

  assert.equal(dom.askBtn.hidden, false, "ask.js's enable() should have un-hidden the button");
  dom.askBtn.dispatch("click");
  await flush();

  assert.equal(comments.calls.length, 1);
  assert.equal(comments.calls[0].element, dom.heading, "anchored at the #faq heading data-ask-section names");
});

test("presenter: owner toggling presenting writes live/state (presenting, page, section, updatedAt)", async () => {
  const db = makeFakeDb();
  const user = makeFakeUser(true);
  const claude = {
    use: (name) => Promise.resolve(name === "db" ? db : name === "user" ? user : null),
  };
  const { dom } = runScriptInSandbox(liveFixtureScript, { claude });
  await flush();
  await flush();
  await flush();

  assert.equal(dom.toggleBtn.hidden, false, "owner should see the presenting toggle");
  dom.toggleBtn.dispatch("click");
  await flush();

  assert.equal(db.docRef.writes.length, 1);
  const body = db.docRef.writes[0];
  assert.equal(body.presenting, true);
  assert.equal(body.page, "intro");
  assert.equal(body.section, null);
  assert.equal(typeof body.updatedAt, "string");
});

test("presenter: a follower (not owner) navigates when a remote presenting state arrives and following is on", async () => {
  const db = makeFakeDb();
  const user = makeFakeUser(false);
  const claude = {
    use: (name) => Promise.resolve(name === "db" ? db : name === "user" ? user : null),
  };
  const { dom } = runScriptInSandbox(liveFixtureScript, { claude });
  await flush();
  await flush();
  await flush();

  assert.equal(dom.toggleBtn.hidden, true, "a non-owner never sees the presenting toggle");
  assert.equal(dom.intro.hidden, false);
  assert.equal(dom.appendix.hidden, true);

  db.docRef._remoteSet({ presenting: true, page: "appendix", section: null, updatedAt: new Date().toISOString() });
  await flush();

  assert.equal(dom.appendix.hidden, false, "the follower's view should have navigated to the presenter's page");
  assert.equal(dom.intro.hidden, true);
  assert.equal(dom.followBtn.hidden, false, "the follow toggle becomes visible while someone else presents");
});
