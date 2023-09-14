import React, { useEffect, useState } from "react";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import Paper from "@material-ui/core/Paper";
import classNames from "classnames";
import moment from "moment";
import {
  Radio,
  RadioGroup,
  FormControlLabel,
  IconButton,
  Tooltip,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Close, ArrowForward } from "@material-ui/icons";
import {
  TimelineContent,
  TimelineItem,
  TimelineConnector,
  TimelineSeparator,
  Timeline,
  TimelineOppositeContent,
  TimelineDot,
} from "@material-ui/lab";

import { getModels } from "../../services/api";
import {
  Select,
  Button,
  Selection,
  DateTimePicker,
  NumberField,
  InputField,
} from "./components";
import {
  combinator,
  operators,
  operators_by_type,
  dateFormat,
  join_operator,
  allowed_types,
} from "./extra/data";
import {
  getCustomModelData,
  getNameField,
  getData,
  getMetaFields as getMetaFieldsAPI,
} from "./services/api";
import { isBPMQuery, lowerCaseFirstLetter } from "./extra/util";
import FieldEditor from "./field-editor";
import { translate } from "../../utils";

const useStyles = makeStyles((theme) => ({
  Container: {
    display: "flex",
  },
  rulesGroupHeader: {
    display: "flex",
  },
  paper: {
    margin: theme.spacing(1, 0),
    padding: theme.spacing(3, 2),
    overflow: "auto",
  },
  rules: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "flex-start",
    marginBottom: 15,
  },
  MuiAutocompleteRoot: {
    width: "250px",
    marginRight: "10px",
  },
  disabled: {
    pointerEvents: "none",
    opacity: 0.5,
  },
  valueFrom: {
    fontSize: 12,
    color: "rgba(0, 0, 0, 0.54)",
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  radio: {
    padding: "1px 9px",
    color: "#0275d8",
    "&.MuiRadio-colorSecondary.Mui-checked": {
      color: "#0275d8",
    },
  },
  operators: {
    minWidth: 75,
  },
  iconButton: {
    marginRight: 10,
  },
  timelineConnector: {
    backgroundColor: "#0275d8",
  },
  combinator: {
    width: "fit-content",
  },
  icon: {
    color: "#0275d8",
  },
  timeline: {
    height: "100%",
    padding: 0,
    margin: 0,
  },
  timelineOppositeContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    maxWidth: 60,
    padding: 0,
  },
}));

async function fetchField(metaModals, type) {
  const isQuery = isBPMQuery(type);
  const allFields = (await getMetaFieldsAPI(metaModals, isQuery)) || [];
  return allFields.filter(
    (a) =>
      allowed_types.includes((a.type || "").toLowerCase()) &&
      (isQuery ? !a.json : true)
  );
}

function RenderRelationalWidget(props) {
  const { operator, editor, internalProps, parentType } = props;
  const { onChange, value, ...rest } = internalProps;
  const classes = useStyles();
  const { field = {} } = rest;
  const { targetName, target, targetModel, model, jsonTarget } = field;
  const [nameField, setNameField] = useState(null);
  const fetchData = async () => {
    let data;
    if (model === "com.axelor.meta.db.MetaJsonRecord" && jsonTarget) {
      data = await getCustomModelData(jsonTarget);
      let fieldData = await getNameField(jsonTarget);
      setNameField(fieldData && fieldData.name);
    } else {
      data = await getData(target || targetModel);
    }
    return data;
  };
  if (["like", "notLike"].includes(operator)) {
    return (
      <InputField
        name="fieldValue"
        onChange={(value) => {
          let isNameField;
          if (typeof value !== "string" && !isBPMQuery(parentType)) {
            isNameField =
              value && value.length > 0
                ? value && value.find((v) => v && targetName && v[targetName])
                : value && value[targetName];
            onChange(
              { name: "nameField", value: isNameField ? nameField : "id" },
              editor
            );
          }
          onChange({ name: "fieldValue", value: value }, editor);
        }}
        margin="none"
        style={{ marginTop: "15px", width: "250px !important" }}
        value={value}
        {...rest}
      />
    );
  } else if (
    ["contains", "notContains", "in", "notIn", "=", "!="].includes(operator)
  ) {
    return (
      <Selection
        name="fieldValue"
        title="Value"
        placeholder="Value"
        fetchAPI={fetchData}
        isMulti={
          (isBPMQuery(parentType) &&
            ["contains", "notContains"].includes(operator)) ||
          ["=", "!="].includes(operator)
            ? false
            : true
        }
        optionLabelKey={targetName}
        onChange={(value) => {
          let isNameField;
          if (typeof value !== "string" && !isBPMQuery(parentType)) {
            isNameField =
              value && value.length > 0
                ? value && value.find((v) => v && targetName && v[targetName])
                : value && value[targetName];
            onChange(
              { name: "nameField", value: isNameField ? nameField : "id" },
              editor
            );
          }
          onChange({ name: "fieldValue", value: value }, editor);
        }}
        value={value || []}
        classes={{ root: classes.MuiAutocompleteRoot }}
      />
    );
  } else {
    return null;
  }
}

function RenderSimpleWidget(props) {
  const { Component, operator, editor, internalProps } = props;
  const { onChange, value, value2, classes, style, targetName, ...rest } =
    internalProps;
  if (["=", "!=", ">", ">=", "<", "<=", "like", "notLike"].includes(operator)) {
    return (
      <Component
        name="fieldValue"
        onChange={(value) =>
          onChange({ name: "fieldValue", value: value }, editor)
        }
        value={value}
        style={style}
        {...rest}
      />
    );
  } else if (["between", "notBetween"].includes(operator)) {
    return (
      <React.Fragment>
        <Component
          name="fieldValue"
          style={{ marginRight: 8, ...style }}
          onChange={(value) => onChange({ name: "fieldValue", value }, editor)}
          value={value}
          {...rest}
        />

        <Component
          name="fieldValue2"
          onChange={(value) =>
            onChange({ name: "fieldValue2", value: value }, editor)
          }
          value={value2}
          style={style}
          {...rest}
        />
      </React.Fragment>
    );
  } else if (["in", "notIn"].includes(operator)) {
    return (
      <Selection
        name="fieldValue"
        title="Value"
        placeholder="Value"
        isMulti={true}
        optionLabelKey={targetName}
        onChange={(val) => {
          onChange({ name: "fieldValue", value: val }, editor);
        }}
        value={value || []}
        classes={{ root: classes.MuiAutocompleteRoot }}
        optionValueKey="name"
        {...rest}
      />
    );
  } else {
    return null;
  }
}

function RenderWidget({
  type,
  operator,
  onChange,
  value,
  classes,
  parentType,
  editor,
  ...rest
}) {
  const props = {
    value: value.fieldValue,
    value2: value.fieldValue2,
    onChange,
    ...rest,
  };

  let options = [],
    widgetProps = {};
  switch (type) {
    case "one_to_one":
    case "many_to_one":
    case "many_to_many":
    case "one_to_many":
    case "json_one_to_one":
    case "json_many_to_one":
    case "json_many_to_many":
    case "json_one_to_many":
      return (
        <RenderRelationalWidget
          operator={operator}
          editor={editor}
          internalProps={{ ...props }}
          parentType={parentType}
        />
      );
    case "date":
    case "time":
    case "datetime":
      const stringToDate = (value) =>
        value ? moment(value, dateFormat[type]) : null;
      return (
        <RenderSimpleWidget
          Component={DateTimePicker}
          operator={operator}
          editor={editor}
          internalProps={{
            type,
            value: stringToDate(value.fieldValue),
            value2: stringToDate(value.fieldValue2),
            onChange: ({ name, value }, index) =>
              onChange(
                { name, value: value && value.format(dateFormat[type]) },
                index
              ),
            ...rest,
            margin: "none",
            classes,
            style: { marginTop: "15px", width: "250px !important" },
          }}
        />
      );
    case "integer":
    case "long":
    case "decimal":
    case "double":
      options =
        rest.field.selectionList &&
        rest.field.selectionList.map(({ title, value, data }) => ({
          name: (data && data.value) || value,
          title: title,
        }));

      widgetProps = {
        Component: options ? Select : NumberField,
        operator,
        editor,
        internalProps: {
          ...(options
            ? { options, classes, ...props }
            : {
                type,
                ...props,
                margin: "none",
                classes,
                style: { marginTop: "15px", width: "250px !important" },
              }),
        },
      };
      return <RenderSimpleWidget {...widgetProps} />;
    case "enum":
      options = rest.field.selectionList.map(({ title, value, data }) => ({
        name: (data && data.value) || value,
        title: title,
      }));
      return (
        <RenderSimpleWidget
          Component={Select}
          operator={operator}
          editor={editor}
          internalProps={{
            options,
            classes,
            ...props,
          }}
        />
      );
    default:
      options =
        rest.field &&
        rest.field.selectionList &&
        rest.field.selectionList.map(({ title, value, data }) => ({
          name: (data && data.value) || value,
          title: title,
        }));
      widgetProps = {
        Component: options ? Select : InputField,
        operator,
        editor,
        internalProps: {
          ...(options
            ? { options, classes, ...props }
            : {
                classes,
                ...props,
                margin: "none",
                style: { marginTop: "15px", width: "250px !important" },
              }),
        },
      };
      return <RenderSimpleWidget {...widgetProps} />;
  }
}

function Rule(props) {
  const {
    getMetaFields,
    onChange,
    onRemoveRule,
    editor,
    value,
    expression,
    parentType,
    parentMetaModal,
    isAllowButtons = false,
  } = props;
  const {
    fieldType = "",
    field,
    operator,
    fieldValue,
    fieldValue2 = "",
    isRelationalValue,
    relatedValueModal,
    relatedValueFieldName,
    relatedElseValueModal,
    relatedElseValueFieldName,
    isShowMetaModelField: showMetaModelField,
    isShowElseMetaModelField: showElseMetaModelField,
  } = value;
  const classes = useStyles();
  const type = fieldType && fieldType.toLowerCase().replaceAll("-", "_");
  const [isField, setField] = useState(
    isRelationalValue ? isRelationalValue : "none"
  );
  const [metaModal, setMetaModal] = useState(relatedValueModal || null);
  const [isShowMetaModelField, setIsShowMetaModelField] = useState(
    showMetaModelField || false
  );
  const [elseMetaModal, setElseMetaModal] = useState(
    relatedElseValueModal || null
  );
  const [isShowElseMetaModelField, setIsShowElseMetaModelField] = useState(
    showElseMetaModelField || false
  );

  const getValue = (val) => {
    if (val && typeof val === "string") {
      let values = val.toString().split(".");
      if (values && values.length > 1) {
        return values.slice(1).join(".");
      } else {
        return val;
      }
    } else {
      return;
    }
  };

  const [elseNameValue, setElseNameValue] = useState(null);
  const [nameValue, setNameValue] = useState(null);

  const addOperatorByType = (keys, value) => {
    keys.map((key) => (operators_by_type[key] = value));
  };

  addOperatorByType(
    ["long", "decimal", "double", "date", "time", "datetime"],
    operators_by_type.integer
  );
  addOperatorByType(
    ["one_to_many", "json_one_to_many"],
    operators_by_type.text
  );
  addOperatorByType(
    ["many_to_many", "json_many_to_many"],
    ["in", "notIn", "isNull", "contains", "notContains"]
  );
  addOperatorByType(
    ["many_to_one", "one_to_one", "json_many_to_one", "json_one_to_one"],
    ["=", "!=", "in", "notIn", "isNull", "isNotNull"]
  );

  addOperatorByType(
    ["string"],
    ["=", "!=", "isNull", "isNotNull", "like", "notLike"]
  );

  let operatorsOptions = operators.filter((item) => {
    let operatorType = type;
    if (operatorType === "" && value.fieldName && value.allField.length > 0) {
      let parentField = value.allField.find((f) => f.name === value.fieldName);
      operatorType = ((parentField && parentField.type) || "").toLowerCase();
    }
    return (operators_by_type[operatorType] || []).includes(item.name);
  });

  const handleChange = (name, value) => {
    onChange({ name, value }, editor);
  };

  useEffect(() => {
    setField(isRelationalValue ? isRelationalValue : "none");
    setMetaModal(relatedValueModal || null);
    setIsShowMetaModelField(showMetaModelField || false);
    setElseMetaModal(relatedElseValueModal || null);
    setIsShowElseMetaModelField(showElseMetaModelField || false);
  }, [
    isRelationalValue,
    relatedValueModal,
    showMetaModelField,
    relatedElseValueModal,
    showElseMetaModelField,
  ]);

  useEffect(() => {
    const {
      fieldValue,
      allField = [],
      fieldValue2 = "",
      isRelationalValue,
      relatedValueModal,
      relatedValueFieldName,
      relatedElseValueModal,
      relatedElseValueFieldName,
      isShowMetaModelField: showMetaModelField,
      isShowElseMetaModelField: showElseMetaModelField,
    } = value;
    setElseNameValue({
      allField: allField,
      field: relatedElseValueFieldName,
      fieldName:
        getValue(fieldValue2) ||
        (relatedElseValueFieldName && relatedElseValueFieldName.name),
      fieldType: relatedElseValueFieldName && relatedElseValueFieldName.type,
      fieldValue: null,
      fieldValue2: null,
      operator: null,
      isRelationalValue: isRelationalValue ? isRelationalValue : "none",
      relatedValueFieldName: relatedValueFieldName,
      relatedValueModal: relatedValueModal,
      relatedElseValueFieldName: relatedElseValueFieldName,
      relatedElseValueModal: relatedElseValueModal,
      isShow: showElseMetaModelField,
    });
    setNameValue({
      allField: allField,
      field: relatedValueFieldName,
      fieldName:
        getValue(fieldValue) ||
        (relatedValueFieldName && relatedValueFieldName.fieldName),
      fieldType: relatedValueFieldName && relatedValueFieldName.type,
      fieldValue: null,
      fieldValue2: null,
      operator: null,
      isRelationalValue: isRelationalValue ? isRelationalValue : "none",
      relatedValueFieldName: relatedValueFieldName,
      relatedValueModal: relatedValueModal,
      isShow: showMetaModelField,
    });
  }, [value]);

  return (
    <div className={classes.rules}>
      <FieldEditor
        getMetaFields={getMetaFields}
        isField={isField}
        editor={editor}
        onChange={onChange}
        value={value}
        expression={expression}
        type={parentType}
        isParent={true}
        isAllowButtons={isAllowButtons}
        setInitialField={() => {
          setField("none");
        }}
      />
      <React.Fragment>
        <Select
          name="operator"
          title="Operator"
          options={
            field && field.selectionList
              ? operators.filter((o) =>
                  (isField && isField !== "none"
                    ? ["=", "!=", "isNull", "isNotNull"]
                    : ["=", "!=", "isNull", "isNotNull", "in", "notIn"]
                  ).includes(o.name)
                )
              : isField && isField !== "none"
              ? operatorsOptions.filter(
                  (o) => o.name !== "in" && o.name !== "notIn"
                )
              : operatorsOptions
          }
          onChange={(value) => {
            onChange({ name: "operator", value }, editor);
            setField(null);
          }}
          value={operator}
          className={classes.operators}
        />
        {operator &&
          field.type !== "button" &&
          !["isNull", "isNotNull", "isTrue", "isFalse"].includes(operator) && (
            <RadioGroup
              aria-label="radioType"
              name="radioType"
              value={isField || "none"}
              onChange={(e) => {
                setField(e.target.value);
                setNameValue({
                  fieldValue: null,
                });
                handleChange("fieldValue", null);
                setElseNameValue({
                  fieldValue2: null,
                });
                handleChange("fieldValue2", null);
                if (
                  e.target.value &&
                  (operator === "in" || operator === "notIn")
                ) {
                  onChange({ name: "operator", value: undefined }, editor);
                  setField(null);
                }
                if (e.target.value) {
                  handleChange(
                    "isRelationalValue",
                    e.target.value === "none" ? null : e.target.value
                  );
                  handleChange("fieldValue", null);
                  handleChange("fieldValue2", null);
                  if (e.target.value === "self") {
                    setMetaModal(parentMetaModal);
                    setElseMetaModal(parentMetaModal);
                    handleChange("relatedValueModal", parentMetaModal);
                    handleChange("relatedElseValueModal", parentMetaModal);
                  } else {
                    setMetaModal(null);
                    setElseMetaModal(null);
                    setIsShowElseMetaModelField(false);
                    setIsShowMetaModelField(false);
                    handleChange("relatedValueModal", null);
                    handleChange("relatedElseValueModal", null);
                  }
                } else {
                  handleChange("relatedValueFieldName", null);
                  handleChange("relatedValueModal", null);
                  handleChange("relatedElseValueFieldName", null);
                  handleChange("relatedElseValueModal", null);
                }
              }}
            >
              <label className={classes.valueFrom}>Value from</label>
              <FormControlLabel
                value="self"
                control={<Radio className={classes.radio} size="small" />}
                label="Self"
              />
              <FormControlLabel
                value="context"
                control={<Radio className={classes.radio} size="small" />}
                label="Context"
              />
              <FormControlLabel
                value="none"
                control={<Radio className={classes.radio} size="small" />}
                label="None"
              />
            </RadioGroup>
          )}
      </React.Fragment>
      {isField &&
      isField !== "none" &&
      operator &&
      !["isNull", "isNotNull", "isTrue", "isFalse"].includes(operator) ? (
        <React.Fragment>
          {isField === "context" && (
            <React.Fragment>
              <Selection
                name="metaModal"
                title="Model"
                placeholder="Model"
                fetchAPI={() => getModels()}
                optionLabelKey="name"
                onChange={(e) => {
                  setMetaModal(e);
                  if (e) {
                    setNameValue({
                      fieldValue: lowerCaseFirstLetter(e.name),
                    });
                    handleChange("relatedValueModal", e);
                    handleChange("fieldValue", lowerCaseFirstLetter(e.name));
                  } else {
                    setNameValue({
                      fieldValue: null,
                    });
                    handleChange("fieldValue", null);
                  }
                }}
                value={metaModal}
                classes={{ root: classes.MuiAutocompleteRoot }}
              />
              {isShowMetaModelField && isField === "context" && (
                <IconButton
                  size="small"
                  onClick={() => {
                    setIsShowMetaModelField(false);
                    handleChange("isShowMetaModelField", false);
                    if (!metaModal) return;
                    const model = metaModal.name;
                    setNameValue({
                      fieldValue: lowerCaseFirstLetter(model),
                    });
                    handleChange("relatedValueModal", metaModal);
                    handleChange("fieldValue", lowerCaseFirstLetter(model));
                  }}
                  className={classes.iconButton}
                >
                  <Tooltip title={translate("Remove sub field")}>
                    <Close color="primary" fontSize="small" />
                  </Tooltip>
                </IconButton>
              )}
            </React.Fragment>
          )}
          {(isShowMetaModelField || isField === "self") && (
            <FieldEditor
              getMetaFields={() =>
                isField === "context"
                  ? fetchField(metaModal, parentType)
                  : getMetaFields()
              }
              editor={editor}
              isField={isField}
              onChange={(
                { value, fieldNameValue, allField, isShow },
                editor
              ) => {
                setNameValue({
                  allField: allField,
                  field: value,
                  fieldName: fieldNameValue,
                  fieldType: value && value.type,
                  fieldValue: null,
                  fieldValue2: null,
                  operator: null,
                  isRelationalValue: isField === "none" ? null : isField,
                  relatedValueFieldName: null,
                  relatedValueModal: null,
                  isShow,
                  isShowMetaModelField,
                });
                handleChange(
                  "isRelationalValue",
                  isField === "none" ? null : isField
                );
                handleChange("relatedValueFieldName", value);
                handleChange("relatedValueModal", metaModal);
                let isBPM = isBPMQuery(parentType);
                const isContextValue = isField === "context" && isBPM;
                handleChange(
                  "fieldValue",
                  fieldNameValue
                    ? (parentMetaModal && parentMetaModal.id) ===
                      (metaModal && metaModal.id)
                      ? isBPM
                        ? `self.${fieldNameValue}`
                        : `${lowerCaseFirstLetter(
                            (metaModal && metaModal.name) ||
                              (parentMetaModal && parentMetaModal.name) ||
                              "self"
                          )}${
                            isContextValue
                              ? "?."
                              : join_operator[isBPM ? "BPM" : expression]
                          }${fieldNameValue}${
                            value && value.typeName && !isBPM
                              ? `${
                                  isContextValue
                                    ? "?."
                                    : join_operator[expression]
                                }toLocalDateTime()`
                              : ""
                          }`
                      : `${lowerCaseFirstLetter(
                          (metaModal && metaModal.name) ||
                            (parentMetaModal && parentMetaModal.name) ||
                            isBPM
                            ? "self"
                            : ""
                        )}${
                          isContextValue
                            ? "?."
                            : join_operator[isBPM ? "BPM" : expression]
                        }${fieldNameValue}${
                          value &&
                          [
                            "json-many-to-one",
                            "MANY_TO_ONE",
                            "many-to-one",
                          ].includes(value.type) &&
                          isBPM &&
                          isField === "context"
                            ? `${
                                isContextValue
                                  ? "?."
                                  : join_operator[expression]
                              }getTarget()`
                            : ""
                        }${
                          value && value.typeName && !isBPM
                            ? `${
                                isContextValue
                                  ? "?."
                                  : join_operator[expression]
                              }toLocalDateTime()`
                            : ""
                        }`
                    : undefined
                );
              }}
              value={nameValue}
              expression={expression}
              type={parentType}
              isParent={true}
              isBPM={true}
            />
          )}
          {!isShowMetaModelField && metaModal && isField === "context" && (
            <IconButton
              size="small"
              onClick={() => {
                setIsShowMetaModelField(true);
                handleChange("isShowMetaModelField", true);
              }}
              className={classes.iconButton}
            >
              <Tooltip title={translate("Add sub field")}>
                <ArrowForward className={classes.icon} fontSize="small" />
              </Tooltip>
            </IconButton>
          )}
          {["between", "notBetween"].includes(operator) && (
            <React.Fragment>
              {isField === "context" && (
                <React.Fragment>
                  <Selection
                    name="metaModal"
                    title="Meta Modal Else"
                    placeholder="meta modal"
                    fetchAPI={() => getModels()}
                    optionLabelKey="name"
                    onChange={(e) => {
                      setElseMetaModal(e);
                      if (e) {
                        setElseNameValue({
                          fieldValue2: lowerCaseFirstLetter(e.name),
                        });
                        handleChange("relatedElseValueModal", e);
                        handleChange(
                          "fieldValue2",
                          lowerCaseFirstLetter(e.name)
                        );
                      } else {
                        setElseNameValue({
                          fieldValue2: null,
                        });
                        handleChange("fieldValue2", null);
                      }
                    }}
                    value={elseMetaModal}
                    classes={{ root: classes.MuiAutocompleteRoot }}
                  />
                  {isShowElseMetaModelField && isField === "context" && (
                    <IconButton
                      size="small"
                      onClick={() => {
                        setIsShowElseMetaModelField(false);
                        handleChange("isShowElseMetaModelField", false);
                        if (!elseMetaModal) return;
                        const model = elseMetaModal.name;
                        setNameValue({
                          fieldValue: lowerCaseFirstLetter(model),
                        });
                        handleChange("relatedElseValueModal", elseMetaModal);
                        handleChange(
                          "fieldValue2",
                          lowerCaseFirstLetter(model)
                        );
                      }}
                      className={classes.iconButton}
                    >
                      <Tooltip title={translate("Remove sub field")}>
                        <Close color="primary" fontSize="small" />
                      </Tooltip>
                    </IconButton>
                  )}
                </React.Fragment>
              )}
              {(isShowElseMetaModelField || isField === "self") && (
                <FieldEditor
                  getMetaFields={() => fetchField(elseMetaModal, type)}
                  editor={editor}
                  isField={isField}
                  onChange={(
                    { value, fieldNameValue, allField, isShow },
                    editor
                  ) => {
                    setElseNameValue({
                      allField: allField,
                      field: value,
                      fieldName: fieldNameValue,
                      fieldType: value && value.type,
                      fieldValue: null,
                      fieldValue2: null,
                      operator: null,
                      isRelationalValue: isField === "none" ? null : isField,
                      relatedValueFieldName: relatedValueFieldName,
                      relatedValueModal: relatedElseValueModal,
                      relatedElseValueFieldName: relatedElseValueFieldName,
                      relatedElseValueModal: relatedElseValueModal,
                      isShow,
                      isShowMetaModelField,
                      isShowElseMetaModelField,
                    });
                    handleChange("relatedElseValueFieldName", value);
                    handleChange("relatedElseValueModal", elseMetaModal);
                    let isBPM = isBPMQuery(parentType);
                    const isContextValue = isField === "context" && isBPM;
                    handleChange(
                      "fieldValue2",
                      fieldNameValue
                        ? (parentMetaModal && parentMetaModal.id) ===
                          (elseMetaModal && elseMetaModal.id)
                          ? isBPM
                            ? `self.${fieldNameValue}`
                            : `${lowerCaseFirstLetter(
                                metaModal &&
                                  metaModal.name &&
                                  parentMetaModal &&
                                  parentMetaModal.name
                              )}${
                                isContextValue
                                  ? "?."
                                  : join_operator[isBPM ? "BPM" : expression]
                              }${fieldNameValue}${
                                value && value.typeName && !isBPM
                                  ? `${
                                      isContextValue
                                        ? "?."
                                        : join_operator[expression]
                                    }toLocalDateTime()`
                                  : ""
                              }`
                          : `${lowerCaseFirstLetter(
                              elseMetaModal && elseMetaModal.name
                            )}${
                              isContextValue
                                ? "?."
                                : join_operator[isBPM ? "BPM" : expression]
                            }${fieldNameValue}${
                              value &&
                              [
                                "json-many-to-one",
                                "MANY_TO_ONE",
                                "many-to-one",
                              ].includes(value.type) &&
                              isBPM &&
                              isField === "context"
                                ? `${
                                    isContextValue
                                      ? "?."
                                      : join_operator[expression]
                                  }getTarget()`
                                : ""
                            }${
                              value && value.typeName && !isBPM
                                ? `${
                                    isContextValue
                                      ? "?."
                                      : join_operator[expression]
                                  }toLocalDateTime()`
                                : ""
                            }`
                        : undefined
                    );
                  }}
                  value={elseNameValue}
                  expression={expression}
                  type={parentType}
                  isParent={true}
                  isBPM={true}
                />
              )}
              {!isShowElseMetaModelField &&
                elseMetaModal &&
                isField === "context" && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      setIsShowElseMetaModelField(true);
                      handleChange("isShowElseMetaModelField", true);
                    }}
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
      ) : (
        operator &&
        (field.type === "button" ? (
          <Select
            name="fieldValue"
            onChange={(value) =>
              onChange({ name: "fieldValue", value: value }, editor)
            }
            value={fieldValue}
            options={[
              { name: true, title: "true" },
              { name: false, title: "false" },
            ]}
            className={classes.operators}
          />
        ) : (
          <RenderWidget
            type={type}
            parentType={parentType}
            operator={operator}
            onChange={(e, editor) => {
              onChange(e, editor);
              handleChange("isRelationalValue", null);
              handleChange("relatedValueFieldName", null);
              handleChange("relatedValueModal", null);
            }}
            value={{ fieldValue, fieldValue2 }}
            classes={classes}
            editor={editor}
            field={field}
          />
        ))
      )}
      <Button Icon={DeleteIcon} onClick={onRemoveRule} />
    </div>
  );
}

export default function Editor({
  onAddGroup,
  isRemoveGroup,
  onRemoveGroup,
  onAddRule,
  onRemoveRule,
  editor = {},
  getChildEditors,
  onChange,
  getMetaFields,
  isDisable,
  expression,
  type,
  parentMetaModal,
  element,
  isAllowButtons = false,
}) {
  const classes = useStyles();
  const [isBPM, setBPM] = useState(false);
  const { id, rules = [] } = editor;
  const childEditors = getChildEditors(editor.id);

  useEffect(() => {
    const isBPM = isBPMQuery(type);
    setBPM(isBPM);
  }, [type]);

  return (
    <Paper
      variant="outlined"
      className={classNames(classes.paper, isDisable && classes.disabled)}
    >
      <div className={classNames(classes.rulesGroupHeader)}>
        <Timeline align="alternate" className={classes.timeline}>
          <TimelineItem>
            <TimelineOppositeContent
              className={classes.timelineOppositeContent}
            >
              <Select
                name="combinator"
                className={classes.combinator}
                disableUnderline={true}
                options={combinator}
                value={editor.combinator || "and"}
                onChange={(value) =>
                  onChange({ name: "combinator", value }, editor)
                }
              />
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot
                variant="outlined"
                style={{ borderColor: "#0275d8" }}
              />
              <TimelineConnector className={classes.timelineConnector} />
            </TimelineSeparator>
            <TimelineContent>
              <Button
                title="Add Group"
                Icon={AddIcon}
                onClick={() => onAddGroup(id)}
              />
              {isRemoveGroup && (
                <Button
                  title="Remove Group"
                  Icon={DeleteIcon}
                  onClick={() => onRemoveGroup(id)}
                />
              )}
              {rules.map((rule, i) => (
                <React.Fragment key={i}>
                  <Rule
                    getMetaFields={getMetaFields}
                    onRemoveRule={() => onRemoveRule(editor.id, i)}
                    onChange={(e, editor) => onChange(e, editor, i)}
                    editor={editor}
                    value={rule}
                    expression={expression}
                    parentType={type}
                    isBPM={isBPM}
                    parentMetaModal={parentMetaModal}
                    element={element}
                    isAllowButtons={isAllowButtons}
                  />
                </React.Fragment>
              ))}
              <Button
                title="Add Rule"
                Icon={AddIcon}
                onClick={() => onAddRule(id)}
              />
              {childEditors.map((editor, i) => (
                <React.Fragment key={editor.id}>
                  <Editor
                    isRemoveGroup={true}
                    onAddGroup={onAddGroup}
                    onRemoveGroup={onRemoveGroup}
                    onAddRule={onAddRule}
                    onRemoveRule={onRemoveRule}
                    getChildEditors={getChildEditors}
                    getMetaFields={getMetaFields}
                    onChange={(e, editor, i) => onChange(e, editor, i)}
                    editor={editor}
                    type={type}
                    element={element}
                    expression={expression}
                    isAllowButtons={isAllowButtons}
                  />
                </React.Fragment>
              ))}
            </TimelineContent>
          </TimelineItem>
        </Timeline>
      </div>
    </Paper>
  );
}
