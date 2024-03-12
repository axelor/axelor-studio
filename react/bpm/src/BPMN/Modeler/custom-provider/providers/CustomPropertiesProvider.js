import inherits from "inherits";

import PropertiesActivator from "bpmn-js-properties-panel/lib/PropertiesActivator";

import asyncCapableHelper from "bpmn-js-properties-panel/lib/helper/AsyncCapableHelper";
import ImplementationTypeHelper from "bpmn-js-properties-panel/lib/helper/ImplementationTypeHelper";

import { is } from "bpmn-js/lib/util/ModelUtil";

// Require all properties you need from existing providers.
// In this case all available bpmn relevant properties without camunda extensions.
import processProps from "bpmn-js-properties-panel/lib/provider/bpmn/parts/ProcessProps";
import eventProps from "bpmn-js-properties-panel/lib/provider/bpmn/parts/EventProps";
import linkProps from "bpmn-js-properties-panel/lib/provider/bpmn/parts/LinkProps";
import idProps from "bpmn-js-properties-panel/lib/provider/bpmn/parts/IdProps";
import nameProps from "bpmn-js-properties-panel/lib/provider/bpmn/parts/NameProps";
import executableProps from "bpmn-js-properties-panel/lib/provider/bpmn/parts/ExecutableProps";

// camunda properties
import serviceTaskDelegateProps from "bpmn-js-properties-panel/lib/provider/camunda/parts/ServiceTaskDelegateProps";
import callActivityProps from "bpmn-js-properties-panel/lib/provider/camunda/parts/CallActivityProps";
import multiInstanceProps from "bpmn-js-properties-panel/lib/provider/camunda/parts/MultiInstanceLoopProps";
import conditionalProps from "bpmn-js-properties-panel/lib/provider/camunda/parts/ConditionalProps";
import scriptProps from "bpmn-js-properties-panel/lib/provider/camunda/parts/ScriptTaskProps";
import errorProps from "bpmn-js-properties-panel/lib/provider/camunda/parts/ErrorEventProps";
import startEventInitiator from "bpmn-js-properties-panel/lib/provider/camunda/parts/StartEventInitiator";
import variableMapping from "bpmn-js-properties-panel/lib/provider/camunda/parts/VariableMappingProps";
import versionTag from "bpmn-js-properties-panel/lib/provider/camunda/parts/VersionTagProps";

import listenerProps from "bpmn-js-properties-panel/lib/provider/camunda/parts/ListenerProps";
import listenerDetails from "bpmn-js-properties-panel/lib/provider/camunda/parts/ListenerDetailProps";
import listenerFields from "bpmn-js-properties-panel/lib/provider/camunda/parts/ListenerFieldInjectionProps";

import elementTemplateChooserProps from "bpmn-js-properties-panel/lib/provider/camunda/element-templates/parts/ChooserProps";
import elementTemplateCustomProps from "bpmn-js-properties-panel/lib/provider/camunda/element-templates/parts/CustomProps";

// job configuration
import jobConfiguration from "bpmn-js-properties-panel/lib/provider/camunda/parts/JobConfigurationProps";

// history time to live
import historyTimeToLive from "bpmn-js-properties-panel/lib/provider/camunda/parts/HistoryTimeToLiveProps";

// external task configuration
import externalTaskConfiguration from "bpmn-js-properties-panel/lib/provider/camunda/parts/ExternalTaskConfigurationProps";

import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import eventDefinitionHelper from "bpmn-js-properties-panel/lib/helper/EventDefinitionHelper";
import { translate } from "../../../../utils";

// helpers

let isExternalTaskPriorityEnabled = function (element) {
  if (!element) return;
  let businessObject = getBusinessObject(element);

  // show only if element is a process, a participant ...
  if (
    is(element, "bpmn:Process") ||
    (is(element, "bpmn:Participant") && businessObject.get("processRef"))
  ) {
    return true;
  }

  let externalBo = ImplementationTypeHelper.getServiceTaskLikeBusinessObject(
      element
    ),
    isExternalTask =
      ImplementationTypeHelper.getImplementationType(externalBo) === "external";

  // ... or an external task with selected external implementation type
  return (
    !!ImplementationTypeHelper.isExternalCapable(externalBo) && isExternalTask
  );
};

let isJobConfigEnabled = function (element) {
  if (!element) return;
  let businessObject = getBusinessObject(element);

  if (
    is(element, "bpmn:Process") ||
    (is(element, "bpmn:Participant") && businessObject.get("processRef"))
  ) {
    return true;
  }

  // async behavior
  let bo = getBusinessObject(element);
  if (
    asyncCapableHelper.isAsyncBefore(bo) ||
    asyncCapableHelper.isAsyncAfter(bo)
  ) {
    return true;
  }

  // timer definition
  if (is(element, "bpmn:Event")) {
    return !!eventDefinitionHelper.getTimerEventDefinition(element);
  }

  return false;
};

let getListenerLabel = function (param, translate) {
  if (is(param, "camunda:ExecutionListener")) {
    return translate("Execution listener");
  }

  if (is(param, "camunda:TaskListener")) {
    return translate("Task listener");
  }

  return "";
};

let PROCESS_KEY_HINT = translate("This maps to the process definition key.");
let TASK_KEY_HINT = translate("This maps to the task definition key.");

function createGeneralTabGroups(
  element,
  canvas,
  bpmnFactory,
  elementRegistry,
  elementTemplates,
  translate
) {
  // refer to target element for external labels
  element = element.labelTarget || element;

  let generalGroup = {
    id: "general",
    label: translate("General"),
    entries: [],
  };

  let idOptions;
  let processOptions;

  if (is(element, "bpmn:Process")) {
    idOptions = { description: PROCESS_KEY_HINT };
  }

  if (is(element, "bpmn:UserTask")) {
    idOptions = { description: TASK_KEY_HINT };
  }

  if (is(element, "bpmn:Participant")) {
    processOptions = { processIdDescription: PROCESS_KEY_HINT };
  }

  idProps(generalGroup, element, translate, idOptions);
  nameProps(generalGroup, element, bpmnFactory, canvas, translate);
  processProps(generalGroup, element, translate, processOptions);
  versionTag(generalGroup, element, translate);
  executableProps(generalGroup, element, translate);
  elementTemplateChooserProps(
    generalGroup,
    element,
    elementTemplates,
    translate
  );

  let customFieldsGroups = elementTemplateCustomProps(
    element,
    elementTemplates,
    bpmnFactory,
    translate
  );

  let detailsGroup = {
    id: "details",
    label: translate("Details"),
    entries: [],
  };
  serviceTaskDelegateProps(detailsGroup, element, bpmnFactory, translate);
  scriptProps(detailsGroup, element, bpmnFactory, translate);
  linkProps(detailsGroup, element, translate);
  callActivityProps(detailsGroup, element, bpmnFactory, translate);
  eventProps(detailsGroup, element, bpmnFactory, elementRegistry, translate);
  errorProps(detailsGroup, element, bpmnFactory, translate);
  conditionalProps(detailsGroup, element, bpmnFactory, translate);
  startEventInitiator(detailsGroup, element, translate); // this must be the last element of the details group!

  let multiInstanceGroup = {
    id: "multiInstance",
    label: translate("Multi instance"),
    entries: [],
  };
  multiInstanceProps(multiInstanceGroup, element, bpmnFactory, translate);

  let jobConfigurationGroup = {
    id: "jobConfiguration",
    label: translate("Job configuration"),
    entries: [],
    enabled: isJobConfigEnabled,
  };
  jobConfiguration(jobConfigurationGroup, element, bpmnFactory, translate);

  let externalTaskGroup = {
    id: "externalTaskConfiguration",
    label: translate("External task configuration"),
    entries: [],
    enabled: isExternalTaskPriorityEnabled,
  };
  externalTaskConfiguration(externalTaskGroup, element, bpmnFactory, translate);

  let historyTimeToLiveGroup = {
    id: "historyConfiguration",
    label: translate("History configuration"),
    entries: [],
  };
  historyTimeToLive(historyTimeToLiveGroup, element, bpmnFactory, translate);

  let groups = [];
  groups.push(generalGroup);
  customFieldsGroups.forEach(function (group) {
    groups.push(group);
  });
  groups.push(detailsGroup);
  groups.push(multiInstanceGroup);

  if (element.type !== "bpmn:Process") {
    groups.push(externalTaskGroup);
    groups.push(jobConfigurationGroup);
    groups.push(historyTimeToLiveGroup);
  }
  return groups;
}

function createVariablesTabGroups(
  element,
  bpmnFactory,
  elementRegistry,
  translate
) {
  let variablesGroup = {
    id: "variables",
    label: translate("Variables"),
    entries: [],
  };
  variableMapping(variablesGroup, element, bpmnFactory, translate);

  return [variablesGroup];
}

function createListenersTabGroups(
  element,
  bpmnFactory,
  elementRegistry,
  translate
) {
  let listenersGroup = {
    id: "listeners",
    label: translate("Listeners"),
    entries: [],
  };

  let options = listenerProps(listenersGroup, element, bpmnFactory, translate);

  let listenerDetailsGroup = {
    id: "listener-details",
    entries: [],
    enabled: function (element, node) {
      if (!element) return;
      return options.getSelectedListener(element, node);
    },
    label: function (element, node) {
      let param = options.getSelectedListener(element, node);
      return getListenerLabel(param, translate);
    },
  };

  listenerDetails(
    listenerDetailsGroup,
    element,
    bpmnFactory,
    options,
    translate
  );

  let listenerFieldsGroup = {
    id: "listener-fields",
    label: translate("Field injection"),
    entries: [],
    enabled: function (element, node) {
      if (!element) return;
      return options.getSelectedListener(element, node);
    },
  };

  listenerFields(listenerFieldsGroup, element, bpmnFactory, options, translate);

  return [listenersGroup, listenerDetailsGroup, listenerFieldsGroup];
}

// Camunda Properties Provider /////////////////////////////////////

/**
 * A properties provider for Camunda related properties.
 *
 * @param {EventBus} eventBus
 * @param {Canvas} canvas
 * @param {BpmnFactory} bpmnFactory
 * @param {ElementRegistry} elementRegistry
 * @param {ElementTemplates} elementTemplates
 * @param {Translate} translate
 */
export default function CustomPropertiesProvider(
  eventBus,
  canvas,
  bpmnFactory,
  elementRegistry,
  elementTemplates,
  translate
) {
  PropertiesActivator.call(this, eventBus);

  this.getTabs = function (element) {
    let generalTab = {
      id: "general",
      label: translate("General"),
      groups: createGeneralTabGroups(
        element,
        canvas,
        bpmnFactory,
        elementRegistry,
        elementTemplates,
        translate
      ),
    };

    let variablesTab = {
      id: "variables",
      label: translate("Variables"),
      groups: createVariablesTabGroups(
        element,
        bpmnFactory,
        elementRegistry,
        translate
      ),
    };

    let listenersTab = {
      id: "listeners",
      label: translate("Listeners"),
      groups: createListenersTabGroups(
        element,
        bpmnFactory,
        elementRegistry,
        translate
      ),
      enabled: function (element) {
        if (!element) return;
        return (
          !eventDefinitionHelper.getLinkEventDefinition(element) ||
          (!is(element, "bpmn:IntermediateThrowEvent") &&
            eventDefinitionHelper.getLinkEventDefinition(element))
        );
      },
    };

    return [generalTab, variablesTab, listenersTab];
  };
}

CustomPropertiesProvider.$inject = [
  "eventBus",
  "canvas",
  "bpmnFactory",
  "elementRegistry",
  "elementTemplates",
  "translate",
];

inherits(CustomPropertiesProvider, PropertiesActivator);
