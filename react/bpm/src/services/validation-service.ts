// Pure validation functions extracted from BpmnModeler.jsx.
// No React imports, no side effects -- returns structured {success, error} results.

import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import { getDefinitionAttrs, getAllElements } from "../BPMN/Modeler/utils/modeler-api";
import { USER_TASKS_TYPES } from "../BPMN/Modeler/constants";
import { ALL_ATTRIBUTES } from "../BPMN/Modeler/properties/parts/CustomImplementation/constants";

interface ValidationResult {
  success: boolean;
  error?: string;
}

import type { TypedBpmnModeler } from "@studio/shared/types";

interface CamundaPropertyEntry {
  name: string;
  value: string;
}

interface ModdleBO {
  $type: string;
  $parent?: ModdleBO;
  name?: string;
  extensionElements?: {
    values: Array<{
      $type: string;
      values?: CamundaPropertyEntry[];
      processConfigurationParameters?: Array<{
        metaModel?: string;
        metaJsonModel?: string;
      }>;
    }>;
  };
  eventDefinitions?: Array<{ $type: string }>;
  businessObject?: ModdleBO;
  [key: string]: unknown;
}

interface ViewElement {
  id: string;
  type: string;
  businessObject: ModdleBO;
  [key: string]: unknown;
}

/**
 * Splits a flat array of camunda:Property entries into groups by a key marker.
 * Each time an entry with `name === key` is encountered, a new group starts.
 */
function getKeyData(
  data: CamundaPropertyEntry[] | undefined,
  key: string,
): CamundaPropertyEntry[][] | undefined {
  return (
    data &&
    data.reduce<CamundaPropertyEntry[][]>((arrs, item) => {
      if (item.name === key) {
        arrs.push([]);
      }
      arrs[arrs.length - 1] && arrs[arrs.length - 1].push(item);
      return arrs;
    }, [])
  );
}

/**
 * Walks up the businessObject $parent chain to find the owning bpmn:Process.
 */
function getBOParentDefault(element: ModdleBO | undefined): ModdleBO | undefined {
  if (element && element.$parent && element.$parent.$type !== "bpmn:Process") {
    return getBOParentDefault(element.$parent);
  } else {
    return element?.$parent;
  }
}

/**
 * Returns the list of model names configured on the parent process.
 */
function getProcessModels(
  element: ViewElement,
  getBOParent: (bo: ModdleBO | undefined) => ModdleBO | undefined,
): string[] {
  const parentFn = getBOParent || getBOParentDefault;
  const bo = parentFn(element && element.businessObject);
  const extensionElements = bo && bo.extensionElements;
  if (!extensionElements || !extensionElements.values) return [];
  const processConfigurations = extensionElements.values.find(
    (e) => e.$type === "camunda:ProcessConfiguration",
  );
  const metaModels: string[] = [];
  const metaJsonModels: string[] = [];
  if (!processConfigurations || !processConfigurations.processConfigurationParameters) return [];
  processConfigurations.processConfigurationParameters.forEach((config) => {
    if (config.metaModel) {
      metaModels.push(config.metaModel);
    } else if (config.metaJsonModel) {
      metaJsonModels.push(config.metaJsonModel);
    }
  });
  return [...metaModels, ...metaJsonModels];
}

/**
 * Validates that name and code are set on the BPMN definitions.
 */
export function validateNameAndCode(modeler: TypedBpmnModeler): ValidationResult {
  const attrs = getDefinitionAttrs(modeler);
  const name = attrs["camunda:diagramName"];
  const code = attrs["camunda:code"];

  if (!name || !code) {
    const error =
      !name && !code
        ? "Name and code are required."
        : !name
          ? "Name is required."
          : !code
            ? "Code is required."
            : "";
    return { success: false, error };
  }
  return { success: true };
}

/**
 * Validates that no timer events exist when isTimerTask is false.
 */
export function validateTimerEvents(
  modeler: TypedBpmnModeler,
  isTimerTask: boolean,
): ValidationResult {
  if (isTimerTask) {
    return { success: true };
  }

  const elementRegistry = modeler.get("elementRegistry");
  const timerEvent = elementRegistry.filter((element) => {
    const bo = getBusinessObject(element) as ModdleBO;
    if (bo && bo.eventDefinitions) {
      const timerDef = bo.eventDefinitions.find((e) => e.$type === "bpmn:TimerEventDefinition");
      return !!timerDef;
    }
    return false;
  });

  if (timerEvent && timerEvent.length > 0) {
    return { success: false, error: "Timer events are not supported." };
  }
  return { success: true };
}

interface ValidateNodesOptions {
  getBOParent?: (bo: ModdleBO | undefined) => ModdleBO | undefined;
}

/**
 * Validates all nodes in the diagram for required fields.
 */
export function validateNodes(
  modeler: TypedBpmnModeler,
  options: ValidateNodesOptions = {},
): ValidationResult {
  const allNodes = getAllElements(modeler) as ViewElement[];
  let firstError: string | null = null;

  const parentFn = options.getBOParent || getBOParentDefault;

  for (const viewElement of allNodes) {
    if (firstError) break;

    const businessObject = getBusinessObject(viewElement) as ModdleBO;
    const extensionElements = businessObject.extensionElements;
    const processModels = getProcessModels(viewElement, parentFn);
    const nodeName = (businessObject && businessObject.name) || (viewElement && viewElement.id);

    if (!viewElement.id) {
      firstError = `Id is required in ${nodeName}`;
      break;
    }

    if (
      ["bpmn:EndEvent", "bpmn:IntermediateCatchEvent", ...USER_TASKS_TYPES].includes(
        viewElement.type,
      )
    ) {
      let extensionElementValues: CamundaPropertyEntry[] | undefined;
      let camundaProperty: { $type: string; values?: CamundaPropertyEntry[] } | undefined;
      if (extensionElements && extensionElements.values) {
        camundaProperty = extensionElements.values.find((e) => e.$type === "camunda:Properties");
        extensionElementValues = camundaProperty && camundaProperty.values;
      }
      if (extensionElementValues && extensionElementValues.length < 1) continue;

      const models = getKeyData(extensionElementValues, "model");
      const values: Array<Record<string, unknown>> = [];
      models &&
        models.forEach((modelArr) => {
          const value: Record<string, unknown> = { items: [] as Record<string, unknown>[] };
          const items = getKeyData(modelArr, "itemType");
          modelArr.forEach((ele) => {
            if (ele.name === "model") {
              value.model = { model: ele.value, fullName: ele.value };
            }
            if (ele.name === "modelName") {
              value.model = { ...(value.model as Record<string, unknown>), name: ele.value };
            }
            if (ele.name === "modelType") {
              value.model = { ...(value.model as Record<string, unknown>), type: ele.value };
            }
            if (ele.name === "modelLabel") {
              value.modelLabel = ele.value;
              value.model = { ...(value.model as Record<string, unknown>), title: ele.value };
            }
            if (ele.name === "view") {
              value.view = { name: ele.value };
            }
            if (ele.name === "viewLabel") {
              value.viewLabel = ele.value;
              value.view = { ...(value.view as Record<string, unknown>), title: ele.value };
            }
            if (ele.name === "relatedField") {
              value.relatedField = { name: ele.value };
            }
            if (ele.name === "relatedFieldLabel") {
              value.relatedFieldLabel = ele.value;
              value.relatedField = {
                ...(value.relatedField as Record<string, unknown>),
                title: ele.value,
              };
            }
            if (ele.name === "roles") {
              if (!ele.value) return;
              const roles = ele.value.split(",");
              const valueRoles: Array<{ name: string }> = [];
              roles.forEach((role) => {
                valueRoles.push({ name: role });
              });
              value.roles = valueRoles;
            }
          });

          items &&
            items.forEach((item) => {
              const name = item.find((f) => f.name === "item");
              const label = item.find((f) => f.name === "itemLabel");
              const type = item.find((f) => f.name === "itemType");
              const attribute = item.find((f) => ALL_ATTRIBUTES.includes(f.name));
              const permanent = item.find((f) => f.name === "permanent");
              (value.items as Record<string, unknown>[]).push({
                itemName: {
                  name: name?.value,
                  label: label?.value,
                  type: type?.value,
                },
                itemNameLabel: label && label.value,
                attributeName: attribute && attribute.name,
                attributeValue: attribute && attribute.value,
                permanent: permanent && permanent.value,
              });
            });
          values.push(value);
        });

      if (values && values.length > 0) {
        for (const value of values) {
          if (firstError) break;
          const {
            items = [],
            relatedField,
            model,
          } = value as {
            items: Array<{ itemName?: unknown; attributeName?: string }>;
            relatedField?: unknown;
            model?: { name?: string };
          };
          if (!processModels?.includes(model?.name ?? "") && !relatedField) {
            firstError = `Related field is required in ${nodeName}`;
            break;
          }
          const checkItems = items.filter(
            (item) => item && (!item.itemName || !item.attributeName),
          );
          if (items.length < 1 || checkItems.length === items.length) {
            firstError = `Item is required in ${nodeName}`;
            break;
          }
          if (items.length > 0) {
            for (const item of items) {
              if (firstError) break;
              const { itemName, attributeName, attributeValue } = item as {
                itemName?: unknown;
                attributeName?: string;
                attributeValue?: string;
              };
              if (!itemName || !attributeName) {
                firstError = `Item name is required in ${nodeName}`;
                break;
              }
              if (!attributeValue) {
                if (["readonly", "hidden", "required"].includes(attributeName)) {
                  // boolean attributes default to false -- not an error
                } else {
                  firstError = `Item value is required in ${nodeName}`;
                  break;
                }
              }
            }
          }
        }
      }
    }
  }

  if (firstError) {
    return { success: false, error: firstError };
  }
  return { success: true };
}
