import React from "react";

export function useDebounce(cb, duration) {
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

export function isBPMQuery(type) {
  return type === "bpmQuery" ? true : false;
}

export function lowerCaseFirstLetter(str) {
  if (!str) return;
  return str.charAt(0).toLowerCase() + str.slice(1);
}

export function upperCaseFirstLetter(str) {
  if (!str) return;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getBO(bo) {
  if (
    bo &&
    (bo.$type === "bpmn:SubProcess" || bo.$type === "bpmn:Transaction")
  ) {
    return getBO(bo.$parent);
  }
  return bo;
}

export const getJsonExpression = (field, prefix, fieldName) => {
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

export const join_operator = {
  JS: ".",
  GROOVY: "?.",
  BPM: ".",
};
