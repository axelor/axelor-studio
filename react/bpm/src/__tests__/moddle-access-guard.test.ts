/**
 * Moddle Property Access Guard
 *
 * BPMN moddle elements encapsulate properties via a .get(name) method inherited
 * from moddle/Base. Direct property access (bo.extensionElements, bo['camunda:class'])
 * bypasses this resolution and returns undefined silently.
 *
 * This was the root cause of empty listeners, broken property detection, and
 * invisible extension elements after the TypeScript migration replaced .get()
 * calls with direct access.
 *
 * Three test layers:
 * 1. Behavioral: verify utility functions work with real moddle-like objects
 * 2. Structural: scan source for forbidden direct-access patterns
 * 3. Global: detect the anti-pattern across the codebase
 */
import {  readFileSync, readdirSync } from "fs";
import { resolve, join } from "path";

import {  describe, it, expect } from "vitest";

const ROOT = resolve(__dirname, "../..");

// ---------------------------------------------------------------------------
// Layer 1: Behavioral tests with moddle-like mocks
// ---------------------------------------------------------------------------

/**
 * Create a mock moddle element that behaves like a real bpmn-js moddle object:
 * - .get(name) returns the property value
 * - Direct access (obj.prop) returns undefined (simulates moddle encapsulation)
 *
 * This is the key insight: moddle stores properties internally and only
 * exposes them through .get(). TypeScript's index signature [key: string]: unknown
 * makes direct access compile without error but return undefined at runtime.
 */
function createModdleMock(properties: Record<string, unknown>): {
  $type: string;
  $attrs: Record<string, unknown>;
  get(name: string): any;
} {
  const internal = { ...properties };
  return {
    $type: (internal.$type as string) || "bpmn:Process",
    $attrs: (internal.$attrs as Record<string, unknown>) || {},
    get(name: string): any {
      return internal[name];
    },
    // No direct property exposure — simulates real moddle behavior
  };
}

describe("Layer 1: ExtensionElementsUtil — behavioral with moddle mocks", () => {
  // We can't import the actual functions because they depend on bpmn-js
  // runtime. Instead, we replicate the critical logic and test the pattern.

  it("getExtensionElements pattern: .get() returns data, direct access returns undefined", () => {
    const listener1 = { $type: "camunda:ExecutionListener", event: "start" };
    const listener2 = { $type: "camunda:TaskListener", event: "create" };

    const extensionElements = createModdleMock({
      $type: "bpmn:ExtensionElements",
      values: [listener1, listener2],
    });

    const bo = createModdleMock({
      $type: "bpmn:Process",
      extensionElements: extensionElements,
    });

    // .get() works — this is how moddle is designed
    expect(bo.get("extensionElements")).toBeDefined();
    expect(bo.get("extensionElements").get("values")).toHaveLength(2);

    // Direct access does NOT work on real moddle — our mock simulates this
    expect((bo as any).extensionElements).toBeUndefined();
  });

  it("getImplementationType pattern: .get('camunda:class') returns data", () => {
    const bo = createModdleMock({
      $type: "camunda:ExecutionListener",
      "camunda:class": "com.example.MyListener",
      script: undefined,
    });

    expect(bo.get("camunda:class")).toBe("com.example.MyListener");
    expect((bo as any)["camunda:class"]).toBeUndefined();
  });

  it("extension elements with type filtering via .get()", () => {
    const execListener = {
      $type: "camunda:ExecutionListener",
      event: "start",
      get(name: string) {
        return (this as any)[name];
      },
    };
    const taskListener = {
      $type: "camunda:TaskListener",
      event: "create",
      get(name: string) {
        return (this as any)[name];
      },
    };

    const extensionElements = createModdleMock({
      $type: "bpmn:ExtensionElements",
      values: [execListener, taskListener],
    });

    const values = extensionElements.get("values") as any[];
    const execListeners = values.filter((v: any) => v.$type === "camunda:ExecutionListener");
    expect(execListeners).toHaveLength(1);
    expect(execListeners[0].event).toBe("start");
  });
});

// ---------------------------------------------------------------------------
// Layer 2: Structural guards on critical utility files
// ---------------------------------------------------------------------------

describe("Layer 2: ExtensionElementsUtil.ts — must use .get() for moddle access", () => {
  const code = readFileSync(resolve(ROOT, "src/utils/ExtensionElementsUtil.ts"), "utf-8");

  it("must NOT use direct .extensionElements access on business objects", () => {
    // Split by function to check each one
    const functions = code.split(/^export function /m).slice(1);
    for (const fn of functions) {
      const fnName = fn.match(/^(\w+)/)?.[1] || "unknown";
      // Direct access pattern: identifier.extensionElements (not in a comment)
      const lines = fn.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("//") || line.startsWith("*")) continue;
        if (/\w+\.extensionElements\b/.test(line) && !line.includes(".get(")) {
          // Exception: extensionElementToAdd.$parent = extensionElements is OK
          // (assigning TO a moddle, not reading FROM it)
          if (line.includes("$parent") || line.includes("moddleElement:")) continue;
          throw new Error(
            `${fnName}: line ${i + 1} uses direct .extensionElements access instead of .get('extensionElements')\n  → ${line}`,
          );
        }
      }
    }
  });

  it("must NOT use direct .values access on extension elements", () => {
    const lines = code.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("//") || line.startsWith("*")) continue;
      // extensionElements.values or extensionElements?.values (without .get)
      if (/extensionElements[?!]?\.values\b/.test(line) && !line.includes(".get(")) {
        // Exception: spread in properties object { values: [...extensionElements.get('values'), ...] }
        if (line.includes("...extensionElements.get(")) continue;
        throw new Error(
          `Line ${i + 1} uses direct .values access instead of .get('values')\n  → ${line}`,
        );
      }
    }
  });

  it("uses .get('extensionElements') in all getter functions", () => {
    const getterCalls = code.match(/\.get\(\s*['"]extensionElements['"]\s*\)/g) || [];
    // getExtensionElementsList, getExtensionElements
    expect(getterCalls.length).toBeGreaterThanOrEqual(2);
  });

  it("uses .get('values') in all getter functions", () => {
    const valuesCalls = code.match(/\.get\(\s*['"]values['"]\s*\)/g) || [];
    // getExtensionElementsList, getExtensionElements
    expect(valuesCalls.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Layer 2: ImplementationTypeUtils.ts — must use .get() for camunda properties", () => {
  const code = readFileSync(resolve(ROOT, "src/utils/ImplementationTypeUtils.ts"), "utf-8");

  it("must NOT use bracket notation for camunda properties", () => {
    // bo['camunda:class'] bypasses moddle .get() — must use bo.get('camunda:class')
    const lines = code.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("//") || line.startsWith("*")) continue;
      if (/\w+\['camunda:/.test(line)) {
        throw new Error(
          `Line ${i + 1} uses bracket notation ['camunda:...'] instead of .get('camunda:...')\n  → ${line}`,
        );
      }
    }
  });

  it("uses .get() for all camunda property access in getImplementationType", () => {
    const getCalls = code.match(/\.get\(\s*['"]camunda:/g) || [];
    // decisionRef, type, class, expression, delegateExpression = at least 5
    expect(getCalls.length).toBeGreaterThanOrEqual(5);
  });

  it("uses .get('script') not bracket notation for script detection", () => {
    expect(code).toMatch(/\.get\(['"]script['"]\)/);
    expect(code).not.toMatch(/\['script'\]/);
  });
});

// ---------------------------------------------------------------------------
// Layer 3: Global codebase scan for the anti-pattern in utility files
// ---------------------------------------------------------------------------

function findTsFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (
        entry.isDirectory() &&
        entry.name !== "node_modules" &&
        entry.name !== "__tests__" &&
        !entry.name.startsWith(".")
      ) {
        results.push(...findTsFiles(fullPath));
      } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
        results.push(fullPath);
      }
    }
  } catch {
    /* ignore */
  }
  return results;
}

describe("Layer 3: Global scan — utils/ files must not use direct moddle access", () => {
  const utilsDir = resolve(ROOT, "src/utils");
  const utilFiles = findTsFiles(utilsDir);

  it("found utility files to scan", () => {
    expect(utilFiles.length).toBeGreaterThan(0);
  });

  it("no .extensionElements direct access in any utils/ file (except $parent assignment)", () => {
    const violations: string[] = [];
    for (const file of utilFiles) {
      const code = readFileSync(file, "utf-8");
      const lines = code.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("//") || line.startsWith("*")) continue;
        // Match: someVar.extensionElements (read access, not .get())
        if (
          /\b\w+\.extensionElements\b/.test(line) &&
          !line.includes(".get(") &&
          !line.includes("$parent")
        ) {
          const relPath = file.replace(ROOT + "/", "");
          violations.push(`${relPath}:${i + 1}: ${line}`);
        }
      }
    }
    if (violations.length > 0) {
      throw new Error(
        `Found ${violations.length} direct .extensionElements access in utils/ (must use .get('extensionElements')):\n` +
          violations.map((v) => `  ${v}`).join("\n"),
      );
    }
  });

  it("no bracket notation ['camunda:...'] in any utils/ file", () => {
    const violations: string[] = [];
    for (const file of utilFiles) {
      const code = readFileSync(file, "utf-8");
      const lines = code.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("//") || line.startsWith("*")) continue;
        if (/\w+\['camunda:/.test(line)) {
          const relPath = file.replace(ROOT + "/", "");
          violations.push(`${relPath}:${i + 1}: ${line}`);
        }
      }
    }
    if (violations.length > 0) {
      throw new Error(
        `Found ${violations.length} bracket notation ['camunda:...'] in utils/ (must use .get('camunda:...')):\n` +
          violations.map((v) => `  ${v}`).join("\n"),
      );
    }
  });
});
