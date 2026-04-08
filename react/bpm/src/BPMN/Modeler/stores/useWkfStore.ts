import { create } from "zustand";

import { syncAxelorTabDirty } from "../utils/sync-axelor-tab";

export interface WkfModel {
  id?: number | null;
  name?: string;
  code?: string;
  diagramXml?: string;
  statusSelect?: number;
  oldNodes?: string;
  wkfProcessList?: Array<{ name: string; processId?: string; [key: string]: unknown }>;
  previousVersion?: Record<string, unknown> | null;
  isMigrationOnGoing?: boolean;
  versionTag?: string;
  description?: string;
  wkfStatusColor?: string;
  studioApp?: { code: string; [key: string]: unknown } | null;
  bpmnImage?: string;
  version?: number;
  [key: string]: unknown;
}

interface WkfState {
  wkf: WkfModel | null;
  id: number | string | null;
  enableStudioApp: boolean;
  showError: boolean;
  initialState: boolean;
  ids: {
    currentElements?: Record<string, { elements: Array<{ id: string; name: string; type: string; [key: string]: unknown }> }>;
    oldElements?: Record<string, { elements: Array<{ id: string; name: string; type: string; [key: string]: unknown }> }>;
  } | null;
  openDeployDialog: boolean;
  dirty: boolean;
}

interface WkfActions {
  setWkf: (val: WkfModel | null) => void;
  setId: (val: number | string | null) => void;
  setEnableStudioApp: (val: boolean) => void;
  setShowError: (val: boolean) => void;
  setInitialState: (val: boolean) => void;
  setIds: (val: WkfState["ids"]) => void;
  setOpenDeployDialog: (val: boolean) => void;
  setDirty: (dirty?: boolean) => void;
  reset: () => void;
}

type WkfStore = WkfState & WkfActions;

const useWkfStore = create<WkfStore>((set) => ({
  // State
  wkf: null,
  id: null,
  enableStudioApp: false,
  showError: false,
  initialState: false,
  ids: null,
  openDeployDialog: false,
  dirty: false,

  // Actions
  setWkf: (val) => set({ wkf: val }),
  setId: (val) => set({ id: val }),
  setEnableStudioApp: (val) => set({ enableStudioApp: val }),
  setShowError: (val) => set({ showError: val }),
  setInitialState: (val) => set({ initialState: val }),
  setIds: (val) => set({ ids: val }),
  setOpenDeployDialog: (val) => set({ openDeployDialog: val }),
  setDirty: (dirty: boolean = true) => {
    set({ dirty });
    syncAxelorTabDirty(dirty);
  },

  // Reset
  reset: () =>
    set({
      wkf: null,
      id: null,
      enableStudioApp: false,
      showError: false,
      initialState: false,
      ids: null,
      openDeployDialog: false,
      dirty: false,
    }),
}));

export default useWkfStore;
