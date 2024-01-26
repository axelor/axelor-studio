import React, { useEffect, useState } from "react";
import classnames from "classnames";
import { IconButton } from "@material-ui/core";

import { translate } from "../../../utils";
import { Selection } from "../../expression-builder/components";
import { getSubMetaField } from "../../../services/api";
import { UI_TYPES } from "../../../DMN/constants";
import Tooltip from "../../Tooltip";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import styles from "./field-editor.module.css";

export default function FieldEditor({
  initValue = "",
  getMetaFields,
  onChange,
  value,
  classNames,
  isParent = false,
  isUserPath = false,
  startModel,
  isCollection = false,
  allowAllFields = false,
  excludeUITypes = false,
  isDatePath = false,
  fieldType,
}) {
  const { fieldName = "", allFields } = value || {};
  const [fields, setFields] = useState([]);
  const [isShow, setShow] = useState(true);
  const [isButton, setButton] = useState(true);
  const [allFieldValues, setAllFieldValues] = useState(null);

  let values = null;
  if (typeof fieldName === "object") {
    values = fieldName[fieldType]?.split(".");
  } else if (typeof fieldName === "string") {
    values = fieldName.split(".");
  }

  const [startValue] = values || [];
  const hasManyValues =
    fieldName &&
    isParent &&
    fields &&
    fields.some((x) => x.name === startValue);
  const relationModel =
    hasManyValues && (fields.find((x) => x.name === startValue) || {}).target;
  const relationJsonModel =
    hasManyValues &&
    (fields.find((x) => x.name === startValue) || {}).jsonTarget;

  function handleChange(value) {
    const isRelationalField =
      value && fields.some((x) => x.name === value.name && x.target);
    let newFieldName = isParent
      ? `${initValue}${value ? value.name : ""}`
      : value
      ? value.name
      : ""
      ? `${isRelationalField ? "." : ""}${initValue}${value ? value.name : ""}`
      : "";
    newFieldName =
      value && value.name ? newFieldName : newFieldName.slice(0, -1);

    const relationalField =
      allFieldValues &&
      [...(allFieldValues || []), value].reverse().find((x) => x && x.target);
    onChange(
      newFieldName === "" ? undefined : newFieldName,
      value,
      relationalField
    );
  }
  const transformValue = fields && fields.find((f) => f.name === startValue);

  useEffect(() => {
    let isSubscribed = true;
    (async () => {
      const data = await getMetaFields();
      if (isSubscribed) {
        setFields(
          data &&
            data.filter((d) =>
              excludeUITypes
                ? !UI_TYPES.includes(d.type && d.type.toLowerCase())
                : isCollection
                ? ["many_to_one", "one_to_many", "many_to_many"].includes(
                    d.type.toLowerCase()
                  )
                : allowAllFields
                ? isDatePath
                  ? ["date", "datetime"].includes(d.type.toLowerCase())
                  : d
                : ["many_to_one", "many-to-one"].includes(d.type.toLowerCase())
            )
        );
      }
    })();
    return () => {
      isSubscribed = false;
    };
  }, [getMetaFields, isCollection, allowAllFields, excludeUITypes, isDatePath]);

  useEffect(() => {
    let values = null;
    if (typeof fieldName === "object") {
      values = fieldName[fieldType]?.split(".");
    } else if (typeof fieldName === "string") {
      values = fieldName.split(".");
    }

    const transformValue =
      fields && fields.find((f) => f.name === (values && values[0]));

    const lastValue =
      values && values.length > 0 ? values[values.length - 1] : undefined;

    if (
      isUserPath &&
      transformValue &&
      lastValue &&
      transformValue.name === lastValue &&
      values.length === 1
    ) {
      if (transformValue.target === "com.axelor.auth.db.User") {
        setShow(false);
      } else {
        setShow(true);
      }
    } else if (
      isCollection &&
      transformValue &&
      lastValue &&
      transformValue.name === lastValue &&
      values.length === 1
    ) {
      if (["MANY_TO_MANY", "ONE_TO_MANY"].includes(transformValue.type)) {
        setShow(false);
        setButton(false);
      } else {
        setShow(true);
      }
    } else if (isDatePath && transformValue) {
      if (
        ["datetime", "date"].includes(
          transformValue.type && transformValue.type.toLowerCase()
        )
      ) {
        setShow(false);
        setButton(false);
      } else {
        setShow(true);
      }
    } else if (
      startModel &&
      transformValue &&
      lastValue &&
      transformValue.name === lastValue &&
      (startModel.fullName === transformValue.target ||
        startModel.name === transformValue.jsonTarget) &&
      values.length === 1
    ) {
      setShow(false);
    } else {
      setShow(true);
    }
  }, [isUserPath, startModel, fields, isCollection, isDatePath, fieldName]);

  useEffect(() => {
    setAllFieldValues(allFields);
  }, [allFields]);

  return (
    <React.Fragment>
      <Selection
        name="fieldName"
        title={translate("Field name")}
        placeholder={translate("Field name")}
        options={fields}
        optionLabelKey="name"
        onChange={(value) => handleChange(value)}
        value={transformValue}
        classes={classnames(styles.MuiAutocompleteRoot, classNames)}
      />
      {hasManyValues &&
        relationModel &&
        (isUserPath
          ? transformValue &&
            transformValue.target !== "com.axelor.meta.db.MetaJsonRecord" &&
            !transformValue.jsonField
          : true) && (
          <React.Fragment>
            {isShow && (
              <IconButton
                size="small"
                onClick={() => {
                  setShow((isShow) => !isShow);
                  if (fields && fields.length > 0 && startValue) {
                    const previousField = fields.find(
                      (f) => f.name === startValue
                    );
                    handleChange({
                      ...(previousField || {}),
                    });
                  }
                }}
                className={styles.iconButton}
              >
                <Tooltip title={translate("Remove sub field")}>
                  <MaterialIcon
                    d="flex"
                    alignItems="center"
                    justifyContent="center"
                    icon="close"
                    color="body"
                    fontSize={18}
                  />
                </Tooltip>
              </IconButton>
            )}
            {isShow && (
              <FieldEditor
                getMetaFields={() => {
                  return getSubMetaField(
                    relationModel,
                    relationJsonModel,
                    isCollection,
                    allowAllFields,
                    excludeUITypes
                  );
                }}
                initValue={`${initValue}${startValue}${"."}`}
                value={{
                  fieldName: values.slice(1).join("."),
                  allFields,
                }}
                onChange={onChange}
                classNames={classNames}
                isParent={relationModel ? true : false}
                isUserPath={isUserPath}
                isDatePath={isDatePath}
                startModel={startModel}
                isCollection={isCollection}
                allowAllFields={allowAllFields}
                excludeUITypes={excludeUITypes}
              />
            )}
            {!isShow && isButton && (
              <IconButton
                size="small"
                onClick={() => setShow((isShow) => !isShow)}
                className={styles.iconButton}
              >
                <Tooltip title={translate("Add sub field")}>
                  <MaterialIcon
                    icon="arrow_forward"
                    color="body"
                    fontSize={18}
                  />
                </Tooltip>
              </IconButton>
            )}
          </React.Fragment>
        )}
    </React.Fragment>
  );
}
