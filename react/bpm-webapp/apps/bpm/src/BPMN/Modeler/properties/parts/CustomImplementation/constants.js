export const BOOL_ATTRIBUTES = [
  "readonly",
  "hidden",
  "required",
  "active",
  "collapse",
  "refresh",
];

export const STR_ATTRIBUTES = [
  "readonlyIf",
  "hideIf",
  "requiredIf",
  "collapseIf",
  "title",
  "domain",
  "css",
  "prompt",
  "icon",
  "selection-in",
  "url",
  "url:set",
  "value",
  "value:set",
  "value:add",
  "value:del",
];

export const NUM_ATTRIBUTES = ["precision", "scale"];

export const ALL_ATTRIBUTES = [
  ...BOOL_ATTRIBUTES,
  ...NUM_ATTRIBUTES,
  ...STR_ATTRIBUTES,
];

export const FIELD_ATTRS = {
  panel: [
    "hidden",
    "hideIf",
    "readonly",
    "readonlyIf",
    "collapse",
    "collapseIf",
    "css",
    "icon",
    "title",
    "active",
  ],
  button: [
    "hidden",
    "hideIf",
    "readonly",
    "readonlyIf",
    "prompt",
    "css",
    "icon",
    "title",
  ],
  relational: [
    "hidden",
    "hideIf",
    "required",
    "requiredIf",
    "readonly",
    "readonlyIf",
    "css",
    "title",
    "domain",
    "url:set",
    "value:set",
    "value:add",
    "value:del",
  ],
  self: ["readonly", "readonlyIf"],
  others: [
    "hidden",
    "hideIf",
    "requiredIf",
    "readonly",
    "required",
    "readonlyIf",
    "precision",
    "scale",
    "prompt",
    "css",
    "icon",
    "selection-in",
    "title",
    "active",
    "domain",
    "refresh",
    "url",
    "value",
  ],
};

export const BOOLEAN_OPTIONS = [
  {
    name: "true",
    title: "True",
  },
  {
    name: "false",
    title: "False",
  },
];
