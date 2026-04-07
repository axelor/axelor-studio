import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";

import { createElement } from "../../../../../../utils/ElementUtil";

function getProperty(element: any, propertyName: any) {
  const loopCharacteristics = getLoopCharacteristics(element);
  return loopCharacteristics && loopCharacteristics.get(propertyName);
}

export function getBody(expression: any) {
  return expression && expression.get("body");
}

export function getLoopCharacteristics(element: any) {
  const bo = getBusinessObject(element);
  return bo && bo.loopCharacteristics;
}

function getLoopCardinality(element: any) {
  return getProperty(element, "loopCardinality");
}

export function getLoopCardinalityValue(element: any) {
  const loopCardinality = getLoopCardinality(element);
  return getBody(loopCardinality);
}

function getCompletionCondition(element: any) {
  return getProperty(element, "completionCondition");
}

export function getCompletionConditionValue(element: any) {
  const completionCondition = getCompletionCondition(element);
  return getBody(completionCondition);
}

export function getCollection(element: any) {
  return getProperty(element, "camunda:collection");
}

export function getElementVariable(element: any) {
  return getProperty(element, "camunda:elementVariable");
}

export function createFormalExpression(parent: any, body: any, bpmnFactory: any) {
  return createElement("bpmn:FormalExpression", { body: body }, parent, bpmnFactory);
}

export function updateFormalExpression(
  element: any,
  propertyName: any,
  newValue: any,
  bpmnFactory: any,
) {
  const loopCharacteristics = getLoopCharacteristics(element);
  if (!newValue) {
    loopCharacteristics[propertyName] = undefined;
    return;
  }
  const existingExpression = loopCharacteristics.get(propertyName);
  if (!existingExpression) {
    // add formal expression
    loopCharacteristics[propertyName] = createFormalExpression(
      loopCharacteristics,
      newValue,
      bpmnFactory,
    );
    return;
  }
  // edit existing formal expression
  existingExpression.body = newValue;
  return;
}

export function ensureMultiInstanceSupported(element: any) {
  const loopCharacteristics = getLoopCharacteristics(element);
  return !!loopCharacteristics && is(loopCharacteristics, "camunda:Collectable");
}

export function lowerCaseFirstLetter(str: any) {
  if (!str) return;
  return str.charAt(0).toLowerCase() + str.slice(1);
}

export function getBO(element: any) {
  if (element && element.$parent && element.$parent.$type !== "bpmn:Process") {
    return getBO(element.$parent);
  } else {
    return element.$parent;
  }
}

export function getValue(element: any) {
  const bo = getBO(element && getBusinessObject(element));
  const extensionElements = bo && bo.extensionElements;
  const noOptions = {
    criteria: [
      {
        fieldName: "name",
        operator: "IN",
        value: [""],
      },
    ],
  };
  if (!extensionElements || !extensionElements.values) return noOptions;
  const processConfigurations = extensionElements.values.find(
    (e: any) => e.$type === "camunda:ProcessConfiguration",
  );
  const metaModels: any[] = [],
    metaJsonModels: any[] = [],
    modelList: any[] = [];
  if (!processConfigurations && !processConfigurations.processConfigurationParameters)
    return noOptions;
  processConfigurations.processConfigurationParameters.forEach((config: any) => {
    if (config.metaModel) {
      metaModels.push(config.metaModel);
      modelList.push({
        fullName: config.metaModelFullName,
        name: config.metaModel,
        type: "metaModel",
        title:
          config.metaModelLabel &&
          config.metaModelLabel.substring(
            config.metaModelLabel.lastIndexOf("(") + 1,
            config.metaModelLabel.lastIndexOf(")"),
          ),
      });
    } else if (config.metaJsonModel) {
      metaJsonModels.push(config.metaJsonModel);
      modelList.push({
        name: config.metaJsonModel,
        type: "metaJsonModel",
        title:
          config.metaJsonModelLabel &&
          config.metaJsonModelLabel.substring(
            config.metaJsonModelLabel.lastIndexOf("(") + 1,
            config.metaJsonModelLabel.lastIndexOf(")"),
          ),
      });
    }
  });
  const value = [...metaModels, ...metaJsonModels];
  return { value, modelList };
}

export function getProcessConfig(element: any) {
  // @ts-expect-error -- safety: bpmn-js dynamic moddle property not in typed interface
  const { value } = getValue(element);
  const data = {
    criteria: [
      {
        fieldName: "name",
        operator: "IN",
        value: value && value.length > 0 ? value : [""],
      },
    ],
    operator: "or",
  };
  return data;
}
