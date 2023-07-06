import React, { useEffect, useState } from "react";
import classnames from "classnames";
import { IconButton, Tooltip } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Close, ArrowForward } from "@material-ui/icons";

import { Selection } from "./components";
import { getSubMetaField } from "./services/api";
import { isBPMQuery, join_operator } from "./extra/util";
import { translate } from "../../utils";

const useStyles = makeStyles(() => ({
  MuiAutocompleteRoot: {
    width: "250px",
    marginRight: "10px",
  },
  iconButton: {
    marginRight: 10,
  },
  icon: {
    color: "#0275d8",
  },
}));

export default function FieldEditor({
  initValue = "",
  getMetaFields,
  editor,
  onChange,
  value,
  classNames,
  expression: parentExpression = "GROOVY",
  type,
  isParent = false,
  isBPM,
  isField,
  setInitialField = () => {},
  isAllowButtons = false,
}) {
  const { fieldName = "", allField = [], isShow: propIsShow } = value || {};
  const [fields, setFields] = useState([]);
  const classes = useStyles();
  const isContextValue = isField === "context" && isBPMQuery(type) && isBPM;
  const expression = isBPMQuery(type) ? "BPM" : parentExpression;
  const values =
    fieldName &&
    join_operator[expression] &&
    fieldName.split(isContextValue ? "?." : join_operator[expression]);
  const isName =
    values &&
    values.slice(1) &&
    values.slice(1).join(isContextValue ? "?." : join_operator[expression]);
  const [isShow, setShow] = useState(propIsShow || isName ? true : false);
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
  const fieldType = (fields.find((x) => x.name === startValue) || {}).type;
  const isM2MField =
    allField &&
    allField.length > 0 &&
    allField.find((f) =>
      ["many_to_many", "json_many_to_many"].includes(
        (f && (f.type || "")).toLowerCase().replaceAll("-", "_")
      )
    );
  const isM2OField =
    allField &&
    allField.length > 0 &&
    allField.find((f) =>
      ["many_to_one", "json_many_to_one"].includes(
        (f && (f.type || "")).toLowerCase().replaceAll("-", "_")
      )
    );
  const isOneToOne = ["one_to_one", "json_one_to_one"].includes(
    (fieldType || "").toLowerCase().replaceAll("-", "_")
  );

  const getUpdatedValue = () => {
    let spiltedValues = initValue && initValue.split(join_operator[expression]);
    return (
      spiltedValues &&
      spiltedValues.length > 0 &&
      (spiltedValues.filter(Boolean) || []).join(join_operator[expression])
    );
  };

  function handleChange(value) {
    const isRelationalField =
      value && fields.some((x) => x.name === value.name && x.target);
    if (isBPM) {
      let allFields;
      let newFieldName = isParent
        ? value && value.name
          ? `${initValue}${value.name}`
          : `${getUpdatedValue()}`
        : value && value.name
        ? `${
            isRelationalField
              ? isContextValue
                ? "?."
                : join_operator[expression]
              : ""
          }${initValue}${value.name}`
        : "";
      if (value && allField.findIndex((f) => f.name === value.name) <= -1) {
        let fieldNames =
          (newFieldName || "").split(
            isContextValue ? "?." : join_operator[expression]
          ) || [];
        let filterFields =
          (allField && allField.filter((f) => fieldNames.includes(f.name))) ||
          [];
        allFields = [...filterFields, value];
      } else {
        let fields = [...(allField || [])];
        let fieldNames = (fieldName || "").split(
          isContextValue ? "?." : join_operator[expression]
        );
        fieldNames &&
          fieldNames.length > 0 &&
          fieldNames.forEach((fName) => {
            let index = fields.findIndex((f) => f.name === fName);
            if (index > -1) {
              fields.splice(index, 1);
            }
          });
        allFields = fields;
      }
      onChange(
        {
          name: "fieldName",
          value,
          fieldNameValue: newFieldName ? newFieldName : undefined,
          allField: allFields,
          isShow,
        },
        editor
      );
      return;
    }
    let newFieldName = isParent
      ? `${initValue}${value ? value.name : ""}`
      : value
      ? value.name
      : ""
      ? `${isRelationalField ? join_operator[expression] : ""}${initValue}${
          value ? value.name : ""
        }`
      : "";
    newFieldName = isBPMQuery(type)
      ? value && value.name
        ? newFieldName
        : newFieldName.slice(0, -1)
      : newFieldName;
    onChange(
      {
        name: "fieldName",
        value: newFieldName,
      },
      editor
    );
    onChange({ name: "fieldType", value: (value && value.type) || "" }, editor);
    onChange({ name: "field", value }, editor);
    onChange({ name: "isShow", value: isShow }, editor);
    if (value && allField.findIndex((f) => f.name === value.name) <= -1) {
      let fieldNames =
        (newFieldName || "").split(join_operator[expression]) || [];
      let allFields =
        (allField && allField.filter((f) => fieldNames.includes(f.name))) || [];
      onChange({ name: "allField", value: [...allFields, value] }, editor);
    } else {
      let fields = [...(allField || [])];
      let fieldNames = (fieldName || "").split(join_operator[expression]);
      let initValues =
        `${initValue}${join_operator[expression]}${startValue}`.split(
          join_operator[expression]
        );
      fieldNames &&
        fieldNames.length > 0 &&
        fieldNames.forEach((fName) => {
          let index = fields.findIndex((f) => f.name === fName);
          if (index > -1 && !(initValues || []).includes(fName)) {
            fields.splice(index, 1);
          }
        });
      onChange({ name: "allField", value: fields }, editor);
      if (fields && fields.length === 1) {
        const val = fields[0];
        onChange({ name: "fieldType", value: (val && val.type) || "" }, editor);
        onChange({ name: "field", value: val }, editor);
        setInitialField();
      } else {
        const val = fields[fields.length - 1];
        onChange({ name: "fieldType", value: (val && val.type) || "" }, editor);
        onChange({ name: "field", value: val }, editor);
        setInitialField();
      }
    }
  }
  const transformValue =
    (fields && fields.find((f) => f.name === startValue)) ||
    (allField && allField.find((f) => f.name === startValue));

  useEffect(() => {
    let isSubscribed = true;
    if (isSubscribed) {
      setShow(propIsShow || isName ? true : false);
    }
    return () => {
      isSubscribed = false;
    };
  }, [propIsShow, isName]);

  useEffect(() => {
    let isSubscribed = true;
    (async () => {
      const data = await getMetaFields();
      if (isSubscribed) {
        setFields(data);
      }
    })();
    return () => {
      isSubscribed = false;
    };
  }, [getMetaFields]);

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
        classes={{
          root: classnames(
            classes.MuiAutocompleteRoot,
            classNames && classNames.root
          ),
        }}
      />
      {hasManyValues && relationModel && (
        <React.Fragment>
          {isShow && !isOneToOne && (
            <IconButton
              size="small"
              onClick={() => {
                setShow((isShow) => !isShow);
                if (allField && allField.length > 0 && startValue) {
                  const previousField = allField.find(
                    (f) => f.name === startValue
                  );
                  handleChange({
                    ...(previousField || {}),
                  });
                }
              }}
              className={classes.iconButton}
            >
              <Tooltip title={translate("Remove sub field")}>
                <Close className={classes.icon} fontSize="small" />
              </Tooltip>
            </IconButton>
          )}
          {(isShow || isOneToOne) && (
            <FieldEditor
              getMetaFields={() => {
                return getSubMetaField(
                  relationModel,
                  !isBPMQuery(type)
                    ? isM2MField &&
                        values &&
                        values.length > 0 &&
                        values.includes(isM2MField.name) &&
                        values[0] !== isM2MField.name
                    : true,
                  isBPMQuery(type),
                  relationJsonModel,
                  isM2OField,
                  isBPM,
                  isAllowButtons
                );
              }}
              editor={editor}
              initValue={`${initValue}${startValue}${
                isContextValue ? "?." : join_operator[expression]
              }`}
              value={{
                fieldName: values
                  .slice(1)
                  .join(isContextValue ? "?." : join_operator[expression]),
                allField,
              }}
              onChange={onChange}
              classNames={classNames}
              expression={expression}
              type={type}
              isParent={relationModel ? true : false}
              isBPM={isBPM}
              setInitialField={setInitialField}
              isField={isField}
              isAllowButtons={isAllowButtons}
            />
          )}
          {!isShow && !isOneToOne && (
            <IconButton
              size="small"
              onClick={() => setShow((isShow) => !isShow)}
              className={classes.iconButton}
            >
              <Tooltip title={translate("Add sub field")}>
                <ArrowForward className={classes.icon} fontSize="small" />
              </Tooltip>
            </IconButton>
          )}
        </React.Fragment>
      )}
    </React.Fragment>
  );
}
