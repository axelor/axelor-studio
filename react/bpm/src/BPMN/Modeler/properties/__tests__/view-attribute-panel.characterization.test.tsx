/**
 * Characterization Test: ViewAttributePanel
 *
 * Split from panel-characterization-big.test.tsx.
 * Locks down: valueObj, itemsObj, nextId, FIELD_ATTRS, BOOL_ATTRIBUTES, STR_ATTRIBUTES,
 * NUM_ATTRIBUTES, ALL_ATTRIBUTES, BOOLEAN_OPTIONS, getExtensionElementProperties for ViewAttributes.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  mockGetBusinessObject,
  mockIs,
  createMockElement,
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
  nextId as utilsNextId,
} from "../../properties/parts/CustomImplementation/utils";
import {
  FIELD_ATTRS,
  BOOL_ATTRIBUTES,
  STR_ATTRIBUTES,
  NUM_ATTRIBUTES,
  ALL_ATTRIBUTES,
  BOOLEAN_OPTIONS,
} from "../../properties/parts/CustomImplementation/constants";

// ===== CHARACTERIZATION: ViewAttributePanel =====

describe("Characterization: ViewAttributePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("valueObj template", () => {
    const valueObj = {
      model: null,
      view: null,
      roles: [],
      items: [],
    };

    it("has 4 properties", () => {
      expect(Object.keys(valueObj)).toHaveLength(4);
    });

    it("defaults model and view to null", () => {
      expect(valueObj.model).toBeNull();
      expect(valueObj.view).toBeNull();
    });

    it("defaults roles and items to empty arrays", () => {
      expect(valueObj.roles).toEqual([]);
      expect(valueObj.items).toEqual([]);
    });
  });

  describe("itemsObj template", () => {
    const itemsObj = {
      itemName: null,
      attributeName: null,
      attributeValue: null,
    };

    it("has 3 properties", () => {
      expect(Object.keys(itemsObj)).toHaveLength(3);
    });

    it("defaults all fields to null", () => {
      expect(itemsObj.itemName).toBeNull();
      expect(itemsObj.attributeName).toBeNull();
      expect(itemsObj.attributeValue).toBeNull();
    });
  });

  describe("nextId (from utils)", () => {
    it("generates prefixed IDs", () => {
      const id = utilsNextId("viewAttributes_");
      expect(id).toMatch(/^viewAttributes_/);
    });

    it("generates IDs with the provided prefix", () => {
      const id1 = utilsNextId("viewAttributes_");
      const id2 = utilsNextId("process_");
      expect(id1).toMatch(/^viewAttributes_/);
      expect(id2).toMatch(/^process_/);
    });
  });

  describe("FIELD_ATTRS constant", () => {
    it("maps field types to attribute arrays", () => {
      expect(typeof FIELD_ATTRS).toBe("object");
    });

    it("defines attributes for panel type", () => {
      expect(FIELD_ATTRS.panel).toBeDefined();
      expect(FIELD_ATTRS.panel).toContain("hidden");
      expect(FIELD_ATTRS.panel).toContain("hideIf");
      expect(FIELD_ATTRS.panel).toContain("readonly");
      expect(FIELD_ATTRS.panel).toContain("collapse");
      expect(FIELD_ATTRS.panel).toContain("collapseIf");
      expect(FIELD_ATTRS.panel).toContain("active");
    });

    it("defines attributes for button type", () => {
      expect(FIELD_ATTRS.button).toBeDefined();
      expect(FIELD_ATTRS.button).toContain("hidden");
      expect(FIELD_ATTRS.button).toContain("prompt");
      expect(FIELD_ATTRS.button).toContain("icon");
    });

    it("defines attributes for relational type", () => {
      expect(FIELD_ATTRS.relational).toBeDefined();
      expect(FIELD_ATTRS.relational).toContain("domain");
      expect(FIELD_ATTRS.relational).toContain("url:set");
      expect(FIELD_ATTRS.relational).toContain("value:set");
    });

    it("defines attributes for self type", () => {
      expect(FIELD_ATTRS.self).toEqual(["readonly", "readonlyIf"]);
    });

    it("defines attributes for others (fallback) type", () => {
      expect(FIELD_ATTRS.others).toBeDefined();
      expect(FIELD_ATTRS.others).toContain("precision");
      expect(FIELD_ATTRS.others).toContain("scale");
      expect(FIELD_ATTRS.others).toContain("domain");
    });

    it("has exactly 5 field type categories", () => {
      expect(Object.keys(FIELD_ATTRS)).toHaveLength(5);
    });
  });

  describe("BOOL_ATTRIBUTES", () => {
    it("contains boolean attribute names", () => {
      expect(BOOL_ATTRIBUTES).toContain("readonly");
      expect(BOOL_ATTRIBUTES).toContain("hidden");
      expect(BOOL_ATTRIBUTES).toContain("required");
      expect(BOOL_ATTRIBUTES).toContain("active");
      expect(BOOL_ATTRIBUTES).toContain("collapse");
      expect(BOOL_ATTRIBUTES).toContain("refresh");
    });

    it("has exactly 6 entries", () => {
      expect(BOOL_ATTRIBUTES).toHaveLength(6);
    });
  });

  describe("STR_ATTRIBUTES", () => {
    it("contains string attribute names", () => {
      expect(STR_ATTRIBUTES).toContain("readonlyIf");
      expect(STR_ATTRIBUTES).toContain("hideIf");
      expect(STR_ATTRIBUTES).toContain("requiredIf");
      expect(STR_ATTRIBUTES).toContain("title");
      expect(STR_ATTRIBUTES).toContain("domain");
      expect(STR_ATTRIBUTES).toContain("css");
    });

    it("has exactly 16 entries", () => {
      expect(STR_ATTRIBUTES).toHaveLength(16);
    });
  });

  describe("NUM_ATTRIBUTES", () => {
    it("contains precision and scale", () => {
      expect(NUM_ATTRIBUTES).toContain("precision");
      expect(NUM_ATTRIBUTES).toContain("scale");
    });

    it("has exactly 2 entries", () => {
      expect(NUM_ATTRIBUTES).toHaveLength(2);
    });
  });

  describe("ALL_ATTRIBUTES", () => {
    it("combines all attribute categories", () => {
      expect(ALL_ATTRIBUTES.length).toBe(
        BOOL_ATTRIBUTES.length + NUM_ATTRIBUTES.length + STR_ATTRIBUTES.length,
      );
    });

    it("includes entries from each category", () => {
      expect(ALL_ATTRIBUTES).toContain("readonly"); // BOOL
      expect(ALL_ATTRIBUTES).toContain("precision"); // NUM
      expect(ALL_ATTRIBUTES).toContain("domain"); // STR
    });
  });

  describe("BOOLEAN_OPTIONS", () => {
    it("has true and false options", () => {
      expect(BOOLEAN_OPTIONS).toHaveLength(2);
      expect(BOOLEAN_OPTIONS[0]).toEqual({ name: "true", title: "True" });
      expect(BOOLEAN_OPTIONS[1]).toEqual({ name: "false", title: "False" });
    });
  });

  describe("getExtensionElementProperties for ViewAttributes", () => {
    it("returns ViewAttributes from extension", () => {
      const viewAttrs = {
        $type: "camunda:ViewAttributes",
        values: [
          {
            model: { name: "SaleOrder" },
            view: { name: "sale-order-form" },
            roles: [],
            items: [
              {
                itemName: "status",
                attributeName: "readonly",
                attributeValue: "true",
              },
            ],
          },
        ],
      };
      const element = createMockElement("bpmn:UserTask", [viewAttrs]);
      const result = getExtensionElementProperties(element, "camunda:ViewAttributes");
      expect(result).toBeDefined();
      expect(result.$type).toBe("camunda:ViewAttributes");
      expect(result.values).toHaveLength(1);
      expect(result.values[0].items[0].itemName).toBe("status");
    });

    it("returns undefined when ViewAttributes type not present", () => {
      const processConfig = {
        $type: "camunda:ProcessConfiguration",
        processConfigurationParameters: [],
      };
      const element = createMockElement("bpmn:UserTask", [processConfig]);
      const result = getExtensionElementProperties(element, "camunda:ViewAttributes");
      expect(result).toBeUndefined();
    });

    it("handles multiple items per view attribute value", () => {
      const viewAttrs = {
        $type: "camunda:ViewAttributes",
        values: [
          {
            model: { name: "SaleOrder" },
            view: { name: "sale-order-form" },
            roles: [{ name: "Admin" }, { name: "Manager" }],
            items: [
              { itemName: "status", attributeName: "readonly", attributeValue: "true" },
              { itemName: "amount", attributeName: "hidden", attributeValue: "true" },
              { itemName: "date", attributeName: "required", attributeValue: "true" },
            ],
          },
          {
            model: { name: "Invoice" },
            view: { name: "invoice-form" },
            roles: [],
            items: [],
          },
        ],
      };
      const element = createMockElement("bpmn:UserTask", [viewAttrs]);
      const result = getExtensionElementProperties(element, "camunda:ViewAttributes");
      expect(result.values).toHaveLength(2);
      expect(result.values[0].items).toHaveLength(3);
      expect(result.values[0].roles).toHaveLength(2);
      expect(result.values[1].items).toHaveLength(0);
    });
  });
});
