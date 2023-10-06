const selectWidget = [
  "NavSelect",
  "CheckboxSelect",
  "RadioSelect",
  "MultiSelect",
  "ImageSelect",
]
const data = {
  boolean: [
    "InlineCheckbox",
    "Toggle",
    "BooleanSelect",
    "BooleanRadio",
    "BooleanSwitch",
    ...selectWidget,
  ],
  integer: [
    "RelativeTime",
    "Duration",
    "Progress",
    "SelectProgress",
    ...selectWidget,
  ],
  string: [
    "Email",
    "Url",
    "Password",
    "Html",
    "CodeEditor",
    "ImageLine",
    ...selectWidget,
  ],
  text: ["Html", "CodeEditor", ...selectWidget],
  "many-to-one": ["SuggestBox", "Image", "binary-link"],
  "json-many-to-one": ["SuggestBox", "Image", "binary-link"],
  "one-to-one": ["SuggestBox", "Image"],
  "json-one-to-one": ["SuggestBox", "Image"],
  "many-to-many": ["TagSelect"],
  "json-many-to-many": ["TagSelect"],
  binary: ["Image", "BinaryLink", ...selectWidget],
  date: [...selectWidget],
  datetime: [...selectWidget],
  time: [...selectWidget],
  button: ["Button", "InfoButton", "ToolButton"],
  decimal: [
    "RelativeTime",
    "Duration",
    "Progress",
    "SelectProgress",
    ...selectWidget,
  ],
}

export default data
