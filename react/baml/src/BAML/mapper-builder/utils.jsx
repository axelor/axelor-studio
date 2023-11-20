import React from "react";
import {
  excludedFields,
  VALUE_FROM,
  ModelType,
  RelationalFieldList,
  DATE_FORMAT,
  excludedRelationalFields,
} from "./constant";
import { getAssignmentJson } from "./generator";
import { fetchFields } from "./services/api";
import moment from "moment";

function useDebounce(cb, duration) {
  const timer = React.useRef(null);

  const clearTimer = () => timer.current && clearTimeout(timer.current);
  const setTimer = (cb) => (timer.current = setTimeout(cb, duration));

  React.useEffect(() => {
    return () => clearTimer();
  }, []);

  return (...args) => {
    clearTimer();
    setTimer(() => cb(...args));
  };
}

function isBPMQuery(type) {
  return type === "bpmQuery" ? true : false;
}

function lowerCaseFirstLetter(str) {
  if (!str) return;
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function upperCaseFirstLetter(str) {
  if (!str) return;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getModelFilter(modelFilter) {
  if (!modelFilter) return null;
  const data = {
    _domain: modelFilter,
  };
  return data;
}

const getJsonExpression = (field, prefix, fieldName) => {
  const { type, jsonField, targetName } = field;
  switch (type) {
    case "text":
    case "string":
    case "date":
    case "datetime":
    case "time":
      return `json_extract_text(${prefix}.${jsonField},'${fieldName}')`;
    case "many-to-one":
    case "json-many-to-one":
    case "many_to_one":
    case "json_many_to_one":
      if (!targetName) {
        return `json_extract_text(${prefix}.${jsonField},'${fieldName}')`;
      }
      return `json_extract_text(${prefix}.${jsonField},'${fieldName}','${targetName}')`;
    case "integer":
      return `json_extract_integer(${prefix}.${jsonField},'${fieldName}')`;
    case "decimal":
      return `json_extract_decimal(${prefix}.${jsonField},'${fieldName}')`;
    case "boolean":
      return `json_extract_boolean(${prefix}.${jsonField},'${fieldName}')`;
    default:
      break;
  }
};

function translate(str) {
  if (window._t && typeof str === "string") {
    return window._t(str);
  }
  return str;
}

function sortBy(array = [], key) {
  return array.sort(function (a, b) {
    let x = a[key];
    let y = b[key];
    return x < y ? -1 : x > y ? 1 : 0;
  });
}

function getBool(val) {
  if (!val) return false;
  return !!JSON.parse(String(val).toLowerCase());
}

function excludeFields(data, otherFields = []) {
  const getType = (type = "") => type.replace(/-/g, "_").toLowerCase();
  const excludeFieldList = [...excludedFields, ...otherFields];
  const dataList = data.filter(
    (item) => excludeFieldList.indexOf(item.name) === -1
  );
  return dataList.filter((item) => {
    return !excludedRelationalFields.includes(getType(item.type));
  });
}

function validate(fields, errors = {}, isRoot = true) {
  const isAvailable = (field) => {
    const { value, contextModel, from } = field;
    if (from === VALUE_FROM.CONTEXT && !contextModel) {
      return false;
    }
    if (!value?.selected?.value) {
      return false;
    }
    return true;
  };

  fields.forEach((field) => {
    if (field.required && !isAvailable(field)) {
      errors[field.dataPath] = "value is required";
    }
    if (field.value && field.value.fields) {
      errors = validate(field.value.fields, errors, false);
    }
  });
  if (isRoot) {
    return { errors, isValid: Object.keys(errors).length === 0 };
  }
  return errors;
}

async function mergeFieldData(jsonData, fields) {
  const newFields = [...fields];
  const json = getAssignmentJson(jsonData);
  const getPath = ({ path, name, type }) => {
    if (path) {
      if (isRelationalField(type)) {
        const lastIndex = path.lastIndexOf(".");
        return lastIndex !== -1 ? path.substring(0, lastIndex) : path;
      }
      return path;
    }
    return name;
  };
  if (json) {
    const jsonKeys = Object.keys(json);
    for (let i = 0; i < jsonKeys.length; i++) {
      const key = jsonKeys[i];

      const object = {};
      const item = jsonData.find((d) => d[key]);
      const keyList = key.split(".");
      const value = json[key];
      if (item && item.other && item.other.subField) {
        const index = newFields.findIndex(
          (elem) => elem.name === keyList[keyList.length - 1]
        );
        if (index !== -1) {
          const field = newFields[index];
          let subFields = await fetchFields({ fullName: field.target });
          subFields = excludeFields(subFields).map((subField) => {
            return { ...subField, path: `${getPath(field)}.${subField.name}` };
          });
          newFields.splice(index + 1, 0, ...subFields);
        }
      }

      if (key && value) {
        const valueList = value.split(".");
        const index = newFields.findIndex((elem) => elem.name === keyList[0]);
        if (index !== -1) {
          const field = newFields[index];
          if (
            !item.other.targetName ||
            (item.other.targetName && keyList.length === 3)
          ) {
            object["subFieldName"] = {
              name: keyList[1],
              type: item.other.subFieldType,
            };
          }
          if (valueList[1]) {
            let contextModel = { name: valueList[0] };
            object["from"] = VALUE_FROM.CONTEXT;
            object["contextModel"] = { name: valueList[0] };
            object["modelSubField"] = { name: valueList[1] };
            if (item && item.other && item.other.modelType === ModelType.META) {
              contextModel = {
                name: upperCaseFirstLetter(valueList[0]),
                fullName: item.other.fullName,
              };
            }
            object["contextModel"] = { ...contextModel };
          } else {
            const fieldIndex = fields.findIndex(
              (field) => field.name === valueList[0]
            );
            if (fieldIndex !== -1) {
              object["from"] = VALUE_FROM.SELF;
              object["selfField"] = valueList[0];
            } else {
              if ((keyList[1] && !object.subFieldName) || keyList[2]) {
                const targetName = item?.other?.targetName || field.targetName;
                object["value"] = { [targetName]: valueList[0] };
              } else {
                object["value"] = valueList[0];
              }
            }
          }
          object["path"] = field.path || key;
          newFields.splice(index, 1, { ...field, ...object });
        }
      }
    }
  }
  return newFields;
}

function getAssignmentFields(jsonData = [], fields) {
  const json = getAssignmentJson(jsonData);
  const newFields = fields.map((field, i) => {
    let key = field.path;
    const object = {};
    const item = jsonData.find((d) => d[key]);
    const keyList = key.split(".");
    const value = json[key];
    if (key && value) {
      const valueList = value.split(".");
      const fieldName = keyList[keyList.length - 1];
      const index = fields.findIndex((elem) => elem.name === fieldName);
      if (index !== -1) {
        const field = fields[index];
        if (valueList[1]) {
          let contextModel = { name: valueList[0] };
          object["from"] = VALUE_FROM.CONTEXT;
          object["contextModel"] = { name: valueList[0] };
          object["modelSubField"] = { name: valueList[1] };
          if (item && item.other && item.other.modelType === ModelType.META) {
            contextModel = {
              name: upperCaseFirstLetter(valueList[0]),
              fullName: item.other.fullName,
            };
          }
          object["contextModel"] = { ...contextModel };
        } else {
          const fieldIndex = fields.findIndex(
            (_field) => _field.name === valueList[0]
          );
          if (fieldIndex !== -1) {
            object["from"] = VALUE_FROM.SELF;
            object["selfField"] = valueList[0];
          } else {
            if (field.targetName) {
              const targetName = item?.other?.targetName || field.targetName;
              object["value"] = { [targetName]: value };
            } else {
              object["value"] = value;
            }
          }
        }
        object["path"] = field.path;
      }
    }
    return { ...field, ...object };
  });
  return newFields;
}

function isRelationalField(type = "") {
  const _type = type.replace(/-/g, "_").toLowerCase();
  return RelationalFieldList.indexOf(_type) !== -1;
}

function generatePath(field) {
  const { targetName } = field;
  let path = field.name;
  if (targetName) {
    path = `${path}.${targetName}`;
  }
  return path;
}

function getDateTimeValue(type, fieldValue, isJsonField = false) {
  if (type === "date") {
    let date = `'${moment(fieldValue, DATE_FORMAT["date"]).format(
      "YYYY-MM-DD"
    )}'`;
    if (isJsonField) {
      return date;
    }
    return `LocalDate.parse(${date})`;
  } else if (type === "datetime") {
    if (isJsonField) {
      return `'${moment(fieldValue, DATE_FORMAT["datetime"]).toISOString()}'`;
    }
    return `LocalDateTime.of(${moment(fieldValue, DATE_FORMAT["datetime"])
      .format("YYYY-M-D-H-m-s")
      .split("-")})`;
  } else {
    let time = `'${moment(fieldValue, DATE_FORMAT["time"]).format(
      "HH:mm:ss"
    )}'`;
    if (isJsonField) {
      return time;
    }
    return `LocalTime.parse(${time})`;
  }
}

const isCustomTarget = (target) =>
  target === "com.axelor.meta.db.MetaJsonRecord";

const dndItemTypes = {
  ROW: "row",
};

export {
  translate,
  sortBy,
  useDebounce,
  isBPMQuery,
  lowerCaseFirstLetter,
  upperCaseFirstLetter,
  getModelFilter,
  getJsonExpression,
  getBool,
  excludeFields,
  validate,
  mergeFieldData,
  isRelationalField,
  getAssignmentFields,
  generatePath,
  getDateTimeValue,
  isCustomTarget,
  dndItemTypes
};
