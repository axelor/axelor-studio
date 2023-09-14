import React, { useState, useEffect } from "react";
import DmnModeler from "dmn-js/lib/Modeler";
import { migrateDiagram } from "@bpmn-io/dmn-migrate";
import propertiesPanelModule from "dmn-js-properties-panel";
import drdAdapterModule from "dmn-js-properties-panel/lib/adapter/drd";
import propertiesProviderModule from "dmn-js-properties-panel/lib/provider/camunda";
import camundaModdleDescriptor from "camunda-dmn-moddle/resources/camunda";
import classnames from "classnames";
import Alert from "@material-ui/lab/Alert";
import { Snackbar, Drawer, Typography } from "@material-ui/core";
import { Resizable } from "re-resizable";
import { makeStyles } from "@material-ui/core/styles";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
} from "@material-ui/core";

import AlertDialog from "../components/AlertDialog";
import Select from "../components/Select";
import RuleProperties from "./properties/RuleProperties";
import InputHeadProperties from "./properties/InputHeadProperties";
import OutputHeadProperties from "./properties/OutputHeadProperties";
import decisionTableHeadEditorModule from "./custom-modeler/dmn-js-decision-table/lib/features/decision-table-head/editor";
import hitPolicyEditorModule from "./custom-modeler/dmn-js-decision-table/lib/features/hit-policy/editor/index.js";
import simpleModeModule from "./custom-modeler/dmn-js-decision-table/lib/features/simple-mode";
import propertiesTabs from "./properties/properties";
import propertiesCustomProviderModule from "./custom-provider";
import Service, { getHeaders } from "../services/Service";
import {
  uploadFileAPI,
  getWkfDMNModels,
  getDMNModels,
  fetchDMNModel,
} from "../services/api";
import Tooltip from "../components/Tooltip";
import { Tab, Tabs } from "../components/Tabs";
import {
  Textbox,
  TextField,
  SelectBox,
  Checkbox,
} from "../components/properties/components";
import { Logo } from "../components/Logo";
import {
  download,
  translate,
  filesToItems,
  getAttachmentBlob,
  splitWithComma,
} from "../utils";

import "dmn-js-properties-panel/dist/assets/dmn-js-properties-panel.css";
import "dmn-js/dist/assets/dmn-js-decision-table-controls.css";
import "dmn-js/dist/assets/dmn-js-decision-table.css";
import "dmn-js/dist/assets/dmn-js-drd.css";
import "dmn-js/dist/assets/dmn-js-literal-expression.css";
import "dmn-js/dist/assets/dmn-js-shared.css";
import "dmn-js/dist/assets/diagram-js.css";

import "./css/dmnModeler.css";
import Ids from "ids";
let dmnModeler = null;
const drawerWidth = 380;

const resizeStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderLeft: "solid 1px #ddd",
  background: "#f0f0f0",
};

const useStyles = makeStyles((theme) => ({
  drawerPaper: {
    background: "#F8F8F8",
    width: "100%",
    position: "absolute",
    borderLeft: "1px solid #ccc",
    overflow: "auto",
    height: "100%",
  },
  drawerContainer: {
    padding: 10,
    height: "100%",
    textAlign: "left",
  },
  groupLabel: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    fontSize: "120%",
    margin: "10px 0px",
    transition: "margin 0.218s linear",
    fontStyle: "italic",
  },
  groupContainer: {
    marginTop: 10,
  },
  divider: {
    marginTop: 15,
    borderTop: "1px dotted #ccc",
  },
  nodeTitle: {
    fontSize: "120%",
    fontWeight: "bolder",
  },
  dialog: {
    minWidth: 300,
  },
  label: {
    display: "inline-block",
    verticalAlign: "middle",
    color: "rgba(0, 0, 0, 0.54)",
    margin: "8px 0px 3px 25px",
  },
  textButton: {
    minWidth: 100,
    fontWeight: "bold",
    minHeight: 30,
  },
  save: {
    margin: theme.spacing(1),
    backgroundColor: "#0275d8",
    borderColor: "#0267bf",
    textTransform: "none",
    color: "white",
    "&:hover": {
      backgroundColor: "#025aa5",
      borderColor: "#014682",
      color: "white",
    },
  },
  select: {
    minWidth: 150,
    marginLeft: 20,
    marginTop: 0,
    border: "none",
  },
}));

function nextId(prefix) {
  let ids = new Ids([32, 32, 1]);
  return ids.nextPrefixed(`${prefix}_`);
}

let decisionId = nextId("Decision");
let definitionId = nextId("Definitions");

const defaultDMNDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/DMN/20151101/dmn.xsd" xmlns:biodi="http://bpmn.io/schema/dmn/biodi/1.0" id="${definitionId}" name="DRD" namespace="http://camunda.org/schema/1.0/dmn">
  <decision id="${decisionId}" name="Decision 1">
    <extensionElements>
      <biodi:bounds x="157" y="81" width="180" height="80" />
    </extensionElements>
    <decisionTable id="decisionTable_1">
      <input id="input_1">
        <inputExpression id="inputExpression_1" typeRef="string" expressionLanguage="feel">
          <text></text>
        </inputExpression>
      </input>
      <output id="output_1" typeRef="string" />
    </decisionTable>
  </decision>
</definitions>`;

const fetchId = () => {
  const regexDMN = /[?&]id=([^&#]*)/g; // ?id=1
  const url = window.location.href;
  let matchDMNId, id;
  while ((matchDMNId = regexDMN.exec(url))) {
    id = matchDMNId[1];
    return id;
  }
};

function renderTabs(tabs = [], element) {
  const objectTabs = ["general"];
  let filteredTabs = [];
  tabs &&
    tabs.forEach((tab) => {
      if (!tab) return;
      if (objectTabs && objectTabs.includes(tab.id)) {
        filteredTabs.push(tab);
      }
    });
  return filteredTabs;
}

function getTabs(dmnModeler, element) {
  let activeEditor = dmnModeler && dmnModeler.getActiveViewer();
  if (!activeEditor) return;
  let tabs = propertiesTabs(element, translate, dmnModeler);
  let filteredTabs = renderTabs(tabs, element);
  return filteredTabs;
}
const uploadXml = () => {
  document.getElementById("inputFile").click();
};

const uploadExcelFile = () => {
  document.getElementById("inputExcelFile").click();
};

function DMNModeler() {
  const [wkfModel, setWkfModel] = useState(null);
  const [openSnackbar, setSnackbar] = useState({
    open: false,
    messageType: null,
    message: null,
  });
  const [width, setWidth] = useState(drawerWidth);
  const [height, setHeight] = useState("100%");
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [selectedElement, setSelectedElement] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [tabs, setTabs] = useState(null);
  const [decision, setDecision] = useState(null);
  const [input, setInput] = useState(null);
  const [output, setOutput] = useState(null);
  const [outputIndex, setOutputIndex] = useState(null);
  const [inputIndex, setInputIndex] = useState(null);
  const [rule, setRule] = useState(null);
  const [inputRule, setInputRule] = useState(null);
  const [rootElement, setRootElement] = useState(null);
  const [openUploadDialog, setUploadDialog] = useState(false);
  const [file, setFile] = useState(null);
  const [openAlert, setAlert] = useState(false);
  const [id, setId] = useState(null);
  const [nameCol, setNameCol] = useState(null);
  const classes = useStyles();
  const diagramXmlRef = React.useRef(null);

  const exportDiagram = () => {
    dmnModeler.saveXML({ format: true }, function (err, xml) {
      diagramXmlRef.current = xml;
      if (err) {
        return console.error("could not save DMN 1.1 diagram", err);
      }
      const { name: definitionName } = dmnModeler?._definitions;
      const { name } = wkfModel || {};
      download(xml, `${name || definitionName || "diagram"}.dmn`);
    });
  };

  const getSelectValue = (name) => {
    const bo = rootElement && rootElement.businessObject;
    if (!bo || !name || !bo.$attrs) return;
    const propertyName = `camunda:${name}`;
    return splitWithComma(bo.$attrs[propertyName]);
  };

  const getProperty = (name) => {
    const bo = rootElement && rootElement.businessObject;
    if (!bo || !name || !bo.$attrs) return;
    const propertyName = `camunda:${name}`;
    return bo.$attrs[propertyName];
  };

  const getModels = (model, type, titles) => {
    const fullNames =
      type === "metaModel" && getSelectValue("metaModelModelNames");
    let result = [];
    for (let i = 0; i < model.length; i++) {
      result.push({
        fullName: type === "metaModel" && fullNames[i],
        name: model[i],
        type: type,
        title: titles[i],
      });
    }
    return result;
  };
  const getData = () => {
    const isCustom = JSON.parse(getProperty("isCustom") || "false");
    const models = getSelectValue(isCustom ? "metaJsonModels" : "metaModels");
    const type = isCustom ? "metaJsonModel" : "metaModel";
    const titles = getSelectValue(
      isCustom ? "metaJsonModelLabels" : "metaModelLabels"
    );
    if (!models?.length) return;
    return getModels(models, type, titles);
  };

  const getInput = (event) => {
    const clone = { ...event };
    const {
      input: { inputExpression },
    } = clone;
    inputExpression.expressionLanguage =
      inputExpression.expressionLanguage || "feel";
    return { ...clone };
  };

  const getSheet = () => {
    if (!dmnModeler) return;
    const activeEditor = dmnModeler.getActiveViewer();
    if (!activeEditor) return;
    const sheet = activeEditor.get("sheet");
    if (!sheet) return;
    const eventBus = sheet._eventBus;
    eventBus.on("commandStack.row.add.executed", (event) => {
      const { context } = event || {};
      const { newRoot, row } = context || {};
      const { cells } = row || {};
      if (!newRoot || !cells) return;
      const predefinedValues = [
        ...(newRoot.businessObject.input || []),
        ...(newRoot.businessObject.output || []),
      ];
      if (cells.length > 0) {
        cells.forEach((cell, i) => {
          if (cell && cell.businessObject) {
            let value =
              predefinedValues &&
              predefinedValues[i].$attrs &&
              predefinedValues[i].$attrs["camunda:defaultValue"];
            if (value) {
              cell.businessObject.text = value;
            }
          }
        });
      }
    });
    eventBus.on("input.edit", (event) => {
      const input = getInput(event);
      setInput(input.input);
      setOutput(null);
      setRule(null);
      setInputRule(null);
    });
    eventBus.on("output.edit", (event) => {
      setOutput(event.output);
      setInput(null);
      setRule(null);
      setInputRule(null);
    });
    eventBus.on("cell.click", (event) => {
      const { id } = event;
      const element = sheet.getRoot();
      const rows = element.rows;
      const selectedRow =
        rows &&
        rows.find((product) => {
          return product.cells.some((item) => {
            return item.id === id;
          });
        });
      if (!selectedRow) {
        setInput(null);
        setRule(null);
        setInputRule(null);
        setOutput(null);
        return;
      }
      const cell = selectedRow.cells.find((item) => item.id === id);
      const definitions = dmnModeler?.getDefinitions();
      const latestDecision = definitions?.drgElement?.find(
        (d) => d.id === decision?.id
      );
      const {
        input: inputs,
        output: outputs,
        rule: elementRules,
      } = latestDecision?.decisionLogic || {};
      const { col, row } = cell || {};
      let column = inputs?.find((i) => i.id === col.id);
      const rules =
        elementRules &&
        elementRules.map((obj, index) => {
          let clone = Object.assign({}, obj);
          clone["label"] = `Rule ${index + 1}`;
          return clone;
        });
      if (!rules) return;
      let rule = rules.find((r) => r.id === row.id);
      let columnIndex = inputs?.findIndex((i) => i.id === col.id);
      if (!column) {
        columnIndex = outputs && outputs.findIndex((i) => i.id === col.id);
        column = outputs && outputs.find((i) => i.id === col.id);
        if (!column) return;
        setOutput(column);
        setOutputIndex(columnIndex);
        setRule(rule);
        setInput(null);
        setInputIndex(null);
        setInputRule(null);
      } else {
        setInput(column);
        setInputIndex(columnIndex);
        setInputRule(rule);
        setOutput(null);
        setOutputIndex(null);
        setRule(null);
      }
    });
  };

  const renderComponent = (entry) => {
    if (!entry && entry.widget) return;
    switch (entry.widget) {
      case "textField":
        return (
          <TextField entry={entry} element={selectedElement} canRemove={true} />
        );
      case "textBox":
        return <Textbox entry={entry} element={selectedElement} />;
      case "selectBox":
        return <SelectBox entry={entry} element={selectedElement} />;
      case "checkbox":
        return <Checkbox entry={entry} element={selectedElement} />;
      default:
        return <Textbox entry={entry} element={selectedElement} />;
    }
  };

  function Entry({ entry }) {
    return <div key={entry.id}>{renderComponent(entry)}</div>;
  }

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

  const uploadChunk = async (file, offset = 0) => {
    let attachment = getAttachmentBlob(file);
    const chunkSize = 100000;
    const end =
      offset + chunkSize < attachment && attachment.size
        ? offset + chunkSize
        : attachment && attachment.size;
    const blob = attachment && attachment.slice(offset, end);
    const headers = getHeaders(file, offset);
    let result = await uploadFileAPI(blob, headers);
    if (result && result.id) {
      setFile(result);
    } else {
      if (offset < attachment && attachment.size) {
        if (result.fileId) {
          file.id = result.fileId;
        }
        uploadChunk(file, chunkSize + offset);
      }
    }
  };

  const importExcel = async () => {
    const actionResponse = await Service.action({
      model: "com.axelor.studio.db.WkfDmnModel",
      action: "action-dmn-model-method-import-dmn-table",
      data: {
        context: {
          dataFile: file,
          _dmnModelId: wkfModel && wkfModel.id,
        },
      },
    });
    if (!actionResponse) {
      handleSnackbarClick("error", "Import failed");
      return;
    }
    handleSnackbarClick("success", "Imported successfully");
    setUploadDialog(false);
    setFile(null);
    let res = await Service.search("com.axelor.studio.db.WkfDmnModel", {
      data: {
        _domain: `self.id = ${wkfModel && wkfModel.id}`,
      },
    });
    if (res && res.data && res.data[0]) {
      const model = res.data[0];
      if (!model) return;
      setWkfModel({ ...model });
      openDiagram(model.diagramXml);
    }
  };

  const uploadExcel = async (e) => {
    let file = filesToItems(e.target.files);
    if (!file) return;
    uploadChunk(file && file[0]);
  };

  const exportExcel = async () => {
    const actionResponse = await Service.action({
      model: "com.axelor.studio.db.WkfDmnModel",
      action: "action-dmn-model-method-export-dmn-table",
      data: {
        context: {
          ...(wkfModel || {}),
        },
      },
    });
    if (!actionResponse) {
      return;
    }
    const { data } = actionResponse;
    const { view } = (data && data[0]) || {};
    const file = view && view.views && view.views[0] && view.views[0].name;
    if (file) {
      await Service.download(file, (wkfModel && wkfModel.name) || "DMN");
    }
  };

  const updateTabs = React.useCallback((event) => {
    let { element } = event;
    if (element && element.type === "label") {
      let activeEditor = dmnModeler && dmnModeler.getActiveViewer();
      const elementRegistry = activeEditor.get("elementRegistry");
      const newElement = elementRegistry.get(
        element.businessObject && element.businessObject.id
      );
      element = newElement;
    }
    let tabs = getTabs(dmnModeler, element);
    setTabValue(0);
    setTabs(tabs);
    setSelectedElement(element);
    setDrawerOpen(true);
  }, []);

  const openDiagram = React.useCallback(
    async (dmnXML) => {
      const dmn13XML = await migrateDiagram(dmnXML);
      dmnModeler.importXML(dmn13XML, function (err) {
        if (err) {
          return console.error("could not import DMN 1.1 diagram", err);
        }
        diagramXmlRef.current = dmnXML;
        const activeView = dmnModeler.getActiveView();
        if (activeView && activeView.type === "drd") {
          let activeEditor = dmnModeler.getActiveViewer();
          let eventBus = activeEditor.get("eventBus");
          let canvas = activeEditor.get("canvas");
          canvas.zoom("fit-viewport");
          const elementRegistry =
            dmnModeler._viewers.drd &&
            dmnModeler._viewers.drd.get("elementRegistry");
          const rootElement =
            elementRegistry && elementRegistry.get(dmnModeler._activeView.id);
          setRootElement(rootElement);
          updateTabs({
            element: rootElement,
          });
          eventBus.on("drillDown.click", (event) => {
            event.stopPropagation();
            setWidth(0);
            const { element } = event || {};
            setDecision(element);
            updateTabs({
              element: {
                id: "__implicitroot",
              },
            });
          });
          eventBus.on("element.click", (event) => {
            const { element } = event;
            setSelectedElement(element);
            updateTabs(event);
          });
          eventBus.on("commandStack.shape.replace.postExecuted", (event) => {
            updateTabs({
              element: event && event.context && event.context.newShape,
            });
          });
          eventBus.on("shape.removed", () => {
            const elementRegistry =
              dmnModeler._viewers.drd.get("elementRegistry");
            const rootElement = elementRegistry.get(dmnModeler._activeView.id);
            if (!rootElement) return;
            updateTabs({
              element: rootElement,
            });
          });
        }
      });
    },
    [updateTabs]
  );

  const newBpmnDiagram = React.useCallback(
    (rec) => {
      const diagram = rec || defaultDMNDiagram;
      openDiagram(diagram);
    },
    [openDiagram]
  );

  const fetchDiagram = React.useCallback(
    async (id, setWkf) => {
      if (id) {
        let res = await Service.fetchId("com.axelor.studio.db.WkfDmnModel", id);
        const wkf = (res && res.data && res.data[0]) || {};
        let { diagramXml, id: wkfId } = wkf;
        setId(wkfId);
        setWkf(wkf);
        newBpmnDiagram(diagramXml);
      } else {
        newBpmnDiagram();
      }
    },
    [newBpmnDiagram]
  );

  const uploadFile = (e) => {
    let files = e.target.files;
    let reader = new FileReader();
    if (files && files[0] && files[0].name && !files[0].name.includes(".dmn")) {
      handleSnackbarClick("error", "Upload dmn files only");
      return;
    }
    reader.readAsText(files[0]);
    reader.onload = (e) => {
      openDiagram(e.target.result);
    };
  };

  const onSave = () => {
    dmnModeler.saveXML({ format: true }, async function (err, xml) {
      diagramXmlRef.current = xml;
      Service.add("com.axelor.studio.db.WkfDmnModel", {
        ...wkfModel,
        diagramXml: xml,
      }).then((res) => {
        if (res && res.data && res.data[0]) {
          setWkfModel({ ...res.data[0] });
          handleSnackbarClick("success", "Saved Successfully");
        } else {
          handleSnackbarClick(
            "error",
            (res &&
              res.data &&
              (res.data.message ||
                res.data.title ||
                (res.data[0] && res.data[0]?.error?.message))) ||
              "Error"
          );
        }
      });
    });
  };

  const checkUniqueDecision = async () => {
    const elements = dmnModeler?._definitions?.drgElement;
    const decisions = elements?.filter((ele) => ele.$type === "dmn:Decision");
    const decisionIds = decisions?.map((process) => process.id);
    if (decisionIds?.length > 0) {
      const isValidId = await getDMNModels([
        {
          fieldName: "decisionId",
          operator: "IN",
          value: decisionIds,
        },
      ]);
      const wkfProcess = isValidId && isValidId[0];
      const process = await fetchDMNModel(wkfModel?.id, {
        fields: ["name"],
        related: {
          dmnTableList: ["name", "decisionId"],
        },
      });
      const dmnList = process?.dmnTableList.map((f) => f.decisionId) || [];
      if (
        wkfProcess &&
        !(dmnList && dmnList.some((item) => decisionIds?.includes(item)))
      ) {
        handleSnackbarClick("error", "Please provide unique process id");
        return;
      } else {
        return true;
      }
    }
  };

  const deployDiagram = async () => {
    dmnModeler.saveXML({ format: true }, async function (err, xml) {
      diagramXmlRef.current = xml;
      let res = await Service.add("com.axelor.studio.db.WkfDmnModel", {
        ...wkfModel,
        diagramXml: xml,
      });
      if (res && res.data && res.data[0]) {
        setWkfModel({ ...res.data[0] });
        if (!(await checkUniqueDecision())) return;
        let actionRes = await Service.action({
          model: "com.axelor.studio.db.WkfDmnModel",
          action: "action-wkf-dmn-model-method-deploy",
          data: {
            context: {
              _model: "com.axelor.studio.db.WkfDmnModel",
              ...res.data[0],
            },
          },
        });
        if (
          actionRes &&
          actionRes.data &&
          actionRes.data[0] &&
          actionRes.data[0].reload
        ) {
          handleSnackbarClick("success", "Deployed Successfully");
          fetchDiagram(wkfModel.id, setWkfModel);
        } else {
          handleSnackbarClick(
            "error",
            (actionRes &&
              actionRes.data &&
              (actionRes.data.message ||
                actionRes.data.title ||
                (actionRes.data[0] && actionRes.data[0]?.error?.message))) ||
              "Error"
          );
        }
      } else {
        handleSnackbarClick(
          "error",
          (res && res.data && (res.data.message || res.data.title)) || "Error"
        );
      }
    });
  };

  const alertOpen = () => {
    setAlert(true);
  };

  const alertClose = () => {
    setAlert(false);
  };

  const reloadView = () => {
    fetchDiagram(id, setWkfModel);
    setAlert(false);
    setInput(null);
    setInputRule(null);
    setOutput(null);
    setRule(null);
  };

  const onRefresh = async () => {
    dmnModeler.saveXML({ format: true }, function (err, xml) {
      const diagramXml = diagramXmlRef.current;
      if (`${diagramXml}` !== `${xml}`) {
        alertOpen();
      } else {
        reloadView();
      }
    });
  };

  const toolBarButtons = [
    {
      name: "Save",
      icon: <i className="fa fa-floppy-o" style={{ fontSize: 18 }}></i>,
      tooltipText: "Save",
      onClick: onSave,
    },
    {
      name: "UploadXml",
      icon: <i className="fa fa-upload" style={{ fontSize: 18 }}></i>,
      tooltipText: "Upload",
      onClick: uploadXml,
    },
    {
      name: "DownloadXml",
      icon: <i className="fa fa-download" style={{ fontSize: 18 }}></i>,
      tooltipText: "Download",
      onClick: exportDiagram,
    },
    {
      name: "Deploy",
      icon: <i className="fa fa-rocket" style={{ fontSize: 18 }}></i>,
      tooltipText: "Deploy",
      onClick: deployDiagram,
    },
    {
      name: "Refresh",
      icon: <i className="fa fa-refresh" style={{ fontSize: 18 }}></i>,
      tooltipText: "Refresh",
      onClick: onRefresh,
    },
  ];

  const setCSSWidth = (width) => {
    setDrawerOpen(width === "0px" ? false : true);
  };

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const TabPanel = ({ group, index }) => {
    return (
      <div
        key={group.id}
        data-group={group.id}
        className={classnames(classes.groupContainer, classes[group.className])}
      >
        {group.component ? (
          <group.component
            element={selectedElement}
            index={index}
            label={group.label}
            onSave={onSave}
          />
        ) : (
          group.entries.length > 0 && (
            <React.Fragment>
              <React.Fragment>
                {index > 0 && <div className={classes.divider} />}
              </React.Fragment>
              <div className={classes.groupLabel}>{translate(group.label)}</div>
              <div>
                {group.entries.map((entry, i) => (
                  <Entry entry={entry} key={i} />
                ))}
              </div>
            </React.Fragment>
          )
        )}
      </div>
    );
  };

  const handleViewDRD = () => {
    const views = dmnModeler.getViews();
    const decisionTableView = views.find(({ type }) => type === "drd");
    if (decisionTableView) {
      dmnModeler.open(decisionTableView);
    }

    const elementRegistry = dmnModeler?._viewers?.drd.get("elementRegistry");
    const newElement =
      elementRegistry && elementRegistry.get(dmnModeler?.getDefinitions()?.id);
    setRootElement(newElement);

    setDecision(null);
    setSelectedElement(newElement);
    setInput(null);
    setInputIndex(null);
    setOutput(null);
    setOutputIndex(null);
    setRule(null);
    setInputRule(null);
    updateTabs({ element: newElement });
  };

  useEffect(() => {
    dmnModeler = new DmnModeler({
      drd: {
        propertiesPanel: {
          parent: "#properties",
        },
        additionalModules: [
          propertiesPanelModule,
          propertiesProviderModule,
          drdAdapterModule,
          propertiesCustomProviderModule,
        ],
        keyboard: { bindTo: document },
      },
      decisionTable: {
        additionalModules: [
          decisionTableHeadEditorModule,
          simpleModeModule,
          hitPolicyEditorModule,
        ],
      },
      container: "#canvas",
      moddleExtensions: {
        camunda: camundaModdleDescriptor,
      },
    });

    let id = fetchId();
    fetchDiagram(id, setWkfModel);
    setId(id);
  }, [fetchDiagram]);

  const getNameCol = (nameCol) => {
    nameCol && setNameCol(nameCol);
  };

  return (
    <div className="App">
      <div className="modeler">
        <div id="canvas">
          <div className="toolbar-buttons">
            {toolBarButtons.map((btn) => (
              <div key={btn.name}>
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
                  title={btn.tooltipText}
                  children={
                    <button onClick={btn.onClick} className="property-button">
                      {btn.icon}
                    </button>
                  }
                />
              </div>
            ))}
            <Tooltip
              title="Export"
              children={
                <button
                  onClick={exportExcel}
                  className={classnames(classes.textButton, "property-button")}
                >
                  {translate("Export")}
                </button>
              }
            />
            <Tooltip
              title="Import"
              children={
                <button
                  onClick={() => setUploadDialog(true)}
                  className={classnames(classes.textButton, "property-button")}
                >
                  {translate("Import")}
                </button>
              }
            />
            {selectedElement && selectedElement.id === "__implicitroot" && (
              <button
                className={classnames(classes.textButton, "property-button")}
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDRD();
                }}
              >
                {translate("View DRD")}
              </button>
            )}
            <div
              style={{
                width: `calc(100% - ${
                  selectedElement && selectedElement.id === "__implicitroot"
                    ? "550px"
                    : "450px"
                })`,
                textAlign: "left",
              }}
            >
              <label className={classes.label}>{translate("DMN model")}</label>
              <Select
                className={classes.select}
                disableClearable={true}
                update={(value) => {
                  const { diagramXml, id } = value || {};
                  setWkfModel(value);
                  setId(id);
                  openDiagram(diagramXml || defaultDMNDiagram);
                  handleViewDRD();
                }}
                name="wkf"
                value={wkfModel}
                optionLabel="name"
                optionLabelSecondary="description"
                isLabel={false}
                fetchMethod={(options) => getWkfDMNModels(options)}
                disableUnderline={false}
                isOptionEllipsis={true}
              />
            </div>
          </div>
          <Divider />
        </div>
        <div>
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
                {selectedElement && selectedElement.id !== "__implicitroot" && (
                  <Typography className={classes.nodeTitle}>
                    {selectedElement && selectedElement.id}
                  </Typography>
                )}
                <Tabs value={tabValue} onChange={handleChange}>
                  <Tab label="General" data-tab="General" />
                </Tabs>
                {selectedElement && selectedElement.id === "__implicitroot" ? (
                  decision && (
                    <div style={{ marginTop: 10 }}>
                      {decision && (
                        <React.Fragment>
                          {input && !inputRule && (
                            <InputHeadProperties
                              element={selectedElement}
                              input={input}
                              dmnModeler={dmnModeler}
                              getData={getData}
                            />
                          )}
                          {inputRule && (
                            <RuleProperties
                              entity={input}
                              element={selectedElement}
                              dmnModeler={dmnModeler}
                              rule={inputRule}
                              ruleFieldType="inputEntry"
                              ruleIndex={inputIndex}
                              getData={getData}
                            />
                          )}
                          {output && !rule && (
                            <OutputHeadProperties
                              element={selectedElement}
                              output={output}
                              dmnModeler={dmnModeler}
                              getData={getData}
                              getNameCol={getNameCol}
                            />
                          )}
                          {rule && (
                            <RuleProperties
                              entity={output}
                              element={selectedElement}
                              dmnModeler={dmnModeler}
                              rule={rule}
                              ruleFieldType="outputEntry"
                              ruleIndex={outputIndex}
                              isOutput={true}
                              nameCol={nameCol}
                              getData={getData}
                            />
                          )}
                        </React.Fragment>
                      )}
                    </div>
                  )
                ) : (
                  <React.Fragment>
                    {tabs &&
                      tabs[tabValue] &&
                      tabs[tabValue].groups &&
                      tabs[tabValue].groups.map((group, index) => (
                        <TabPanel key={index} group={group} index={index} />
                      ))}
                  </React.Fragment>
                )}
                <div id="properties" style={{ display: "none" }}></div>
              </div>
            </Drawer>
            <div
              className="bpmn-property-toggle"
              onClick={() => {
                setWidth((width) => (width === 0 ? 380 : 0));
                setCSSWidth(width === 0 ? 380 : 0);
                const definitions = dmnModeler?.getDefinitions();
                const latestDecision = definitions?.drgElement?.find(
                  (d) => d.id === decision?.id
                );
                if (
                  latestDecision?.businessObject?.decisionLogic?.$type ===
                  "dmn:LiteralExpression"
                ) {
                  return;
                }
                if (latestDecision) {
                  getSheet();
                }
              }}
            >
              Properties Panel
            </div>
          </Resizable>
        </div>
      </div>
      {openAlert && (
        <AlertDialog
          openAlert={openAlert}
          alertClose={alertClose}
          handleAlertOk={reloadView}
          message="Current changes will be lost. Do you really want to proceed?"
          title="Refresh"
        />
      )}
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
            severity={openSnackbar?.messageType}
          >
            {translate(openSnackbar.message)}
          </Alert>
        </Snackbar>
      )}
      {openUploadDialog && (
        <Dialog
          open={openUploadDialog}
          onClose={(event, reason) => {
            if (reason !== "backdropClick") {
              setUploadDialog(false);
            }
          }}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          classes={{
            paper: classes.dialog,
          }}
        >
          <DialogTitle id="alert-dialog-title">
            {translate("Upload")}
          </DialogTitle>
          <DialogContent>
            <input
              id="inputExcelFile"
              type="file"
              name="file"
              onChange={uploadExcel}
              style={{ display: "none" }}
            />
            <Tooltip
              title={translate("Import")}
              children={
                <button
                  onClick={uploadExcelFile}
                  className={classnames(classes.textButton, "property-button")}
                >
                  <i className="fa fa-upload" style={{ fontSize: 18 }}></i>
                </button>
              }
            />
            {file && <Typography>{file.fileName}</Typography>}
          </DialogContent>
          <DialogActions>
            <Button
              className={classes.save}
              onClick={importExcel}
              color="primary"
            >
              {translate("Import")}
            </Button>
            <Button
              onClick={() => {
                setUploadDialog(false);
              }}
              color="primary"
              className={classes.save}
            >
              {translate("OK")}
            </Button>
            <Button
              onClick={() => {
                setUploadDialog(false);
              }}
              color="primary"
              className={classes.save}
            >
              {translate("Cancel")}
            </Button>
          </DialogActions>
        </Dialog>
      )}
      <Logo />
    </div>
  );
}

export default DMNModeler;
