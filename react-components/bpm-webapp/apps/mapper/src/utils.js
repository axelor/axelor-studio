export const excludedFields = [
  'createdBy',
  'createdOn',
  'updatedBy',
  'updatedOn',
  'version',
  'id',
];

export const VALUE_FROM = {
  CONTEXT: 'context',
  SELF: 'self',
  NONE: 'none',
  SOURCE: 'source',
  PARENT: 'parent',
  EXPRESSION: 'expression',
  QUERY: 'query',
  PROCESS: 'process',
  DMN: 'dmn',
};

export function dashToUnderScore(str) {
  return str && str.replace('json-', '').replaceAll('-', '_').toLowerCase();
}

export function lowerCaseFirstLetter(str) {
  return str && str.charAt(0).toLowerCase() + str.slice(1);
}

function getText(key, ...values) {
  const exp = new RegExp(/%\w*/g, 'g');
  if (key.match(exp)) {
    let i = 0;
    key = key.replace(exp, () => values[i++]);
  }
  for (var i = 0; i < values.length; i++) {
    const placeholder = new RegExp('\\{' + i + '\\}', 'g');
    const value = values[i];
    key = key.replace(placeholder, value);
  }
  return key;
}

export function translate(key, ...args) {
  const _t = window._t || window.top._t;
  if (_t && typeof key === 'string') {
    return _t(key, ...args);
  }
  return args.length ? getText(key, ...args) : key;
}

export function sortBy(array = [], key) {
  return array.sort(function (a, b) {
    let x = a[key];
    let y = b[key];
    return x < y ? -1 : x > y ? 1 : 0;
  });
}

export const excludedFieldList = [
  'many_to_many',
  'one_to_many',
  'json_many_to_many',
  'json_one_to_many',
];

export function excludeFields(data, otherFields = []) {
  const getType = (type = '') => type.replace(/-/g, '_').toLowerCase();
  const excludeFieldList = [...excludedFields, ...otherFields];
  const dataList = data.filter(
    (item) => excludeFieldList.indexOf(item.name) === -1
  );
  return dataList.filter((item) => {
    return !excludedFieldList.includes(getType(item.type));
  });
}
