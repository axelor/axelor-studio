/**
 * Structural requirements tests for Phase 9 TIMR requirements.
 *
 * These tests verify file-level structural constraints that cannot be captured
 * by unit tests alone. They act as regression guards: if someone re-inflates
 * a refactored file, these tests will fail immediately.
 *
 * Requirements covered:
 *   TIMR-01: App.tsx decomposed — must be under 350 lines
 *   TIMR-02: Service.js extracted — must be a shim (under 10 lines), not the original 280L file
 *   TIMR-03: localization split into per-language files
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import { describe, it, expect } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, "..");
const PACKAGE_ROOT = resolve(SRC, "..");

function countLines(filePath: string): number {
  const content = readFileSync(filePath, "utf8");
  return content.split("\n").length;
}

describe("TIMR-01: App.tsx decomposed into components under 350 lines", () => {
  it("App.tsx is under 350 lines after Cron extraction", () => {
    const appPath = resolve(SRC, "App.tsx");
    const lineCount = countLines(appPath);
    expect(lineCount).toBeLessThan(350);
  });

  it("App.tsx imports Cron from ./Cron (extraction wired)", () => {
    const appContent = readFileSync(resolve(SRC, "App.tsx"), "utf8");
    expect(appContent).toMatch(/import Cron from ["']\.\/Cron["']/);
  });

  it("Cron.tsx exists as a standalone extracted component", () => {
    expect(existsSync(resolve(SRC, "Cron.tsx"))).toBe(true);
  });

  it("Cron.tsx is at least 70 lines (substantive extraction, not empty stub)", () => {
    const cronPath = resolve(SRC, "Cron.tsx");
    const lineCount = countLines(cronPath);
    expect(lineCount).toBeGreaterThanOrEqual(70);
  });
});

describe("TIMR-02: Service.js removed — App.tsx imports directly from @studio/shared", () => {
  it("services/Service.js shim has been deleted (no longer needed)", () => {
    expect(existsSync(resolve(SRC, "services", "Service.js"))).toBe(false);
  });

  it("App.tsx imports ServiceInstance from @studio/shared (not local Service.js)", () => {
    const appContent = readFileSync(resolve(SRC, "App.tsx"), "utf8");
    expect(appContent).toMatch(/ServiceInstance.*from.*@studio\/shared/);
  });
});

describe("TIMR-03: localization split into per-language files", () => {
  it("old monolithic localization.js no longer exists", () => {
    expect(existsSync(resolve(SRC, "localization.js"))).toBe(false);
  });

  it("localization/fr.ts exists and is over 200 lines", () => {
    const frPath = resolve(SRC, "localization", "fr.ts");
    expect(existsSync(frPath)).toBe(true);
    const lineCount = countLines(frPath);
    expect(lineCount).toBeGreaterThanOrEqual(200);
  });

  it("localization/en.ts exists and is over 200 lines", () => {
    const enPath = resolve(SRC, "localization", "en.ts");
    expect(existsSync(enPath)).toBe(true);
    const lineCount = countLines(enPath);
    expect(lineCount).toBeGreaterThanOrEqual(200);
  });

  it("localization/index.ts barrel re-exports { localization }", () => {
    const indexContent = readFileSync(resolve(SRC, "localization", "index.ts"), "utf8");
    expect(indexContent).toMatch(/localization/);
  });
});

describe("TIMR-04: Barrel export wired for external consumers", () => {
  it("timer-builder/index.js exists at package root", () => {
    expect(existsSync(resolve(PACKAGE_ROOT, "index.js"))).toBe(true);
  });

  it("timer-builder/index.js exports from src/App.tsx", () => {
    const indexContent = readFileSync(resolve(PACKAGE_ROOT, "index.js"), "utf8");
    expect(indexContent).toMatch(/src\/App\.tsx/);
  });

  it("package.json has main field pointing to index.js", () => {
    const pkgContent = readFileSync(resolve(PACKAGE_ROOT, "package.json"), "utf8");
    const pkg = JSON.parse(pkgContent);
    expect(pkg.main).toBe("index.js");
  });
});
