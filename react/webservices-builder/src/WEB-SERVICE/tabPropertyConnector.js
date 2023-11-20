import {getAllAuthentication, getAllRequest, getApps} from '../services/api';
export const tabPropertyConnector = [
  {
    type: 'bpmn:Process-action',
    properties: [
      {name: 'name', label: 'Name', widget: 'textField'},
      {name: 'app', label: 'App', widget: 'many-to-one', edit:false , onchange:false ,fetchMethod: () => getApps()},
      {name: 'baseUrl', label: 'Base Url', widget: 'textField'},
      {
        name: 'defaultWsAuthenticator',
        isAttr: true,
        label: 'Authentification to use',
        widget: 'many-to-one',
        fetchMethod: () => getAllAuthentication(),
      },
    ],
  },
  {
    type: 'bpmn:Query',
    properties: [
      {name: 'name', label: 'Name', widget: 'textBox'},
      {name: 'target', label: 'Var', widget: 'textField'},
      {
        name: 'extendedQueryProperties',
        label: '',
        widget: 'extendedQueryProperties',
      },
      {
        name: 'returnType',
        label: 'Return type',
        widget: 'selectBox',
        emptyParameter: true,
        selectOptions: [
          {name: 'Map', value: 'MAP'},
          {name: 'Single', value: 'SINGLE'},
          {name: 'Multiple', value: 'MULTIPLE'},
        ],
      },
    ],
  },
  {
    type: 'bpmn:Mapper',
    properties: [
      {
        name: 'authRequest',
        isAttr: true,
        label: 'Request',
        widget: 'many-to-one',
        fetchMethod: () => getAllRequest(),
      },
      {name: 'name', label: 'Name', widget: 'textField', readOnly: true},
      {
        name: 'requestTypeSelect',
        label: 'Type',
        widget: 'selectBox',
        canBeDisabled: true,
        emptyParameter: true,
        selectOptions: [
          {name: 'Post', default: 'Post', value: 'POST'},
          {name: 'Get', value: 'GET'},
          {name: 'Put', value: 'PUT'},
        ],
      },
      {name: 'test', label: '', widget: 'testConnector'},
    ],
  },
  {
    type: 'label',
    properties: [{name: 'name', label: 'Name', widget: 'textBox'}],
  },
  {
    type: 'bpmn:SequenceFlow',
    properties: [{name: 'name', label: 'Name', widget: 'textBox'}],
  },
];
