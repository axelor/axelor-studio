# DB-Driven Task Migration

## What This Is

A resilience improvement to axelor-studio's BPM task migration system. Currently, task migration relies on an in-memory list of migrated instance IDs (`MigrationResult.migratedInstanceIds`). This project replaces that with a DB-driven approach that queries `WkfInstance` records by their `wkfProcess.wkfModel` and a new `STATUS_COMPLETED` migration status, making task migration crash-recoverable and independent from instance migration.

## Core Value

Task migration must be resilient to partial failures — if the process crashes mid-migration, retrying must correctly identify which instances still need task migration without re-processing already-completed ones.

## Requirements

### Validated

- ✓ Instance migration works via Camunda migration API — existing
- ✓ Task migration cancel-then-recreate pattern — existing
- ✓ `WkfInstance.migrationStatusSelect` tracks migration state — existing
- ✓ `batchUpdateProcessInstances` updates `wkfProcess` to target — existing
- ✓ Deployment always creates new version (force newVersionOnDeploy) — existing

### Active

- [ ] Add `STATUS_COMPLETED = 4` to `WkfInstance` migration status (instance + tasks fully migrated)
- [ ] Replace in-memory `migratedInstanceIds` with DB query: `self.wkfProcess.wkfModel = :model AND self.migrationStatusSelect = STATUS_MIGRATED_SUCCESSFULLY`
- [ ] Update instance status to `STATUS_COMPLETED` after successful task migration
- [ ] Handle multi-version scenario (v1→v3 complete, v2→v3 partial) correctly
- [ ] Remove `migratedInstanceIds` from `MigrationResult` (no longer needed)
- [ ] Update selection values for `wkf.instance.migration.status.select`

### Out of Scope

- Changing the cancel-then-recreate task migration pattern — works correctly, not the focus
- Modifying instance migration logic (Camunda migration plans) — only changing how we find instances for task migration
- Force migration path (`forceMigrate`) — separate flow, no task migration involved
- Frontend/UI changes — backend-only improvement

## Context

- Previous work (commits starting from e62707ff) separated deployment and migration, and forced `newVersionOnDeploy=true` to align with Camunda logic
- The current in-memory approach means if the process dies between instance migration and task migration, there's no way to resume — the list is lost
- A model can contain multiple processes, each with their own process definitions and instances
- `migrationStatusSelect` defaults to `1` (NOT_MIGRATED) for natively created instances and is only set to `2` (MIGRATED_SUCCESSFULLY) during migration — this distinction is reliable

## Constraints

- **Backward compatibility**: Existing instances with `STATUS_NOT_MIGRATED (1)`, `STATUS_MIGRATED_SUCCESSFULLY (2)`, `STATUS_MIGRATION_ERROR (3)` must remain valid
- **Multi-process**: A WkfModel can have multiple WkfProcess — the DB query must cover all processes in the target model
- **Batch processing**: Must maintain batch processing pattern (50 instances, 100 tasks) for large migrations

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| DB query over in-memory list | Crash recovery — DB state survives restarts | — Pending |
| `wkfProcess.wkfModel` as query key | Covers all processes in model, no per-definition loop needed | — Pending |
| New STATUS_COMPLETED (4) | Distinguishes "instance migrated, tasks pending" from "fully done" — prevents re-processing in multi-version scenarios | — Pending |

---
*Last updated: 2026-03-13 after initialization*
