// selfcontained.mjs — verify a rendered HTML page is self-contained and CSP-safe.
//
// Ported from research's verify_artifact.py. The Artifact host enforces a strict CSP that
// blocks every external host, so a page that loads a remote script/font/style/image silently
// breaks. educate's deck.html, research's *-briefing.html, and explainer's dist pages are
// checked with this.
//
// checkHtml returns { ok, fails: string[], warns: string[] } — no process exit here; callers
// decide. externalLoads is the per-occurrence view ({ label, url, index }) for callers that
// report file:line locations; checkHtml folds it into one fail per kind.

// Absolute (http/https) and protocol-relative (//host) URLs both leave the page.
const URL = `((?:https?:)?//[^'"\\s)>]+)`;
const CHECKS = [
  [`<script[^>]+\\bsrc\\s*=\\s*['"]?${URL}`, "external <script src>"],
  [`<link[^>]+\\bhref\\s*=\\s*['"]?${URL}`, "external <link href> (stylesheet/font)"],
  [`<(?:img|source|image)[^>]+\\bsrc\\s*=\\s*['"]?${URL}`, "external image src"],
  [`<[^>]+\\bsrcset\\s*=\\s*['"][^'"]*?${URL}`, "external srcset"],
  [`url\\(\\s*['"]?${URL}`, "external CSS url()"],
  [`@import\\s+(?:url\\()?\\s*['"]?${URL}`, "external @import"],
  [`\\bfetch\\s*\\(\\s*['"]${URL}`, "runtime fetch() to external host"],
  [`\\.open\\s*\\(\\s*['"][A-Z]+['"]\\s*,\\s*['"]${URL}`, "XHR to external host"],
];

/** Every external load in `html`, in source order: [{ label, url, index }]. */
export function externalLoads(html) {
  const out = [];
  for (const [src, label] of CHECKS) {
    for (const m of html.matchAll(new RegExp(src, "gi"))) out.push({ label, url: m[1], index: m.index });
  }
  return out.sort((a, b) => a.index - b.index);
}

/** Check an HTML string. `substantialBytes` is the size above which a data table is expected. */
export function checkHtml(html, { substantialBytes = 6000 } = {}) {
  const fails = [], warns = [];
  if (!/<title>\s*\S/i.test(html)) fails.push("no <title> — the artifact needs a name");
  for (const label of new Set(externalLoads(html).map((l) => l.label))) {
    fails.push(`loads a resource from an external host: ${label} — the Artifact CSP blocks this; inline it or embed as a data: URI`);
  }
  if (!/prefers-color-scheme/i.test(html)) {
    warns.push("no @media (prefers-color-scheme) — page may not adapt to dark/light themes");
  }
  if (html.length > substantialBytes && !/<table/i.test(html)) {
    warns.push("no <table> found — consider a data table so the figures are auditable");
  }
  return { ok: fails.length === 0, fails, warns };
}
