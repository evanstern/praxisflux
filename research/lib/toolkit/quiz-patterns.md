# Quiz patterns — test application, not memory

A quiz exists to check whether the learner can *use* what they learned on a new problem, not
whether they can regurgitate a definition. Originally codebase-to-course's quiz doctrine;
the design rules are medium-independent.

**Graceful degradation:** if this module isn't available, end the lesson/module with 2–3
"what would you do?" questions in plain prose and discuss the answers.

## The coverage rule (hard requirement)

A question may only use terms, concepts, components, and scenarios the material has already
introduced *before* the quiz. Applying knowledge to a brand-new situation is the whole point —
but every term the question leans on must be 100% guaranteed already taught. A learner should
never hit a quiz and think "we never talked about this." If a great question needs an
unintroduced concept, teach it first or cut the question.

## What to quiz (in order of value)

1. **"What would you do?" scenarios** — a new situation, apply what you learned. The gold standard.
2. **Debugging scenarios** — "X is broken; where would you look first?"
3. **Architecture decisions** — "would you put this logic here or there — and why?"
4. **Tracing exercises** — "when a user does X, what path does the data take?"

**Never quiz:** definitions (that's what glossing is for), file-name recall, syntax details,
or anything answerable by scrolling up and copying.

## Tone

Wrong answers get encouraging explanations that teach something new ("Not quite — here's
why…"); right answers get brief reinforcement of the principle ("Exactly — this works
because…"). Never punitive, never score-focused.

## Portable snippet (decks, briefings — zero JS)

`<details>`/`<summary>` gives tap-to-reveal answers with no script, keyboard-accessible,
token-styled:

```html
<style>
.quiz details{border:1px solid var(--line);border-radius:10px;margin:.4em 0;
  background:var(--chip)}
.quiz summary{cursor:pointer;padding:.55em .9em;font-weight:600}
.quiz details p{margin:0;padding:.2em .9em .7em;color:var(--muted)}
.quiz details.right summary{border-left:4px solid var(--accent2)}
</style>

<div class="quiz">
  <p><b>You want to add a "save to favorites" feature. Where does the logic live?</b></p>
  <details><summary>A. In the browser extension</summary>
    <p>Not quite — the extension only displays data; it never owns it. Look one hop back.</p></details>
  <details class="right"><summary>B. In the backend API</summary>
    <p>Exactly — the API owns the data, so a new feature that stores state starts there.</p></details>
</div>
```

Deck usage: one question per slide, reveal by tapping — a natural end-of-lesson slide before
the takeaways.

## In codebase-to-course

Courses do NOT use this snippet — the prebuilt assets ship graded quiz engines
(multiple-choice, drag-and-drop, spot-the-bug, scenario) with per-answer explanations; author
against the contracts in the skill's `interactive-elements.md`. The coverage rule above
applies everywhere.
