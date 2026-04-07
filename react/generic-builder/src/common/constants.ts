import { translate } from "./utils";

interface NameTitle {
  name: string;
  title: string;
  [key: string]: unknown;
}

const COMBINATOR: NameTitle[] = [
  { name: "and", title: "AND" },
  { name: "or", title: "OR" },
];

const MAP_COMBINATOR: Record<string, string> = {
  and: "&&",
  or: "||",
};

const MAP_BPM_COMBINATOR: Record<string, string> = {
  and: "and",
  or: "or",
};

const JOIN_OPERATOR: Record<string, string> = {
  JS: ".",
  GROOVY: "?.",
  BPM: ".",
};

const DATE_FORMAT: Record<string, string> = {
  date: "DD/MM/YYYY",
  time: "HH:mm:ss",
  datetime: "DD/MM/YYYY HH:mm",
};

const QUERY_CUSTOM_TYPES: string[] = [
  "many_to_many",
  "many-to-many",
  "json_many_to_many",
  "json-many-to-many",
  "one_to_one",
  "one-to-one",
  "json_one_to_one",
  "json-one-to-one",
  "enum",
];

/**
 * Hide m2m fields at the moment
 */
const ALLOWED_TYPES: string[] = [
  "long",
  "decimal",
  "date",
  "time",
  "datetime",
  "enum",
  "text",
  "integer",
  "boolean",
  // "many_to_many",
  // "many-to-many",
  // "json_many_to_many",
  // "json-many-to-many",
  "many_to_one",
  "many-to-one",
  "json_many_to_one",
  "json-many-to-one",
  "one_to_one",
  "one-to-one",
  "json_one_to_one",
  "json-one-to-one",
  "string",
];

const OPERATORS_BY_TYPE: Record<string, string[]> = {
  enum: ["=", "!=", "isNull", "isNotNull"],
  text: ["like", "notLike", "isNull", "isNotNull"],
  integer: ["=", "!=", ">=", "<=", ">", "<", "between", "notBetween", "isNull", "isNotNull"],
  boolean: ["isTrue", "isFalse", "isNull", "isNotNull"],
  button: ["="],
  menu_item: ["="],
};

const addOperatorByType = (keys: string[], value: string[]) =>
  keys.map((key) => (OPERATORS_BY_TYPE[key] = value));

addOperatorByType(["long", "decimal", "date", "time", "datetime"], OPERATORS_BY_TYPE.integer);
addOperatorByType(["one_to_many", "json_one_to_many"], OPERATORS_BY_TYPE.text);
addOperatorByType(
  ["many_to_many", "json_many_to_many"],
  ["in", "notIn", "isNull", "contains", "notContains"],
);
addOperatorByType(
  ["many_to_one", "one_to_one", "json_many_to_one", "json_one_to_one"],
  ["=", "!=", "in", "notIn", "isNull", "isNotNull"],
);

addOperatorByType(["string"], ["=", "!=", "isNull", "isNotNull", "like", "notLike"]);

const MAP_OPERATOR_GROOVY: Record<string, string> = {
  "=": "==",
  "!=": "!=",
  ">": ">",
  ">=": ">=",
  "<": "<",
  "<=": "<=",
  isNotNull: "!= null",
  isNull: "== null",
  isTrue: "==",
  isFalse: "==",
  in: "contains",
  notIn: "contains",
  like: "contains",
  notLike: "contains",
  contains: "contains",
  notContains: "contains",
};

const MAP_OPERATOR_BPM: Record<string, string> = {
  "=": "=",
  "!=": "!=",
  ">": ">",
  ">=": ">=",
  "<": "<",
  "<=": "<=",
  isNotNull: "is NOT NULL",
  isNull: "is NULL",
  isTrue: "is",
  isFalse: "is",
  in: "IN",
  notIn: "NOT IN",
  like: "LIKE",
  notLike: "NOT LIKE",
  contains: "MEMBER OF",
  notContains: "NOT MEMBER OF",
};

const MAP_OPERATOR_JS: Record<string, string> = {
  "=": "===",
  "!=": "!==",
  ">": ">",
  ">=": ">=",
  "<": "<",
  "<=": "<=",
  in: "in",
  notIn: "in",
  like: "LIKE",
  notLike: "NOT LIKE",
  isNotNull: "!== null",
  isNull: "=== null",
  isTrue: "===",
  isFalse: "===",
};

const MAP_OPERATOR: Record<string, Record<string, string>> = {
  JS: MAP_OPERATOR_JS,
  GROOVY: MAP_OPERATOR_GROOVY,
  BPM: MAP_OPERATOR_BPM,
};

const MANY_TO_ONE_TYPES: string[] = [
  "many-to-one",
  "json-many-to-one",
  "many_to_one",
  "json_many_to_one",
];

const RELATIONAL_TYPES: string[] = [
  "many-to-one",
  "one-to-many",
  "one-to-one",
  "many-to-many",
  "json-many-to-one",
  "json-one-to-many",
  "json-one-to-one",
  "json-many-to-many",
];

const OPERATORS: NameTitle[] = [
  { name: "=", title: "equals" },
  { name: "!=", title: "not equal" },
  { name: ">", title: "greater than" },
  { name: ">=", title: "greater or equal" },
  { name: "<", title: "less than" },
  { name: "<=", title: "less or equal" },
  { name: "in", title: "in" },
  { name: "between", title: "between" },
  { name: "notBetween", title: "not Between" },
  { name: "notIn", title: "not in" },
  { name: "isNull", title: "is null" },
  { name: "isNotNull", title: "is not null" },
  { name: "like", title: "contains" },
  { name: "notLike", title: "doesn't contain" },
  { name: "isTrue", title: "is true" },
  { name: "isFalse", title: "is false" },
  { name: "contains", title: "contains" },
  { name: "notContains", title: "not contains" },
];

export const VAR_TYPES = {
  BUILT_IN: "built-in",
  CUSTOM: "custom",
} as const;

export const VAR_OPTIONS = [
  {
    title: translate("Built In Variables"),
    name: "Built In Variables",
    type: VAR_TYPES.BUILT_IN,
  },
  {
    title: translate("Custom Variables"),
    name: "Custom Variables",
    type: VAR_TYPES.CUSTOM,
  },
];

const BUILT_IN_VARIABLES: NameTitle[] = [
  {
    name: "__date__",
    title: translate("Current date"),
  },
  {
    name: "__studiouser__",
    title: translate("Current user"),
  },
  {
    name: "__datetime__",
    title: translate("Current datetime"),
  },
];

const BUTTON_TYPE_OPERATOR: { name: boolean; title: string }[] = [{ name: true, title: "True" }];

export {
  COMBINATOR,
  OPERATORS,
  OPERATORS_BY_TYPE,
  MAP_OPERATOR,
  MAP_COMBINATOR,
  DATE_FORMAT,
  JOIN_OPERATOR,
  MAP_BPM_COMBINATOR,
  ALLOWED_TYPES,
  QUERY_CUSTOM_TYPES,
  MANY_TO_ONE_TYPES,
  RELATIONAL_TYPES,
  BUILT_IN_VARIABLES,
  BUTTON_TYPE_OPERATOR,
};
