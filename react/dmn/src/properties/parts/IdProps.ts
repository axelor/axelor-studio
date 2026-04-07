import { getBusinessObject } from "dmn-js-shared/lib/util/ModelUtil";
import { isIdValid } from "@studio/shared/utils";

import type { DmnPropertyGroup, DmnElement, TranslateFn } from "../types";

export default function IdProps(
  group: DmnPropertyGroup,
  element: DmnElement,
  translate: TranslateFn,
  options?: { description?: string },
): void {
  const description = options?.description;

  function changeRequiredDecisionIds(el: DmnElement, id: unknown): void {
    if (!el) return;
    const requiredDecisions = [...(el.incoming || []), ...(el.outgoing || [])];

    requiredDecisions.forEach((decision) => {
      const businessObject = getBusinessObject(decision);

      if (businessObject?.requiredDecision && id) {
        businessObject.requiredDecision.href = id;
      }
    });
  }

  group.entries.push({
    id: "id",
    label: translate("Id"),
    description: description ? translate(description) : undefined,
    modelProperty: "id",
    widget: "textField",
    getProperty(el: DmnElement) {
      return getBusinessObject(el).id;
    },
    setProperty(el: DmnElement, properties: Record<string, unknown>) {
      const resolved = (el).labelTarget || el;
      if (resolved.businessObject) {
        (resolved.businessObject).id = properties["id"];
        changeRequiredDecisionIds(resolved, properties["id"]);
      }
    },
    validate(el: DmnElement, values: Record<string, string>): Record<string, string> | undefined {
      const idValue = values.id;
      if (idValue === "__implicitroot") return undefined;
      const bo = getBusinessObject(el);
      const idError = isIdValid(bo, idValue, translate);
      return idError ? { id: idError } : undefined;
    },
  });
}
