import React from 'react';
import { getModels } from './services/api';

function useDebounce(cb, duration) {
  const timer = React.useRef(null);

  const clearTimer = () => timer.current && clearTimeout(timer.current);
  const setTimer = cb => (timer.current = setTimeout(cb, duration));

  React.useEffect(() => {
    return () => clearTimer();
  }, []);

  return (...args) => {
    clearTimer();
    setTimer(() => cb(...args));
  };
}

function isBPMQuery(type) {
  return type === 'bpmQuery' ? true : false;
}

function lowerCaseFirstLetter(str) {
  if (!str) return;
  return str.charAt(0).toLowerCase() + str.slice(1);
}
function upperCaseFirstLetter(str) {
  if (!str) return;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
const getJsonExpression = (field, prefix, fieldName) => {
  const { type, jsonField } = field;
  switch (type) {
    case 'text':
    case 'string':
    case 'date':
    case 'datetime':
    case 'time':
      return `json_extract_text(${prefix}.${jsonField},'${fieldName}')`;
    case 'many-to-one':
    case 'json-many-to-one':
    case 'many_to_one':
    case 'json_many_to_one':
      return `json_extract_integer(${prefix}.${jsonField},'${field.name}','id')`;
    case 'integer':
      return `json_extract_integer(${prefix}.${jsonField},'${fieldName}')`;
    case 'decimal':
      return `json_extract_decimal(${prefix}.${jsonField},'${fieldName}')`;
    case 'boolean':
      return `json_extract_boolean(${prefix}.${jsonField},'${fieldName}')`;
    default:
      break;
  }
};

function getModelName(str) {
  return str && str.split('.').pop();
}

function translate(str) {
  if (window._t && typeof str === 'string') {
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

function jsStringEscape(string, withParam) {
  return ('' + string).replace(/["'\\\n\r\u2028\u2029]/g, function (character) {
    switch (character) {
      case '"':
      case '\\':
        return '\\' + character;
      case "'":
        if (withParam) {
          return '\\' + character;
        }
        return '\u0022';
      case '\n':
        return '\\n';
      case '\r':
        return '\\r';
      case '\u2028':
        return '\\u2028';
      case '\u2029':
        return '\\u2029';
      default:
        return string;
    }
  });
}

function getItemsByType(view, type) {
  function collectItems(item) {
    const { items = [], jsonFields = [], toolbar = [], menubar = [] } = item;
    const allItems = [...items, ...jsonFields, ...toolbar, ...menubar];
    return allItems.reduce(
      (all, item) => [...all, ...collectItems(item)],
      item.type === type ? [item] : []
    );
  }
  return collectItems(view);
}

function getModelFilter(_domain, { search } = {}) {
  if (!_domain && !search) return null;
  return {
    ...(_domain ? { _domain } : {}),
    ...(search
      ? { criteria: [{ fieldName: 'name', operator: 'like', value: search }] }
      : {}),
  };
}

function useMetaModelSearch(element, type) {
  return React.useCallback(
    data => getModels(getModelFilter(element, data), type),
    [element, type]
  );
}

function getFormName(str) {
  if (!str) return;
  const formString = str.match(/[A-Z][a-z]+/g);
  if (!formString) return;
  if (formString.join('').trim().length !== str.length) {
    return 'fetchAPI';
  }
  const form = formString && formString.join('-');
  return `${form.toLowerCase()}-form`;
}


export {
  translate,
  sortBy,
  useDebounce,
  isBPMQuery,
  lowerCaseFirstLetter,
  getJsonExpression,
  jsStringEscape,
  getModelName,
  getItemsByType,
  upperCaseFirstLetter,
  useMetaModelSearch,
  getFormName,
  getModelFilter
};
