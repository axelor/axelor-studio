import React, { useEffect, useState } from "react";
import classnames from "classnames";
import { makeStyles } from "@material-ui/core/styles";
import { is, getBusinessObject } from "dmn-js-shared/lib/util/ModelUtil";

import { Checkbox } from "../../../components/properties/components";
import Select from "../../../components/Select";
import { getCustomModels, getMetaModels } from "../../../services/api";
import { translate, getBool, splitWithComma } from "../../../utils";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
  },
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
  divider: {
    marginTop: 15,
    borderTop: "1px dotted #ccc",
  },
  label: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    margin: "3px 0px",
  },
  select: {
    margin: 0,
  },
  metajsonModel: {
    marginTop: 10,
  },
});

export default function ModelProps({ element, label }) {
  const [isVisible, setVisible] = useState(false);
  const [metaModel, setMetaModel] = useState(null);
  const [metaJsonModel, setMetaJsonModel] = useState(null);
  const [isCustom, setIsCustom] = useState(false);
  const classes = useStyles();

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
        name === "metaModel" && splitWithComma(getProperty(`${name}ModelNames`));
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
      <div className={classes.root}>
        <div className={classes.divider} />
        <div className={classes.groupLabel}>{label}</div>
        <label className={classes.label}>{translate("Model")}</label>
        <Checkbox
          className={classes.checkbox}
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
            className={classnames(classes.select, classes.metajsonModel)}
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
            isLabel={false}
            optionLabel="name"
            optionLabelSecondary="title"
          />
        ) : (
          <Select
            className={classes.select}
            fetchMethod={(options) => getMetaModels(options)}
            update={(value, label) => {
              setMetaModel(value);
              updateSelectValue("metaModel", value, label);
            }}
            name="metaModel"
            value={metaModel || []}
            multiple={true}
            type="multiple"
            isLabel={false}
            placeholder={translate("Model")}
            optionLabel="name"
            optionLabelSecondary="title"
          />
        )}
      </div>
    )
  );
}
