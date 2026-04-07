import { vi } from "vitest";

/**
 * Mock bpmn-js NavigatedViewer for jsdom environment.
 * jsdom does not support createElementNS / getBBox needed by bpmn-js SVG rendering.
 */

const mockCanvas = {
  zoom: vi.fn().mockReturnValue(1),
  viewbox: vi
    .fn()
    .mockReturnValue({ x: 0, y: 0, width: 1000, height: 600 }),
  getAbsoluteBBox: vi
    .fn()
    .mockReturnValue({ x: 0, y: 0, width: 100, height: 80 }),
  addMarker: vi.fn(),
  removeMarker: vi.fn(),
};

const mockOverlays = {
  add: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
};

const mockElementRegistry = {
  get: vi
    .fn()
    .mockReturnValue({ id: "mock-element", type: "bpmn:UserTask" }),
  getAll: vi.fn().mockReturnValue([]),
  forEach: vi.fn(),
};

const mockEventBus = {
  on: vi.fn(),
  off: vi.fn(),
  fire: vi.fn(),
};

class MockNavigatedViewer {
  private container: HTMLElement | null = null;

  constructor(options?: { container?: HTMLElement }) {
    this.container = options?.container ?? null;
  }

  async importXML(_xml: string) {
    return { warnings: [] };
  }

  get(service: string) {
    const services: Record<string, unknown> = {
      canvas: mockCanvas,
      overlays: mockOverlays,
      elementRegistry: mockElementRegistry,
      eventBus: mockEventBus,
    };
    return services[service] ?? null;
  }

  on(event: string, callback: (...args: unknown[]) => void) {
    mockEventBus.on(event, callback);
  }

  off(event: string, callback: (...args: unknown[]) => void) {
    mockEventBus.off(event, callback);
  }

  destroy() {
    this.container = null;
  }
}

vi.mock("bpmn-js/lib/NavigatedViewer", () => ({
  default: MockNavigatedViewer,
}));

export {
  MockNavigatedViewer,
  mockCanvas,
  mockOverlays,
  mockElementRegistry,
  mockEventBus,
};
