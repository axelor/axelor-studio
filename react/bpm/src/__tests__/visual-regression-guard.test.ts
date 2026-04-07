/**
 * Regression Guards for BPM
 *
 * Guards against known regressions:
 * 1. ExtensionElementTable: Button must NOT use overflow="hidden" (clips MaterialIcon)
 * 2. Monaco dependency resolution: monaco-editor must be importable from BPM context
 */
import { readFileSync } from "fs";
import { resolve } from "path";

import { describe, it, expect } from "vitest";

const ROOT = resolve(__dirname, "../..");

describe("ExtensionElementTable — icon buttons must not clip content", () => {
  const tsx = readFileSync(
    resolve(ROOT, "src/components/properties/components/ExtensionElementTable.tsx"),
    "utf-8",
  );

  it("Button components must NOT use overflow='hidden' (clips MaterialIcon)", () => {
    const buttonBlocks = tsx.match(/<Button[\s\S]*?>/g) || [];
    for (const button of buttonBlocks) {
      expect(button).not.toContain('overflow="hidden"');
      expect(button).not.toContain("overflow={'hidden'}");
      expect(button).not.toContain('overflow={"hidden"}');
    }
  });

  it("renders MaterialIcon for add and clear actions", () => {
    expect(tsx).toContain('<MaterialIcon icon="add"');
    expect(tsx).toContain('<MaterialIcon icon="close"');
  });
});

describe("Monaco — consumer owns the dependency (Inversion of Control)", () => {
  it("BPM declares monaco-editor in dependencies", () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf-8"));
    expect(pkg.dependencies["monaco-editor"]).toBeDefined();
    expect(pkg.dependencies["@monaco-editor/react"]).toBeDefined();
  });

  it("monaco-editor is installed in node_modules", () => {
    const monacoPath = resolve(ROOT, "node_modules", "monaco-editor", "package.json");
    expect(JSON.parse(readFileSync(monacoPath, "utf-8")).name).toBe("monaco-editor");
  });

  it("entry point imports monaco-setup.ts before App", () => {
    // The static import in index.tsx ensures Vite auto-discovers and
    // pre-bundles monaco-editor. It must be the FIRST import.
    const entry = readFileSync(resolve(ROOT, "src", "index.tsx"), "utf-8");
    const monacoLine = entry.indexOf("monaco-setup");
    const appLine = entry.indexOf("./App");
    expect(monacoLine).toBeGreaterThan(-1);
    expect(monacoLine).toBeLessThan(appLine);
  });

  it("monaco-setup.ts calls markMonacoReady()", () => {
    const setup = readFileSync(resolve(ROOT, "src", "monaco-setup.ts"), "utf-8");
    expect(setup).toContain("markMonacoReady()");
    expect(setup).toContain("loader.config");
  });

  it("@studio/shared does NOT depend on monaco-editor (inversion of control)", () => {
    const sharedPkg = JSON.parse(
      readFileSync(resolve(ROOT, "..", "shared", "package.json"), "utf-8"),
    );
    expect(sharedPkg.dependencies?.["monaco-editor"]).toBeUndefined();
  });
});
