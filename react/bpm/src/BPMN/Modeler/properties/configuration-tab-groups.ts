import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import {
  getImplementationType,
  getServiceTaskLikeBusinessObject,
  isExternalCapable,
} from "../../../utils/ImplementationTypeUtils";
import { getTimerEventDefinition } from "../../../utils/EventDefinitionUtil";
import { isAsyncAfter, isAsyncBefore } from "../../../utils";

import jobConfiguration from "./parts/JobConfigurationProps";
import externalTaskConfiguration from "./parts/ExternalTaskConfigurationProps";
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
  BusinessRuleProps,
  Definitions,
  StartOnListenerProps,
} from "./parts/CustomImplementation";


// helpers

const isExternalTaskPriorityEnabled = function (element: any) {
  if (!element) return;
  if (is(element, "bpmn:Process")) {
    return true;
  }

  const externalBo: any = getServiceTaskLikeBusinessObject(element),
    isExternalTask = getImplementationType(externalBo) === "external";

  return !!isExternalCapable(externalBo) && isExternalTask;
};

const isJobConfigEnabled = function (element: any) {
  if (!element) return;
  const businessObject = getBusinessObject(element);

  if (
    is(element, "bpmn:Process") ||
    (is(element, "bpmn:Participant") && businessObject.get("processRef"))
  ) {
    return true;
  }

  const bo = getBusinessObject(element);
  if (isAsyncBefore(bo) || isAsyncAfter(bo)) {
    return true;
  }

  if (is(element, "bpmn:Event")) {
    return !!getTimerEventDefinition(element);
  }

  return false;
};

export function createConfigurationTabGroups(
  element: any,
  canvas: any,
  bpmnFactory: any,
  elementRegistry: any,
  translate: (s: string) => string,
  _bpmnModeler: any,
) {
  // refer to target element for external labels
  element = element && (element.labelTarget || element);

  const generalGroup = {
    id: "general",
    label: translate("General"),
    entries: [],
  };

  const startOnListenerProps = {
    id: "process-is-start-on-listener",
    label: translate("Trigger only on client change"),
    entries: [],
    component: StartOnListenerProps,
  };

  const userTaskProps = {
    id: "userTaskProps",
    label: translate("Details"),
    entries: [],
    component: UserTaskProps,
  };

  const serviceTaskDelegateProps = {
    id: "serviceTaskDelegateProps",
    label: translate("Details"),
    entries: [],
    component: ServiceTaskDelegateProps,
  };

  const scriptProps = {
    id: "scriptProps",
    label: translate("Details"),
    entries: [],
    component: ScriptProps,
  };

  const linkProps = {
    id: "linkProps",
    label: translate("Details"),
    entries: [],
    component: LinkProps,
  };

  const callActivityProps = {
    id: "callActivityProps",
    label: translate("Details"),
    entries: [],
    component: CallActivityProps,
  };

  const eventProps = {
    id: "eventProps",
    label: translate("Details"),
    entries: [],
    component: EventProps,
  };

  const conditionalProps = {
    id: "conditionalProps",
    label: translate("Details"),
    entries: [],
    component: ConditionalProps,
  };
  const startEventInitiator = {
    id: "startEventInitiator",
    label: translate("Details"),
    entries: [],
    component: StartEventInitiator,
  };

  const modelProps = {
    id: "modelProps",
    label: translate("Details"),
    entries: [],
    component: ModelProps,
  };

  const multiInstanceGroup = {
    id: "multiInstance",
    label: translate("Multi instance"),
    entries: [],
    component: MultiInstanceProps,
  };

  const businessRuleTaskGroup = {
    id: "businessRuleTasks",
    label: translate("Business rule task"),
    entries: [],
    component: BusinessRuleProps,
    className: "businessRuleTask",
  };

  const jobConfigurationGroup = {
    id: "jobConfiguration",
    label: translate("Job configuration"),
    entries: [],
    enabled: isJobConfigEnabled,
  };
  jobConfiguration(jobConfigurationGroup, element, bpmnFactory, translate);

  const externalTaskGroup = {
    id: "externalTaskConfiguration",
    label: translate("External task configuration"),
    entries: [],
    enabled: isExternalTaskPriorityEnabled,
  };
  externalTaskConfiguration(externalTaskGroup, element, bpmnFactory, translate);

  const groups: any[] = [];
  groups.push(generalGroup);
  if (element && (element.type === "bpmn:Process" || element.type === "bpmn:Participant")) {
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
    groups.push(multiInstanceGroup);
    return groups;
  }
  if (element?.type === "bpmn:ServiceTask") {
    groups.push(serviceTaskDelegateProps);
    groups.push(modelProps);
    groups.push(multiInstanceGroup);
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
  return groups;
}

export function createVariablesTabGroups(
  element: any,
  bpmnFactory: any,
  elementRegistry: any,
  translate: (s: string) => string,
) {
  const variablesGroup = {
    id: "variables",
    label: translate("Variables"),
    entries: [],
    component: VariableMapping,
  };
  return [variablesGroup];
}

export function createListenersTabGroups(
  element: any,
  bpmnFactory: any,
  elementRegistry: any,
  translate: (s: string) => string,
) {
  const listenersGroup = {
    id: "listeners",
    label: translate("Listeners"),
    entries: [],
    component: ListenerProps,
  };
  return [listenersGroup];
}

export function createViewAttributsGroups(
  element: any,
  bpmnFactory: any,
  elementRegistry: any,
  translate: (s: string) => string,
) {
  const viewAttributesGroup = {
    id: "view-attributes",
    label: translate("View attributes"),
    entries: [],
    component: ViewAttributePanel,
  };
  return [viewAttributesGroup];
}

export function createMenuActionGroups(
  element: any,
  bpmnFactory: any,
  elementRegistry: any,
  translate: (s: string) => string,
) {
  const menuActionGroup = {
    id: "menu-action-tab",
    label: translate("Menu/Action"),
    entries: [],
    component: MenuActionPanel,
  };
  return [menuActionGroup];
}

export function createConfigurationGroups(
  element: any,
  bpmnFactory: any,
  elementRegistry: any,
  translate: (s: string) => string,
) {
  const startOnListenerProps = {
    id: "process-is-start-on-listener",
    label: translate("Trigger only on client change"),
    entries: [],
    component: StartOnListenerProps,
  };
  const modelProps = {
    id: "modelProps",
    label: translate("Details"),
    entries: [],
    component: ModelProps,
  };
  const configurationGroup = {
    id: "configuration",
    label: translate("Process configs"),
    entries: [],
    component: ProcessConfiguration,
  };
  return [startOnListenerProps, configurationGroup, modelProps];
}

export function createDefinitionTabGroups(
  element: any,
  bpmnFactory: any,
  elementRegistry: any,
  translate: (s: string) => string,
) {
  const definitionGroup = {
    id: "definitions",
    label: translate("Definitions"),
    entries: [],
    component: Definitions,
  };
  return [definitionGroup];
}
