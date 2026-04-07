import { createContext } from "react";

interface DmnActions {
  onSave: () => void;
  deployDiagram: () => void;
  onRefresh: () => void;
  reloadView: () => void;
}

/**
 * Context for DmnModeler action callbacks that child components need.
 * These are callbacks that depend on DmnModeler internal state and cannot
 * be derived from Zustand stores alone (save, deploy, refresh).
 *
 * Pattern: DmnModelerInner creates actions and provides them via this context.
 * Child property panels and other children consume them without prop drilling.
 */
export const DmnActionsContext = createContext<DmnActions | null>(null);
