/**
 * Sub-component Tests: Extracted sub-components from 4 medium panels
 *
 * Tests for logic extracted during decomposition of:
 * 1. VariableMapping -> utils.js (inOutTypeOptions, getInOutType, getVariableMappings, getMappings, getLabel, setOptionLabelValue)
 * 2. MultiInstanceProps -> utils.js (getLoopCharacteristics, lowerCaseFirstLetter, ensureMultiInstanceSupported, etc.)
 * 3. TimerEventDefinition -> utils.js (timerOptions, valueTypeOptions, getTimerDefinitionType, createFormalExpression)
 * 4. UserTaskProps -> barrel + orchestrator only (no sub-component extracted)
 *
 * Pure-render orchestrators with no testable logic beyond JSX composition are documented
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

vi.mock("lodash/filter", () => ({
  default: (arr: any, predicate: any) => arr?.filter(predicate),
}));

vi.mock("../../../../utils", () => ({
  translate: (s: any) => s,
  getBool: (v: any) => v === true || v === "true",
  getLowerCase: (s: any) => (s ? s.toLowerCase() : s),
}));

vi.mock("../../../../shared/services", () => ({
  getMetaFields: vi.fn(),
  getModels: vi.fn(),
  getButtons: vi.fn(),
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

vi.mock("../../../../utils/EventDefinitionUtil", () => ({
  getSignalEventDefinition: vi.fn(() => null),
}));

vi.mock("../../../../components/Select", () => ({ default: () => null }));
vi.mock("../../../../components/Tooltip", () => ({ default: () => null }));
vi.mock("../../../../components/AlertDialog", () => ({ default: () => null }));
vi.mock("../../../../components/QueryBuilder", () => ({ default: () => null }));
vi.mock("../../../../components/TimerBuilder", () => ({ default: () => null }));
vi.mock("@studio/shared/hooks", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...(actual || {}), useDialog: vi.fn(() => vi.fn()) };
});
vi.mock("../../../../components/properties/components", () => ({
  TextField: () => null,
  Checkbox: () => null,
  Textbox: () => null,
  SelectBox: () => null,
  FieldEditor: () => null,
  ExtensionElementTable: () => null,
}));
vi.mock("../../../../components/properties/components/TextField", () => ({ default: () => null }));
vi.mock("../../../../components/properties/components/Textbox", () => ({ default: () => null }));
vi.mock("../../../../components/expression-builder/components", () => ({
  Selection: () => null,
}));
vi.mock("../../components/CollapsePanel", () => ({ default: () => null }));

// ============================================================
// 1. VariableMapping sub-components
// ============================================================

describe("VariableMapping/utils", () => {
  it("exports inOutTypeOptions with 3 options (Source, Source expression, All)", async () => {
    const { inOutTypeOptions } =
      await import("../parts/CustomImplementation/VariableMapping/utils");
    expect(inOutTypeOptions).toHaveLength(3);
    expect(inOutTypeOptions.map((o) => o.value)).toEqual([
      "source",
      "sourceExpression",
      "variables",
    ]);
  });

  it("exports CAMUNDA_IN/OUT extension element constants", async () => {
    const { CAMUNDA_IN_EXTENSION_ELEMENT, CAMUNDA_OUT_EXTENSION_ELEMENT } =
      await import("../parts/CustomImplementation/VariableMapping/utils");
    expect(CAMUNDA_IN_EXTENSION_ELEMENT).toBe("camunda:In");
    expect(CAMUNDA_OUT_EXTENSION_ELEMENT).toBe("camunda:Out");
  });

  it("getInOutType returns 'variables' when mapping.variables is 'all'", async () => {
    const { getInOutType } = await import("../parts/CustomImplementation/VariableMapping/utils");
    expect(getInOutType({ variables: "all" })).toBe("variables");
  });

  it("getInOutType returns 'source' when mapping.source is defined", async () => {
    const { getInOutType } = await import("../parts/CustomImplementation/VariableMapping/utils");
    expect(getInOutType({ source: "someValue" })).toBe("source");
  });

  it("getInOutType returns 'sourceExpression' when sourceExpression is defined", async () => {
    const { getInOutType } = await import("../parts/CustomImplementation/VariableMapping/utils");
    expect(getInOutType({ sourceExpression: "${expr}" })).toBe("sourceExpression");
  });

  it("getInOutType returns undefined for null mapping", async () => {
    const { getInOutType } = await import("../parts/CustomImplementation/VariableMapping/utils");
    expect(getInOutType(null)).toBeUndefined();
  });

  it("getLabel returns 'all' for variables mapping", async () => {
    const { getLabel } = await import("../parts/CustomImplementation/VariableMapping/utils");
    expect(getLabel({ variables: "all", target: "x" })).toBe("all");
  });

  it("getLabel returns target := source for source mapping", async () => {
    const { getLabel } = await import("../parts/CustomImplementation/VariableMapping/utils");
    expect(getLabel({ source: "myVar", target: "outVar" })).toBe("outVar := myVar");
  });

  it("getLabel returns target := sourceExpression for sourceExpression mapping", async () => {
    const { getLabel } = await import("../parts/CustomImplementation/VariableMapping/utils");
    expect(getLabel({ sourceExpression: "${x}", target: "y" })).toBe("y := ${x}");
  });

  it("getLabel uses <undefined> when target is missing", async () => {
    const { getLabel } = await import("../parts/CustomImplementation/VariableMapping/utils");
    expect(getLabel({ source: "val" })).toBe("<undefined> := val");
  });

  it("getMappings returns empty array for null bo", async () => {
    const { getMappings } = await import("../parts/CustomImplementation/VariableMapping/utils");
    expect(getMappings(null, "camunda:In")).toEqual([]);
  });

  it("setOptionLabelValue returns a function that generates labels", async () => {
    const { setOptionLabelValue } =
      await import("../parts/CustomImplementation/VariableMapping/utils");
    const labelFn = setOptionLabelValue("camunda:In", {});
    expect(typeof labelFn).toBe("function");
  });
});

// VariableMapping/VariableMapping.jsx: Pure render orchestrator (in/out tables + type select + fields)
// Tested via panel-level characterization tests

// ============================================================
// 2. MultiInstanceProps sub-components
// ============================================================

describe("MultiInstanceProps/utils", () => {
  it("exports lowerCaseFirstLetter that lowercases first char", async () => {
    const { lowerCaseFirstLetter } =
      await import("../parts/CustomImplementation/MultiInstanceProps/utils");
    expect(lowerCaseFirstLetter("Hello")).toBe("hello");
    expect(lowerCaseFirstLetter("ABC")).toBe("aBC");
  });

  it("lowerCaseFirstLetter returns undefined for falsy input", async () => {
    const { lowerCaseFirstLetter } =
      await import("../parts/CustomImplementation/MultiInstanceProps/utils");
    expect(lowerCaseFirstLetter("")).toBeUndefined();
    expect(lowerCaseFirstLetter(null)).toBeUndefined();
    expect(lowerCaseFirstLetter(undefined)).toBeUndefined();
  });

  it("getLoopCharacteristics returns loopCharacteristics from BO", async () => {
    const { getLoopCharacteristics } =
      await import("../parts/CustomImplementation/MultiInstanceProps/utils");
    const element = {
      businessObject: {
        loopCharacteristics: { $type: "bpmn:MultiInstanceLoopCharacteristics" },
      },
    };
    const result = getLoopCharacteristics(element);
    expect(result.$type).toBe("bpmn:MultiInstanceLoopCharacteristics");
  });

  it("getLoopCharacteristics returns falsy when no BO", async () => {
    const { getLoopCharacteristics } =
      await import("../parts/CustomImplementation/MultiInstanceProps/utils");
    expect(getLoopCharacteristics(null)).toBeFalsy();
  });

  it("ensureMultiInstanceSupported returns false when no loopCharacteristics", async () => {
    const { ensureMultiInstanceSupported } =
      await import("../parts/CustomImplementation/MultiInstanceProps/utils");
    const element = { businessObject: {} };
    expect(ensureMultiInstanceSupported(element)).toBeFalsy();
  });

  it("getBody returns body from expression", async () => {
    const { getBody } = await import("../parts/CustomImplementation/MultiInstanceProps/utils");
    const expr = { get: (prop: any) => (prop === "body" ? "test-body" : undefined) };
    expect(getBody(expr)).toBe("test-body");
  });

  it("getBody returns falsy for null expression", async () => {
    const { getBody } = await import("../parts/CustomImplementation/MultiInstanceProps/utils");
    expect(getBody(null)).toBeFalsy();
  });

  it("getBO traverses up to Process parent", async () => {
    const { getBO } = await import("../parts/CustomImplementation/MultiInstanceProps/utils");
    const process = { $type: "bpmn:Process" };
    const child = { $parent: { $type: "bpmn:SubProcess", $parent: process } };
    expect(getBO(child)).toBe(process);
  });

  it("createFormalExpression creates element with body", async () => {
    const { createFormalExpression } =
      await import("../parts/CustomImplementation/MultiInstanceProps/utils");
    const result = createFormalExpression({}, "test-body", {});
    expect(result.body).toBe("test-body");
  });

  it("getProcessConfig returns criteria with IN operator", async () => {
    const { getProcessConfig } =
      await import("../parts/CustomImplementation/MultiInstanceProps/utils");
    // Element with no businessObject parent will trigger noOptions path
    const element = { businessObject: { $parent: { $type: "bpmn:Process" } } };
    const result = getProcessConfig(element);
    expect(result.criteria).toBeDefined();
    expect(result.criteria[0].operator).toBe("IN");
    expect(result.operator).toBe("or");
  });
});

// MultiInstanceProps/MultiInstanceProps.jsx: Pure render orchestrator (cardinality + collection + element variable fields)
// Tested via panel-level characterization tests

// ============================================================
// 3. TimerEventDefinition sub-components
// ============================================================

describe("TimerEventDefinition/utils", () => {
  it("exports timerOptions with 3 options (Date, Duration, Cycle)", async () => {
    const { timerOptions } =
      await import("../parts/CustomImplementation/TimerEventDefinition/utils");
    expect(timerOptions).toHaveLength(3);
    expect(timerOptions.map((o) => o.value)).toEqual(["timeDate", "timeDuration", "timeCycle"]);
  });

  it("exports valueTypeOptions with 2 options (Value, Expression)", async () => {
    const { valueTypeOptions } =
      await import("../parts/CustomImplementation/TimerEventDefinition/utils");
    expect(valueTypeOptions).toHaveLength(2);
    expect(valueTypeOptions.map((o) => o.value)).toEqual(["value", "expression"]);
  });

  it("getTimerDefinitionType returns 'timeDate' when timeDate defined", async () => {
    const { getTimerDefinitionType } =
      await import("../parts/CustomImplementation/TimerEventDefinition/utils");
    const timer = {
      get: (prop: any) => (prop === "timeDate" ? "2024-01-01" : undefined),
    };
    expect(getTimerDefinitionType(timer)).toBe("timeDate");
  });

  it("getTimerDefinitionType returns 'timeCycle' when timeCycle defined", async () => {
    const { getTimerDefinitionType } =
      await import("../parts/CustomImplementation/TimerEventDefinition/utils");
    const timer = {
      get: (prop: any) => (prop === "timeCycle" ? "R3/PT10H" : undefined),
    };
    expect(getTimerDefinitionType(timer)).toBe("timeCycle");
  });

  it("getTimerDefinitionType returns 'timeDuration' when timeDuration defined", async () => {
    const { getTimerDefinitionType } =
      await import("../parts/CustomImplementation/TimerEventDefinition/utils");
    const timer = {
      get: (prop: any) => (prop === "timeDuration" ? "PT5M" : undefined),
    };
    expect(getTimerDefinitionType(timer)).toBe("timeDuration");
  });

  it("getTimerDefinitionType returns undefined for null timer", async () => {
    const { getTimerDefinitionType } =
      await import("../parts/CustomImplementation/TimerEventDefinition/utils");
    expect(getTimerDefinitionType(null)).toBeUndefined();
  });

  it("getTimerDefinitionType returns undefined when no definitions set", async () => {
    const { getTimerDefinitionType } =
      await import("../parts/CustomImplementation/TimerEventDefinition/utils");
    const timer = { get: () => undefined };
    expect(getTimerDefinitionType(timer)).toBeUndefined();
  });

  it("createFormalExpression creates element with body", async () => {
    const { createFormalExpression } =
      await import("../parts/CustomImplementation/TimerEventDefinition/utils");
    const result = createFormalExpression({}, "PT5M", {});
    expect(result.body).toBe("PT5M");
  });

  it("createFormalExpression defaults body to undefined when empty string", async () => {
    const { createFormalExpression } =
      await import("../parts/CustomImplementation/TimerEventDefinition/utils");
    const result = createFormalExpression({}, "", {});
    expect(result.body).toBeUndefined();
  });
});

// TimerEventDefinition/TimerEventDefinition.jsx: Pure render orchestrator (timer type select + value/expression fields + builders)
// Tested via panel-level characterization tests

// ============================================================
// 4. UserTaskProps
// ============================================================

// UserTaskProps: Decomposed as barrel + orchestrator only (363L, just over threshold).
// No sub-component or utils extracted. Tested via panel-level characterization tests.

// ============================================================
// 5. Barrel re-exports for 4 medium panels
// ============================================================

describe("Medium panel barrel re-exports", () => {
  it(
    "VariableMapping barrel exports default",
    async () => {
      const mod = await import("../parts/CustomImplementation/VariableMapping");
      expect(typeof mod.default).toBe("function");
    },
    15_000,
  );

  it(
    "MultiInstanceProps barrel exports default",
    async () => {
      const mod = await import("../parts/CustomImplementation/MultiInstanceProps");
      expect(typeof mod.default).toBe("function");
    },
    15_000,
  );

  it(
    "TimerEventDefinition barrel exports default",
    async () => {
      const mod = await import("../parts/CustomImplementation/TimerEventDefinition");
      expect(typeof mod.default).toBe("function");
    },
    15_000,
  );

  it(
    "UserTaskProps barrel exports default",
    async () => {
      const mod = await import("../parts/CustomImplementation/UserTaskProps");
      expect(typeof mod.default).toBe("function");
    },
    15_000,
  );
});
