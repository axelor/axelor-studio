import { useEffect, useCallback } from "react";

import { useModeler } from "./useModeler";

/**
 * Hook that auto-manages bpmn-js event listener lifecycle.
 * Registers via eventBus.on() at mount and unregisters via eventBus.off()
 * at unmount, using the SAME handler reference (solving the common identity bug).
 *
 * All listener registrations should use this hook (locked decision).
 */
export function useModelerEvent(
  eventName: string,
  handler: (...args: unknown[]) => void,
  deps: unknown[] = [],
): void {
  const modeler = useModeler();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableHandler = useCallback(handler, deps);

  useEffect(() => {
    if (!modeler) return;

    const eventBus = modeler.get("eventBus");
    eventBus.on(eventName, stableHandler);

    return () => {
      eventBus.off(eventName, stableHandler);
    };
  }, [modeler, eventName, stableHandler]);
}
