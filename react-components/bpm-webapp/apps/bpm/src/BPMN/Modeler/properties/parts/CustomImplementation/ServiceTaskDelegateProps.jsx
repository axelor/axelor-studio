import React, { useEffect, useState } from "react";
import ImplementationTypeHelper from "bpmn-js-properties-panel/lib/helper/ImplementationTypeHelper";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import AddIcon from "@material-ui/icons/Add";
import {
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  Button,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { is } from "bpmn-js/lib/util/ModelUtil";

import Select from "../../../../../components/Select";
import {
  getDMNModel,
  getDMNModels,
  getBamlModels,
  getActions,
} from "../../../../../services/api";
import { getBool } from "../../../../../utils";
import {
  SelectBox,
  TextField,
  Checkbox,
} from "../../../../../components/properties/components";
import { translate } from "../../../../../utils";
import { openWebApp } from "./utils";

const eventTypes = [
  "bpmn:StartEvent",
  "bpmn:IntermediateCatchEvent",
  "bpmn:IntermediateThrowEvent",
  "bpmn:EndEvent",
  "bpmn:BoundaryEvent",
];

function isServiceTaskLike(element) {
  return ImplementationTypeHelper.isServiceTaskLike(element);
}

function getBusinessObject(element) {
  return ImplementationTypeHelper.getServiceTaskLikeBusinessObject(element);
}

const bindingOptions = [
  {
    name: translate("latest"),
    value: "latest",
  },
  {
    name: translate("deployment"),
    value: "deployment",
  },
  {
    name: translate("version"),
    value: "version",
  },
  {
    name: translate("versionTag"),
    value: "versionTag",
  },
];

const useStyles = makeStyles((theme) => ({
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
  linkIcon: {
    color: "#58B423",
    marginLeft: 5,
  },
  link: {
    cursor: "pointer",
  },
  dmn: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  dialogPaper: {
    padding: 5,
    minWidth: 450,
    overflow: "auto",
  },
  button: {
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
  label: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    margin: "3px 0px",
  },
  actionContainer: {
    margin: "5px 0px 0px",
  },
  actionSelect: {
    margin: "3px 0px",
  },
  baml: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  select: {
    width: "100%",
  },
}));

const implementationOptions = [
  { name: translate("Java class"), value: "class" },
  { name: translate("Expression"), value: "expression" },
  {
    name: translate("Delegate expression"),
    value: "delegateExpression",
  },
  { name: translate("External"), value: "external" },
];

export default function ServiceTaskDelegateProps({ element, index, label }) {
  const [isVisible, setVisible] = useState(false);
  const [implementationType, setImplementationType] = useState("");
  const [bindingType, setBindingType] = useState("latest");
  const [dmnModel, setDmnModel] = useState(null);
  const [bamlModel, setBamlModel] = useState(null);
  const [open, setOpen] = useState(false);
  const [isBaml, setBaml] = useState(false);
  const [compulsory, setCompulsory] = useState(true);
  const [actions, setActions] = useState([]);

  const classes = useStyles();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const getPropertyValue = React.useCallback(
    (propertyName) => {
      const bo = getBusinessObject(element);
      return bo && bo[propertyName];
    },
    [element]
  );

  const setPropertyValue = (propertyName, value) => {
    const bo = getBusinessObject(element);
    if (bo) {
      bo[propertyName] = value;
    }
  };

  const setProperty = React.useCallback(
    (name, value) => {
      let bo = getBusinessObject(element);
      if ((element && element.type) === "bpmn:Participant") {
        bo = getBusinessObject(bo.processRef);
      }
      let propertyName = `camunda:${name}`;
      if (!bo) return;
      if (bo.$attrs) {
        bo.$attrs[propertyName] = value;
      } else {
        bo.$attrs = { [propertyName]: value };
      }
      if (value === undefined) {
        delete bo.$attrs[propertyName];
      }
    },
    [element]
  );

  const getProperty = React.useCallback(
    (name) => {
      let propertyName = `camunda:${name}`;
      let bo = getBusinessObject(element);
      if ((element && element.type) === "bpmn:Participant") {
        bo = getBusinessObject(bo.processRef);
      }
      return (bo && bo.$attrs && bo.$attrs[propertyName]) || "";
    },
    [element]
  );

  const onConfirm = () => {
    if (dmnModel) {
      if (element && element.businessObject) {
        element.businessObject.decisionRef = dmnModel.decisionId;
        setProperty("decisionName", dmnModel.name);
      }
    }
    handleClose();
  };

  const updateModel = React.useCallback(
    async (decisionRef) => {
      const dmnModel = await getDMNModel(decisionRef);
      setDmnModel(dmnModel);
      if (decisionRef) {
        const dmnTable = await getDMNModels([
          {
            fieldName: "decisionId",
            operator: "=",
            value: decisionRef,
          },
        ]);
        const dmnName = dmnTable && dmnTable[0] && dmnTable[0].name;
        if (element && element.businessObject && dmnName) {
          setProperty("decisionName", dmnName);
        }
      }
    },
    [element, setProperty]
  );

  useEffect(() => {
    async function fetchModel() {
      const baml = getProperty("baml") || false;
      const bamlModelId = getProperty("bamlModelId");
      setBaml(getBool(baml));
      const bamlModel = await getBamlModels([
        {
          fieldName: "id",
          operator: "=",
          value: bamlModelId,
        },
      ]);
      if (bamlModel && bamlModel[0]) {
        setBamlModel(bamlModel[0]);
      }
    }
    fetchModel();
  }, [getProperty]);

  useEffect(() => {
    const bo = getBusinessObject(element);

    if (!bo) {
      setImplementationType("script");
      return;
    }

    const implementationType = getProperty("implementationType");
    setImplementationType(implementationType || "");
  }, [element, getProperty]);

  useEffect(() => {
    if (implementationType === "actions") {
      const bo = getBusinessObject(element);
      const attrs = bo && bo.$attrs;
      const actions = attrs["camunda:actions"]?.split(",");
      const value =
        actions &&
        actions.map((action) => {
          return { name: action };
        });
      setActions(value);
    } else setActions([]);
  }, [implementationType, element]);

  useEffect(() => {
    if (implementationType === "dmn") {
      const bo = getBusinessObject(element);
      if (bo && bo.decisionRef) {
        let decisionId = bo.decisionRef;
        updateModel(decisionId);
      }
      const compulsory = getProperty("compulsory");
      if (!compulsory && is(element, "bpmn:BusinessRuleTask")) {
        setProperty("compulsory", true);
      }
      setCompulsory(compulsory ? getBool(compulsory) : true);
    }
  }, [element, implementationType, updateModel, setProperty, getProperty]);

  useEffect(() => {
    if (isServiceTaskLike(getBusinessObject(element))) {
      if (eventTypes.includes(element && element.type)) {
        return;
      }
      if (is(element, "bpmn:SendTask")) {
        const bo = getBusinessObject(element);
        if (bo) {
          element.businessObject.class =
            "com.axelor.studio.bpm.listener.SendTaskExecution";
        }
      }
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [element]);

  return (
    isVisible && (
      <div>
        {element && element.type !== "bpmn:SendTask" && (
          <React.Fragment>
            <React.Fragment>
              {index > 0 && <div className={classes.divider} />}
            </React.Fragment>
            <div className={classes.groupLabel}>{translate(label)}</div>
          </React.Fragment>
        )}
        {element && element.type === "bpmn:ServiceTask" && (
          <Checkbox
            element={element}
            entry={{
              id: "baml",
              label: translate("BAML"),
              modelProperty: "baml",
              widget: "checkbox",
              get: function () {
                return {
                  baml: isBaml,
                };
              },
              set: function (e, values) {
                let baml = !values.baml;
                if (baml) {
                  element.businessObject.class =
                    "com.axelor.studio.bpm.service.WkfBamlService";
                  setImplementationType("class");
                } else {
                  setImplementationType("");
                  element.businessObject.class = undefined;
                  setProperty("bamlModel", undefined);
                  setProperty("bamlModelId", undefined);
                }
                setProperty("baml", baml);
                setBaml(baml);
              },
            }}
          />
        )}
        {isBaml && (
          <React.Fragment>
            <label className={classes.label}>{translate("BAML model")}</label>
            <div className={classes.baml}>
              <Select
                className={classes.select}
                update={(value) => {
                  setBamlModel(value);
                  if (value) {
                    setProperty("bamlModel", value && value["name"]);
                    setProperty("bamlModelId", value && value["id"]);
                  } else {
                    setProperty("bamlModel", undefined);
                    setProperty("bamlModelId", undefined);
                  }
                }}
                name="bamlModel"
                isLabel={false}
                value={bamlModel}
                fetchMethod={(options) =>
                  getBamlModels(options && options.criteria)
                }
              />
              {bamlModel && (
                <div
                  onClick={() => {
                    openWebApp(
                      `baml-editor/?id=${bamlModel?.id || ""}`,
                      translate("BAML editor")
                    );
                  }}
                  className={classes.link}
                >
                  <OpenInNewIcon className={classes.linkIcon} />
                </div>
              )}
            </div>
          </React.Fragment>
        )}
        {((element?.type === "bpmn:ServiceTask" && !isBaml) ||
          element?.type !== "bpmn:SendTask") && (
          <React.Fragment>
            <SelectBox
              element={element}
              entry={{
                id: "implementationType",
                label: "Implementation",
                modelProperty: "implementationType",
                selectOptions: function () {
                  let options;
                  if (is(element, "bpmn:BusinessRuleTask")) {
                    const dmn = { name: translate("DMN"), value: "dmn" };
                    options = [...implementationOptions, dmn];
                  } else if (is(element, "bpmn:ServiceTask")) {
                    const actions = {
                      name: translate("Actions"),
                      value: "actions",
                    };
                    options = [...implementationOptions, actions];
                  } else {
                    options = implementationOptions;
                  }
                  return options;
                },
                emptyParameter: true,
                get: function () {
                  return { implementationType };
                },
                set: function (e, values) {
                  if (!values) return;
                  if (values.implementationType === "") {
                    element.businessObject.delegateExpression = undefined;
                    element.businessObject.class = undefined;
                    element.businessObject.expression = undefined;
                    element.businessObject.resultVariable = undefined;
                    element.businessObject.topic = undefined;
                    element.businessObject.taskPriority = undefined;
                    element.businessObject.decisionRef = undefined;
                    setProperty("decisionName", undefined);
                  } else {
                    values.implementationType !== "external"
                      ? (element.businessObject[values.implementationType] = "")
                      : (element.businessObject.topic = "");
                  }
                  if (values.implementationType === "dmn") {
                    setPropertyValue("mapDecisionResult", "singleResult");
                  }

                  if (values.implementationType !== "actions") {
                    element.businessObject.class = undefined;
                    setProperty("isAction", undefined);
                    setProperty("actions", undefined);
                  }

                  setImplementationType(values.implementationType);
                  setProperty("implementationType", values.implementationType);
                },
              }}
            />
            {implementationType === "class" && (
              <TextField
                element={element}
                entry={{
                  id: "class",
                  label: translate("Java class"),
                  modelProperty: "class",
                  get: function () {
                    let values = {};
                    const bo = getBusinessObject(element);
                    let boClass = bo && bo.get("class");
                    values.class = boClass;
                    return values;
                  },

                  set: function (element, values) {
                    let className = values.class;
                    if (element.businessObject) {
                      element.businessObject.class = className;
                      element.businessObject.expression = undefined;
                      element.businessObject.resultVariable = undefined;
                      element.businessObject.delegateExpression = undefined;
                      element.businessObject.topic = undefined;
                      element.businessObject.decisionRef = undefined;
                      setProperty("decisionName", undefined);
                    }
                  },
                  validate: function (e, values) {
                    if (!values.class) {
                      return { class: translate("Must provide a value") };
                    }
                  },
                }}
                canRemove={true}
              />
            )}
            {implementationType === "expression" && (
              <React.Fragment>
                <TextField
                  element={element}
                  entry={{
                    id: "expression",
                    label: translate("Expression"),
                    modelProperty: "expression",
                    get: function () {
                      let values = {};
                      const bo = getBusinessObject(element);
                      let expression = bo && bo.get("expression");
                      values.expression = expression;
                      return values;
                    },

                    set: function (element, values) {
                      let expression = values.expression;
                      if (element.businessObject) {
                        element.businessObject.expression = expression;
                        element.businessObject.class = undefined;
                        element.businessObject.delegateExpression = undefined;
                        element.businessObject.topic = undefined;
                        element.businessObject.decisionRef = undefined;
                        setProperty("decisionName", undefined);
                      }
                    },
                    validate: function (e, values) {
                      if (!values.expression) {
                        return {
                          expression: translate("Must provide a value"),
                        };
                      }
                    },
                  }}
                  canRemove={true}
                />
                <TextField
                  element={element}
                  entry={{
                    id: "resultVariable",
                    label: translate("Result variable"),
                    modelProperty: "resultVariable",
                    get: function () {
                      let bo = getBusinessObject(element);
                      let boResultVariable =
                        bo && bo.get("camunda:resultVariable");
                      return { resultVariable: boResultVariable };
                    },
                    set: function (e, values) {
                      if (element.businessObject) {
                        element.businessObject.resultVariable =
                          values.resultVariable || undefined;
                      }
                    },
                  }}
                  canRemove={true}
                />
              </React.Fragment>
            )}
            {implementationType === "delegateExpression" && (
              <TextField
                element={element}
                entry={{
                  id: "delegateExpression",
                  label: translate("Delegate expression"),
                  modelProperty: "delegateExpression",
                  get: function () {
                    let values = {};
                    const bo = getBusinessObject(element);
                    let boDelegateExpression =
                      bo && bo.get("delegateExpression");
                    values.delegateExpression = boDelegateExpression;
                    return values;
                  },

                  set: function (element, values) {
                    let className = values.delegateExpression;
                    if (element.businessObject) {
                      element.businessObject.delegateExpression = className;
                      element.businessObject.class = undefined;
                      element.businessObject.expression = undefined;
                      element.businessObject.resultVariable = undefined;
                      element.businessObject.topic = undefined;
                      element.businessObject.decisionRef = undefined;
                      setProperty("decisionName", undefined);
                    }
                  },
                  validate: function (e, values) {
                    if (!values.delegateExpression) {
                      return {
                        delegateExpression: translate("Must provide a value"),
                      };
                    }
                  },
                }}
                canRemove={true}
              />
            )}
            {implementationType === "dmn" && (
              <React.Fragment>
                <TextField
                  element={element}
                  entry={{
                    id: "decisionRef",
                    label: translate("Decision ref"),
                    modelProperty: "decisionRef",
                    get: function () {
                      const bo = getBusinessObject(element);
                      return { decisionRef: bo && bo.decisionRef };
                    },
                    set: function (e, values) {
                      let value = values.decisionRef;
                      element.businessObject.decisionRef = value;
                      element.businessObject.class = undefined;
                      element.businessObject.expression = undefined;
                      element.businessObject.resultVariable = undefined;
                      element.businessObject.delegateExpression = undefined;
                      element.businessObject.topic = undefined;
                      updateModel(value);
                    },
                    validate: function (e, values) {
                      if (!values.decisionRef) {
                        return {
                          decisionRef: translate("Must provide a value"),
                        };
                      }
                    },
                  }}
                  canRemove={true}
                  endAdornment={
                    <>
                      <div onClick={handleClickOpen} className={classes.link}>
                        <AddIcon className={classes.linkIcon} />
                      </div>
                      {dmnModel &&
                        element &&
                        getBusinessObject(element) &&
                        getBusinessObject(element).decisionRef && (
                          <div
                            onClick={() => {
                              openWebApp(
                                `wkf-editor/?type=dmn&id=${dmnModel.id || ""}`,
                                translate("DMN editor")
                              );
                            }}
                            className={classes.link}
                          >
                            <OpenInNewIcon className={classes.linkIcon} />
                          </div>
                        )}
                    </>
                  }
                />
                <TextField
                  element={element}
                  readOnly={true}
                  entry={{
                    id: "decisionName",
                    label: translate("Decision name"),
                    modelProperty: "decisionName",
                    get: function () {
                      const bo = getBusinessObject(element);
                      return {
                        decisionName:
                          bo && bo.$attrs && bo.$attrs["camunda:decisionName"],
                      };
                    },
                  }}
                />
                <SelectBox
                  element={element}
                  entry={{
                    id: "decisionRefBinding",
                    label: translate("Binding"),
                    modelProperty: "decisionRefBinding",
                    selectOptions: bindingOptions,
                    emptyParameter: true,
                    get: function () {
                      return {
                        decisionRefBinding: bindingType,
                      };
                    },
                    set: function (e, values) {
                      setBindingType(values.decisionRefBinding);
                      setPropertyValue(
                        "decisionRefBinding",
                        values.decisionRefBinding
                      );
                    },
                  }}
                />
                {bindingType === "version" && (
                  <TextField
                    element={element}
                    entry={{
                      id: "decisionRefVersion",
                      label: translate("Version"),
                      modelProperty: "decisionRefVersion",
                      get: function () {
                        return {
                          decisionRefVersion:
                            getPropertyValue("decisionRefVersion"),
                        };
                      },
                      set: function (e, values) {
                        setPropertyValue(
                          "decisionRefVersion",
                          values.decisionRefVersion
                        );
                        setPropertyValue("decisionRefVersionTag", undefined);
                      },
                      validate: function (e, values) {
                        if (!values.decisionRefVersion) {
                          return {
                            decisionRefVersion: translate(
                              "Must provide a value"
                            ),
                          };
                        }
                      },
                    }}
                    canRemove={true}
                  />
                )}
                {bindingType === "versionTag" && (
                  <TextField
                    element={element}
                    entry={{
                      id: "decisionRefVersionTag",
                      label: translate("Version tag"),
                      modelProperty: "decisionRefVersionTag",
                      get: function () {
                        let bo = getBusinessObject(element);
                        return {
                          decisionRefVersionTag:
                            bo && bo.$attrs["camunda:decisionRefVersionTag"],
                        };
                      },
                      set: function (e, values) {
                        let bo = getBusinessObject(element);
                        bo.$attrs["camunda:decisionRefVersionTag"] =
                          values.decisionRefVersionTag;
                        setPropertyValue("decisionRefVersion", undefined);
                      },
                      validate: function (e, values) {
                        if (!values.decisionRefVersionTag) {
                          return {
                            decisionRefVersionTag: translate(
                              "Must provide a value"
                            ),
                          };
                        }
                      },
                    }}
                    canRemove={true}
                  />
                )}
                <TextField
                  element={element}
                  entry={{
                    id: "decisionRefTenantId",
                    label: translate("Tenant id"),
                    modelProperty: "decisionRefTenantId",
                    get: function () {
                      return {
                        decisionRefTenantId: getPropertyValue(
                          "decisionRefTenantId"
                        ),
                      };
                    },
                    set: function (e, values) {
                      setPropertyValue(
                        "decisionRefTenantId",
                        values.decisionRefTenantId
                      );
                    },
                  }}
                  canRemove={true}
                />
                <TextField
                  element={element}
                  entry={{
                    id: "resultVariable",
                    label: translate("Result variable"),
                    modelProperty: "resultVariable",
                    get: function () {
                      let bo = getBusinessObject(element);
                      let boResultVariable = bo && bo.resultVariable;
                      return { resultVariable: boResultVariable };
                    },
                    set: function (e, values) {
                      if (element.businessObject) {
                        element.businessObject.resultVariable =
                          values.resultVariable || undefined;
                      }
                    },
                  }}
                  canRemove={true}
                />
                <Checkbox
                  element={element}
                  entry={{
                    id: "compulsory",
                    label: translate("Compulsory"),
                    modelProperty: "compulsory",
                    widget: "checkbox",
                    get: function () {
                      return {
                        compulsory: compulsory,
                      };
                    },
                    set: function (e, value) {
                      let compulsory = !value.compulsory;
                      setCompulsory(compulsory);
                      setProperty("compulsory", compulsory);
                    },
                  }}
                />
              </React.Fragment>
            )}
            {implementationType === "external" && (
              <React.Fragment>
                <TextField
                  element={element}
                  entry={{
                    id: "topic",
                    label: translate("Topic"),
                    modelProperty: "topic",
                    get: function () {
                      let values = {};
                      const bo = getBusinessObject(element);
                      let topic = bo && bo.get("topic");
                      values.topic = topic;
                      return values;
                    },

                    set: function (element, values) {
                      let topic = values.topic;
                      if (element.businessObject) {
                        element.businessObject.topic = topic;
                        element.businessObject.class = undefined;
                        element.businessObject.expression = undefined;
                        element.businessObject.resultVariable = undefined;
                        element.businessObject.delegateExpression = undefined;
                        element.businessObject.decisionRef = undefined;
                        setProperty("decisionName", undefined);
                      }
                    },
                    validate: function (e, values) {
                      if (!values.topic) {
                        return { topic: translate("Must provide a value") };
                      }
                    },
                  }}
                  canRemove={true}
                />
                <React.Fragment>
                  {index > 0 && <div className={classes.divider} />}
                </React.Fragment>
                <div className={classes.groupLabel}>
                  {translate("External task configuration")}
                </div>
                <TextField
                  element={element}
                  entry={{
                    id: "taskPriority",
                    label: translate("Task priority"),
                    modelProperty: "taskPriority",
                    get: function () {
                      let values = {};
                      const bo = getBusinessObject(element);
                      let boTaskPriority = bo && bo.get("taskPriority");
                      values.taskPriority = boTaskPriority;
                      return values;
                    },

                    set: function (element, values) {
                      let taskPriority = values.taskPriority;
                      if (element.businessObject) {
                        element.businessObject.taskPriority = taskPriority;
                      }
                    },
                  }}
                  canRemove={true}
                />
              </React.Fragment>
            )}
            {implementationType === "actions" && (
              <div className={classes.actionContainer}>
                <label className={classes.label}>{translate("Actions")}</label>
                <Select
                  className={classes.actionSelect}
                  update={(value) => {
                    setActions(value);
                    if (value?.length) {
                      element.businessObject.class = `com.axelor.studio.bpm.service.execution.WkfActionService`;
                      element.businessObject.topic = undefined;
                      element.businessObject.expression = undefined;
                      element.businessObject.resultVariable = undefined;
                      element.businessObject.delegateExpression = undefined;
                      element.businessObject.decisionRef = undefined;
                      setProperty(
                        "actions",
                        value?.map((v) => v.name).join(",")
                      );
                      setProperty("isAction", "true");
                    } else {
                      element.businessObject.class = undefined;
                      setProperty("actions", undefined);
                      setProperty("isAction", undefined);
                    }
                  }}
                  name="actions"
                  validate={(values) => {
                    if (!values?.actions?.length) {
                      return { actions: translate("Must provide a value") };
                    }
                  }}
                  value={actions || []}
                  multiple={true}
                  optionLabel="name"
                  optionLabelSecondary="title"
                  fetchMethod={({ criteria }) => getActions(criteria)}
                />
              </div>
            )}
          </React.Fragment>
        )}
        {open && (
          <Dialog
            open={open}
            onClose={(event, reason) => {
              if (reason !== "backdropClick") {
                handleClose();
              }
            }}
            aria-labelledby="form-dialog-title"
            maxWidth="sm"
            classes={{
              paper: classes.dialogPaper,
            }}
          >
            <DialogTitle id="form-dialog-title">
              {translate("Select DMN")}
            </DialogTitle>
            <DialogContent>
              <label className={classes.label}>{translate("DMN")}</label>
              <Select
                className={classes.select}
                update={(value) => {
                  setDmnModel(value);
                }}
                name="dmnModel"
                isLabel={true}
                fetchMethod={(options) =>
                  getDMNModels(options && options.criteria)
                }
              />
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleClose}
                className={classes.button}
                color="primary"
                variant="outlined"
              >
                {translate("Cancel")}
              </Button>
              <Button
                onClick={onConfirm}
                className={classes.button}
                color="primary"
                variant="outlined"
              >
                {translate("OK")}
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </div>
    )
  );
}
