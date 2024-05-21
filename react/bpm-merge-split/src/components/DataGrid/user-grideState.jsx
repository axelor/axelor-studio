import React from "react";
import { produce } from "immer";

function useGridState(initState) {
  const [state, setState] = React.useState({
    columns: [],
    rows: [],
    ...initState,
  });
  const setMutableState = React.useCallback(
    (newState) => setState(produce(newState)),
    [setState]
  );

  return [state, setMutableState];
}

export default useGridState;
