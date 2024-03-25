import React, { useEffect, useState } from "react";
import classnames from "classnames";
import { is, getBusinessObject } from "dmn-js-shared/lib/util/ModelUtil";

import { Checkbox } from "../../../components/properties/components";
import Select from "../../../components/Select";
import { getCustomModels, getMetaModels } from "../../../services/api";
import { translate, getBool, splitWithComma } from "../../../utils";

import { Box, Divider, InputLabel } from "@axelor/ui";
import styles from "./ModelProps.module.css";

export default function ModelProps({ element, label }) {
  const [isVisible, setVisible] = useState(false);
  const [metaModel, setMetaModel] = useState(null);
  const [metaJsonModel, setMetaJsonModel] = useState(null);
  const [isCustom, setIsCustom] = useState(false);

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
        models.push({
          name: names[i],
          title: labels[i],
          fullName: name === "metaModel" && fullNames[i],
        });
      }
      return models;
    },
    [getProperty]
  );

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
    const isCustom = getProperty("isCustom");
    setIsCustom(
      isCustom === undefined || isCustom === ""
        ? metaJsonModel
          ? true
          : false
        : getBool(isCustom)
    );
    setMetaModel(metaModel);
    setMetaJsonModel(metaJsonModel);
  }, [getSelectValue, getProperty]);

  return (
    isVisible && (
      <Box d="flex" flexDirection="column">
        <Divider className={styles.divider} />
        <Box color="body" className={styles.groupLabel}>
          {translate(label)}
        </Box>
        <InputLabel color="body" className={styles.label}>
          {translate("Model")}
        </InputLabel>
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
        {isCustom ? (
          <Select
            className={classnames(styles.select, styles.metajsonModel)}
            fetchMethod={(options) => getCustomModels(options)}
            update={(value, label) => {
              setMetaJsonModel(value);
              updateSelectValue("metaJsonModel", value, label);
            }}
            name="metaJsonModel"
            value={metaJsonModel || []}
            multiple={true}
            type="multiple"
            placeholder={translate("Custom model")}
            optionLabel="name"
            optionLabelSecondary="title"
            handleRemove={(option) => {
              let value = metaJsonModel?.filter((r) => r.name !== option.name);
              let label = value?.map((v) => v["title"]).join(",");
              setMetaJsonModel(value);
              updateSelectValue("metaJsonModel", value, label);
            }}
          />
        ) : (
          <Select
            className={styles.select}
            fetchMethod={(options) => getMetaModels(options)}
            update={(value, label) => {
              setMetaModel(value);
              updateSelectValue("metaModel", value, label);
            }}
            name="metaModel"
            value={metaModel || []}
            multiple={true}
            type="multiple"
            placeholder={translate("Model")}
            optionLabel="name"
            optionLabelSecondary="title"
            handleRemove={(option) => {
              let value = metaModel?.filter((r) => r.name !== option.name);
              let label = value?.map((v) => v["title"]).join(",");
              setMetaModel(value);
              updateSelectValue("metaModel", value, label);
            }}
          />
        )}
      </Box>
    )
  );
}
