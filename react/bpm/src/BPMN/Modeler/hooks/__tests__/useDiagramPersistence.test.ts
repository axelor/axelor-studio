/**
 * Behavioral tests for useDiagramPersistence hook.
 *
 * Tests save flows (onSave), deploy dialog handler (handleOk),
 * SVG export, and dirty check. Uses renderHook with mocked
 * services, stores, and modeler.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Module-level mocks (vi.mock is hoisted before imports)
// ---------------------------------------------------------------------------

const mockValidateNameAndCode = vi.fn();
const mockValidateTimerEvents = vi.fn();
const mockValidateNodes = vi.fn();
const mockExecuteSave = vi.fn();
const mockExecuteDeploy = vi.fn();
const mockCallOutputMapping = vi.fn();
const mockCreateNewVersion = vi.fn();
const mockStartWkfModel = vi.fn();
const mockFetchWkf = vi.fn();
const mockGetBPMNModels = vi.fn();
const mockSaveCurrentWkf = vi.fn();
const mockResyncWkf = vi.fn();
const mockGetElements = vi.fn();
const mockGetDefinitionAttrs = vi.fn();
const mockGetProcesses = vi.fn();
const mockWsProgressInit = vi.fn();
const mockConvertSVGtoBase64 = vi.fn();
const mockGetBool = vi.fn();
const mockWaitForConnection = vi.fn();
const mockApplyOutputMappingScript = vi.fn();

vi.mock("../../../../services/validation-service", () => ({
  validateNameAndCode: (...args: unknown[]) => mockValidateNameAndCode(...args),
  validateTimerEvents: (...args: unknown[]) => mockValidateTimerEvents(...args),
  validateNodes: (...args: unknown[]) => mockValidateNodes(...args),
}));

vi.mock("../../../../services/save-service", () => ({
  executeSave: (...args: unknown[]) => mockExecuteSave(...args),
}));

vi.mock("../../../../services/deploy-service", () => ({
  executeDeploy: (...args: unknown[]) => mockExecuteDeploy(...args),
  callOutputMapping: (...args: unknown[]) => mockCallOutputMapping(...args),
}));

vi.mock("../../../../services/wkf-api", () => ({
  createNewVersion: (...args: unknown[]) => mockCreateNewVersion(...args),
  startWkfModel: (...args: unknown[]) => mockStartWkfModel(...args),
}));

vi.mock("../../../../shared/services", () => ({
  fetchWkf: (...args: unknown[]) => mockFetchWkf(...args),
  getBPMNModels: (...args: unknown[]) => mockGetBPMNModels(...args),
}));

vi.mock("../../../../services/wkf-repository", () => ({
  saveCurrentWkf: (...args: unknown[]) => mockSaveCurrentWkf(...args),
  resyncWkf: (...args: unknown[]) => mockResyncWkf(...args),
}));

vi.mock("../../extra", () => ({
  getElements: (...args: unknown[]) => mockGetElements(...args),
}));

vi.mock("../../utils/modeler-api", () => ({
  getDefinitionAttrs: (...args: unknown[]) => mockGetDefinitionAttrs(...args),
  getProcesses: (...args: unknown[]) => mockGetProcesses(...args),
}));

vi.mock("../../../../services/Progress", () => ({
  wsProgress: { init: (...args: unknown[]) => mockWsProgressInit(...args) },
}));

vi.mock("../../../../utils", () => ({
  getBool: (...args: unknown[]) => mockGetBool(...args),
  convertSVGtoBase64: (...args: unknown[]) => mockConvertSVGtoBase64(...args),
}));

vi.mock("../persistence-helpers", () => ({
  waitForConnection: (...args: unknown[]) => mockWaitForConnection(...args),
}));

vi.mock("../apply-output-mapping", () => ({
  applyOutputMappingScript: (...args: unknown[]) => mockApplyOutputMappingScript(...args),
}));

vi.mock("@studio/shared/i18n", () => ({
  translate: (s: string) => s,
}));

// Mock stores using zustand-like getState pattern
const mockSnackbarShow = vi.fn();
vi.mock("../../stores/useSnackbarStore", () => ({
  default: { getState: () => ({ show: mockSnackbarShow }) },
}));

const mockWkfStoreState = {
  wkf: null as Record<string, unknown> | null,
  showError: false,
  setShowError: vi.fn(),
  setWkf: vi.fn(),
  setId: vi.fn(),
  setDirty: vi.fn(),
  setInitialState: vi.fn(),
  setOpenDeployDialog: vi.fn(),
  setIds: vi.fn(),
  reset: vi.fn(),
};
vi.mock("../../stores/useWkfStore", () => ({
  default: { getState: () => mockWkfStoreState },
}));

// ---------------------------------------------------------------------------
// Import under test (after all vi.mock calls)
// ---------------------------------------------------------------------------

import { useDiagramPersistence } from "../useDiagramPersistence";


// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeMockModeler(overrides: Record<string, unknown> = {}) {
  return {
    saveXML: vi.fn().mockResolvedValue({ xml: "<bpmn />" }),
    saveSVG: vi.fn().mockResolvedValue({ svg: "<svg />" }),
    getDefinitions: vi.fn(() => ({ $attrs: {} })),
    get: vi.fn(() => ({})),
    ...overrides,
  };
}

function makeDeps(overrides: Record<string, unknown> = {}) {
  const modeler = makeMockModeler();
  return {
    bpmnModelerRef: { current: modeler },
    diagramXmlRef: { current: null as string | null },
    update: vi.fn(),
    openDialog: vi.fn(),
    deployProgress: { allowProgressBarDisplay: false },
    fetchDiagram: vi.fn(),
    newBpmnDiagram: vi.fn(),
    addDiagramProperties: vi.fn(),
    isTimerTask: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useDiagramPersistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    mockWkfStoreState.wkf = null;
    mockWkfStoreState.showError = false;
    // Default: all validations pass
    mockValidateNameAndCode.mockReturnValue({ success: true });
    mockValidateTimerEvents.mockReturnValue({ success: true });
    mockValidateNodes.mockReturnValue({ success: true });
    mockGetDefinitionAttrs.mockReturnValue({});
    mockGetBool.mockReturnValue(false);
    mockWaitForConnection.mockResolvedValue(undefined);
  });

  // --- onSave ---

  it("onSave: validates, calls executeSave, and shows success snackbar", async () => {
    const wkf = { id: 1, name: "Test", version: 1, statusSelect: 1 };
    mockWkfStoreState.wkf = wkf;
    mockExecuteSave.mockResolvedValue({ success: true, data: { ...wkf, version: 2, id: 1 } });

    const deps = makeDeps();
    const { result } = renderHook(() => useDiagramPersistence(deps as never));

    await act(async () => {
      await result.current.onSave();
    });

    expect(mockValidateNameAndCode).toHaveBeenCalledWith(deps.bpmnModelerRef.current);
    expect(mockValidateTimerEvents).toHaveBeenCalledWith(deps.bpmnModelerRef.current, false);
    expect(mockValidateNodes).toHaveBeenCalledWith(deps.bpmnModelerRef.current);
    expect(mockExecuteSave).toHaveBeenCalledWith(deps.bpmnModelerRef.current, wkf);
    expect(mockSnackbarShow).toHaveBeenCalledWith("success", "Saved Successfully");
  });

  it("onSave: shows error snackbar when name/code validation fails", async () => {
    mockWkfStoreState.wkf = { id: 1 };
    mockValidateNameAndCode.mockReturnValue({ success: false, error: "Name is required" });

    const deps = makeDeps();
    const { result } = renderHook(() => useDiagramPersistence(deps as never));

    await act(async () => {
      await result.current.onSave();
    });

    expect(mockSnackbarShow).toHaveBeenCalledWith("danger", "Name is required");
    expect(mockWkfStoreState.setShowError).toHaveBeenCalledWith(true);
    expect(mockExecuteSave).not.toHaveBeenCalled();
  });

  it("onSave: shows error snackbar when executeSave returns error", async () => {
    mockWkfStoreState.wkf = { id: 1 };
    mockExecuteSave.mockResolvedValue({ success: false, error: "Server error" });

    const deps = makeDeps();
    const { result } = renderHook(() => useDiagramPersistence(deps as never));

    await act(async () => {
      await result.current.onSave();
    });

    expect(mockSnackbarShow).toHaveBeenCalledWith("danger", "Server error");
  });

  it("onSave: does nothing when modeler ref is null", async () => {
    const deps = makeDeps({ bpmnModelerRef: { current: null } });
    const { result } = renderHook(() => useDiagramPersistence(deps as never));

    await act(async () => {
      await result.current.onSave();
    });

    expect(mockValidateNameAndCode).not.toHaveBeenCalled();
    expect(mockExecuteSave).not.toHaveBeenCalled();
  });

  it("onSave: opens dialog when node validation fails with error", async () => {
    mockWkfStoreState.wkf = { id: 1 };
    mockValidateNodes.mockReturnValue({ success: false, error: "Invalid node config" });

    const deps = makeDeps();
    const { result } = renderHook(() => useDiagramPersistence(deps as never));

    await act(async () => {
      await result.current.onSave();
    });

    expect(deps.openDialog).toHaveBeenCalledWith({
      title: "Error",
      message: "Invalid node config",
    });
    expect(mockExecuteSave).not.toHaveBeenCalled();
  });

  // --- handleOk ---

  it("handleOk: saves XML, calls saveCurrentWkf, then deploys", async () => {
    const wkf = { id: 1, name: "Test", statusSelect: 2 };
    mockWkfStoreState.wkf = wkf;
    mockCallOutputMapping.mockResolvedValue({ status: -1, scripts: [] });
    mockSaveCurrentWkf.mockResolvedValue({
      ok: true,
      data: { ...wkf, diagramXml: "<bpmn />" },
    });
    mockFetchWkf.mockResolvedValue({ ...wkf, isMigrationOnGoing: false });
    mockExecuteDeploy.mockResolvedValue({ success: true });

    const deps = makeDeps();
    const { result } = renderHook(() => useDiagramPersistence(deps as never));

    await act(async () => {
      await result.current.handleOk();
    });

    expect(mockWkfStoreState.setOpenDeployDialog).toHaveBeenCalledWith(false);
    expect(deps.bpmnModelerRef.current.saveXML).toHaveBeenCalledWith({ format: true });
    expect(mockSaveCurrentWkf).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, diagramXml: "<bpmn />" }),
    );
  });

  it("handleOk: shows error when saveCurrentWkf fails", async () => {
    mockWkfStoreState.wkf = { id: 1, statusSelect: 2 };
    mockCallOutputMapping.mockResolvedValue({ status: -1, scripts: [] });
    mockSaveCurrentWkf.mockResolvedValue({
      ok: false,
      error: { message: "Concurrent modification" },
    });

    const deps = makeDeps();
    const { result } = renderHook(() => useDiagramPersistence(deps as never));

    await act(async () => {
      await result.current.handleOk();
    });

    expect(mockSnackbarShow).toHaveBeenCalledWith("danger", "Concurrent modification");
  });

  it("handleOk: validates unique process IDs for new models (statusSelect=1)", async () => {
    const wkf = { id: 1, statusSelect: 1, wkfProcessList: [{ name: "P1" }] };
    mockWkfStoreState.wkf = wkf;
    mockGetProcesses.mockReturnValue([{ id: "P1" }]);
    mockGetBPMNModels.mockResolvedValue([{ id: 99 }]);
    mockCallOutputMapping.mockResolvedValue({ status: -1 });

    const deps = makeDeps();
    const { result } = renderHook(() => useDiagramPersistence(deps as never));

    await act(async () => {
      await result.current.handleOk();
    });

    // Process ID "P1" matches wkfProcessList, so validation passes
    expect(mockGetBPMNModels).toHaveBeenCalled();
  });

  it("handleOk: shows error when duplicate process ID found", async () => {
    const wkf = { id: 1, statusSelect: 1, wkfProcessList: [] };
    mockWkfStoreState.wkf = wkf;
    mockGetProcesses.mockReturnValue([{ id: "DuplicateId" }]);
    // getBPMNModels returns a conflict
    mockGetBPMNModels.mockResolvedValue([{ id: 99, name: "DuplicateId" }]);

    const deps = makeDeps();
    const { result } = renderHook(() => useDiagramPersistence(deps as never));

    await act(async () => {
      await result.current.handleOk();
    });

    expect(mockSnackbarShow).toHaveBeenCalledWith("danger", "Please provide unique process id");
    // Should NOT proceed to save
    expect(mockSaveCurrentWkf).not.toHaveBeenCalled();
  });

  // --- checkIfUpdated ---

  it("checkIfUpdated: returns true when XML differs from diagramXmlRef", async () => {
    const deps = makeDeps();
    deps.diagramXmlRef.current = "<original />";
    deps.bpmnModelerRef.current.saveXML.mockResolvedValue({ xml: "<modified />" });

    const { result } = renderHook(() => useDiagramPersistence(deps as never));

    let isDirty: boolean | undefined;
    await act(async () => {
      isDirty = await result.current.checkIfUpdated();
    });

    expect(isDirty).toBe(true);
  });

  it("checkIfUpdated: returns false when XML matches diagramXmlRef", async () => {
    const deps = makeDeps();
    deps.diagramXmlRef.current = "<bpmn />";
    // saveXML returns same XML as ref
    deps.bpmnModelerRef.current.saveXML.mockResolvedValue({ xml: "<bpmn />" });

    const { result } = renderHook(() => useDiagramPersistence(deps as never));

    let isDirty: boolean | undefined;
    await act(async () => {
      isDirty = await result.current.checkIfUpdated();
    });

    expect(isDirty).toBe(false);
  });

  // --- getBase64SVG ---

  it("getBase64SVG: returns null when modeler is null", async () => {
    const deps = makeDeps({ bpmnModelerRef: { current: null } });
    const { result } = renderHook(() => useDiagramPersistence(deps as never));

    let svg: string | null | undefined;
    await act(async () => {
      svg = await result.current.getBase64SVG();
    });

    expect(svg).toBeNull();
  });
});
