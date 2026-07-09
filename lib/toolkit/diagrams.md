# HTML/CSS diagram idioms

Diagrams that are plain HTML + CSS (boxes, arrows, trees — often with an emoji as the icon)
inherit the theme tokens, wrap responsively, and never hit SVG's text pitfalls. This is
codebase-to-course's native diagram idiom, portable to any praxis surface. For hand-drawn
SVG figures instead, see `svg-diagrams.md`.

**Graceful degradation:** if this module isn't available, a numbered list of steps or an
indented mono file listing does the job.

## Flow of steps (boxes with arrow separators)

```html
<style>
.flow{display:flex;align-items:stretch;gap:0;flex-wrap:wrap}
.flow .step{flex:1;min-width:9em;background:var(--card);border:1px solid var(--line);
  border-radius:12px;padding:.8em 1em;text-align:center}
.flow .step b{display:block;margin-bottom:.25em}
.flow .arrow{align-self:center;padding:0 .5em;color:var(--muted);font-size:1.4em}
</style>

<div class="flow">
  <div class="step">📨 <b>Input</b><span class="muted">the click arrives</span></div>
  <div class="arrow">→</div>
  <div class="step">⚙️ <b>Process</b><span class="muted">the server decides</span></div>
  <div class="arrow">→</div>
  <div class="step">📬 <b>Output</b><span class="muted">the page updates</span></div>
</div>
```

## Annotated file tree

Use instead of paragraphs saying "this folder does X, that folder does Y":

```html
<style>
.tree{font-family:var(--mono);background:var(--chip);border:1px solid var(--line);
  border-radius:12px;padding:1em 1.2em;line-height:1.8;white-space:pre}
.tree .why{font-family:var(--sans);color:var(--muted);font-style:italic}
</style>

<div class="tree">src/
├─ api/        <span class="why">← every route the frontend can call</span>
├─ models/     <span class="why">← what the data looks like</span>
└─ jobs/       <span class="why">← work that runs on a schedule</span></div>
```

Rules: label every box/branch with WHY it matters, not just its name; keep a flow to 3–5
steps (split longer chains — shared pedagogy: one idea per screen); emoji are icons, pick
one each, don't decorate.

## In codebase-to-course

Courses get richer, *animated* versions from the prebuilt assets (flow animations, group-chat
visualizations, interactive architecture diagrams) — author against the contracts in the
skill's `interactive-elements.md`. These static idioms are the portable variants for decks
and briefings.
