import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import React, { useEffect, useState } from "react";

import {
  getCompensateEventDefinition,
  getConditionalEventDefinition,
  getErrorEventDefinition,
  getEscalationEventDefinition,
  getMessageEventDefinition,
  getSignalEventDefinition,
  getTimerEventDefinition,
} from "../../../../../utils/EventDefinitionUtil";
import CollapsePanel from "../components/CollapsePanel";
import type { PropertiesPanelComponentProps } from "../../property-types";

import Compensation from "./CompensateEventDefinition";
import Condition from "./ConditionalEventDefinition";
import Error from "./ErrorEventDefinition";
import Escalation from "./EscalationEventDefinition";
import Message from "./MessageEventDefinition";
import Signal from "./SignalEventDefinition";
import Timer from "./TimerEventDefinition";

const events = [
  "bpmn:StartEvent",
  "bpmn:EndEvent",
  "bpmn:IntermediateThrowEvent",
  "bpmn:BoundaryEvent",
  "bpmn:IntermediateCatchEvent",
];

// Escalation Event Definition
const escalationEvents = [
  "bpmn:StartEvent",
  "bpmn:BoundaryEvent",
  "bpmn:IntermediateThrowEvent",
  "bpmn:EndEvent",
];

// Error Event Definition
const errorEvents = ["bpmn:StartEvent", "bpmn:BoundaryEvent", "bpmn:EndEvent"];

// Timer Event Definition
const timerEvents = ["bpmn:StartEvent", "bpmn:BoundaryEvent", "bpmn:IntermediateCatchEvent"];

// Conditional Event Definition
const conditionalEvents = [
  "bpmn:StartEvent",
  "bpmn:BoundaryEvent",
  "bpmn:IntermediateThrowEvent",
  "bpmn:IntermediateCatchEvent",
];

// Compensate Event Definition
const compensationEvents = ["bpmn:EndEvent", "bpmn:IntermediateThrowEvent"];

export default function EventProps({
  element,
  _index,
  label,
  bpmnFactory,
  bpmnModdle,
  bpmnModeler,
  id,
}: PropertiesPanelComponentProps) {
  const [isVisible, setVisible] = useState(false);
  const [renderType, setRenderType] = useState<any>(null);

  const renderComponent = () => {
    if (!renderType && !renderType.type) return;
    switch (renderType.type) {
      case "message":
        return (
          <Message
            element={element}
            bpmnFactory={bpmnFactory}
            messageEventDefinition={renderType.eventDefinition}
            bpmnModdle={bpmnModdle}
            bpmnModeler={bpmnModeler}
            id={id}
          />
        );
      case "signal":
        return (
          <Signal
            element={element}
            bpmnFactory={bpmnFactory}
            bpmnModdle={bpmnModdle}
            bpmnModeler={bpmnModeler}
            signalEventDefinition={renderType.eventDefinition}
            id={id}
          />
        );
      case "escalation":
        return (
          <Escalation
            element={element}
            bpmnFactory={bpmnFactory}
            bpmnModdle={bpmnModdle}
            bpmnModeler={bpmnModeler}
            escalationEventDefinition={renderType.eventDefinition}
            showEscalationCodeVariable={renderType.showEscalationCodeVariable}
          />
        );
      case "timer":
        return (
          <Timer
            element={element}
            bpmnFactory={bpmnFactory}
            timerEventDefinition={renderType.eventDefinition}
            bpmnModeler={bpmnModeler}
          />
        );
      case "compensation":
        return (
          <Compensation
            element={element}
            bpmnFactory={bpmnFactory}
            compensateEventDefinition={renderType.eventDefinition}
            bpmnModeler={bpmnModeler}
          />
        );
      case "condition":
        return (
          <Condition
            element={element}
            bpmnFactory={bpmnFactory}
            conditionalEventDefinition={renderType.eventDefinition}
            bpmnModeler={bpmnModeler}
          />
        );
      case "error":
        return (
          <Error
            element={element}
            bpmnFactory={bpmnFactory}
            errorEventDefinition={renderType.eventDefinition}
            bpmnModdle={bpmnModdle}
            bpmnModeler={bpmnModeler}
          />
        );
      default:
        return <React.Fragment></React.Fragment>;
    }
  };

  useEffect(() => {
    let renderType = null;
    // Message and Signal Event Definition
    events.forEach((event: any) => {
      if (is(element, event)) {
        const messageEventDefinition = getMessageEventDefinition(element),
          signalEventDefinition = getSignalEventDefinition(element);

        if (messageEventDefinition) {
          renderType = {
            eventDefinition: messageEventDefinition,
            type: "message",
          };
        }

        if (signalEventDefinition) {
          renderType = {
            eventDefinition: signalEventDefinition,
            type: "signal",
          };
        }
      }
    });

    // Special Case: Receive Task
    if (is(element, "bpmn:ReceiveTask")) {
      const messageEventDefinition = getBusinessObject(element);
      renderType = {
        eventDefinition: messageEventDefinition,
        type: "message",
      };
    }

    if (is(element, "bpmn:SendTask")) {
      const messageEventDefinition = getBusinessObject(element);
      renderType = {
        eventDefinition: messageEventDefinition,
        type: "message",
      };
    }

    errorEvents.forEach((event: any) => {
      if (is(element, event)) {
        const errorEventDefinition = getErrorEventDefinition(element);

        if (errorEventDefinition) {
          renderType = {
            eventDefinition: errorEventDefinition,
            type: "error",
          };
        }
      }
    });

    escalationEvents.forEach((event: any) => {
      if (is(element, event)) {
        const showEscalationCodeVariable =
          is(element, "bpmn:StartEvent") || is(element, "bpmn:BoundaryEvent");

        // get business object
        const escalationEventDefinition = getEscalationEventDefinition(element);

        if (escalationEventDefinition) {
          renderType = {
            eventDefinition: escalationEventDefinition,
            type: "escalation",
            showEscalationCodeVariable: showEscalationCodeVariable,
          };
        }
      }
    });

    timerEvents.forEach((event: any) => {
      if (is(element, event)) {
        // get business object
        const timerEventDefinition = getTimerEventDefinition(element);

        if (timerEventDefinition) {
          renderType = {
            eventDefinition: timerEventDefinition,
            type: "timer",
          };
        }
      }
    });

    compensationEvents.forEach((event: any) => {
      if (is(element, event)) {
        // get business object
        const compensateEventDefinition = getCompensateEventDefinition(element);

        if (compensateEventDefinition) {
          renderType = {
            eventDefinition: compensateEventDefinition,
            type: "compensation",
          };
        }
      }
    });

    if (isAny(element, conditionalEvents)) {
      // get business object
      const conditionalEventDefinition = getConditionalEventDefinition(element);

      if (conditionalEventDefinition) {
        renderType = {
          eventDefinition: conditionalEventDefinition,
          type: "condition",
        };
      }
    }
    setRenderType(renderType);
    if (renderType) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [element]);

  return (
    isVisible && (
      <CollapsePanel label={label}>
        <div>{renderComponent()}</div>
      </CollapsePanel>
    )
  );
}
