import {
  pick,
  assign,
  filter,
  forEach,
  isArray,
  isUndefined,
  has,
} from "min-dash";

import { is, getBusinessObject } from "../../util/ModelUtil";

import { isAny } from "../modeling/util/ModelingUtil";

import { isExpanded, isEventLoop } from "../../util/DiUtil";

import { getPropertyNames } from "../copy-paste/ModdleCopy";

function copyProperties(source, target, properties) {
  if (!isArray(properties)) {
    properties = [properties];
  }

  forEach(properties, function (property) {
    if (!isUndefined(source[property])) {
      target[property] = source[property];
    }
  });
}

let CUSTOM_PROPERTIES = [
  "cancelActivity",
  "instantiate",
  "eventGatewayType",
  "triggeredByEvent",
  "isInterrupting",
];

function toggeling(element, target) {
  let oldCollapsed =
    element && has(element, "collapsed")
      ? element.collapsed
      : !isExpanded(element);

  let targetCollapsed;

  if (target && (has(target, "collapsed") || has(target, "isExpanded"))) {
    // property is explicitly set so use it
    targetCollapsed = has(target, "collapsed")
      ? target.collapsed
      : !target.isExpanded;
  } else {
    // keep old state
    targetCollapsed = oldCollapsed;
  }

  if (oldCollapsed !== targetCollapsed) {
    element.collapsed = oldCollapsed;
    return true;
  }

  return false;
}

/**
 * This module takes care of replacing BPMN elements
 */
export default function BpmnReplace(
  bpmnFactory,
  elementFactory,
  moddleCopy,
  modeling,
  replace,
  selection
) {
  /**
   * Prepares a new business object for the replacement element
   * and triggers the replace operation.
   *
   * @param  {djs.model.Base} element
   * @param  {Object} target
   * @param  {Object} [hints]
   *
   * @return {djs.model.Base} the newly created element
   */
  function replaceElement(element, target, hints) {
    hints = hints || {};

    let type = target.type,
      oldBusinessObject = element.businessObject;

    if (isLoop(oldBusinessObject)) {
      if (type === "bpmn:Loop") {
        if (toggeling(element, target)) {
          // expanding or collapsing process
          modeling.toggleCollapse(element);

          return element;
        }
      }
    }

    let newBusinessObject = bpmnFactory.create(type);

    let newElement = {
      type: type,
      businessObject: newBusinessObject,
    };

    let elementProps = getPropertyNames(oldBusinessObject.$descriptor),
      newElementProps = getPropertyNames(newBusinessObject.$descriptor, true),
      copyProps = intersection(elementProps, newElementProps);

    // initialize special properties defined in target definition
    assign(newBusinessObject, pick(target, CUSTOM_PROPERTIES));

    let properties = filter(copyProps, function (propertyName) {
      // copying event definitions, unless we replace
      if (propertyName === "eventDefinitions") {
        return hasEventDefinition(element, target.eventDefinitionType);
      }

      // retain loop characteristics if the target element
      // is not an event sub process
      if (propertyName === "loopCharacteristics") {
        return !isEventLoop(newBusinessObject);
      }

      // so the applied properties from 'target' don't get lost
      if (newBusinessObject.hasOwnProperty(propertyName)) {
        return false;
      }

      if (propertyName === "processRef" && target.isExpanded === false) {
        return false;
      }

      if (propertyName === "triggeredByEvent") {
        return false;
      }

      return true;
    });

    newBusinessObject = moddleCopy.copyElement(
      oldBusinessObject,
      newBusinessObject,
      properties
    );

    // initialize custom BPMN extensions
    if (target.eventDefinitionType) {
      // only initialize with new eventDefinition
      // if we did not set an event definition yet,
      // i.e. because we copied it
      if (!hasEventDefinition(newBusinessObject, target.eventDefinitionType)) {
        newElement.eventDefinitionType = target.eventDefinitionType;
      }
    }

    if (is(oldBusinessObject, "bpmn:Activity")) {
      if (isLoop(oldBusinessObject)) {
        // no toggeling, so keep old state
        newElement.isExpanded = isExpanded(oldBusinessObject);
      }

      // else if property is explicitly set, use it
      else if (target && has(target, "isExpanded")) {
        newElement.isExpanded = target.isExpanded;
      }

      // TODO: need also to respect min/max Size
      // copy size, from an expanded loop to an expanded alternative loop
      // except bpmn:Task, because Task is always expanded
      if (
        isExpanded(oldBusinessObject) &&
        !is(oldBusinessObject, "bpmn:Task") &&
        newElement.isExpanded
      ) {
        newElement.width = element.width;
        newElement.height = element.height;
      }
    }

    // remove children if not expanding sub process
    if (isLoop(oldBusinessObject) && !isLoop(newBusinessObject)) {
      hints.moveChildren = false;
    }

    // transform collapsed/expanded pools
    if (is(oldBusinessObject, "bpmn:Participant")) {
      // create expanded pool
      if (target.isExpanded === true) {
        newBusinessObject.processRef = bpmnFactory.create("bpmn:Process-action");
      } else {
        // remove children when transforming to collapsed pool
        hints.moveChildren = false;
      }

      // apply same width and default height
      newElement.width = element.width;
      newElement.height = elementFactory._getDefaultSize(
        newBusinessObject
      ).height;
    }

    newBusinessObject.name = oldBusinessObject.name;

    // retain default flow's reference between inclusive <-> exclusive gateways and activities
    if (
      isAny(oldBusinessObject, [
        "bpmn:ExclusiveGateway",
        "bpmn:InclusiveGateway",
        "bpmn:Activity",
      ]) &&
      isAny(newBusinessObject, [
        "bpmn:ExclusiveGateway",
        "bpmn:InclusiveGateway",
        "bpmn:Activity",
      ])
    ) {
      newBusinessObject.default = oldBusinessObject.default;
    }

    if (
      target.host &&
      !is(oldBusinessObject, "bpmn:BoundaryEvent") &&
      is(newBusinessObject, "bpmn:BoundaryEvent")
    ) {
      newElement.host = target.host;
    }

    newElement.di = {};

    // fill and stroke will be set to DI
    copyProperties(oldBusinessObject.di, newElement.di, ["fill", "stroke"]);

    newElement = replace.replaceElement(element, newElement, hints);

    if (hints.select !== false) {
      selection.select(newElement);
    }

    return newElement;
  }

  this.replaceElement = replaceElement;
}

BpmnReplace.$inject = [
  "bpmnFactory",
  "elementFactory",
  "moddleCopy",
  "modeling",
  "replace",
  "selection",
];

function isLoop(bo) {
  return is(bo, "bpmn:Loop");
}

function hasEventDefinition(element, type) {
  let bo = getBusinessObject(element);

  return (
    type &&
    bo.get("eventDefinitions").some(function (definition) {
      return is(definition, type);
    })
  );
}

/**
 * Compute intersection between two arrays.
 */
function intersection(a1, a2) {
  return a1.filter(function (el) {
    return a2.indexOf(el) !== -1;
  });
}
