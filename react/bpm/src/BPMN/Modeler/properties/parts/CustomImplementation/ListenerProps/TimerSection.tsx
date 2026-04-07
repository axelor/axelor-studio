import React from "react";
import find from "lodash/find";
import { is } from "bpmn-js/lib/util/ModelUtil";
import { translate } from "@studio/shared/i18n";

import { SelectBox, TextField } from "../../../../../../components/properties/components";
import type { PropertiesPanelComponentProps } from "../../../property-types";


interface timerEventDefinitionProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timerDefinitionType?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setTimerDefinitionType?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getListener?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createTimerEventDefinition?: any;
}
import {
  timerOptions,
  getTimerDefinitionType,
  getTimerDefinition,
  createFormalExpression,
} from "./utils";

function isTimeoutTaskListener(listener: any) {
  const eventType = listener && listener.event;
  return eventType === "timeout";
}

function getTimerEventDefinition(bo: any) {
  const eventDefinitions = bo.eventDefinitions || [];
  return find(eventDefinitions, function (event: any) {
    return is(event, "bpmn:TimerEventDefinition");
  });
}

function timerEventDefinitionHandler(listener: any) {
  if (!listener || !isTimeoutTaskListener(listener)) {
    return;
  }
  const timerEventDefinition = getTimerEventDefinition(listener);
  if (!timerEventDefinition) {
    return false;
  }
  return timerEventDefinition;
}

export default function TimerSection({
  element,
  bpmnFactory,
  timerDefinitionType,
  setTimerDefinitionType,
  getListener,
  createTimerEventDefinition,
}: timerEventDefinitionProps) {
  return (
    <React.Fragment>
      <SelectBox
        element={element}
        entry={{
          id: "listener-timer-event-definition-type",
          label: translate("Timer definition type"),
          selectOptions: timerOptions,
          emptyParameter: true,
          modelProperty: "timerDefinitionType",
          get: function (element: any, node: any) {
            const listener = getListener();
            const timerDefinition = getTimerDefinition(
              timerEventDefinitionHandler(listener),
              element,
              node,
            );
            const timerDefType = getTimerDefinitionType(timerDefinition) || "";
            setTimerDefinitionType(timerDefType);
            return {
              timerDefinitionType: timerDefType,
            };
          },
          set: function (element: any, values: any) {
            setTimerDefinitionType(values.timerDefinitionType);
            const props: Record<string, unknown> = {
              timeDuration: undefined,
              timeDate: undefined,
              timeCycle: undefined,
            };
            const listener = getListener();
            let timerDefinition = getTimerDefinition(
                timerEventDefinitionHandler(listener),
                element,
              );
            const newType = values.timerDefinitionType;
            if (!timerDefinition && typeof createTimerEventDefinition === "function") {
              timerDefinition = createTimerEventDefinition(listener);
            }
            if (values.timerDefinitionType) {
              const oldType = getTimerDefinitionType(timerDefinition);

              let value: any;
              if (oldType) {
                const definition = timerDefinition.get(oldType);
                value = definition.get("body");
              }
              props[newType] = createFormalExpression(timerDefinition, value, bpmnFactory);
            }
            Object.entries(props).forEach(([key, value]) => {
              timerDefinition[key] = value;
            });
            if (!listener) return;
            listener.eventDefinitions = [timerDefinition];
          },
        }}
      />
      {(timerDefinitionType || timerDefinitionType !== "") && (
        <TextField
          element={element}
          canRemove={true}
          entry={{
            id: "listener-timer-event-definition",
            label: translate("Timer definition"),
            modelProperty: "timerDefinition",
            get: function (element: any, node: any) {
              const listener = getListener();
              const timerDefinition = getTimerDefinition(
                  timerEventDefinitionHandler(listener),
                  element,
                  node,
                ),
                type = getTimerDefinitionType(timerDefinition),
                definition = type && timerDefinition.get(type),
                value = definition && definition.get("body");

              return {
                timerDefinition: value,
              };
            },
            set: function (element: any, values: any, node: any) {
              const listener = getListener();
              const timerDefinition = getTimerDefinition(
                  timerEventDefinitionHandler(listener),
                  element,
                  node,
                ),
                type = getTimerDefinitionType(timerDefinition),
                definition = type && timerDefinition.get(type);
              if (definition) {
                definition.body = values.timerDefinition || undefined;
              }
              if (!listener) return;
              listener.eventDefinitions = [timerDefinition];
            },
            validate: function (e, values) {
              if (!values.timerDefinition && timerDefinitionType) {
                return {
                  timerDefinition: translate("Must provide a value"),
                };
              }
            },
          }}
        />
      )}
    </React.Fragment>
  );
}
