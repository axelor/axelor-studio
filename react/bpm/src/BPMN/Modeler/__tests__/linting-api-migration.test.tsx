/**
 * Linting API Migration Guard Tests (LINT-02)
 *
 * These tests ensure that the bpmnlint integration uses the typed Linting
 * interface (toggle) instead of the internal _setActive API, and that no
 * unsafe `as unknown as` casts remain for linting access.
 *
 * RED phase: All tests fail against the current codebase because:
 *   - 4 _setActive call sites exist in production code
 *   - Linting interface has activate()/deactivate() instead of toggle(active?: boolean)
 *   - as unknown as casts exist for linting access in hooks
 */

import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";

const BPM_SRC_DIR = path.resolve(__dirname, "..", "..", "..", "..");
const USE_MODELER_EVENTS_PATH = path.resolve(__dirname, "..", "hooks", "useModelerEvents.ts");
const USE_VIEW_CONTROLS_PATH = path.resolve(__dirname, "..", "hooks", "useViewControls.ts");
const SERVICE_MAP_PATH = path.resolve(__dirname, "..", "..", "..", "..", "..", "shared", "src", "types", "bpmn-service-map.ts");

/**
 * Recursively find all .ts and .tsx files in a directory, excluding __tests__ dirs.
 */
function findSourceFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "node_modules") continue;
      results.push(...findSourceFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

describe("LINT-02: API migration from _setActive to toggle()", () => {
  it("zero _setActive references in production code", () => {
    const sourceFiles = findSourceFiles(BPM_SRC_DIR);
    const violations: Array<{ file: string; line: number; content: string }> = [];

    for (const filePath of sourceFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        if (line.includes("_setActive")) {
          violations.push({
            file: path.relative(BPM_SRC_DIR, filePath),
            line: idx + 1,
            content: line.trim(),
          });
        }
      });
    }

    if (violations.length > 0) {
      const report = violations
        .map((v) => `  ${v.file}:${v.line}: ${v.content}`)
        .join("\n");
      expect.fail(
        `Found ${violations.length} _setActive reference(s) in production code:\n${report}\n\n` +
          "Fix: replace _setActive(val) with linting.toggle(val) using the typed Linting interface.",
      );
    }
  });

  it("Linting interface has toggle(active?: boolean) and no activate/deactivate", () => {
    const source = fs.readFileSync(SERVICE_MAP_PATH, "utf-8");

    // Extract the Linting interface block
    const lintingMatch = source.match(/export interface Linting\s*\{([^}]*)\}/s);
    expect(lintingMatch, "Could not find Linting interface in bpmn-service-map.ts").toBeTruthy();

    const interfaceBody = lintingMatch![1];

    // Should have toggle with optional boolean param
    expect(interfaceBody).toContain("toggle(active?: boolean)");

    // Should NOT have the old activate/deactivate methods
    expect(interfaceBody).not.toContain("activate(): void");
    expect(interfaceBody).not.toContain("deactivate(): void");
  });

  it("zero 'as unknown as' casts for linting access in hooks", () => {
    const hookFiles = [USE_MODELER_EVENTS_PATH, USE_VIEW_CONTROLS_PATH];
    const violations: Array<{ file: string; line: number; content: string }> = [];

    for (const filePath of hookFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        // Look for `as unknown as` casts that mention linting-related types
        if (line.includes("as unknown as") && (line.includes("_setActive") || line.includes("linting"))) {
          violations.push({
            file: path.basename(filePath),
            line: idx + 1,
            content: line.trim(),
          });
        }
      });
    }

    if (violations.length > 0) {
      const report = violations
        .map((v) => `  ${v.file}:${v.line}: ${v.content}`)
        .join("\n");
      expect.fail(
        `Found ${violations.length} 'as unknown as' cast(s) for linting access:\n${report}\n\n` +
          "Fix: use the typed Linting interface from BpmnServiceMap (modeler.get('linting').toggle()).",
      );
    }
  });
});
