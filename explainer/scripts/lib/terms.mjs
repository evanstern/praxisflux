// The generated Terms page. x-term
// expansion itself (the per-use popover trigger anchor) lives in
// lib/includes.mjs, next to the other x-* handlers and their file:line
// error context; this module only renders the generated Terms page from
// contents.terms.

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeText(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function termLabelFor(contents, key) {
  const match = (contents.terms || []).find((t) => t.key === key);
  return match ? match.term : key;
}

/**
 * Renders the generated Terms page: one <dt>/<dd> per contents.terms[]
 * entry, in declaration order, each anchored `id="terms--<key>"` (the same
 * target every `x-term` anchor's href points at). `def` is already a short
 * HTML fragment (contents.schema.json: "<b>…</b> one sentence") and is
 * embedded as-is, not escaped. A term's `see` links to another term's own
 * anchor on this same page (contents.mjs's cross-reference check already
 * guarantees `see` names a real term).
 */
export function renderTermsPage(contents) {
  const terms = contents.terms || [];
  if (terms.length === 0) {
    return `<p class="ex-terms-empty">No terms are defined.</p>`;
  }
  const items = terms
    .map((t) => {
      const see = t.see
        ? ` <span class="ex-term-see">see: <a href="#terms--${escapeAttr(t.see)}">${escapeText(
            termLabelFor(contents, t.see)
          )}</a></span>`
        : "";
      return `<dt id="terms--${escapeAttr(t.key)}">${escapeText(t.term)}</dt><dd>${t.def}${see}</dd>`;
    })
    .join("");
  return `<dl class="ex-glossary">${items}</dl>`;
}
