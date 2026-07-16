---
name: sync
description: >
  Reconciles the Backlog board against the current state of a project's specifications. 
  This is an "Executive" operation that ensures reality (the specs) matches-up and stays 
  aligned with the human-readable kanban view.
---

# Sync — Reconciling Reality and the Board

The `sync` skill ensures that our **Backlog** reflects the actual state of development as defined in the specific branch's artifacts. It is a one-way reconciliation: **Software Specifications $\to$ Backlog.**

## Constraints & Scope
- This is a derivation operation, not an interpretation. The result must be 100% deterministic based on what files exist and their contents.
- Sync must never modify the *content* of a spec; it only modifies the properties (status, ACs) of the **linked tasks**.

## The Process

### 1. Precondition Gate: Check for Linkage
Ensure that there are active links to be synced. If no linked tasks exist, indicate that and suggest identifying a feature via the `link` skill first.

```bash
node scripts/gates/cli.mjs links <root>
```
*If this returns an empty list, the Sync is skipped.*

### 2. Analyze Delta (The Plan)
Run the derivation command to identify any differences between the board and the specifications:
- **Command:** `node scripts/gates/cli.mjs plan <root>`
- **Mechanism:** This produces a list of exact `backlog task edit` commands required to reach 100% consistency.

### 3. Execution (One-way Sync)
Execute the commands in the order provided by the planner:
- **Action:** Run every command from the plan exactly as issued.
- **Order:** Strictly follow the sequence—Removals first, then additions/updates to ensure a clean state.
- **Verification:** Each step must result in an successful update (AC - Accepted).

### 4. Sanity Check: Clean State
Ensure that no legacy `sync` commands remain in the execution queue and that the final output of the plan matches the current status of all linked tasks.

### 5. Output Gate: Verify Consistency
Finalize by verifying that the board is once again in harmony with the specifications:
```bash
node scripts/gates/cli.mjs check <root>
```
*Confirm success only if zero warnings/errors are reported.*

## Handing off
Report onto the user exactly which tasks were modified and what their new statuses are (e.g., "Topic X moved from To-Do to In-Progress"). Remind them that **Sync** is a regular maintenance task for keeping projects in lockstep with the spec files.
