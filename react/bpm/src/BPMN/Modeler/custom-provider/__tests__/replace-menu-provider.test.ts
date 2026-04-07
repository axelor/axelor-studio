import { describe, it, expect, vi } from "vitest";

import ReplaceMenuProvider from "../providers/ReplaceMenuProvider";

/**
 * Characterization tests for ReplaceMenuProvider.js
 *
 * These tests lock the constructor contract, $inject array, and prototype
 * method signatures so decomposition regressions are caught immediately.
 */

describe("ReplaceMenuProvider", () => {
  describe("constructor and $inject", () => {
    it("is a function (constructor)", () => {
      expect(typeof ReplaceMenuProvider).toBe("function");
    });

    it("has correct $inject array", () => {
      expect(ReplaceMenuProvider.$inject).toEqual([
        "bpmnFactory",
        "popupMenu",
        "modeling",
        "moddle",
        "bpmnReplace",
        "rules",
        "translate",
      ]);
    });
  });

  describe("prototype methods", () => {
    const expectedMethods = [
      "register",
      "getEntries",
      "getHeaderEntries",
      "_createEntries",
      "_createSequenceFlowEntries",
      "_createMenuEntry",
      "_getLoopEntries",
      "_getDataObjectIsCollection",
      "_getParticipantMultiplicity",
      "_getAdHocEntry",
    ];

    expectedMethods.forEach((method) => {
      it(`has prototype method: ${method}`, () => {
        expect(
          typeof (ReplaceMenuProvider.prototype as unknown as Record<string, unknown>)[method],
        ).toBe("function");
      });
    });

    it("has exactly the expected prototype methods", () => {
      const ownMethods = Object.getOwnPropertyNames(ReplaceMenuProvider.prototype)
        .filter((name) => name !== "constructor")
        .sort();

      expect(ownMethods).toMatchInlineSnapshot(`
        [
          "_createEntries",
          "_createMenuEntry",
          "_createSequenceFlowEntries",
          "_getAdHocEntry",
          "_getDataObjectIsCollection",
          "_getLoopEntries",
          "_getParticipantMultiplicity",
          "getEntries",
          "getHeaderEntries",
          "register",
        ]
      `);
    });
  });

  describe("_createMenuEntry output structure", () => {
    it("returns menu entry with label, className, id, action", () => {
      // Create a minimal instance without calling the constructor
      // (which calls register and needs popupMenu)
      const instance = Object.create(ReplaceMenuProvider.prototype);
      instance._bpmnReplace = {
        replaceElement: vi.fn(),
      };

      const definition = {
        label: "Test Entry",
        className: "bpmn-icon-test",
        actionName: "test-action",
        target: { type: "bpmn:Task" },
      };

      const element = { id: "elem1" };
      const entry = instance._createMenuEntry(definition, element);

      expect(entry).toHaveProperty("label", "Test Entry");
      expect(entry).toHaveProperty("className", "bpmn-icon-test");
      expect(entry).toHaveProperty("id", "test-action");
      expect(typeof entry.action).toBe("function");
    });

    it("handles function labels", () => {
      const instance = Object.create(ReplaceMenuProvider.prototype);
      instance._bpmnReplace = {
        replaceElement: vi.fn(),
      };

      const definition = {
        label: (el: { id: string }) => `Label for ${el.id}`,
        className: "bpmn-icon-test",
        actionName: "test-action",
        target: { type: "bpmn:Task" },
      };

      const element = { id: "elem1" };
      const entry = instance._createMenuEntry(definition, element);

      expect(entry.label).toBe("Label for elem1");
    });

    it("uses custom action when provided", () => {
      const instance = Object.create(ReplaceMenuProvider.prototype);
      instance._bpmnReplace = {
        replaceElement: vi.fn(),
      };

      const customAction = vi.fn();
      const definition = {
        label: "Test",
        className: "cls",
        actionName: "act",
        target: { type: "bpmn:Task" },
      };

      const entry = instance._createMenuEntry(definition, {}, customAction);
      expect(entry.action).toBe(customAction);
    });
  });

  describe("_createEntries", () => {
    it("maps definitions to menu entries via _createMenuEntry", () => {
      const instance = Object.create(ReplaceMenuProvider.prototype);
      instance._bpmnReplace = { replaceElement: vi.fn() };

      const definitions = [
        { label: "A", className: "cls-a", actionName: "act-a", target: { type: "bpmn:Task" } },
        { label: "B", className: "cls-b", actionName: "act-b", target: { type: "bpmn:UserTask" } },
      ];

      const element = { id: "test" };
      const entries = instance._createEntries(element, definitions);

      expect(entries).toHaveLength(2);
      expect(entries[0].id).toBe("act-a");
      expect(entries[1].id).toBe("act-b");
    });
  });

  describe("register", () => {
    it('registers provider in popupMenu with key "bpmn-replace"', () => {
      const instance = Object.create(ReplaceMenuProvider.prototype);
      const registerProvider = vi.fn();
      instance._popupMenu = { registerProvider };

      instance.register();

      expect(registerProvider).toHaveBeenCalledWith("bpmn-replace", instance);
    });
  });
});
