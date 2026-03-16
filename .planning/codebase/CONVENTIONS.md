# Coding Conventions

**Analysis Date:** 2026-03-13

## Naming Patterns

**Files:**
- React components: PascalCase with `.jsx` extension (e.g., `FieldComponent.jsx`, `MainPanel.jsx`, `Widget.jsx`)
- Helper files: camelCase with `.js` extension (e.g., `helpers.js`, `api.js`, `validation.js`)
- Context/Provider files: camelCase.jsx (e.g., `context.jsx`)
- Style/utility files: camelCase.js (e.g., `xpathGenerator.js`, `validation.js`)
- Java classes: PascalCase (e.g., `AppBpmController.java`, `WkfModelController.java`)
- Java test classes: Append `Test` suffix (e.g., `WkfInstanceServiceImplTest.java`)

**Functions:**
- React component functions: PascalCase
- Helper functions: camelCase
- Java methods: camelCase (standard Java convention)
- Event handlers: prefix with `on` followed by action name (e.g., `onWidgetChange`, `onRemove`, `onSelect`, `onDrop`)
- Callback functions in hooks: match standard naming with `useCallback`

**Variables:**
- Prefer camelCase throughout
- Constants: UPPER_SNAKE_CASE (e.g., `TYPE`, `PANEL_TYPE`, `MODEL_TYPE`, `IDS`, `HISTORY`)
- React state: camelCase (e.g., `editWidget`, `widgets`, `items`, `modelType`)
- Configuration objects: camelCase
- DOM refs: suffix with `Ref` (e.g., `gridRef`, `mainContainerRef`, `toolbarRef`)

**Types/Models:**
- TypeScript-style type references: PascalCase (e.g., `WkfModel`, `AppBpm`, `CustomVariable`)
- Java data objects: PascalCase (standard Java convention)

## Code Style

**Formatting:**
- Tool: Prettier (configured in `.prettierrc` files)
- Tab width: 2 spaces
- Trailing commas: es5 (only where valid in ES5)
- Semicolons: disabled (`"semi": false`)
- Quotes: double quotes (`"singleQuote": false`)
- Applied across JavaScript, TypeScript, JSON, CSS, SCSS

**Linting:**
- Tool: ESLint (configured in `.eslintrc.cjs` for React packages)
- React rules: ESLint recommended, React recommended, React Hooks recommended
- Custom rules:
  - `no-unused-vars`: off (disabled - unused variables allowed)
  - `react/jsx-no-target-blank`: off
  - `react/prop-types`: off (no prop-types requirement)
  - `react-refresh/only-export-components`: warn (components should export only components)
- Java: Google Java Format (via Spotless plugin)
- Style checking: Spotless for Java, Markdown, XML, JavaScript

**Code formatting command:**
```bash
# Java/Markdown/XML/JavaScript unified formatting
./gradlew formatCode
# Or just JavaScript (pnpm)
pnpm format
```

## Import Organization

**Order (React/JavaScript):**
1. Third-party library imports (React, external packages)
2. Axelor/UI library imports (e.g., `@axelor/ui`)
3. Local utility imports (helpers, services, store)
4. Constant imports
5. CSS/SCSS imports (at end)

**Example from `src/App.jsx`:**
```javascript
import React from "react"
import { Box, ThemeProvider } from "@axelor/ui"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import MainPanel from "./Panels/MainPanel"
import Toolbar from "./Toolbar/ToolbarContainer"
import StoreProvider, { useStore } from "./store/context"
import { getParams, translate } from "./utils"
import { MODEL_TYPE, relationalFields, ENTITY_TYPE } from "./constants"
```

**Path Aliases:**
- No path aliases detected; relative imports used throughout
- Local imports reference nearest parent paths (e.g., `./components`, `./store`, `../utils`)

**Java imports:**
- Standard Java convention: organized by package hierarchy
- Always import specific classes, not wildcards
- Static imports: grouped separately (seen in test files: `import static org.junit.jupiter.api.Assertions.*;`)

## Error Handling

**React/JavaScript Patterns:**

Error handling is primarily promise-based:
```javascript
// From helpers.js - API call error handling
.catch((err) => {
  throw err
})
```

Basic try-catch in utils.js:
```javascript
try {
  // processing logic
} catch {
  // error silently handled or swallowed
}
```

Promise rejection handling in services:
```javascript
.catch((err) => {})  // Silent error catching (from Service.js)
```

**Java Patterns:**

Structured exception handling in controllers (from `AppBpmController.java`):
```java
try {
  AppBpm app = request.getContext().asType(AppBpm.class);
  // ... operation ...
  response.setValues(app);
} catch (Exception e) {
  ExceptionHelper.error(response, e);
}
```

Test utilities (from test files):
- Use `@BeforeEach` for setup, `@Test` for test methods
- Static mock methods: `mockStatic()`, `when()`, assertions via JUnit Jupiter
- Error handling tests: Verify exceptions are caught and handled appropriately

## Logging

**Framework:**
- Console logging (implicit use, no logger library detected in React)
- Java: Logback (via `logback-core` and `logback-classic` dependencies)

**Patterns:**
- React: Ad-hoc debugging via `console.log()` or console methods (limited evidence in source)
- Java: Injected logger instances (pattern seen in `BpmLoggingHelper.java`)
- Specific utilities: `BpmLoggingHelper` for standardized BPM logging

## Comments

**When to Comment:**
- Business logic explanations: When decision/algorithm is non-obvious
- Redmine/issue links: When fixing known issues (seen: `// https://redmine.axelor.com/issues/63205#note-6`)
- TODO/FIXME markers: For deferred work or known issues

**Observed TODOs:**
- `//TODO : colSpan value is not used anymore (i think) , try to remove it completely.` - in `context.jsx`
- `//TODO: for attrs widgets , canRemove is undefined. It should have beeen true.` - in `Grid.jsx`, `Widget.jsx`
- `// TODO: remove later.` - temporary changes marked for cleanup
- `// TODO: Why are we updating items twice?` - performance investigation needed

**JSDoc/TSDoc:**
- Not heavily used in React codebase
- Java: Some documentation on public methods/classes (standard Javadoc pattern)

## Function Design

**Size:**
- Large multi-operation functions common (e.g., `onWidgetChange` in `context.jsx` is 140+ lines)
- Complex state update functions broken into nested callback patterns when called from multiple contexts
- Prefer refactoring very large functions, but not strictly enforced

**Parameters:**
- Destructured parameter patterns common:
  ```javascript
  // From context.jsx
  onWidgetChange = React.useCallback(
    ({ id, props, reset = false, skipGenerateHistory = false, changedPropertyName }, draft) => {
      // ...
    }
  )
  ```
- Pass draft objects as optional parameters to avoid nested setState calls
- Use object parameters for multiple optional values

**Return Values:**
- Hooks return objects with multiple values: `{ state, update, onDrop, onRemove, ... }`
- Functions often return undefined implicitly (side-effects focused)
- Utility functions return computed values or transformed data

## Module Design

**Exports:**
- Named exports for utilities and helper functions
- Default export for React components
- Barrel files: `index.jsx` used for re-exporting (see `components/index.jsx`)

**Barrel Files:**
```javascript
// src/components/index.jsx
import Field from "./Field"
import Panel from "./Panel"
import TabPanel from "./TabPanel"
import Widget from "./Widget"
import Form from "./Form"

export { Field, TabPanel, Panel, Widget, Form }
```

**Module Organization:**
- Clear separation: `components/`, `store/`, `Toolbar/`, `Properties/`, `Theme/`, `helpers/`, `services/`
- Utility modules grouped by domain (`validation.js`, `xpathGenerator.js`, `computeXML.js`)
- Context-based state management (no Redux/Zustand detected)

---

*Convention analysis: 2026-03-13*
