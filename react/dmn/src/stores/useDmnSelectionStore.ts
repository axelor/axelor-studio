import { create } from "zustand";
import type { DmnElement } from "@studio/shared/types";

interface DmnTab {
  id: string;
  label: string;
  groups: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

interface DmnSelectionState {
  selectedElement: DmnElement | null;
  decision: DmnElement | null;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  inputIndex: number | null;
  outputIndex: number | null;
  rule: Record<string, unknown> | null;
  inputRule: Record<string, unknown> | null;
  rootElement: DmnElement | null;
  tabs: DmnTab[] | null;
  tabValue: number;
}

interface DmnSelectionActions {
  setSelectedElement: (el: DmnElement | null) => void;
  setDecision: (decision: DmnElement | null) => void;
  setInput: (input: Record<string, unknown> | null) => void;
  setOutput: (output: Record<string, unknown> | null) => void;
  setInputIndex: (inputIndex: number | null) => void;
  setOutputIndex: (outputIndex: number | null) => void;
  setRule: (rule: Record<string, unknown> | null) => void;
  setInputRule: (inputRule: Record<string, unknown> | null) => void;
  setRootElement: (rootElement: DmnElement | null) => void;
  setTabs: (tabs: DmnTab[] | null) => void;
  setTabValue: (tabValue: number) => void;
  resetTableSelection: () => void;
  reset: () => void;
}

type DmnSelectionStore = DmnSelectionState & DmnSelectionActions;

const useDmnSelectionStore = create<DmnSelectionStore>((set) => ({
  // State
  selectedElement: null,
  decision: null,
  input: null,
  output: null,
  inputIndex: null,
  outputIndex: null,
  rule: null,
  inputRule: null,
  rootElement: null,
  tabs: null,
  tabValue: 0,

  // Actions
  setSelectedElement: (el) => set({ selectedElement: el }),
  setDecision: (decision) => set({ decision }),
  setInput: (input) => set({ input }),
  setOutput: (output) => set({ output }),
  setInputIndex: (inputIndex) => set({ inputIndex }),
  setOutputIndex: (outputIndex) => set({ outputIndex }),
  setRule: (rule) => set({ rule }),
  setInputRule: (inputRule) => set({ inputRule }),
  setRootElement: (rootElement) => set({ rootElement }),
  setTabs: (tabs) => set({ tabs }),
  setTabValue: (tabValue) => set({ tabValue }),

  // Reset table selection (called on view switch -- resets input/output/rule fields)
  resetTableSelection: () =>
    set({
      input: null,
      output: null,
      inputIndex: null,
      outputIndex: null,
      rule: null,
      inputRule: null,
    }),

  // Full reset (called on unmount / diagram change)
  reset: () =>
    set({
      selectedElement: null,
      decision: null,
      input: null,
      output: null,
      inputIndex: null,
      outputIndex: null,
      rule: null,
      inputRule: null,
      rootElement: null,
      tabs: null,
      tabValue: 0,
    }),
}));

export default useDmnSelectionStore;
