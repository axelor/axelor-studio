/**
 * Behavioral tests for useDiagramLifecycle hook.
 *
 * Tests diagram opening, creation, fetching, file upload,
 * and tab/element selection updates. Uses renderHook with
 * mocked bpmn-js modeler and stores.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

const mockGetBusinessObject = vi.fn();
const mockFetchWkf = vi.fn();
const mockFetchId = vi.fn();
const mockGetTabs = vi.fn();
const mockAddOldNodes = vi.fn();
const mockGetCommentsLength = vi.fn();
const mockIsConditionalSource = vi.fn();
const mockNextId = vi.fn();
const mockProcessColors = vi.fn();
const mockUpdateTranslations = vi.fn();

vi.mock("bpmn-js/lib/util/ModelUtil", () => ({
  getBusinessObject: (...args: unknown[]) => mockGetBusinessObject(...args),
  is: vi.fn(() => false),
}));

// From useDiagramLifecycle.ts: import { fetchWkf } from "../../../shared/services"
// Test is in hooks/__tests__/ so need ../../../../shared/services
vi.mock("../../../../shared/services", () => ({
  fetchWkf: (...args: unknown[]) => mockFetchWkf(...args),
}));

// From useDiagramLifecycle.ts: import { ... } from "../../extra"  (hooks -> Modeler -> extra)
// Test in hooks/__tests__/ so: __tests__ -> hooks -> Modeler -> extra = "../../extra"
vi.mock("../../extra", () => ({
  fetchId: (...args: unknown[]) => mockFetchId(...args),
  getTabs: (...args: unknown[]) => mockGetTabs(...args),
  addOldNodes: (...args: unknown[]) => mockAddOldNodes(...args),
  getCommentsLength: (...args: unknown[]) => mockGetCommentsLength(...args),
}));

// From useDiagramLifecycle.ts: import { ... } from "../utils/modeler-helpers"
// Test in hooks/__tests__/ so need ../../utils/modeler-helpers
vi.mock("../../utils/modeler-helpers", () => ({
  isConditionalSource: (...args: unknown[]) => mockIsConditionalSource(...args),
  nextId: (...args: unknown[]) => mockNextId(...args),
}));

// From useDiagramLifecycle.ts: import { ... } from "./diagram-helpers"
// Test in hooks/__tests__/ so need ../diagram-helpers
vi.mock("../diagram-helpers", () => ({
  processColors: (...args: unknown[]) => mockProcessColors(...args),
  updateTranslations: (...args: unknown[]) => mockUpdateTranslations(...args),
}));

vi.mock("@studio/shared/i18n", () => ({
  translate: (s: string) => s,
}));

// Mock stores
// From useDiagramLifecycle.ts: import useWkfStore from "../stores/useWkfStore"
// Test in hooks/__tests__/ so need ../../stores/useWkfStore
const mockWkfState = {
  wkf: null as Record<string, unknown> | null,
  initialState: false,
  setWkf: vi.fn(),
  setId: vi.fn(),
  setDirty: vi.fn(),
  setInitialState: vi.fn(),
  reset: vi.fn(),
};

vi.mock("../../stores/useWkfStore", () => {
  const listeners = new Set<(s: unknown) => unknown>();
  const store = Object.assign(
    (selector: (s: typeof mockWkfState) => unknown) => selector(mockWkfState),
    {
      getState: () => mockWkfState,
      subscribe: (listener: (s: unknown) => unknown) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    },
  );
  return { default: store };
});

const mockSelectionState = {
  setSelectedElement: vi.fn(),
  setMenuActionDisable: vi.fn(),
  setComments: vi.fn(),
};
vi.mock("../../stores/useSelectionStore", () => ({
  default: { getState: () => mockSelectionState },
}));

const mockSnackbarShow = vi.fn();
vi.mock("../../stores/useSnackbarStore", () => ({
  default: { getState: () => ({ show: mockSnackbarShow }) },
}));

const mockTabState = {
  setTabs: vi.fn(),
  setTabValue: vi.fn(),
};
vi.mock("../../stores/useTabStore", () => ({
  default: { getState: () => mockTabState },
}));

// ---------------------------------------------------------------------------
// Import under test
// ---------------------------------------------------------------------------

import { useDiagramLifecycle } from "../useDiagramLifecycle";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeMockModeler(overrides: Record<string, unknown> = {}) {
  return {
    importXML: vi.fn().mockResolvedValue(undefined),
    saveXML: vi.fn().mockResolvedValue({ xml: "<bpmn />" }),
    getDefinitions: vi.fn(() => ({ $attrs: {}, drgElement: [] })),
    get: vi.fn((service: string) => {
      if (service === "canvas") return { zoom: vi.fn() };
      if (service === "elementRegistry") return { get: vi.fn(), getAll: vi.fn(() => []) };
      if (service === "modeling") return {};
      if (service === "selection") return { select: vi.fn() };
      return {};
    }),
    ...overrides,
  };
}

function makeDeps(overrides: Record<string, unknown> = {}) {
  const modeler = makeMockModeler();
  return {
    bpmnModelerRef: { current: modeler },
    diagramXmlRef: { current: null as string | null },
    update: vi.fn(),
    info: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useDiagramLifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWkfState.wkf = null;
    mockWkfState.initialState = false;
    mockGetTabs.mockReturnValue([]);
    mockGetCommentsLength.mockReturnValue(0);
    mockIsConditionalSource.mockReturnValue(false);
    mockNextId.mockReturnValue("Process_test1");
    mockProcessColors.mockResolvedValue(undefined);
    mockUpdateTranslations.mockReturnValue(undefined);
    mockGetBusinessObject.mockImplementation((el: unknown) => el);
  });

  it("fetchDiagram: fetches WKF by ID, stores it, and opens diagram", async () => {
    const wkf = { id: 42, diagramXml: "<definitions />", name: "My BPM" };
    mockFetchWkf.mockResolvedValue(wkf);

    const deps = makeDeps();
    const { result } = renderHook(() => useDiagramLifecycle(deps as never));

    let returnedWkf: unknown;
    await act(async () => {
      returnedWkf = await result.current.fetchDiagram(42);
    });

    expect(mockFetchWkf).toHaveBeenCalledWith(42);
    expect(mockWkfState.setWkf).toHaveBeenCalledWith(wkf);
    expect(deps.update).toHaveBeenCalledWith(expect.any(Function));
    expect(returnedWkf).toEqual(wkf);
    expect(deps.bpmnModelerRef.current.importXML).toHaveBeenCalled();
  });

  it("fetchDiagram: creates new diagram when no ID provided", async () => {
    const deps = makeDeps();
    const { result } = renderHook(() => useDiagramLifecycle(deps as never));

    await act(async () => {
      await result.current.fetchDiagram(undefined);
    });

    expect(mockFetchWkf).not.toHaveBeenCalled();
    expect(deps.bpmnModelerRef.current.importXML).toHaveBeenCalled();
  });

  it("addNewDiagram: resets store and opens blank diagram", () => {
    const deps = makeDeps();
    const { result } = renderHook(() => useDiagramLifecycle(deps as never));

    act(() => {
      result.current.addNewDiagram();
    });

    expect(mockWkfState.setInitialState).toHaveBeenCalledWith(false);
    expect(mockWkfState.setDirty).toHaveBeenCalledWith(false);
    expect(mockWkfState.setWkf).toHaveBeenCalledWith(null);
    expect(mockWkfState.setId).toHaveBeenCalledWith(null);
    expect(deps.update).toHaveBeenCalled();
  });

  it("uploadFile: rejects non-.bpmn files with snackbar error", () => {
    const deps = makeDeps();
    const { result } = renderHook(() => useDiagramLifecycle(deps as never));

    const mockEvent = {
      target: {
        files: [{ name: "diagram.xml" }],
        value: "diagram.xml",
      },
    };

    act(() => {
      result.current.uploadFile(mockEvent as never);
    });

    expect(mockSnackbarShow).toHaveBeenCalledWith("danger", "Upload Bpmn files only");
    expect(mockEvent.target.value).toBe("");
  });

  it("updateTabs: sets tabs and selected element from event", () => {
    const tabs = [{ id: "general", label: "General" }];
    mockGetTabs.mockReturnValue(tabs);

    const deps = makeDeps();
    const { result } = renderHook(() => useDiagramLifecycle(deps as never));

    const element = { type: "bpmn:Task", id: "Task_1", businessObject: { id: "Task_1" } };
    act(() => {
      result.current.updateTabs({ element });
    });

    expect(mockGetTabs).toHaveBeenCalledWith(deps.bpmnModelerRef.current, element);
    expect(mockTabState.setTabs).toHaveBeenCalledWith(tabs);
    expect(mockTabState.setTabValue).toHaveBeenCalledWith(0);
    expect(mockSelectionState.setSelectedElement).toHaveBeenCalledWith(element);
  });

  it("initializeDiagram: fetches ID from URL and triggers fetchDiagram", async () => {
    mockFetchId.mockReturnValue({ id: 99, timerTask: true });
    mockFetchWkf.mockResolvedValue({ id: 99, diagramXml: "<bpmn />" });

    const deps = makeDeps();
    const { result } = renderHook(() => useDiagramLifecycle(deps as never));

    act(() => {
      result.current.initializeDiagram();
    });

    expect(mockFetchId).toHaveBeenCalled();
    expect(mockWkfState.setId).toHaveBeenCalledWith(99);

    // fetchDiagram is async and fire-and-forget inside initializeDiagram
    await vi.waitFor(() => {
      expect(mockFetchWkf).toHaveBeenCalledWith(99);
    });
  });
});
