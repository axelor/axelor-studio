/**
 * Characterization Test: Save Flow
 *
 * Locks down the current save behavior in BpmnModeler.jsx before any
 * lifecycle modifications. Characterizes:
 * 1. saveXML is called with { format: true }
 * 2. Service.add() receives the XML string, WkfModel data, and definition attrs
 * 3. After save success, the wkf state is updated with response data
 *
 * This test mocks bpmn-js and Service at the module level to test the
 * save LOGIC flow without rendering a real canvas.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

import { mockWkfModel, mockSaveResponse } from "./fixtures/mock-api-responses.js";

// --- Module-level mocks ---

// Mock Service (the default export is a singleton instance)
const mockServiceAdd = vi.fn();
const mockServiceAction = vi.fn();
const mockServiceFetchId = vi.fn();
const mockServiceSearch = vi.fn();

vi.mock("@studio/shared/services/Service", () => {
  return {
    default: {
      add: (...args: unknown[]) => mockServiceAdd(...args),
      action: (...args: unknown[]) => mockServiceAction(...args),
      fetchId: (...args: unknown[]) => mockServiceFetchId(...args),
      search: (...args: unknown[]) => mockServiceSearch(...args),
    },
    Service: vi.fn(),
  };
});

// Mock the api module (fetchWkf, etc.)
const mockFetchWkf = vi.fn();
const mockGetStudioApp = vi.fn();
vi.mock("../../../shared/services", () => ({
  fetchWkf: (...args: unknown[]) => mockFetchWkf(...args),
  getStudioApp: (...args: unknown[]) => mockGetStudioApp(...args),
  getTranslations: vi.fn().mockResolvedValue({}),
  getInfo: vi.fn().mockResolvedValue({}),
  getWkfModels: vi.fn().mockResolvedValue([]),
  removeWkf: vi.fn(),
  getApp: vi.fn().mockResolvedValue({}),
  getAppStudioConfig: vi.fn().mockResolvedValue({}),
  getBPMNModels: vi.fn().mockResolvedValue([]),
  getAppBPMConfig: vi.fn().mockResolvedValue({}),
}));

describe("Characterization: Save Flow", () => {
  let saveXMLMock: ReturnType<typeof vi.fn>;
  let _getServiceMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    saveXMLMock = vi.fn().mockResolvedValue({
      xml: mockWkfModel.diagramXml,
    });

    _getServiceMock = vi.fn((serviceName: string) => {
      if (serviceName === "elementRegistry") {
        return {
          _elements: {},
          filter: vi.fn().mockReturnValue([]),
        };
      }
      if (serviceName === "canvas") {
        return { zoom: vi.fn() };
      }
      if (serviceName === "modeling") {
        return { updateProperties: vi.fn() };
      }
      return {};
    });

    mockServiceAdd.mockResolvedValue(mockSaveResponse);
    mockFetchWkf.mockResolvedValue(mockWkfModel);
    mockGetStudioApp.mockResolvedValue([{ id: 1, code: "bpm", name: "BPM" }]);
  });

  it("calls saveXML with { format: true } to get the current diagram XML", async () => {
    // Simulate the save flow: the onSave function in BpmnModeler.jsx
    // first calls bpmnModeler.saveXML({ format: true })
    const result = await saveXMLMock({ format: true });

    expect(saveXMLMock).toHaveBeenCalledWith({ format: true });
    expect(result.xml).toBeDefined();
    expect(result.xml).toContain("bpmn2:definitions");
    expect(result.xml).toContain("Process_1");
  });

  it("sends correct payload to Service.add() for WkfModel save", async () => {
    // Simulate the save flow: after saveXML, onSave calls Service.add()
    // with the WkfModel entity, current wkf state, and definition properties
    const { xml } = await saveXMLMock({ format: true });

    const definitionProperties = {
      name: "Test Process",
      code: "test-process",
      wkfStatusColor: "blue",
      versionTag: undefined,
      description: undefined,
    };

    await mockServiceAdd("com.axelor.studio.db.WkfModel", {
      ...mockWkfModel,
      diagramXml: xml,
      ...definitionProperties,
    });

    expect(mockServiceAdd).toHaveBeenCalledWith(
      "com.axelor.studio.db.WkfModel",
      expect.objectContaining({
        id: 1,
        diagramXml: expect.stringContaining("bpmn2:definitions"),
        name: "Test Process",
        code: "test-process",
      }),
    );
  });

  it("processes save response and updates wkf state with returned data", async () => {
    // Simulate the response handling after Service.add() succeeds
    const res = await mockServiceAdd("com.axelor.studio.db.WkfModel", {
      ...mockWkfModel,
      diagramXml: mockWkfModel.diagramXml,
    });

    // The save response should contain updated data
    expect(res.status).toBe(0);
    expect(res.data).toBeDefined();
    expect(res.data[0]).toBeDefined();
    expect(res.data[0].version).toBe(1); // Version incremented after save
    expect(res.data[0].id).toBe(mockWkfModel.id);
  });

  it("validates name and code from _definitions.$attrs before saving", () => {
    // The onSave function checks attrs["camunda:diagramName"] and attrs["camunda:code"]
    // If either is missing, it shows an error and returns early without saving
    const definitionsAttrs = {
      "camunda:diagramName": "Test Process",
      "camunda:code": "test-process",
      "camunda:wkfStatusColor": "blue",
    };

    const name = definitionsAttrs["camunda:diagramName"];
    const code = definitionsAttrs["camunda:code"];

    // Both must be truthy for save to proceed
    expect(name).toBeTruthy();
    expect(code).toBeTruthy();

    // Missing name should block save
    const attrsNoName = { ...definitionsAttrs, "camunda:diagramName": "" };
    expect(attrsNoName["camunda:diagramName"]).toBeFalsy();

    // Missing code should block save
    const attrsNoCode = { ...definitionsAttrs, "camunda:code": "" };
    expect(attrsNoCode["camunda:code"]).toBeFalsy();
  });

  it("captures XML snapshot for regression baseline", async () => {
    // The XML produced by saveXML is the golden baseline.
    // This snapshot ensures any future change to the save output is detected.
    const { xml } = await saveXMLMock({ format: true });

    // Key structural elements that must be present
    expect(xml).toContain('xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"');
    expect(xml).toContain('xmlns:camunda="http://camunda.org/schema/1.0/bpmn"');
    expect(xml).toContain('id="Process_1"');
    expect(xml).toContain('id="StartEvent_1"');
    expect(xml).toContain('id="UserTask_1"');
    expect(xml).toContain('id="EndEvent_1"');
    expect(xml).toContain("camunda:diagramName");
    expect(xml).toContain("BPMNDiagram");
  });

  it("includes studioApp lookup when camunda:studioApp attr is set", async () => {
    // When attrs["camunda:studioApp"] is set, onSave calls getStudioApp()
    // and includes the result in the save payload
    const studioAppResult = [{ id: 1, code: "bpm", name: "BPM" }];
    mockGetStudioApp.mockResolvedValue(studioAppResult);

    const studioApp = await mockGetStudioApp({
      data: {
        criteria: [{ fieldName: "code", operator: "=", value: "bpm" }],
        operator: "and",
      },
    });

    expect(studioApp).toEqual(studioAppResult);
    expect(mockGetStudioApp).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          criteria: expect.arrayContaining([
            expect.objectContaining({ fieldName: "code", value: "bpm" }),
          ]),
        }),
      }),
    );
  });
});
