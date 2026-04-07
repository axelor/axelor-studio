/**
 * Task handler factories for BpmnRenderer.
 *
 * Contains handlers for: Activity, Task, ServiceTask, UserTask,
 * ManualTask, SendTask, ReceiveTask, ScriptTask, BusinessRuleTask.
 */
import type { BpmnElement } from "@studio/shared/types";

import type { RendererContext, HandlersMap, SvgAttrs } from "./renderer-types";

export function createTaskHandlers(ctx: RendererContext): HandlersMap {
  const {
    drawCircle,
    drawRect,
    drawPath,
    renderer,
    renderEmbeddedLabel,
    attachTaskMarkers,
    defaultFillColor,
    defaultStrokeColor,
    pathMap,
    getFillColor,
    getStrokeColor,
    getSemantic,
    svgAttr,
    DEFAULT_FILL_OPACITY,
    TASK_BORDER_RADIUS,
  } = ctx;

  return {
    "bpmn:Activity": function (parentGfx: SVGElement, element: BpmnElement, attrs?: SvgAttrs) {
      attrs = attrs || {};

      if (!("fillOpacity" in attrs)) {
        attrs.fillOpacity = DEFAULT_FILL_OPACITY;
      }

      return drawRect(parentGfx, element.width, element.height, TASK_BORDER_RADIUS, attrs);
    },

    "bpmn:Task": function (parentGfx: SVGElement, element: BpmnElement) {
      const attrs = {
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      };

      const rect = renderer("bpmn:Activity")(parentGfx, element, attrs);

      renderEmbeddedLabel(parentGfx, element, "center-middle");
      attachTaskMarkers(parentGfx, element);

      return rect;
    },
    "bpmn:ServiceTask": function (parentGfx: SVGElement, element: BpmnElement) {
      const task = renderer("bpmn:Task")(parentGfx, element);

      const pathDataBG = pathMap.getScaledPath("TASK_TYPE_SERVICE", {
        abspos: {
          x: 12,
          y: 18,
        },
      });

      /* service bg */ drawPath(parentGfx, pathDataBG, {
        strokeWidth: 1,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      const fillPathData = pathMap.getScaledPath("TASK_TYPE_SERVICE_FILL", {
        abspos: {
          x: 17.2,
          y: 18,
        },
      });

      /* service fill */ drawPath(parentGfx, fillPathData, {
        strokeWidth: 0,
        fill: getFillColor(element, defaultFillColor),
      });

      const pathData = pathMap.getScaledPath("TASK_TYPE_SERVICE", {
        abspos: {
          x: 17,
          y: 22,
        },
      });

      /* service */ drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      return task;
    },
    "bpmn:UserTask": function (parentGfx: SVGElement, element: BpmnElement) {
      const task = renderer("bpmn:Task")(parentGfx, element);

      const x = 15;
      const y = 12;

      const pathData = pathMap.getScaledPath("TASK_TYPE_USER_1", {
        abspos: {
          x: x,
          y: y,
        },
      });

      /* user path */ drawPath(parentGfx, pathData, {
        strokeWidth: 0.5,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      const pathData2 = pathMap.getScaledPath("TASK_TYPE_USER_2", {
        abspos: {
          x: x,
          y: y,
        },
      });

      /* user2 path */ drawPath(parentGfx, pathData2, {
        strokeWidth: 0.5,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      const pathData3 = pathMap.getScaledPath("TASK_TYPE_USER_3", {
        abspos: {
          x: x,
          y: y,
        },
      });

      /* user3 path */ drawPath(parentGfx, pathData3, {
        strokeWidth: 0.5,
        fill: getStrokeColor(element, defaultStrokeColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      return task;
    },
    "bpmn:ManualTask": function (parentGfx: SVGElement, element: BpmnElement) {
      const task = renderer("bpmn:Task")(parentGfx, element);

      const pathData = pathMap.getScaledPath("TASK_TYPE_MANUAL", {
        abspos: {
          x: 17,
          y: 15,
        },
      });

      /* manual path */ drawPath(parentGfx, pathData, {
        strokeWidth: 0.5, // 0.25,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      return task;
    },
    "bpmn:SendTask": function (parentGfx: SVGElement, element: BpmnElement) {
      const task = renderer("bpmn:Task")(parentGfx, element);

      const pathData = pathMap.getScaledPath("TASK_TYPE_SEND", {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: 21,
        containerHeight: 14,
        position: {
          mx: 0.285,
          my: 0.357,
        },
      });

      /* send path */ drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        fill: getStrokeColor(element, defaultStrokeColor),
        stroke: getFillColor(element, defaultFillColor),
      });

      return task;
    },
    "bpmn:ReceiveTask": function (parentGfx: SVGElement, element: BpmnElement) {
      const semantic = getSemantic(element);

      const task = renderer("bpmn:Task")(parentGfx, element);
      let pathData;

      if (semantic.instantiate) {
        drawCircle(parentGfx, 28, 28, 20 * 0.22, { strokeWidth: 1 });

        pathData = pathMap.getScaledPath("TASK_TYPE_INSTANTIATING_SEND", {
          abspos: {
            x: 7.77,
            y: 9.52,
          },
        });
      } else {
        pathData = pathMap.getScaledPath("TASK_TYPE_SEND", {
          xScaleFactor: 0.9,
          yScaleFactor: 0.9,
          containerWidth: 21,
          containerHeight: 14,
          position: {
            mx: 0.3,
            my: 0.4,
          },
        });
      }

      /* receive path */ drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      return task;
    },
    "bpmn:ScriptTask": function (parentGfx: SVGElement, element: BpmnElement) {
      const task = renderer("bpmn:Task")(parentGfx, element);

      const pathData = pathMap.getScaledPath("TASK_TYPE_SCRIPT", {
        abspos: {
          x: 15,
          y: 20,
        },
      });

      /* script path */ drawPath(parentGfx, pathData, {
        strokeWidth: 1,
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      return task;
    },
    "bpmn:BusinessRuleTask": function (parentGfx: SVGElement, element: BpmnElement) {
      const task = renderer("bpmn:Task")(parentGfx, element);

      const headerPathData = pathMap.getScaledPath("TASK_TYPE_BUSINESS_RULE_HEADER", {
        abspos: {
          x: 8,
          y: 8,
        },
      });

      const businessHeaderPath = drawPath(parentGfx, headerPathData);
      svgAttr(businessHeaderPath, {
        strokeWidth: 1,
        fill: getFillColor(element, "#aaaaaa"),
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      const headerData = pathMap.getScaledPath("TASK_TYPE_BUSINESS_RULE_MAIN", {
        abspos: {
          x: 8,
          y: 8,
        },
      });

      const businessPath = drawPath(parentGfx, headerData);
      svgAttr(businessPath, {
        strokeWidth: 1,
        stroke: getStrokeColor(element, defaultStrokeColor),
      });

      return task;
    },
  };
}
