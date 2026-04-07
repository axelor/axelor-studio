/**
 * Sub-component Tests: Extracted sub-components from 5 medium-large panels
 *
 * Tests for logic extracted during decomposition of:
 * 1. ServiceTaskDelegateProps -> constants.js, DmnSection, DelegateFields, ActionsSection, ConnectSection
 * 2. CallActivityProps -> utils.js (nextId, getCallableType), CallLinkSection
 * 3. ScriptProps -> ScriptEditorSection, ModelSection
 * 4. ListenerProps -> utils.js (getListeners, getTimerDefinitionType, getTimerDefinition, createFormalExpression),
 *                     ListenerDetailSection, TimerSection
 * 5. Definitions -> PreviousVersionsSection
 *
 * Pure-render sub-components (no testable logic beyond JSX composition) are documented
 * but not independently tested -- they are covered by panel-level characterization tests.
 */

import { describe, it, expect, vi } from "vitest";

// --- Module-level mocks ---

vi.mock("bpmn-js/lib/util/ModelUtil", () => ({
  getBusinessObject: vi.fn((el) => el?.businessObject || el),
  is: vi.fn((element, type) => element?.type === type),
}));

vi.mock("bpmn-js/lib/features/modeling/util/ModelingUtil", () => ({
  isAny: vi.fn((element, types) => types.some((t: any) => element?.type === t)),
}));

vi.mock("lodash/find", () => ({
  default: (arr: any, predicate: any) => arr?.find(predicate),
}));

vi.mock("../../../../utils", () => ({
  translate: (s: any) => s,
  getBool: (v: any) => v === true || v === "true",
  dashToUnderScore: (s: any) => (s ? s.replace(/-/g, "_") : s),
  capitalizeFirst: (s: any) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s),
  getAxelorScope: vi.fn().mockReturnValue(null),
  getLowerCase: (s: any) => (s ? s.toLowerCase() : s),
}));

vi.mock("../../../../shared/services", () => ({
  getDMNModel: vi.fn(),
  getDMNModels: vi.fn(),
  getActions: vi.fn(),
  getOrganization: vi.fn(),
  getScenarios: vi.fn(),
  checkConnectAndStudioInstalled: vi.fn(),
  getBPMNModels: vi.fn(),
  getCustomModels: vi.fn(),
  getMetaModels: vi.fn(),
  getMetaFields: vi.fn(),
  fetchModels: vi.fn(),
  getAllModels: vi.fn(),
  getViews: vi.fn(),
  getStudioApp: vi.fn(),
  fetchWkf: vi.fn(),
}));

vi.mock("@studio/shared/services/Service", () => ({
  default: {
    search: vi.fn(),
    add: vi.fn(),
    action: vi.fn(),
  },
}));

vi.mock("ids", () => ({
  default: class MockIds {
    counter = 0;
    nextPrefixed(prefix: any) {
      return `${prefix}${++this.counter}`;
    }
  },
}));

vi.mock("../../../../utils/ElementUtil", () => ({
  createElement: vi.fn((_type, props) => ({ ...props })),
}));

vi.mock("../../../../utils/ExtensionElementsUtil", () => ({
  getExtensionElements: vi.fn((bo, type) => {
    if (!bo?.extensionElements?.values) return [];
    return bo.extensionElements.values.filter((v: any) => v.$type === type);
  }),
}));

vi.mock("../../../../utils/ImplementationTypeUtils", () => ({
  getServiceTaskLikeBusinessObject: vi.fn((el) => el?.businessObject || el),
  isServiceTaskLike: vi.fn(() => true),
  getImplementationType: vi.fn(() => "script"),
  isSequenceFlow: vi.fn(() => false),
}));

vi.mock("../../../../utils/EventDefinitionUtil", () => ({
  getLinkEventDefinition: vi.fn(() => null),
}));

vi.mock("../../../../components/Select", () => ({ default: () => null }));
vi.mock("../../../../components/Tooltip", () => ({ default: () => null }));
vi.mock("../../../../components/AlertDialog", () => ({ default: () => null }));
vi.mock("../../../../components/IconButton", () => ({ default: () => null }));
vi.mock("../../../../components/QueryBuilder", () => ({ default: () => null }));
vi.mock("../../../../components/Mapper", () => ({ default: () => null }));
vi.mock("../../../../components/StaticSelect", () => ({ default: () => null }));
vi.mock("../../../../components/Alert", () => ({ default: () => null }));
vi.mock("@studio/shared/hooks", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...(actual || {}), useDialog: vi.fn(() => vi.fn()) };
});
vi.mock("../../../../components/properties/components", () => ({
  TextField: () => null,
  Checkbox: () => null,
  Table: () => null,
  Textbox: () => null,
  SelectBox: () => null,
  FieldEditor: () => null,
  ExtensionElementTable: () => null,
}));
vi.mock("../../../connector-builder", () => ({ default: () => null }));

// ============================================================
// 1. ServiceTaskDelegateProps sub-components
// ============================================================

describe("ServiceTaskDelegateProps/constants", () => {
  it("can be imported from the sub-folder path", async () => {
    const constants =
      await import("../parts/CustomImplementation/ServiceTaskDelegateProps/constants");
    expect(typeof constants).toBe("object");
  });

  it("exports eventTypes array with 5 BPMN event types", async () => {
    const { eventTypes } =
      await import("../parts/CustomImplementation/ServiceTaskDelegateProps/constants");
    expect(eventTypes).toHaveLength(5);
    expect(eventTypes).toContain("bpmn:StartEvent");
    expect(eventTypes).toContain("bpmn:EndEvent");
    expect(eventTypes).toContain("bpmn:BoundaryEvent");
  });

  it("exports getBusinessObject function", async () => {
    const { getBusinessObject } =
      await import("../parts/CustomImplementation/ServiceTaskDelegateProps/constants");
    expect(typeof getBusinessObject).toBe("function");
  });

  it("exports bindingOptions with 4 options", async () => {
    const { bindingOptions } =
      await import("../parts/CustomImplementation/ServiceTaskDelegateProps/constants");
    expect(bindingOptions).toHaveLength(4);
    expect(bindingOptions.map((o) => o.value)).toEqual([
      "latest",
      "deployment",
      "version",
      "versionTag",
    ]);
  });

  it("exports implementationOptions with 4 options", async () => {
    const { implementationOptions } =
      await import("../parts/CustomImplementation/ServiceTaskDelegateProps/constants");
    expect(implementationOptions).toHaveLength(4);
    expect(implementationOptions.map((o) => o.value)).toEqual([
      "class",
      "expression",
      "delegateExpression",
      "external",
    ]);
  });
});

// ServiceTaskDelegateProps/DmnSection: Pure render component (DMN fields + dialog)
// Tested via panel-level characterization tests

// ServiceTaskDelegateProps/DelegateFields: Pure render component (class, expression, delegate, external fields)
// Tested via panel-level characterization tests

// ServiceTaskDelegateProps/ActionsSection: Pure render component (actions select)
// Tested via panel-level characterization tests

// ServiceTaskDelegateProps/ConnectSection: Pure render component (organization + scenario selects)
// Tested via panel-level characterization tests

// ============================================================
// 2. CallActivityProps sub-components
// ============================================================

describe("CallActivityProps/utils", () => {
  it("exports nextId that generates Process_ prefixed IDs", async () => {
    const { nextId } = await import("../parts/CustomImplementation/CallActivityProps/utils");
    const id = nextId();
    expect(id).toMatch(/^Process_/);
  });

  it("exports getCallableType that returns 'bpmn' for calledElement", async () => {
    const { getCallableType } =
      await import("../parts/CustomImplementation/CallActivityProps/utils");
    const bo = {
      get: (prop: any) => {
        if (prop === "calledElement") return "some-process";
        return undefined;
      },
    };
    expect(getCallableType(bo)).toBe("bpmn");
  });

  it("getCallableType returns 'cmmn' for caseRef", async () => {
    const { getCallableType } =
      await import("../parts/CustomImplementation/CallActivityProps/utils");
    const bo = {
      get: (prop: any) => {
        if (prop === "camunda:caseRef") return "some-case";
        return undefined;
      },
    };
    expect(getCallableType(bo)).toBe("cmmn");
  });

  it("getCallableType returns empty string when neither defined", async () => {
    const { getCallableType } =
      await import("../parts/CustomImplementation/CallActivityProps/utils");
    const bo = {
      get: () => undefined,
    };
    expect(getCallableType(bo)).toBe("");
  });
});

// CallActivityProps/CallLinkSection: Pure render component (model select, parent path, condition builder)
// Tested via panel-level characterization tests

// ============================================================
// 3. ScriptProps sub-components
// ============================================================

// ScriptProps/ScriptEditorSection: Pure render component (script textbox + builders)
// Tested via panel-level characterization tests

// ScriptProps/ModelSection: Pure render component (model/custom selects, display status)
// Tested via panel-level characterization tests

// ============================================================
// 4. ListenerProps sub-components
// ============================================================

describe("ListenerProps/utils", () => {
  it("exports CAMUNDA_EXECUTION_LISTENER_ELEMENT constant", async () => {
    const { CAMUNDA_EXECUTION_LISTENER_ELEMENT } =
      await import("../parts/CustomImplementation/ListenerProps/utils");
    expect(CAMUNDA_EXECUTION_LISTENER_ELEMENT).toBe("camunda:ExecutionListener");
  });

  it("exports CAMUNDA_TASK_LISTENER_ELEMENT constant", async () => {
    const { CAMUNDA_TASK_LISTENER_ELEMENT } =
      await import("../parts/CustomImplementation/ListenerProps/utils");
    expect(CAMUNDA_TASK_LISTENER_ELEMENT).toBe("camunda:TaskListener");
  });

  it("exports LISTENER_TYPE_LABEL with 4 types", async () => {
    const { LISTENER_TYPE_LABEL } =
      await import("../parts/CustomImplementation/ListenerProps/utils");
    expect(Object.keys(LISTENER_TYPE_LABEL)).toHaveLength(4);
    expect(typeof LISTENER_TYPE_LABEL.class).toBe("string");
    expect(typeof LISTENER_TYPE_LABEL.expression).toBe("string");
    expect(typeof LISTENER_TYPE_LABEL.delegateExpression).toBe("string");
    expect(typeof LISTENER_TYPE_LABEL.script).toBe("string");
  });

  it("exports timerOptions with 3 options", async () => {
    const { timerOptions } = await import("../parts/CustomImplementation/ListenerProps/utils");
    expect(timerOptions).toHaveLength(3);
    expect(timerOptions.map((o) => o.value)).toEqual(["timeDate", "timeDuration", "timeCycle"]);
  });

  it("getListeners returns empty array for null bo", async () => {
    const { getListeners } = await import("../parts/CustomImplementation/ListenerProps/utils");
    expect(getListeners(null, "camunda:ExecutionListener")).toEqual([]);
  });

  it("getListeners returns extension elements of specified type", async () => {
    const { getListeners } = await import("../parts/CustomImplementation/ListenerProps/utils");
    const bo = {
      extensionElements: {
        values: [
          { $type: "camunda:ExecutionListener", event: "start" },
          { $type: "camunda:TaskListener", event: "create" },
        ],
      },
    };
    const result = getListeners(bo, "camunda:ExecutionListener");
    expect(result).toHaveLength(1);
    expect(result[0].event).toBe("start");
  });

  it("getTimerDefinitionType returns 'timeDate' when timeDate is defined", async () => {
    const { getTimerDefinitionType } =
      await import("../parts/CustomImplementation/ListenerProps/utils");
    const timer = {
      get: (prop: any) => {
        if (prop === "timeDate") return "2024-01-01";
        return undefined;
      },
    };
    expect(getTimerDefinitionType(timer)).toBe("timeDate");
  });

  it("getTimerDefinitionType returns 'timeCycle' when timeCycle is defined", async () => {
    const { getTimerDefinitionType } =
      await import("../parts/CustomImplementation/ListenerProps/utils");
    const timer = {
      get: (prop: any) => {
        if (prop === "timeCycle") return "R3/PT10H";
        return undefined;
      },
    };
    expect(getTimerDefinitionType(timer)).toBe("timeCycle");
  });

  it("getTimerDefinitionType returns 'timeDuration' when timeDuration is defined", async () => {
    const { getTimerDefinitionType } =
      await import("../parts/CustomImplementation/ListenerProps/utils");
    const timer = {
      get: (prop: any) => {
        if (prop === "timeDuration") return "PT5M";
        return undefined;
      },
    };
    expect(getTimerDefinitionType(timer)).toBe("timeDuration");
  });

  it("getTimerDefinitionType returns undefined for null timer", async () => {
    const { getTimerDefinitionType } =
      await import("../parts/CustomImplementation/ListenerProps/utils");
    expect(getTimerDefinitionType(null)).toBeUndefined();
  });

  it("getTimerDefinitionType returns undefined when no definitions set", async () => {
    const { getTimerDefinitionType } =
      await import("../parts/CustomImplementation/ListenerProps/utils");
    const timer = {
      get: () => undefined,
    };
    expect(getTimerDefinitionType(timer)).toBeUndefined();
  });

  it("getTimerDefinition returns timer when not a function", async () => {
    const { getTimerDefinition } =
      await import("../parts/CustomImplementation/ListenerProps/utils");
    const timer = { timeDate: "2024-01-01" };
    expect(getTimerDefinition(timer, {}, null)).toBe(timer);
  });

  it("getTimerDefinition calls function when timer is function", async () => {
    const { getTimerDefinition } =
      await import("../parts/CustomImplementation/ListenerProps/utils");
    const mockFn = vi.fn().mockReturnValue({ timeCycle: "R3/PT10H" });
    const element = { id: "elem1" };
    const result = getTimerDefinition(mockFn, element, null);
    expect(mockFn).toHaveBeenCalledWith(element, null);
    expect(result).toEqual({ timeCycle: "R3/PT10H" });
  });

  it("createFormalExpression creates a FormalExpression element", async () => {
    const { createFormalExpression } =
      await import("../parts/CustomImplementation/ListenerProps/utils");
    const parent = {};
    const bpmnFactory = {};
    const result = createFormalExpression(parent, "body-text", bpmnFactory);
    expect(result).toBeDefined();
    expect(result.body).toBe("body-text");
  });

  it("createFormalExpression defaults body to undefined when empty", async () => {
    const { createFormalExpression } =
      await import("../parts/CustomImplementation/ListenerProps/utils");
    const result = createFormalExpression({}, undefined, {});
    expect(result.body).toBeUndefined();
  });
});

// ListenerProps/ListenerDetailSection: Pure render component (event type + script + mapper)
// Tested via panel-level characterization tests

// ListenerProps/TimerSection: Pure render component (timer definition type + value fields)
// Tested via panel-level characterization tests

// ============================================================
// 5. Definitions sub-components
// ============================================================

// Definitions/PreviousVersionsSection: Pure render component (version history table)
// Tested via panel-level characterization tests

// ============================================================
// 6. Barrel re-exports for 5 medium-large panels
// ============================================================

describe("Medium-large panel barrel re-exports", () => {
  it(
    "ServiceTaskDelegateProps barrel exports default",
    async () => {
      const mod = await import("../parts/CustomImplementation/ServiceTaskDelegateProps");
      expect(typeof mod.default).toBe("function");
    },
    15_000,
  );

  it(
    "CallActivityProps barrel exports default",
    async () => {
      const mod = await import("../parts/CustomImplementation/CallActivityProps");
      expect(typeof mod.default).toBe("function");
    },
    15_000,
  );

  it(
    "ScriptProps barrel exports default",
    async () => {
      const mod = await import("../parts/CustomImplementation/ScriptProps");
      expect(typeof mod.default).toBe("function");
    },
    15_000,
  );

  it(
    "ListenerProps barrel exports default",
    async () => {
      const mod = await import("../parts/CustomImplementation/ListenerProps");
      expect(typeof mod.default).toBe("function");
    },
    15_000,
  );

  it(
    "Definitions barrel exports default",
    async () => {
      const mod = await import("../parts/CustomImplementation/Definitions");
      expect(typeof mod.default).toBe("function");
    },
    15_000,
  );
});
