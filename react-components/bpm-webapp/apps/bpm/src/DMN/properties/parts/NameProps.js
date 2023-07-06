import { isAny } from "dmn-js-shared/lib/util/ModelUtil";
import nameEntryFactory from "./implementation/Name";

export default function Name(group, element, translate, dmnModeler) {
  if (isAny(element, ["dmn:DRGElement", "dmn:Definitions"])) {
    group.entries = group.entries.concat(
      nameEntryFactory(element, translate, dmnModeler)
    );
  }
}
