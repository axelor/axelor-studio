import React from "react";
import classnames from "classnames";
import { translate } from "@studio/shared/i18n";
import { InputLabel } from "@axelor/ui";

import Select from "../../../../../../components/Select";
import { Checkbox } from "../../../../../../components/properties/components";
import { getAllModels, getCustomModels, getMetaModels } from "../../../../../../shared/services";
import { DATA_STORE_TYPES } from "../../../../constants";
import CollapsePanel from "../../components/CollapsePanel";
import type { PropertiesPanelComponentProps } from "../../../property-types";

import styles from "./model-section.module.css";

const GATEWAY = ["bpmn:EventBasedGateway"];

interface ModelSectionProps extends PropertiesPanelComponentProps {
  layout: "collapse-panel" | "flat";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isModelsDisable?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isCustom?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setIsCustom?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metaModel?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setMetaModel?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metaJsonModel?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setMetaJsonModel?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isDefaultFormVisible?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultForm?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setDefaultForm?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formViews?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  displayStatus?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setDisplayStatus?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  models?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setModels?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setProperty?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateSelectValue?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  checkMenuActionTab?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getProcessConfig?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addModels?: any;
}

export default function ModelSection({
  element,
  layout,
  isModelsDisable,
  isCustom,
  setIsCustom,
  metaModel,
  setMetaModel,
  metaJsonModel,
  setMetaJsonModel,
  isDefaultFormVisible,
  defaultForm,
  setDefaultForm,
  formViews,
  displayStatus,
  setDisplayStatus,
  models,
  setModels,
  setProperty,
  updateSelectValue,
  checkMenuActionTab,
  getProcessConfig,
  addModels,
}: ModelSectionProps) {
  const modelFields = (
    <>
      {isCustom ? (
        <Select
          className={classnames(styles.select)}
          fetchMethod={() => getCustomModels(getProcessConfig("metaJsonModel"))}
          update={(value: any, label: any) => {
            setMetaJsonModel(value);
            updateSelectValue("metaJsonModel", value, label);
            if (layout === "collapse-panel") {
              checkMenuActionTab?.(value, "metaModel");
            }
          }}
          disabled={layout === "collapse-panel" ? isModelsDisable : undefined}
          name="metaJsonModel"
          value={metaJsonModel}
          placeholder={translate("Custom model")}
          isLabel={false}
          optionLabel="name"
        />
      ) : (
        <Select
          className={styles.select}
          fetchMethod={() => getMetaModels(getProcessConfig("metaModel"))}
          update={(value: any, label: any) => {
            setMetaModel(value);
            updateSelectValue("metaModel", value, label);
            if (layout === "collapse-panel") {
              checkMenuActionTab?.(value, "metaJsonModel");
            }
          }}
          name="metaModel"
          value={metaModel}
          isLabel={false}
          disabled={layout === "collapse-panel" ? isModelsDisable : undefined}
          placeholder={translate("Model")}
          optionLabel="name"
        />
      )}
    </>
  );

  const defaultFormSection = isDefaultFormVisible && (
    <React.Fragment>
      <InputLabel className={styles.label}>{translate("Default form")}</InputLabel>
      <Select
        className={styles.select}
        update={(value: any, label: any) => {
          setDefaultForm(value);
          setProperty("defaultForm", value ? value.name : undefined);
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
        optionLabel={layout === "collapse-panel" ? "name" : "title"}
        optionLabelSecondary={layout === "collapse-panel" ? "title" : "name"}
      />
    </React.Fragment>
  );

  const displayStatusSection = (
    <div className={styles.container}>
      {(layout === "flat" || !DATA_STORE_TYPES.includes(String(element?.type ?? ""))) && (
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
            set: function (e: any, value: any) {
              const status = !value.displayStatus;
              setDisplayStatus(status);
              setProperty("displayStatus", status);
              if (status === false) {
                setModels([]);
                addModels([]);
              }
            },
          }}
        />
      )}
      {displayStatus &&
        (layout === "flat" || !DATA_STORE_TYPES.includes(String(element?.type ?? ""))) && (
          <React.Fragment>
            <div className={layout === "flat" ? styles.allModels : undefined}>
              <InputLabel className={styles.label}>{translate("Display on models")}</InputLabel>
              <Select
                className={styles.select}
                update={(value: any) => {
                  setModels(value);
                  addModels(value);
                }}
                fetchMethod={() => getAllModels(getProcessConfig())}
                name="models"
                value={models || []}
                multiple={true}
                optionLabel="name"
                handleRemove={(option: any) => {
                  const value = models?.filter((r: any) => r.name !== option.name);
                  setModels(value);
                  addModels(value);
                }}
              />
            </div>
          </React.Fragment>
        )}
    </div>
  );

  if (layout === "collapse-panel") {
    return (
      <div className={styles.root}>
        <CollapsePanel label={translate("Model")}>
          {![
            "bpmn:Process",
            "bpmn:Participant",
            "bpmn:SendTask",
            ...GATEWAY,
            ...DATA_STORE_TYPES,
          ].includes(String(element?.type ?? "")) && (
            <>
              {!isModelsDisable && (
                <Checkbox
                  className={styles.select}
                  entry={{
                    id: `custom-model`,
                    modelProperty: "isCustom",
                    label: translate("Custom"),
                    get: function () {
                      return {
                        isCustom: isCustom,
                      };
                    },
                    set: function (e: any, values: any) {
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
              {modelFields}
              {defaultFormSection}
            </>
          )}
          {displayStatusSection}
        </CollapsePanel>
      </div>
    );
  }

  // layout === "flat"
  return (
    <React.Fragment>
      <InputLabel color="body" className={styles.label}>
        {translate("Model")}
      </InputLabel>
      <Checkbox
        entry={{
          id: `custom-model`,
          modelProperty: "isCustom",
          label: translate("Custom"),
          get: function () {
            return {
              isCustom: isCustom,
            };
          },
          set: function (e: any, values: any) {
            const custom = !values.isCustom;
            setIsCustom(custom);
            setProperty("isCustom", custom);
            setMetaJsonModel(undefined);
            updateSelectValue("metaJsonModel", undefined);
            setMetaModel(undefined);
            updateSelectValue("metaModel", undefined);
          },
        }}
        element={element}
      />
      {modelFields}
      {defaultFormSection}
      {displayStatusSection}
    </React.Fragment>
  );
}
