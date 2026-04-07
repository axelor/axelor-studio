import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import Ids from "ids";
import Service from "@studio/shared/services/Service";
import type { WkfModel } from "@studio/shared/types";
import { translate } from "@studio/shared/i18n";

import { openWebApp } from "../utils";
import { createSatelliteWkf } from "../../../../../../services/wkf-repository";
import type { PropertiesPanelComponentProps } from "../../../property-types";


interface newIdProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setWkfModel?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleSnackbarClick?: any;
}
export function nextId() {
  const ids = new Ids([32, 32, 1]);
  return ids.nextPrefixed("Process_");
}

export function getCallableType(bo: Record<string, unknown> & { get: (key: string) => unknown }) {
  const boCalledElement = bo.get("calledElement"),
    boCaseRef = bo.get("camunda:caseRef");
  let callActivityType = "";
  if (typeof boCalledElement !== "undefined") {
    callActivityType = "bpmn";
  } else if (typeof boCaseRef !== "undefined") {
    callActivityType = "cmmn";
  }
  return callActivityType;
}

async function checkId(id: string): Promise<string> {
  const model = await Service.search<WkfModel>("com.axelor.studio.db.WkfModel", {
    data: { _domain: `self.code = '${id}'` },
    limit: 1,
  });
  if ((model.total ?? 0) > 0) {
    const newId = nextId();
    return checkId(newId);
  } else {
    return id;
  }
}

export async function addNewBPMRecord({
  id,
  element,
  setWkfModel,
  handleSnackbarClick,
}: newIdProps) {
  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
      <bpmn2:definitions
        xmlns:xs="http://www.w3.org/2001/XMLSchema-instance"
        xs:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"
        xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
        xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
        xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
        id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn">
        <bpmn2:process id="${id}" isExecutable="true">
          <bpmn2:startEvent id="StartEvent_1" />
        </bpmn2:process>
        <bpmndi:BPMNDiagram id="BPMNDiagram_1">
          <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${id}">
            <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1" bioc:stroke="#55c041" bioc:fill="#ccecc6">
              <dc:Bounds height="36.0" width="36.0" x="412.0" y="240.0" />
            </bpmndi:BPMNShape>
          </bpmndi:BPMNPlane>
        </bpmndi:BPMNDiagram>
      </bpmn2:definitions>`;

  if (!id) return;
  const uniqueCode = await checkId(id);
  const saveResult = await createSatelliteWkf({
    name: uniqueCode,
    code: uniqueCode,
    diagramXml: xml,
    generatedFromCallActivity: true,
  });
  if (saveResult.ok) {
    const wkfModelData = saveResult.data;
    getBusinessObject(element).calledElement = uniqueCode;
    setWkfModel(wkfModelData);
    handleSnackbarClick("success", "New process added successfully");
    if (wkfModelData.id) {
      openWebApp(`bpm/?id=${wkfModelData.id}`, translate("BPM editor"));
    }
  } else {
    handleSnackbarClick("danger", saveResult.error.message);
  }
}
