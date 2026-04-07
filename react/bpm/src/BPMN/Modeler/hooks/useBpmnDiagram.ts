import { useRef } from "react";
import type { TypedBpmnModeler } from "@studio/shared/types";

import useWkfStore from "../stores/useWkfStore";

import { useToolbarItems } from "./useToolbarItems";
import { useExtensionElements } from "./useExtensionElements";
import { useDiagramLifecycle } from "./useDiagramLifecycle";
import { useDiagramPersistence } from "./useDiagramPersistence";
import { useWkfManagement } from "./useWkfManagement";
import { useViewControls } from "./useViewControls";
import type { DeployProgressResult } from "./useDeployProgress";

/**
 * Facade hook composing domain hooks for BpmnModelerInner.
 * Delegates lifecycle to useDiagramLifecycle, persistence to useDiagramPersistence,
 * wkf-management to useWkfManagement, view-controls to useViewControls.
 */
interface UseBpmnDiagramDeps {
  update: (fn: (state: Record<string, unknown>) => Record<string, unknown>) => void;
  info: Record<string, unknown> | null;
  openDialog: (opts: Record<string, unknown>) => void;
  deployProgress: DeployProgressResult;
}

export function useBpmnDiagram(
  bpmnModeler: TypedBpmnModeler | null,
  { update, info, openDialog, deployProgress }: UseBpmnDiagramDeps,
) {
  // --- Ref mirror for stale closure avoidance ---
  const bpmnModelerRef = useRef<TypedBpmnModeler | null>(null);
  bpmnModelerRef.current = bpmnModeler;

  const diagramXmlRef = useRef<string | null>(null);

  // --- Lifecycle domain hook ---
  const lifecycle = useDiagramLifecycle({ bpmnModelerRef, diagramXmlRef, update, info });

  // --- Persistence domain hook ---
  const persistence = useDiagramPersistence({
    bpmnModelerRef,
    diagramXmlRef,
    update,
    openDialog,
    deployProgress,
    fetchDiagram: lifecycle.fetchDiagram,
    newBpmnDiagram: lifecycle.newBpmnDiagram,
    addDiagramProperties: lifecycle.addDiagramProperties,
    isTimerTask: lifecycle.isTimerTask,
  });

  // --- View controls domain hook ---
  const viewControls = useViewControls({ bpmnModelerRef });

  // --- WKF management domain hook ---
  const wkfMgmt = useWkfManagement({
    bpmnModelerRef,
    diagramXmlRef,
    update,
    openDialog,
    fetchDiagram: lifecycle.fetchDiagram,
    newBpmnDiagram: lifecycle.newBpmnDiagram,
    addNewDiagram: lifecycle.addNewDiagram,
    checkIfUpdated: persistence.checkIfUpdated,
  });

  // --- Toolbar items ---
  const { leftToolbar, rightToolbar, bottomToolbar } = useToolbarItems({
    onNew: wkfMgmt.onNew,
    onSave: persistence.onSave,
    onDelete: wkfMgmt.onDelete,
    onRefresh: wkfMgmt.onRefresh,
    deployDiagram: persistence.deployDiagram,
    addDiagramProperties: lifecycle.addDiagramProperties,
    toggleXmlEditor: viewControls.toggleXmlEditor,
    toggleMinimap: viewControls.toggleMinimap,
    zoomIn: viewControls.zoomIn,
    zoomOut: viewControls.zoomOut,
    resetViewport: viewControls.resetViewport,
    enterFullscreen: viewControls.enterFullscreen,
    wkf: useWkfStore((s) => s.wkf),
    id: useWkfStore((s) => s.id),
    bpmnModeler,
  });

  // --- Extension elements ---
  const { createParent, addProperty, handleAdd, addCallActivityExtensionElement } =
    useExtensionElements();

  return {
    // Store-backed state
    openDelopyDialog: useWkfStore((s) => s.openDeployDialog),
    setDelopyDialog: useWkfStore.getState().setOpenDeployDialog,
    ids: useWkfStore((s) => s.ids),

    // Refs
    initialStateRef: {
      get current() {
        return lifecycle.initialState;
      },
    },
    diagramXmlRef,

    // Diagram lifecycle (delegated to useDiagramLifecycle)
    ...lifecycle,

    // Save/deploy (delegated to useDiagramPersistence)
    ...persistence,

    // View controls (delegated to useViewControls)
    ...viewControls,

    // Wkf management (delegated to useWkfManagement)
    ...wkfMgmt,

    // Extension elements
    createParent,
    addProperty,
    handleAdd,
    addCallActivityExtensionElement,

    // Toolbars
    leftToolbar,
    rightToolbar,
    bottomToolbar,

    // Color management is NOT here -- stays in BpmnModelerInner
    // because it depends on reactive selectedElement for the hook param
  };
}
