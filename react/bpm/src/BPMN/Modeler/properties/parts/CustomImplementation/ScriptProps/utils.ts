import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { getBool } from "../../../../../../utils";

function getBO(element: any) {
  if (element && element.$parent && element.$parent.$type !== "bpmn:Process") {
    return getBO(element.$parent);
  } else {
    return element.$parent;
  }
}

export function getProcessConfig(element: any, configType: any) {
  let bo = getBO(element && getBusinessObject(element));
  if (element.type === "bpmn:Process") {
    bo = getBusinessObject(element);
  }
  if ((element && getBusinessObject(element) && getBusinessObject(element).$type) === "bpmn:Participant") {
    bo = element && getBusinessObject(element) && getBusinessObject(element).processRef;
  }
  const noOptions = {
    criteria: [
      {
        fieldName: "name",
        operator: "IN",
        value: [""],
      },
    ],
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
  if (configType === "metaModel") {
    value = [...metaModels];
  } else if (configType === "metaJsonModel") {
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

export function buildScriptGetter(getProperty: any) {
  return () => {
    const value = getProperty("scriptValue");
    const combinator = getProperty("scriptOperatorType");
    const checked = getBool(getProperty("checked"));
    let values: any;
    if (value !== undefined) {
      try {
        values = JSON.parse(value);
        if (!values.length) {
          values = null;
        }
      } catch (_errror) {}
    }
    const obj = { values: values, combinator, checked };
    return obj;
  };
}

export function addModels(values: any, setProperty: any) {
  const displayOnModels: any[] = [],
    modelLabels: any[] = [];

  if (Array.isArray(values)) {
    if (values && values.length === 0) {
      setProperty("displayOnModels", undefined);
      setProperty(`displayOnModelLabels`, undefined);
      return;
    }
    values &&
      values.forEach((value: any) => {
        if (!value) {
          setProperty("displayOnModels", undefined);
          setProperty(`displayOnModelLabels`, undefined);
          return;
        }
        displayOnModels.push(value.name);
        modelLabels.push(value.title);
      });
  }
  if (displayOnModels.length > 0) {
    setProperty("displayOnModels", displayOnModels.toString());
    setProperty(`displayOnModelLabels`, modelLabels.toString());
  }
}
