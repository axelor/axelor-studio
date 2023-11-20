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
};

export const ModelType = {
  CUSTOM: 'CUSTOM',
  META: 'META',
};

export const RelationalFields = [
  'MANY_TO_MANY',
  'MANY_TO_ONE',
  'ONE_TO_MANY',
  'ONE_TO_ONE',
];

export const DATE_FORMAT = {
  date: "DD/MM/YYYY",
  time: "HH:mm:ss",
  datetime: "DD/MM/YYYY HH:mm",
};

export const RelationalFieldList = [
  'one_to_one',
  'many_to_one',
  'many_to_many',
  'one_to_many',
  'json_one_to_one',
  'json_many_to_one',
  'json_many_to_many',
  'json_one_to_many',
]

export const excludedRelationalFields = [
  'many_to_many',
  'one_to_many',
  'json_many_to_many',
  'json_one_to_many',
]

export const dateTypes = ['date', 'datetime', 'time'];

export const excludedUITypes = ['panel', 'label', 'spacer', 'button'];
