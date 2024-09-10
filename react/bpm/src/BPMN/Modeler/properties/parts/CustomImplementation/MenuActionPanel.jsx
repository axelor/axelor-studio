import React, { useState, useEffect, useCallback } from "react";
import { createElement as _createElement } from "../../../../../utils/ElementUtil";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { IconButton } from "@material-ui/core";

import Tooltip from "../../../../../components/Tooltip";
import Select from "../../../../../components/Select";
import {
  TextField,
  Checkbox,
  Table as AxTable,
  FieldEditor,
  Textbox,
} from "../../../../../components/properties/components";
import {
  getParentMenus,
  getSubMenus,
  getViews,
  getTemplates,
  getMetaFields,
  getRoles,
  getMenu,
} from "../../../../../services/api";
import { translate, getBool } from "../../../../../utils";
import { USER_TASKS_TYPES } from "../../../constants";
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
} from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import ScriptDialog from "./ScriptDialog";
import styles from "./menu-action.module.css";
import QueryBuilder from "../../../../../components/QueryBuilder";
import AlertDialog from "../../../../../components/AlertDialog";
import { fetchModels } from "../../../../../services/api";
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

const FIELDSTOMAP = {
  taskRole: "roleType",
  taskName: "taskNameType",
  taskPriority: "priorityType",
  description: "descriptionType",
  duration: "durationType",
};
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
  const [deadlineFieldPath, setDeadlineFieldPath] = useState(null);
  const [emailNotification, setEmailNotification] = useState(false);
  const [userFieldPath, setUserFieldPath] = useState(null);
  const [userFieldPathDummy, setUserFieldPathDummy] = useState(null);
  const [model, setModel] = useState(null);
  const [template, setTemplate] = useState(null);
  const [emailEvent, setEmailEvent] = useState();
  const [role, setRole] = useState(null);
  const [roleFieldPath, setRoleFieldPath] = useState(null);
  const [roleDummy, setRoleDummy] = useState(null);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [openUserPathDialog, setOpenUserPathDialog] = useState(false);
  const [field, setField] = useState(null);
  const [openExpressionAlert, setExpressionAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [openDeadlinePathDialog, setOpenDeadlinePathDialog] = useState(false);
  const [deadlineField, setDeadlineField] = useState(null);
  const [deadlineFieldPathDummy, setDeadlineFieldPathDummy] = useState(null);
  const [openTeamPathDialog, setOpenTeamPathDialog] = useState(false);
  const [teamFieldPath, setTeamFieldPath] = useState(null);
  const [teamField, setTeamField] = useState(null);
  const [teamFieldDummy, setTeamFieldDummy] = useState(null);
  const [menus, setMenus] = useState([]);
  const [taskFields, setTaskFields] = useState({
    taskRole: null,
    taskName: null,
    taskPriority: null,
    description: null,
    duration: null,
  });
  const [actionTitleDummy, setActionTitleDummy] = useState(null);
  const [priorityDummy, setPriorityDummy] = useState(null);
  const [descriptionDummy, setDescriptionDummy] = useState(null);
  const [durationDummy, setDurationDummy] = useState(null);
  const [fieldTypes, setFieldTypes] = useState(null);
  const [selectedTaskOption, setSelectedTaskOption] = useState({
    roleType: "Value",
    taskNameType: "Value",
    priorityType: "Value",
    durationType: "Value",
    descriptionType: "Value",
  });

  const [selectedFieldOption, setSelectedFieldOption] = useState({
    userFieldType: "Field",
    teamFieldType: "Field",
    deadlineType: "Field",
  });
  const [open, setOpen] = useState(false);
  const [openScriptDialog, setOpenScriptDialog] = useState(false);
  const [isTeamField, setIsTeamField] = useState(false);
  const [readOnlyFields, setReadOnlyFields] = useState({
    userFieldPath: false,
    teamFieldPath: false,
    deadlineFieldPath: false,
    roleFieldPath: false,
  });
  const [openDialogs, setOpenDialogs] = useState({
    scriptEditor: false,
    fieldEditor: false,
  });

  const [openValueTextBox, setOpenValueTextBox] = useState(false);

  const openDialog = useDialog();

  const handleClose = () => {
    setOpen(false);
  };
  const closeEditor = () => {
    setOpenValueTextBox(false);
  };
  const getFields = useCallback(() => {
    return getMetaFields(model);
  }, [model]);

  const filterTypes = (type1, type2) => {
    const excludeValues = [type1, type2];
    return TYPES.filter((task) => !excludeValues.includes(task.value));
  };
  const IsUserMenu = useCallback(() => {
    return menus.find((menu) => getBool(menu?.isUserMenu));
  }, [menus]);

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

  const dummyStates =
    fieldTypes === "userFieldPath"
      ? setUserFieldPathDummy
      : fieldTypes === "teamFieldPath"
      ? setTeamFieldDummy
      : fieldTypes === "deadlineFieldPath"
      ? setDeadlineFieldPathDummy
      : fieldTypes === "roleFieldPath"
      ? setRoleDummy
      : null;

  const fieldPathState =
    fieldTypes === "userFieldPath"
      ? setUserFieldPath
      : fieldTypes === "teamFieldPath"
      ? setTeamFieldPath
      : fieldTypes === "deadlineFieldPath"
      ? setDeadlineFieldPath
      : fieldTypes === "roleFieldPath"
      ? setRoleFieldPath
      : null;

  function handleFieldChange(fieldType) {
    let alertMessage = "";
    let openDialog = true;

    switch (fieldType) {
      case "roleFieldPath":
        if (readOnlyFields?.roleFieldPath && getProperty(fieldType + "Value")) {
          alertMessage =
            "Role field can't be managed using builder once changed manually.";
          openDialog = false;
        }
        break;
      case "deadlineFieldPath":
        if (
          readOnlyFields?.deadlineFieldPath &&
          getProperty(fieldType + "Value")
        ) {
          alertMessage =
            "Deadline field can't be managed using builder once changed manually.";
          openDialog = false;
        }
        break;
      case "teamFieldPath":
        if (readOnlyFields?.teamFieldPath && getProperty(fieldType + "Value")) {
          alertMessage =
            "Team field can't be managed using builder once changed manually.";
          openDialog = false;
        }
        break;
      case "userFieldPath":
        if (readOnlyFields?.userFieldPath && getProperty(fieldType + "Value")) {
          alertMessage =
            "User field can't be managed using builder once changed manually.";
          openDialog = false;
        }
        break;
      default:
        break;
    }

    if (openDialog) {
      setOpenScriptDialog(true);
    } else {
      setAlertMessage(alertMessage);
      setExpressionAlert(true);
    }
  }

  const updateScript = (fieldType) => {
    const extractDummyField = {
      userFieldPath: userFieldPathDummy,
      teamFieldPath: teamFieldDummy,
      deadlineFieldPath: deadlineFieldPathDummy,
      roleFieldPath: roleDummy,
      taskPriority: priorityDummy,
      taskName: actionTitleDummy,
      duration: durationDummy,
      description: descriptionDummy,
    };
    const extractTypes = {
      roleFieldPath: "roleType",
      taskName: "taskNameType",
      taskPriority: "priorityType",
      description: "descriptionType",
      userFieldPath: "userFieldType",
      teamFieldPath: "teamFieldType",
      deadlineFieldPath: "deadlineType",
    };
    const propertiesType = {
      roleFieldPath: selectedTaskOption.roleType,
      taskName: selectedTaskOption.taskNameType,
      taskPriority: selectedTaskOption.priorityType,
      description: selectedTaskOption.descriptionType,
      userFieldPath: selectedFieldOption.userFieldType,
      teamFieldPath: selectedFieldOption.teamFieldType,
      deadlineFieldPath: selectedFieldOption.deadlineType,
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
      switch (fieldType) {
        case "userFieldPath":
          setUserFieldPath(fieldPath);
          setUserFieldPathDummy(fieldPath);
          break;
        case "teamFieldPath":
          setTeamFieldPath(fieldPath);
          setTeamFieldDummy(fieldPath);
          break;
        case "deadlineFieldPath":
          setDeadlineFieldPath(fieldPath);
          setDeadlineFieldPathDummy(fieldPath);
          break;
        case "roleFieldPath":
          setRoleFieldPath(fieldPath);
          setRoleDummy(fieldPath);
          break;
        case "taskName":
          setTaskFields((prevState) => ({
            ...prevState,
            taskName: fieldPath,
          }));
          setActionTitleDummy(fieldPath);
          break;
        case "taskPriority":
          setTaskFields((prevState) => ({
            ...prevState,
            taskPriority: fieldPath,
          }));
          setPriorityDummy(fieldPath);
          break;
        case "duration":
          setTaskFields((prevState) => ({ ...prevState, duration: fieldPath }));
          setDurationDummy(fieldPath);
          break;
        case "description":
          setTaskFields((prevState) => ({
            ...prevState,
            description: fieldPath,
          }));
          setDescriptionDummy(fieldPath);
          break;
        default:
          break;
      }
      setProperty(fieldType, fieldPath);
      setProperty(`${fieldType}Value`, fieldPathValue);
    }
  };

  const clearFieldPathsData = (fieldType) => {
    const clearField = (fieldName, openDialogFunction) => {
      setProperty(`${fieldName}Value`, undefined);
      setExpressionAlert(false);
      setAlertMessage(null);
      setReadOnlyFields((prevState) => ({
        ...prevState,
        [fieldName]: false,
      }));
      openDialogs?.scriptEditor && setOpenScriptDialog(true);
      openDialogs?.fieldEditor && openDialogFunction(true);
    };

    switch (fieldType) {
      case "userFieldPath":
        clearField("userFieldPath", setOpenUserPathDialog);
        break;
      case "teamFieldPath":
        clearField("teamFieldPath", setOpenTeamPathDialog);
        break;
      case "deadlineFieldPath":
        clearField("deadlineFieldPath", setOpenDeadlinePathDialog);
        break;
      case "roleFieldPath":
        clearField("roleFieldPath", setOpenRoleDialog);
        break;
      default:
        break;
    }
  };

  const clearValues = (type, fieldstate, dummyState) => {
    fieldstate(null);
    dummyState({
      [type]: null,
    });
    setProperty(type, undefined);
    setProperty(`${type}Value`, undefined);
    setExpressionAlert(false);
    setAlertMessage(null);
    setReadOnlyFields((prevState) => ({
      ...prevState,
      [type]: false,
    }));
  };

  const getter = (fieldType) => {
    const fieldPathValue = getProperty(`${fieldType}Value`);
    let values;
    if (!fieldPathValue) return { checked: true };
    let json = JSON.parse(fieldPathValue || "{}");
    const { value, scriptOperatorType } = json;
    values = JSON.parse(value || "{}");
    if (!values.length) {
      values = null;
    }
    return { values, combinator: scriptOperatorType, checked: true };
  };

  const setter = (val, dummyState, fieldPathState, fieldPath) => {
    const { expression, value, combinator, checked } = val;
    const pathValue = `${fieldPath}Value`;
    const extractTypes = {
      roleFieldPath: "roleType",
      userFieldPath: "userFieldType",
      teamFieldPath: "teamFieldType",
      deadlineFieldPath: "deadlineType",
    };
    const propertiesType = {
      roleFieldPath: selectedTaskOption.roleType,
      userFieldPath: selectedFieldOption.userFieldType,
      teamFieldPath: selectedFieldOption.teamFieldType,
      deadlineFieldPath: selectedFieldOption.deadlineType,
    };
    if (value) {
      setProperty(extractTypes[fieldPath], propertiesType[fieldPath]);
    } else {
      setProperty(extractTypes[fieldPath], undefined);
    }
    dummyState({
      [fieldPath]: expression,
      [pathValue]: JSON.stringify({
        scriptOperatorType: combinator,
        checked,
        value: (value || "")?.replace(/[\u200B-\u200D\uFEFF]/g, undefined),
      }),
    });
    fieldPathState(expression);
    setProperty(fieldPath, expression);
    setProperty();
    setProperty(
      pathValue,
      JSON.stringify({
        scriptOperatorType: combinator,
        checked,
        value: (value || "")?.replace(/[\u200B-\u200D\uFEFF]/g, undefined),
      })
    );
    value &&
      setReadOnlyFields((prevState) => ({
        ...prevState,
        [fieldPath]: true,
      }));

    setOpen(false);
    setOpenScriptDialog(false);
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
        options: {
          mode: "edit",
          state: menuRes?.id,
        },
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
    const emailEvent = getProperty("emailEvent") || "start";
    const roleFieldPath = getProperty("roleFieldPath");
    const taskRole = getProperty("taskRole");
    const deadlineFieldPath = getProperty("deadlineFieldPath");
    const template = getSelectValue("template");
    const userFieldPath = getProperty("userFieldPath");
    const teamFieldPath = getProperty("teamFieldPath");
    const descriptionField = getProperty("description");
    const durationField = getProperty("duration");
    const isTeamField = getProperty("isTeamField");

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
      taskRole: taskRole,
      taskName: taskName,
      taskPriority: priorityField,
      description: descriptionField,
      duration: durationField,
    }));

    const taskTypes = [
      "roleType",
      "taskNameType",
      "priorityType",
      "descriptionType",
      "durationType",
    ];

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
    const fieldTypes = ["userFieldType", "teamFieldType", "deadlineType"];
    fieldTypes.forEach((field) => {
      if (!hasProperty(field)) {
        setProperty(field, selectedFieldOption[field].toLowerCase());
      } else {
        const selectedOptionValue = formattedValue(getProperty(field));
        setSelectedFieldOption((prevState) => ({
          ...prevState,
          [field]: selectedOptionValue,
        }));
      }
    });
    setIsTeamField(getBool(isTeamField));
    setCreateUserAction(getBool(userAction));
    setEmailNotification(getBool(emailNotification));
    setEmailEvent(emailEvent);
    setUserFieldPath(userFieldPath);
    setUserFieldPathDummy(userFieldPath);
    setTeamFieldPath(teamFieldPath);
    setTeamFieldDummy(teamFieldPath);
    setDeadlineFieldPath(deadlineFieldPath);
    setDeadlineFieldPathDummy(deadlineFieldPath);
    setTemplate(template);
    setRoleFieldPath(roleFieldPath);
    setRoleDummy(roleFieldPath);
  }, [getProperty, getSelectValue, element]);

  useEffect(() => {
    const metaModel = getSelectValue("metaModel");
    const metaJsonModel = getSelectValue("metaJsonModel");
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

  useEffect(() => {
    if (emailNotification) {
      setProperty("emailEvent", emailEvent);
    } else {
      setProperty("emailEvent", undefined);
    }
  }, [emailNotification, setProperty, emailEvent]);

  useEffect(() => {
    const scriptValueUser = getProperty("userFieldPathValue");
    const scriptValueTeam = getProperty("teamFieldPathValue");
    const scriptValueDeadline = getProperty("deadlineFieldPathValue");
    const scriptValueRole = getProperty("roleFieldPathValue");

    if (scriptValueUser) {
      setReadOnlyFields((prevState) => ({
        ...prevState,
        userFieldPath: !!scriptValueUser,
      }));
    }
    if (scriptValueTeam) {
      setReadOnlyFields((prevState) => ({
        ...prevState,
        teamFieldPath: !!scriptValueTeam,
      }));
    }
    if (scriptValueDeadline) {
      setReadOnlyFields((prevState) => ({
        ...prevState,
        deadlineFieldPath: !!scriptValueDeadline,
      }));
    }
    if (scriptValueRole) {
      setReadOnlyFields((prevState) => ({
        ...prevState,
        roleFieldPath: !!scriptValueRole,
      }));
    }
  }, [getProperty]);

  useEffect(() => {
    if (isTeamField) {
      setProperty("userFieldType", undefined);
    } else {
      setProperty("teamFieldType", undefined);
    }
  }, [isTeamField]);
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
                  duration: null,
                }));

                Object.keys(taskFields).forEach((key) =>
                  setProperty(key, undefined)
                );
                setSelectedTaskOption((prevState) => ({
                  ...prevState,
                  roleType: null,
                  taskNameType: null,
                  priorityType: null,
                  durationType: null,
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
                          <TableCell className={styles.tableHead}>
                            {translate("Task field")}
                          </TableCell>
                          <TableCell className={styles.tableHead}>
                            {translate("Type")}
                          </TableCell>
                          <TableCell className={styles.tableHead}>
                            {translate("Value")}
                          </TableCell>
                          <TableCell className={styles.tableHead}>
                            {translate("Action")}
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <InputLabel className={styles.label}>
                              {translate("Role")}
                            </InputLabel>
                          </TableCell>
                          <TableCell>
                            <Select
                              className={styles.select}
                              type="text"
                              value={selectedTaskOption.roleType || null}
                              options={TYPES}
                              update={(value, label) => {
                                setSelectedTaskOption((prevState) => ({
                                  ...prevState,
                                  roleType: value?.title,
                                }));
                                const roleTypes = ["Value", "Field", "Script"];
                                if (
                                  roleTypes.includes(
                                    selectedTaskOption.roleType
                                  ) ||
                                  roleTypes.includes(getProperty("roleType"))
                                ) {
                                  handleChange("taskRole", null);
                                  setProperty("taskRole", undefined);
                                  setProperty("roleType", undefined);
                                  clearValues(
                                    "roleFieldPath",
                                    setRoleFieldPath,
                                    setRoleDummy
                                  );
                                }
                              }}
                              disableClearable="false"
                              isLabel={false}
                              optionLabel={'title'}
                            />
                          </TableCell>
                          <TableCell as="td">
                            {selectedTaskOption.roleType === "Value" ? (
                              <Select
                                className={styles.select}
                                type="text"
                                update={(value, label) => {
                                  setProperty("taskRole", value?.name);
                                  setProperty(
                                    "roleType",
                                    value?.name && selectedTaskOption?.roleType
                                  );
                                  handleChange("taskRole", value?.name);
                                  updateMenuValue(
                                    "taskRole",
                                    value,
                                    label,
                                    "name"
                                  );
                                }}
                                name="taskRole"
                                value={taskFields.taskRole || null}
                                isLabel={false}
                                fetchMethod={(data) => getRoles(data?.criteria)}
                                optionLabel={'name'}
                              />
                            ) : (
                              <TextField
                                className={styles.textbox}
                                type="text"
                                element={element}
                                readOnly={
                                  roleFieldPath && readOnlyFields?.roleFieldPath
                                }
                                entry={{
                                  id: "roleFieldPath",
                                  name: "roleFieldPath",
                                  modelProperty: "roleFieldPath",
                                  get: function () {
                                    return {
                                      roleFieldPath: roleFieldPath || "",
                                    };
                                  },
                                  set: function (e, value) {
                                    setRoleFieldPath(value.roleFieldPath);
                                    setRoleDummy({
                                      roleFieldPath: value.roleFieldPath,
                                    });
                                    setProperty(
                                      "roleFieldPath",
                                      value.roleFieldPath
                                    );
                                    setProperty(
                                      "roleType",
                                      value.roleFieldPath !== ""
                                        ? selectedTaskOption.roleType
                                        : undefined
                                    );
                                  },
                                  validate: function (e, values) {
                                    if (!values.roleFieldPath && IsUserMenu()) {
                                      return {
                                        roleFieldPath: translate(
                                          "Must provide a value"
                                        ),
                                      };
                                    }
                                  },
                                }}
                                canRemove={true}
                              />
                            )}
                          </TableCell>
                          <TableCell className={styles.tableCell}>
                            {selectedTaskOption.roleType === "Field" && (
                              <MaterialIcon
                                className={styles.newIcon}
                                icon="edit"
                                fontSize={16}
                                onClick={() => {
                                  setFieldTypes("roleFieldPath");
                                  setOpenDialogs({
                                    fieldEditor: true,
                                    scriptEditor: false,
                                  });
                                  if (
                                    readOnlyFields?.roleFieldPath &&
                                    getProperty("roleFieldPathValue")
                                  ) {
                                    setAlertMessage(
                                      "Role field can't be managed using builder once changed manually."
                                    );
                                    setExpressionAlert(true);
                                  } else {
                                    setOpenRoleDialog(true);
                                  }
                                }}
                              />
                            )}
                            {selectedTaskOption.roleType === "Script" && (
                              <>
                                <Tooltip title="Script" aria-label="enable">
                                  <i
                                    className="fa fa-code"
                                    style={{ fontSize: 18, marginLeft: 5 }}
                                    onClick={() => {
                                      setFieldTypes("roleFieldPath");
                                      setOpenDialogs({
                                        scriptEditor: true,
                                        fieldEditor: false,
                                      });
                                      setRoleDummy({
                                        roleFieldPath:
                                          getScript("roleFieldPath"),
                                      });
                                      handleFieldChange("roleFieldPath");
                                    }}
                                  ></i>
                                </Tooltip>
                                <MaterialIcon
                                  fontSize={18}
                                  icon="edit"
                                  className={styles.newIcon}
                                  onClick={() => {
                                    setFieldTypes("roleFieldPath");
                                    setOpen(true);
                                  }}
                                />
                              </>
                            )}
                          </TableCell>
                        </TableRow>
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
                              update={(value, label) => {
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
                                  setActionTitleDummy({
                                    taskName: null,
                                  });
                                }
                              }}
                              disableClearable="false"
                              isLabel={false}
                              optionLabel={'title'}
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
                                  setActionTitleDummy({
                                    taskName: value.taskName,
                                  });
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
                                    setOpenDialogs({
                                      scriptEditor: true,
                                      fieldEditor: false,
                                    });
                                    setActionTitleDummy({
                                      taskName: getScript("taskName"),
                                    });
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
                                  setPriorityDummy({
                                    taskPriority: null,
                                  });
                                }
                              }}
                              disableClearable="false"
                              isLabel={false}
                              optionLabel={'title'}
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
                                    optionLabel={'title'}
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
                                    setPriorityDummy({
                                      taskPriority: value.taskPriority,
                                    });
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
                                    setOpenDialogs({
                                      scriptEditor: true,
                                      fieldEditor: false,
                                    });

                                    setPriorityDummy({
                                      taskPriority: getScript("taskPriority"),
                                    });
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
                              {translate("Duration")}
                            </InputLabel>
                          </TableCell>
                          <TableCell>
                            <Select
                              className={styles.select}
                              value={selectedTaskOption.durationType || null}
                              type="text"
                              options={filterTypes("field", "script")}
                              update={(value, label) => {
                                setSelectedTaskOption((prevState) => ({
                                  ...prevState,
                                  durationType: value?.title,
                                }));
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
                              entry={{
                                id: "duration",
                                name: "duration",
                                modelProperty: "duration",
                                get: function () {
                                  return {
                                    duration: taskFields.duration || "",
                                  };
                                },
                                set: function (e, value) {
                                  handleChange("duration", value.duration);
                                  setProperty("duration", value.duration);
                                  setProperty(
                                    "durationType",
                                    value.duration !== ""
                                      ? selectedTaskOption?.durationType
                                      : undefined
                                  );
                                  setDurationDummy({
                                    duration: value.duration,
                                  });
                                },
                              }}
                              type="number"
                            />
                          </TableCell>
                          <TableCell></TableCell>
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
                                  setDescriptionDummy({
                                    description: null,
                                  });
                                }
                              }}
                              disableClearable="false"
                              isLabel={false}
                              optionLabel={'title'}
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
                                  setDescriptionDummy({
                                    description: value.description,
                                  });
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
                                    setOpenDialogs({
                                      scriptEditor: true,
                                      fieldEditor: false,
                                    });
                                    setProperty(
                                      "descriptionType",
                                      selectedTaskOption?.descriptionType
                                    );
                                    setDescriptionDummy({
                                      description: getScript("description"),
                                    });
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
                                    // setOpenDialogs({
                                    //   scriptEditor: true,
                                    //   fieldEditor: false,
                                    // });
                                    setDescriptionDummy({
                                      description: getScript("description"),
                                    });
                                    setOpenValueTextBox(true);
                                  }}
                                ></i>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
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
                  setEmailEvent("start");
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
                    setEmailEvent(value?.name);
                    updateMenuValue("emailEvent", value, label, "name");
                  }}
                  options={[
                    { name: translate("start"), id: "start" },
                    { name: translate("end"), id: "end" },
                  ]}
                  isLabel={false}
                  disableClearable
                  name="emailEvent"
                  value={emailEvent || null}
                  optionLabel={'name'}
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
                  optionLabel={'name'}
                />
              </React.Fragment>
            </Box>
          </Box>
        )}
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
          <Box color="body" style={{ padding: 10 }}>
            <Box overflow="auto">
              <Box rounded={2} bgColor="body" shadow color="body">
                <Table size="sm" textAlign="center">
                  <TableHead>
                    <TableRow>
                      <TableCell className={styles.tableHead}>
                        {translate("Field path")}
                      </TableCell>
                      <TableCell className={styles.tableHead}>
                        {translate("Type")}
                      </TableCell>
                      <TableCell className={styles.tableHead}>
                        {translate("Value")}
                      </TableCell>
                      <TableCell className={styles.tableHead}>
                        {translate("Is team field ?")}
                      </TableCell>
                      <TableCell className={styles.tableHead}>
                        {translate("Action")}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      {!isTeamField && (
                        <>
                          <TableCell>
                            <InputLabel className={styles.label}>
                              {translate("User / Team field path")}
                            </InputLabel>
                          </TableCell>
                          <TableCell>
                            <Select
                              className={styles.select}
                              value={selectedFieldOption.userFieldType || null}
                              type="text"
                              options={filterTypes("value")}
                              update={(value, label) => {
                                setSelectedFieldOption((prevState) => ({
                                  ...prevState,
                                  userFieldType: value?.title,
                                }));
                                setProperty("userFieldType", undefined);
                                const userFieldTypes = [
                                  "Value",
                                  "Field",
                                  "Script",
                                ];
                                if (
                                  userFieldTypes.includes(
                                    selectedFieldOption.userFieldType
                                  ) ||
                                  userFieldTypes.includes(
                                    getProperty("userFieldType")
                                  )
                                ) {
                                  clearValues(
                                    "userFieldPath",
                                    setUserFieldPath,
                                    setUserFieldPathDummy
                                  );
                                }
                              }}
                              disableClearable="false"
                              isLabel={false}
                              optionLabel={'title'}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              className={styles.textbox}
                              element={element}
                              canRemove={true}
                              type="text"
                              placeholder=" User field path"
                              readOnly={
                                readOnlyFields?.userFieldPath &&
                                userFieldPath &&
                                getProperty("userFieldPathValue")
                              }
                              entry={{
                                id: "userFieldPath",
                                name: "userFieldPath",
                                modelProperty: "userFieldPath",
                                get: function () {
                                  return {
                                    userFieldPath: userFieldPath || "",
                                  };
                                },
                                set: function (e, value) {
                                  setUserFieldPath(value.userFieldPath);
                                  setUserFieldPathDummy({
                                    userFieldPath: value.userFieldPath,
                                  });
                                  setProperty(
                                    "userFieldPath",
                                    value.userFieldPath
                                  );
                                  setProperty(
                                    "userFieldType",
                                    value?.userFieldPath !== "" &&
                                      selectedFieldOption?.userFieldType
                                  );
                                },
                                validate: function (e, values) {
                                  if (
                                    !values.userFieldPath &&
                                    IsUserMenu() &&
                                    !!!teamFieldPath
                                  ) {
                                    return {
                                      userFieldPath: translate(
                                        "Must provide a value"
                                      ),
                                    };
                                  }
                                },
                              }}
                              setField={setField}
                            />
                          </TableCell>
                          <TableCell className={styles.tableCell}>
                            <Checkbox
                              className={styles.checkBox}
                              element={element}
                              type="text"
                              entry={{
                                id: "isTeamField",
                                modelProperty: "isTeamField",
                                get: function () {
                                  return {
                                    isTeamField: isTeamField,
                                  };
                                },
                                set: function (e, value) {
                                  let teamField = !value.isTeamField;
                                  setIsTeamField(teamField);
                                  setProperty("isTeamField", teamField);
                                  if (teamField) {
                                    clearValues(
                                      "userFieldPath",
                                      setUserFieldPath,
                                      setUserFieldPathDummy
                                    );
                                  }
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell className={styles.tableCell}>
                            {USER_TASKS_TYPES.includes(element.type) &&
                              selectedFieldOption.userFieldType === "Field" &&
                              !isTeamField && (
                                <MaterialIcon
                                  fontSize={16}
                                  icon="edit"
                                  className={styles.newIcon}
                                  onClick={() => {
                                    setFieldTypes("userFieldPath");
                                    setOpenDialogs({
                                      scriptEditor: false,
                                      fieldEditor: true,
                                    });
                                    if (
                                      readOnlyFields?.userFieldPath &&
                                      getProperty("userFieldPathValue")
                                    ) {
                                      setAlertMessage(
                                        "User field can't be managed using builder once changed manually."
                                      );
                                      setExpressionAlert(true);
                                    } else {
                                      setOpenUserPathDialog(true);
                                    }
                                  }}
                                />
                              )}
                            {USER_TASKS_TYPES.includes(element.type) &&
                              selectedFieldOption.userFieldType === "Script" &&
                              !isTeamField && (
                                <>
                                  <Tooltip title="Script" aria-label="enable">
                                    <i
                                      className="fa fa-code"
                                      style={{ fontSize: 18, marginLeft: 5 }}
                                      onClick={() => {
                                        setFieldTypes("userFieldPath");
                                        setOpenDialogs({
                                          scriptEditor: true,
                                          fieldEditor: false,
                                        });

                                        setUserFieldPathDummy({
                                          userFieldPath:
                                            getScript("userFieldPath"),
                                        });
                                        handleFieldChange("userFieldPath");
                                      }}
                                    ></i>
                                  </Tooltip>
                                  <MaterialIcon
                                    fontSize={18}
                                    icon="edit"
                                    className={styles.newIcon}
                                    onClick={() => {
                                      setFieldTypes("userFieldPath");
                                      setOpen(true);
                                    }}
                                  />
                                </>
                              )}
                          </TableCell>
                        </>
                      )}
                      {isTeamField && (
                        <>
                          <TableCell>
                            <InputLabel className={styles.label}>
                              {translate("User / Team field path")}
                            </InputLabel>
                          </TableCell>
                          <TableCell>
                            <Select
                              className={styles.select}
                              value={selectedFieldOption.teamFieldType || null}
                              type="text"
                              options={filterTypes("value")}
                              update={(value, label) => {
                                setSelectedFieldOption((prevState) => ({
                                  ...prevState,
                                  teamFieldType: value?.title,
                                }));
                                setProperty("teamFieldType", undefined);
                                const teamFieldTypes = [
                                  "Value",
                                  "Field",
                                  "Script",
                                ];
                                if (
                                  teamFieldTypes.includes(
                                    selectedFieldOption.teamFieldType
                                  ) ||
                                  teamFieldTypes.includes(
                                    getProperty("teamFieldType")
                                  )
                                ) {
                                  clearValues(
                                    "teamFieldPath",
                                    setTeamFieldPath,
                                    setTeamFieldDummy
                                  );
                                }
                              }}
                              disableClearable="false"
                              isLabel={false}
                              optionLabel={'title'}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              className={styles.textbox}
                              element={element}
                              type="text"
                              readOnly={
                                readOnlyFields?.teamFieldPath &&
                                teamFieldPath &&
                                getProperty("teamFieldPathValue")
                              }
                              placeholder=" Team field path"
                              entry={{
                                id: "teamFieldPath",
                                name: "teamFieldPath",
                                modelProperty: "teamFieldPath",
                                get: function () {
                                  return {
                                    teamFieldPath: teamFieldPath || "",
                                  };
                                },
                                set: function (e, value) {
                                  setTeamFieldPath(value.teamFieldPath);
                                  setTeamFieldDummy({
                                    teamFieldPath: value.teamFieldPath,
                                  });
                                  setProperty(
                                    "teamFieldPath",
                                    value.teamFieldPath
                                  );
                                  setProperty(
                                    "teamFieldType",
                                    value?.teamFieldPath !== "" &&
                                      selectedFieldOption?.teamFieldType
                                  );
                                },
                                validate: function (e, values) {
                                  if (
                                    !values.teamFieldPath &&
                                    IsUserMenu() &&
                                    !!!userFieldPath
                                  ) {
                                    return {
                                      teamFieldPath: translate(
                                        "Must provide a value"
                                      ),
                                    };
                                  }
                                },
                              }}
                              canRemove={true}
                              setTeamField={setTeamField}
                            />
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              className={styles.checkBox}
                              element={element}
                              entry={{
                                id: "isTeamField",
                                modelProperty: "isTeamField",
                                get: function () {
                                  return {
                                    isTeamField: isTeamField,
                                  };
                                },
                                set: function (e, value) {
                                  let teamField = !value.isTeamField;
                                  setIsTeamField(teamField);
                                  setProperty("isTeamField", teamField);
                                  if (!teamField) {
                                    clearValues(
                                      "teamFieldPath",
                                      setTeamFieldPath,
                                      setTeamFieldDummy
                                    );
                                  }
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell className={styles.tableCell}>
                            {selectedFieldOption.teamFieldType === "Field" &&
                              isTeamField && (
                                <MaterialIcon
                                  fontSize={16}
                                  icon="edit"
                                  className={styles.newIcon}
                                  onClick={() => {
                                    setFieldTypes("teamFieldPath");
                                    setOpenDialogs({
                                      scriptEditor: false,
                                      fieldEditor: true,
                                    });
                                    if (
                                      readOnlyFields?.teamFieldPath &&
                                      getProperty("teamFieldPathValue")
                                    ) {
                                      setAlertMessage(
                                        "Team field can't be managed using builder once changed manually."
                                      );
                                      setExpressionAlert(true);
                                    } else {
                                      setOpenTeamPathDialog(true);
                                    }
                                  }}
                                />
                              )}
                            {selectedFieldOption.teamFieldType === "Script" &&
                              isTeamField && (
                                <>
                                  <Tooltip title="Script" aria-label="enable">
                                    <i
                                      className="fa fa-code"
                                      style={{ fontSize: 18, marginLeft: 5 }}
                                      onClick={() => {
                                        setFieldTypes("teamFieldPath");
                                        setOpenDialogs({
                                          scriptEditor: true,
                                          fieldEditor: false,
                                        });

                                        setTeamFieldDummy({
                                          teamFieldPath:
                                            getScript("teamFieldPath"),
                                        });
                                        handleFieldChange("teamFieldPath");
                                      }}
                                    ></i>
                                  </Tooltip>
                                  <MaterialIcon
                                    fontSize={18}
                                    icon="edit"
                                    className={styles.newIcon}
                                    onClick={() => {
                                      setFieldTypes("teamFieldPath");
                                      setOpen(true);
                                    }}
                                  />
                                </>
                              )}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <InputLabel className={styles.label}>
                          {translate("Deadline field path")}
                        </InputLabel>
                      </TableCell>
                      <TableCell>
                        <Select
                          className={styles.select}
                          value={selectedFieldOption.deadlineType || null}
                          type="text"
                          update={(value, label) => {
                            setSelectedFieldOption((prevState) => ({
                              ...prevState,
                              deadlineType: value?.title,
                            }));
                            setProperty("deadlineType", undefined);
                            const deadlineTypes = ["Value", "Field", "Script"];
                            if (
                              deadlineTypes.includes(
                                selectedFieldOption.deadlineType
                              ) ||
                              deadlineTypes.includes(
                                getProperty("deadlineType")
                              )
                            ) {
                              clearValues(
                                "deadlineFieldPath",
                                setDeadlineFieldPath,
                                setDeadlineFieldPathDummy
                              );
                            }
                          }}
                          options={filterTypes("value")}
                          disableClearable="false"
                          isLabel={false}
                          optionLabel={'title'}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          className={styles.textbox}
                          element={element}
                          type="text"
                          canRemove={true}
                          readOnly={
                            deadlineFieldPath &&
                            readOnlyFields?.deadlineFieldPath
                          }
                          placeholder=" Deadline field path"
                          entry={{
                            id: "deadlineFieldPath",
                            name: "deadlineFieldPath",
                            modelProperty: "deadlineFieldPath",
                            get: function () {
                              return {
                                deadlineFieldPath: deadlineFieldPath || "",
                              };
                            },
                            set: function (e, value) {
                              setDeadlineFieldPath(value.deadlineFieldPath);
                              setDeadlineFieldPathDummy({
                                deadlineFieldPath: value.deadlineFieldPath,
                              });
                              setProperty(
                                "deadlineFieldPath",
                                value.deadlineFieldPath
                              );

                              setProperty(
                                "deadlineType",
                                value?.deadlineFieldPath !== "" &&
                                  selectedFieldOption.deadlineType
                              );
                            },
                            validate: function (e, values) {
                              if (!values.deadlineFieldPath && IsUserMenu()) {
                                return {
                                  deadlineFieldPath: translate(
                                    "Must provide a value"
                                  ),
                                };
                              }
                            },
                          }}
                          setDeadlineField={setDeadlineField}
                        />
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell className={styles.tableCell}>
                        {selectedFieldOption.deadlineType === "Field" && (
                          <MaterialIcon
                            fontSize={16}
                            icon="edit"
                            className={styles.newIcon}
                            onClick={() => {
                              setFieldTypes("deadlineFieldPath");
                              setOpenDialogs({
                                scriptEditor: false,
                                fieldEditor: true,
                              });
                              if (
                                readOnlyFields?.deadlineFieldPath &&
                                getProperty("deadlineFieldPathValue")
                              ) {
                                setAlertMessage(
                                  "Deadline field can't be managed using builder once changed manually."
                                );
                                setExpressionAlert(true);
                              } else {
                                setOpenDeadlinePathDialog(true);
                              }
                            }}
                          />
                        )}
                        {selectedFieldOption.deadlineType === "Script" && (
                          <>
                            <Tooltip title="Script" aria-label="enable">
                              <i
                                className="fa fa-code"
                                style={{ fontSize: 18, marginLeft: 5 }}
                                onClick={() => {
                                  setFieldTypes("deadlineFieldPath");
                                  setOpenDialogs({
                                    scriptEditor: true,
                                    fieldEditor: false,
                                  });

                                  setDeadlineFieldPathDummy({
                                    deadlineFieldPath:
                                      getScript("deadlineFieldPath"),
                                  });
                                  handleFieldChange("deadlineFieldPath");
                                }}
                              ></i>
                            </Tooltip>
                            <MaterialIcon
                              fontSize={18}
                              icon="edit"
                              className={styles.newIcon}
                              onClick={() => {
                                setFieldTypes("deadlineFieldPath");
                                setOpen(true);
                              }}
                            />
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </Box>
          </Box>
        </Box>
        {openScriptDialog && (
          <ScriptDialog
            element={element}
            updateScript={updateScript}
            fieldType={fieldTypes}
            setOpenScriptDialog={setOpenScriptDialog}
            taskFields={taskFields}
            setTaskFields={setTaskFields}
            actionTitleDummy={actionTitleDummy}
            priorityDummy={priorityDummy}
            durationDummy={durationDummy}
            descriptionDummy={descriptionDummy}
            setActionTitleDummy={setActionTitleDummy}
            setPriorityDummy={setPriorityDummy}
            setDurationDummy={setDurationDummy}
            setDescriptionDummy={setDescriptionDummy}
            setUserFieldPathDummy={setUserFieldPathDummy}
            setTeamFieldDummy={setTeamFieldDummy}
            setDeadlineFieldPathDummy={setDeadlineFieldPathDummy}
            setRoleDummy={setRoleDummy}
            userDummy={userFieldPathDummy}
            teamDummy={teamFieldDummy}
            deadlineDummy={deadlineFieldPathDummy}
            roleDummy={roleDummy}
            alertMessage={alertMessage}
            readOnlyFields={readOnlyFields}
            openExpressionAlert={openExpressionAlert}
            getScript={getScript}
            getProperty={getProperty}
            setProperty={setProperty}
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
                        optionLabel={'name'}
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

      <AlertDialog
        openAlert={openTeamPathDialog}
        fullscreen={false}
        title="Team field path"
        handleAlertOk={() => {
          if (teamField && teamField.target !== "com.axelor.team.db.Team") {
            setAlertMessage("Last subfield should be related to team");
            setExpressionAlert(true);
            return;
          }
          setOpenTeamPathDialog(false);
          if (!teamField && !teamFieldDummy?.teamFieldPath) {
            setProperty("teamFieldType", undefined);
          }
          if (teamField) {
            setTeamFieldPath(teamFieldDummy);
            setProperty("teamFieldPath", teamFieldDummy);
            setProperty("teamFieldType", selectedFieldOption.teamFieldType);
          }
          if (teamFieldDummy?.teamFieldPath) {
            setTeamFieldPath(teamFieldDummy?.teamFieldPath);
            setProperty("teamFieldPath", teamFieldDummy?.teamFieldPath);
            setProperty("teamFieldType", selectedFieldOption.teamFieldType);
          }
        }}
        alertClose={() => {
          setOpenTeamPathDialog(false);
          setTeamFieldDummy(teamFieldPath);
        }}
        children={
          <FieldEditor
            getMetaFields={getFields}
            onChange={(val, field) => {
              setTeamFieldDummy(val);
              setTeamField(field);
            }}
            value={
              teamFieldDummy
                ? { fieldName: teamFieldDummy }
                : teamFieldDummy?.teamFieldPath
                ? { fieldName: teamFieldDummy?.teamFieldPath }
                : { fieldName: "" }
            }
            isParent={true}
          />
        }
      />
      <AlertDialog
        openAlert={openDeadlinePathDialog}
        title={"Deadline field path"}
        fullscreen={false}
        handleAlertOk={() => {
          if (
            deadlineField &&
            deadlineField.type &&
            !["datetime", "date"].includes(deadlineField.type.toLowerCase())
          ) {
            setAlertMessage("Field should be date field");
            setExpressionAlert(true);
            return;
          }
          setOpenDeadlinePathDialog(false);
          if (!deadlineField && !deadlineFieldPathDummy?.deadlineFieldPath) {
            setProperty("deadlineType", undefined);
          }
          if (deadlineField) {
            setDeadlineFieldPath(deadlineFieldPathDummy);
            setProperty("deadlineFieldPath", deadlineFieldPathDummy);
            setProperty("deadlineType", selectedFieldOption.deadlineType);
          }
          if (deadlineFieldPathDummy?.deadlineFieldPath) {
            setDeadlineFieldPath(deadlineFieldPathDummy?.deadlineFieldPath);
            setProperty(
              "deadlineFieldPath",
              deadlineFieldPathDummy?.deadlineFieldPath
            );
            setProperty("deadlineType", selectedFieldOption.deadlineType);
          }
        }}
        alertClose={() => {
          setOpenDeadlinePathDialog(false);
          setDeadlineFieldPathDummy(deadlineFieldPath);
        }}
        children={
          <FieldEditor
            getMetaFields={getFields}
            onChange={(val, field) => {
              setDeadlineFieldPathDummy(val);
              setDeadlineField(field);
            }}
            value={
              deadlineFieldPathDummy
                ? { fieldName: deadlineFieldPathDummy }
                : deadlineFieldPathDummy?.deadlineFieldPath
                ? { fieldName: deadlineFieldPathDummy?.deadlineFieldPath }
                : { fieldName: "" }
            }
            allowAllFields={true}
            isDatePath={true}
          />
        }
      />

      <AlertDialog
        openAlert={openUserPathDialog}
        title={"User field path"}
        fullscreen={false}
        handleAlertOk={() => {
          if (field && field.target !== "com.axelor.auth.db.User") {
            openDialog({
              title: "Error",
              message: "Last subfield must be user field",
            });
            return;
          }
          setOpenUserPathDialog(false);
          setUserFieldPath(userFieldPathDummy);
          setProperty("userFieldPath", userFieldPathDummy);
        }}
        alertClose={() => {
          setOpenUserPathDialog(false);
          setUserFieldPathDummy(userFieldPath);
        }}
        children={
          <FieldEditor
            getMetaFields={getFields}
            onChange={(val, field) => {
              setUserFieldPathDummy(val);
              setField(field);
            }}
            value={
              userFieldPathDummy
                ? { fieldName: userFieldPathDummy }
                : userFieldPathDummy?.userFieldPath
                ? { fieldName: userFieldPathDummy?.userFieldPath }
                : { fieldName: "" }
            }
            isParent={true}
            isUserPath={true}
          />
        }
      />

      <Dialog open={openRoleDialog} backdrop centered className={styles.dialog}>
        <DialogHeader onCloseClick={() => setOpenRoleDialog(false)}>
          <h3>{translate("Role field path")}</h3>
        </DialogHeader>
        <DialogContent className={styles.dialogContent}>
          <FieldEditor
            getMetaFields={getFields}
            onChange={(val, field) => {
              setRoleDummy(val);
              setRole(field);
            }}
            value={
              roleDummy
                ? { fieldName: roleDummy }
                : roleDummy?.roleFieldPath
                ? { fieldName: roleDummy?.roleFieldPath }
                : { fieldName: "" }
            }
            isParent={true}
            isUserPath={true}
          />
        </DialogContent>
        <DialogFooter>
          <Button
            onClick={() => {
              if (role && role.target !== "com.axelor.auth.db.Role") {
                setAlertMessage("Last sub field must be role field");
                setExpressionAlert(true);
                return;
              }
              setOpenRoleDialog(false);
              if (!role && !roleDummy) {
                setProperty("roleType", undefined);
              }
              if (role) {
                setRoleFieldPath(roleDummy);
                setProperty("roleFieldPath", roleDummy);
                setProperty("roleType", selectedTaskOption?.roleType);
              }
              if (roleDummy?.roleFieldPath) {
                setRoleFieldPath(roleDummy?.roleFieldPath);
                setProperty("roleFieldPath", roleDummy?.roleFieldPath);
                setProperty("roleType", selectedTaskOption?.roleType);
              }
            }}
            variant="primary"
            className={styles.save}
          >
            {translate("OK")}
          </Button>
          <Button
            onClick={() => {
              setOpenRoleDialog(false);
              setRoleDummy(roleFieldPath);
            }}
            variant="secondary"
            className={styles.save}
          >
            {translate("Cancel")}
          </Button>
        </DialogFooter>
      </Dialog>

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
              if (openExpressionAlert) {
                const fieldPathsMap = {
                  userFieldPath: "userFieldPath",
                  teamFieldPath: "teamFieldPath",
                  deadlineFieldPath: "deadlineFieldPath",
                  roleFieldPath: "roleFieldPath",
                };

                const fieldPath = fieldPathsMap[fieldTypes];
                if (fieldPath) {
                  clearFieldPathsData(fieldPath);
                }
              }
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

      {open && (
        <QueryBuilder
          open={open}
          close={handleClose}
          type="bpmQuery"
          title="Add query"
          setProperty={(val) =>
            setter(val, dummyStates, fieldPathState, fieldTypes)
          }
          getExpression={() => getter(fieldTypes)}
          fetchModels={() => fetchModels(element)}
        />
      )}
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
                    return { script: descriptionDummy?.description };
                  },
                  set: function (e, values) {
                    setDescriptionDummy({ description: values?.script });
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
