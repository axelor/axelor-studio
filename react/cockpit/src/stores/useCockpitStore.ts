/**
 * Zustand store for cockpit UI state (D-30).
 *
 * Follows the established State / Actions / reset() pattern
 * from useWkfStore.ts in the bpm package.
 */

import { create } from "zustand";

import type { AnalyticsFilter, AnalyticsMode, InstanceStatus } from "../api/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CockpitState {
  selectedProcessId: string | null;
  activeTab: "dashboard" | "process-detail";
  searchQuery: string;
  period: string;
  selectedInstanceId: string | null;
  instanceStatusFilter: InstanceStatus | null; // null = All
  instanceSearchQuery: string;
  selectedNodeId: string | null;
  selectedAnalyticsNodeId: string | null;
  analyticsMode: AnalyticsMode;
  analyticsFilters: AnalyticsFilter[];
}

interface CockpitActions {
  selectProcess: (id: string | null) => void;
  setActiveTab: (tab: CockpitState["activeTab"]) => void;
  setSearchQuery: (q: string) => void;
  setPeriod: (p: string) => void;
  selectInstance: (id: string | null) => void;
  setInstanceStatusFilter: (status: InstanceStatus | null) => void;
  setInstanceSearchQuery: (q: string) => void;
  selectNode: (id: string | null) => void;
  selectAnalyticsNode: (id: string | null) => void;
  setAnalyticsMode: (mode: AnalyticsMode) => void;
  addAnalyticsFilter: (filter: AnalyticsFilter) => void;
  removeAnalyticsFilter: (id: string) => void;
  clearAnalyticsFilters: () => void;
  reset: () => void;
}

export type CockpitStore = CockpitState & CockpitActions;

// ---------------------------------------------------------------------------
// Initial state (exported for test assertions)
// ---------------------------------------------------------------------------

const initialState: CockpitState = {
  selectedProcessId: null,
  activeTab: "dashboard",
  searchQuery: "",
  period: "30d",
  selectedInstanceId: null,
  instanceStatusFilter: null,
  instanceSearchQuery: "",
  selectedNodeId: null,
  selectedAnalyticsNodeId: null,
  analyticsMode: "duration" as AnalyticsMode,
  analyticsFilters: [],
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCockpitStore = create<CockpitStore>((set) => ({
  // State
  ...initialState,

  // Actions
  selectProcess: (id) => set({ selectedProcessId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setPeriod: (p) => set({ period: p }),
  selectInstance: (id) => set({ selectedInstanceId: id }),
  setInstanceStatusFilter: (status) => set({ instanceStatusFilter: status }),
  setInstanceSearchQuery: (q) => set({ instanceSearchQuery: q }),
  selectNode: (id) => set({ selectedNodeId: id }),
  selectAnalyticsNode: (id) => set({ selectedAnalyticsNodeId: id }),
  setAnalyticsMode: (mode) => set({ analyticsMode: mode }),
  addAnalyticsFilter: (filter) =>
    set((state) => ({
      analyticsFilters: state.analyticsFilters.some((f) => f.id === filter.id)
        ? state.analyticsFilters
        : [...state.analyticsFilters, filter],
    })),
  removeAnalyticsFilter: (id) =>
    set((state) => ({
      analyticsFilters: state.analyticsFilters.filter((f) => f.id !== id),
    })),
  clearAnalyticsFilters: () => set({ analyticsFilters: [] }),

  // Reset
  reset: () => set(initialState),
}));
