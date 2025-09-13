import { getExtensionElements } from "./utils/ExtensionElementsUtil";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import {
  isExpanded,
  isEventSubProcess,
  isInterrupting,
} from "bpmn-js/lib/util/DiUtil";

import { FILL_COLORS, STROKE_COLORS } from "./BPMN/Modeler/constants";
import iconsByType from "./BPMN/icons";

const download = (entity, name, isXml = true) => {
  let encodedData = encodeURIComponent(entity);
  let dl = document.createElement("a");
  document.body.appendChild(dl);
  dl.setAttribute(
    "href",
    (isXml ? "data:Application/octet-stream," : "data:image/svg+xml;utf-8,") +
      encodedData
  );
  dl.setAttribute("download", name);
  dl.click();
};

function translate(str) {
  if (window?.top?.axelor?.i18n.get && typeof str === "string") {
    return window?.top?.axelor?.i18n.get(str);
  }
  return str;
}

export const capitalizeFirst = (str = "") => {
  if (!str || typeof str !== "string") return;
  const string = str.replace(/([A-Z])/g, " $1");
  const result =
    string && string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  return result;
};

function getAxelorScope() {
  return window.top?.axelor;
}

function pascalToKebabCase(string) {
  return (
    string &&
    string
      .match(
        /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g
      )
      .map((x) => x.toLowerCase())
      .join("-")
  );
}

function getBool(val) {
  if (!val || !["false", "true", true, false].includes(val)) return false;
  return !!JSON.parse(String(val).toLowerCase());
}

function sortBy(array = [], key) {
  return array.sort(function (a, b) {
    let x = a[key];
    let y = b[key];
    return x < y ? -1 : x > y ? 1 : 0;
  });
}

export function filesToItems(files, maxFiluitlses) {
  const CHUNK_SIZE = 512 * 1024;
  return Array.prototype.slice
    .call(files)
    .slice(0, maxFiles)
    .map((f, i) => ({
      file: f,
      index: i,
      progress: 0,
      cancelled: false,
      completed: false,
      chunkProgress: new Array(Math.floor(f.size / CHUNK_SIZE) + 1).fill(0),
      error: false,
      totalUploaded: 0,
    }));
}

export function getAttachmentBlob(file) {
  return file.file;
}

function getItemsByType(view, type) {
  function collectItems(item) {
    const { items = [], jsonFields = [], toolbar = [], menubar = [] } = item;
    const allItems = [...items, ...jsonFields, ...toolbar, ...menubar];
    return allItems.reduce(
      (all, item) => [...all, ...collectItems(item)],
      item.type === type ? [item] : []
    );
  }
  return collectItems(view);
}

function getLowerCase(str) {
  if (!str) return;
  return str.trim().toLowerCase();
}

function lowerCaseFirstLetter(str) {
  if (!str) return;
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function splitWithComma(str) {
  if (!str) return;
  if (typeof str !== "string") return str;
  return str.split(",");
}
function dashToUnderScore(str) {
  if (!str) return;
  return str.replace("json-", "").replaceAll("-", "_").toLowerCase();
}

function convertSVGtoBase64(svgXml) {
  return new Promise((resolve, reject) => {
    var img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = function () {
      var canvas = document.createElement("CANVAS");
      var ctx = canvas.getContext("2d");
      var dataURL;
      canvas.height = this.naturalHeight;
      canvas.width = this.naturalWidth;
      ctx.drawImage(this, 0, 0);
      dataURL = canvas.toDataURL("image/png", 1);
      resolve(dataURL);
    };

    img.onerror = function () {
      resolve(null);
    };

    img.src =
      "data:image/svg+xml;base64," +
      window.btoa(unescape(encodeURIComponent(svgXml)));
  });
}

function lightenColor(color, percent) {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const lightenR = Math.round((255 - r) * percent) + r;
  const lightenG = Math.round((255 - g) * percent) + g;
  const lightenB = Math.round((255 - b) * percent) + b;
  const lightenHex = `#${lightenR.toString(16)}${lightenG.toString(
    16
  )}${lightenB.toString(16)}`;

  return lightenHex;
}

function mergeModels(metaModels, metaJsonModels) {
  if (metaModels?.length === 0 && metaJsonModels?.length === 0) return;

  return metaModels?.length > 0 && metaJsonModels?.length > 0
    ? metaModels?.concat(metaJsonModels)
    : metaModels?.length > 0
    ? metaModels
    : metaJsonModels?.length > 0
    ? metaJsonModels
    : [];
}

export {
  download,
  translate,
  pascalToKebabCase,
  getBool,
  sortBy,
  getItemsByType,
  getLowerCase,
  getAxelorScope,
  lowerCaseFirstLetter,
  splitWithComma,
  dashToUnderScore,
  convertSVGtoBase64,
  lightenColor,
  mergeModels,
};

export function isAsyncBefore(bo) {
  return !!(bo.get("camunda:asyncBefore") || bo.get("camunda:async"));
}

export function isAsyncAfter(bo) {
  return !!bo.get("camunda:asyncAfter");
}

export function PropertiesActivator(eventBus, priority) {
  var self = this;

  priority = priority || DEFAULT_PRIORITY;

  eventBus.on("propertiesPanel.isEntryVisible", priority, function (context) {
    var element = context.element,
      entry = context.entry,
      group = context.group,
      tab = context.tab;

    return self.isEntryVisible(element, entry, group, tab);
  });

  eventBus.on(
    "propertiesPanel.isPropertyEditable",
    priority,
    function (context) {
      var element = context.element,
        entry = context.entry,
        group = context.group,
        propertyName = context.propertyName,
        tab = context.tab;

      return self.isPropertyEditable(propertyName, element, entry, group, tab);
    }
  );
}

export function createCategoryValue(definitions, bpmnFactory) {
  const categoryValue = bpmnFactory.create("bpmn:CategoryValue");

  const category = bpmnFactory.create("bpmn:Category", {
    categoryValue: [categoryValue],
  });

  // add to correct place
  collectionAdd(definitions.get("rootElements"), category);
  getBusinessObject(category).$parent = definitions;
  getBusinessObject(categoryValue).$parent = category;

  return categoryValue;
}

export function getFailedJobRetryTimeCycle(bo) {
  return getExtensionElements(bo, "camunda:FailedJobRetryTimeCycle")[0];
}

export function updateBusinessObject(element, businessObject, newProperties) {
  return {
    cmd: "properties-panel.update-businessobject",
    context: {
      element: element,
      businessObject: businessObject,
      properties: newProperties,
    },
  };
}

export function getProblemViewData(issues = {}) {
  const errors = [];
  const warnings = [];

  for (const [key, value] of Object.entries(issues)) {
    value.forEach((item) => {
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

function isCancelActivity(element) {
  const businessObject = getBusinessObject(element);

  return businessObject && businessObject.cancelActivity !== false;
}

function getEventDefinition(element) {
  const businessObject = getBusinessObject(element),
    eventDefinitions = businessObject.eventDefinitions;

  return eventDefinitions && eventDefinitions[0];
}

function getRawType(type) {
  return type.split(":")[1];
}

function getEventDefinitionPrefix(eventDefinition) {
  const rawType = getRawType(eventDefinition.$type);

  return rawType.replace("EventDefinition", "");
}

function isDefaultFlow(element) {
  const businessObject = getBusinessObject(element);
  const sourceBusinessObject = getBusinessObject(element.source);

  if (!is(element, "bpmn:SequenceFlow") || !sourceBusinessObject) {
    return false;
  }

  return (
    sourceBusinessObject.default &&
    sourceBusinessObject.default === businessObject &&
    (is(sourceBusinessObject, "bpmn:Gateway") ||
      is(sourceBusinessObject, "bpmn:Activity"))
  );
}

function isConditionalFlow(element) {
  const businessObject = getBusinessObject(element);
  const sourceBusinessObject = getBusinessObject(element.source);

  if (!is(element, "bpmn:SequenceFlow") || !sourceBusinessObject) {
    return false;
  }

  return (
    businessObject.conditionExpression &&
    is(sourceBusinessObject, "bpmn:Activity")
  );
}

function isPlane(element) {
  // Backwards compatibility for bpmn-js<8
  const di = element && (element.di || getBusinessObject(element).di);

  return is(di, "bpmndi:BPMNPlane");
}

export function getConcreteType(element) {
  const elementType = element.$type || element.type;

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
export function getElementIcon(element) {
  if (!element) return "";
  const concreteType = getConcreteType(element);
  const colors = getIconColors(element);
  return {
    ...colors,
    icon: iconsByType[concreteType],
    type: concreteType
      .replace(/(\B[A-Z])/g, " $1")
      .replace(/(\bNon Interrupting)/g, "($1)"),
  };
}

function getIconColors(element) {
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
      stroke: STROKE_COLORS[element?.type || element.$type],
      fill: FILL_COLORS[element?.type || element.$type],
    };
  }
}
