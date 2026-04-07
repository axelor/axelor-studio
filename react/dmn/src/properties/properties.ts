// bpmn properties
import { is } from "dmn-js-shared/lib/util/ModelUtil";
import { translate } from "@studio/shared/i18n";

import idProps from "../properties/parts/IdProps";
import nameProps from "../properties/parts/NameProps";

// camunda properties
import versionTag from "../properties/parts/VersionTagProps";

// history time to live
import historyTimeToLive from "../properties/parts/HistoryTimeToLiveProps";
import ModelProps from "../properties/parts/ModelProps";


import type { DmnPropertyGroup, DmnElement, DmnModeler, TranslateFn } from "./types";

// helpers ////////////////////////////////////////

const DECISION_KEY_HINT = translate("This maps to the decision definition key.");

function createGeneralTabGroups(
  element: DmnElement,
  translate: TranslateFn,
  dmnModeler: DmnModeler,
): DmnPropertyGroup[] {
  // refer to target element for external labels
  const resolvedElement = (element.labelTarget || element);

  const generalGroup: DmnPropertyGroup = {
    id: "general",
    label: translate("General"),
    entries: [],
  };

  let idOptions: { description: string } | undefined;
  if (is(resolvedElement, "dmn:Decision")) {
    idOptions = { description: DECISION_KEY_HINT };
  }
  idProps(generalGroup, resolvedElement, translate, idOptions);
  nameProps(generalGroup, resolvedElement, translate, dmnModeler);
  versionTag(generalGroup, resolvedElement, translate);

  const modelProps: DmnPropertyGroup = {
    id: "modelProps",
    label: translate("Details"),
    entries: [],
    component: ModelProps,
  };

  const historyTimeToLiveGroup: DmnPropertyGroup = {
    id: "historyConfiguration",
    label: translate("History configuration"),
    entries: [],
  };
  historyTimeToLive(historyTimeToLiveGroup, resolvedElement, translate);

  const groups: DmnPropertyGroup[] = [];
  groups.push(generalGroup);
  groups.push(historyTimeToLiveGroup);
  groups.push(modelProps);

  return groups;
}

/**
 * A properties provider for Camunda related properties.
 */
export default function getTabs(
  element: DmnElement,
  translate: TranslateFn,
  dmnModeler: DmnModeler,
): Array<{ id: string; label: string; groups: DmnPropertyGroup[] }> {
  const generalTab = {
    id: "general",
    label: translate("General"),
    groups: createGeneralTabGroups(element, translate, dmnModeler),
  };

  const tabs = [generalTab];
  return tabs;
}
