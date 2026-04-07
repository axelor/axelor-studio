import React, { useEffect, useState } from "react";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { translate } from "@studio/shared/i18n";

import { Textbox } from "../../../../../../components/properties/components";
import { getViews } from "../../../../../../shared/services";
import { getBool } from "../../../../../../utils";
import { USER_TASKS_TYPES } from "../../../../constants";
import CollapsePanel from "../../components/CollapsePanel";

import styles from "./model-props.module.css";
import FieldConfigTable from "./FieldConfigTable";
import ModelSection from "../components/ModelSection";
import {
  HELP_TITLE_SOURCES,
  typesWithMenuAction,
  EVENT_DEFINITIONS_TYPES,
  isConditionalSource,
} from "./constants";
import { getModelProcessConfig } from "./utils";

export default function ModelProps(props: any) {
  const { element, _index, label, handleMenuActionTab, bpmnModeler } = props;
  const [isVisible, setVisible] = useState(false);
  const [metaModel, setMetaModel] = useState<any>(null);
  const [metaJsonModel, setMetaJsonModel] = useState<any>(null);
  const [models, setModels] = useState<any[]>([]);
  const [displayStatus, setDisplayStatus] = useState(true);
  const [defaultForm, setDefaultForm] = useState<any>(null);
  const [formViews, setFormViews] = useState<any>(null);
  const [isDefaultFormVisible, setDefaultFormVisible] = useState(false);
  const [isModelsDisable, setModelsDisable] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [renderActions, setRenderActions] = useState(false);

  const getProcessConfig = (type: any) => getModelProcessConfig(element, type);

  const setProperty = React.useCallback(
    (name: any, value: any) => {
      let bo = getBusinessObject(element);
      if ((element && element.type) === "bpmn:Participant") {
        bo = getBusinessObject(bo && bo.processRef);
      }
      const propertyName = `camunda:${name}`;
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
    [element, bpmnModeler],
  );

  const getProperty = React.useCallback(
    (name: string) => {
      const propertyName = `camunda:${name}`;
      let bo = getBusinessObject(element);
      if (is(element, "bpmn:Participant")) {
        bo = getBusinessObject(element).get("processRef");
      }
      return (bo && bo.$attrs && bo.$attrs[propertyName]) || "";
    },
    [element],
  );

  const getSelectValue = React.useCallback(
    (name: any, _element?: any) => {
      const label = getProperty(`${name}Label`);
      const fullName = getProperty(`${name}ModelName`);
      const newName = getProperty(name);
      if (newName) {
        const value = { name: newName };
        if (label) {
          // @ts-expect-error -- safety: bpmn-js dynamic moddle property not in typed interface
          value.title = label;
        }
        if (fullName) {
          // @ts-expect-error -- safety: bpmn-js dynamic moddle property not in typed interface
          value.fullName = fullName;
        }
        return value;
      } else {
        return null;
      }
    },
    [getProperty],
  );

  const checkMenuActionTab = (value: any, name: any) => {
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
    async (value: any, name: any) => {
      if (!value) return;
      const formViews = await getViews(
        name === "metaModel"
          ? { ...(value || {}), type: "metaModel" }
          : { ...(value || {}), type: "metaJsonModel" },
        [],
      );
      setFormViews(formViews);
      if (formViews && (formViews.length === 1 || formViews.length === 0)) {
        setDefaultFormVisible(false);
        setProperty("defaultForm", formViews[0] && formViews[0]["name"]);
        return;
      }
      setDefaultFormVisible(true);
    },
    [setProperty],
  );

  const updateValue = (name: any, value: any, optionLabel = "name") => {
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

  const updateSelectValue = (name: any, value: any, label: any, optionLabel = "name") => {
    updateValue(name, value, optionLabel);
    if (!value) {
      setProperty(`${name}Label`, undefined);
    }
    setProperty(`${name}Label`, label);
  };

  const addModels = (values: any) => {
    const displayOnModels: any[] = [],
      modelLabels: any[] = [];
    if (Array.isArray(values) || !values) {
      if (values?.length === 0 || !values) {
        setProperty("displayOnModels", undefined);
        setProperty(`displayOnModelLabels`, undefined);
        return;
      }
      values?.forEach((value: any) => {
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
        : getBool(isCustom),
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
    const models: any[] = [];
    if (displayOnModels) {
      const names = displayOnModels.split(",");
      const labels = displayOnModelLabels && displayOnModelLabels.split(",");
      names &&
        names.forEach((name: any, i: any) => {
          models.push({ name: name, title: labels && labels[i] });
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
      (EVENT_DEFINITIONS_TYPES as Record<string, string[]>)[bo.$type as string]?.includes(eventDefinitionType)
    ) {
      setRenderActions(true);
    } else setRenderActions(false);
  }, [element]);

  return (
    <>
      {isVisible && (
        <ModelSection
          element={element}
          layout="collapse-panel"
          isModelsDisable={isModelsDisable}
          isCustom={isCustom}
          setIsCustom={setIsCustom}
          metaModel={metaModel}
          setMetaModel={setMetaModel}
          metaJsonModel={metaJsonModel}
          setMetaJsonModel={setMetaJsonModel}
          isDefaultFormVisible={isDefaultFormVisible}
          defaultForm={defaultForm}
          setDefaultForm={setDefaultForm}
          formViews={formViews}
          displayStatus={displayStatus}
          setDisplayStatus={setDisplayStatus}
          models={models}
          setModels={setModels}
          setProperty={setProperty}
          updateSelectValue={updateSelectValue}
          checkMenuActionTab={checkMenuActionTab}
          getProcessConfig={getProcessConfig}
          addModels={addModels}
        />
      )}

      {renderActions && (
        <FieldConfigTable
          element={element}
          getProperty={getProperty}
          setProperty={setProperty}
          metaModel={metaModel}
          metaJsonModel={metaJsonModel}
        />
      )}

      <CollapsePanel label={HELP_TITLE_SOURCES.includes(element && element.type) && label}>
        <Textbox
          element={element}
          className={styles.textbox}
          rows={3}
          entry={{
            id: "help",
            label: translate("Help"),
            modelProperty: "help",
            get: function () {
              return { help: getProperty("help") || "" };
            },
            set: function (e: any, values: any) {
              if (getBusinessObject(element)) {
                setProperty(
                  "help",
                  values.help ? (values.help === "" ? undefined : values.help) : undefined,
                );
              }
            },
          }}
        />
      </CollapsePanel>
    </>
  );
}
