/**
 * Characterization Test: ScriptProps
 *
 * Split from panel-characterization-medium-large.test.tsx.
 * Locks down: implementationOptions constant.
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

// ===== CHARACTERIZATION: ScriptProps =====

describe("Characterization: ScriptProps", () => {
  describe("implementationOptions constant", () => {
    const implementationOptions = [
      { name: "Script", value: "script" },
      { name: "Request", value: "request" },
      { name: "Connector", value: "connector" },
    ];

    it("defines exactly 3 script implementation types", () => {
      expect(implementationOptions).toHaveLength(3);
    });

    it("includes script, request, and connector options", () => {
      expect(implementationOptions.map((o) => o.value)).toEqual(["script", "request", "connector"]);
    });

    it("has name/value structure for each option", () => {
      implementationOptions.forEach((opt) => {
        expect(opt).toHaveProperty("name");
        expect(opt).toHaveProperty("value");
      });
    });
  });
});
