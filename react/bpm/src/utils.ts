import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { isExpanded, isEventSubProcess, isInterrupting } from "bpmn-js/lib/util/DiUtil";

import { getExtensionElements } from "./utils/ExtensionElementsUtil";
import { FILL_COLORS, STROKE_COLORS } from "./BPMN/Modeler/constants";
import iconsByType from "./BPMN/icons";

const download = (entity: string, name: string, isXml = true) => {
  const encodedData = encodeURIComponent(entity);
  const dl = document.createElement("a");
  document.body.appendChild(dl);
  dl.setAttribute(
    "href",
    (isXml ? "data:Application/octet-stream," : "data:image/svg+xml;utf-8,") + encodedData,
  );
  dl.setAttribute("download", name);
  dl.click();
};

export const capitalizeFirst = (str = "") => {
  if (!str || typeof str !== "string") return;
  const string = str.replace(/([A-Z])/g, " $1");
  const result = string && string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  return result;
};

function getBool(val: unknown): boolean {
  if (!val || !["false", "true", true, false].includes(val as string | boolean)) return false;
  return !!JSON.parse(String(val).toLowerCase());
}

function dashToUnderScore(str: string) {
  if (!str) return;
  return str.replace("json-", "").replaceAll("-", "_").toLowerCase();
}

function convertSVGtoBase64(svgXml: string) {
  return new Promise<string | null>((resolve, _reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = function () {
      const canvas = document.createElement("CANVAS") as HTMLCanvasElement;
      const ctx = canvas.getContext("2d")!;
      canvas.height = img.naturalHeight;
      canvas.width = img.naturalWidth;
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/png", 1);
      resolve(dataURL);
    };

    img.onerror = function () {
      resolve(null);
    };

    img.src = "data:image/svg+xml;base64," + window.btoa(unescape(encodeURIComponent(svgXml)));
  });
}

function lightenColor(color: string, percent: number) {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const lightenR = Math.round((255 - r) * percent) + r;
  const lightenG = Math.round((255 - g) * percent) + g;
  const lightenB = Math.round((255 - b) * percent) + b;
  const lightenHex = `#${lightenR.toString(16)}${lightenG.toString(16)}${lightenB.toString(16)}`;

  return lightenHex;
}

export {
  download,
  getBool,
  dashToUnderScore,
  convertSVGtoBase64,
  lightenColor,
};

// Re-export promoted functions from @studio/shared for backward compatibility
export { getLowerCase } from "@studio/shared/utils";

interface BpmnElement {
  $type?: string;
  type?: string;
  source?: BpmnElement;
  di?: { stroke?: string; fill?: string };
  businessObject?: Record<string, unknown>;
  eventDefinitions?: Array<{ $type: string }>;
  cancelActivity?: boolean;
  id?: string;
  [key: string]: unknown;
}

export function isAsyncBefore(bo: unknown) {
  return !!(
    (bo as Record<string, unknown>)["camunda:asyncBefore"] ||
    (bo as Record<string, unknown>)["camunda:async"]
  );
}

export function isAsyncAfter(bo: unknown) {
  return !!(bo as Record<string, unknown>)["camunda:asyncAfter"];
}

export function createCategoryValue(
  definitions: Record<string, unknown>,
  bpmnFactory: Record<string, (...args: unknown[]) => unknown>,
) {
  const categoryValue = bpmnFactory.create("bpmn:CategoryValue");

  const category = bpmnFactory.create("bpmn:Category", {
    categoryValue: [categoryValue],
  });

  // add to correct place
  collectionAdd((definitions as Record<string, unknown[]>)["rootElements"], category);
  getBusinessObject(category).$parent = definitions;
  getBusinessObject(categoryValue).$parent = category;

  return categoryValue;
}

function collectionAdd(collection: unknown[], element: unknown) {
  if (!collection) return;
  collection.push(element);
}

export function getFailedJobRetryTimeCycle(bo: unknown) {
  return getExtensionElements(
    bo as import("@studio/shared/types").ModdleElement,
    "camunda:FailedJobRetryTimeCycle",
  )?.[0];
}

export function updateBusinessObject(
  element: unknown,
  businessObject: unknown,
  newProperties: Record<string, unknown>,
) {
  return {
    cmd: "properties-panel.update-businessobject",
    context: {
      element: element,
      businessObject: businessObject,
      properties: newProperties,
    },
  };
}

interface ProblemItem {
  category: string;
  [key: string]: unknown;
}

export function getProblemViewData(
  issues: Record<string, ProblemItem[]> | Record<string, unknown> = {},
) {
  const errors: ProblemItem[] = [];
  const warnings: ProblemItem[] = [];

  for (const [_key, value] of Object.entries(issues)) {
    (value as ProblemItem[]).forEach((item: ProblemItem) => {
      if (item.category === "error") {
        errors.push(item);
      } else if (item.category === "warn") {
        warnings.push(item);
      }
    });
  }

  return {
    errors,
    warnings,
  };
}

// helpers functions

function isCancelActivity(element: BpmnElement) {
  const businessObject = getBusinessObject(element);

  return businessObject && businessObject.cancelActivity !== false;
}

function getEventDefinition(element: BpmnElement) {
  const businessObject = getBusinessObject(element),
    eventDefinitions = businessObject.eventDefinitions;

  return eventDefinitions && eventDefinitions[0];
}

function getRawType(type: string) {
  return type.split(":")[1];
}

function getEventDefinitionPrefix(eventDefinition: { $type: string }) {
  const rawType = getRawType(eventDefinition.$type);

  return rawType.replace("EventDefinition", "");
}

function isDefaultFlow(element: BpmnElement) {
  const businessObject = getBusinessObject(element);
  const sourceBusinessObject = element.source ? getBusinessObject(element.source) : null;

  if (!is(element, "bpmn:SequenceFlow") || !sourceBusinessObject) {
    return false;
  }

  return (
    sourceBusinessObject.default &&
    sourceBusinessObject.default === businessObject &&
    (is(sourceBusinessObject, "bpmn:Gateway") || is(sourceBusinessObject, "bpmn:Activity"))
  );
}

function isConditionalFlow(element: BpmnElement) {
  const businessObject = getBusinessObject(element);
  const sourceBusinessObject = element.source ? getBusinessObject(element.source) : null;

  if (!is(element, "bpmn:SequenceFlow") || !sourceBusinessObject) {
    return false;
  }

  return businessObject.conditionExpression && is(sourceBusinessObject, "bpmn:Activity");
}

function isPlane(element: BpmnElement) {
  // Backwards compatibility for bpmn-js<8
  const di = element && (element.di || getBusinessObject(element).di);

  return is(di, "bpmndi:BPMNPlane");
}

function getConcreteType(element: BpmnElement) {
  const elementType = element.$type || element.type;

  if (!elementType) return "";
  let type = getRawType(elementType);

  // (1) event definition types
  const eventDefinition = getEventDefinition(element);

  if (eventDefinition) {
    type = `${getEventDefinitionPrefix(eventDefinition)}${type}`;

    // (1.1) interrupting / non interrupting
    if (
      (is(element, "bpmn:StartEvent") && !isInterrupting(element)) ||
      (is(element, "bpmn:BoundaryEvent") && !isCancelActivity(element))
    ) {
      type = `${type}NonInterrupting`;
    }

    return type;
  }

  // (2) sub process types
  if (is(element, "bpmn:SubProcess") && !is(element, "bpmn:Transaction")) {
    if (isEventSubProcess(element)) {
      type = `Event${type}`;
    } else {
      const expanded = isExpanded(element) && !isPlane(element);
      type = `${expanded ? "Expanded" : "Collapsed"}${type}`;
    }
  }

  // (3) conditional + default flows
  if (isDefaultFlow(element)) {
    type = "DefaultFlow";
  }

  if (isConditionalFlow(element)) {
    type = "ConditionalFlow";
  }

  return type;
}
export function getElementIcon(element: BpmnElement) {
  if (!element) return "";
  const concreteType = getConcreteType(element);
  const colors = getIconColors(element);
  return {
    ...colors,
    icon: (iconsByType as Record<string, string>)[concreteType],
    type: concreteType.replace(/(\B[A-Z])/g, " $1").replace(/(\bNon Interrupting)/g, "($1)"),
  };
}

function getIconColors(element: BpmnElement) {
  if (!element) return;
  if (element?.di?.stroke || element?.di?.fill) {
    return {
      stroke: element?.di?.stroke,
      fill: element?.di?.fill,
    };
  }
  if (element.type === "bpmn:Gateway" || element.$type === "bpmn:Gateway") {
    return {
      stroke: STROKE_COLORS["bpmn:Gateway"],
      fill: FILL_COLORS["bpmn:Gateway"],
    };
  } else {
    return {
      stroke: (STROKE_COLORS)[element?.type || element.$type || ""],
      fill: (FILL_COLORS)[element?.type || element.$type || ""],
    };
  }
}
