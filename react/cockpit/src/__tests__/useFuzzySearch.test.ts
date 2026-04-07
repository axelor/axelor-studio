import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import type { ProcessSummary } from "../api/types";
import { useFuzzySearch } from "../hooks/useFuzzySearch";

const mockProcesses: ProcessSummary[] = [
  {
    id: 1,
    code: "proc-1",
    name: "Order Process",
    description: "Handles customer orders",
    statusSelect: 1,
    versionTag: "1.0",
    kpiTime: [],
    kpiQuality: [],
  },
  {
    id: 2,
    code: "proc-2",
    name: "Invoice Process",
    description: "Manages invoice approval workflow",
    statusSelect: 1,
    versionTag: "2.1",
    kpiTime: [],
    kpiQuality: [],
  },
  {
    id: 3,
    code: "proc-3",
    name: "Leave Request",
    description: "Employee leave approval",
    statusSelect: 2,
    versionTag: "1.3",
    kpiTime: [],
    kpiQuality: [],
  },
];

describe("useFuzzySearch", () => {
  it("returns all processes when query is empty", () => {
    const { result } = renderHook(() => useFuzzySearch(mockProcesses, ""));
    expect(result.current).toHaveLength(3);
    expect(result.current).toEqual(mockProcesses);
  });

  it("returns all processes when query is whitespace", () => {
    const { result } = renderHook(() => useFuzzySearch(mockProcesses, "   "));
    expect(result.current).toHaveLength(3);
  });

  it("returns filtered results for matching query", () => {
    const { result } = renderHook(() =>
      useFuzzySearch(mockProcesses, "Order"),
    );
    expect(result.current.length).toBeGreaterThan(0);
    expect(result.current[0].name).toBe("Order Process");
  });

  it("returns empty array for non-matching query", () => {
    const { result } = renderHook(() =>
      useFuzzySearch(mockProcesses, "zzzznonexistent"),
    );
    expect(result.current).toHaveLength(0);
  });

  it("supports fuzzy matching (ordr matches Order Process)", () => {
    const { result } = renderHook(() =>
      useFuzzySearch(mockProcesses, "ordr"),
    );
    expect(result.current.length).toBeGreaterThan(0);
    expect(result.current.some((p) => p.name === "Order Process")).toBe(true);
  });

  it("searches across description field", () => {
    const { result } = renderHook(() =>
      useFuzzySearch(mockProcesses, "invoice approval"),
    );
    expect(result.current.length).toBeGreaterThan(0);
    expect(result.current.some((p) => p.name === "Invoice Process")).toBe(true);
  });
});
