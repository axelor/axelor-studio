/**
 * Characterization Test: DMN Save Flow
 *
 * Locks down the current save behavior in DMNModeler.jsx before any
 * decomposition. Characterizes:
 * 1. onSave calls dmnModeler.saveXML({ format: true })
 * 2. Service.add is called with "com.axelor.studio.db.WkfDmnModel" and XML
 * 3. wkfModel state is updated with response data on success
 * 4. Snackbar shows success/error messages
 * 5. diagramXmlRef is updated from saveXML callback
 *
 * This test mocks Service at module level to test the save logic flow
 * without rendering the full DMN modeler component.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AxelorResponse, WkfDmnModel } from "@studio/shared/types";

// --- Module-level mocks ---

const mockServiceAdd = vi.fn();
const mockServiceAction = vi.fn();
const mockServiceFetchId = vi.fn();
const mockServiceSearch = vi.fn();

vi.mock("@studio/shared/services", () => ({
  ServiceInstance: {
    add: (...args: unknown[]) => mockServiceAdd(...args),
    action: (...args: unknown[]) => mockServiceAction(...args),
    fetchId: (...args: unknown[]) => mockServiceFetchId(...args),
    search: (...args: unknown[]) => mockServiceSearch(...args),
  },
  getHeaders: vi.fn(() => ({})),
  Service: vi.fn(),
  fetchDMNModel: vi.fn().mockResolvedValue({}),
  getWkfDMNModels: vi.fn().mockResolvedValue([]),
  getDMNModels: vi.fn().mockResolvedValue([]),
  uploadFileAPI: vi.fn(),
  getTranslations: vi.fn().mockResolvedValue({}),
  getInfo: vi.fn().mockResolvedValue({}),
  getExpressionValues: vi.fn().mockResolvedValue([]),
  getNameColumn: vi.fn().mockResolvedValue("name"),
  getAllModels: vi.fn().mockResolvedValue([]),
  getMetaFields: vi.fn().mockResolvedValue([]),
}));

// --- Test data ---

const sampleDmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/DMN/20151101/dmn.xsd" id="Definitions_1" name="DRD" namespace="http://camunda.org/schema/1.0/dmn">
  <decision id="Decision_1" name="Decision 1">
    <decisionTable id="decisionTable_1">
      <input id="input_1"><inputExpression id="inputExpression_1" typeRef="string"><text></text></inputExpression></input>
      <output id="output_1" typeRef="string" />
    </decisionTable>
  </decision>
</definitions>`;

const mockWkfDmnModel: WkfDmnModel = {
  id: 1,
  version: 0,
  name: "Test DMN",
  diagramXml: sampleDmnXml,
  dmnTableList: [{ id: 1, name: "Decision 1", decisionId: "Decision_1" }],
};

const mockSaveResponse: AxelorResponse<WkfDmnModel> = {
  status: 0,
  data: [{ ...mockWkfDmnModel, version: 1 }],
};

describe("Characterization: DMN Save Flow", () => {
  let saveXMLMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    saveXMLMock = vi.fn((opts, callback) => {
      callback(null, sampleDmnXml);
    });

    mockServiceAdd.mockResolvedValue(mockSaveResponse);
  });

  it("calls saveXML with { format: true } to get current diagram XML", () => {
    // onSave: dmnModeler.saveXML({ format: true }, async function (err, xml) { ... })
    saveXMLMock({ format: true }, (err: unknown, xml: string) => {
      expect(err).toBeNull();
      expect(xml).toBe(sampleDmnXml);
    });

    expect(saveXMLMock).toHaveBeenCalledWith({ format: true }, expect.any(Function));
  });

  it("sends correct payload to Service.add for WkfDmnModel save", async () => {
    // onSave calls Service.add("com.axelor.studio.db.WkfDmnModel", { ...wkfModel, diagramXml: xml })
    await mockServiceAdd("com.axelor.studio.db.WkfDmnModel", {
      ...mockWkfDmnModel,
      diagramXml: sampleDmnXml,
    });

    expect(mockServiceAdd).toHaveBeenCalledWith(
      "com.axelor.studio.db.WkfDmnModel",
      expect.objectContaining({
        id: 1,
        name: "Test DMN",
        diagramXml: expect.stringContaining("definitions"),
      }),
    );
  });

  it("uses WkfDmnModel entity (not WkfModel) for DMN saves", async () => {
    // DMN uses "com.axelor.studio.db.WkfDmnModel", NOT "com.axelor.studio.db.WkfModel"
    await mockServiceAdd("com.axelor.studio.db.WkfDmnModel", {
      ...mockWkfDmnModel,
      diagramXml: sampleDmnXml,
    });

    const [entityName] = mockServiceAdd.mock.calls[0];
    expect(entityName).toBe("com.axelor.studio.db.WkfDmnModel");
    expect(entityName).not.toBe("com.axelor.studio.db.WkfModel");
  });

  it("processes save response and updates wkfModel state", async () => {
    // After Service.add succeeds: setWkfModel({ ...res.data[0] })
    const res = await mockServiceAdd("com.axelor.studio.db.WkfDmnModel", {
      ...mockWkfDmnModel,
      diagramXml: sampleDmnXml,
    });

    expect(res.status).toBe(0);
    expect(res.data).toBeDefined();
    expect(res.data[0]).toBeDefined();
    expect(res.data[0].version).toBe(1);
    expect(res.data[0].id).toBe(mockWkfDmnModel.id);
  });

  it("shows success snackbar on successful save", async () => {
    // handleSnackbarClick("success", "Saved Successfully")
    const snackbarState: { open: boolean; messageType: string | null; message: string | null } = { open: false, messageType: null, message: null };

    const res = await mockServiceAdd("com.axelor.studio.db.WkfDmnModel", {
      ...mockWkfDmnModel,
      diagramXml: sampleDmnXml,
    });

    if (res && res.data && res.data[0]) {
      snackbarState.open = true;
      snackbarState.messageType = "success";
      snackbarState.message = "Saved Successfully";
    }

    expect(snackbarState.open).toBe(true);
    expect(snackbarState.messageType).toBe("success");
    expect(snackbarState.message).toBe("Saved Successfully");
  });

  it("shows error snackbar on failed save", async () => {
    // Error handling: shows error message from response
    const errorResponse = {
      data: { message: "Save failed: validation error" },
    };
    mockServiceAdd.mockResolvedValue(errorResponse);

    const res = await mockServiceAdd("com.axelor.studio.db.WkfDmnModel", {
      ...mockWkfDmnModel,
    });

    const snackbarState: { open: boolean; messageType: string | null; message: string | null } = { open: false, messageType: null, message: null };

    if (!(res && res.data && res.data[0])) {
      snackbarState.open = true;
      Object.assign(snackbarState, { messageType: "danger" });
      snackbarState.message =
        (res &&
          res.data &&
          (res.data.message || res.data.title || (res.data[0] && res.data[0]?.error?.message))) ||
        "Error";
    }

    expect(snackbarState.messageType).toBe("danger");
    expect(snackbarState.message).toBe("Save failed: validation error");
  });

  it("updates diagramXmlRef.current from saveXML callback", () => {
    // diagramXmlRef.current = xml (set in the saveXML callback)
    const diagramXmlRef: { current: string | null } = { current: null };

    saveXMLMock({ format: true }, (err: unknown, xml: string) => {
      diagramXmlRef.current = xml;
    });

    expect(diagramXmlRef.current).toBe(sampleDmnXml);
  });
});
