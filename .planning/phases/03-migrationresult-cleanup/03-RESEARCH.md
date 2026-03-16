# Phase 3: MigrationResult Cleanup - Research

**Researched:** 2026-03-16
**Domain:** Java code deletion (DTO field removal, call-site cleanup, test update)
**Confidence:** HIGH

## Summary

Phase 3 is pure deletion. The `migratedInstanceIds` field in `MigrationResult.java` was made redundant by Phase 2's switch to DB-driven instance discovery. The field is still written (one call site in `WkfMigrationServiceImpl.java` line 679) but never read by production code. All references are fully enumerated below with exact locations.

The scope is small and fully contained: one field + one method in `MigrationResult.java`, one call site in `WkfMigrationServiceImpl.java`, one dedicated test method + two assertions in default-values test in `MigrationResultTest.java`, and two now-unused imports.

**Primary recommendation:** Delete in a single pass -- remove field/method from DTO, remove call site, update tests, remove unused imports. Verify with compilation and test run.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Remove `private List<String> migratedInstanceIds = new ArrayList<>()` field from `MigrationResult.java` (line 23)
- Remove `addMigratedInstanceId(String instanceId)` method from `MigrationResult.java` (lines 36-38)
- Remove `result.addMigratedInstanceId(processInstanceId)` call from `WkfMigrationServiceImpl.java` (line 679)
- Remove or update test assertions in `MigrationResultTest.java` that reference `migratedInstanceIds`, `addMigratedInstanceId()`, or `getMigratedInstanceIds()`
- Lombok `@Getter/@Setter` auto-generates `getMigratedInstanceIds()`/`setMigratedInstanceIds()` -- removing the field removes these implicitly
- Remove `java.util.ArrayList` and `java.util.List` imports from `MigrationResult.java` ONLY if no other fields use them (check remaining fields first)

### Claude's Discretion
- Whether to clean up any now-unused imports
- Test restructuring details

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CLNP-01 | Remove `migratedInstanceIds` field and `addMigratedInstanceId()` from `MigrationResult` | Exact lines identified: field at line 23, method at lines 36-38. Remaining fields are all primitives so `List`/`ArrayList` imports become unused. |
| CLNP-02 | Remove `result.addMigratedInstanceId()` calls from `computeMigrationInstances` | Single call site at `WkfMigrationServiceImpl.java` line 679. Grep confirms no other references in `src/`. |
</phase_requirements>

## Standard Stack

Not applicable -- this phase uses no new libraries. It is pure deletion of existing code.

### Import Cleanup Analysis

After removing `migratedInstanceIds`, the remaining fields in `MigrationResult.java` are:
- `int totalInstancesToMigrate` (primitive)
- `int successfulMigrations` (primitive)
- `int failedMigrations` (primitive)
- `boolean migrationError` (primitive)
- `int tasksCancelled` (primitive)
- `int tasksCreated` (primitive)

**Conclusion:** `java.util.ArrayList` and `java.util.List` are unused after field removal. Both imports should be removed.

## Architecture Patterns

### Deletion Checklist Pattern

For safe field removal from a Lombok-annotated DTO:

1. **Remove the field declaration** -- Lombok `@Getter/@Setter` automatically stops generating accessors
2. **Remove any manual helper methods** that reference the field (e.g., `addMigratedInstanceId`)
3. **Find and remove all call sites** via grep
4. **Remove unused imports** from the DTO file
5. **Update tests** -- remove dedicated test methods, remove assertions in shared tests
6. **Compile and run tests** to verify no missed references

### Anti-Patterns to Avoid
- **Leaving dead imports:** After removing the only `List` field, do not leave `java.util.List` and `java.util.ArrayList` imports dangling.
- **Partial test cleanup:** Do not just delete the dedicated test method (`shouldAddMigratedInstanceIds`) and forget the assertions in `shouldInitializeWithDefaultValues` (lines 24-25).

## Don't Hand-Roll

Not applicable -- no libraries needed for deletion.

## Common Pitfalls

### Pitfall 1: Missing References in Default-Values Test
**What goes wrong:** The `shouldInitializeWithDefaultValues` test has two assertions about `migratedInstanceIds` (lines 24-25) that are easy to miss because they are not in a dedicated test method.
**Why it happens:** Developer focuses on the dedicated `shouldAddMigratedInstanceIds` test and forgets the default-values test also references the field.
**How to avoid:** Grep for ALL references: `getMigratedInstanceIds`, `setMigratedInstanceIds`, `addMigratedInstanceId`, `migratedInstanceIds`.
**Warning signs:** Compilation error on `getMigratedInstanceIds()` in the default-values test.

### Pitfall 2: Forgetting Lombok-Generated Accessors
**What goes wrong:** Someone removes the field but tries to also manually remove getter/setter methods that do not exist in source (they are generated by Lombok).
**Why it happens:** Unfamiliarity with `@Getter/@Setter` annotation behavior.
**How to avoid:** Understand that removing the field is sufficient -- Lombok stops generating accessors automatically.

## Code Examples

### MigrationResult.java After Cleanup

```java
// Expected state after all deletions
package com.axelor.studio.bpm.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MigrationResult {

  private int totalInstancesToMigrate = 0;
  private int successfulMigrations = 0;
  private int failedMigrations = 0;
  private boolean migrationError = false;
  private int tasksCancelled = 0;
  private int tasksCreated = 0;

  public void incrementSuccessfulMigrations() {
    this.successfulMigrations++;
  }

  public void incrementFailedMigrations() {
    this.failedMigrations++;
  }

  public void incrementTasksCancelled() {
    this.tasksCancelled++;
  }

  public void incrementTasksCreated() {
    this.tasksCreated++;
  }

  public void markMigrationError() {
    this.migrationError = true;
  }
}
```

### WkfMigrationServiceImpl.java Line 679 Removal

```java
// BEFORE (lines 677-679):
        pendingSaves.add(processInstanceId);
        migratedInstances++;
        result.addMigratedInstanceId(processInstanceId);

// AFTER (lines 677-678):
        pendingSaves.add(processInstanceId);
        migratedInstances++;
```

### MigrationResultTest.java Changes

**Remove entire test method `shouldAddMigratedInstanceIds`** (lines 52-61).

**Remove from `shouldInitializeWithDefaultValues`** (lines 24-25):
```java
    // DELETE these two lines:
    assertNotNull(result.getMigratedInstanceIds());
    assertTrue(result.getMigratedInstanceIds().isEmpty());
```

## Exhaustive Reference Inventory

Full grep results for `migratedInstanceId` across `src/`:

| File | Line | Reference | Action |
|------|------|-----------|--------|
| `MigrationResult.java` | 23 | Field declaration | Remove line |
| `MigrationResult.java` | 36-38 | `addMigratedInstanceId()` method | Remove method |
| `MigrationResult.java` | 7-8 | `import ArrayList`, `import List` | Remove both imports |
| `WkfMigrationServiceImpl.java` | 679 | `result.addMigratedInstanceId(processInstanceId)` | Remove line |
| `MigrationResultTest.java` | 24-25 | Assertions in default-values test | Remove 2 lines |
| `MigrationResultTest.java` | 52-61 | `shouldAddMigratedInstanceIds` test | Remove entire method |

**Total: 6 edit locations across 3 files. No other references exist.**

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | JUnit 5 (Jupiter) |
| Config file | `build.gradle` (useJUnitPlatform) |
| Quick run command | `./gradlew :modules:axelor-studio:test --tests "com.axelor.studio.bpm.dto.MigrationResultTest"` |
| Full suite command | `./gradlew :modules:axelor-studio:test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLNP-01 | Field and method removed from MigrationResult | compilation | `./gradlew :modules:axelor-studio:compileJava` | N/A (compile check) |
| CLNP-01 | Tests updated to not reference removed field | unit | `./gradlew :modules:axelor-studio:test --tests "com.axelor.studio.bpm.dto.MigrationResultTest"` | Yes |
| CLNP-02 | Call site removed from WkfMigrationServiceImpl | compilation | `./gradlew :modules:axelor-studio:compileJava` | N/A (compile check) |

### Sampling Rate
- **Per task commit:** `./gradlew :modules:axelor-studio:compileJava` (fast compilation check)
- **Per wave merge:** `./gradlew :modules:axelor-studio:test --tests "com.axelor.studio.bpm.dto.MigrationResultTest"`
- **Phase gate:** Full compilation + MigrationResultTest green

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. Tests need updating (removal of assertions), not creation.

## Sources

### Primary (HIGH confidence)
- Direct source code inspection of `MigrationResult.java`, `WkfMigrationServiceImpl.java`, `MigrationResultTest.java`
- Grep across entire `src/` directory for all references

## Metadata

**Confidence breakdown:**
- Removal targets: HIGH - direct source code inspection with exhaustive grep
- Import cleanup: HIGH - verified remaining fields are all primitives
- Test changes: HIGH - exact lines identified from source
- No missed references: HIGH - grep across entire src/ tree

**Research date:** 2026-03-16
**Valid until:** Indefinite (pure deletion, no external dependencies)
