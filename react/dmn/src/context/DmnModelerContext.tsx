import React, { createContext, useContext, useRef, useEffect, useState } from "react";
import DmnModeler from "dmn-js/lib/Modeler";

type DmnModelerInstance = InstanceType<typeof DmnModeler>;

/**
 * Context for the dmn-js Modeler instance.
 * Value is null until the Provider's useEffect creates the modeler.
 */
const DmnModelerContext = createContext<DmnModelerInstance | null>(null);

interface DmnModelerProviderProps {
  config: Record<string, unknown>;
  children: React.ReactNode;
}

/**
 * DmnModelerProvider creates and destroys a dmn-js Modeler instance
 * via useEffect lifecycle. Children access it via useDmnModeler() hook.
 */
export function DmnModelerProvider({ children, config }: DmnModelerProviderProps) {
  const modelerRef = useRef<DmnModelerInstance | null>(null);
  const [modeler, setModeler] = useState<DmnModelerInstance | null>(null);

  useEffect(() => {
    const instance = new DmnModeler(config);
    modelerRef.current = instance;
    setModeler(instance);

    return () => {
      instance.destroy();
      modelerRef.current = null;
    };
  }, [config]);

  return <DmnModelerContext.Provider value={modeler}>{children}</DmnModelerContext.Provider>;
}

/**
 * Hook to access the dmn-js Modeler instance from context.
 * Returns null until the DmnModelerProvider has created the instance.
 */
export function useDmnModeler(): DmnModelerInstance | null {
  return useContext(DmnModelerContext);
}
