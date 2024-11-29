import React, { useState, useEffect, useCallback } from "react";
import { createElement as _createElement } from "../../../../../utils/ElementUtil";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import IconButton from "../../../../../components/IconButton";

import Tooltip from "../../../../../components/Tooltip";
import Select from "../../../../../components/Select";
import {
  TextField,
  Checkbox,
  Table as AxTable,
  Textbox,
} from "../../../../../components/properties/components";
import {
  getParentMenus,
  getSubMenus,
  getViews,
  getTemplates,
  getRoles,
  getMenu,
} from "../../../../../services/api";
import { translate, getBool } from "../../../../../utils";
import {
  createElement,
  createParameter,
  getExtensionElementProperties,
  nextId,
  openTabView,
} from "./utils";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
  InputLabel,
  Box,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Table,
  clsx,
} from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import ScriptDialog from "./ScriptDialog";
import styles from "./menu-action.module.css";
import AlertDialog from "../../../../../components/AlertDialog";
import { FieldAction } from "./ModelProps";
import useDialog from "../../../../../hooks/useDialog";

const PRIORITIES = [
  { value: "low", id: "low", title: "Low" },
  { value: "normal", id: "normal", title: "Normal" },
  { value: "high", id: "high", title: "High" },
  { value: "urgent", id: "urgent", title: "Urgent" },
];

const TYPES = [
  { value: "value", id: "value", title: "Value" },
  { value: "field", id: "field", title: "Field" },
  { value: "script", id: "script", title: "Script" },
];

const menuObj = {
  menuName: null,
  menuParent: null,
  position: null,
  positionMenu: null,
  permanent: false,
  tagCount: false,
  isUserMenu: false,
  formView: null,
  gridView: null,
  domain: null,
  roles: [],
  menuContexts: [],
};

export function createMenus(parent, bpmnFactory, properties) {
  return createElement("camunda:Menus", parent, bpmnFactory, properties);
}

export default function MenuActionPanel({
  element,
  bpmnFactory,
  bpmnModeler,
  setDummyProperty = () => {},
}) {
  const [createUserAction, setCreateUserAction] = useState(false);
  const [emailNotification, setEmailNotification] = useState(false);
  const [model, setModel] = useState(null);
  const [template, setTemplate] = useState(null);
  const [emailEvent, setEmailEvent] = useState();
  const [openExpressionAlert, setExpressionAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [menus, setMenus] = useState([]);
  const [actionDummy, setActionDummy] = useState({
    taskName: null,
    taskPriority: null,
    description: null,
  });
  const [taskFields, setTaskFields] = useState({
    taskName: null,
    taskPriority: null,
    duration: null,
  });
  const [fieldTypes, setFieldTypes] = useState(null);
  const [selectedTaskOption, setSelectedTaskOption] = useState({
    taskNameType: "Value",
    priorityType: "Value",
    descriptionType: "Value",
  });
  const [openScriptDialog, setOpenScriptDialog] = useState(false);
  const [openValueTextBox, setOpenValueTextBox] = useState(false);
  const [metaModel, setMetaModel] = useState(null);
  const openDialog = useDialog();

  const USER_ACTIONS_HEADER = [
    { label: "Task field", className: styles.leftAlign },
    { label: "Type" },
    { label: "Value" },
    { label: "Action" },
  ];

  const closeEditor = () => {
    setOpenValueTextBox(false);
  };

  const filterTypes = (type1, type2) => {
    const excludeValues = [type1, type2];
    return TYPES.filter((task) => !excludeValues.includes(task.value));
  };

  const setProperty = useCallback(
    (name, value) => {
      setDummyProperty({ bpmnModeler, element, value });
      const bo = getBusinessObject(element);
      let propertyName = `camunda:${name}`;
      if (!bo) return;
      if (bo.$attrs) {
        bo.$attrs[propertyName] = value;
      } else {
        bo.$attrs = { [propertyName]: value };
      }
      if (!value) {
        delete bo.$attrs[propertyName];
      }
    },
    [element, bpmnModeler]
  );

  const updatePropertyValue = (name, value, optionLabel = "name") => {
    if (!value) {
      setProperty(name, undefined);
      return;
    }
    setProperty(name, value[optionLabel]);
  };

  const updateMenuValue = (name, value, label, optionLabel = "name") => {
    updatePropertyValue(name, value, optionLabel);
    if (!value) {
      setProperty(`${name}Label`, undefined);
      return;
    }
    setProperty(`${name}Label`, label);
  };

  const getProperty = useCallback(
    (name) => {
      let propertyName = `camunda:${name}`;
      const bo = getBusinessObject(element);
      return (bo.$attrs && bo.$attrs[propertyName]) || "";
    },
    [element]
  );

  const hasProperty = useCallback(
    (name) => {
      let propertyName = `camunda:${name}`;
      const bo = getBusinessObject(element);
      return bo.$attrs && bo.$attrs.hasOwnProperty(propertyName);
    },
    [element]
  );

  const handleChange = (name, value) => {
    setTaskFields((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const getScript = useCallback((name) => {
    return getProperty(name)?.replace(/[\u200B-\u200D\uFEFF]/g, "");
  }, []);

  const getSelectValue = useCallback(
    (name) => {
      let label = getProperty(`${name}Label`);
      let fullName = getProperty(`${name}ModelName`);
      let newName = getProperty(name);
      if (newName) {
        let value = { name: newName };
        if (label) {
          value.title = label;
        }
        if (fullName) {
          value.fullName = fullName;
        }
        return value;
      } else {
        return null;
      }
    },
    [getProperty]
  );

  const getElements = (key) => {
    const menus = getMenuParameters();
    if (!menus?.length) return;
    return menus[key]?.contexts || [];
  };

  const updateContextElement = (value, label, optionIndex, key) => {
    const menus = getMenuParameters();
    if (!menus?.length) return;
    const contexts = menus[key]?.contexts || [];
    const entry = contexts[optionIndex];
    entry[label] = value;
  };

  const addContextElement = (entryValue, key) => {
    const menus = getMenuParameters();
    if (!menus?.length) return;
    const contexts = menus[key]?.contexts || [];
    let newEntry = createElement(
      "camunda:Context",
      menus[key],
      bpmnFactory,
      entryValue
    );
    contexts.push(newEntry);
    menus[key].contexts = contexts;
  };

  const removeContextElement = (optionIndex, key) => {
    const menus = getMenuParameters();
    if (!menus?.length) return;
    const contexts = menus[key]?.contexts || [];
    contexts.splice(optionIndex, 1);
  };

  function getBO(element) {
    if (
      element &&
      element.$parent &&
      element.$parent.$type !== "bpmn:Process"
    ) {
      return getBO(element.$parent);
    } else {
      return element.$parent;
    }
  }

  function getProcessConfig() {
    let bo = getBO(element && element.businessObject);
    if (element.type === "bpmn:Process") {
      bo = element.businessObject;
    }
    if (
      (element && element.businessObject && element.businessObject.$type) ===
      "bpmn:Participant"
    ) {
      bo =
        element && element.businessObject && element.businessObject.processRef;
    }
    const noOptions = {
      criteria: [
        {
          fieldName: "metaModel.name",
          operator: "IN",
          value: [""],
        },
        {
          fieldName: "metaJsonModel.name",
          operator: "IN",
          value: [""],
        },
      ],
    };
    const extensionElements = bo && bo.extensionElements;
    if (!extensionElements || !extensionElements.values) return noOptions;
    const processConfigurations = extensionElements.values.find(
      (e) => e.$type === "camunda:ProcessConfiguration"
    );
    const metaModels = [],
      metaJsonModels = [];
    if (
      !processConfigurations &&
      !processConfigurations.processConfigurationParameters
    )
      return noOptions;
    processConfigurations.processConfigurationParameters.forEach((config) => {
      if (config.metaModel) {
        metaModels.push(config.metaModel);
      } else if (config.metaJsonModel) {
        metaJsonModels.push(config.metaJsonModel);
      }
    });

    const criteria = [];
    if (metaModels.length > 0) {
      criteria.push({
        fieldName: "metaModel.name",
        operator: "IN",
        value: metaModels,
      });
    }
    if (metaJsonModels.length > 0) {
      criteria.push({
        fieldName: "metaJsonModel.name",
        operator: "IN",
        value: metaJsonModels,
      });
    }
    const data = {
      criteria: criteria,
      operator: "or",
    };
    return data;
  }

  const getMenuParameters = useCallback(
    (field = "menuParameters") => {
      const config = getExtensionElementProperties(element, "camunda:Menus");
      return (config && config[field]) || [];
    },
    [element]
  );

  const updateElement = (value, label, optionIndex) => {
    let entries = getMenuParameters();
    if (!entries) return;
    const entry = entries[optionIndex];
    if (entry) {
      if (value || typeof value === "boolean") {
        entry[label] = value;
      } else {
        delete entry[label];
      }
    }
  };

  const newElement = function (
    type,
    prop,
    element,
    extensionElements,
    bpmnFactory
  ) {
    let bo = getBusinessObject(element);
    if (!extensionElements) {
      extensionElements = _createElement(
        "bpmn:ExtensionElements",
        { values: [] },
        bo,
        bpmnFactory
      );
      bo.extensionElements = extensionElements;
    }

    let menus = getExtensionElementProperties(element, "camunda:Menus");
    if (!menus) {
      let parent = bo.extensionElements;
      menus = createMenus(parent, bpmnFactory, {
        menuParameters: [],
      });
      let newElem = createParameter(prop, menus, bpmnFactory, {});
      newElem.permanent = "false";
      newElem.tagCount = "false";
      newElem.isUserMenu = "false";
      newElem.menuId = nextId(`${element?.id?.toLowerCase()}-`);
      menus[type] = [newElem];
      bo.extensionElements.values.push(menus);
    }
  };

  const addElement = (parameterType, type) => {
    let bo = getBusinessObject(element);
    if ((element && element.type) === "bpmn:Participant") {
      bo = getBusinessObject(bo && bo.processRef);
    }
    if (bo?.extensionElements?.values) {
      const menus = getExtensionElementProperties(element, "camunda:Menus");
      if (!menus) {
        newElement(
          parameterType,
          type,
          element,
          bo.extensionElements,
          bpmnFactory
        );
      } else {
        let newElem = createParameter(type, menus, bpmnFactory, {});
        newElem.permanent = "false";
        newElem.tagCount = "false";
        newElem.isUserMenu = "false";
        newElem.menuId = nextId(`${element?.id?.toLowerCase()}-`);
        if (!menus[parameterType] || menus[parameterType]?.length === 0) {
          menus[parameterType] = [newElem];
        } else {
          menus[parameterType].push(newElem);
        }
      }
    } else {
      newElement(
        parameterType,
        type,
        element,
        bo.extensionElements,
        bpmnFactory
      );
    }
  };

  const updateScript = (fieldType) => {
    const extractDummyField = {
      taskPriority: actionDummy,
      taskName: actionDummy,
      description: actionDummy,
    };
    const extractTypes = {
      taskName: "taskNameType",
      taskPriority: "priorityType",
      description: "descriptionType",
    };
    const propertiesType = {
      taskName: selectedTaskOption.taskNameType,
      taskPriority: selectedTaskOption.priorityType,
      description: selectedTaskOption.descriptionType,
    };

    // Retrieve the relevant dummy object based on fieldType
    const { [fieldType]: fieldPathDummy } = extractDummyField;
    if (!fieldPathDummy) return;

    if (fieldPathDummy[fieldType] === "") {
      //remove the property
      setProperty(extractTypes[fieldType], undefined);
    } else {
      // set the property
      setProperty(extractTypes[fieldType], propertiesType[fieldType]);
    }

    // Extract field path and field path value from the dummy object
    const {
      [`${fieldType}Value`]: fieldPathValue,
      [`${fieldType}`]: fieldPath,
    } = fieldPathDummy || {};

    if (fieldPath) {
      setTaskFields((prevState) => ({
        ...prevState,
        [fieldType]: fieldPath,
      }));
      setActionDummy((prev) => ({ ...prev, [fieldType]: fieldPath }));
      setProperty(fieldType, fieldPath);
      setProperty(`${fieldType}Value`, fieldPathValue);
    }
  };

  const removeElement = (optionIndex) => {
    let menus = getMenuParameters();
    if (optionIndex < 0) return;
    menus?.splice(optionIndex, 1);
    if (menus?.length === 0) {
      let bo = getBusinessObject(element);
      if ((element && element.type) === "bpmn:Participant") {
        bo = getBusinessObject(bo && bo.processRef);
      }
      const extensionElements = bo.extensionElements;
      if (!extensionElements || !extensionElements.values) return null;
      const menuIndex = extensionElements.values.findIndex(
        (e) => e.$type === "camunda:Menus"
      );
      if (menuIndex < 0) return;
      extensionElements?.values?.splice(menuIndex, 1);
      if (extensionElements?.values?.length === 0) {
        bo.extensionElements = undefined;
      }
    }
  };

  const addItems = () => {
    const cloneMenus = [...(menus || [])];
    cloneMenus.push({ ...menuObj });
    setMenus(cloneMenus);
    addElement("menuParameters", "camunda:Menu");
  };

  const removeItem = (index) => {
    const cloneMenus = [...(menus || [])];
    cloneMenus.splice(index, 1);
    setMenus(cloneMenus);
  };

  const updateValue = async (value, name, label, index) => {
    const cloneMenus = [...(menus || [])];
    cloneMenus[index] = {
      ...(cloneMenus[index] || {}),
      [name]: (value && value[label]) || value,
    };
    if (Array.isArray(value)) {
      const values = value?.map((v) => v[label]).join(",");
      updateElement(values, name, index);
    } else {
      updateElement((value && value[label]) || value, name, index);
    }
    setMenus(cloneMenus);
  };

  const openMenu = async (menu) => {
    if (!menu?.menuId) {
      openDialog({
        title: "Error",
        message: "Menu not found",
      });
      return;
    }
    const menuRes = await getMenu({
      data: {
        fields: ["name"],
        criteria: [
          {
            fieldName: "name",
            operator: "=",
            value: `wkf-${menu?.isUserMenu ? "node-user" : "node"}-menu-${
              menu?.menuId
            }`,
          },
        ],
      },
    });
    if (menuRes?.id) {
      openTabView({
        title: translate("Menu Item"),
        model: "com.axelor.meta.db.MetaMenu",
        viewType: "form",
        action: `action-wkf-view-open-editor-${menuRes?.id}`,
        views: [{ type: "form", name: "meta-menu-form" }],
        context: { _showRecord: menuRes?.id },
      });
    } else {
      openDialog({
        title: "Error",
        message: "Menu not found",
      });
    }
  };

  const formattedValue = (field) => {
    return field ? field.charAt(0).toUpperCase() + field.slice(1) : null;
  };

  useEffect(() => {
    setMenus(getMenuParameters());
  }, [getMenuParameters]);

  useEffect(() => {
    const userAction = getProperty("createUserAction");
    const taskName = getProperty("taskName");
    const emailNotification = getProperty("emailNotification");
    const emailEvent = {
      id: getProperty("emailEvent") || "start",
      name: getProperty("emailEventLabel") || translate("start"),
    };
    const template = getSelectValue("template");
    const descriptionField = getProperty("description");

    let priorityField;
    const isPriorityValid = PRIORITIES.some(
      (priority) => priority.value === getProperty("taskPriority")
    );
    if (isPriorityValid) {
      priorityField = formattedValue(getProperty("taskPriority"));
    } else {
      priorityField = getProperty("taskPriority");
    }

    setTaskFields((prevState) => ({
      ...prevState,
      taskName: taskName,
      taskPriority: priorityField,
      description: descriptionField,
    }));

    const taskTypes = ["taskNameType", "priorityType", "descriptionType"];

    taskTypes.forEach((field) => {
      if (!hasProperty(field)) {
        // setProperty(field, selectedTaskOption[field]?.toLowerCase());
      } else {
        const selectedOptionValue = formattedValue(getProperty(field));
        setSelectedTaskOption((prevState) => ({
          ...prevState,
          [field]: selectedOptionValue,
        }));
      }
    });
    setCreateUserAction(getBool(userAction));
    setEmailNotification(getBool(emailNotification));
    setEmailEvent(emailEvent);
    setTemplate(template);
  }, [getProperty, getSelectValue, element]);

  useEffect(() => {
    const metaModel = getSelectValue("metaModel");
    const metaJsonModel = getSelectValue("metaJsonModel");
    setMetaModel(metaModel);
    if (metaModel) {
      setModel({
        ...metaModel,
        type: "metaModel",
      });
    } else if (metaJsonModel) {
      setModel({
        ...metaJsonModel,
        type: "metaJsonModel",
      });
    }
  }, [getSelectValue]);

  return (
    <div className={styles.main}>
      <div className={styles.container}>
        <Checkbox
          element={element}
          entry={{
            id: "createUserAction",
            label: translate("Create user action"),
            modelProperty: "createUserAction",
            get: function () {
              return {
                createUserAction: createUserAction,
              };
            },
            set: function (e, value) {
              let createUserAction = !value.createUserAction;
              setCreateUserAction(createUserAction);
              setProperty("createUserAction", createUserAction);

              if (createUserAction) {
                setSelectedTaskOption((prevState) => ({
                  ...prevState,
                  ...selectedTaskOption,
                }));
                Object.keys(selectedTaskOption).forEach((key) =>
                  setProperty(key, selectedTaskOption[key]?.toLowerCase())
                );
              }
              if (!createUserAction) {
                setProperty("taskName", undefined);
                setRoleFieldPath(null);
                setTaskFields((prevState) => ({
                  ...prevState,
                  taskRole: null,
                  taskName: null,
                  taskPriority: null,
                  description: null,
                }));

                Object.keys(taskFields).forEach((key) =>
                  setProperty(key, undefined)
                );
                setSelectedTaskOption((prevState) => ({
                  ...prevState,
                  roleType: null,
                  taskNameType: null,
                  priorityType: null,
                  descriptionType: null,
                }));

                Object.keys(selectedTaskOption).forEach((key) =>
                  setProperty(key, undefined)
                );
              }
            },
          }}
        />
        <div>
          {createUserAction && (
            <Box
              w={100}
              rounded={2}
              border
              bg="body-tertiary"
              color="body"
              style={{
                marginTop: 5,
                marginBottom: 10,
              }}
            >
              <Box color="body" style={{ padding: "10px" }}>
                <Box overflow="auto">
                  <Box rounded={2} bgColor="body" shadow color="body">
                    <Table size="sm" textAlign="center">
                      <TableHead>
                        <TableRow>
                          {USER_ACTIONS_HEADER.map((item) => (
                            <TableCell
                              key={item.label}
                              className={clsx(styles.tableHead, item.className)}
                            >
                              {translate(item.label)}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <InputLabel className={styles.label}>
                              {translate("Name")}
                            </InputLabel>
                          </TableCell>
                          <TableCell>
                            <Select
                              className={styles.select}
                              type="text"
                              value={selectedTaskOption.taskNameType || null}
                              options={filterTypes("field")}
                              update={(value) => {
                                setSelectedTaskOption((prevState) => ({
                                  ...prevState,
                                  taskNameType: value?.title,
                                }));
                                const taskNameTypes = ["Value", "Script"];
                                if (
                                  taskNameTypes.includes(
                                    selectedTaskOption.taskNameType
                                  ) ||
                                  taskNameTypes.includes(
                                    getProperty("taskNameType")
                                  )
                                ) {
                                  handleChange("taskName", null);
                                  setProperty("taskName", undefined);
                                  setProperty("taskNameType", undefined);
                                  setActionDummy((prev) => ({
                                    ...prev,
                                    taskName: null,
                                  }));
                                }
                              }}
                              disableClearable="false"
                              isLabel={false}
                              optionLabel={"title"}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              className={styles.textbox}
                              element={element}
                              type="text"
                              canRemove={true}
                              entry={{
                                id: "taskName",
                                name: "taskName",
                                modelProperty: "taskName",
                                get: function () {
                                  return {
                                    taskName: taskFields.taskName || "",
                                  };
                                },
                                set: function (e, value) {
                                  handleChange("taskName", value.taskName);
                                  setProperty("taskName", value.taskName);
                                  setProperty(
                                    "taskNameType",
                                    value?.taskName !== ""
                                      ? selectedTaskOption?.taskNameType
                                      : undefined
                                  );

                                  setActionDummy((prev) => ({
                                    ...prev,
                                    taskName: value.taskName,
                                  }));
                                },
                                validate: function (e, values) {
                                  true;
                                  if (!values.taskName) {
                                    return {
                                      taskName: translate(
                                        "Must provide a value"
                                      ),
                                    };
                                  }
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell className={styles.tableCell}>
                            {selectedTaskOption.taskNameType === "Script" && (
                              <Tooltip title="Script" aria-label="enable">
                                <i
                                  className="fa fa-code"
                                  style={{ fontSize: 18 }}
                                  onClick={() => {
                                    setFieldTypes("taskName");
                                    setActionDummy((prev) => ({
                                      ...prev,
                                      taskName: getScript("taskName"),
                                    }));

                                    setOpenScriptDialog(true);
                                  }}
                                ></i>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <InputLabel className={styles.label}>
                              {translate("Priority")}
                            </InputLabel>
                          </TableCell>
                          <TableCell>
                            <Select
                              className={styles.select}
                              value={selectedTaskOption.priorityType || null}
                              type="text"
                              options={filterTypes("field")}
                              update={(value, label) => {
                                setSelectedTaskOption((prevState) => ({
                                  ...prevState,
                                  priorityType: value?.title,
                                }));
                                const priorityTypes = [
                                  "Value",
                                  "Field",
                                  "Script",
                                ];
                                if (
                                  priorityTypes.includes(
                                    selectedTaskOption.priorityType
                                  ) ||
                                  priorityTypes.includes(
                                    getProperty("priorityType")
                                  )
                                ) {
                                  handleChange("taskPriority", null);
                                  setProperty("taskPriority", undefined);
                                  setProperty("priorityType", undefined);
                                  setActionDummy((prev) => ({
                                    ...prev,
                                    taskPriority: null,
                                  }));
                                }
                              }}
                              disableClearable="false"
                              isLabel={false}
                              optionLabel={"title"}
                            />
                          </TableCell>
                          <TableCell>
                            {selectedTaskOption.priorityType === "Value" ? (
                              <>
                                <div className={styles.fieldsContainer}>
                                  <Select
                                    className={styles.select}
                                    name="taskPriority"
                                    options={PRIORITIES}
                                    value={taskFields.taskPriority || null}
                                    update={(value, label) => {
                                      handleChange(
                                        "taskPriority",
                                        value?.title
                                      );
                                      setProperty("taskPriority", value?.value);
                                      setProperty(
                                        "priorityType",
                                        value?.value &&
                                          selectedTaskOption?.priorityType
                                      );
                                    }}
                                    isLabel={false}
                                    optionLabel={"title"}
                                  />
                                </div>
                              </>
                            ) : (
                              <TextField
                                className={styles.textbox}
                                element={element}
                                type="text"
                                canRemove={true}
                                entry={{
                                  id: "taskPriority",
                                  name: "taskPriority",
                                  modelProperty: "taskPriority",
                                  get: function () {
                                    return {
                                      taskPriority:
                                        taskFields.taskPriority || "",
                                    };
                                  },
                                  set: function (e, value) {
                                    handleChange(
                                      "taskPriority",
                                      value.taskPriority
                                    );
                                    setProperty(
                                      "taskPriority",
                                      value.taskPriority
                                    );
                                    setProperty(
                                      "priorityType",
                                      value.taskPriority !== ""
                                        ? selectedTaskOption?.priorityType
                                        : undefined
                                    );
                                    setActionDummy((prev) => ({
                                      ...prev,
                                      taskPriority: value.taskPriority,
                                    }));
                                  },
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell className={styles.tableCell}>
                            {selectedTaskOption.priorityType === "Script" && (
                              <Tooltip title="Script" aria-label="enable">
                                <i
                                  className="fa fa-code"
                                  style={{ fontSize: 18 }}
                                  onClick={() => {
                                    setFieldTypes("taskPriority");
                                    setActionDummy((prev) => ({
                                      ...prev,
                                      taskPriority: getScript("taskPriority"),
                                    }));
                                    setOpenScriptDialog(true);
                                  }}
                                ></i>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <InputLabel className={styles.label}>
                              {translate("Description")}
                            </InputLabel>
                          </TableCell>
                          <TableCell>
                            <Select
                              className={styles.select}
                              value={selectedTaskOption.descriptionType || null}
                              type="text"
                              options={filterTypes("field")}
                              update={(value, label) => {
                                setSelectedTaskOption((prevState) => ({
                                  ...prevState,
                                  descriptionType: value?.title,
                                }));
                                const descriptionTypes = [
                                  "Value",
                                  "Field",
                                  "Script",
                                ];
                                if (
                                  descriptionTypes.includes(
                                    selectedTaskOption.descriptionType
                                  ) ||
                                  descriptionTypes.includes(
                                    getProperty("descriptionType")
                                  )
                                ) {
                                  handleChange("description", null);
                                  setProperty("description", undefined);
                                  setProperty("descriptionType", undefined);
                                  setActionDummy((prev) => ({
                                    ...prev,
                                    description: null,
                                  }));
                                }
                              }}
                              disableClearable="false"
                              isLabel={false}
                              optionLabel={"title"}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              className={styles.textbox}
                              element={element}
                              type="text"
                              entry={{
                                id: "description",
                                name: "description",
                                modelProperty: "description",
                                get: function () {
                                  return {
                                    description: taskFields.description || "",
                                  };
                                },
                                set: function (e, value) {
                                  handleChange(
                                    "description",
                                    value.description
                                  );
                                  setProperty("description", value.description);
                                  setProperty(
                                    "descriptionType",
                                    value?.description !== ""
                                      ? selectedTaskOption?.descriptionType
                                      : undefined
                                  );
                                  setActionDummy((prev) => ({
                                    ...prev,
                                    description: value.description,
                                  }));
                                },
                              }}
                              canRemove={true}
                            />
                          </TableCell>
                          <TableCell className={styles.tableCell}>
                            {selectedTaskOption.descriptionType ===
                              "Script" && (
                              <Tooltip title="Script" aria-label="enable">
                                <i
                                  className="fa fa-code"
                                  style={{ fontSize: 18, marginLeft: 1 }}
                                  onClick={() => {
                                    setFieldTypes("description");
                                    setProperty(
                                      "descriptionType",
                                      selectedTaskOption?.descriptionType
                                    );
                                    setActionDummy((prev) => ({
                                      ...prev,
                                      description: getScript("description"),
                                    }));
                                    setOpenScriptDialog(true);
                                  }}
                                ></i>
                              </Tooltip>
                            )}
                            {selectedTaskOption.descriptionType === "Value" && (
                              <Tooltip title="Script" aria-label="enable">
                                <i
                                  className="fa fa-edit"
                                  style={{ fontSize: 18, marginLeft: 1 }}
                                  onClick={() => {
                                    setFieldTypes("description");
                                    setActionDummy((prev) => ({
                                      ...prev,
                                      description: getScript("description"),
                                    }));
                                    setOpenValueTextBox(true);
                                  }}
                                ></i>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                        <FieldAction
                          key="role"
                          isUserAction={true}
                          initialType="value"
                          label="Role"
                          title="roleField"
                          element={element}
                          getProperty={getProperty}
                          setProperty={setProperty}
                          metaModel={metaModel}
                          fieldTypes={["value", "field", "script"]}
                          fetchMethod={(data) => getRoles(data?.criteria)}
                        />
                      </TableBody>
                    </Table>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </div>
        <div className={styles.container}>
          <Checkbox
            element={element}
            entry={{
              id: "emailNotification",
              label: translate("Email notification"),
              modelProperty: "emailNotification",
              get: function () {
                return {
                  emailNotification: emailNotification,
                };
              },
              set: function (e, value) {
                setEmailNotification(!value.emailNotification);
                setProperty("emailNotification", !value.emailNotification);
                if (emailNotification === false) {
                  setTemplate(undefined);
                  setProperty("template", undefined);
                  updateMenuValue("emailEvent", undefined);
                  setEmailEvent(null);
                }
              },
            }}
          />
        </div>
        {emailNotification && (
          <Box
            flex={1}
            rounded={2}
            border
            bg="body-tertiary"
            color="body"
            style={{
              width: "calc(100% - 20px)",
            }}
          >
            <Box color="body" style={{ padding: 10 }}>
              <React.Fragment>
                <InputLabel color="body" className={styles.label}>
                  {translate("Email event")}
                </InputLabel>
                <Select
                  className={styles.select}
                  update={(value, label) => {
                    setEmailEvent(value);
                    updateMenuValue("emailEvent", value, label, "id");
                  }}
                  options={[
                    { name: translate("start"), id: "start" },
                    { name: translate("end"), id: "end" },
                  ]}
                  isLabel={false}
                  disableClearable
                  name="emailEvent"
                  value={emailEvent || null}
                  optionLabel={"name"}
                />
              </React.Fragment>

              <React.Fragment>
                <InputLabel color="body" className={styles.label}>
                  {translate("Template")}
                </InputLabel>
                <Select
                  className={styles.select}
                  update={(value, label) => {
                    setTemplate(value);
                    updateMenuValue("template", value, label, "name");
                  }}
                  name="template"
                  value={template}
                  isLabel={false}
                  fetchMethod={() => getTemplates(getProcessConfig())}
                  optionLabel={"name"}
                />
              </React.Fragment>
            </Box>
          </Box>
        )}
        {openScriptDialog && (
          <ScriptDialog
            element={element}
            updateScript={updateScript}
            fieldType={fieldTypes}
            setOpenScriptDialog={setOpenScriptDialog}
            taskFields={taskFields}
            setTaskFields={setTaskFields}
            alertMessage={alertMessage}
            openExpressionAlert={openExpressionAlert}
            getScript={getScript}
            getProperty={getProperty}
            setProperty={setProperty}
            setActionDummy={setActionDummy}
            actionDummy={actionDummy}
          ></ScriptDialog>
        )}
      </div>
      <div>
        <InputLabel color="body" className={styles.label}>
          {translate("Add menus")}
        </InputLabel>
        {menus?.map(
          (menu, key) =>
            menu && (
              <Box key={`card_menu_${key}`} d="flex" alignItems="flex-start">
                <Box
                  flex={1}
                  rounded={2}
                  border
                  bg="body-tertiary"
                  color="body"
                  style={{ width: "calc(100% - 20px)" }}
                >
                  <Box color="body" style={{ padding: 10 }}>
                    <Box d="flex" alignItems="center" color="body">
                      <Box w={50}>
                        <TextField
                          element={element}
                          canRemove={true}
                          entry={{
                            id: "menuName",
                            name: "menuName",
                            modelProperty: "menuName",
                            label: translate("Menu name"),
                            get: function () {
                              return {
                                menuName: menu?.menuName,
                              };
                            },
                            set: function (e, value) {
                              updateValue(
                                value.menuName,
                                "menuName",
                                undefined,
                                key
                              );
                            },
                            validate: function (e, values) {
                              if (!values.menuName) {
                                return {
                                  menuName: translate("Must provide a value"),
                                };
                              }
                            },
                          }}
                        />
                      </Box>
                      <Box w={50}>
                        <InputLabel color="body" className={styles.label}>
                          {translate("Menu parent")}
                        </InputLabel>
                        <Select
                          className={styles.select}
                          update={(value) => {
                            updateValue(value, "menuParent", "name", key);
                          }}
                          name="menuParent"
                          value={menu?.menuParent}
                          isLabel={false}
                          fetchMethod={(options) => getParentMenus(options)}
                          optionLabel={"title"}
                          optionLabelSecondary={"name"}
                        />
                      </Box>
                    </Box>
                    <Box d="flex" alignItems="center" color="body">
                      <Box w={50}>
                        <InputLabel color="body" className={styles.label}>
                          {translate("Position")}
                        </InputLabel>
                        <Select
                          className={styles.select}
                          update={(value) => {
                            updateValue(value, "position", "name", key);
                          }}
                          name="position"
                          value={menu?.position}
                          isLabel={false}
                          options={[
                            { name: translate("After"), id: "after" },
                            { name: translate("Before"), id: "before" },
                          ]}
                          optionLabel="name"
                        />
                      </Box>
                      <Box w={50}>
                        <InputLabel color="body" className={styles.label}>
                          {translate("Position menu")}
                        </InputLabel>
                        <Select
                          className={styles.select}
                          update={(value) => {
                            updateValue(value, "positionMenu", "name", key);
                          }}
                          fetchMethod={() => getSubMenus(menu?.menuParent)}
                          name="positionMenu"
                          value={menu?.positionMenu}
                          isLabel={false}
                          optionLabel={"title"}
                          optionLabelSecondary={"name"}
                        />
                      </Box>
                    </Box>
                    <div>
                      <TextField
                        element={element}
                        canRemove={true}
                        isScript={true}
                        language="jpql"
                        entry={{
                          id: "domain",
                          name: "domain",
                          modelProperty: "domain",
                          label: translate("Domain"),
                          get: function () {
                            return {
                              domain: menu?.domain,
                            };
                          },
                          set: function (e, value) {
                            updateValue(value.domain, "domain", undefined, key);
                          },
                        }}
                      />
                    </div>
                    <div>
                      <InputLabel color="body" className={styles.label}>
                        {translate("Roles")}
                      </InputLabel>
                      <Select
                        className={styles.select}
                        update={(value) => {
                          updateValue(value, "roles", "name", key);
                        }}
                        fetchMethod={(options) => getRoles(options?.criteria)}
                        name="roles"
                        value={
                          (typeof menu?.roles === "string"
                            ? menu?.roles?.split(",").map((name) => ({ name }))
                            : menu?.roles) || []
                        }
                        label={translate("Roles")}
                        handleRemove={(option) => {
                          let value = (
                            (typeof menu?.roles === "string"
                              ? menu?.roles
                                  ?.split(",")
                                  .map((name) => ({ name }))
                              : menu?.roles) || []
                          )?.filter((r) => r.name !== option.name);
                          updateValue(value, "roles", "name", key);
                        }}
                        multiple={true}
                        type={"multiple"}
                        optionLabel={"name"}
                      />
                    </div>
                    <Box
                      d="flex"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Checkbox
                        element={element}
                        entry={{
                          id: "permanent",
                          label: translate("Permanent ?"),
                          modelProperty: "permanent",
                          get: function () {
                            return {
                              permanent: getBool(menu?.permanent),
                            };
                          },
                          set: function (e, value) {
                            updateValue(
                              !value.permanent,
                              "permanent",
                              undefined,
                              key
                            );
                          },
                        }}
                      />
                      <Checkbox
                        element={element}
                        entry={{
                          id: "tagCount",
                          label: translate("Display tag count ?"),
                          modelProperty: "tagCount",
                          get: function () {
                            return {
                              tagCount: getBool(menu?.tagCount),
                            };
                          },
                          set: function (e, value) {
                            updateValue(
                              !value.tagCount,
                              "tagCount",
                              undefined,
                              key
                            );
                          },
                        }}
                      />
                      <Checkbox
                        element={element}
                        entry={{
                          id: "isUserMenu",
                          label: translate("User menu ?"),
                          modelProperty: "isUserMenu",
                          get: function () {
                            return {
                              isUserMenu: getBool(menu?.isUserMenu),
                            };
                          },
                          set: function (e, value) {
                            updateValue(
                              !value.isUserMenu,
                              "isUserMenu",
                              undefined,
                              key
                            );
                          },
                        }}
                      />
                    </Box>
                    {model?.type === "metaModel" && (
                      <Box d="flex" alignItems="center" color="body">
                        <Box w={50}>
                          <InputLabel color="body" className={styles.label}>
                            {translate("Grid view")}
                          </InputLabel>
                          <Select
                            className={styles.select}
                            update={(value) => {
                              updateValue(value, "gridView", "name", key);
                            }}
                            fetchMethod={(options) =>
                              getViews(model, options?.criteria, "grid")
                            }
                            name="gridView"
                            value={menu?.gridView}
                            label={translate("Grid view")}
                            isLabel={false}
                            optionLabel={"title"}
                            optionLabelSecondary={"name"}
                          />
                        </Box>
                        <Box w={50}>
                          <InputLabel color="body" className={styles.label}>
                            {translate("Form view")}
                          </InputLabel>
                          <Select
                            className={styles.select}
                            update={(value) => {
                              updateValue(value, "formView", "name", key);
                            }}
                            fetchMethod={(options) =>
                              getViews(model, options?.criteria)
                            }
                            name="formView"
                            value={menu?.formView}
                            label={translate("Form view")}
                            isLabel={false}
                            optionLabel={"title"}
                            optionLabelSecondary={"name"}
                          />
                        </Box>
                      </Box>
                    )}
                    <div>
                      <AxTable
                        entry={{
                          id: `menu-context-${key}`,
                          labels: [translate("Key"), translate("Value")],
                          modelProperties: ["key", "value"],
                          addLabel: "Add context menu",
                          getElements: function () {
                            return getElements(key);
                          },
                          updateElement: function (value, label, optionIndex) {
                            updateContextElement(
                              value,
                              label,
                              optionIndex,
                              key
                            );
                          },
                          addElement: function (entryValue) {
                            addContextElement(entryValue, key);
                          },
                          removeElement: function (optionIndex) {
                            removeContextElement(optionIndex, key);
                          },
                        }}
                      />
                    </div>
                  </Box>
                </Box>
                <Box color="body">
                  <IconButton
                    className={styles.iconButton}
                    onClick={() => {
                      removeItem(key);
                      removeElement(key);
                    }}
                  >
                    <MaterialIcon icon="close" fontSize={16} />
                  </IconButton>
                  <IconButton
                    className={styles.iconButton}
                    onClick={() => openMenu(menu)}
                  >
                    <MaterialIcon icon="open_in_new" fontSize={16} />
                  </IconButton>
                </Box>
              </Box>
            )
        )}
        <Box d="flex" alignItems="center" color="body">
          <IconButton className={styles.iconButton} onClick={addItems}>
            <MaterialIcon icon="add" fontSize={16} />
          </IconButton>
        </Box>
      </div>

      <Dialog
        open={openExpressionAlert}
        backdrop
        centered
        className={styles.dialog}
      >
        <DialogHeader onCloseClick={() => setExpressionAlert(false)}>
          <h3>{translate("Error")}</h3>
        </DialogHeader>
        <DialogContent className={styles.content}>
          {translate(alertMessage)}
        </DialogContent>
        <DialogFooter>
          <Button
            onClick={() => {
              setExpressionAlert(false);
            }}
            variant="primary"
            className={styles.save}
          >
            {translate("OK")}
          </Button>
          <Button
            onClick={() => setExpressionAlert(false)}
            variant="secondary"
            className={styles.save}
          >
            {translate("Cancel")}
          </Button>
        </DialogFooter>
      </Dialog>

      {openValueTextBox && (
        <AlertDialog
          className={styles.scriptDialog}
          openAlert={true}
          alertClose={closeEditor}
          handleAlertOk={() => {
            updateScript(fieldTypes);
            setOpenValueTextBox(false);
          }}
          title={translate("Add description")}
          children={
            <Box color="body" className={styles.new}>
              <Textbox
                element={element}
                className={styles.textbox}
                showLabel={false}
                defaultHeight={window?.innerHeight - 205}
                entry={{
                  id: "script",
                  label: translate("Value"),
                  modelProperty: "script",
                  get: function () {
                    return { script: actionDummy?.description };
                  },
                  set: function (e, values) {
                    setActionDummy((prev) => ({
                      ...prev,
                      description: values?.script,
                    }));
                  },
                }}
                suggestion={false}
              />
            </Box>
          }
        />
      )}
    </div>
  );
}
