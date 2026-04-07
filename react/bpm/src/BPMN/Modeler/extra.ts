import { translate } from "@studio/shared/i18n";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import type { TypedBpmnModeler, ModdleElement } from "@studio/shared/types";

import { download, getBool } from "../../utils";
import { saveCurrentWkf } from "../../services/wkf-repository";

import propertiesTabs from "./properties/properties";
import { tabProperty } from "./properties/tabProperty";
import { SUBPROCESS_TYPES } from "./constants";
import {
  getDefinitionAttrs as _getDefinitionAttrs,
  getDiagramName,
  getRootElements as _getRootElements,
  getProcesses,
} from "./utils/modeler-api";


interface FlowElement {
  id: string;
  name: string;
  type: string;
  baseType: string;
  [key: string]: unknown;
}

export const getProcessBusinessObject = (
  element: unknown,
  propertyName: string,
): Record<string, unknown> => {
  if (!is(element, "bpmn:Participant")) {
    return {};
  }
  const bo = getBusinessObject(element);
  const processRef = bo.get("processRef") as ModdleElement | undefined;
  const properties: Record<string, unknown> = {};
  properties[propertyName] = processRef?.get(propertyName);
  return properties;
};

export const fetchId = (): { id: string | undefined; timerTask: boolean } => {
  const regexBPMN = /[?&]id=([^&#]*)/g;
  const regexTimeEvent = /[?&]timerTask=([^&#]*)/g;
  const url = window.location.href;
  let matchBPMNId: RegExpExecArray | null;
  let id: string | undefined;
  let matchTimeEvent: RegExpExecArray | null;
  let timerTask: boolean = true;
  while ((matchBPMNId = regexBPMN.exec(url))) {
    id = matchBPMNId[1];
  }

  while ((matchTimeEvent = regexTimeEvent.exec(url))) {
    timerTask = getBool(matchTimeEvent[1]);
  }
  return { id, timerTask };
};

export const uploadXml = (): void => {
  (document.getElementById("inputFile") as HTMLElement)?.click();
};

const getType = (
  element: { type?: string; $type?: string; [key: string]: unknown } | null | undefined,
): string | undefined => {
  if (!element) return;
  const type = ((element.type || element.$type) as string).toLowerCase();
  let isProcessLoop = false;
  let isProcessSequential = false;
  if (type === "bpmn:subprocess") {
    const { isLoop, isSequential } = ensureMultiInstanceSupported(element) || {};
    isProcessLoop = isLoop ?? false;
    isProcessSequential = isSequential ?? false;
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

export const addOldNodes = async (
  wkf: Record<string, unknown> | null | undefined,
  bpmnModeler: TypedBpmnModeler,
): Promise<void> => {
  const elements = getElements(bpmnModeler);
  await saveCurrentWkf({
    ...wkf,
    oldNodes: JSON.stringify(elements),
  } as Record<string, unknown>);
};

function getLoopCharacteristics(element: unknown): Record<string, unknown> | undefined {
  const bo = getBusinessObject(element);
  return (
    bo &&
    ((bo as Record<string, unknown>).loopCharacteristics as Record<string, unknown> | undefined)
  );
}

function ensureMultiInstanceSupported(element: unknown): {
  isLoop: boolean;
  isSequential: boolean;
} {
  const loopCharacteristics = getLoopCharacteristics(element);
  return {
    isLoop:
      !!loopCharacteristics &&
      (loopCharacteristics).$type ===
        "bpmn:MultiInstanceLoopCharacteristics",
    isSequential: !!(loopCharacteristics && loopCharacteristics.isSequential),
  };
}

export const getFlowElements = (
  process: Record<string, unknown> | null | undefined,
  ele: FlowElement[] = [],
): FlowElement[] => {
  let elements = [...ele];
  const flowElements = (process?.flowElements ?? []) as Array<Record<string, unknown>>;
  flowElements.forEach((element) => {
    const elType = getType(element as { type?: string; $type?: string; [key: string]: unknown });
    if (!elType) return;
    if (
      ["event", "task", "gateway", "bpmn:callactivity", "bpmn:boundaryevent"].includes(elType)
    ) {
      elements.push({
        id: element.id as string,
        name: (element.name as string) || (element.id as string),
        type: elType,
        baseType: element?.$type as string,
      });
    } else if (SUBPROCESS_TYPES.includes(elType)) {
      if (SUBPROCESS_TYPES.includes(elType)) {
        const { isLoop, isSequential } = ensureMultiInstanceSupported(element);
        elements.push({
          id: element.id as string,
          name: (element.name as string) || (element.id as string),
          type: isLoop
            ? isSequential
              ? "multiinstancesequential"
              : "multiinstanceparallel"
            : elType,
          baseType: element?.$type as string,
        });
      }
      const nestedElements = getFlowElements(element, []);
      elements = [...elements, ...(nestedElements || [])];
    }
  });
  return elements;
};

export const getElements = (
  bpmnModeler: TypedBpmnModeler,
): Record<string, { elements: FlowElement[] }> => {
  const processes = getProcesses(bpmnModeler);
  const allProcess: Record<string, { elements: FlowElement[] }> = {};
  processes &&
    processes.forEach((process) => {
      const elements = getFlowElements(process as unknown as Record<string, unknown>); // safety: bpmn-js process element lacks typed flowElements property
      allProcess[process.id as string] = {
        elements: elements,
      };
    });
  return allProcess;
};

const getFileName = (modeler: TypedBpmnModeler): string | undefined => {
  return getDiagramName(modeler);
};

export const saveSVG = async (
  bpmnModeler: TypedBpmnModeler | null,
  fileName?: string,
): Promise<void> => {
  if (!bpmnModeler) return;
  const { svg } = await bpmnModeler.saveSVG({ format: true });
  download(svg, `${fileName || getFileName(bpmnModeler) || "diagram"}.svg`, false);
};

export const downloadXml = async (
  bpmnModeler: TypedBpmnModeler | null,
  fileName?: string,
): Promise<void> => {
  if (!bpmnModeler) return;
  const { xml } = await bpmnModeler.saveXML({ format: true });
  download(xml, `${fileName || getFileName(bpmnModeler) || "diagram"}.bpmn`);
};

export function isGroupVisible(
  group: Record<string, unknown>,
  element: unknown,
  groupNode?: unknown,
): boolean {
  if (typeof group.enabled === "function") {
    return (group.enabled as (el: unknown, node?: unknown) => boolean)(element, groupNode);
  } else {
    return true;
  }
}

export function isHiddenProperty(
  element: unknown,
  entry: Record<string, unknown>,
  node?: unknown,
): boolean {
  if (typeof entry.hidden === "function") {
    return (entry.hidden as (el: unknown, node?: unknown) => boolean)(element, node);
  } else if (typeof entry.showLink === "function") {
    return !(entry.showLink as (el: unknown, node?: unknown) => boolean)(element, node);
  } else {
    return false;
  }
}

function isTabVisible(tab: Record<string, unknown>, element: unknown): boolean {
  if (typeof tab.enabled === "function") {
    return (tab.enabled as (el: unknown) => boolean)(element);
  } else {
    return true;
  }
}

function renderTabs(
  tabs: Array<Record<string, unknown>> = [],
  element: Record<string, unknown>,
): Array<Record<string, unknown>> {
  const type = (element.$type || element.type) as string;
  const elementBo = element.businessObject as Record<string, unknown> | undefined;
  const eventDefs = elementBo?.eventDefinitions as Array<Record<string, unknown>> | undefined;
  const subType = eventDefs?.[0]?.$type as string | undefined;

  const tabPropMatch =
    (tabProperty as Array<Record<string, unknown>>).find(
      (tab) => tab.type === type && tab.subType === subType,
    ) ?? {};
  const objectTabs = (tabPropMatch.tabs || []) as string[];

  return tabs.filter((tab) => {
    if (!tab) return false;
    const isEnable = isTabVisible(tab, element);
    return objectTabs.includes(tab.id as string) && isEnable;
  });
}

export function getTabs(
  bpmnModeler: TypedBpmnModeler,
  element: unknown,
): Array<Record<string, unknown>> {
  const canvas = bpmnModeler.get("canvas");
  const elementRegistry = bpmnModeler.get("elementRegistry");
  const bpmnFactory = bpmnModeler.get("bpmnFactory");
  const tabs = propertiesTabs(
    element,
    canvas,
    bpmnFactory,
    elementRegistry,
    translate,
    bpmnModeler,
  );
  const filteredTabs = renderTabs(tabs, element as Record<string, unknown>);
  return filteredTabs;
}

function _getCommentsElement(
  element: Record<string, unknown>,
  create?: boolean,
): Record<string, unknown> | undefined {
  const bo = (element.businessObject ?? element) as unknown as ModdleElement; // safety: bpmn-js element may be raw businessObject without wrapper
  const docs = (bo.get("documentation") ?? bo.documentation ?? []) as Array<
    Record<string, unknown>
  >;
  let comments: Record<string, unknown> | undefined;

  docs.some(function (d) {
    return d.textFormat === "text/x-comments" && (comments = d);
  });

  if (!comments && create) {
    const model = (bo as unknown as Record<string, unknown>).$model as // safety: bpmn-js moddle $model property not in typed interface
      | { create: (type: string, attrs: Record<string, unknown>) => Record<string, unknown> }
      | undefined;
    comments = model?.create("bpmn:Documentation", {
      textFormat: "text/x-comments",
    });
    if (comments) docs.push(comments);
  }
  return comments;
}

export function getComments(element: unknown): string[][] {
  const doc = _getCommentsElement(element as Record<string, unknown>);
  if (!doc || !doc.text) {
    return [];
  } else {
    return (doc.text as string).split(/;\r?\n;/).map(function (str: string) {
      return str.split(/:/);
    });
  }
}

export function getCommentsLength(element: unknown): number {
  const comments = getComments(element as Record<string, unknown>);
  return comments && comments.length;
}

function setComments(element: Record<string, unknown>, comments: string[][]): void {
  const doc = _getCommentsElement(element, true);
  if (!doc) return;
  const str = comments
    .map(function (c: string[]) {
      return c.join(":");
    })
    .join(";\n;");
  doc.text = str;
}

export function addComment(
  element: unknown,
  author: string,
  date: string,
  time: string,
  comment: string,
  id: string,
): void {
  const comments = getComments(element as Record<string, unknown>);
  comments.push([author, date, time, comment, id]);
  setComments(element as Record<string, unknown>, comments);
}

export function updateComment(
  element: unknown,
  comment: string[],
  value: string,
): void {
  const el = element as Record<string, unknown>;
  const comments = getComments(el);
  let idx = -1;
  comments.some(function (c: string[], i: number) {
    const matches = comment[4] === c[4];
    if (matches) {
      idx = i;
    }
    return matches;
  });
  if (idx !== -1) {
    comments[idx][3] = value;
  }
  setComments(el, comments);
}

export function removeComment(element: unknown, comment: string[]): void {
  const el = element as Record<string, unknown>;
  const comments = getComments(el);
  let idx = -1;
  comments.some(function (c: string[], i: number) {
    const matches = comment[4] === c[4];
    if (matches) {
      idx = i;
    }
    return matches;
  });
  if (idx !== -1) {
    comments.splice(idx, 1);
  }
  setComments(el, comments);
}

export function isDefinition(element: unknown): boolean {
  return !!element && (element as Record<string, unknown>).$type === "bpmn:Definitions";
}

export function getNameProperty(element?: { type?: string } | unknown): string {
  const el = element as { type?: string } | null | undefined;
  return el?.type === "bpmn:TextAnnotation"
    ? "text"
    : el?.type === "bpmn:Group"
      ? "categoryValue"
      : "name";
}

