import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";
import type { ModdleElement, BpmnElement } from "@studio/shared/types";

import { getMessageEventDefinition } from "./EventDefinitionUtil";
import { getExtensionElementsList } from "./ExtensionElementsUtil";

type ElementInput = BpmnElement | ModdleElement | undefined;

/**
 * Check whether an element is camunda:ServiceTaskLike
 */
export function isServiceTaskLike(element: ElementInput): boolean {
  return is(element, "camunda:ServiceTaskLike");
}

/**
 * Returns 'true' if the given element is 'camunda:DmnCapable'
 */
function isDmnCapable(element: ElementInput): boolean {
  return is(element, "camunda:DmnCapable");
}

/**
 * Returns 'true' if the given element is 'camunda:ExternalCapable'
 */
export function isExternalCapable(element: ElementInput): boolean {
  return is(element, "camunda:ExternalCapable");
}

/**
 * getServiceTaskLikeBusinessObject - Get a 'camunda:ServiceTaskLike' business object.
 *
 * If the given element is not a 'camunda:ServiceTaskLike', then 'false'
 * is returned.
 */
export function getServiceTaskLikeBusinessObject(element: ElementInput): ModdleElement | false {
  if (is(element, "bpmn:IntermediateThrowEvent") || is(element, "bpmn:EndEvent")) {
    // change business object to 'messageEventDefinition' when
    // the element is a message intermediate throw event or message end event
    // because the camunda extensions (e.g. camunda:class) are in the message
    // event definition tag and not in the intermediate throw event or end event tag
    const messageEventDefinition = getMessageEventDefinition(element);
    if (messageEventDefinition) {
      element = messageEventDefinition;
    }
  }

  return isServiceTaskLike(element) && getBusinessObject(element as BpmnElement);
}

/**
 * Returns the implementation type of the given element.
 *
 * Possible implementation types are:
 * - dmn
 * - connector
 * - external
 * - class
 * - expression
 * - delegateExpression
 * - script
 * - or undefined, when no matching implementation type is found
 */
export function getImplementationType(element: ElementInput): string | undefined {
  const businessObject =
    getListenerBusinessObject(element) || getServiceTaskLikeBusinessObject(element);

  if (!businessObject) {
    return;
  }

  const bo = businessObject;

  if (isDmnCapable(bo)) {
    const decisionRef = bo.get("camunda:decisionRef");
    if (typeof decisionRef !== "undefined") {
      return "dmn";
    }
  }

  if (isServiceTaskLike(bo)) {
    const connectors = getExtensionElementsList(bo, "camunda:Connector");
    if (connectors.length) {
      return "connector";
    }
  }

  if (isExternalCapable(bo)) {
    const type = bo.get("camunda:type");
    if (type === "external") {
      return "external";
    }
  }

  const cls = bo.get("camunda:class");
  if (typeof cls !== "undefined") {
    return "class";
  }

  const expression = bo.get("camunda:expression");
  if (typeof expression !== "undefined") {
    return "expression";
  }

  const delegateExpression = bo.get("camunda:delegateExpression");
  if (typeof delegateExpression !== "undefined") {
    return "delegateExpression";
  }

  const script = bo.get("script");
  if (typeof script !== "undefined") {
    return "script";
  }
}
function getListenerBusinessObject(businessObject: ElementInput): ModdleElement | undefined {
  if (isAny(businessObject, ["camunda:ExecutionListener", "camunda:TaskListener"])) {
    return businessObject as ModdleElement;
  }
}

export function isSequenceFlow(element: ElementInput): boolean {
  return is(element, "bpmn:SequenceFlow");
}
