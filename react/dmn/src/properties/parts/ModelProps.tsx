import React, { useEffect, useState } from "react";
import { is, getBusinessObject } from "dmn-js-shared/lib/util/ModelUtil";
import { Select, Title } from "@studio/shared/components";
import {
  getCustomModelsFromModelService as getCustomModels,
  getMetaModelsFromModelService as getMetaModels,
} from "@studio/shared/services";
import { translate } from "@studio/shared/i18n";
import { splitWithComma, mergeModels } from "@studio/shared/utils";
import { Box, InputLabel } from "@axelor/ui";
import type { DmnElement, ModelOption } from "../types";

import styles from "./model-props.module.css";


interface ModelPropsProps {
  element: DmnElement;
  label: string;
}

export default function ModelProps({ element, label }: ModelPropsProps) {
  const [isVisible, setVisible] = useState(false);
  const [model, setModel] = useState<ModelOption[] | null>(null);

  const setProperty = React.useCallback(
    (name: string, value: string | undefined) => {
      let bo = getBusinessObject(element);
      if ((element && element.type) === "bpmn:Participant") {
        bo = getBusinessObject(bo.processRef);
      }
      const propertyName = `camunda:${name}`;
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
    [element],
  );

  const updateValue = (name: string, value: ModelOption[] | null, optionLabel = "name") => {
    if (!value || !value?.length) {
      setProperty(`${name}s`, undefined);
      setProperty(`${name}ModelNames`, undefined);
      return;
    }
    const names = value.map((v) => (v as Record<string, unknown>)[optionLabel]).join(",");
    const fullNames = value.map((v) => v.fullName || v.name).join(",");
    setProperty(`${name}s`, names);
    setProperty(`${name}ModelNames`, fullNames);
  };

  const updateSelectValue = (name: string, value: ModelOption[] | null, label: string | null, optionLabel = "name") => {
    updateValue(name, value, optionLabel);
    if (!value || !value?.length) {
      setProperty(`${name}Labels`, undefined);
      return;
    }
    setProperty(`${name}Labels`, label ?? undefined);
  };

  const getProperty = React.useCallback(
    (name: string): string => {
      const propertyName = `camunda:${name}`;
      const bo = getBusinessObject(element);
      return ((bo && bo.$attrs && bo.$attrs[propertyName]) as string) || "";
    },
    [element],
  );

  const getSelectValue = React.useCallback(
    (name: string): ModelOption[] | null => {
      const labels = splitWithComma(getProperty(`${name}Labels`)) ?? [];
      const names = splitWithComma(getProperty(`${name}s`)) ?? [];
      const fullNames = name === "metaModel" ? (splitWithComma(getProperty(`${name}ModelNames`)) ?? []) : [];
      if (!names.length && !labels.length) return null;
      const models: ModelOption[] = [];
      for (let i = 0; i < names.length; i++) {
        const model: ModelOption = {
          name: names[i],
          title: labels[i] ?? names[i],
        };
        if (name === "metaModel") {
          model.fullName = fullNames[i];
        }
        models.push(model);
      }
      return models;
    },
    [getProperty],
  );

  async function getAllModels(criteria: Record<string, unknown> = {}) {
    const metaModels = await getMetaModels(criteria);
    const metaJsonModels = await getCustomModels(criteria);
    return [...metaModels, ...metaJsonModels];
  }

  const updateXML = (name: string, value: ModelOption[]) => {
    const models = value.filter((v) =>
      name === "metaModel" ? Object.hasOwn(v, "fullName") : !Object.hasOwn(v, "fullName"),
    );
    const modelLabels = models.map((i) => i.title || "").join(",");
    updateSelectValue(name, models, modelLabels);
  };

  const handleSelectionChange = (value: ModelOption[] | null) => {
    if (value) {
      setModel(value);
      updateXML("metaModel", value);
      updateXML("metaJsonModel", value);
    } else {
      updateSelectValue("metaModel", null, null);
      updateSelectValue("metaJsonModel", null, null);
      setModel(null);
    }
  };

  useEffect(() => {
    if (is(element, "dmn:Definitions")) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [element]);

  useEffect(() => {
    const metaModel = getSelectValue("metaModel");
    const metaJsonModel = getSelectValue("metaJsonModel");
    const allModels = mergeModels(metaModel, metaJsonModel) as ModelOption[] | null;

    setModel(allModels);
  }, [getSelectValue, getProperty]);

  return (
    isVisible && (
      <Box d="flex" flexDirection="column">
        <Title divider={true} label={label} />
        <InputLabel color="body" className={styles.label}>
          {translate("Models")}
        </InputLabel>
        <Select
          className={styles.select}
          fetchMethod={(options) => getAllModels(options)}
          update={(value) => {
            handleSelectionChange(value);
          }}
          name="models"
          value={model || []}
          multiple={true}
          type="multiple"
          placeholder={translate("Models")}
          optionLabel="name"
          customOptionLabel={(option: ModelOption) => {
            const optionName = `${option.name}${
              !option.fullName ? `(${translate("Custom Model")})` : ""
            }`;
            return translate(optionName);
          }}
          customOptionEqual={(option: ModelOption, val: ModelOption, optionName: string) => {
            if (!val) return false;
            if ((option as Record<string, unknown>)[optionName] === (val as Record<string, unknown>)[optionName]) {
              return option.fullName === val.fullName;
            }
            return false;
          }}
          customOnChange={(value: ModelOption[]) => {
            handleSelectionChange(value);
            return;
          }}
          handleRemove={(option: ModelOption) => {
            const value = (model || []).filter(
              (item) => item.name !== option.name || item.fullName !== option.fullName,
            );
            handleSelectionChange(value);
          }}
        />
      </Box>
    )
  );
}
