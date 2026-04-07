import filter from "lodash/filter";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { translate } from "@studio/shared/i18n";

import { getExtensionElements } from "../../../../../../utils/ExtensionElementsUtil";
import { getSignalEventDefinition } from "../../../../../../utils/EventDefinitionUtil";

export const inOutTypeOptions = [
  {
    name: translate("Source"),
    value: "source",
  },
  {
    name: translate("Source expression"),
    value: "sourceExpression",
  },
  {
    name: translate("All"),
    value: "variables",
  },
];

export const CAMUNDA_IN_EXTENSION_ELEMENT = "camunda:In";
export const CAMUNDA_OUT_EXTENSION_ELEMENT = "camunda:Out";

function getCamundaInOutMappings(element: any, type: any) {
  const bo = getBusinessObject(element);
  const signalEventDefinition = getSignalEventDefinition(bo);
  return getExtensionElements(signalEventDefinition || bo, type) || [];
}

export function getVariableMappings(element: any, type: any) {
  const camundaMappings = getCamundaInOutMappings(element, type);
  return filter(camundaMappings, function (mapping: any) {
    return !mapping.businessKey;
  });
}

export function getInOutType(mapping: any) {
  let inOutType = "source";
  if (!mapping) return;
  if (mapping.variables === "all") {
    inOutType = "variables";
  } else if (typeof mapping.source !== "undefined") {
    inOutType = "source";
  } else if (typeof mapping.sourceExpression !== "undefined") {
    inOutType = "sourceExpression";
  }
  return inOutType;
}

export function getMappings(bo: any, type: any) {
  return (bo && getExtensionElements(bo, type)) || [];
}

export const setOptionLabelValue = (type: any, element: any) => {
  return function (index: any) {
    const variableMappings = getVariableMappings(element, type);
    const mappingValue = variableMappings[index];
    let label = ((mappingValue && mappingValue.target) || "<undefined>") + " := ";
    const mappingType = getInOutType(mappingValue);
    if (mappingType === "variables") {
      label = "all";
    } else if (mappingType === "source") {
      label = label + (mappingValue.source || `<${translate("empty")}>`);
    } else if (mappingType === "sourceExpression") {
      label = label + (mappingValue.sourceExpression || `<${translate("empty")}>`);
    } else {
      label = label + `<${translate("empty")}>`;
    }
    return label;
  };
};

export function getLabel(l: any) {
  const mappingType = getInOutType(l);
  let label = (l.target || "<undefined>") + " := ";
  if (mappingType === "variables") {
    label = "all";
  } else if (mappingType === "source") {
    label = label + (l.source || `<${translate("empty")}>`);
  } else if (mappingType === "sourceExpression") {
    label = label + (l.sourceExpression || `<${translate("empty")}>`);
  } else {
    label = label + `<${translate("empty")}>`;
  }
  return label;
}
