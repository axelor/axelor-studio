import { isAny } from "dmn-js-shared/lib/util/ModelUtil";

import type { DmnPropertyGroup, DmnElement, DmnModeler, TranslateFn } from "../types";

import nameEntryFactory from "./implementation/Name";


export default function Name(
  group: DmnPropertyGroup,
  element: DmnElement,
  translate: TranslateFn,
  dmnModeler: DmnModeler,
): void {
  if (isAny(element, ["dmn:DRGElement", "dmn:Definitions"])) {
    group.entries = group.entries.concat(nameEntryFactory(element, translate, dmnModeler));
  }
}
