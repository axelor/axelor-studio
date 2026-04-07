/**
 * Behavioral tests for useExpressionData hook.
 *
 * Tests data fetching, model resolution, and expression component
 * population flows. Uses renderHook with mocked services.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

const mockIsBPMQuery = vi.fn();
const mockGetRecord = vi.fn();
const mockGetModels = vi.fn();

vi.mock("../../common/utils", () => ({
  isBPMQuery: (...args: unknown[]) => mockIsBPMQuery(...args),
  translate: (s: string) => s,
  lowerCaseFirstLetter: (s: string) => s.charAt(0).toLowerCase() + s.slice(1),
  jsStringEscape: (s: string) => s,
}));

vi.mock("../../services/data-service", () => ({
  getRecord: (...args: unknown[]) => mockGetRecord(...args),
}));

vi.mock("../../services/model-service", () => ({
  getModels: (...args: unknown[]) => mockGetModels(...args),
}));

// ---------------------------------------------------------------------------
// Import under test
// ---------------------------------------------------------------------------

import { useExpressionData } from "../expression-builder/useExpressionData";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeDeps(overrides: Record<string, unknown> = {}) {
  return {
    queryModel: undefined as string | undefined,
    parentType: "bpmQuery",
    isPackage: false,
    exprVal: undefined as Record<string, unknown> | undefined,
    getExpression: undefined as (() => Record<string, unknown>) | undefined,
    model: undefined as string | undefined,
    id: undefined as string | number | undefined,
    resultMetaField: undefined as string | undefined,
    setExpressionComponents: vi.fn(),
    setCombinator: vi.fn(),
    setDefaultExpressionValue: vi.fn(),
    setRecord: vi.fn(),
    setSingleResult: vi.fn(),
    setGenerateWithId: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useExpressionData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBPMQuery.mockReturnValue(true);
    mockGetModels.mockResolvedValue([{ name: "TestModel", type: "metaModel" }]);
    mockGetRecord.mockResolvedValue(null);
  });

  it("fetches models by queryModel and sets expression components for BPM queries", async () => {
    const deps = makeDeps({ queryModel: "com.axelor.test.TestModel" });

    renderHook(() => useExpressionData(deps as never));

    await waitFor(() => {
      expect(mockGetModels).toHaveBeenCalledWith(
        expect.objectContaining({
          criteria: [
            expect.objectContaining({
              fieldName: "name",
              operator: "=",
              value: "TestModel",
            }),
          ],
        }),
        "metaModel",
      );
    });

    await waitFor(() => {
      expect(deps.setExpressionComponents).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            value: expect.objectContaining({
              metaModals: { name: "TestModel", type: "metaModel" },
            }),
          }),
        ]),
      );
    });
  });

  it("does nothing when queryModel is empty and no exprVal/getExpression provided", async () => {
    const deps = makeDeps({ queryModel: undefined, model: undefined, id: undefined });

    renderHook(() => useExpressionData(deps as never));

    // Should attempt setQueryModel from the fetchValue useEffect (no model/id)
    // but queryModel is undefined, so no models call
    await waitFor(() => {
      expect(mockGetModels).not.toHaveBeenCalled();
    });
  });

  it("fetches record and parses resultMetaField JSON when model and id are provided", async () => {
    const exprData = {
      values: [
        { metaModalName: "SaleOrder", metaModalType: "metaModel", rules: [{}] },
      ],
      combinator: "or",
    };
    mockGetRecord.mockResolvedValue({
      expressionField: JSON.stringify(exprData),
    });
    mockGetModels.mockResolvedValue([{ name: "SaleOrder", type: "metaModel" }]);

    const deps = makeDeps({
      model: "com.axelor.sale.db.SaleOrder",
      id: 42,
      resultMetaField: "expressionField",
    });

    renderHook(() => useExpressionData(deps as never));

    await waitFor(() => {
      expect(mockGetRecord).toHaveBeenCalledWith("com.axelor.sale.db.SaleOrder", 42);
    });

    await waitFor(() => {
      expect(deps.setRecord).toHaveBeenCalledWith(
        expect.objectContaining({ expressionField: JSON.stringify(exprData) }),
      );
    });

    await waitFor(() => {
      expect(deps.setCombinator).toHaveBeenCalledWith("or");
    });
  });

  it("processes exprVal when provided directly", async () => {
    const exprVal = {
      values: [
        { metaModalName: "Product", metaModalType: "metaModel", rules: [{ id: 1 }] },
      ],
      combinator: "and",
    };
    mockGetModels.mockResolvedValue([{ name: "Product", type: "metaModel" }]);

    const deps = makeDeps({ exprVal });

    renderHook(() => useExpressionData(deps as never));

    await waitFor(() => {
      expect(mockGetModels).toHaveBeenCalledWith(
        expect.objectContaining({
          criteria: [{ fieldName: "name", operator: "=", value: "Product" }],
        }),
        "metaModel",
      );
    });

    await waitFor(() => {
      expect(deps.setExpressionComponents).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            value: expect.objectContaining({
              metaModals: { name: "Product", type: "metaModel" },
              rules: [{ id: 1 }],
            }),
          }),
        ]),
      );
    });
  });
});
