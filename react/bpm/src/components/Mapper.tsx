import React from "react";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import type BpmnModeler from "bpmn-js/lib/Modeler";
import Builder from "mapper";

import { getDMNModels } from "../shared/services";
import { getElements } from "../BPMN/Modeler/extra";

function BuilderDummy() {
  return <p>Integrate Assignment Builder</p>;
}

interface BpmnElement {
  id: string;
  type: string;
  parent?: BpmnElement;
  businessObject?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Minimal bpmn modeler shape used in Mapper */
interface BpmnModelerLike {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(name: string): any;
}

interface MapperProps {
  open?: boolean;
  handleClose?: () => void;
  onSave?: (data: unknown) => void;
  params?: Record<string, unknown> | (() => Record<string, unknown>);
  bpmnModeler: BpmnModelerLike | undefined;
  element: BpmnElement;
}

function Mapper({ open, handleClose, onSave, params, bpmnModeler, element }: MapperProps) {
  const getProcesses = React.useCallback((): Record<string, unknown>[] => {
    if (!bpmnModeler) return [];
    const elements = getElements(bpmnModeler as unknown as InstanceType<typeof BpmnModeler>); // safety: bpmn-js modeler instance type differs from BpmnModeler class type
    const processes: Record<string, unknown>[] = [];
    Object.keys(elements).forEach((e) => {
      processes.push({
        name: e,
      });
    });
    return processes;
  }, [bpmnModeler]);

  const getProcessElement = React.useCallback(
    (processId: Record<string, unknown>): Record<string, unknown> => {
      if (!processId || !bpmnModeler) return {};
      const elementRegistry = bpmnModeler.get("elementRegistry");
      let rootElement = elementRegistry.get(processId.name);
      if (!rootElement) {
        const canvasRoot = bpmnModeler?.get("canvas")?.getRootElement();
        const { participants } = canvasRoot.businessObject;
        if (participants && participants.length > 0) {
          const participant = participants.find(
            (p: Record<string, Record<string, unknown>>) => p.processRef.id === processId.name,
          );
          rootElement = participant && participant.processRef;
          return rootElement;
        }
      }
      return rootElement && rootElement.businessObject;
    },
    [bpmnModeler],
  );

  const isDMNAllow = React.useCallback((): boolean => {
    if (!bpmnModeler) return false;
    const elementRegistry = bpmnModeler.get("elementRegistry");
    const elementProcessId =
      element.type === "bpmn:Process" || element.type === "bpmn:Participant"
        ? element.id
        : element && element.parent && element.parent.id;
    const elements = elementRegistry.filter((ele: Record<string, Record<string, unknown>>) => {
      const bo = getBusinessObject(ele);
      return (
        is(ele, "bpmn:BusinessRuleTask") &&
        bo &&
        bo.resultVariable &&
        bo.decisionRef &&
        (ele && ele.parent && ele.parent.id) === elementProcessId
      );
    });
    return elements.length > 0;
  }, [bpmnModeler, element]);

  const getDMNValues = React.useCallback(async (): Promise<Record<string, unknown>[]> => {
    if (!bpmnModeler) return [];
    const refs: unknown[] = [];
    const elementRegistry = bpmnModeler.get("elementRegistry");
    const elements = elementRegistry.filter((ele: Record<string, Record<string, unknown>>) => {
      const bo = getBusinessObject(ele);
      if (
        bo.decisionRef &&
        (ele.parent && ele.parent.id) === (element && element.parent && element.parent.id)
      ) {
        refs.push(bo.decisionRef);
      }
      return (
        bo.decisionRef &&
        (ele.parent && ele.parent.id) === (element && element.parent && element.parent.id)
      );
    });
    if (!refs || refs.length <= 0) return [];
    const dmnTables = await getDMNModels([
      {
        fieldName: "decisionId",
        operator: "IN",
        value: refs,
      },
    ]);
    const tables =
      elements &&
      dmnTables &&
      elements.map((element: Record<string, Record<string, unknown>>) => {
        const table = dmnTables.find(
          (t: Record<string, unknown>) => t.decisionId === (element.businessObject && element.businessObject.decisionRef),
        );
        return {
          ...table,
          dmnNodeId: element.id,
          dmnNodeNameId: element.businessObject.name,
          resultVariable: element.businessObject.resultVariable,
        };
      });
    return (tables && tables.filter((t: Record<string, unknown>) => t.id)) || [];
  }, [bpmnModeler, element]);

  const paramFn = React.useMemo(() => {
    if (!params) return undefined;
    return typeof params === "function" ? params : () => params;
  }, [params]);

  return (
    <>
      {Builder ? (
        <Builder
          isBPMN={true}
          open={open}
          handleClose={handleClose}
          onSave={onSave}
          param={paramFn}
          getProcesses={getProcesses}
          getProcessElement={getProcessElement}
          isDMNAllow={isDMNAllow}
          getDMNValues={getDMNValues}
        />
      ) : (
        <BuilderDummy />
      )}
    </>
  );
}
export default Mapper;
