import propertiesTabs from "./properties/properties";
import { download, getBool, translate } from "../../utils";
import { tabProperty } from "./properties/tabProperty";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import Service from "../../services/Service";
import { SUBPROCESS_TYPES } from "./constants";

export const getProcessBusinessObject = (element, propertyName) => {
  if (!is(element, "bpmn:Participant")) {
    return {};
  }
  let bo = getBusinessObject(element).get("processRef"),
    properties = {};
  properties[propertyName] = bo && bo.get(propertyName);
  return properties;
};

export const fetchId = () => {
  const regexBPMN = /[?&]id=([^&#]*)/g; // ?id=1
  const regexTimeEvent = /[?&]timerTask=([^&#]*)/g; // ?id=1&timerTask=false
  const url = window.location.href;
  let matchBPMNId,
    id,
    matchTimeEvent,
    timerTask = true;
  while ((matchBPMNId = regexBPMN.exec(url))) {
    id = matchBPMNId[1];
  }

  while ((matchTimeEvent = regexTimeEvent.exec(url))) {
    timerTask = getBool(matchTimeEvent[1]);
  }
  return { id, timerTask };
};

export const uploadXml = () => {
  document.getElementById("inputFile").click();
};

export const getType = (element) => {
  if (!element) return;
  const type = (element.type || element.$type).toLowerCase();
  let isProcessLoop = false,
    isProcessSequential = false;
  if (type === "bpmn:subprocess") {
    const { isLoop, isSequential } =
      ensureMultiInstanceSupported(element) || {};
    isProcessLoop = isLoop;
    isProcessLoop = isSequential;
  }
  return type.includes("boundary")
    ? type
    : type.includes("event")
    ? "event"
    : type.includes("task")
    ? "task"
    : type.includes("gateway")
    ? "gateway"
    : type.includes("bpmn:subprocess")
    ? isProcessLoop
      ? isProcessSequential
        ? "multiinstancesequential"
        : "multiinstanceparallel"
      : type
    : type;
};

export const addOldNodes = async (wkf, setWkf, bpmnModeler) => {
  const elements = getElements(bpmnModeler);
  let res = await Service.add("com.axelor.studio.db.WkfModel", {
    ...wkf,
    oldNodes: JSON.stringify(elements),
  });
  if (res && res.data && res.data[0]) {
    setWkf({ ...res.data[0] });
  }
};

function getLoopCharacteristics(element) {
  let bo = getBusinessObject(element);
  return bo && bo.loopCharacteristics;
}

function ensureMultiInstanceSupported(element) {
  let loopCharacteristics = getLoopCharacteristics(element);
  return {
    isLoop:
      loopCharacteristics &&
      loopCharacteristics.$type === "bpmn:MultiInstanceLoopCharacteristics",
    isSequential: loopCharacteristics && loopCharacteristics.isSequential,
  };
}

export const getFlowElements = (process, ele = []) => {
  let elements = [...ele];
  process &&
    process.flowElements &&
    process.flowElements.forEach((element) => {
      if (
        [
          "event",
          "task",
          "gateway",
          "bpmn:callactivity",
          "bpmn:boundaryevent",
        ].includes(getType(element))
      ) {
        elements.push({
          id: element.id,
          name: element.name || element.id,
          type: getType(element),
          baseType: element?.$type,
        });
      } else if (SUBPROCESS_TYPES.includes(getType(element))) {
        if (SUBPROCESS_TYPES.includes(getType(element))) {
          const { isLoop, isSequential } =
            ensureMultiInstanceSupported(element);
          elements.push({
            id: element.id,
            name: element.name || element.id,
            type: isLoop
              ? isSequential
                ? "multiinstancesequential"
                : "multiinstanceparallel"
              : getType(element),
            baseType: element?.$type,
          });
        }
        const nestedElements = getFlowElements(element, []);
        elements = [...elements, ...(nestedElements || [])];
      }
    });
  return elements;
};

export const getElements = (bpmnModeler) => {
  const rootElements =
    bpmnModeler._definitions && bpmnModeler._definitions.rootElements;
  const processes =
    rootElements && rootElements.filter((ele) => ele.$type === "bpmn:Process");
  const allProcess = {};
  processes &&
    processes.forEach((process) => {
      let elements = getFlowElements(process);
      allProcess[process.id] = {
        elements: elements,
      };
    });
  return allProcess;
};

export const getFileName = (modeler) => {
  return modeler?._definitions?.$attrs["camunda:diagramName"];
};

export const saveSVG = async (bpmnModeler, fileName) => {
  const { svg } = await bpmnModeler.saveSVG({ format: true });
  download(
    svg,
    `${fileName || getFileName(bpmnModeler) || "diagram"}.svg`,
    false
  );
};

export const downloadXml = async (bpmnModeler, fileName) => {
  const { xml } = await bpmnModeler.saveXML({ format: true });
  download(xml, `${fileName || getFileName(bpmnModeler) || "diagram"}.bpmn`);
};

export function isGroupVisible(group, element, groupNode) {
  if (typeof group.enabled === "function") {
    return group.enabled(element, groupNode);
  } else {
    return true;
  }
}

export function isHiddenProperty(element, entry, node) {
  if (typeof entry.hidden === "function") {
    return entry.hidden(element, node);
  } else if (typeof entry.showLink === "function") {
    return !entry.showLink(element, node);
  } else {
    return false;
  }
}

export function isTabVisible(tab, element) {
  if (typeof tab.enabled === "function") {
    return tab.enabled(element);
  } else {
    return true;
  }
}

export function renderTabs(tabs = [], element) {
  const type = element.$type || element.type;
  const subType =
    element.businessObject &&
    element.businessObject.eventDefinitions &&
    element.businessObject.eventDefinitions[0].$type;
  const bo =
    tabProperty.find((tab) => tab.type === type && tab.subType === subType) ||
    {};

  const objectTabs = bo && bo.tabs;
  let filteredTabs = [];
  tabs &&
    tabs.forEach((tab) => {
      if (!tab) return;
      if (objectTabs && objectTabs.includes(tab.id)) {
        const isEnable = isTabVisible(tab, element);
        if (isEnable) {
          filteredTabs.push(tab);
        }
      }
    });
  return filteredTabs;
}

export function getTabs(bpmnModeler, element) {
  let canvas = bpmnModeler.get("canvas");
  let elementRegistry = bpmnModeler.get("elementRegistry");
  let bpmnFactory = bpmnModeler.get("bpmnFactory");
  let elementTemplates = bpmnModeler.get("elementTemplates");
  let tabs = propertiesTabs(
    element,
    canvas,
    bpmnFactory,
    elementRegistry,
    elementTemplates,
    translate,
    bpmnModeler
  );
  let filteredTabs = renderTabs(tabs, element);
  return filteredTabs;
}

export function _getCommentsElement(element, create) {
  let bo = element.businessObject;
  let docs = bo && bo.get("documentation");
  let comments;

  // get comments node
  docs.some(function (d) {
    return d.textFormat === "text/x-comments" && (comments = d);
  });

  // create if not existing
  if (!comments && create) {
    comments =
      bo &&
      bo.$model.create("bpmn:Documentation", {
        textFormat: "text/x-comments",
      });
    docs.push(comments);
  }
  return comments;
}

export function getComments(element) {
  let doc = _getCommentsElement(element);
  if (!doc || !doc.text) {
    return [];
  } else {
    return doc.text.split(/;\r?\n;/).map(function (str) {
      return str.split(/:/);
    });
  }
}

export function getCommentsLength(element) {
  const comments = getComments(element);
  return comments && comments.length;
}

export function setComments(element, comments) {
  let doc = _getCommentsElement(element, true);
  let str = comments
    .map(function (c) {
      return c.join(":");
    })
    .join(";\n;");
  doc.text = str;
}

export function addComment(element, author, date, time, comment, id) {
  let comments = getComments(element);
  comments.push([author, date, time, comment, id]);
  setComments(element, comments);
}

export function updateComment(element, comment, value) {
  let comments = getComments(element);
  let idx = -1;
  comments.some(function (c, i) {
    let matches = comment[4] === c[4];
    if (matches) {
      idx = i;
    }
    return matches;
  });
  if (idx !== -1) {
    comments[idx][3] = value;
  }
  setComments(element, comments);
}

export function removeComment(element, comment) {
  let comments = getComments(element);
  let idx = -1;
  comments.some(function (c, i) {
    let matches = comment[4] === c[4];
    if (matches) {
      idx = i;
    }
    return matches;
  });
  if (idx !== -1) {
    comments.splice(idx, 1);
  }
  setComments(element, comments);
}

export function isDefinition(element) {
  return element && element.$type === "bpmn:Definitions";
}

const methods = {
  fetchId,
  uploadXml,
  getElements,
  renderTabs,
  getTabs,
  isGroupVisible,
  isTabVisible,
  addOldNodes,
  getProcessBusinessObject,
  addComment,
  removeComment,
  getComments,
  getCommentsLength,
  isDefinition,
};

export default methods;
