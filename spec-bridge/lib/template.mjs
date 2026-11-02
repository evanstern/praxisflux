// template.mjs — the tiny {{PLACEHOLDER}} substitution used when planting boilerplate.

/**
 * Replace `{{NAME}}` tokens in `text` with `vars[NAME]`. Unknown tokens are left
 * verbatim so a template can be rendered in passes. Names are `[A-Z0-9_]+`.
 */
export function render(text, vars = {}) {
  return (text || "").replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (whole, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : whole,
  );
}
