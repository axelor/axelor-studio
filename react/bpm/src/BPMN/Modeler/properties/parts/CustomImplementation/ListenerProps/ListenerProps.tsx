import React, { useEffect, useState } from "react";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { translate } from "@studio/shared/i18n";
import { useDialog } from "@studio/shared/hooks";

import type { PropertiesPanelComponentProps } from "../../../property-types";
import { getLinkEventDefinition } from "../../../../../../utils/EventDefinitionUtil";
import {
  getImplementationType,
  isSequenceFlow as _isSequenceFlow,
} from "../../../../../../utils/ImplementationTypeUtils";
import { createElement } from "../../../../../../utils/ElementUtil";
import { ExtensionElementTable } from "../../../../../../components/properties/components";
import CollapsePanel from "../../components/CollapsePanel";

import ListenerDetailSection from "./ListenerDetailSection";
import {
  CAMUNDA_EXECUTION_LISTENER_ELEMENT,
  CAMUNDA_TASK_LISTENER_ELEMENT,
  LISTENER_TYPE_LABEL,
  getListeners,
} from "./utils";

export default function ListenerProps({
  element,
  _index,
  label,
  bpmnFactory,
  bpmnModeler,
}: PropertiesPanelComponentProps) {
  const [isVisible, setVisible] = useState(false);
  const [selectedExecutionEntity, setSelectedExecutionEntity] = useState<any>(null);
  const [selectedTaskEntity, setSelectedTaskEntity] = useState<any>(null);
  const [eventType, setEventType] = useState<any>(null);
  const [timerDefinitionType, setTimerDefinitionType] = useState("");
  const [taskOptions, setTaskOptions] = useState<any>(null);
  const [executionOptions, setExecutionOptions] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [_openAlert, _setAlert] = useState(false);
  const [openScriptDialog, setOpenScriptDialog] = useState(false);
  const [script, setScript] = useState("");
  const isSequenceFlow = _isSequenceFlow(element);
  const openDialog = useDialog();

  const getBO = React.useCallback(() => {
    const bo = getBusinessObject(element);
    if (is(element, "bpmn:Participant")) {
      return bo.get("processRef") || bo;
    }
    return bo;
  }, [element]);

  const getExecutionOptions = () => {
    const executionListenerEventTypeOptions = _isSequenceFlow(element)
      ? [{ name: translate("take"), value: "take" }]
      : [
          { name: translate("start"), value: "start" },
          { name: translate("end"), value: "end" },
        ];
    return executionListenerEventTypeOptions;
  };

  const newElement = (element: any, type: any, initialEvent: any) => {
    return function (e: any, extensionEle: any, _value: any) {
      if (!bpmnFactory) return;
      const props = {
        event: initialEvent,
        script: undefined,
      };

      const newElem = createElement(type, props, extensionEle, bpmnFactory);

      const bo = getBO();
      let extensionElements = bo.get("extensionElements");
      if (!extensionElements) {
        extensionElements = createElement(
          "bpmn:ExtensionElements",
          { values: [] },
          bo,
          bpmnFactory,
        );
        bo.extensionElements = extensionElements;
      }
      extensionElements.get("values").push(newElem);
      return newElem;
    };
  };

  const removeElement = (type: any) => {
    return function (index: any) {
      if (Number(index) < 0) return;
      const bo = getBO();
      const ext = bo.get("extensionElements");
      const allValues = ext?.get("values") || [];
      const matchingElements = allValues.filter((e: any) => e.$type === type);
      matchingElements.splice(index, 1);
      const newValues = [...allValues.filter((e: any) => e.$type !== type), ...matchingElements];
      ext.values = newValues;
      addOptions(element);
      if (!matchingElements.length) {
        if (type === CAMUNDA_EXECUTION_LISTENER_ELEMENT) {
          setSelectedExecutionEntity(null);
        } else {
          setSelectedTaskEntity(null);
        }
      } else {
        setSelectedExecutionEntity(null);
        setSelectedTaskEntity(null);
      }
    };
  };

  const getListener = React.useCallback(() => {
    const type =
      selectedExecutionEntity === 0 || selectedExecutionEntity
        ? CAMUNDA_EXECUTION_LISTENER_ELEMENT
        : CAMUNDA_TASK_LISTENER_ELEMENT;
    const bo = getBO();
    const listeners = getListeners(bo, type);
    const listener =
      listeners[
        selectedExecutionEntity === 0 || selectedExecutionEntity
          ? selectedExecutionEntity
          : selectedTaskEntity
      ];
    return listener || (listeners && listeners[0]);
  }, [getBO, selectedExecutionEntity, selectedTaskEntity]);

  const showExecutionListener = () => {
    if (
      is(element, "bpmn:FlowElement") ||
      is(element, "bpmn:Process") ||
      is(element, "bpmn:Participant")
    ) {
      const bo = getBO();
      return bo ? true : false;
    } else {
      return false;
    }
  };

  const setOptionLabelValue = (type: any) => {
    const bo = getBO();
    return function (index: any) {
      const listeners = getListeners(bo, type);
      const listener = listeners[index];
      const listenerType = getImplementationType(listener);
      if (!listener) return "";
      const event = listener.get("event") ? listener.get("event") : `<${translate("empty")}>`;

      const labelVal =
        (translate(event) || "*") +
        " : " +
        // @ts-expect-error -- safety: bpmn-js dynamic property key type
        (translate(LISTENER_TYPE_LABEL[listenerType]) || translate("Script"));
      return labelVal;
    };
  };

  const addOptions = (element: any, isInitial = false) => {
    const bo = getBO();
    const executionListeners = getListeners(bo, CAMUNDA_EXECUTION_LISTENER_ELEMENT);

    const execOpts =
      executionListeners &&
      executionListeners.map(function (l: any, index: any) {
        const listenerType = getImplementationType(l);
        return {
          id: index,
          text: `${translate(l.event)} : ${
            // @ts-expect-error -- safety: bpmn-js dynamic property key type
            translate(LISTENER_TYPE_LABEL[listenerType]) || translate("Script")
          }`,
        };
      });

    const taskListeners = getListeners(bo, CAMUNDA_TASK_LISTENER_ELEMENT);
    const taskOpts =
      taskListeners &&
      taskListeners.map(function (l: any, index: any) {
        const listenerType = getImplementationType(l);
        return {
          id: index,
          text: `${translate(l.event)} : ${
            // @ts-expect-error -- safety: bpmn-js dynamic property key type
            translate(LISTENER_TYPE_LABEL[listenerType]) || translate("Script")
          }`,
        };
      });
    setExecutionOptions(execOpts);
    setTaskOptions(taskOpts);
    if (isInitial) {
      if (execOpts.length > 0) {
        setSelectedExecutionEntity(execOpts[0]);
        setSelectedTaskEntity(null);
      } else if (taskOpts.length > 0) {
        setSelectedExecutionEntity(null);
        setSelectedTaskEntity(taskOpts[0]);
      }
    }
  };

  const setScriptValue = (values: any) => {
    const listener = getListener();
    if (!listener?.script) {
      if (!bpmnFactory) return;
      listener.script =
        listener.script ||
        createElement(
          "camunda:Script",
          {
            scriptFormat: "axelor",
            value: values.script,
          },
          getBO(),
          bpmnFactory,
        );
    } else {
      if (!listener) return;
      listener.script.value = values.script;
      listener.script.resource = undefined;
      listener.script.scriptFormat = "axelor";
    }
  };

  useEffect(() => {
    setVisible(
      // @ts-expect-error -- safety: bpmn-js element type mismatch with strict PropertiesPanelComponentProps
      !getLinkEventDefinition(element) ||
        (!is(element, "bpmn:IntermediateThrowEvent") && getLinkEventDefinition(element)),
    );
  }, [element]);

  useEffect(() => {
    addOptions(element, true);
  }, [element]);

  return (
    isVisible && (
      <CollapsePanel label={label}>
        {showExecutionListener() && (
          <ExtensionElementTable
            element={element}
            options={executionOptions}
            entry={{
              id: "executionListeners",
              label: translate("Execution listener"),
              modelProperty: "name",
              idGeneration: "false",
              reference: "processRef",
              createExtensionElement: newElement(
                element,
                CAMUNDA_EXECUTION_LISTENER_ELEMENT,
                isSequenceFlow ? "take" : "start",
              ),
              removeExtensionElement: removeElement(CAMUNDA_EXECUTION_LISTENER_ELEMENT),
              onSelectionChange: function (value: any) {
                setSelectedExecutionEntity(value);
                setSelectedTaskEntity(null);
              },
              setOptionLabelValue: setOptionLabelValue(CAMUNDA_EXECUTION_LISTENER_ELEMENT),
            }}
          />
        )}
        {is(element, "bpmn:UserTask") && (
          <ExtensionElementTable
            element={element}
            options={taskOptions}
            entry={{
              id: "taskListeners",
              label: translate("Task listener"),
              modelProperty: "name",
              idGeneration: "false",
              createExtensionElement: newElement(element, CAMUNDA_TASK_LISTENER_ELEMENT, "create"),
              removeExtensionElement: removeElement(CAMUNDA_TASK_LISTENER_ELEMENT),
              onSelectionChange: function (value: any) {
                setSelectedTaskEntity(value);
                setSelectedExecutionEntity(null);
              },
              setOptionLabelValue: setOptionLabelValue(CAMUNDA_TASK_LISTENER_ELEMENT),
            }}
          />
        )}
        {(selectedExecutionEntity ||
          selectedExecutionEntity === 0 ||
          selectedTaskEntity ||
          selectedTaskEntity === 0) && (
          <ListenerDetailSection
            element={element}
            bpmnModeler={bpmnModeler}
            bpmnFactory={bpmnFactory}
            selectedExecutionEntity={selectedExecutionEntity}
            selectedTaskEntity={selectedTaskEntity}
            eventType={eventType}
            setEventType={setEventType}
            timerDefinitionType={timerDefinitionType}
            setTimerDefinitionType={setTimerDefinitionType}
            open={open}
            setOpen={setOpen}
            openScriptDialog={openScriptDialog}
            setOpenScriptDialog={setOpenScriptDialog}
            script={script}
            setScript={setScript}
            getListener={getListener}
            getBO={getBO}
            getExecutionOptions={getExecutionOptions}
            setScriptValue={setScriptValue}
            addOptions={addOptions}
            openDialog={openDialog}
          />
        )}
      </CollapsePanel>
    )
  );
}
