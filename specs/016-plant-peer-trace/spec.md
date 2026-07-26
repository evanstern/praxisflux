# 016-plant-peer-trace — absent-peer behavior gets a deterministic trace

Board: TASK-53 · Sweep: `docs/design/lane-hardening-runbook.md` (Lane 1; TASK-54
follows on the same files in Lane 2) · Direction: TASK-43 dogfood finding #1
(specs/010-bootstrap-dogfood/tasks.md T005).

## Requirements (map 1:1 to board ACs)

R1 (AC #1) — `pdlc/scripts/plant.mjs` leaves a deterministic trace of peers considered
and omitted: the `.pdlc` sentinel gains a field recording the known peers absent at
plant time (e.g. `"peersOmitted": ["spec-kit"]`), and the plant emits a one-line stderr
notice naming each omitted peer's stripped block. Idempotence and drift semantics must
hold (a re-plant with the same peers is still "unchanged"; existing sentinels without
the field stay readable). Tests in the existing `test/pdlc.test.mjs` style.

R2 (AC #2) — `pdlc/skills/bootstrap/SKILL.md`'s "recommend when absent" prose now
references the deterministic trace (the sentinel field + notice) instead of relying on
untraceable judgment.

R3 (AC #3) — versions: pdlc:bootstrap SKILL.md bump + marketplace
`scripts/sync-version.mjs 0.23.0` (sibling-collision re-bump is the orchestrator's).
Wiki: re-verify + re-pin `pdlc-plugin` + lockstep stales; CAPSULES regen if any
description changes. No course.

## Non-goals

The --name override (TASK-54, next lane, same files — do not implement it here).
