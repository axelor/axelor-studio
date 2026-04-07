import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { camelCase } from "lodash";
import { translate } from "@studio/shared/i18n";
import Ids from "ids";

import { createElement as _createElement } from "../../../../../utils/ElementUtil";

function getAxelorScope() {
  return window.top?.axelor;
}

const _DUMMY = Symbol();

export function nextId(prefix: any) {
  const ids = new Ids([32, 32, 1]);
  return ids.nextPrefixed(prefix);
}

export function getProcessConfig(element: any) {
  let bo = getBusinessObject(element);
  if ((element && element.type) === "bpmn:Participant") {
    bo = getBusinessObject(bo.processRef);
  }
  const extensionElements = bo.extensionElements;
  if (!extensionElements || !extensionElements.values) return null;
  const processConfigurations = extensionElements.values.find(
    (e: any) => e.$type === "camunda:ProcessConfiguration",
  );
  return processConfigurations;
}

export function createElement(type: any, parent: any, factory: any, properties: any) {
  return _createElement(type, properties, parent, factory);
}

export function createProcessConfiguration(parent: any, bpmnFactory: any, properties: any) {
  return createElement("camunda:ProcessConfiguration", parent, bpmnFactory, properties);
}

export function createParameter(type: any, parent: any, bpmnFactory: any, properties: any) {
  return createElement(type, parent, bpmnFactory, properties);
}

export function getModelName(value: any) {
  if (!value) return;
  const conditionalModel = camelCase(value);
  return conditionalModel[0]?.toUpperCase() + conditionalModel.slice(1);
}

export function openTabView(view: any) {
  const scope = getAxelorScope();
  // @ts-expect-error -- safety: bpmn-js dynamic moddle property not in typed interface
  scope && scope.openView && scope.openView(view);
}

export function openWebApp(url: any, title: any) {
  const scope = getAxelorScope();
  // @ts-expect-error -- safety: bpmn-js dynamic moddle property not in typed interface
  scope && scope.$openHtmlTab && scope.$openHtmlTab(url, translate(title));
}

export function getExtensionElementProperties(element: any, type: any) {
  const bo = getBusinessObject(element);
  const extensionElements = bo && bo.extensionElements;
  if (!extensionElements || !extensionElements.values) return null;
  return extensionElements.values.find((e: any) => e.$type === type);
}
