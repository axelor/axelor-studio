import { useCallback } from "react";
import type { TypedBpmnModeler, ModdleElement, ElementLike } from "@studio/shared/types";

import { lightenColor } from "../../../utils";

interface UseColorManagementParams {
  modeler: TypedBpmnModeler | null;
  selectedElement: ModdleElement | null;
}

/**
 * Hook that provides color management callbacks for BPMN elements.
 */
export function useColorManagement({ modeler, selectedElement }: UseColorManagementParams): {
  changeColor: (color: string) => void;
} {
  const changeColor = useCallback(
    (color: string) => {
      if (!modeler || !selectedElement || !color) return;
      const modeling = modeler.get("modeling");
      const elementType = selectedElement.type as string | undefined;
      const colors: { stroke: string; fill?: string } = { stroke: color };
      if (
        !["bpmn:SequenceFlow", "bpmn:MessageFlow", "bpmn:Association"].includes(elementType ?? "")
      ) {
        colors.fill = ["bpmn:Process", "bpmn:Participant", "bpmn:Group"].includes(
          elementType ?? "",
        )
          ? "white"
          : lightenColor(color, 0.85);
      }
      modeling.setColor(selectedElement as unknown as ElementLike, colors); // safety: bpmn-js modeling.setColor accepts broader element type
    },
    [modeler, selectedElement],
  );

  return { changeColor };
}
