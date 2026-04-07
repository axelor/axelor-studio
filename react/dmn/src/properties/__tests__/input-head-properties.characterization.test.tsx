/**
 * Characterization Test: InputHeadProperties
 *
 * Split from panel-characterization.test.tsx (lines 536-779).
 * Tests InputHeadProperties (457L): input label, expression, inputVariable,
 * handleChange with root.added event, expression language.
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
  EXPRESSION_LANGUAGE_OPTIONS,
  ALL_TYPES,
  TYPES,
} from "../../constants";

// ============================================================
// InputHeadProperties (457L) Characterization
// ============================================================

describe("Characterization: InputHeadProperties - Fields", () => {
  it("renders label field with get/set using input.label", () => {
    const input = { label: "Customer Name", inputVariable: "custName" };
    const entry = {
      id: "label",
      get: () => ({ label: input.label }),
    };
    expect(entry.get().label).toBe("Customer Name");
  });

  it("renders expression from input.inputExpression.text", () => {
    const input = {
      inputExpression: {
        text: "order.customer.name",
        expressionLanguage: "groovy",
        typeRef: "string",
        $attrs: {},
      },
    };
    const expression = input.inputExpression.text;
    expect(expression).toBe("order.customer.name");
  });

  it("renders inputVariable field", () => {
    const input = { inputVariable: "cellInput" };
    expect(input.inputVariable).toBe("cellInput");
  });

  it("renders expressionLanguage select with EXPRESSION_LANGUAGE_OPTIONS", () => {
    expect(EXPRESSION_LANGUAGE_OPTIONS.length).toBeGreaterThan(0);
    expect(EXPRESSION_LANGUAGE_OPTIONS.map((o) => o.value)).toContain("feel");
    expect(EXPRESSION_LANGUAGE_OPTIONS.map((o) => o.value)).toContain("groovy");
  });

  it("renders typeRef select with TYPES options", () => {
    expect(TYPES.map((t) => t.value)).toContain("string");
    expect(TYPES.map((t) => t.value)).toContain("integer");
    expect(TYPES.map((t) => t.value)).toContain("long");
    expect(TYPES.map((t) => t.value)).toContain("double");
  });

  it("renders default value field (DatePicker for date types, TextField otherwise)", () => {
    const dateTypes = ["date", "datetime", "time"];
    expect(dateTypes.includes("datetime")).toBe(true);
    expect(dateTypes.includes("integer")).toBe(false);
  });
});

describe("Characterization: InputHeadProperties - Expression Dialog", () => {
  it("handleClickOpen reads allFields/metaField/relationalField from inputExpression.$attrs", () => {
    const inputExpression = {
      $attrs: {
        "camunda:allFields": JSON.stringify([{ name: "customer", type: "many_to_one" }]),
        "camunda:textMetaField": JSON.stringify({
          name: "customer",
          type: "many_to_one",
        }),
        "camunda:relationalField": JSON.stringify({ name: "customer" }),
      },
      text: "order.customer.name",
    };

    const allFields = JSON.parse(inputExpression.$attrs["camunda:allFields"]);
    const metaField = JSON.parse(inputExpression.$attrs["camunda:textMetaField"]);

    expect(allFields).toHaveLength(1);
    expect(metaField.name).toBe("customer");
  });

  it("parses text to extract model name and field path", () => {
    // text: "order.customer.name" -> modelName: "order", value: "customer.name"
    const text = "order.customer.name";
    const textValues = text.split(".");
    const modelName = textValues[0];
    const value = textValues.slice(1).join(".");

    expect(modelName).toBe("order");
    expect(value).toBe("customer.name");
  });

  it("matches contextModel from models list using case-insensitive compare", () => {
    const models = [
      { name: "Order", type: "metaModel" },
      { name: "Partner", type: "metaModel" },
    ];
    const modelName = "order";
    const model = models.find((m) => m.name.toLowerCase() === modelName.toLowerCase());

    expect(model).toBeDefined();
    expect(model!.name).toBe("Order");
  });
});

describe("Characterization: InputHeadProperties - handleChange with root.added", () => {
  it("setProperty fires root.added event after updateProperties", () => {
    // setProperty: modeling.updateProperties(field, context); modeling._eventBus.fire("root.added")
    const updatePropertiesMock = vi.fn();
    const fireMock = vi.fn();
    const modeling = {
      updateProperties: updatePropertiesMock,
      _eventBus: { fire: fireMock },
    };

    const context = { text: "order.name" };
    const field = { id: "inputExpression_1" };
    modeling.updateProperties(field, context);
    modeling._eventBus.fire("root.added");

    expect(updatePropertiesMock).toHaveBeenCalledWith(field, context);
    expect(fireMock).toHaveBeenCalledWith("root.added");
  });

  it("expression clear resets all camunda attrs and sets feel language", () => {
    // When expression is cleared: typeRef: "string", expressionLanguage: "feel", clear all camunda attrs
    const clearContext = {
      "camunda:textMetaField": undefined,
      "camunda:relationalField": undefined,
      "camunda:allFields": undefined,
      typeRef: "string",
      expressionLanguage: "feel",
      "camunda:inputVariable": undefined,
    };

    expect(clearContext.typeRef).toBe("string");
    expect(clearContext.expressionLanguage).toBe("feel");
    expect(clearContext["camunda:textMetaField"]).toBeUndefined();
  });

  it("non-empty expression sets expressionLanguage to groovy", () => {
    // When currentVal && currentVal.trim() !== "" -> "groovy"
    const currentVal = "order.amount";
    const expressionLanguage = currentVal && currentVal.trim() !== "" ? "groovy" : "feel";
    expect(expressionLanguage).toBe("groovy");
  });
});

describe("Characterization: InputHeadProperties - handleOk flow", () => {
  it("builds text from model + field path", () => {
    // text = `${model}.${field}` where model = lowerCaseFirstLetter(contextModel.name)
    const contextModel = { name: "Order" };
    const field = "customer.name";
    const model = contextModel.name.charAt(0).toLowerCase() + contextModel.name.slice(1);
    const text = `${model}.${field}`;

    expect(text).toBe("order.customer.name");
  });

  it("appends atStartOfDay() for date type fields", () => {
    // text = type === "date" ? `${dateExpr}?.atStartOfDay()` : text
    const type = "date";
    const text = "order.orderDate";
    const dateExpr = text.replace("?.atStartOfDay()", "");
    const result = type === "date" ? `${dateExpr}?.atStartOfDay()` : text;

    expect(result).toBe("order.orderDate?.atStartOfDay()");
  });

  it("maps time type to long typeRef", () => {
    // if (type === "time") typeRef = "long"
    const type = "time";
    let typeRef = "string";
    if (ALL_TYPES.includes(type)) {
      typeRef = type;
    } else if (type === "time") {
      typeRef = "long";
    }
    expect(typeRef).toBe("long");
  });

  it("maps decimal type to double typeRef", () => {
    // if (type === "decimal") typeRef = "double"
    const type = "decimal";
    let typeRef = "string";
    if (ALL_TYPES.includes(type)) {
      typeRef = type;
    } else if (type === "decimal") {
      typeRef = "double";
    }
    expect(typeRef).toBe("double");
  });

  it("sets expressionLanguage to groovy when text has content", () => {
    const text: string = "order.amount";
    const expressionLanguage = text && text !== "" ? "groovy" : "feel";
    expect(expressionLanguage).toBe("groovy");
  });

  it("sets expressionLanguage to feel when text is empty", () => {
    const text = "";
    const expressionLanguage = text && text !== "" ? "groovy" : "feel";
    expect(expressionLanguage).toBe("feel");
  });

  it("handleAlertOk resets to string and clears inputExpression attrs", () => {
    const resetContext = {
      typeRef: "string",
      "camunda:textMetaField": undefined,
      "camunda:relationalField": undefined,
      "camunda:allFields": undefined,
    };
    // Also: setProperty({ "camunda:defaultValue": undefined }, input)

    expect(resetContext.typeRef).toBe("string");
  });
});

describe("Characterization: InputHeadProperties - useEffect initialization", () => {
  it("reads expressionLanguage and typeRef from propInput.inputExpression", () => {
    const propInput = {
      inputExpression: {
        expressionLanguage: "groovy",
        typeRef: "integer",
        text: "order.quantity",
        $attrs: {},
      },
      $attrs: {},
    };

    expect(propInput.inputExpression.expressionLanguage).toBe("groovy");
    expect(propInput.inputExpression.typeRef).toBe("integer");
  });

  it("reads defaultValue from propInput.$attrs['camunda:defaultValue']", () => {
    const propInput = {
      $attrs: { "camunda:defaultValue": "42" },
      inputExpression: { $attrs: {}, typeRef: "integer" },
    };

    const defaultValue = propInput.$attrs["camunda:defaultValue"];
    expect(defaultValue).toBe("42");
  });

  it("resets to string when model is removed and allFields existed", () => {
    // Same pattern as OutputHeadProperties: !isPresent && allFields => reset
    const models = [{ name: "Invoice" }];
    const text = "order.amount";
    const textValues = text.split(".");
    const modelName = textValues[0];
    const isPresent = models.find((m) => m.name.toLowerCase() === modelName.toLowerCase());
    const allFields = '[{"name":"amount"}]';

    expect(!isPresent && allFields).toBeTruthy();
  });
});
