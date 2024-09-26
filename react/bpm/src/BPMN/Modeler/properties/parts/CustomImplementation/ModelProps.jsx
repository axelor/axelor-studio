import React, { useEffect, useState } from "react";
import classnames from "classnames";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";

import Select from "../../../../../components/Select";
import {
  Checkbox,
  Textbox,
} from "../../../../../components/properties/components";
import {
  getCustomModels,
  getMetaModels,
  getAllModels,
  getViews,
} from "../../../../../services/api";
import { translate, getBool } from "../../../../../utils";
import { USER_TASKS_TYPES, DATA_STORE_TYPES } from "../../../constants";

import { InputLabel } from "@axelor/ui";
import Title from "../../../Title";
import styles from "./model-props.module.css";
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

  const subType =
    element?.businessObject &&
    element.businessObject.eventDefinitions &&
    element.businessObject.eventDefinitions[0] &&
    element.businessObject.eventDefinitions[0].$type;

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
      if (value === undefined || value === null) {
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
      let newName = getProperty(name, element);
      if (newName) {
        let value = { name: newName };
        if (label) {
          value.title = label;
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
