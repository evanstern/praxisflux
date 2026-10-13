"use strict";
/* core/patterns/info — the "info" component's runtime. Moved wholesale out
   of core/shell/shell.js's `ExInfo`/`initTerms`/`initPanels` — the shell
   keeps only navigation,
   theme and the "Pages" drawer; this file ships only on a page that
   actually uses a trigger (lib/shell.mjs's BUILD_OWNED_IMPLIES /
   collectPatternNames), same as any other pattern.

   Two data sources feed one shared dialog (ensure/open/close/position,
   below):
     - TERMS (contents.terms[], embedded as `#ex-terms-data` JSON, global —
       unchanged shape from before this task, now with a build-precomputed
       `seeHref` fixing the survey's defect #1: the reference guessed the
       Terms page's href at runtime and got it wrong in a multi-file site;
       the build already knows which page is the generated Terms page and
       whether this is single or --multi, so it's correct by construction).
     - `.ex-info-entry` elements — the SAME markup that is both the no-JS
       "More detail" fallback and this runtime's own data source for
       every `<x-info-body>`/legacy panels[] body. There is no second,
       separate JSON blob for these: info.js reads title/body/footer
       straight off the DOM the build already wrote, decorated with
       `data-info-key`/`data-info-mode`/`data-info-scope`/
       `data-info-seq`/`data-info-order`.

   Every trigger shape (`<x-info>`'s `a.ex-info-trigger`, a hand-authored
   `data-info`/`data-panel` element, and `a.ex-term[data-term]`) opens
   through the same `open()`/`close()`/`positionPopover()` engine — "one
   component" means one engine, not one data model; terms keep their
   own small data path (TERMS_BY_KEY) because their content lives in
   contents.json, not in a `.ex-info-entry` element.

   Defects fixed:
     1. "Full definition on Terms" link always points at the real Terms
        page/anchor (seeHref, precomputed at build time — see above).
     2. close() restoring focus to the trigger can never reopen it: a
        `suppressReopen` flag, set synchronously in close() and cleared on
        the next tick, is checked by every open-trigger handler.
     3. The dialog always has an accessible name (aria-label computed from
        the term/title, or the trigger's own text when there's no title at
        all — never a dangling aria-labelledby pointing at an empty node);
        an existing `role` is never overwritten (only added when absent);
        `aria-controls` names the real dialog id.
     4. The popover repositions on scroll/resize while open, not just once
        at open time.
     5. A real entrance transition (CSS, info.css) that's never just
        "declared" — a forced layout flush + next-frame class toggle
        guarantees the browser actually computes a transition between two
        different states.
     6. (found reviewing this component's own demo artifact) A `#info=<key>`
        deep link whose real trigger lives on a page other than the
        one currently showing used to open anyway, leaving the reader on
        the wrong page while a popover tried — and failed — to position
        itself against an invisible, zero-size element (pinned at the
        top-left corner, over the chrome). `openByKey` now finds the key's
        real trigger (if any), navigates there first through `ExShell`
        (same router a menu/pager click uses), and only treats the trigger
        as live — anchor a popover to it, scroll it into view — once that
        navigation has actually made its page visible; a popover with
        nothing live to anchor to opens as a panel instead (never
        unanchored).

   Amendment (operator bug report): a
   trigger clicked *inside* an already-open panel/sheet used to reuse the
   SAME dialog instance — opening a nested popover replaced the panel's own
   body, destroying the very element the popover needed to anchor against
   (pinned at (0,0) over the chrome, same failure mode as defect #6 above,
   different trigger). A nested POPOVER-mode trigger now opens as a second,
   independent dialog (ensureNested/openNestedPopover et al., below),
   layered above the panel, anchored to the clicked text, with its own
   Esc/outside-click/close-button/focus-return semantics — the panel
   underneath is never touched. A nested PANEL-mode trigger instead replaces
   the (same) panel's content and pushes the old content onto a small
   `panelStack`, surfaced as a "← Back" control (pushFrame/popFrame). The
   same guard
   extends defect #6's "never unanchored" guard to this path: a popover
   trigger that's detached or zero-size at open *or* reposition time never
   renders pinned nowhere — it falls back to a panel (top-level) or the
   nested layer simply never opens / closes itself (nested).

   Event delegation (a single document-level click/keydown listener, never
   one-per-element) means a trigger injected into the DOM later — including
   a nested trigger inside a body's own HTML, rendered into the open dialog
   — works with no extra wiring (nested triggers inside an open body
   work). */
(function () {
  function readJSON(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    try {
      return JSON.parse(el.textContent);
    } catch (e) {
      return null;
    }
  }

  var TERMS = readJSON("ex-terms-data") || [];
  var TERMS_BY_KEY = {};
  TERMS.forEach(function (t) {
    TERMS_BY_KEY[t.key] = t;
  });

  // ============================================================ dialog engine ===
  var root, box, titleEl, bodyEl, navEl, closeBtn, backBtn, backdrop;
  var lastTrigger = null;
  var activeEntryEl = null;
  var suppressReopen = false;
  var repositionBound = false;
  // A small stack of {title, html, entryEl} snapshots of whatever the
  // panel showed before a nested panel-mode trigger replaced it — depth >= 2
  // is allowed (house style `info-one-level` only *discourages* authoring
  // this; the engine itself must never misbehave when it happens anyway).
  var panelStack = [];

  // The nested popover is a second, independent dialog layered above
  // the panel — its own root/box/title/body/close button, never the same
  // nodes as the top-level dialog above.
  var nestedRoot, nestedBox, nestedTitleEl, nestedBodyEl, nestedCloseBtn;
  var nestedTrigger = null;
  var nestedRepositionBound = false;

  function ensure() {
    if (root) return;
    root = document.createElement("div");
    root.className = "ex-info";
    root.hidden = true;
    root.innerHTML =
      '<div class="ex-info-backdrop"></div>' +
      '<div class="ex-info-box" role="dialog" aria-modal="false">' +
      '<button type="button" class="ex-info-close" aria-label="Close">&times;</button>' +
      '<button type="button" class="ex-info-back" hidden>&larr; Back</button>' +
      '<div class="ex-info-title" id="ex-info-title"></div>' +
      '<div class="ex-info-body"></div>' +
      '<div class="ex-info-nav" hidden></div>' +
      "</div>";
    document.body.appendChild(root);
    box = root.querySelector(".ex-info-box");
    titleEl = root.querySelector(".ex-info-title");
    bodyEl = root.querySelector(".ex-info-body");
    navEl = root.querySelector(".ex-info-nav");
    closeBtn = root.querySelector(".ex-info-close");
    backBtn = root.querySelector(".ex-info-back");
    backdrop = root.querySelector(".ex-info-backdrop");

    closeBtn.addEventListener("click", close);
    backBtn.addEventListener("click", popFrame);
    backdrop.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      // A nested popover's own Esc closes only that layer; a second
      // Esc (nested already closed, or none ever opened) closes the panel.
      if (nestedRoot && !nestedRoot.hidden) {
        closeNestedPopover();
        return;
      }
      if (!root.hidden) close();
    });
    document.addEventListener("click", function (e) {
      if (root.hidden) return;
      if (root.getAttribute("data-mode") !== "popover") return;
      if (box.contains(e.target) || (lastTrigger && lastTrigger.contains(e.target))) return;
      close();
    });
    // An outside click while a nested popover is open closes only
    // that layer — "outside the popover but inside the panel" counts as
    // outside for this purpose, same as a click truly outside everything
    // (which also reaches the panel's own backdrop/outside-popover-click
    // handlers above, closing the panel too — both outcomes are correct,
    // and closeNestedPopover() below is a safe no-op if already closed).
    document.addEventListener("click", function (e) {
      if (!nestedRoot || nestedRoot.hidden) return;
      if (nestedBox.contains(e.target) || (nestedTrigger && nestedTrigger.contains(e.target))) return;
      closeNestedPopover();
    });
  }

  function stripTags(html) {
    return String(html || "").replace(/<[^>]*>/g, "").trim();
  }

  /** A popover's anchor is only ever "live" when it's actually on-screen with real size — a detached node (removed from the DOM) and a hidden/collapsed one both report a zero-size rect in a real browser, so this one check catches both without needing a separate `document.contains()` test. */
  function isLiveAnchor(el) {
    if (!el || typeof el.getBoundingClientRect !== "function") return false;
    var r;
    try {
      r = el.getBoundingClientRect();
    } catch (e) {
      return false;
    }
    return !!(r && (r.width > 0 || r.height > 0));
  }

  function unbindReposition() {
    if (!repositionBound) return;
    window.removeEventListener("scroll", onReposition, true);
    window.removeEventListener("resize", onReposition);
    repositionBound = false;
  }

  function onReposition() {
    if (!root || root.hidden || root.getAttribute("data-mode") !== "popover" || !lastTrigger) return;
    positionPopover(lastTrigger);
  }

  function bindReposition() {
    if (repositionBound) return;
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);
    repositionBound = true;
  }

  function renderSeqNav(entryEl) {
    if (!entryEl) {
      navEl.hidden = true;
      navEl.innerHTML = "";
      return;
    }
    var seq = entryEl.getAttribute("data-info-seq");
    if (!seq) {
      navEl.hidden = true;
      navEl.innerHTML = "";
      return;
    }
    var all = Array.prototype.slice.call(document.querySelectorAll('.ex-info-entry[data-info-seq="' + seq.replace(/"/g, "") + '"]'));
    all.sort(function (a, b) {
      return Number(a.getAttribute("data-info-order") || 0) - Number(b.getAttribute("data-info-order") || 0);
    });
    var idx = all.indexOf(entryEl);
    if (idx === -1 || all.length < 2) {
      navEl.hidden = true;
      navEl.innerHTML = "";
      return;
    }
    navEl.hidden = false;
    navEl.innerHTML =
      '<button type="button" class="ex-info-prev"' + (idx === 0 ? " disabled" : "") + ">&larr; Previous</button>" +
      '<button type="button" class="ex-info-next"' + (idx === all.length - 1 ? " disabled" : "") + ">Next &rarr;</button>";
    var prevBtn = navEl.querySelector(".ex-info-prev");
    var nextBtn = navEl.querySelector(".ex-info-next");
    if (prevBtn && idx > 0) {
      prevBtn.addEventListener("click", function () {
        navigateSeq(all[idx - 1]);
      });
    }
    if (nextBtn && idx < all.length - 1) {
      nextBtn.addEventListener("click", function () {
        navigateSeq(all[idx + 1]);
      });
    }
  }

  /** seq prev/next must stay within whatever body is currently shown: at the root frame (no panel-in-panel push yet) this is the original, full top-level re-open (unchanged); inside a pushed nested-panel frame it's an in-place content swap at the SAME depth — never a new push, never a pop. */
  function navigateSeq(nextEntry) {
    if (panelStack.length === 0) {
      openFromEntry(nextEntry, lastTrigger);
    } else {
      renderFrame(entryFrame(nextEntry));
    }
  }

  /** Forces a layout flush, then (next frame) flips `data-anim="settled"` so the CSS transition actually has two distinct states to animate between (defect #5 — a transition merely *declared* never fires without this). */
  function playEntranceTransition() {
    root.removeAttribute("data-anim");
    // eslint-disable-next-line no-unused-expressions
    box.offsetHeight; // force layout
    requestAnimationFrame(function () {
      root.setAttribute("data-anim", "settled");
    });
  }

  /** defect #3's accessible-name logic, factored out so a panel-in-panel frame change recomputes it for the new title too, not just the dialog's very first open(). */
  function applyAccessibleName(title) {
    var accessibleName = stripTags(title) || (lastTrigger ? stripTags(lastTrigger.textContent) : "") || "More detail";
    if (title) {
      box.setAttribute("aria-labelledby", "ex-info-title");
      box.removeAttribute("aria-label");
    } else {
      box.removeAttribute("aria-labelledby");
      box.setAttribute("aria-label", accessibleName);
    }
  }

  function renderBackControl() {
    if (backBtn) backBtn.hidden = panelStack.length === 0;
  }

  /** Sets the panel's title/body/seq-nav/accessible-name/back-control from a `{title, html, entryEl}` frame — shared by the dialog's very first open() and every later in-place content swap (panel-in-panel push/pop, seq nav within a pushed frame) that must NOT reset position, trigger, or animation state. */
  function renderFrame(frame) {
    titleEl.innerHTML = frame.title || "";
    titleEl.hidden = !frame.title;
    bodyEl.innerHTML = frame.html || "";
    decorateTriggers(bodyEl);
    addDiagramBadges(bodyEl);
    activeEntryEl = frame.entryEl || null;
    renderSeqNav(activeEntryEl);
    applyAccessibleName(frame.title);
    renderBackControl();
  }

  /** A panel-mode trigger inside the open panel replaces its content; the content that was there is pushed onto `panelStack` so "← Back" can restore it exactly. */
  function pushFrame(frame) {
    panelStack.push({ title: titleEl.innerHTML, html: bodyEl.innerHTML, entryEl: activeEntryEl });
    renderFrame(frame);
    focusAfterFrameChange();
  }

  /** "← Back" (or a second Esc at the root frame only closes the whole panel — popFrame is never reached then, since backBtn is hidden at depth 0). */
  function popFrame() {
    if (panelStack.length === 0) return;
    var prev = panelStack.pop();
    renderFrame(prev);
    focusAfterFrameChange();
  }

  function focusAfterFrameChange() {
    if (panelStack.length > 0 && backBtn) backBtn.focus();
    else closeBtn.focus();
  }

  function open(mode, opts) {
    ensure();
    // A fresh top-level open always starts clean: no stray nested popover,
    // no leftover back-stack from whatever was open before.
    closeNestedPopover();
    panelStack = [];
    root.hidden = false;
    root.setAttribute("data-mode", mode);

    lastTrigger = opts.trigger || null;
    if (lastTrigger) {
      lastTrigger.setAttribute("aria-expanded", "true");
      lastTrigger.setAttribute("aria-controls", "ex-info-box");
    }
    box.id = "ex-info-box";

    renderFrame({ title: opts.title, html: opts.html, entryEl: opts.entryEl || null });

    box.style.top = box.style.left = box.style.right = box.style.bottom = "";
    if (mode === "popover" && opts.trigger && window.innerWidth > 640) {
      positionPopover(opts.trigger);
      bindReposition();
    } else {
      unbindReposition();
    }
    playEntranceTransition();
    suppressReopen = false;
    closeBtn.focus();
  }

  function positionPopover(trigger) {
    box.style.visibility = "hidden";
    box.style.left = "0px";
    box.style.top = "0px";
    requestAnimationFrame(function () {
      if (root.hidden) return;
      var r = trigger.getBoundingClientRect();
      var bw = box.offsetWidth,
        bh = box.offsetHeight;
      var left = Math.min(Math.max(8, r.left), window.innerWidth - bw - 8);
      var top = r.bottom + 8;
      if (top + bh > window.innerHeight - 8) top = Math.max(8, r.top - bh - 8);
      box.style.left = left + "px";
      box.style.top = top + "px";
      box.style.visibility = "visible";
    });
  }

  function close() {
    if (!root || root.hidden) return;
    closeNestedPopover();
    root.hidden = true;
    unbindReposition();
    clearInfoHashIfPresent();
    panelStack = [];
    if (backBtn) backBtn.hidden = true;
    var trigger = lastTrigger;
    lastTrigger = null;
    activeEntryEl = null;
    if (trigger) {
      trigger.setAttribute("aria-expanded", "false");
      // defect #2: close() refocusing the trigger must never reopen it —
      // a trigger whose own handler fires synchronously from this focus()
      // call (or from the same event loop turn) sees suppressReopen and
      // bails; cleared on the next tick so a later, real interaction works.
      suppressReopen = true;
      trigger.focus();
      setTimeout(function () {
        suppressReopen = false;
      }, 0);
    }
  }

  /** Extracts a `{title, html, entryEl}` frame straight off a `.ex-info-entry` element's own DOM — the single data source for every panel/popover body. */
  function entryFrame(entryEl) {
    var titleNode = entryEl.querySelector(".ex-info-entry-title");
    var bodyNode = entryEl.querySelector(".ex-info-entry-body");
    var filesNode = entryEl.querySelector(".ex-info-files");
    var seeNode = entryEl.querySelector(".ex-info-see");
    var html = (bodyNode ? bodyNode.innerHTML : "") + (filesNode ? filesNode.outerHTML : "") + (seeNode ? seeNode.outerHTML : "");
    return { title: titleNode ? titleNode.innerHTML : "", html: html, entryEl: entryEl };
  }

  /** Same, for a term definition (contents.json's TERMS, not a `.ex-info-entry` — its own separate small data path). */
  function termFrame(def) {
    var html = def.def;
    if (def.seeHref) {
      html += ' <a href="' + def.seeHref + '" class="ex-info-more">Full definition on Terms &rarr;</a>';
    }
    return { title: def.term, html: html, entryEl: null };
  }

  function openFromEntry(entryEl, trigger) {
    if (!entryEl) return;
    var mode = entryEl.getAttribute("data-info-mode") || "panel";
    // Deep-link defect fix (#6), extended to this path too: a popover with nothing
    // live to anchor to — no trigger at all, or one that's detached/
    // zero-size — must never render pinned at (0,0)/top-left over the
    // chrome; fall back to the panel the engine already renders perfectly
    // well with no anchor at all.
    if (mode === "popover" && !isLiveAnchor(trigger)) mode = "panel";
    var frame = entryFrame(entryEl);
    open(mode, { title: frame.title, html: frame.html, trigger: trigger, entryEl: frame.entryEl });
  }

  function openTerm(key, trigger) {
    var def = TERMS_BY_KEY[key];
    if (!def) return;
    // Same defect fix as openFromEntry: a term deep-linked (or otherwise
    // opened) with no live trigger to anchor against opens as a panel,
    // never an unanchored popover.
    var mode = isLiveAnchor(trigger) ? "popover" : "panel";
    var frame = termFrame(def);
    open(mode, { title: frame.title, html: frame.html, trigger: trigger, entryEl: frame.entryEl });
  }

  // --------------------------------------------------- nested popover
  function ensureNested() {
    if (nestedRoot) return;
    nestedRoot = document.createElement("div");
    nestedRoot.className = "ex-info ex-info-nested";
    nestedRoot.hidden = true;
    nestedRoot.setAttribute("data-mode", "popover");
    nestedRoot.innerHTML =
      '<div class="ex-info-box ex-info-nested-box" role="dialog" aria-modal="false">' +
      '<button type="button" class="ex-info-close" aria-label="Close">&times;</button>' +
      '<div class="ex-info-title" id="ex-info-nested-title"></div>' +
      '<div class="ex-info-body"></div>' +
      "</div>";
    document.body.appendChild(nestedRoot);
    nestedBox = nestedRoot.querySelector(".ex-info-box");
    nestedTitleEl = nestedRoot.querySelector(".ex-info-title");
    nestedBodyEl = nestedRoot.querySelector(".ex-info-body");
    nestedCloseBtn = nestedRoot.querySelector(".ex-info-close");
    nestedCloseBtn.addEventListener("click", closeNestedPopover);
  }

  /**
   * A popover-mode trigger clicked INSIDE the already-open top-level
   * dialog opens as a second, independent dialog layered above it, anchored
   * to the clicked text — never replacing the outer dialog's own body (the
   * operator's bug report: an orderId panel's own "order ID" term popover
   * ended up pinned top-left because the old single-dialog engine replaced
   * the panel body, destroying the trigger it needed to anchor against).
   * The outer dialog (panel or popover) is left completely untouched.
   */
  function openNestedPopover(trigger, frame) {
    if (!isLiveAnchor(trigger)) return; // never render a popover unanchored
    ensureNested();
    nestedTrigger = trigger;
    nestedBox.id = "ex-info-nested-box";
    nestedTitleEl.innerHTML = frame.title || "";
    nestedTitleEl.hidden = !frame.title;
    nestedBodyEl.innerHTML = frame.html || "";
    decorateTriggers(nestedBodyEl);
    addDiagramBadges(nestedBodyEl);

    var accessibleName = stripTags(frame.title) || stripTags(trigger.textContent) || "More detail";
    if (frame.title) {
      nestedBox.setAttribute("aria-labelledby", "ex-info-nested-title");
      nestedBox.removeAttribute("aria-label");
    } else {
      nestedBox.removeAttribute("aria-labelledby");
      nestedBox.setAttribute("aria-label", accessibleName);
    }
    trigger.setAttribute("aria-expanded", "true");
    trigger.setAttribute("aria-controls", "ex-info-nested-box");

    nestedRoot.hidden = false;
    nestedBox.style.top = nestedBox.style.left = nestedBox.style.right = nestedBox.style.bottom = "";
    if (window.innerWidth > 640) {
      positionNestedPopover();
      bindNestedReposition();
    } else {
      // Phone: CSS alone renders this as a second, smaller bottom sheet
      // stacked above the panel's own sheet — no inline position needed
      // (and `visibility` is cleared defensively too, in case this same
      // nested dialog node was last positioned as a desktop popover).
      nestedBox.style.visibility = "";
      unbindNestedReposition();
    }
    playNestedEntranceTransition();
    suppressReopen = false;
    nestedCloseBtn.focus();
  }

  function positionNestedPopover() {
    nestedBox.style.visibility = "hidden";
    nestedBox.style.left = "0px";
    nestedBox.style.top = "0px";
    requestAnimationFrame(function () {
      if (!nestedRoot || nestedRoot.hidden) return;
      if (!isLiveAnchor(nestedTrigger)) {
        // Reposition-time guard: the anchor went away underneath us
        // (e.g. the panel navigated away from the content that held it) —
        // never pin the nested popover at (0,0); just close that layer.
        closeNestedPopover();
        return;
      }
      var r = nestedTrigger.getBoundingClientRect();
      var bw = nestedBox.offsetWidth,
        bh = nestedBox.offsetHeight;
      var left = Math.min(Math.max(8, r.left), window.innerWidth - bw - 8);
      var top = r.bottom + 8;
      if (top + bh > window.innerHeight - 8) top = Math.max(8, r.top - bh - 8);
      nestedBox.style.left = left + "px";
      nestedBox.style.top = top + "px";
      nestedBox.style.visibility = "visible";
    });
  }

  function onNestedReposition() {
    if (!nestedRoot || nestedRoot.hidden) return;
    if (window.innerWidth <= 640) {
      // A resize crossed down into phone width while the nested popover
      // was still anchored as a desktop popover — clear the inline
      // left/top/visibility that anchoring left behind (regular inline
      // styles would otherwise keep outranking the phone sheet's own CSS,
      // same class of bug the `!important` in info.css's phone media query
      // fixes for the *unconditional* popover width) and stop listening;
      // the CSS bottom-sheet rules render it correctly with no JS help.
      nestedBox.style.top = nestedBox.style.left = nestedBox.style.right = nestedBox.style.bottom = "";
      nestedBox.style.visibility = "";
      unbindNestedReposition();
      return;
    }
    if (!isLiveAnchor(nestedTrigger)) {
      closeNestedPopover();
      return;
    }
    positionNestedPopover();
  }

  /** Repositions on the PANEL's own scroll (its body scrolls internally — `scroll` doesn't bubble, so this binds directly to `box`, not `document`/`window`) and on window resize — never on the page's own window scroll (the panel itself is `position: fixed`, unaffected by it). */
  function bindNestedReposition() {
    if (nestedRepositionBound) return;
    window.addEventListener("resize", onNestedReposition);
    if (box) box.addEventListener("scroll", onNestedReposition);
    nestedRepositionBound = true;
  }

  function unbindNestedReposition() {
    if (!nestedRepositionBound) return;
    window.removeEventListener("resize", onNestedReposition);
    if (box) box.removeEventListener("scroll", onNestedReposition);
    nestedRepositionBound = false;
  }

  function playNestedEntranceTransition() {
    nestedRoot.removeAttribute("data-anim");
    // eslint-disable-next-line no-unused-expressions
    nestedBox.offsetHeight; // force layout
    requestAnimationFrame(function () {
      nestedRoot.setAttribute("data-anim", "settled");
    });
  }

  /** Closes only the nested popover layer — the panel underneath is never touched — and returns focus to the trigger inside the panel that opened it (same close()/defect #2 reopen-guard pattern, reusing the one module-level `suppressReopen` flag every open-trigger handler already checks). */
  function closeNestedPopover() {
    if (!nestedRoot || nestedRoot.hidden) return;
    nestedRoot.hidden = true;
    unbindNestedReposition();
    var trigger = nestedTrigger;
    nestedTrigger = null;
    if (trigger) {
      trigger.setAttribute("aria-expanded", "false");
      suppressReopen = true;
      trigger.focus();
      setTimeout(function () {
        suppressReopen = false;
      }, 0);
    }
  }

  /** Dispatches a trigger clicked inside the already-open top-level dialog (panel or popover) to the right nested behaviour: popover-mode stacks a new layer above it; panel-mode replaces the dialog's own content with a "← Back" to restore it. */
  function handleNestedTriggerClick(trigger, termKey) {
    var frame, mode;
    if (termKey) {
      var def = TERMS_BY_KEY[termKey];
      if (!def) return;
      frame = termFrame(def);
      mode = "popover";
    } else {
      var id = trigger.getAttribute("data-info-target");
      var entry = id ? document.getElementById(id) : null;
      if (!entry) return;
      frame = entryFrame(entry);
      mode = entry.getAttribute("data-info-mode") || "panel";
    }
    if (mode === "popover") {
      openNestedPopover(trigger, frame);
    } else {
      pushFrame(frame);
    }
  }

  // ---------------------------------------------------------------- triggers
  /**
   * An accessible description of the action (an `aria-description`)
   * plus a `title` tooltip — read straight off the `data-info-mode` the
   * build already stamped (handleTerm/handleInfoTrigger/checkDataInfo,
   * lib/includes.mjs), so this needs no mode logic of its own, and applied
   * only at runtime (never overwriting an author-supplied `title`/
   * `aria-description`, same "never overwrite" stance as `role` below) —
   * the no-JS fallback still carries the real cue classes from CSS
   * alone, just not this extra description text.
   */
  function applyActionDescription(node) {
    var mode = node.getAttribute("data-info-mode");
    var text = mode === "popover" ? "Opens a definition" : "Opens a side panel";
    if (!node.hasAttribute("title")) node.setAttribute("title", text);
    if (!node.hasAttribute("aria-description")) node.setAttribute("aria-description", text);
  }

  function decorateTriggers(scope) {
    var root2 = scope || document;
    if (!root2.querySelectorAll) return;
    root2.querySelectorAll("[data-info-target]").forEach(function (node) {
      if (node.hasAttribute("data-ex-info-ready")) return;
      node.setAttribute("data-ex-info-ready", "");
      if (node.tagName !== "A") {
        if (!node.hasAttribute("tabindex")) node.setAttribute("tabindex", "0");
        if (!node.hasAttribute("role")) node.setAttribute("role", "button"); // defect: never overwrite an existing role
      }
      node.setAttribute("aria-haspopup", "dialog");
      if (!node.hasAttribute("aria-expanded")) node.setAttribute("aria-expanded", "false");
      applyActionDescription(node);
    });
    root2.querySelectorAll("a.ex-term[data-term]").forEach(function (node) {
      if (node.hasAttribute("data-ex-info-ready")) return;
      node.setAttribute("data-ex-info-ready", "");
      node.setAttribute("aria-haspopup", "dialog");
      if (!node.hasAttribute("aria-expanded")) node.setAttribute("aria-expanded", "false");
      applyActionDescription(node);
    });
  }

  /**
   * An SVG diagram-node corner badge — a small decorative circle+"i"
   * rendered from each clickable node's own bbox at load (classes only, no
   * colour attribute — core/patterns/info/info.css's `.ex-node-badge`
   * carries the var()s, same convention as `.ex-box`/`.ex-t`). `::after`/
   * `text-decoration` are not reliably rendered on an SVG `<g>` across
   * browsers, so a badge is the only way this cue happens for a diagram
   * node; it's purely decorative (`aria-hidden`) — the real accessible name
   * is the node's own text/`aria-label`, unchanged. Idempotent once it
   * actually succeeds (`data-ex-badge-done` is only set *after* a badge is
   * appended, never before) — a node on a page the shell still has
   * `hidden` at call time (every non-first `.ex-page` section, single-shape
   * build) has a zero-size `getBBox()` and is left eligible for a later
   * retry, which the shell's own `DOMContentLoaded`/`hashchange` listeners
   * (below) provide once that page actually becomes visible; a node whose
   * `getBBox` never works at all (every non-browser test DOM this plugin's
   * suite uses, and some headless environments) just never gets a badge,
   * harmlessly, forever. */
  function addDiagramBadges(scope) {
    var root2 = scope || (typeof document !== "undefined" ? document : null);
    if (!root2 || !root2.querySelectorAll) return;
    var NS = "http://www.w3.org/2000/svg";
    root2.querySelectorAll("svg [data-info-target]").forEach(function (node) {
      if (node.hasAttribute("data-ex-badge-done")) return;
      if (typeof node.getBBox !== "function" || typeof document === "undefined" || !document.createElementNS) return;
      var box;
      try {
        box = node.getBBox();
      } catch (e) {
        return;
      }
      if (!box || !(box.width > 0) || !(box.height > 0)) return;
      node.setAttribute("data-ex-badge-done", "");
      var r = Math.max(6, Math.min(9, Math.min(box.width, box.height) * 0.14));
      var cx = box.x + box.width - r - 2;
      var cy = box.y + r + 2;
      var badge = document.createElementNS(NS, "g");
      badge.setAttribute("class", "ex-node-badge");
      badge.setAttribute("aria-hidden", "true");
      var circle = document.createElementNS(NS, "circle");
      circle.setAttribute("cx", String(cx));
      circle.setAttribute("cy", String(cy));
      circle.setAttribute("r", String(r));
      badge.appendChild(circle);
      var label = document.createElementNS(NS, "text");
      label.setAttribute("x", String(cx));
      label.setAttribute("y", String(cy + r * 0.38));
      label.setAttribute("text-anchor", "middle");
      label.textContent = "i";
      badge.appendChild(label);
      node.appendChild(badge);
    });
  }

  function openInfoTrigger(trigger) {
    var id = trigger.getAttribute("data-info-target");
    var entry = id ? document.getElementById(id) : null;
    openFromEntry(entry, trigger);
  }

  document.addEventListener("click", function (e) {
    if (suppressReopen) return;
    var termTrigger = e.target.closest ? e.target.closest("a.ex-term[data-term]") : null;
    var infoTrigger = !termTrigger && e.target.closest ? e.target.closest("[data-info-target]") : null;
    var trigger = termTrigger || infoTrigger;
    if (!trigger) return;
    e.preventDefault();

    // A trigger clicked inside an already-open dialog — the
    // top-level panel/popover itself, or the nested popover layered above
    // it — is routed through the nesting-aware path instead of a fresh
    // top-level open(), which would otherwise destroy the very dialog the
    // click originated inside of.
    var insideNested = nestedRoot && !nestedRoot.hidden && nestedBox.contains(trigger);
    var insidePanel = root && !root.hidden && box.contains(trigger);
    if (insideNested || insidePanel) {
      if (insideNested) closeNestedPopover();
      handleNestedTriggerClick(trigger, termTrigger ? termTrigger.getAttribute("data-term") : null);
      return;
    }

    if (termTrigger) {
      openTerm(termTrigger.getAttribute("data-term"), termTrigger);
      return;
    }
    openInfoTrigger(infoTrigger);
  });

  document.addEventListener("keydown", function (e) {
    if (suppressReopen) return;
    if (e.key !== "Enter" && e.key !== " ") return;
    var target = e.target.closest ? e.target.closest("[data-info-target]") : null;
    if (target && target.tagName !== "A") {
      e.preventDefault();
      openInfoTrigger(target);
    }
  });

  // ------------------------------------------------------------- deep links
  // `#info=<key>` (single shape: searched across whatever this document
  // holds) or `<page>.html#info=<key>` (--multi: the browser's own
  // navigation already landed on the right file; the hash is handled the
  // same way once there, scoped to that file's own entries). Runs
  // alongside shell.js's own hashchange handling, which this never
  // interferes with: "info=..." never names a real element id or page id,
  // so shell.js's own lookups are harmless no-ops for this hash shape.
  function entriesByKey(key) {
    var all = document.querySelectorAll(".ex-info-entry[data-info-key]");
    var out = [];
    for (var i = 0; i < all.length; i += 1) {
      if (all[i].getAttribute("data-info-key") === key) out.push(all[i]);
    }
    return out;
  }

  function currentPageId() {
    return window.ExShell && typeof window.ExShell.currentPageId === "function" ? window.ExShell.currentPageId() : null;
  }

  function ownerPageIdOf(el) {
    if (!el) return null;
    var owner = el.closest(".ex-page");
    return owner ? owner.id : null;
  }

  /** Prefers a candidate already on the current page (no navigation needed); otherwise the first in document order. */
  function pickTrigger(candidates) {
    if (candidates.length === 0) return null;
    var here = currentPageId();
    if (here) {
      for (var i = 0; i < candidates.length; i += 1) {
        if (ownerPageIdOf(candidates[i]) === here) return candidates[i];
      }
    }
    return candidates[0];
  }

  function termTriggersFor(key) {
    return Array.prototype.slice.call(document.querySelectorAll('a.ex-term[data-term="' + key.replace(/"/g, "") + '"]'));
  }

  function triggersForDomId(domId) {
    return Array.prototype.slice.call(document.querySelectorAll('[data-info-target="' + domId.replace(/"/g, "") + '"]'));
  }

  /**
   * Deep-link defect fix (a): a key's real trigger may live on a page other
   * than the one currently showing (single shape hides every page but one)
   * — opening straight away left the reader on the wrong page while a
   * popover tried (and failed) to position itself against an invisible,
   * zero-sized element. Navigates there first, through the same router a
   * menu/pager click uses, so the reader sees the trigger's own page behind
   * whatever opens.
   */
  function navigateToOwnerIfNeeded(trigger) {
    var pageId = ownerPageIdOf(trigger);
    if (!pageId) return;
    var shell = window.ExShell;
    if (!shell || typeof shell.navigateTo !== "function") return;
    if (currentPageId() !== pageId) shell.navigateTo(pageId);
  }

  /** `trigger` only counts as something to anchor/scroll to once it's actually on-screen — after navigation, its own page section must no longer be hidden (defect fix (b): never an unanchored popover). */
  function liveTrigger(trigger) {
    if (!trigger) return null;
    var owner = trigger.closest(".ex-page");
    return !owner || !owner.hidden ? trigger : null;
  }

  function scrollIntoViewIfAny(trigger) {
    if (trigger && typeof trigger.scrollIntoView === "function") trigger.scrollIntoView({ block: "center" });
  }

  function openByKey(key) {
    if (TERMS_BY_KEY[key]) {
      var termTrigger = pickTrigger(termTriggersFor(key));
      navigateToOwnerIfNeeded(termTrigger);
      var liveTermTrigger = liveTrigger(termTrigger);
      openTerm(key, liveTermTrigger);
      scrollIntoViewIfAny(liveTermTrigger);
      return;
    }
    var entries = entriesByKey(key);
    if (entries.length === 0) return;
    var currentPage = currentPageId();
    var chosen = null;
    entries.forEach(function (e) {
      if (chosen) return;
      if (e.getAttribute("data-info-scope") === "global") chosen = e;
    });
    if (!chosen) {
      entries.forEach(function (e) {
        if (chosen) return;
        var owner = e.closest(".ex-page");
        if (owner && currentPage && owner.id === currentPage) chosen = e;
      });
    }
    if (!chosen) chosen = entries[0];

    var trigger = pickTrigger(triggersForDomId(chosen.id));
    navigateToOwnerIfNeeded(trigger);
    var live = liveTrigger(trigger);
    openFromEntry(chosen, live);
    scrollIntoViewIfAny(live);
  }

  var INFO_HASH_RE = /(?:^|\/)info=([^&]+)$/;

  function handleInfoHash() {
    var m = INFO_HASH_RE.exec(location.hash.slice(1));
    if (!m) return;
    openByKey(decodeURIComponent(m[1]));
  }

  /**
   * Clears a `#info=<key>`/`#<page>/info=<key>` hash back to the current
   * page id once its panel/popover closes (found reviewing the
   * demo artifact's own in-page deep link). `history.replaceState` —
   * never `pushState`, never a direct `location.hash =` assignment —
   * changes the URL without firing `hashchange`; if closing fired one,
   * `handleInfoHash` would immediately reopen what close() just closed.
   * Clearing it is what lets a *second* click on the exact same
   * `<a href="#info=key">` link reopen it: the browser only fires
   * `hashchange` when the hash value actually *changes*, and a repeat
   * click that lands on the same, still-current hash is not a change —
   * core/shell/shell.js's click handler now lets this href reach the
   * browser's own default navigation (its own fix, same task), which only
   * works at all if there's a real value change for it to make.
   */
  function clearInfoHashIfPresent() {
    if (typeof location === "undefined" || !INFO_HASH_RE.test(location.hash.slice(1))) return;
    var pageId = currentPageId();
    try {
      history.replaceState(null, "", pageId ? "#" + pageId : location.pathname + location.search);
    } catch (e) {
      /* ignore */
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", handleInfoHash);
  } else {
    handleInfoHash();
  }
  window.addEventListener("hashchange", handleInfoHash);

  decorateTriggers(document);
  addDiagramBadges(document);
  // A diagram node on any page but the first starts `hidden` in a
  // single-shape build's static markup (every `.ex-page` section but one),
  // so its `getBBox()` above is zero-size and addDiagramBadges leaves it
  // eligible for a retry. core/shell/shell.js's `navigateToHash` is the
  // *only* place that un-hides a page (`showPage`), and every path into it
  // — the initial `landOnCurrentHash`, a menu/pager click, a term's "Full
  // definition" link, `openByKey`'s own `navigateTo` above — ends by
  // calling `notifyPageChange()`, which is exactly `window.ExShell.
  // onPageChange`'s hook (most of those paths `preventDefault` +
  // `pushState`, which never fires a native `hashchange`, so that event
  // alone would miss them). Registering here, synchronously, is safe even
  // though shell.js's own un-hide is deferred to `DOMContentLoaded`: that
  // registration always runs before `DOMContentLoaded` fires.
  if (typeof window !== "undefined" && window.ExShell && typeof window.ExShell.onPageChange === "function") {
    window.ExShell.onPageChange(function () {
      addDiagramBadges(document);
    });
  }

  // -------------------------------------------------- dev-only demo hook
  // Headless-shell's `--screenshot` can't click anything — a real browser
  // repro of the nested popover (panel open, THEN its own term popover
  // open on top) needs some way to get there. Rather than teach info.js a
  // second, fake way to open a nested popover, this drives the exact same
  // PUBLIC surface a real user click already does: `openByKey` (unchanged,
  // the existing deep-link path) to open the panel, then a genuine synthetic
  // `.click()` on the matching term trigger *inside* that now-open body —
  // which runs through the real document-level delegation/nesting logic
  // above, same as any other click. Gated on
  // `document.documentElement.dataset.exDebug`, set only by the shoot
  // script's own injected copy of this page (never in a shipped build, and
  // never true for a real reader) — see scripts/test/info.test.mjs's
  // "nested popover" tests for the non-demo, non-browser equivalent of
  // this same path. `?ex-demo-open=<key>,<termKey>` (termKey optional).
  function runDemoOpenHook() {
    if (!document.documentElement || !document.documentElement.dataset || !document.documentElement.dataset.exDebug) return;
    var m = /[?&]ex-demo-open=([^&]+)/.exec((typeof location !== "undefined" && location.search) || "");
    if (!m) return;
    var parts = decodeURIComponent(m[1]).split(",");
    var key = parts[0];
    var termKey = parts[1];
    if (key) openByKey(key);
    if (termKey && bodyEl && bodyEl.querySelector) {
      var nestedTrigger = bodyEl.querySelector('a.ex-term[data-term="' + termKey.replace(/"/g, "") + '"]');
      if (nestedTrigger && typeof nestedTrigger.click === "function") nestedTrigger.click();
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runDemoOpenHook);
  } else {
    runDemoOpenHook();
  }

  var api = { open: open, close: close, openByKey: openByKey, openTerm: openTerm, openFromEntry: openFromEntry };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof globalThis !== "undefined") globalThis.ExplainerInfo = api;
})();
