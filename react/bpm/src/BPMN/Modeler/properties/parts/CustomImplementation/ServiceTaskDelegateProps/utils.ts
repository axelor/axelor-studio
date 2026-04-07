import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import type { BpmnElement, ModdleElement } from "@studio/shared/types";

import { getDMNModel, getDMNModels } from "../../../../../../shared/services";

interface FetchDmnModelParams {
  element?: BpmnElement | ModdleElement;
  decisionRef?: string;
  setProperty: (name: string, value: unknown) => void;
  setDmnModel: (model: Record<string, unknown> | null) => void;
}

export async function fetchDmnModel({
  element,
  decisionRef,
  setProperty,
  setDmnModel,
}: FetchDmnModelParams) {
  if (!decisionRef) return;
  const dmnModel = await getDMNModel(decisionRef);
  if (decisionRef) {
    const dmnTable = await getDMNModels([
      {
        fieldName: "decisionId",
        operator: "=",
        value: decisionRef,
      },
    ]);
    const dmnName = dmnTable && dmnTable[0] && dmnTable[0].name;
    setDmnModel({
      ...(dmnModel || {}),
      name: dmnName,
      decisionId: decisionRef,
    });
    if (element && dmnName) {
      setProperty("decisionName", dmnName ?? "");
    }
  }
}

interface ElementSetPropertyParams {
  element?: BpmnElement | ModdleElement;
  setProperty: (name: string, value: unknown) => void;
}

export function clearImplementationType({ element, setProperty }: ElementSetPropertyParams) {
  const bo = getBusinessObject(element);
  if (!bo) return;
  bo.delegateExpression = undefined;
  bo.class = undefined;
  bo.expression = undefined;
  bo.resultVariable = undefined;
  bo.topic = undefined;
  bo.taskPriority = undefined;
  bo.decisionRef = undefined;
  setProperty("decisionName", undefined);
}

interface UpdateActionParams extends ElementSetPropertyParams {
  value?: Array<{ name: string }>;
}

export function updateAction({ element, setProperty, value }: UpdateActionParams) {
  const bo = getBusinessObject(element);
  if (!bo) return;
  if (value?.length) {
    bo.class = `com.axelor.studio.bpm.service.execution.WkfActionService`;
    bo.topic = undefined;
    bo.expression = undefined;
    bo.resultVariable = undefined;
    bo.delegateExpression = undefined;
    bo.decisionRef = undefined;
    setProperty("actions", value?.map((v) => v.name).join(","));
    setProperty("isAction", "true");
  } else {
    bo.class = undefined;
    setProperty("actions", undefined);
    setProperty("isAction", undefined);
  }
}

interface UpdateScenariodataParams extends ElementSetPropertyParams {
  value?: { id: string; name: string } | null;
  organization?: { id: string; name: string } | null;
}

export function updateScenariodata({
  element,
  setProperty,
  value,
  organization,
}: UpdateScenariodataParams) {
  const bo = getBusinessObject(element);
  setProperty("organizationId", organization?.id);
  setProperty("organizationLabel", organization?.name);
  if (value && bo) {
    bo.class = `com.axelor.studio.bpm.service.execution.WkfConnectService`;
    bo.topic = undefined;
    bo.expression = undefined;
    bo.resultVariable = undefined;
    bo.delegateExpression = undefined;
    bo.decisionRef = undefined;
    setProperty("scenario", value.id);
    setProperty("scenarioLabel", value.name);
  } else if (bo) {
    bo.class = undefined;
    setProperty("scenario", undefined);
    setProperty("scenarioLabel", undefined);
  }
}
