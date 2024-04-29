import React, { useEffect, useState } from "react";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";

import Message from "./MessageEventDefinition";
import Signal from "./SignalEventDefinition";
import Escalation from "./EscalationEventDefinition";
import Timer from "./TimerEventDefinition";
import Compensation from "./CompensateEventDefinition";
import Condition from "./ConditionalEventDefinition";
import Error from "./ErrorEventDefinition";
import { Box, Divider } from "@axelor/ui";
import { translate } from "../../../../../utils";
import styles from "./EventProps.module.css";
import {
  getCompensateEventDefinition,
  getErrorEventDefinition,
  getEscalationEventDefinition,
  getMessageEventDefinition,
  getSignalEventDefinition,
  getTimerEventDefinition,
  getConditionalEventDefinition
} from "../../../../../utils/EventDefinitionUtil";


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
const timerEvents = [
  "bpmn:StartEvent",
  "bpmn:BoundaryEvent",
  "bpmn:IntermediateCatchEvent",
];

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
  index,
  label,
  bpmnFactory,
  bpmnModdle,
  bpmnModeler,
  id,
  setDummyProperty = () => {},
}) {
  const [isVisible, setVisible] = useState(false);
  const [renderType, setRenderType] = useState(null);

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
            setDummyProperty={setDummyProperty}
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
            setDummyProperty={setDummyProperty}
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
            setDummyProperty={setDummyProperty}
          />
        );
      case "timer":
        return (
          <Timer
            element={element}
            bpmnFactory={bpmnFactory}
            timerEventDefinition={renderType.eventDefinition}
            bpmnModeler={bpmnModeler}
            setDummyProperty={setDummyProperty}
          />
        );
      case "compensation":
        return (
          <Compensation
            element={element}
            bpmnFactory={bpmnFactory}
            compensateEventDefinition={renderType.eventDefinition}
            bpmnModeler={bpmnModeler}
            setDummyProperty={setDummyProperty}
          />
        );
      case "condition":
        return (
          <Condition
            element={element}
            bpmnFactory={bpmnFactory}
            conditionalEventDefinition={renderType.eventDefinition}
            bpmnModeler={bpmnModeler}
            setDummyProperty={setDummyProperty}
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
            setDummyProperty={setDummyProperty}
          />
        );
      default:
        return <React.Fragment></React.Fragment>;
    }
  };

  useEffect(() => {
    let renderType = null;
    // Message and Signal Event Definition
    events.forEach((event) => {
      if (is(element, event)) {
        let messageEventDefinition =
          getMessageEventDefinition(element),
          signalEventDefinition =
            getSignalEventDefinition(element);

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
      let messageEventDefinition = getBusinessObject(element);
      renderType = {
        eventDefinition: messageEventDefinition,
        type: "message",
      };
    }

    if (is(element, "bpmn:SendTask")) {
      let messageEventDefinition = getBusinessObject(element);
      renderType = {
        eventDefinition: messageEventDefinition,
        type: "message",
      };
    }

    errorEvents.forEach((event) => {
      if (is(element, event)) {
        let errorEventDefinition =
          getErrorEventDefinition(element);

        if (errorEventDefinition) {
          renderType = {
            eventDefinition: errorEventDefinition,
            type: "error",
          };
        }
      }
    });

    escalationEvents.forEach((event) => {
      if (is(element, event)) {
        let showEscalationCodeVariable =
          is(element, "bpmn:StartEvent") || is(element, "bpmn:BoundaryEvent");

        // get business object
        let escalationEventDefinition =
          getEscalationEventDefinition(element);

        if (escalationEventDefinition) {
          renderType = {
            eventDefinition: escalationEventDefinition,
            type: "escalation",
            showEscalationCodeVariable: showEscalationCodeVariable,
          };
        }
      }
    });

    timerEvents.forEach((event) => {
      if (is(element, event)) {
        // get business object
        let timerEventDefinition =
          getTimerEventDefinition(element);

        if (timerEventDefinition) {
          renderType = {
            eventDefinition: timerEventDefinition,
            type: "timer",
          };
        }
      }
    });

    compensationEvents.forEach((event) => {
      if (is(element, event)) {
        // get business object
        let compensateEventDefinition =
          getCompensateEventDefinition(element);

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
      let conditionalEventDefinition =
        getConditionalEventDefinition(element);

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
      <div>
        <React.Fragment>
          {index > 0 && <Divider className={styles.divider} />}
        </React.Fragment>
        <Box color="body" className={styles.groupLabel}>
          {translate(label)}
        </Box>
        <div>{renderComponent()}</div>
      </div>
    )
  );
}
