import React, { useCallback, useEffect, useState } from "react";
import classnames from "classnames";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";

import Select from "../../../../../components/Select";
import {
  Checkbox,
  FieldEditor,
  Textbox,
  TextField,
} from "../../../../../components/properties/components";
import {
  getAllModels,
  getCustomModels,
  getMetaModels,
  getMetaFields,
  getViews,
  fetchModels,
} from "../../../../../services/api";
import { getBool, translate } from "../../../../../utils";
import { DATA_STORE_TYPES, USER_TASKS_TYPES } from "../../../constants";

import {
  Box,
  clsx,
  Divider,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import QueryBuilder from "../../../../../components/QueryBuilder";
import Tooltip from "../../../../../components/Tooltip";
import styles from "./model-props.module.css";
import AlertDialog from "../../../../../components/AlertDialog";
import Title from "../../../Title";

const GATEWAY = ["bpmn:EventBasedGateway"];

const CONDITIONAL_SOURCES = [
  "bpmn:ExclusiveGateway",
  "bpmn:InclusiveGateway",
  "bpmn:ComplexGateway",
  "bpmn:ParallelGateway",
  "bpmn:SequenceFlow",
  "label",
  "bpmn:IntermediateThrowEvent",
  "bpmn:Collaboration",
  "bpmn:Lane",
  "bpmn:TextAnnotation",
  "bpmn:MessageFlow",
  "bpmn:ServiceTask",
  "bpmn:ScriptTask",
];

const TITLE_SOURCES = [
  "bpmn:Process",
  "bpmn:Participant",
  "bpmn:Group",
  "bpmn:SubProcess",
  "bpmn:AdHocSubProcess",
  "bpmn:Transaction",
  "bpmn:Task",
  "bpmn:TextAnnotation",
];

const HELP_TITLE_SOURCES = [
  "bpmn:IntermediateThrowEvent",
  "bpmn:ExclusiveGateway",
  "bpmn:InclusiveGateway",
  "bpmn:ComplexGateway",
  "bpmn:ParallelGateway",
  "bpmn:SequenceFlow",
  "label",
  "bpmn:Collaboration",
  "bpmn:Lane",
  "bpmn:TextAnnotation",
  "bpmn:MessageFlow",
  "bpmn:DataObjectReference",
  "bpmn:DataStoreReference",
];

const typesWithMenuAction = [
  "bpmn:StartEvent",
  "bpmn:AdHocSubProcess",
  "bpmn:Transaction",
  "bpmn:Group",
  "bpmn:Association",
  "bpmn:EndEvent",
  "bpmn:UserTask",
  "bpmn:ReceiveTask",
  "bpmn:CallActivity",
  "bpmn:SubProcess",
];

const EVENT_DEFINITIONS_TYPES = {
  "bpmn:StartEvent": [
    "bpmn:MessageEventDefinition",
    "bpmn:TimerEventDefinition",
    "bpmn:ConditionalEventDefinition",
    "bpmn:SignalEventDefinition",
    "bpmn:IntermediateCatchEvent",
  ],
  "bpmn:IntermediateCatchEvent": [
    "bpmn:MessageEventDefinition",
    "bpmn:TimerEventDefinition",
    "bpmn:ConditionalEventDefinition",
    "bpmn:LinkEventDefinition",
    "bpmn:SignalEventDefinition",
  ],
  "bpmn:EndEvent": [
    "bpmn:MessageEventDefinition",
    "bpmn:CompensateEventDefinition",
    "bpmn:ErrorEventDefinition",
    "bpmn:TerminateEventDefinition",
    "bpmn:EscalationEventDefinition",
  ],
  "bpmn:IntermediateThrowEvent": ["bpmn:SignalEventDefinition"],
};

const PRIORITIES = [
  { value: "low", id: "low", title: "Low" },
  { value: "normal", id: "normal", title: "Normal" },
  { value: "high", id: "high", title: "High" },
  { value: "urgent", id: "urgent", title: "Urgent" },
];

function isConditionalSource(element) {
  return isAny(element, CONDITIONAL_SOURCES);
}

export default function ModelProps(props) {
  const {
    element,
    index,
    label,
    handleMenuActionTab,
    bpmnModeler,
    setDummyProperty = () => {},
  } = props;
  const [isVisible, setVisible] = useState(false);
  const [metaModel, setMetaModel] = useState(null);
  const [metaJsonModel, setMetaJsonModel] = useState(null);
  const [models, setModels] = useState([]);
  const [displayStatus, setDisplayStatus] = useState(true);
  const [defaultForm, setDefaultForm] = useState(null);
  const [formViews, setFormViews] = useState(null);
  const [isDefaultFormVisible, setDefaultFormVisible] = useState(false);
  const [isModelsDisable, setModelsDisable] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [renderActions, setRenderActions] = useState(false);

  const subType =
    element?.businessObject &&
    element.businessObject.eventDefinitions &&
    element.businessObject.eventDefinitions[0] &&
    element.businessObject.eventDefinitions[0].$type;

  const FIELD_ACTIONS = [
    {
      id: 1,
      isUserPath: true,
      label: translate("User"),
      title: "userField",
    },
    {
      id: 2,
      label: translate("Team"),
      title: "teamField",
    },
    {
      id: 3,
      isDatePath: true,
      label: translate("Deadline"),
      title: "deadlineField",
    },
  ];

  const FIELD_ACTIONS_HEADER = [
    { id: 1, label: "Field path", className: styles.leftAlign },
    { id: 2, label: "Type" },
    { id: 3, label: "Value" },
    { id: 4, label: "Action" },
  ];

  function getBO(element) {
    if (
      element &&
      element.$parent &&
      element.$parent.$type !== "bpmn:Process"
    ) {
      return getBO(element.$parent);
    } else {
      return element && element.$parent;
    }
  }

  function getProcessConfig(type) {
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
      criteria: [{ fieldName: "name", operator: "IN", value: [""] }],
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

    let value = [];
    if (type === "metaModel") {
      value = [...metaModels];
    } else if (type === "metaJsonModel") {
      value = [...metaJsonModels];
    } else {
      value = [...metaModels, ...metaJsonModels];
    }
    const data = {
      criteria: [
        {
          fieldName: "name",
          operator: "IN",
          value: value && value.length > 0 ? value : [""],
        },
      ],
      operator: "or",
    };
    return data;
  }

  const setProperty = React.useCallback(
    (name, value) => {
      setDummyProperty({ bpmnModeler, element, value });
      let bo = getBusinessObject(element);
      if ((element && element.type) === "bpmn:Participant") {
        bo = getBusinessObject(bo && bo.processRef);
      }
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

  const getProperty = React.useCallback(
    (name) => {
      let propertyName = `camunda:${name}`;
      let bo = getBusinessObject(element);
      if (is(element, "bpmn:Participant")) {
        bo = getBusinessObject(element).get("processRef");
      }
      return (bo && bo.$attrs && bo.$attrs[propertyName]) || "";
    },
    [element]
  );

  const getSelectValue = React.useCallback(
    (name, element) => {
      let label = getProperty(`${name}Label`, element);
      let fullName = getProperty(`${name}ModelName`);
      let newName = getProperty(name, element);
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

  const checkMenuActionTab = (value, name) => {
    if (!element) return;
    if (USER_TASKS_TYPES.includes(element.type)) {
      if (value) {
        handleMenuActionTab(false);
        return;
      }
      if (getProperty(name)) {
        handleMenuActionTab(false);
        return;
      }
      handleMenuActionTab(true);
    }
  };

  const getFormViews = React.useCallback(
    async (value, name) => {
      if (!value) return;
      const formViews = await getViews(
        name === "metaModel"
          ? { ...(value || {}), type: "metaModel" }
          : {
              ...(value || {}),
              type: "metaJsonModel",
            },
        []
      );
      setFormViews(formViews);
      if (formViews && (formViews.length === 1 || formViews.length === 0)) {
        setDefaultFormVisible(false);
        setProperty("defaultForm", formViews[0] && formViews[0]["name"]);
        return;
      }
      setDefaultFormVisible(true);
    },
    [setProperty]
  );

  const updateValue = (name, value, optionLabel = "name") => {
    if (!value) {
      setProperty(name, undefined);
      setProperty(`${name}ModelName`, undefined);
      setProperty("defaultForm", undefined);
      setDefaultForm(null);
      setDefaultFormVisible(false);
      return;
    }
    setProperty(name, value[optionLabel]);
    setProperty(`${name}ModelName`, value["fullName"] || value["name"]);
    getFormViews(value, name);
  };

  const updateSelectValue = (name, value, label, optionLabel = "name") => {
    updateValue(name, value, optionLabel);
    if (!value) {
      setProperty(`${name}Label`, undefined);
    }
    setProperty(`${name}Label`, label);
  };

  const addModels = (values) => {
    const displayOnModels = [],
      modelLabels = [];
    if (Array.isArray(values) || !values) {
      if (values?.length === 0 || !values) {
        setProperty("displayOnModels", undefined);
        setProperty(`displayOnModelLabels`, undefined);
        return;
      }
      values?.forEach((value) => {
        if (!value) {
          setProperty("displayOnModels", undefined);
          setProperty(`displayOnModelLabels`, undefined);
          return;
        }
        displayOnModels.push(value.name);
        modelLabels.push(value.title);
      });
    }
    if (displayOnModels.length > 0) {
      setProperty("displayOnModels", displayOnModels.toString());
      setProperty(`displayOnModelLabels`, modelLabels.toString());
    }
  };

  useEffect(() => {
    if (!isConditionalSource(element)) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [element]);

  useEffect(() => {
    if (!element) return;
    const createUserAction = getProperty("createUserAction");
    const emailNotification = getProperty("emailNotification");
    const newMenu = getProperty("newMenu");
    const newUserMenu = getProperty("newUserMenu");
    if (
      USER_TASKS_TYPES.includes(element.type) &&
      (getBool(createUserAction) ||
        getBool(emailNotification) ||
        getBool(newMenu) ||
        getBool(newUserMenu))
    ) {
      setModelsDisable(true);
    } else {
      setModelsDisable(false);
    }
  }, [getProperty, element]);

  useEffect(() => {
    const metaModel = getSelectValue("metaModel");
    const metaModelName = getSelectValue("metaModelModelName");
    const metaJsonModel = getSelectValue("metaJsonModel");
    const displayOnModels = getProperty("displayOnModels");
    const displayOnModelLabels = getProperty("displayOnModelLabels");
    const displayStatus = getProperty("displayStatus");
    const defaultForm = getSelectValue("defaultForm");
    const isCustom = getProperty("isCustom");
    setIsCustom(
      isCustom === undefined || isCustom === ""
        ? metaJsonModel
          ? true
          : false
        : getBool(isCustom)
    );
    setDisplayStatus(getBool(displayStatus));
    setMetaModel(metaModel);
    setMetaJsonModel(metaJsonModel);
    setDefaultForm(defaultForm);
    const model = metaModel ? "metaModel" : "metaJsonModel";
    const value = metaModel
      ? { ...(metaModel || {}), fullName: metaModelName && metaModelName.name }
      : { ...(metaJsonModel || {}) };
    getFormViews(value, model);
    const models = [];
    if (displayOnModels) {
      const names = displayOnModels.split(",");
      const labels = displayOnModelLabels && displayOnModelLabels.split(",");
      names &&
        names.forEach((name, i) => {
          models.push({
            name: name,
            title: labels && labels[i],
          });
        });
      setModels(models);
    } else {
      setModels([]);
    }
  }, [getProperty, getSelectValue, getFormViews]);

  useEffect(() => {
    const bo = getBusinessObject(element);
    const eventDefinitionType = bo.get("eventDefinitions")?.[0]?.$type;
    if (
      (typesWithMenuAction.includes(bo.$type) && !eventDefinitionType) ||
      EVENT_DEFINITIONS_TYPES[bo.$type]?.includes(eventDefinitionType)
    ) {
      setRenderActions(true);
    } else setRenderActions(false);
  }, [element]);
  return (
    <>
      {isVisible && (
        <div className={styles.root}>
          {(TITLE_SOURCES.includes(element?.type) ||
            subType === "bpmn:TerminateEventDefinition" ||
            GATEWAY.includes(element.type) ||
            (element?.type === "bpmn:EndEvent" && !subType)) && (
            <Title divider={index > 0} label={label} />
          )}
          {![
            "bpmn:Process",
            "bpmn:Participant",
            "bpmn:SendTask",
            ...GATEWAY,
            ...DATA_STORE_TYPES,
          ].includes(element && element.type) && (
            <React.Fragment>
              <InputLabel color="body" className={styles.label}>
                {translate("Model")}
              </InputLabel>
              {!isModelsDisable && (
                <Checkbox
                  className={styles.checkbox}
                  entry={{
                    id: `custom-model`,
                    modelProperty: "isCustom",
                    label: translate("Custom"),
                    get: function () {
                      return {
                        isCustom: isCustom,
                      };
                    },
                    set: function (e, values) {
                      const isCustom = !values.isCustom;
                      setIsCustom(isCustom);
                      setProperty("isCustom", isCustom);
                      setMetaJsonModel(undefined);
                      updateSelectValue("metaJsonModel", undefined);
                      setMetaModel(undefined);
                      updateSelectValue("metaModel", undefined);
                    },
                  }}
                  element={element}
                />
              )}
              {isCustom ? (
                <Select
                  className={classnames(styles.select, styles.metajsonModel)}
                  fetchMethod={() =>
                    getCustomModels(getProcessConfig("metaJsonModel"))
                  }
                  update={(value, label) => {
                    setMetaJsonModel(value);
                    updateSelectValue("metaJsonModel", value, label);
                    checkMenuActionTab(value, "metaModel");
                  }}
                  disabled={isModelsDisable}
                  name="metaJsonModel"
                  value={metaJsonModel}
                  placeholder={translate("Custom model")}
                  isLabel={false}
                  optionLabel="name"
                  optionLabelSecondary="title"
                />
              ) : (
                <Select
                  className={styles.select}
                  fetchMethod={() =>
                    getMetaModels(getProcessConfig("metaModel"))
                  }
                  update={(value, label) => {
                    setMetaModel(value);
                    updateSelectValue("metaModel", value, label);
                    checkMenuActionTab(value, "metaJsonModel");
                  }}
                  name="metaModel"
                  value={metaModel}
                  isLabel={false}
                  disabled={isModelsDisable}
                  placeholder={translate("Model")}
                  optionLabel="name"
                  optionLabelSecondary="title"
                />
              )}
              {isDefaultFormVisible && (
                <React.Fragment>
                  <InputLabel className={styles.label}>
                    {translate("Default form")}
                  </InputLabel>
                  <div
                    className={styles.studio}
                    style={{
                      alignItems: "flex-end",
                    }}
                  >
                    <Select
                      className={classnames(styles.select, styles.studioSelect)}
                      update={(value, label) => {
                        setDefaultForm(value);
                        setProperty(
                          "defaultForm",
                          value ? value.name : undefined
                        );
                        if (!value) {
                          setProperty(`defaultFormLabel`, undefined);
                        }
                        setProperty(`defaultFormLabel`, label);
                      }}
                      options={formViews}
                      name="defaultForm"
                      value={defaultForm}
                      label={translate("Default form")}
                      isLabel={false}
                      optionLabel="name"
                      optionLabelSecondary="title"
                    />
                  </div>
                </React.Fragment>
              )}
            </React.Fragment>
          )}
          <div className={styles.container}>
            {!DATA_STORE_TYPES.includes(element && element.type) && (
              <Checkbox
                element={element}
                entry={{
                  id: "displayStatus",
                  label: translate("Display status"),
                  modelProperty: "displayStatus",
                  get: function () {
                    return {
                      displayStatus: displayStatus,
                    };
                  },
                  set: function (e, value) {
                    const displayStatus = !value.displayStatus;
                    setDisplayStatus(displayStatus);
                    setProperty("displayStatus", displayStatus);
                    if (displayStatus === false) {
                      setModels([]);
                      addModels([]);
                    }
                  },
                }}
              />
            )}
            {displayStatus &&
              !DATA_STORE_TYPES.includes(element && element.type) && (
                <React.Fragment>
                  <div>
                    <InputLabel className={styles.label}>
                      {translate("Display on models")}
                    </InputLabel>
                    <Select
                      className={styles.select}
                      update={(value) => {
                        setModels(value);
                        addModels(value);
                      }}
                      fetchMethod={() => getAllModels(getProcessConfig())}
                      name="models"
                      value={models || []}
                      multiple={true}
                      optionLabel="name"
                      optionLabelSecondary="title"
                      handleRemove={(option) => {
                        const value = models?.filter(
                          (r) => r.name !== option.name
                        );
                        setModels(value);
                        addModels(value);
                      }}
                    />
                  </div>
                </React.Fragment>
              )}
          </div>
        </div>
      )}
      {HELP_TITLE_SOURCES.includes(element && element.type) && (
        <Title divider={index > 0} label={label} />
      )}

      {renderActions && (
        <Box
          style={{
            position: "relative",
            margin: "10px 0",
          }}
        >
          <h1 className={styles.title}>{translate("Field config")}</h1>
          <Box
            key={2}
            w={100}
            rounded={2}
            border
            bg="body-tertiary"
            color="body"
            style={{
              marginTop: 5,
              paddingTop: 35,
              marginBottom: 10,
              position: "relative",
            }}
          >
            <Box color="body">
              <Box overflow="auto">
                <Box rounded={2} bgColor="body" shadow color="body">
                  <Table size="sm" textAlign="center">
                    <TableHead>
                      <TableRow className={styles.tableRow}>
                        {FIELD_ACTIONS_HEADER.map((item) => (
                          <TableCell
                            key={item.id}
                            className={clsx(styles.tableHead, item.className)}
                          >
                            {translate(item.label)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {FIELD_ACTIONS.map((action) => (
                        <FieldAction
                          key={action.id}
                          initialType="field"
                          label={action.label}
                          title={action.title}
                          element={element}
                          getProperty={getProperty}
                          setProperty={setProperty}
                          metaModel={metaModel}
                          metaJsonModel={metaJsonModel}
                          fieldTypes={["field", "script"]}
                          isUserPath={action.isUserPath}
                          isDatePath={action.isDatePath}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
      <Textbox
        element={element}
        className={styles.textbox}
        rows={3}
        entry={{
          id: "help",
          label: translate("Help"),
          modelProperty: "help",
          get: function () {
            return {
              help: getProperty("help") || "",
            };
          },
          set: function (e, values) {
            if (element.businessObject) {
              setProperty(
                "help",
                values.help
                  ? values.help === ""
                    ? undefined
                    : values.help
                  : undefined
              );
            }
          },
        }}
      />
    </>
  );
}

export function FieldAction({
  initialType,
  label,
  title,
  element,
  getProperty,
  setProperty,
  metaModel,
  metaJsonModel,
  isUserPath,
  isDatePath,
  isUserAction = false,
  fetchMethod,
  fieldTypes = ["field", "script"],
}) {
  const [currentType, setCurrentType] = useState({
    title: translate("Field"),
    value: "field",
  });
  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [openBuilder, setOpenBuilder] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openScript, setOpenScript] = useState(false);
  const [dummyState, setDummyState] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  const [path, setPath] = useState(null);
  const [model, setModel] = useState(null);
  const [field, setField] = useState(null);
  const TYPES = [
    { value: "value", title: translate("Value") },
    { value: "field", title: translate("Field") },
    { value: "script", title: translate("Script") },
  ];

  const toPath = (text) => `${text}Path`;
  const toPathValue = (text) => `${text}PathValue`;
  const toType = (text) => `${text}Type`;
  const toTask = (text) => `task${text}`;
  const toLowerCase = (text) => text.toLowerCase();

  useEffect(() => {
    const selectedType = TYPES.find((type) => type.value === initialType);
    setCurrentType(selectedType);
  }, []);

  const getFields = useCallback(() => {
    const m = getMetaFields(model);
    return m;
  }, [model]);

  const getSelectValue = React.useCallback(
    (name, element) => {
      let label = getProperty(`${name}Label`, element);
      let fullName = getProperty(`${name}ModelName`);
      let newName = getProperty(name, element);
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
  }, [metaModel, metaJsonModel]);

  const clearPropertises = () => {
    setDummyState(null);
    setPath(null);
    setProperty(toPath(title), undefined);
    setProperty(toPathValue(title), undefined);
    setProperty(
      isUserAction ? toType(toLowerCase(label)) : toType(title),
      undefined
    );
    setProperty(toTask(label), undefined);
  };

  const updateScript = () => {
    if (!dummyState) {
      setPath(undefined);
      setProperty(toPath(title), undefined);
      setProperty(
        isUserAction ? toType(toLowerCase(label)) : toType(title),
        undefined
      );
      setProperty(toPathValue(title), undefined);
      return;
    }

    setPath(dummyState);
    setProperty(toPath(title), dummyState);
    setProperty(
      isUserAction ? toType(toLowerCase(label)) : toType(title),
      currentType.value
    );
    setProperty(toPathValue(title), undefined);
    setDummyState(null);
  };

  useEffect(() => {
    const fieldType = getProperty(
      isUserAction ? toType(toLowerCase(label)) : toType(title)
    );
    const fieldPath = getProperty(
      fieldType === "value" ? toTask(label) : toPath(title)
    );
    setPath(fieldPath);
    if (fieldType) {
      const matchedType = TYPES.find((item) => item.value === fieldType);
      setCurrentType(matchedType || {});
    }

    fieldPath && setReadOnly(true);
    setDummyState(fieldPath);
  }, [getProperty, getSelectValue, element]);

  const getterMethod = (field) => {
    const fieldPathValue = getProperty(toPathValue(field));
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

  return (
    <>
      <TableRow>
        <TableCell>
          <InputLabel className={styles.label}>{label}</InputLabel>
        </TableCell>
        <TableCell className={styles.tableCell}>
          <Select
            className={styles.select}
            value={currentType.title}
            type="text"
            options={TYPES.filter((type) => fieldTypes.includes(type.value))}
            update={(value, label) => {
              setCurrentType(value);
              clearPropertises();
            }}
            disableClearable="false"
            optionLabel={"title"}
            isLabel={false}
          />
        </TableCell>
        <TableCell>
          {currentType.value === "value" ? (
            <Select
              name={title}
              fetchMethod={fetchMethod}
              value={path}
              update={(value) => {
                setProperty(toTask(label), value?.name);
                setProperty(toType(toLowerCase(label)), currentType.value);
                setPath(value?.name);
              }}
              isLabel={false}
              optionLabel={"name"}
            />
          ) : (
            <TextField
              className={styles.textbox}
              element={element}
              type="text"
              readOnly={readOnly && getProperty(toPathValue(title))}
              placeholder={label}
              entry={{
                id: "fieldPath",
                name: "fieldPath",
                modelProperty: "fieldPath",
                get: function () {
                  return {
                    fieldPath: path,
                  };
                },
                set: function (e, value) {
                  if (!value.fieldPath) return;
                  setPath(value?.fieldPath);
                  setDummyState({
                    fieldPath: value?.fieldPath,
                  });
                  setProperty(toPath(title), value.fieldPath);
                  setProperty(
                    isUserAction ? toType(toLowerCase(label)) : toType(title),
                    value?.fieldPath !== "" && currentType.value
                  );
                },
              }}
              canRemove={true}
              clearPropertises={clearPropertises}
            />
          )}
        </TableCell>
        <TableCell className={styles.tableCell}>
          {currentType.value === "field" && (
            <MaterialIcon
              fontSize={16}
              icon="edit"
              className={styles.newIcon}
              onClick={() => {
                setOpenDialog(true);
              }}
            />
          )}
          {currentType.value === "script" && (
            <Box className={styles.iconGroup}>
              <Tooltip title="Script" aria-label="enable">
                <i
                  className="fa fa-code"
                  style={{ fontSize: 18, marginLeft: 5 }}
                  onClick={() => {
                    if (readOnly && getProperty(toPathValue(title))) {
                      setAlertMessage(
                        `${label} field can't be managed using builder once changed manually.`
                      );
                      setOpenAlertDialog(true);
                    } else {
                      setDummyState(getProperty(toPath(title)));
                      setOpenScript(true);
                    }
                  }}
                ></i>
              </Tooltip>
              <MaterialIcon
                fontSize={18}
                icon="edit"
                className={styles.newIcon}
                onClick={() => {
                  setOpenBuilder(true);
                }}
              />
            </Box>
          )}
        </TableCell>
      </TableRow>

      <AlertDialog
        openAlert={openAlertDialog}
        message={alertMessage}
        title="Error"
        handleAlertOk={() => {
          if (currentType.value === "script") {
            setDummyState(getProperty(toPath(title)));
            setOpenScript(true);
          }

          setReadOnly(false);
          setOpenAlertDialog(false);
        }}
        alertClose={() => setOpenAlertDialog(false)}
      />
      <AlertDialog
        openAlert={openDialog}
        title={`${label} field path`}
        fullscreen={false}
        children={
          <div className={styles.dialogContent}>
            <FieldEditor
              getMetaFields={getFields}
              onChange={(val, field) => {
                setDummyState(val);
                setField(field);
              }}
              value={{ fieldName: dummyState || "" }}
              isParent={true}
              isUserPath={isUserPath}
              isDatePath={isDatePath}
            />
          </div>
        }
        handleAlertOk={() => {
          const alerts = {
            userField: {
              condition: field?.target !== "com.axelor.auth.db.User",
              message: "Last sub field must be user field",
            },
            deadlineField: {
              condition:
                field?.type &&
                !["datetime", "date"].includes(field.type.toLowerCase()),
              message: "Field should be date field",
            },
            teamField: {
              condition: field?.target !== "com.axelor.team.db.Team",
              message: "Last subfield should be related to team",
            },
            roleField: {
              condition: field?.target !== "com.axelor.auth.db.Role",
              message: "Last sub field must be role field",
            },
          };

          const alert = alerts[title];

          if (alert?.condition) {
            setAlertMessage(alert.message);
            setOpenAlertDialog(true);
            return;
          }
          setProperty(toPath(title), dummyState);
          setProperty(
            isUserAction ? toType(toLowerCase(label)) : toType(title),
            currentType.value
          );
          setPath(dummyState);
          setReadOnly(true);
          setOpenDialog(false);
        }}
        alertClose={() => {
          setOpenDialog(false);
        }}
      />

      <QueryBuilder
        open={openBuilder}
        close={() => setOpenBuilder(false)}
        type="bpmQuery"
        isCreateObject={false}
        title="Add query"
        setProperty={(val) => {
          const { expression, value, combinator, checked } = val;
          if (val) {
            setPath(expression);
            const pathValue = JSON.stringify({
              scriptOperatorType: combinator,
              checked,
              value: (value || "")?.replace(
                /[\u200B-\u200D\uFEFF]/g,
                undefined
              ),
            });
            setDummyState(expression);
            setProperty(toPath(title), expression);
            setProperty(toPathValue(title), pathValue);
            setProperty(
              isUserAction ? toType(toLowerCase(label)) : toType(title),
              currentType.value
            );
            setReadOnly(true);
          }
        }}
        getExpression={() => getterMethod(title)}
        fetchModels={() => fetchModels(element)}
      />
      <AlertDialog
        className={styles.scriptDialog}
        openAlert={openScript}
        alertClose={() => {
          setOpenScript(false);
          setDummyState(null);
        }}
        handleAlertOk={() => {
          updateScript();
          setOpenScript(false);
        }}
        title={translate("Add script")}
        children={
          <Box color="body" className={styles.new}>
            <Textbox
              element={element}
              className={styles.textbox}
              readOnly={readOnly && getProperty(toPathValue(title))}
              showLabel={false}
              defaultHeight={window?.innerHeight - 205}
              entry={{
                id: "script",
                label: translate("Script"),
                modelProperty: "script",
                get: function () {
                  return {
                    script: dummyState,
                  };
                },
                set: function (e, values) {
                  const updatedValue = values?.script;
                  setDummyState(updatedValue);
                },
              }}
              suggestion={true}
            />
          </Box>
        }
      />
    </>
  );
}
