import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";
import { is } from "bpmn-js/lib/util/ModelUtil";
import Ids from "ids";
import type { TypedBpmnModeler } from "@studio/shared/types";

import { FILL_COLORS, STROKE_COLORS, CONDITIONAL_SOURCES } from "../constants";

export const resizeStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderLeft: "1px solid var(--bs-secondary-bg)",
};
export const issuePanelStyle: React.CSSProperties = {
  border: "1px solid var(--bs-secondary-border-subtle, rgb(207, 201, 201))",
  position: "relative",
  background: "var(--bs-body-bg, #fff)",
  zIndex: 50,
};

export const DRAWER_WIDTH = 380;
export const TOOL_PANEL_MAX_HEIGHT = 300;

export function isConditionalSource(element: { type?: string; $type?: string }): boolean {
  return isAny(element, CONDITIONAL_SOURCES);
}

export function nextId(): string {
  const ids = new Ids([32, 32, 1]);
  return ids.nextPrefixed("Process_");
}

export function setColors(
  element: { di?: { stroke?: string; fill?: string }; type?: string } | null | undefined,
  forceUpdate: boolean = false,
  modelerInstance: TypedBpmnModeler,
): void {
  if ((element?.di?.stroke || element?.di?.fill) && !forceUpdate) {
    return;
  }
  if (!element) return;
  const modeling = modelerInstance.get("modeling");
  const el = element as unknown as import("@studio/shared/types").ElementLike; // safety: bpmn-js element type not assignable to ElementLike/BpmnElement
  if (is(element as unknown as import("@studio/shared/types").BpmnElement, "bpmn:Gateway")) { // safety: bpmn-js element type not assignable to ElementLike/BpmnElement
    modeling.setColor(el, {
      stroke: STROKE_COLORS["bpmn:Gateway"],
      fill: FILL_COLORS["bpmn:Gateway"],
    });
  } else {
    modeling.setColor(el, {
      stroke: (STROKE_COLORS)[element?.type ?? ""],
      fill: (FILL_COLORS)[element?.type ?? ""],
    });
  }
}
