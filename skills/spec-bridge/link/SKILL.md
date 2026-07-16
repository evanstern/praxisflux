---
name: link
description: >
  Links a spec directory to a task on the project's backlog. 
  Identifies which active feature matches a specific specification, and establishes 
  the connection by adding markers and initializing acceptance criteria.
---

# Link — Associating a Spec with the Backlog

This skill connects a piece of-spec documentation (found in `specs/`) to a task on the board. It ensures that every spec has a residence in the **Backlog**.

## Constraints & Scope
- This is an association operation; it does not check if the code is "finished" or even started.
- The link must be established before any work (Analysis, RV, etc.) begins on the feature.

## The Process

### 1. Precondition Gate: Identification
Confirm that the project has a `backlog/` directory and that the specified branch exists within the `specs/` folder. Ensure No existing links are active.

```bash
node scripts/gates/cli.mjs links <root>
```
*If any results return for the same spec, you must warn the user about duplications.*

### 2. Find or Create Target
*   **Found:** If an un-linked task matches the title of the feature, select it as the target.
*   **Missing:** If the feature is unique and no task exists, create a new entry in the `backlog` using the standard template.

### 3. The Link (Association)
Append the marker line to the description of the task:
- **Action:** Add `\n\nSpec: <spec_dir>` as the final line of the task.
- **Context:** Ensure the ID is correct and that no other markers are overwritten.

### 4. Seed ACs from Current State
Identify the current expected phases for this spec (found via `cli.mjs state`). For every phase mentioned in the spec, add an acceptance criterion:
- **Format:** `--ac "Spec phase: <PhaseName>"` 
- **Rule:** Only append ACs that are not already present; never delete or modify existing human-authored ACs.

### 5. Closing Gate: Verification
The link must be verified by the standards gate to ensure it is correctly indexed and linked.

```bash
node scripts/gates/cli.mjs check <root>
```
*Fix any issues before reporting success.*

## Handing off
Confirm the link is established and inform the user that they can now proceed with work on this feature. Mentions that **sync** should be run if the board ever falls out of alignment with the spec.
