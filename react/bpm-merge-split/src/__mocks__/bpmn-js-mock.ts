import { vi } from "vitest";

/**
 * Mock BpmnModeler class for testing bpm-merge-split components.
 * Provides stubs for all bpmn-js v18 APIs used in BpmnPreviews and ParticipantSelector.
 */

interface MockServices {
  [key: string]: Record<string, unknown>;
}

export class MockBpmnModeler {
  _services: MockServices;
  importXML: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;

  constructor() {
    this._services = {
      canvas: { zoom: vi.fn() },
      readOnly: { readOnly: vi.fn() },
      elementRegistry: {
        filter: vi.fn(() => []),
        getAll: vi.fn(() => []),
        getGraphics: vi.fn(),
        get: vi.fn(),
      },
      modeling: { updateProperties: vi.fn() },
    };
    this.importXML = vi.fn(() => Promise.resolve({ warnings: [] }));
    this.on = vi.fn();
    this.off = vi.fn();
    this.destroy = vi.fn();
  }

  get(serviceName: string): Record<string, unknown> | null {
    return this._services[serviceName] || null;
  }
}

/**
 * Setup vi.mock calls for bpmn-js modules.
 * Call this in test files that need bpmn-js mocking.
 */
export function setupBpmnMocks(): void {
  vi.mock("bpmn-js/lib/Modeler", () => ({
    default: MockBpmnModeler,
  }));

  vi.mock("bpmn-js/lib/util/ModelUtil", () => ({
    getBusinessObject: vi.fn(
      (element: unknown) => (element as Record<string, unknown>)?.businessObject || {},
    ),
  }));
}
