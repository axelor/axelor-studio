/**
 * Behavioral tests for useDmnNavigation hook.
 *
 * Focus on pure function behaviors: getSelectValue, getProperty,
 * getData, getReadOnly. These provide highest ROI since they are
 * deterministic transformations with clear inputs and outputs.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// --- Module-level mocks ---

const mockGetBusinessObject = vi.fn();
const mockSplitWithComma = vi.fn();
const mockMergeModels = vi.fn();

vi.mock("dmn-js-shared/lib/util/ModelUtil.js", () => ({
  getBusinessObject: (...args: unknown[]) => mockGetBusinessObject(...args),
  is: vi.fn(),
}));

vi.mock("@studio/shared/utils", () => ({
  splitWithComma: (...args: unknown[]) => mockSplitWithComma(...args),
  mergeModels: (...args: unknown[]) => mockMergeModels(...args),
}));

vi.mock("@studio/shared/services", () => ({
  ServiceInstance: {
    add: vi.fn(),
    action: vi.fn(),
    fetchId: vi.fn(),
    search: vi.fn(),
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

vi.mock("../properties/properties", () => ({
  default: vi.fn(() => [{ id: "general", label: "General", groups: [] }]),
}));

vi.mock("@studio/shared/i18n", () => ({
  translate: (s: string) => s,
}));

vi.mock("@studio/shared/types", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    getDmnService: vi.fn(() => ({
      get: vi.fn(),
    })),
  };
});

import { useDmnNavigation } from "../hooks/useDmnNavigation";
import type { UseDmnNavigationDeps } from "../hooks/useDmnNavigation";
import type { DmnElement, WkfDmnModel } from "@studio/shared/types";

// --- Test helpers ---

function createMockDeps(overrides?: Partial<UseDmnNavigationDeps>): UseDmnNavigationDeps {
  return {
    dmnModelerRef: { current: null },
    diagramXmlRef: { current: null },
    handleSnackbarClick: vi.fn(),
    wkfModel: null,
    id: "1",
    rootElement: null,
    selectedElement: null,
    setSelectedElement: vi.fn(),
    setDecision: vi.fn(),
    setRootElement: vi.fn(),
    setTabs: vi.fn(),
    setTabValue: vi.fn(),
    setInput: vi.fn(),
    setOutput: vi.fn(),
    setInputIndex: vi.fn(),
    setOutputIndex: vi.fn(),
    setRule: vi.fn(),
    setInputRule: vi.fn(),
    openDialog: vi.fn(),
    setWkfModel: vi.fn(),
    ...overrides,
  };
}

function createRootElement(attrs: Record<string, unknown>): DmnElement {
  return {
    businessObject: {
      $attrs: attrs,
    },
  } as unknown as DmnElement;
}

describe("useDmnNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: splitWithComma returns the string split by comma
    mockSplitWithComma.mockImplementation((val: string | undefined) => {
      if (val == null) return undefined;
      return String(val).split(",").map((s: string) => s.trim());
    });
    mockMergeModels.mockImplementation(
      (a: unknown[] | undefined, b: unknown[] | undefined) => [...(a ?? []), ...(b ?? [])],
    );
  });

  it("getSelectValue: returns split camunda attribute values", () => {
    const rootElement = createRootElement({
      "camunda:metaModels": "Model1,Model2",
    });
    mockSplitWithComma.mockReturnValue(["Model1", "Model2"]);

    const deps = createMockDeps({ rootElement });
    const { result } = renderHook(() => useDmnNavigation(deps));

    const value = result.current.getSelectValue("metaModels");

    expect(mockSplitWithComma).toHaveBeenCalledWith("Model1,Model2");
    expect(value).toEqual(["Model1", "Model2"]);
  });

  it("getSelectValue: returns undefined when rootElement is null", () => {
    const deps = createMockDeps({ rootElement: null });
    const { result } = renderHook(() => useDmnNavigation(deps));

    const value = result.current.getSelectValue("metaModels");
    expect(value).toBeUndefined();
  });

  it("getSelectValue: returns undefined when attribute is missing", () => {
    const rootElement = createRootElement({});
    const deps = createMockDeps({ rootElement });
    const { result } = renderHook(() => useDmnNavigation(deps));

    // splitWithComma called with undefined -> returns undefined
    mockSplitWithComma.mockReturnValue(undefined);
    const value = result.current.getSelectValue("nonExistent");

    expect(value).toBeUndefined();
  });

  it("getProperty: returns raw camunda attribute value", () => {
    const rootElement = createRootElement({
      "camunda:myProp": "someValue",
    });
    const deps = createMockDeps({ rootElement });
    const { result } = renderHook(() => useDmnNavigation(deps));

    const value = result.current.getProperty("myProp");
    expect(value).toBe("someValue");
  });

  it("getProperty: returns undefined for missing property", () => {
    const rootElement = createRootElement({});
    const deps = createMockDeps({ rootElement });
    const { result } = renderHook(() => useDmnNavigation(deps));

    const value = result.current.getProperty("missingProp");
    expect(value).toBeUndefined();
  });

  it("getData: merges metaModel and metaJsonModel results", () => {
    const rootElement = createRootElement({
      "camunda:metaModels": "Model1",
      "camunda:metaModelLabels": "Label1",
      "camunda:metaModelModelNames": "com.Model1",
      "camunda:metaJsonModels": "JsonModel1",
      "camunda:metaJsonModelLabels": "JsonLabel1",
    });
    mockSplitWithComma.mockImplementation((val: string | undefined) => {
      if (val == null) return undefined;
      return String(val).split(",").map((s: string) => s.trim());
    });
    const merged = [
      { name: "Model1", type: "metaModel", title: "Label1", fullName: "com.Model1" },
      { name: "JsonModel1", type: "metaJsonModel", title: "JsonLabel1" },
    ];
    mockMergeModels.mockReturnValue(merged);

    const deps = createMockDeps({ rootElement });
    const { result } = renderHook(() => useDmnNavigation(deps));

    const data = result.current.getData();

    expect(mockMergeModels).toHaveBeenCalled();
    expect(data).toEqual(merged);
  });

  it("getReadOnly: returns true when entry.modelProperty is 'id' and decisionId matches", () => {
    const selectedElement = { id: "Decision_1" } as unknown as DmnElement;
    mockGetBusinessObject.mockReturnValue({ id: "Decision_1" });

    const wkfModel: WkfDmnModel = {
      id: 1,
      version: 0,
      name: "Test",
      dmnTableList: [{ id: 1, decisionId: "Decision_1", name: "Dec1" }],
    };

    const deps = createMockDeps({ selectedElement, wkfModel });
    const { result } = renderHook(() => useDmnNavigation(deps));

    const readOnly = result.current.getReadOnly({ modelProperty: "id" });

    expect(mockGetBusinessObject).toHaveBeenCalledWith(selectedElement);
    expect(readOnly).toBe(true);
  });

  it("getReadOnly: returns false when no dmnTableList match", () => {
    const selectedElement = { id: "Decision_1" } as unknown as DmnElement;
    mockGetBusinessObject.mockReturnValue({ id: "Decision_UNMATCHED" });

    const wkfModel: WkfDmnModel = {
      id: 1,
      version: 0,
      name: "Test",
      dmnTableList: [{ id: 1, decisionId: "Decision_1", name: "Dec1" }],
    };

    const deps = createMockDeps({ selectedElement, wkfModel });
    const { result } = renderHook(() => useDmnNavigation(deps));

    const readOnly = result.current.getReadOnly({ modelProperty: "id" });
    expect(readOnly).toBe(false);
  });

  it("getReadOnly: returns false when modelProperty is not 'id'", () => {
    const selectedElement = { id: "Decision_1" } as unknown as DmnElement;
    mockGetBusinessObject.mockReturnValue({ id: "Decision_1" });

    const wkfModel: WkfDmnModel = {
      id: 1,
      version: 0,
      name: "Test",
      dmnTableList: [{ id: 1, decisionId: "Decision_1", name: "Dec1" }],
    };

    const deps = createMockDeps({ selectedElement, wkfModel });
    const { result } = renderHook(() => useDmnNavigation(deps));

    const readOnly = result.current.getReadOnly({ modelProperty: "name" });
    expect(readOnly).toBe(false);
  });
});
