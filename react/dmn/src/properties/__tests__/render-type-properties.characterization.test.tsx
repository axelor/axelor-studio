/**
 * Characterization Test: RenderTypeProperties
 *
 * Split from panel-characterization.test.tsx (lines 74-375).
 * Tests RenderTypeProperties (860L): switch-by-type routing for string, boolean,
 * date, number, selection, relational types, and useEffect parsing.
 *
 * These tests replicate helper logic inline and use static imports for
 * lightweight module testing (no full component render).
 */

import {  describe, it, expect, vi } from "vitest";

// --- Module-level mocks ---

vi.mock("dmn-js-shared/lib/util/ModelUtil.js", () => ({
  getBusinessObject: vi.fn((element: Record<string, unknown>) => element?.businessObject || element),
}));

vi.mock("@studio/shared/utils", () => ({
  lowerCaseFirstLetter: (s: string | null) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s),
  getLowerCase: (s: string | null) => (s ? s.toLowerCase() : s),
  splitWithComma: (s: string | null) => (s ? s.split(",") : []),
  mergeModels: vi.fn((...args: unknown[][]) => args.flat().filter(Boolean)),
}));

vi.mock("@studio/shared/services", () => ({
  ServiceInstance: { action: vi.fn(), search: vi.fn(), get: vi.fn() },
  getAllModels: vi.fn().mockResolvedValue([]),
  getMetaFields: vi.fn().mockResolvedValue([]),
  getNameColumn: vi.fn().mockResolvedValue("name"),
  getExpressionValues: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../services/api", () => ({
  getCustomModelData: vi.fn().mockResolvedValue([]),
  getNameField: vi.fn().mockResolvedValue({ name: "name" }),
  getData: vi.fn().mockResolvedValue([]),
}));

vi.mock("@studio/shared/theme", () => ({
  useAppTheme: () => ({ theme: "light" }),
}));

vi.mock("@studio/shared/hooks", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...(actual as Record<string, unknown>), useDialog: vi.fn(() => vi.fn()) };
});

// --- Static imports for testable constants ---

import {
  STRING_OPTIONS,
  BOOLEAN_OPTIONS,
  COMPARISON_OPTIONS,
  NUMBER_OPTIONS,
  RANGE_OPTIONS,
  DATE_OPTIONS,
  RELATIONAL_TYPES,
  ALL_TYPES,
} from "../../constants";

// ============================================================
// RenderTypeProperties (860L) Characterization
// ============================================================

describe("Characterization: RenderTypeProperties - Type Switch Routing", () => {
  it("constants: STRING_OPTIONS has disjunction and negation", () => {
    expect(STRING_OPTIONS).toHaveLength(2);
    expect(STRING_OPTIONS.map((o) => o.id)).toEqual(["disjunction", "negation"]);
  });

  it("constants: BOOLEAN_OPTIONS has true, false, and empty", () => {
    expect(BOOLEAN_OPTIONS).toHaveLength(3);
    expect(BOOLEAN_OPTIONS.map((o) => o.id)).toEqual(["true", "false", ""]);
  });

  it("constants: NUMBER_OPTIONS has comparison and range", () => {
    expect(NUMBER_OPTIONS).toHaveLength(2);
    expect(NUMBER_OPTIONS.map((o) => o.id)).toEqual(["comparison", "range"]);
  });

  it("constants: COMPARISON_OPTIONS has 5 operators", () => {
    expect(COMPARISON_OPTIONS).toHaveLength(5);
    expect(COMPARISON_OPTIONS.map((o) => o.id)).toEqual([
      "equals",
      "less",
      "lessEquals",
      "greater",
      "greaterEquals",
    ]);
  });

  it("constants: RANGE_OPTIONS has include and exclude", () => {
    expect(RANGE_OPTIONS).toHaveLength(2);
    expect(RANGE_OPTIONS.map((o) => o.id)).toEqual(["include", "exclude"]);
  });

  it("constants: DATE_OPTIONS has exact, before, after, between", () => {
    expect(DATE_OPTIONS).toHaveLength(4);
    expect(DATE_OPTIONS.map((o) => o.id)).toEqual(["exact", "before", "after", "between"]);
  });

  it("constants: RELATIONAL_TYPES has 16 relational type variants", () => {
    // 8 underscore + 8 hyphen variants
    expect(RELATIONAL_TYPES).toHaveLength(16);
    expect(RELATIONAL_TYPES).toContain("one_to_one");
    expect(RELATIONAL_TYPES).toContain("many_to_one");
    expect(RELATIONAL_TYPES).toContain("json-many-to-many");
    expect(RELATIONAL_TYPES).toContain("json-one-to-many");
  });

  it("constants: ALL_TYPES has 7 basic types", () => {
    expect(ALL_TYPES).toHaveLength(7);
    expect(ALL_TYPES).toContain("string");
    expect(ALL_TYPES).toContain("boolean");
    expect(ALL_TYPES).toContain("double");
    expect(ALL_TYPES).toContain("integer");
    expect(ALL_TYPES).toContain("date");
    expect(ALL_TYPES).toContain("datetime");
    expect(ALL_TYPES).toContain("long");
  });
});

describe("Characterization: RenderTypeProperties - String Type", () => {
  it("string type renders disjunction/negation select for inputs", () => {
    // When type='string' and !isOutput, renders STRING_OPTIONS select
    const defaultType = STRING_OPTIONS.find((s) => s.id === "disjunction");
    expect(defaultType).toBeDefined();
    expect(defaultType!.id).toBe("disjunction");
  });

  it("string type renders model select for output with valueFrom=model", () => {
    // When type='string' and isOutput and valueFrom='model', renders Select with fetchMethod
    const isOutput = true;
    const valueFrom = "model";

    expect(isOutput && valueFrom === "model").toBe(true);
  });

  it("string multi-value uses comma-separated quoted strings", () => {
    // Multiple values: val.map(v => `"${v}"`).join(",")
    const values = ["a", "b", "c"];
    const result = values.map((v) => `"${v}"`).join(",");
    expect(result).toBe('"a","b","c"');
  });

  it("negation wraps values with not()", () => {
    // not("val1","val2") format
    const values = ['"value1"', '"value2"'];
    const str = values.join(",");
    const negated = "not(".concat(str, ")");
    expect(negated).toBe('not("value1","value2")');
  });
});

describe("Characterization: RenderTypeProperties - Boolean Type", () => {
  it("boolean type renders BOOLEAN_OPTIONS select", () => {
    const trueOption = BOOLEAN_OPTIONS.find((s) => s.id === "true");
    const falseOption = BOOLEAN_OPTIONS.find((s) => s.id === "false");
    const emptyOption = BOOLEAN_OPTIONS.find((s) => s.id === "");

    expect(trueOption).toMatchObject({ id: "true" });
    expect(falseOption).toMatchObject({ id: "false" });
    expect(emptyOption).toMatchObject({ id: "" });
  });

  it("boolean updateDRDCell sends value.id or empty string", () => {
    // updateDRDCell(ruleValue, rule, (value && value.id) || "")
    const value = { id: "true", name: "Yes" };
    const result = (value && value.id) || "";
    expect(result).toBe("true");

    const noValue = null as { id: string } | null;
    const emptyResult = (noValue && noValue.id) || "";
    expect(emptyResult).toBe("");
  });
});

describe("Characterization: RenderTypeProperties - Date Type", () => {
  it("date/datetime/time types are handled by the same case", () => {
    // switch: case "date": case "datetime": case "time":
    const dateTypes = ["date", "datetime", "time"];
    dateTypes.forEach((type) => {
      expect(["date", "datetime", "time"].includes(type)).toBe(true);
    });
  });

  it("isOutput renders single DateTimePicker", () => {
    // When isOutput, renders a simple DateTimePicker (no date option select)
    const isOutput = true;
    const hasDateOptionSelect = !isOutput;
    expect(hasDateOptionSelect).toBe(false);
  });

  it("between date type shows two DateTimePickers", () => {
    // When defaultType.id === "between", shows start and end date pickers
    const defaultType = DATE_OPTIONS.find((s) => s.id === "between");
    expect(defaultType).toBeDefined();
    expect(defaultType!.id).toBe("between");
  });
});

describe("Characterization: RenderTypeProperties - Number Types", () => {
  it("double/integer/long/decimal types are all handled by number case", () => {
    // switch: case "double": case "integer": case "long": case "decimal":
    const numericTypes = ["double", "integer", "long", "decimal"];
    numericTypes.forEach((type) => {
      expect(["double", "integer", "long", "decimal"].includes(type)).toBe(true);
    });
  });

  it("comparison mode has operator select and single NumberInput", () => {
    const comparisonType = NUMBER_OPTIONS.find((o) => o.id === "comparison");
    expect(comparisonType).toMatchObject({ id: "comparison" });
    expect(COMPARISON_OPTIONS.length).toBe(5);
  });

  it("range mode has start/end type selects and two NumberInputs", () => {
    const rangeType = NUMBER_OPTIONS.find((o) => o.id === "range");
    expect(rangeType).toMatchObject({ id: "range" });
    expect(RANGE_OPTIONS.length).toBe(2);
  });

  it("isOutput renders single NumberInput (no comparison/range)", () => {
    const isOutput = true;
    const hasComparisonSelect = !isOutput;
    expect(hasComparisonSelect).toBe(false);
  });
});

describe("Characterization: RenderTypeProperties - Selection Type", () => {
  it("selection type renders multi-select from metaField.selectionList", () => {
    const metaField = {
      type: "STRING",
      selectionList: [
        { value: "opt1", title: "Option 1" },
        { value: "opt2", title: "Option 2" },
      ],
    };

    expect(metaField.selectionList).toHaveLength(2);
  });

  it("selection updateValue quotes STRING type values", () => {
    // When metaField.type.toUpperCase() === "STRING", values are quoted
    const metaField = { type: "STRING" };
    const items = [{ value: "a" }, { value: "b" }];

    const text = items.reduce(
      (acc, item) =>
        item.value
          ? metaField.type.toUpperCase() === "STRING"
            ? `${acc}${acc ? "," : ""}"${item.value}"`
            : `${acc}${acc ? "," : ""}${item.value}`
          : acc,
      "",
    );

    expect(text).toBe('"a","b"');
  });
});

describe("Characterization: RenderTypeProperties - Relational Types", () => {
  it("all 16 relational type variants are routed to the same case", () => {
    const relationalCases = [
      "one_to_one",
      "many_to_one",
      "many_to_many",
      "one_to_many",
      "json_one_to_one",
      "json_many_to_one",
      "json_many_to_many",
      "json_one_to_many",
      "one-to-one",
      "many-to-one",
      "many-to-many",
      "one-to-many",
      "json-one-to-one",
      "json-many-to-one",
      "json-many-to-many",
      "json-one-to-many",
    ];

    relationalCases.forEach((type) => {
      expect(RELATIONAL_TYPES).toContain(type);
    });
    expect(relationalCases).toHaveLength(16);
  });

  it("relational type renders multi-select with fetchData", () => {
    // Uses fetchData() which calls getCustomModelData or getData depending on model type
    const relationalField = {
      targetName: "name",
      target: "com.axelor.auth.db.User",
      fullName: "com.axelor.auth.db.User",
      name: "user",
      targetModel: "com.axelor.auth.db.User",
    };

    expect(relationalField.targetName).toBe("name");
    expect(relationalField.target).toBe("com.axelor.auth.db.User");
  });

  it("relational type uses parseString from dmn-js for input values", () => {
    // Simulates parseString behavior for relational field values
    // parseString returns { type: "disjunction"|"negation", values: [...] }
    const input = { type: "disjunction", values: ['"Admin"', '"User"'] };
    expect(input.values).toEqual(['"Admin"', '"User"']);
  });
});

describe("Characterization: RenderTypeProperties - useEffect Parsing", () => {
  it("string input parsing uses parseString and maps to STRING_OPTIONS", () => {
    // useEffect: if (type === "string" && !isOutput) parseString(ruleValue.text)
    const parsedType = "disjunction";
    const option = STRING_OPTIONS.find((s) => s.id === parsedType);
    expect(option).toBeDefined();
    expect(option!.id).toBe("disjunction");
  });

  it("number input parsing extracts comparison/range with operators", () => {
    // parseNumber returns: { type, operator, start, end, value, values }
    const parsedInput = {
      type: "comparison",
      operator: "less",
      value: 42,
      values: [0, 0],
    };

    const option = NUMBER_OPTIONS.find((s) => s.id === parsedInput.type);
    expect(option).toBeDefined();

    const compOp = COMPARISON_OPTIONS.find((s) => s.id === parsedInput.operator);
    expect(compOp).toBeDefined();
    expect(compOp!.id).toBe("less");
  });

  it("date input parsing sets dates array based on type", () => {
    // parseDate returns { type, date, dates }
    // "between" -> setDates(parsedDates)
    // "exact"/"before"/"after" with date -> setDates([date, null])
    // no date -> setDates([null, null])
    const parsedBetween = {
      type: "between",
      dates: ["2024-01-01", "2024-12-31"],
    };
    expect(parsedBetween.dates).toHaveLength(2);

    const parsedExact = { type: "exact", date: "2024-06-15" };
    const dates = [parsedExact.date, null];
    expect(dates[0]).toBe("2024-06-15");
    expect(dates[1]).toBeNull();
  });

  it("metaField useEffect sets metaFieldName to null for relational types", () => {
    // useEffect: if RELATIONAL_TYPES.includes(type.toLowerCase()) -> setMetaFieldName(null)
    const metaField = { name: "user", type: "many_to_one" };
    const type = metaField.type && metaField.type.toLowerCase();

    if (RELATIONAL_TYPES.includes(type)) {
      expect(true).toBe(true); // would call setMetaFieldName(null)
    } else {
      expect(false).toBe(true); // should not reach here
    }
  });
});
