import { describe, it, expect } from "vitest";

import { getDefaultFrom, getSourceModelString, getBuilderField, getJSON, generateJson } from "../Builder.utils";
import { VALUE_FROM } from "../utils";
import type { BuilderField, ModelRecord } from "../utils";

describe("Builder.utils", () => {
  describe("getDefaultFrom", () => {
    it("returns 'source' when sourceModel is provided", () => {
      const model: ModelRecord = { name: "SaleOrder", fullName: "com.axelor.sale.SaleOrder" };
      expect(getDefaultFrom(model)).toBe(VALUE_FROM.SOURCE);
    });

    it("returns 'none' when sourceModel is null", () => {
      expect(getDefaultFrom(null)).toBe(VALUE_FROM.NONE);
    });
  });

  describe("getSourceModelString", () => {
    it("returns empty string for empty list", () => {
      expect(getSourceModelString([])).toBe("");
    });

    it("returns single model name for list with one item", () => {
      const list: ModelRecord[] = [{ name: "SaleOrder" }];
      expect(getSourceModelString(list)).toBe("SaleOrder");
    });

    it("joins multiple model names with dots", () => {
      const list: ModelRecord[] = [
        { name: "SaleOrder" },
        { name: "partner" },
        { name: "address" },
      ];
      expect(getSourceModelString(list)).toBe("SaleOrder.partner.address");
    });
  });

  describe("getBuilderField", () => {
    it("creates a builder field with defaults and incremented key", () => {
      const field = getBuilderField({ name: "testField", type: "string" });
      expect(field.name).toBe("testField");
      expect(field.type).toBe("string");
      expect(field.key).toBeGreaterThan(0);
      expect(field.condition).toBeNull();
      expect(field.conditionMeta).toBeNull();
      expect(field.searchField).toBeNull();
      expect(field.dmn).toBeNull();
    });

    it("sets value.from to 'source' when sourceModel is provided", () => {
      const model: ModelRecord = { name: "SaleOrder", fullName: "com.axelor.sale.SaleOrder" };
      const field = getBuilderField({ name: "partner", type: "many-to-one" }, model);
      expect(field.value.from).toBe(VALUE_FROM.SOURCE);
    });

    it("sets value.from to 'none' when sourceModel is null", () => {
      const field = getBuilderField({ name: "name", type: "string" }, null);
      expect(field.value.from).toBe(VALUE_FROM.NONE);
    });

    it("preserves overrides from partial field", () => {
      const field = getBuilderField({ name: "myField", type: "integer" });
      expect(field.name).toBe("myField");
      expect(field.type).toBe("integer");
    });
  });

  describe("getJSON", () => {
    it("parses JSON string from object key", () => {
      const obj = { data: '{"name":"test","value":42}' };
      const result = getJSON(obj, "data");
      expect(result).toEqual({ name: "test", value: 42 });
    });

    it("returns empty object for missing key", () => {
      const obj = { other: "value" };
      const result = getJSON(obj, "data");
      expect(result).toEqual({});
    });

    it("returns empty object for invalid JSON", () => {
      const obj = { data: "not-valid-json{" };
      const result = getJSON(obj, "data");
      expect(result).toEqual({});
    });

    it("returns empty object for empty string value", () => {
      const obj = { data: "" };
      const result = getJSON(obj, "data");
      expect(result).toEqual({});
    });

    it("returns empty object for null-ish value", () => {
      const obj = { data: null } as unknown as Record<string, unknown>;
      const result = getJSON(obj, "data");
      expect(result).toEqual({});
    });
  });

  describe("generateJson", () => {
    it("returns empty array when data has no selected values", () => {
      const fields: BuilderField[] = [
        {
          name: "name",
          type: "string",
          value: { from: VALUE_FROM.NONE, selected: null },
        } as BuilderField,
      ];
      const result = generateJson(fields, {});
      expect(result).toEqual([]);
    });

    it("generates correct JSON for a field with source value", () => {
      const sourceModel: ModelRecord = { name: "SaleOrder", fullName: "com.axelor.sale.SaleOrder" };
      const fields: BuilderField[] = [
        {
          name: "orderName",
          type: "string",
          value: {
            from: VALUE_FROM.SOURCE,
            selected: { value: "name" },
            subFields: [{ name: "name", type: "string" }],
          },
        } as BuilderField,
      ];
      const result = generateJson(fields, {}, VALUE_FROM.SOURCE, sourceModel);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("orderName");
      expect(result[0].type).toBe("string");
      expect(result[0].value.selected).toMatchObject({ value: "name" });
    });

    it("handles empty fields array", () => {
      const result = generateJson([], {});
      expect(result).toEqual([]);
    });
  });
});
