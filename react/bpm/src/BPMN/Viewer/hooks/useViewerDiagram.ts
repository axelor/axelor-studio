import { useCallback } from "react";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import Service from "@studio/shared/services/Service";
import type { WkfModel } from "@studio/shared/types";
import { translate } from "@studio/shared/i18n";
import type BpmnModelerCtor from "bpmn-js/lib/Modeler";

import { getBool } from "../../../utils";
import { getInfo, getProcessInstance, getTranslations } from "../../../shared/services";
import { FILL_COLORS, STROKE_COLORS } from "../viewer-colors";
type BpmnModeler = InstanceType<typeof BpmnModelerCtor>;

interface ViewerParams {
  id?: string;
  taskIds?: string[];
  activityCounts?: string;
  errorNode?: string;
}

/**
 * Parse URL parameters for BPMN viewer (id, taskIds, activityCounts, errorNode).
 */
export const fetchId = (isInstance?: boolean, propUrl?: string): ViewerParams => {
  const regexBPMN = /[?&]id=([^&#]*)/g;
  const regexBPMNTask = /[?&]taskIds=([^&#]*)/g;
  const regexBPMNActivityCounts = /[?&]activityCount=([^&#]*)/g;
  const regexBPMNInstanceId = /[?&]instanceId=([^&#]*)/g;
  const regexBPMNErrorNode = /[?&]node=([^&#]*)/g;

  const url = propUrl || window.location.href;
  let matchBPMNId: RegExpExecArray | null,
    matchBPMNTasksId: RegExpExecArray | null,
    matchActivityCounts: RegExpExecArray | null,
    activityCounts: string | undefined,
    matchInstanceId: RegExpExecArray | null,
    id: string | undefined,
    taskIds: string[] | undefined,
    matchErrorNode: RegExpExecArray | null,
    errorNode: string | undefined;

  while ((matchBPMNTasksId = regexBPMNTask.exec(url))) {
    const ids = matchBPMNTasksId[1];
    taskIds = ids.split(",");
  }
  while ((matchActivityCounts = regexBPMNActivityCounts.exec(url))) {
    activityCounts = matchActivityCounts[1];
  }
  while ((matchErrorNode = regexBPMNErrorNode.exec(url))) {
    errorNode = matchErrorNode[1];
  }
  if (isInstance) {
    while ((matchInstanceId = regexBPMNInstanceId.exec(url))) {
      id = matchInstanceId[1];
      return { id, taskIds, activityCounts, errorNode };
    }
  } else {
    while ((matchBPMNId = regexBPMN.exec(url))) {
      id = matchBPMNId[1];
      return { id, taskIds, activityCounts, errorNode };
    }
  }
  return {};
};

/**
 * Update element labels with translation values from API.
 */
const updateTranslations = async (viewer: BpmnModeler, elements: Record<string, unknown>[]) => {
  elements &&
    elements.forEach(async (element) => {
      if (!element) return;
      const bo = getBusinessObject(element);
      const key = (bo.$attrs as Record<string, string>)["camunda:key"];
      if (!key || !element) return;
      const isTranslation =
        ((bo.$attrs as Record<string, unknown>) &&
          (bo.$attrs as Record<string, string>)["camunda:isTranslations"]) ||
        false;
      if (!getBool(isTranslation)) return;
      const translations = await getTranslations(key);
      if (translations && (translations as Record<string, unknown>[]).length > 0) {
        const info = await getInfo();
        const language = (info as Record<string, Record<string, string>>)?.user?.lang;
        if (!language) return;
        const selectedTranslation = (translations as Record<string, unknown>[]).find(
          (t) => t.language === language,
        );
        const value =
          selectedTranslation && (selectedTranslation as Record<string, string>).message;
        const elementType = element && (element as Record<string, string>).type;
        const modelProperty =
          elementType === "bpmn:TextAnnotation"
            ? "text"
            : elementType === "bpmn:Group"
              ? "categoryValue"
              : "name";
        const name = (bo as Record<string, unknown>)[modelProperty];
        const newKey = (bo.$attrs as Record<string, string>)["camunda:key"];
        const diagramValue = value || newKey || name;
        (element as Record<string, Record<string, unknown>>).businessObject[modelProperty] =
          diagramValue;
        const elementRegistry = viewer.get("elementRegistry") as Record<
          string,
          (...args: unknown[]) => unknown
        >;
        const modeling = viewer.get("modeling") as Record<
          string,
          (...args: unknown[]) => unknown
        > | null;
        const shape = elementRegistry.get((element as Record<string, string>).id);
        modeling &&
          modeling.updateProperties(shape, {
            [modelProperty]: diagramValue,
          });
      }
    });
};

/**
 * Open and render a BPMN diagram image with colors, highlights, overlays, and error nodes.
 */
const openDiagramImage = async (
  viewer: BpmnModeler,
  instanceId: string | undefined,
  taskIds: string[] | null | undefined,
  diagramXml: string | undefined,
  activityCounts: string | undefined,
  errorNode: string | undefined,
) => {
  if (!diagramXml) return;
  try {
    await viewer.importXML(diagramXml);
    const canvas = viewer.get("canvas") as Record<string, (...args: unknown[]) => unknown>;
    canvas.zoom("fit-viewport", "auto");
    (viewer.get("readOnly") as Record<string, (...args: unknown[]) => unknown>).readOnly(true);
    const elementRegistry = viewer.get("elementRegistry") as Record<
      string,
      (...args: unknown[]) => unknown
    >;
    const allElements = elementRegistry
      ? (elementRegistry.getAll() as Record<string, unknown>[])
      : [];
    if (!allElements.length) return;
    updateTranslations(viewer, allElements);
    allElements.forEach((element) => {
      if (!element) return;
      const modeling = viewer.get("modeling") as Record<string, (...args: unknown[]) => unknown>;
      if (
        modeling &&
        (element).businessObject &&
        (element).di
      ) {
        const type = is(element, ["bpmn:Gateway"])
          ? "bpmn:Gateway"
          : (element as Record<string, string>).type;
        modeling.setColor(element, {
          stroke:
            (element as Record<string, Record<string, string>>).di?.stroke || STROKE_COLORS[type],
          fill: (element as Record<string, Record<string, string>>).di?.fill || FILL_COLORS[type],
        });
      }
    });
    const filteredElements = allElements
      .map((el) => (el as Record<string, string>).id)
      .filter((id) => taskIds && taskIds.includes(id));
    filteredElements.forEach((element) => {
      const outgoingGfx = elementRegistry.getGraphics(element) as HTMLElement | null;
      const visual = outgoingGfx && outgoingGfx.querySelector(".djs-visual");
      const rec = visual && visual.childNodes && (visual.childNodes[0] as HTMLElement);
      if (rec && rec.style) {
        rec.style.strokeWidth = "5px";
        rec.style.stroke = "#006400";
      }
    });

    const activities = activityCounts?.split(",") || [];
    const overlayActivies: Array<{ id: string; count: string }> = [];
    const nodeKeys = allElements.map((el) => (el as Record<string, string>).id);
    if (nodeKeys.length < 1) return;
    if (activities.length <= 0) return;
    activities.forEach((activity) => {
      const taskActivity = activity.split(":");
      if (taskActivity.length >= 2 && nodeKeys.includes(taskActivity[0])) {
        overlayActivies.push({
          id: taskActivity[0],
          count: taskActivity[1],
        });
      }
    });

    const overlays = viewer.get("overlays") as Record<string, (...args: unknown[]) => unknown>;
    if (overlayActivies.length <= 0) return;
    overlayActivies.forEach((overlayActivity) => {
      overlays.add(overlayActivity.id, "note", {
        position: {
          bottom: 18,
          right: 18,
        },
        html: `<div class="diagram-note">${overlayActivity.count}</div>`,
      });
    });

    if (!errorNode) return;
    if (!instanceId) return;
    const processInstanceResult = (await getProcessInstance(instanceId)) as Record<
      string,
      unknown
    > | null;
    const currentError = processInstanceResult?.currentError;
    const wkfProcess = processInstanceResult?.["wkfProcess.wkfModel"] as
      | Record<string, unknown>
      | undefined;
    const id = wkfProcess?.id;
    const isSuccessTokenExist = overlayActivies?.find((act) => act.id === errorNode);
    overlays.add(errorNode, "note", {
      position: {
        bottom: 18,
        right: isSuccessTokenExist ? 45 : 18,
      },
      html: `<div id="targetElement" class="diagram-error-note">
        <div class="error-count">!</div>
        <div class="error-popup">
          <h2>Error: Failed BPMN Process</h2>
          <div class="error-details">
            <p class="error-code">Node:  ${errorNode}</p>
            <p class="error-message">${currentError || ""}</p>
          </div>
          <button class="error-fix-btn" onclick="window.top?.axelor?.$openHtmlTab('bpm/?id=${id}&node=${errorNode}','${translate(
            "BPM editor",
          )}')">
          ${translate("Fix in BPM Editor")}
          </button>
        </div>
          </div>`,
    });
  } catch (err) {
    console.error("[BpmnViewer] could not import BPMN 2.0 diagram", err);
    return;
  }
};

/**
 * Hook providing diagram loading functions for the BPMN viewer.
 * Accepts a viewer ref (replaces singleton pattern).
 */
export function useViewerDiagram(viewerRef: React.MutableRefObject<BpmnModeler | null>) {
  const fetchDiagram = useCallback(
    async (
      id: string | undefined,
      taskIds: string[] | null | undefined,
      activityCounts: string | undefined,
      errorNode: string | undefined,
    ) => {
      if (id && viewerRef.current) {
        const res = await Service.fetchId<WkfModel>("com.axelor.studio.db.WkfModel", id);
        const wkf = res?.data?.[0];
        const diagramXml = wkf?.diagramXml;
        openDiagramImage(viewerRef.current, id, taskIds, diagramXml, activityCounts, errorNode);
      }
    },
    [viewerRef],
  );

  const fetchInstanceDiagram = useCallback(
    async (
      id: string | undefined,
      taskIds: string[] | null | undefined,
      activityCounts: string | undefined,
      errorNode?: string  ,
    ) => {
      if (id && viewerRef.current) {
        const actionRes = await Service.action({
          model: "com.axelor.studio.db.WkfModel",
          action: "action-wkf-instance-method-get-instance-xml",
          data: {
            context: {
              _model: "com.axelor.studio.db.WkfModel",
              instanceId: id,
            },
          },
        });
        const xml = (actionRes?.data?.[0]?.values as { xml?: string } | undefined)?.xml;
        if (xml) {
          openDiagramImage(viewerRef.current, id, taskIds, xml, activityCounts, errorNode);
        }
      }
    },
    [viewerRef],
  );

  return { fetchDiagram, fetchInstanceDiagram, fetchId };
}
