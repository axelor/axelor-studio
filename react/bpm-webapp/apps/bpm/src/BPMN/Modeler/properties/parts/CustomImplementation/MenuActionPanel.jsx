import React, { useState, useEffect } from "react";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { makeStyles } from "@material-ui/core/styles";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  IconButton,
  Card,
  CardContent,
} from "@material-ui/core";

import Select from "../../../../../components/Select";
import {
  TextField,
  Checkbox,
  Table,
  FieldEditor,
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
import { setDummyProperty } from "./utils";
import { USER_TASKS_TYPES } from "../../../constants";
import {
  createElement,
  createParameter,
  getExtensionElementProperties,
  nextId,
  openTabView,
} from "./utils";
import Add from "@material-ui/icons/Add";
import Close from "@material-ui/icons/Close";
import Edit from "@material-ui/icons/Edit";
import OpenInNew from "@material-ui/icons/OpenInNew";

const useStyles = makeStyles((theme) => ({
  main: {
    display: "flex",
    flexDirection: "column",
  },
  container: {
    marginTop: 10,
  },
  label: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    margin: "3px 0px",
  },
  select: {
    margin: "0px 5px 0px 0px",
  },
  iconButton: {
    margin: "5px 0px 5px 5px",
    borderRadius: 0,
    border: "1px solid #ccc",
    padding: 2,
    width: "fit-content",
  },
  icons: {
    display: "flex",
    alignItems: "center",
  },
  card: {
    margin: "5px 0px 10px 0px",
    boxShadow: "none",
    width: "100%",
    border: "1px solid #ccc",
    background: "#f8f8f8",
    borderRadius: 0,
  },
  cardContent: {
    padding: "10px !important",
  },
  cardContainer: {
    display: "flex",
    alignItems: "flex-start",
  },
  newIcon: {
    marginLeft: 4,
    color: "#58B423",
    cursor: "pointer",
  },
  save: {
    margin: theme.spacing(1),
    backgroundColor: "#0275d8",
    borderColor: "#0267bf",
    color: "white",
    textTransform: "none",
    "&:hover": {
      backgroundColor: "#025aa5",
      borderColor: "#014682",
      color: "white",
    },
  },
  dialogContent: {
    display: "flex",
    alignItems: "flex-end",
  },
  menuContainer: {
    display: "flex",
    justifyContent: "space-between",
  },
  menu: {
    width: "50%",
  },
  dialog: {
    minWidth: 300,
  },
}));

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

export default function MenuActionPanel({ element, bpmnFactory, bpmnModeler }) {
  const [createUserAction, setCreateUserAction] = useState(false);
  const [deadlineFieldPath, setDeadlineFieldPath] = useState(null);
  const [emailNotification, setEmailNotification] = useState(false);
  const [userFieldPath, setUserFieldPath] = useState(null);
  const [userFieldPathDummy, setUserFieldPathDummy] = useState(null);
  const [actionEmailTitle, setActionEmailTitle] = useState(null);
  const [model, setModel] = useState(null);
  const [template, setTemplate] = useState(null);
  const [emailEvent, setEmailEvent] = useState();
  const [role, setRole] = useState(null);
  const [openUserPathDialog, setOpenUserPathDialog] = useState(false);
  const [field, setField] = useState(null);
  const [openExpressionAlert, setExpressionAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState(
    "Last sub field must be user field"
  );
  const [openDeadlinePathDialog, setOpenDeadlinePathDialog] = useState(false);
  const [deadlineField, setDeadlineField] = useState(null);
  const [deadlineFieldPathDummy, setDeadlineFieldPathDummy] = useState(null);
  const [openTeamPathDialog, setOpenTeamPathDialog] = useState(false);
  const [teamFieldPath, setTeamFieldPath] = useState(null);
  const [teamField, setTeamField] = useState(null);
  const [teamFieldDummy, setTeamFieldDummy] = useState(null);
  const [menus, setMenus] = useState([]);
  const classes = useStyles();

  const getFields = React.useCallback(() => {
    return getMetaFields(model);
  }, [model]);

  const IsUserMenu = React.useCallback(() => {
    return menus.find((menu) => getBool(menu?.isUserMenu));
  }, [menus]);

  const setProperty = React.useCallback(
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

  const getProperty = React.useCallback(
    (name) => {
      let propertyName = `camunda:${name}`;
      const bo = getBusinessObject(element);
      return (bo.$attrs && bo.$attrs[propertyName]) || "";
    },
    [element]
  );

  const getSelectValue = React.useCallback(
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

  const getMenuParameters = React.useCallback(
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
      extensionElements = elementHelper.createElement(
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
      setAlertMessage("Menu not found");
      setExpressionAlert(true);
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
      setAlertMessage("Menu not found");
      setExpressionAlert(true);
    }
  };

  useEffect(() => {
    setMenus(getMenuParameters());
  }, [getMenuParameters]);

  useEffect(() => {
    const createUserAction = getProperty("createUserAction");
    const actionEmailTitle = getProperty("actionEmailTitle");
    const emailNotification = getProperty("emailNotification");
    const emailEvent = getProperty("emailEvent") || "start";
    const role = getProperty("role");
    const deadlineFieldPath = getProperty("deadlineFieldPath");
    const template = getSelectValue("template");
    const userFieldPath = getProperty("userFieldPath");
    const teamFieldPath = getProperty("teamFieldPath");
    setCreateUserAction(getBool(createUserAction));
    setEmailNotification(getBool(emailNotification));
    setEmailEvent(emailEvent);
    setActionEmailTitle(actionEmailTitle);
    setUserFieldPath(userFieldPath);
    setTeamFieldPath(teamFieldPath);
    setDeadlineFieldPath(deadlineFieldPath);
    setDeadlineFieldPathDummy(deadlineFieldPath);
    setTemplate(template);
    setRole(role);
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

  return (
    <div className={classes.main}>
      <div className={classes.container}>
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
              if (emailNotification === false && createUserAction === false) {
                setActionEmailTitle(undefined);
                setProperty("actionEmailTitle", undefined);
              }
              if (!createUserAction) {
                setRole(null);
                setProperty("role", undefined);
              }
            },
          }}
        />
        {createUserAction && (
          <React.Fragment>
            <label className={classes.label}>{translate("Role")}</label>
            <Select
              className={classes.select}
              update={(value, label) => {
                setRole(value);
                updateMenuValue("role", value, label, "name");
              }}
              name="role"
              value={role || null}
              isLabel={false}
              fetchMethod={(data) => getRoles(data?.criteria)}
            />
          </React.Fragment>
        )}
        <div className={classes.container}>
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
                  if (createUserAction === false) {
                    setActionEmailTitle(undefined);
                    setProperty("actionEmailTitle", undefined);
                  }
                }
              },
            }}
          />
        </div>
        {emailNotification && (
          <React.Fragment>
            <label className={classes.label}>{translate("Email event")}</label>
            <Select
              className={classes.select}
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
            />
          </React.Fragment>
        )}
        {emailNotification && (
          <React.Fragment>
            <label className={classes.label}>{translate("Template")}</label>
            <Select
              className={classes.select}
              update={(value, label) => {
                setTemplate(value);
                updateMenuValue("template", value, label, "name");
              }}
              name="template"
              value={template}
              isLabel={false}
              fetchMethod={() => getTemplates(getProcessConfig())}
            />
          </React.Fragment>
        )}
        {(createUserAction || emailNotification) && (
          <TextField
            element={element}
            canRemove={true}
            entry={{
              id: "actionEmailTitle",
              name: "actionEmailTitle",
              label: translate("Action/Email title"),
              modelProperty: "actionEmailTitle",
              get: function () {
                return {
                  actionEmailTitle: actionEmailTitle || "",
                };
              },
              set: function (e, value) {
                setActionEmailTitle(value.actionEmailTitle);
                setProperty("actionEmailTitle", value.actionEmailTitle);
              },
              validate: function (e, values) {
                if (!values.actionEmailTitle) {
                  return {
                    actionEmailTitle: translate("Must provide a value"),
                  };
                }
              },
            }}
          />
        )}

        <TextField
          element={element}
          canRemove={true}
          readOnly={!!teamFieldPath}
          entry={{
            id: "userFieldPath",
            name: "userFieldPath",
            label: translate("User field path"),
            modelProperty: "userFieldPath",
            get: function () {
              return {
                userFieldPath: userFieldPath || "",
              };
            },
            set: function (e, value) {
              setUserFieldPath(value.userFieldPath);
              setUserFieldPathDummy(value.userFieldPath);
              setProperty("userFieldPath", value.userFieldPath);
            },
            validate: function (e, values) {
              if (!values.userFieldPath && IsUserMenu() && !!!teamFieldPath) {
                return {
                  userFieldPath: translate("Must provide a value"),
                };
              }
            },
          }}
          endAdornment={
            USER_TASKS_TYPES.includes(element.type) &&
            !!!teamFieldPath && (
              <Edit
                className={classes.newIcon}
                onClick={() => {
                  setOpenUserPathDialog(true);
                }}
              />
            )
          }
        />
        <TextField
          element={element}
          readOnly={!!userFieldPath}
          entry={{
            id: "teamFieldPath",
            name: "teamFieldPath",
            label: translate("Team field path"),
            modelProperty: "teamFieldPath",
            get: function () {
              return {
                teamFieldPath: teamFieldPath || "",
              };
            },
            set: function (e, values) {
              setTeamFieldPath(values.teamFieldPath);
              setTeamFieldDummy(values.teamFieldPath);
              setProperty("teamFieldPath", values.teamFieldPath);
            },
            validate: function (e, values) {
              if (!values.teamFieldPath && IsUserMenu() && !!!userFieldPath) {
                return {
                  teamFieldPath: translate("Must provide a value"),
                };
              }
            },
          }}
          canRemove={true}
          endAdornment={
            !!!userFieldPath && (
              <Edit
                className={classes.newIcon}
                onClick={() => {
                  setOpenTeamPathDialog(true);
                }}
              />
            )
          }
        />
        <TextField
          element={element}
          canRemove={true}
          entry={{
            id: "deadlineFieldPath",
            name: "deadlineFieldPath",
            label: translate("Deadline field path"),
            modelProperty: "deadlineFieldPath",
            get: function () {
              return {
                deadlineFieldPath: deadlineFieldPath || "",
              };
            },
            set: function (e, value) {
              setDeadlineFieldPath(value.deadlineFieldPath);
              setProperty("deadlineFieldPath", value.deadlineFieldPath);
            },
          }}
          endAdornment={
            <Edit
              className={classes.newIcon}
              onClick={() => {
                setOpenDeadlinePathDialog(true);
              }}
            />
          }
        />
      </div>
      <div>
        <label className={classes.label}>{translate("Add menus")}</label>
        <div>
          {menus?.map(
            (menu, key) =>
              menu && (
                <div key={`card_menu_${key}`} className={classes.cardContainer}>
                  <Card className={classes.card}>
                    <CardContent className={classes.cardContent}>
                      <div>
                        <div className={classes.menuContainer}>
                          <div className={classes.menu}>
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
                                      menuName: translate(
                                        "Must provide a value"
                                      ),
                                    };
                                  }
                                },
                              }}
                            />
                          </div>
                          <div className={classes.menu}>
                            <label className={classes.label}>
                              {translate("Menu parent")}
                            </label>
                            <Select
                              className={classes.select}
                              update={(value) => {
                                updateValue(value, "menuParent", "name", key);
                              }}
                              name="menuParent"
                              value={menu?.menuParent}
                              isLabel={false}
                              fetchMethod={(options) => getParentMenus(options)}
                            />
                          </div>
                        </div>
                        <div className={classes.menuContainer}>
                          <div className={classes.menu}>
                            <label className={classes.label}>
                              {translate("Position")}
                            </label>
                            <Select
                              className={classes.select}
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
                            />
                          </div>
                          <div className={classes.menu}>
                            <label className={classes.label}>
                              {translate("Position menu")}
                            </label>
                            <Select
                              className={classes.select}
                              update={(value) => {
                                updateValue(value, "positionMenu", "name", key);
                              }}
                              fetchMethod={() => getSubMenus(menu?.menuParent)}
                              name="positionMenu"
                              value={menu?.positionMenu}
                              isLabel={false}
                            />
                          </div>
                        </div>
                        <div>
                          <TextField
                            element={element}
                            canRemove={true}
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
                                updateValue(
                                  value.domain,
                                  "domain",
                                  undefined,
                                  key
                                );
                              },
                            }}
                          />
                        </div>
                        <div>
                          <label className={classes.label}>
                            {translate("Roles")}
                          </label>
                          <Select
                            className={classes.select}
                            update={(value) => {
                              updateValue(value, "roles", "name", key);
                            }}
                            fetchMethod={(options) =>
                              getRoles(options?.criteria)
                            }
                            name="roles"
                            value={
                              (typeof menu?.roles === "string"
                                ? menu?.roles
                                    ?.split(",")
                                    .map((name) => ({ name }))
                                : menu?.roles) || []
                            }
                            label={translate("Roles")}
                            multiple={true}
                            isLabel={false}
                          />
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
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
                        </div>
                        {model?.type === "metaModel" && (
                          <div className={classes.menuContainer}>
                            <div className={classes.menu}>
                              <label className={classes.label}>
                                {translate("Grid view")}
                              </label>
                              <Select
                                className={classes.select}
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
                              />
                            </div>
                            <div className={classes.menu}>
                              <label className={classes.label}>
                                {translate("Form view")}
                              </label>
                              <Select
                                className={classes.select}
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
                              />
                            </div>
                          </div>
                        )}
                        <div>
                          <Table
                            entry={{
                              id: `menu-context-${key}`,
                              labels: [translate("Key"), translate("Value")],
                              modelProperties: ["key", "value"],
                              addLabel: "Add context menu",
                              getElements: function () {
                                return getElements(key);
                              },
                              updateElement: function (
                                value,
                                label,
                                optionIndex
                              ) {
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
                      </div>
                    </CardContent>
                  </Card>
                  <div>
                    <IconButton
                      className={classes.iconButton}
                      onClick={() => {
                        removeItem(key);
                        removeElement(key);
                      }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                    <IconButton
                      className={classes.iconButton}
                      onClick={() => openMenu(menu)}
                    >
                      <OpenInNew fontSize="small" />
                    </IconButton>
                  </div>
                </div>
              )
          )}
        </div>
        <div className={classes.icons}>
          <IconButton className={classes.iconButton} onClick={addItems}>
            <Add fontSize="small" />
          </IconButton>
        </div>
      </div>
      {openTeamPathDialog && (
        <Dialog
          open={openTeamPathDialog}
          onClose={(event, reason) => {
            if (reason !== "backdropClick") {
              setOpenTeamPathDialog(false);
            }
          }}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          classes={{
            paper: classes.dialog,
          }}
        >
          <DialogTitle id="alert-dialog-title">
            {translate("Team field path")}
          </DialogTitle>
          <DialogContent className={classes.dialogContent}>
            <FieldEditor
              getMetaFields={getFields}
              onChange={(val, field) => {
                setTeamFieldDummy(val);
                setTeamField(field);
              }}
              value={{
                fieldName: teamFieldDummy,
              }}
              isParent={true}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                if (
                  teamField &&
                  teamField.target !== "com.axelor.team.db.Team"
                ) {
                  setAlertMessage("Last subfield should be related to team");
                  setExpressionAlert(true);
                  return;
                }
                setOpenTeamPathDialog(false);
                setTeamFieldPath(teamFieldDummy);
                setProperty("teamFieldPath", teamFieldDummy);
              }}
              color="primary"
              className={classes.save}
            >
              {translate("OK")}
            </Button>
            <Button
              onClick={() => {
                setOpenTeamPathDialog(false);
                setTeamFieldDummy(teamFieldPath);
              }}
              color="primary"
              className={classes.save}
            >
              {translate("Cancel")}
            </Button>
          </DialogActions>
        </Dialog>
      )}
      <Dialog
        open={openDeadlinePathDialog}
        onClose={(event, reason) => {
          if (reason !== "backdropClick") {
            setOpenDeadlinePathDialog(false);
          }
        }}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        classes={{
          paper: classes.dialog,
        }}
      >
        <DialogTitle id="alert-dialog-title">
          {translate("Deadline field path")}
        </DialogTitle>
        <DialogContent className={classes.dialogContent}>
          <FieldEditor
            getMetaFields={getFields}
            onChange={(val, field) => {
              setDeadlineFieldPathDummy(val);
              setDeadlineField(field);
            }}
            value={{
              fieldName: deadlineFieldPathDummy,
            }}
            allowAllFields={true}
            isDatePath={true}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
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
              setDeadlineFieldPath(deadlineFieldPathDummy);
              setProperty("deadlineFieldPath", deadlineFieldPathDummy);
            }}
            color="primary"
            className={classes.save}
          >
            {translate("OK")}
          </Button>
          <Button
            onClick={() => {
              setOpenDeadlinePathDialog(false);
              setDeadlineFieldPathDummy(userFieldPath);
            }}
            color="primary"
            className={classes.save}
          >
            {translate("Cancel")}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openUserPathDialog}
        onClose={(event, reason) => {
          if (reason !== "backdropClick") {
            setOpenUserPathDialog(false);
          }
        }}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        classes={{
          paper: classes.dialog,
        }}
      >
        <DialogTitle id="alert-dialog-title">
          {translate("User field path")}
        </DialogTitle>
        <DialogContent className={classes.dialogContent}>
          <FieldEditor
            getMetaFields={getFields}
            onChange={(val, field) => {
              setUserFieldPathDummy(val);
              setField(field);
            }}
            value={{
              fieldName: userFieldPathDummy,
            }}
            isParent={true}
            isUserPath={true}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              if (field && field.target !== "com.axelor.auth.db.User") {
                setAlertMessage("Last sub field must be user field");
                setExpressionAlert(true);
                return;
              }
              setOpenUserPathDialog(false);
              setUserFieldPath(userFieldPathDummy);
              setProperty("userFieldPath", userFieldPathDummy);
            }}
            color="primary"
            className={classes.save}
          >
            {translate("OK")}
          </Button>
          <Button
            onClick={() => {
              setOpenUserPathDialog(false);
              setUserFieldPathDummy(userFieldPath);
            }}
            color="primary"
            className={classes.save}
          >
            {translate("Cancel")}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openExpressionAlert}
        onClose={(event, reason) => {
          if (reason !== "backdropClick") {
            setExpressionAlert(false);
          }
        }}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        classes={{
          paper: classes.dialog,
        }}
      >
        <DialogTitle id="alert-dialog-title">{translate("Error")}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {translate(alertMessage)}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setExpressionAlert(false)}
            color="primary"
            className={classes.save}
          >
            {translate("OK")}
          </Button>
          <Button
            onClick={() => setExpressionAlert(false)}
            color="primary"
            className={classes.save}
          >
            {translate("Cancel")}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
