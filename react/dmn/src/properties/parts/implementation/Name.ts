import { getBusinessObject } from "dmn-js-shared/lib/util/ModelUtil";

import { getDmnService } from "@studio/shared/types";
import type { DmnElement, DmnModeler, DmnPropertyEntry, TranslateFn } from "../../types";

/**
 * Create an entry to modify the name of an element.
 *
 * @return an array containing the entry to modify the name
 */
export default function Name(
  element: DmnElement,
  translate: TranslateFn,
  dmnModeler: DmnModeler,
): DmnPropertyEntry[] {
  const get = function (): Record<string, unknown> {
    const bo = getBusinessObject(element);
    return { name: bo.get("name") };
  };

  const set = function (el: DmnElement, values: Record<string, unknown>): void {
    if (el.businessObject) {
      (el.businessObject)["name"] = values["name"];
    } else {
      (el as Record<string, unknown>)["name"] = values["name"];
    }
    const drdViewer = dmnModeler._viewers?.drd;
    if (!drdViewer) return;
    const modeling = getDmnService(drdViewer, "modeling");
    const elementRegistry = getDmnService(drdViewer, "elementRegistry");
    const shape = elementRegistry.get(el.id || "");
    if (!shape) return;
    modeling.updateProperties(shape, {
      name: values["name"],
    });
  };

  const nameEntry: DmnPropertyEntry = {
    id: "name",
    label: translate("Name"),
    modelProperty: "name",
    widget: "textBox",
    get: get,
    set: set,
  };

  return [nameEntry];
}
