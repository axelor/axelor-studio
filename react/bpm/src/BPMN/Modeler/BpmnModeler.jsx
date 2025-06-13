import React, { useEffect, useState, useRef } from "react";
import find from "lodash/find";
import BpmnModeler from "bpmn-js/lib/Modeler";
import minimapModule from "diagram-js-minimap";
import {
  BpmnPropertiesProviderModule,
  BpmnPropertiesPanelModule,
} from "bpmn-js-properties-panel";
import TokenSimulationModule from "bpmn-js-token-simulation/lib/modeler";
import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { Resizable } from "re-resizable";
import { Logo } from "../../components/Logo";
import DrawerContent from "./DrawerContent";
import propertiesCustomProviderModule from "./custom-provider";
import camundaModdleDescriptor from "./resources/camunda.json";
import Service from "../../services/Service";
import DeployDialog from "./views/DeployDialog";
import Select from "../../components/Select";
import {
  fetchId,
  uploadXml,
  getElements,
  saveSVG,
  downloadXml,
  getTabs,
  addOldNodes,
  getCommentsLength,
  getNameProperty,
} from "./extra.js";
import {
  getTranslations,
  getInfo,
  fetchWkf,
  getStudioApp,
  getWkfModels,
  removeWkf,
  getApp,
  getAppStudioConfig,
  getBPMNModels,
  getAppBPMConfig,
} from "../../services/api";
import {
  getAxelorScope,
  getBool,
  translate,
  convertSVGtoBase64,
  lightenColor,
  updateBusinessObject,
  getProblemViewData,
} from "../../utils";
import {
  FILL_COLORS,
  USER_TASKS_TYPES,
  STROKE_COLORS,
  CONDITIONAL_SOURCES,
  ICON_TYPE,
  PALETTE_WIDTHS,
} from "./constants";
import { ALL_ATTRIBUTES } from "./properties/parts/CustomImplementation/constants";
import { useStore } from "../../store.jsx";
import { useKeyPress } from "../../custom-hooks/useKeyPress";
import Ids from "ids";
import Alert from "../../components/Alert";
import { Collaboration } from "../../components/Collaboration";
import { Box, Button, CommandBar } from "@axelor/ui";
import lintModule from "bpmn-js-bpmnlint";
import bpmnlintConfig from "../../../bundled-config";

import "bpmn-js-bpmnlint/dist/assets/css/bpmn-js-bpmnlint.css";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "@bpmn-io/properties-panel/dist/assets/properties-panel.css";
import "bpmn-js-token-simulation/assets/css/bpmn-js-token-simulation.css";
import "diagram-js-minimap/assets/diagram-js-minimap.css";
import "../css/bpmn.css";
import "../css/colors.css";
import "../css/tokens.css";
import styles from "./bpmn-modeler.module.css";
import { openWebApp } from "./properties/parts/CustomImplementation/utils.js";
import { createElement } from "../../utils/ElementUtil.js";
import { getExtensionElements } from "../../utils/ExtensionElementsUtil.js";
import useDialog from "../../hooks/useDialog.jsx";
import Loader from "../../components/Loader";
import { wsProgress } from "../../services/Progress";
import IssuePanel from "./IssuePanel.jsx";
import { IconButton } from "generic-builder/src/components/index.jsx";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import Icons from "../../components/icons/Icons.jsx";

const resizeStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderLeft: "1px solid var(--bs-secondary-bg)",
};
const issuePanelStyle = {
  border: "1px solid var(--bs-secondary-border-subtle, rgb(207, 201, 201))",
  position: "relative",
  background: "var(--bs-body-bg, #fff)",
  zIndex: 50,
};

const DRAWER_WIDTH = 380;
const CAMUNDA_EXECUTION_LISTENER_ELEMENT = "camunda:ExecutionListener";
const TOOL_PANEL_MAX_HEIGHT = 300;

const TimerEvents = React.lazy(() => import("./TimerEvent"));

let bpmnModeler = null;

function isConditionalSource(element) {
  return isAny(element, CONDITIONAL_SOURCES);
}

function nextId() {
  let ids = new Ids([32, 32, 1]);
  return ids.nextPrefixed("Process_");
}

function setColors(element, forceUpdate = false) {
  if ((element?.di?.stroke || element?.di?.fill) && !forceUpdate) {
    return;
  }
  let modeling = bpmnModeler.get("modeling");
  if (is(element, "bpmn:Gateway")) {
    modeling.setColor(element, {
      stroke: STROKE_COLORS["bpmn:Gateway"],
      fill: FILL_COLORS["bpmn:Gateway"],
    });
  } else {
    modeling.setColor(element, {
      stroke: STROKE_COLORS[element.type],
      fill: FILL_COLORS[element.type],
    });
  }
}

function BpmnModelerComponent() {
  const [wkf, setWkf] = useState(null);
  const [id, setId] = useState(null);
  const [openDelopyDialog, setDelopyDialog] = useState(false);
  const [isTimerTask, setIsTimerTask] = useState(true);
  const [ids, setIds] = useState({
    oldIds: null,
    currentIds: null,
  });
  const [openSnackbar, setSnackbar] = useState({
    open: false,
    messageType: null,
    message: null,
  });
  const [selectedElement, setSelectedElement] = useState(null);
  const [isMenuActionDisable, setMenuAction] = useState(false);
  const [comments, setComments] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [tabs, setTabs] = useState([]);
  const [width, setWidth] = useState(DRAWER_WIDTH);
  const [height, setHeight] = useState("100%");
  const [progress, setProgress] = useState(0);
  const [enableStudioApp, setEnableStudioApp] = useState(false);
  const [allowProgressBarDisplay,setAllowProgressBarDisplay] = useState(true);
  const [showError, setError] = useState(false);
  const [initialState, setInitialState] = useState(false);
  const { update, state } = useStore();
  const { info } = state || {};
  const [drawerOpen, setDrawerOpen] = useState(true);
  const openDialog = useDialog();
  const diagramXmlRef = React.useRef(null);
  const [issuePanelHeight, setIssuePanelHeight] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [issues, setIssues] = useState({
    erros: [],
    warnings: [],
  });

  const getQueryParamValue = (key = "") => {
    const params = new URL(document.location).searchParams;
    return params.get(key);
  };

  const getBase64SVG = async () => {
    const { svg } = await bpmnModeler.saveSVG({ format: true });
    const base64SVG = await convertSVGtoBase64(svg);
    return base64SVG;
  };

  const handleMenuActionTab = React.useCallback((val) => {
    setMenuAction(val);
  }, []);

  const handleChange = React.useCallback(
    (newValue) => {
      const val = tabs.findIndex((tab) => tab.id === newValue?.id);
      const tabValue = val > -1 ? val : 0;
      setTabValue(tabValue);
    },
    [tabs]
  );

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

  const updateTranslations = async (element, bpmnModeler) => {
    if (!element) return;
    const bo = getBusinessObject(element);
    if (!bo) return;
    if (!getBool(bo?.$attrs?.["camunda:isTranslations"])) return;
    if (!bo?.$attrs?.["camunda:key"]) return;
    const translations = await getTranslations(bo?.$attrs?.["camunda:key"]);
    if (translations?.length <= 0) return;
    const modelProperty = getNameProperty(element);
    const userInfo = info || (await getInfo());
    const language = userInfo?.user?.lang;
    if (!language) return;
    const selectedTranslation = translations?.find(
      (t) => t.language === language
    );
    const diagramValue =
      selectedTranslation?.message || bo?.$attrs["camunda:key"];
    if (!diagramValue) return;
    let elementRegistry = bpmnModeler.get("elementRegistry");
    let modeling = bpmnModeler.get("modeling");
    let shape = elementRegistry.get(element.id);
    modeling?.updateProperties(shape, {
      [modelProperty]: diagramValue,
    });
  };

  const getProperty = (element, name) => {
    let propertyName = `camunda:${name}`;
    let bo = getBusinessObject(element);
    if ((element && element.type) === "bpmn:Participant") {
      bo = getBusinessObject(bo && bo.processRef);
    }
    return (bo && bo.$attrs && bo.$attrs[propertyName]) || "";
  };

  const checkMenuActionTab = React.useCallback((element) => {
    if (!element) return;
    if (USER_TASKS_TYPES.includes(element.type)) {
      const metaModel = getProperty(element, "metaModel");
      const metaJsonModel = getProperty(element, "metaJsonModel");
      if (!metaJsonModel && !metaModel) {
        setMenuAction(true);
      } else {
        setMenuAction(false);
      }
    } else {
      setMenuAction(false);
    }
  }, []);

  const openBpmnDiagram = React.useCallback(
    async (xml, isDeploy, id, oldWkf) => {
      try {
        await bpmnModeler.importXML(xml);
        diagramXmlRef.current = xml;
        if (isDeploy) {
          addOldNodes(oldWkf, setWkf, bpmnModeler);
        }
        let canvas = bpmnModeler.get("canvas");
        canvas.zoom("fit-viewport", "auto");
        const definitions = bpmnModeler._definitions;
        let attrs = definitions && definitions.$attrs;
        if (attrs) {
          if (oldWkf) {
            [
              "code",
              "name",
              "versionTag",
              "studioApp",
              "description",
              "wkfStatusColor",
              "newVersionOnDeploy",
            ].forEach((key) => {
              if (key === "name") {
                setProperty("diagramName", oldWkf[key], true);
              } else if (key === "studioApp") {
                setProperty("studioApp", oldWkf[key] && oldWkf[key].code, true);
              } else {
                setProperty(key, oldWkf[key], true);
              }
            });
          }
        }
        let tabs = getTabs(bpmnModeler, definitions, setDummyProperty);
        setTabs(tabs);
        setTabValue(0);
        const focusedNodeId = getQueryParamValue("node");
        const focusedNode = bpmnModeler
          .get("elementRegistry")
          .get(focusedNodeId);
        if (focusedNode) {
          let selectionService = bpmnModeler.get("selection");
          selectionService?.select(focusedNode);
          updateTabs({
            element: focusedNode,
          });
        } else {
          setSelectedElement(definitions);
        }
        let elementRegistry = bpmnModeler.get("elementRegistry");
        let modeling = bpmnModeler.get("modeling");
        let nodes = elementRegistry && elementRegistry._elements;
        if (!nodes) return;
        Object.entries(nodes).forEach(([key, value]) => {
          if (!value) return;
          const { element } = value;
          if (!element) return;
          if (["Shape", "Root"].includes(element.constructor.name)) {
            let bo = element.businessObject;
            if (!bo) return;
            if (isConditionalSource(element)) return;
            if (bo.$attrs["camunda:displayStatus"] === "false") return;
            if (
              bo.$attrs &&
              (bo.$attrs["camunda:displayStatus"] === undefined ||
                bo.$attrs["camunda:displayStatus"] === null)
            ) {
              bo.$attrs["camunda:displayStatus"] = true;
            }
          }
          updateTranslations(element, bpmnModeler);
        });

        async function processColors(nodes, modeling) {
          const entries = Object.entries(nodes);
          for (let i = 0; i < entries.length; i++) {
            const [key, value] = entries[i];
            if (!value) continue;
            const { element } = value;
            if (!element) continue;
            if (modeling && element.di) {
              let type = is(element, ["bpmn:Gateway"])
                ? "bpmn:Gateway"
                : element.type;
              let colors = {
                stroke: element.di.stroke || STROKE_COLORS[type],
              };
              if (
                (element.di.fill || FILL_COLORS[type]) &&
                ![
                  "bpmn:SequenceFlow",
                  "bpmn:MessageFlow",
                  "bpmn:Association",
                ].includes(element.type)
              ) {
                colors.fill = element.di.fill || FILL_COLORS[type];
              }

              modeling.setColor(element, colors);
            }
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        }

        try {
          await processColors(nodes, modeling);
          const { xml } = await bpmnModeler.saveXML({ format: true });
          diagramXmlRef.current = xml;
          setInitialState(true);
          setDirty(false);
        } catch (error) {
          console.error(error);
        }
      } catch (error) {
        handleSnackbarClick("danger", "Error! Can't import XML" + error);
      }
    },
    []
  );

  const newBpmnDiagram = React.useCallback(
    function newBpmnDiagram(rec, isDeploy, id, oldWkf) {
      const processId = nextId();
      const diagram =
        rec ||
        `<?xml version="1.0" encoding="UTF-8" ?>
      <bpmn2:definitions 
        xmlns:xs="http://www.w3.org/2001/XMLSchema-instance" 
        xs:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" 
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
        xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" 
        xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
        xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
        xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
        id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn" 
        camunda:newVersionOnDeploy="false">
        <bpmn2:process id="${processId}" isExecutable="true">
          <bpmn2:startEvent id="StartEvent_1" />
        </bpmn2:process>
        <bpmndi:BPMNDiagram id="BPMNDiagram_1">
          <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${processId}">
            <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1" bioc:stroke="#55c041" bioc:fill="#ccecc6">
              <dc:Bounds height="36.0" width="36.0" x="412.0" y="240.0" />
            </bpmndi:BPMNShape>
          </bpmndi:BPMNPlane>
        </bpmndi:BPMNDiagram>
      </bpmn2:definitions>`;
      openBpmnDiagram(diagram, isDeploy, id, oldWkf);
    },
    [openBpmnDiagram]
  );

  const fetchDiagram = React.useCallback(
    async function fetchDiagram(id, isDeploy = false) {
      if (id) {
        const wkf = (await fetchWkf(id)) || {};
        let { diagramXml } = wkf;
        setWkf(wkf);
        update((state) => ({ ...state, record: wkf }));
        newBpmnDiagram(diagramXml, isDeploy, id, wkf);
        return wkf;
      } else {
        newBpmnDiagram(undefined, isDeploy, id);
      }
    },
    [newBpmnDiagram]
  );

  const uploadFile = (e) => {
    let files = e.target.files;
    if (!files?.length) return;
    let reader = new FileReader();
    if (
      files &&
      files[0] &&
      files[0].name &&
      !files[0].name.includes(".bpmn")
    ) {
      handleSnackbarClick("danger", "Upload Bpmn files only");
      return;
    }
    reader.readAsText(files && files[0]);
    reader.onload = (e) => {
      openBpmnDiagram(e.target.result, false);
    };
  };

  function getKeyData(data, key) {
    return (
      data &&
      data.reduce((arrs, item) => {
        if (item.name === key) {
          arrs.push([]);
        }
        arrs[arrs.length - 1] && arrs[arrs.length - 1].push(item);
        return arrs;
      }, [])
    );
  }

  const checkIfUpdated = async () => {
    const { xml } = (await bpmnModeler.saveXML({ format: true })) || {};
    const diagramXml = diagramXmlRef.current;
    return `${diagramXml}` !== `${xml}`;
  };

  const addNewDiagram = React.useCallback(() => {
    setInitialState(false);
    setDirty(false);
    setWkf(null);
    update((state) => ({ ...state, record: null }));
    setId(null);
    newBpmnDiagram();
  }, [newBpmnDiagram]);

  const onRefresh = async () => {
    const isDirty = await checkIfUpdated();
    if (isDirty) {
      openDialog({
        title: "Refresh",
        message: "Current changes will be lost. Do you really want to proceed?",
        onSave: reloadView,
      });
    } else {
      reloadView();
    }
  };

  const updateWkf = React.useCallback(
    async (value) => {
      setInitialState(false);
      setDirty(false);
      const wkf = await fetchWkf(value?.id);
      update((state) => ({ ...state, record: wkf }));
      const { diagramXml, id } = wkf || {};
      setWkf(wkf);
      setId(id);
      newBpmnDiagram(diagramXml, false, id, wkf);
    },
    [newBpmnDiagram]
  );

  const updateWkfModel = React.useCallback(
    async (value, oldValue) => {
      const isDirty = await checkIfUpdated();
      if (isDirty) {
        openDialog({
          title: "Update",
          message:
            "Current changes will be lost. Do you really want to proceed?",
          onSave: () => updateWkf(value),
          onClose: () => setWkf(oldValue),
        });
      } else {
        updateWkf(value);
      }
    },
    [updateWkf]
  );

  const onNew = React.useCallback(
    async (isSkipAlert = false) => {
      const isDirty = await checkIfUpdated();
      if (isDirty && !isSkipAlert) {
        openDialog({
          title: "New",
          message:
            "Current changes will be lost. Do you really want to proceed?",
          onSave: addNewDiagram,
        });
      } else {
        addNewDiagram();
      }
      setError(false);
    },
    [addNewDiagram]
  );

  const getProcessModels = (element) => {
    let bo = getBOParent(element && element.businessObject);
    const extensionElements = bo && bo.extensionElements;
    if (!extensionElements || !extensionElements.values) return [];
    const processConfigurations = extensionElements.values.find(
      (e) => e.$type === "camunda:ProcessConfiguration"
    );
    const metaModels = [],
      metaJsonModels = [];
    if (
      !processConfigurations &&
      !processConfigurations?.processConfigurationParameters
    )
      return [];
    processConfigurations?.processConfigurationParameters.forEach((config) => {
      if (config.metaModel) {
        metaModels.push(config.metaModel);
      } else if (config.metaJsonModel) {
        metaJsonModels.push(config.metaJsonModel);
      }
    });
    return [...metaModels, ...metaJsonModels];
  };
  const onSave = async () => {
    const definitions = bpmnModeler._definitions;
    const attrs = definitions && definitions.$attrs;
    const name = attrs["camunda:diagramName"];
    const code = attrs["camunda:code"];

    if (!name || !code) {
      handleSnackbarClick(
        "danger",
        !name && !code
          ? "Name and code are required."
          : !name
          ? "Name is required."
          : !code
          ? "Code is required."
          : ""
      );
      setError(true);
      return;
    }
    if (showError) {
      setError(false);
    }
    if (!isTimerTask) {
      const elementRegistry = bpmnModeler.get("elementRegistry");
      const timerEvent = elementRegistry.filter((element) => {
        const bo = getBusinessObject(element);
        if (bo && bo.eventDefinitions) {
          let timerDef = bo.eventDefinitions.find(
            (e) => e.$type === "bpmn:TimerEventDefinition"
          );
          if (timerDef) {
            return element;
          }
        }
        return null;
      });
      if (timerEvent && timerEvent.length > 0) {
        handleSnackbarClick("danger", "Timer events are not supported.");
        return;
      }
    }
    let elementRegistry = bpmnModeler.get("elementRegistry");
    let nodes = elementRegistry && elementRegistry._elements;
    let isValid = true;
    nodes &&
      Object.values(nodes).forEach((node) => {
        const viewElement = node.element;
        const businessObject = getBusinessObject(viewElement);
        const extensionElements = businessObject.extensionElements;
        const processModels = getProcessModels(viewElement);
        const nodeName =
          (businessObject && businessObject.name) ||
          (viewElement && viewElement.id);
        if (!viewElement.id) {
          openDialog({
            title: "Error",
            message: `${translate("Id is required in")} ${nodeName}`,
          });
          isValid = false;
          return;
        }
        if (
          [
            "bpmn:EndEvent",
            "bpmn:IntermediateCatchEvent",
            ...USER_TASKS_TYPES,
          ].includes(node.element.type)
        ) {
          let extensionElementValues, camundaProperty;
          if (extensionElements && extensionElements.values) {
            camundaProperty = extensionElements.values.find(
              (e) => e.$type === "camunda:Properties"
            );
            extensionElementValues = camundaProperty && camundaProperty.values;
          }
          if (extensionElementValues && extensionElementValues.length < 1)
            return;
          let models = getKeyData(extensionElementValues, "model");
          let values = [];
          models &&
            models.forEach((modelArr) => {
              let value = { items: [] };
              let items = getKeyData(modelArr, "itemType");
              modelArr.forEach((ele) => {
                if (ele.name === "model") {
                  value.model = { model: ele.value, fullName: ele.value };
                }
                if (ele.name === "modelName") {
                  value.model = { ...value.model, name: ele.value };
                }
                if (ele.name === "modelType") {
                  value.model = { ...value.model, type: ele.value };
                }
                if (ele.name === "modelLabel") {
                  value.modelLabel = ele.value;
                  value.model = { ...value.model, title: ele.value };
                }
                if (ele.name === "view") {
                  value.view = { name: ele.value };
                }
                if (ele.name === "viewLabel") {
                  value.viewLabel = ele.value;
                  value.view = { ...value.view, title: ele.value };
                }
                if (ele.name === "relatedField") {
                  value.relatedField = { name: ele.value };
                }
                if (ele.name === "relatedFieldLabel") {
                  value.relatedFieldLabel = ele.value;
                  value.relatedField = {
                    ...value.relatedField,
                    title: ele.value,
                  };
                }
                if (ele.name === "roles") {
                  if (!ele.value) return;
                  const roles = ele.value.split(",");
                  let valueRoles = [];
                  roles.forEach((role) => {
                    valueRoles.push({ name: role });
                  });
                  value.roles = valueRoles;
                }
              });

              items &&
                items.forEach((item) => {
                  const name = item.find((f) => f.name === "item");
                  const label = item.find((f) => f.name === "itemLabel");
                  const type = item.find((f) => f.name === "itemType");
                  const attribute = item.find((f) =>
                    ALL_ATTRIBUTES.includes(f.name)
                  );
                  const permanent = item.find((f) => f.name === "permanent");
                  value.items.push({
                    itemName: {
                      name: name?.value,
                      label: label?.value,
                      type: type?.value,
                    },
                    itemNameLabel: label && label.value,
                    attributeName: attribute && attribute.name,
                    attributeValue: attribute && attribute.value,
                    permanent: permanent && permanent.value,
                  });
                });
              values.push(value);
            });
          if (values && values.length > 0) {
            values &&
              values.forEach((value) => {
                const { items = [], relatedField, model } = value;
                if (!processModels?.includes(model?.name) && !relatedField) {
                  openDialog({
                    title: "Error",
                    message: `${"Related field is required in"} ${nodeName}`,
                  });
                  isValid = false;
                  return;
                }
                const checkItems = items.filter(
                  (item) => item && (!item.itemName || !item.attributeName)
                );
                if (items.length < 1 || checkItems.length === items.length) {
                  openDialog({
                    title: "Error",
                    message: `${"Item is required in"} ${nodeName}`,
                  });
                  isValid = false;
                  return;
                }
                if (items.length > 0) {
                  items.forEach((item) => {
                    let { itemName, attributeName, attributeValue } = item;
                    if (!itemName || !attributeName) {
                      openDialog({
                        title: "Error",
                        message: `${"Item name is required in"} ${nodeName}`,
                      });
                      isValid = false;
                      return;
                    }
                    if (!attributeValue) {
                      if (
                        ["readonly", "hidden", "required"].includes(
                          attributeName
                        )
                      ) {
                        attributeValue = false;
                      } else {
                        isValid = false;
                        openDialog({
                          title: "Error",
                          message: `${"Item value is required in"} ${nodeName}`,
                        });
                        return;
                      }
                    }
                  });
                }
              });
          }
        }
      });
    if (!isValid) return;
    try {
      const { xml } = await bpmnModeler.saveXML({ format: true });
      diagramXmlRef.current = xml;

      async function getStudioAppValue() {
        if (!attrs["camunda:studioApp"]) return;
        const res = await getStudioApp({
          data: {
            criteria: [
              {
                fieldName: "code",
                operator: "=",
                value: attrs["camunda:studioApp"],
              },
            ],
            operator: "and",
          },
        });
        return res && res[0];
      }
      const studioApp = await getStudioAppValue();
      let res = await Service.add("com.axelor.studio.db.WkfModel", {
        ...wkf,
        diagramXml: xml,
        name: attrs["camunda:diagramName"],
        code: attrs["camunda:code"],
        wkfStatusColor: attrs["camunda:wkfStatusColor"] || "blue",
        versionTag: attrs["camunda:versionTag"],
        description: attrs["camunda:description"],
        newVersionOnDeploy: attrs["camunda:newVersionOnDeploy"] || false,
        studioApp,
      });
      if (res && res.data && res.data[0]) {
        const latestWkf = res.data[0];
        update((state) => ({ ...state, record: latestWkf }));
        /**
         * Even if record is not updated it's version gets changed when saved first time
         */
        if (latestWkf?.version === 0) {
          let res = await fetchWkf(latestWkf?.id);
          setWkf(res);
          setId(res.id);
          addDiagramProperties(res, false);
        } else {
          setWkf(res.data[0]);
          setId(res.data[0].id);
          addDiagramProperties(res.data[0], false);
        }
        setDirty(false);
        handleSnackbarClick("success", "Saved Successfully");
      } else {
        handleSnackbarClick(
          "danger",
          (res && res.data && (res.data.message || res.data.title)) || "Error"
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  function getListeners(bo, type) {
    return (bo && getExtensionElements(bo, type)) || [];
  }

  const getBOParent = React.useCallback((element) => {
    if (
      element &&
      element.$parent &&
      element.$parent.$type !== "bpmn:Process"
    ) {
      return getBOParent(element.$parent);
    } else {
      return element.$parent;
    }
  }, []);

  const getBO = (element) => {
    let bo = getBusinessObject(element);
    if (is(element, "bpmn:Participant")) {
      bo = bo && bo.get("processRef");
    }
    return bo;
  };

  const addNewExecutionElement = (element, type, initialEvent, script) => {
    const bpmnFactory = bpmnModeler.get("bpmnFactory");
    let props = {
      event: initialEvent,
      script: createElement(
        "camunda:Script",
        {
          scriptFormat: "axelor",
          value: script,
        },
        getBO(),
        bpmnFactory
      ),
    };

    let newElem = createElement(type, props, undefined, bpmnFactory);

    newElem.$attrs["outId"] = "dmn_output_mapping";
    let bo = getBO(element);
    let extensionElements = bo && bo.extensionElements;
    if (!extensionElements) {
      extensionElements = createElement(
        "bpmn:ExtensionElements",
        { values: [] },
        bo,
        bpmnFactory
      );
      element.businessObject.extensionElements = extensionElements;
    }
    element.businessObject.extensionElements.values.push(newElem);
    return newElem;
  };

  const callOutoutMapping = async () => {
    const elementRegistry = bpmnModeler.get("elementRegistry");
    let businessRuleElements = elementRegistry.filter(function (element) {
      return is(element, "bpmn:BusinessRuleTask");
    });
    if (!businessRuleElements || businessRuleElements.length < 0) {
      return { status: -1 };
    }
    let elements =
      businessRuleElements &&
      businessRuleElements.filter(
        (e) =>
          e &&
          e.businessObject &&
          e.businessObject.$attrs &&
          getBool(e.businessObject.$attrs["camunda:assignOutputToFields"])
      );
    if (!elements || elements.length < 0) {
      return { status: -1 };
    }
    for (let i = 0; i < elements.length; i++) {
      let element = elements[i];
      if (element && element.businessObject) {
        let ifMultiple =
          element.businessObject.$attrs &&
          element.businessObject.$attrs["camunda:ifMultiple"];

        let searchWith =
          element.businessObject.$attrs &&
          element.businessObject.$attrs["camunda:searchWith"];

        let resultVariable = element.businessObject.resultVariable;
        let decisionId = element.businessObject.decisionRef;

        let ctxModel =
          element.businessObject.$attrs &&
          (element.businessObject.$attrs["camunda:metaModelModelName"] ||
            element.businessObject.$attrs["camunda:metaJsonModelModelName"]);

        let context = {
          decisionId,
          ctxModel,
          searchWith,
          ifMultiple,
          resultVariable,
        };

        let actionResponse = await Service.action({
          model: "com.axelor.studio.db.WkfModel",
          action: "action-wkf-dmn-model-method-create-output-to-field-script",
          data: {
            context,
          },
        });

        if (actionResponse && actionResponse.data && actionResponse.data[0]) {
          const { values } = actionResponse.data[0];
          const { script } = values;
          if (script) {
            let bo = getBO(element);
            const listeners = getListeners(
              bo,
              CAMUNDA_EXECUTION_LISTENER_ELEMENT
            );

            const listener = listeners.find(
              (l) => l && l.$attrs && l.$attrs["outId"] === "dmn_output_mapping"
            );
            if (listener && listener.script) {
              listener.script.value = script;
            } else {
              addNewExecutionElement(
                element,
                CAMUNDA_EXECUTION_LISTENER_ELEMENT,
                "end",
                script
              );
            }
          }
        }
      }
    }
    return { status: 0 };
  };

  const addNewVersion = async (wkf) => {
    let actionRes = await Service.action({
      model: "com.axelor.studio.db.WkfModel",
      action: "action-wkf-model-method-create-new-version",
      data: {
        context: {
          _model: "com.axelor.studio.db.WkfModel",
          ...wkf,
          _signal: "newVersionBtn",
          _source: "newVersionBtn",
          _viewName: "wkf-model-form",
          _viewType: "form",
          __check_version: true,
          _views: [
            { type: "grid", name: "wkf-model-grid" },
            { type: "form", name: "wkf-model-form" },
          ],
        },
      },
    });
    if (actionRes?.data && actionRes.data[0]?.values?.newVersionId) {
      const id = actionRes.data[0].values.newVersionId;
      if (!id) return;
      setId(id);
      return await fetchDiagram(id);
    }
  };

  const deployAction = async (context, newWkf) => {
    let actionRes = await Service.action({
      model: "com.axelor.studio.db.WkfModel",
      action: "action-wkf-model-method-deploy",
      data: {
        context: {
          ...context,
        },
      },
    });
    if (actionRes?.data && actionRes?.data[0] && actionRes?.data[0]?.reload) {
      if (newWkf && newWkf.statusSelect !== 1) {
        await addImage(newWkf?.id);
        handleSnackbarClick("success", "Deployed Successfully");
      }
      fetchDiagram(newWkf.id, true);
      return true;
    } else {
      handleSnackbarClick(
        "danger",
        (actionRes?.data && actionRes?.data[0]?.error?.message) ||
          actionRes?.data?.title ||
          "Error"
      );
      return false;
    }
  };

  const startAction = async (
    newWkf,
    wkfMigrationMap,
    isDeploy = false,
    isMigrateOld
  ) => {
    let actionStart = await Service.action({
      model: "com.axelor.studio.db.WkfModel",
      action: "action-wkf-model-method-start",
      data: {
        context: {
          _model: "com.axelor.studio.db.WkfModel",
          ...newWkf,
        },
      },
    });
    if (actionStart?.data && actionStart.data[0]?.reload) {
      if (isDeploy) {
        await deployAction(
          {
            _model: "com.axelor.studio.db.WkfModel",
            ...newWkf,
            isMigrateOld,
            wkfMigrationMap,
          },
          newWkf
        );
      } else {
        handleSnackbarClick("success", "Started Successfully");
        fetchDiagram(newWkf.id, true);
      }
    } else {
      handleSnackbarClick(
        "danger",
        actionStart?.data?.message || actionStart?.data?.title || "Error"
      );
    }
  };

  const getNewVersionInfo = React.useCallback(() => {
    let attrs = bpmnModeler?._definitions?.$attrs;
    if (!attrs) return false;
    return attrs["camunda:newVersionOnDeploy"];
  }, []);

  const getDefinitionProperties = () => {
    let attrs = bpmnModeler?._definitions?.$attrs;
    return {
      name: attrs["camunda:diagramName"],
      code: attrs["camunda:code"],
      description: attrs["camunda:description"],
      newVersionOnDeploy: attrs["camunda:newVersionOnDeploy"],
      versionTag: attrs["camunda:versionTag"],
      wkfStatusColor: attrs["camunda:wkfStatusColor"],
    };
  };

  const addImage = async (id) => {
    if (!id) return;
    const wkf = (await fetchWkf(id)) || {};
    const bpmnImage = await getBase64SVG();
    let res = await Service.add("com.axelor.studio.db.WkfModel", {
      ...wkf,
      bpmnImage,
    });
    const wkfModel = res?.data && res?.data[0];
    let { diagramXml } = wkfModel;
    setWkf(wkfModel);
    newBpmnDiagram(diagramXml, true, id, wkfModel);
  };

  const saveBeforeDeploy = async (wkfMigrationMap, isMigrateOld, newWkf) => {
    const { xml } = await bpmnModeler.saveXML({ format: true });
    diagramXmlRef.current = xml;
    let res = await Service.add("com.axelor.studio.db.WkfModel", {
      ...newWkf,
      ...(getDefinitionProperties() || {}),
      diagramXml: xml,
    });
    if (res?.data && res?.data[0]) {
      setWkf({ ...res.data[0] });
      let context = {
        _model: "com.axelor.studio.db.WkfModel",
        ...res.data[0],
        wkfMigrationMap,
      };
      if (
        (newWkf?.statusSelect === 1 || getBool(getNewVersionInfo())) &&
        newWkf?.oldNodes
      ) {
        context.isMigrateOld = isMigrateOld;
      }
      return { context, res };
    } else {
      handleSnackbarClick(
        "danger",
        res?.data?.message || res?.data?.title || "Error"
      );
    }
  };

  const deploy = async (wkfMigrationMap, isMigrateOld, newWkf = wkf) => {
    allowProgressBarDisplay && wsProgress.init();
    try {
      const { context, res } =
        (await saveBeforeDeploy(wkfMigrationMap, isMigrateOld, newWkf)) || {};
      if (newWkf?.newVersionOnDeploy && newWkf?.statusSelect === 2) {
        let newVersionWkf = await addNewVersion(newWkf);
        if (newVersionWkf && newVersionWkf.statusSelect === 1) {
          startAction(newVersionWkf, wkfMigrationMap, true, isMigrateOld);
        }
      } else {
        const res = await deployAction(context, newWkf);
        if (!res) {
          return;
        }
      }
      if (newWkf?.statusSelect === 1) {
        startAction(res?.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateCommentsCount = (isIncrement = false) => {
    if (isIncrement) {
      setComments((comments) => comments + 1);
    } else {
      setComments((comments) => comments - 1);
    }
  };

  const handleOk = async (wkfMigrationMap, isMigrateOld) => {
    setDelopyDialog(false);
    if (wkf && wkf.statusSelect === 1) {
      const rootElements =
        bpmnModeler._definitions && bpmnModeler._definitions.rootElements;
      const processes =
        rootElements &&
        rootElements.filter((ele) => ele.$type === "bpmn:Process");
      const processIds = processes.map((process) => process.id);
      if (processIds && processIds.length > 0) {
        const isValidId = await getBPMNModels({
          data: {
            criteria: [
              {
                fieldName: "name",
                operator: "IN",
                value: processIds,
              },
            ],
          },
          limit: 1,
        });
        const wkfProcess = isValidId && isValidId[0];
        const processNames =
          (wkf &&
            wkf.wkfProcessList &&
            wkf.wkfProcessList.map((f) => f.name)) ||
          [];
        if (
          wkfProcess &&
          !wkf.previousVersion &&
          !(
            processNames &&
            processNames.some((item) => processIds && processIds.includes(item))
          )
        ) {
          handleSnackbarClick("danger", "Please provide unique process id");
          return;
        }
      }
    }
    let res = await callOutoutMapping();
    if (res.status === 0) {
      try {
        const { xml } = await bpmnModeler.saveXML({ format: true });
        diagramXmlRef.current = xml;
        let res = await Service.add("com.axelor.studio.db.WkfModel", {
          ...wkf,
          ...(getDefinitionProperties() || {}),
          diagramXml: xml,
        });
        deploy(wkfMigrationMap, isMigrateOld, res && res.data && res.data[0]);
      } catch (err) {
        console.error(err);
      }
    } else {
      deploy(wkfMigrationMap, isMigrateOld);
    }
  };

  const deployDiagram = async () => {
    if (!wkf) return;
    const elements = getElements(bpmnModeler);
    let oldElements = JSON.parse(wkf.oldNodes);
    setIds({
      currentElements: elements,
      oldElements: oldElements,
    });
    setDelopyDialog(true);
  };

  const changeColor = (color) => {
    if (!selectedElement || !color) return;
    let modeling = bpmnModeler.get("modeling");
    let colors = {};
    colors.stroke = color;
    if (
      !["bpmn:SequenceFlow", "bpmn:MessageFlow", "bpmn:Association"].includes(
        selectedElement && selectedElement.type
      )
    ) {
      colors.fill = ["bpmn:Process", "bpmn:Participant", "bpmn:Group"].includes(
        selectedElement && selectedElement.type
      )
        ? "white"
        : lightenColor(color, 0.85);
    }
    modeling.setColor(selectedElement, colors);
  };

  const onDelete = () => {
    openDialog({
      title: "Question",
      message: `Are you sure you want to delete this record?`,
      onSave: async () => {
        const res = await removeWkf(id);
        if (typeof res !== "string") {
          handleSnackbarClick("success", "Deleted Successfully");
          onNew(true);
        } else {
          handleSnackbarClick("danger", res);
        }
      },
    });
  };

  const setProperty = (name, value, isInitial = false) => {
    const definitions = bpmnModeler._definitions;
    let attrs = definitions && definitions.$attrs;
    if (attrs) {
      const newValue =
        !["null", ""].includes(attrs[`camunda:${name}`]) &&
        isInitial &&
        !["null", "", null, undefined].includes(value)
          ? value
          : attrs[`camunda:${name}`]
          ? attrs[`camunda:${name}`]
          : !["null", "", null, undefined].includes(value)
          ? value
          : undefined;
      attrs[`camunda:${name}`] = newValue;
      if (!newValue && name !== "newVersionOnDeploy") {
        delete attrs[`camunda:${name}`];
        return;
      }
    }
  };

  const addDiagramProperties = (wkfParam = wkf, resetElement = true) => {
    const definitions = bpmnModeler._definitions;
    let attrs = definitions && definitions.$attrs;
    if (attrs) {
      if (wkfParam) {
        [
          "code",
          "name",
          "versionTag",
          "studioApp",
          "description",
          "wkfStatusColor",
        ].forEach((key) => {
          if (key === "name") {
            setProperty("diagramName", wkfParam[key]);
          } else if (key === "studioApp") {
            setProperty("studioApp", wkfParam[key] && wkfParam[key].code);
          } else {
            setProperty(key, wkfParam[key]);
          }
        });
      }
    }
    if (resetElement) {
      updateTabs(
        {
          element: definitions,
        },
        false
      );
    }
  };

  const reloadView = () => {
    setInitialState(false);
    setDirty(false);
    fetchDiagram(id);
  };

  const toggleMinimap = () => {
    bpmnModeler?.get("minimap").toggle();
  };

  const zoomIn = () => {
    bpmnModeler?.get("zoomScroll").stepZoom(1);
  };

  const zoomOut = () => {
    bpmnModeler?.get("zoomScroll").stepZoom(-1);
  };

  const resetViewport = () => {
    bpmnModeler?.get("canvas").zoom("fit-viewport", "auto");
  };

  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      // Firefox
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      // Chrome, Safari and Opera
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      // IE/Edge
      elem.msRequestFullscreen();
    }
  };

  const leftToolbar = [
    {
      key: "new",
      iconOnly: true,
      description: translate("Add new"),
      iconProps: {
        icon: "add",
      },
      onClick: () => onNew(),
    },
    {
      key: "save",
      iconOnly: true,
      description: translate("Save"),
      iconProps: {
        icon: "save",
      },
      onClick: onSave,
    },
    {
      key: "delete",
      iconOnly: true,
      description: translate("Delete"),
      iconProps: {
        icon: "delete",
      },
      onClick: onDelete,
    },
    {
      key: "refresh",
      iconOnly: true,
      description: translate("Refresh"),
      iconProps: {
        icon: "refresh",
      },
      onClick: onRefresh,
    },
    {
      key: "deploy",
      iconOnly: true,
      description:
        wkf && wkf.statusSelect === 1
          ? translate("Start")
          : translate("Deploy"),
      iconProps: {
        icon: "rocket",
      },
      onClick: deployDiagram,
      disable: id ? false : true,
    },
    {
      key: "properties",
      iconOnly: true,
      description: translate("Show diagram properties"),
      iconProps: {
        icon: "menu",
      },
      onClick: addDiagramProperties,
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
      onClick: () => downloadXml(bpmnModeler, wkf?.name),
    },
    {
      key: "image",
      iconOnly: true,
      description: translate("Download SVG"),
      iconProps: { icon: "photo" },
      onClick: () => saveSVG(bpmnModeler, wkf?.name),
    },
    {
      key: "split",
      iconOnly: true,
      description: translate("Split"),
      iconProps: { icon: "splitScreen" },
      onClick: () =>
        openWebApp(
          `bpm-merge-split/?type=split&&id=${id}`,
          translate("Split editor")
        ),
    },
    {
      key: "merge",
      iconOnly: true,
      description: translate("Merge"),
      iconProps: { icon: "vertical_split" },
      onClick: () =>
        openWebApp(
          `bpm-merge-split/?type=merge&&id=${id}`,
          translate("Merge editor")
        ),
    },
  ];

  const bottomToolbar = [
    {
      key: "minimap",
      iconOnly: true,
      description: translate("Toggle Minimap"),
      iconProps: { icon: "map" },
      onClick: toggleMinimap,
    },
    {
      key: "zoomIn",
      iconOnly: true,
      description: translate("Zoom In"),
      iconProps: { icon: "add" },
      onClick: zoomIn,
    },
    {
      key: "zoomOut",
      iconOnly: true,
      description: translate("Zoom Out"),
      iconProps: { icon: "remove" },
      onClick: zoomOut,
    },
    {
      key: "resetViewport",
      iconOnly: true,
      description: translate("Reset Viewport"),
      iconProps: { icon: "restart_alt" },
      onClick: resetViewport,
    },
    {
      key: "fullscreen",
      iconOnly: true,
      description: translate("Enter Fullscreen"),
      iconProps: { icon: "fullscreen" },
      onClick: enterFullscreen,
    },
  ];

  function isExtensionElements(element) {
    return is(element, "bpmn:ExtensionElements");
  }

  function createParent(element, bo) {
    const bpmnFactory = bpmnModeler.get("bpmnFactory");

    let parent = createElement(
      "bpmn:ExtensionElements",
      { values: [] },
      bo,
      bpmnFactory
    );
    let cmd = updateBusinessObject(element, bo, {
      extensionElements: parent,
    });
    return {
      cmd: cmd,
      parent: parent,
    };
  }

  function getPropertiesElementInsideExtensionElements(extensionElements) {
    return find(
      extensionElements.$parent.extensionElements &&
        extensionElements.$parent.extensionElements.values,
      function (elem) {
        return is(elem, "camunda:Properties");
      }
    );
  }

  function getPropertiesElement(element) {
    if (!isExtensionElements(element)) {
      return element.properties;
    } else {
      return getPropertiesElementInsideExtensionElements(element);
    }
  }

  const createCamundaProperty = () => {
    const bpmnFactory = bpmnModeler.get("bpmnFactory");
    const bo = getBusinessObject(selectedElement);
    let result = createParent(selectedElement, bo);
    let camundaProperties = createElement(
      "camunda:Properties",
      {},
      result && result.parent,
      bpmnFactory
    );
    selectedElement.businessObject.extensionElements &&
      selectedElement.businessObject.extensionElements.values &&
      selectedElement.businessObject.extensionElements.values.push(
        camundaProperties
      );
  };

  const addProperty = (name, value) => {
    const bo = getBusinessObject(selectedElement);
    const bpmnFactory = bpmnModeler.get("bpmnFactory");
    const businessObject = getBusinessObject(selectedElement);

    let parent;
    let result = createParent(selectedElement, bo);
    parent = result.parent;
    let properties = getPropertiesElement(parent);
    if (!properties) {
      properties = createElement("camunda:Properties", {}, parent, bpmnFactory);
    }

    let propertyProps = {
      name: name,
      value: value,
    };

    let property = createElement(
      "camunda:Property",
      propertyProps,
      properties,
      bpmnFactory
    );

    let camundaProps = bpmnFactory.create("camunda:Properties");
    camundaProps.get("values").push(property);
    if (!businessObject.extensionElements) {
      businessObject.extensionElements = bpmnFactory.create(
        "bpmn:ExtensionElements"
      );
      businessObject.extensionElements.get("values").push(camundaProps);
    } else {
      let camundaProperties = getExtensionElements(bo, "camunda:Properties");
      if (
        camundaProperties &&
        camundaProperties[0] &&
        camundaProperties[0].values
      ) {
        camundaProperties[0].values.push(property);
      } else {
        createCamundaProperty();
        let camundaProperties = getExtensionElements(bo, "camunda:Properties");
        camundaProperties[0].values = [property];
      }
    }
  };

  const addCallActivityExtensionElement = React.useCallback((shape) => {
    if (shape?.type !== "bpmn:CallActivity") {
      return;
    }
    let bo = getBusinessObject(shape);
    const bpmnFactory = bpmnModeler.get("bpmnFactory");
    let { extensionElements } = bo;
    let result = createParent(shape, bo);
    const elements = getElements(bpmnModeler);
    let processId;
    for (const [key, value] of Object.entries(elements)) {
      const activity = value?.elements?.find((v) => v.id === shape.id);
      if (activity) {
        processId = key;
        break;
      }
    }
    let camundaProperties = createElement(
      "camunda:In",
      {
        source: processId,
        target: processId,
      },
      result && result.parent,
      bpmnFactory
    );
    if (!extensionElements) {
      extensionElements = createElement(
        "bpmn:ExtensionElements",
        { values: [camundaProperties] },
        bo,
        bpmnFactory
      );
      bo.extensionElements = extensionElements;
    }
  }, []);

  const handleAdd = (row) => {
    if (!row) return;
    const { values = [] } = row;
    if (values && values.length > 0) {
      values &&
        values.forEach((value) => {
          const {
            model,
            modelLabel,
            view,
            viewLabel,
            relatedField,
            relatedFieldLabel,
            roles = [],
            items = [],
          } = value;
          if (model) {
            addProperty(
              "model",
              model.type === "metaJsonModel"
                ? "com.axelor.meta.db.MetaJsonRecord"
                : model.fullName || model.model
            );
            addProperty("modelName", model.name);
            addProperty("modelLabel", modelLabel);
            addProperty("modelType", model.type);
          }
          if (view) {
            addProperty("view", view.name);
            addProperty("viewLabel", viewLabel);
          }
          if (relatedField) {
            addProperty("relatedField", relatedField.name);
            addProperty("relatedFieldLabel", relatedFieldLabel);
          }
          if (roles?.length > 0) {
            const roleNames = roles.map((role) => role.name);
            addProperty("roles", roleNames.toString());
          }
          if (items.length > 0) {
            items.forEach((item) => {
              const {
                itemName,
                itemNameLabel,
                attributeName,
                attributeValue,
                permanent,
              } = item;
              if (!itemName?.name && !itemName?.title) return;
              if (
                itemName?.type ||
                itemName?.typeName ||
                itemName?.relationship
              ) {
                addProperty(
                  "itemType",
                  itemName.type || itemName?.typeName || itemName.relationship
                );
              }
              if (itemNameLabel) {
                addProperty("itemLabel", itemNameLabel);
              }
              addProperty("permanent", permanent || false);
              addProperty("item", itemName?.name);
              if (attributeName && attributeName !== "" && attributeValue) {
                addProperty(attributeName, attributeValue);
              }
            });
          }
        });
    }
  };

  const updateTabs = React.useCallback(
    (event, isAllowComments = true) => {
      let { element } = event;
      if (element && element.type === "label") {
        const elementRegistry = bpmnModeler.get("elementRegistry");
        const newElement = elementRegistry.get(
          element.businessObject && element.businessObject.id
        );
        element = newElement;
      }
      let tabs = getTabs(bpmnModeler, element, setDummyProperty);
      setTabValue(0);
      setTabs(tabs);
      setSelectedElement(element);
      if (isAllowComments) {
        const commentsLength = getCommentsLength(element);
        setComments(commentsLength);
        checkMenuActionTab(element);
      }
    },
    [checkMenuActionTab]
  );

  const alertUser = (event) => {
    event.preventDefault();
    event.returnValue = translate("Are you sure you want to close the tab?");
  };

  const getModels = React.useCallback((criteria) => {
    return getWkfModels(criteria);
  }, []);

  function setDirty(dirty = true) {
    update((state) => ({ ...state, dirty }));
    const axelor = getAxelorScope();
    if (axelor?.useActiveTab) {
      const [, setTabState] = axelor.useActiveTab();
      setTabState({ dirty });
    }
  }

  async function setDummyProperty() {
    const isDirty = await checkIfUpdated();
    update((state) => ({
      ...state,
      element: selectedElement,
    }));
    setDirty(isDirty);
  }

  const setCSSWidth = (width) => {
    setDrawerOpen(width === "0px" ? false : true);
  };

  const handleToolPanelToggle = (e) => {
    e.preventDefault();
    if (!bpmnModeler) return;
    const linting = bpmnModeler.get("linting");
    if (isOpen && issuePanelHeight >= 50) {
      linting._setActive(false);
      setIssuePanelHeight(0);
      updateElementpaletteHeight(0);
    } else {
      linting._setActive(true);
      setIssuePanelHeight(TOOL_PANEL_MAX_HEIGHT);
      updateElementpaletteHeight(TOOL_PANEL_MAX_HEIGHT);
    }

    setIsOpen((isOpen) => !isOpen);
  };

  const handleToolPanelClose = () => {
    if (!bpmnModeler) return;
    const linting = bpmnModeler.get("linting");
    linting._setActive(false);
    setIssuePanelHeight(0);
    setIsOpen(false);
    updateElementpaletteHeight(0);
  };

  const updateElementpaletteHeight = (height) => {
    const palette = document.querySelector(
      "#bpmnview > .bjs-container > .djs-container > .djs-palette"
    );
    if (!palette) return;
    const width =
      height > PALETTE_WIDTHS.THRESHOLD
        ? PALETTE_WIDTHS.EXPANDED
        : PALETTE_WIDTHS.COLLAPSED;
    palette.style.width = `${width}px`;
  };

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

  useEffect(() => {
    window.top && window.top.addEventListener("beforeunload", alertUser);
    return () => {
      window.top && window.top.removeEventListener("beforeunload", alertUser);
    };
  });

  useEffect(() => {
    if (initialState) {
      const checkDirty = async () => {
        const isDirty = await checkIfUpdated();
        setDirty(isDirty);
      };
      if (!bpmnModeler) return;
      const eventBus = bpmnModeler.get("eventBus");
      eventBus.on("elements.changed", (e) => {
        const linting = bpmnModeler.get("linting");
        linting._setActive(true);
        checkDirty();
      });
      return () => {
        eventBus.off("elements.changed", checkDirty);
      };
    }
  }, [initialState]);

  useEffect(() => {
    let modeler = {
      container: "#bpmnview",
      keyboard: { bindTo: document },
      propertiesPanel: {
        parent: "#js-properties-panel",
      },
      linting: {
        bpmnlint: bpmnlintConfig,
        active: true,
      },
      additionalModules: [
        lintModule,
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule,
        propertiesCustomProviderModule,
        minimapModule,
        TokenSimulationModule,
        {
          elementColors: [
            "value",
            {
              add() {},
              remove() {},
            },
          ],
        },
      ],
      moddleExtensions: {
        camunda: camundaModdleDescriptor,
      },
    };
    bpmnModeler = new BpmnModeler({ ...modeler });
    let { id, timerTask } = fetchId();
    setId(id);
    setIsTimerTask(timerTask);
    fetchDiagram(id);
  }, [fetchDiagram]);

  useEffect(() => {
    if (!bpmnModeler) return;
    let bo = getBusinessObject(selectedElement);
    if (!bo) return;
    bpmnModeler.get("eventBus").on("directEditing.complete", () => {
      setDummyProperty();
    });
  }, [selectedElement]);

  useEffect(() => {
    if (!bpmnModeler) return;

    bpmnModeler.on("commandStack.connection.create.postExecuted", (event) => {
      const element = event?.context?.target;
      setColors(event && event.context && event.context.connection);
      updateTabs({
        element,
      });
    });
    bpmnModeler.on("commandStack.shape.create.postExecuted", (event) => {
      const shape = event?.context?.shape;
      setColors(shape);
      addCallActivityExtensionElement(shape);
    });
    bpmnModeler
      .get("eventBus")
      .on("commandStack.shape.replace.postExecuted", (event) => {
        setColors(event && event.context && event.context.newShape, true);
        updateTabs({
          element: event && event.context && event.context.newShape,
        });
      });
    bpmnModeler.on("element.click", (event) => {
      if (
        ["bpmn:Collaboration", "bpmn:Process", "bpmn:SubProcess"].includes(
          event.element.type
        )
      ) {
        updateTabs(event);
      }
    });
    bpmnModeler.get("eventBus").on("selection.changed", function (event) {
      if (event.newSelection.length > 0) {
        updateTabs({ element: event.newSelection[0] });
      }
    });
    bpmnModeler.on("element.dblclick", (event) => {
      const { element } = event;
      let bo = element.businessObject;
      const isTranslation =
        (bo.$attrs && bo.$attrs["camunda:isTranslations"]) || false;
      const isTranslated = getBool(isTranslation);
      if (isTranslated) {
        handleSnackbarClick(
          "danger",
          "Disable 'Add translations' property or add respective language translation to change label"
        );
        bpmnModeler.get("directEditing").cancel();
      }
    });
    bpmnModeler.on("shape.removed", () => {
      const elementRegistry = bpmnModeler.get("elementRegistry");
      const definitions = bpmnModeler.getDefinitions();
      const element =
        definitions && definitions.rootElements && definitions.rootElements[0];
      if (!element) return;
      const rootElement = elementRegistry.get(element.id);
      if (!rootElement) return;
      updateTabs({
        element: rootElement,
      });
    });

    bpmnModeler.on("linting.completed", function (event) {
      const issuesData = getProblemViewData(event?.issues);
      setIssues(issuesData);
    });
  }, [updateTabs, addCallActivityExtensionElement]);

  useEffect(() => {
    async function fetchApp() {
      const app = await getApp({
        data: {
          _domain: `self.code = 'studio'`,
        },
      });
      if (!app) return;
      const appConfig = await getAppStudioConfig(
        app.appStudio && app.appStudio.id
      );
      setEnableStudioApp(appConfig && appConfig.enableStudioApp);
    }
    fetchApp();
  }, []);

  useEffect(() => {
    const handleProgress = (newProgress) => setProgress(newProgress);
    async function fetchApp() {
      const app = await getApp({
        data: {
          _domain: `self.code = 'bpm'`,
        },
      });
      if (!app) return;
      const appConfig = await getAppBPMConfig(app.appBpm && app.appBpm.id);
      setAllowProgressBarDisplay(appConfig && appConfig.useProgressDeploymentBar);
      if(appConfig.useProgressDeploymentBar) wsProgress.subscribe(handleProgress);
    }
    fetchApp();
    return () => {
      wsProgress.unsubscribe(handleProgress);
    };
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const timeout = setTimeout(() => {
        setProgress(0);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [progress]);

  useKeyPress(["s"], onSave);


  useEffect(() => {
    if (!bpmnModeler || !selectedElement) return;
    const canvas = bpmnModeler.get("canvas");
    const container = canvas.getContainer();
    const contextPad = bpmnModeler.get("contextPad");

    const handleMouseEnter = () => {
      contextPad.open(selectedElement);
    };

    const handleMouseLeave = () => {
      contextPad.close(selectedElement);
    };

    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [bpmnModeler, selectedElement]);
  
  return (
    <React.Fragment>
      <Box id="container">
        <React.Suspense fallback={<></>}>
          {!isTimerTask && <TimerEvents />}
        </React.Suspense>
        <Box id="bpmncontainer" pos="relative" color="body">
          <div id="propview"></div>
          <div id="bpmnview">
            <Box
              d="flex"
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              rounded
              border
              gap="4"
              style={{
                padding: "6px 20px 8px 20px",
                backgroundColor: "var(--bs-tertiary-bg)",
              }}
            >
              <CommandBar items={leftToolbar} className={styles.commandBar} />
              <Box flex="1">
                <Select
                  className={styles.select}
                  disableClearable={true}
                  update={(value, label, oldValue) => {
                    /**Removing wkf model to avoid flickering of updated value await */
                    setWkf("");
                    updateWkfModel(value, oldValue);
                  }}
                  name="wkf"
                  value={wkf}
                  optionLabel="name"
                  optionLabelSecondary="description"
                  isLabel={false}
                  fetchMethod={(criteria) => getModels(criteria)}
                  disableUnderline={false}
                  isOptionEllipsis={true}
                  placeholder={translate("BPM model")}
                />
              </Box>
              <Collaboration />
              <CommandBar items={rightToolbar} className={styles.commandBar} />
              <input
                id="inputFile"
                type="file"
                name="file"
                onChange={uploadFile}
                style={{ display: "none" }}
              />
            </Box>
          </div>
          <CommandBar items={bottomToolbar} className={styles.bottomBar} />
        </Box>
        <Box position="sticky" top={0} right={0} h={100}>
          <Resizable
            style={resizeStyle}
            size={{ width, height }}
            onResizeStop={(e, direction, ref, d) => {
              setWidth((width) => width + d.width);
              setHeight((height) => height + d.height);
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
            <Box className={styles.drawerPaper} maxH={100}>
              <Box className={styles.drawerContainer}>
                <DrawerContent
                  tabs={tabs}
                  tabValue={tabValue}
                  handleChange={handleChange}
                  isMenuActionDisable={isMenuActionDisable}
                  comments={comments}
                  selectedElement={selectedElement}
                  id={id}
                  handleAdd={handleAdd}
                  wkf={wkf}
                  reloadView={reloadView}
                  onSave={onSave}
                  openSnackbar={openSnackbar}
                  handleMenuActionTab={handleMenuActionTab}
                  updateCommentsCount={updateCommentsCount}
                  handleSnackbarClick={handleSnackbarClick}
                  enableStudioApp={enableStudioApp}
                  addNewVersion={addNewVersion}
                  changeColor={changeColor}
                  bpmnModeler={bpmnModeler}
                  showError={showError}
                  setDummyProperty={setDummyProperty}
                />
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
            <div
              className="properties-panel-parent"
              id="js-properties-panel"
            ></div>
          </Resizable>
        </Box>
        {openSnackbar.open && (
          <Alert
            open={openSnackbar.open}
            message={openSnackbar.message}
            messageType={openSnackbar.messageType}
            onClose={handleSnackbarClose}
          />
        )}

        {openDelopyDialog && (
          <DeployDialog
            open={openDelopyDialog}
            onClose={() => setDelopyDialog(false)}
            ids={ids}
            getNewVersionInfo={getNewVersionInfo}
            onOk={(wkfMigrationMap, isMigrateOld) =>
              handleOk(wkfMigrationMap, isMigrateOld)
            }
            element={selectedElement}
            wkf={wkf}
          />
        )}
      </Box>
      {allowProgressBarDisplay &&  progress > 0 && (
          <div className={styles.overlay}>
            <div className={styles.loaderContainer}>
              <Loader
                  classes={styles.loader}
                  text={`${progress}% migration is done...`}
              />
            </div>
          </div>

      )}
      <Resizable
        size={{ width: "100%", height: issuePanelHeight }}
        maxHeight={TOOL_PANEL_MAX_HEIGHT}
        minHeight={0}
        enable={{
          top: true,
        }}
        style={issuePanelStyle}
        onResizeStop={(e, direction, ref, d) => {
          const height = issuePanelHeight + d.height;
          setIssuePanelHeight(height);
          updateElementpaletteHeight(height);
        }}
      >
        <IssuePanel issues={issues} bpmnModeler={bpmnModeler} t={translate} />
        <IconButton
          className={styles.closePanelBtn}
          onClick={handleToolPanelClose}
        >
          <MaterialIcon icon="close" fontSize={16} />
        </IconButton>
      </Resizable>
      <Box className={styles.footer}>
        <Button className={styles.issueViewBtn} onClick={handleToolPanelToggle}>
          <Box className="flexCenter" gap={10}>
            <Icons type={ICON_TYPE.ERROR} disabled={!issues.errors?.length} />
            <Box> {issues.errors?.length || 0}</Box>
            <Icons
              type={ICON_TYPE.WARNING}
              disabled={!issues.warnings?.length}
            />
            <Box>{issues.warnings?.length || 0}</Box>
          </Box>
        </Button>
        <Logo />
      </Box>
    </React.Fragment>
  );
}

export default BpmnModelerComponent;
