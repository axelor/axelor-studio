import React from "react";
import { getElements } from "../BPMN/Modeler/extra";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { getDMNModels } from "../services/api";

import Builder from "mapper/src/App";

function BuilderDummy() {
  return <p>Integrate Assignment Builder</p>;
}
function Mapper({ open, handleClose, onSave, params, bpmnModeler, element }) {
  const getProcesses = React.useCallback(() => {
    const elements = getElements(bpmnModeler);
    const processes = [];
    Object.keys(elements).forEach((e) => {
      processes.push({
        name: e,
      });
    });
    return processes;
  }, [bpmnModeler]);

  const getProcessElement = React.useCallback(
    (processId) => {
      if (!processId) return;
      const elementRegistry = bpmnModeler.get("elementRegistry");
      const elements = elementRegistry && elementRegistry._elements;
      let rootElement = elements && elements[processId.name];
      if (!rootElement) {
        const elements = bpmnModeler.get("canvas").getRootElement();
        const { participants } = elements.businessObject;
        if (participants && participants.length > 0) {
          let participant = participants.find(
            (p) => p.processRef.id === processId.name
          );
          rootElement = participant && participant.processRef;
          return rootElement;
        }
      }
      return (
        rootElement && rootElement.element && rootElement.element.businessObject
      );
    },
    [bpmnModeler]
  );

  const isDMNAllow = React.useCallback(() => {
    const elementRegistry = bpmnModeler.get("elementRegistry");
    const elementProcessId =
      element.type === "bpmn:Process" || element.type === "bpmn:Participant"
        ? element.id
        : element && element.parent && element.parent.id;
    const elements = elementRegistry.filter((ele) => {
      const bo = getBusinessObject(ele);
      return (
        is(ele, "bpmn:BusinessRuleTask") &&
        bo &&
        bo.resultVariable &&
        bo.decisionRef &&
        (ele && ele.parent && ele.parent.id) === elementProcessId
      );
    });
    if (elements.length > 0) {
      return true;
    }
  }, [bpmnModeler, element]);

  const getDMNValues = React.useCallback(async () => {
    const refs = [];
    const elementRegistry = bpmnModeler.get("elementRegistry");
    const elements = elementRegistry.filter((ele) => {
      const bo = getBusinessObject(ele);
      if (
        bo.decisionRef &&
        (ele.parent && ele.parent.id) ===
          (element && element.parent && element.parent.id)
      ) {
        refs.push(bo.decisionRef);
      }
      return (
        bo.decisionRef &&
        (ele.parent && ele.parent.id) ===
          (element && element.parent && element.parent.id)
      );
    });
    if (!refs || refs.length <= 0) return;
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
      elements.map((element) => {
        const table = dmnTables.find(
          (t) =>
            t.decisionId ===
            (element.businessObject && element.businessObject.decisionRef)
        );
        return {
          ...table,
          dmnNodeId: element.id,
          dmnNodeNameId: element.businessObject.name,
          resultVariable: element.businessObject.resultVariable,
        };
      });
    return tables && tables.filter((t) => t.id);
  }, [bpmnModeler, element]);

  return (
    <>
      {Builder ? (
        <Builder
          isBPMN={true}
          open={open}
          handleClose={handleClose}
          onSave={onSave}
          param={params}
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
