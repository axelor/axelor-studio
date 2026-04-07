/**
 * Zustand store for ExpressionBuilder state.
 *
 * Replaces the 7 useState calls in the original ExpressionBuilder component
 * with a single store. Uses zustand v5 `create` API.
 */
import { create } from "zustand";
import { produce } from "immer";

export interface ExpressionComponent {
  value?: Record<string, unknown>;
  Component?: React.ComponentType<unknown>;
  [key: string]: unknown;
}

interface ExpressionState {
  combinator: string;
  expressionComponents: ExpressionComponent[];
  record: Record<string, unknown> | null;
  openAlert: boolean;
  defaultExpressionValue: unknown | null;
  singleResult: boolean;
  generateWithId: boolean;
}

interface ExpressionActions {
  setCombinator: (val: string) => void;
  setExpressionComponents: (
    v: ExpressionComponent[] | ((draft: ExpressionComponent[]) => void),
  ) => void;
  setRecord: (val: Record<string, unknown> | null) => void;
  setAlert: (val: boolean) => void;
  setDefaultExpressionValue: (val: unknown | null) => void;
  setSingleResult: (val: boolean) => void;
  setGenerateWithId: (val: boolean) => void;
  reset: () => void;
}

type ExpressionStore = ExpressionState & ExpressionActions;

const initialState: ExpressionState = {
  combinator: "and",
  expressionComponents: [{}],
  record: null,
  openAlert: false,
  defaultExpressionValue: null,
  singleResult: false,
  generateWithId: false,
};

export function createExpressionStore() {
  return create<ExpressionStore>((set, get) => ({
    ...initialState,

    setCombinator: (val) => set({ combinator: val }),

    /**
     * setExpressionComponents accepts either:
     *   - A direct value (array)
     *   - An immer producer function (for produce() compatibility)
     */
    setExpressionComponents: (valOrUpdater) => {
      if (typeof valOrUpdater === "function") {
        set({ expressionComponents: produce(get().expressionComponents, valOrUpdater) });
      } else {
        set({ expressionComponents: valOrUpdater });
      }
    },

    setRecord: (val) => set({ record: val }),
    setAlert: (val) => set({ openAlert: val }),
    setDefaultExpressionValue: (val) => set({ defaultExpressionValue: val }),
    setSingleResult: (val) => set({ singleResult: val }),
    setGenerateWithId: (val) => set({ generateWithId: val }),

    reset: () => set({ ...initialState, expressionComponents: [{}] }),
  }));
}
