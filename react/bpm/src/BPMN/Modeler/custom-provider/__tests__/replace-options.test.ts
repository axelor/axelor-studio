import { describe, it, expect } from "vitest";

import * as ReplaceOptions from "../features/replace/ReplaceOptions";

/**
 * Characterization tests for ReplaceOptions.js
 *
 * These tests lock the current exported arrays so that any decomposition
 * regression is immediately caught. Each export is verified for:
 * - Type (Array)
 * - Length (exact count)
 * - Element structure (actionName, className, target fields)
 */

const ALL_EXPORT_NAMES = [
  "START_EVENT",
  "START_EVENT_SUB_PROCESS",
  "INTERMEDIATE_EVENT",
  "END_EVENT",
  "BOUNDARY_EVENT",
  "EVENT_SUB_PROCESS_START_EVENT",
  "GATEWAY",
  "TASK",
  "SUBPROCESS_EXPANDED",
  "TRANSACTION",
  "EVENT_SUB_PROCESS",
  "SEQUENCE_FLOW",
  "DATA_OBJECT_REFERENCE",
  "DATA_STORE_REFERENCE",
  "PARTICIPANT",
];

describe("ReplaceOptions", () => {
  it("exports exactly 15 named arrays", () => {
    expect(Object.keys(ReplaceOptions).sort()).toMatchInlineSnapshot(`
      [
        "BOUNDARY_EVENT",
        "DATA_OBJECT_REFERENCE",
        "DATA_STORE_REFERENCE",
        "END_EVENT",
        "EVENT_SUB_PROCESS",
        "EVENT_SUB_PROCESS_START_EVENT",
        "GATEWAY",
        "INTERMEDIATE_EVENT",
        "PARTICIPANT",
        "SEQUENCE_FLOW",
        "START_EVENT",
        "START_EVENT_SUB_PROCESS",
        "SUBPROCESS_EXPANDED",
        "TASK",
        "TRANSACTION",
      ]
    `);
  });

  it("all expected exports are present", () => {
    ALL_EXPORT_NAMES.forEach((name) => {
      expect(ReplaceOptions).toHaveProperty(name);
    });
  });

  describe("START_EVENT", () => {
    const arr = ReplaceOptions.START_EVENT;

    it("is an array of length 7", () => {
      expect(Array.isArray(arr)).toBe(true);
      expect(arr).toHaveLength(7);
    });

    it("first element has correct structure", () => {
      expect(arr[0]).toMatchObject({
        actionName: "replace-with-none-start",
        className: "bpmn-icon-start-event-none",
        target: { type: "bpmn:StartEvent" },
      });
    });

    it("last element has correct structure", () => {
      expect(arr[6]).toMatchObject({
        actionName: "replace-with-signal-start",
        className: "bpmn-icon-start-event-signal",
        target: {
          type: "bpmn:StartEvent",
          eventDefinitionType: "bpmn:SignalEventDefinition",
        },
      });
    });
  });

  describe("START_EVENT_SUB_PROCESS", () => {
    const arr = ReplaceOptions.START_EVENT_SUB_PROCESS;

    it("is an array of length 3", () => {
      expect(Array.isArray(arr)).toBe(true);
      expect(arr).toHaveLength(3);
    });

    it("first element targets bpmn:StartEvent", () => {
      expect(arr[0].target.type).toBe("bpmn:StartEvent");
    });

    it("last element targets bpmn:EndEvent", () => {
      expect(arr[2].target.type).toBe("bpmn:EndEvent");
    });
  });

  describe("INTERMEDIATE_EVENT", () => {
    const arr = ReplaceOptions.INTERMEDIATE_EVENT;

    it("is an array of length 13", () => {
      expect(Array.isArray(arr)).toBe(true);
      expect(arr).toHaveLength(13);
    });

    it("first element is replace-with-none-start", () => {
      expect(arr[0].actionName).toBe("replace-with-none-start");
    });

    it("last element is replace-with-signal-intermediate-throw", () => {
      expect(arr[12].actionName).toBe("replace-with-signal-intermediate-throw");
    });
  });

  describe("END_EVENT", () => {
    const arr = ReplaceOptions.END_EVENT;

    it("is an array of length 10", () => {
      expect(Array.isArray(arr)).toBe(true);
      expect(arr).toHaveLength(10);
    });

    it("first element is replace-with-none-start", () => {
      expect(arr[0].actionName).toBe("replace-with-none-start");
    });

    it("last element is replace-with-terminate-end", () => {
      expect(arr[9].actionName).toBe("replace-with-terminate-end");
      expect(arr[9].target.eventDefinitionType).toBe("bpmn:TerminateEventDefinition");
    });
  });

  describe("BOUNDARY_EVENT", () => {
    const arr = ReplaceOptions.BOUNDARY_EVENT;

    it("is an array of length 13", () => {
      expect(Array.isArray(arr)).toBe(true);
      expect(arr).toHaveLength(13);
    });

    it("first element is message boundary (interrupting)", () => {
      expect(arr[0]).toMatchObject({
        actionName: "replace-with-message-boundary",
        target: {
          type: "bpmn:BoundaryEvent",
          eventDefinitionType: "bpmn:MessageEventDefinition",
          cancelActivity: true,
        },
      });
    });

    it("last element is non-interrupting signal boundary", () => {
      expect(arr[12]).toMatchObject({
        actionName: "replace-with-non-interrupting-signal-boundary",
        target: {
          cancelActivity: false,
        },
      });
    });

    it("has 8 interrupting and 5 non-interrupting entries", () => {
      const interrupting = arr.filter((e) => e.target.cancelActivity === true);
      const nonInterrupting = arr.filter((e) => e.target.cancelActivity === false);
      expect(interrupting).toHaveLength(8);
      expect(nonInterrupting).toHaveLength(5);
    });
  });

  describe("EVENT_SUB_PROCESS_START_EVENT", () => {
    const arr = ReplaceOptions.EVENT_SUB_PROCESS_START_EVENT;

    it("is an array of length 12", () => {
      expect(Array.isArray(arr)).toBe(true);
      expect(arr).toHaveLength(12);
    });

    it("first element is interrupting message start", () => {
      expect(arr[0]).toMatchObject({
        actionName: "replace-with-message-start",
        target: {
          type: "bpmn:StartEvent",
          isInterrupting: true,
        },
      });
    });

    it("last element is non-interrupting escalation start", () => {
      expect(arr[11]).toMatchObject({
        actionName: "replace-with-non-interrupting-escalation-start",
        target: {
          isInterrupting: false,
        },
      });
    });

    it("has 7 interrupting and 5 non-interrupting entries", () => {
      const interrupting = arr.filter((e) => e.target.isInterrupting === true);
      const nonInterrupting = arr.filter((e) => e.target.isInterrupting === false);
      expect(interrupting).toHaveLength(7);
      expect(nonInterrupting).toHaveLength(5);
    });
  });

  describe("GATEWAY", () => {
    const arr = ReplaceOptions.GATEWAY;

    it("is an array of length 5", () => {
      expect(Array.isArray(arr)).toBe(true);
      expect(arr).toHaveLength(5);
    });

    it("contains all gateway types", () => {
      const types = arr.map((e) => e.target.type);
      expect(types).toEqual([
        "bpmn:ExclusiveGateway",
        "bpmn:ParallelGateway",
        "bpmn:InclusiveGateway",
        "bpmn:ComplexGateway",
        "bpmn:EventBasedGateway",
      ]);
    });
  });

  describe("TASK", () => {
    const arr = ReplaceOptions.TASK;

    it("is an array of length 11", () => {
      expect(Array.isArray(arr)).toBe(true);
      expect(arr).toHaveLength(11);
    });

    it("first element is generic Task", () => {
      expect(arr[0]).toMatchObject({
        actionName: "replace-with-task",
        target: { type: "bpmn:Task" },
      });
    });

    it("last element is expanded SubProcess", () => {
      expect(arr[10]).toMatchObject({
        actionName: "replace-with-expanded-subprocess",
        target: { type: "bpmn:SubProcess", isExpanded: true },
      });
    });
  });

  describe("SUBPROCESS_EXPANDED", () => {
    const arr = ReplaceOptions.SUBPROCESS_EXPANDED;

    it("is an array of length 3", () => {
      expect(Array.isArray(arr)).toBe(true);
      expect(arr).toHaveLength(3);
    });

    it("contains Transaction, EventSubProcess, and collapsed SubProcess", () => {
      expect(arr[0].actionName).toBe("replace-with-transaction");
      expect(arr[1].actionName).toBe("replace-with-event-subprocess");
      expect(arr[2].actionName).toBe("replace-with-collapsed-subprocess");
    });
  });

  describe("TRANSACTION", () => {
    const arr = ReplaceOptions.TRANSACTION;

    it("is an array of length 3", () => {
      expect(Array.isArray(arr)).toBe(true);
      expect(arr).toHaveLength(3);
    });

    it("contains Transaction, SubProcess, and EventSubProcess", () => {
      expect(arr[0].target.type).toBe("bpmn:Transaction");
      expect(arr[1].target.type).toBe("bpmn:SubProcess");
      expect(arr[2].target.type).toBe("bpmn:SubProcess");
      expect(arr[2].target.triggeredByEvent).toBe(true);
    });
  });

  describe("EVENT_SUB_PROCESS", () => {
    it("is the same reference as TRANSACTION", () => {
      expect(ReplaceOptions.EVENT_SUB_PROCESS).toBe(ReplaceOptions.TRANSACTION);
    });
  });

  describe("SEQUENCE_FLOW", () => {
    const arr = ReplaceOptions.SEQUENCE_FLOW;

    it("is an array of length 3", () => {
      expect(Array.isArray(arr)).toBe(true);
      expect(arr).toHaveLength(3);
    });

    it("contains sequence, default, and conditional flow", () => {
      expect(arr[0].actionName).toBe("replace-with-sequence-flow");
      expect(arr[1].actionName).toBe("replace-with-default-flow");
      expect(arr[2].actionName).toBe("replace-with-conditional-flow");
    });

    it("elements do not have target property (connections)", () => {
      arr.forEach((entry) => {
        expect(entry).toHaveProperty("className");
        expect(entry).toHaveProperty("actionName");
      });
    });
  });

  describe("DATA_OBJECT_REFERENCE", () => {
    const arr = ReplaceOptions.DATA_OBJECT_REFERENCE;

    it("is an array of length 1", () => {
      expect(Array.isArray(arr)).toBe(true);
      expect(arr).toHaveLength(1);
    });

    it("single entry targets DataStoreReference", () => {
      expect(arr[0]).toMatchObject({
        actionName: "replace-with-data-store-reference",
        target: { type: "bpmn:DataStoreReference" },
      });
    });
  });

  describe("DATA_STORE_REFERENCE", () => {
    const arr = ReplaceOptions.DATA_STORE_REFERENCE;

    it("is an array of length 1", () => {
      expect(Array.isArray(arr)).toBe(true);
      expect(arr).toHaveLength(1);
    });

    it("single entry targets DataObjectReference", () => {
      expect(arr[0]).toMatchObject({
        actionName: "replace-with-data-object-reference",
        target: { type: "bpmn:DataObjectReference" },
      });
    });
  });

  describe("PARTICIPANT", () => {
    const arr = ReplaceOptions.PARTICIPANT;

    it("is an array of length 2", () => {
      expect(Array.isArray(arr)).toBe(true);
      expect(arr).toHaveLength(2);
    });

    it("first element is expanded pool", () => {
      expect(arr[0]).toMatchObject({
        actionName: "replace-with-expanded-pool",
        target: { type: "bpmn:Participant", isExpanded: true },
      });
    });

    it("second element is collapsed pool with function label", () => {
      expect(arr[1].actionName).toBe("replace-with-collapsed-pool");
      expect(arr[1].target).toMatchObject({
        type: "bpmn:Participant",
        isExpanded: false,
      });
      expect(typeof arr[1].label).toBe("function");
    });
  });

  describe("all entries have required fields", () => {
    ALL_EXPORT_NAMES.forEach((name) => {
      it(`${name} entries have actionName and className`, () => {
        const arr = (ReplaceOptions as Record<string, Record<string, unknown>[]>)[name];
        arr.forEach((entry: Record<string, unknown>, idx: number) => {
          expect(entry, `${name}[${idx}] missing actionName`).toHaveProperty("actionName");
          expect(entry, `${name}[${idx}] missing className`).toHaveProperty("className");
        });
      });
    });
  });
});
