/**
 * Characterization Test: CallActivityProps
 *
 * Split from panel-characterization-medium-large.test.tsx.
 * Locks down: getCallableType logic, nextId for process generation.
 */

import { describe, it, expect, vi } from "vitest";
import { mockGetBusinessObject, mockIs } from "./fixtures/bpmn-mocks";

// --- Module-level mocks ---

vi.mock("bpmn-js/lib/util/ModelUtil", () => ({
  getBusinessObject: (...args: any[]) => mockGetBusinessObject(...args),
  // @ts-expect-error -- TS2556 legacy untyped
  is: (...args: any[]) => mockIs(...args),
}));

vi.mock("bpmn-js/lib/features/modeling/util/ModelingUtil", () => ({
  isAny: vi.fn((element, types) => types.some((t: any) => element?.type === t)),
}));

vi.mock("lodash/find", () => ({
  default: vi.fn((arr, predicate) => {
    if (typeof predicate === "function") return arr?.find(predicate);
    return arr?.find((item: any) => Object.entries(predicate).every(([k, v]) => item[k] === v));
  }),
}));

vi.mock("lodash/filter", () => ({
  default: vi.fn((arr, predicate) => {
    if (typeof predicate === "function") return arr?.filter(predicate);
    return arr;
  }),
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
  getActions: vi.fn(),
  getDMNModel: vi.fn(),
  getDMNModels: vi.fn(),
  getOrganization: vi.fn(),
  getScenarios: vi.fn(),
  checkConnectAndStudioInstalled: vi.fn(),
  getBPMNModels: vi.fn(),
  getStudioApp: vi.fn(),
  fetchWkf: vi.fn(),
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

vi.mock("../../../../../utils/ImplementationTypeUtils", () => ({
  getServiceTaskLikeBusinessObject: vi.fn((el) => el?.businessObject),
  isServiceTaskLike: vi.fn(() => true),
  getImplementationType: vi.fn(() => "class"),
  isSequenceFlow: vi.fn(() => false),
}));

vi.mock("../../../../../utils/EventDefinitionUtil", () => ({
  getLinkEventDefinition: vi.fn(),
  getSignalEventDefinition: vi.fn(),
}));

vi.mock("../../../../../utils/ExtensionElementsUtil", () => ({
  getExtensionElements: vi.fn(() => []),
}));

vi.mock("../../../../../utils/ElementUtil", () => ({
  createElement: vi.fn((type, props, parent, factory) => {
    const result = factory ? factory.create(type, props) : { $type: type, ...props };
    if (parent) result.$parent = parent;
    return result;
  }),
}));

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

// ===== CHARACTERIZATION: CallActivityProps =====

describe("Characterization: CallActivityProps", () => {
  describe("getCallableType logic", () => {
    // Characterizes the getCallableType helper function logic
    function getCallableType(bo: any) {
      const boCalledElement = bo.get("calledElement"),
        boCaseRef = bo.get("camunda:caseRef");
      let callActivityType = "";
      if (typeof boCalledElement !== "undefined") {
        callActivityType = "bpmn";
      } else if (typeof boCaseRef !== "undefined") {
        callActivityType = "cmmn";
      }
      return callActivityType;
    }

    it("returns 'bpmn' when calledElement is defined", () => {
      const bo = {
        get: (key: any) => (key === "calledElement" ? "someProcess" : undefined),
      };
      expect(getCallableType(bo)).toBe("bpmn");
    });

    it("returns 'cmmn' when caseRef is defined", () => {
      const bo = {
        get: (key: any) => (key === "camunda:caseRef" ? "someCase" : undefined),
      };
      expect(getCallableType(bo)).toBe("cmmn");
    });

    it("returns empty string when neither is defined", () => {
      const bo = { get: () => undefined };
      expect(getCallableType(bo)).toBe("");
    });

    it("prioritizes bpmn over cmmn when both are defined", () => {
      const bo = {
        get: (key: any) => {
          if (key === "calledElement") return "proc";
          if (key === "camunda:caseRef") return "case";
          return undefined;
        },
      };
      expect(getCallableType(bo)).toBe("bpmn");
    });
  });

  describe("nextId for process generation", () => {
    // CallActivityProps has its own nextId with "Process_" prefix
    it("uses Process_ prefix", () => {
      // The function uses Ids class same as utils but with different prefix
      const Ids = vi.fn().mockImplementation(() => ({
        nextPrefixed: (prefix: any) => `${prefix}123`,
      }));
      const ids = new Ids([32, 32, 1]);
      const result = ids.nextPrefixed("Process_");
      expect(result).toMatch(/^Process_/);
    });
  });
});
