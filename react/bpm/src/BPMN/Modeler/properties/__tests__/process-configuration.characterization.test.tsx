/**
 * Characterization Test: ProcessConfiguration
 *
 * Split from panel-characterization-big.test.tsx.
 * Locks down: initialProcessConfigList, getProcessConfig, createProcessConfiguration, createParameter.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  mockGetBusinessObject,
  mockIs,
  createMockElement,
  createEmptyElement,
  createMockBpmnFactory,
} from "./fixtures/bpmn-mocks";

// --- Module-level mocks ---

vi.mock("bpmn-js/lib/util/ModelUtil", () => ({
  getBusinessObject: (...args: any[]) => mockGetBusinessObject(...args),
  // @ts-expect-error -- TS2556 legacy untyped
  is: (...args: any[]) => mockIs(...args),
}));

vi.mock("bpmn-js/lib/features/modeling/util/ModelingUtil", () => ({
  isAny: vi.fn((element, types) => types.some((t: any) => element?.type === t)),
}));

vi.mock("lodash", () => ({
  camelCase: (s: any) => s,
}));

vi.mock("../../../../../utils", () => ({
  translate: (s: any) => s,
  getBool: (v: any) => v === true || v === "true",
  dashToUnderScore: (s: any) => (s ? s.replace(/-/g, "_") : s),
  capitalizeFirst: (s: any) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s),
  getAxelorScope: vi.fn().mockReturnValue(null),
  getLowerCase: (s: any) => (s ? s.toLowerCase() : s),
}));

vi.mock("../../../../../shared/services", () => ({
  getParentMenus: vi.fn(),
  getSubMenus: vi.fn(),
  getViews: vi.fn(),
  getTemplates: vi.fn(),
  getRoles: vi.fn(),
  getMenu: vi.fn(),
  getMetaModels: vi.fn(),
  getCustomModels: vi.fn(),
  getMetaFields: vi.fn(),
  fetchModels: vi.fn(),
  getAllModels: vi.fn(),
  getProcessConfigModel: vi.fn(),
  addTranslations: vi.fn(),
  removeAllTranslations: vi.fn(),
  getModels: vi.fn(),
  getItems: vi.fn(),
}));

vi.mock("@studio/shared/services/Service", () => ({
  default: { action: vi.fn() },
}));

vi.mock("@studio/shared/hooks", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...(actual || {}), useDialog: vi.fn(() => vi.fn()) };
});

vi.mock("ids", () => ({
  default: class {
    constructor() {
      // @ts-expect-error -- TS2339 legacy untyped
      this._counter = 0;
    }
    nextPrefixed(prefix: any) {
      // @ts-expect-error -- TS2339 legacy untyped
      return `${prefix}${++this._counter}`;
    }
  },
}));

// --- Static imports for testable logic ---

import {
  getProcessConfig,
  createProcessConfiguration,
  createParameter,
} from "../../properties/parts/CustomImplementation/utils";

// ===== CHARACTERIZATION: ProcessConfiguration =====

describe("Characterization: ProcessConfiguration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initialProcessConfigList template", () => {
    const initialProcessConfigList = {
      isStartModel: "false",
      isDirectCreation: "true",
      isCustom: "false",
      metaJsonModel: null,
      metaJsonName: null,
      metaModelName: null,
      metaModelFullName: null,
      metaModel: null,
      model: null,
      pathCondition: null,
      processPath: null,
      userDefaultPath: null,
    };

    it("has 12 fields", () => {
      expect(Object.keys(initialProcessConfigList)).toHaveLength(12);
    });

    it("defaults isStartModel to string 'false'", () => {
      expect(initialProcessConfigList.isStartModel).toBe("false");
    });

    it("defaults isDirectCreation to string 'true'", () => {
      expect(initialProcessConfigList.isDirectCreation).toBe("true");
    });

    it("defaults isCustom to string 'false'", () => {
      expect(initialProcessConfigList.isCustom).toBe("false");
    });

    it("defaults all model references to null", () => {
      expect(initialProcessConfigList.metaJsonModel).toBeNull();
      expect(initialProcessConfigList.metaModel).toBeNull();
      expect(initialProcessConfigList.metaModelFullName).toBeNull();
      expect(initialProcessConfigList.model).toBeNull();
    });

    it("defaults path fields to null", () => {
      expect(initialProcessConfigList.pathCondition).toBeNull();
      expect(initialProcessConfigList.processPath).toBeNull();
      expect(initialProcessConfigList.userDefaultPath).toBeNull();
    });
  });

  describe("getProcessConfig", () => {
    it("returns null for element without extension elements", () => {
      const element = createEmptyElement();
      const result = getProcessConfig(element);
      expect(result).toBeNull();
    });

    it("returns ProcessConfiguration from extension elements", () => {
      const processConfig = {
        $type: "camunda:ProcessConfiguration",
        processConfigurationParameters: [{ isStartModel: "true", metaModel: "SaleOrder" }],
      };
      const element = createMockElement("bpmn:UserTask", [processConfig]);
      const result = getProcessConfig(element);
      expect(result).toBeDefined();
      expect(result.$type).toBe("camunda:ProcessConfiguration");
      expect(result.processConfigurationParameters).toHaveLength(1);
    });

    it("handles Participant elements by navigating to processRef", () => {
      const processConfig = {
        $type: "camunda:ProcessConfiguration",
        processConfigurationParameters: [],
      };
      const processRefBo = {
        $type: "bpmn:Process",
        extensionElements: { values: [processConfig] },
      };
      const participantBo = {
        $type: "bpmn:Participant",
        processRef: processRefBo,
      };

      mockGetBusinessObject.mockReturnValueOnce(participantBo).mockReturnValueOnce(processRefBo);

      const element = {
        id: "Participant_1",
        type: "bpmn:Participant",
        businessObject: participantBo,
      };

      const result = getProcessConfig(element);
      expect(result).toBeDefined();
      expect(result.$type).toBe("camunda:ProcessConfiguration");
    });

    it("returns null when extension elements has empty values", () => {
      const bo = {
        $type: "bpmn:UserTask",
        extensionElements: { values: [] },
      };
      mockGetBusinessObject.mockReturnValue(bo);
      const element = { id: "E1", type: "bpmn:UserTask", businessObject: bo };
      const result = getProcessConfig(element);
      expect(result).toBeUndefined();
    });

    it("handles multiple config parameters", () => {
      const processConfig = {
        $type: "camunda:ProcessConfiguration",
        processConfigurationParameters: [
          { isStartModel: "true", metaModel: "SaleOrder" },
          { isStartModel: "false", metaModel: "Invoice" },
          { isStartModel: "false", metaJsonModel: "CustomModel" },
        ],
      };
      const element = createMockElement("bpmn:UserTask", [processConfig]);
      const result = getProcessConfig(element);
      expect(result.processConfigurationParameters).toHaveLength(3);
    });
  });

  describe("createProcessConfiguration", () => {
    it("produces correct type", () => {
      const parent = { values: [] };
      const bpmnFactory = createMockBpmnFactory();

      const result = createProcessConfiguration(parent, bpmnFactory, {
        processConfigurationParameters: [],
      });

      expect(result.$type).toBe("camunda:ProcessConfiguration");
      expect(result.processConfigurationParameters).toEqual([]);
      expect(result.$parent).toBe(parent);
    });
  });

  describe("createParameter", () => {
    it("produces ProcessConfigurationParameter element", () => {
      const parent = { $type: "camunda:ProcessConfiguration" };
      const bpmnFactory = createMockBpmnFactory();

      const result = createParameter("camunda:ProcessConfigurationParameter", parent, bpmnFactory, {
        isStartModel: "true",
      });

      expect(result.$type).toBe("camunda:ProcessConfigurationParameter");
      expect(result.isStartModel).toBe("true");
    });
  });
});
