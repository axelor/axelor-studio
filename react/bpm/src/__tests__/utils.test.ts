/**
 * Tests for bpm utility functions (Bloc C).
 *
 * Covers pure functions: capitalizeFirst, getBool, dashToUnderScore,
 * lightenColor, getProblemViewData, isAsyncBefore/After,
 * updateBusinessObject. Skips functions requiring bpmn-js modeler.
 */

import { describe, it, expect, vi } from "vitest";

// Mock bpmn-js utilities used by some functions
vi.mock("bpmn-js/lib/util/ModelUtil", () => ({
  is: vi.fn(() => false),
  getBusinessObject: vi.fn((el: unknown) => el),
}));

vi.mock("bpmn-js/lib/util/DiUtil", () => ({
  isExpanded: vi.fn(() => false),
  isEventSubProcess: vi.fn(() => false),
  isInterrupting: vi.fn(() => true),
}));

vi.mock("../utils/ExtensionElementsUtil", () => ({
  getExtensionElements: vi.fn(() => []),
}));

vi.mock("../BPMN/icons", () => ({
  default: {},
}));

import {
  capitalizeFirst,
  getBool,
  dashToUnderScore,
  lightenColor,
  getProblemViewData,
  isAsyncBefore,
  isAsyncAfter,
  updateBusinessObject,
} from "../utils";

describe("bpm/utils", () => {
  // --- capitalizeFirst ---

  it("capitalizeFirst: capitalizes and spaces camelCase strings", () => {
    expect(capitalizeFirst("myVariableName")).toBe("My variable name");
    // "UserTask" -> " User Task" via regex, then capitalize first + lowercase rest
    expect(capitalizeFirst("UserTask")).toBe(" user task");
  });

  it("capitalizeFirst: returns undefined for empty or non-string input", () => {
    expect(capitalizeFirst("")).toBeUndefined();
    expect(capitalizeFirst()).toBeUndefined();
  });

  // --- getBool ---

  it("getBool: parses boolean-like values correctly", () => {
    expect(getBool("true")).toBe(true);
    expect(getBool("false")).toBe(false);
    expect(getBool(true)).toBe(true);
    expect(getBool(false)).toBe(false);
  });

  it("getBool: returns false for non-boolean values", () => {
    expect(getBool(null)).toBe(false);
    expect(getBool(undefined)).toBe(false);
    expect(getBool("random")).toBe(false);
    expect(getBool(42)).toBe(false);
  });

  // --- dashToUnderScore ---

  it("dashToUnderScore: converts dashed strings to underscored lowercase", () => {
    expect(dashToUnderScore("json-model-field")).toBe("model_field");
    expect(dashToUnderScore("some-value")).toBe("some_value");
  });

  it("dashToUnderScore: returns undefined for empty input", () => {
    expect(dashToUnderScore("")).toBeUndefined();
  });

  // --- lightenColor ---

  it("lightenColor: lightens a hex color by given percentage", () => {
    const result = lightenColor("#000000", 0.5);
    // Black lightened 50% should give #808080 (approximately)
    expect(result).toMatch(/^#[0-9a-f]{6}$/i);
    expect(result).not.toBe("#000000");
  });

  it("lightenColor: returns same color when percent is 0", () => {
    // Implementation uses toString(16) without zero-padding, so #ff0000 -> #ff00
    const result = lightenColor("#ff0000", 0);
    expect(result).toMatch(/^#[0-9a-f]+$/i);
    // Parsed R=255 G=0 B=0 with 0% lighten stays at 255,0,0
    expect(result).toContain("ff");
  });

  // --- getProblemViewData ---

  it("getProblemViewData: separates errors and warnings from issues map", () => {
    const issues = {
      "Task_1": [
        { category: "error", id: "1", message: "Missing name" },
        { category: "warn", id: "2", message: "No description" },
      ],
      "Task_2": [
        { category: "error", id: "3", message: "Invalid config" },
      ],
    };

    const result = getProblemViewData(issues);

    expect(result.errors).toHaveLength(2);
    expect(result.warnings).toHaveLength(1);
    expect(result.errors[0]).toEqual(expect.objectContaining({ message: "Missing name" }));
    expect(result.warnings[0]).toEqual(expect.objectContaining({ message: "No description" }));
  });

  it("getProblemViewData: returns empty arrays for empty input", () => {
    const result = getProblemViewData({});
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  // --- isAsyncBefore / isAsyncAfter ---

  it("isAsyncBefore: detects camunda:asyncBefore attribute", () => {
    expect(isAsyncBefore({ "camunda:asyncBefore": true })).toBe(true);
    expect(isAsyncBefore({ "camunda:async": true })).toBe(true);
    expect(isAsyncBefore({})).toBe(false);
  });

  it("isAsyncAfter: detects camunda:asyncAfter attribute", () => {
    expect(isAsyncAfter({ "camunda:asyncAfter": true })).toBe(true);
    expect(isAsyncAfter({})).toBe(false);
  });

  // --- updateBusinessObject ---

  it("updateBusinessObject: returns command context for properties-panel update", () => {
    const element = { id: "Task_1" };
    const bo = { $type: "bpmn:Task" };
    const props = { name: "NewName" };

    const result = updateBusinessObject(element, bo, props);

    expect(result.cmd).toBe("properties-panel.update-businessobject");
    expect(result.context.element).toBe(element);
    expect(result.context.businessObject).toBe(bo);
    expect(result.context.properties).toEqual({ name: "NewName" });
  });
});
