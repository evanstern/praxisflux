"use strict";
/* core/patterns/presenter — owner toggle ("Start/Stop presenting") and a
   follower's "Follow presenter" toggle. CSS + markup + an INERT hook
   surface only — this file never calls `window.claude.use(...)` itself;
   presenter.live.js resolves the `db`/`user` capabilities and calls
   `ExplainerPresenter.enable(hooks)` once it has them. Until `enable()` is
   called — including on a page with no `window.claude` at all, where
   nothing ever calls it — every control stays `hidden`: a page without
   live wiring renders nothing, never a broken-looking button. */
(function (root) {
  function els(container) {
    return {
      toggle: container.querySelector(".ex-presenter-toggle"),
      follow: container.querySelector(".ex-presenter-follow"),
      badge: container.querySelector(".ex-presenter-badge"),
    };
  }

  function wireOne(container, hooks) {
    var e = els(container);
    var isOwner = Boolean(hooks.isOwner);
    var presenting = false;
    var following = hooks.followingDefault !== false;

    function renderAll() {
      if (e.toggle) {
        e.toggle.hidden = !isOwner;
        if (isOwner) {
          e.toggle.setAttribute("aria-pressed", presenting ? "true" : "false");
          e.toggle.textContent = presenting ? "Stop presenting" : "Start presenting";
        }
      }
      if (e.badge) e.badge.hidden = !(presenting && isOwner);
      if (e.follow) {
        e.follow.hidden = !(presenting && !isOwner);
        e.follow.setAttribute("aria-pressed", following ? "true" : "false");
        e.follow.textContent = following ? "Following presenter" : "Follow presenter";
      }
    }

    if (e.toggle) {
      e.toggle.addEventListener("click", function () {
        presenting = !presenting;
        renderAll();
        if (typeof hooks.onToggle === "function") hooks.onToggle(presenting);
      });
    }
    if (e.follow) {
      e.follow.addEventListener("click", function () {
        following = !following;
        renderAll();
        if (typeof hooks.onFollowToggle === "function") hooks.onFollowToggle(following);
      });
    }

    container.setAttribute("data-ex-presenter-ready", "");
    renderAll();

    return {
      setPresenting: function (value, page) {
        presenting = Boolean(value);
        renderAll();
        if (typeof hooks.onRemotePresenting === "function") hooks.onRemotePresenting(presenting, page);
      },
      setFollowing: function (value) {
        following = Boolean(value);
        renderAll();
      },
    };
  }

  /**
   * Called by the live wiring file once `db`/`user` are resolved. Wires
   * every `.ex-presenter` under `scopeEl` (default `document`) that isn't
   * already wired. `hooks`: `{ isOwner, followingDefault, onToggle
   * (presenting), onFollowToggle(following), onRemotePresenting(presenting,
   * page) }`. Returns one controller per container
   * (`{setPresenting, setFollowing}`) for the live wiring file to drive
   * from the live `db` document's `onSnapshot`. Before this is ever
   * called, every `.ex-presenter` control stays hidden: no-op without
   * wiring.
   */
  function enable(hooks, scopeEl) {
    var scope = scopeEl || (typeof document !== "undefined" ? document : null);
    if (!scope || !scope.querySelectorAll) return [];
    var controllers = [];
    scope.querySelectorAll(".ex-presenter:not([data-ex-presenter-ready])").forEach(function (container) {
      controllers.push(wireOne(container, hooks || {}));
    });
    return controllers;
  }

  var api = { enable: enable };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ExplainerPresenter = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
