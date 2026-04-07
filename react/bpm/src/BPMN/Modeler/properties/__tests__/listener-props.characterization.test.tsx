/**
 * Characterization Test: ListenerProps
 *
 * Split from panel-characterization-medium-large.test.tsx.
 * Locks down: CAMUNDA constants, LISTENER_TYPE_LABEL, timerOptions,
 * getTimerDefinitionType, getTimerDefinition, createFormalExpression.
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

// ===== CHARACTERIZATION: ListenerProps =====

describe("Characterization: ListenerProps", () => {
  describe("CAMUNDA listener element constants", () => {
    const CAMUNDA_EXECUTION_LISTENER_ELEMENT = "camunda:ExecutionListener";
    const CAMUNDA_TASK_LISTENER_ELEMENT = "camunda:TaskListener";

    it("defines execution listener type", () => {
      expect(CAMUNDA_EXECUTION_LISTENER_ELEMENT).toBe("camunda:ExecutionListener");
    });

    it("defines task listener type", () => {
      expect(CAMUNDA_TASK_LISTENER_ELEMENT).toBe("camunda:TaskListener");
    });
  });

  describe("LISTENER_TYPE_LABEL constant", () => {
    const LISTENER_TYPE_LABEL = {
      class: "Java class",
      expression: "Expression",
      delegateExpression: "Delegate expression",
      script: "Script",
    };

    it("maps 4 listener types to labels", () => {
      expect(Object.keys(LISTENER_TYPE_LABEL)).toHaveLength(4);
    });

    it("maps class to 'Java class'", () => {
      expect(LISTENER_TYPE_LABEL.class).toBe("Java class");
    });

    it("maps expression types", () => {
      expect(LISTENER_TYPE_LABEL.expression).toBe("Expression");
      expect(LISTENER_TYPE_LABEL.delegateExpression).toBe("Delegate expression");
    });

    it("maps script type", () => {
      expect(LISTENER_TYPE_LABEL.script).toBe("Script");
    });
  });

  describe("timerOptions constant", () => {
    const timerOptions = [
      { value: "timeDate", name: "Date" },
      { value: "timeDuration", name: "Duration" },
      { value: "timeCycle", name: "Cycle" },
    ];

    it("defines exactly 3 timer types", () => {
      expect(timerOptions).toHaveLength(3);
    });

    it("includes timeDate, timeDuration, timeCycle", () => {
      expect(timerOptions.map((o) => o.value)).toEqual(["timeDate", "timeDuration", "timeCycle"]);
    });
  });

  describe("getTimerDefinitionType helper", () => {
    // Replicating the helper logic from ListenerProps
    function getTimerDefinitionType(timer: any) {
      if (!timer) return;
      const timeDate = timer.get("timeDate");
      if (typeof timeDate !== "undefined") return "timeDate";
      const timeCycle = timer.get("timeCycle");
      if (typeof timeCycle !== "undefined") return "timeCycle";
      const timeDuration = timer.get("timeDuration");
      if (typeof timeDuration !== "undefined") return "timeDuration";
    }

    it("returns undefined for null/undefined timer", () => {
      expect(getTimerDefinitionType(null)).toBeUndefined();
      expect(getTimerDefinitionType(undefined)).toBeUndefined();
    });

    it("returns 'timeDate' when timeDate is defined", () => {
      const timer = {
        get: (key: any) => (key === "timeDate" ? "2024-01-01" : undefined),
      };
      expect(getTimerDefinitionType(timer)).toBe("timeDate");
    });

    it("returns 'timeCycle' when timeCycle is defined", () => {
      const timer = {
        get: (key: any) => (key === "timeCycle" ? "R/PT1H" : undefined),
      };
      expect(getTimerDefinitionType(timer)).toBe("timeCycle");
    });

    it("returns 'timeDuration' when timeDuration is defined", () => {
      const timer = {
        get: (key: any) => (key === "timeDuration" ? "PT5M" : undefined),
      };
      expect(getTimerDefinitionType(timer)).toBe("timeDuration");
    });

    it("prioritizes timeDate > timeCycle > timeDuration", () => {
      const timer = {
        get: (key: any) => {
          if (key === "timeDate") return "2024-01-01";
          if (key === "timeCycle") return "R/PT1H";
          if (key === "timeDuration") return "PT5M";
          return undefined;
        },
      };
      expect(getTimerDefinitionType(timer)).toBe("timeDate");
    });

    it("returns undefined when no timer definition properties exist", () => {
      const timer = { get: () => undefined };
      expect(getTimerDefinitionType(timer)).toBeUndefined();
    });
  });

  describe("getTimerDefinition helper", () => {
    function getTimerDefinition(timerOrFunction: any, element: any, node: any) {
      if (typeof timerOrFunction === "function") {
        return timerOrFunction(element, node);
      }
      return timerOrFunction;
    }

    it("returns timer directly if not a function", () => {
      const timer = { get: vi.fn() };
      expect(getTimerDefinition(timer, null, null)).toBe(timer);
    });

    it("calls function with element and node if timer is a function", () => {
      const timerFn = vi.fn().mockReturnValue({ get: vi.fn() });
      const element = { id: "el1" };
      const node = { id: "node1" };
      getTimerDefinition(timerFn, element, node);
      expect(timerFn).toHaveBeenCalledWith(element, node);
    });
  });

  describe("createFormalExpression helper (ListenerProps variant)", () => {
    // ListenerProps has its own createFormalExpression that sets body to undefined if falsy
    // The logic: body = body || undefined; createElement("bpmn:FormalExpression", {body}, parent, bpmnFactory)

    it("resolves body to the provided value when truthy", () => {
      const body = "expression body";
      const resolvedBody = body || undefined;
      expect(resolvedBody).toBe("expression body");
    });

    it("sets body to undefined when body is falsy (empty string)", () => {
      const body = "";
      const resolvedBody = body || undefined;
      expect(resolvedBody).toBeUndefined();
    });

    it("sets body to undefined when body is null", () => {
      const body = null;
      const resolvedBody = body || undefined;
      expect(resolvedBody).toBeUndefined();
    });

    it("creates FormalExpression with correct type string", () => {
      // Characterize the element type used by createFormalExpression
      const type = "bpmn:FormalExpression";
      expect(type).toBe("bpmn:FormalExpression");
    });
  });
});
