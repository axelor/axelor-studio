---
status: testing
phase: 02-db-driven-task-migration
source: 02-01-SUMMARY.md
started: 2026-03-16T12:30:00Z
updated: 2026-03-16T12:30:00Z
---

## Current Test

number: 1
name: Instance migration sets status 4
expected: |
  After running a BPM migration with instances, check the WkfInstance records in the database.
  Instances that were successfully migrated by Camunda should have migrationStatusSelect = 4 (in progress),
  NOT migrationStatusSelect = 2 (migrated successfully). Status 2 should only appear after task migration completes.
awaiting: user response

## Tests

### 1. Instance migration sets status 4
expected: After running a BPM migration, successfully migrated WkfInstance records have migrationStatusSelect = 4 (in progress) immediately after instance migration, before task migration runs.
result: [pending]

### 2. Task migration queries status-4 instances from DB
expected: Task migration (cancel old tasks, create new ones) runs for all WkfInstance records with migrationStatusSelect = 4 for the target model. It does NOT rely on an in-memory list. You can verify by checking logs or stepping through the code.
result: [pending]

### 3. Instances move to status 2 after task migration
expected: After task migration completes for each instance (tasks cancelled and recreated), the instance's migrationStatusSelect is updated to 2 (migrated successfully). Check the DB after full migration completes.
result: [pending]

### 4. Crash recovery — status-4 instances are retried
expected: Kill the application mid-migration (after instance migration but before task migration completes). Restart the application and trigger migration again. Status-4 instances should be picked up by task migration without needing to re-run instance migration. Status-2 instances should be skipped.
result: [pending]

### 5. Failed instances stay at status 4
expected: If task migration fails for a specific instance (e.g., due to a task creation error), that instance remains at migrationStatusSelect = 4. It is NOT moved to status 3 (error). On the next migration run, it will be retried.
result: [pending]

### 6. Migration completes end-to-end
expected: Run a full BPM model migration with multiple instances. All instances should end at migrationStatusSelect = 2 (migrated successfully). The migration summary shows correct counts. No errors in logs.
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0

## Gaps

[none yet]
