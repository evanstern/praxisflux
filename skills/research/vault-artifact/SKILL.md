---
name: vault-artifact
description: >
  Renders a specific analysis result into a self-contained, accessible HTML briefing page.
  This is the RENDER phase: taking an opinionated verdict/reasoning and providing 
  the correct visual structure for human consumption (charts, diagrams, etc.).
---

# Vault Artifact — The Render Phase

The `vault-artifact` skill is used to visualize a specific analysis's conclusion. It transforms an **opinion** into a **document**.

## Constraints & Scope
- This skill only handles the rendering of *existing* analysis findings.
- It does **not** perform research or reach conclusions; it only presents what was already found.
- The output must be **self-contained**: no external calls, but fully compliant with our theme and code-representation standards.

## The Process

### 1. Precondition Gate: Verify Analysis Integrity
Ensure that there is a valid analysis available to render for the requested topic. We check that the `type: analysis` record exists and is grounded in the current branch.

```bash
node scripts/gates/cli.mjs analysis <vault> <Branch>
```
*If this fails, you are attempting to render a result that has not been analyzed yet.*

### 2. Selection of Visual Elements
Identify which parts of the argument benefit from visual representation (e.g., comparisons, hierarchies, or complex tradeoffs). Use this as a guide to select elements from our `lib/toolkit`:
- **Pedagogy:** Apply standard teaching structures for breaking down complex claims.
- **Diagrams:** Use the shared diagram system for visualizing relationships between competing ideas.
- **Quotes:** Highlight key "Founding Principles" or "Base Verdicts" using tooltip/callout patterns.

### 3. Authoring the Briefing
Construct a self-contained HTML briefing (accessible via `_briefing.html` links in the MOC) that maps to the specific analysis's verdict:
- **The Core Answer:** A clear, prominent section describing the recommendation.
- **Visual Breakdown:** Diagrammatic representations of the reasoning for how/why this was reached.
- **Contextual Detail:** Use the `lib/toolkit` logic to ensure the content remains accessible and properly formatted (hidden/visible toggles).

### 4. Implementation Details
The output must use the standard theme tokens (`@media`, data-themes) and adhere to the **Rule of Self-Containment**: Ensure no external dependencies are required for rendering labels or diagrams.

### 5. Integration
Add the resulting URL to the analysis's associated MOC and update the `verified_artifact` status in the branch registry.

### 6. Output Gate: Verify Visual Integrity
Confirm that the HTML file is valid, self-contained, and correctly rendered by our checker.

```bash
node scripts/gates/cli.mjs artifact <file.html>
```
*Verify all external dependencies are bundled locally.*

## Handing off
Present the visual briefing to the user as a link or description of the new page, notifying them that this is the final **Publication** of the current research branch's findings.
