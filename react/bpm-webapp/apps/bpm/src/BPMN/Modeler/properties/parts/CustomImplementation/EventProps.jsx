import React, { useEffect, useState } from "react";
import eventDefinitionHelper from "bpmn-js-properties-panel/lib/helper/EventDefinitionHelper";
import { makeStyles } from "@material-ui/core/styles";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";

import Message from "./MessageEventDefinition";
import Signal from "./SignalEventDefinition";
import Escalation from "./EscalationEventDefinition";
import Timer from "./TimerEventDefinition";
import Compensation from "./CompensateEventDefinition";
import Condition from "./ConditionalEventDefinition";
import Error from "./ErrorEventDefinition";

const useStyles = makeStyles({
  groupLabel: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    fontSize: "120%",
    margin: "10px 0px",
    transition: "margin 0.218s linear",
    fontStyle: "italic",
  },
  divider: {
    marginTop: 15,
    borderTop: "1px dotted #ccc",
  },
});

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
  id
}) {
  const [isVisible, setVisible] = useState(false);
  const [renderType, setRenderType] = useState(null);
  const classes = useStyles();

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
    events.forEach((event) => {
      if (is(element, event)) {
        let messageEventDefinition = eventDefinitionHelper.getMessageEventDefinition(
          element
        ),
          signalEventDefinition = eventDefinitionHelper.getSignalEventDefinition(
            element
          );

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
        let errorEventDefinition = eventDefinitionHelper.getErrorEventDefinition(
          element
        );

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
        let escalationEventDefinition = eventDefinitionHelper.getEscalationEventDefinition(
          element
        );

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
        let timerEventDefinition = eventDefinitionHelper.getTimerEventDefinition(
          element
        );

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
        let compensateEventDefinition = eventDefinitionHelper.getCompensateEventDefinition(
          element
        );

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
      let conditionalEventDefinition = eventDefinitionHelper.getConditionalEventDefinition(
        element
      );

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
          {index > 0 && <div className={classes.divider} />}
        </React.Fragment>
        <div className={classes.groupLabel}>{label}</div>
        <div>{renderComponent()}</div>
      </div>
    )
  );
}
