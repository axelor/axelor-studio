# Codebase Concerns

**Analysis Date:** 2026-03-13

## Tech Debt

**Broad exception catching with insufficient handling:**
- Issue: Multiple catch blocks catch generic `Exception` with minimal handling or just re-throw
- Files: `src/main/java/com/axelor/studio/bpm/service/execution/WkfInstanceServiceImpl.java` (lines 220, 225, 587, 609, 628, 668, 945, 967, 1023, 1094, 1328), `src/main/java/com/axelor/studio/bpm/service/deployment/BpmProgressWebSocket.java` (lines 68, 104)
- Impact: Swallows specific error context, makes debugging difficult, inconsistent error handling patterns
- Fix approach: Replace generic `Exception` with specific exception types; use structured logging instead of `printStackTrace()`

**Executor services not properly managed:**
- Issue: `Executors.newSingleThreadExecutor()` created but may not respect shutdown timeouts; executor not reused across calls
- Files: `src/main/java/com/axelor/studio/bpm/service/execution/WkfInstanceServiceImpl.java` (line 229), `src/main/java/com/axelor/studio/bpm/script/AxelorScriptEngine.java` (line 41), `src/main/java/com/axelor/studio/bpm/listener/ServerStartListener.java` (line 43), `src/main/java/com/axelor/studio/bpm/listener/WkfExecutionListener.java` (line 257)
- Impact: Thread pool exhaustion, memory leaks under load, resource cleanup not guaranteed
- Fix approach: Use injected `ExecutorService` bean, implement proper shutdown hooks, add timeouts to `awaitTermination()`

**Error logging to console instead of logger:**
- Issue: Direct use of `e.printStackTrace()` instead of logger framework
- Files: `src/main/java/com/axelor/csv/script/ImportPermission.java` (line 61), `src/main/java/com/axelor/studio/bpm/service/deployment/BpmProgressWebSocket.java` (lines 69, 104)
- Impact: Lost error context in logs, inconsistent logging behavior, difficult to aggregate errors
- Fix approach: Replace with `logger.error()`, use ExceptionHelper where available

**WebSocket session ID mismatch:**
- Issue: `onOpen()` uses `getCustomIdFromSession()` but `onClose()` uses `session.getId()` directly - inconsistent key usage
- Files: `src/main/java/com/axelor/studio/bpm/service/deployment/BpmProgressWebSocket.java` (lines 44, 50)
- Impact: Sessions not properly cleaned up, memory leak of session references in `sessionMap`
- Fix approach: Use consistent session identifier in both `onOpen()` and `onClose()`

**Excessive null checking pattern:**
- Issue: 951+ null checks using `!= null` and `== null` pattern throughout codebase
- Files: Widespread in `src/main/java/**`
- Impact: Verbose code, error-prone, null safety not enforced, potential NPE escapes
- Fix approach: Migrate to Optional API or @NonNull/@Nullable annotations, consider records

**Fragile string parsing in WebSocket:**
- Issue: Manual query string parsing with string split and index access without validation
- Files: `src/main/java/com/axelor/studio/bpm/service/deployment/BpmProgressWebSocket.java` (lines 76-87)
- Impact: IndexOutOfBoundsException if query params malformed, no null checks after split
- Fix approach: Use URL/URI parsing utilities or URI class, add validation

## Known Bugs

**Widget deletion logic inconsistency in React Studio:**
- Symptoms: `canRemove` is undefined for attrs widgets but should be true
- Files: `react/studio/src/Editor/index.jsx` (line 81), `react/studio/src/components/Widget.jsx` (line 135), `react/studio/src/components/Grid.jsx` (line 386)
- Trigger: Attempting to delete attribute-based widgets from UI
- Workaround: None documented - disabled deletion for attrs widgets

**Collapsible menu scroll-to issue in toolbar:**
- Symptoms: Element in closed collapsible menu won't scroll to when selected
- Files: `react/studio/src/Toolbar/Toolbar.jsx` (line 189)
- Trigger: User clicks element inside closed collapsible section and expects scroll-to-element behavior
- Workaround: User must open the collapsible section manually first

**Search options updates redundantly:**
- Symptoms: `getSearchOptions` called and items updated twice unnecessarily
- Files: `react/studio/src/Toolbar/api.js` (line 109)
- Trigger: Toolbar search functionality
- Workaround: None - potential minor performance impact

## Security Considerations

**Dynamic script evaluation without sandboxing:**
- Risk: GroovyScript and expression evaluation executed without isolation
- Files: `src/main/java/com/axelor/studio/bpm/script/AxelorScriptEngine.java`, `src/main/java/com/axelor/studio/bpm/script/AxelorBindingsHelper.java`, `src/main/java/com/axelor/studio/bpm/service/ProcessInstanceModificationServiceImpl.java`
- Current mitigation: Bindings context provided, custom script engine wrapper used
- Recommendations: Implement script sandbox/timeout constraints; audit allowed bindings; implement script AST validation; log all script evaluations with user context

**WebSocket message encoding/decoding without validation:**
- Risk: Messages decoded and put into ConcurrentHashMap without validation of structure or size
- Files: `src/main/java/com/axelor/studio/bpm/service/deployment/BpmProgressWebSocket.java` (lines 54-57)
- Current mitigation: WebSocketSecurity annotation present
- Recommendations: Validate message structure before processing; implement size limits; add rate limiting; sanitize customId parameter

**URLDecoder vulnerability in WebSocket:**
- Risk: URLDecoder.decode used with hardcoded UTF-8, but no validation of decoded output length
- Files: `src/main/java/com/axelor/studio/bpm/service/deployment/BpmProgressWebSocket.java` (line 82)
- Current mitigation: UnsupportedEncodingException caught
- Recommendations: Add length limit check post-decode; validate customId format; use URI/URL parsing instead of manual string split

## Performance Bottlenecks

**Large batch processing in WkfInstanceServiceImpl (1425 lines):**
- Problem: Single service handles instance execution, variable management, logging, error handling - too many responsibilities
- Files: `src/main/java/com/axelor/studio/bpm/service/execution/WkfInstanceServiceImpl.java`
- Cause: Monolithic design, no separation of concerns, multiple nested transactions
- Improvement path: Extract logging service, error handling service, variable service into separate classes; use async/reactive patterns for batch operations

**Migration batch processing with fixed batch size:**
- Problem: Hard-coded batch sizes (50, 100) may not be optimal for all deployments
- Files: `src/main/java/com/axelor/studio/bpm/service/migration/WkfMigrationServiceImpl.java` (lines 79-80)
- Cause: Fixed constants, no tuning mechanism
- Improvement path: Make batch sizes configurable; implement adaptive batching based on available memory; add progress tracking

**Blocking ExecutorService submit calls:**
- Problem: `executorService.submit()` blocks on task queue if full, no timeout
- Files: Multiple locations (WkfInstanceServiceImpl, BpmEngineEventService, WkfExecutionListener)
- Cause: Using newSingleThreadExecutor without bounded queue
- Improvement path: Use bounded ThreadPoolExecutor with RejectedExecutionHandler; implement async callbacks instead of blocking submit

**Inefficient null checking overhead:**
- Problem: 950+ null checks create code size and CPU branch prediction pressure
- Files: Throughout `src/main/java/**`
- Cause: Pre-Optional codebase style
- Improvement path: Migrate to Optional; use Java records with non-null fields

## Fragile Areas

**WkfMigrationServiceImpl migration logic:**
- Files: `src/main/java/com/axelor/studio/bpm/service/migration/WkfMigrationServiceImpl.java` (1031 lines)
- Why fragile: Complex node mapping logic, multiple passes over data, state management across migrations, dependent on external Camunda API behavior
- Safe modification: Add comprehensive unit tests for each migration step; test with large models; implement rollback mechanism; add migration dry-run feature
- Test coverage: Gaps in edge cases (circular references, orphaned nodes, partial migration failure)

**DeployDialog component in React:**
- Files: `react/bpm/src/BPMN/Modeler/views/DeployDialog.jsx`
- Why fragile: Complex state management with useEffect dependencies, nested ternary conditionals, deep object destructuring without null checks
- Safe modification: Extract state logic to custom hook; add prop validation; implement error boundary; test with missing data
- Test coverage: No test files found for this dialog; migrations, node mapping, element filtering lack coverage

**Script evaluation engine without sandboxing:**
- Files: `src/main/java/com/axelor/studio/bpm/script/AxelorScriptEngine.java`, `src/main/java/com/axelor/studio/bpm/script/AxelorBindingsHelper.java`
- Why fragile: Scripts can access full bindings context; no timeout enforcement; no resource limits
- Safe modification: Implement timeout wrapper; restrict available classes/methods in bindings; add audit logging; implement script pre-compilation validation
- Test coverage: Script execution tested but not malicious/edge case scripts

**Camunda BPM engine initialization:**
- Files: `src/main/java/com/axelor/studio/bpm/service/init/ProcessEngineService.java`, `src/main/java/com/axelor/studio/bpm/listener/ServerStartListener.java`
- Why fragile: Singleton ProcessEngine, initialization in listener, no health checks, database connection pooling configured at engine level
- Safe modification: Add initialization health checks; implement graceful shutdown sequence; add database connection validation; implement engine restart capability
- Test coverage: Integration tests present but single-engine assumption means tests don't cover concurrent scenarios

## Scaling Limits

**WebSocket session storage unbounded:**
- Current capacity: Sessions stored in-memory in `ConcurrentHashMap` without size limit
- Limit: Memory exhaustion at high concurrent user count (no eviction policy)
- Scaling path: Implement bounded session map with LRU eviction; use external session store (Redis); add session expiry; implement heartbeat cleanup

**Static batch processing constants:**
- Current capacity: Fixed batch sizes (INSTANCE_BATCH_SIZE=50, TASK_BATCH_SIZE=100) work for typical deployments
- Limit: Breaks under large-scale migrations (1000+ instances, 10000+ tasks); causes GC pressure or timeouts
- Scaling path: Make batch sizes configurable; implement adaptive batching; add chunking for results; use pagination for WebSocket updates

**Single-threaded executor services:**
- Current capacity: One thread per executor instance
- Limit: If executor submission queue fills, subsequent submits block application threads; cascading failures under load
- Scaling path: Use thread pool executors with bounded queues; implement queue depth monitoring; add backpressure handling; consider reactive streams

**Monolithic service classes:**
- Current capacity: WkfInstanceServiceImpl (1425 lines) handles all instance lifecycle
- Limit: Thread contention at service level, difficult to shard across processes
- Scaling path: Split by operation type (read/write); implement CQRS pattern; shard by instance ID range; add caching layer

## Dependencies at Risk

**Camunda BPM 7.x EOL risk:**
- Risk: Framework approaching EOL, migration to 8.x requires significant refactoring
- Impact: Security patches may cease; performance degradation; compatibility issues with newer Java versions
- Migration plan: Evaluate Camunda 8.x architecture (separate execution engine); plan backward compatibility layer; test with preview versions

**Moment.js deprecation:**
- Risk: Moment.js is in maintenance mode, recommended to use dayjs or native Date
- Impact: No new features, potential security issues, bundle size overhead
- Migration plan: Migrate from Moment to dayjs (already included); replace moment() calls with dayjs() equivalents

**React 18.2 compatibility:**
- Risk: React 18 Strict Mode causes double-mounting in development; concurrent features not fully utilized
- Impact: Potential race conditions in effects, rendering side effects visible; performance not optimized for concurrent rendering
- Migration plan: Audit useEffect cleanup; implement Suspense boundaries; migrate class components to hooks

**Older bpmn-js version (18.2.0):**
- Risk: Security patches and bug fixes released regularly; version is several minor versions behind current
- Impact: Known vulnerabilities possible, missing features, compatibility issues with diagram models
- Migration plan: Schedule regular dependency updates; evaluate version constraints; test with each update

## Missing Critical Features

**Feature gap: Graceful shutdown for long-running migrations:**
- Problem: User cannot gracefully cancel deployment/migration mid-process; no pause/resume capability
- Blocks: Large deployments fail mid-way with no recovery; users must retry entire deployment
- Test coverage gap: No tests for cancellation scenarios; no cleanup verification after cancellation

**Feature gap: Migration dry-run mode:**
- Problem: No way to preview what a migration will do before committing changes
- Blocks: Users cannot validate migration mappings before applying to live instances
- Test coverage gap: No dry-run tests; only full execution tests exist

**Feature gap: Deployment rollback:**
- Problem: Once deployed, no way to revert to previous working version
- Blocks: Bad deployments require manual cleanup of instances and definitions
- Test coverage gap: No rollback scenario tests

**Feature gap: Instance-level error recovery:**
- Problem: Failed instances stuck in error state, no automatic retry or manual intervention UI
- Blocks: Workflow stalled for instance, manual database intervention required
- Test coverage gap: Error recovery paths not thoroughly tested

## Test Coverage Gaps

**WebSocket deployment progress tracking:**
- What's not tested: Session cleanup on abnormal disconnect, concurrent session updates, message encoding edge cases
- Files: `src/main/java/com/axelor/studio/bpm/service/deployment/BpmProgressWebSocket.java`
- Risk: Memory leaks from uncleaned sessions; race conditions in concurrent deployments; malformed progress messages
- Priority: High (production-facing user feature)

**DeployDialog React component:**
- What's not tested: All render paths, state transitions, null/undefined element handling, migration mapping calculation
- Files: `react/bpm/src/BPMN/Modeler/views/DeployDialog.jsx`
- Risk: Broken UI states, incorrect mappings applied, component crashes
- Priority: High (critical for deployment workflow)

**Script evaluation and bindings:**
- What's not tested: Malicious script injection, infinite loops, resource exhaustion, expression syntax errors, missing binding variables
- Files: `src/main/java/com/axelor/studio/bpm/script/AxelorScriptEngine.java`, `src/main/java/com/axelor/studio/bpm/bpm/context/WkfContextHelper.java`
- Risk: Application hang/crash, information disclosure via error messages, denial of service
- Priority: Critical (security-relevant)

**Migration rollback paths:**
- What's not tested: Partial migration failures, task orphaning, instance state inconsistency after failed migration, cleanup on migration cancellation
- Files: `src/main/java/com/axelor/studio/bpm/service/migration/WkfMigrationServiceImpl.java`
- Risk: Corrupted process definitions, stuck instances, data loss
- Priority: Critical (data integrity)

**Authorization and permission checks:**
- What's not tested: Cross-tenant access attempts, permission escalation via model manipulation, UI state after permission denial
- Files: `src/main/java/com/axelor/studio/bpm/service/authorization/BpmAuthorizationService.java`, `react/bpm/src/BPMN/Modeler/**`
- Risk: Unauthorized model/instance access, data leakage
- Priority: Critical (security)

---

*Concerns audit: 2026-03-13*
