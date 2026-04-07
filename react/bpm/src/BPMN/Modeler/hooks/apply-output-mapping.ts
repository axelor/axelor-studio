import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import type { TypedBpmnModeler, ModdleElement } from "@studio/shared/types";

import { createElement } from "../../../utils/ElementUtil";
import { getExtensionElements } from "../../../utils/ExtensionElementsUtil";

/**
 * Applies an output mapping script to an element's execution listeners.
 * This was previously inline in callOutputMapping in BpmnModeler.jsx,
 * then moved to useDeploy.js, now extracted for file size.
 */
export function applyOutputMappingScript(
  modeler: TypedBpmnModeler,
  element: { businessObject: ModdleElement; [key: string]: unknown },
  script: string,
): void {
  const CAMUNDA_EXECUTION_LISTENER_ELEMENT = "camunda:ExecutionListener";

  const getBO = (el: unknown): ModdleElement => {
    const bo = getBusinessObject(el) as ModdleElement;
    if (is(el, "bpmn:Participant")) {
      return bo && (bo.get("processRef") as ModdleElement);
    }
    return bo;
  };

  const bo = getBO(element);
  const bpmnFactory = modeler.get("bpmnFactory");
  const listeners = (bo && getExtensionElements(bo, CAMUNDA_EXECUTION_LISTENER_ELEMENT)) || [];

  const listener = listeners.find(
    (l: ModdleElement) => l && l.$attrs && l.$attrs["outId"] === "dmn_output_mapping",
  );

  if (listener && (listener as Record<string, unknown>).script) {
    ((listener as Record<string, unknown>).script as { value: string }).value = script;
  } else {
    // Create new execution listener element
    const props = {
      event: "end",
      script: createElement(
        "camunda:Script",
        { scriptFormat: "axelor", value: script },
        getBO(element),
        bpmnFactory,
      ),
    };
    const newElem = createElement(
      CAMUNDA_EXECUTION_LISTENER_ELEMENT,
      props,
      bo,
      bpmnFactory,
    );
    newElem.$attrs["outId"] = "dmn_output_mapping";

    let extensionElements =
      bo &&
      ((bo as Record<string, unknown>).extensionElements as { values: unknown[] } | undefined);
    if (!extensionElements) {
      extensionElements = createElement(
        "bpmn:ExtensionElements",
        { values: [] },
        bo,
        bpmnFactory,
      ) as unknown as { values: unknown[] }; // safety: bpmn-js extensionElements.values not in typed interface
      element.businessObject.extensionElements =
        extensionElements as unknown as ModdleElement["extensionElements"]; // safety: bpmn-js extensionElements.values not in typed interface
    }
    (element.businessObject.extensionElements as unknown as { values: unknown[] }).values.push( // safety: bpmn-js extensionElements.values not in typed interface
      newElem,
    );
  }
}
