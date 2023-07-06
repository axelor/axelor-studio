import inherits from "inherits";
import PropertiesActivator from "dmn-js-properties-panel/lib/PropertiesActivator.js";
import { is } from "dmn-js-shared/lib/util/ModelUtil";

// bpmn properties
import idProps from "dmn-js-properties-panel/lib/provider/dmn/parts/IdProps";
import nameProps from "dmn-js-properties-panel/lib/provider/dmn/parts/NameProps";

// camunda properties
import versionTag from "dmn-js-properties-panel/lib/provider/camunda/parts/VersionTagProps";

// history time to live
import historyTimeToLive from "dmn-js-properties-panel/lib/provider/camunda/parts/HistoryTimeToLiveProps";

const DECISION_KEY_HINT = "This maps to the decision definition key.";

function createGeneralTabGroups(element, translate) {
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
  nameProps(generalGroup, element, translate);
  versionTag(generalGroup, element, translate);

  let historyTimeToLiveGroup = {
    id: "historyConfiguration",
    label: translate("History configuration"),
    entries: [],
  };
  historyTimeToLive(historyTimeToLiveGroup, element, translate);

  let groups = [];
  groups.push(generalGroup);
  groups.push(historyTimeToLiveGroup);

  return groups;
}

// Camunda Properties Provider /////////////////////////////////////

/**
 * A properties provider for Camunda related properties.
 *
 * @param {EventBus} eventBus
 * @param {Function} translate
 */
function CamundaPropertiesProvider(eventBus, translate) {
  PropertiesActivator.call(this, eventBus);
  this.getTabs = function (element) {
    let generalTab = {
      id: "general",
      label: translate("General"),
      groups: createGeneralTabGroups(element, translate),
    };
    return [generalTab];
  };
}

CamundaPropertiesProvider.$inject = ["eventBus", "translate"];
inherits(CamundaPropertiesProvider, PropertiesActivator);
export default CamundaPropertiesProvider;
