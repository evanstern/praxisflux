---
name: educate-lesson
description: >
  Facilitates an interactive, Socratic learning loop to teach a specific concept or skill 
  within the project context. This is the "Teaching" phase (scaffolded/taught).
---

# Educate Lesson — The Teaching Phase

The `educate-lesson` skill facilitates the actual **instructional delivery** of information. Unlike general research, this is a collaborative effort where the AI acts as a Socratic mentor, guiding the user through identifying, analyzing, and implementing specific concepts.

## Constraints & Scope
- This skill works on items already identified in a scaffolded project (`topics/`).
- It focuses on **Active Learning**: The goal is for the learner to *do* something (write code, solve a puzzle, explain a theory) rather than just being told what it is.
- Results are verified by an identity-and-logic gate before moving to the next lesson step.

## The Process

### 1. Precondition Gate: Confirm Instruction Status
Verify that the project has an active `progress.json` and that we have a clear "Next Action" identified for this specific topic.

```bash
node scripts/gates/cli.mjs progress <vault> <Topic>
```
*If any prior steps (Scaffolding, Research) are missing, stop and advise the user to complete those first.*

### 2. The Socratic Loop (Interactive Teaching)
The skill mediates a conversation to teach a specific mastery point:
1. **Concept Introduction:** Present the abstract idea or problem-space in a minimal way.
2. **Active Discovery:** Ask for the user's current understanding or interpretation of the concept.
3. **Feedback & Refinement:** Validate the user's input (and correct any misconceptions) before moving to the next complexity level.

### 3. Applied Execution
For every theory point, our goal is a practical task:
- Code refactorings
- Schema definitions
- Architecture diagrams
- Specific implementation logic (`implements/`)

The student must perform these, and we will check their work for correctness and alignment with the project's specific constraints (e.g., `closed-loop` validation).

### 4. Artifact Creation
Every lesson phase concludes with a "Note" or documented example that is saved into the branch:
- **Instructional Notes:** (`notes/`) explaining the theory.
- **Demonstrations:** (`implements/`) showing the practical application of a concept.
- **Work Checkpoints:** Any code or config changed during the lesson must be committed as part of the "Done" handoff.

### 5. Closing the Gate: Verification of Understanding
Confirm that the learner has demonstrated proficiency by completing the required task and that all artifacts were saved correctly.

```bash
node scripts/gates/cli.mjs progress <vault> <Topic> --check-lesson
```
*Ensure the `current` status matches the expected output for this specific lesson.*

## Handing off
Announce that the current concept is complete. Propose whether to move to the next lesson in the sequence or if the user wishes to "Bridge" (hand off) to a build/spec task based on what was just learned.
