import { createContext, useContext } from "react";

import type { WkfModel } from "../stores/useWkfStore";

/**
 * Actions provided to DrawerContent and other children via context.
 * @public - consumed via inline import() in BpmnModelerInner.tsx
 */
export interface BpmnActions {
  handleAdd: (row: unknown) => void;
  reloadView: () => void;
  onSave: () => Promise<void>;
  handleMenuActionTab: (val: boolean) => void;
  updateCommentsCount: (isIncrement?: boolean) => void;
  handleSnackbarClick: (messageType: string, message: string) => void;
  addNewVersion: (wkfParam?: WkfModel) => Promise<WkfModel | undefined>;
  changeColor: (color: string) => void;
  handleChange: (newValue: { id: string } | null) => void;
}

/**
 * Context for BpmnModeler action callbacks that child components need.
 * These are callbacks that depend on BpmnModeler internal state and cannot
 * be derived from Zustand stores alone.
 *
 * Pattern: BpmnModeler creates actions via domain hooks (useDiagramLifecycle,
 * useDiagramPersistence, useWkfManagement, useViewControls) composed through
 * useBpmnDiagram facade, and provides them via this context. DrawerContent and
 * other children consume them without prop drilling.
 */
export const BpmnActionsContext = createContext<BpmnActions | null>(null);

/**
 * Hook to access BpmnModeler action callbacks from context.
 * Returns null if no BpmnActionsProvider is in the tree.
 */
export function useBpmnActions(): BpmnActions | null {
  return useContext(BpmnActionsContext);
}
