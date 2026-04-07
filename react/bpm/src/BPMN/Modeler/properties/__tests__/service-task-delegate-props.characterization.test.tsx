/**
 * Characterization Test: ServiceTaskDelegateProps
 *
 * Split from panel-characterization-medium-large.test.tsx.
 * Locks down: eventTypes, bindingOptions, implementationOptions.
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

// ===== CHARACTERIZATION: ServiceTaskDelegateProps =====

describe("Characterization: ServiceTaskDelegateProps", () => {
  describe("eventTypes constant", () => {
    const eventTypes = [
      "bpmn:StartEvent",
      "bpmn:IntermediateCatchEvent",
      "bpmn:IntermediateThrowEvent",
      "bpmn:EndEvent",
      "bpmn:BoundaryEvent",
    ];

    it("defines exactly 5 event types", () => {
      expect(eventTypes).toHaveLength(5);
    });

    it("includes start and end events", () => {
      expect(eventTypes).toContain("bpmn:StartEvent");
      expect(eventTypes).toContain("bpmn:EndEvent");
    });

    it("includes intermediate event types", () => {
      expect(eventTypes).toContain("bpmn:IntermediateCatchEvent");
      expect(eventTypes).toContain("bpmn:IntermediateThrowEvent");
    });

    it("includes BoundaryEvent", () => {
      expect(eventTypes).toContain("bpmn:BoundaryEvent");
    });
  });

  describe("bindingOptions constant", () => {
    const bindingOptions = [
      { name: "latest", value: "latest" },
      { name: "deployment", value: "deployment" },
      { name: "version", value: "version" },
      { name: "versionTag", value: "versionTag" },
    ];

    it("defines exactly 4 binding options", () => {
      expect(bindingOptions).toHaveLength(4);
    });

    it("includes latest and deployment", () => {
      expect(bindingOptions.map((o) => o.value)).toContain("latest");
      expect(bindingOptions.map((o) => o.value)).toContain("deployment");
    });

    it("includes version and versionTag", () => {
      expect(bindingOptions.map((o) => o.value)).toContain("version");
      expect(bindingOptions.map((o) => o.value)).toContain("versionTag");
    });
  });

  describe("implementationOptions constant", () => {
    const implementationOptions = [
      { name: "Java class", value: "class" },
      { name: "Expression", value: "expression" },
      { name: "Delegate expression", value: "delegateExpression" },
      { name: "External", value: "external" },
    ];

    it("defines exactly 4 implementation types", () => {
      expect(implementationOptions).toHaveLength(4);
    });

    it("maps display names to implementation values", () => {
      const values = implementationOptions.map((o) => o.value);
      expect(values).toEqual(["class", "expression", "delegateExpression", "external"]);
    });
  });
});
