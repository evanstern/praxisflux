---
name: research-vault
description: >
  Collects, verifies, and synthesizes raw information into a grounded knowledge corpus.
  This is the EMBED phase. Use it to establish "what we know" before analyzing or 
  reasoning about the facts found.
---

# Research Vault — The Embed Phase

The `research-vault` skill is used to perform deep discovery and establish a grounding for any specific topic. This process turns raw information into **neutral, descriptive** knowledge records (grounding).

## Constraints & Scope
- This skill focuses on *gathering* what is known (`source` types) and structuring it into neutral notes.
- It does **not** provide opinions, verdicts, or analysis (that's `analyze-vault`).
- It ensures that every claim discovered can be traced back to a source.

## The Process

### 1. Precondition Gate: Verify Branch Integrity
Verify the target branch is well-formed and has not been corrupted by outside edits. Because this is a research branch, ensure it exists within the `research` context.

```bash
node scripts/gates/cli.mjs branch <vault> <branch_name>
```
*If this fails, your research environment is invalid; you must fix any formatting or isolation issues before continuing.*

### 2. Scope and Fan-out
Identify the core questions of research. For complex topics, use a **fan-out** approach: break down the research into independent sub-queries (up to 10 parallel search operations) to ensure no large knowledge gaps remain.

### 3. Gathering & Neutral Synthesis
Collect information from all sources using high-quality retrieval tools. As you gather, identify what counts as "Raw Facts" vs. "Project Specifics."

Every piece of data must be converted into a **neutral** note:
- **No Verdicts:** Do not include opinions on what the facts mean.
- **Strict Grounding:** Every finding must be cited directly from its source (e.g., `[[Finding]]`).
- **Fact Extraction:** Capture only what is true, avoiding any interpretation of intent or implication for now.

### 4. Writing Grounding Records
Record all discovered information into the branch:
- **`_grounding.md`**: The primary repository of "what we know." This file acts as the source of truth for the topic's raw metrics and data points.
- **Knowledge Notes**: For any specific concept that requires its own deep dive, create a separate note in the `note` type.

### 5. Cross-Reference
Ensure every new note links back to the MOC and is represented in the updated grounding map. Ensure no "orphan" notes are created; they must all relate to the branch topic.

### 6. Output Gate: Verify Grounding Quality
Confirm that all records are properly typed, cited, and verified against the `source` schema.

```bash
node scripts/gates/cli.mjs branch <vault> <branch_name>
```
*Ensure every note produced is grounded in a fact-based citation.*

## Handing off
Once grounding is complete, provide the user with a summary of the key findings and the basis established in `_grounding.md`. You may now proceed to analyze these facts via the `analyze-vault` skill.
