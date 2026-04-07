import { create } from "zustand";
import type { ModdleElement } from "@studio/shared/types";

interface SelectionState {
  selectedElement: ModdleElement | null;
  isMenuActionDisable: boolean;
  comments: number | null;
}

interface SelectionActions {
  setSelectedElement: (el: ModdleElement | null) => void;
  setMenuActionDisable: (val: boolean) => void;
  setComments: (val: number | ((prev: number) => number) | null) => void;
  incrementComments: () => void;
  decrementComments: () => void;
  reset: () => void;
}

type SelectionStore = SelectionState & SelectionActions;

const useSelectionStore = create<SelectionStore>((set) => ({
  // State
  selectedElement: null,
  isMenuActionDisable: false,
  comments: null,

  // Actions
  setSelectedElement: (el) => set({ selectedElement: el }),
  setMenuActionDisable: (val) => set({ isMenuActionDisable: val }),
  setComments: (val) =>
    set((s) => ({
      comments: typeof val === "function" ? val(s.comments || 0) : val,
    })),
  incrementComments: () => set((s) => ({ comments: (s.comments || 0) + 1 })),
  decrementComments: () => set((s) => ({ comments: (s.comments || 0) - 1 })),

  // Reset (called on diagram change / unmount)
  reset: () =>
    set({
      selectedElement: null,
      isMenuActionDisable: false,
      comments: null,
    }),
}));

export default useSelectionStore;
