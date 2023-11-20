import { getAllModels } from "../services/api";
export const tabProperty = [
  {
    type: "bpmn:Process-action",
    properties: [
      { name: "name", label: "Name", widget: "textBox" },
      {
        name: "targetModel",
        isAttr: true,
        type: "String",
        label: "Target model",
        widget: "many-to-one",
        fetchMethod: () => getAllModels(),
      },
      {
        name: "sourceModel",
        isAttr: true,
        type: "String",
        label: "Source model",
        widget: "many-to-one",
        fetchMethod: () => getAllModels(),
      },
    ],
  },
  {
    type: "bpmn:Query",
    properties: [
      { name: "name", label: "Name", widget: "textBox" },
      { name: "target", label: "Var", widget: "textField" },
      {
        name: "extendedQueryProperties",
        label: "",
        widget: "extendedQueryProperties",
      },
      {
        name: "returnType",
        label: "Return type",
        widget: "selectBox",
        emptyParameter: true,
        selectOptions: [
          { name: "Map", value: "MAP" },
          { name: "Single", value: "SINGLE" },
          { name: "Multiple", value: "MULTIPLE" },
        ],
      },
    ],
  },
  {
    type: "bpmn:Conditional",
    properties: [
      { name: "name", label: "Name", widget: "textBox" },
      { name: "expression", label: "Expression", widget: "expressionBuilder" },
    ],
  },
  {
    type: "bpmn:Loop",
    properties: [
      { name: "name", label: "Name", widget: "textBox" },
      { name: "target", label: "Variable", widget: "textField" },
      { name: "expression", label: "Expression", widget: "fieldBuilder" },
    ],
  },
  {
    type: "bpmn:Mapper",
    properties: [
      { name: "name", label: "Name", widget: "textBox" },
      {
        name: "script",
        label: "Script",
        widget: "scriptBox",
      },
    ],
  },
  {
    type: "label",
    properties: [{ name: "name", label: "Name", widget: "textBox" }],
  },
  {
    type: "bpmn:SequenceFlow",
    properties: [{ name: "name", label: "Name", widget: "textBox" }],
  },
];
