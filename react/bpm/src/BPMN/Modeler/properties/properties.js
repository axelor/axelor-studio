import {
  getImplementationType,
  getServiceTaskLikeBusinessObject,
  isExternalCapable,
} from "../../../utils/ImplementationTypeUtils";

import { is } from "bpmn-js/lib/util/ModelUtil";

// Require all properties you need from existing providers.
// In this case all available bpmn relevant properties without camunda extensions.
import processProps from "./parts/ProcessProps";
import idProps from "./parts/IdProps";
import nameProps from "./parts/NameProps";
import executableProps from "./parts/ExecutableProps";
import colorProps from "./parts/CustomImplementation/ColorProps";

// job configuration
import jobConfiguration from "./parts/JobConfigurationProps";

// external task configuration
import externalTaskConfiguration from "./parts/ExternalTaskConfigurationProps";

import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { getTimerEventDefinition } from "../../../utils/EventDefinitionUtil";
import {
  CallActivityProps,
  ConditionalProps,
  EventProps,
  LinkProps,
  ScriptProps,
  ServiceTaskDelegateProps,
  StartEventInitiator,
  ListenerProps,
  VariableMapping,
  MultiInstanceProps,
  UserTaskProps,
  ModelProps,
  ViewAttributePanel,
  MenuActionPanel,
  ProcessConfiguration,
  TranslationProps,
  BusinessRuleProps,
  Comments,
  Definitions,
  StartOnListenerProps,
} from "./parts/CustomImplementation";
import { isAsyncAfter, isAsyncBefore, translate } from "../../../utils";

// helpers

let isExternalTaskPriorityEnabled = function (element) {
  if (!element) return;
  // show only if element is a process, a participant ...
  if (is(element, "bpmn:Process")) {
    return true;
  }

  let externalBo = getServiceTaskLikeBusinessObject(element),
    isExternalTask = getImplementationType(externalBo) === "external";

  // ... or an external task with selected external implementation type
  return !!isExternalCapable(externalBo) && isExternalTask;
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
  if (isAsyncBefore(bo) || isAsyncAfter(bo)) {
    return true;
  }

  // timer definition
  if (is(element, "bpmn:Event")) {
    return !!getTimerEventDefinition(element);
  }

  return false;
};

let PROCESS_KEY_HINT = translate("This maps to the process definition key.");
let TASK_KEY_HINT = translate("This maps to the task definition key.");

function createGeneralTabGroups(
  element,
  canvas,
  bpmnFactory,
  elementRegistry,
  translate,
  bpmnModeler,
  setDummyProperty
) {
  // refer to target element for external labels
  element = element && (element.labelTarget || element);

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

  idProps(generalGroup, element, translate, idOptions, bpmnModeler);
  nameProps(generalGroup, element, bpmnFactory, canvas, translate, bpmnModeler);
  processProps(
    generalGroup,
    element,
    translate,
    processOptions,
    bpmnModeler,
    setDummyProperty
  );
  executableProps(generalGroup, element, translate, bpmnModeler);
  colorProps(generalGroup, element, translate, bpmnModeler);

  let startOnListenerProps = {
    id: "process-is-start-on-listener",
    label: translate("Trigger only on client change"),
    entries: [],
    component: StartOnListenerProps,
  };

  let userTaskProps = {
    id: "userTaskProps",
    label: translate("Details"),
    entries: [],
    component: UserTaskProps,
  };

  let serviceTaskDelegateProps = {
    id: "serviceTaskDelegateProps",
    label: translate("Details"),
    entries: [],
    component: ServiceTaskDelegateProps,
  };

  let scriptProps = {
    id: "scriptProps",
    label: translate("Details"),
    entries: [],
    component: ScriptProps,
  };

  let linkProps = {
    id: "linkProps",
    label: translate("Details"),
    entries: [],
    component: LinkProps,
  };

  let callActivityProps = {
    id: "callActivityProps",
    label: translate("Details"),
    entries: [],
    component: CallActivityProps,
  };

  let eventProps = {
    id: "eventProps",
    label: translate("Details"),
    entries: [],
    component: EventProps,
  };

  let conditionalProps = {
    id: "conditionalProps",
    label: translate("Details"),
    entries: [],
    component: ConditionalProps,
  };
  let startEventInitiator = {
    id: "startEventInitiator",
    label: translate("Details"),
    entries: [],
    component: StartEventInitiator,
  };

  let modelProps = {
    id: "modelProps",
    label: translate("Details"),
    entries: [],
    component: ModelProps,
  };

  let multiInstanceGroup = {
    id: "multiInstance",
    label: translate("Multi instance"),
    entries: [],
    component: MultiInstanceProps,
  };

  let businessRuleTaskGroup = {
    id: "businessRuleTasks",
    label: translate("Business rule task"),
    entries: [],
    component: BusinessRuleProps,
    className: "businessRuleTask",
  };

  let translationGroup = {
    id: "translations",
    label: translate("Translations"),
    entries: [],
    component: TranslationProps,
  };

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

  let groups = [];
  groups.push(generalGroup);
  if (
    element &&
    (element.type === "bpmn:Process" || element.type === "bpmn:Participant")
  ) {
    groups.push(startOnListenerProps);
  }
  if (element && element.type !== "bpmn:Process") {
    groups.push(externalTaskGroup);
    groups.push(jobConfigurationGroup);
  }
  if (element && element.type === "bpmn:StartEvent") {
    groups.push(startEventInitiator);
    groups.push(eventProps);
    groups.push(modelProps);
    groups.push(translationGroup);
    groups.push(multiInstanceGroup);
    return groups;
  }
  if (element?.type === "bpmn:ServiceTask") {
    groups.push(serviceTaskDelegateProps);
    groups.push(modelProps);
    groups.push(multiInstanceGroup);
    groups.push(translationGroup);
    return groups;
  }

  if (["bpmn:BusinessRuleTask", "bpmn:SendTask"].includes(element?.type)) {
    groups.push(serviceTaskDelegateProps);
  }
  groups.push(userTaskProps);
  groups.push(scriptProps);
  groups.push(linkProps);
  groups.push(callActivityProps);
  groups.push(eventProps);
  groups.push(conditionalProps);
  groups.push(startEventInitiator);
  groups.push(modelProps);
  groups.push(businessRuleTaskGroup);
  groups.push(multiInstanceGroup);
  groups.push(translationGroup);

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
    component: VariableMapping,
  };
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
    component: ListenerProps,
  };
  return [listenersGroup];
}

function createViewAttributsGroups(
  element,
  bpmnFactory,
  elementRegistry,
  translate
) {
  let viewAttributesGroup = {
    id: "view-attributes",
    label: translate("View attributes"),
    entries: [],
    component: ViewAttributePanel,
  };
  return [viewAttributesGroup];
}

function createMenuActionGroups(
  element,
  bpmnFactory,
  elementRegistry,
  translate
) {
  let menuActionGroup = {
    id: "menu-action-tab",
    label: translate("Menu/Action"),
    entries: [],
    component: MenuActionPanel,
  };
  return [menuActionGroup];
}

function createConfigurationGroups(
  element,
  bpmnFactory,
  elementRegistry,
  translate
) {
  let configurationGroup = {
    id: "configuration",
    label: translate("Process configs"),
    entries: [],
    component: ProcessConfiguration,
  };
  return [configurationGroup];
}

function createCommentGroups(element, bpmnFactory, elementRegistry, translate) {
  let commentsGroup = {
    id: "comments",
    label: translate("Comments"),
    entries: [],
    component: Comments,
    className: "comments",
  };
  return [commentsGroup];
}

function createDefinitionTabGroups(
  element,
  bpmnFactory,
  elementRegistry,
  translate
) {
  let definitionGroup = {
    id: "definitions",
    label: translate("Definitions"),
    entries: [],
    component: Definitions,
  };
  return [definitionGroup];
}

export default function getTabs(
  element,
  canvas,
  bpmnFactory,
  elementRegistry,
  translate,
  bpmnModeler,
  setDummyProperty
) {
  let definitionTab = {
    id: "definition",
    label: translate("General"),
    groups: createDefinitionTabGroups(
      element,
      bpmnFactory,
      elementRegistry,
      translate
    ),
  };

  let generalTab = {
    id: "general",
    label: translate("General"),
    groups: createGeneralTabGroups(
      element,
      canvas,
      bpmnFactory,
      elementRegistry,
      translate,
      bpmnModeler,
      setDummyProperty
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
  };

  let viewAttributesTab = {
    id: "view-attributes",
    label: translate("View attributes"),
    groups: createViewAttributsGroups(
      element,
      bpmnFactory,
      elementRegistry,
      translate
    ),
  };

  let menuActionTab = {
    id: "menu-action-tab",
    label: translate("Menu/Action"),
    groups: createMenuActionGroups(
      element,
      bpmnFactory,
      elementRegistry,
      translate
    ),
  };

  let configurationTab = {
    id: "configuration",
    label: translate("Configuration"),
    groups: createConfigurationGroups(
      element,
      bpmnFactory,
      elementRegistry,
      translate
    ),
  };

  let commentsTab = {
    id: "comments",
    label: translate("Comments"),
    groups: createCommentGroups(
      element,
      bpmnFactory,
      elementRegistry,
      translate
    ),
  };

  let tabs = [
    definitionTab,
    generalTab,
    viewAttributesTab,
    variablesTab,
    menuActionTab,
    configurationTab,
    listenersTab,
    commentsTab,
  ];
  return tabs;
}
