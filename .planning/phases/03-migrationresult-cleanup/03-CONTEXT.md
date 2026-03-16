# Phase 3: MigrationResult Cleanup - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove the now-redundant `migratedInstanceIds` field and all related code from `MigrationResult`. Phase 2 replaced the in-memory list with a DB query, so `migratedInstanceIds` is written but never read. This is pure deletion — no new logic.

</domain>

<decisions>
## Implementation Decisions

### Removal targets
- Remove `private List<String> migratedInstanceIds = new ArrayList<>()` field from `MigrationResult.java` (line 23)
- Remove `addMigratedInstanceId(String instanceId)` method from `MigrationResult.java` (lines 36-38)
- Remove `result.addMigratedInstanceId(processInstanceId)` call from `WkfMigrationServiceImpl.java` (line 679)
- Remove or update test assertions in `MigrationResultTest.java` that reference `migratedInstanceIds`, `addMigratedInstanceId()`, or `getMigratedInstanceIds()`
- Lombok `@Getter/@Setter` auto-generates `getMigratedInstanceIds()`/`setMigratedInstanceIds()` — removing the field removes these implicitly
- Remove `java.util.ArrayList` and `java.util.List` imports from `MigrationResult.java` ONLY if no other fields use them (check remaining fields first)

### Claude's Discretion
- Whether to clean up any now-unused imports
- Test restructuring details

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### DTO
- `src/main/java/com/axelor/studio/bpm/dto/MigrationResult.java` — Target file: remove field and method

### Call site
- `src/main/java/com/axelor/studio/bpm/service/migration/WkfMigrationServiceImpl.java` — Remove `addMigratedInstanceId()` call at line 679

### Tests
- `src/test/java/com/axelor/studio/bpm/dto/MigrationResultTest.java` — Remove/update test assertions for removed field/method

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None needed — pure deletion phase

### Established Patterns
- Lombok `@Getter/@Setter` on `MigrationResult` — removing a field automatically removes generated accessors

### Integration Points
- No other code reads `migratedInstanceIds` after Phase 2 changes — safe to remove

</code_context>

<specifics>
## Specific Ideas

No specific requirements — straightforward deletion following the removal targets above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-migrationresult-cleanup*
*Context gathered: 2026-03-16*
