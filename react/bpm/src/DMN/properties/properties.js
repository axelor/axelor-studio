// bpmn properties
import idProps from "../properties/parts/IdProps";
import nameProps from "../properties/parts/NameProps";

// camunda properties
import versionTag from "../properties/parts/VersionTagProps";

// history time to live
import historyTimeToLive from "../properties/parts/HistoryTimeToLiveProps";

import ModelProps from "../properties/parts/ModelProps";

import { is } from "dmn-js-shared/lib/util/ModelUtil";
import { translate } from "../../utils";

// helpers ////////////////////////////////////////

const DECISION_KEY_HINT = translate("This maps to the decision definition key.");

function createGeneralTabGroups(element, translate, dmnModeler) {
  // refer to target element for external labels
  element = element.labelTarget || element;

  let generalGroup = {
    id: "general",
    label: translate("General"),
    entries: [],
  };

  let idOptions;
  if (is(element, "dmn:Decision")) {
    idOptions = { description: DECISION_KEY_HINT };
  }
  idProps(generalGroup, element, translate, idOptions);
  nameProps(generalGroup, element, translate, dmnModeler);
  versionTag(generalGroup, element, translate);

  let modelProps = {
    id: "modelProps",
    label: translate("Details"),
    entries: [],
    component: ModelProps,
  };

  let historyTimeToLiveGroup = {
    id: "historyConfiguration",
    label: translate("History configuration"),
    entries: [],
  };
  historyTimeToLive(historyTimeToLiveGroup, element, translate);

  const groups = [];
  groups.push(generalGroup);
  groups.push(historyTimeToLiveGroup);
  groups.push(modelProps);

  return groups;
}

/**
 * A properties provider for Camunda related properties.
 *
 * @param {EventBus} eventBus
 * @param {Function} translate
 */
export default function getTabs(element, translate, dmnModeler) {
  const generalTab = {
    id: "general",
    label: translate("General"),
    groups: createGeneralTabGroups(element, translate, dmnModeler),
  };

  let tabs = [generalTab];
  return tabs;
}
