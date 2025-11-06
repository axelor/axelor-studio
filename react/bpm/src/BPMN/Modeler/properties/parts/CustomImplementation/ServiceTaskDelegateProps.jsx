import { is } from "bpmn-js/lib/util/ModelUtil";
import React, { useEffect, useState } from "react";
import {
  getServiceTaskLikeBusinessObject,
  isServiceTaskLike,
} from "../../../../../utils/ImplementationTypeUtils";

import Select from "../../../../../components/Select";
import {
  Checkbox,
  SelectBox,
  TextField,
} from "../../../../../components/properties/components";
import {
  checkConnectAndStudioInstalled,
  getActions,
  getDMNModel,
  getDMNModels,
  getOrganization,
  getScenarios,
} from "../../../../../services/api";
import { getBool, translate } from "../../../../../utils";

import { Box, InputLabel } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import AlertDialog from "../../../../../components/AlertDialog";
import Title from "../../../Title";
import styles from "./service-task.module.css";

import { openWebApp } from "./utils";
import CollapsePanel from "../componants/CollapsePanel";
const eventTypes = [
  "bpmn:StartEvent",
  "bpmn:IntermediateCatchEvent",
  "bpmn:IntermediateThrowEvent",
  "bpmn:EndEvent",
  "bpmn:BoundaryEvent",
];

function getBusinessObject(element) {
  return getServiceTaskLikeBusinessObject(element);
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

const implementationOptions = [
  { name: translate("Java class"), value: "class" },
  { name: translate("Expression"), value: "expression" },
  {
    name: translate("Delegate expression"),
    value: "delegateExpression",
  },
  { name: translate("External"), value: "external" },
];

export default function ServiceTaskDelegateProps({
                                                   element,
                                                   index,
                                                   label,
                                                   bpmnModeler,
                                                   setDummyProperty = () => {},
                                                 }) {
  const [isVisible, setVisible] = useState(false);
  const [implementationType, setImplementationType] = useState("");
  const [bindingType, setBindingType] = useState("latest");
  const [dmnModel, setDmnModel] = useState(null);
  const [open, setOpen] = useState(false);
  const [compulsory, setCompulsory] = useState(true);
  const [actions, setActions] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [scenario, setScenario] = useState(null);
  const [isInstall, setIsInstall] = useState(false);

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
    setDummyProperty({ bpmnModeler, element, value });
    const bo = getBusinessObject(element);
    if (bo) {
      bo[propertyName] = value;
    }
  };

  const setProperty = React.useCallback(
      (name, value) => {
        setDummyProperty({ bpmnModeler, element, value });
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
      [element, bpmnModeler]
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
        if (decisionRef) {
          const dmnTable = await getDMNModels([
            {
              fieldName: "decisionId",
              operator: "=",
              value: decisionRef,
            },
          ]);
          const dmnName = dmnTable && dmnTable[0] && dmnTable[0].name;
          setDmnModel({
            ...(dmnModel || {}),
            name: dmnName,
            decisionId: decisionRef,
          });
          if (element && element.businessObject && dmnName) {
            setProperty("decisionName", dmnName);
          }
        }
      },
      [element, setProperty]
  );
  const getOrganizationScenarios = React.useCallback((id) => {
    return getScenarios(id);
  }, []);

  const updateAction = (value) => {
    if (value?.length) {
      element.businessObject.class = `com.axelor.studio.bpm.service.execution.WkfActionService`;
      element.businessObject.topic = undefined;
      element.businessObject.expression = undefined;
      element.businessObject.resultVariable = undefined;
      element.businessObject.delegateExpression = undefined;
      element.businessObject.decisionRef = undefined;
      setProperty("actions", value?.map((v) => v.name).join(","));
      setProperty("isAction", "true");
    } else {
      element.businessObject.class = undefined;
      setProperty("actions", undefined);
      setProperty("isAction", undefined);
    }
  };

  const updateScenariodata = (value, organization) => {
    setProperty("organizationId", organization?.id);
    setProperty("organizationLabel", organization?.name);
    if (value) {
      element.businessObject.class = `com.axelor.studio.bpm.service.execution.WkfConnectService`;
      element.businessObject.topic = undefined;
      element.businessObject.expression = undefined;
      element.businessObject.resultVariable = undefined;
      element.businessObject.delegateExpression = undefined;
      element.businessObject.decisionRef = undefined;
      setProperty("scenario", value.id);
      setProperty("scenarioLabel", value.name);
    } else {
      element.businessObject.class = undefined;
      setProperty("scenario", undefined);
      setProperty("scenarioLabel", undefined);
    }
  };

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
    } else {
      setActions([]);
    }
  }, [implementationType, element]);

  useEffect(() => {
    if (implementationType === "connect") {
      const bo = getBusinessObject(element);
      const attrs = bo && bo.$attrs;
      const id = attrs["camunda:scenario"];
      const name = attrs["camunda:scenarioLabel"];
      const organizationId = attrs["camunda:organizationId"];
      const organizationLabel = attrs["camunda:organizationLabel"];
      if (organizations?.length === 1) {
        setOrganization({
          id: organizations[0].id,
          name: organizations[0].name,
        });
      } else {
        setOrganization({ id: organizationId, name: organizationLabel });
      }
      setScenario({ id, name });
    } else {
      setScenario(null);
      setOrganization(null);
    }
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

  useEffect(() => {
    (async function () {
      const isConnectInstalled = await checkConnectAndStudioInstalled();
      if (isConnectInstalled) {
        setIsInstall(true);
        const data = await getOrganization();
        setOrganizations(data);
      } else {
        setIsInstall(false);
      }
    })();
  }, []);
  return (
      isVisible && (
          <CollapsePanel
              label={element && element.type !== "bpmn:SendTask" && label}
          >
            {((element?.type === "bpmn:ServiceTask") ||
                element?.type !== "bpmn:SendTask") && (
                <React.Fragment>
                  <SelectBox
                      element={element}
                      entry={{
                        id: "implementationType",
                        label: "Implementation",
                        modelProperty: "implementationType",
                        selectOptions: function () {
                          let options = implementationOptions;
                          if (isInstall) {
                            const connect = {
                              name: translate("Connect"),
                              value: "connect",
                            };
                            options = [...options, connect];
                          }
                          if (is(element, "bpmn:BusinessRuleTask")) {
                            const dmn = { name: translate("DMN"), value: "dmn" };
                            options = [...options, dmn];
                          } else if (is(element, "bpmn:ServiceTask")) {
                            const actions = {
                              name: translate("Actions"),
                              value: "actions",
                            };
                            options = [...options, actions];
                          }

                          return options;
                        },
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
                          if (values.implementationType !== "connect") {
                            element.businessObject.class = undefined;
                            setProperty("organizationId", undefined);
                            setProperty("organizationLabel", undefined);
                            setProperty("scenario", undefined);

                            setProperty("scenarioLabel", undefined);
                          }
                          setImplementationType(values.implementationType);
                          setProperty("implementationType", values.implementationType);
                          setDmnModel(null);
                          element.businessObject.decisionRef = undefined;
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
                                  setDummyProperty({
                                    bpmnModeler,
                                    element,
                                    value: values.resultVariable || undefined,
                                  });
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
                              <Box className={styles.decisionRefIcons}>
                                <div onClick={handleClickOpen} className={styles.link}>
                                  <MaterialIcon
                                      icon="add"
                                      fontSize={18}
                                      className={styles.linkIcon}
                                  />
                                </div>
                                {dmnModel &&
                                    element &&
                                    getBusinessObject(element) &&
                                    getBusinessObject(element).decisionRef && (
                                        <div
                                            onClick={() => {
                                              openWebApp(
                                                  `bpm/?type=dmn&id=${dmnModel.id || ""}`,
                                                  translate("DMN editor")
                                              );
                                            }}
                                            className={styles.link}
                                        >
                                          <MaterialIcon
                                              icon="open_in_new"
                                              fontSize={18}
                                              className={styles.linkIcon}
                                          />
                                        </div>
                                    )}
                              </Box>
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
                        <Title
                            divider={index > 0}
                            label="External task configuration"
                        />
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
                                  setDummyProperty({
                                    bpmnModeler,
                                    element,
                                    value: taskPriority,
                                  });
                                  element.businessObject.taskPriority = taskPriority;
                                }
                              },
                            }}
                            canRemove={true}
                        />
                      </React.Fragment>
                  )}
                  {implementationType === "actions" && (
                      <div className={styles.actionContainer}>
                        <InputLabel color="body" className={styles.label}>
                          {translate("Actions")}
                        </InputLabel>
                        <Select
                            className={styles.actionSelect}
                            update={(value) => {
                              setActions(value);
                              updateAction(value);
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
                            handleRemove={(option) => {
                              const value = actions?.filter(
                                  (r) => r.name !== option.name
                              );
                              setActions(value);
                              updateAction(value);
                            }}
                        />
                      </div>
                  )}
                  {implementationType === "connect" && (
                      <>
                        <div className={styles.actionContainer}>
                          {organizations?.length > 1 && (
                              <>
                                <InputLabel color="body" className={styles.label}>
                                  {translate("Organization")}
                                </InputLabel>
                                <Select
                                    className={styles.actionSelect}
                                    update={(value) => {
                                      if (value) {
                                        setOrganization({
                                          id: value?.id,
                                          name: value?.name,
                                        });
                                      } else {
                                        setOrganization(null);
                                      }
                                      setScenario(null);
                                      updateScenariodata(null, value);
                                    }}
                                    validate={(values) => {
                                      if (!values?.connect?.id) {
                                        return {
                                          connect: translate("Must provide a value"),
                                        };
                                      }
                                    }}
                                    name="connect"
                                    value={organization}
                                    multiple={false}
                                    optionLabel="name"
                                    optionLabelSecondary="title"
                                    options={organizations || []}
                                    handleRemove={() => {
                                      setOrganization(null);
                                      setScenario(null);
                                      updateScenariodata(null, undefined);
                                    }}
                                />
                              </>
                          )}
                          {organizations?.length > 0 && organization?.id && (
                              <>
                                <InputLabel color="body" className={styles.label}>
                                  {translate("Scenario")}
                                </InputLabel>
                                <Select
                                    className={styles.actionSelect}
                                    update={(value) => {
                                      if (value) {
                                        const { id, name } = value;
                                        setScenario({ id, name });
                                        updateScenariodata({ id, name }, organization);
                                      } else {
                                        setScenario(null);
                                        updateScenariodata(null, organization);
                                      }
                                    }}
                                    validate={(values) => {
                                      if (!values?.scenario?.id) {
                                        return {
                                          scenario: translate("Must provide a value"),
                                        };
                                      }
                                    }}
                                    name="scenario"
                                    value={scenario}
                                    optionLabel="name"
                                    optionLabelSecondary="title"
                                    fetchMethod={() =>
                                        getOrganizationScenarios(organization?.id)
                                    }
                                    handleRemove={() => {
                                      setScenario(null);
                                      updateScenariodata(null, organization);
                                    }}
                                />
                              </>
                          )}
                        </div>
                      </>
                  )}
                </React.Fragment>
            )}

            <AlertDialog
                openAlert={open}
                title={"Select DMN"}
                fullscreen={false}
                handleAlertOk={onConfirm}
                alertClose={handleClose}
                children={
                  <div className={styles.dialogContent}>
                    <InputLabel color="body" className={styles.label}>
                      {translate("DMN")}
                    </InputLabel>
                    <Select
                        className={styles.select}
                        update={(value) => {
                          setDmnModel(value);
                        }}
                        value={dmnModel}
                        name="dmnModel"
                        isLabel={true}
                        fetchMethod={(options) =>
                            getDMNModels(options && options.criteria)
                        }
                        optionLabel={"name"}
                        optionLabelSecondary={"decisionId"}
                    />
                  </div>
                }
            />
          </CollapsePanel>
      )
  );
}