import { is, getBusinessObject } from "dmn-js-shared/lib/util/ModelUtil";

import type { DmnPropertyGroup, DmnElement, TranslateFn } from "../types";

export default function VersionTagProps(
  group: DmnPropertyGroup,
  element: DmnElement,
  translate: TranslateFn,
): void {
  const bo = getBusinessObject(element);

  if (!bo) {
    return;
  }

  if (is(element, "dmn:Decision")) {
    group.entries.push({
      id: "versionTag",
      label: translate("Version tag"),
      modelProperty: "versionTag",
      widget: "textField",
      get(el?: DmnElement) {
        const businessObj = getBusinessObject(el);
        return { versionTag: businessObj.get("versionTag") };
      },
      set(el: DmnElement, values: Record<string, unknown>) {
        if (el?.businessObject) {
          (el.businessObject).versionTag = values.versionTag;
        }
      },
    });
  }
}
