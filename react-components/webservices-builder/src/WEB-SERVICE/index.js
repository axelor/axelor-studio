import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Drawer,
  IconButton,
  Tooltip,
  Box,
  Tabs,
  Tab,
  colors,
  DialogTitle,
  DialogContentText,
  DialogContent,
  Dialog,
  DialogActions,
  Button,
  Snackbar,
} from '@material-ui/core';
import { Resizable } from 're-resizable';
import BpmnModeler from './main/baml-js/lib/Modeler';
import ScriptBox from './views/ScriptBox';
import customControlsModuleRequest from './custom/custom request';
import customControlsModuleAuth from './custom/custom auth';
import ParameterTable from './views/ParameterProps';
import {
  Textbox,
  TextField,
  SelectBox,
  Checkbox,
  Description,
  NewSelect,
} from './components';
import { tabProperty } from './tabProperty';
import { fromPayloadsToPayloads, getGroovyBasicPayload, translate } from '../utils';
import {
  Save,
  Delete,
  AddBox,
  PlayCircleFilled,
  Menu,
  Add,
  Edit,
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import './main/baml-js/assets/diagram-js.css';
import './main/baml-font/css/bpmn.css';
import './css/bpmn.css';
import Expression from './views/Expression';
import { Alert, TabContext, TabPanel } from '@material-ui/lab';
import Checkboxs from './components/CheckBoxs';
import CustomizedTables from './components/Table';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { getChildLanes } from './main/baml-js/lib/features/modeling/util/LaneUtil';
import ReactDOM from 'react-dom';
import { store } from './store';
import { Selection } from './components';
import { tabPropertyAuth } from './tabPropertyAuth';
import { is } from './ModelUtil';
import { FILL_COLORS, STROKE_COLORS } from './constants';
import { tabPropertyConnector } from './tabPropertyConnector';
import AuthentificationField from './views/AuthentificationField';
import TestConnector from './components/TestConnector';
import { addRequest } from './payloads-builder/services/api';
import TextFieldMapper from './components/textBoxMapper';
import JSONFormatter from 'json-formatter-js';
import { updateModelPayload } from './payloads-builder/features/payloadReducer';
import { updateHeader } from './header-builder/features/headerReducer';
import {
  addAuth,
  addConnector,
  autheticate,
  deleteAuth,
  deleteConnector,
  deleteRequest,
  getAllAuthentication,
  getAllConnector,
  getAllRequest,
  getAuthById,
  getConnectorById,
  getkeys,
  getRequestById,
} from '../services/api';
import AuthentificationAction from './components/AuthentificationAction';
import { updateModelParam } from './request-builder/features/requestReducer';
import ContextBuilder from './context-builder/context-builder';
import classNames from 'classnames';
const resizeStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderLeft: "solid 1px #ddd",
  background: "#f0f0f0"
};

const useStyles = makeStyles((theme) => ({
  drawer: {
    width: DRAWER_WIDTH,
    flexShrink: 0,
  },
  drawerPaper: {
    background: "#F8F8F8",
    width: "100%",
    position: "absolute",
    borderLeft: "1px solid #ccc",
    overflow: "auto",
    height: "100%",
  },
  drawerContainer: {
    height: '100%',
    width: '100%',
  },
  nodeTitle: {
    fontSize: '120%',
    fontWeight: 'bolder',
  },
  propertyLable: {
    fontSize: 13,
    fontWeight: 'bolder',
    margin: '10px 0px',
  },
  toolTip: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    '& > p': {
      '@media (max-width: 20px)': {
        display: 'none',
      },
    }
  },
  toolTipFont: {
    fontSize: 10,
    flex: "none",
    paddingLeft: 5,
  },
  save: {
    'margin': theme.spacing(1),
    'backgroundColor': '#0275d8',
    'borderColor': '#0267bf',
    'color': 'white',
    '&:hover': {
      backgroundColor: '#025aa5',
      borderColor: '#014682',
      color: 'white',
    },
  },
  icon: {
    color: 'green',
    width: '1.6em',
    height: '1.2em',
  },
  dialogTitle: {
    'color': '#0274d7',
    'paddingLeft': 0,
    'paddingRight': 3,
    'display': 'flex',
    'flexDirection': 'row',
    'alignItems': 'center',
    '& #simple-dialog-title': {
      cursor: 'pointer',
    },
  },
  btnContainer: {
    border: '1px solid #dcdc',
    background: '#F8F8F8',
    width: '9%',
    minWidth:85
  },
  consoleHeader: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: 5,
    alignItems: 'center',
    backgroundColor: "#424242",
    paddingInline: "inherit",
    borderRadius: '15px 15px 0px 0px'
  },
  copy: {
    'marginLeft': 'auto',
    'backgroundColor': '#025aa5',
    'borderColor': '#0267bf',
    'color': 'white',
    'padding': '2',
    fontSize: 10,
    '&:hover': {
      backgroundColor: '#0267ba',
      borderColor: '#014682',
      color: 'white',
    },
  },
  console: {
    'backgroundColor': '#656565',
    'padding': 10,
    'minHeight': '40%',
    borderRadius: '0px 0px 15px 15px',
    'fontWeight': 'bold !important',
    '& .json-formatter-key': {
      color: '#EBC456 !important',
      marginRight: 5,
    },
    '& .json-formatter-string': {
      color: 'white !important',
    },
    '& .json-formatter-boolean': {
      color: 'white !important',
    },
    '& .json-formatter-number': {
      color: 'white !important',
    },
    '& .json-formatter-function': {
      color: 'white !important',
    },
    '& .json-formatter-row': {
      marginBottom: 8,
    },
  },
  box: {
    '& > div > div > div': {
      borderBottom: '1px solid black',
    },
  },
  saveButtonText: {
    marginLeft: 10,
  },
  saveMessageAlert: {
    width: '100%',
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'space-between',
  },
  paper: {
    margin: theme.spacing(1),
    width: `calc(100% - 16px)`,
    display: 'flex',
    height: 'calc(100% - 50px)',
    overflow: 'hidden',
  },
  dialogPaper: {
    maxWidth: '70%',
    maxHeight: '80%',
    resize: 'both',
    width: '70%',
    height: '90%',
  },
  iconButton: {
    padding: 0,
    paddingLeft: 5,
  },
  iconParams: {
    backgroundColor: '#30363D',
  },
  inputSelect: {
    width: '24%',
    marginLeft: '2%',
    display: 'flex',
    minWidth:250,
    alignItems: 'end',
  },
  tabNav: {
    'marginTop': 20,
    '& .MuiTabs-indicator': {
      display: 'none',
    },
    '& .Mui-selected': {
      backgroundColor: '#E3E3E3',
    },
  },
  messageResponseSuccess: {
    backgroundColor: '#D6E9DC',
    color: '#4f8758',
    padding: 15,
    fontWeight: 'bold',
    borderRadius: 10,
  },
  messageResponseError: {
    backgroundColor: '#D70038',
    color: 'white',
    padding: 15,
    fontWeight: 'bold',
    borderRadius: 10,
  },
  tabPanel: {
    padding: 10,
    backgroundColor: 'rgb(248, 248, 248)',
    height: '100%',
  },
  tabPanelConsole: {
    padding: 10,
    height: '100%',
    borderRadius: "15px"
  },
  tabStyle: {
    border: ' 0.1px solid #ccc !important',
    borderBottom: 'none',
    backgroundColor: "white",
    minHeight: 10,
    width: '33.33%',
    minWidth: '33.33%',
  },
  toolbarButtons: {
    display: 'flex',
    padding: '20px 20px 0px 20px',
    position: 'relative',
    width: '48%',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    "flex-wrap":"wrap",
    width: '100%',
    alignItems:"end",
    margin:5
  },
  active: {
    backgroundColor: '#a3a3a3',
  },
  property: {
    marginBottom: '5%',
  },
}));

const DRAWER_WIDTH = 480;

const REQUEST_XML = `<?xml version="1.0" encoding="UTF-8" ?>
<process-actions 
  xmlns:xs="http://www.w3.org/2001/XMLSchema-instance" 
  xs:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" 
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
  id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn">
  <process-action id="ProcessAction_1">
  </process-action>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</process-actions>`;

const CONNECTOR_XML = `<?xml version="1.0" encoding="UTF-8" ?>
<process-actions 
  xmlns:xs="http://www.w3.org/2001/XMLSchema-instance" 
  xs:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" 
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
  id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn">
  <process-action id="ProcessAction_2">
  </process-action>
  <bpmndi:BPMNDiagram id="BPMNDiagram_2">
    <bpmndi:BPMNPlane id="BPMNPlane_2" bpmnElement="Process_2">
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</process-actions>`;

const AUTH_XML = `<?xml version="1.0" encoding="UTF-8" ?>
<process-actions 
  xmlns:xs="http://www.w3.org/2001/XMLSchema-instance" 
  xs:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" 
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
  id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn">
  <process-action id="ProcessAction_3">
  </process-action>
  <bpmndi:BPMNDiagram id="BPMNDiagram_3">
    <bpmndi:BPMNPlane id="BPMNPlane_3" bpmnElement="Process_3">
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</process-actions>`;
const REQUEST = 1;
const AUTHENTICATION = 2;
const CONNECTOR = 3;

let bpmnModeler = null;
let bpmnModelerAuth = null;
let bpmnModelerConnector = null;
let bpmnModelerGlobal = null;
const MODELS = [
  { name: 'Request', title: 'Request' },
  { name: 'Authentification', title: 'Authentification' },
  { name: 'Connector', title: 'Connector' },
];

function WebServiceEditor() {
  const [width, setWidth] = useState(DRAWER_WIDTH);
  const [height, setHeight] = useState('100%');
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [element, setElement] = useState(null);
  const [model, setModel] = useState( new URLSearchParams(window.location.search).get('model') ?  parseInt(new URLSearchParams(window.location.search).get('model')) : 1);
  const [consoleResponse, setConsole] = useState(null);
  const [request, setRequest] = useState(null);
  const [authRequest, setAuthRequest] = useState(null);
  const [connector, setConnector] = useState(null);
  const [renderComponent,setRenderComponent] = useState(0);
  const formatter = useRef(null);
  const [openSnackbar, setSnackbar] = useState({
    open: false,
    messageType: null,
    message: null,
  });
  const [parametersMenu, showParametersMenu] = useState(false);
  const [openAlert, setAlert] = React.useState({
    state: false,
    action: null,
    alertConfig: {
      alertMessage:
        'Current changes will be lost. Do you really want to proceed?',
      alertTitle: 'New',
    },
  });
  useEffect(()=>{
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get('id');
    const modelFromUrl = searchParams.get('model');

    if(id !== null && modelFromUrl !== null){
      switch(parseInt(modelFromUrl)){
        case REQUEST : getRequest(parseInt(id));break;
        case AUTHENTICATION : getAuth(parseInt(id));
        break;
        default : return;
      }
    }else{

    }
  },[])
  const dispatch = useDispatch();
  const criteriaQuery = useSelector((state) => state.payloadReducer.queryCriteria)
  const modelPayloadsStore = useSelector(
    (state) => state.payloadReducer.modelPayloads,
  );
  const modelParamStore = useSelector(
    (state) => state.requestReducer.modelParameters,
  );
  const headersStore = useSelector((state) => state.headerReducer.headers);
  const classes = useStyles();
  const setCSSWidth = (width) => {
    document.documentElement.style.setProperty(
      '--bpmn-container-width',
      `${width}px`,
    );
    setDrawerOpen(width === '0px' ? false : true);
  };

  const handleSnackbarClick = (messageType, message) => {
    setSnackbar({
      open: true,
      messageType,
      message,
    });
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({
      open: false,
      messageType: null,
      message: null,
    });
  };

  // BPM Build Functions
  const createParticipant = (
    request
  ) => {
    const elementFactory = bpmnModeler.get('elementFactory');
    const elementRegistry = bpmnModeler.get('elementRegistry');
    const modeling = bpmnModeler.get('modeling');
    const definitions = bpmnModeler.getDefinitions();
    const Nelement =
      definitions && definitions.rootElements && definitions.rootElements[0];
    if (!Nelement) return;
    const rootElement = elementRegistry.get(Nelement.id);
    if (!rootElement) return;
    const process = rootElement;
    const participant = elementFactory.createParticipantShape({
      type: 'bpmn:Participant',
    });
    participant.businessObject.name = request?.name;
    participant.businessObject.studioApp = request?.studioApp;
    participant.businessObject.type = request?.requestTypeSelect;
    participant.businessObject.url = request?.wsUrl;
    participant.businessObject.idRequest = request?.id;
    participant.businessObject.callIf = { expression: request?.callIf };
    participant.businessObject.repeatIf = { expression: request?.repeatIf };
    participant.businessObject.payLoadTypeSelect = request?.payLoadTypeSelect;
    participant.businessObject.versionRequest = request?.version;
    participant.businessObject.description = request?.description;

    colors.stroke = STROKE_COLORS['bpmn:Task'];
    colors.fill = FILL_COLORS['bpmn:Task'];
    participant.businessObject.di.set('stroke', 'black');
    participant.businessObject.di.set('fill', 'white');
    modeling.createShape(
      participant,
      { x: 150, y: 50, width: 900, height: 600 },
      process,
    );
    modeling.splitLane(participant, 3);
    const childLanes = getChildLanes(participant);
    childLanes.forEach((child, id) => {
      // add tables to Requests / Payloads / Headers
      const overlays = bpmnModeler.get('overlays');
      child.businessObject.name =
        id === 0 ? 'Parameters' : id === 1 ? 'Headers' : 'Payloads';
      // child.businessObject.$parent = participant?.businessObject?.processRef?.laneSets[0]
      overlays.add(child.id, {
        position: {
          bottom: child.height,
          left: 30,
        },
        html: `<div id=${child.id} style="width:${child.width - 30}px"></div>`,
      });
      modeling &&
        modeling.updateProperties(child, {
          name: id === 0 ? 'Parameters' : id === 1 ? 'Headers' : 'Payloads',
        });
      ReactDOM.render(
        <Provider store={store}>
          <CustomizedTables
            type={id === 0 ? 'parameters' : id === 2 ? 'payloads' : 'headers'}
          />
        </Provider>,
        document.getElementById(child.id),
      );
    });
    participant.bpmnModeler = bpmnModeler;

    setElement(participant);
    return participant;
  };

  const removeElement = (children) => {
    const elementRegistry = bpmnModelerGlobal.get('elementRegistry');
    const definitions = bpmnModelerGlobal.getDefinitions();
    const Nelement =
      definitions && definitions.rootElements && definitions.rootElements[0];
    const rootElement = elementRegistry.get(Nelement.id);
    const modeling = bpmnModelerGlobal.get('modeling');
    if (children) {
      modeling.removeElements([...children]);
    } else modeling.removeElements([...rootElement.children]);
    // setElement(rootElement);
    return rootElement;
  };

  const createMapper = (request) => {
    const elementFactory = bpmnModelerAuth.get('elementFactory');
    const elementRegistry = bpmnModelerAuth.get('elementRegistry');
    const modeling = bpmnModelerAuth.get('modeling');
    const process = elementRegistry.get('ProcessAction_3');
    const mapper = elementFactory.createParticipantShape({ type: 'bpmn:Task' });
    mapper.businessObject.name = 'Auth Request';
    mapper.businessObject.authRequest = request?.authWsRequest ?
      request.authWsRequest :
      null;
    mapper.businessObject.responseType = request?.responseType ? request.responseType : "cookie";
    mapper.businessObject.tokenName = request?.tokenName;
    modeling.createShape(
      mapper,
      { x: 220, y: 80, width: 130, height: 120 },
      process,
    );
    mapper.bpmnModeler = bpmnModelerAuth;
    if (is(mapper, ['bpmn:Task'])) {
      colors.stroke = STROKE_COLORS['bpmn:Task'];
      colors.fill = FILL_COLORS['bpmn:Task'];
      mapper.businessObject.di.set('stroke', STROKE_COLORS['bpmn:Task']);
      mapper.businessObject.di.set('fill', FILL_COLORS['bpmn:Task']);
    }
    modeling.setColor(mapper, colors);
    //setElement(mapper)
  };


  const createConnectorMapper = async (connector) => {
    const elementFactory = bpmnModelerConnector.get('elementFactory');
    const elementRegistry = bpmnModelerConnector.get('elementRegistry');
    const modeling = bpmnModelerConnector.get('modeling');
    const process = elementRegistry.get('ProcessAction_2');
    if (connector) {
      let mapper = null;
      if (connector?.wsRequestList && connector?.wsRequestList?.length > 0) {
        connector.wsRequestList.forEach((request, id) => {
          mapper = elementFactory.createParticipantShape({
            type: 'bpmn:Mapper',
          });
          mapper.businessObject.name = request.name;
          mapper.businessObject.requestTypeSelect = request.requestTypeSelect;
          mapper.businessObject.authRequest = request;
          modeling.createShape(
            mapper,
            { x: 220 + id * 180, y: 80, width: 130, height: 120 },
            process,
          );
        });
        let mappers = [...process.children];
        for (let i = 0; i < mappers.length; i++) {
          if (i === mappers.length - 1) return;
          modeling.connect(mappers[i], mappers[i + 1]);
        }
      } else {
        const mapper = elementFactory.createParticipantShape({
          type: 'bpmn:Mapper',
        });
        mapper.businessObject.name = null;
        mapper.businessObject.requestTypeSelect = null;
        mapper.businessObject.authRequest = null;
        modeling.createShape(
          mapper,
          { x: 220, y: 80, width: 130, height: 120 },
          process,
        );
      }
    } else {
      const mapper = elementFactory.createParticipantShape({
        type: 'bpmn:Mapper',
      });
      mapper.businessObject.name = null;
      mapper.businessObject.requestTypeSelect = null;
      mapper.businessObject.authRequest = null;
      modeling.createShape(
        mapper,
        { x: 220, y: 80, width: 130, height: 120 },
        process,
      );
    }
  };

  const createMapperQauth = (request) => {
    const elementFactory = bpmnModelerAuth.get('elementFactory');
    const elementRegistry = bpmnModelerAuth.get('elementRegistry');
    const modeling = bpmnModelerAuth.get('modeling');
    const process = elementRegistry.get('ProcessAction_3');
    const mapper2 = elementFactory.createParticipantShape({
      type: 'bpmn:Task',
    });
    const mapper3 = elementFactory.createParticipantShape({
      type: 'bpmn:Task',
    });
    modeling.createShape(
      mapper2,
      { x: 420, y: 80, width: 130, height: 120 },
      process,
    );
    modeling.createShape(
      mapper3,
      { x: 620, y: 80, width: 130, height: 120 },
      process,
    );
    mapper2.businessObject.name = 'Token request';
    mapper2.businessObject.authRequest = request?.tokenWsRequest ?
      request.tokenWsRequest :
      null;
    mapper3.businessObject.name = 'Refresh Token request';
    mapper3.businessObject.authRequest = request?.refreshTokenWsRequest ?
      request.refreshTokenWsRequest :
      null;
    if (is(mapper2, ['bpmn:Task'])) {
      colors.stroke = STROKE_COLORS['bpmn:Task'];
      colors.fill = FILL_COLORS['bpmn:Task'];
      mapper2.businessObject.di.set('stroke', STROKE_COLORS['bpmn:Task']);
      mapper2.businessObject.di.set('fill', FILL_COLORS['bpmn:Task']);
    }
    modeling.setColor(mapper2, colors);
    if (is(mapper3, ['bpmn:Task'])) {
      colors.stroke = STROKE_COLORS['bpmn:Task'];
      colors.fill = FILL_COLORS['bpmn:Task'];
      mapper3.businessObject.di.set('stroke', STROKE_COLORS['bpmn:Task']);
      mapper3.businessObject.di.set('fill', FILL_COLORS['bpmn:Task']);
    }
    modeling.setColor(mapper3, colors);
  };

  const createMapperStandard = (request) => {
    const elementFactory = bpmnModelerAuth.get('elementFactory');
    const elementRegistry = bpmnModelerAuth.get('elementRegistry');
    const modeling = bpmnModelerAuth.get('modeling');
    const process = elementRegistry.get('ProcessAction_3');
    const mapper = elementFactory.createParticipantShape({
      type: 'bpmn:Mapper',
    });
    const mapper2 = elementFactory.createParticipantShape({
      type: 'bpmn:Mapper',
    });
    modeling.createShape(
      mapper,
      { x: 220, y: 80, width: 130, height: 120 },
      process,
    );
    modeling.createShape(
      mapper2,
      { x: 420, y: 80, width: 130, height: 120 },
      process,
    );
    mapper.businessObject.name = 'Username';
    mapper.businessObject.expression = request?.username;
    mapper2.businessObject.name = "Password"
    mapper2.businessObject.expression = request?.password;
    if (is(mapper, ['bpmn:Task'])) {
      colors.stroke = STROKE_COLORS['bpmn:Task'];
      colors.fill = FILL_COLORS['bpmn:Mapper'];
      mapper.businessObject.di.set('stroke', STROKE_COLORS['bpmn:Task']);
      mapper.businessObject.di.set('fill', FILL_COLORS['bpmn:Task']);
    }
    if (is(mapper2, ['bpmn:Mapper'])) {
      colors.stroke = STROKE_COLORS['bpmn:Task'];
      colors.fill = FILL_COLORS['bpmn:Task'];
      mapper.businessObject.di.set('stroke', STROKE_COLORS['bpmn:Task']);
      mapper.businessObject.di.set('fill', FILL_COLORS['bpmn:Task']);
    }
    modeling.setColor(mapper, colors);
    modeling.setColor(mapper2, colors);
   // setElement(mapper);
  };

  // from connector / authentification => Request

  const editButton = async () => {
    let params = new URLSearchParams();
    if (element.type === 'bpmn:Mapper' || element.type === 'bpmn:Task') {
      params.append('id', element?.businessObject?.authRequest?.id);
      params.append("model", REQUEST);
    } else if (element.type === 'bpmn:Process-action' && model === CONNECTOR) {
      params.append('id', element?.businessObject.defaultWsAuthenticator?.id);
      params.append("model", AUTHENTICATION);
    }
    window.top.document
    .getElementsByTagName("iframe")[0]
    ?.contentWindow.parent.axelor.$openHtmlTab(
      `ws-builder/?id=${params.get("id")}&model=${params.get("model")}`,"WS Studio")
  };

  const addButton = () => {
    let params = new URLSearchParams();
    if (element.type === 'bpmn:Mapper' || element.type === 'bpmn:Task') {
      params.append("model", REQUEST);
      //createNewRequest();
    } else if (element.type === 'bpmn:Process-action') {
      params.append("model", AUTHENTICATION);

    }
    window.top.document
    .getElementsByTagName("iframe")[0]
    ?.contentWindow.parent.axelor.$openHtmlTab(
      `ws-builder/?model=${params.get("model")}`,"WS Studio")
  };

  // Request Model
  const getRequest = async (id) => {
    let res = await getRequestById(id, {
      fields: [
        'name',
        'studioApp',
        'id',
        'payLoadTypeSelect',
        'requestTypeSelect',
        'wsConnector',
        'payLoadWsKeyValueList',
        'headerWsKeyValueList',
        'version',
        'wsUrl',
        'description',
        'repeatIf',
        'callIf',
        'parameterWsKeyValueList',
      ],
    });
    removeElement();
    createParticipant(res);
    const req = {};
    req.name = res.name;
    req.studioApp = res.studioApp;
    req.requestTypeSelect = res.requestTypeSelect;
    req.payLoadTypeSelect = res.payLoadTypeSelect;
    req.wsUrl = res.wsUrl;
    req.callIf = res.callIf;
    req.repeatIf = res.repeatIf;
    req.id = res.id;
    req.version = res.version;
    req.description = res.desciption;
    let headers;
    let payloads;
    let parameters;
    headers =
      res.headerWsKeyValueList?.length !== 0 ?
        (headers = await getkeys(res.headerWsKeyValueList)) :
        [];
    payloads =
      res.payLoadWsKeyValueList?.length !== 0 ?
        (payloads = await getkeys(res.payLoadWsKeyValueList)) :
        [];
    parameters =
      res.parameterWsKeyValueList?.length !== 0 ?
        (parameters = await getkeys(res.parameterWsKeyValueList)) :
        [];
    dispatch(updateHeader(headers));
    const list =
      payloads?.length === 0 ? [] : await fromPayloadsToPayloads(payloads);
    dispatch(
      updateModelPayload(
        list.length === 0 ? [] : [{ model: '', payloads: list }],
      ),
    );
    dispatch(
      updateModelParam(
        parameters?.length !== 0 ?
          [{ id: 1, model: {}, parameters: [...parameters] }] :
          [],
      ),
    );
    req.parameterWsKeyValueList =
      parameters?.length !== 0 ?
        [{ id: 1, model: {}, parameters: [...parameters] }] :
        [];
    req.payLoadWsKeyValueList =
      list.length === 0 ? [] : [{ model: '', payloads: list }];
    req.headerWsKeyValueList = headers;
    setRequest(req);
  };

  const removeRequest = async () => {
    const res = await deleteRequest(request.id);
    setConsole(res);
    setValue(2);
  };

  const onChangeSelect = (e) => {
    if (verifySaveRequest() === true) {
      getRequest(e?.id);
    } else {
      setAlert({
        state: true,
        action: 'onChange',
        data: e,
        alertConfig: {
          alertMessage:
            'Current changes will be lost. Do you really want to proceed?',
          alertTitle: 'New',
        },
      });
      return;
    }
  };

  const buildPay = (payloads, model) => {
    const list = [];
    payloads?.forEach((payload) => {
      let resultPay = {};
      if (payload?.wsValue?.name) {
        resultPay = {
          wsKey: payload.wsKey ? payload.wsKey : null,
          isList: false,
          id: payload.id ? payload.id : null,
          version: payload?.version != null ? payload?.version : null,
          wsValue: getGroovyBasicPayload(
            payload.transformations,
            model,
            payload?.wsValue,
          ),
        };
        list.push(resultPay);
      } else if (payload.wsValue && !payload.isList) {
        resultPay = {
          wsKey: payload.wsKey ? payload.wsKey : null,
          isList: false,
          id: payload.id ? payload.id : null,
          version: payload?.version != null ? payload?.version : null,
          wsValue: getGroovyBasicPayload(
            payload.transformations,
            model?.model,
            payload?.wsValue,
          ),
        };
        list.push(resultPay);
      } else if (payload.isList) {
        let subList = [];
        payload.wsValue.forEach((pay) => {
          subList = [...buildPay(pay.payloads, pay.model)];
        });
        resultPay = {
          wsKey: payload.wsKey ? payload.wsKey : null,
          id: payload.id ? payload.id : null,
          wsValue: null,
          isList: true,
          subWsKeyValueList: subList,
          version: payload?.version != null ? payload?.version : null,
        };
        list.push(resultPay);
      } else {
        resultPay = {
          wsKey: payload.wsKey ? payload.wsKey : null,
          id: payload.id ? payload.id : null,
          wsValue: null,
          isList: false,
          version: payload?.version != null ? payload?.version : null,
          subWsKeyValueList: buildPay(payload.payloads, payload.model),
        };
        list.push(resultPay);
      }
    });
    return list;
  };

  const saveRequest = async () => {
    let req = {};
    if (element.type === 'bpmn:Participant') {
      req = element?.businessObject;
    } else if (element?.type === 'bpmn:Lane') {
      req = element?.parent?.businessObject;
    } else if (element?.type === 'bpmn:Collaboration') {
      req = element.children[0].businessObject;
    } else return;
    if (!verificationFieldsRequest(req)) return;

    const headers = [];
    headersStore.forEach((header) => {
      header = { ...header, id: header.id ? header.id : null };
      headers.push(header);
    });
    let payloads = [];
    modelPayloadsStore.forEach((modelPayload) => {
      payloads = [
        ...payloads,
        ...buildPay(modelPayload.payloads, modelPayload.model),
      ];
    });
    const url = '';
    const parameters = [];
    modelParamStore.forEach((param) => {
      param.parameters.forEach((p) => {
        p = {
          ...p,
          id: p.id ? p.id : null,
          wsValue: getGroovyBasicPayload(
            p.transformations,
            param.model,
            p.wsValue?.name ? p.wsValue?.name : p.wsValue,
          ),
        };
        parameters.push(p);
      });
    });
    let res = null;
    res = await addRequest({
      payLoadWsKeyValueList: payloads,
      wsUrl: req.url + url,
      studioApp: req.studioApp,
      requestTypeSelect: req.type ? req.type : null,
      name: req.name,
      payLoadTypeSelect: req.payLoadTypeSelect ? req.payLoadTypeSelect : null,
      headerWsKeyValueList: headers,
      parameterWsKeyValueList: parameters,
      description: req.description ? req.description : null,
      callIf: req.callIf?.expression ? req.callIf?.expression : null,
      repeatIf: req.repeatIf?.expression ? req.repeatIf?.expression : null,
      id: request?.id ? request?.id : null,
      version: request?.version != null ? request?.version : null,
    });
    setConsole(res);
    setValue(2);
    if (res?.data[0]?.id) setRequest(res.data[0]);
  };

  const verifyHeadersChanges = () => {
    if (
      request !== {} &&
      request?.headerWsKeyValueList?.length !== 0 &&
      headersStore?.length === request?.headerWsKeyValueList?.length
    ) {
      var res = true;
      for (let index = 0; index < request.headerWsKeyValueList.length; index++) {
        if (
          !(
            request.headerWsKeyValueList[index].wsKey === headersStore[index].wsKey &&
            request.headerWsKeyValueList[index].wsValue === headersStore[index].wsValue
          )
        ) {
          res = false;
          break;
        }
      }
      return res;
    } else if (headersStore?.length === 0) {
      return true;
    }
    return false;
  };

  const verifyParamsChanges = () => {
    if (
      modelParamStore?.length === (request?.parameterWsKeyValueList?.length ? request?.parameterWsKeyValueList?.length : 0)
    ) {
      let res = true;
      for (let index = 0; index < request?.parameterWsKeyValueList.length; index++) {
        if (
          request?.parameterWsKeyValueList[index].model?.name !== modelParamStore[index].model?.name ||
          request?.parameterWsKeyValueList[index].parameters?.length !==
          modelParamStore[index].parameters?.length
        ) {
          res = false;
          break;
        }
        for (let i = 0; i < request?.parameterWsKeyValueList[index].parameters.length; i++) {
          if (
            request?.parameterWsKeyValueList[index].parameters[i].wsKey !== modelParamStore[index].parameters[i].wsKey ||
            request?.parameterWsKeyValueList[index].parameters[i].wsValue !== modelParamStore[index].parameters[i].wsValue
          ) {
            res = false;
            break;
          }
        }
      }
      return res;
    }
    return false;

  }

  const verifyPayloadsChanges = () => {
    if (
      modelPayloadsStore?.length === request?.payloadWsKeyValueList?.length &&
      request?.payloadWsKeyValueList?.length !== 0
    ) {
      let res = true;
      res = request?.payloadWsKeyValueList.forEach((modelPayload, index) => {
        if (
          modelPayload.model?.name !== modelParamStore[index].model?.name ||
          modelPayload.parameters?.length !==
          modelParamStore[index].parameters?.length
        ) {
          return false;
        }
        modelPayload.parameters.forEach((param, id) => {
          if (
            param.wsKey !== modelParamStore[index].parameters[id].wsKey ||
            param.wsValue !== modelParamStore[index].parameters[id].wsValue
          ) {
            return false;
          }
        });
      });
      return res;
    }
    return false;
  };

  const createNewRequest = () => {
    removeElement();
    dispatch(updateModelParam([]));
    dispatch(updateModelPayload([]));
    dispatch(updateHeader([]));
    createParticipant();
    setRequest(null);
  };

  const verifySaveRequest = () => {
    let ele = null;
    if (element.type === 'bpmn:Participant') ele = element?.businessObject;
    else if (element?.type === 'bpmn:Lane') {
      ele = element?.parent?.businessObject;
    } else if (element?.type === 'bpmn:Collaboration') {
      ele = element.children[0].businessObject;
    }
    if (request !== null && JSON.stringify(request) !== '{}') {
      if (
        ele.name === request.name &&
        ele.url === request.wsUrl &&
        ele.type === request.requestTypeSelect &&
        verifyParamsChanges() &&
        verifyHeadersChanges()
        //  verifyPayloadsChanges()
      ) {
        return true;   // true means the verification is valid => nothing change
      }
      return false;    // false means the verification is failed => there is  changes in the request
    }
    else if (
      ele.name ||
      ele.url ||
      ele.type ||
      ele.callIf.expression ||
      ele.repeatIf.expression ||
      ele.payLoadTypeSelect ||
      modelParamStore.length !== 0 ||
      modelPayloadsStore.length !== 0 ||
      headersStore.length !== 0
    ) {
      return false;
    }
    return true;
  };

  // Connector Functions
  const verifySaveConnector = () => {
    var res = true;
    if (connector !== null) {
      const ele =
        element.type === 'bpmn:Process-action' ? element : element.parent;
      var children = ele.children.filter((child) => is(child, "bpmn:Mapper"));
      if (
        ele.businessObject.name === connector.name &&
        connector.baseUrl === ele.businessObject.baseUrl &&
        ele.businessObject?.defaultWsAuthenticator?.id ===
        connector.defaultWsAuthenticator?.id
      ) {
        for (let index = 0; index < connector.wsRequestList.length; index++) {
          if (
            connector.wsRequestList[index].id !==
            children[index].businessObject.authRequest.id
          ) {
            res = false;
            break;
          }
        }
      }
      else res = false;
    }
    return res;
  };

  const getConnector = async (id) => {
    let res = await getConnectorById(id, {
      fields: [
        'defaultWsAuthenticator',
        'name',
        'studioApp',
        'id',
        'wsRequestList',
        'baseUrl',
        'version',
        'wsConnector',
      ],
      related: {
        wsRequestList: ['name', 'requestTypeSelect', 'id'],
      },
    });
    let ele =  removeElement();
    ele.businessObject.baseUrl = res.baseUrl;
    ele.businessObject.name = res.name;
    ele.businessObject.studioApp = res.studioApp;
    ele.businessObject.defaultWsAuthenticator = res.defaultWsAuthenticator;
    await createConnectorMapper(res);
    setConnector(res);
    setElement(ele);
  };
  const removeConnector = async () => {
    const res = await deleteConnector(connector.id);
    setConsole(res);
    setValue(2);
  };

  const onChangeSelectConnector = (e) => {
    if (!verifySaveConnector()) {
      setAlert({
        state: true,
        data: e,
        action: 'onChange',
        alertConfig: {
          alertMessage:
            'Current changes will be lost. Do you really want to proceed?',
          alertTitle: 'New',
        },
      });
    } else {
      getConnector(e?.id);
    }
  };

  const verificationFieldsConnector = () => {
    const ele =
      element.type === 'bpmn:Process-action' ? element : element.parent;
    if (!ele.businessObject.name) {
      handleSnackbarClick(
        'error',
        !ele.businessObject.name ? 'Name is required !' : '',
      );
      return false;
    }
    return true;
  };
  const verificationFieldsRequest = (ele) => {
    if (
      !ele.name &&
      !ele.url &&
      !ele.type
    ) {
      handleSnackbarClick(
        'error',
        `<b>Les champs suivants sont invalides</b>: <li>Name</li>
            <li>Url</li>
            <li>Type</li>`,
      );
      return false;
    }
    else if ((!ele.name &&
      !ele.url) || (!ele.name && !ele.type) || (!ele.url && !ele.type)
    ) {
      handleSnackbarClick(
        'error',
        !ele.name &&
          !ele.url ?
          'Name and Url  are required !' :
          !ele.name && !ele.type ?
            'Name and Type  are required !' :
            !ele.url && !ele.type ?
              'Url and Type  are required !' :
              '',
      );
      return false;
    }
    else if (ele.name && ele.url && ele.type) {
      return true;
    }
    else {
      handleSnackbarClick(
        'error',
        !ele.name ?
          'Name is  required !' :
          !ele.type ?
            'Type is required !' :
            !ele.url ?
              'Url is required !' :
              '',
      );
      return false;
    }

  };

  const saveConnector = async () => {
    const ele =
      element.type === 'bpmn:Process-action' ? element : element.parent;
    if (!verificationFieldsConnector()) return;
    const requests = [];
    ele?.children.forEach((child) => {
      if (
        child.type === 'bpmn:Mapper' &&
        child.businessObject.authRequest != null
      ) {
        requests.push(child.businessObject.authRequest);
      }
    });
    const result = await addConnector({
      name: ele.businessObject.name,
      studioApp: ele.businessObject.studioApp,
      baseUrl: ele.businessObject.baseUrl,
      defaultWsAuthenticator: ele.businessObject.defaultWsAuthenticator,
      wsRequestList: requests,
      id: connector?.id ? connector?.id : null,
      version: connector?.version != null ? connector?.version : null,
    });
    setConsole(result);
    setValue(2);
    if (result?.data[0]?.id) {
      setConnector(result.data[0]);
      return result?.data[0];
    }
    return null;
  };

  const createNewConnector = async () => {
    let ele;
    if (element.type === 'bpmn:Process-action') ele = element;
    else ele = element.parent;
    ele.businessObject.name = null;
    ele.businessObject.studioApp = null;
    ele.businessObject.baseUrl = null;
    ele.businessObject.defaultWsAuthenticator = null;
    ele.businessObject.authRequest = null;
    removeElement(ele.children);
    await createConnectorMapper();
    setConnector(null);
    setElement(ele);
  };

  // Authentication Functions

  const changeRequestAuth = async (e) => {
    if (!e) {
      if (model === CONNECTOR && element.type === 'bpmn:Mapper') {
        const modeling = bpmnModelerConnector.get('modeling');
        modeling.updateProperties(element, {
          name: null,
          requestTypeSelect: null,
        });
        element.businessObject.requestTypeSelect = null;
        element.businessObject.authRequest = null;
      }
    } else {
      e = await getRequestById(e.id, {
        fields: [
          'name',
          'id',
          'payLoadTypeSelect',
          'requestTypeSelect',
          'wsConnector',
          'version',
        ],
      });
      if (model === CONNECTOR && element.type === 'bpmn:Mapper') {
        const modeling = bpmnModelerConnector.get('modeling');
        modeling.updateProperties(element, {
          name: e.name,
          requestTypeSelect: e.requestTypeSelect,
        });
        element.businessObject.requestTypeSelect = e.requestTypeSelect;
        if (
          e?.wsConnector?.id != null &&
          connector &&
          e?.wsConnector?.id !== connector?.id
        ) {
          element.businessObject.authRequest = {
            ...e,
            id: null,
            wsConnector: null,
            version: null,
          };
        }
      }
    }
    const ele = Object.assign({}, element);
    ele.businessObject = element.businessObject;
    ele.parent = element.parent;
    setElement(ele);
  };

  const getAuth = async (id) => {
    let res = await getAuthById(id);
    const ele = removeElement();
    ele.businessObject.type = res?.authTypeSelect;
    ele.businessObject.name = res?.name;
    ele.businessObject.studioApp = res?.studioApp;
    ele.businessObject.isAuthenticated = res?.isAuthenticated;
    ele.businessObject.Standard = (res.authWsRequest != null ? "false" : "true" )

    if (res?.authTypeSelect === 'oauth2') {
      createMapper(res);
      createMapperQauth(res);
    } else if(res.authWsRequest != null ){
      createMapper(res);
    }
    else{
      createMapperStandard(res);
    }
    setAuthRequest(res);
    setElement(ele);
  };

  const removeAuth = async () => {
    const res = await deleteAuth(authRequest.id);
    setConsole(res);
    setValue(2);
  };

  const onChangeSelectAuth = async (e) => {
    if (!verifySaveAuth()) {
      setAlert({
        state: true,
        data: e,
        action: 'onChange',
        alertConfig: {
          alertMessage:
            'Current changes will be lost. Do you really want to proceed?',
          alertTitle: 'New',
        },
      });
    } else {
      getAuth(e?.id);
    }
  };

  const verifySaveAuth = () => {
    if (authRequest != null) {
      const ele =
        element.type === 'bpmn:Process-action' ? element : element.parent;
      switch (ele.businessObject.type) {
        case 'basic':
          if(ele.businessObject.Standard === "false"){
          if (
            ele.businessObject.type === authRequest.authTypeSelect &&
            ele.children[0].businessObject.authRequest?.id ===
            authRequest.authWsRequest?.id &&
            ele.businessObject.name === authRequest.name &&
            ele.businessObject.isAuthenticated === authRequest.isAuthenticated
          ) {
            return true;
          }
          return false;
        }
        else{
          if (
            ele.children[0].businessObject.expression ===
            authRequest.username &&
            ele.children[1].businessObject.expression === authRequest.password &&
            ele.businessObject.name === authRequest.name
          ) {
            return true;
          }
          return false;
        };
        case 'oauth2':
          if (
            ele.businessObject?.type === authRequest.authTypeSelect &&
            ele.children[0].businessObject?.authRequest?.id ===
            authRequest.authWsRequest?.id &&
            ele.businessObject.name === authRequest.name &&
            ele.businessObject.isAuthenticated ===
            authRequest.isAuthenticated &&
            ele.children[1].businessObject?.authRequest?.id ===
            authRequest.tokenWsRequest?.id &&
            ele.children[2].businessObject.authRequest?.id ===
            authRequest.refreshTokenWsRequest?.id
          ) {
            return true;
          }
          return false;
        default:
          break;
      }
    }
    return true;
  };

  const verificationFieldsAuth = () => {
    const ele =
      element.type === 'bpmn:Process-action' ? element : element.parent;
    if (ele.businessObject.type === 'basic') {
      if(ele.businessObject.Standard === "false") {
      if (
        !ele.businessObject.name ||
        !ele.children[0].businessObject.authRequest
      ) {
        handleSnackbarClick(
          'error',
          !ele.businessObject.name &&
            !ele.children[0].businessObject.authRequest ?
            'Name and auth Request are required !' :
            !ele.businessObject.name ?
              'Name is required !' :
              !ele.children[0].businessObject.authRequest ?
                'Auth request is required !' :
                '',
        );
        return false;
      }
      return true;
    }
    else if(!ele.businessObject.name){
      handleSnackbarClick(
        'error','Name is required !'
      );
      return false;
    }
    return true;
    } else {
      if (
        !ele.businessObject.name ||
        !ele.children[0].businessObject.authRequest ||
        !ele.children[1].businessObject.authRequest ||
        !ele.children[2].businessObject.authRequest
      ) {
        handleSnackbarClick(
          'error',
          `<b>Les champs suivants sont invalides</b>: ${!ele.businessObject.name ? '<li>Name</li>' : ''
          }${!ele.children[0].businessObject.authRequest ?
            '<li>auth Request</li>' :
            ''
          }
        ${!ele.children[1].businessObject.authRequest ?
            '<li>Token request</li>' :
            ''
          }${!ele.children[2].businessObject.authRequest ?
            '<li>Refresh token request</li>' :
            ''
          } `,
        );
        return false;
      }
      return true
    }
  };

  const saveAuthentification = async (transition) => {
    if (!verificationFieldsAuth()) return;
    const ele =
      element.type === 'bpmn:Process-action' ? element : element.parent;
    const result = await addAuth({
      name: ele.businessObject.name,
      studioApp: ele.businessObject.studioApp,
      authWsRequest: ele.businessObject.Standard === "false" ?  ele.children[0].businessObject.authRequest : null,
      tokenWsRequest:
        ele.businessObject.type !== 'basic' ?
          ele.children[1].businessObject.authRequest :
          null,
      refreshTokenWsRequest:
        ele.businessObject.type !== 'basic' ?
          ele.children[2].businessObject.authRequest :
          null,
      authTypeSelect: ele.businessObject.type,
      id: authRequest?.id ? authRequest.id : null,
      version: authRequest?.version != null ? authRequest?.version : null,
      username: ele.businessObject.Standard === "true" ? ele.children[0].businessObject.expression : null,
      password: ele.businessObject.Standard === "true" ? ele.children[1].businessObject.expression : null,
      responseType: ele.businessObject.Standard === "false" ?  ele.children[0].businessObject.responseType : null,
      tokenName : ele.businessObject.Standard === "false" ?  ele.children[0].businessObject.tokenName : null,
      isAuthenticated: ele.businessObject.isAuthenticated,
    });
    setConsole(result);
    !transition && setValue(2);
    if (result?.data[0]?.id) {
      setAuthRequest(result?.data[0]);
      return result?.data[0];
    }
    return null;
  };

  const createNewAuth = async () => {
    let ele;
    element.type === 'bpmn:Process-action' ?
      (ele = element) :
      (ele = element.parent);
    ele.businessObject.name = null;
    ele.businessObject.studioApp = null;
    ele.businessObject.type = 'basic';
    ele.businessObject.isAuthenticated = false;
    removeElement(ele.children);
    await createMapper();
    setAuthRequest(null);
    setElement(ele);
  };

  const runTest = () => {
    let ele;
    let result;
    switch (model) {
      case REQUEST:
        let req = {};
        if (element.type === 'bpmn:Participant') {
          req = element?.businessObject;
        } else if (element?.type === 'bpmn:Lane') {
          req = element?.parent?.businessObject;
        } else if (element?.type === 'bpmn:Collaboration') {
          req = element.children[0].businessObject;
        } else return;
        const headers = [];
        headersStore.forEach((header) => {
          header = { ...header, id: header.id ? header.id : null };
          headers.push(header);
        });
        let payloads = [];
        modelPayloadsStore.forEach((modelPayload) => {
          payloads = [...buildPay(modelPayload.payloads, modelPayload.model)];
        });
        if (criteriaQuery?.expression) {
          let id = null;
          const found = payloads.some((el, index) => { id = index; return el.wsKey === "data" });
          if (found) {
            if (!payloads[id].subWsKeyValueList.some((ele) => ele.wsKey === "_domain"))
              payloads[id].subWsKeyValueList.push({ wsKey: "_domain", wsValue: criteriaQuery?.expression?.split(', ')[1], isList: false, id: null })
          }
          else {
            payloads.push({
              wsKey: "data",
              wsValue: null,
              isList: false,
              $version: null,
              subWsKeyValueList: [{ wsKey: "_domain", wsValue: criteriaQuery?.expression?.split(', ')[1], isList: false, id: null }]
            })
          }
        }
        const url = '';
        const parameters = [];
        modelParamStore.forEach((param) => {
          param.parameters.forEach((p) => {
            p = {
              ...p,
              id: p.id ? p.id : null,
              wsValue: getGroovyBasicPayload(
                p.transformations,
                param.model,
                p.wsValue?.name ? p.wsValue?.name : p.wsValue,
              ),
            };
            parameters.push(p);
          });
        });
        result = {
          payLoadWsKeyValueList: payloads,
          wsUrl: req.url + url,
          requestTypeSelect: req.type,
          name: req.name,
          payLoadTypeSelect: req.payLoadTypeSelect,
          headerWsKeyValueList: headers,
          parameterWsKeyValueList: parameters,
          description: req.description,
          callIf: req.callIf?.expression,
          repeatIf: req.repeatIf?.expression,
          id: request?.id ? request?.id : null,
          version: request?.version != null ? request?.version : null,
        };
        setConsole(result);
        setValue(2);
        break;
      case CONNECTOR:
        ele = element.type === 'bpmn:Process-action' ? element : element.parent;
        const requests = [];
        ele.children.forEach((child) => {
          if (child.type === 'bpmn:Mapper') {
            requests.push(child.businessObject.authRequest);
          }
        });
        result = {
          name: ele.businessObject.name,
          baseUrl: ele.businessObject.baseUrl,
          defaultWsAuthenticator: ele.businessObject.defaultWsAuthenticator,
          wsRequestList: requests,
          id: connector?.id ? connector?.id : null,
          version: connector?.version != null ? connector?.version : null,
        };
        setConsole(result);
        setValue(2);
        break;
      case AUTHENTICATION:
        ele = element.type === 'bpmn:Process-action' ? element : element.parent;
        result = {
          name: ele.businessObject.name,
          authWsRequest: ele.children[0].businessObject.authRequest,
          tokenWsRequest:
            ele.businessObject.type !== 'basic' ?
              ele.children[1].businessObject.authRequest :
              null,
          refreshTokenWsRequest:
            ele.businessObject.type !== 'basic' ?
              ele.children[2].businessObject.authRequest :
              null,
          authTypeSelect: ele.businessObject.type,
          id: authRequest?.id ? authRequest.id : null,
          version: authRequest?.version != null ? authRequest?.version : null,
          isAuthenticated: ele.businessObject.isAuthenticated,
        };
        setConsole(result);
        setValue(2);
        break;
      default:
        break;
    }
  };

  const toolBarButtons = [
    {
      name: 'New',
      icon: <AddBox className={classes.icon} style={{ color: 'green' }} />,
      tooltipText: 'New',
      onClick: async () => {
        switch (model) {
          case REQUEST:
            if (verifySaveRequest() === true) {
              createNewRequest();
            } else {
              setAlert({
                state: true,
                action: 'new',
                alertConfig: {
                  alertMessage:
                    'Current changes will be lost. Do you really want to proceed?',
                  alertTitle: 'New',
                },
              });
              return;
            }
            break;
          case CONNECTOR:
            if (!verifySaveConnector()) {
              setAlert({
                state: true,
                action: 'new',
                alertConfig: {
                  alertMessage:
                    'Current changes will be lost. Do you really want to proceed?',
                  alertTitle: 'New',
                },
              });
            } else {
              createNewConnector();
            }
            break;
          case AUTHENTICATION:
            if (!verifySaveAuth()) {
              setAlert({
                state: true,
                action: 'new',
                alertConfig: {
                  alertMessage:
                    'Current changes will be lost. Do you really want to proceed?',
                  alertTitle: 'New',
                },
              });
            } else {
              createNewAuth();
            }
            return;
          default:
            break;
        }
      },
    },
    {
      name: 'Save',
      icon: <Save className={classes.icon} style={{ color: '#4DB6AC ' }} />,
      tooltipText: 'Save',
      onClick: () => {
        switch (model) {
          case REQUEST:
            return saveRequest();
          case CONNECTOR:
            return saveConnector();
          case AUTHENTICATION:
            return saveAuthentification();
          default:
            break;
        }
      },
    },
    {
      name: 'Delete',
      icon: <i className={classNames("fa fa-trash-o", classes.icon)} style={{ fontSize: 18, color: "red" }}></i>,
      tooltipText: 'Delete',
      onClick: async () => {
        switch (model) {
          case REQUEST:
            if (request != null) {
              setAlert({
                state: true,
                action: 'delete',
                alertConfig: {
                  alertMessage: 'Are you sure you want to delete this record ?',
                  alertTitle: 'Warning',
                },
              });
              return;
            }
            break;
          case CONNECTOR:
            if (connector != null) {
              setAlert({
                state: true,
                action: 'delete',
                alertConfig: {
                  alertMessage: 'Are you sure you want to delete this record ?',
                  alertTitle: 'Warning',
                },
              });
            }
            break;
          case AUTHENTICATION:
            if (authRequest != null) {
              setAlert({
                state: true,
                action: 'delete',
                alertConfig: {
                  alertMessage: 'Are you sure you want to delete this record ?',
                  alertTitle: 'Warning',
                },
              });
            }
            break;
          default:
            break;
        }
      },
    },
    {
      name: 'Run test',
      icon: (
        <PlayCircleFilled
          className={classes.icon}
          style={{ color: '#007BC5' }}
        />
      ),
      tooltipText: 'Run test',
      onClick: () => {
        runTest();
      },
    },
    {
      name: 'Parametres',
      icon: <Menu className={classes.icon} style={{ color: 'black' }} />,
      tooltipText: 'Context',
      onClick: () => {
        showParametersMenu(true);
      },
    },
  ];

  const getProperties = useCallback(() => {
    const tab =
      model === REQUEST ?
        tabProperty :
        model === CONNECTOR ?
          tabPropertyConnector :
          tabPropertyAuth;
    const ele = tab.find((p) => p.type === (element && element.type));
    if (!ele) return [];
    if (ele.properties) {
      // create logic when some of proprieties has been changed
      if(model === AUTHENTICATION && element.businessObject.Standard === 'true'  ){
        //return []
        // la logic içi 
      }
      return ele.properties;
    }
    
    return []; // add this default return statement
  }, [element, model]);

  const onChange = () => {
    switch (model) {
      case REQUEST:
        if (element?.businessObject.classic === 'true') {
          ReactDOM.render(
            <Provider store={store}>
              <CustomizedTables type={'payloads'} />
            </Provider>,
            document.getElementById(element.children[2].id),
          );
        } else if (element?.businessObject.auth === 'true') {
          dispatch(
            updateModelPayload([
              { id: 1, wsKey: 'username', wsValue: '' },
              { id: 2, wsKey: 'password', wsValue: '' },
            ]),
          );
          const elementFactory = bpmnModeler.get('elementFactory');
          const modeling = bpmnModeler.get('modeling');
          const mapper = elementFactory.createParticipantShape({
            type: 'bpmn:Task',
          });
          const mapper2 = elementFactory.createParticipantShape({
            type: 'bpmn:Task',
          });
          mapper.businessObject.name = 'Username';
          mapper2.businessObject.name = 'Password';
          modeling.createShape(
            mapper,
            {
              x: element.children[2].x + 190,
              y: element.children[2].y + 45,
              width: 130,
              height: 120,
            },
            element,
          );
          colors.stroke = '#009688';
          colors.fill = '#B2DFDB';
          mapper.businessObject.di.set('stroke', STROKE_COLORS['bpmn:Task']);
          mapper.businessObject.di.set('fill', FILL_COLORS['bpmn:Task']);
          modeling.createShape(
            mapper2,
            {
              x: element.children[2].x + 390,
              y: element.children[2].y + 45,
              width: 130,
              height: 120,
            },
            element,
          );
          colors.stroke = '#009688';
          colors.fill = '#B2DFDB';
          mapper2.businessObject.di.set('stroke', STROKE_COLORS['bpmn:Task']);
          mapper2.businessObject.di.set('fill', FILL_COLORS['bpmn:Task']);
          modeling.setColor(mapper, colors);
          modeling.setColor(mapper2, colors);
        }
        break;
      case AUTHENTICATION:
        if (element?.businessObject.type === 'oauth2' && element.type === 'bpmn:Process-action') {
          createMapperQauth();
          setElement(element);
        } else if(element?.businessObject.type === 'basic' && element.type === 'bpmn:Process-action'){
          removeElement([element.children[1], element.children[2]]);
        }
        else if(element?.type === 'bpmn:Task'){
          if(element?.businessObject?.responseType === "cookie" && renderComponent === 1 ){
           setRenderComponent(0)
          }
          else{
          setRenderComponent(1);
          }
        }
        break;
      case CONNECTOR:
        break;
      default:
    }
  };

  const autheticateAction = async () => {
    // error when save is error
    let requestAuth = null;
    if (authRequest === null || !verifySaveAuth()) {
      requestAuth = await saveAuthentification(true);
      if (!requestAuth) return false;
    } else requestAuth = authRequest;
    const actionRequest = {
      model: 'com.axelor.studio.db.WsAuthenticator',
      action: 'action-studio-ws-authenticator-authenticate',
      data: { context: requestAuth },
    };
    const res = await autheticate(actionRequest);
    if (res?.status === 0) {
      if (res?.data[0]?.view) {
        window.open(res.data[0]?.view?.views[0]?.name, res.data[0]?.view?.params?.target);
      }
      else {
        const result = await getAuthById(requestAuth?.id);
        setAuthRequest(result);
        return result?.isAuthenticated;
      }
    }
    return false;
  };

  const changeCheckBoxValue =  (checked) => {
    removeElement();
    if (checked) {
       createMapperStandard();
       setRenderComponent(1);
       //setElement(element);
    } else {
      createMapper();
      if(renderComponent === 1) setRenderComponent(0);
     // setElement(element);
      //removeElement();
    }
  }

  const RenderComponent = (entry) => {
    if(entry.name ==="type");
    if (!entry && entry.widget) return [];
    switch (entry.widget) {
      case 'expression':
        return (
          <Expression
            entry={entry}
            element={element}
            bpmnModeler={bpmnModelerGlobal}
          />
        );
      case 'textField':
        if(model === AUTHENTICATION && element?.type === 'bpmn:Task' && element.businessObject.responseType === "cookie" && entry.name === "tokenName"){
          entry = {...entry,hidden : true};
        }
        else{
          entry = {...entry,hidden : false};
        }
        return (
          <TextField
            entry={entry}
            bpmnModeler={bpmnModelerGlobal}
            element={element}
            canRemove={true}
            readOnly={entry.readOnly}
          />
        );
      case 'textBox':
        return (
          <Textbox
            entry={entry}
            bpmnModeler={bpmnModelerGlobal}
            element={element}
          />
        );
      case 'button':
        return (
          <Button
            entry={entry}
            bpmnModeler={bpmnModelerGlobal}
            element={element}
            className={classes.save}
          >
            Authentificated
          </Button>
        );
      case 'selectBox':
        return (
          <SelectBox
            onChange={onChange}
            disabled={model === AUTHENTICATION && element.businessObject.Standard === "true" ? true : false}
            entry={entry}
            element={element}
            bpmnModeler={bpmnModelerGlobal}
          />
        );
      case 'authentificationAction':
        console.log("test")
        return (
          <AuthentificationAction
            bpmnModeler={bpmnModelerGlobal}
            element={element}
            requestAuth={authRequest}
            entry={entry}
            action={autheticateAction}
            label="Authentificated"
          />
        );
      case 'authField':
        return (
          <AuthentificationField
            entry={entry}
            bpmnModeler={bpmnModelerGlobal}
            element={element}
          />
        );
      case 'testConnector':
        return (
          <TestConnector
            entry={entry}
            bpmnModeler={bpmnModelerGlobal}
            element={element}
            connector={connector}
          />
        );
      case 'checkbox':
        return (
          <Checkbox
            entry={entry}
            element={element}
            bpmnModeler={bpmnModelerGlobal}
            onChange={changeCheckBoxValue}
          />
        );
      case 'checkBoxs':
        return (
          <Checkboxs
            entry={entry}
            element={element}
            bpmnModeler={bpmnModelerGlobal}
            onChange={onChange}
          />
        );
      case 'many-to-one':
        return (
          <NewSelect
            entry={entry}
            element={element}
            bpmnModeler={bpmnModelerGlobal}
            onChange={changeRequestAuth} addButton={addButton} editButton={editButton} />
        );
      case 'scriptBox':
        return (
          <ScriptBox
            entry={entry}
            element={element}
            bpmnModeler={bpmnModelerGlobal}
            bpmnFactory={
              bpmnModelerGlobal && bpmnModelerGlobal.get('bpmnFactory')
            }
            readOnly={element.businessObject[entry.name]?.expression?.value}
          />
        );
      case 'textFieldMapper':
        return (
          <TextFieldMapper
            entry={entry}
            element={element}
            bpmnModeler={bpmnModelerGlobal}
            bpmnFactory={
              bpmnModelerGlobal && bpmnModelerGlobal.get('bpmnFactory')
            }
          />
        );
      case 'parameterTable':
        return (
          <ParameterTable
            entry={entry}
            element={element}
            bpmnModeler={bpmnModelerGlobal}
            bpmnFactory={
              bpmnModelerGlobal && bpmnModelerGlobal.get('bpmnFactory')
            }
          />
        );
      default:
        return (
          <Textbox
            entry={entry}
            element={element}
            bpmnModeler={bpmnModelerGlobal}
          />
        );
    }
  };

  const [value, setValue] = useState(0);
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  function a11yProps(index) {
    return {
      'id': `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }
  const openDiagramImage = useCallback(async (bamlXml) => {
    let canvas;
    let element;
    const id = new URLSearchParams(window.location.search).get('id');
    const modelFromUrl = new URLSearchParams(window.location.search).get('model');
    switch (model) {
      case REQUEST:
        canvas = bpmnModeler.get('canvas');
        element = canvas.getRootElement();
        if (element.type === 'bpmn:Collaboration') {
          setElement(element.children[0]);
        } else {
          bpmnModeler.importXML(bamlXml, (err) => {
            if (err) {
              return console.error('could not import BPMN 2.0 diagram', err);
            }
            const canvas = bpmnModeler.get('canvas');
            canvas.zoom('fit-viewport');
            const element = canvas.getRootElement();
           if(id !== null && parseInt(modelFromUrl) === REQUEST) {return };
           setElement(element);
           createParticipant();
          });
        }
        break;
      case CONNECTOR:
        canvas = bpmnModelerConnector.get('canvas');
        element = canvas.getRootElement();
        if (element.type === 'bpmn:Process-action') {
          setElement(element);
        } else {
          bpmnModelerConnector.importXML(bamlXml, (err) => {
            if (err) {
              return console.error('could not import BPMN 2.0 diagram', err);
            }
            const canvas = bpmnModelerConnector.get('canvas');
            canvas.zoom('fit-viewport');
            const element = canvas.getRootElement();
            createConnectorMapper();
            setElement(element);
          });
        }
        break;
      case AUTHENTICATION:
        canvas = bpmnModelerAuth.get('canvas');
        element = canvas.getRootElement();
        if (element.type === 'bpmn:Process-action') {
          setElement(element);
        } else {
          bpmnModelerAuth.importXML(bamlXml, (err) => {
            if (err) {
              return console.error('could not import BPMN 2.0 diagram', err);
            }
            const canvas = bpmnModelerAuth.get('canvas');
            canvas.zoom('fit-viewport');
            const element = canvas.getRootElement();
            element.businessObject.type = 'basic';
            element.businessObject.isAuthenticated = false;
            if(id !== null && parseInt(modelFromUrl) === AUTHENTICATION) return;
            createMapper();
            setElement(element);
          });
        }
        break;
      default:
        return;
    }
  }, [model]);
  const fetchDiagram = React.useCallback(
    async function fetchDiagram(id) {
      if (model === REQUEST) openDiagramImage(REQUEST_XML);
      if (model === CONNECTOR) openDiagramImage(CONNECTOR_XML);
      if (model === AUTHENTICATION) openDiagramImage(AUTH_XML);
    },
    [model, openDiagramImage],
  );

  useEffect(() => {
    switch (model) {
      case REQUEST:
        if (!bpmnModeler) {
          bpmnModeler = new BpmnModeler({
            container: '#bpmnview',
            additionalModules: [customControlsModuleRequest],
          });
        }
        fetchDiagram();
        bpmnModelerGlobal = bpmnModeler;
        break;
      case CONNECTOR:
        if (!bpmnModelerConnector) {
          bpmnModelerConnector = new BpmnModeler({
            container: '#bpmnview2',
            additionalModules: [customControlsModuleAuth],
          });
        }
        bpmnModelerGlobal = bpmnModelerConnector;
        fetchDiagram();
        break;
      case AUTHENTICATION:
        if (!bpmnModelerAuth) {
          bpmnModelerAuth = new BpmnModeler({
            container: '#bpmnview3',
            additionalModules: [customControlsModuleRequest],
          });
        }
        bpmnModelerGlobal = bpmnModelerAuth;
        fetchDiagram();
        break;
      default:
        return;
    }
  }, [fetchDiagram, model]);

  const setColors = useCallback((element, forceUpdate = false) => {
    if (
      element.businessObject &&
      element.businessObject.di &&
      (element.businessObject.di.stroke || element.businessObject.di.fill) &&
      !forceUpdate
    ) {
      return;
    }
    const modeling = bpmnModelerGlobal.get('modeling');
    const colors = {};
    if (is(element, ['bpmn:Mapper'])) {
      colors.stroke = STROKE_COLORS['bpmn:Task'];
      colors.fill = FILL_COLORS['bpmn:Task'];
    } else {
      colors.stroke = STROKE_COLORS[element.type];
    }
    modeling.setColor(element, colors);
    if (model === CONNECTOR) {
      if (element.type === 'bpmn:Mapper') {
        modeling.resizeShape(element, {
          x: element.x,
          y: element.y - (130 - 110),
          width: 130,
          height: 120,
        });
      }
    }
  }, [model])

  useEffect(() => {
    formatter.current = new JSONFormatter(
      consoleResponse != null ? consoleResponse : 'No data',
      Infinity,
      {
        hoverPreviewEnabled: false,
        hoverPreviewArrayCount: 100,
        hoverPreviewFieldCount: 5,
        theme: 'dark',
        animateOpen: true,
        animateClose: true,
        useToJSON: true,
      },
    );
    if (value === 2) {
      if (document.getElementById('console') != null) {
        document.getElementById('console').innerHTML = '';
      }
      document
        .getElementById('console')
        ?.appendChild(formatter.current.render());
    }
  }, [consoleResponse, value]);

  useEffect(() => {
    switch (model) {
      case REQUEST:
        bpmnModelerGlobal = bpmnModeler;
        document.getElementById('bpmnview2').style.display = 'none';
        document.getElementById('bpmnview3').style.display = 'none';
        document.getElementById('bpmnview').style.display = 'block';
        break;
      case CONNECTOR:
        bpmnModelerGlobal = bpmnModelerConnector;
        document.getElementById('bpmnview').style.display = 'none';
        document.getElementById('bpmnview3').style.display = 'none';
        document.getElementById('bpmnview2').style.display = 'block';
        break;
      case AUTHENTICATION:
        bpmnModelerGlobal = bpmnModelerAuth;
        document.getElementById('bpmnview').style.display = 'none';
        document.getElementById('bpmnview2').style.display = 'none';
        document.getElementById('bpmnview3').style.display = 'block';
        break;
      default:
        break;
    }
    bpmnModelerGlobal.on('element.click', (event) => {
      setElement(event.element);
      setValue(0);
    });
    bpmnModelerGlobal.on('commandStack.shape.create.postExecuted', (event) => {
      setColors(event && event.context && event.context.shape);
    });
    bpmnModelerGlobal.on('shape.changed', (event) => {
     // setElement(event.element);
    });
    bpmnModelerGlobal.on('resize.end', 1500, (event) => {
      if (is(event.shape, "bpmn:Participant") || is(event.shape, "bpmn:Lane")) {
        let shape = null;
        if (is(event.shape, "bpmn:Participant")) shape = event.shape;
        else shape = event.shape.parent;
        shape.children.forEach(element => {
          document.getElementById(element.id).style.width = `${document.getElementById(element.id).getBoundingClientRect().width + event.dx}px`
        });
      }
    });
    bpmnModelerGlobal.on('shape.removed', () => {
      const elementRegistry = bpmnModelerGlobal.get('elementRegistry');
      const definitions = bpmnModelerGlobal.getDefinitions();
      const element =
        definitions && definitions.rootElements && definitions.rootElements[0];
      if (!element) return;
      const rootElement = elementRegistry.get(element.id);
      if (!rootElement) return;
      setElement(rootElement);
    });
  }, [model, setColors]);

  return (
    <div id="container">
      <div id="bpmncontainer">
        {parametersMenu && (
          <ContextBuilder
            open={parametersMenu}
            handleClose={() => {
              showParametersMenu(false);
            }}
          />
        )}
        {true && (
          <div id="bpmnview">
            <div className={classes.header}>
                {toolBarButtons.map((btn) => (
                  <div key={btn.name} className={classes.btnContainer}>
                    <Tooltip
                      title={btn.tooltipText}
                      className={classes.toolTip}
                    >
                      <div
                        className={
                          btn.tooltipText === 'Parametres' ?
                            [classes.toolTip, classes.active] :
                            classes.toolTip
                        }
                      >
                        <IconButton
                          fontSize="large"
                          onClick={btn.onClick}
                          className={classes.iconButton}
                        >
                          {btn.icon}
                        </IconButton>
                        <p className={classes.toolTipFont}>{btn.tooltipText}</p>
                      </div>
                    </Tooltip>
                  </div>
                ))}
              <Selection
                name="name"
                title="Model"
                placeholder="Model"
                optionLabelKey="name"
                className={classes.inputSelect}
                options={MODELS}
                value={MODELS[REQUEST - 1]}
                onChange={(e) => {
                  switch (e.name) {
                    case 'Connector':
                      setModel(CONNECTOR);
                      break;
                    case 'Authentification':
                      setModel(AUTHENTICATION);
                      break;
                    default:
                      return;
                  }
                }}
              />
              <Selection
                name="name"
                title="target"
                placeholder="Target Request"
                optionLabelKey="name"
                className={classes.inputSelect}
                value={request}
                fetchAPI={getAllRequest}
                onChange={(e) => {
                  onChangeSelect(e);
                }}
              />
            </div>
            {model === REQUEST && openAlert.state && (
              <Dialog
                open={openAlert.state}
                onClose={(e, reason) => {
                  if (reason !== 'backdropClick') {
                    setAlert(false);
                  }
                }}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                classes={{
                  paper: classes.dialog,
                }}
              >
                <DialogTitle id="alert-dialog-title">
                  {openAlert.alertConfig.alertTitle}
                </DialogTitle>
                <DialogContent>
                  <DialogContentText id="alert-dialog-description">
                    {openAlert.alertConfig.alertMessage}
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button
                    onClick={() => {
                      switch (openAlert.action) {
                        case 'new':
                          createNewRequest();
                          break;
                        case 'delete':
                          createNewRequest();
                          removeRequest();
                          break;
                        case 'onChange':
                          getRequest(openAlert?.data?.id);
                          break;
                        default:
                          break;
                      }
                      setAlert({ ...openAlert, state: false });
                    }}
                    color="primary"
                    autoFocus
                    className={classes.save}
                  >
                    Ok
                  </Button>
                  <Button
                    onClick={() => {
                      setAlert(false);
                    }}
                    color="primary"
                    autoFocus
                    style={{ textTransform: 'none' }}
                    className={classes.save}
                  >
                    Cancel
                  </Button>
                </DialogActions>
              </Dialog>
            )}
          </div>
        )}
        {true && (
          <div id="bpmnview3">
            <div className={classes.header}>
            {toolBarButtons.map((btn) => (
                  <div key={btn.name} className={classes.btnContainer}>
                    <Tooltip
                      title={btn.tooltipText}
                      className={classes.toolTip}
                    >
                      <div
                        className={
                          btn.tooltipText === 'Parametres' ?
                            [classes.toolTip, classes.active] :
                            classes.toolTip
                        }
                      >
                        <IconButton
                          fontSize="large"
                          onClick={btn.onClick}
                          className={classes.iconButton}
                        >
                          {btn.icon}
                        </IconButton>
                        <p className={classes.toolTipFont}>{btn.tooltipText}</p>
                      </div>
                    </Tooltip>
                  </div>
                ))}
              <Selection
                name="name"
                title="Model"
                placeholder="Model"
                optionLabelKey="name"
                className={classes.inputSelect}
                options={MODELS}
                value={MODELS[AUTHENTICATION - 1]}
                onChange={(e) => {
                  switch (e.name) {
                    case 'Request':
                      setModel(REQUEST);
                      break;
                    case 'Connector':
                      setModel(CONNECTOR);
                      break;
                    default:
                      return;
                  }
                }}
              />
              <Selection
                name="name"
                title="target"
                placeholder="Target Request"
                optionLabelKey="name"
                className={classes.inputSelect}
                value={authRequest}
                fetchAPI={getAllAuthentication}
                onChange={(e) => {
                  onChangeSelectAuth(e);
                  // SetRequest(e)
                }}
              />
            </div>
            {model === AUTHENTICATION && openAlert.state && (
              <Dialog
                open={openAlert.state}
                onClose={(e, reason) => {
                  if (reason !== 'backdropClick') {
                    setAlert(false);
                  }
                }}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                classes={{
                  paper: classes.dialog,
                }}
              >
                <DialogTitle id="alert-dialog-title">
                  {openAlert.alertConfig.alertTitle}
                </DialogTitle>
                <DialogContent>
                  <DialogContentText id="alert-dialog-description">
                    {openAlert.alertConfig.alertMessage}
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button
                    onClick={() => {
                      switch (openAlert.action) {
                        case 'new':
                          createNewAuth();
                          break;
                        case 'delete':
                          createNewAuth();
                          removeAuth();
                          break;
                        case 'onChange':
                          getAuth(openAlert.data.id);
                          break;
                        default:
                          break;
                      }
                      setAlert({ ...openAlert, state: false });
                    }}
                    color="primary"
                    autoFocus
                    className={classes.save}
                  >
                    Ok
                  </Button>
                  <Button
                    onClick={() => {
                      setAlert(false);
                    }}
                    color="primary"
                    autoFocus
                    style={{ textTransform: 'none' }}
                    className={classes.save}
                  >
                    Cancel
                  </Button>
                </DialogActions>
              </Dialog>
            )}
          </div>
        )}
        {true && (
          <div id="bpmnview2">
            <div className={classes.header}>
            {toolBarButtons.map((btn) => (
                  <div key={btn.name} className={classes.btnContainer}>
                    <Tooltip
                      title={btn.tooltipText}
                      className={classes.toolTip}
                    >
                      <div
                        className={
                          btn.tooltipText === 'Parametres' ?
                            [classes.toolTip, classes.active] :
                            classes.toolTip
                        }
                      >
                        <IconButton
                          fontSize="large"
                          onClick={btn.onClick}
                          className={classes.iconButton}
                        >
                          {btn.icon}
                        </IconButton>
                        <p className={classes.toolTipFont}>{btn.tooltipText}</p>
                      </div>
                    </Tooltip>
                  </div>
                ))}
              <Selection
                name="name"
                title="Model"
                placeholder="Model"
                optionLabelKey="name"
                className={classes.inputSelect}
                options={MODELS}
                value={MODELS[CONNECTOR - 1]}
                onChange={(e) => {
                  switch (e.name) {
                    case 'Authentification':
                      setModel(AUTHENTICATION);
                      break;
                    case 'Request':
                      setModel(REQUEST);
                      break;
                    default:
                      return;
                  }
                }}
              />
              <Selection
                name="name"
                title="target"
                placeholder="Target Request"
                optionLabelKey="name"
                className={classes.inputSelect}
                value={connector}
                fetchAPI={getAllConnector}
                onChange={(e) => {
                  onChangeSelectConnector(e);
                }}
              />
            </div>
            {model === CONNECTOR && openAlert.state && (
              <Dialog
                open={openAlert.state}
                onClose={(e, reason) => {
                  if (reason !== 'backdropClick') {
                    setAlert(false);
                  }
                }}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                classes={{
                  paper: classes.dialog,
                }}
              >
                <DialogTitle id="alert-dialog-title">
                  {openAlert.alertConfig.alertTitle}
                </DialogTitle>
                <DialogContent>
                  <DialogContentText id="alert-dialog-description">
                    {openAlert.alertConfig.alertMessage}
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button
                    onClick={() => {
                      switch (openAlert.action) {
                        case 'new':
                          createNewConnector();
                          break;
                        case 'delete':
                          createNewConnector();
                          removeConnector();
                          break;
                        case 'onChange':
                          getConnector(openAlert.data?.id);
                          break;
                        default:
                          break;
                      }
                      setAlert({ ...openAlert, state: false });
                    }}
                    color="primary"
                    autoFocus
                    className={classes.save}
                  >
                    Ok
                  </Button>
                  <Button
                    onClick={() => {
                      setAlert(false);
                    }}
                    color="primary"
                    autoFocus
                    style={{ textTransform: 'none' }}
                    className={classes.save}
                  >
                    Cancel
                  </Button>
                </DialogActions>
              </Dialog>
            )}
          </div>
        )}
      </div>
      <div>
        <Resizable
          style={resizeStyle}
          size={{ width: width, height }}
          onResizeStop={(e, direction, ref, d) => {
            setWidth((width) => width + d.width);
            setHeight(height + d.height);
            setCSSWidth(width + d.width);
          }}
          maxWidth={window.innerWidth - 150}
        >
          <Drawer
            variant="persistent"
            anchor="right"
            open={drawerOpen}
            style={{
              width: DRAWER_WIDTH,
            }}
            classes={{
              paper: classes.drawerPaper,
            }}
            id="drawer"
          >
            <div className={classes.drawerContainer}>
              <TabContext value={value.toString()}>
                <Box className={classes.box}>
                  <Tabs
                    value={value}
                    onChange={handleChange}
                    aria-label="basic tabs example"
                    className={classes.tabNav}
                  >
                    <Tab
                      className={classes.tabStyle}
                      label="Generality"
                      {...a11yProps(0)}
                    />
                    <Tab
                      className={classes.tabStyle}
                      label="Description"
                      {...a11yProps(1)}
                    />
                    <Tab
                      className={classes.tabStyle}
                      label="Consol"
                      {...a11yProps(2)}
                    />
                  </Tabs>
                </Box>
                <TabPanel className={classes.tabPanel} value={"0"} index={0}>
                  {getProperties().map((t, index) => { 
                    return (
                      <div className={classes.property} key={index} >
                        <RenderComponent  {...t} renderComponent={renderComponent}/>
                      </div>
                    )
                  })}
                </TabPanel>
                <TabPanel className={classes.tabPanel} value={"1"} index={1}>
                  <Description desciption={'Description'} element={element} />
                </TabPanel>
                <TabPanel
                  className={classes.tabPanelConsole}
                  value={"2"}
                  index={2}
                >
                  {consoleResponse &&
                    consoleResponse?.ok == null &&
                    consoleResponse?.status === 0 && (
                      <div className={classes.messageResponseSuccess}>
                        Success, everything run Successfully
                      </div>
                    )}
                  {(consoleResponse?.ok === false ||
                    consoleResponse?.status === -1) && (
                      <div className={classes.messageResponseError}>
                        Error , something went wrong !
                      </div>
                    )}
                  <div className={classes.consoleHeader}>
                    <h3 style={{ color: 'white', margin: 0, padding: 10 }}>Result</h3>
                    <Button
                      className={classes.copy}
                      title="Copy result as Json"
                    >
                      Copy
                    </Button>
                  </div>
                  <div id="console" className={classes.console}></div>
                </TabPanel>
              </TabContext>
            </div>
          </Drawer>
          <div
            className="bpmn-property-toggle"
            onClick={() => {
              setWidth((width) => (width === 0 ? DRAWER_WIDTH : 0));
              setCSSWidth(width === 0 ? DRAWER_WIDTH : 0);
            }}
          >
            Properties panel
          </div>
        </Resizable>
        <div
          className="properties-panel-parent"
          id="js-properties-panel"
        ></div>
      </div>
      {openSnackbar.open && (
        <Snackbar
          open={openSnackbar.open}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
        >
          <Alert
            elevation={6}
            variant="filled"
            onClose={handleSnackbarClose}
            className="snackbarAlert"
            style={{ alignItems: 'flex-start' }}
            severity={openSnackbar.messageType}
          >
            <div
              dangerouslySetInnerHTML={{
                __html: openSnackbar.message,
              }}
            ></div>
          </Alert>
        </Snackbar>
      )}
    </div>
  );
}

export default WebServiceEditor;
