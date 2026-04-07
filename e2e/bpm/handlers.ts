import { http, HttpResponse } from 'msw';
import { commonHandlers } from '../shared/handlers/common.ts';

// Minimal valid BPMN 2.0 XML for mock diagram data
const MINIMAL_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Sample Task">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1">
      <bpmn:incoming>Flow_2</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1"/>
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1"/>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_1" bpmnElement="StartEvent_1">
        <dc:Bounds x="179" y="99" width="36" height="36"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <dc:Bounds x="270" y="77" width="100" height="80"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="432" y="99" width="36" height="36"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="215" y="117"/>
        <di:waypoint x="270" y="117"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="370" y="117"/>
        <di:waypoint x="432" y="117"/>
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

// Minimal valid DMN 1.1 XML for mock diagram data (decision table with one input/output)
const MINIMAL_DMN = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/DMN/20151101/dmn.xsd"
  xmlns:biodi="http://bpmn.io/schema/dmn/biodi/1.0"
  id="Definitions_dmn1" name="DRD" namespace="http://camunda.org/schema/1.0/dmn">
  <decision id="Decision_1" name="Decision 1">
    <extensionElements>
      <biodi:bounds x="157" y="81" width="180" height="80" />
    </extensionElements>
    <decisionTable id="decisionTable_1">
      <input id="input_1">
        <inputExpression id="inputExpression_1" typeRef="string" expressionLanguage="feel">
          <text></text>
        </inputExpression>
      </input>
      <output id="output_1" typeRef="string" />
    </decisionTable>
  </decision>
</definitions>`;

// WkfModel search -- sample BPM workflow model
const wkfModelSearchHandler = http.post(
  '*/ws/rest/com.axelor.studio.db.WkfModel/search',
  () => {
    return HttpResponse.json({
      status: 0,
      total: 1,
      data: [
        {
          id: 1,
          name: 'Sample Process',
          code: 'sample-process',
          statusSelect: 1,
          diagramXml: MINIMAL_BPMN,
        },
      ],
    });
  }
);

// WkfModel fetch -- return full model with BPMN XML
const wkfModelFetchHandler = http.post(
  '*/ws/rest/com.axelor.studio.db.WkfModel/*/fetch',
  () => {
    return HttpResponse.json({
      status: 0,
      data: [
        {
          id: 1,
          version: 0,
          name: 'Sample Process',
          code: 'sample-process',
          statusSelect: 1,
          diagramXml: MINIMAL_BPMN,
          wkfProcessList: [
            {
              id: 1,
              name: 'Process_1',
              processId: 'Process_1',
            },
          ],
        },
      ],
    });
  }
);

// WkfDmnModel search -- sample DMN workflow model
const wkfDmnModelSearchHandler = http.post(
  '*/ws/rest/com.axelor.studio.db.WkfDmnModel/search',
  () => {
    return HttpResponse.json({
      status: 0,
      total: 1,
      data: [
        {
          id: 1,
          name: 'Sample Decision',
          diagramXml: MINIMAL_DMN,
        },
      ],
    });
  }
);

// WkfDmnModel fetch -- return full model with DMN XML
const wkfDmnModelFetchHandler = http.post(
  '*/ws/rest/com.axelor.studio.db.WkfDmnModel/*/fetch',
  () => {
    return HttpResponse.json({
      status: 0,
      data: [
        {
          id: 1,
          version: 0,
          name: 'Sample Decision',
          diagramXml: MINIMAL_DMN,
          dmnTableList: [
            {
              id: 1,
              name: 'Decision 1',
              decisionId: 'Decision_1',
            },
          ],
        },
      ],
    });
  }
);

// Meta view handler for the modeler views
const metaViewHandler = http.post('*/ws/meta/view', () => {
  return HttpResponse.json({
    status: 0,
    data: {
      view: {
        type: 'form',
        name: 'wkf-model-form',
        title: 'BPM Editor',
        model: 'com.axelor.studio.db.WkfModel',
        items: [],
      },
      fields: [],
    },
  });
});

// Initial action for BPM editor
const bpmEditorActionHandler = http.post(
  '*/ws/action/action-studio-bpm-view-wkf-editor',
  () => {
    return HttpResponse.json({
      status: 0,
      data: [
        {
          values: {
            id: 1,
            name: 'Sample Process',
          },
        },
      ],
    });
  }
);

// App-specific handlers BEFORE commonHandlers so they take precedence
export const bpmHandlers = [
  wkfModelSearchHandler,
  wkfModelFetchHandler,
  wkfDmnModelSearchHandler,
  wkfDmnModelFetchHandler,
  metaViewHandler,
  bpmEditorActionHandler,
  ...commonHandlers,
];
