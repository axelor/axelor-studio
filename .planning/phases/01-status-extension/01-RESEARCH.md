# Phase 1: Status Extension - Research

**Researched:** 2026-03-16
**Domain:** Axelor domain model XML configuration (extra-code constants + selection options)
**Confidence:** HIGH

## Summary

Phase 1 is a minimal, two-file XML edit. The `WkfInstance.xml` domain model needs a new `STATUS_MIGRATION_IN_PROGRESS = 4` constant in its `<extra-code>` block, and `Selects.xml` needs a matching `<option value="4">Migration in progress</option>` entry in the `wkf.instance.migration.status.select` selection.

The Axelor code generation pipeline reads `<extra-code>` from domain XML files and copies constants into the generated `WkfInstanceRepository.java`. The existing three migration status constants (`STATUS_NOT_MIGRATED = 1`, `STATUS_MIGRATED_SUCCESSFULLY = 2`, `STATUS_MIGRATION_ERROR = 3`) already follow this pattern and are referenced throughout Java code as `WkfInstanceRepository.STATUS_*`. After adding the constant and rebuilding, `WkfInstanceRepository.STATUS_MIGRATION_IN_PROGRESS` will be available for Phase 2 to use.

**Primary recommendation:** Add one line to each XML file, rebuild, and verify the generated repository class contains the new constant.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- STATUS_MIGRATION_IN_PROGRESS = 4 (not STATUS_COMPLETED) as an intermediate state
- Value 4 chosen (values 1-3 already taken)
- Status flow: NOT_MIGRATED (1) -> MIGRATION_IN_PROGRESS (4) -> MIGRATED_SUCCESSFULLY (2) / MIGRATION_ERROR (3)
- Only two files modified: WkfInstance.xml (domain) and Selects.xml (views)
- No Java code changes in Phase 1
- No changes to existing status values or labels
- No UI changes beyond the selection option

### Claude's Discretion
- None specified

### Deferred Ideas (OUT OF SCOPE)
- Java code changes to use the new constant (Phase 2)
- Any UI changes beyond adding the selection option
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STAT-01 | Add `STATUS_MIGRATION_IN_PROGRESS = 4` constant to WkfInstance extra-code | Verified exact location: `src/main/resources/domains/WkfInstance.xml` lines 30-36, `<extra-code>` block. Insert after line 33 (STATUS_MIGRATION_ERROR). Code gen copies to WkfInstanceRepository. |
| STAT-02 | Add "Migration in progress" option (value 4) to `wkf.instance.migration.status.select` selection | Verified exact location: `src/main/resources/views/Selects.xml` lines 33-37. Insert new `<option>` element within the selection block. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Axelor Open Platform | 8.0 | Domain model framework | XSD namespace confirms 8.0; code gen reads XML domains |

### Supporting
Not applicable -- this phase only modifies XML configuration files.

## Architecture Patterns

### Axelor Domain Model Constants

Constants are declared in `<extra-code>` CDATA blocks inside entity XML files. The Axelor Gradle build (`com.axelor.app` plugin) generates a Repository class that includes these constants verbatim.

**Source file:** `src/main/resources/domains/WkfInstance.xml`
**Generated file:** `build/src-gen/main/java/com/axelor/studio/db/repo/WkfInstanceRepository.java`

**Current extra-code block (lines 30-36):**
```xml
<extra-code><![CDATA[
    public static final int STATUS_NOT_MIGRATED = 1;
    public static final int STATUS_MIGRATED_SUCCESSFULLY = 2;
    public static final int STATUS_MIGRATION_ERROR = 3;
    public static final int STATUS_IN_PROGRESS = 1;
    public static final int STATUS_STOPPED = 2;
]]></extra-code>
```

**After change:**
```xml
<extra-code><![CDATA[
    public static final int STATUS_NOT_MIGRATED = 1;
    public static final int STATUS_MIGRATED_SUCCESSFULLY = 2;
    public static final int STATUS_MIGRATION_ERROR = 3;
    public static final int STATUS_MIGRATION_IN_PROGRESS = 4;
    public static final int STATUS_IN_PROGRESS = 1;
    public static final int STATUS_STOPPED = 2;
]]></extra-code>
```

Note: The `STATUS_IN_PROGRESS` and `STATUS_STOPPED` constants relate to `statusSelect` (the instance lifecycle status, not migration status). `STATUS_MIGRATION_IN_PROGRESS` relates to `migrationStatusSelect`. The naming is clear enough to avoid confusion.

### Axelor Selection Options

Selection definitions live in `src/main/resources/views/Selects.xml`. They define the UI labels for integer-based selection fields.

**Current selection (lines 33-37):**
```xml
<selection name="wkf.instance.migration.status.select">
  <option value="1">Not migrated</option>
  <option value="2">Migrated successfully</option>
  <option value="3">Migration error</option>
</selection>
```

**After change:**
```xml
<selection name="wkf.instance.migration.status.select">
  <option value="1">Not migrated</option>
  <option value="2">Migrated successfully</option>
  <option value="3">Migration error</option>
  <option value="4">Migration in progress</option>
</selection>
```

### Anti-Patterns to Avoid
- **Editing generated files directly:** Never modify `build/src-gen/` or `out/production/` -- always edit the source XML in `src/main/resources/`
- **Mismatching constant value and option value:** The constant value (4) MUST match the selection option value (4)

## Don't Hand-Roll

Not applicable -- this phase is pure configuration, no custom code needed.

## Common Pitfalls

### Pitfall 1: Forgetting to rebuild after XML changes
**What goes wrong:** The constant exists in XML but not in the generated Repository class; Java code referencing it will not compile.
**Why it happens:** Axelor requires a Gradle build to regenerate `build/src-gen/` from domain XMLs.
**How to avoid:** Run `./gradlew generateCode` or a full build after editing domain XML.
**Warning signs:** Compilation errors referencing `STATUS_MIGRATION_IN_PROGRESS`.

### Pitfall 2: Option ordering assumption
**What goes wrong:** Assuming selection option order in XML determines display order. In Axelor, the selection widget (`NavSelect` in WkfInstance view) displays options in the order defined in the XML. The logical flow is 1 -> 4 -> 2, but option 4 appears last in the XML.
**Why it happens:** The semantic ordering (not migrated -> in progress -> success/error) differs from the value ordering (1, 2, 3, 4).
**How to avoid:** Per CONTEXT.md, the scope is just adding the option. The NavSelect widget in the WkfInstance view is read-only, so display order is secondary. However, if desired, options could be reordered in XML to match the logical flow: 1, 4, 2, 3.

### Pitfall 3: Naming collision with STATUS_IN_PROGRESS
**What goes wrong:** Confusion between `STATUS_IN_PROGRESS` (value 1, for `statusSelect` -- instance lifecycle) and `STATUS_MIGRATION_IN_PROGRESS` (value 4, for `migrationStatusSelect` -- migration status).
**Why it happens:** Both are in the same extra-code block.
**How to avoid:** The new constant includes "MIGRATION" prefix, matching the existing migration status naming convention (`STATUS_MIGRATED_SUCCESSFULLY`, `STATUS_MIGRATION_ERROR`). This is already handled correctly in the design.

## Code Examples

### STAT-01: WkfInstance.xml change
```xml
<!-- src/main/resources/domains/WkfInstance.xml -->
<!-- Add this line after STATUS_MIGRATION_ERROR = 3 in the extra-code block -->
        public static final int STATUS_MIGRATION_IN_PROGRESS = 4;
```

### STAT-02: Selects.xml change
```xml
<!-- src/main/resources/views/Selects.xml -->
<!-- Add this option inside wkf.instance.migration.status.select -->
    <option value="4">Migration in progress</option>
```

## State of the Art

No changes -- Axelor Open Platform 8.0 domain model XML pattern has been stable. The existing three migration status constants were added as part of the migration feature and this simply extends the same pattern.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | JUnit (via Gradle) |
| Config file | `build.gradle` (testlogger plugin configured) |
| Quick run command | `./gradlew test` |
| Full suite command | `./gradlew test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STAT-01 | Constant `STATUS_MIGRATION_IN_PROGRESS = 4` exists on WkfInstanceRepository | unit | `./gradlew generateCode` then verify generated source | N/A -- build verification |
| STAT-02 | Selection option "Migration in progress" with value 4 exists | manual-only | Visual inspection of Selects.xml | N/A -- XML content |

### Sampling Rate
- **Per task commit:** `./gradlew generateCode` to verify constant appears in generated Repository
- **Per wave merge:** `./gradlew test` for full regression
- **Phase gate:** Full suite green + manual XML inspection

### Wave 0 Gaps
None -- this phase adds only XML configuration. The existing build infrastructure (`./gradlew generateCode`) is sufficient to verify that the constant is correctly propagated to the generated Repository class. No new test files are needed for a simple constant addition.

## Open Questions

None -- this phase is fully scoped and straightforward. Both files, exact locations, and exact content are known.

## Sources

### Primary (HIGH confidence)
- Direct inspection of `src/main/resources/domains/WkfInstance.xml` -- current extra-code block with 3 migration constants + 2 instance status constants
- Direct inspection of `src/main/resources/views/Selects.xml` -- current selection with 3 options
- Direct inspection of `build/src-gen/main/java/com/axelor/studio/db/repo/WkfInstanceRepository.java` -- confirms code gen copies extra-code constants to repository class
- Grep of `WkfInstanceRepository.STATUS_*` usage across Java source -- confirms constants are referenced via Repository class

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - direct source inspection, well-established Axelor XML pattern
- Architecture: HIGH - verified code generation pipeline from domain XML to Repository class
- Pitfalls: HIGH - based on direct observation of existing code patterns and naming

**Research date:** 2026-03-16
**Valid until:** Indefinite -- Axelor domain model XML conventions are stable
