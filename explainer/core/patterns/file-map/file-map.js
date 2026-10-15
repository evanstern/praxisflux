"use strict";
/* core/patterns/file-map — bucket chips, a status filter, a search box, and
   "show all", rendered from a real generator-fed manifest. The manifest is
   exactly the `git-manifest` built-in generator's output shape
   (`scripts/lib/generators.mjs` `runGitManifest`:
   `{files:[{path,status,bucket}], counts}`), fed in by
   `<x-include g="..." as="data"/>` (lib/includes.mjs) as a sibling
   `<script type="application/json" class="ex-data">` — never pasted into
   the page by hand, to keep the embedded data and the real repository
   state from drifting apart. Bucket *labels* are the bucket id verbatim (the generator's own
   output carries ids only, via `files[].bucket`/`counts`'s keys, never the
   human label from contents.json's generator config) — see this folder's
   README for the markup contract. Pure vanilla, idempotent (a container
   already initialized is skipped), and a no-op on a page with no
   `.ex-file-map`, or one whose `.ex-data` hasn't resolved to a
   `{files:[...]}` shape. */
(function (root) {
  // Finds this container's data block: the one named by `data-source`
  // (matched against every `.ex-data[data-gen]` on the page, since x-include
  // can emit one anywhere, not necessarily inside this container) if given,
  // else the nearest one — a child of the container, or its next sibling.
  function findDataEl(container) {
    var source = container.getAttribute("data-source");
    if (source) {
      var doc = container.ownerDocument || document;
      var all = doc.querySelectorAll(".ex-data");
      for (var i = 0; i < all.length; i += 1) {
        if (all[i].getAttribute("data-gen") === source) return all[i];
      }
    }
    var nested = container.querySelector(".ex-data");
    if (nested) return nested;
    var next = container.nextElementSibling;
    if (next && next.classList && next.classList.contains("ex-data")) return next;
    return null;
  }

  function readPayload(container) {
    var el = findDataEl(container);
    if (!el) return null;
    try {
      return JSON.parse(el.textContent);
    } catch (e) {
      return null;
    }
  }

  // `as="data"` with `at=` pointing straight at the files array (e.g.
  // `at="files"`) yields a bare array; with no `at=` (the whole generator
  // output) it yields `{files, counts}`. Either is accepted.
  function filesFromPayload(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.files)) return payload.files;
    return null;
  }

  // Buckets + labels are derived straight from `files[].bucket` (unique
  // values, first-seen order) — the generator's own output has no label
  // text, only ids, so the id *is* the label.
  function bucketsFromFiles(files) {
    var seenKeys = {};
    var buckets = [];
    files.forEach(function (f) {
      if (seenKeys[f.bucket]) return;
      seenKeys[f.bucket] = true;
      buckets.push({ key: f.bucket, label: f.bucket });
    });
    return buckets;
  }

  function ghUrl(base, p) {
    return String(base).replace(/\/+$/, "") + "/" + String(p).replace(/^\/+/, "");
  }

  function initOne(container) {
    if (container.hasAttribute("data-ex-file-map-ready")) return;
    var payload = readPayload(container);
    var files = filesFromPayload(payload);
    if (!files) return;
    container.setAttribute("data-ex-file-map-ready", "");

    var buckets = bucketsFromFiles(files);
    var repoBase = container.getAttribute("data-repo-base") || null;
    var defaultOnAttr = container.getAttribute("data-default-on");
    var defaultOn = defaultOnAttr
      ? defaultOnAttr.split(",").map(function (s) { return s.trim(); }).filter(Boolean)
      : buckets.map(function (b) { return b.key; });

    var legend = container.querySelector(".ex-file-map-legend");
    var groupsEl = container.querySelector(".ex-file-map-groups");
    var searchEl = container.querySelector(".ex-file-map-search");
    var countEl = container.querySelector(".ex-file-map-count");
    var showAllBtn = container.querySelector(".ex-file-map-show-all");
    var statusButtons = container.querySelectorAll(".ex-file-map-status button");
    if (!legend || !groupsEl) return;

    var active = {};
    buckets.forEach(function (b) { active[b.key] = defaultOn.indexOf(b.key) !== -1; });
    var activeStatus = "all";

    buckets.forEach(function (b) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "ex-file-map-chip";
      chip.setAttribute("data-bucket", b.key);
      chip.setAttribute("aria-pressed", active[b.key] ? "true" : "false");
      chip.innerHTML = '<span class="ex-file-map-swatch"></span>' + b.label;
      chip.addEventListener("click", function () {
        active[b.key] = !active[b.key];
        chip.setAttribute("aria-pressed", active[b.key] ? "true" : "false");
        render();
      });
      legend.appendChild(chip);
    });

    if (showAllBtn) {
      showAllBtn.addEventListener("click", function () {
        var allOn = buckets.every(function (b) { return active[b.key]; });
        buckets.forEach(function (b) { active[b.key] = !allOn; });
        legend.querySelectorAll(".ex-file-map-chip").forEach(function (chip) {
          chip.setAttribute("aria-pressed", active[chip.getAttribute("data-bucket")] ? "true" : "false");
        });
        render();
      });
    }

    statusButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeStatus = btn.getAttribute("data-status");
        statusButtons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        render();
      });
    });

    if (searchEl) searchEl.addEventListener("input", render);

    function render() {
      var q = (searchEl ? searchEl.value : "").trim().toLowerCase();
      var byBucket = {};
      buckets.forEach(function (b) { byBucket[b.key] = []; });
      var shown = 0;

      files.forEach(function (f) {
        if (!(f.bucket in byBucket)) return;
        if (!active[f.bucket]) return;
        if (activeStatus !== "all" && f.status !== activeStatus) return;
        if (q && f.path.toLowerCase().indexOf(q) === -1) return;
        byBucket[f.bucket].push(f);
        shown += 1;
      });

      if (countEl) countEl.textContent = shown + " / " + files.length + " files shown";
      groupsEl.textContent = "";

      buckets.forEach(function (b) {
        var entries = byBucket[b.key];
        if (!entries.length) return;

        var details = document.createElement("details");
        details.className = "ex-file-map-group";
        details.open = Boolean(q || activeStatus !== "all" || defaultOn.indexOf(b.key) !== -1);

        var summary = document.createElement("summary");
        summary.innerHTML =
          "<span>" + b.label + "</span>" +
          '<span class="ex-file-map-group-count">' + entries.length + " file" + (entries.length === 1 ? "" : "s") + "</span>";
        details.appendChild(summary);

        entries
          .slice()
          .sort(function (a, c) { return a.path.localeCompare(c.path); })
          .forEach(function (entry) {
            var row = document.createElement("div");
            row.className = "ex-file-map-row";

            var glyph = document.createElement("span");
            glyph.className = "ex-file-map-status-glyph";
            glyph.setAttribute("data-status", entry.status);
            glyph.title = entry.status === "A" ? "Added" : entry.status === "D" ? "Deleted" : "Modified";
            glyph.textContent = entry.status;
            row.appendChild(glyph);

            var pathEl;
            if (repoBase) {
              pathEl = document.createElement("a");
              pathEl.href = ghUrl(repoBase, entry.path);
              pathEl.target = "_blank";
              pathEl.rel = "noopener";
            } else {
              pathEl = document.createElement("span");
            }
            pathEl.className = "ex-file-map-path";
            pathEl.appendChild(document.createTextNode(entry.path));
            if (repoBase) {
              // `.ex-vh`: same new-tab cue span as every other
              // target="_blank" link the plugin emits (lib/includes.mjs's
              // handleCite/handleFile) — this one is build-free (rendered
              // client-side from embedded data), so it's stamped here
              // instead of by the build.
              var vh = document.createElement("span");
              vh.className = "ex-vh";
              vh.textContent = " (opens in new tab)";
              pathEl.appendChild(vh);
            }
            row.appendChild(pathEl);

            details.appendChild(row);
          });

        groupsEl.appendChild(details);
      });
    }

    render();
  }

  function init(scope) {
    var root2 = scope || (typeof document !== "undefined" ? document : null);
    if (!root2 || !root2.querySelectorAll) return;
    root2.querySelectorAll(".ex-file-map").forEach(function (container) {
      initOne(container);
    });
  }

  var api = { init: init };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ExplainerFileMap = api;

  if (typeof document !== "undefined") init();
})(typeof globalThis !== "undefined" ? globalThis : this);
