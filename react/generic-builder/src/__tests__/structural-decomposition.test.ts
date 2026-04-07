/**
 * Structural decomposition tests -- Phase 8 gap fill
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve } from "path";

import { describe, it, expect } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..", "..");

function countLines(relativePath: string): number | null {
  const absolute = resolve(projectRoot, relativePath);
  if (!existsSync(absolute)) return null;
  const content = readFileSync(absolute, "utf-8");
  return content.split("\n").length;
}

/**
 * Counts lines of each top-level function in a TypeScript file.
 * Matches: function name(, const name = (, export function name(
 * Returns map of functionName -> lineCount.
 */
function countFunctionLines(relativePath: string): Map<string, number> | null {
  const absolute = resolve(projectRoot, relativePath);
  if (!existsSync(absolute)) return null;
  const content = readFileSync(absolute, "utf-8");
  const lines = content.split("\n");
  const result = new Map<string, number>();
  const funcStartRe = /^(?:export\s+)?(?:function\s+(\w+)|const\s+(\w+)\s*[:=])/;
  let currentFunc: string | null = null;
  let braceDepth = 0;
  let startLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!currentFunc) {
      const match = line.match(funcStartRe);
      if (match) {
        currentFunc = match[1] || match[2];
        braceDepth = 0;
        startLine = i;
      }
    }
    if (currentFunc) {
      for (const ch of line) {
        if (ch === "{") braceDepth++;
        if (ch === "}") braceDepth--;
      }
      if (braceDepth <= 0 && i > startLine) {
        result.set(currentFunc, i - startLine + 1);
        currentFunc = null;
      }
    }
  }
  return result;
}

describe("GENB-01: editor decomposed into components under 350 lines", () => {
  it("Editor.tsx exists and is under 350 lines", () => {
    const lines = countLines("src/views/editor/Editor.tsx");
    expect(lines, "Editor.tsx must exist").not.toBeNull();
    expect(lines).toBeLessThanOrEqual(350);
  });

  it("Rule.tsx exists and is under 400 lines", () => {
    const lines = countLines("src/views/editor/Rule.tsx");
    expect(lines, "Rule.tsx must exist").not.toBeNull();
    expect(lines).toBeLessThanOrEqual(400);
  });

  it("ValueSourceSection.tsx exists and is under 550 lines", () => {
    const lines = countLines("src/views/editor/ValueSourceSection.tsx");
    expect(lines, "ValueSourceSection.tsx must exist").not.toBeNull();
    expect(lines).toBeLessThanOrEqual(550);
  });

  it("RenderWidget.tsx exists and is under 350 lines", () => {
    const lines = countLines("src/views/editor/RenderWidget.tsx");
    expect(lines, "RenderWidget.tsx must exist").not.toBeNull();
    expect(lines).toBeLessThanOrEqual(350);
  });

  it("RenderSimpleWidget.tsx exists and is under 350 lines", () => {
    const lines = countLines("src/views/editor/RenderSimpleWidget.tsx");
    expect(lines, "RenderSimpleWidget.tsx must exist").not.toBeNull();
    expect(lines).toBeLessThanOrEqual(350);
  });

  it("RenderRelationalWidget.tsx exists and is under 350 lines", () => {
    const lines = countLines("src/views/editor/RenderRelationalWidget.tsx");
    expect(lines, "RenderRelationalWidget.tsx must exist").not.toBeNull();
    expect(lines).toBeLessThanOrEqual(350);
  });

  it("old editor.jsx shim has been deleted", () => {
    const lines = countLines("src/views/editor/editor.jsx");
    expect(lines, "editor.jsx shim should be deleted").toBeNull();
  });

  it("editor/index.tsx removed as dead code (unused barrel)", () => {
    const lines = countLines("src/views/editor/index.tsx");
    expect(lines, "editor/index.tsx should be deleted").toBeNull();
  });
});

describe("GENB-02: index decomposed into modules under 350 lines", () => {
  it("views/index.tsx is a slim wrapper (under 100 lines)", () => {
    const lines = countLines("src/views/index.tsx");
    expect(lines, "views/index.tsx must exist").not.toBeNull();
    expect(lines).toBeLessThanOrEqual(100);
  });

  it("ExpressionBuilder.tsx exists and is under 350 lines", () => {
    const lines = countLines("src/views/expression-builder/ExpressionBuilder.tsx");
    expect(lines, "ExpressionBuilder.tsx must exist").not.toBeNull();
    expect(lines).toBeLessThanOrEqual(350);
  });

  it("generate-expression.ts exists and is under 350 lines", () => {
    const lines = countLines("src/views/expression-builder/generate-expression.ts");
    expect(lines, "generate-expression.ts must exist").not.toBeNull();
    expect(lines).toBeLessThanOrEqual(350);
  });

  it("useExpressionData.ts exists and is under 350 lines", () => {
    const lines = countLines("src/views/expression-builder/useExpressionData.ts");
    expect(lines, "useExpressionData.ts must exist").not.toBeNull();
    expect(lines).toBeLessThanOrEqual(350);
  });

  it("expression-generation.ts exists (pure functions)", () => {
    const lines = countLines("src/views/expression-builder/expression-generation.ts");
    expect(lines, "expression-generation.ts must exist").not.toBeNull();
    expect(lines).toBeGreaterThan(100);
  });

  it("Zustand store useExpressionStore.ts exists and exports createExpressionStore", async () => {
    const mod = await import("../stores/useExpressionStore");
    expect(mod.createExpressionStore).toBeDefined();
    expect(typeof mod.createExpressionStore).toBe("function");
  });

  it("dialog-context.ts exists and exports DialogContext and useDialog", async () => {
    const mod = await import("../views/dialog-context");
    expect(mod.DialogContext).toBeDefined();
    expect(mod.useDialog).toBeDefined();
    expect(typeof mod.useDialog).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// GENB-TS: No explicit .ts/.tsx extensions in import paths
// Guards against TS5097 cross-package resolution failures.
// ---------------------------------------------------------------------------
describe("GENB-TS: no .ts/.tsx extensions in import paths", () => {
  const TS_EXTENSION_RE = /(?:from|import\()\s*['"]\..*\.tsx?['"]/;

  function collectTsFiles(dir: string): string[] {
    const results: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = resolve(dir, entry.name);
      if (
        entry.isDirectory() &&
        entry.name !== "node_modules" &&
        entry.name !== "dist" &&
        entry.name !== "build"
      ) {
        results.push(...collectTsFiles(full));
      } else if (/\.tsx?$/.test(entry.name)) {
        results.push(full);
      }
    }
    return results;
  }

  it("no source file imports a relative path with .ts or .tsx extension", () => {
    const files = collectTsFiles(resolve(projectRoot, "src"));
    // Also check the root barrel
    const barrel = resolve(projectRoot, "index.ts");
    if (existsSync(barrel)) files.push(barrel);

    const violations: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (TS_EXTENSION_RE.test(line) && !line.trimStart().startsWith("//")) {
          const rel = file.replace(projectRoot + "/", "");
          violations.push(`${rel}:${i + 1}: ${line.trim()}`);
        }
      }
    }

    expect(
      violations,
      `Found .ts/.tsx extensions in imports — these break cross-package tsc resolution:\n${violations.join("\n")}`,
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// CS-02: no individual function exceeds 100 lines in expression-generation.ts
// Guards against function size regression after Strategy Pattern decomposition.
// ---------------------------------------------------------------------------
describe("CS-02: no individual function exceeds 100 lines in expression-generation.ts", () => {
  const EXPRESSION_GEN_PATH = "src/views/expression-builder/expression-generation.ts";
  const MAX_FUNCTION_LINES = 100;

  it("all functions in expression-generation.ts are under 100 lines", () => {
    const funcSizes = countFunctionLines(EXPRESSION_GEN_PATH);
    expect(funcSizes, "expression-generation.ts must exist").not.toBeNull();
    const violations: string[] = [];
    for (const [name, size] of funcSizes!) {
      if (size > MAX_FUNCTION_LINES) {
        violations.push(`${name}: ${size} lines (max ${MAX_FUNCTION_LINES})`);
      }
    }
    expect(
      violations,
      `Functions exceeding ${MAX_FUNCTION_LINES} lines:\n${violations.join("\n")}`,
    ).toHaveLength(0);
  });

  it("getBPMCondition is present (not accidentally deleted)", () => {
    const funcSizes = countFunctionLines(EXPRESSION_GEN_PATH);
    expect(funcSizes!.has("getBPMCondition")).toBe(true);
  });

  it("OPERATOR_HANDLERS map is present", () => {
    const absolute = resolve(projectRoot, EXPRESSION_GEN_PATH);
    const content = readFileSync(absolute, "utf-8");
    expect(content).toContain("OPERATOR_HANDLERS");
  });
});
