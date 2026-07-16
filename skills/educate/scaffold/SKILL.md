---
name: educate-scaffold
description: >
  Initializes a new Socratic learning project for a specific topic.
  Plants the required directory structure, standards (CLAUDE.md), and progress
  tracking schema (progress.json) for an educational exploration.
---

# Educate Scaffold — The Initialization Phase

This skill handles the "Start" of any new Socratic-learning project. It sets up the environment where a learner can go from zero to **scaffolded** research-led learning.

## Constraints & Scope
- This is a one-time setup for projects that will live in the `topics/` directory.
- It ensures all projects are registered with the required `progress.schema.json`.
- It does not actually teach; it sets up the workbench for teaching to happen later.

## The Process

### 1. Precondition Gate: Project Uniqueness
Ensure that a project or topic of this name already exists in the `topics/` directory. If it does, you must notify the user and suggest a unique-slug (e.g., "Advanced-vs-Basic").

```bash
node scripts/gates/cli.mjs branch <vault> <ProjectName>
```
*If this fails, describe exactly why the name is taken or missing.*

### 2. Workspace Initialization
Create the project root and the necessary initial files:
- **CLAUDE.md:** The overall mission statement for the learning path.
- **progress.json:** The tracker for progress labels (`planned`, `scaffolded`, etc.).
- **_template/:** Copying the standard base templates into the topic folder to ensure consistent module styles.

### 3. Standards Enforcement
Verify that the initial files correctly point to the expected directory structure (the `topics/` hierarchy) and that all required types are present for the first lesson.

### 4. Closing the Gate
Confirm the project is ready for work by ensuring the **initial** state (`planned`) is marked on the progress schema. Provide a summary of what was created.

## Handing off
Inform the user that they can now begin and suggest switching to the `educate-lesson` skill to start the first unit of instruction.
