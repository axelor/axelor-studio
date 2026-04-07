import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";

interface _MockServices {
  [key: string]: Record<string, unknown> | null;
}

// --- bpmn-js mock: use vi.hoisted to make variables available in hoisted vi.mock ---
const {
  MockModeler,
  mockImportXML,
  mockDestroy,
  mockOn,
  mockOff: _mockOff,
  mockCanvas,
  mockReadOnly,
  mockElementRegistry,
  mockModeling: _mockModeling,
} = vi.hoisted(() => {
  const mockCanvas = { zoom: vi.fn() };
  const mockReadOnly = { readOnly: vi.fn() };
  const mockElementRegistry = {
    filter: vi.fn(() => [] as { id: string; type: string }[]),
    getAll: vi.fn(() => [] as { id: string; type: string }[]),
    getGraphics: vi.fn(),
    get: vi.fn(),
  };
  const mockModeling = { updateProperties: vi.fn() };
  const mockImportXML = vi.fn(() => Promise.resolve({ warnings: [] }));
  const mockDestroy = vi.fn();
  const mockOn = vi.fn();
  const mockOff = vi.fn();

  const services: Record<string, Record<string, unknown>> = {
    canvas: mockCanvas,
    readOnly: mockReadOnly,
    elementRegistry: mockElementRegistry,
    modeling: mockModeling,
  };

  const MockModeler = vi.fn().mockImplementation(() => ({
    importXML: mockImportXML,
    get: vi.fn((name: string) => services[name] || null),
    on: mockOn,
    off: mockOff,
    destroy: mockDestroy,
  }));

  return {
    MockModeler,
    mockImportXML,
    mockDestroy,
    mockOn,
    mockOff,
    mockCanvas,
    mockReadOnly,
    mockElementRegistry,
    mockModeling,
  };
});

vi.mock("bpmn-js/lib/Modeler", () => ({
  default: MockModeler,
}));

vi.mock("bpmn-js/lib/util/ModelUtil", () => ({
  getBusinessObject: vi.fn((el: unknown) => (el as Record<string, unknown>)?.businessObject || {}),
}));

vi.mock("../custom/readonly", () => ({
  default: { __init__: ["readOnly"], readOnly: ["type", class {}] },
}));

vi.mock("../css/bpmn.css", () => ({}));

vi.mock("../services/api", () => ({
  getInfo: vi.fn(() => Promise.resolve({ user: { lang: "en" } })),
  getTranslations: vi.fn(() => Promise.resolve([])),
}));

vi.mock("../context/TabChangeContext", () => ({
  useTab: () => ({ tabVisible: true }),
}));

import { useBpmnViewer } from "../hooks/useBpmnViewer";

describe("useBpmnViewer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const container = document.createElement("div");
    container.id = "test-canvas";
    document.body.appendChild(container);
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("creates BpmnModeler with correct container and additionalModules when enabled=true and diagramXml is provided", async () => {
    renderHook(() =>
      useBpmnViewer({
        containerId: "#test-canvas",
        diagramXml: "<xml>test</xml>",
        enabled: true,
      }),
    );

    await vi.waitFor(() => {
      expect(MockModeler).toHaveBeenCalledTimes(1);
    });

    const constructorCall = MockModeler.mock.calls[0][0] as Record<string, unknown>;
    expect(constructorCall.container).toBe("#test-canvas");
    expect(constructorCall.additionalModules).toBeDefined();
    expect(Array.isArray(constructorCall.additionalModules)).toBe(true);
  });

  it("calls importXML with diagramXml and canvas.zoom('fit-viewport') after import", async () => {
    renderHook(() =>
      useBpmnViewer({
        containerId: "#test-canvas",
        diagramXml: "<xml>diagram</xml>",
        enabled: true,
      }),
    );

    await vi.waitFor(() => {
      expect(mockImportXML).toHaveBeenCalledWith("<xml>diagram</xml>");
    });

    await vi.waitFor(() => {
      expect(mockCanvas.zoom).toHaveBeenCalledWith("fit-viewport", "auto");
    });
  });

  it("activates readOnly module when readOnly=true", async () => {
    renderHook(() =>
      useBpmnViewer({
        containerId: "#test-canvas",
        diagramXml: "<xml>test</xml>",
        readOnly: true,
        enabled: true,
      }),
    );

    await vi.waitFor(() => {
      expect(mockReadOnly.readOnly).toHaveBeenCalledWith(true);
    });
  });

  it("calls destroy() on cleanup (unmount)", async () => {
    const { unmount } = renderHook(() =>
      useBpmnViewer({
        containerId: "#test-canvas",
        diagramXml: "<xml>test</xml>",
        enabled: true,
      }),
    );

    await vi.waitFor(() => {
      expect(MockModeler).toHaveBeenCalledTimes(1);
    });

    unmount();

    expect(mockDestroy).toHaveBeenCalled();
  });

  it("does NOT create viewer when enabled=false", async () => {
    renderHook(() =>
      useBpmnViewer({
        containerId: "#test-canvas",
        diagramXml: "<xml>test</xml>",
        enabled: false,
      }),
    );

    await new Promise((r) => setTimeout(r, 50));

    expect(MockModeler).not.toHaveBeenCalled();
  });

  it("does NOT create viewer when diagramXml is null", async () => {
    renderHook(() =>
      useBpmnViewer({
        containerId: "#test-canvas",
        diagramXml: null,
        enabled: true,
      }),
    );

    await new Promise((r) => setTimeout(r, 50));

    expect(MockModeler).not.toHaveBeenCalled();
  });

  it("participant highlighting updates SVG styles without recreating viewer (separate effect)", async () => {
    const mockGfx = {
      querySelector: vi.fn(() => ({
        childNodes: [{ style: {} }],
      })),
    };
    mockElementRegistry.filter.mockReturnValue([
      { id: "p1", type: "bpmn:Participant" },
      { id: "p2", type: "bpmn:Participant" },
    ]);
    mockElementRegistry.getGraphics.mockReturnValue(mockGfx);

    const { rerender } = renderHook(
      ({ selectedParticipants }: { selectedParticipants: string[] }) =>
        useBpmnViewer({
          containerId: "#test-canvas",
          diagramXml: "<xml>test</xml>",
          enabled: true,
          selectedParticipants: selectedParticipants,
        }),
      { initialProps: { selectedParticipants: ["p1"] } },
    );

    await vi.waitFor(() => {
      expect(MockModeler).toHaveBeenCalledTimes(1);
    });

    MockModeler.mockClear();

    rerender({ selectedParticipants: ["p1", "p2"] });

    await new Promise((r) => setTimeout(r, 50));

    expect(MockModeler).not.toHaveBeenCalled();
  });

  it("provides participants from elementRegistry filter", async () => {
    const participantList = [
      { id: "p1", type: "bpmn:Participant" },
      { id: "p2", type: "bpmn:Participant" },
    ];
    mockElementRegistry.filter.mockReturnValue(participantList);

    const { result } = renderHook(() =>
      useBpmnViewer({
        containerId: "#test-canvas",
        diagramXml: "<xml>test</xml>",
        enabled: true,
      }),
    );

    await vi.waitFor(() => {
      expect(result.current.participants).toBeDefined();
    });
  });

  it("supports onElementClick callback for element.click events", async () => {
    const handleClick = vi.fn();

    renderHook(() =>
      useBpmnViewer({
        containerId: "#test-canvas",
        diagramXml: "<xml>test</xml>",
        enabled: true,
        onElementClick: handleClick,
      }),
    );

    await vi.waitFor(() => {
      expect(mockOn).toHaveBeenCalledWith("element.click", handleClick);
    });
  });
});
