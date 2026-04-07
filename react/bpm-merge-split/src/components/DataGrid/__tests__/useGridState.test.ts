import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";

import useGridState from "../user-grideState";

interface MockRow {
  key: number;
  type: string;
  record: { id: number; name?: string };
  [key: string]: unknown;
}

describe("useGridState", () => {
  it("initializes with empty columns and rows", () => {
    const { result } = renderHook(() => useGridState());
    const [state] = result.current;

    expect(state).toEqual({ columns: [], rows: [] });
  });

  it("accepts initial state override", () => {
    const { result } = renderHook(() =>
      useGridState({ selectedRows: [0, 1] }),
    );
    const [state] = result.current;

    expect(state.selectedRows).toEqual([0, 1]);
    expect(state.rows).toEqual([]);
  });

  it("functional updater preserves fields it does not touch", () => {
    const { result } = renderHook(() => useGridState());

    // Simulate what Grid does: populate rows
    act(() => {
      const [, setState] = result.current;
      setState((draft) => {
        draft.rows = [
          { key: 1, type: "row", record: { id: 1, name: "A" } },
          { key: 2, type: "row", record: { id: 2, name: "B" } },
        ] as MockRow[];
      });
    });

    expect(result.current[0].rows).toHaveLength(2);

    // Simulate what DataGrid does: update selectedRows only
    act(() => {
      const [, setState] = result.current;
      setState((draft) => {
        draft.selectedRows = [0];
      });
    });

    // rows MUST still be present — this is the exact regression scenario
    expect(result.current[0].rows).toHaveLength(2);
    expect(result.current[0].selectedRows).toEqual([0]);
  });

  it("direct value setter REPLACES entire state (unsafe pattern)", () => {
    const { result } = renderHook(() => useGridState());

    act(() => {
      const [, setState] = result.current;
      setState((draft) => {
        draft.rows = [{ key: 1, type: "row", record: { id: 1 } }] as MockRow[];
      });
    });

    expect(result.current[0].rows).toHaveLength(1);

    // This is the ANTI-PATTERN that caused the bug:
    // capturing stale state and spreading it wipes rows
    act(() => {
      const staleState = { columns: [], rows: [] };
      const [, setState] = result.current;
      setState({ ...staleState, selectedRows: [0] });
    });

    // rows are wiped — this test documents WHY direct value is dangerous
    expect(result.current[0].rows).toHaveLength(0);
  });
});
