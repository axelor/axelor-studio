import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

// Mock modeler-api
vi.mock("../../BPMN/Modeler/utils/modeler-api", () => ({
  getDefinitionAttrs: vi.fn(),
  getProcesses: vi.fn(),
}));

// Mock shared/services
vi.mock("@studio/shared/services", () => ({
  getStudioApp: vi.fn(),
}));

// Mock wkf-api
vi.mock("../wkf-api", () => ({
  saveWkfModel: vi.fn(),
}));

import { getStudioApp } from "@studio/shared/services";

import { prepareSavePayload, executeSave } from "../save-service";
import { getDefinitionAttrs } from "../../BPMN/Modeler/utils/modeler-api";
import { saveWkfModel } from "../wkf-api";

function createMockModeler(xml = "<bpmn/>", svg = "<svg/>") {
  return {
    saveXML: vi.fn().mockResolvedValue({ xml }),
    saveSVG: vi.fn().mockResolvedValue({ svg }),
  } as unknown as Parameters<typeof prepareSavePayload>[0] & { saveXML: ReturnType<typeof vi.fn> };
}

function createMockWkf(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    version: 1,
    name: "Test WKF",
    code: "TST",
    ...overrides,
  };
}

describe("save-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("prepareSavePayload", () => {
    it("builds payload with XML, attrs and studioApp merged onto wkf", async () => {
      const modeler = createMockModeler("<bpmn>xml</bpmn>", "<svg>data</svg>");
      const wkf = createMockWkf();

      (getDefinitionAttrs as Mock).mockReturnValue({
        "camunda:diagramName": "My Diagram",
        "camunda:code": "DIA",
        "camunda:wkfStatusColor": "red",
        "camunda:versionTag": "v1",
        "camunda:description": "A desc",
        "camunda:studioApp": "myApp",
      });

      (getStudioApp as Mock).mockResolvedValue([{ id: 10, code: "myApp" }]);

      const payload = await prepareSavePayload(modeler, wkf);

      expect(modeler.saveXML).toHaveBeenCalledWith({ format: true });
      expect(payload.diagramXml).toBe("<bpmn>xml</bpmn>");
      expect(payload.name).toBe("My Diagram");
      expect(payload.code).toBe("DIA");
      expect(payload.wkfStatusColor).toBe("red");
      expect(payload.versionTag).toBe("v1");
      expect(payload.description).toBe("A desc");
      expect(payload.studioApp).toEqual({ id: 10, code: "myApp" });
      // original wkf fields preserved
      expect(payload.id).toBe(1);
    });

    it("sets wkfStatusColor to blue by default", async () => {
      const modeler = createMockModeler();
      const wkf = createMockWkf();

      (getDefinitionAttrs as Mock).mockReturnValue({
        "camunda:diagramName": "Test",
        "camunda:code": "TST",
      });

      (getStudioApp as Mock).mockResolvedValue(undefined);

      const payload = await prepareSavePayload(modeler, wkf);

      expect(payload.wkfStatusColor).toBe("blue");
      expect(payload.studioApp).toBeUndefined();
    });
  });

  describe("executeSave", () => {
    it("calls saveWkfModel with prepared payload and returns success", async () => {
      const modeler = createMockModeler();
      const wkf = createMockWkf();
      const savedWkf = { id: 1, version: 2, name: "Saved" };

      (getDefinitionAttrs as Mock).mockReturnValue({
        "camunda:diagramName": "Test",
        "camunda:code": "TST",
      });
      (getStudioApp as Mock).mockResolvedValue(undefined);

      (saveWkfModel as Mock).mockResolvedValue({ success: true, data: savedWkf });

      const result = await executeSave(modeler, wkf);

      expect(saveWkfModel).toHaveBeenCalledWith(
        expect.objectContaining({
          diagramXml: "<bpmn/>",
          name: "Test",
          code: "TST",
        }),
      );
      expect(result).toEqual({ success: true, data: savedWkf });
    });

    it("returns error when saveWkfModel fails", async () => {
      const modeler = createMockModeler();
      const wkf = createMockWkf();

      (getDefinitionAttrs as Mock).mockReturnValue({
        "camunda:diagramName": "Test",
        "camunda:code": "TST",
      });
      (getStudioApp as Mock).mockResolvedValue(undefined);

      (saveWkfModel as Mock).mockResolvedValue({ success: false, error: "Save failed" });

      const result = await executeSave(modeler, wkf);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Save failed");
    });

    it("returns error when saveWkfModel returns no data", async () => {
      const modeler = createMockModeler();
      const wkf = createMockWkf();

      (getDefinitionAttrs as Mock).mockReturnValue({
        "camunda:diagramName": "Test",
        "camunda:code": "TST",
      });
      (getStudioApp as Mock).mockResolvedValue(undefined);

      (saveWkfModel as Mock).mockResolvedValue({ success: false, error: "Save failed" });

      const result = await executeSave(modeler, wkf);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Save failed");
    });

    it("returns error on exception", async () => {
      const modeler = createMockModeler();
      modeler.saveXML.mockRejectedValue(new Error("XML error"));
      const wkf = createMockWkf();

      const result = await executeSave(modeler, wkf);

      expect(result.success).toBe(false);
      expect(result.error).toBe("XML error");
    });
  });
});
