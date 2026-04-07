/**
 * Zustand store for Builder state.
 *
 * Replaces the 14 useState/useMutableState calls in Builder.jsx
 * with a single store. Uses zustand v5 `create` API.
 *
 * State:
 *   loading, builderRecord, model, metaFields, builderFields,
 *   sourceModel, sourceModelList, newRecord, savedRecord, save,
 *   createVariable, modelFrom, processId
 *
 * Actions:
 *   setLoading, setBuilderRecord, setModel, setMetaFields,
 *   setBuilderFields (accepts updater fn for immer), setSourceModel,
 *   setSourceModelList (accepts updater fn), setNewRecord, setSavedRecord,
 *   setSave, setCreateVariable, setModelFrom, setProcessId, reset
 */
import { create } from "zustand";
import { produce, type Draft } from "immer";

import { VALUE_FROM, translate } from "../utils";
import type { BuilderField, MetaField, ModelRecord } from "../utils";

interface ModelFrom {
  title: string;
  id: string;
}

interface ProcessId {
  name: string;
  [key: string]: unknown;
}

export interface MapperState {
  loading: boolean;
  builderRecord: Record<string, unknown>;
  model: ModelRecord | null;
  metaFields: MetaField[];
  builderFields: BuilderField[];
  sourceModel: ModelRecord | null;
  sourceModelList: ModelRecord[];
  newRecord: boolean;
  savedRecord: boolean;
  save: boolean;
  createVariable: boolean;
  modelFrom: ModelFrom;
  processId: ProcessId | null;
}

export interface MapperActions {
  setLoading: (val: boolean) => void;
  setBuilderRecord: (val: Record<string, unknown>) => void;
  setModel: (val: ModelRecord | null) => void;
  setMetaFields: (val: MetaField[]) => void;
  setBuilderFields: (
    valOrUpdater: BuilderField[] | ((draft: Draft<BuilderField[]>) => void),
  ) => void;
  setSourceModel: (val: ModelRecord | null) => void;
  setSourceModelList: (
    valOrUpdater: ModelRecord[] | ((prev: ModelRecord[]) => ModelRecord[]),
  ) => void;
  setNewRecord: (val: boolean) => void;
  setSavedRecord: (val: boolean) => void;
  setSave: (val: boolean) => void;
  setCreateVariable: (val: boolean) => void;
  setModelFrom: (val: ModelFrom) => void;
  setProcessId: (val: ProcessId | null) => void;
  reset: () => void;
}

export type MapperStore = MapperState & MapperActions;

const initialState: MapperState = {
  // UI state
  loading: false,

  // Record state
  builderRecord: {},

  // Model state
  model: null,
  metaFields: [],
  sourceModel: null,
  sourceModelList: [],

  // Builder fields (immer-compatible)
  builderFields: [],

  // Flags
  newRecord: false,
  savedRecord: false,
  save: true,

  // BPMN-specific
  createVariable: false,
  modelFrom: { title: translate("Context"), id: VALUE_FROM.CONTEXT },
  processId: null,
};

export function createMapperStore() {
  return create<MapperStore>((set, get) => ({
    ...initialState,

    setLoading: (val) => set({ loading: val }),
    setBuilderRecord: (val) => set({ builderRecord: val }),
    setModel: (val) => set({ model: val }),
    setMetaFields: (val) => set({ metaFields: val }),
    setSourceModel: (val) => set({ sourceModel: val }),

    /**
     * setSourceModelList accepts either:
     *   - A direct value (array)
     *   - An updater function (prev => newValue)
     */
    setSourceModelList: (valOrUpdater) => {
      if (typeof valOrUpdater === "function") {
        set({ sourceModelList: valOrUpdater(get().sourceModelList) });
      } else {
        set({ sourceModelList: valOrUpdater });
      }
    },

    /**
     * setBuilderFields accepts either:
     *   - A direct value (array)
     *   - An immer producer function (for produce() compatibility)
     * This preserves useMutableState semantics.
     */
    setBuilderFields: (valOrUpdater) => {
      if (typeof valOrUpdater === "function") {
        set({ builderFields: produce(get().builderFields, valOrUpdater) });
      } else {
        set({ builderFields: valOrUpdater });
      }
    },

    setNewRecord: (val) => set({ newRecord: val }),
    setSavedRecord: (val) => set({ savedRecord: val }),
    setSave: (val) => set({ save: val }),
    setCreateVariable: (val) => set({ createVariable: val }),
    setModelFrom: (val) => set({ modelFrom: val }),
    setProcessId: (val) => set({ processId: val }),

    reset: () => set({ ...initialState }),
  }));
}
