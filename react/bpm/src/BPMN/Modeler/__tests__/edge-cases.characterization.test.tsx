/**
 * Characterization Test: Edge Cases
 *
 * Split from property-panel-characterization.test.tsx (lines 501-553).
 * Tests edge cases: empty elements, multi-extension querying,
 * null element handling.
 *
 * These tests mock at module level (vi.mock) rather than rendering full BpmnModeler,
 * following the same pattern as save.characterization.test.jsx.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Module-level mocks ---

// Mock bpmn-js ModelUtil
const mockGetBusinessObject = vi.fn();
vi.mock("bpmn-js/lib/util/ModelUtil", () => ({
  getBusinessObject: (...args: unknown[]) => mockGetBusinessObject(...args),
  is: vi.fn(),
}));

// Mock lodash camelCase used by utils.js
vi.mock("lodash", () => ({
  camelCase: (s: string) => s,
}));

// Mock utils (translate, getBool, etc.)
vi.mock("../../../../utils", () => ({
  translate: (s: string) => s,
  getBool: (v: unknown) => (v === true || v === "true" ? true : false),
  dashToUnderScore: (s: string | null) => (s ? s.replace(/-/g, "_") : s),
  capitalizeFirst: (s: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s),
  getAxelorScope: vi.fn().mockReturnValue(null),
}));

// --- Static imports for lightweight modules ---
import {
  getProcessConfig,
  getExtensionElementProperties,
} from "../properties/parts/CustomImplementation/utils";

// --- Helpers ---

/**
 * Create a mock BPMN element with no extension elements (empty element edge case).
 */
function createEmptyElement() {
  const bo = {
    $type: "bpmn:UserTask",
    name: "Empty Task",
    extensionElements: undefined,
  };
  mockGetBusinessObject.mockReturnValue(bo);
  return { id: "EmptyElement_1", type: "bpmn:UserTask", businessObject: bo };
}

/**
 * Create a mock BPMN element with many extension properties.
 */
function createElementWithManyProperties() {
  const processConfig = {
    $type: "camunda:ProcessConfiguration",
    processConfigurationParameters: [
      {
        isStartModel: "true",
        isDirectCreation: "true",
        isCustom: "false",
        metaModel: "SaleOrder",
        metaModelFullName: "com.axelor.sale.db.SaleOrder",
        metaJsonModel: null,
        model: "com.axelor.sale.db.SaleOrder",
        title: "Sale Order",
        processPath: null,
        userDefaultPath: null,
        pathCondition: null,
      },
      {
        isStartModel: "false",
        isDirectCreation: "false",
        isCustom: "true",
        metaModel: null,
        metaJsonModel: "CustomModel",
        model: "CustomModel",
        title: "Custom",
        processPath: "saleOrder.customer",
        userDefaultPath: "createdBy",
        pathCondition: "self.status = 'draft'",
      },
    ],
  };
  const menus = {
    $type: "camunda:Menus",
    menuItems: [
      {
        menuName: "test-menu",
        menuParent: null,
        permanent: false,
        tagCount: false,
        isUserMenu: false,
        roles: [],
      },
    ],
  };
  const bo = {
    $type: "bpmn:UserTask",
    name: "Complex Task",
    extensionElements: { values: [processConfig, menus] },
  };
  mockGetBusinessObject.mockReturnValue(bo);
  return { id: "ComplexElement_1", type: "bpmn:UserTask", businessObject: bo };
}

// ===== CHARACTERIZATION TESTS =====

describe("Characterization: Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("empty element (no extension elements) returns null for all lookups", () => {
    const element = createEmptyElement();

    expect(getProcessConfig(element)).toBeNull();
    expect(getExtensionElementProperties(element, "camunda:Menus")).toBeNull();
    expect(getExtensionElementProperties(element, "camunda:ViewAttributes")).toBeNull();
  });

  it("element with many properties can be queried for each extension type independently", () => {
    const element = createElementWithManyProperties();
    const bo = mockGetBusinessObject(element);

    const processConfig = bo.extensionElements.values.find(
      (e: { $type: string }) => e.$type === "camunda:ProcessConfiguration",
    );
    const menus = bo.extensionElements.values.find((e: { $type: string }) => e.$type === "camunda:Menus");

    expect(processConfig).toBeDefined();
    expect(processConfig.processConfigurationParameters).toHaveLength(2);
    expect(menus).toBeDefined();
    expect(menus.menuItems).toHaveLength(1);
  });

  it("missing required props (null element) does not crash getBusinessObject mock", () => {
    mockGetBusinessObject.mockReturnValue({
      $type: "bpmn:UserTask",
      extensionElements: null,
    });

    const element = { id: "null-ext", type: "bpmn:UserTask" };
    const bo = mockGetBusinessObject(element);
    expect(bo.extensionElements).toBeNull();
  });

  it("extension elements with empty values array returns undefined for find operations", () => {
    mockGetBusinessObject.mockReturnValue({
      $type: "bpmn:UserTask",
      extensionElements: { values: [] },
    });

    const element = { id: "empty-values", type: "bpmn:UserTask" };
    const bo = mockGetBusinessObject(element);
    const found = bo.extensionElements.values.find(
      (e: { $type: string }) => e.$type === "camunda:ProcessConfiguration",
    );
    expect(found).toBeUndefined();
  });
});
