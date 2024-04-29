import { updateBusinessObject } from "../../../../../utils";
import { classes as domClasses } from "min-dom";

import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import multiInstanceLoopCharacteristics from "../implementation/MultiInstanceLoopCharacteristics";
import jobRetryTimeCycle from "../implementation/JobRetryTimeCycle";
import { createElement } from "../../../../../utils/ElementUtil";

/**
 * Get a property value of the loop characteristics.
 *
 * @param {djs.model.Base} element
 * @param {string} propertyName
 *
 * @return {any} the property value
 */
function getProperty(element, propertyName) {
  let loopCharacteristics = getLoopCharacteristics(element);
  return loopCharacteristics && loopCharacteristics.get(propertyName);
}

/**
 * Get the body of a given expression.
 *
 * @param {ModdleElement<bpmn:FormalExpression>} expression
 *
 * @return {string} the body (value) of the expression
 */
function getBody(expression) {
  return expression && expression.get("body");
}

/**
 * Get the loop characteristics of an element.
 *
 * @param {djs.model.Base} element
 *
 * @return {ModdleElement<bpmn:MultiInstanceLoopCharacteristics>} the loop characteristics
 */
function getLoopCharacteristics(element) {
  let bo = getBusinessObject(element);
  return bo && bo.loopCharacteristics;
}

/**
 * Get the loop cardinality of the loop characteristics.
 *
 * @param {djs.model.Base} element
 *
 * @return {ModdleElement<bpmn:FormalExpression>} an expression representing the loop cardinality
 */
function getLoopCardinality(element) {
  return getProperty(element, "loopCardinality");
}

/**
 * Get the loop cardinality value of the loop characteristics.
 *
 * @param {djs.model.Base} element
 *
 * @return {string} the loop cardinality value
 */
function getLoopCardinalityValue(element) {
  let loopCardinality = getLoopCardinality(element);
  return getBody(loopCardinality);
}

/**
 * Get the completion condition of the loop characteristics.
 *
 * @param {djs.model.Base} element
 *
 * @return {ModdleElement<bpmn:FormalExpression>} an expression representing the completion condition
 */
function getCompletionCondition(element) {
  return getProperty(element, "completionCondition");
}

/**
 * Get the completion condition value of the loop characteristics.
 *
 * @param {djs.model.Base} element
 *
 * @return {string} the completion condition value
 */
function getCompletionConditionValue(element) {
  let completionCondition = getCompletionCondition(element);
  return getBody(completionCondition);
}

/**
 * Get the 'camunda:collection' attribute value of the loop characteristics.
 *
 * @param {djs.model.Base} element
 *
 * @return {string} the 'camunda:collection' value
 */
function getCollection(element) {
  return getProperty(element, "camunda:collection");
}

/**
 * Get the 'camunda:elementVariable' attribute value of the loop characteristics.
 *
 * @param {djs.model.Base} element
 *
 * @return {string} the 'camunda:elementVariable' value
 */
function getElementVariable(element) {
  return getProperty(element, "camunda:elementVariable");
}

/**
 * Creates 'bpmn:FormalExpression' element.
 *
 * @param {ModdleElement} parent
 * @param {string} body
 * @param {BpmnFactory} bpmnFactory
 *
 * @result {ModdleElement<bpmn:FormalExpression>} a formal expression
 */
function createFormalExpression(parent, body, bpmnFactory) {
  return createElement(
    "bpmn:FormalExpression",
    { body: body },
    parent,
    bpmnFactory
  );
}

/**
 * Updates a specific formal expression of the loop characteristics.
 *
 * @param {djs.model.Base} element
 * @param {string} propertyName
 * @param {string} newValue
 * @param {BpmnFactory} bpmnFactory
 */
function updateFormalExpression(element, propertyName, newValue, bpmnFactory) {
  let loopCharacteristics = getLoopCharacteristics(element);

  let expressionProps = {};

  if (!newValue) {
    // remove formal expression
    expressionProps[propertyName] = undefined;
    return updateBusinessObject(
      element,
      loopCharacteristics,
      expressionProps
    );
  }

  let existingExpression = loopCharacteristics.get(propertyName);

  if (!existingExpression) {
    // add formal expression
    expressionProps[propertyName] = createFormalExpression(
      loopCharacteristics,
      newValue,
      bpmnFactory
    );
    return updateBusinessObject(
      element,
      loopCharacteristics,
      expressionProps
    );
  }

  // edit existing formal expression
  return updateBusinessObject(element, existingExpression, {
    body: newValue,
  });
}

function ensureMultiInstanceSupported(element) {
  var loopCharacteristics = getLoopCharacteristics(element);
  return (
    !!loopCharacteristics && is(loopCharacteristics, "camunda:Collectable")
  );
}

export default function MultiInstanceLoopProps(
  group,
  element,
  bpmnFactory,
  translate
) {
  if (!ensureMultiInstanceSupported(element)) {
    return;
  }

  let entries = [];

  // error message /////////////////////////////////////////////////////////////////

  entries.push({
    id: "multiInstance-errorMessage",
    isValid: function (element, node, notification, scope) {
      let loopCharacteristics = getLoopCharacteristics(element);

      let isValid = true;
      if (loopCharacteristics) {
        let loopCardinality = getLoopCardinalityValue(element);
        let collection = getCollection(element);

        isValid = !loopCardinality && !collection;
      }

      domClasses(node).toggle("bpp-hidden", !isValid);
      domClasses(notification).toggle("bpp-error-message", isValid);

      return isValid;
    },
  });

  // loop cardinality //////////////////////////////////////////////////////////////

  entries.push({
    id: "multiInstance-loopCardinality",
    label: translate("Loop cardinality"),
    modelProperty: "loopCardinality",
    widget: "textField",
    get: function (element, node) {
      return {
        loopCardinality: getLoopCardinalityValue(element),
      };
    },

    set: function (element, values) {
      return updateFormalExpression(
        element,
        "loopCardinality",
        values.loopCardinality,
        bpmnFactory
      );
    },
  });

  // collection //////////////////////////////////////////////////////////////////

  entries.push({
    id: "multiInstance-collection",
    label: translate("Collection"),
    modelProperty: "collection",
    widget: "textField",
    get: function (element, node) {
      return {
        collection: getCollection(element),
      };
    },

    set: function (element, values) {
      let loopCharacteristics = getLoopCharacteristics(element);
      return cmdHelper.updateBusinessObject(element, loopCharacteristics, {
        "camunda:collection": values.collection || undefined,
      });
    },

    validate: function (element, values, node) {
      let collection = getCollection(element);
      let elementVariable = getElementVariable(element);

      if (!collection && elementVariable) {
        return { collection: translate("Must provide a value") };
      }
    },
  });

  // element variable ////////////////////////////////////////////////////////////

  entries.push({
    id: "multiInstance-elementVariable",
    label: translate("Element variable"),
    modelProperty: "elementVariable",
    widget: "textField",
    get: function (element, node) {
      return {
        elementVariable: getElementVariable(element),
      };
    },

    set: function (element, values) {
      let loopCharacteristics = getLoopCharacteristics(element);
      return updateBusinessObject(element, loopCharacteristics, {
        "camunda:elementVariable": values.elementVariable || undefined,
      });
    },
  });

  // Completion Condition //////////////////////////////////////////////////////

  entries.push({
    id: "multiInstance-completionCondition",
    label: translate("Completion condition"),
    modelProperty: "completionCondition",
    widget: "textField",
    get: function (element) {
      return {
        completionCondition: getCompletionConditionValue(element),
      };
    },

    set: function (element, values) {
      return updateFormalExpression(
        element,
        "completionCondition",
        values.completionCondition,
        bpmnFactory
      );
    },
  });

  // multi instance properties
  group.entries = group.entries.concat(
    multiInstanceLoopCharacteristics(element, bpmnFactory, translate)
  );

  // retry time cycle //////////////////////////////////////////////////////////
  group.entries = group.entries.concat(
    jobRetryTimeCycle(
      element,
      bpmnFactory,
      {
        getBusinessObject: getLoopCharacteristics,
        idPrefix: "multiInstance-",
        labelPrefix: translate("Multi instance"),
      },
      translate
    )
  );

  return entries;
}
