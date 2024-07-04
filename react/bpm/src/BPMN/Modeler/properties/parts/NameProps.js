import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import { createCategoryValue } from "../../../../utils";
import nameEntryFactory from "./implementation/Name";

export default function NameProps(
  group,
  element,
  bpmnFactory,
  canvas,
  translate,
  bpmnModeler
) {
  function initializeCategory(semantic) {
    var rootElement = canvas.getRootElement(),
      definitions = getBusinessObject(rootElement).$parent,
      categoryValue = createCategoryValue(definitions, bpmnFactory);

    semantic.categoryValueRef = categoryValue;
  }

  function setGroupName(element, values) {
    var bo = getBusinessObject(element),
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

  function getGroupName(element) {
    var bo = getBusinessObject(element),
      value = (bo.categoryValueRef || {}).value;

    return { categoryValue: value };
  }

  if (!is(element, "bpmn:Collaboration")) {
    var options;
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
      nameEntryFactory(element, options, translate, bpmnModeler)
    );
  }
}
