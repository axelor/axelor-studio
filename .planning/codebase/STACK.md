# Technology Stack

**Analysis Date:** 2026-03-13

## Languages

**Primary:**
- Java 21 - Backend application and BPM engine integration
- JavaScript/JSX (React 18.2.0) - Frontend UI components

**Secondary:**
- Groovy 4.0.28 - BPM script engine for process execution and business logic
- XML - Data models, workflow definitions (BPMN), views, and configuration
- YAML - Configuration (SnakeYAML 2.5)
- SQL - Database queries and filters (via Hibernate and JPQL)

## Runtime

**Environment:**
- JVM with Java 21 (specified in `gradle.properties` javaVersion = 21)
- Node.js 22.22.0 (via gradle-node-plugin)
- pnpm 10.28.2 (package manager for Node.js)

**Package Manager:**
- Gradle 8.x (Gradle wrapper) - Java build system
- pnpm 10.28.2 - Node.js package manager
- Lockfile: `pnpm-lock.yaml` (present)

## Frameworks

**Core:**
- Axelor Platform (AOP 8.0.5) - Enterprise application framework
- Axelor Studio Module 4.0.1 - Visual app builder framework
- Camunda BPM Engine 7.23.0 - Process orchestration and workflow execution
- Camunda Spin 7.23.0 - JSON data format handling for BPM

**Frontend:**
- React 18.2.0 - UI library
- Vite 4.4.9 / 4.5.2 - Build tool and dev server
- BPMN.js 18.2.0 - BPMN diagram editor and viewer
- DMN.js 17.1.0 - Decision Model and Notation editor
- Monaco Editor 4.6.0 - Code editor component

**Testing:**
- Mockito 5.20.0 - Java mocking framework
- Jest DOM testing libraries (@testing-library/*)
- JUnit Platform (via useJUnitPlatform in build.gradle)

**Build/Dev:**
- Gradle plugins: com.axelor.app, com.adarshr.test-logger, jacoco
- Spotless 8.0.0 - Code formatting and linting
- License Gradle Plugin - License header management
- Jacoco 0.8.14 - Code coverage

## Key Dependencies

**Critical:**
- `org.camunda.bpm:camunda-engine:7.23.0` - BPM process execution engine
- `com.axelor.addons:axelor-message:4.0.3` - Messaging service integration
- `com.axelor.addons:axelor-utils:4.0.2` - Utility functions
- `jakarta.websocket:jakarta.websocket-api:2.2.0` - WebSocket communication

**Infrastructure:**
- `org.apache.commons:commons-exec:1.5.0` - External process execution
- `org.apache.commons:commons-text:1.14.0` - String manipulation utilities
- `org.apache.commons:commons-lang3:3.19.0` - Java language utilities
- `com.fasterxml.jackson.dataformat:jackson-dataformat-xml:2.20.1` - XML serialization
- `org.json:json:20250517` - JSON processing
- `org.yaml:snakeyaml:2.5` - YAML parsing
- `ch.qos.logback:logback-core:1.5.26` - Logging framework
- `ch.qos.logback:logback-classic:1.5.26` - Logging implementation

**Frontend Libraries:**
- `@axelor/ui:^0.0.32` / `^0.2.13` - Axelor UI component library
- `bpmn-js-properties-panel:5.26.0` - BPMN properties editor
- `dmn-js-properties-panel:3.7.0` - DMN properties editor
- `react-dnd:^16.0.1` - Drag-and-drop functionality
- `styled-components:^5.2.0` - CSS-in-JS styling
- `immer:^10.0.2` / `^8.0.1` - Immutable state management
- `lodash:^4.17.15` - Utility functions
- `xml2js:^0.6.2` / `^0.4.23` - XML-to-JSON conversion
- `dayjs:^1.11.10` - Date manipulation

**Development:**
- `org.projectlombok:lombok:1.18.42` - Java annotation processor for boilerplate
- `org.reflections:reflections:0.10.2` - Reflection utilities
- `com.adarshr.gradle.test-logger:4.0.0` - Enhanced test logging

**Optional/CompileOnly:**
- `org.redisson:redisson:3.52.0` - Redis client (provided by runtime)

## Configuration

**Environment:**
- Configuration via Axelor AppSettings framework
- Key settings configured in `AppSettingsStudioService` interface:
  - `appsToInstall()` - List of modules to load
  - `importDemoData()` - Demo data import flag
  - `baseUrl()` - Application base URL
  - `processEngineMaxIdleConnections()` - Connection pool settings
  - `processEngineMaxActiveConnections()` - Active connection limit
  - `isEnabledBpmErrorTracking()` - Error tracking flag
  - `getCamundaEngineScriptLogLevel()` - Script log level
  - `getCamundaHistoryTimeToLive()` - Process history retention
  - `serializationDepth()` - Data serialization depth limit
  - `getMaximumRecursion()` - Script recursion limit

**Build:**
- `build.gradle` - Primary module build configuration
- `gradle.properties` - Version and dependency management
- `gradle/react.gradle` - React build pipeline integration
- `gradle/style.gradle` - Code formatting rules (Spotless)
- `settings.gradle` - Repository and plugin configuration

## Platform Requirements

**Development:**
- Java 21 JDK (OpenJDK compatible)
- Node.js 22.22.0
- 4GB+ heap memory for Gradle builds (set in gradle.properties: `-Xmx4048m`)
- Git for version control

**Production:**
- Deployment target: Axelor Platform (AOP) based application server
- Multi-tenant support via TenantModule
- Database with Camunda schema (auto-created via `DB_SCHEMA_UPDATE_TRUE`)
- WebSocket support for real-time progress notifications
- Jakarta EE 10+ servlet container

## Repository Configuration

**Maven Repositories:**
- Maven Central - Standard Java dependencies
- https://repository.axelor.com/nexus/repository/maven-public/ - Axelor platform artifacts
- Node.js distribution via IVY (from nodejs.org/dist)

---

*Stack analysis: 2026-03-13*
