/**
 * Pure/quasi-pure helper functions extracted from useDiagramLifecycle.
 * These have no React hook dependencies and are independently testable.
 */
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import type { TypedBpmnModeler, Modeling, ElementLike } from "@studio/shared/types";

import { getNameProperty } from "../extra";
import { getTranslations, getInfo } from "../../../shared/services";
import { getBool } from "../../../utils";
import { FILL_COLORS, STROKE_COLORS } from "../constants";

/** Loose element type for legacy code that accesses element properties dynamically */
interface LegacyElement {
  id?: string;
  type?: string;
  $type?: string;
  $parent?: LegacyElement;
  businessObject?: Record<string, unknown> & {
    $attrs?: Record<string, unknown>;
    id?: string;
    name?: string;
    extensionElements?: { values: unknown[] };
  };
  di?: { stroke?: string; fill?: string };
  constructor?: { name: string };
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// updateTranslations — quasi-pure (needs info passed as param)
// ---------------------------------------------------------------------------

export async function updateTranslations(
  element: unknown,
  modeler: TypedBpmnModeler,
  info: Record<string, unknown> | null,
): Promise<void> {
  if (!element) return;
  const bo = getBusinessObject(element);
  if (!bo) return;
  if (!getBool(bo?.$attrs?.["camunda:isTranslations"])) return;
  if (!bo?.$attrs?.["camunda:key"]) return;
  const translations = (await getTranslations(bo?.$attrs?.["camunda:key"])) as
    | Record<string, unknown>[]
    | undefined;
  if (!translations?.length || translations.length <= 0) return;
  const modelProperty = getNameProperty(element);
  const userInfo = info || (await getInfo());
  const language = userInfo?.user
    ? (userInfo.user as Record<string, unknown>)?.lang
    : undefined;
  if (!language) return;
  const selectedTranslation = translations?.find(
    (t: Record<string, unknown>) => t.language === language,
  );
  const diagramValue =
    (selectedTranslation as Record<string, unknown>)?.message ||
    bo?.$attrs["camunda:key"];
  if (!diagramValue) return;
  const elementRegistry = modeler.get("elementRegistry");
  const modeling = modeler.get("modeling");
  const shape = elementRegistry.get((element as LegacyElement).id ?? "");
  if (!shape) return;
  modeling?.updateProperties(shape, {
    [modelProperty]: diagramValue,
  });
}

// ---------------------------------------------------------------------------
// processColors — pure function
// ---------------------------------------------------------------------------

export async function processColors(
  elements: LegacyElement[],
  modelingService: Pick<Modeling, "setColor">,
): Promise<void> {
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (!element) continue;
    if (modelingService && element.di) {
      const type = is(element, ["bpmn:Gateway"])
        ? "bpmn:Gateway"
        : (element.type ?? "");
      const colors: Record<string, string | undefined> = {
        stroke: element.di.stroke || STROKE_COLORS[type],
      };
      if (
        (element.di.fill || FILL_COLORS[type]) &&
        !["bpmn:SequenceFlow", "bpmn:MessageFlow", "bpmn:Association"].includes(
          element.type ?? "",
        )
      ) {
        colors.fill = element.di.fill || FILL_COLORS[type];
      }
      modelingService.setColor(element as unknown as ElementLike, colors); // safety: bpmn-js modeling.setColor accepts broader element type
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}
