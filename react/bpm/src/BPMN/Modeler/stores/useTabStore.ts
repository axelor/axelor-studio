import { create } from "zustand";

export interface TabItem {
  id: string;
  label: string;
  title?: string;
  groups: TabGroup[];
  enabled?: (element: unknown) => boolean;
}

export interface TabGroup {
  id: string;
  label: string;
  className?: string;
  entries: TabEntry[];
  component?: React.ComponentType<Record<string, unknown>>;
  enabled?: (element: unknown, node?: unknown) => boolean;
}

export interface TabEntry {
  id: string;
  widget?: string;
  isProcess?: boolean;
  hidden?: (element: unknown, node?: unknown) => boolean;
  showLink?: (element: unknown, node?: unknown) => boolean;
  [key: string]: unknown;
}

interface TabState {
  tabs: TabItem[];
  tabValue: number;
}

interface TabActions {
  setTabs: (tabs: TabItem[]) => void;
  setTabValue: (val: number) => void;
  reset: () => void;
}

type TabStore = TabState & TabActions;

const useTabStore = create<TabStore>((set) => ({
  // State
  tabs: [],
  tabValue: 0,

  // Actions
  setTabs: (tabs) => set({ tabs }),
  setTabValue: (val) => set({ tabValue: val }),

  // Reset (called on diagram change / unmount)
  reset: () => set({ tabs: [], tabValue: 0 }),
}));

export default useTabStore;
