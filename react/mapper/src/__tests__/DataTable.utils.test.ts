/**
 * Tests for DataTable.utils pure functions.
 *
 * Covers getOptions, getType, getOptionDisabled, getTargetName.
 */

import { describe, it, expect, vi } from "vitest";

vi.mock("../utils", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    translate: (s: string) => s,
  };
});

import { getOptions, getType, getOptionDisabled, getTargetName } from "../DataTable.utils";
import { VALUE_FROM } from "../utils";
import type { BuilderField, ModelRecord } from "../utils";

function makeRow(overrides: Partial<BuilderField> = {}): BuilderField {
  return {
    name: "testField",
    type: "string",
    value: {},
    ...overrides,
  } as BuilderField;
}

describe("DataTable.utils", () => {
  // --- getType ---

  it("getType: converts dashed type to underscored lowercase", () => {
    expect(getType(makeRow({ type: "many-to-one" }))).toBe("many_to_one");
    expect(getType(makeRow({ type: "one-to-many" }))).toBe("one_to_many");
    expect(getType(makeRow({ type: "STRING" }))).toBe("string");
  });

  // --- getOptions ---

  it("getOptions: returns base options without BPMN/DMN/Parent extras", () => {
    const row = makeRow({ type: "string" });
    const options = getOptions(undefined, "self" as never, false, false, row);

    const ids = options.map((o) => o.id);
    expect(ids).toContain(VALUE_FROM.SELF);
    expect(ids).toContain(VALUE_FROM.CONTEXT);
    expect(ids).toContain(VALUE_FROM.NONE);
    expect(ids).toContain(VALUE_FROM.EXPRESSION);
    expect(ids).toContain(VALUE_FROM.SOURCE);
    expect(ids).not.toContain(VALUE_FROM.PARENT);
    expect(ids).not.toContain(VALUE_FROM.PROCESS);
  });

  it("getOptions: adds Parent when parentRow with context/self/source from", () => {
    const parentRow = makeRow({ value: { from: VALUE_FROM.SELF } });
    const row = makeRow({ type: "string" });
    const options = getOptions(parentRow, "self" as never, false, false, row);

    const ids = options.map((o) => o.id);
    expect(ids).toContain(VALUE_FROM.PARENT);
  });

  it("getOptions: adds Process option when isBPMN is true", () => {
    const row = makeRow({ type: "string" });
    const options = getOptions(undefined, "self" as never, true, false, row);

    const ids = options.map((o) => o.id);
    expect(ids).toContain(VALUE_FROM.PROCESS);
  });

  it("getOptions: adds DMN option when isDMNAllow is true", () => {
    const row = makeRow({ type: "string" });
    const options = getOptions(undefined, "self" as never, false, true, row);

    const ids = options.map((o) => o.id);
    expect(ids).toContain(VALUE_FROM.DMN);
  });

  it("getOptions: adds Query option for relational types", () => {
    const row = makeRow({ type: "many-to-one" });
    const options = getOptions(undefined, "self" as never, false, false, row);

    const ids = options.map((o) => o.id);
    expect(ids).toContain(VALUE_FROM.QUERY);
  });

  // --- getOptionDisabled ---

  it("getOptionDisabled: disables Parent when parentRow has no selected value", () => {
    const parentRow = makeRow({ value: { selected: null } });
    const option = { title: "Parent", id: VALUE_FROM.PARENT };
    expect(getOptionDisabled(option, parentRow, null)).toBe(true);
  });

  it("getOptionDisabled: disables Source when no sourceModel provided", () => {
    const option = { title: "Source", id: VALUE_FROM.SOURCE };
    expect(getOptionDisabled(option, undefined, null)).toBe(true);
  });

  it("getOptionDisabled: enables Source when sourceModel exists", () => {
    const option = { title: "Source", id: VALUE_FROM.SOURCE };
    const sourceModel = { name: "SaleOrder" } as ModelRecord;
    expect(getOptionDisabled(option, undefined, sourceModel)).toBe(false);
  });

  it("getOptionDisabled: returns false for non-special options", () => {
    const option = { title: "Value", id: VALUE_FROM.NONE };
    expect(getOptionDisabled(option, undefined, null)).toBe(false);
  });

  // --- getTargetName ---

  it("getTargetName: returns row targetName when value contains it", () => {
    const row = makeRow({ targetName: "fullName" });
    const value = { fullName: "John Doe" };
    expect(getTargetName(row, value, undefined)).toBe("fullName");
  });

  it("getTargetName: falls back to nameField when targetName missing", () => {
    const row = makeRow({ targetName: undefined });
    const value = { title: "My Record" };
    expect(getTargetName(row, value, "title")).toBe("title");
  });

  it("getTargetName: falls back to 'name' field", () => {
    const row = makeRow({ targetName: undefined });
    const value = { name: "Test" };
    expect(getTargetName(row, value, undefined)).toBe("name");
  });

  it("getTargetName: falls back to '_selectId' when no name fields found", () => {
    const row = makeRow({ targetName: undefined });
    const value = { id: 1 };
    expect(getTargetName(row, value, undefined)).toBe("_selectId");
  });
});
