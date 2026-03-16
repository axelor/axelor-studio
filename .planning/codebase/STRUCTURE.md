# Codebase Structure

**Analysis Date:** 2026-03-13

## Directory Layout

```
axelor-studio/
├── src/main/
│   ├── java/com/axelor/
│   │   ├── csv/script/              # CSV import scripts
│   │   ├── meta/loader/             # Data loader utilities
│   │   ├── studio/
│   │   │   ├── app/                 # App installation and configuration
│   │   │   ├── bpm/                 # Process engine and workflow
│   │   │   ├── db/repo/             # Entity repositories
│   │   │   ├── dmn/                 # Decision model notation
│   │   │   ├── exception/           # Custom exceptions
│   │   │   ├── helper/              # Utility functions
│   │   │   ├── ls/                  # Scripting language support
│   │   │   ├── module/              # Module configuration
│   │   │   ├── service/             # Core domain services
│   │   │   ├── translation/         # Translation support
│   │   │   ├── utils/               # Utility classes
│   │   │   └── web/                 # REST controllers
│   │   └── web/                     # Core web utilities
│   └── resources/
│       ├── apps/                    # Demo data and app configs
│       ├── data-export/             # Export templates
│       ├── data-import/             # XML import definitions
│       ├── data-init/               # Initial database setup
│       ├── data-wkf-models/         # Workflow model templates
│       ├── domains/                 # Domain definitions (XML metadata)
│       ├── i18n/                    # Translation files
│       ├── templates/               # Email/report templates
│       └── views/                   # Form and view definitions
├── react/                           # Frontend applications
│   ├── studio/                      # Main form/app builder UI
│   ├── bpm/                         # BPMN workflow designer
│   ├── bpm-merge-split/            # Parallel gateway editor
│   ├── mapper/                      # Field mapper UI
│   ├── generic-builder/             # Generic model builder
│   ├── webservices-builder/         # Web service connector UI
│   └── timer-builder/               # Timer event configuration
├── gradle/                          # Gradle build scripts
├── build.gradle                     # Main build configuration
├── gradle.properties                # Build version properties
└── documentation/                   # Antora documentation
```

## Directory Purposes

**Backend Java Structure:**

**app/** - Application Installation and Configuration
- Purpose: App lifecycle (install, uninstall, configure), demo data import
- Contains: AppService (deploy app models), AccessTemplateService, listener hooks
- Key files: `AppController.java`, `AppServiceImpl.java`

**bpm/** - Process Engine and Workflow Execution
- Purpose: Camunda integration, process deployment, execution, migration
- Contains: Service/execution/, service/deployment/, service/migration/, web controllers
- Key files: `BpmDeploymentServiceImpl.java`, `WkfInstanceServiceImpl.java`, `WkfMigrationServiceImpl.java`

**bpm/service/execution/** - Workflow Runtime
- Purpose: Task handling, instance lifecycle, variable management
- Contains: WkfInstanceService, WkfTaskService, WkfActionService
- Key files: `WkfInstanceServiceImpl.java`, `WkfTaskServiceImpl.java`

**bpm/service/deployment/** - Model Deployment
- Purpose: BPMN/DMN parsing, Camunda deployment, metadata mapping
- Contains: BpmDeploymentService, MetaAttrsService, WkfNodeService
- Key files: `BpmDeploymentServiceImpl.java`, `BpmProgressWebSocket.java`

**bpm/service/migration/** - Process Versioning
- Purpose: Version migration, running instance updates
- Contains: WkfMigrationService
- Key files: `WkfMigrationServiceImpl.java`

**bpm/service/authorization/** - Access Control
- Purpose: Role-based permissions, node-level authorization
- Contains: BpmAuthorizationService, BpmPermissionService
- Key files: `BpmAuthorizationServiceImpl.java`

**bpm/service/identity/** - User and Group Management
- Purpose: User/group provisioning from Camunda identity
- Contains: WkfIdentityService
- Key files: `WkfIdentityServiceImpl.java`

**bpm/service/job/** - Asynchronous Job Handling
- Purpose: Job execution lifecycle, retry logic, job data management
- Contains: WkfJobService
- Key files: `WkfJobServiceImpl.java`

**bpm/service/log/** - Audit and History
- Purpose: Instance event logging, audit trail persistence
- Contains: WkfInstanceLogService, WkfMessageService
- Key files: `WkfInstanceLogServiceImpl.java`

**bpm/web/** - REST Endpoints for BPM
- Purpose: HTTP handlers for deployment, execution, migration, dashboard
- Contains: WkfModelController, WkfInstanceController, WkfMigrationController
- Key files: `WkfModelController.java`, `WkfInstanceController.java`

**db/repo/** - Entity Repositories
- Purpose: Database access layer with custom queries
- Contains: Repository implementations for models (WkfModel, WkfProcess, etc.)
- Key files: `BpmWkfModelRepository.java`, `BpmWkfInstanceRepository.java`

**dmn/** - Decision Management
- Purpose: DMN table deployment and execution
- Contains: DmnService
- Key files: `WkfDmnModelController.java`

**ls/** - Scripting Language Support
- Purpose: Custom DSL scripting, script compilation, evaluation
- Contains: Script evaluators, built-in functions
- Key files: Script evaluator implementations in `evaluator/`

**service/** - Core Domain Services
- Purpose: Cross-cutting business logic (studio actions, filters, web services)
- Contains: Transformation, constructor, mapper services
- Key files: `MetaJsonModelService.java`, `StudioActionService.java`

**Resource Files:**

**domains/** - XML Entity Definitions
- Purpose: Database schema definitions for domain models
- Contains: WkfModel.xml, WkfProcess.xml, WkfInstance.xml, etc.
- Pattern: Each file defines entity fields, relationships, validation

**views/** - UI Form/Grid Definitions
- Purpose: Form layouts, grid columns, action buttons
- Contains: WkfModel-form.xml, WkfInstance-grid.xml, etc.
- Pattern: XML forms with Axelor-specific tags for buttons, fields, panels

**data-import/** - Model Import Definitions
- Purpose: CSV/XML import job configuration
- Contains: Import mappings for seed data (wkf-model.xml, json-model.xml, etc.)
- Pattern: Defines how to map CSV columns to database fields

**data-wkf-models/** - Sample Workflow Templates
- Purpose: Seed workflow process definitions
- Contains: bpm.xml with sample processes
- Pattern: BPMN XML embedded in data import

**apps/demo-data/** - Application Demonstration Data
- Purpose: Sample applications, workflows, menus for first-time users
- Contains: Language-specific folders (en/, fr/) with demo BPM models
- Pattern: app-loader.xml references studio-app.xml, studio-menu.xml

**Frontend React Structure:**

**react/studio/src/** - Main Studio Application
- Purpose: Low-code form/app/action builder UI
- Contains: Components (Form, Grid, Field), Panels (Properties, Attributes), Store (state management)
- Key files: `App.jsx` (root), `index.jsx` (entry), `store/context.jsx` (Redux-like state)

**react/studio/src/components/** - UI Component Library
- Purpose: Reusable form elements and containers
- Contains: Field.jsx, Form.jsx, Grid.jsx, SelectComponent.jsx, IconButton.jsx
- Pattern: Functional components with hooks, props-based configuration

**react/studio/src/Panels/** - Layout Sections
- Purpose: Main editor panels (canvas, properties, attributes)
- Contains: MainPanel (canvas), PropertiesPanel (right sidebar), AttributesPanel (left sidebar)
- Pattern: Panel state managed by store/context.jsx

**react/studio/src/Properties/** - Property Editors
- Purpose: Dynamic property panels for selected elements
- Contains: Property form builders for fields, models, actions
- Pattern: JSON schema-driven property rendering

**react/studio/src/Toolbar/** - Editor Actions
- Purpose: Save, deploy, undo/redo, settings
- Contains: ToolbarContainer, API calls for persistence
- Pattern: Dispatches actions to store (undo/redo stack in store)

**react/studio/src/helpers/** - Utility Functions
- Purpose: API calls, data transformations, model helpers
- Contains: `helpers.js` with fetch functions
- Pattern: AxelorService wrapper for REST endpoints

**react/studio/src/services/** - API Layer
- Purpose: Fetch and persist data from backend
- Contains: `api.js` with AxelorService instances
- Pattern: Each service bound to a backend controller

**react/bpm/src/** - BPM Designer
- Purpose: Drag-and-drop BPMN process builder
- Contains: bpmn-js integration, shape palette, context menu
- Pattern: Canvas-based visual editor with Camunda modeler

**react/bpm-merge-split/src/** - Merge/Split Gateway Editor
- Purpose: Specialized UI for parallel gateways
- Contains: Gateway configuration, data grid for merge/split paths
- Pattern: Modal dialog for complex gateway setup

## Key File Locations

**Entry Points:**

- `src/main/java/com/axelor/studio/app/web/AppController.java`: App installation endpoint
- `src/main/java/com/axelor/studio/bpm/web/WkfModelController.java`: Model deployment endpoint
- `src/main/java/com/axelor/studio/bpm/web/WkfInstanceController.java`: Instance operations endpoint
- `react/studio/src/index.jsx`: React app root entry point
- `react/bpm/public/index.html`: BPM designer entry HTML

**Configuration:**

- `build.gradle`: Build pipeline, dependencies (Camunda, Groovy, Jackson)
- `gradle.properties`: Version management, Camunda/Java versions
- `src/main/resources/domains/*.xml`: Database schema definitions
- `react/studio/package.json`: NPM dependencies, build scripts

**Core Logic:**

- `src/main/java/com/axelor/studio/bpm/service/deployment/BpmDeploymentServiceImpl.java`: BPMN -> Camunda transformation
- `src/main/java/com/axelor/studio/bpm/service/execution/WkfInstanceServiceImpl.java`: Process instance lifecycle
- `src/main/java/com/axelor/studio/bpm/service/migration/WkfMigrationServiceImpl.java`: Version migration logic
- `src/main/java/com/axelor/studio/db/repo/BpmWkfModelRepository.java`: WkfModel custom queries

**Testing:**

- `src/test/java/`: Unit tests (excluded in build.gradle: BAML tests)
- `src/test/resources/`: Test data and fixtures (studio-data.xml)

## Naming Conventions

**Files:**

- **Java Services:** `<Feature>Service.java` (interface) + `<Feature>ServiceImpl.java` (implementation)
  - Example: `WkfInstanceService.java`, `WkfInstanceServiceImpl.java`
- **Java Controllers:** `<Domain>Controller.java`
  - Example: `WkfModelController.java`, `AppBpmController.java`
- **Java Repositories:** `<Model>Repository.java` (custom) or generated by framework
  - Example: `BpmWkfModelRepository.java`
- **XML Resources:** `<Model>-<Type>.xml`
  - Example: `WkfModel-form.xml`, `WkfProcess-grid.xml`
- **React Components:** `<ComponentName>.jsx` (functional components)
  - Example: `Field.jsx`, `MainPanel.jsx`, `ToolbarContainer.jsx`

**Directories:**

- **Java packages:** Reverse domain naming + feature
  - Example: `com.axelor.studio.bpm.service.execution`
- **React folders:** Lowercase, plural for collections
  - Example: `components/`, `services/`, `helpers/`, `Panels/`

## Where to Add New Code

**New Backend Service Feature:**
- Primary code: `src/main/java/com/axelor/studio/bpm/service/<feature>/`
- Interface: `<Feature>Service.java` (define contract)
- Implementation: `<Feature>ServiceImpl.java` (implement logic)
- Injection: Use `@Inject` constructor in ServiceImpl, bind in Guice if needed
- Database: Add domain XML in `src/main/resources/domains/<Model>.xml`
- Repository: `src/main/java/com/axelor/studio/db/repo/<Model>Repository.java` for custom queries
- Controller: `src/main/java/com/axelor/studio/bpm/web/<Feature>Controller.java` for REST endpoints

**New BPM Listener/Event Handler:**
- Location: `src/main/java/com/axelor/studio/bpm/listener/`
- Pattern: Implement Camunda ExecutionListener or TaskListener interface
- Registration: Add to ProcessEngineService bean setup or via process XML extension elements

**New React Component:**
- Location: `react/studio/src/components/<ComponentName>/` (directory) or `react/studio/src/components/<ComponentName>.jsx` (file)
- Pattern: Functional component with hooks, export as default
- Props documentation: JSDoc comments
- Styling: CSS modules or index.css with BEM naming

**New React Feature/Page:**
- Location: `react/studio/src/Panels/<FeatureName>/` (if visual panel) or `react/studio/src/<FeatureName>/` (if standalone)
- State: Use useStore() hook to connect to global context store
- API calls: Use services from `react/studio/src/services/api.js`

**New Workflow Model Template:**
- Location: `src/main/resources/data-wkf-models/input/`
- Format: BPMN XML file with sample process structure
- Seed: Referenced in data-import configuration

**Utilities and Helpers:**
- Shared backend helpers: `src/main/java/com/axelor/studio/helper/`
- Shared React helpers: `react/studio/src/helpers/`

## Special Directories

**build/** - Compiled Output
- Purpose: Build artifacts (JAR, classes)
- Generated: Yes (by Gradle build)
- Committed: No

**out/production/** - IDE Build Output
- Purpose: IntelliJ IDEA build output
- Generated: Yes (by IDE)
- Committed: No

**gradle/wrapper/** - Gradle Distribution
- Purpose: Gradle version pinning
- Generated: No (committed, same across all checkouts)
- Committed: Yes (stable Gradle version)

**documentation/** - AsciiDoc Documentation
- Purpose: User and developer guides (published to web)
- Generated: No (manually written)
- Committed: Yes (source of truth)

**changelogs/unreleased/** - Change Tracking
- Purpose: Store unreleased changelog entries
- Generated: No (manually created per MR)
- Committed: Yes (aggregated into CHANGELOG.md on release)

**.gradle/nodejs/** - Node Package Manager
- Purpose: pnpm and Node runtime
- Generated: Yes (by Gradle node plugin)
- Committed: No

**react/*/build/** - React Build Artifacts
- Purpose: Minified frontend bundles
- Generated: Yes (by npm run build)
- Committed: No (served as static resources by backend)

---

*Structure analysis: 2026-03-13*
