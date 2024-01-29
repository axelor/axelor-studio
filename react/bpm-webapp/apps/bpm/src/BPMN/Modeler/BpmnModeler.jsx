import React, { useEffect, useState } from "react";
import find from "lodash/find";
import BpmnModeler from "bpmn-js/lib/Modeler";
import propertiesPanelModule from "bpmn-js-properties-panel";
import propertiesProviderModule from "bpmn-js-properties-panel/lib/provider/camunda";
import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import extensionElementsHelper from "bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper";
import tokenSimulation from "bpmn-js-token-simulation/lib/modeler";
import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { makeStyles } from "@material-ui/core/styles";
import { Resizable } from "re-resizable";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import { useAppTheme } from "../../custom-hooks/useAppTheme.jsx";
import { Logo } from "../../components/Logo";
import DrawerContent from "./DrawerContent";
import propertiesCustomProviderModule from "./custom-provider";
import camundaModdleDescriptor from "./resources/camunda.json";
import Service from "../../services/Service";
import AlertDialog from "../../components/AlertDialog";
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
} from "../../services/api";
import {
  getAxelorScope,
  getBool,
  translate,
  convertSVGtoBase64,
  lightenColor,
} from "../../utils";
import {
  FILL_COLORS,
  USER_TASKS_TYPES,
  STROKE_COLORS,
  CONDITIONAL_SOURCES,
} from "./constants";
import { ALL_ATTRIBUTES } from "./properties/parts/CustomImplementation/constants";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "bpmn-js-properties-panel/dist/assets/bpmn-js-properties-panel.css";
import "../css/bpmn.css";
import "../css/colors.css";
import { useKeyPress } from "../../custom-hooks/useKeyPress";
import Ids from "ids";
import Alert from "../../components/Alert";
import { Box, CommandBar, Scrollable } from "@axelor/ui";

const resizeStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const drawerWidth = 380;
const CAMUNDA_EXECUTION_LISTENER_ELEMENT = "camunda:ExecutionListener";

const TimerEvents = React.lazy(() => import("./TimerEvent"));

const useStyles = makeStyles((theme) => ({
  drawerPaper: {
    background: "var(--bs-tertiary-bg)",
    padding: 0,
    width: "100%",
    position: "absolute",
    overflow: "auto",
    height: "100%",
    zIndex: 2,
  },
  drawerContainer: {
    padding: 10,
    height: "100%",
    width: "100%",
  },
  select: {
    minWidth: 150,
    marginTop: 0,
  },
  commandBar: {
    "& > div": {
      "& > button": {
        fontSize: 14,
      },
    },
  },
}));

let bpmnModeler = null;

function isConditionalSource(element) {
  return isAny(element, CONDITIONAL_SOURCES);
}

function nextId() {
  let ids = new Ids([32, 32, 1]);
  return ids.nextPrefixed("Process_");
}

function setColors(element, forceUpdate = false) {
  if (
    element.businessObject &&
    element.businessObject.di &&
    (element.businessObject.di.stroke || element.businessObject.di.fill) &&
    !forceUpdate
  ) {
    return;
  }
  let modeling = bpmnModeler.get("modeling");
  let colors = {};
  if (is(element, ["bpmn:Gateway"])) {
    colors.stroke = STROKE_COLORS["bpmn:Gateway"];
    colors.fill = FILL_COLORS["bpmn:Gateway"];
    element.businessObject.di.set("stroke", STROKE_COLORS["bpmn:Gateway"]);
    element.businessObject.di.set("fill", FILL_COLORS["bpmn:Gateway"]);
  } else {
    element.businessObject.di.set("stroke", STROKE_COLORS[element.type]);
    colors.stroke = STROKE_COLORS[element.type];
    if (
      FILL_COLORS[element.type] &&
      !["bpmn:SequenceFlow", "bpmn:MessageFlow", "bpmn:Association"].includes(
        element.type
      )
    ) {
      colors.fill = FILL_COLORS[element.type];
      element.businessObject.di.set("fill", FILL_COLORS[element.type]);
    }
  }
  modeling.setColor(element, colors);
}

function BpmnModelerComponent() {
  const [wkf, setWkf] = useState(null);
  const [id, setId] = useState(null);
  const [openAlert, setAlert] = useState({
    open: false,
    alertMessage: "Item is required.",
    title: "Error",
  });
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
  const [width, setWidth] = useState(drawerWidth);
  const [height, setHeight] = useState("100%");
  const [enableStudioApp, setEnableStudioApp] = useState(false);
  const [showError, setError] = useState(false);
  const [initialState, setInitialState] = useState(false);
  const { theme } = useAppTheme();

  const classes = useStyles();
  const diagramXmlRef = React.useRef(null);

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

  const alertOpen = (
    actions,
    alertMessage = "Item is required.",
    title = "Error"
  ) => {
    const { onOk = () => {}, onCancel = () => {} } = actions || {
      onOk: () => {},
      onCancel: () => {},
    };
    setAlert({
      open: true,
      alertMessage,
      title,
      onOk,
      onCancel,
    });
  };

  const handleAlertAction = (key) => {
    if (openAlert?.onCancel && key === "cancel") {
      openAlert.onCancel();
    } else if (openAlert?.onOk && key === "ok") {
      openAlert.onOk();
    }
    setAlert({
      open: false,
      alertMessage: "Item is required.",
      title: "Error",
    });
  };

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

  const updateTranslations = async (element, bpmnModeler, key) => {
    if (!key) return;
    const bo = getBusinessObject(element);
    if (!bo) return;
    const isTranslation =
      (bo.$attrs && bo.$attrs["camunda:isTranslations"]) || false;
    if (!getBool(isTranslation)) return;
    const translations = await getTranslations(key);
    if (translations && translations.length > 0) {
      const info = await getInfo();
      const language = info && info["user.lang"];
      if (!language) return;
      const selectedTranslation = translations.find(
        (t) => t.language === language
      );
      if (!element) return;
      const value = selectedTranslation && selectedTranslation.message;
      const bo = element && element.businessObject;
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
      let elementRegistry = bpmnModeler.get("elementRegistry");
      let modeling = bpmnModeler.get("modeling");
      let shape = elementRegistry.get(element.id);
      if (!shape) return;
      modeling &&
        modeling.updateProperties(shape, {
          [modelProperty]: diagramValue,
        });
    }
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
        setSelectedElement(definitions);
        let elementRegistry = bpmnModeler.get("elementRegistry");
        let modeling = bpmnModeler.get("modeling");
        let nodes = elementRegistry && elementRegistry._elements;
        if (!nodes) return;
        Object.entries(nodes).forEach(([key, value]) => {
          if (!value) return;
          const { element } = value;
          if (!element) return;
          if (modeling && element.businessObject && element.businessObject.di) {
            let type = is(element, ["bpmn:Gateway"])
              ? "bpmn:Gateway"
              : element.type;
            let colors = {
              stroke: element.businessObject.di.stroke || STROKE_COLORS[type],
            };
            if (
              (element.businessObject.di.fill || FILL_COLORS[type]) &&
              ![
                "bpmn:SequenceFlow",
                "bpmn:MessageFlow",
                "bpmn:Association",
              ].includes(element.type)
            ) {
              colors.fill = element.businessObject.di.fill || FILL_COLORS[type];
            }
            modeling.setColor(element, colors);
          }
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
          let bo = getBusinessObject(element);
          const elementType = element && element.type;
          let modelProperty =
            elementType === "bpmn:TextAnnotation"
              ? "text"
              : elementType === "bpmn:Group"
              ? "categoryValue"
              : "name";
          let nameKey =
            element.businessObject.$attrs["camunda:key"] ||
            (bo && bo.get([modelProperty]));
          updateTranslations(element, bpmnModeler, nameKey);
        });
        try {
          const { xml } = await bpmnModeler.saveXML({ format: true });
          diagramXmlRef.current = xml;
          setInitialState(true);
          setDirty(false);
        } catch (error) {
          console.error(error);
        }
      } catch (error) {
        handleSnackbarClick("danger", "Error! Can't import XML");
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
    setId(null);
    newBpmnDiagram();
  }, [newBpmnDiagram]);

  const onRefresh = async () => {
    const isDirty = await checkIfUpdated();
    if (isDirty) {
      alertOpen(
        {
          onOk: reloadView,
        },
        "Current changes will be lost. Do you really want to proceed?",
        "Refresh"
      );
    } else {
      reloadView();
    }
  };

  const updateWkf = React.useCallback(
    async (value) => {
      setInitialState(false);
      setDirty(false);
      const wkf = await fetchWkf(value?.id);
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
        alertOpen(
          {
            onOk: () => updateWkf(value),
            onCancel: () => setWkf(oldValue),
          },
          "Current changes will be lost. Do you really want to proceed?",
          "Update"
        );
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
        alertOpen(
          {
            onOk: addNewDiagram,
          },
          "Current changes will be lost. Do you really want to proceed?",
          "New"
        );
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
          alertOpen(null, `${translate("Id is required in")} ${nodeName}`);
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
                  alertOpen(
                    null,
                    `${"Related field is required in"} ${nodeName}`
                  );
                  isValid = false;
                  return;
                }
                const checkItems = items.filter(
                  (item) => item && (!item.itemName || !item.attributeName)
                );
                if (items.length < 1 || checkItems.length === items.length) {
                  alertOpen(null, `${"Item is required in"} ${nodeName}`);
                  isValid = false;
                  return;
                }
                if (items.length > 0) {
                  items.forEach((item) => {
                    let { itemName, attributeName, attributeValue } = item;
                    if (!itemName || !attributeName) {
                      alertOpen(
                        null,
                        `${"Item name is required in"} ${nodeName}`
                      );
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
                        alertOpen(
                          null,
                          `${"Item value is required in"} ${nodeName}`
                        );
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
    return (bo && extensionElementsHelper.getExtensionElements(bo, type)) || [];
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
      script: elementHelper.createElement(
        "camunda:Script",
        {
          scriptFormat: "axelor",
          value: script,
        },
        getBO(),
        bpmnFactory
      ),
    };

    let newElem = elementHelper.createElement(
      type,
      props,
      undefined,
      bpmnFactory
    );

    newElem.$attrs["outId"] = "dmn_output_mapping";
    let bo = getBO(element);
    let extensionElements = bo && bo.extensionElements;
    if (!extensionElements) {
      extensionElements = elementHelper.createElement(
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
    } else {
      handleSnackbarClick(
        "danger",
        (actionRes?.data && actionRes?.data[0]?.error?.message) ||
          actionRes?.data?.title ||
          "Error"
      );
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
    try {
      const { context, res } =
        (await saveBeforeDeploy(wkfMigrationMap, isMigrateOld, newWkf)) || {};
      if (newWkf?.newVersionOnDeploy && newWkf?.statusSelect === 2) {
        let newVersionWkf = await addNewVersion(newWkf);
        if (newVersionWkf && newVersionWkf.statusSelect === 1) {
          startAction(newVersionWkf, wkfMigrationMap, true, isMigrateOld);
        }
      } else {
        await deployAction(context, newWkf);
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
    alertOpen(
      {
        onOk: async () => {
          const res = await removeWkf(id);
          if (typeof res !== "string") {
            handleSnackbarClick("success", "Deleted Successfully");
            onNew(true);
          } else {
            handleSnackbarClick("danger", res);
          }
        },
      },
      `Are you sure you want to delete this record?`,
      "Question"
    );
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
  ];

  function isExtensionElements(element) {
    return is(element, "bpmn:ExtensionElements");
  }

  function createParent(element, bo) {
    const bpmnFactory = bpmnModeler.get("bpmnFactory");

    let parent = elementHelper.createElement(
      "bpmn:ExtensionElements",
      { values: [] },
      bo,
      bpmnFactory
    );
    let cmd = cmdHelper.updateBusinessObject(element, bo, {
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
    let camundaProperties = elementHelper.createElement(
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
      properties = elementHelper.createElement(
        "camunda:Properties",
        {},
        parent,
        bpmnFactory
      );
    }

    let propertyProps = {
      name: name,
      value: value,
    };

    let property = elementHelper.createElement(
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
      let camundaProperties = extensionElementsHelper.getExtensionElements(
        bo,
        "camunda:Properties"
      );
      if (
        camundaProperties &&
        camundaProperties[0] &&
        camundaProperties[0].values
      ) {
        camundaProperties[0].values.push(property);
      } else {
        createCamundaProperty();
        let camundaProperties = extensionElementsHelper.getExtensionElements(
          bo,
          "camunda:Properties"
        );
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
    let camundaProperties = elementHelper.createElement(
      "camunda:In",
      {
        source: processId,
        target: processId,
      },
      result && result.parent,
      bpmnFactory
    );
    if (!extensionElements) {
      extensionElements = elementHelper.createElement(
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
    const axelor = getAxelorScope();
    if (axelor?.useActiveTab) {
      const [, setTabState] = axelor.useActiveTab();
      setTabState({ dirty });
    }
  }

  async function setDummyProperty() {
    const isDirty = await checkIfUpdated();
    setDirty(isDirty);
  }

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
      eventBus.on("elements.changed", checkDirty);
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
      additionalModules: [
        propertiesPanelModule,
        propertiesProviderModule,
        propertiesCustomProviderModule,
        tokenSimulation,
        {
          preserveElementColors: ["value", {}],
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
      updateTabs(event);
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

  useKeyPress(["s"], onSave);

  return (
    <React.Fragment>
      <Box id="container">
        <React.Suspense fallback={<></>}>
          {!isTimerTask && <TimerEvents />}
        </React.Suspense>
        <Box id="bpmncontainer" color="body">
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
              <CommandBar items={leftToolbar} className={classes.commandBar} />
              <Box flex="1">
                <Select
                  className={classes.select}
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
              <CommandBar items={rightToolbar} className={classes.commandBar} />
              <input
                id="inputFile"
                type="file"
                name="file"
                onChange={uploadFile}
                style={{ display: "none" }}
              />
            </Box>
          </div>
        </Box>
        <div>
          <Resizable
            style={resizeStyle}
            size={{ width, height }}
            onResizeStop={(e, direction, ref, d) => {
              setWidth((width) => width + d.width);
              setHeight(height + d.height);
            }}
            minWidth={width === 0 ? width : drawerWidth}
            maxWidth={window.innerWidth - 150}
          >
            <Scrollable className={classes.drawerPaper}>
              <Box className={classes.drawerContainer}>
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
            </Scrollable>
            <Box
              className="bpmn-property-toggle"
              color="body"
              pos="absolute"
              bg="body-tertiary"
              userSelect="none"
              roundedTop
              fontSize={6}
              onClick={() => {
                setWidth((width) => (width === 0 ? 380 : 0));
              }}
            >
              {translate("Properties")}
            </Box>
          </Resizable>
          <div
            className="properties-panel-parent"
            id="js-properties-panel"
          ></div>
        </div>
        {openSnackbar.open && (
          <Alert
            open={openSnackbar.open}
            message={openSnackbar.message}
            messageType={openSnackbar.messageType}
            onClose={handleSnackbarClose}
          />
        )}
        {openAlert?.open && (
          <AlertDialog
            openAlert={openAlert?.open}
            alertClose={() => handleAlertAction("cancel")}
            handleAlertOk={() => handleAlertAction("ok")}
            message={openAlert?.alertMessage}
            title={openAlert?.title}
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
      <Logo />
    </React.Fragment>
  );
}

export default BpmnModelerComponent;
