import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { camelCase } from "lodash";
import { getAxelorScope, translate } from "../../../../../utils";
import Ids from "ids";

const DUMMY = Symbol();

export function nextId(prefix) {
  let ids = new Ids([32, 32, 1]);
  return ids.nextPrefixed(prefix);
}

export function getProcessConfig(element) {
  let bo = getBusinessObject(element);
  if ((element && element.type) === "bpmn:Participant") {
    bo = getBusinessObject(bo.processRef);
  }
  const extensionElements = bo.extensionElements;
  if (!extensionElements || !extensionElements.values) return null;
  const processConfigurations = extensionElements.values.find(
    (e) => e.$type === "camunda:ProcessConfiguration"
  );
  return processConfigurations;
}

export function createElement(type, parent, factory, properties) {
  return elementHelper.createElement(type, properties, parent, factory);
}

export function createProcessConfiguration(parent, bpmnFactory, properties) {
  return createElement(
    "camunda:ProcessConfiguration",
    parent,
    bpmnFactory,
    properties
  );
}

export function createParameter(type, parent, bpmnFactory, properties) {
  return createElement(type, parent, bpmnFactory, properties);
}

export function getModelName(value) {
  if (!value) return;
  let conditionalModel = camelCase(value);
  return conditionalModel[0]?.toUpperCase() + conditionalModel.slice(1);
}

export function openTabView(view) {
  const scope = getAxelorScope();
  scope && scope.openView && scope.openView(view);
}

export function openWebApp(url, title) {
  const scope = getAxelorScope();
  scope && scope.$openHtmlTab && scope.$openHtmlTab(url, translate(title));
}

export function getExtensionElementProperties(element, type) {
  const bo = getBusinessObject(element);
  const extensionElements = bo && bo.extensionElements;
  if (!extensionElements || !extensionElements.values) return null;
  return extensionElements.values.find((e) => e.$type === type);
}
