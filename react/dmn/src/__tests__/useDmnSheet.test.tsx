/**
 * Tests for useDmnSheet hook.
 *
 * Guards against the regression where sheet.get("eventBus") was called
 * instead of activeEditor.get("eventBus"). The sheet module returned by
 * activeEditor.get("sheet") is NOT an injector — only activeEditor has .get().
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock the selection store before importing the hook
vi.mock("../stores/useDmnSelectionStore", () => {
  const store = {
    setInput: vi.fn(),
    setOutput: vi.fn(),
    setInputIndex: vi.fn(),
    setOutputIndex: vi.fn(),
    setRule: vi.fn(),
    setInputRule: vi.fn(),
    getState: vi.fn(() => ({ decision: { id: "Decision_1" } })),
  };
  const useDmnSelectionStore = Object.assign(
    vi.fn((selector: (s: typeof store) => unknown) => selector(store)),
    { getState: store.getState },
  );
  return { default: useDmnSelectionStore };
});

import { useDmnSheet } from "../hooks/useDmnSheet";

describe("useDmnSheet", () => {
  let mockEventBus: { on: ReturnType<typeof vi.fn> };
  let mockSheet: { getRoot: ReturnType<typeof vi.fn> };
  let mockActiveEditor: { get: ReturnType<typeof vi.fn> };
  let mockDmnModeler: { getActiveViewer: ReturnType<typeof vi.fn>; getDefinitions: ReturnType<typeof vi.fn> };
  let openPropertyPanel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockEventBus = {
      on: vi.fn(),
    };

    // sheet is a module instance — it has getRoot() but NOT get()
    mockSheet = {
      getRoot: vi.fn(() => ({
        rows: [],
        businessObject: { input: [], output: [] },
      })),
    };

    // activeEditor is the injector — it has get()
    mockActiveEditor = {
      get: vi.fn((name: string) => {
        if (name === "sheet") return mockSheet;
        if (name === "eventBus") return mockEventBus;
        return null;
      }),
    };

    mockDmnModeler = {
      getActiveViewer: vi.fn(() => mockActiveEditor),
      getDefinitions: vi.fn(() => ({
        drgElement: [
          {
            id: "Decision_1",
            decisionLogic: { input: [], output: [], rule: [] },
          },
        ],
      })),
    };

    openPropertyPanel = vi.fn();
  });

  it("obtains eventBus from activeEditor, not from sheet", () => {
    const { result } = renderHook(() => useDmnSheet(mockDmnModeler as unknown as Parameters<typeof useDmnSheet>[0], { openPropertyPanel }));

    act(() => {
      result.current.setupSheet();
    });

    // activeEditor.get should be called for both "sheet" and "eventBus"
    expect(mockActiveEditor.get).toHaveBeenCalledWith("sheet");
    expect(mockActiveEditor.get).toHaveBeenCalledWith("eventBus");
  });

  it("does NOT call sheet.get() (sheet is not an injector)", () => {
    // Ensure sheet has no .get method — mirrors the real dmn-js v17 API
    expect((mockSheet as Record<string, unknown>).get).toBeUndefined();

    const { result } = renderHook(() => useDmnSheet(mockDmnModeler as unknown as Parameters<typeof useDmnSheet>[0], { openPropertyPanel }));

    act(() => {
      result.current.setupSheet();
    });

    // If the code called sheet.get("eventBus"), this test would fail
    // because sheet.get is undefined — exactly what caused the original bug
    expect(mockActiveEditor.get).toHaveBeenCalledWith("eventBus");
  });

  it("registers event listeners on eventBus", () => {
    const { result } = renderHook(() => useDmnSheet(mockDmnModeler as unknown as Parameters<typeof useDmnSheet>[0], { openPropertyPanel }));

    act(() => {
      result.current.setupSheet();
    });

    const registeredEvents = mockEventBus.on.mock.calls.map((c: unknown[]) => c[0]);
    expect(registeredEvents).toContain("commandStack.row.add.executed");
    expect(registeredEvents).toContain("input.edit");
    expect(registeredEvents).toContain("output.edit");
    expect(registeredEvents).toContain("cell.click");
  });

  it("calls openPropertyPanel when output.edit fires", () => {
    const { result } = renderHook(() => useDmnSheet(mockDmnModeler as unknown as Parameters<typeof useDmnSheet>[0], { openPropertyPanel }));

    act(() => {
      result.current.setupSheet();
    });

    // Find the output.edit handler and invoke it
    const outputEditCall = mockEventBus.on.mock.calls.find((c: unknown[]) => c[0] === "output.edit");
    expect(outputEditCall).toBeTruthy();

    const handler = outputEditCall![1];
    act(() => {
      handler({ output: { id: "output_1", name: "Output" } });
    });

    expect(openPropertyPanel).toHaveBeenCalled();
  });

  it("calls openPropertyPanel when input.edit fires", () => {
    const { result } = renderHook(() => useDmnSheet(mockDmnModeler as unknown as Parameters<typeof useDmnSheet>[0], { openPropertyPanel }));

    act(() => {
      result.current.setupSheet();
    });

    const inputEditCall = mockEventBus.on.mock.calls.find((c: unknown[]) => c[0] === "input.edit");
    expect(inputEditCall).toBeTruthy();

    const handler = inputEditCall![1];
    act(() => {
      handler({
        input: {
          inputExpression: { expressionLanguage: "feel" },
        },
      });
    });

    expect(openPropertyPanel).toHaveBeenCalled();
  });

  it("skips setup gracefully when dmnModeler is null", () => {
    const { result } = renderHook(() => useDmnSheet(null as unknown as Parameters<typeof useDmnSheet>[0], { openPropertyPanel }));

    // Should not throw
    act(() => {
      result.current.setupSheet();
    });

    expect(mockEventBus.on).not.toHaveBeenCalled();
  });

  it("skips setup gracefully when activeEditor is null", () => {
    mockDmnModeler.getActiveViewer.mockReturnValue(null);

    const { result } = renderHook(() => useDmnSheet(mockDmnModeler as unknown as Parameters<typeof useDmnSheet>[0], { openPropertyPanel }));

    act(() => {
      result.current.setupSheet();
    });

    expect(mockEventBus.on).not.toHaveBeenCalled();
  });

  it("skips setup gracefully when sheet is null", () => {
    mockActiveEditor.get.mockImplementation((name: string) => {
      if (name === "sheet") return null;
      if (name === "eventBus") return mockEventBus;
      return null;
    });

    const { result } = renderHook(() => useDmnSheet(mockDmnModeler as unknown as Parameters<typeof useDmnSheet>[0], { openPropertyPanel }));

    act(() => {
      result.current.setupSheet();
    });

    expect(mockEventBus.on).not.toHaveBeenCalled();
  });
});
