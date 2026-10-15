"use strict";
/* core/patterns/presenter/presenter.live.js — the live wiring for the
   `presenter` pattern. Resolves the
   Artifact `db` + `user` capabilities and calls
   `ExplainerPresenter.enable(hooks)` (presenter.js, unchanged) once it
   knows whether this viewer owns the artifact. Inlined by the build
   (lib/shell.mjs's resolvePatterns) only when `contents.live.presenter`
   is true.

   This file ships verbatim inside the published page, so its comments
   describe behavior in plain language rather than citing any internal
   ticket, task, or decision-record id (the build's own
   fact.no-internal-codes check enforces exactly that for every other
   piece of published content; the same rule applies to a pattern's own
   source).

   Data model (one document, `live/state`):
     { presenting: boolean, page: string|null, section: string|null,
       updatedAt: string (ISO) }
   Access rule (live-state.rules.js, same folder): write access is
   limited to the artifact's actual owner specifically — stricter than
   any editor-level access — and read access is left open to every
   admitted viewer, so anyone can see who is presenting.

   Capability call shapes are taken from the live Artifact-capabilities
   runtime contract, read in full before writing this file — never
   guessed:
     - `await claude.use("db")` resolves the db namespace or null;
       `db.doc("live/state")` is a two-segment document path; `.set(body)`
       (whole-document replace, creates the document on first write) and
       `.onSnapshot(next, error)` are the only verbs this file calls. One
       write at a time per document, only on a real state change (never
       from a snapshot callback or a timer) — every write below comes
       from a deliberate viewer click or from this viewer's own
       already-presenting navigation, never from the snapshot callback
       itself.
     - `await claude.use("user")` resolves the user namespace or null;
       `user.isOwner()` resolves a boolean, false when there is no
       viewer — exactly presenter.js's `hooks.isOwner` contract.

   Null-capability safety: every guard below returns before calling
   `window.claude.use(...)` when `window.claude` doesn't exist, and
   `ExplainerPresenter.enable()` is only ever called once both `db` and
   `user` resolve non-null — when either is null (not served, not
   granted, or no viewer), every `.ex-presenter` control stays hidden
   exactly as presenter.js's own "before enable()" contract promises. */
(function () {
  if (typeof window === "undefined") return;
  if (!window.claude || typeof window.claude.use !== "function") return;
  if (!window.ExplainerPresenter || typeof window.ExplainerPresenter.enable !== "function") return;

  var FOLLOW_KEY = "explainer-presenter-follow";

  function readFollowDefault() {
    try {
      var stored = window.localStorage.getItem(FOLLOW_KEY);
      return stored === null ? true : stored === "1"; // same convention as shell.js's theme toggle
    } catch (e) {
      return true; // storage may be blocked — default to following, same as presenter.js's own default
    }
  }

  function writeFollowDefault(following) {
    try {
      window.localStorage.setItem(FOLLOW_KEY, following ? "1" : "0");
    } catch (e) {
      /* storage may be blocked — the choice just doesn't persist across loads */
    }
  }

  // Shell routing surface (core/shell/shell.js's additive ExShell hook) —
  // absent only if this file were ever loaded without shell.js, which the
  // build never does; guarded anyway, same as every other unexpected-
  // absence case in this file.
  var shell = window.ExShell || {
    currentPageId: function () {
      return null;
    },
    navigateTo: function () {
      /* no-op: no routing surface to drive */
    },
    onPageChange: function () {
      /* no-op: nothing to subscribe to */
    },
  };

  Promise.all([window.claude.use("db"), window.claude.use("user")]).then(
    function (resolved) {
      var db = resolved[0];
      var user = resolved[1];
      if (!db || !user) return; // either capability absent/not granted — stay read-only

      user.isOwner().then(function (isOwner) {
        var stateDoc = db.doc("live/state");
        var ownerPresenting = false; // this viewer's own last-known toggle state (owner only)
        var lastRemoteState = null; // most recent onSnapshot payload, for the follow-toggle jump
        var following = readFollowDefault();

        function sectionFromHash() {
          var hash = window.location.hash.slice(1);
          var pageId = shell.currentPageId();
          if (!hash || hash === pageId) return null;
          return hash;
        }

        // .set() (not an incremental merge): it must succeed whether or
        // not `live/state` already exists yet, and the whole-document
        // replace is fine here since this viewer (the owner) is the only
        // one ever allowed to write it.
        function writeLiveState(partial) {
          var body = {
            presenting: false,
            page: null,
            section: null,
          };
          for (var key in partial) if (Object.prototype.hasOwnProperty.call(partial, key)) body[key] = partial[key];
          body.updatedAt = new Date().toISOString();
          stateDoc.set(body).catch(function () {
            // Writes are last-writer-wins with no transactions: a
            // rejected write just leaves the previous state in place —
            // never a page error. Resource/quota rejections are the
            // artifact owner's problem to notice from the data store
            // itself, not this page's to surface.
          });
        }

        var controllers =
          window.ExplainerPresenter.enable({
            isOwner: isOwner,
            followingDefault: following,
            onToggle: function (presenting) {
              ownerPresenting = presenting;
              if (presenting) {
                writeLiveState({ presenting: true, page: shell.currentPageId(), section: sectionFromHash() });
              } else {
                writeLiveState({ presenting: false, page: null, section: null });
              }
            },
            onFollowToggle: function (nowFollowing) {
              following = nowFollowing;
              writeFollowDefault(nowFollowing);
              if (nowFollowing && lastRemoteState && lastRemoteState.presenting) {
                shell.navigateTo(lastRemoteState.page, lastRemoteState.section);
              }
            },
            onRemotePresenting: function (presenting, page) {
              // Fired by every controller.setPresenting() call below —
              // both the owner's own write echoing back (ignored: the
              // owner never navigates from their own state) and a
              // follower's actual remote update.
              if (isOwner) return;
              if (presenting && following) shell.navigateTo(page, lastRemoteState && lastRemoteState.section);
            },
          }) || [];

        // Owner-only: while presenting, this viewer's own in-document
        // navigation (hash links, menu, pager, a term's "full definition"
        // link) re-publishes `live/state` with the new page/section. A
        // page shape with no same-document navigation to hook (every
        // page its own file) has no in-document moment to catch here:
        // there, each new page is a fresh load, so an owner who is
        // already presenting (read back from `live/state` just below)
        // re-announces their position once on THIS load instead.
        shell.onPageChange(function (pageId, sectionId) {
          if (!isOwner || !ownerPresenting) return;
          writeLiveState({ presenting: true, page: pageId, section: sectionId });
        });

        // Subscribed once, for the whole page's lifetime — never
        // unsubscribed, since presenter mode stays live as long as the
        // page is open.
        stateDoc.onSnapshot(
          function (snap) {
            var data = snap.exists ? snap.data() : null;
            lastRemoteState = data;
            if (data && data.presenting && isOwner) ownerPresenting = true;
            controllers.forEach(function (c) {
              c.setPresenting(Boolean(data && data.presenting), data && data.page);
            });
            // A page load that finds itself already presenting (owner,
            // on a fresh load of a different page shape) re-announces
            // this page once, covering the "fresh load = navigation"
            // case documented above.
            if (isOwner && data && data.presenting && data.page !== shell.currentPageId()) {
              writeLiveState({ presenting: true, page: shell.currentPageId(), section: sectionFromHash() });
            }
          },
          function () {
            /* a terminal error on this subscription — remote state just
               stops updating; local owner controls remain usable. */
          }
        );
      });
    },
    function () {
      /* claude.use() itself is not documented to reject, but guard
         anyway — never let this surface as a page error. */
    }
  );
})();
