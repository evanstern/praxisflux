"use strict";
/* core/patterns/ask/ask.live.js — the live wiring for the `ask` pattern.
   Resolves the Artifact `comments` capability and
   calls `ExplainerAsk.enable()` (ask.js, unchanged — this file never
   touches `.ex-ask` elements directly) with an `onAsk` that opens the
   claude.ai shell's own comment composer anchored to the clicked
   section. Inlined by the build (lib/shell.mjs's resolvePatterns) only
   when `contents.live.comments` is true — never merely because a page
   uses the `ask` pattern (that only ships the inert ask.js hook).

   This file ships verbatim inside the published page, so its comments
   describe behavior in plain language rather than citing any internal
   ticket, task, or decision-record id (the build's own
   fact.no-internal-codes check enforces exactly that for every other
   piece of published content; the same rule applies to a pattern's own
   source).

   Capability call shapes are taken from the live Artifact-capabilities
   runtime contract, read in full before writing this file — never
   guessed:
     - declaring the capability as `comments: {composer_only: true}`
       grants exactly `openComposer` (plus `anchorFor`, unused here) with
       no consent prompt; the composer-only form's write verbs are not
       available and are not needed — the page posts nothing itself, the
       shell's own composer does.
     - `openComposer(target: {element: Element} | {range: Range})`
       resolves `{opened: boolean}` and rejects a small set of routine,
       never-retried error codes (consent/permission/availability/rate
       limits) on failure.

   Null-capability safety: every guard below returns before ever calling
   `window.claude.use(...)` when `window.claude` itself doesn't exist (a
   saved copy of the page, a static review, a host that never answers) or
   when `ExplainerAsk` didn't load (shouldn't happen — the build only
   inlines this file alongside ask.js — but checked anyway so this file is
   safe to load standalone, e.g. in a test). When the `comments`
   capability resolves `null` (not served/granted for this view),
   `ExplainerAsk.enable()` is simply never called, so every `.ex-ask`
   button stays `hidden` exactly as ask.js's own "before enable()"
   contract promises — no error, no visible control. */
(function () {
  if (typeof window === "undefined") return;
  if (!window.claude || typeof window.claude.use !== "function") return;
  if (!window.ExplainerAsk || typeof window.ExplainerAsk.enable !== "function") return;

  window.claude.use("comments").then(
    function (comments) {
      if (!comments) return; // not served/granted for this view — stay inert

      window.ExplainerAsk.enable(function (sectionId, btnEl) {
        // Anchor at the section heading the button names (ask.js passes
        // `data-ask-section` straight through) when that id resolves to a
        // real element on this page; otherwise fall back to the button
        // itself, so `target` is always a connected Element — the
        // composer needs some attached element and has no page-id/
        // section-name form of its own.
        var target = (sectionId && document.getElementById(sectionId)) || btnEl;
        if (!target) return;
        comments.openComposer({ element: target }).catch(function () {
          // Every rejection here (lack of consent, no permission, the
          // capability unavailable, too many calls too fast, ...) is on
          // the "routine, never retried" list — the click simply does
          // nothing further; there is no page-owned composer UI to show
          // an error in.
        });
      });
    },
    function () {
      /* claude.use() itself is not documented to reject, but guard
         anyway: a failure here must never surface as a page error — the
         page already works with no ask buttons. */
    }
  );
})();
