import { is, getBusinessObject } from "dmn-js-shared/lib/util/ModelUtil";

import type { DmnPropertyGroup, DmnElement, TranslateFn } from "../types";

export default function HistoryTimeToLiveProps(
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
      id: "historyTimeToLive",
      label: translate("History time to live"),
      modelProperty: "historyTimeToLive",
      widget: "textField",
      get(el?: DmnElement) {
        const businessObj = getBusinessObject(el);
        return { historyTimeToLive: businessObj.get("historyTimeToLive") };
      },
      set(el: DmnElement, values: Record<string, unknown>) {
        if (el?.businessObject) {
          (el.businessObject).historyTimeToLive =
            values.historyTimeToLive;
        }
      },
    });
  }
}
