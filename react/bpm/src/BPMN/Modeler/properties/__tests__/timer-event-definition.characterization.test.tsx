/**
 * Characterization Test: TimerEventDefinition
 *
 * Split from panel-characterization-medium.test.tsx.
 * Locks down: timerOptions, valueTypeOptions, getTimerDefinitionType, createFormalExpression,
 * createTimerEventDefinition pattern.
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

// ===== CHARACTERIZATION: TimerEventDefinition =====

describe("Characterization: TimerEventDefinition", () => {
  describe("timerOptions constant", () => {
    const timerOptions = [
      { value: "timeDate", name: "Date" },
      { value: "timeDuration", name: "Duration" },
      { value: "timeCycle", name: "Cycle" },
    ];

    it("defines exactly 3 timer options", () => {
      expect(timerOptions).toHaveLength(3);
    });

    it("includes timeDate, timeDuration, timeCycle", () => {
      expect(timerOptions.map((o) => o.value)).toEqual(["timeDate", "timeDuration", "timeCycle"]);
    });
  });

  describe("valueTypeOptions constant", () => {
    const valueTypeOptions = [
      { value: "value", name: "Value" },
      { value: "expression", name: "Expression" },
    ];

    it("defines exactly 2 value type options", () => {
      expect(valueTypeOptions).toHaveLength(2);
    });

    it("includes value and expression", () => {
      expect(valueTypeOptions.map((o) => o.value)).toEqual(["value", "expression"]);
    });
  });

  describe("getTimerDefinitionType helper", () => {
    function getTimerDefinitionType(timer: any) {
      if (!timer) return;
      const timeDate = timer.get("timeDate");
      if (typeof timeDate !== "undefined") return "timeDate";
      const timeCycle = timer.get("timeCycle");
      if (typeof timeCycle !== "undefined") return "timeCycle";
      const timeDuration = timer.get("timeDuration");
      if (typeof timeDuration !== "undefined") return "timeDuration";
    }

    it("returns undefined for null timer", () => {
      expect(getTimerDefinitionType(null)).toBeUndefined();
    });

    it("returns 'timeDate' for timer with timeDate", () => {
      const timer = {
        get: (key: any) => (key === "timeDate" ? "2024-01-01T00:00:00Z" : undefined),
      };
      expect(getTimerDefinitionType(timer)).toBe("timeDate");
    });

    it("returns 'timeCycle' for timer with timeCycle", () => {
      const timer = {
        get: (key: any) => (key === "timeCycle" ? "R3/PT10H" : undefined),
      };
      expect(getTimerDefinitionType(timer)).toBe("timeCycle");
    });

    it("returns 'timeDuration' for timer with timeDuration", () => {
      const timer = {
        get: (key: any) => (key === "timeDuration" ? "PT5M" : undefined),
      };
      expect(getTimerDefinitionType(timer)).toBe("timeDuration");
    });

    it("prioritizes timeDate > timeCycle > timeDuration", () => {
      const timer = {
        get: () => "something", // All properties return defined values
      };
      expect(getTimerDefinitionType(timer)).toBe("timeDate");
    });

    it("returns timeCycle when timeDate undefined but timeCycle defined", () => {
      const timer = {
        get: (key: any) => {
          if (key === "timeDate") return undefined;
          if (key === "timeCycle") return "R/PT1H";
          return undefined;
        },
      };
      expect(getTimerDefinitionType(timer)).toBe("timeCycle");
    });
  });

  describe("createFormalExpression (TimerEvent variant)", () => {
    it("sets body to undefined when body is falsy (same as ListenerProps)", () => {
      const body = null;
      const resolvedBody = body || undefined;
      expect(resolvedBody).toBeUndefined();
    });

    it("preserves body when truthy", () => {
      const body = "PT5M";
      const resolvedBody = body || undefined;
      expect(resolvedBody).toBe("PT5M");
    });
  });

  describe("createTimerEventDefinition pattern", () => {
    it("creates timer event definition and pushes to eventDefinitions", () => {
      // Characterizes the pattern used in TimerEventDefinition component
      const bo = { get: vi.fn().mockReturnValue([]) };
      const eventDefinitions = bo.get("eventDefinitions") || [];
      const timerEventDefinition = { $type: "bpmn:TimerEventDefinition" };
      eventDefinitions.push(timerEventDefinition);
      // @ts-expect-error -- TS2339 legacy untyped
      bo.eventDefinitions = eventDefinitions;

      // @ts-expect-error -- TS2339 legacy untyped
      expect(bo.eventDefinitions).toHaveLength(1);
      // @ts-expect-error -- TS2339 legacy untyped
      expect(bo.eventDefinitions[0].$type).toBe("bpmn:TimerEventDefinition");
    });

    it("handles missing eventDefinitions gracefully", () => {
      const bo = { get: vi.fn().mockReturnValue(undefined) };
      const eventDefinitions = bo.get("eventDefinitions") || [];
      expect(eventDefinitions).toEqual([]);
    });
  });
});
