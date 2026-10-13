// Fixture diagram generator living outside core/ entirely (/
// "packs and artifact folders can ship their own
// diagram generators"). Proves lib/includes.mjs's handleDiagram loads
// and validates *this* folder's own schema.json, not anything from the
// real plugin's core/, when the lookup resolves a kind at a non-core layer.
export function render(data) {
  return {
    svg: `<svg viewBox="0 0 10 10" role="img"><title>${data.value}</title></svg>`,
    minWidth: 10,
  };
}
