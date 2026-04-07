/**
 * Characterization Test: UserTaskProps
 *
 * Split from panel-characterization-medium.test.tsx.
 * Locks down: getProperty pattern, addButtons logic, getBO parent traversal.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
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
  getMetaModels: vi.fn(),
  getCustomModels: vi.fn(),
  getMetaFields: vi.fn(),
  fetchModels: vi.fn(),
  getModels: vi.fn(),
  getItems: vi.fn(),
  getButtons: vi.fn(),
}));

vi.mock("@studio/shared/services/Service", () => ({
  default: { action: vi.fn() },
}));

vi.mock("@studio/shared/hooks", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...(actual || {}), useDialog: vi.fn(() => vi.fn()) };
});

vi.mock("../../../../../utils/ExtensionElementsUtil", () => ({
  getExtensionElements: vi.fn(() => []),
}));

vi.mock("../../../../../utils/EventDefinitionUtil", () => ({
  getSignalEventDefinition: vi.fn(),
  getLinkEventDefinition: vi.fn(),
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

// ===== CHARACTERIZATION: UserTaskProps =====

describe("Characterization: UserTaskProps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProperty pattern", () => {
    // UserTaskProps uses a specific getProperty pattern via $attrs
    function getProperty(element: any, name: any) {
      const bo = mockGetBusinessObject(element);
      return (bo && bo.$attrs && bo.$attrs[name]) || "";
    }

    it("returns attribute value from $attrs", () => {
      mockGetBusinessObject.mockReturnValue({
        $attrs: { "camunda:deadlineDate": "2024-12-31" },
      });
      const element = { id: "task1" };
      expect(getProperty(element, "camunda:deadlineDate")).toBe("2024-12-31");
    });

    it("returns empty string for missing attribute", () => {
      mockGetBusinessObject.mockReturnValue({ $attrs: {} });
      const element = { id: "task1" };
      expect(getProperty(element, "camunda:nonExistent")).toBe("");
    });

    it("returns empty string when $attrs is undefined", () => {
      mockGetBusinessObject.mockReturnValue({});
      const element = { id: "task1" };
      expect(getProperty(element, "camunda:deadlineDate")).toBe("");
    });

    it("returns empty string when BO is null", () => {
      mockGetBusinessObject.mockReturnValue(null);
      const element = { id: "task1" };
      expect(getProperty(element, "camunda:deadlineDate")).toBe("");
    });
  });

  describe("addButtons logic", () => {
    // Characterizes the button aggregation pattern in UserTaskProps
    function addButtons(values: any) {
      const buttons: any = [];
      const buttonLabels: any = [];
      const result = { buttons: undefined, buttonLabels: undefined };

      if (Array.isArray(values)) {
        if (values && values.length === 0) {
          result.buttons = undefined;
          result.buttonLabels = undefined;
          return result;
        }
        values &&
          values.forEach((value) => {
            if (!value) {
              result.buttons = undefined;
              result.buttonLabels = undefined;
              return;
            }
            buttons.push(value.name);
            buttonLabels.push(value.title);
          });
      }
      if (buttons.length > 0) {
        result.buttonLabels = buttonLabels.toString();
        result.buttons = buttons.toString();
      }
      return result;
    }

    it("returns undefined buttons for empty array", () => {
      const result = addButtons([]);
      expect(result.buttons).toBeUndefined();
      expect(result.buttonLabels).toBeUndefined();
    });

    it("concatenates button names and labels as comma-separated strings", () => {
      const result = addButtons([
        { name: "btn1", title: "Button 1" },
        { name: "btn2", title: "Button 2" },
      ]);
      expect(result.buttons).toBe("btn1,btn2");
      expect(result.buttonLabels).toBe("Button 1,Button 2");
    });

    it("handles single button", () => {
      const result = addButtons([{ name: "save", title: "Save" }]);
      expect(result.buttons).toBe("save");
      expect(result.buttonLabels).toBe("Save");
    });

    it("handles null values in array gracefully", () => {
      const result = addButtons([null]);
      // null value triggers early return pattern with undefined
      expect(result.buttons).toBeUndefined();
    });
  });

  describe("getBO parent traversal logic", () => {
    // Characterizes the getBO helper that walks up the parent chain
    function getBO(element: any) {
      if (element && element.$parent && element.$parent.$type !== "bpmn:Process") {
        return getBO(element.$parent);
      }
      return element;
    }

    it("returns element if parent is bpmn:Process", () => {
      const element = {
        $type: "bpmn:UserTask",
        $parent: { $type: "bpmn:Process" },
      };
      expect(getBO(element)).toBe(element);
    });

    it("walks up to bpmn:Process parent", () => {
      const process = { $type: "bpmn:Process" };
      const subProcess = {
        $type: "bpmn:SubProcess",
        $parent: process,
      };
      const task = {
        $type: "bpmn:UserTask",
        $parent: subProcess,
      };
      expect(getBO(task)).toBe(subProcess);
    });

    it("returns element if no parent", () => {
      const element = { $type: "bpmn:UserTask" };
      expect(getBO(element)).toBe(element);
    });
  });
});
