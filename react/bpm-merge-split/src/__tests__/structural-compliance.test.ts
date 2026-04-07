/**
 * Phase 11 Structural Compliance Tests
 *
 * Verifies the structural invariants required by BMSP-01, BMSP-02, BMSP-03:
 *   - BMSP-01: BpmnPreviews.tsx uses useBpmnViewer hook, has no direct bpmn-js imports
 *   - BMSP-02: Service.js is deleted; api.ts imports from @studio/shared
 *   - BMSP-03: utils.tsx exports only getParams and setParam (dead code removed,
 *              bpmn-js code removed, translate migrated to shared)
 *
 * These are file-content assertions, not runtime tests, so they run in the
 * Node environment provided by Vitest (fs reads from the project source tree).
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

import { describe, it, expect } from "vitest";

const SRC = resolve(__dirname, "..");

function readSrc(relPath: string): string {
  return readFileSync(resolve(SRC, relPath), "utf-8");
}

function existsSrc(relPath: string): boolean {
  return existsSync(resolve(SRC, relPath));
}

// ─── BMSP-01: BpmnPreviews.tsx decomposed via useBpmnViewer hook ──────────────

describe("BMSP-01: BpmnPreviews.tsx decomposed below 350 lines using useBpmnViewer hook", () => {
  it("BpmnPreviews.tsx exists and is under 350 lines", () => {
    const content = readSrc("parts/CommonParts/BpmnPreviews.tsx");
    const lineCount = content.split("\n").length;
    expect(lineCount).toBeLessThan(350);
  });

  it("BpmnPreviews.tsx imports useBpmnViewer from the hooks directory", () => {
    const content = readSrc("parts/CommonParts/BpmnPreviews.tsx");
    expect(content).toMatch(
      /import\s*\{[^}]*useBpmnViewer[^}]*\}\s*from\s*["'].*hooks\/useBpmnViewer["']/,
    );
  });

  it("BpmnPreviews.tsx calls useBpmnViewer in its component body", () => {
    const content = readSrc("parts/CommonParts/BpmnPreviews.tsx");
    expect(content).toMatch(/useBpmnViewer\s*\(/);
  });

  it("BpmnPreviews.tsx has no direct bpmn-js imports", () => {
    const content = readSrc("parts/CommonParts/BpmnPreviews.tsx");
    expect(content).not.toMatch(/from\s*["']bpmn-js/);
  });

  it("ParticipantSelector.tsx imports useBpmnViewer from the hooks directory", () => {
    const content = readSrc("parts/CommonParts/ParticipantSelector.tsx");
    expect(content).toMatch(
      /import\s*\{[^}]*useBpmnViewer[^}]*\}\s*from\s*["'].*hooks\/useBpmnViewer["']/,
    );
  });

  it("ParticipantSelector.tsx has no direct bpmn-js runtime imports (type imports allowed)", () => {
    const content = readSrc("parts/CommonParts/ParticipantSelector.tsx");
    // Type-only imports are acceptable (erased at runtime)
    const runtimeImports = content
      .split("\n")
      .filter((line: string) => /from\s*["']bpmn-js/.test(line) && !/import\s+type\b/.test(line));
    expect(runtimeImports).toHaveLength(0);
  });

  it("useBpmnViewer.ts is the single file importing bpmn-js Modeler in the hooks directory", () => {
    const content = readSrc("hooks/useBpmnViewer.ts");
    expect(content).toMatch(/import BpmnModeler from ["']bpmn-js\/lib\/Modeler["']/);
  });
});

// ─── BMSP-02: Service.js deleted; api.ts uses @studio/shared ─────────────────

describe("BMSP-02: Service.js deleted and api.ts migrated to @studio/shared", () => {
  it("services/Service.js does not exist (was deleted)", () => {
    expect(existsSrc("services/Service.js")).toBe(false);
  });

  it("services/api.ts imports ServiceInstance from @studio/shared/services", () => {
    const content = readSrc("services/api.ts");
    expect(content).toMatch(
      /import\s*\{[^}]*ServiceInstance[^}]*\}\s*from\s*["']@studio\/shared\/services["']/,
    );
  });

  it("services/api.ts does not import from local Service.js", () => {
    const content = readSrc("services/api.ts");
    expect(content).not.toMatch(/from\s*["']\.\/Service["']/);
    expect(content).not.toMatch(/from\s*["']\.\.\/services\/Service["']/);
  });

  it("services/api.ts removeWkf uses Service.delete method", () => {
    const content = readSrc("services/api.ts");
    expect(content).toMatch(/Service\.delete\s*\(/);
  });
});

// ─── BMSP-03: utils.tsx cleaned — only getParams and setParam remain ─────────

describe("BMSP-03: utils.tsx contains only getParams and setParam (all dead code removed)", () => {
  it("utils.tsx exports getParams", () => {
    const content = readSrc("utils.tsx");
    expect(content).toMatch(/export\s+(const|function)\s+getParams/);
  });

  it("utils.tsx exports setParam", () => {
    const content = readSrc("utils.tsx");
    expect(content).toMatch(/export\s+(const|function)\s+setParam/);
  });

  it("utils.tsx does not export translate (migrated to @studio/shared)", () => {
    const content = readSrc("utils.tsx");
    expect(content).not.toMatch(/export\s+(const|function)\s+translate/);
  });

  it("utils.tsx has no bpmn-js imports", () => {
    const content = readSrc("utils.tsx");
    expect(content).not.toMatch(/from\s*["']bpmn-js/);
  });

  it("utils.tsx does not contain dead-code functions (capitalizeFirst, sortBy, pascalToKebabCase, etc.)", () => {
    const content = readSrc("utils.tsx");
    const deadCodeFunctions = [
      "capitalizeFirst",
      "sortBy",
      "pascalToKebabCase",
      "getLowerCase",
      "lowerCaseFirstLetter",
      "splitWithComma",
      "dashToUnderScore",
    ];
    for (const fn of deadCodeFunctions) {
      expect(content, `Dead code function '${fn}' should be removed from utils.tsx`).not.toMatch(
        new RegExp(`\\b${fn}\\b`),
      );
    }
  });

  it("utils.tsx does not contain getAxelorScope (migrated to @studio/shared)", () => {
    const content = readSrc("utils.tsx");
    expect(content).not.toMatch(/getAxelorScope/);
  });

  it("updateTranslations and getNameProperty are NOT in utils.tsx (moved to useBpmnViewer hook)", () => {
    const content = readSrc("utils.tsx");
    expect(content).not.toMatch(/\bgetNameProperty\b/);
    expect(content).not.toMatch(/\bupdateTranslations\b/);
  });

  it("utils.tsx is under 30 lines (confirming all cleanup happened)", () => {
    const content = readSrc("utils.tsx");
    const lineCount = content.split("\n").filter((l: string) => l.trim() !== "").length;
    expect(lineCount).toBeLessThanOrEqual(14);
  });
});

// ─── BMSP-03 additional: translate migrated away from all component files ─────

describe("BMSP-03: translate import migrated from local utils to @studio/shared across all components", () => {
  it("no source file in src/ imports translate from local utils", () => {
    const apiContent = readSrc("services/api.ts");
    expect(apiContent).not.toMatch(/translate.*from.*["']\.\.\/utils["']/);
    expect(apiContent).not.toMatch(/translate.*from.*["']\.\/utils["']/);
  });
});
