# Phase 2: DB-Driven Task Migration - Research

**Researched:** 2026-03-16
**Domain:** Axelor AOP/JPA persistence, Camunda BPM task migration, crash-recoverable batch processing
**Confidence:** HIGH

## Summary

Phase 2 replaces the in-memory `migratedInstanceIds` list in `migrateInstanceTasks` with a DB query for WkfInstance records at `migrationStatusSelect = 4` (in progress). This makes task migration crash-recoverable: if the process dies between instance migration and task migration, restarting picks up status-4 instances from the DB instead of losing them.

The change is tightly scoped. `computeMigrationInstances` already uses `batchUpdateProcessInstances` for status writes. Phase 2 changes the status it writes from `STATUS_MIGRATED_SUCCESSFULLY (2)` to `STATUS_MIGRATION_IN_PROGRESS (4)`, then `migrateInstanceTasks` queries for status-4 instances and sets each to status 2 after tasks are done. The `migrateInstanceTasks` signature drops the `MigrationResult` parameter.

All patterns (batching, error handling, WebSocket progress, transactional boundaries) already exist in the codebase. This phase replicates established patterns in a new location.

**Primary recommendation:** Follow the existing `computeMigrationInstances` batching pattern exactly -- `pendingSaves` list, flush at `INSTANCE_BATCH_SIZE`, flush remainder after loop. Use `wkfInstanceRepository.all().filter(...)` for the DB query (consistent with existing code style).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Change `batchUpdateProcessInstances(..., STATUS_MIGRATED_SUCCESSFULLY)` to `batchUpdateProcessInstances(..., STATUS_MIGRATION_IN_PROGRESS)` at both call sites in `computeMigrationInstances` (in-loop batch at line 641-644 and final flush at line 662-664)
- All paths in `computeMigrationInstances` consistently set status 4 after instance migration
- `migrateInstanceTasks` is solely responsible for setting status 2 after tasks are done
- This change ships in the same plan as the `migrateInstanceTasks` rewrite (tightly coupled)
- Replace `migrationResult.getMigratedInstanceIds()` with a DB query: `self.wkfProcess.wkfModel = :model AND self.migrationStatusSelect = 4`
- New signature: `migrateInstanceTasks(ProcessEngine engine, WkfModel targetModel)` -- drop `MigrationResult` parameter
- Update interface `WkfMigrationService` and caller in `WkfModelController` accordingly
- After each instance's tasks are successfully migrated, update to `STATUS_MIGRATED_SUCCESSFULLY (2)`
- Use batched writes with `INSTANCE_BATCH_SIZE` (matches `computeMigrationInstances` pattern)
- Flush remaining batch after loop completes
- Use `wkfInstanceService.batchUpdateProcessInstances()` for the status-2 update (same helper used for status-4)
- On task migration failure for a specific instance: instance stays at status 4 (retryable)
- Error logging: keep current pattern (log.error + continue to next instance)
- No accumulation of task migration errors in MigrationResult
- Idempotency guards for duplicate task prevention are explicitly v2 scope (RESL-01), not Phase 2

### Claude's Discretion
- Exact JPQL query construction for fetching status-4 instances
- Whether to use `wkfInstanceRepo.all().filter(...)` or a custom query method
- WebSocket progress reporting adjustments for the new DB-driven loop
- Transaction boundary details for the status-2 update batch

### Deferred Ideas (OUT OF SCOPE)
- Idempotency guard on task creation to prevent duplicate TeamTasks on retry (RESL-01, v2 requirement)
- Concurrency guard to prevent parallel migrations on same model (RESL-02, v2 requirement)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DBMG-01 | `migrateInstanceTasks` queries WkfInstance by `self.wkfProcess.wkfModel = :model AND self.migrationStatusSelect = 4` instead of using in-memory list | DB query pattern via `wkfInstanceRepository.all().filter(...)` -- see Architecture Patterns section |
| DBMG-02 | Each instance is updated to `STATUS_MIGRATED_SUCCESSFULLY (2)` after its tasks are successfully migrated | Batched status-2 update via `batchUpdateProcessInstances` -- see Architecture Patterns section |
| DBMG-03 | `migrateInstanceTasks` signature no longer requires `MigrationResult` for instance IDs | Interface + 2 call sites need update -- see Integration Points section |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Axelor AOP (JPA/Hibernate) | 8.x | ORM queries, `@Transactional`, repository pattern | Project framework -- all DB access goes through this |
| Camunda BPM Engine | 7.x | Process engine task queries (`getTaskService()`) | Already used throughout migration code |
| Google Guice | - | Dependency injection (`@Inject`, `Beans.get()`) | Axelor DI framework |
| Lombok | - | `@Getter`/`@Setter` on DTOs | Already used on `MigrationResult` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| JUnit 5 | - | Unit testing | Test framework already in use (see `MigrationResultTest`) |
| `com.axelor.utils.junit.BaseTest` | - | Base test class | All project tests extend this |

## Architecture Patterns

### Recommended Change Structure
```
Files to modify:
├── WkfMigrationServiceImpl.java    # computeMigrationInstances: status 4; migrateInstanceTasks: rewrite
├── WkfMigrationService.java        # Interface: drop MigrationResult from migrateInstanceTasks
├── WkfModelController.java         # Caller: update migrateInstanceTasks call (2 call sites)
└── (no new files)
```

### Pattern 1: DB Query for Status-4 Instances (DBMG-01)
**What:** Replace `migrationResult.getMigratedInstanceIds()` with a DB query
**When to use:** At the start of the rewritten `migrateInstanceTasks`
**Example:**
```java
// Source: existing pattern in WkfMigrationServiceImpl.getAllSourceModelInstances (line 845-849)
// and batchUpdateProcessInstances filter pattern (WkfInstanceServiceImpl line 1413)
List<WkfInstance> inProgressInstances = wkfInstanceRepository
    .all()
    .filter("self.wkfProcess.wkfModel = :model AND self.migrationStatusSelect = :status")
    .bind("model", targetModel)
    .bind("status", WkfInstanceRepository.STATUS_MIGRATION_IN_PROGRESS)
    .fetch();
```
**Recommendation:** Use `wkfInstanceRepository.all().filter(...)` with named parameters. This is consistent with how `getAllSourceModelInstances` (line 845-849) queries instances by model. The `WkfInstance` entity already has `wkfProcess` (many-to-one to `WkfProcess`) and `WkfProcess` has `wkfModel`, so the join path `self.wkfProcess.wkfModel` is valid.

**Note on instanceId extraction:** The current `migratedInstances` is `List<String>` (Camunda process instance IDs). After the query, extract `instanceId` from each `WkfInstance`:
```java
List<String> instanceIds = inProgressInstances.stream()
    .map(WkfInstance::getInstanceId)
    .collect(Collectors.toList());
```

### Pattern 2: Status-4 Write in computeMigrationInstances
**What:** Change the existing `STATUS_MIGRATED_SUCCESSFULLY` to `STATUS_MIGRATION_IN_PROGRESS` at both batch-write call sites
**Where:** Lines 641-644 (in-loop flush) and lines 662-664 (final flush)
**Example:**
```java
// Before (current code):
wkfInstanceService.batchUpdateProcessInstances(
    targetProcess, pendingSaves, WkfInstanceRepository.STATUS_MIGRATED_SUCCESSFULLY);

// After:
wkfInstanceService.batchUpdateProcessInstances(
    targetProcess, pendingSaves, WkfInstanceRepository.STATUS_MIGRATION_IN_PROGRESS);
```

### Pattern 3: Batched Status-2 Update in migrateInstanceTasks (DBMG-02)
**What:** After each instance's tasks are migrated, collect its instanceId and batch-flush to status 2
**When to use:** Inside the rewritten `migrateInstanceTasks` outer instance loop
**Example:**
```java
// Source: computeMigrationInstances batching pattern (lines 627-645)
// Note: batchUpdateProcessInstances takes WkfProcess, but for status-2 updates
// we pass null for targetProcess since the process was already updated during status-4 write.
List<String> pendingStatusUpdates = new ArrayList<>();

for (String instanceId : instanceIds) {
    try {
        // ... cancel + create tasks for this instance (existing logic) ...

        pendingStatusUpdates.add(instanceId);

        if (pendingStatusUpdates.size() >= INSTANCE_BATCH_SIZE) {
            wkfInstanceService.batchUpdateProcessInstances(
                null, pendingStatusUpdates, WkfInstanceRepository.STATUS_MIGRATED_SUCCESSFULLY);
            pendingStatusUpdates.clear();
        }
    } catch (Exception e) {
        log.error("Error while migrating tasks for instance: {}", instanceId, e);
        // Instance stays at status 4 -- retryable on next run
    }
}

if (!pendingStatusUpdates.isEmpty()) {
    wkfInstanceService.batchUpdateProcessInstances(
        null, pendingStatusUpdates, WkfInstanceRepository.STATUS_MIGRATED_SUCCESSFULLY);
}
```

**Critical detail on `targetProcess` parameter:** `batchUpdateProcessInstances` accepts a nullable `WkfProcess`. When `targetProcess` is not null, it also updates `wkfProcess`, `name`, and creates migration history. For the status-2 update, pass `null` because the process reassignment already happened during the status-4 write in `computeMigrationInstances`. Only the status field needs updating.

### Pattern 4: Signature Change (DBMG-03)
**What:** Remove `MigrationResult` parameter from `migrateInstanceTasks`
**Call sites to update:**
1. **Interface** `WkfMigrationService.java` line 35-36: `void migrateInstanceTasks(ProcessEngine engine, WkfModel targetModel);`
2. **Implementation** `WkfMigrationServiceImpl.java` line 438-440: Update method signature
3. **Caller in `migrate()`** `WkfMigrationServiceImpl.java` line 281: `migrateInstanceTasks(engine, targetModel);`
4. **Caller in `WkfModelController.deploy()`** line 119: `migrationService.migrateInstanceTasks(engine, wkfModel);`

### Anti-Patterns to Avoid
- **Do NOT query by Camunda instanceId list in a single JPQL IN clause:** The list could be large. The existing batch pattern handles this by processing in chunks.
- **Do NOT create a new transactional method for per-instance status updates:** Reuse `batchUpdateProcessInstances` with the existing batch pattern. Individual saves would be N transactions instead of N/50.
- **Do NOT change the task cancellation/creation loop structure:** The two-pass approach (cancel first, create second) is intentional. Only wrap the outer instance loop with status-2 batching.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Batch status updates | Custom JPQL UPDATE query | `wkfInstanceService.batchUpdateProcessInstances()` | Already handles null targetProcess, migration history, transaction boundary |
| Instance query by model | Custom native SQL | `wkfInstanceRepository.all().filter(...)` | Consistent with project conventions, handles Hibernate session properly |

## Common Pitfalls

### Pitfall 1: Transaction Boundary on batchUpdateProcessInstances
**What goes wrong:** Calling `batchUpdateProcessInstances` from within `migrateInstanceTasks` may not commit if the outer method lacks `@Transactional` or if Guice proxy is not used.
**Why it happens:** `batchUpdateProcessInstances` is `@Transactional(rollbackOn = Exception.class)` on `WkfInstanceServiceImpl`. It will start a new transaction when called through the injected `wkfInstanceService` proxy. But calling `this.method()` bypasses the proxy.
**How to avoid:** Always call through the injected `wkfInstanceService` field (already available in `WkfMigrationServiceImpl` constructor). Never call via `this.` or `Beans.get()` within the same class for transactional methods.
**Warning signs:** Status-4 instances not transitioning to status 2 after tasks are migrated.

### Pitfall 2: WebSocket Progress Percentage with DB-Driven Count
**What goes wrong:** The current `migrateInstanceTasks` counts total tasks by iterating `migratedInstances` twice (first to count, then to process). The DB-driven version must also pre-count total tasks to compute progress percentages correctly.
**Why it happens:** Progress bar logic requires knowing `totalTasks` before the processing loop starts.
**How to avoid:** Keep the existing two-loop pattern: first loop counts tasks per instance, second loop processes. The instance list now comes from DB but the counting logic is identical.
**Warning signs:** Progress bar jumping or stuck at 0%.

### Pitfall 3: Passing null targetProcess to batchUpdateProcessInstances
**What goes wrong:** If `targetProcess` is null, the method only updates `migrationStatusSelect` -- it does NOT update `wkfProcess`, `name`, or create migration history. This is the correct behavior for status-2 updates but would be wrong for status-4 updates.
**Why it happens:** `computeMigrationInstances` already passes a valid `targetProcess` for the status-4 write, which correctly reassigns the process. The status-2 write in `migrateInstanceTasks` only needs to flip the status flag.
**How to avoid:** Verify that `computeMigrationInstances` still passes `targetProcess` for status-4 writes (it does). Only pass null for the status-2 update in `migrateInstanceTasks`.

### Pitfall 4: Multi-Version Status Collision (from PROJECT STATE blockers)
**What goes wrong:** The `migrateInstancesToLatest` flow (upgradeAllInstances=true) does NOT update WkfInstance records. If a migration uses this flow, instances may not have the correct `migrationStatusSelect` value.
**Why it happens:** `migrateInstancesToLatest` only migrates Camunda process instances between versions -- it does not touch WkfInstance DB records.
**How to avoid:** The DB query filters by `self.wkfProcess.wkfModel = :model AND self.migrationStatusSelect = 4`. Only instances that went through `computeMigrationInstances` (which sets status 4) will be picked up. The `migrateInstancesToLatest` path is a separate concern and does not affect this query.

### Pitfall 5: Two-Pass Task Loop Structure Must Be Preserved
**What goes wrong:** The current `migrateInstanceTasks` has a two-pass structure: Pass 1 cancels old tasks for ALL instances, Pass 2 creates new tasks for ALL instances. Wrapping per-instance status-2 updates requires careful placement.
**Why it happens:** The status-2 update should only happen after BOTH cancellation AND creation succeed for an instance.
**How to avoid:** The status-2 batch update should be in a third pass after both cancel and create passes, OR the method should be restructured to process per-instance (cancel + create + mark done). Given the user decision to update "after each instance's tasks are successfully migrated," the per-instance approach is required. This means restructuring from two-pass (cancel-all, create-all) to per-instance (cancel-for-instance, create-for-instance, mark-done).

## Code Examples

### Current migrateInstanceTasks Flow (to be rewritten)
```
1. Get migratedInstances from MigrationResult (in-memory list)
2. Setup WebSocket progress
3. Pass 1: For each instance, collect tasks to cancel -> cancelTasksBatch
4. Pass 2: For each instance, create new tasks -> saveTasks
5. Done
```

### New migrateInstanceTasks Flow
```
1. Query DB for status-4 instances by model
2. Extract instanceId list from WkfInstance records
3. Setup WebSocket progress (same pattern)
4. Pass 1: Cancel old tasks (same as current - iterate all instances)
5. Pass 2: Create new tasks AND batch status-2 updates per instance
6. Flush remaining status-2 batch
7. Done
```

**Design note on status-2 placement:** The user decision says "after each instance's tasks are successfully migrated." The task migration has two phases: cancel and create. An instance's tasks are "successfully migrated" after both cancel and create complete. The cleanest approach is to add the status-2 batch update after the create loop (Pass 2), since that is the final operation per instance. Failed instances stay at status 4 because the catch block skips the status-2 add.

### Integration Points Summary
```java
// 1. WkfMigrationService.java (interface) - line 35-36
// BEFORE:
void migrateInstanceTasks(ProcessEngine engine, WkfModel targetModel, MigrationResult migrationResult);
// AFTER:
void migrateInstanceTasks(ProcessEngine engine, WkfModel targetModel);

// 2. WkfMigrationServiceImpl.migrate() - line 281
// BEFORE:
migrateInstanceTasks(engine, targetModel, migrationResult);
// AFTER:
migrateInstanceTasks(engine, targetModel);

// 3. WkfModelController.deploy() - line 119
// BEFORE:
migrationService.migrateInstanceTasks(engine, wkfModel, migrationResult);
// AFTER:
migrationService.migrateInstanceTasks(engine, wkfModel);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| In-memory list of instance IDs | DB query for status-4 instances | Phase 2 (this phase) | Crash-recoverable task migration |
| Status jumps directly to 2 (done) | Status goes 4 (in-progress) then 2 (done) | Phase 1 + Phase 2 | Two-phase commit for crash safety |

## Open Questions

1. **WebSocket Progress Reporting Adjustments**
   - What we know: Current code uses `migratedInstances.size()` for progress denominator. New code uses DB query result count. Functionally identical.
   - What's unclear: Whether progress reporting should account for the status-2 update pass (currently progress ends at COMPLETE_PERCENTAGE after task creation).
   - Recommendation: Keep progress reporting identical to current behavior. Status-2 updates are fast DB writes and don't need their own progress range.

2. **Empty Instance List Handling**
   - What we know: Current code returns early if `migratedInstances == null || migratedInstances.isEmpty()`. DB query may return empty list.
   - What's unclear: Nothing -- the pattern is the same.
   - Recommendation: Keep early return for empty DB query result. Set progress to COMPLETE_PERCENTAGE on early return (matches current behavior).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | JUnit 5 |
| Config file | build.gradle (test block at project root) |
| Quick run command | `./gradlew :modules:axelor-studio:test --tests "com.axelor.studio.bpm.*"` |
| Full suite command | `./gradlew :modules:axelor-studio:test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DBMG-01 | migrateInstanceTasks queries DB for status-4 instances | manual-only | N/A -- requires Camunda engine + full Axelor context | N/A |
| DBMG-02 | Instance updated to status 2 after task migration | manual-only | N/A -- requires Camunda engine + DB | N/A |
| DBMG-03 | Signature no longer requires MigrationResult | unit | `./gradlew :modules:axelor-studio:compileJava` (compilation check) | N/A |

**Manual-only justification:** The migration service operates on a running Camunda process engine with real process instances and tasks. Unit testing would require mocking the entire Camunda engine, JPA/Hibernate session, and Guice injection framework. The existing project test pattern (see `MigrationResultTest`, `WkfInstanceServiceImplTest`) tests DTOs and simple service methods but not integration flows requiring a running engine. A compilation check verifies the signature change is consistent across all call sites.

### Sampling Rate
- **Per task commit:** `./gradlew :modules:axelor-studio:compileJava` (ensures no compilation errors)
- **Per wave merge:** `./gradlew :modules:axelor-studio:test`
- **Phase gate:** Full suite green + manual verification of crash-recovery scenario

### Wave 0 Gaps
None -- existing test infrastructure covers compilation verification. Integration testing for migration flows is manual-only (consistent with project patterns).

## Sources

### Primary (HIGH confidence)
- `WkfMigrationServiceImpl.java` -- Full source read, both `computeMigrationInstances` and `migrateInstanceTasks` analyzed line-by-line
- `WkfMigrationService.java` -- Interface with exact signature at line 35-36
- `WkfModelController.java` -- Both call sites: `migrate()` at line 281 and `deploy()` at line 119
- `WkfInstanceServiceImpl.java` -- `batchUpdateProcessInstances` implementation at lines 1400-1424 (nullable `targetProcess` behavior confirmed)
- `WkfInstance.xml` -- Domain model with status constants confirmed (STATUS_MIGRATION_IN_PROGRESS = 4)
- `MigrationResult.java` -- DTO with `migratedInstanceIds` field at line 23

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` -- Blocker about multi-version status collision and transaction boundary constraint

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use in project, no new dependencies
- Architecture: HIGH - All patterns copied from existing code in same file
- Pitfalls: HIGH - Identified from direct source analysis of transaction boundaries and method signatures

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable -- internal codebase, no external dependency changes)
