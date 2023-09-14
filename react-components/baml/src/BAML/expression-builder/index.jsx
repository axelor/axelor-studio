import React, { useEffect, useState } from "react";
import jsStringEscape from "js-string-escape";
import { makeStyles } from "@material-ui/core/styles";
import {
  Dialog,
  DialogTitle,
  Checkbox,
  FormControlLabel,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button as MaterialButton,
  Paper,
} from "@material-ui/core";
import {
  TimelineContent,
  TimelineItem,
  TimelineConnector,
  TimelineSeparator,
  Timeline,
  TimelineOppositeContent,
  TimelineDot,
} from "@material-ui/lab";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import produce from "immer";
import moment from "moment";
import { isEmpty } from "lodash";
import _ from "lodash";

import ExpressionComponent from "./expression-builder";
import { Button, Select } from "./components";
import {
  combinator as combinators,
  map_operator,
  join_operator,
  dateFormat,
  map_combinator,
  map_bpm_combinator,
  positive_operators,
} from "./extra/data";
import { getModels, getDMNModels } from "../../services/api";
import {
  isBPMQuery,
  lowerCaseFirstLetter,
  upperCaseFirstLetter,
  getJsonExpression,
} from "./extra/util";
import { translate } from "../../utils";

const useStyles = makeStyles((theme) => ({
  paper: {
    margin: theme.spacing(1),
    padding: theme.spacing(3, 2),
    width: `calc(100% - 50px)`,
    display: "flex",
    height: "calc(100% - 50px)",
    overflow: "auto",
  },
  expressionContainer: {
    display: "flex",
    alignItems: "center",
    width: "100%",
  },
  dialogPaper: {
    maxWidth: "100%",
    maxHeight: "100%",
    resize: "both",
    width: "70%",
    height: 650,
  },
  dialog: {
    minWidth: 300,
  },
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    height: "100%",
    overflow: "hidden",
  },
  combinator: {
    width: "fit-content",
  },
  timelineConnector: {
    backgroundColor: "#0275d8",
  },
  save: {
    margin: theme.spacing(1),
    backgroundColor: "#0275d8",
    borderColor: "#0267bf",
    color: "white",
    "&:hover": {
      backgroundColor: "#025aa5",
      borderColor: "#014682",
      color: "white",
    },
  },
  timeline: {
    width: "100%",
    padding: 0,
    margin: 0,
    justifyContent: "flex-start",
  },
  timelineOppositeContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    maxWidth: 60,
    padding: 0,
  },
  checkbox: {
    color: "#0275d8",
    "&.MuiCheckbox-colorSecondary.Mui-checked": {
      color: "#0275d8",
    },
  },
  timelineItem: {
    "&.MuiTimelineItem-missingOppositeContent:before": {
      padding: 0,
    },
  },
  expression: {
    height: "100%",
    width: "100%",
  },
}));

function ExpressionBuilder({
  handleClose,
  open,
  element,
  setProperty,
  getExpression,
  type: parentType = "expressionBuilder",
  title = "Add expression",
  processConfigs,
  isAllowButtons = true,
  allowAllModels = false,
  bpmnModeler,
  defaultModel,
}) {
  const expression = isBPMQuery(parentType) ? "BPM" : "GROOVY";
  const [combinator, setCombinator] = useState("and");
  const [openAlert, setAlert] = useState(false);
  const [expressionComponents, setExpressionComponents] = useState([
    { Component: ExpressionComponent },
  ]);
  const [generateWithId, setGenerateWithId] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    alertMessage: "Add all values",
    alertTitle: "Error",
  });
  const [isClose, setClose] = useState(false);
  const [initialValues, setInitialValues] = useState(null);

  const classes = useStyles();
  function onAddExpressionEditor() {
    setExpressionComponents(
      produce((draft) => {
        draft.push({ Component: ExpressionComponent.bind({}) });
      })
    );
  }

  function onRemoveExpressionEditor(index) {
    setExpressionComponents(
      produce((draft) => {
        draft.splice(index, 1);
      })
    );
  }

  function getRelationalCondition(
    rule,
    initValue = "",
    isParent = false,
    prefix
  ) {
    const map_operators =
      map_operator[isBPMQuery(parentType) ? "BPM" : expression];
    const { fieldName: propFieldName, operator, allField } = rule;
    let {
      fieldValue,
      fieldValue2,
      isRelationalValue,
      relatedValueFieldName,
      relatedValueModal,
      relatedElseValueFieldName,
      relatedElseValueModal,
      parent,
      nameField,
    } = rule;
    let fieldName = propFieldName;
    const values = fieldName
      .split(join_operator[isBPMQuery(parentType) ? "BPM" : expression])
      .filter((f) => f !== "");

    const fName = values[0];
    const field = allField.find((f) => f.name === fName);
    const { targetName, selectionList, nameField: nameColumn } = field || {};
    const type =
      field && field.type && field.type.toLowerCase().replaceAll("-", "_");
    const typeName = field && field.typeName;
    const nestedFields = (values && values.splice(1)) || [];
    if (
      [
        "many_to_many",
        "one_to_many",
        "json_many_to_many",
        "json_one_to_many",
      ].includes(type)
    ) {
      const findRelational = initValue.match(/\$\$/g);
      if (findRelational && findRelational.length > 0) {
        const str =
          nestedFields.length >= 1
            ? `${fName}.find{it->it.$$$$}${
                positive_operators.includes(operator) ? " != null" : " == null"
              }`
            : `${fName}.${
                nestedFields.length > 0 ? "find" : "collect"
              }{it->it$$$$}${
                nestedFields.length > 0
                  ? positive_operators.includes(operator)
                    ? " != null"
                    : " == null"
                  : ""
              }`;
        initValue = initValue.replace(/\$\$/g, str);
      } else {
        const str =
          nestedFields.length >= 1
            ? `${fName}.find{it->it.$$}${
                positive_operators.includes(operator) ? " != null" : " == null"
              }`
            : `${fName}.${
                nestedFields.length > 0 ? "find" : "collect"
              }{it->it$$}${
                nestedFields.length > 0
                  ? positive_operators.includes(operator)
                    ? " != null"
                    : " == null"
                  : ""
              }`;
        initValue += str;
      }
      const nestedFieldName = nestedFields.join(join_operator[expression]);
      return getRelationalCondition(
        {
          fieldName: nestedFieldName,
          operator,
          allField,
          fieldValue,
          fieldValue2,
          isRelationalValue,
          relatedValueFieldName,
          relatedValueModal,
          relatedElseValueFieldName,
          relatedElseValueModal,
          parent: values && values[0],
          nameField: nameColumn || nameField,
        },
        initValue,
        nestedFields.length > 1,
        prefix
      );
    } else if (
      [
        "json_many_to_one",
        "json_one_to_one",
        "many_to_one",
        "one_to_one",
      ].includes(type)
    ) {
      const nestedFieldName = nestedFields.join(join_operator[expression]);
      const findRelational = initValue.match(/\$\$/g);
      const str =
        nestedFields.length >= 1
          ? `${fName}${join_operator[expression]}`
          : fName;
      if (findRelational && findRelational.length > 0) {
        initValue = initValue.replace(/\$\$/g, `${str}$$$$`);
      } else {
        initValue += `${str}$$`;
      }
      return getRelationalCondition(
        {
          fieldName: nestedFieldName,
          operator,
          allField,
          fieldValue,
          fieldValue2,
          isRelationalValue,
          relatedValueFieldName,
          relatedValueModal,
          relatedElseValueFieldName,
          relatedElseValueModal,
          nameField: nameColumn || nameField,
          parent: values && values[0],
        },
        initValue,
        nestedFields.length > 1,
        prefix
      );
    } else {
      const isNumber = [
        "long",
        "integer",
        "decimal",
        "boolean",
        "button",
        "double",
      ].includes(type);
      const isDateTime = ["date", "time", "datetime"].includes(type);

      if (isNumber) {
        if (
          !fieldValue &&
          fieldValue !== false &&
          !selectionList &&
          !isRelationalValue
        ) {
          fieldValue = 0;
        }
        if (["between", "notBetween"].includes(operator) && !fieldValue2) {
          fieldValue2 = 0;
        }
      }

      if (!isRelationalValue && !isNumber && typeof fieldValue !== "object") {
        fieldValue = `'${jsStringEscape(fieldValue)}'`;
        fieldValue2 = `'${jsStringEscape(fieldValue2)}'`;
      }

      if (isDateTime) {
        if (!isRelationalValue) {
          fieldValue = getDateTimeValue(type, fieldValue);
          fieldValue2 = getDateTimeValue(type, fieldValue2);
        }
        fieldName = typeName ? `${fieldName}?.toLocalDateTime()` : fieldName;
      }
      if (["in", "notIn"].includes(operator)) {
        const isManyToManyField = initValue && initValue.includes("{it->it$$}");
        const field = allField.find((f) => f.name === parent) || {};
        const value =
          typeof rule.fieldValue === "string"
            ? rule.fieldValue
            : rule.fieldValue
                .map((i) =>
                  isNumber
                    ? `${
                        i["nameField"] ||
                        i["targetName"] ||
                        i["fullName"] ||
                        i["name"] ||
                        i["id"]
                      }`
                    : i["nameField"] ||
                      i["targetName"] ||
                      i["fullName"] ||
                      i["name"]
                    ? `'${
                        i["nameField"] ||
                        i["targetName"] ||
                        i["fullName"] ||
                        i["name"]
                      }'`
                    : i["id"]
                )
                .join(",");
        const name =
          isParent || nestedFields.length >= 1
            ? ""
            : `${fieldName}${
                selectionList
                  ? ""
                  : `${join_operator[expression]}${
                      nameField ||
                      (field && field.targetName) ||
                      targetName ||
                      "fullName"
                    }`
              }`;
        const str = `${operator === "notIn" ? "!" : ""}${`[${value}]`}${
          join_operator[expression]
        }${map_operators[operator]}${isManyToManyField ? "All" : ""}(${prefix}${
          join_operator[expression]
        }${initValue.replace(/\$\$/g, name)})`;
        return str;
      } else if (["contains", "notContains"].includes(operator)) {
        const isManyToManyField = initValue && initValue.includes("{it->it$$}");
        const field = allField.find((f) => f.name === parent) || {};
        const value =
          typeof rule.fieldValue === "string"
            ? rule.fieldValue
            : rule.fieldValue
                .map((i) =>
                  isNumber
                    ? `${
                        i["nameField"] ||
                        i["targetName"] ||
                        i["fullName"] ||
                        i["name"] ||
                        i["id"]
                      }`
                    : i["nameField"] ||
                      i["targetName"] ||
                      i["fullName"] ||
                      i["name"]
                    ? `'${
                        i["nameField"] ||
                        i["targetName"] ||
                        i["fullName"] ||
                        i["name"]
                      }'`
                    : i["id"]
                )
                .join(",");
        const name =
          isParent || nestedFields.length >= 1
            ? ""
            : `${fieldName}${
                selectionList
                  ? ""
                  : `${join_operator[expression]}${
                      nameField ||
                      (field && field.targetName) ||
                      targetName ||
                      "fullName"
                    }`
              }`;
        const str = `${operator === "notContains" ? "!" : ""}(${prefix}${
          join_operator[expression]
        }${initValue.replace(/\$\$/g, name)})${join_operator[expression]}${
          map_operators[operator]
        }${isManyToManyField ? "All" : ""}(${`[${value}]`})`;
        return str;
      } else if (["between", "notBetween"].includes(operator)) {
        const temp = initValue.match(/it.\$\$/g);
        if (temp && temp.length) {
          const str = `(it.${prefix}${join_operator[expression]}${fieldName} >= ${fieldValue} && it.${prefix}${join_operator[expression]}${fieldName} <= ${fieldValue2})`;
          if ("notBetween" === operator) {
            return `${initValue.replace(/it.\$\$/g, `!${str}`)}`;
          }
          return initValue.replace(/it.\$\$/g, str);
        } else {
          const replace = (p1) => {
            const field = (p1 && p1.replace(/\$\$/g, fieldName)) || fieldName;
            if ("notBetween" === operator) {
              return `!(${prefix}${join_operator[expression]}${field} >= ${fieldValue} && ${prefix}${join_operator[expression]}${field} <= ${fieldValue2})`;
            }
            return `(${prefix}${join_operator[expression]}${field} >= ${fieldValue} && ${prefix}${join_operator[expression]}${field} <= ${fieldValue2})`;
          };
          return replace(initValue);
        }
      } else if (["isNotNull", "isNull"].includes(operator)) {
        const str = `${fieldName} ${map_operators[operator]}`;
        const field = allField.find((f) => f.name === parent) || {};
        const isManyToManyField = initValue && initValue.includes("{it->it$$}");
        if (isManyToManyField) {
          const name =
            isParent || nestedFields.length >= 1
              ? ""
              : `${fieldName}${
                  selectionList
                    ? ""
                    : `${join_operator[expression]}${
                        (field && field.targetName) || targetName || "fullName"
                      }`
                }`;
          return `${prefix}${join_operator[expression]}${initValue.replace(
            /\$\$/g,
            `${name} ${str}`
          )}`;
        }
        return `${prefix}${join_operator[expression]}${initValue.replace(
          /\$\$/g,
          str
        )}`;
      } else if (["isTrue", "isFalse"].includes(operator)) {
        const value = operator === "isTrue" ? true : false;
        const str = `${fieldName} ${map_operators[operator]} ${value}`;
        return `${prefix}${join_operator[expression]}${initValue.replace(
          /\$\$/g,
          str
        )}`;
      } else if (["like", "notLike"].includes(operator)) {
        const str = `${fieldName}${join_operator[expression]}${map_operators[operator]}(${fieldValue})`;
        return `${operator === "notLike" ? "!" : ""}${prefix}${
          join_operator[expression]
        }${initValue.replace(/\$\$/g, str)}`;
      } else {
        let fieldNew = field || allField.find((f) => f.name === parent) || {};
        let value =
          typeof fieldValue === "object" && fieldValue
            ? `'${jsStringEscape(
                fieldValue[nameField] ||
                  fieldValue[targetName] ||
                  fieldValue["fullName"] ||
                  fieldValue["name"] ||
                  fieldValue["id"] ||
                  ""
              )}'`
              ? `'${jsStringEscape(
                  fieldValue[nameField] ||
                    fieldValue[targetName] ||
                    fieldValue["fullName"] ||
                    fieldValue["name"] ||
                    fieldValue["id"] ||
                    ""
                )}'`
              : fieldValue["name"]
            : fieldValue;
        const str = `${
          typeof fieldValue === "object" && fieldValue
            ? `${fieldName}${join_operator[expression]}${
                nameField || fieldNew.targetName || "fullName"
              }`
            : fieldName
        } ${map_operators[operator]} ${value}`;
        return type === "button"
          ? `${initValue.replace(/\$\$/g, str)}`
          : `${prefix}${join_operator[expression]}${initValue.replace(
              /\$\$/g,
              str
            )}`;
      }
    }
  }

  function getDateTimeValue(type, fieldValue, isJsonField = false) {
    if (type === "date") {
      let date = `"${moment(fieldValue, dateFormat["date"]).format(
        "YYYY-MM-DD"
      )}"`;
      if (isJsonField) {
        return date;
      }
      return `LocalDate.parse(${date})`;
    } else if (type === "datetime") {
      if (isJsonField) {
        return `"${moment(fieldValue, dateFormat["datetime"]).toISOString()}"`;
      }
      return `LocalDateTime.of(${moment(fieldValue, dateFormat["datetime"])
        .format("YYYY-M-D-H-m-s")
        .split("-")})`;
    } else {
      let time = `"${moment(fieldValue, dateFormat["time"]).format(
        "HH:mm:ss"
      )}"`;
      if (isJsonField) {
        return time;
      }
      return `LocalTime.parse(${time})`;
    }
  }

  const onCancel = () => {
    const values = generateExpressionValues();
    if (
      (values && values.length <= 0) ||
      JSON.stringify(values) === JSON.stringify(initialValues)
    ) {
      handleClose();
      return;
    }
    setClose(true);
    setAlert(true);
    setAlertConfig({
      alertMessage:
        "Current changes will be lost. Do you really want to proceed?",
      alertTitle: "Question",
    });
  };

  function getCondition(rules, modalName) {
    const isBPM = isBPMQuery(parentType);
    const prefix = isBPM
      ? "self"
      : generateWithId
      ? `__ctx__.find('${upperCaseFirstLetter(modalName)}', ${modalName}Id)`
      : modalName;
    const map_operators = map_operator[isBPM ? "BPM" : expression];
    const returnValues = [];
    for (let i = 0; i < (rules && rules.length); i++) {
      const rule = rules[i];
      const { fieldName: propFieldName, field = {}, operator, allField } = rule;
      const { targetName, selectionList } = field || {};
      const type = field && field.type && field.type.toLowerCase();
      const typeName = field && field.typeName;
      const isNumber = [
        "long",
        "integer",
        "decimal",
        "boolean",
        "button",
        "double",
      ].includes(type);
      const isDateTime = ["date", "time", "datetime"].includes(type);
      let { fieldValue, fieldValue2, isRelationalValue } = rule;
      let fieldName = propFieldName;
      if (isNumber && !selectionList && !isRelationalValue) {
        if (!fieldValue && fieldValue !== false) {
          fieldValue = 0;
        }
        if (["between", "notBetween"].includes(operator) && !fieldValue2) {
          fieldValue2 = 0;
        }
      }
      const fValue = isNaN(fieldValue) ? fieldValue : `${fieldValue}`;
      if (
        operator === "" ||
        (selectionList &&
          !fieldValue &&
          !["isNull", "isNotNull", "isTrue", "isFalse"].includes(operator)) ||
        (((!isNumber && !fieldValue) ||
          (isNumber && isRelationalValue && !fieldValue && selectionList) ||
          (fieldValue && fieldValue.length <= 0) ||
          ((!fieldValue2 || (fieldValue2 && fieldValue2.length <= 0)) &&
            ["between", "notBetween"].includes(operator))) &&
          !["isNull", "isNotNull", "isTrue", "isFalse"].includes(operator))
      ) {
        break;
      }
      if (!fieldName) {
        break;
      }

      if (isEmpty(fValue)) {
        if (!["isNull", "isNotNull", "isTrue", "isFalse"].includes(operator)) {
          break;
        }
      }

      //check relational field
      const name = fieldName && fieldName.split(join_operator[expression])[0];
      const f = allField && allField.find((f) => f.name === name);
      const isRelational = [
        "many_to_many",
        "one_to_many",
        "many_to_one",
        "one_to_one",
        "json_many_to_many",
        "json_one_to_many",
        "json_many_to_one",
        "json_one_to_one",
      ].includes(
        f &&
          f.type &&
          f.type.toLowerCase() &&
          f.type.toLowerCase().replaceAll("-", "_")
      );
      if (isRelational) {
        returnValues.push(
          getRelationalCondition(rule, undefined, false, prefix)
        );
      } else {
        if (!isRelationalValue && !isNumber && typeof fieldValue !== "object") {
          fieldValue = `'${jsStringEscape(fieldValue)}'`;
          fieldValue2 = `'${jsStringEscape(fieldValue2)}'`;
        }
        if (isDateTime) {
          if (!isRelationalValue) {
            fieldValue = getDateTimeValue(type, fieldValue);
            fieldValue2 = getDateTimeValue(type, fieldValue2);
          }
          fieldName = typeName ? `${fieldName}?.toLocalDateTime()` : fieldName;
        }
        const map_type = isBPM ? map_bpm_combinator : map_combinator;
        if (["in", "notIn"].includes(operator)) {
          const value = rule.fieldValue
            .map((f) =>
              isNumber
                ? `${f["targetName"] || f["fullName"] || f["name"]}`
                : `'${f["targetName"] || f["fullName"] || f["name"]}'`
            )
            .filter((f) => f !== "")
            .join(",");
          returnValues.push(
            `${operator === "notIn" ? "!" : ""}${`[${value}]`}${
              join_operator[expression]
            }${map_operators[operator]}(${prefix}${
              join_operator[expression]
            }${fieldName}${
              selectionList
                ? " "
                : `${join_operator[expression]} ${targetName || "fullName"}`
            })`
          );
        } else if (["between", "notBetween"].includes(operator)) {
          if (operator === "notBetween") {
            returnValues.push(
              `!(${prefix}${join_operator[expression]}${fieldName} >= ${fieldValue} ${map_type["and"]} ${prefix}${join_operator[expression]}${fieldName} <= ${fieldValue2})`
            );
          }
          returnValues.push(
            `(${prefix}${join_operator[expression]}${fieldName} >= ${fieldValue} ${map_type["and"]} ${prefix}${join_operator[expression]}${fieldName} <= ${fieldValue2})`
          );
        } else if (["isNotNull", "isNull"].includes(operator)) {
          returnValues.push(
            `${prefix}${join_operator[expression]}${fieldName} ${map_operators[operator]}`
          );
        } else if (["isTrue", "isFalse"].includes(operator)) {
          const value = operator === "isTrue" ? true : false;
          returnValues.push(
            `${prefix}${join_operator[expression]}${fieldName} ${map_operators[operator]} ${value}`
          );
        } else if (["like", "notLike"].includes(operator)) {
          returnValues.push(
            `${operator === "notLike" ? "!" : ""}${prefix}${
              join_operator[expression]
            }${fieldName}${join_operator[expression]}${
              map_operators[operator]
            }(${fieldValue})`
          );
        } else {
          let value =
            typeof fieldValue === "object" && fieldValue
              ? `'${jsStringEscape(
                  fieldValue[targetName] ||
                    fieldValue["fullName"] ||
                    fieldValue["name"] ||
                    ""
                )}'`
                ? `'${jsStringEscape(
                    fieldValue[targetName] ||
                      fieldValue["fullName"] ||
                      fieldValue["name"] ||
                      ""
                  )}'`
                : fieldValue["name"]
              : fieldValue;
          returnValues.push(
            type === "button"
              ? `${fieldName} ${map_operators[operator]} ${value}`
              : `${prefix}${join_operator[expression]}${
                  type === "many_to_one" || type === "json_many_to_one"
                    ? `${fieldName}${join_operator[expression]}${
                        field.targetName || "fullName"
                      }`
                    : fieldName
                } ${map_operators[operator]} ${value}`
          );
        }
      }
    }
    return returnValues;
  }

  function getBPMCondition(rules, modalName, parentCount = 0) {
    const isBPM = isBPMQuery(parentType);
    const prefix = isBPM ? "self" : modalName;
    const map_operators = map_operator[isBPM ? "BPM" : expression];
    let count = parentCount;
    const returnValues = [];
    for (let i = 0; i < (rules && rules.length); i++) {
      const rule = rules[i];
      const { fieldName, field = {}, operator, allField } = rule;
      const { targetName, selectionList, model, target, jsonField } =
        field || {};
      const type = field && field.type && field.type.toLowerCase();
      const isNumber = [
        "long",
        "integer",
        "double",
        "decimal",
        "boolean",
      ].includes(type);
      const isDateTime = ["date", "time", "datetime"].includes(type);
      let isJsonField =
        model === "com.axelor.meta.db.MetaJsonRecord" ||
        target === "com.axelor.meta.db.MetaJsonRecord" ||
        jsonField;
      let parentCustomField;
      const values = fieldName && fieldName.split(join_operator[expression]);
      if (!isJsonField && values && values.length > 1) {
        values.forEach((name) => {
          let value =
            allField &&
            allField.find(
              (field) =>
                field.name === name &&
                (field.model === "com.axelor.meta.db.MetaJsonRecord" ||
                  field.target === "com.axelor.meta.db.MetaJsonRecord" ||
                  field.jsonField)
            );
          if (value) {
            isJsonField = true;
            parentCustomField = value;
          }
        });
      }
      const jsonFieldName = isJsonField
        ? `${getJsonExpression(
            parentCustomField
              ? {
                  ...parentCustomField,
                  targetName: field && field.targetName,
                }
              : field,
            prefix,
            fieldName
          )}`
        : undefined;
      let { fieldValue, fieldValue2, isRelationalValue } = rule || {};
      if (isNumber && !selectionList && !isRelationalValue) {
        if (!fieldValue) {
          fieldValue = 0;
        }
        if (["between", "notBetween"].includes(operator) && !fieldValue2) {
          fieldValue2 = 0;
        }
      }
      const fValue = isNaN(fieldValue) ? fieldValue : `${fieldValue}`;
      if (
        operator === "" ||
        (selectionList && !fieldValue) ||
        (isNumber && isRelationalValue && !fieldValue) ||
        (((!isNumber && !fieldValue) ||
          (fieldValue && fieldValue.length <= 0) ||
          ((!fieldValue2 || (fieldValue2 && fieldValue2.length <= 0)) &&
            ["between", "notBetween"].includes(operator))) &&
          !["isNull", "isNotNull", "isTrue", "isFalse"].includes(operator))
      ) {
        break;
      }
      const isRelatedModalSame = false;
      const isRelatedElseModalSame = false;
      if (!["isNotNull", "isNull"].includes(operator) && !isRelatedModalSame) {
        ++count;
      }
      if (!fieldName) {
        break;
      }

      if (isEmpty(fValue)) {
        if (!["isNull", "isNotNull", "isTrue", "isFalse"].includes(operator)) {
          break;
        }
      }

      if (!isRelationalValue && !isNumber && typeof fieldValue !== "object") {
        fieldValue = `'${jsStringEscape(fieldValue)}'`;
        fieldValue2 = `'${jsStringEscape(fieldValue2)}'`;
      }

      if (isDateTime) {
        if (!isRelationalValue) {
          fieldValue = getDateTimeValue(type, fieldValue, isJsonField);
          fieldValue2 = getDateTimeValue(type, fieldValue2, isJsonField);
        }
      }

      const map_type = isBPM ? map_bpm_combinator : map_combinator;
      if (["in", "notIn"].includes(operator)) {
        const value =
          rule &&
          rule.fieldValue &&
          rule.fieldValue
            .map((f) =>
              isNumber
                ? `${f["targetName"] || f["fullName"] || f["name"]}`
                : `'${f["targetName"] || f["fullName"] || f["name"]}'`
            )
            .filter((f) => f !== "");
        returnValues.push({
          condition: `${
            jsonFieldName
              ? jsonFieldName
              : `${prefix}.${fieldName}${
                  selectionList ? "" : `.${targetName || "fullName"}`
                }`
          } ${map_operators[operator]} ${
            isRelatedModalSame ? fieldValue : `?${count}`
          }`,
          values: isRelatedModalSame ? undefined : [[value]],
        });
      } else if (["between", "notBetween"].includes(operator)) {
        let values =
          isRelatedModalSame && isRelatedElseModalSame
            ? undefined
            : isRelatedModalSame
            ? [fieldValue2]
            : isRelatedElseModalSame
            ? [fieldValue]
            : [fieldValue, fieldValue2];
        if (isDateTime && isBPM) {
          if (operator === "notBetween") {
            returnValues.push({
              condition: `${
                jsonFieldName ? jsonFieldName : `${prefix}.${fieldName}`
              } NOT BETWEEN ${isRelatedModalSame ? fieldValue : `?${count}`} ${
                map_type["and"]
              } ${isRelatedElseModalSame ? fieldValue2 : `?${++count}`}`,
              values,
            });
          }
          returnValues.push({
            condition: `${
              jsonFieldName ? jsonFieldName : `${prefix}.${fieldName}`
            } BETWEEN ${isRelatedModalSame ? fieldValue : `?${count}`} ${
              map_type["and"]
            } ${isRelatedElseModalSame ? fieldValue2 : `?${++count}`}`,
            values,
          });
        } else {
          if (operator === "notBetween") {
            returnValues.push({
              condition: `NOT (${
                jsonFieldName ? jsonFieldName : `${prefix}.${fieldName}`
              } >= ${isRelatedModalSame ? fieldValue : `?${count}`} ${
                map_type["and"]
              } ${
                jsonFieldName ? jsonFieldName : `${prefix}.${fieldName}`
              } <= ${isRelatedElseModalSame ? fieldValue2 : `?${++count}`})`,
              values,
            });
          }
          returnValues.push({
            condition: `(${
              jsonFieldName ? jsonFieldName : `${prefix}.${fieldName}`
            } >= ${isRelatedModalSame ? fieldValue : `?${count}`} ${
              map_type["and"]
            } ${jsonFieldName ? jsonFieldName : `${prefix}.${fieldName}`} <= ${
              isRelatedElseModalSame ? fieldValue2 : `?${++count}`
            })`,
            values,
          });
        }
      } else if (["isNotNull", "isNull"].includes(operator)) {
        returnValues.push({
          condition: `${
            jsonFieldName ? jsonFieldName : `${prefix}.${fieldName}`
          } ${map_operators[operator]}`,
        });
      } else if (["isTrue", "isFalse"].includes(operator)) {
        //Remove param
        --count;
        const value = operator === "isTrue" ? true : false;
        returnValues.push({
          condition: `${
            jsonFieldName ? jsonFieldName : `${prefix}.${fieldName}`
          } ${map_operators[operator]} ${value}`,
          values: undefined,
        });
      } else if (["contains", "notContains"].includes(operator)) {
        let value =
          typeof fieldValue === "object" && fieldValue
            ? `'${jsStringEscape(fieldValue[field.targetName] || "")}'`
              ? `'${jsStringEscape(fieldValue[field.targetName] || "")}'`
              : fieldValue["name"]
            : fieldValue;

        returnValues.push({
          condition: `${isRelatedModalSame ? fieldValue : `?${count}`} ${
            map_operators[operator]
          } ${jsonFieldName ? jsonFieldName : `${prefix}.${fieldName}`}`,
          values: isRelatedModalSame ? undefined : [value],
        });
      } else {
        let value =
          typeof fieldValue === "object" && fieldValue
            ? `'${jsStringEscape(fieldValue[field.targetName] || "")}'`
              ? `'${jsStringEscape(fieldValue[field.targetName] || "")}'`
              : fieldValue["name"]
            : fieldValue;

        returnValues.push({
          condition: `${
            jsonFieldName
              ? jsonFieldName
              : `${prefix}.${
                  [
                    "many_to_one",
                    "json_many_to_one",
                    "one_to_one",
                    "json_one_to_one",
                  ].includes(type) && !isRelationalValue
                    ? `${fieldName}.${field.targetName || "fullName"}`
                    : fieldName
                }`
          } ${map_operators[operator]} ${
            isRelatedModalSame
              ? ["like", "notLike"].includes(operator)
                ? `CONCAT('%',${fieldValue},'%')`
                : fieldValue
              : ["like", "notLike"].includes(operator)
              ? `CONCAT('%',?${count},'%')`
              : `?${count}`
          }`,
          values: isRelatedModalSame ? undefined : [value],
        });
      }
    }
    return returnValues;
  }

  function getBPMCriteria(rule, modalName, isChildren, count = 0) {
    const {
      rules,
      combinator = "and",
      children,
      parentId,
    } = (rule && rule[0]) || {};
    const allConditions = getBPMCondition(rules, modalName, count);
    const condition = allConditions && allConditions.filter((f) => f);
    const childrenConditions = [];
    children &&
      children.length > 0 &&
      children.forEach((child) => {
        const parentValues =
          (condition &&
            condition.map((co) => co && co.values).filter((f) => f)) ||
          [];
        const childrenValues =
          (childrenConditions &&
            childrenConditions.map((co) => co && co.values).filter((f) => f)) ||
          [];
        const { condition: conditions, values } =
          getBPMCriteria(
            [child],
            modalName,
            true,
            (parentValues && parentValues.length) +
              (childrenValues && childrenValues.length)
          ) || {};
        const newValues = [].concat.apply([], values);
        childrenConditions.push({
          condition: conditions,
          values: newValues && newValues.length > 0 ? newValues : undefined,
        });
      });
    const map_type = isBPMQuery(parentType)
      ? map_bpm_combinator
      : map_combinator;
    const conditions = condition && condition.map((co) => co && co.condition);
    const c = conditions && conditions.filter((val) => val !== null);
    const childConditions =
      childrenConditions &&
      (childrenConditions.map((co) => co && co.condition) || []).filter(
        (f) => f
      );
    const childValues =
      childrenConditions && childrenConditions.filter((val) => val !== null);

    if (parentId === -1 && children.length > 0) {
      let isChild = childConditions && childConditions.length !== 0;
      return {
        condition: `${isChild ? "( " : ""}(${
          c ? c.join(" " + map_type[combinator] + " ") : ""
        } ${
          isChild
            ? ` ${map_type[combinator]} ${childConditions.join(
                " " + map_type[combinator] + " "
              )}`
            : ""
        })${isChild ? " )" : ""}`,
        values: [
          ...((condition &&
            condition.map((co) => co && co.values).filter((f) => f)) ||
            []),
          ...((childValues &&
            childValues.map((co) => co && co.values).filter((f) => f)) ||
            []),
        ],
      };
    } else if (isChildren && condition && c && c.length !== 0) {
      return {
        condition: `(${c.join(" " + map_type[combinator] + " ")})`,
        values:
          condition && condition.map((co) => co && co.values).filter((f) => f),
      };
    } else if (c && c.length !== 0) {
      return {
        condition: `${c.join(" " + map_type[combinator] + " ")}`,
        values:
          condition && condition.map((co) => co && co.values).filter((f) => f),
      };
    }
  }

  function getCriteria(rule, modalName, isChildren) {
    const { rules, combinator = "and", children, parentId } = rule[0];
    const conditions = getCondition(rules, modalName);
    const condition = conditions && conditions.filter((f) => f !== "");
    const childrenConditions = [];
    children &&
      children.length > 0 &&
      children.forEach((child) => {
        const conditions = getCriteria([child], modalName, true);
        if (conditions) {
          childrenConditions.push(conditions);
        }
      });
    const map_type = isBPMQuery(parentType)
      ? map_bpm_combinator
      : map_combinator;

    if (
      parentId === -1 &&
      children.length > 0 &&
      condition &&
      condition.length > 0
    ) {
      let isChild = childrenConditions && childrenConditions.length !== 0;
      return `${isChild ? "( " : ""}(${
        condition ? condition.join(" " + map_type[combinator] + " ") : ""
      } ${
        isChild
          ? ` ${map_type[combinator]} ${childrenConditions.join(
              " " + map_type[combinator] + " "
            )}`
          : ""
      })${isChild ? ")" : ""}`;
    } else if (isChildren && condition && condition.length > 0) {
      return " (" + condition.join(" " + map_type[combinator] + " ") + ") ";
    } else if (condition && condition.length > 0) {
      return condition.join(" " + map_type[combinator] + " ");
    }
  }

  const checkValidation = () => {
    let isValid = true;
    const nodes = [];
    for (
      let i = 0;
      i < (expressionComponents && expressionComponents.length);
      i++
    ) {
      const component = expressionComponents[i];
      const { value } = component;
      const { rules, metaModals } = value || {};
      if (!metaModals) {
        return isValid;
      }
      nodes.push(rules);
    }
    const parentNodes = _.flattenDeep(nodes || []);
    const rules = parentNodes && parentNodes.map((n) => n.rules);
    const allRules = _.flattenDeep(rules || []);
    for (let i = 0; i < (allRules && allRules.length); i++) {
      const rule = allRules && allRules[i];
      const { fieldName: propFieldName, field = {}, operator } = rule || {};
      const { selectionList } = field || {};
      const type = field && field.type && field.type.toLowerCase();
      const isNumber = [
        "long",
        "integer",
        "decimal",
        "boolean",
        "button",
        "double",
      ].includes(type);
      let { fieldValue, fieldValue2, isRelationalValue } = rule;
      let fieldName = propFieldName;
      if (isNumber && !selectionList && !isRelationalValue) {
        if (!fieldValue && fieldValue !== false) {
          fieldValue = 0;
        }
        if (["between", "notBetween"].includes(operator) && !fieldValue2) {
          fieldValue2 = 0;
        }
      }
      const fValue = isNaN(fieldValue) ? fieldValue : `${fieldValue}`;
      if (!fieldName && !isBPMQuery(parentType)) {
        isValid = false;
        break;
      }
      if (isEmpty(fValue) && fieldName) {
        if (!["isNull", "isNotNull", "isTrue", "isFalse"].includes(operator)) {
          isValid = false;
          break;
        }
      }
      if (
        fieldName &&
        (operator === "" ||
          (selectionList && !fieldValue) ||
          (isNumber && isRelationalValue && !fieldValue) ||
          (((!isNumber && !fieldValue) ||
            (fieldValue && fieldValue.length <= 0) ||
            ((!fieldValue2 || (fieldValue2 && fieldValue2.length <= 0)) &&
              ["between", "notBetween"].includes(operator))) &&
            !["isNull", "isNotNull", "isTrue", "isFalse"].includes(operator)))
      ) {
        isValid = false;
        break;
      }
    }
    return isValid;
  };

  function getListOfTree(list) {
    var map = {},
      node,
      roots = [];
    const rules = list.map((item, index) => {
      map[item.id] = index;
      return { ...item, children: [] };
    });
    for (let i = 0; i < rules.length; i += 1) {
      node = rules[i];
      if (node.parentId >= 0) {
        rules[map[node.parentId]] &&
          rules[map[node.parentId]].children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }

  const onChange = React.useCallback(function onChange(value, index) {
    setExpressionComponents(
      produce((draft) => {
        draft[index].value = value;
      })
    );
  }, []);

  function generateExpressionValues() {
    const expressionValues = [];
    expressionComponents &&
      expressionComponents.forEach(({ value }) => {
        const { rules, metaModals } = value || {};
        const modalName = metaModals && metaModals.name;
        if (metaModals) {
          expressionValues.push({
            metaModalName: modalName,
            metaModalType: metaModals && metaModals.type,
            rules,
            generateWithId,
          });
        }
      });
    return expressionValues;
  }

  function generateExpression(combinator, type) {
    const expressionValues = [];
    let vals = [];
    const isValid = checkValidation();
    if (!isValid) {
      setAlert(true);
      setAlertConfig({
        alertMessage: "Add all values",
        alertTitle: "Error",
      });
      return;
    }
    const expressions = [];

    for (let i = 0; i < expressionComponents.length; i++) {
      const component = expressionComponents[i];
      const { value } = component;
      const { rules, metaModals } = value;

      const modalName =
        metaModals && metaModals.type === "dmnModel"
          ? metaModals.resultVariable
          : metaModals && metaModals.name;
      let str = "";
      const listOfTree = getListOfTree(rules);
      const criteria = isBPMQuery(type)
        ? getBPMCriteria(listOfTree, lowerCaseFirstLetter(modalName), undefined)
        : getCriteria(listOfTree, lowerCaseFirstLetter(modalName), undefined);
      vals.push(
        ...((criteria &&
          ((criteria.values || []).filter((f) => Array.isArray(f)) || [])) ||
          [])
      );
      if (metaModals) {
        if (isBPMQuery(type) && criteria && criteria.condition) {
          str += criteria.condition;
        } else if (criteria) {
          str += criteria;
        }
      } else {
        break;
      }
      let expressionValue = {
        metaModalName: modalName,
        metaModalType: metaModals.type,
        rules,
        generateWithId,
      };
      if (metaModals && metaModals.type === "dmnModel") {
        expressionValue.decisionId = metaModals.decisionId;
        expressionValue.dmnNodeId = metaModals.dmnNodeId;
      }
      expressionValues.push(expressionValue);
      if (str) {
        expressions.push(`${str}`);
      }
    }

    const map_type = isBPMQuery(parentType)
      ? map_bpm_combinator
      : map_combinator;

    const str = expressions
      .filter((e) => e !== "")
      .map((e) => (expressions.length > 1 ? `(${e})` : e))
      .join(" " + map_type[combinator] + " ");

    let expr = str;
    if (isBPMQuery(type)) {
      let parameters = "";
      vals &&
        vals.forEach((v) => {
          if (v && Array.isArray(v[0]) && v[0]) {
            parameters = parameters + `, [${v[0]}]`;
          } else {
            if (v && Array.isArray(v) && v.length > 0) {
              v = v.join(", ");
            }
            parameters = parameters + ", " + v;
          }
        });

      expr = str
        ? `"${str}"${vals && vals.length > 0 ? `${parameters}` : ``}`
        : undefined;
    }

    if (isValid) {
      setProperty({
        expression: expr,
        value:
          expressionValues && expressionValues.length > 0
            ? JSON.stringify(expressionValues)
            : undefined,
        combinator,
      });
      handleClose();
    }
  }

  useEffect(() => {
    let isSubscribed = true;
    async function fetchValue() {
      const { values, combinator } = getExpression() || {};
      const expressionComponents = [];
      setInitialValues(values);
      if (!values || values.length === 0) {
        setExpressionComponents([
          {
            Component: ExpressionComponent,
            value: undefined,
          },
        ]);
        return;
      }
      for (let i = 0; i < values.length; i++) {
        const ele = values[i];
        const {
          metaModalName,
          decisionId,
          dmnNodeId,
          metaModalType,
          generateWithId,
        } = ele;
        if (metaModalType === "dmnModel") {
          if (!decisionId) return;
          const dmnTables = await getDMNModels([
            {
              fieldName: "decisionId",
              operator: "=",
              value: decisionId,
            },
          ]);
          if (!dmnTables || !bpmnModeler) return;
          const elementRegistry = bpmnModeler.get("elementRegistry");
          const element =
            elementRegistry &&
            elementRegistry.find((el) => el.id === dmnNodeId);
          const value = {
            metaModals: dmnTables && {
              ...dmnTables[0],
              dmnNodeId: element && element.id,
              dmnNodeNameId:
                element &&
                element.businessObject &&
                element.businessObject.name,
              resultVariable:
                element &&
                element.businessObject &&
                element.businessObject.resultVariable,
              type: "dmnModel",
            },
            rules: ele.rules,
          };
          expressionComponents.push({
            Component: ExpressionComponent,
            value,
          });
        } else {
          const criteria = {
            criteria: [
              {
                fieldName: "name",
                operator: "=",
                value: metaModalName,
              },
            ],
            operator: "and",
          };
          const metaModels = await getModels(criteria, metaModalType);
          if (!metaModels) return;
          const value = {
            metaModals: metaModels && metaModels[0],
            rules: ele.rules,
          };
          expressionComponents.push({
            Component: ExpressionComponent,
            value,
          });
        }
        setGenerateWithId(generateWithId);
      }
      if (isSubscribed) {
        setExpressionComponents(expressionComponents);
        setCombinator(combinator || "and");
      }
    }
    fetchValue();
    return () => (isSubscribed = false);
  }, [getExpression, parentType, bpmnModeler]);

  return (
    <Dialog
      onClose={(event, reason) => {
        if (reason !== "backdropClick") {
          handleClose();
        }
      }}
      aria-labelledby="simple-dialog-title"
      open={open}
      classes={{
        paper: classes.dialogPaper,
      }}
    >
      <DialogTitle id="simple-dialog-title">{translate(title)}</DialogTitle>
      <div className={classes.root}>
        <Paper variant="outlined" className={classes.paper}>
          <div
            style={{
              height: "100%",
              width: "100%",
            }}
          >
            <div className={classes.expression}>
              {!isBPMQuery(parentType) && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={generateWithId}
                      onChange={(e) => setGenerateWithId(e.target.checked)}
                      name="generateWithId"
                      className={classes.checkbox}
                    />
                  }
                  style={{ color: "#0275d8", padding: "0px 15px" }}
                  label={translate("Generate with saved record")}
                />
              )}
              <Timeline
                align="alternate"
                className={classes.timeline}
                style={{
                  border:
                    expression === "BPM"
                      ? "none"
                      : "1px solid rgba(0, 0, 0, 0.12)",
                }}
              >
                {isBPMQuery(parentType) ? (
                  <TimelineItem
                    className={classes.timelineItem}
                    style={{
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                      }}
                    >
                      {expressionComponents &&
                        expressionComponents.map(
                          ({ Component, value }, index) => {
                            return (
                              <div
                                className={classes.expressionContainer}
                                key={index}
                              >
                                <Component
                                  value={value}
                                  index={index}
                                  setValue={onChange}
                                  element={element}
                                  type={parentType}
                                  processConfigs={processConfigs}
                                  isAllowButtons={isAllowButtons}
                                  allowAllModels={allowAllModels}
                                  bpmnModeler={bpmnModeler}
                                  defaultModel={defaultModel}
                                />
                              </div>
                            );
                          }
                        )}
                    </div>
                  </TimelineItem>
                ) : (
                  <TimelineItem style={{ minHeight: "100%", width: "89%" }}>
                    <TimelineOppositeContent
                      className={classes.timelineOppositeContent}
                      style={{ paddingLeft: 16 }}
                    >
                      <Select
                        name="expression"
                        options={combinators}
                        value={combinator || "and"}
                        disableUnderline={true}
                        className={classes.combinator}
                        onChange={(value) => {
                          setCombinator(value);
                        }}
                      />
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot
                        variant="outlined"
                        style={{ borderColor: "#0275d8" }}
                      />
                      <TimelineConnector
                        className={classes.timelineConnector}
                      />
                    </TimelineSeparator>
                    <TimelineContent style={{ width: "100%" }}>
                      <Button
                        title="Add expression"
                        Icon={AddIcon}
                        onClick={() => onAddExpressionEditor()}
                      />
                      <div>
                        {expressionComponents &&
                          expressionComponents.map(
                            ({ Component, value }, index) => {
                              return (
                                <div
                                  className={classes.expressionContainer}
                                  key={index}
                                >
                                  <Component
                                    value={value}
                                    index={index}
                                    setValue={onChange}
                                    element={element}
                                    type={parentType}
                                    processConfigs={processConfigs}
                                    isAllowButtons={isAllowButtons}
                                    allowAllModels={allowAllModels}
                                    bpmnModeler={bpmnModeler}
                                    defaultModel={defaultModel}
                                  />
                                  {!isBPMQuery(parentType) && (
                                    <Button
                                      Icon={DeleteIcon}
                                      onClick={() =>
                                        onRemoveExpressionEditor(index)
                                      }
                                    />
                                  )}
                                </div>
                              );
                            }
                          )}
                      </div>
                    </TimelineContent>
                  </TimelineItem>
                )}
              </Timeline>
            </div>
          </div>
        </Paper>
        <div>
          <Button
            title="OK"
            className={classes.save}
            onClick={() => generateExpression(combinator, parentType)}
          />
          <Button title="Cancel" className={classes.save} onClick={onCancel} />
        </div>
      </div>
      {openAlert && (
        <Dialog
          open={openAlert}
          onClose={(event, reason) => {
            if (reason !== "backdropClick") {
              setAlert(false);
            }
          }}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          classes={{
            paper: classes.dialog,
          }}
        >
          <DialogTitle id="alert-dialog-title">
            {translate(alertConfig.alertTitle)}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {translate(alertConfig.alertMessage)}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <MaterialButton
              onClick={() => {
                setAlert(false);
                if (isClose) {
                  handleClose();
                }
              }}
              color="primary"
              autoFocus
              className={classes.save}
            >
              {translate("OK")}
            </MaterialButton>
            <MaterialButton
              onClick={() => {
                setAlert(false);
              }}
              color="primary"
              autoFocus
              style={{ textTransform: "none" }}
              className={classes.save}
            >
              {translate("Cancel")}
            </MaterialButton>
          </DialogActions>
        </Dialog>
      )}
    </Dialog>
  );
}

export default ExpressionBuilder;
