# Jargon glossary tooltip

Gloss every technical term where it appears, so the reader never has to leave the page (or
ask) to decode jargon. The definition rides a `data-tip` attribute; a popover shows it on
hover (desktop) or tap (touch). This is the single most valuable accessibility feature for
non-technical audiences — codebase-to-course's content rules call it "No Term Left Behind."

**Graceful degradation:** if this module isn't available, gloss terms in parentheses on
first use — `the manifest (the file that declares what the extension may do)` — and move on.

## The contract

Any element — HTML *or* SVG — may carry a `data-tip` attribute with a 1–2 sentence,
everyday-language definition:

```html
<span data-tip="A service worker is a background script that runs independently of the
page — a behind-the-scenes assistant that's on even when you're not looking.">service
worker</span>
```

- Give the reader a **visible affordance** so glossed terms are discoverable: a dashed
  underline, or a small `?` badge (educate's decks use the badge — see the deck template's
  sample slide).
- Keep definitions to 1–2 sentences, everyday language; a metaphor helps.
- Gloss on **first use per screen/slide**, not every repetition.

## The snippet

Self-contained, and written against the **shared token names** (`--ink`, `--bg`) so it
inherits the consuming plugin's palette in both light and dark themes (the bubble is
inverted-contrast: dark-on-light pages get a dark bubble and vice versa). Popover text size
follows `--tip-size` (default `1rem`) — decks set it larger. The popover is appended to
`document.body` with `position: fixed`, so it is **never clipped** by an ancestor's
`overflow: hidden`, and it hides when printing.

Consumers embed the marked regions verbatim; `scripts/sync-shared.mjs` re-stamps them (drift
fails the test suite). Hand-edit only here.

```css
/* praxis:tooltip-css:start */
[data-tip]{cursor:help}
.tip-pop{position:fixed;z-index:1000;max-width:min(420px,80vw);background:var(--ink);color:var(--bg);
  font-size:var(--tip-size,1rem);line-height:1.4;padding:.65em .9em;border-radius:10px;
  pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.28);opacity:0;transform:translateY(4px);
  transition:opacity .12s ease,transform .12s ease}
.tip-pop.show{opacity:1;transform:translateY(0)}
@media print{ .tip-pop{display:none} }
/* praxis:tooltip-css:end */
```

```js
// praxis:tooltip-js:start
// One shared popover: follows the cursor on hover, toggles on click/tap (touch), clamps to
// the viewport, and closes on tap-away. Works for HTML and SVG [data-tip] elements alike.
(function(){
  const pop=document.createElement('div'); pop.className='tip-pop'; document.body.appendChild(pop);
  let shownFor=null;
  const place=(x,y)=>{ const pad=14, r=pop.getBoundingClientRect();
    let px=x+pad, py=y+pad;
    if(px+r.width>innerWidth-8) px=Math.max(8,x-r.width-pad);
    if(py+r.height>innerHeight-8) py=Math.max(8,y-r.height-pad);
    pop.style.left=px+'px'; pop.style.top=py+'px'; };
  const show=(t,x,y)=>{ pop.textContent=t.getAttribute('data-tip'); pop.classList.add('show'); shownFor=t; place(x,y); };
  const hide=()=>{ pop.classList.remove('show'); shownFor=null; };
  document.addEventListener('mouseover',e=>{ const t=e.target.closest&&e.target.closest('[data-tip]'); if(t) show(t,e.clientX,e.clientY); });
  document.addEventListener('mousemove',e=>{ if(shownFor) place(e.clientX,e.clientY); });
  document.addEventListener('mouseout',e=>{ const t=e.target.closest&&e.target.closest('[data-tip]'); if(t && !t.contains(e.relatedTarget)) hide(); });
  document.addEventListener('click',e=>{ const t=e.target.closest&&e.target.closest('[data-tip]');
    if(t){ e.stopPropagation(); (shownFor===t)?hide():show(t,e.clientX,e.clientY); } else hide(); });
})();
// praxis:tooltip-js:end
```

## Where each plugin gets it

- **educate decks** — the deck template carries the stamped regions; nothing to author.
- **research briefings** — copy both regions into the page (alongside the base.html blocks).
- **codebase-to-course pages** — courses do NOT use this snippet: the prebuilt assets
  (`references/styles.css` + `references/main.js`, copied verbatim into every course) ship
  the same pattern as a course-native engine with the `.term` + `data-definition` contract
  and a dashed-underline affordance. Author course HTML against that contract and never
  inline tooltip CSS/JS there (see the skill's `interactive-elements.md`).
