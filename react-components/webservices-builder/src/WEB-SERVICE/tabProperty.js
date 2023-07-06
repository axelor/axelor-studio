import { getApps } from "../services/api";

export const tabProperty = [
  {
    type: 'bpmn:Lane',
    properties: [
      {name: 'name', label: 'Name', widget: 'textField'},
      {name: 'expression', label: 'Expression', widget: 'expression'},
    ],
  },
  {
    type: 'bpmn:Participant',
    properties: [
      {name: 'name', label: 'Name', widget: 'textField'},
      {name: 'studioApp', label: 'App', widget: 'many-to-one', edit:false , onchange:false ,fetchMethod: () => getApps(),},
      {name: 'url', label: 'URL', widget: 'textField'},
      {
        name: 'payLoadTypeSelect',
        label: 'Type payload',
        widget: 'selectBox',
        emptyParameter: true,
        selectOptions: [
          {name: 'Form', value: 'form'},
          {name: 'Json', value: 'json'},
          {name: 'Xml', value: 'xml'},
          {name: 'Text', value: 'text'},
          {name: 'File Path', value: 'file'},
          {name: 'File Link', value: 'file-link'},
          {name: 'File Text', value: 'file-text'},
          {name: 'Stream', value: 'stream'},
        ],
      },
      {
        name: 'type',
        label: 'Type',
        widget: 'selectBox',
        emptyParameter: true,
        selectOptions: [
          {name: 'GET',default: 'GET', value: 'GET'},
          {name: 'POST', value: 'POST'},
          {name: 'PUT', value: 'PUT'},
          {name: 'DELETE', value: 'DELETE'},
          {name: 'PATCH', value: 'PATCH'},
        ],
      },
      {name: 'callIf', label: 'Call if', widget: 'scriptBox'},
      {name: 'repeatIf', label: 'Repeat if', widget: 'scriptBox'}
    ],
  },
];

/* {
  name: "typeRequest", label: "Type of Request", widget: "checkBoxs",
  boxs: [
    { name: "classic", label: "Classic", widget: "checkbox" },
    { name: "auth", label: "Authentification", widget: "checkbox" },
    { name: "encryptData", label: "Encrypt data", widget: "checkbox" },
  ]
},*/
