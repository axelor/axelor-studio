import { useContext } from "react";
import type { TypedBpmnModeler } from "@studio/shared/types";

import { ModelerContext } from "../context/ModelerContext";

/**
 * Hook to access the bpmn-js Modeler instance from ModelerContext.
 * Returns null if no ModelerProvider is in the component tree
 * or if the modeler hasn't been created yet (does NOT throw).
 */
export function useModeler(): TypedBpmnModeler | null {
  return useContext(ModelerContext);
}
