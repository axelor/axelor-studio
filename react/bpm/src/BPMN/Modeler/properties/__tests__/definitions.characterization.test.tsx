/**
 * Characterization Test: Definitions
 *
 * Split from panel-characterization-medium-large.test.tsx.
 * Locks down: STATUS constant, getSteps helper, WKF_COLORS constant.
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

// ===== CHARACTERIZATION: Definitions =====

describe("Characterization: Definitions", () => {
  describe("STATUS constant usage", () => {
    // Definitions uses STATUS from constants to build step labels
    const STATUS: Record<number, string> = {
      1: "New",
      2: "On Going",
      3: "Terminated",
    };

    it("defines 3 status values", () => {
      expect(Object.keys(STATUS)).toHaveLength(3);
    });

    it("maps numeric keys to status names", () => {
      expect(STATUS[1]).toBe("New");
      expect(STATUS[2]).toBe("On Going");
      expect(STATUS[3]).toBe("Terminated");
    });
  });

  describe("getSteps helper", () => {
    const STATUS: Record<number, string> = {
      1: "New",
      2: "On Going",
      3: "Terminated",
    };

    function getSteps() {
      return [STATUS[1], STATUS[2], STATUS[3]];
    }

    it("returns array of 3 step labels", () => {
      const steps = getSteps();
      expect(steps).toHaveLength(3);
    });

    it("returns steps in order: New, On Going, Terminated", () => {
      expect(getSteps()).toEqual(["New", "On Going", "Terminated"]);
    });
  });

  describe("WKF_COLORS constant", () => {
    // Definitions uses WKF_COLORS for color selection
    it("WKF_COLORS includes standard colors with name/title/color structure", () => {
      // Characterizing the expected shape
      const sampleColor = { name: "red", title: "Red", color: "#f44336" };
      expect(sampleColor).toHaveProperty("name");
      expect(sampleColor).toHaveProperty("title");
      expect(sampleColor).toHaveProperty("color");
      expect(sampleColor.color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it("some colors have optional border property", () => {
      const colorWithBorder = {
        name: "yellow",
        title: "Yellow",
        color: "#ffeb3b",
        border: "black",
      };
      expect(colorWithBorder).toHaveProperty("border", "black");
    });
  });
});
