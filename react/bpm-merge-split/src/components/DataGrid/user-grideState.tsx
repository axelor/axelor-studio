import React from "react";
import { produce, type Draft } from "immer";

interface GridState {
  columns: Record<string, unknown>[];
  rows: Record<string, unknown>[];
  selectedRows?: number[];
  [key: string]: unknown;
}

type SetMutableState = (recipe: ((draft: Draft<GridState>) => void) | GridState) => void;

function useGridState(initState?: Partial<GridState>): [GridState, SetMutableState] {
  const [state, setState] = React.useState<GridState>({
    columns: [],
    rows: [],
    ...initState,
  });
  const setMutableState: SetMutableState = React.useCallback(
    (newState: ((draft: Draft<GridState>) => void) | GridState) => {
      if (typeof newState === "function") {
        setState(produce(newState));
      } else {
        setState(newState);
      }
    },
    [setState],
  );

  return [state, setMutableState];
}

export default useGridState;
