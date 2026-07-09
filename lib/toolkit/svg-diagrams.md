# Inline-SVG diagram rules

Hand-drawn inline SVG is the praxis idiom for explanatory figures (educate decks draw
diagrams this way; research briefings draw charts as inline SVG). SVG has sharp edges that
HTML habits walk straight into — these are the hard-won rules, originally from educate's
deck template.

**Graceful degradation:** if this module isn't available, the two rules to keep: *no
`<b>`/`<i>` inside SVG `<text>` (use `<tspan>`), and CSS `var(--…)` does not resolve in SVG
presentation attributes — use literal values.*

## The pitfalls (hard rules)

1. **Never put `<b>` or `<i>` inside an SVG `<text>` element.** HTML formatting tags are
   invisible-but-broken inside SVG — the text silently fails to render or renders unstyled.
   Use `<tspan font-weight="700">` / `<tspan font-style="italic">` instead.

2. **CSS `var(--token)` does NOT resolve in SVG presentation attributes** (`fill="var(--accent)"`
   silently paints black). Use **literal color values** in SVG attributes — and since literals
   can't follow the theme, pick colors that read on BOTH light and dark backgrounds, or give
   the figure its own contrasting panel. (`var()` does work in a `style=""` attribute or CSS
   rule targeting SVG elements — but only for properties CSS controls, and it's easy to get
   this half-right; literals are the predictable path.)

3. **Size for reflow:** `width:100%; height:auto` on the `<svg>` plus a `viewBox` — never fixed
   pixel width/height attributes alone, or the figure won't scale with its container.

4. **Accessibility:** `role="img"` and an `aria-label` describing what the diagram shows.

5. **Give the figure room** (shared pedagogy — "let visuals breathe"): a diagram that carries
   the point gets its own slide / a full-width block, filling most of the available width and
   height. Don't wedge it beside a paragraph.

## Skeleton — a boxes-and-arrows flow

```html
<svg viewBox="0 0 800 300" role="img" aria-label="input flows through process to output">
  <rect x="40" y="110" width="200" height="80" rx="12" fill="#eef0ff" stroke="#4f46e5" stroke-width="2"/>
  <text x="140" y="158" text-anchor="middle" font-size="26" fill="#1b2733" font-family="sans-serif">Input</text>
  <line x1="240" y1="150" x2="320" y2="150" stroke="#5a6776" stroke-width="3" marker-end="url(#a)"/>
  <rect x="320" y="110" width="200" height="80" rx="12" fill="#eefaf7" stroke="#0e9488" stroke-width="2"/>
  <text x="420" y="158" text-anchor="middle" font-size="26" fill="#1b2733" font-family="sans-serif">Process</text>
  <defs><marker id="a" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
    <path d="M0,0 L8,3 L0,6 Z" fill="#5a6776"/></marker></defs>
</svg>
```

Notes: pastel fills + saturated strokes read on both themes; the `<marker>` def gives every
arrow a clean head — define it once per SVG and reference with `marker-end="url(#a)"`; keep
marker `id`s unique per page if a page holds several SVGs.

## Who uses this

- **educate decks** — the native idiom; the deck template's header carries the one-line
  distillation and a sample diagram slide.
- **research briefings** — charts are inline SVG; these rules apply on top of the `dataviz`
  skill's chart guidance.
- **codebase-to-course** — courses prefer the HTML/CSS + emoji diagram patterns in the skill's
  `interactive-elements.md`; when a course page does hand-draw inline SVG, these rules apply.
