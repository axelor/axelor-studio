import React, { useEffect, useState } from "react";
import { translate } from "../../utils";
import { Selection } from "../expression-builder/components";
import { getSubMetaField } from "../../services/api";
import Tooltip from "./tooltip/tooltip";
import { Button } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

export default function FieldEditor({
  initValue = "",
  getMetaFields,
  onChange,
  value,
  isParent = false,
  isUserPath = false,
  startModel,
  isCollection = false,
  allowAllFields = false,
  excludeUITypes = false,
  isDatePath = false,
}) {
  const { fieldName = "", allFields } = value || {};
  const [fields, setFields] = useState([]);
  const [isShow, setShow] = useState(true);
  const [isButton, setButton] = useState(true);
  const [allFieldValues, setAllFieldValues] = useState(null);
  const values = fieldName && fieldName.split(".");
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
              isCollection
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
    const values = fieldName && fieldName.split(".");
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
        title="Field name"
        placeholder="field name"
        options={fields}
        optionLabelKey="name"
        onChange={(value) => handleChange(value)}
        value={transformValue}
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
              <Button
                size="sm"
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
                px={0}
                me={2}
              >
                <Tooltip title={translate("Remove sub field")}>
                  <MaterialIcon
                    icon="close"
                    size="12"
                    color="primary"
                    className="pointer"
                  />
                </Tooltip>
              </Button>
            )}
            {isShow && (
              <FieldEditor
                getMetaFields={() => {
                  return getSubMetaField(
                    relationModel,
                    relationJsonModel,
                    isCollection,
                    allowAllFields
                  );
                }}
                initValue={`${initValue}${startValue}${"."}`}
                value={{
                  fieldName: values.slice(1).join("."),
                  allFields,
                }}
                onChange={onChange}
                isParent={relationModel ? true : false}
                isUserPath={isUserPath}
                isDatePath={isDatePath}
                startModel={startModel}
                isCollection={isCollection}
                allowAllFields={allowAllFields}
              />
            )}
            {!isShow && isButton && (
              <Button
                onClick={() => setShow((isShow) => !isShow)}
                mt={3}
                pt={4}
                me={2}
                size="sm"
              >
                <Tooltip title={translate("Add sub field")}>
                  <MaterialIcon
                    icon="arrow_forward"
                    color="primary"
                    size="12"
                    className="pointer"
                  />
                </Tooltip>
              </Button>
            )}
          </React.Fragment>
        )}
    </React.Fragment>
  );
}
