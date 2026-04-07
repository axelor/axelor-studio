import { useCallback, useRef } from "react";
import find from "lodash/find";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import type { TypedBpmnModeler, ModdleElement } from "@studio/shared/types";

import useSelectionStore from "../stores/useSelectionStore";
import { createElement } from "../../../utils/ElementUtil";
import { getExtensionElements } from "../../../utils/ExtensionElementsUtil";
import { updateBusinessObject } from "../../../utils";
import { getElements } from "../extra";

import { useModeler } from "./useModeler";

interface ExtensionElementsReturn {
  createParent: (element: unknown, bo: ModdleElement) => { cmd: unknown; parent: unknown };
  addProperty: (name: string, value: unknown) => void;
  handleAdd: (row: unknown) => void;
  addCallActivityExtensionElement: (shape: unknown) => void;
}

/**
 * Hook that encapsulates BPMN extension element manipulation logic.
 */
export function useExtensionElements(): ExtensionElementsReturn {
  const bpmnModeler = useModeler();
  const bpmnModelerRef = useRef<TypedBpmnModeler | null>(null);
  bpmnModelerRef.current = bpmnModeler;

  function getSelectedElement(): ModdleElement | null {
    return useSelectionStore.getState().selectedElement;
  }

  function isExtensionElements(element: unknown): boolean {
    return is(element, "bpmn:ExtensionElements");
  }

  function createParent(element: unknown, bo: ModdleElement): { cmd: unknown; parent: unknown } {
    const modeler = bpmnModelerRef.current;
    if (!modeler) return { cmd: null, parent: null };
    const bpmnFactory = modeler.get("bpmnFactory");

    const parent = createElement("bpmn:ExtensionElements", { values: [] }, bo, bpmnFactory);
    const cmd = updateBusinessObject(element, bo, {
      extensionElements: parent,
    });
    return {
      cmd: cmd,
      parent: parent,
    };
  }

  function getPropertiesElementInsideExtensionElements(
    extensionElements: Record<string, unknown>,
  ): unknown {
    const parent = extensionElements.$parent as Record<string, unknown> | undefined;
    const parentExtElems = parent?.extensionElements as Record<string, unknown> | undefined;
    const values = (parentExtElems?.values as ModdleElement[]) || [];
    return find(values, function (elem: unknown) {
      return is(elem, "camunda:Properties");
    });
  }

  function getPropertiesElement(element: unknown): unknown {
    if (!isExtensionElements(element)) {
      return (element as Record<string, unknown>).properties;
    } else {
      return getPropertiesElementInsideExtensionElements(element as Record<string, unknown>);
    }
  }

  const createCamundaProperty = (): void => {
    const modeler = bpmnModelerRef.current;
    if (!modeler) return;
    const selectedElement = getSelectedElement();
    if (!selectedElement) return;
    const bpmnFactory = modeler.get("bpmnFactory");
    const bo = getBusinessObject(selectedElement);
    const result = createParent(selectedElement, bo);
    const camundaProperties = createElement(
      "camunda:Properties",
      {},
      result.parent as ModdleElement,
      bpmnFactory,
    );
    const sel = selectedElement as Record<string, unknown>;
    const bObj = sel.businessObject as Record<string, unknown>;
    bObj?.extensionElements &&
      (bObj.extensionElements as Record<string, unknown>)?.values &&
      ((bObj.extensionElements as Record<string, unknown>).values as ModdleElement[]).push(
        camundaProperties,
      );
  };

  const addProperty = (name: string, value: unknown): void => {
    const modeler = bpmnModelerRef.current;
    if (!modeler) return;
    const selectedElement = getSelectedElement();
    if (!selectedElement) return;
    const bo = getBusinessObject(selectedElement);
    const bpmnFactory = modeler.get("bpmnFactory");
    const businessObject = getBusinessObject(selectedElement);

    const result = createParent(selectedElement, bo);
    const parent = result.parent as ModdleElement;
    let properties = getPropertiesElement(parent) as ModdleElement | null;
    if (!properties) {
      properties = createElement("camunda:Properties", {}, parent, bpmnFactory);
    }

    const propertyProps = {
      name: name,
      value: value,
    };

    const property = createElement("camunda:Property", propertyProps, properties, bpmnFactory);

    const camundaProps = bpmnFactory.create("camunda:Properties");
    camundaProps.get("values").push(property);
    const bo2 = businessObject as ModdleElement;
    if (!bo2.extensionElements) {
      const extElems = bpmnFactory.create("bpmn:ExtensionElements");
      (bo2 as Record<string, unknown>).extensionElements = extElems;
      extElems.get("values").push(camundaProps);
    } else {
      const camundaProperties = getExtensionElements(bo, "camunda:Properties");
      if (
        camundaProperties &&
        camundaProperties[0] &&
        camundaProperties[0].values
      ) {
        (camundaProperties[0].values as ModdleElement[]).push(property);
      } else {
        createCamundaProperty();
        const camundaProperties = getExtensionElements(bo, "camunda:Properties");
        if (camundaProperties?.[0]) {
          camundaProperties[0].values = [property];
        }
      }
    }
  };

  const addCallActivityExtensionElement = useCallback((shape: unknown) => {
    const s = shape as {
      type?: string;
      id?: string;
      businessObject?: Record<string, unknown>;
    } | null;
    if (s?.type !== "bpmn:CallActivity") {
      return;
    }
    const modeler = bpmnModelerRef.current;
    if (!modeler) return;
    const bo = getBusinessObject(shape) as ModdleElement;
    const bpmnFactory = modeler.get("bpmnFactory");
    let { extensionElements } = bo as Record<string, unknown>;
    const result = createParent(shape, bo);
    const elements = getElements(modeler) as Record<string, { elements?: Array<{ id: string }> }>;
    let processId: string | undefined;
    for (const [key, value] of Object.entries(elements)) {
      const activity = value?.elements?.find((v) => v.id === s?.id);
      if (activity) {
        processId = key;
        break;
      }
    }
    const camundaProperties = createElement(
      "camunda:In",
      {
        source: processId,
        target: processId,
      },
      result.parent as ModdleElement,
      bpmnFactory,
    );
    if (!extensionElements) {
      extensionElements = createElement(
        "bpmn:ExtensionElements",
        { values: [camundaProperties] },
        bo,
        bpmnFactory,
      );
      (bo as Record<string, unknown>).extensionElements = extensionElements;
    }
  }, []);

  const handleAdd = (row: unknown): void => {
    const r = row as { values?: Array<Record<string, unknown>> } | null;
    if (!r) return;
    const { values = [] } = r;
    if (values && values.length > 0) {
      values.forEach((value) => {
        const {
          model,
          modelLabel,
          view,
          viewLabel,
          relatedField,
          relatedFieldLabel,
          roles = [],
          items = [],
        } = value;
        const m = model as Record<string, unknown> | null;
        const v = view as Record<string, unknown> | null;
        const rf = relatedField as Record<string, unknown> | null;
        const r = roles as Array<Record<string, unknown>>;
        const it = items as Array<Record<string, unknown>>;
        if (m) {
          addProperty(
            "model",
            m.type === "metaJsonModel"
              ? "com.axelor.meta.db.MetaJsonRecord"
              : m.fullName || m.model,
          );
          addProperty("modelName", m.name);
          addProperty("modelLabel", modelLabel);
          addProperty("modelType", m.type);
        }
        if (v) {
          addProperty("view", v.name);
          addProperty("viewLabel", viewLabel);
        }
        if (rf) {
          addProperty("relatedField", rf.name);
          addProperty("relatedFieldLabel", relatedFieldLabel);
        }
        if (r?.length > 0) {
          const roleNames = r.map((role) => role.name);
          addProperty("roles", roleNames.toString());
        }
        if (it.length > 0) {
          it.forEach((item) => {
            const { itemName, itemNameLabel, attributeName, attributeValue, permanent } =
              item;
            const iName = itemName as Record<string, unknown> | null;
            if (!iName?.name && !iName?.title) return;
            if (iName?.type || iName?.typeName || iName?.relationship) {
              addProperty("itemType", iName.type || iName?.typeName || iName.relationship);
            }
            if (itemNameLabel) {
              addProperty("itemLabel", itemNameLabel);
            }
            addProperty("permanent", permanent || false);
            addProperty("item", iName?.name);
            if (attributeName && attributeName !== "" && attributeValue) {
              addProperty(attributeName as string, attributeValue);
            }
          });
        }
      });
    }
  };

  return { createParent, addProperty, handleAdd, addCallActivityExtensionElement };
}
