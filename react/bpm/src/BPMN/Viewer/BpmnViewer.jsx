import React, { useState, useEffect } from "react";
import BpmnModeler from "bpmn-js/lib/Modeler";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";

import Service from "../../services/Service";
import readOnlyModule from "./custom/readonly";
import { download, getBool, translate } from "../../utils";
import {
  getInfo,
  getProcessInstance,
  getTranslations,
} from "../../services/api";
import { Logo } from "../../components/Logo";
import { getElements } from "../Modeler/extra";
import Alert from "../../components/Alert";

import { Box, CommandBar } from "@axelor/ui";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "../css/bpmn.css";
import styles from "./bpmn-viewer.module.css";

let bpmnViewer = null;

export const FILL_COLORS = {
  "bpmn:Task": "#cfe7f4",
  "bpmn:UserTask": "#c5ebf3",
  "bpmn:SendTask": "#fddeb3",
  "bpmn:ReceiveTask": "#fde8b3",
  "bpmn:ManualTask": "#c5e0fc",
  "bpmn:BusinessRuleTask": "#f8cfde",
  "bpmn:ServiceTask": "#c5ece4",
  "bpmn:ScriptTask": "#ffeed4",
  "bpmn:CallActivity": "#fee5bf",
  "bpmn:SubProcess": "#E4EBF8",
  "bpmn:SequenceFlow": "#8095B3",
  "bpmn:StartEvent": "#ccecc6",
  "bpmn:EndEvent": "#ffd4c7",
  "bpmn:Gateway": "#fdecb3",
  "bpmn:IntermediateThrowEvent": "#ffe0b3",
  "bpmn:IntermediateCatchEvent": "#ffe0b3",
};

export const STROKE_COLORS = {
  "bpmn:Task": "#5EAEDA",
  "bpmn:UserTask": "#3FBDD6",
  "bpmn:SendTask": "#F79000",
  "bpmn:ReceiveTask": "#F8B200",
  "bpmn:ManualTask": "#3F97F6",
  "bpmn:BusinessRuleTask": "#E76092",
  "bpmn:ServiceTask": "#3EBFA5",
  "bpmn:ScriptTask": "#FF9E0F",
  "bpmn:CallActivity": "#FBA729",
  "bpmn:SubProcess": "#6097fc",
  "bpmn:SequenceFlow": "#8095B3",
  "bpmn:StartEvent": "#55c041",
  "bpmn:EndEvent": "#ff7043",
  "bpmn:Gateway": "#f9c000",
  "bpmn:IntermediateThrowEvent": "#ff9800",
  "bpmn:IntermediateCatchEvent": "#ff9800",
  "bpmn:Participant": "#c8c8c8",
  "bpmn:Lane": "#c8c8c8",
  "bpmn:Group": "#c8c8c8",
  "bpmn:Association": "#8095B3",
  "bpmn:TextAnnotation": "#A9B1BD",
};

const updateTranslations = async (nodes) => {
  nodes &&
    Object.entries(nodes).forEach(async ([id, value]) => {
      let { element } = value;
      const bo = getBusinessObject(element);
      const key = bo.$attrs["camunda:key"];
      if (!key || !element) return;
      const isTranslation =
        (bo.$attrs && bo.$attrs["camunda:isTranslations"]) || false;
      if (!getBool(isTranslation)) return;
      const translations = await getTranslations(key);
      if (translations && translations.length > 0) {
        const info = await getInfo();
        const language = info?.user?.lang;
        if (!language) return;
        const selectedTranslation = translations.find(
          (t) => t.language === language
        );
        const value = selectedTranslation && selectedTranslation.message;
        const elementType = element && element.type;
        let modelProperty =
          elementType === "bpmn:TextAnnotation"
            ? "text"
            : elementType === "bpmn:Group"
            ? "categoryValue"
            : "name";
        const name = bo[modelProperty];
        const newKey = bo.$attrs["camunda:key"];
        const diagramValue = value || newKey || name;
        element.businessObject[modelProperty] = diagramValue;
        let elementRegistry = bpmnViewer.get("elementRegistry");
        let modeling = bpmnViewer.get("modeling");
        let shape = elementRegistry.get(element.id);
        modeling &&
          modeling.updateProperties(shape, {
            [modelProperty]: diagramValue,
          });
      }
    });
};

const fetchId = (isInstance, propUrl) => {
  const regexBPMN = /[?&]id=([^&#]*)/g; // ?id=1
  const regexBPMNTask = /[?&]taskIds=([^&#]*)/g; // ?id=1&taskIds=1,2
  const regexBPMNActivityCounts = /[?&]activityCount=([^&#]*)/g; // ?id=1&taskIds=1,2&activityCount=activiti1:1,activit2:1,activit3:2,activit4:1
  const regexBPMNInstanceId = /[?&]instanceId=([^&#]*)/g; // ?instanceId=1&taskIds=1,2&activityCount=activiti1:1,activit2:1,activit3:2,activit4:1
  const regexBPMNErrorNode = /[?&]node=([^&#]*)/g; // ?instanceId=1&taskIds=1,2&activityCount=activiti1:1,activit2:1,activit3:2,activit4:1&node=activity1

  const url = propUrl || window.location.href;
  let matchBPMNId,
    matchBPMNTasksId,
    matchActivityCounts,
    activityCounts,
    matchInstanceId,
    id,
    taskIds,
    matchErrorNode,
    errorNode;

  while ((matchBPMNTasksId = regexBPMNTask.exec(url))) {
    let ids = matchBPMNTasksId[1];
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
};

const fetchDiagram = async (id, taskIds, activityCounts, errorNode) => {
  if (id) {
    let res = await Service.fetchId("com.axelor.studio.db.WkfModel", id);
    const wkf = (res && res.data && res.data[0]) || {};
    const { diagramXml } = wkf;
    openDiagramImage(id, taskIds, diagramXml, activityCounts, errorNode);
  }
};

const fetchInstanceDiagram = async (id, taskIds, activityCounts, errorNode) => {
  if (id) {
    let actionRes = await Service.action({
      model: "com.axelor.studio.db.WkfModel",
      action: "action-wkf-instance-method-get-instance-xml",
      data: {
        context: {
          _model: "com.axelor.studio.db.WkfModel",
          instanceId: id,
        },
      },
    });
    if (
      actionRes &&
      actionRes.data &&
      actionRes.data[0] &&
      actionRes.data[0].values
    ) {
      const { xml } = actionRes.data[0].values;
      openDiagramImage(id, taskIds, xml, activityCounts, errorNode);
    }
  }
};

const openDiagramImage = async (
  instanceId,
  taskIds,
  diagramXml,
  activityCounts,
  errorNode
) => {
  if (!diagramXml) return;
  try {
    await bpmnViewer.importXML(diagramXml);
    let canvas = bpmnViewer.get("canvas");
    canvas.zoom("fit-viewport", "auto");
    bpmnViewer.get("readOnly").readOnly(true);
    let elementRegistry = bpmnViewer.get("elementRegistry");
    let nodes = elementRegistry && elementRegistry._elements;
    if (!nodes) return;
    updateTranslations(nodes);
    Object.entries(nodes).forEach(([key, value]) => {
      if (!value) return;
      const { element } = value;
      if (!element) return;
      let modeling = bpmnViewer.get("modeling");
      if (modeling && element.businessObject && element.di) {
        let type = is(element, ["bpmn:Gateway"])
          ? "bpmn:Gateway"
          : element.type;
        modeling.setColor(element, {
          stroke: element.di.stroke || STROKE_COLORS[type],
          fill: element.di.fill || FILL_COLORS[type],
        });
      }
    });
    let filteredElements = Object.keys(nodes).filter(
      (element) => taskIds && taskIds.includes(element)
    );
    filteredElements.forEach((element) => {
      const outgoingGfx = elementRegistry.getGraphics(element);
      const visual = outgoingGfx && outgoingGfx.querySelector(".djs-visual");
      const rec = visual && visual.childNodes && visual.childNodes[0];
      if (rec && rec.style) {
        rec.style.strokeWidth = "5px";
        rec.style.stroke = "#006400";
      }
    });

    const activities = activityCounts?.split(",") || [];
    const overlayActivies = [];
    const nodeKeys = Object.keys(nodes) || [];
    if (nodeKeys.length < 1) return;
    if (activities.length <= 0) return;
    activities.forEach((activity) => {
      let taskActivity = activity.split(":");
      if (nodeKeys.includes(taskActivity[0])) {
        overlayActivies.push({
          id: taskActivity[0],
          count: taskActivity[1],
        });
      }
    });

    let overlays = bpmnViewer.get("overlays");
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
    const { currentError, "wkfProcess.wkfModel": { id } = {} } =
      (await getProcessInstance(instanceId)) || {};
    const isSuccessTokenExist = overlayActivies?.find(
      (act) => act.id === errorNode
    );
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
        "BPM editor"
      )}')">
          ${translate("Fix in BPM Editor")}
          </button>
        </div>
          </div>`,
    });
  } catch (err) {
    return console.error("could not import BPMN 2.0 diagram", err);
  }
};

const zoomIn = () => {
  bpmnViewer.get("zoomScroll").stepZoom(1);
};

const zoomOut = () => {
  bpmnViewer.get("zoomScroll").stepZoom(-1);
};

const resetZoom = () => {
  bpmnViewer.get("canvas").zoom("fit-viewport");
};

function BpmnViewerComponent({ isInstance }) {
  const [node, setNode] = useState(null);
  const [id, setId] = useState(null);
  const [openSnackbar, setSnackbar] = useState({
    open: false,
    messageType: null,
    message: null,
  });
  const [activityIds, setActivityIds] = useState(null);
  const [taskIds, setTaskIds] = useState(null);
  const [activityCounts, setActivityCounts] = useState(null);
  const [activeProcessId, setActiveProcessId] = useState(null);

  const saveSVG = async () => {
    const { svg } = await bpmnViewer.saveSVG({ format: true });
    download(svg, "diagram.svg", false);
  };

  const commandItems = [
    {
      key: "download",
      iconOnly: true,
      description: translate("Download SVG"),
      iconProps: { icon: "photo" },
      onClick: saveSVG,
    },
    {
      key: "zoom-in",
      iconOnly: true,
      description: translate("Zoom in"),
      iconProps: { icon: "add" },
      onClick: zoomIn,
    },
    {
      key: "zoom-out",
      iconOnly: true,
      description: translate("Zoom out"),
      iconProps: { icon: "remove" },
      onClick: zoomOut,
    },
    {
      key: "zoom-reset",
      iconOnly: true,
      description: translate("Reset zoom"),
      iconProps: { icon: "refresh" },
      onClick: resetZoom,
    },
  ];

  const handleSnackbarClick = (messageType, message) => {
    setSnackbar({
      open: true,
      messageType,
      message,
    });
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar({
      open: false,
      messageType: null,
      message: null,
    });
  };

  const restartBefore = async () => {
    if (!isInstance || !node || !activityIds || !activityIds.includes(node.id))
      return;
    let actionRes = await Service.action({
      model: "com.axelor.studio.db.WkfModel",
      action: "action-wkf-instance-method-restart-instance",
      data: {
        context: {
          _model: "com.axelor.studio.db.WkfModel",
          processInstanceId: id,
          activityId: node && node.id,
          processId: activeProcessId,
        },
      },
    });
    if (
      actionRes &&
      actionRes.status === 0 &&
      actionRes?.data &&
      !actionRes?.data[0]?.error
    ) {
      handleSnackbarClick("success", "Restarted successfully");
      const { updatedUrl } = actionRes?.data[0]?.values || {};
      const { id, taskIds, activityCounts, errorNode } = fetchId(
        true,
        updatedUrl
      );
      fetchInstanceDiagram(id, taskIds, activityCounts, errorNode);
    } else {
      handleSnackbarClick(
        "danger",
        (actionRes?.data && actionRes?.data[0]?.error?.message) ||
          actionRes?.data?.message ||
          actionRes?.data?.title ||
          "Error"
      );
    }
    setNode(null);
  };

  const cancelNode = async () => {
    if (!isInstance || !node || !(taskIds && taskIds.includes(node.id))) return;
    let actionRes = await Service.action({
      model: "com.axelor.studio.db.WkfModel",
      action: "action-wkf-instance-method-cancel-node",
      data: {
        context: {
          _model: "com.axelor.studio.db.WkfModel",
          processInstanceId: id,
          activityId: node && node.id,
          processId: activeProcessId,
        },
      },
    });
    if (actionRes && actionRes.status === 0) {
      handleSnackbarClick("success", "Cancelled successfully");
      fetchInstanceDiagram(id, taskIds, activityCounts);
    } else {
      handleSnackbarClick(
        "danger",
        (actionRes &&
          actionRes.data &&
          (actionRes.data.message || actionRes.data.title)) ||
          "Error"
      );
    }
    setNode(null);
  };

  useEffect(() => {
    bpmnViewer = new BpmnModeler({
      container: "#canvas-task",
      additionalModules: [readOnlyModule],
    });
    let { id, taskIds, activityCounts, errorNode } = fetchId(isInstance) || {};
    setId(id);
    setTaskIds(taskIds);
    setActivityCounts(activityCounts);
    if (isInstance) {
      const activities = (activityCounts && activityCounts.split(",")) || [];
      const ids = [];
      activities?.forEach((activity) => {
        let taskActivity = activity?.split(":");
        if (taskActivity) {
          ids.push(taskActivity[0]);
        }
      });
      setActivityIds(ids);
      fetchInstanceDiagram(id, taskIds, activityCounts, errorNode);
    } else {
      fetchDiagram(id, taskIds, activityCounts, errorNode);
    }
  }, [isInstance]);

  useEffect(() => {
    if (!bpmnViewer) return;
    if (isInstance) {
      bpmnViewer.on("element.click", (event) => {
        const { element } = event || {};
        setNode(element);

        /** Find node process id */
        const elements = getElements(bpmnViewer);
        let processId;
        Object.entries(elements).forEach(([key, value], index) => {
          if (value?.elements?.find((v) => v?.id === element?.id)) {
            processId = key;
            return;
          }
        });
        setActiveProcessId(processId);
      });
    }
    bpmnViewer.on("shape.changed", (event) => {
      const { element } = event || {};
      let elementRegistry = bpmnViewer.get("elementRegistry");
      if (element && taskIds && taskIds.includes(element.id)) {
        const outgoingGfx = elementRegistry.getGraphics(element.id);
        const visual = outgoingGfx && outgoingGfx.querySelector(".djs-visual");
        const rec = visual && visual.childNodes && visual.childNodes[0];
        if (rec && rec.style) {
          rec.style.strokeWidth = "5px";
          rec.style.stroke = "#006400";
        }
      }
    });
  }, [isInstance, taskIds, activityCounts]);

  const getItems = React.useMemo(() => {
    return !isInstance
      ? commandItems
      : activityIds?.includes(node?.id)
      ? [
          ...commandItems,
          {
            key: "restart",
            text: translate("Restart"),
            onClick: restartBefore,
          },
        ]
      : taskIds?.includes(node?.id)
      ? [
          ...commandItems,
          {
            key: "cancel",
            text: translate("Cancel node"),
            onClick: cancelNode,
          },
        ]
      : commandItems;
  }, [isInstance, activityIds, taskIds, node]);

  return (
    <React.Fragment>
      <Box d="flex" position="absolute" className={styles.container}>
        <CommandBar items={getItems} className={styles.commandButtons} />
      </Box>
      <div id="canvas-task"></div>
      {openSnackbar.open && (
        <Alert
          open={openSnackbar.open}
          messageType={openSnackbar.messageType}
          message={openSnackbar.message}
          onClose={handleSnackbarClose}
        />
      )}
      <Logo />
    </React.Fragment>
  );
}

export default BpmnViewerComponent;
