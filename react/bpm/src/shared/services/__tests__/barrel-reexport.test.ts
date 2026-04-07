import { describe, it, expect } from "vitest";

import * as barrel from "../index";

// All 45 functions exported from the barrel (44 original + getResultedFields)
const EXPECTED_EXPORTS = [
  // meta-service (8 -- getMetaModal is the backward-compat alias for getMetaModel)
  "getMetaModal",
  "getSubMetaField",
  "getMetaFields",
  "getItems",
  "getViews",
  "getNameColumn",
  "getResultedFields",
  // model-service (5)
  "getModels",
  "fetchModels",
  "getMetaModels",
  "getCustomModels",
  "getAllModels",
  // wkf-service (6)
  "getWkfModels",
  "getWkfDMNModels",
  "fetchWkf",
  "removeWkf",
  "getProcessConfigModel",
  "getProcessInstance",
  // menu-service (3)
  "getParentMenus",
  "getSubMenus",
  "getMenu",
  // translation-service (3)
  "getTranslations",
  "removeAllTranslations",
  "addTranslations",
  // dmn-service (4)
  "fetchDMNModel",
  "getDMNModel",
  "getDMNModels",
  "getDMNFields",
  // app-service (6)
  "getStudioApp",
  "getAppStudioConfig",
  "getAppBPMConfig",
  "getApp",
  "getInfo",
  "loadTheme",
  // action-service (3)
  "getActions",
  "getButtons",
  "getExpressionValues",
  // auth-service (1)
  "getRoles",
  // connect-service (3)
  "checkConnectAndStudioInstalled",
  "getOrganization",
  "getScenarios",
  // upload-service (1)
  "uploadFileAPI",
  // language-service (1)
  "getLanguages",
  // template-service (1)
  "getTemplates",
  // bpmn-process-service (1)
  "getBPMNModels",
];

describe("barrel re-export (shared/services/index.js)", () => {
  it("exports all 45 functions (44 original + getResultedFields)", () => {
    expect(EXPECTED_EXPORTS).toHaveLength(45);

    const barrelRecord = barrel as Record<string, unknown>;
    for (const name of EXPECTED_EXPORTS) {
      expect(barrelRecord[name], `${name} should be exported`).toBeDefined();
      expect(typeof barrelRecord[name], `${name} should be a function`).toBe("function");
    }
  });

  it("backward-compat shim re-exports the same functions", async () => {
    const api = (await import("../../../shared/services")) as Record<string, unknown>;
    for (const name of EXPECTED_EXPORTS) {
      expect(api[name], `api.${name} should be exported`).toBeDefined();
      expect(typeof api[name], `api.${name} should be a function`).toBe("function");
    }
  });
});
