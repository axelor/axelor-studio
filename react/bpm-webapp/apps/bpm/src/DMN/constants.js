import { translate } from "../utils";

const EXPRESSION_LANGUAGE_OPTIONS = [
  {
    name: "FEEL",
    value: "feel",
  },
  {
    name: "Groovy",
    value: "groovy",
  },
  {
    name: "JUEL",
    value: "juel",
  },
  {
    name: "JavaScript",
    value: "javascript",
  },
  {
    name: "Python",
    value: "python",
  },
  {
    name: "JRuby",
    value: "jruby",
  },
];

const TYPES = [
  { name: "string", value: "string" },
  { name: "boolean", value: "boolean" },
  { name: "integer", value: "integer" },
  { name: "long", value: "long" },
  { name: "double", value: "double" },
  { name: "date", value: "date" },
  { name: "datetime", value: "datetime" },
];

const STRING_OPTIONS = [
  { name: translate("Match one"), id: "disjunction" },
  { name: translate("Match none"), id: "negation" },
];

const BOOLEAN_OPTIONS = [
  { name: translate("Yes"), id: "true" },
  { name: translate("No"), id: "false" },
  { name: "-", id: "" },
];

const NUMBER_OPTIONS = [
  {
    name: translate("Comparison"),
    id: "comparison",
  },
  {
    name: translate("Range"),
    id: "range",
  },
];

const COMPARISON_OPTIONS = [
  {
    name: translate("Equals"),
    id: "equals",
  },
  {
    name: translate("Less"),
    id: "less",
  },
  {
    name: translate("Less or equals"),
    id: "lessEquals",
  },
  {
    name: translate("Greater"),
    id: "greater",
  },
  {
    name: translate("Greater or equals"),
    id: "greaterEquals",
  },
];

const RANGE_OPTIONS = [
  {
    name: translate("Include"),
    id: "include",
  },
  {
    name: translate("Exclude"),
    id: "exclude",
  },
];

const DATE_OPTIONS = [
  { name: translate("Exactly"), id: "exact" },
  { name: translate("Before"), id: "before" },
  { name: translate("After"), id: "after" },
  { name: translate("Between"), id: "between" },
];

const RELATIONAL_TYPES = [
  "one_to_one",
  "many_to_one",
  "many_to_many",
  "one_to_many",
  "json_one_to_one",
  "json_many_to_one",
  "json_many_to_many",
  "json_one_to_many",
  "one-to-one",
  "many-to-one",
  "many-to-many",
  "one-to-many",
  "json-one-to-one",
  "json-many-to-one",
  "json-many-to-many",
  "json-one-to-many",
];

const ALL_TYPES = [
  "string",
  "boolean",
  "double",
  "integer",
  "date",
  "datetime",
  "long",
];

const ALLOWED_TYPES = [
  ...ALL_TYPES,
  ...RELATIONAL_TYPES,
  "selection",
  "datetime",
  "time",
  "decimal",
];

const UI_TYPES = ["panel", "label", "spacer", "button"];

export {
  EXPRESSION_LANGUAGE_OPTIONS,
  TYPES,
  STRING_OPTIONS,
  BOOLEAN_OPTIONS,
  COMPARISON_OPTIONS,
  NUMBER_OPTIONS,
  RANGE_OPTIONS,
  DATE_OPTIONS,
  RELATIONAL_TYPES,
  ALL_TYPES,
  ALLOWED_TYPES,
  UI_TYPES,
};
