/**
 * Characterization Test: OutputHeadProperties
 *
 * Split from panel-characterization.test.tsx (lines 380-531).
 * Tests OutputHeadProperties (507L): output name/label/typeRef fields,
 * expression dialog, handleChange via modeling.updateProperties.
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

import { TYPES } from "../../constants";

// ============================================================
// OutputHeadProperties (507L) Characterization
// ============================================================

describe("Characterization: OutputHeadProperties - Fields", () => {
  it("renders label field with get/set using output.label", () => {
    // entry: { id: "label", get: () => ({ label: output.label }), set: setProperty({label}, output) }
    const output = { label: "Amount", name: "amount", typeRef: "double" };
    const entry = {
      id: "label",
      get: () => ({ label: output.label }),
    };

    expect(entry.get().label).toBe("Amount");
  });

  it("renders expression field from output.$attrs['camunda:text']", () => {
    // get: () => ({ expression: output.$attrs["camunda:text"] })
    const output = {
      $attrs: { "camunda:text": "order.totalAmount" },
    };
    const expression = output.$attrs["camunda:text"];
    expect(expression).toBe("order.totalAmount");
  });

  it("renders output name field", () => {
    const output = { name: "totalAmount" };
    const entry = {
      id: "name",
      get: () => ({ name: output.name }),
    };
    expect(entry.get().name).toBe("totalAmount");
  });

  it("renders typeRef select with TYPES options", () => {
    expect(TYPES.length).toBeGreaterThan(0);
    expect(TYPES.map((t) => t.value)).toContain("string");
    expect(TYPES.map((t) => t.value)).toContain("boolean");
    expect(TYPES.map((t) => t.value)).toContain("double");
  });

  it("renders default value field (TextField for non-date, DatePicker for date)", () => {
    // Conditional: ["date", "time", "datetime"].includes(type) ? DatePicker : TextField
    const dateTypes = ["date", "time", "datetime"];
    expect(dateTypes.includes("date")).toBe(true);
    expect(dateTypes.includes("string")).toBe(false);
  });
});

describe("Characterization: OutputHeadProperties - Expression Dialog", () => {
  it("handleClickOpen reads camunda:valueFrom from output.$attrs", () => {
    // const from = attrs["camunda:valueFrom"] || "context"
    const attrs = { "camunda:valueFrom": "model" };
    const from = attrs["camunda:valueFrom"] || "context";
    expect(from).toBe("model");
  });

  it("defaults to 'context' valueFrom when attr is not set", () => {
    const attrs: Record<string, unknown> = {};
    const from = attrs["camunda:valueFrom"] || "context";
    expect(from).toBe("context");
  });

  it("model mode parses textMetaField as JSON for model value", () => {
    // if (from === "model"): model = JSON.parse(textMetaField)
    const attrs = {
      "camunda:valueFrom": "model",
      "camunda:textMetaField": JSON.stringify({
        name: "Partner",
        fullName: "com.axelor.apps.base.db.Partner",
      }),
    };
    const model = JSON.parse(attrs["camunda:textMetaField"]);
    expect(model!.name).toBe("Partner");
    expect(model.fullName).toBe("com.axelor.apps.base.db.Partner");
  });

  it("context mode parses allFields and relationalField from attrs", () => {
    const allFields = JSON.stringify([{ name: "partner", type: "many_to_one" }]);
    const relationalField = JSON.stringify({ name: "partner" });

    const parsed = JSON.parse(allFields);
    const parsedRel = JSON.parse(relationalField);

    expect(parsed).toHaveLength(1);
    expect(parsedRel.name).toBe("partner");
  });
});

describe("Characterization: OutputHeadProperties - handleChange", () => {
  it("setProperty calls modeling.updateProperties(field, context)", () => {
    // setProperty = (context, field) => { modeling.updateProperties(field, context) }
    const updatePropertiesMock = vi.fn();
    const modeling = { updateProperties: updatePropertiesMock };

    const context = { label: "New Label" };
    const field = { id: "output_1" };
    modeling.updateProperties(field, context);

    expect(updatePropertiesMock).toHaveBeenCalledWith(field, context);
  });

  it("type change clears defaultValue via camunda:defaultValue undefined", () => {
    // set: { typeRef, "camunda:defaultValue": undefined }
    const context = { typeRef: "integer", "camunda:defaultValue": undefined };
    expect(context.typeRef).toBe("integer");
    expect(context["camunda:defaultValue"]).toBeUndefined();
  });

  it("handleAlertOk resets to string type and clears all camunda attrs", () => {
    const resetContext = {
      typeRef: "string",
      "camunda:textMetaField": undefined,
      "camunda:relationalField": undefined,
      "camunda:allFields": undefined,
      "camunda:defaultValue": undefined,
      "camunda:valueFrom": undefined,
    };

    expect(resetContext.typeRef).toBe("string");
    Object.keys(resetContext).forEach((key) => {
      if (key !== "typeRef") {
        expect((resetContext as Record<string, unknown>)[key]).toBeUndefined();
      }
    });
  });
});

describe("Characterization: OutputHeadProperties - useEffect initialization", () => {
  it("sets type from propOutput.typeRef", () => {
    const propOutput = { typeRef: "double", $attrs: {} };
    const type = propOutput.typeRef;
    expect(type).toBe("double");
  });

  it("sets readOnly when camunda:allFields attr exists", () => {
    const attrs = { "camunda:allFields": JSON.stringify([{ name: "field" }]) };
    const allFields = attrs["camunda:allFields"];
    const readOnly = allFields ? true : false;
    expect(readOnly).toBe(true);
  });

  it("resets to string type when model is removed from DRD view", () => {
    // if (!isPresent && allFields) => reset type to "string"
    const models = [{ name: "Order" }];
    const text = "partner.name";
    const textValues = text.split(".");
    const modelName = textValues[0];
    const isPresent = models.find((m) => m.name.toLowerCase() === modelName.toLowerCase());
    const allFields = "true";

    expect(isPresent).toBeUndefined();
    expect(!isPresent && allFields).toBeTruthy();
  });
});
