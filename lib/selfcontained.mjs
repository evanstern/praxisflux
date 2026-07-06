// selfcontained.mjs — verify a rendered HTML page is self-contained and CSP-safe.
//
// Ported from research's verify_artifact.py. The Artifact host enforces a strict CSP that
// blocks every external host, so a page that loads a remote script/font/style/image silently
// breaks. Both educate's deck.html and research's *-briefing.html are checked with this.
//
// Returns { ok, fails: string[], warns: string[] } — no process exit here; callers decide.

const EXT = "https?://";
const CHECKS = [
  [new RegExp(`<script[^>]+\\bsrc\\s*=\\s*['"]?${EXT}`, "i"), "external <script src>"],
  [new RegExp(`<link[^>]+\\bhref\\s*=\\s*['"]?${EXT}`, "i"), "external <link href> (stylesheet/font)"],
  [new RegExp(`<(?:img|source|image)[^>]+\\bsrc\\s*=\\s*['"]?${EXT}`, "i"), "external image src"],
  [new RegExp(`<[^>]+\\bsrcset\\s*=\\s*['"][^'"]*${EXT}`, "i"), "external srcset"],
  [new RegExp(`url\\(\\s*['"]?${EXT}`, "i"), "external CSS url()"],
  [new RegExp(`@import\\s+(?:url\\()?\\s*['"]?${EXT}`, "i"), "external @import"],
  [new RegExp(`\\bfetch\\s*\\(\\s*['"]${EXT}`, "i"), "runtime fetch() to external host"],
  [new RegExp(`\\.open\\s*\\(\\s*['"][A-Z]+['"]\\s*,\\s*['"]${EXT}`, "i"), "XHR to external host"],
];

/** Check an HTML string. `substantialBytes` is the size above which a data table is expected. */
export function checkHtml(html, { substantialBytes = 6000 } = {}) {
  const fails = [], warns = [];
  if (!/<title>\s*\S/i.test(html)) fails.push("no <title> — the artifact needs a name");
  for (const [rx, label] of CHECKS) {
    if (rx.test(html)) {
      fails.push(`loads a resource from an external host: ${label} — the Artifact CSP blocks this; inline it or embed as a data: URI`);
    }
  }
  if (!/prefers-color-scheme/i.test(html)) {
    warns.push("no @media (prefers-color-scheme) — page may not adapt to dark/light themes");
  }
  if (html.length > substantialBytes && !/<table/i.test(html)) {
    warns.push("no <table> found — consider a data table so the figures are auditable");
  }
  return { ok: fails.length === 0, fails, warns };
}
