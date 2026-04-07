/**
 * Behavioral tests for useDmnPersistence hook.
 *
 * Tests save success/error flows, deploy orchestration, and
 * checkUniqueDecision validation. Uses renderHook to exercise
 * the actual hook logic with mocked external dependencies.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { AxelorResponse, WkfDmnModel } from "@studio/shared/types";

// --- Module-level mocks ---

const mockServiceAdd = vi.fn();
const mockServiceAction = vi.fn();
const mockGetDMNModels = vi.fn();
const mockFetchDMNModel = vi.fn();

vi.mock("@studio/shared/services", () => ({
  ServiceInstance: {
    add: (...args: unknown[]) => mockServiceAdd(...args),
    action: (...args: unknown[]) => mockServiceAction(...args),
    fetchId: vi.fn(),
    search: vi.fn(),
    download: vi.fn(),
  },
  getHeaders: vi.fn(() => ({})),
  Service: vi.fn(),
  getDMNModels: (...args: unknown[]) => mockGetDMNModels(...args),
  fetchDMNModel: (...args: unknown[]) => mockFetchDMNModel(...args),
  getWkfDMNModels: vi.fn().mockResolvedValue([]),
  uploadFileAPI: vi.fn(),
  getTranslations: vi.fn().mockResolvedValue({}),
  getInfo: vi.fn().mockResolvedValue({}),
  getExpressionValues: vi.fn().mockResolvedValue([]),
  getNameColumn: vi.fn().mockResolvedValue("name"),
  getAllModels: vi.fn().mockResolvedValue([]),
  getMetaFields: vi.fn().mockResolvedValue([]),
}));

vi.mock("@studio/shared/types", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    isAxelorError: vi.fn((res: { status: number }) => res.status === -1),
  };
});

import { useDmnPersistence } from "../hooks/useDmnPersistence";
import type { UseDmnPersistenceDeps } from "../hooks/useDmnPersistence";

// --- Test helpers ---

const sampleXml = '<definitions id="d1"><decision id="Decision_1"/></definitions>';

const mockWkfModel: WkfDmnModel = {
  id: 1,
  version: 0,
  name: "Test DMN",
  diagramXml: sampleXml,
  dmnTableList: [{ id: 1, name: "Decision 1", decisionId: "Decision_1" }],
};

function createMockDeps(overrides?: Partial<UseDmnPersistenceDeps>): UseDmnPersistenceDeps {
  const saveXML = vi.fn((_opts: unknown, cb: (err: Error | null, xml: string) => void) => {
    cb(null, sampleXml);
  });
  const getDefinitions = vi.fn(() => ({
    drgElement: [{ $type: "dmn:Decision", id: "Decision_1" }],
  }));

  return {
    dmnModelerRef: { current: { saveXML, getDefinitions } as unknown as import("dmn-js/lib/Modeler").DmnModeler },
    diagramXmlRef: { current: null },
    handleSnackbarClick: vi.fn(),
    wkfModel: mockWkfModel,
    setWkfModel: vi.fn(),
    openDialog: vi.fn(),
    fetchDiagram: vi.fn(),
    ...overrides,
  };
}

describe("useDmnPersistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("onSave: calls saveXML and Service.add with correct WkfDmnModel payload", async () => {
    const successResponse: AxelorResponse<WkfDmnModel> = {
      status: 0,
      data: [{ ...mockWkfModel, version: 1 }],
    };
    mockServiceAdd.mockResolvedValue(successResponse);

    const deps = createMockDeps();
    const { result } = renderHook(() => useDmnPersistence(deps));

    act(() => {
      result.current.onSave();
    });

    // saveXML is called synchronously via callback pattern
    const modeler = deps.dmnModelerRef.current!;
    expect(modeler.saveXML).toHaveBeenCalledWith({ format: true }, expect.any(Function));
    // Service.add is called within the saveXML callback
    expect(mockServiceAdd).toHaveBeenCalledWith(
      "com.axelor.studio.db.WkfDmnModel",
      expect.objectContaining({
        id: 1,
        name: "Test DMN",
        diagramXml: sampleXml,
      }),
    );
  });

  it("onSave: shows success snackbar and updates wkfModel on successful save", async () => {
    const successResponse: AxelorResponse<WkfDmnModel> = {
      status: 0,
      data: [{ ...mockWkfModel, version: 1 }],
    };
    mockServiceAdd.mockResolvedValue(successResponse);

    const deps = createMockDeps();
    const { result } = renderHook(() => useDmnPersistence(deps));

    act(() => {
      result.current.onSave();
    });

    // Wait for the async Service.add promise to resolve
    await vi.waitFor(() => {
      expect(deps.handleSnackbarClick).toHaveBeenCalledWith("success", "Saved Successfully");
    });
    expect(deps.setWkfModel).toHaveBeenCalledWith(expect.objectContaining({ version: 1 }));
  });

  it("onSave: shows error snackbar on failed save response", async () => {
    const errorResponse: AxelorResponse<WkfDmnModel> = {
      status: -1,
      data: [],
      message: "Validation error",
    };
    mockServiceAdd.mockResolvedValue(errorResponse);

    const deps = createMockDeps();
    const { result } = renderHook(() => useDmnPersistence(deps));

    act(() => {
      result.current.onSave();
    });

    await vi.waitFor(() => {
      expect(deps.handleSnackbarClick).toHaveBeenCalledWith("danger", "Validation error");
    });
  });

  it("checkUniqueDecision: returns true when no duplicate decision IDs exist", async () => {
    // getDMNModels returns empty (no conflicts)
    mockGetDMNModels.mockResolvedValue([]);
    // fetchDMNModel returns model with matching dmnTableList
    mockFetchDMNModel.mockResolvedValue({
      dmnTableList: [{ decisionId: "Decision_1" }],
    });

    const deps = createMockDeps();
    const { result } = renderHook(() => useDmnPersistence(deps));

    let returnValue: boolean | undefined;
    await act(async () => {
      returnValue = await result.current.checkUniqueDecision();
    });

    expect(returnValue).toBe(true);
  });

  it("checkUniqueDecision: shows error when duplicate decision ID found in another model", async () => {
    // getDMNModels returns a conflicting model
    mockGetDMNModels.mockResolvedValue([{ id: 2, decisionId: "Decision_1" }]);
    // fetchDMNModel returns current model without the conflicting decisionId
    mockFetchDMNModel.mockResolvedValue({
      dmnTableList: [{ decisionId: "Decision_OTHER" }],
    });

    const deps = createMockDeps();
    const { result } = renderHook(() => useDmnPersistence(deps));

    await act(async () => {
      await result.current.checkUniqueDecision();
    });

    expect(deps.handleSnackbarClick).toHaveBeenCalledWith("danger", "Please provide unique process id");
  });

  it("deployDiagram: saves then deploys via Service.action on success", async () => {
    const saveResponse: AxelorResponse<WkfDmnModel> = {
      status: 0,
      data: [{ ...mockWkfModel, version: 1 }],
    };
    mockServiceAdd.mockResolvedValue(saveResponse);
    // checkUniqueDecision passes
    mockGetDMNModels.mockResolvedValue([]);
    mockFetchDMNModel.mockResolvedValue({
      dmnTableList: [{ decisionId: "Decision_1" }],
    });
    // Deploy action succeeds
    mockServiceAction.mockResolvedValue({
      status: 0,
      data: [{ reload: true }],
    });

    const deps = createMockDeps();
    const { result } = renderHook(() => useDmnPersistence(deps));

    act(() => {
      result.current.deployDiagram();
    });

    await vi.waitFor(() => {
      expect(mockServiceAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "action-wkf-dmn-model-method-deploy",
          model: "com.axelor.studio.db.WkfDmnModel",
        }),
      );
    });
  });
});
