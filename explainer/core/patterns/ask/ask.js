"use strict";
/* core/patterns/ask — per-section "Ask about this" button. CSS + markup +
   an INERT hook only: this file never calls the `comments` Artifact
   capability itself. Every `.ex-ask` button stays hidden until
   `ExplainerAsk.enable(onAsk)` is called (by the live wiring file) —
   before that, a page shows no ask buttons at all. */
(function (root) {
  /**
   * Un-hides and wires every not-yet-wired `.ex-ask` button under `scopeEl`
   * (default `document`). `onAsk(sectionId, buttonEl)` is called on click
   * with the button's `data-ask-section` value (or `null` if absent) —
   * the live wiring file opens the shell's comments composer anchored to
   * that section from there. Idempotent: a button already wired (no longer
   * `hidden`) is left alone.
   */
  function enable(onAsk, scopeEl) {
    var scope = scopeEl || (typeof document !== "undefined" ? document : null);
    if (!scope || !scope.querySelectorAll) return;
    scope.querySelectorAll(".ex-ask[hidden]").forEach(function (btn) {
      btn.hidden = false;
      btn.addEventListener("click", function () {
        if (typeof onAsk === "function") onAsk(btn.getAttribute("data-ask-section") || null, btn);
      });
    });
  }

  var api = { enable: enable };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ExplainerAsk = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
