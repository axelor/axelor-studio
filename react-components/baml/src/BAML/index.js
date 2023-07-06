import React, { useEffect, useState } from "react";
import Alert from "@material-ui/lab/Alert";
import {
  Drawer,
  Typography,
  IconButton,
  Tooltip,
  Snackbar,
} from "@material-ui/core";
import { Resizable } from "re-resizable";

import Service from "../services/Service";
import BpmnModeler from "./main/baml-js/lib/Modeler";
import customControlsModule from "./custom";
import ScriptBox from "./views/ScriptBox";
import ExtendedQuery from "./views/ExtendedQueryProps";
import Builder from "./views/Builder";
import FieldBuilder from "./views/FieldBuilder";
import { Textbox, TextField, SelectBox, Checkbox, Select } from "./components";
import { tabProperty } from "./tabProperty";
import { download, translate } from "../utils";
import { Panorama, Publish, GetApp, Save, Code } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";

import "./main/baml-js/assets/diagram-js.css";
import "../BAML/main/baml-font/css/bpmn.css";
import "./css/bpmn.css";

const resizeStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderLeft: "solid 1px #ddd",
  background: "#f0f0f0",
};

const useStyles = makeStyles(() => ({
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    background: "#F8F8F8",
    width: "100%",
    position: "absolute",
    borderLeft: "1px solid #ccc",
    overflow: "auto",
    height: "100%",
    textAlign: "left",
  },
  drawerContainer: {
    padding: 10,
    height: "100%",
  },
  nodeTitle: {
    fontSize: "120%",
    fontWeight: "bolder",
  },
  propertyLable: {
    fontSize: 13,
    fontWeight: "bolder",
    margin: "10px 0px",
  },
  icon: {
    color: "black",
    width: "1.2em",
    height: "1.2em",
  },
  btnContainer: {
    border: "1px solid #dcdc",
    background: "#F8F8F8",
  },
  iconButton: {
    padding: "5px 15px",
  },
}));

const drawerWidth = 380;

const defaultXml = `<?xml version="1.0" encoding="UTF-8" ?>
<process-actions 
  xmlns:xs="http://www.w3.org/2001/XMLSchema-instance" 
  xs:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" 
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
  id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn">
  <process-action id="ProcessAction_1">
  </process-action>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</process-actions>`;

const saveSVG = (bpmnModeler) => {
  bpmnModeler.saveSVG({ format: true }, async function (err, svg) {
    download(svg, "diagram.svg");
  });
};

const getStartElements = (type, types, elements) => {
  return elements.filter(
    (e) =>
      e.element &&
      e.element.incoming &&
      e.element.incoming.length === 0 &&
      (e.element.parent && e.element.parent.type) === type &&
      ![
        "bpmn:Process-action",
        "bpmn:SequenceFlow",
        "bpmn:TextAnnotation",
        "label",
        ...types,
      ].includes(e.element.type)
  );
};

const getSequencedChildElements = (
  startElements,
  flowElements,
  sequenceFlows
) => {
  if (!startElements) return;
  startElements.forEach((startElement) => {
    let start = startElement.element && startElement.element.businessObject;
    if (
      startElement.element &&
      (startElement.element.type === "bpmn:Loop" ||
        startElement.element.type === "bpmn:Conditional")
    ) {
      let ele = updateChildFlowElements(
        startElement.element && startElement.element.businessObject,
        startElement.element.type
      );
      start = ele ? ele : start;
    }
    flowElements.push(start);
    const seqFlow = sequenceFlows.find(
      (f) =>
        f.sourceRef.id === (startElement.element && startElement.element.id)
    );
    if (seqFlow) {
      const targetElement = seqFlow.targetRef;
      let target = targetElement;
      if (
        targetElement.type === "bpmn:Loop" ||
        targetElement.$type === "bpmn:Loop" ||
        targetElement.type === "bpmn:Conditional" ||
        targetElement.$type === "bpmn:Conditional"
      ) {
        let ele = updateChildFlowElements(
          targetElement,
          targetElement.type || targetElement.$type
        );
        target = ele ? ele : target;
      }
      flowElements.push(target);
      flowElements.push(seqFlow);
      const newElements = addFlowElements(
        flowElements,
        sequenceFlows,
        targetElement
      );
      flowElements = newElements ? newElements : flowElements;
    }
  });
  return flowElements;
};

const updateChildFlowElements = (element, type) => {
  if (!element) return;
  const elements = element.flowElements;
  if (!elements) return;
  const sequenceFlows = elements.filter(
    (e) =>
      (e.type || e.$type || (e.element && e.element.type)) ===
      "bpmn:SequenceFlow"
  );
  const elementIds = elements.map((e) => e.id);
  let elementRegistry = bpmnModeler.get("elementRegistry");
  let nodes = elementRegistry && elementRegistry._elements;
  const allElements = Object.values(nodes) || [];
  const basicElements = allElements.filter((e) =>
    elementIds.includes(e.element && e.element.id)
  );
  const startElements = getStartElements(type, [type], basicElements);
  let flowElements = getSequencedChildElements(
    startElements,
    [],
    sequenceFlows
  );
  element.flowElements = flowElements;
  return element;
};

const addFlowElements = (flowElements, sequenceFlows, source) => {
  const seqFlow = sequenceFlows.find(
    (f) =>
      ((f.sourceRef && f.sourceRef.id) ||
        f.element.businessObject.sourceRef.id) === source.id
  );
  if (seqFlow) {
    const targetElement =
      seqFlow.targetRef || seqFlow.element.businessObject.targetRef;
    let target = targetElement;
    if (
      targetElement.type === "bpmn:Loop" ||
      targetElement.$type === "bpmn:Loop" ||
      targetElement.type === "bpmn:Conditional" ||
      targetElement.$type === "bpmn:Conditional"
    ) {
      let ele = updateChildFlowElements(
        targetElement,
        targetElement.type || targetElement.$type
      );
      target = ele ? ele : target;
    }
    flowElements.push(target);
    flowElements.push(
      (seqFlow.element && seqFlow.element.businessObject) || seqFlow
    );
    addFlowElements(flowElements, sequenceFlows, targetElement);
  } else {
    return flowElements;
  }
};

const getSequencedFlowElements = (
  startElements,
  flowElements,
  sequenceFlows
) => {
  if (!startElements) return;
  startElements.forEach((startElement) => {
    let start = startElement.element && startElement.element.businessObject;
    if (
      startElement.element &&
      (startElement.element.type === "bpmn:Loop" ||
        startElement.element.type === "bpmn:Conditional")
    ) {
      let ele = updateChildFlowElements(
        startElement.element && startElement.element.businessObject,
        startElement.element.type
      );
      start = ele ? ele : start;
    }
    flowElements.push(start);
    const seqFlow = sequenceFlows.find(
      (f) =>
        (f.element &&
          f.element.businessObject &&
          f.element.businessObject.sourceRef &&
          f.element.businessObject.sourceRef.id) ===
        (startElement.element && startElement.element.id)
    );
    if (seqFlow) {
      const targetElement =
        seqFlow.element &&
        seqFlow.element.businessObject &&
        seqFlow.element.businessObject.targetRef;
      let target = targetElement;
      if (
        targetElement.type === "bpmn:Loop" ||
        targetElement.$type === "bpmn:Loop" ||
        targetElement.type === "bpmn:Conditional" ||
        targetElement.$type === "bpmn:Conditional"
      ) {
        let ele = updateChildFlowElements(
          targetElement,
          targetElement.type || targetElement.$type
        );
        target = ele ? ele : target;
      }
      flowElements.push(target);
      flowElements.push(seqFlow.element && seqFlow.element.businessObject);
      const newElements = addFlowElements(
        flowElements,
        sequenceFlows,
        targetElement
      );
      flowElements = newElements ? newElements : flowElements;
    }
  });
  return flowElements;
};

const updateXml = () => {
  let elementRegistry = bpmnModeler.get("elementRegistry");
  let nodes = elementRegistry && elementRegistry._elements;
  const elements = Object.values(nodes) || [];
  let flowElements = [];
  if (!elements || elements.length === 0) return;
  const sequenceFlows =
    elements &&
    elements.filter(
      (e) => (e.element && e.element.type) === "bpmn:SequenceFlow"
    );
  const startElements = getStartElements("bpmn:Process-action", [], elements);
  flowElements = getSequencedFlowElements(
    startElements,
    flowElements,
    sequenceFlows
  );
  if (!flowElements) return;
  let canvas = bpmnModeler.get("canvas");
  canvas.zoom("fit-viewport");
  let element = canvas.getRootElement();
  element.businessObject.flowElements = flowElements;
};

const downloadXml = (bpmnModeler) => {
  updateXml();
  bpmnModeler.saveXML({ format: true }, async function (err, xml) {
    download(xml, "diagram.baml");
  });
};

const uploadXml = () => {
  document.getElementById("inputFile").click();
};

const fetchId = () => {
  const regexBPMN = /[?&]id=([^&#]*)/g; // ?id=1
  const url = window.location.href;
  let matchBPMNId, id;
  while ((matchBPMNId = regexBPMN.exec(url))) {
    id = matchBPMNId[1];
    return id;
  }
};

let bpmnModeler = null;

function BamlEditor() {
  const [width, setWidth] = useState(drawerWidth);
  const [height, setHeight] = useState("100%");
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [element, setElement] = useState(null);
  const [baml, setBaml] = useState(null);
  const [openSnackbar, setSnackbar] = useState({
    open: false,
    messageType: null,
    message: null,
  });
  const classes = useStyles();

  const setCSSWidth = (width) => {
    document.documentElement.style.setProperty(
      "--bpmn-container-width",
      `${width}px`
    );
    setDrawerOpen(width === "0px" ? false : true);
  };

  const generateCode = async () => {
    updateXml();
    bpmnModeler.saveXML({ format: true }, async function (err, xml) {
      let res = await Service.add("com.axelor.studio.db.BamlModel", {
        ...baml,
        bamlXml: xml,
      });
      if (res && res.data && res.data[0]) {
        const baml = res.data[0];
        if (!baml) return;
        const actionResponse = await Service.action({
          model: "com.axelor.studio.db.BamlModel",
          action: "action-baml-model-method-generate-code",
          data: {
            context: {
              ...(baml || {}),
            },
          },
        });
        if (!actionResponse || actionResponse.status === -1) return;
        const { data } = actionResponse;
        const resultScript =
          data[0] && data[0].values && data[0].values.resultScript;
        let updatedRes = await Service.add("com.axelor.studio.db.BamlModel", {
          ...baml,
          resultScript,
        });
        if (updatedRes && updatedRes.data && updatedRes.data[0]) {
          setBaml({ ...updatedRes.data[0] });
          handleSnackbarClick("success", "Operation successful");
        } else {
          handleSnackbarClick(
            "error",
            (updatedRes &&
              updatedRes.data &&
              (updatedRes.data.message || updatedRes.data.title)) ||
              "Error!"
          );
        }
      }
    });
  };

  const onSave = () => {
    updateXml();
    bpmnModeler.saveXML({ format: true }, async function (err, xml) {
      let res = await Service.add("com.axelor.studio.db.BamlModel", {
        ...baml,
        bamlXml: xml,
      });
      if (res && res.data && res.data[0]) {
        setBaml({ ...res.data[0] });
        handleSnackbarClick("success", "Saved Successfully");
      } else {
        handleSnackbarClick(
          "error",
          (res && res.data && (res.data.message || res.data.title)) || "Error!"
        );
      }
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

  const toolBarButtons = [
    {
      name: "Save",
      icon: <Save className={classes.icon} />,
      tooltipText: "Save",
      onClick: onSave,
    },
    {
      name: "Image",
      icon: <Panorama className={classes.icon} />,
      tooltipText: "Download SVG",
      onClick: () => saveSVG(bpmnModeler),
    },
    {
      name: "DownloadXml",
      icon: <GetApp className={classes.icon} />,
      tooltipText: "Download",
      onClick: () => downloadXml(bpmnModeler),
    },
    {
      name: "UploadXml",
      icon: <Publish className={classes.icon} />,
      tooltipText: "Upload",
      onClick: uploadXml,
    },
    {
      name: "GenerateCode",
      icon: <Code className={classes.icon} />,
      tooltipText: "Generate code",
      onClick: generateCode,
    },
  ];

  const getProperties = () => {
    let ele = tabProperty.find((p) => p.type === (element && element.type));
    if (!ele) return [];
    if (ele.properties) {
      return ele.properties;
    }
  };

  const openDiagramImage = (bamlXml) => {
    if (!bamlXml) return;
    bpmnModeler.importXML(bamlXml, (err) => {
      if (err) {
        return console.error("Could not import BPMN 2.0 diagram", err);
      }
      let canvas = bpmnModeler.get("canvas");
      canvas.zoom("fit-viewport");
      let element = canvas.getRootElement();
      setElement(element);
    });
  };

  const fetchDiagram = React.useCallback(async function fetchDiagram(id) {
    if (id) {
      let res = await Service.fetchId("com.axelor.studio.db.BamlModel", id, {
        fields: ["bamlXml", "name", "resultScript"],
      });
      const baml = (res && res.data && res.data[0]) || {};
      let { bamlXml } = baml;
      setBaml(baml);
      openDiagramImage(bamlXml || defaultXml);
    } else {
      openDiagramImage(defaultXml);
    }
  }, []);

  const uploadFile = (e) => {
    let files = e.target.files;
    let reader = new FileReader();
    if (
      files &&
      files[0] &&
      files[0].name &&
      !files[0].name.includes(".baml")
    ) {
      return;
    }
    reader.readAsText(files[0]);
    reader.onload = (e) => {
      openDiagramImage(e.target.result);
    };
  };

  const renderComponent = (entry) => {
    if (!entry && entry.widget) return;
    switch (entry.widget) {
      case "textField":
        return (
          <TextField
            entry={entry}
            bpmnModeler={bpmnModeler}
            element={element}
            canRemove={true}
          />
        );
      case "textBox":
        return (
          <Textbox entry={entry} bpmnModeler={bpmnModeler} element={element} />
        );
      case "selectBox":
        return (
          <SelectBox
            entry={entry}
            element={element}
            bpmnModeler={bpmnModeler}
          />
        );
      case "checkbox":
        return <Checkbox entry={entry} element={element} />;
      case "many-to-one":
        return (
          <Select entry={entry} element={element} bpmnModeler={bpmnModeler} />
        );
      case "scriptBox":
        return (
          <ScriptBox
            entry={entry}
            element={element}
            bpmnModeler={bpmnModeler}
            bpmnFactory={bpmnModeler && bpmnModeler.get("bpmnFactory")}
          />
        );
      case "extendedQueryProperties":
        return (
          <ExtendedQuery
            entry={entry}
            element={element}
            bpmnModeler={bpmnModeler}
          />
        );
      case "expressionBuilder":
        return (
          <Builder entry={entry} element={element} bpmnModeler={bpmnModeler} />
        );
      case "fieldBuilder":
        return (
          <FieldBuilder
            entry={entry}
            element={element}
            bpmnModeler={bpmnModeler}
          />
        );
      default:
        return (
          <Textbox entry={entry} element={element} bpmnModeler={bpmnModeler} />
        );
    }
  };

  const handleSnackbarClick = (messageType, message) => {
    setSnackbar({
      open: true,
      messageType,
      message,
    });
  };

  useEffect(() => {
    bpmnModeler = new BpmnModeler({
      container: "#bpmnview",
      keyboard: { bindTo: document },
      additionalModules: [customControlsModule],
    });
    let id = fetchId();
    fetchDiagram(id);
  }, [fetchDiagram]);

  useEffect(() => {
    if (!bpmnModeler) return;
    bpmnModeler.on("element.click", (event) => {
      setElement(event.element);
    });
    bpmnModeler.on("shape.changed", (event) => {
      setElement(event.element);
    });
    bpmnModeler.on("shape.removed", () => {
      const elementRegistry = bpmnModeler.get("elementRegistry");
      const definitions = bpmnModeler.getDefinitions();
      const element =
        definitions && definitions.rootElements && definitions.rootElements[0];
      if (!element) return;
      const rootElement = elementRegistry.get(element.id);
      if (!rootElement) return;
      setElement(rootElement);
    });
  }, []);

  return (
    <div id="container">
      <div id="bpmncontainer">
        <div id="propview"></div>
        <div id="bpmnview">
          <div className="toolbar-buttons">
            {toolBarButtons.map((btn) => (
              <div key={btn.name} className={classes.btnContainer}>
                {btn.name === "UploadXml" && (
                  <input
                    id="inputFile"
                    type="file"
                    name="file"
                    onChange={uploadFile}
                    style={{ display: "none" }}
                  />
                )}
                <Tooltip
                  title={translate(btn.tooltipText)}
                  children={
                    <IconButton
                      fontSize="large"
                      onClick={btn.onClick}
                      className={classes.iconButton}
                    >
                      {btn.icon}
                    </IconButton>
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <div
          className="bpmn-property-toggle"
          onClick={() => {
            setWidth((width) => (width === 0 ? 380 : 0));
            setCSSWidth(width === 0 ? 380 : 0);
          }}
        >
          {translate("Properties panel")}
        </div>
        <Resizable
          style={resizeStyle}
          size={{ width, height }}
          onResizeStop={(e, direction, ref, d) => {
            setWidth((width) => width + d.width);
            setHeight(height + d.height);
            setCSSWidth(width + d.width);
          }}
          maxWidth={window.innerWidth - 150}
        >
          <Drawer
            variant="persistent"
            anchor="right"
            open={drawerOpen}
            style={{
              width: drawerWidth,
            }}
            classes={{
              paper: classes.drawerPaper,
            }}
            id="drawer"
          >
            <div className={classes.drawerContainer}>
              <Typography className={classes.nodeTitle}>
                {element && element.id}
              </Typography>
              <Typography className={classes.propertyLable}>
                {translate("Properties")}
              </Typography>
              {getProperties().map((t, index) => (
                <div key={index}>{renderComponent(t)}</div>
              ))}
            </div>
          </Drawer>
        </Resizable>
      </div>
      {openSnackbar.open && (
        <Snackbar
          open={openSnackbar.open}
          autoHideDuration={2000}
          onClose={handleSnackbarClose}
        >
          <Alert
            elevation={6}
            variant="filled"
            onClose={handleSnackbarClose}
            className="snackbarAlert"
            severity={openSnackbar.messageType}
          >
            {translate(openSnackbar.message)}
          </Alert>
        </Snackbar>
      )}
    </div>
  );
}

export default BamlEditor;
