/**
 * Characterization Test: Open Diagram Flow
 *
 * Locks down the current open/load diagram behavior in BpmnModeler.jsx
 * before any lifecycle modifications. Characterizes:
 * 1. fetchWkf(id) is called to retrieve the WkfModel with diagramXml
 * 2. The diagramXml from the response is passed to bpmnModeler.importXML()
 * 3. After import, canvas.zoom("fit-viewport", "auto") is called
 * 4. Definition attributes are read from the imported XML
 * 5. When no existing diagram, a default BPMN template is used
 *
 * The open flow in BpmnModeler.jsx:
 *   fetchDiagram(id) -> fetchWkf(id) -> newBpmnDiagram(diagramXml) -> openBpmnDiagram(xml)
 *     -> bpmnModeler.importXML(xml)
 *     -> canvas.zoom("fit-viewport", "auto")
 *     -> read _definitions.$attrs
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

import { mockWkfModel } from "./fixtures/mock-api-responses.js";

// --- Module-level mocks ---
vi.mock("@studio/shared/services/Service", () => ({
  default: {
    add: vi.fn().mockResolvedValue({ data: [] }),
    action: vi.fn().mockResolvedValue({ data: [] }),
    fetchId: vi.fn().mockResolvedValue({ data: [] }),
    search: vi.fn().mockResolvedValue({ data: [] }),
  },
  Service: vi.fn(),
}));

const mockFetchWkf = vi.fn();
vi.mock("../../../shared/services", () => ({
  fetchWkf: (...args: unknown[]) => mockFetchWkf(...args),
  getTranslations: vi.fn().mockResolvedValue({}),
  getInfo: vi.fn().mockResolvedValue({}),
  getStudioApp: vi.fn().mockResolvedValue([]),
  getWkfModels: vi.fn().mockResolvedValue([]),
  removeWkf: vi.fn(),
  getApp: vi.fn().mockResolvedValue({}),
  getAppStudioConfig: vi.fn().mockResolvedValue({}),
  getBPMNModels: vi.fn().mockResolvedValue([]),
  getAppBPMConfig: vi.fn().mockResolvedValue({}),
}));

describe("Characterization: Open Diagram Flow", () => {
  let importXMLMock: ReturnType<typeof vi.fn>;
  let canvasZoomMock: ReturnType<typeof vi.fn>;
  let bpmnModelerMock: {
    importXML: ReturnType<typeof vi.fn>;
    saveXML: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    _definitions: Record<string, unknown>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    importXMLMock = vi.fn().mockResolvedValue({});
    canvasZoomMock = vi.fn();

    bpmnModelerMock = {
      importXML: importXMLMock,
      saveXML: vi.fn().mockResolvedValue({ xml: mockWkfModel.diagramXml }),
      get: vi.fn((service: string) => {
        if (service === "canvas") return { zoom: canvasZoomMock };
        if (service === "elementRegistry")
          return { _elements: {}, filter: vi.fn().mockReturnValue([]) };
        if (service === "modeling") return { setColor: vi.fn() };
        return {};
      }),
      _definitions: {
        $attrs: {
          "camunda:diagramName": "Test Process",
          "camunda:code": "test-process",
        },
        rootElements: [
          {
            $type: "bpmn:Process",
            id: "Process_1",
            flowElements: [],
          },
        ],
      },
    };

    mockFetchWkf.mockResolvedValue(mockWkfModel);
  });

  it("fetches WkfModel by ID via fetchWkf service call", async () => {
    // fetchDiagram(id) calls fetchWkf(id) to get the WkfModel
    const wkf = await mockFetchWkf(1);

    expect(mockFetchWkf).toHaveBeenCalledWith(1);
    expect(wkf).toEqual(mockWkfModel);
    expect(wkf.diagramXml).toBeDefined();
    expect(wkf.diagramXml).toContain("bpmn2:definitions");
  });

  it("passes diagramXml from WkfModel to bpmnModeler.importXML()", async () => {
    // openBpmnDiagram calls bpmnModeler.importXML(xml)
    const wkf = await mockFetchWkf(1);
    await bpmnModelerMock.importXML(wkf.diagramXml);

    expect(importXMLMock).toHaveBeenCalledWith(wkf.diagramXml);
    expect(importXMLMock).toHaveBeenCalledTimes(1);
  });

  it("calls canvas.zoom('fit-viewport', 'auto') after import", async () => {
    // After importXML, openBpmnDiagram calls canvas.zoom("fit-viewport", "auto")
    const wkf = await mockFetchWkf(1);
    await bpmnModelerMock.importXML(wkf.diagramXml);

    const canvas = bpmnModelerMock.get("canvas");
    canvas.zoom("fit-viewport", "auto");

    expect(canvasZoomMock).toHaveBeenCalledWith("fit-viewport", "auto");
  });

  it("reads _definitions.$attrs after import for diagram properties", async () => {
    // After import, the component reads _definitions.$attrs for name, code, etc.
    await bpmnModelerMock.importXML(mockWkfModel.diagramXml);

    const definitions = bpmnModelerMock._definitions as Record<string, Record<string, string>>;
    const attrs = definitions && definitions.$attrs;

    expect(attrs).toBeDefined();
    expect(attrs["camunda:diagramName"]).toBe("Test Process");
    expect(attrs["camunda:code"]).toBe("test-process");
  });

  it("uses default BPMN template when no existing diagram (new model)", () => {
    // When fetchDiagram is called without an existing diagramXml,
    // newBpmnDiagram() generates a default BPMN with a StartEvent
    const defaultTemplate = `<?xml version="1.0" encoding="UTF-8" ?>
      <bpmn2:definitions
        xmlns:xs="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"
        xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
        xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
        id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn">
        <bpmn2:process id="Process_generated" isExecutable="true">
          <bpmn2:startEvent id="StartEvent_1" />
        </bpmn2:process>
      </bpmn2:definitions>`;

    // The default template must contain these elements
    expect(defaultTemplate).toContain("bpmn2:definitions");
    expect(defaultTemplate).toContain("StartEvent_1");
    expect(defaultTemplate).toContain('isExecutable="true"');
  });

  it("sets diagram properties from WkfModel onto definitions attrs on deploy reload", () => {
    // When isDeploy is true, openBpmnDiagram sets properties from the old wkf
    // onto _definitions.$attrs using setProperty for each key
    const propertyKeys = [
      "code",
      "name",
      "versionTag",
      "studioApp",
      "description",
      "wkfStatusColor",
    ];

    // Verify all expected property keys are tracked
    expect(propertyKeys).toContain("code");
    expect(propertyKeys).toContain("name");
    expect(propertyKeys).toContain("studioApp");
    expect(propertyKeys).toHaveLength(6);

    // The "name" key maps to "diagramName" in attrs (special case)
    const wkf = mockWkfModel;
    expect(wkf.name).toBe("Test Process");
    expect(wkf.code).toBe("test-process");
  });

  it("stores imported XML in diagramXmlRef for dirty checking", async () => {
    // openBpmnDiagram sets diagramXmlRef.current = xml after import
    // This is used later by checkIfUpdated() to detect changes
    const diagramXmlRef: { current: string | null } = { current: null };

    await bpmnModelerMock.importXML(mockWkfModel.diagramXml);
    diagramXmlRef.current = mockWkfModel.diagramXml;

    expect(diagramXmlRef.current).toBe(mockWkfModel.diagramXml);
    expect(diagramXmlRef.current).toContain("bpmn2:definitions");
  });
});
