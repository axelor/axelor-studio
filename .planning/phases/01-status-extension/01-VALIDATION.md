---
phase: 1
slug: status-extension
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Axelor XML validation (XSD) + grep-based content checks |
| **Config file** | none — XML files validated by Axelor build |
| **Quick run command** | `grep -c "STATUS_MIGRATION_IN_PROGRESS" src/main/resources/domains/WkfInstance.xml` |
| **Full suite command** | `grep "STATUS_MIGRATION_IN_PROGRESS = 4" src/main/resources/domains/WkfInstance.xml && grep 'value="4".*Migration in progress' src/main/resources/views/Selects.xml` |
| **Estimated runtime** | ~1 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 1 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | STAT-01 | grep | `grep "STATUS_MIGRATION_IN_PROGRESS = 4" src/main/resources/domains/WkfInstance.xml` | N/A | ⬜ pending |
| 01-01-02 | 01 | 1 | STAT-02 | grep | `grep 'value="4"' src/main/resources/views/Selects.xml` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Changes are XML-only with grep-based verification.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Selection renders in UI | STAT-02 | Requires running Axelor app | Deploy app, open WkfInstance form, check migrationStatusSelect dropdown shows "Migration in progress" |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 1s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
