import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import { createCategoryValue } from "../../../../utils";

import nameEntryFactory from "./implementation/Name";

export default function NameProps(
  group: any,
  element: any,
  bpmnFactory: any,
  canvas: any,
  translate: (s: string) => string,
  bpmnModeler: any,
) {
  function initializeCategory(semantic: any) {
    const rootElement = canvas.getRootElement(),
      definitions = getBusinessObject(rootElement).$parent,
      categoryValue = createCategoryValue(definitions, bpmnFactory);

    semantic.categoryValueRef = categoryValue;
  }

  function setGroupName(element: any, values: any) {
    const bo = getBusinessObject(element),
      categoryValueRef = bo && bo.categoryValueRef;

    if (!categoryValueRef) {
      initializeCategory(bo);
    }

    // needs direct call to update categoryValue properly
    return {
      cmd: "element.updateLabel",
      context: {
        element: element,
        newLabel: values.categoryValue,
      },
    };
  }

  function getGroupName(element: any) {
    const bo = getBusinessObject(element),
      value = (bo.categoryValueRef || {}).value;

    return { categoryValue: value };
  }

  if (!is(element, "bpmn:Collaboration")) {
    let options: any;
    if (is(element, "bpmn:TextAnnotation")) {
      options = { modelProperty: "text", label: translate("Text") };
    } else if (is(element, "bpmn:Group")) {
      options = {
        modelProperty: "categoryValue",
        label: translate("Category value"),
        get: getGroupName,
        set: setGroupName,
      };
    }

    // name
    group.entries = group.entries.concat(
      nameEntryFactory(element, options, translate, bpmnModeler),
    );
  }
}
