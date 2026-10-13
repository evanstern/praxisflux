// Fixture pattern JS for pattern-inlining tests. Browser-only: the guard keeps it a no-op
// when `node --test`'s default discovery picks it up from under test/.
(function () {
  if (typeof document === "undefined") return;
  document.querySelectorAll(".ex-widget").forEach(function (el) {
    el.setAttribute("data-widget-ready", "true");
  });
})();
