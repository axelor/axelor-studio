/**
 * Behavioral tests for useDmnIO hook.
 *
 * Tests happy-path flows for exportDiagram, importExcel, and uploadFile.
 * Per D-03, error paths in vendor glue code are vendor-controlled and
 * excluded from unit testing.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// --- Module-level mocks ---

const mockServiceAction = vi.fn();
const mockServiceSearch = vi.fn();
const mockDownload = vi.fn();

vi.mock("@studio/shared/services", () => ({
  ServiceInstance: {
    add: vi.fn(),
    action: (...args: unknown[]) => mockServiceAction(...args),
    fetchId: vi.fn(),
    search: (...args: unknown[]) => mockServiceSearch(...args),
    download: vi.fn(),
  },
  getHeaders: vi.fn(() => ({})),
  Service: vi.fn(),
  getDMNModels: vi.fn().mockResolvedValue([]),
  fetchDMNModel: vi.fn().mockResolvedValue({}),
  getWkfDMNModels: vi.fn().mockResolvedValue([]),
  uploadFileAPI: vi.fn(),
  getTranslations: vi.fn().mockResolvedValue({}),
  getInfo: vi.fn().mockResolvedValue({}),
  getExpressionValues: vi.fn().mockResolvedValue([]),
  getNameColumn: vi.fn().mockResolvedValue("name"),
  getAllModels: vi.fn().mockResolvedValue([]),
  getMetaFields: vi.fn().mockResolvedValue([]),
}));

vi.mock("@studio/shared/utils", () => ({
  download: (...args: unknown[]) => mockDownload(...args),
  filesToItems: vi.fn((files: FileList, length: number) => {
    const items: unknown[] = [];
    for (let i = 0; i < length; i++) {
      items.push({ file: files[i] });
    }
    return items;
  }),
  getAttachmentBlob: vi.fn((file: { file: File | Blob }) => file.file),
}));

import { useDmnIO } from "../hooks/useDmnIO";
import type { UseDmnIODeps } from "../hooks/useDmnIO";
import type { WkfDmnModel } from "@studio/shared/types";

// --- Test helpers ---

const sampleXml = '<definitions id="d1"><decision id="Decision_1"/></definitions>';

const mockWkfModel: WkfDmnModel = {
  id: 1,
  version: 0,
  name: "TestModel",
  diagramXml: sampleXml,
  dmnTableList: [],
};

function createMockDeps(overrides?: Partial<UseDmnIODeps>): UseDmnIODeps {
  const saveXML = vi.fn((_opts: unknown, cb: (err: Error | null, xml: string) => void) => {
    cb(null, sampleXml);
  });
  const getDefinitions = vi.fn(() => ({ name: "DefinitionName" }));

  return {
    dmnModelerRef: {
      current: { saveXML, getDefinitions } as unknown as import("dmn-js/lib/Modeler").DmnModeler,
    },
    handleSnackbarClick: vi.fn(),
    wkfModel: mockWkfModel,
    id: "1",
    setWkfModel: vi.fn(),
    openDiagram: vi.fn(),
    ...overrides,
  };
}

describe("useDmnIO", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exportDiagram: calls saveXML and triggers download with correct filename", () => {
    const deps = createMockDeps();
    const { result } = renderHook(() => useDmnIO(deps));

    act(() => {
      result.current.exportDiagram();
    });

    expect(mockDownload).toHaveBeenCalledWith(sampleXml, "TestModel.dmn");
  });

  it("exportDiagram: uses definition name when wkfModel.name is empty", () => {
    const deps = createMockDeps({
      wkfModel: { ...mockWkfModel, name: undefined as unknown as string },
    });
    const { result } = renderHook(() => useDmnIO(deps));

    act(() => {
      result.current.exportDiagram();
    });

    expect(mockDownload).toHaveBeenCalledWith(sampleXml, "DefinitionName.dmn");
  });

  it("exportDiagram: does nothing when dmnModeler is null", () => {
    const deps = createMockDeps({
      dmnModelerRef: { current: null },
    });
    const { result } = renderHook(() => useDmnIO(deps));

    act(() => {
      result.current.exportDiagram();
    });

    expect(mockDownload).not.toHaveBeenCalled();
  });

  it("importExcel: calls Service.action with correct import payload and refreshes model", async () => {
    mockServiceAction.mockResolvedValue({ status: 0, data: [{}] });
    const updatedModel = { ...mockWkfModel, version: 2, diagramXml: "<updated/>" };
    mockServiceSearch.mockResolvedValue({ status: 0, data: [updatedModel] });

    const deps = createMockDeps();
    const { result } = renderHook(() => useDmnIO(deps));

    let importResult: boolean = false;
    await act(async () => {
      importResult = await result.current.importExcel({ id: 10, fileName: "data.xlsx" });
    });

    expect(mockServiceAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "action-dmn-model-method-import-dmn-table",
        data: expect.objectContaining({
          context: expect.objectContaining({
            _dmnModelId: mockWkfModel.id,
          }),
        }),
      }),
    );
    expect(deps.handleSnackbarClick).toHaveBeenCalledWith("success", "Imported successfully");
    expect(deps.setWkfModel).toHaveBeenCalled();
    expect(importResult).toBe(true);
  });

  it("uploadFile: rejects non-dmn files", () => {
    const deps = createMockDeps();
    const { result } = renderHook(() => useDmnIO(deps));

    const mockEvent = {
      target: {
        files: [{ name: "test.bpmn" }] as unknown as FileList,
      },
    } as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.uploadFile(mockEvent);
    });

    expect(deps.handleSnackbarClick).toHaveBeenCalledWith("danger", "Upload dmn files only");
    expect(deps.openDiagram).not.toHaveBeenCalled();
  });

  it("uploadFile: reads and opens dmn file", () => {
    const deps = createMockDeps();
    const { result } = renderHook(() => useDmnIO(deps));

    // Mock FileReader
    const mockReadAsText = vi.fn();
    let onloadHandler: ((ev: { target: { result: string } }) => void) | null = null;

    vi.stubGlobal(
      "FileReader",
      vi.fn(() => ({
        readAsText: mockReadAsText,
        set onload(handler: (ev: { target: { result: string } }) => void) {
          onloadHandler = handler;
        },
      })),
    );

    const mockFile = new File(["<dmn content>"], "test.dmn", { type: "application/xml" });
    const mockEvent = {
      target: {
        files: Object.assign([mockFile], { length: 1, item: (i: number) => [mockFile][i] }),
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.uploadFile(mockEvent);
    });

    expect(mockReadAsText).toHaveBeenCalledWith(mockFile);

    // Simulate FileReader.onload
    act(() => {
      onloadHandler?.({ target: { result: "<dmn content>" } });
    });

    expect(deps.openDiagram).toHaveBeenCalledWith("<dmn content>");

    vi.unstubAllGlobals();
  });
});
