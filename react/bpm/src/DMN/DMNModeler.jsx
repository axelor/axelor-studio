import React, { useState, useEffect, useRef, useMemo } from "react";
import DmnModeler from "dmn-js/lib/Modeler";
import { migrateDiagram } from "@bpmn-io/dmn-migrate";
import {
  DmnPropertiesPanelModule,
  DmnPropertiesProviderModule,
} from "dmn-js-properties-panel";
import camundaModdleDescriptor from "camunda-dmn-moddle/resources/camunda";
import classnames from "classnames";
import { Resizable } from "re-resizable";
import { BootstrapIcon } from "@axelor/ui/icons/bootstrap-icon";

import AlertDialog from "../components/AlertDialog";
import Select from "../components/Select";
import RuleProperties from "./properties/RuleProperties";
import InputHeadProperties from "./properties/InputHeadProperties";
import OutputHeadProperties from "./properties/OutputHeadProperties";
import decisionTableHeadEditorModule from "./custom-modeler/dmn-js-decision-table/lib/features/decision-table-head/editor";
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
  mergeModels,
} from "../utils";

import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
  Button,
  Box,
  InputLabel,
  NavTabs,
  Input,
  CommandBar,
  DialogTitle,
} from "@axelor/ui";
import Title from "./Title";
import styles from "./dmn-modeler.module.css";

import Alert from "../components/Alert";
import { useAppTheme } from "../custom-hooks/useAppTheme.jsx";
import "dmn-js/dist/assets/dmn-js-decision-table-controls.css";
import "dmn-js/dist/assets/dmn-js-decision-table.css";
import "dmn-js/dist/assets/dmn-js-drd.css";
import "dmn-js/dist/assets/dmn-js-literal-expression.css";
import "dmn-js/dist/assets/dmn-js-shared.css";
import "dmn-js/dist/assets/diagram-js.css";
import { getBusinessObject } from "dmn-js-shared/lib/util/ModelUtil.js";

import "./css/dmnModeler.css";
import Ids from "ids";
import useDialog from "../hooks/useDialog.jsx";

let dmnModeler = null;
const DRAWER_WIDTH = 380;

const resizeStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderLeft: "1px solid var(--bs-secondary-bg)",
};

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
  const [width, setWidth] = useState(DRAWER_WIDTH);
  const [height, setHeight] = useState("100%");
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
  const [drawerOpen, setDrawerOpen] = useState(true);
  const diagramXmlRef = useRef(null);
  const tab = tabs && tabs[tabValue];
  const { groups = [], id: tabId = "" } = tab || {};
  const { theme = "light" } = useAppTheme();
  const openDialog = useDialog();

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

  const findModels = (name) => {
    const models = getSelectValue(`${name}s`) || [];
    const modelLabels = getSelectValue(`${name}Labels`);
    const $models = getModels(models, name, modelLabels);

    if (!models?.length) return;
    return $models;
  };
  const getData = () => {
    const metaModels = findModels("metaModel");
    const metaJsonModels = findModels("metaJsonModel");

    return mergeModels(metaModels, metaJsonModels);
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

  const openPropertyPanel = () => {
    setWidth(DRAWER_WIDTH);
    setCSSWidth(`${width === 0 ? DRAWER_WIDTH : 0}px`);
  };

  const setCSSWidth = (width) => {
    setDrawerOpen(width === "0px" ? false : true);
  };

  const getSheet = React.useCallback(() => {
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
      openPropertyPanel();
    });
    eventBus.on("output.edit", (event) => {
      setOutput(event.output);
      setInput(null);
      setRule(null);
      setInputRule(null);
      openPropertyPanel();
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
      const { input: inputs, output: outputs, rule: elementRules } =
        latestDecision?.decisionLogic || {};
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
      openPropertyPanel();
    });
  }, [decision]);

  const renderComponent = (entry) => {
    if (!entry && entry.widget) return;
    switch (entry.widget) {
      case "textField":
        return (
          <TextField
            entry={entry}
            element={selectedElement}
            canRemove={true}
            readOnly={getReadOnly(entry)}
          />
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
      handleSnackbarClick("danger", "Import failed");
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
    const { view, error } = (data && data[0]) || {};
    const file = view && view.views && view.views[0] && view.views[0].name;
    if (file) {
      await Service.download(file, (wkfModel && wkfModel.name) || "DMN");
    } else if (error?.message) {
      handleSnackbarClick("danger", error?.message);
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
  }, []);

  const openDiagram = React.useCallback(
    async (dmnXML) => {
      const dmn13XML = await migrateDiagram(dmnXML);
      dmnModeler
        .importXML(dmn13XML)
        .then((result) => {
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
              const rootElement = elementRegistry.get(
                dmnModeler._activeView.id
              );
              if (!rootElement) return;
              updateTabs({
                element: rootElement,
              });
            });
          }
        })
        .catch((err) => {
          return console.error("could not import DMN 1.1 diagram", err);
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
        let res = await Service.fetchId(
          "com.axelor.studio.db.WkfDmnModel",
          id,
          {
            related: {
              dmnTableList: ["name", "decisionId"],
            },
          }
        );
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

  const getReadOnly = React.useCallback(
    (entry) => {
      const decisionId = getBusinessObject(selectedElement)?.id;
      const list = wkfModel?.dmnTableList;
      if (decisionId && list && entry?.modelProperty === "id") {
        return Boolean(list.find((item) => item.decisionId === decisionId));
      }
      return false;
    },
    [selectedElement, wkfModel]
  );

  const uploadFile = (e) => {
    let files = e.target.files;
    let reader = new FileReader();
    if (files && files[0] && files[0].name && !files[0].name.includes(".dmn")) {
      handleSnackbarClick("danger", "Upload dmn files only");
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
            "danger",
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
        handleSnackbarClick("danger", "Please provide unique process id");
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
            "danger",
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
          "danger",
          (res && res.data && (res.data.message || res.data.title)) || "Error"
        );
      }
    });
  };

  const alertClose = () => {
    setAlert(false);
  };

  const reloadView = () => {
    fetchDiagram(id, setWkfModel);
    setInput(null);
    setInputRule(null);
    setOutput(null);
    setRule(null);
  };

  const onRefresh = async () => {
    dmnModeler.saveXML({ format: true }, function (err, xml) {
      const diagramXml = diagramXmlRef.current;
      if (`${diagramXml}` !== `${xml}`) {
        openDialog({
          title:"Refresh",
          message:"Current changes will be lost. Do you really want to proceed?",
          onSave:reloadView
        })
      } else {
        reloadView();
      }
    });
  };

  const leftToolbar = [
    {
      key: "save",
      iconOnly: true,
      description: translate("Save"),
      iconProps: { icon: "save" },
      onClick: onSave,
    },
    {
      key: "refresh",
      iconOnly: true,
      description: translate("Refresh"),
      iconProps: { icon: "refresh" },
      tooltipText: "Refresh",
      onClick: onRefresh,
    },
    {
      key: "deploy",
      iconOnly: true,
      description: translate("Deploy"),
      iconProps: { icon: "rocket" },
      onClick: deployDiagram,
    },
  ];

  const rightToolbar = [
    {
      key: "upload",
      iconOnly: true,
      description: translate("Upload"),
      iconProps: { icon: "upload" },
      onClick: uploadXml,
    },
    {
      key: "download",
      iconOnly: true,
      description: translate("Download"),
      iconProps: { icon: "download" },
      onClick: exportDiagram,
    },
    {
      key: "export",
      text: translate("Export"),
      onClick: exportExcel,
    },
    {
      key: "import",
      text: translate("Import"),
      onClick: () => setUploadDialog(true),
    },
  ];

  const handleChange = (newValue) => {
    const val = tabs.findIndex((tab) => tab.id === newValue?.id);
    const tabValue = val > -1 ? val : 0;
    setTabValue(tabValue);
  };

  const TabPanel = ({ group, index }) => {
    return (
      <div
        key={group.id}
        data-group={group.id}
        className={classnames(styles.groupContainer, styles[group.className])}
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
              <Title divider={index > 0} label={group.label} />
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
          DmnPropertiesPanelModule,
          DmnPropertiesProviderModule,
          propertiesCustomProviderModule,
        ],
        keyboard: { bindTo: document },
      },
      decisionTable: {
        additionalModules: [decisionTableHeadEditorModule, simpleModeModule],
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

  useEffect(() => {
    if (!dmnModeler) return;
    dmnModeler.on("views.changed", (event) => {
      const { activeView } = event;
      if (activeView?.type === "decisionTable") {
        getSheet();
      }
    });
  }, [getSheet]);

  const initialWidth = useRef(window.innerWidth);
  const availableWidth = useRef(window.innerWidth);

  useEffect(() => {
    if (!drawerOpen) return;

    const checkWindowSize = () => {
      const windowWidth = window.innerWidth;
      availableWidth.current = windowWidth;
      setWidth(() => {
        const width = Math.round(
          (windowWidth * DRAWER_WIDTH) / initialWidth.current
        );
        const addOn = Math.round(Math.max(0, 1024 - windowWidth) / 5);
        return width + addOn;
      });
    };

    window.addEventListener("resize", checkWindowSize);

    return () => {
      window.removeEventListener("resize", checkWindowSize);
    };
  }, [drawerOpen]);

  const getNameCol = (nameCol) => {
    nameCol && setNameCol(nameCol);
  };

  const handleDRDClick = (e) => {
    e.stopPropagation();
    handleViewDRD();
  };

  const hasDrawerContent = useMemo(
    () => Boolean(input || inputRule || output || rule),
    [input, inputRule, output, rule]
  );

  return (
    <Box className="App" d="flex" flexDirection="column" color="body">
      <Box flex={1} d="flex" justifyContent="space-between" className="modeler">
        <Box w={100} h={100} id="canvas">
          <Box
            d="flex"
            alignItems="center"
            flexWrap="wrap"
            justifyContent="space-between"
            border
            rounded
            gap={4}
            style={{
              padding: "6px 20px 8px 20px",
              backgroundColor: "var(--bs-tertiary-bg)",
            }}
          >
            <CommandBar
              items={
                selectedElement?.id === "__implicitroot"
                  ? [
                      ...leftToolbar,
                      {
                        key: "view-drd",
                        text: translate("View DRD"),
                        onClick: handleDRDClick,
                      },
                    ]
                  : leftToolbar
              }
              className={styles.commandBar}
            />
            <Box color="body" textAlign="left" flex="1">
              <Select
                className={styles.select}
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
                placeholder={translate("DMN model")}
              />
            </Box>
            <CommandBar items={rightToolbar} className={styles.commandBar} />
            <Input
              id="inputFile"
              type="file"
              name="file"
              onChange={uploadFile}
              style={{ display: "none" }}
            />
          </Box>
        </Box>
        <Box position="sticky" top={0} right={0} h={100}>
          <Resizable
            style={resizeStyle}
            size={{ width, height }}
            onResizeStop={(e, direction, ref, d) => {
              setWidth((width) => width + d.width);
              setHeight(height + d.height);
              setCSSWidth(`${width + d.width}px`);
            }}
            maxWidth={Math.max(window.innerWidth - 230, DRAWER_WIDTH)}
            minWidth={
              !width || !drawerOpen || availableWidth.current <= 1024
                ? 0
                : DRAWER_WIDTH
            }
            minHeight={height}
            enable={{
              left: true,
            }}
          >
            <Box className={styles.drawerPaper} id="drawer">
              <Box className={styles.drawerContainer}>
                {selectedElement && selectedElement.id !== "__implicitroot" && (
                  <InputLabel fontSize={5} fontWeight="bold">
                    {selectedElement && selectedElement.id}
                  </InputLabel>
                )}
                <NavTabs
                  items={[
                    {
                      title: translate("General"),
                      id: "general",
                    },
                  ]}
                  onItemClick={handleChange}
                  active={tabId}
                />
                {selectedElement && selectedElement.id === "__implicitroot" ? (
                  decision && (
                    <div>
                      {decision && (
                        <Box
                          className={
                            hasDrawerContent ? styles["drawer-content"] : ""
                          }
                        >
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
                        </Box>
                      )}
                    </div>
                  )
                ) : (
                  <Box border p={2} pb={3} rounded>
                    {groups.map((group, index) => (
                      <TabPanel key={index} group={group} index={index} />
                    ))}
                  </Box>
                )}
                <div id="properties" style={{ display: "none" }}></div>
              </Box>
            </Box>
            <Box
              className="bpmn-property-toggle"
              color="body"
              borderEnd
              borderTop
              borderStart
              pos="absolute"
              bg="body-tertiary"
              userSelect="none"
              roundedTop
              fontSize={6}
              onClick={() => {
                setWidth((width) => (width === 0 ? DRAWER_WIDTH : 0));
                setCSSWidth(`${width === 0 ? DRAWER_WIDTH : 0}px`);
              }}
            >
              {translate("Properties")}
            </Box>
          </Resizable>
        </Box>
      </Box>
      <AlertDialog
        openAlert={openAlert}
        alertClose={alertClose}
        handleAlertOk={reloadView}
        message="Current changes will be lost. Do you really want to proceed?"
        title="Refresh"
      />
      {openSnackbar.open && (
        <Alert
          open={openSnackbar.open}
          message={openSnackbar.message}
          messageType={openSnackbar.messageType}
          onClose={handleSnackbarClose}
        />
      )}
      
 

      <Dialog
        open={openUploadDialog}
        centered
        backdrop
        className={styles.dialog}
      >
        <DialogHeader onCloseClick={() => setUploadDialog(false)}>
          <DialogTitle>{translate("Upload")}</DialogTitle>
        </DialogHeader>
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
              <Button
                variant={theme}
                onClick={uploadExcelFile}
                className={classnames(styles.textButton, "property-button")}
              >
                <BootstrapIcon icon="upload" fontSize={18} />
              </Button>
            }
          />
          {file && (
            <InputLabel fontSize={5} style={{ margin: "0 4px" }}>
              {file.fileName}
            </InputLabel>
          )}
        </DialogContent>
        <DialogFooter>
          <Button
            className={styles.save}
            onClick={importExcel}
            variant="primary"
          >
            {translate("Import")}
          </Button>
          <Button
            onClick={() => {
              setUploadDialog(false);
            }}
            variant="primary"
            className={styles.save}
          >
            {translate("OK")}
          </Button>
          <Button
            onClick={() => {
              setUploadDialog(false);
            }}
            variant="secondary"
            className={styles.save}
          >
            {translate("Cancel")}
          </Button>
        </DialogFooter>
      </Dialog>
      <Logo />
    </Box>
  );
}

export default DMNModeler;
