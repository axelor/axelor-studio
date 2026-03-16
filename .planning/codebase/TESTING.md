# Testing Patterns

**Analysis Date:** 2026-03-13

## Test Framework

**Runner:**
- Java: JUnit Jupiter (JUnit 5)
  - Config: `build.gradle` - `useJUnitPlatform()`
  - Test logging: Mocha theme via `testlogger` plugin
- React: No test framework detected
  - Testing library installed (`@testing-library/react`, `@testing-library/jest-dom`) but no active tests in `src/`

**Assertion Library:**
- Java: JUnit Jupiter built-in assertions
  - Static imports: `assertEquals`, `assertNotNull`, `assertTrue`
  - Located: Test files in `src/test/java/`

**Run Commands:**
```bash
# Run all tests
./gradlew test

# Run tests with coverage
./gradlew test jacocoTestReport

# Generate coverage report
./gradlew jacocoTestReport

# Format code (includes Java/Markdown/XML)
./gradlew formatCode
```

## Test File Organization

**Location:**
- Java: Mirrored structure - `src/test/java/` matches `src/main/java/`
- React: No test files present in codebase (dependencies installed but unused)

**Naming:**
- Java test classes: Append `Test` suffix (e.g., `WkfInstanceServiceImplTest.java`, `BpmAuthorizationServiceTest.java`)
- Test methods: Prefix with `test` or use descriptive names prefixed with method/action under test
- Test methods start with `should` + expected behavior (e.g., `shouldReturnEntityReferenceVariablesWhenProcessExistsWithValidData`)

**Structure:**
```
src/test/java/
├── com/axelor/meta/loader/
│   └── AppVersionServiceImplTest.java
├── com/axelor/studio/bpm/
│   ├── service/
│   │   ├── execution/
│   │   │   ├── WkfInstanceServiceImplTest.java
│   │   │   └── WkfUserActionServiceTest.java
│   │   ├── authorization/
│   │   ├── identity/
│   │   └── init/
│   ├── dto/
│   │   ├── DeploymentResultTest.java
│   │   └── MigrationResultTest.java
│   ├── context/
│   │   └── WkfContextHelperTest.java
│   └── service/
├── com/axelor/studio/service/
│   ├── constructor/
│   └── loader/
└── com/axelor/studio/service/
```

## Test Structure

**Suite Organization:**

From `src/test/java/com/axelor/studio/bpm/service/execution/WkfInstanceServiceImplTest.java`:

```java
public class WkfInstanceServiceImplTest extends BaseTest {

  protected final LoaderHelper loaderHelper;
  protected final UserRepository userRepository;
  protected final WkfInstanceService wkfInstanceService;

  @Inject
  public WkfInstanceServiceImplTest(
      LoaderHelper loaderHelper,
      UserRepository userRepository,
      WkfInstanceServiceImpl wkfInstanceService) {
    this.loaderHelper = loaderHelper;
    this.userRepository = userRepository;
    this.wkfInstanceService = wkfInstanceService;
  }

  @BeforeEach
  void setUp() {
    loaderHelper.importCsv("data/users-input.xml");
  }

  @Test
  void shouldReturnEntityReferenceVariablesWhenProcessExistsWithValidData() {
    // Arrange
    User user = userRepository.findByCode("customize");
    assertNotNull(user);

    // Act & Assert
    try (var mockedStatic = mockStatic(ProcessEngines.class)) {
      // ...test logic...
    }
  }
}
```

**Patterns:**
- Setup via constructor injection and `@Inject` annotation
- Per-test setup in `@BeforeEach` methods
- Arrange-Act-Assert pattern: Clear separation in test methods
- Try-with-resources for mock static contexts
- Test base class inheritance: `extends BaseTest`

## Mocking

**Framework:**
- Tool: Mockito (v3+, configured via `mockito-core` dependency)
- Static mocking: `mockStatic()` for static method mocking
- Instance mocking: `mock()` for object instances

**Patterns:**

Static method mocking (from `WkfInstanceServiceImplTest.java`):
```java
try (var mockedStatic = mockStatic(ProcessEngines.class)) {
  ProcessEngine mockProcessEngine = createMockProcessEngine();
  mockedStatic.when(ProcessEngines::getDefaultProcessEngine)
    .thenReturn(mockProcessEngine);

  // Test code here
}
```

Setup mock returns:
```java
when(mockObjectA.getProperty()).thenReturn(expectedValue);
```

**What to Mock:**
- External dependencies: Database repositories, services injected via `@Inject`
- Static API calls: ProcessEngines, system utilities
- External libraries: Camunda BPM engine, configuration loaders

**What NOT to Mock:**
- Data objects: DTOs, model entities being tested
- Core business logic: Service implementations under test
- Public API contracts: Keep as-is to verify real behavior

## Fixtures and Factories

**Test Data:**

From `WkfInstanceServiceImplTest.java`:
```java
User user = userRepository.findByCode("customize");

WkfInstance instance = new WkfInstance();
instance.setInstanceId("test-process-123");

VariableMap variableMap = createVariableMapWithEntityReference(entityReference);
```

Helper creation methods:
```java
private ProcessEngine createMockProcessEngine() {
  // Factory method to create mock instances
}

private void setupMockProcessEngineWithVariables(String id, VariableMap map) {
  // Setup helper method
}
```

**Location:**
- Test data: Inline in test methods or static factory methods within test class
- CSV fixtures: `data/users-input.xml` loaded via `LoaderHelper.importCsv()`
- Fixtures directory: `data/` folder (XML/CSV format)

## Coverage

**Requirements:**
- Tool: JaCoCo (Jacoco, integrated via `jacoco` plugin)
- Configuration: `gradle/build.gradle` - `jacoco` block with version pinning
- Enforcement: Coverage check run automatically, XML reports generated
- Target: No specific percentage enforced in build config (coverage check present but threshold not visible)

**View Coverage:**
```bash
# Generate coverage report
./gradlew test jacocoTestReport

# Report location
build/reports/jacoco/test/html/index.html
```

## Test Types

**Unit Tests:**
- Scope: Individual service/utility classes
- Approach: Mock external dependencies, test single responsibility
- Example: `AppVersionServiceImplTest`, `DeploymentResultTest`
- Execution: Fast, isolated, no database or external calls

**Integration Tests:**
- Scope: Multiple components working together
- Approach: Use `LoaderHelper` to load test data, initialize repositories
- Example: `WkfInstanceServiceImplTest`, `BpmAuthorizationServiceTest`
- Setup: `@BeforeEach` imports CSV test fixtures

**E2E Tests:**
- Framework: Not detected (no Selenium, Cypress, Playwright)
- Status: Not implemented
- Note: React codebase has E2E testing dependencies installed but no test files

## Common Patterns

**Async Testing:**

Not heavily used in unit tests; Camunda engine provides synchronous test support.
For async operations:
```java
// Future-based or CompletableFuture patterns possible
// Not extensively demonstrated in provided test samples
```

**Error Testing:**

From pattern observation (controller error handling):
```java
// Example pattern for testing error scenarios
@Test
void shouldHandleExceptionAndSetError() {
  // Arrange
  try {
    // Code that throws
  } catch (Exception e) {
    ExceptionHelper.error(response, e);
  }
  // Assert - response contains error
}
```

**Mock Process Engine Setup:**
```java
ProcessEngine mockProcessEngine = mock(ProcessEngine.class);
RuntimeService runtimeService = mock(RuntimeService.class);
ProcessInstanceQuery query = mock(ProcessInstanceQuery.class);

when(mockProcessEngine.getRuntimeService()).thenReturn(runtimeService);
when(runtimeService.createProcessInstanceQuery()).thenReturn(query);
when(query.variableValueEquals(...)).thenReturn(query);
```

## Test Configuration

**Build integration:**
- `build.gradle` configuration:
  - `useJUnitPlatform()` for JUnit 5
  - `finalizedBy jacocoTestReport` - coverage always generated
  - `maxHeapSize = '1G'` - heap allocation for tests
  - Test logger theme: mocha (colorized output)

**Before/After hooks:**
- `@BeforeEach`: Per-test setup (data loading, mock initialization)
- `@BeforeAll`: Class-level setup (not shown in samples)
- Test cleanup: Relies on repository/database rollback or mock cleanup

**Dependencies:**
- Required for Java tests:
  - `org.junit.jupiter:junit-jupiter-api` (annotations)
  - `org.junit.jupiter:junit-jupiter-engine` (runtime)
  - `org.mockito:mockito-core` (mocking)

---

*Testing analysis: 2026-03-13*
