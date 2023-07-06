import {getAllRequest, getApps} from '../services/api';

export const tabPropertyAuth = [
  {
    type: 'bpmn:Process-action',
    properties: [
      {name: 'name', label: 'Name', widget: 'textField'},
      {name: 'studioApp', label: 'App', widget: 'many-to-one', edit:false , onchange:false ,fetchMethod: () => getApps()},
      {
        name: 'type',
        label: 'Auth Type',
        widget: 'selectBox',
        emptyParameter: false,
        selectOptions: [
          {name: 'Basic', default: 'basic', value: 'basic'},
          {name: 'Qauth 2', default: 'ouath2', value: 'oauth2'},
        ],
      },
      {
        name: 'Standard',
        label: 'standard',
        widget: 'checkbox',
      },
      {
        name: 'isAuthenticated',
        label: '',
        widget: 'authentificationAction',
      },
    ],
  },
  {
    type: 'bpmn:Task',
    properties: [
      {name: 'name', label: 'Name', widget: 'textField'},
      {
        name: 'authRequest',
        isAttr: true,
        label: 'Auth request',
        widget: 'many-to-one',
        onchange:false,
        fetchMethod: () => getAllRequest(),
      },
      {
        name: 'responseType',
        label: 'Response Type',
        widget: 'selectBox',
        emptyParameter: false,
        selectOptions: [
          {name: 'Cookie', default: 'coockie', value: 'coockie'},
          {name: 'Jeton', default: 'jeton', value: 'token'},
        ],
      },
      {name: 'tokenName', label: 'Token Name', widget: 'textField'},
    ],
  },
  {
    type: 'bpmn:Mapper',
    properties: [
      {name: 'name', label: 'Name', widget: 'textField'},
      {name: 'expression', label: 'Expression', widget: 'textField'}
    ],
  },
  {
    type: 'label',
    properties: [{name: 'name', label: 'Name', widget: 'textBox'}],
  },
];
