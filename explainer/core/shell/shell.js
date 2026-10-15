"use strict";
/* explainer shell — shared runtime for both the single-file and
   --multi builds. Built on top of
   data lib/shell.mjs embeds as <script type="application/json"> blocks from
   contents.json (terms) instead of a hand-maintained TERMS array, and
   generalized to route between `section.ex-page[hidden]` elements for the
   single shape. In the --multi shape each file has exactly one
   `section.ex-page`, so there is nothing to route between — only the info
   component, theme toggle and "Pages" drawer apply there; a bare `#id` hash
   on a multi page is a same-page anchor and is left to the browser's own
   default.

   The "more info" popover/panel/sheet component moved
   wholesale to core/patterns/info/info.js: it is a
   pattern now, shipped only on a page that actually uses a trigger
   (lib/shell.mjs's BUILD_OWNED_IMPLIES/collectPatternNames), not part of
   this always-shipped shell. This file keeps only navigation/routing, the
   theme toggle, and the "Pages" drawer — plus the one small live hook
   (window.ExShell) a live-wiring pattern module reads/calls.
   Built-ins only: no framework, no bundler-generated code. */
(function () {
  var pages = Array.prototype.slice.call(document.querySelectorAll("section.ex-page"));
  // --multi emits exactly one <section class="ex-page"> per file; the
  // single shape emits every page, hidden except the current one.
  var isSingle = pages.length > 1;

  function pageById(id) {
    for (var i = 0; i < pages.length; i += 1) {
      if (pages[i].id === id) return pages[i];
    }
    return null;
  }

  // ------------------------------------------------------------- navigation ---
  if ("scrollRestoration" in history) {
    try {
      history.scrollRestoration = "manual";
    } catch (e) {
      /* ignore */
    }
  }

  function showPage(id) {
    var target = pageById(id);
    if (!target) return false;
    pages.forEach(function (p) {
      p.hidden = p !== target;
    });
    document.querySelectorAll(".ex-menu a[data-page], .ex-pager a[data-page]").forEach(function (a) {
      if (a.getAttribute("data-page") === id) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    return true;
  }

  // Lands on the right page and the right spot within it: a hash may name
  // a page id directly (menu/pager/x-page links), or an anchor *inside*
  // some page (e.g. a term popover's "Full definition on Terms →" link to
  // #terms--port, which lives on the Terms page, not the current one).
  function navigateToHashInner(hash) {
    if (!hash) {
      if (isSingle && pages[0]) showPage(pages[0].id);
      window.scrollTo(0, 0);
      return;
    }
    if (isSingle && showPage(hash)) {
      window.scrollTo(0, 0);
      return;
    }
    var el = document.getElementById(hash);
    if (!el) {
      if (isSingle) window.scrollTo(0, 0);
      return;
    }
    if (isSingle) {
      var owner = el.closest(".ex-page");
      if (owner) showPage(owner.id);
    }
    el.scrollIntoView();
  }

  // The live hook (window.ExShell, below) needs to learn about
  // *every* navigation this function resolves — a page switch, a landing
  // on an anchor inside another page, or a same-page anchor scroll — so
  // the public `navigateToHash` wraps the original logic (now
  // `navigateToHashInner`, unchanged) with one shared notification step,
  // rather than threading a call through each of its early returns.
  function navigateToHash(hash) {
    navigateToHashInner(hash);
    notifyPageChange();
  }

  // ---------------------------------------------------- live hook ---
  // A minimal, additive, read/navigate-only surface so a live-wiring
  // pattern module (ask.live.js, presenter.live.js — neither of which
  // reaches into shell.js's own closures) can learn the current page and
  // move the viewer to another one. Every routing decision above is
  // unchanged; this only observes and replays it.
  function currentPageId() {
    if (!isSingle) return pages[0] ? pages[0].id : null; // --multi: exactly one page per file
    var visible = null;
    pages.forEach(function (p) {
      if (!p.hidden) visible = p;
    });
    return visible ? visible.id : null;
  }

  var pageChangeListeners = [];

  function notifyPageChange() {
    var id = currentPageId();
    var hash = location.hash.slice(1);
    var section = hash && hash !== id ? hash : null;
    pageChangeListeners.forEach(function (fn) {
      try {
        fn(id, section);
      } catch (e) {
        /* a listener's own bug must never break navigation */
      }
    });
  }

  // Moves the viewer to `pageId`/`sectionId`: in the single shape, exactly
  // like clicking an in-page link (pushes the hash, then routes through
  // navigateToHash like any other navigation); in --multi, where a
  // different page is a different file, a same-page section is a plain
  // hash and a different page is a real navigation.
  function navigateTo(pageId, sectionId) {
    if (!pageId) return;
    if (isSingle) {
      try {
        history.pushState(null, "", "#" + (sectionId || pageId));
      } catch (e) {
        /* ignore */
      }
      navigateToHash(sectionId || pageId);
      return;
    }
    if (pageId === currentPageId()) {
      if (sectionId) location.hash = sectionId;
      return;
    }
    location.href = pageId + ".html" + (sectionId ? "#" + sectionId : "");
  }

  window.ExShell = {
    currentPageId: currentPageId,
    navigateTo: navigateTo,
    onPageChange: function (fn) {
      if (typeof fn === "function") pageChangeListeners.push(fn);
    },
  };

  function landOnCurrentHash() {
    navigateToHash(location.hash.slice(1));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", landOnCurrentHash);
  } else {
    landOnCurrentHash();
  }
  window.addEventListener("hashchange", landOnCurrentHash);

  document.addEventListener("click", function (e) {
    if (!isSingle) return; // --multi: real files: let the browser navigate normally
    var a = e.target.closest('a[href^="#"]');
    if (!a || a.classList.contains("ex-term")) return; // ex-term never navigates (opens a popover instead)
    var id = a.getAttribute("href").slice(1);
    if (!id) return;
    // A `#info=<key>`/`#<page>/info=<key>` deep link
    // (core/patterns/info/info.js) is never a page/anchor id this shell
    // routes — it's a key info.js's own `hashchange` listener resolves.
    // Found reviewing the demo artifact: this handler used to
    // intercept the click anyway, preventDefault + pushState (which never
    // fires `hashchange`) + navigateToHash("info=…") (which resolves
    // nothing, since "info=…" is neither a real page id nor a real
    // element id) — so the click did nothing at all. Returning here before
    // preventDefault lets the browser set the hash the normal way, which
    // does fire `hashchange`, which info.js is already listening for.
    if (/(?:^|\/)info=/.test(id)) return;
    e.preventDefault();
    try {
      history.pushState(null, "", "#" + id);
    } catch (err) {
      /* ignore */
    }
    navigateToHash(id);
  });

  // ------------------------------------------------------------------ theme ---
  (function themeInit() {
    var KEY = "explainer-theme";
    var root = document.documentElement;
    var btn = document.getElementById("ex-theme-toggle");
    if (!btn) return;

    function apply(mode) {
      if (mode === "light" || mode === "dark") root.setAttribute("data-theme", mode);
      else root.removeAttribute("data-theme");
      btn.textContent = "Theme: " + (mode || "auto");
      btn.setAttribute("aria-label", "Toggle color theme (currently " + (mode || "auto") + ")");
    }

    var saved = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch (e) {
      /* storage may be blocked */
    }
    apply(saved);

    btn.addEventListener("click", function () {
      var cur = root.getAttribute("data-theme");
      var next = cur === "dark" ? "light" : cur === "light" ? null : "dark";
      apply(next);
      try {
        if (next) localStorage.setItem(KEY, next);
        else localStorage.removeItem(KEY);
      } catch (e) {
        /* storage may be blocked */
      }
    });
  })();

  // -------------------------------------------------------- "Pages" drawer ---
  (function pagesToggle() {
    var btn = document.querySelector(".ex-pages-toggle");
    var menu = document.getElementById("ex-menu");
    if (!btn || !menu) return;
    btn.addEventListener("click", function () {
      var open = menu.classList.toggle("ex-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        menu.classList.remove("ex-open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  })();
})();
