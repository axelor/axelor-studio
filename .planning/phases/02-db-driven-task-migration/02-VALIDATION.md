---
phase: 2
slug: db-driven-task-migration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Grep-based content checks + compilation |
| **Config file** | none — Axelor build validates compilation |
| **Quick run command** | `grep -c "STATUS_MIGRATION_IN_PROGRESS" src/main/java/com/axelor/studio/bpm/service/migration/WkfMigrationServiceImpl.java` |
| **Full suite command** | `./gradlew compileJava 2>&1 \| tail -5` |
| **Estimated runtime** | ~30 seconds (compilation) |

---

## Sampling Rate

- **After every task commit:** Run quick run command (grep checks)
- **After every plan wave:** Run full suite command (compilation)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | DBMG-01 | grep | `grep "migrationStatusSelect.*4" src/main/java/com/axelor/studio/bpm/service/migration/WkfMigrationServiceImpl.java` | N/A | ⬜ pending |
| 02-01-02 | 01 | 1 | DBMG-02 | grep | `grep "STATUS_MIGRATED_SUCCESSFULLY" src/main/java/com/axelor/studio/bpm/service/migration/WkfMigrationServiceImpl.java` | N/A | ⬜ pending |
| 02-01-03 | 01 | 1 | DBMG-03 | grep | `grep "migrateInstanceTasks" src/main/java/com/axelor/studio/bpm/service/migration/WkfMigrationService.java` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Changes are Java source code with grep and compilation verification.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Crash recovery resumes task migration | DBMG-01 | Requires killing process mid-migration | 1. Start migration, kill process after instance migration but before task migration. 2. Restart migration. 3. Verify status-4 instances get tasks migrated. |
| Per-instance status update | DBMG-02 | Requires running migration with multiple instances | Deploy, run migration with >1 instance, verify each moves to status 2 after tasks complete. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
