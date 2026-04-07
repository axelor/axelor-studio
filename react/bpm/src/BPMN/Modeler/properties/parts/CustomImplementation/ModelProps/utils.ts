import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

export function getBO(element: any) {
  if (element && element.$parent && element.$parent.$type !== "bpmn:Process") {
    return getBO(element.$parent);
  } else {
    return element && element.$parent;
  }
}

export function getModelProcessConfig(element: any, type: any) {
  let bo = getBO(element && getBusinessObject(element));
  if (element.type === "bpmn:Process") {
    bo = getBusinessObject(element);
  }
  if ((element && getBusinessObject(element) && getBusinessObject(element).$type) === "bpmn:Participant") {
    bo = element && getBusinessObject(element) && getBusinessObject(element).processRef;
  }
  const noOptions = {
    criteria: [{ fieldName: "name", operator: "IN", value: [""] }],
  };
  const extensionElements = bo && bo.extensionElements;
  if (!extensionElements || !extensionElements.values) return noOptions;
  const processConfigurations = extensionElements.values.find(
    (e: any) => e.$type === "camunda:ProcessConfiguration",
  );
  const metaModels: any[] = [],
    metaJsonModels: any[] = [];
  if (!processConfigurations && !processConfigurations.processConfigurationParameters)
    return noOptions;
  processConfigurations.processConfigurationParameters.forEach((config: any) => {
    if (config.metaModel) {
      metaModels.push(config.metaModel);
    } else if (config.metaJsonModel) {
      metaJsonModels.push(config.metaJsonModel);
    }
  });

  let value: any[] = [];
  if (type === "metaModel") {
    value = [...metaModels];
  } else if (type === "metaJsonModel") {
    value = [...metaJsonModels];
  } else {
    value = [...metaModels, ...metaJsonModels];
  }
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
