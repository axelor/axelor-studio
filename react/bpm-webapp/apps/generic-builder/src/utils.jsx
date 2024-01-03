import React from 'react';

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

function getModelName(str) {
  return str && str.split('.').pop();
}

function translate(str) {
  if (window?.top?.axelor?.i18n.get && typeof str === "string") {
    return window?.top?.axelor?.i18n.get(str);
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

export {
  translate,
  sortBy,
  useDebounce,
  isBPMQuery,
  lowerCaseFirstLetter,
  jsStringEscape,
  getModelName,
  getItemsByType,
  upperCaseFirstLetter,
};
