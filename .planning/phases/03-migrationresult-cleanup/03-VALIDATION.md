---
phase: 3
slug: migrationresult-cleanup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Grep-based content checks + compilation + test suite |
| **Config file** | none |
| **Quick run command** | `grep -c "migratedInstanceIds" src/main/java/com/axelor/studio/bpm/dto/MigrationResult.java; echo "expect 0"` |
| **Full suite command** | `./gradlew :modules:axelor-studio:compileJava :modules:axelor-studio:test 2>&1 \| tail -10` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command (grep absence check)
- **After every plan wave:** Run full suite command (compile + tests)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | CLNP-01 | grep | `grep -c "migratedInstanceIds" src/main/java/com/axelor/studio/bpm/dto/MigrationResult.java` (expect 0) | N/A | ⬜ pending |
| 03-01-02 | 01 | 1 | CLNP-02 | grep | `grep -c "addMigratedInstanceId" src/main/java/com/axelor/studio/bpm/service/migration/WkfMigrationServiceImpl.java` (expect 0) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Changes are pure deletion with grep and compilation verification.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
