# Architecture

**Analysis Date:** 2026-03-13

## Pattern Overview

**Overall:** Layered monolithic architecture with Camunda BPM engine integration and React frontend separation.

**Key Characteristics:**
- **Backend:** Java-based service layer with dependency injection, entity repositories, and web controllers
- **Frontend:** React-based module system with form builder, component registry, and state management
- **Process Engine:** Camunda BPM 7.23 embedded for workflow orchestration
- **Database:** JPA entities with custom repositories for domain models (WkfModel, WkfProcess, WkfInstance)
- **Inter-process Communication:** REST controllers, WebSockets, and Camunda listener events

## Layers

**Presentation (Web):**
- Purpose: HTTP endpoint handlers for REST API calls from frontend and mobile clients
- Location: `src/main/java/com/axelor/studio/*/web/*Controller.java`
- Contains: Request/response handlers, view navigation logic, form actions
- Depends on: Service layer, database models
- Used by: React frontend, external API clients

**Application Service:**
- Purpose: Core business logic and orchestration across BPM processes
- Location: `src/main/java/com/axelor/studio/*/service/*Service*.java`
- Contains: Process deployment, workflow execution, migration logic, permission enforcement
- Depends on: Database layer, Camunda engine, identity services
- Used by: Web controllers, BPM listeners, job runners

**BPM Execution Engine:**
- Purpose: Workflow instance management and process execution
- Location: `src/main/java/com/axelor/studio/bpm/service/execution/`
- Contains: Task handling, variable management, process instance lifecycle
- Depends on: Camunda ProcessEngine, WkfTaskConfig, WkfInstance models
- Used by: Service layer, Camunda event listeners

**BPM Deployment:**
- Purpose: BPMN/DMN model transformation and Camunda deployment
- Location: `src/main/java/com/axelor/studio/bpm/service/deployment/`
- Contains: BpmDeploymentService (coordinates deployment), MetaAttrsService (attribute mapping), WkfNodeService (node config)
- Depends on: WkfModel, Camunda DeploymentBuilder
- Used by: AppService, WkfModelController

**BPM Migration:**
- Purpose: Version migration and running instance updates
- Location: `src/main/java/com/axelor/studio/bpm/service/migration/`
- Contains: Process instance migration mapping, task migration
- Depends on: WkfMigration model, Camunda migration API
- Used by: WkfMigrationController, deployment service

**Database Layer:**
- Purpose: Data persistence and repository pattern
- Location: `src/main/java/com/axelor/studio/db/repo/*.java`
- Contains: Custom repository implementations (WkfModelRepository, WkfProcessRepository, etc.)
- Depends on: JPA entities, query builders
- Used by: All service layers

**Frontend (React):**
- Purpose: Interactive UI for studio form/app/workflow builder
- Location: `react/studio/src/`, `react/bpm/src/`, `react/bpm-merge-split/src/`
- Contains: Component registry, form builder with drag-and-drop, property panel
- Depends on: AxelorService (API client), Axelor UI library
- Used by: Browser clients

## Data Flow

**Workflow Deployment Flow:**

1. User designs workflow in React BPM editor (`react/bpm/src/`)
2. Form submission calls AppBpmController or WkfModelController (`src/main/java/com/axelor/studio/bpm/web/`)
3. BpmDeploymentServiceImpl.deploy() transforms BPMN to Camunda format
4. Camunda DeploymentBuilder creates deployment with MetaAttrs extension elements
5. ProcessEngineService registers deployment in Camunda engine
6. WkfProcess records created with deployment IDs and metadata

**Workflow Execution Flow:**

1. User triggers process instance creation via REST endpoint
2. WkfInstanceServiceImpl.createWkfInstance() calls Camunda RuntimeService to start process
3. Process engine fires task/activity events
4. Listeners (WkfTaskConfigListener, etc.) invoke task handlers
5. WkfTaskServiceImpl updates task state, runs scripts, sends emails
6. Task completion/skip updates WkfInstance and attached business model

**Migration Flow:**

1. User deploys new WkfModel version
2. WkfMigrationService.migrateRunningInstances() executed
3. Camunda migration API maps old activities to new activities per migration instructions
4. Process instances transitioned to new process definition
5. Running tasks adjusted per WkfMigration node mappings
6. WkfProcessUpdate records track migration history

**State Management:**
- Process state: Camunda engine maintains via HistoryService
- Instance state: WkfInstance/WkfInstanceVariable (read-only mirror of Camunda state)
- Model metadata: WkfModel, WkfProcess, WkfTaskConfig (persistent business layer)
- Permission state: BpmAuthorizationService caches role-to-node mappings

## Key Abstractions

**WkfModel:**
- Purpose: Top-level workflow template, wraps one or more processes
- Examples: `src/main/java/com/axelor/studio/db/repo/BpmWkfModelRepository.java`
- Pattern: Service/Repository pattern with custom queries

**WkfProcess:**
- Purpose: Versioned process definition in Camunda (1:1 mapping to Camunda ProcessDefinition at runtime)
- Examples: WkfProcess#deploymentId stores Camunda deployment ID
- Pattern: Tracks process lineage (targetProcess, sourceProcess) for migration tracking

**WkfInstance:**
- Purpose: Runtime instance record, mirrors active Camunda process instance
- Examples: WkfInstance#instanceId = Camunda processInstanceId, WkfInstance#wkfProcess = version reference
- Pattern: Read-only business layer mirror; state derives from Camunda engine

**WkfTaskConfig:**
- Purpose: Studio configuration for a single task/activity node (buttons, validators, scripts)
- Examples: `src/main/java/com/axelor/studio/bpm/service/deployment/WkfNodeService.java` populates these
- Pattern: Task-to-config mapping stored as extension elements in BPMN (via MetaAttrs)

**Camunda ProcessEngine:**
- Purpose: Core BPM runtime with embedded TaskService, RuntimeService, HistoryService
- Examples: Single shared instance per JVM tenant (ProcessEngineService singleton)
- Pattern: Facade pattern - BpmDeploymentServiceImpl, WkfInstanceServiceImpl delegate to engine APIs

**WkfMigration:**
- Purpose: Configuration for mapping old process activities to new version
- Examples: Store node key mappings (oldNode -> newNode) and execution paths
- Pattern: Strategy pattern - different migration strategies per activity type

## Entry Points

**App Deployment:**
- Location: `src/main/java/com/axelor/studio/app/web/AppController.java`
- Triggers: User clicks "Install App" on App record; Scheduled app loader on startup
- Responsibilities: AppService.installApp() calls deployment pipeline for all WkfModels

**BPM Deployment:**
- Location: `src/main/java/com/axelor/studio/bpm/web/WkfModelController.java`
- Triggers: User publishes workflow in BPM editor; REST deployModel() action
- Responsibilities: BpmDeploymentServiceImpl.deploy() (BPMN parsing, Camunda registration, metadata sync)

**Process Execution:**
- Location: REST trigger (external service, user form action) -> WkfInstanceServiceImpl.createWkfInstance()
- Triggers: User submits form with workflow trigger action
- Responsibilities: Camunda RuntimeService.startProcessInstanceByKey() with context variables

**WebSocket Progress:**
- Location: `src/main/java/com/axelor/studio/bpm/service/deployment/BpmProgressWebSocket.java`
- Triggers: Deployment operation with subscribers
- Responsibilities: Stream deployment progress events to React frontend in real-time

**Job Execution:**
- Location: `src/main/java/com/axelor/studio/bpm/service/job/`
- Triggers: Camunda timer jobs, async job executor
- Responsibilities: Execute async handlers, send messages, handle retries

## Error Handling

**Strategy:** Exception wrapping and propagation with context preservation

**Patterns:**
- **Deployment Errors:** Catch BPMN parsing exceptions, wrap in StudioException with process name
- **Execution Errors:** Try-catch in task handlers, log to WkfInstanceLog table, halt task
- **Migration Errors:** Validate node mappings pre-migration, rollback to previous version on failure
- **Permission Errors:** BpmAuthorizationService throws AccessDeniedException before execution
- **Recovery:** Failed jobs retried via Camunda async job retry mechanism; manual unblock via WkfInstanceController.unblockInstance()

## Cross-Cutting Concerns

**Logging:**
- Framework: SLF4J with Logback
- Audit trail: WkfInstanceLog table stores node transitions, task state changes, errors
- Business events: WkfMessageServiceImpl writes workflow messages to MessageLog

**Validation:**
- BPMN XML schema validation during parse (Camunda BpmnParser)
- Task variable validation in WkfTaskConfigListener
- Script compilation check (Groovy script compilation on first use)
- Permission checks in BpmAuthorizationService.checkAccess()

**Authentication:**
- Framework: Axelor built-in user context (CurrentUser)
- Task assignment: Task assigned to user/group based on WkfTaskConfig assignment rule (evaluated with process variables)
- Authorization: Role-based access control per WkfNode (BpmAuthorizationService caches AppBpm roles)

**Tenancy:**
- TenantResolver integrated in ProcessEngineService (separate engines per tenant)
- Camunda JobExecutor respects tenant context when executing async jobs
- Repository queries filtered by active tenant

---

*Architecture analysis: 2026-03-13*
