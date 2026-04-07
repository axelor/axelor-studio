/**
 * Domain services tests -- Phase 8 gap fill
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

import { describe, it, expect } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..", "..");

function countLines(relativePath: string): number | null {
  const absolute = resolve(projectRoot, relativePath);
  if (!existsSync(absolute)) return null;
  const content = readFileSync(absolute, "utf-8");
  return content.split("\n").length;
}

describe("GENB-03: api.js barrel has been deleted (consumers import domain services directly)", () => {
  it("api.js no longer exists on disk", () => {
    const lines = countLines("src/services/api.js");
    expect(lines, "api.js should be deleted").toBeNull();
  });

  it("Service.js shim no longer exists on disk", () => {
    const lines = countLines("src/services/Service.js");
    expect(lines, "Service.js should be deleted").toBeNull();
  });
});

describe("GENB-03: domain service files exist with substantive content", () => {
  it("field-service.ts exists and exports getMetaFields", async () => {
    const mod = await import("../services/field-service");
    expect(mod.getMetaFields).toBeDefined();
    expect(typeof mod.getMetaFields).toBe("function");
  });

  it("field-service.ts exports getButtons", async () => {
    const mod = await import("../services/field-service");
    expect(mod.getButtons).toBeDefined();
    expect(typeof mod.getButtons).toBe("function");
  });

  it("model-service.ts exists and exports getModels", async () => {
    const mod = await import("../services/model-service");
    expect(mod.getModels).toBeDefined();
    expect(typeof mod.getModels).toBe("function");
  });

  it("view-service.ts exists and exports getViews", async () => {
    const mod = await import("../services/view-service");
    expect(mod.getViews).toBeDefined();
    expect(typeof mod.getViews).toBe("function");
  });

  it("data-service.ts exists and exports getData", async () => {
    const mod = await import("../services/data-service");
    expect(mod.getData).toBeDefined();
    expect(typeof mod.getData).toBe("function");
  });

  it("data-service.ts exports getCustomModelData", async () => {
    const mod = await import("../services/data-service");
    expect(mod.getCustomModelData).toBeDefined();
    expect(typeof mod.getCustomModelData).toBe("function");
  });

  it("expression-service.ts exists and exports generateGroovyExpression", async () => {
    const mod = await import("../services/expression-service");
    expect(mod.generateGroovyExpression).toBeDefined();
    expect(typeof mod.generateGroovyExpression).toBe("function");
  });

  it("transformation-service.ts exists and exports getLibraries", async () => {
    const mod = await import("../services/transformation-service");
    expect(mod.getLibraries).toBeDefined();
    expect(typeof mod.getLibraries).toBe("function");
  });

  it("user-service.ts exists and exports fetchUserPreferences", async () => {
    const mod = await import("../services/user-service");
    expect(mod.fetchUserPreferences).toBeDefined();
    expect(typeof mod.fetchUserPreferences).toBe("function");
  });
});

describe("GENB-03: domain services are directly importable (no api.js barrel needed)", () => {
  it("field-service exports getMetaFields directly", async () => {
    const mod = await import("../services/field-service");
    expect(mod.getMetaFields).toBeDefined();
  });

  it("model-service exports getModels directly", async () => {
    const mod = await import("../services/model-service");
    expect(mod.getModels).toBeDefined();
  });

  it("data-service exports getData directly", async () => {
    const mod = await import("../services/data-service");
    expect(mod.getData).toBeDefined();
  });

  it("expression-service exports generateGroovyExpression directly", async () => {
    const mod = await import("../services/expression-service");
    expect(mod.generateGroovyExpression).toBeDefined();
  });

  it("transformation-service exports getLibraries directly", async () => {
    const mod = await import("../services/transformation-service");
    expect(mod.getLibraries).toBeDefined();
  });

  it("user-service exports fetchUserPreferences directly", async () => {
    const mod = await import("../services/user-service");
    expect(mod.fetchUserPreferences).toBeDefined();
  });
});
