// Fixture generator with no schema.json beside it (deliberately) — proves
// handleDiagram's "every diagrams/<kind>/ needs a schema.json" check fires
// for a non-core kind too, not just a core one.
export function render() {
  return { svg: '<svg viewBox="0 0 1 1" role="img"></svg>', minWidth: 1 };
}
