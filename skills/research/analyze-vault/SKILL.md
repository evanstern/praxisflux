---
name: analyze-vault
description: >
  Evaluate an existing topic branch in a grounded knowledge vault and produce 
  an opinionated, structured analysis (the QUERY phase). Use this to synthesize 
  findings from raw research, weigh tradeoffs, and form a recommendation.
---

# Analyze Vault — The Query Phase

This skill allows the researcher to reason *across* a gathered corpus of facts to reach a verdict or identify tensions. It is **opinionated**—it is where we take an author's stance on the evidence.

## Constraints & Scope
- This skill does NOT gather new data (use `research-vault`).
- This skill does NOT render visual artifacts (use `vault-artifact`).
- It requires a valid branch that has already passed the research/grounding gates.

## The Process

### 1. Precondition Gate: Verify Branch Integrity
Before analyzing, confirm the target branch is well-formed and contains sufficient grounding data. Use the gate tool to check for an MOC, proper frontmatter, and isolation.

```bash
node scripts/gates/cli.mjs branch <vault> <branch_name>
```
*If this fails, your research is incomplete; you must run the `research-vault` skill first.*

### 2. Context Absorption
Read the MOC (`.../MOC`), the grounding file (`_grounding.md`), and all knowledge notes within the branch. Identify where the information is "thin" or has gaps, as these are often high-value discovery points.

### 3. Define the Decision Question
Determine exactly what decision needs to be made. If the prompt is vague ("analyze this"), infer the logical next step (e.g., "What are the critical infrastructure requirements for X?"). State this question at the top of your analysis.

### 4. Authoring the Analysis Note
Create a new analysis note at `<Branch>/Analysis-<Slug>.md` using the standards defined in `research/templates/analysis.md`. Ensure you follow these strict guidelines:
- **Expert Verdict:** Provide a clear, non-hedged recommendation or finding up front.
- **Cross-Referenceed Reasoning:** Use `[[wikilinks]]` to cite specific notes that support your argument.
- **Counter-Arguments:** Identify the major tensions and what is lost by making this decision (The "Counter-case").
- **Confidence Rating:** Be explicit about how sure you are of this verdict and what would change your mind.

### 5. Integration
Add the new analysis to the MOC's **Analyses** section, update the `related:` links, and bump the `updated:` timestamp on the header.

### 6. Output Gate: Verify Validity
Confirm the generated note adheres to the `type: analysis` schema and preserves branch integrity.

```bash
node scripts/gates/cli.mjs analysis <vault> <branch_name>
```
*Fix any flagged inconsistencies before finalizing.*

## Handing off
Provide the user with a clear summary of the Recommendation and the primary Tension identified. Remind them that they can now **render** (`vault-artifact`) this analysis into an interactive visual page if required for high-impact distribution.
