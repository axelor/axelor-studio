# @studio/shared Entry Criteria

Code promoted to `@studio/shared` must satisfy **all** of the following criteria:

## 1. Multi-package usage

The module is used by **2 or more** packages in the monorepo, or is anticipated for reuse by an upcoming extraction (e.g., Phase 16 DMN extraction).

## 2. No app-specific coupling

The module must not depend on app-specific state, UI components, or routing. It should be a generic utility, service, hook, or component that makes sense outside any single application context.

## 3. Testable in isolation

The module can be unit-tested without requiring a running application, BPMN modeler instance, or other heavy runtime dependency.

## 4. Named exports only

All exports must be named exports. Zero default exports are permitted in `@studio/shared`. This ensures consistent import patterns across all consumers.

## 5. Documented with inline JSDoc

Every exported function, hook, or component must have a JSDoc comment describing its purpose, parameters, and return value.
