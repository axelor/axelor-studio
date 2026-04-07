import { describe, it, expect, vi, beforeAll } from "vitest";

/**
 * Characterization tests for BpmnRenderer
 *
 * These tests lock the constructor contract, $inject array, prototype methods,
 * and the complete set of element type handlers so decomposition regressions
 * are caught immediately.
 *
 * Static import is used to avoid heavy component dependency tree (Phase 4 decision).
 * We mock the external dependencies at module level.
 */

// Mock external dependencies that BpmnRenderer imports
vi.mock("diagram-js/lib/draw/BaseRenderer", () => ({
  default: vi.fn(),
}));

vi.mock("bpmn-js/lib/util/DiUtil", () => ({
  isEventSubProcess: vi.fn(),
  isExpanded: vi.fn(),
}));

vi.mock("bpmn-js/lib/util/ModelUtil", () => ({
  is: vi.fn((element: { type?: string }, type: string) => element?.type === type),
}));

vi.mock("bpmn-js/lib/features/label-editing/LabelUtil", () => ({
  getLabel: vi.fn(),
}));

vi.mock("diagram-js/lib/util/RenderUtil", () => ({
  createLine: vi.fn(() => ({})),
}));

vi.mock("bpmn-js/lib/draw/BpmnRenderUtil", () => ({
  isTypedEvent: vi.fn(),
  isThrowEvent: vi.fn(),
  isCollection: vi.fn(),
  getDi: vi.fn(() => ({})),
  getSemantic: vi.fn(() => ({})),
  getCirclePath: vi.fn(() => ""),
  getRoundRectPath: vi.fn(() => ""),
  getDiamondPath: vi.fn(() => ""),
  getRectPath: vi.fn(() => ""),
  getFillColor: vi.fn(() => "#fff"),
  getStrokeColor: vi.fn(() => "#000"),
}));

vi.mock("min-dom", () => ({
  query: vi.fn(),
}));

vi.mock("tiny-svg", () => ({
  append: vi.fn(),
  attr: vi.fn(),
  create: vi.fn(() => ({
    appendChild: vi.fn(),
    setAttribute: vi.fn(),
  })),
  classes: vi.fn(() => ({ add: vi.fn() })),
}));

vi.mock("diagram-js/lib/util/SvgTransformUtil", () => ({
  rotate: vi.fn(),
  transform: vi.fn(),
  translate: vi.fn(),
}));

vi.mock("ids", () => ({
  default: vi.fn().mockImplementation(() => ({
    next: vi.fn(() => "test-id"),
  })),
}));

// Now import BpmnRenderer after mocks are set up
import BpmnRenderer from "../features/renderer/BpmnRenderer";

describe("BpmnRenderer", () => {
  describe("constructor and $inject", () => {
    it("is a class (function)", () => {
      expect(typeof BpmnRenderer).toBe("function");
    });

    it("has correct $inject array", () => {
      expect(BpmnRenderer.$inject).toEqual([
        "config.bpmnRenderer",
        "eventBus",
        "styles",
        "pathMap",
        "canvas",
        "textRenderer",
      ]);
    });
  });

  describe("class methods", () => {
    it("has canRender method", () => {
      expect(typeof BpmnRenderer.prototype.canRender).toBe("function");
    });

    it("has drawShape method", () => {
      expect(typeof BpmnRenderer.prototype.drawShape).toBe("function");
    });

    it("has drawConnection method", () => {
      expect(typeof BpmnRenderer.prototype.drawConnection).toBe("function");
    });

    it("has getShapePath method", () => {
      expect(typeof BpmnRenderer.prototype.getShapePath).toBe("function");
    });
  });

  describe("handler keys", () => {
    let instance: BpmnRenderer;

    beforeAll(() => {
      // Create instance with mocked dependencies
      const mockEventBus = { on: vi.fn() };
      const mockStyles = {
        computeStyle: vi.fn((_ignored: unknown, base: unknown) => base || {}),
        style: vi.fn(() => ({})),
      };
      const mockPathMap = {
        getScaledPath: vi.fn(() => "M0 0"),
        getRawPath: vi.fn(() => "M0 0"),
      };
      const mockCanvas = {
        _svg: {} as SVGElement,
        getContainer: vi.fn(() => ({
          querySelector: vi.fn(() => ({
            appendChild: vi.fn(),
          })),
        })),
      };
      const mockTextRenderer = {
        createText: vi.fn(() => ({
          appendChild: vi.fn(),
          setAttribute: vi.fn(),
        })),
        getDefaultStyle: vi.fn(() => ({ fontSize: 12 })),
        getExternalStyle: vi.fn(() => ({ fontSize: 12 })),
      };

      instance = new (BpmnRenderer as unknown as new (...args: unknown[]) => BpmnRenderer)(
        {}, // config
        mockEventBus,
        mockStyles,
        mockPathMap,
        mockCanvas,
        mockTextRenderer,
      );
    });

    it("handlers object is populated", () => {
      expect(instance.handlers).toBeDefined();
      expect(typeof instance.handlers).toBe("object");
    });

    it("contains all expected BPMN element handler keys", () => {
      const handlerKeys = Object.keys(instance.handlers).sort();

      expect(handlerKeys).toMatchInlineSnapshot(`
        [
          "AdhocMarker",
          "CompensationMarker",
          "LoopMarker",
          "ParallelMarker",
          "ParticipantMultiplicityMarker",
          "SequentialMarker",
          "SubProcessMarker",
          "bpmn:Activity",
          "bpmn:AdHocSubProcess",
          "bpmn:Association",
          "bpmn:BoundaryEvent",
          "bpmn:BusinessRuleTask",
          "bpmn:CallActivity",
          "bpmn:CancelEventDefinition",
          "bpmn:CompensateEventDefinition",
          "bpmn:ComplexGateway",
          "bpmn:ConditionalEventDefinition",
          "bpmn:DataInput",
          "bpmn:DataInputAssociation",
          "bpmn:DataObject",
          "bpmn:DataObjectReference",
          "bpmn:DataOutput",
          "bpmn:DataOutputAssociation",
          "bpmn:DataStoreReference",
          "bpmn:EndEvent",
          "bpmn:ErrorEventDefinition",
          "bpmn:EscalationEventDefinition",
          "bpmn:Event",
          "bpmn:EventBasedGateway",
          "bpmn:ExclusiveGateway",
          "bpmn:Gateway",
          "bpmn:Group",
          "bpmn:InclusiveGateway",
          "bpmn:IntermediateCatchEvent",
          "bpmn:IntermediateEvent",
          "bpmn:IntermediateThrowEvent",
          "bpmn:Lane",
          "bpmn:LinkEventDefinition",
          "bpmn:ManualTask",
          "bpmn:MessageEventDefinition",
          "bpmn:MessageFlow",
          "bpmn:MultipleEventDefinition",
          "bpmn:ParallelGateway",
          "bpmn:ParallelMultipleEventDefinition",
          "bpmn:Participant",
          "bpmn:ReceiveTask",
          "bpmn:ScriptTask",
          "bpmn:SendTask",
          "bpmn:SequenceFlow",
          "bpmn:ServiceTask",
          "bpmn:SignalEventDefinition",
          "bpmn:StartEvent",
          "bpmn:SubProcess",
          "bpmn:Task",
          "bpmn:TerminateEventDefinition",
          "bpmn:TextAnnotation",
          "bpmn:TimerEventDefinition",
          "bpmn:Transaction",
          "bpmn:UserTask",
          "label",
        ]
      `);
    });

    it("has exactly 60 handler keys", () => {
      expect(Object.keys(instance.handlers)).toHaveLength(60);
    });

    it("all handlers are functions", () => {
      Object.entries(instance.handlers).forEach(([key, handler]) => {
        expect(typeof handler, `handler for ${key} is not a function`).toBe("function");
      });
    });
  });

  describe("canRender", () => {
    it("is defined on the prototype", () => {
      expect(typeof BpmnRenderer.prototype.canRender).toBe("function");
    });
  });
});
