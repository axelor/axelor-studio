import React, { useEffect, useState } from "react";
import { is, getBusinessObject } from "dmn-js-shared/lib/util/ModelUtil";

import Select from "../../../components/Select";
import { getCustomModels, getMetaModels } from "../../../services/api";
import { translate, splitWithComma, mergeModels } from "../../../utils";

import { Box, InputLabel } from "@axelor/ui";
import Title from "../../Title";
import styles from "./model-props.module.css";

export default function ModelProps({ element, label }) {
  const [isVisible, setVisible] = useState(false);
  const [model, setModel] = useState(null);

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

  const updateValue = (name, value, optionLabel = "name") => {
    if (!value || !value?.length) {
      setProperty(`${name}s`, undefined);
      setProperty(`${name}ModelNames`, undefined);
      return;
    }
    const names = value.map((v) => v[optionLabel]).join(",");
    const fullNames = value.map((v) => v["fullName"] || v["name"]).join(",");
    setProperty(`${name}s`, names);
    setProperty(`${name}ModelNames`, fullNames);
  };

  const updateSelectValue = (name, value, label, optionLabel = "name") => {
    updateValue(name, value, optionLabel);
    if (!value || !value?.length) {
      setProperty(`${name}Labels`, undefined);
      return;
    }
    setProperty(`${name}Labels`, label);
  };

  const getProperty = React.useCallback(
    (name) => {
      let propertyName = `camunda:${name}`;
      let bo = getBusinessObject(element);
      return (bo && bo.$attrs && bo.$attrs[propertyName]) || "";
    },
    [element]
  );

  const getSelectValue = React.useCallback(
    (name) => {
      const labels = splitWithComma(getProperty(`${name}Labels`));
      const names = splitWithComma(getProperty(`${name}s`));
      const fullNames =
        name === "metaModel" &&
        splitWithComma(getProperty(`${name}ModelNames`));
      if (!names?.length && !labels?.length) return null;
      const models = [];
      for (let i = 0; i < names.length; i++) {
        let model = {
          name: names[i],
          title: labels[i],
        };
        if (name === "metaModel") {
          model.fullName = fullNames[i];
        }
        models.push(model);
      }
      return models;
    },
    [getProperty]
  );

  async function getAllModels(criteria = {}) {
    const metaModels = await getMetaModels(criteria);
    const metaJsonModels = await getCustomModels(criteria);
    return [...metaModels, ...metaJsonModels];
  }

  const updateXML = (name, value) => {
    const models = value.filter((v) =>
      name === "metaModel"
        ? v.hasOwnProperty("fullName")
        : !v.hasOwnProperty("fullName")
    );
    const modelLabels = models.map((i) => i["title"]).join(",");
    updateSelectValue(name, models, modelLabels);
  };

  const handleSelectionChange = (value) => {
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
    let allModels = mergeModels(metaModel, metaJsonModel);

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
          optionLabelSecondary="title"
          customOptionLabel={(option) => {
            let optionName = `${option["name"]} (${option["title"]}) ${
              !option.fullName ? `(${translate("Custom Model")})` : ""
            }`;
            return translate(optionName);
          }}
          customOptionEqual={(option, val, optionName) => {
            if (!val) return;
            if (option[optionName] === val[optionName]) {
              return option.fullName === val.fullName;
            }
          }}
          customOnChange={(value) => {
            const optionLabels = value
              ?.map((v) => v["name"] || v["title"])
              .join(",");
            handleSelectionChange(value, optionLabels);
            return;
          }}
          handleRemove={(option) => {
            const value = model.filter(
              (item) =>
                item.name !== option.name || item.fullName !== option.fullName
            );
            handleSelectionChange(value);
          }}
        />
      </Box>
    )
  );
}
