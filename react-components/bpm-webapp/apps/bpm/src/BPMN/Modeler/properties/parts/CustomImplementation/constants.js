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
