/**
 * API export surface tests for mapper's service dependencies.
 * Verifies that @studio/shared and mapper-service export the functions
 * previously available via the now-deleted api.js shim.
 */
import { describe, it, expect } from "vitest";

describe("@studio/shared exports all metadata functions used by mapper", () => {
  it("exports ModelType constant", async () => {
    const shared = await import("@studio/shared/services");
    expect(shared.ModelType).toBeDefined();
    expect(shared.ModelType.CUSTOM).toBe("CUSTOM");
    expect(shared.ModelType.META).toBe("META");
  });

  it("exports excludedUITypes constant", async () => {
    const shared = await import("@studio/shared/services");
    expect(shared.excludedUITypes).toBeDefined();
    expect(Array.isArray(shared.excludedUITypes)).toBe(true);
    expect(shared.excludedUITypes).toContain("panel");
    expect(shared.excludedUITypes).toContain("label");
  });

  it("exports all metadata functions", async () => {
    const shared = await import("@studio/shared/services");
    const metadataFunctions = [
      "getModels",
      "getMetaModels",
      "getCustomModels",
      "getViews",
      "getFormViews",
      "fetchModelByName",
      "fetchModelByFullName",
      "fetchMetaFields",
      "fetchModelFields",
      "fetchFields",
      "fetchCustomFields",
    ];
    for (const fn of metadataFunctions) {
      expect(typeof (shared as Record<string, unknown>)[fn]).toBe("function");
    }
  });
});

describe("mapper-service exports all mapper-specific functions", () => {
  it("exports all mapper-specific functions", async () => {
    const mapperService = await import("../services/mapper-service");
    const mapperFunctions = [
      "saveRecord",
      "fetchRecord",
      "generateScriptString",
      "getData",
      "getCustomModelData",
      "getCustomModelByDomain",
      "getNameFieldByDomain",
      "getCustomVariables",
    ];
    for (const fn of mapperFunctions) {
      expect(typeof (mapperService as Record<string, unknown>)[fn]).toBe("function");
    }
  });
});

describe("mapper shims removed", () => {
  it("services/api.js no longer exists on disk", async () => {
    const { existsSync } = await import("fs");
    const { resolve } = await import("path");
    const apiPath = resolve(__dirname, "../services/api.js");
    expect(existsSync(apiPath)).toBe(false);
  });

  it("services/Service.js no longer exists on disk", async () => {
    const { existsSync } = await import("fs");
    const { resolve } = await import("path");
    const servicePath = resolve(__dirname, "../services/Service.js");
    expect(existsSync(servicePath)).toBe(false);
  });
});
