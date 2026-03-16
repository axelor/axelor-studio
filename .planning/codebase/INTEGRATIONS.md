# External Integrations

**Analysis Date:** 2026-03-13

## APIs & External Services

**BPM & Process Orchestration:**
- Camunda BPM - Process execution engine
  - SDK/Client: `org.camunda.bpm:camunda-engine:7.23.0`
  - Engine initialization: `src/main/java/com/axelor/studio/bpm/service/init/ProcessEngineServiceImpl.java`
  - Authentication: Via Axelor user identity service

**BPMN & Workflow Modeling:**
- BPMN.js (frontend) - Diagram editing and visualization
  - Package: `bpmn-js:18.2.0`
  - Location: `react/bpm/src/`
  - Camunda extensions: `camunda-bpmn-moddle:7.0.1`

**DMN (Decision Model & Notation):**
- DMN.js (frontend) - Decision table editor
  - Package: `dmn-js:17.1.0`
  - Backend service: `src/main/java/com/axelor/studio/dmn/service/DmnServiceImpl.java`
  - Camunda extensions: `camunda-dmn-moddle:1.3.0`

**External Web Services:**
- WebSocket endpoint for real-time progress tracking
  - Endpoint: `/bpm/deploy/progress`
  - Location: `src/main/java/com/axelor/studio/bpm/service/deployment/BpmProgressWebSocket.java`
  - Framework: Jakarta WebSocket API 2.2.0
  - Auth: WebSocket Security via `@WebSocketSecurity`

## Data Storage

**Databases:**
- Relational Database (application-managed via Axelor Platform)
  - Connection: Configured via Axelor AppSettings (DATA_UPLOAD_DIR)
  - ORM: Hibernate (versions evident from session imports)
  - Client: Axelor Meta framework
  - Camunda engine schemas: Auto-created via ProcessEngineConfiguration.DB_SCHEMA_UPDATE_TRUE

**File Storage:**
- Local filesystem only
  - Location configured via `AppSettings.get().get(AvailableAppSettings.DATA_UPLOAD_DIR)`
  - Used for: App installation data, workflow models, deployment artifacts
  - Service: `src/main/java/com/axelor/studio/app/service/AppService.java`

**Caching:**
- In-memory process caching (Camunda)
  - WkfCache implementation: `src/main/java/com/axelor/studio/bpm/context/WkfCache.java`
  - Redisson optional: `org.redisson:redisson:3.52.0` (compileOnly - runtime provided by AOP)
  - Cache types: WkfModel cache, Button cache

## Authentication & Identity

**Auth Provider:**
- Custom Axelor identity service
  - Implementation: Axelor Platform user management
  - Token handler: `src/main/java/com/axelor/web/WsTokenHandler.java`
  - WebSocket auth: `WsAuthenticatorService` integration
  - OAuth/SAML: Provided by Axelor Platform layer (not visible in Studio module)

**Multi-tenancy:**
- Axelor TenantModule support
  - Config: `com.axelor.db.tenants.TenantConfigProvider`
  - Connection pooling per tenant: `com.axelor.db.tenants.TenantConnectionProvider`

## Monitoring & Observability

**Error Tracking:**
- Custom BPM error tracking
  - Service: `src/main/java/com/axelor/studio/bpm/service/message/BpmErrorMessageService.java`
  - Configuration: `isEnabledBpmErrorTracking()` in AppSettingsStudioService
  - External integration: Not detected (internal implementation)

**Logs:**
- Logback 1.5.26
  - Logger initialization: `src/main/java/com/axelor/studio/bpm/service/log/WkfLoggerInitService.java`
  - Log service: `src/main/java/com/axelor/studio/bpm/service/log/WkfLogService.java`
  - Camunda script logging: Configurable log levels via `getCamundaEngineScriptLogLevel()`
  - Log location: Standard output (no external logging service detected)

## CI/CD & Deployment

**Hosting:**
- Axelor Platform (AOP) - Deployed as module/addon
- Multi-tenant deployment support
- Server startup listeners: `src/main/java/com/axelor/studio/bpm/listener/ServerStartListener.java`

**CI Pipeline:**
- Gradle-based build automation
- Test runner: JUnit Platform
- Code coverage: Jacoco (XML reports generated)
- Code formatting: Spotless (Google Java Format)
- License checking: License Gradle Plugin

**Deployment Process:**
- Maven publish: `maven-releases` or `maven-snapshots` repo based on version
  - Repository: `https://repository.axelor.com/nexus/repository/`
  - Credentials: Via `addonsMavenUsername` / `addonsMavenPassword` project properties
  - Snapshot versions: Auto-appended with `-SNAPSHOT` suffix

## Environment Configuration

**Required env vars:**
- `DATA_UPLOAD_DIR` - File upload directory path
- `JAVA_HOME` - Java 21 installation path
- Optional: Tenant configuration (if multi-tenant mode enabled)

**Secrets location:**
- Not explicitly defined in module
- Managed by Axelor Platform layer (via `AppSettings` framework)
- Credentials for Maven publishing: Gradle project properties (not exposed in source)

## Webhooks & Callbacks

**Incoming:**
- BPM deployment progress WebSocket: `/bpm/deploy/progress`
  - Messages handled via `@OnMessage`, `@OnOpen`, `@OnClose`
  - Real-time percentage updates sent to connected clients

**Outgoing:**
- Email notifications via BPM workflow tasks
  - Service: `src/main/java/com/axelor/studio/bpm/service/execution/WkfEmailServiceImpl.java`
  - Template: Email content for task notifications with URL callbacks
  - Uses: Axelor message service integration

## Data Exchange Formats

**BPMN/XML:**
- Format: BPMN 2.0 with Camunda extensions
- Parsing: Camunda moddle libraries
- Import/Export: `src/main/java/com/axelor/studio/bpm/service/WkfBpmImportServiceImpl.java`
- XML utilities: `src/main/java/com/axelor/studio/utils/XmlUtils.java`

**JSON:**
- Format: Camunda Spin JSON format
  - Package: `org.camunda.spin:camunda-spin-dataformat-json-jackson:7.23.0`
- Meta JSON models: `src/main/java/com/axelor/studio/db/repo/MetaJsonModelRepo.java`

**CSV:**
- Import/Export for data loading
- Security: `src/main/java/com/axelor/csv/script/ImportPermission.java`

## Third-party Integrations

**Axelor Addons:**
- `axelor-message:4.0.3` - Email and messaging capabilities
- `axelor-utils:4.0.2` - Common utilities
- `axelor-connect` (optional) - External API integration support
  - Detection: `src/main/java/com/axelor/studio/service/connect/ConnectServiceImpl.java`
  - Checks for both Connect and AxelorStudioPro modules

**Code Editors:**
- Monaco Editor (VS Code compatible)
  - Package: `@monaco-editor/react:4.6.0`
  - Uses: Script editing, XML editing, code preview

---

*Integration audit: 2026-03-13*
