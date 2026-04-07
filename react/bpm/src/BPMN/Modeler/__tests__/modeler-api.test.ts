import { describe, it, expect, vi } from "vitest";

import type { TypedBpmnModeler } from "@studio/shared/types";
import {
  getDefinitionAttrs,
  getDiagramName,
  getRootElements,
  getProcesses,
  getAllElements,
  getElementById,
} from "../utils/modeler-api";

function createMockModeler({ definitions = null, elements = [] }: { definitions?: Record<string, unknown> | null; elements?: Array<{ id: string; [k: string]: unknown }> } = {}) {
  const elementRegistry = {
    getAll: vi.fn(() => elements),
    get: vi.fn((id: string) => elements.find((e) => e.id === id) || undefined),
  };

  return {
    getDefinitions: vi.fn(() => definitions),
    get: vi.fn((name: string) => {
      if (name === "elementRegistry") return elementRegistry;
      return undefined;
    }),
  } as unknown as TypedBpmnModeler;
}

describe("modeler-api", () => {
  describe("getDefinitionAttrs", () => {
    it("returns $attrs from definitions", () => {
      const modeler = createMockModeler({
        definitions: { $attrs: { "camunda:diagramName": "MyDiagram" } },
      });
      expect(getDefinitionAttrs(modeler)).toEqual({
        "camunda:diagramName": "MyDiagram",
      });
    });

    it("returns empty object when definitions is null", () => {
      const modeler = createMockModeler({ definitions: null });
      expect(getDefinitionAttrs(modeler)).toEqual({});
    });

    it("returns empty object when $attrs is missing", () => {
      const modeler = createMockModeler({ definitions: {} });
      expect(getDefinitionAttrs(modeler)).toEqual({});
    });
  });

  describe("getDiagramName", () => {
    it("returns camunda:diagramName from $attrs", () => {
      const modeler = createMockModeler({
        definitions: { $attrs: { "camunda:diagramName": "TestFlow" } },
      });
      expect(getDiagramName(modeler)).toBe("TestFlow");
    });

    it("returns undefined when no diagramName", () => {
      const modeler = createMockModeler({ definitions: { $attrs: {} } });
      expect(getDiagramName(modeler)).toBeUndefined();
    });
  });

  describe("getRootElements", () => {
    it("returns rootElements array from definitions", () => {
      const rootElements = [
        { $type: "bpmn:Process", id: "Process_1" },
        { $type: "bpmn:Message", id: "Message_1" },
      ];
      const modeler = createMockModeler({
        definitions: { rootElements },
      });
      expect(getRootElements(modeler)).toEqual(rootElements);
    });

    it("returns empty array when definitions is null", () => {
      const modeler = createMockModeler({ definitions: null });
      expect(getRootElements(modeler)).toEqual([]);
    });

    it("returns empty array when rootElements is missing", () => {
      const modeler = createMockModeler({ definitions: {} });
      expect(getRootElements(modeler)).toEqual([]);
    });
  });

  describe("getProcesses", () => {
    it("returns only bpmn:Process elements", () => {
      const rootElements = [
        { $type: "bpmn:Process", id: "Process_1" },
        { $type: "bpmn:Message", id: "Message_1" },
        { $type: "bpmn:Process", id: "Process_2" },
      ];
      const modeler = createMockModeler({
        definitions: { rootElements },
      });
      const result = getProcesses(modeler);
      expect(result).toHaveLength(2);
      expect(result.every((e: { $type: string }) => e.$type === "bpmn:Process")).toBe(true);
    });

    it("returns empty array when no processes", () => {
      const rootElements = [{ $type: "bpmn:Message", id: "Message_1" }];
      const modeler = createMockModeler({
        definitions: { rootElements },
      });
      expect(getProcesses(modeler)).toEqual([]);
    });
  });

  describe("getAllElements", () => {
    it("calls elementRegistry.getAll()", () => {
      const elements = [
        { id: "StartEvent_1", type: "bpmn:StartEvent" },
        { id: "Task_1", type: "bpmn:Task" },
      ];
      const modeler = createMockModeler({ elements });
      const result = getAllElements(modeler);
      expect(result).toEqual(elements);
      expect(modeler.get).toHaveBeenCalledWith("elementRegistry");
    });
  });

  describe("getElementById", () => {
    it("returns element by id", () => {
      const elements = [
        { id: "StartEvent_1", type: "bpmn:StartEvent" },
        { id: "Task_1", type: "bpmn:Task" },
      ];
      const modeler = createMockModeler({ elements });
      const result = getElementById(modeler, "Task_1");
      expect(result).toEqual({ id: "Task_1", type: "bpmn:Task" });
    });

    it("returns undefined for non-existent id", () => {
      const modeler = createMockModeler({ elements: [] });
      expect(getElementById(modeler, "nonexistent")).toBeUndefined();
    });
  });
});
