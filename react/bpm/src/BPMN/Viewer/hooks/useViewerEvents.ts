import { useEffect } from "react";
import type BpmnModelerCtor from "bpmn-js/lib/Modeler";

import { getElements } from "../../Modeler/extra";

type BpmnModeler = InstanceType<typeof BpmnModelerCtor>;

/**
 * Hook to set up viewer-specific event subscriptions.
 * Handles element.click (for instance mode) and shape.changed.
 */
export function useViewerEvents(
  viewer: BpmnModeler | null,
  isInstance: boolean,
  taskIds: string[] | null,
  activityCounts: string | null,
  setNode: (node: Record<string, unknown> | null) => void,
  setActiveProcessId: (id: string | undefined) => void,
) {
  useEffect(() => {
    if (!viewer) return;
    const handlers: Array<[string, (...args: unknown[]) => void]> = [];

    if (isInstance) {
      const onClick = (event: { element?: Record<string, unknown> }) => {
        const { element } = event || {};
        setNode(element ?? null);

        /** Find node process id */
        const elements = getElements(viewer);
        let processId: string | undefined;
        Object.entries(elements).forEach(([key, value]) => {
          if (
            (
              (value as Record<string, unknown>)?.elements as
                | Array<Record<string, unknown>>
                | undefined
            )?.find((v) => v?.id === (element as Record<string, unknown>)?.id)
          ) {
            processId = key;
            return;
          }
        });
        setActiveProcessId(processId);
      };
      viewer.on("element.click", onClick as (...args: unknown[]) => void);
      handlers.push(["element.click", onClick as (...args: unknown[]) => void]);
    }

    const onShapeChanged = (event: { element?: Record<string, unknown> }) => {
      const { element } = event || {};
      const elementRegistry = viewer.get("elementRegistry") as Record<
        string,
        (...args: unknown[]) => unknown
      >;
      if (element && taskIds && taskIds.includes(element.id as string)) {
        const outgoingGfx = elementRegistry.getGraphics(element.id) as HTMLElement | null;
        const visual = outgoingGfx && outgoingGfx.querySelector(".djs-visual");
        const rec = visual && visual.childNodes && (visual.childNodes[0] as HTMLElement);
        if (rec && rec.style) {
          rec.style.strokeWidth = "5px";
          rec.style.stroke = "#006400";
        }
      }
    };
    viewer.on("shape.changed", onShapeChanged as (...args: unknown[]) => void);
    handlers.push(["shape.changed", onShapeChanged as (...args: unknown[]) => void]);

    return () => {
      handlers.forEach(([event, handler]) => {
        viewer.off(event, handler);
      });
    };
  }, [viewer, isInstance, taskIds, activityCounts, setNode, setActiveProcessId]);
}
