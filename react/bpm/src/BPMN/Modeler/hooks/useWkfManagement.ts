import React, { useCallback } from "react";
import type { TypedBpmnModeler } from "@studio/shared/types";

import {
  fetchWkf,
  getWkfModels,
  removeWkf,
} from "../../../shared/services";
import useWkfStore from "../stores/useWkfStore";
import useSnackbarStore from "../stores/useSnackbarStore";
import type { WkfModel } from "../stores/useWkfStore";

import type { DiagramLifecycleReturn } from "./useDiagramLifecycle";
import type { DiagramPersistenceReturn } from "./useDiagramPersistence";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseWkfManagementDeps {
  bpmnModelerRef: React.MutableRefObject<TypedBpmnModeler | null>;
  diagramXmlRef: React.MutableRefObject<string | null>;
  update: (fn: (state: Record<string, unknown>) => Record<string, unknown>) => void;
  openDialog: (opts: Record<string, unknown>) => void;
  // Cross-hook deps from lifecycle:
  fetchDiagram: DiagramLifecycleReturn["fetchDiagram"];
  newBpmnDiagram: DiagramLifecycleReturn["newBpmnDiagram"];
  addNewDiagram: DiagramLifecycleReturn["addNewDiagram"];
  // Cross-hook deps from persistence:
  checkIfUpdated: DiagramPersistenceReturn["checkIfUpdated"];
}

interface WkfManagementReturn {
  onNew: (isSkipAlert?: boolean) => Promise<void>;
  onDelete: () => void;
  onRefresh: () => Promise<void>;
  reloadView: () => void;
  updateWkfModel: (value: WkfModel, oldValue?: WkfModel) => Promise<void>;
  getModels: (criteria: unknown) => Promise<unknown>;
}

// ---------------------------------------------------------------------------
// Helper: snackbar
// ---------------------------------------------------------------------------

function showSnackbar(messageType: string, message: string): void {
  useSnackbarStore.getState().show(messageType, message);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWkfManagement(deps: UseWkfManagementDeps): WkfManagementReturn {
  const {
    update,
    openDialog,
    fetchDiagram,
    newBpmnDiagram,
    addNewDiagram,
    checkIfUpdated,
  } = deps;

  // --- reloadView ---
  const reloadView = useCallback(() => {
    const id = useWkfStore.getState().id;
    useWkfStore.getState().setInitialState(false);
    useWkfStore.getState().setDirty(false);
    fetchDiagram(id as number | string | undefined);
  }, [fetchDiagram]);

  // --- updateWkf (internal helper) ---
  const updateWkf = useCallback(
    async (value: WkfModel) => {
      useWkfStore.getState().setInitialState(false);
      useWkfStore.getState().setDirty(false);
      const wkfId = value?.id as number | string | undefined;
      if (!wkfId) return;
      const wkf = (await fetchWkf(wkfId)) as WkfModel | null;
      update((state) => ({ ...state, record: wkf }));
      const diagramXml = wkf?.diagramXml;
      const fetchedId = wkf?.id as number | string | undefined;
      useWkfStore.getState().setWkf(wkf);
      useWkfStore.getState().setId(fetchedId ?? null);
      newBpmnDiagram(diagramXml, false, fetchedId, wkf ?? undefined);
    },
    [newBpmnDiagram, update],
  );

  // --- updateWkfModel ---
  const updateWkfModel = useCallback(
    async (value: WkfModel, oldValue?: WkfModel) => {
      const isDirty = await checkIfUpdated();
      if (isDirty) {
        openDialog({
          title: "Update",
          message: "Current changes will be lost. Do you really want to proceed?",
          onSave: () => updateWkf(value),
          onClose: () => useWkfStore.getState().setWkf(oldValue ?? null),
        });
      } else {
        updateWkf(value);
      }
    },
    [updateWkf, checkIfUpdated, openDialog],
  );

  // --- onNew ---
  const onNew = useCallback(
    async (isSkipAlert: boolean = false) => {
      const isDirty = await checkIfUpdated();
      if (isDirty && !isSkipAlert) {
        openDialog({
          title: "New",
          message: "Current changes will be lost. Do you really want to proceed?",
          onSave: addNewDiagram,
        });
      } else {
        addNewDiagram();
      }
      useWkfStore.getState().setShowError(false);
    },
    [addNewDiagram, checkIfUpdated, openDialog],
  );

  // --- onDelete ---
  const onDelete = useCallback(() => {
    const id = useWkfStore.getState().id;
    openDialog({
      title: "Question",
      message: `Are you sure you want to delete this record?`,
      onSave: async () => {
        const res = await removeWkf(id as number | string);
        if (typeof res !== "string") {
          showSnackbar("success", "Deleted Successfully");
          onNew(true);
        } else {
          showSnackbar("danger", res);
        }
      },
    });
  }, [openDialog, onNew]);

  // --- onRefresh ---
  const onRefresh = useCallback(async () => {
    const isDirty = await checkIfUpdated();
    if (isDirty) {
      openDialog({
        title: "Refresh",
        message: "Current changes will be lost. Do you really want to proceed?",
        onSave: reloadView,
      });
    } else {
      reloadView();
    }
  }, [checkIfUpdated, openDialog, reloadView]);

  // --- getModels ---
  const getModels = useCallback((criteria: unknown) => {
    return getWkfModels(criteria as Record<string, unknown> | undefined);
  }, []);

  return {
    onNew,
    onDelete,
    onRefresh,
    reloadView,
    updateWkfModel,
    getModels,
  };
}
