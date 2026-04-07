import React, { createContext, useRef, useEffect, useState } from "react";
import type { TypedBpmnModeler } from "@studio/shared/types";
import BpmnModeler from "bpmn-js/lib/Modeler";

/**
 * Context for the bpmn-js Modeler instance.
 * Value is null until the Provider's useEffect creates the modeler.
 *
 * Uses TypedBpmnModeler (= structural interface backed by BpmnServiceMap) so consumers
 * get typed .get() resolution via getBpmnService().
 */
export const ModelerContext = createContext<TypedBpmnModeler | null>(null);

interface ModelerProviderProps {
  config: Record<string, unknown>;
  children: React.ReactNode;
}

/**
 * ModelerProvider creates and destroys a bpmn-js Modeler instance
 * via useEffect lifecycle. Children access it via useModeler() hook.
 *
 * Designed for multi-instance support (keyed by config).
 * Lifecycle managed inside the Provider's useEffect (locked decision).
 */
export function ModelerProvider({ children, config }: ModelerProviderProps) {
  const modelerRef = useRef<TypedBpmnModeler | null>(null);
  const [modeler, setModeler] = useState<TypedBpmnModeler | null>(null);

  useEffect(() => {
    // Safe assertion: TypedBpmnModeler is structurally compatible with BpmnModeler instance
    // The cast only adds typed .get() resolution via BpmnServiceMap
    const instance = new BpmnModeler(config) as unknown as TypedBpmnModeler; // safety: BpmnModeler constructor returns untyped instance
    modelerRef.current = instance;
    setModeler(instance);

    return () => {
      instance.destroy();
      modelerRef.current = null;
    };
  }, [config]);

  return <ModelerContext.Provider value={modeler}>{children}</ModelerContext.Provider>;
}
