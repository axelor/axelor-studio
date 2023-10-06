// TYPE define all elements
export const TYPE = {
  panel: "panel",
  tabs: "panel-tabs",
  field: "field",
  dumpField: "dump_field",
  form: "form",
  panelStack: "panel-stack",
  panelDashlet: "panel-dashlet",
  panelRelated: "panel-related",
  panelInclude: "panel-include",
  menu: "menu",
  menuItem: "item",
  divider: "divider",
  menubar: "menubar",
  toolbar: "toolbar",
}

export const ItemTypes = {
  CONTAINER: "panel",
  ROOTCONTAINER: "root-container",
  ITEM: "item",
  DUMMY: "dummy",
}

// FIELD_TYPE define all field types(manage on server end)
export const FIELD_TYPE = {
  string: "string",
  number: "number",
  button: "button",
  spacer: "spacer",
  boolean: "boolean",
  separator: "separator",
  hilite: "hilite",
}

// Panel Container Types
export const PANEL_TYPE = {
  stack: "stack",
  flow: "flow",
  grid: "grid",
  custom: "custom",
}

// contains all unique ids for special widgets
export const IDS = {
  createWidgets: {
    tabs: Symbol(),
    panel: Symbol(),
    field: Symbol(),
  },
  form: -1,
  customForm: -2,
  dumpField: 0,
}

export const relationalFields = {
  OneToMany: "one-to-many",
  ManyToMany: "many-to-many",
  ManyToOne: "many-to-one",
  OneToOne: "one-to-one",
}

export const typeReplacer = {
  include: TYPE.panelInclude,
  MANY_TO_MANY: "many-to-many",
  MANY_TO_ONE: "many-to-one",
  ONE_TO_ONE: "one-to-one",
  ONE_TO_MANY: "one-to-many",
}

export const MODEL_TYPE = {
  BASE: "BASE",
  CUSTOM: "CUSTOM",
}

export const ENTITY_TYPE = {
  META: "META",
}

export const DEFAULT_VALUE = {
  showTitle: true,
  readonly: false,
  required: false,
  hidden: false,
  sidebar: false,
  canCollapse: false,
  stacked: false,
  canMove: false,
  canSearch: false,
  multiline: false,
}

export const DataTypes = [
  "string",
  "integer",
  "decimal",
  "boolean",
  "datetime",
  "date",
  "time",
  "many-to-one",
  "one-to-many",
  "many-to-many",
]

export const conditionProperties = {
  readonlyIf: "readonly",
  requiredIf: "required",
  hideIf: "hidden",
  collapseIf: "canCollapse",
}

export const otherNoQuoteProps = ["value:add", "value:del", "refresh", "active"]

export const ACTIONS = {
  MODEL: 0,
  GLOBAL: 1,
  OTHER: 2,
}

export const SHOW_MORE = "Show more..."

export const WKF_COLORS = [
  { name: "red", title: "Red", color: "#f44336", border: "#fff" },
  { name: "pink", title: "Pink", color: "#e91e63", border: "#fff" },
  { name: "purple", title: "Purple", color: "#9c27b0", border: "#fff" },
  {
    name: "deeppurple",
    title: "Deep Purple",
    color: "#673ab7",
    border: "#fff",
  },
  { name: "indigo", title: "Indigo", color: "#3f51b5", border: "#fff" },
  { name: "blue", title: "Blue", color: "#2196f3", border: "#fff" },
  { name: "lightblue", title: "Light Blue", color: "#03a9f4", border: "#fff" },
  { name: "cyan", title: "Cyan", color: "#00bcd4", border: "#fff" },
  { name: "teal", title: "Teal", color: "#009688", border: "#fff" },
  { name: "green", title: "Green", color: "#4caf50", border: "#fff" },
  {
    name: "lightgreen",
    title: "Light Green",
    color: "#8bc34a",
    border: "black",
  },
  { name: "lime", title: "Lime", color: "#cddc39", border: "black" },
  { name: "yellow", title: "Yellow", color: "#ffeb3b", border: "black" },
  { name: "amber", title: "Amber", color: "#ffc107", border: "black" },
  { name: "orange", title: "Orange", color: "#ff9800", border: "black" },
  {
    name: "deeporange",
    title: "Deep Orange",
    color: "#ff5722",
    border: "#fff",
  },
  { name: "brown", title: "Brown", color: "#795548", border: "#fff" },
  { name: "grey", title: "Grey", color: "#9e9e9e", border: "black" },
  { name: "bluegrey", title: "Blue Grey", color: "#607d8b", border: "#fff" },
  { name: "black", title: "Black", color: "black", border: "#fff" },
  { name: "white", title: "White", color: "whitesmoke", border: "black" },
]
export const HISTORY = {
  CUSTOM: "custom",
  WIDGET: "widget",
}
