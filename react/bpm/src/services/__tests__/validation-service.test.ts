import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

// Mock modeler-api
vi.mock("../../BPMN/Modeler/utils/modeler-api", () => ({
  getDefinitionAttrs: vi.fn(),
  getAllElements: vi.fn(),
}));

// Mock bpmn-js ModelUtil
vi.mock("bpmn-js/lib/util/ModelUtil", () => ({
  getBusinessObject: vi.fn((el: unknown) => (el as Record<string, unknown>).businessObject || el),
}));

import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import type { TypedBpmnModeler } from "@studio/shared/types";
import { validateNameAndCode, validateTimerEvents, validateNodes } from "../validation-service";
import { getDefinitionAttrs, getAllElements } from "../../BPMN/Modeler/utils/modeler-api";

// Helper to create a mock modeler
function createMockModeler(overrides: Record<string, unknown> = {}) {
  const elementRegistry = {
    filter: vi.fn((_fn: (el: unknown) => unknown) => [] as unknown[]),
    getAll: vi.fn(() => [] as unknown[]),
  };
  return {
    get: vi.fn((name: string) => {
      if (name === "elementRegistry") return elementRegistry;
      return null;
    }),
    _elementRegistry: elementRegistry,
    ...overrides,
  } as unknown as TypedBpmnModeler & { _elementRegistry: typeof elementRegistry };
}

describe("validation-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateNameAndCode", () => {
    it("returns success when both name and code are present", () => {
      const modeler = createMockModeler();
      (getDefinitionAttrs as Mock).mockReturnValue({
        "camunda:diagramName": "Test",
        "camunda:code": "TST",
      });

      const result = validateNameAndCode(modeler);
      expect(result).toEqual({ success: true });
    });

    it("returns error when both name and code are missing", () => {
      const modeler = createMockModeler();
      (getDefinitionAttrs as Mock).mockReturnValue({
        "camunda:diagramName": null,
        "camunda:code": null,
      });

      const result = validateNameAndCode(modeler);
      expect(result).toEqual({
        success: false,
        error: "Name and code are required.",
      });
    });

    it("returns error when name is missing", () => {
      const modeler = createMockModeler();
      (getDefinitionAttrs as Mock).mockReturnValue({
        "camunda:diagramName": null,
        "camunda:code": "TST",
      });

      const result = validateNameAndCode(modeler);
      expect(result).toEqual({
        success: false,
        error: "Name is required.",
      });
    });

    it("returns error when code is missing", () => {
      const modeler = createMockModeler();
      (getDefinitionAttrs as Mock).mockReturnValue({
        "camunda:diagramName": "Test",
        "camunda:code": null,
      });

      const result = validateNameAndCode(modeler);
      expect(result).toEqual({
        success: false,
        error: "Code is required.",
      });
    });

    it("returns error when attrs are empty (undefined values)", () => {
      const modeler = createMockModeler();
      (getDefinitionAttrs as Mock).mockReturnValue({});

      const result = validateNameAndCode(modeler);
      expect(result).toEqual({
        success: false,
        error: "Name and code are required.",
      });
    });
  });

  describe("validateTimerEvents", () => {
    it("returns success when isTimerTask is true (skip check)", () => {
      const modeler = createMockModeler();

      const result = validateTimerEvents(modeler, true);
      expect(result).toEqual({ success: true });
    });

    it("returns success when isTimerTask is false and no timer events", () => {
      const modeler = createMockModeler();
      modeler._elementRegistry.filter.mockReturnValue([]);

      const result = validateTimerEvents(modeler, false);
      expect(result).toEqual({ success: true });
    });

    it("returns error when isTimerTask is false and timer events exist", () => {
      const modeler = createMockModeler();
      modeler._elementRegistry.filter.mockImplementation((fn: (el: unknown) => unknown) => {
        // Simulate an element with a timer event definition
        const timerElement = {
          businessObject: {
            eventDefinitions: [{ $type: "bpmn:TimerEventDefinition" }],
          },
        };
        return [timerElement].filter(fn);
      });
      (getBusinessObject as Mock).mockImplementation(
        (el: unknown) => (el as Record<string, unknown>).businessObject || el,
      );

      const result = validateTimerEvents(modeler, false);
      expect(result).toEqual({
        success: false,
        error: "Timer events are not supported.",
      });
    });
  });

  describe("validateNodes", () => {
    it("returns success when all elements are valid", () => {
      (getAllElements as Mock).mockReturnValue([
        {
          id: "StartEvent_1",
          type: "bpmn:StartEvent",
          businessObject: { name: "Start" },
        },
      ]);
      (getBusinessObject as Mock).mockImplementation(
        (el: unknown) => (el as Record<string, unknown>).businessObject || el,
      );

      const modeler = createMockModeler();
      const result = validateNodes(modeler);
      expect(result).toEqual({ success: true });
    });

    it("returns error when element has no id", () => {
      (getAllElements as Mock).mockReturnValue([
        {
          id: "",
          type: "bpmn:UserTask",
          businessObject: { name: "MyTask" },
        },
      ]);
      (getBusinessObject as Mock).mockImplementation(
        (el: unknown) => (el as Record<string, unknown>).businessObject || el,
      );

      const modeler = createMockModeler();
      const result = validateNodes(modeler);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Id is required");
    });

    it("returns error when user task is missing required model/relatedField", () => {
      // A UserTask with extension elements and model entries but no relatedField
      // and processModels doesn't include the model name
      const extensionValues = [
        {
          $type: "camunda:Properties",
          values: [
            { name: "model", value: "com.example.Model" },
            { name: "modelName", value: "SomeModel" },
            { name: "modelType", value: "metaModel" },
            { name: "modelLabel", value: "Some Model" },
            { name: "itemType", value: "field1" },
            { name: "item", value: "name" },
            { name: "itemLabel", value: "Name" },
            { name: "readonly", value: "true" },
          ],
        },
      ];

      const element = {
        id: "UserTask_1",
        type: "bpmn:UserTask",
        businessObject: {
          name: "User Task",
          extensionElements: { values: extensionValues },
          $parent: {
            $type: "bpmn:Process",
            extensionElements: undefined,
          },
        },
      };

      (getAllElements as Mock).mockReturnValue([element]);
      (getBusinessObject as Mock).mockImplementation(
        (el: unknown) => (el as Record<string, unknown>).businessObject || el,
      );

      const modeler = createMockModeler();
      const result = validateNodes(modeler, { getBOParent: () => element.businessObject.$parent });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Related field is required");
    });

    it("returns error when user task has no items", () => {
      // A UserTask with model entry but empty items
      const extensionValues = [
        {
          $type: "camunda:Properties",
          values: [
            { name: "model", value: "com.example.Model" },
            { name: "modelName", value: "SomeModel" },
            { name: "modelType", value: "metaModel" },
            { name: "modelLabel", value: "Some Model" },
            { name: "relatedField", value: "myField" },
            { name: "relatedFieldLabel", value: "My Field" },
          ],
        },
      ];

      const element = {
        id: "UserTask_2",
        type: "bpmn:UserTask",
        businessObject: {
          name: "User Task 2",
          extensionElements: { values: extensionValues },
          $parent: {
            $type: "bpmn:Process",
            extensionElements: undefined,
          },
        },
      };

      (getAllElements as Mock).mockReturnValue([element]);
      (getBusinessObject as Mock).mockImplementation(
        (el: unknown) => (el as Record<string, unknown>).businessObject || el,
      );

      const modeler = createMockModeler();
      const result = validateNodes(modeler, { getBOParent: () => element.businessObject.$parent });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Item is required");
    });
  });
});
