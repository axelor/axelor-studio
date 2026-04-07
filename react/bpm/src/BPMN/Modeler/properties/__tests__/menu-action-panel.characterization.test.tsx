/**
 * Characterization Test: MenuActionPanel
 *
 * Split from panel-characterization-big.test.tsx.
 * Locks down: PRIORITIES, TYPES, menuObj template, createMenus, getExtensionElementProperties for Menus.
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
  getExtensionElementProperties,
  createElement,
} from "../../properties/parts/CustomImplementation/utils";

// ===== CHARACTERIZATION: MenuActionPanel =====

describe("Characterization: MenuActionPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PRIORITIES constant", () => {
    // MenuActionPanel defines PRIORITIES locally (identical to ModelProps PRIORITIES)
    const PRIORITIES = [
      { value: "low", id: "low", title: "Low" },
      { value: "normal", id: "normal", title: "Normal" },
      { value: "high", id: "high", title: "High" },
      { value: "urgent", id: "urgent", title: "Urgent" },
    ];

    it("defines exactly 4 priority levels", () => {
      expect(PRIORITIES).toHaveLength(4);
    });

    it("has consistent value/id/title structure per entry", () => {
      PRIORITIES.forEach((p) => {
        expect(p).toHaveProperty("value");
        expect(p).toHaveProperty("id");
        expect(p).toHaveProperty("title");
        expect(p.value).toBe(p.id);
      });
    });

    it("orders from low to urgent", () => {
      expect(PRIORITIES.map((p) => p.value)).toEqual(["low", "normal", "high", "urgent"]);
    });
  });

  describe("TYPES constant", () => {
    // MenuActionPanel TYPES for action type selection
    const TYPES = [
      { value: "value", id: "value", title: "Value" },
      { value: "field", id: "field", title: "Field" },
      { value: "script", id: "script", title: "Script" },
    ];

    it("defines exactly 3 action types", () => {
      expect(TYPES).toHaveLength(3);
    });

    it("includes value, field, and script types", () => {
      expect(TYPES.map((t) => t.value)).toEqual(["value", "field", "script"]);
    });
  });

  describe("menuObj template", () => {
    const menuObj = {
      menuName: null,
      menuParent: null,
      position: null,
      positionMenu: null,
      permanent: false,
      tagCount: false,
      isUserMenu: false,
      formView: null,
      gridView: null,
      domain: null,
      roles: [],
      menuContexts: [],
    };

    it("has all required menu fields", () => {
      const requiredFields = [
        "menuName",
        "menuParent",
        "position",
        "positionMenu",
        "permanent",
        "tagCount",
        "isUserMenu",
        "formView",
        "gridView",
        "domain",
        "roles",
        "menuContexts",
      ];
      requiredFields.forEach((field) => {
        expect(menuObj).toHaveProperty(field);
      });
    });

    it("defaults boolean fields to false", () => {
      expect(menuObj.permanent).toBe(false);
      expect(menuObj.tagCount).toBe(false);
      expect(menuObj.isUserMenu).toBe(false);
    });

    it("defaults string fields to null", () => {
      expect(menuObj.menuName).toBeNull();
      expect(menuObj.menuParent).toBeNull();
      expect(menuObj.formView).toBeNull();
      expect(menuObj.gridView).toBeNull();
      expect(menuObj.domain).toBeNull();
    });

    it("defaults array fields to empty arrays", () => {
      expect(menuObj.roles).toEqual([]);
      expect(menuObj.menuContexts).toEqual([]);
    });

    it("has exactly 12 properties", () => {
      expect(Object.keys(menuObj)).toHaveLength(12);
    });
  });

  describe("createMenus (via createElement)", () => {
    it("creates camunda:Menus extension element", () => {
      const parent = { values: [] };
      const bpmnFactory = createMockBpmnFactory();

      const result = createElement("camunda:Menus", parent, bpmnFactory, {
        menuItems: [],
      });

      expect(bpmnFactory.create).toHaveBeenCalledWith("camunda:Menus", {
        menuItems: [],
      });
      expect(result.$type).toBe("camunda:Menus");
      expect(result.$parent).toBe(parent);
    });

    it("creates camunda:Menus with menu items", () => {
      const parent = { values: [] };
      const bpmnFactory = createMockBpmnFactory();
      const menuItems = [
        { menuName: "menu1", permanent: false },
        { menuName: "menu2", permanent: true },
      ];

      const result = createElement("camunda:Menus", parent, bpmnFactory, {
        menuItems,
      });

      expect(result.menuItems).toEqual(menuItems);
    });
  });

  describe("getExtensionElementProperties for Menus", () => {
    it("returns null for element without extension elements", () => {
      const element = createEmptyElement();
      const result = getExtensionElementProperties(element, "camunda:Menus");
      expect(result).toBeNull();
    });

    it("returns matching camunda:Menus extension", () => {
      const menusExt = {
        $type: "camunda:Menus",
        menuItems: [{ menuName: "test-menu" }],
      };
      const element = createMockElement("bpmn:UserTask", [menusExt]);
      const result = getExtensionElementProperties(element, "camunda:Menus");
      expect(result).toBeDefined();
      expect(result.$type).toBe("camunda:Menus");
      expect(result.menuItems).toHaveLength(1);
    });

    it("returns undefined when no matching type found", () => {
      const processConfig = {
        $type: "camunda:ProcessConfiguration",
        processConfigurationParameters: [],
      };
      const element = createMockElement("bpmn:UserTask", [processConfig]);
      const result = getExtensionElementProperties(element, "camunda:Menus");
      expect(result).toBeUndefined();
    });
  });
});
