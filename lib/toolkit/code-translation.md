# Code ↔ plain-English translation

The single most valuable tool for teaching code to non-technical readers: never show code
without a plain-English translation of what each line does, and never write a paragraph
*about* code when you can annotate the code itself. Originally codebase-to-course's pattern.

**Graceful degradation:** if this module isn't available, follow the code with a short
"in plain English:" list — one bullet per line that matters.

## The rules (medium-independent)

- **Use real code, verbatim.** Never modify, simplify, or trim snippets — the reader should
  be able to open the file and see exactly what they learned from. *Choose* naturally short,
  punchy snippets (5–10 lines) instead of butchering long ones.
- **No horizontal scrollbars, ever.** `white-space: pre-wrap; word-break: break-word` — this
  is teaching material, not an IDE; readability beats preserved indentation.
- **One note per line that matters,** in everyday language, positioned so the pairing is
  unmistakable. Skip noise lines (braces, imports) rather than annotating them emptily.
- A metaphor inside a note is welcome; jargon inside a note defeats the point (gloss it —
  see `tooltip.md`).

## Portable snippet (decks, briefings — zero JS)

Comments-on-top: each plain-English note is a styled line directly ABOVE the code it
explains, inside one token-styled panel. Inherits the consumer's palette.

```html
<style>
.translate{background:var(--ink);color:var(--bg);border-radius:12px;padding:1em 1.2em;
  font-family:var(--mono);font-size:.9em;line-height:1.6;
  white-space:pre-wrap;word-break:break-word}
.translate .note{display:block;color:var(--accent2);font-family:var(--sans);
  font-style:italic;filter:brightness(1.25)}
</style>

<pre class="translate"><span class="note">// Ask the server for this user's saved items…</span>
const res = await fetch(`/api/favorites/${userId}`);
<span class="note">// …and unpack the JSON body once it arrives.</span>
const favorites = await res.json();</pre>
```

Deck usage: give the translation its own slide (shared pedagogy — one idea per slide); the
deck's 30px body type means 4–8 code lines fill a slide comfortably.

## In codebase-to-course

Courses do NOT use this snippet — the prebuilt assets ship a far richer engine (side-by-side
panels rebuilt as comments-on-top at render time, syntax highlighting, per-block "hide notes"
toggle). Author against the `.translation-block` contract in the skill's
`interactive-elements.md`; this module is the portable variant for every other surface.
