# Phase 2: DB-Driven Task Migration - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the in-memory instance ID handoff between `computeMigrationInstances` and `migrateInstanceTasks` with a DB-driven approach. After instance migration, instances are set to status 4 (in progress). Task migration queries the DB for status-4 instances instead of reading from `MigrationResult.migratedInstanceIds`. After tasks are migrated, instances move to status 2 (done). This makes the process crash-recoverable.

</domain>

<decisions>
## Implementation Decisions

### computeMigrationInstances status change
- Change `batchUpdateProcessInstances(..., STATUS_MIGRATED_SUCCESSFULLY)` to `batchUpdateProcessInstances(..., STATUS_MIGRATION_IN_PROGRESS)` at both call sites (in-loop batch at line 641-644 and final flush at line 662-664)
- All paths in `computeMigrationInstances` consistently set status 4 after instance migration
- `migrateInstanceTasks` is solely responsible for setting status 2 after tasks are done
- This change ships in the same plan as the `migrateInstanceTasks` rewrite (tightly coupled)

### migrateInstanceTasks DB query
- Replace `migrationResult.getMigratedInstanceIds()` with a DB query: `self.wkfProcess.wkfModel = :model AND self.migrationStatusSelect = 4`
- New signature: `migrateInstanceTasks(ProcessEngine engine, WkfModel targetModel)` — drop `MigrationResult` parameter
- Update interface `WkfMigrationService` and caller in `WkfModelController` accordingly

### Per-instance completion with batching
- After each instance's tasks are successfully migrated, update to `STATUS_MIGRATED_SUCCESSFULLY (2)`
- Use batched writes with `INSTANCE_BATCH_SIZE` (matches `computeMigrationInstances` pattern)
- Flush remaining batch after loop completes
- Use `wkfInstanceService.batchUpdateProcessInstances()` for the status-2 update (same helper used for status-4)

### Task migration error handling
- On task migration failure for a specific instance: instance stays at status 4 (retryable)
- Error logging: keep current pattern (log.error + continue to next instance)
- No accumulation of task migration errors in MigrationResult
- Idempotency guards for duplicate task prevention are explicitly v2 scope (RESL-01), not Phase 2

### Claude's Discretion
- Exact JPQL query construction for fetching status-4 instances
- Whether to use `wkfInstanceRepo.all().filter(...)` or a custom query method
- WebSocket progress reporting adjustments for the new DB-driven loop
- Transaction boundary details for the status-2 update batch

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Migration service
- `src/main/java/com/axelor/studio/bpm/service/migration/WkfMigrationServiceImpl.java` — Contains both `computeMigrationInstances` (line 570) and `migrateInstanceTasks` (line 439). Both methods need modification.
- `src/main/java/com/axelor/studio/bpm/service/migration/WkfMigrationService.java` — Interface defining `migrateInstanceTasks` signature (line 35-36). Must be updated.

### Caller
- `src/main/java/com/axelor/studio/bpm/web/WkfModelController.java` — Calls `migrateInstanceTasks`. Signature change required.

### DTO
- `src/main/java/com/axelor/studio/bpm/dto/MigrationResult.java` — Contains `migratedInstanceIds` field (Phase 3 removes it, but Phase 2 stops writing to it)

### Domain model
- `src/main/resources/domains/WkfInstance.xml` — WkfInstance entity with status constants (Phase 1 added STATUS_MIGRATION_IN_PROGRESS)
- `build/src-gen/main/java/com/axelor/studio/db/repo/WkfInstanceRepository.java` — Generated constants available for import

### Phase 1 context
- `.planning/phases/01-status-extension/01-CONTEXT.md` — Status flow decisions: status 4 = in progress, status 2 = fully done

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `wkfInstanceService.batchUpdateProcessInstances(targetProcess, instanceIds, status)` — Already used in `computeMigrationInstances` for batch status updates. Reuse for status-2 updates in `migrateInstanceTasks`.
- `INSTANCE_BATCH_SIZE` constant — Existing batch size for instance operations. Reuse for status-2 batch writes.
- `WkfInstanceRepository.STATUS_MIGRATION_IN_PROGRESS` — New constant from Phase 1 (value 4).

### Established Patterns
- Batch processing with `pendingSaves` list + flush on size threshold (lines 627-645 in `computeMigrationInstances`). Replicate this pattern in `migrateInstanceTasks` for status-2 updates.
- WebSocket progress reporting via `BpmProgressWebSocket.updateProgress(sessionId, percentage)` — existing pattern in both methods.
- Error handling: `log.error(message, instanceId, exception)` + continue loop (lines 507-509).

### Integration Points
- `migrateInstanceTasks` is called at line 281 from `migrate()` method — needs signature update at call site
- `WkfMigrationService` interface at line 35-36 — needs signature update
- `WkfModelController` — calls `migrateInstanceTasks` and passes `MigrationResult`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches following existing code patterns.

</specifics>

<deferred>
## Deferred Ideas

- Idempotency guard on task creation to prevent duplicate TeamTasks on retry (RESL-01, v2 requirement)
- Concurrency guard to prevent parallel migrations on same model (RESL-02, v2 requirement)

</deferred>

---

*Phase: 02-db-driven-task-migration*
*Context gathered: 2026-03-16*
