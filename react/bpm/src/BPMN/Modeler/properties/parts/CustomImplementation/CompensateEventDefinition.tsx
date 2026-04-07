import React from "react";
import forEach from "lodash/forEach";
import find from "lodash/find";
import filter from "lodash/filter";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { translate } from "@studio/shared/i18n";

import { Checkbox, SelectBox } from "../../../../../components/properties/components";
import { getCompensateEventDefinition } from "../../../../../utils/EventDefinitionUtil";
import { filterElementsByType } from "../../../../../utils/ElementUtil";
import type { PropertiesPanelComponentProps } from "../../property-types";


interface CompensatePropsProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  compensateEventDefinition?: any;
}
function getContainedActivities(element: any) {
  return getFlowElements(element, "bpmn:Activity");
}

function getContainedBoundaryEvents(element: any) {
  return getFlowElements(element, "bpmn:BoundaryEvent");
}

function getFlowElements(element: any, type: string) {
  return filterElementsByType(element.flowElements, type);
}

function isCompensationEventAttachedToActivity(activity: any, boundaryEvents: any) {
  const activityId = activity.id;
  const boundaryEvent = find(boundaryEvents, function (boundaryEvent: any) {
    const compensateEventDefinition = getCompensateEventDefinition(boundaryEvent);
    const attachedToRef = boundaryEvent.attachedToRef;
    return compensateEventDefinition && attachedToRef && attachedToRef.id === activityId;
  });
  return !!boundaryEvent;
}

function canActivityBeCompensated(activity: any, boundaryEvents: any) {
  return (
    (is(activity, "bpmn:SubProcess") && !activity.triggeredByEvent) ||
    is(activity, "bpmn:CallActivity") ||
    isCompensationEventAttachedToActivity(activity, boundaryEvents)
  );
}

function getActivitiesForCompensation(element: any) {
  const boundaryEvents = getContainedBoundaryEvents(element);
  return filter(getContainedActivities(element), function (activity) {
    return canActivityBeCompensated(activity, boundaryEvents);
  });
}

function getActivitiesForActivityRef(element: any) {
  const bo = getBusinessObject(element);
  let parent = bo && bo.$parent;
  let activitiesForActivityRef = getActivitiesForCompensation(parent);
  if (is(parent, "bpmn:SubProcess") && parent.triggeredByEvent) {
    parent = parent.$parent;
    if (parent) {
      activitiesForActivityRef = activitiesForActivityRef.concat(
        getActivitiesForCompensation(parent),
      );
    }
  }
  return activitiesForActivityRef;
}

function createActivityRefOptions(element: any) {
  const options: any[] = [];
  const activities = getActivitiesForActivityRef(element);
  forEach(activities, function (activity: any) {
    const activityId = activity.id;
    const name = (activity.name ? activity.name + " " : "") + "(id=" + activityId + ")";
    options.push({ value: activityId, name: name });
  });
  return options;
}

export default function CompensateProps({
  element,
  _bpmnFactory,
  bpmnModeler,
  compensateEventDefinition,
}: CompensatePropsProps) {
  return (
    <div>
      <Checkbox
        element={element}
        entry={{
          id: "wait-for-completion",
          label: translate("Wait for completion"),
          modelProperty: "waitForCompletion",
          widget: "checkbox",
          get: function () {
            if (!compensateEventDefinition) return;
            return {
              waitForCompletion: compensateEventDefinition.waitForCompletion,
            };
          },
          set: function (element: any, values: any) {
            if (!compensateEventDefinition) return;
            compensateEventDefinition.waitForCompletion = !values.waitForCompletion || false;
          },
        }}
      />
      <SelectBox
        element={element}
        entry={{
          id: "activity-ref",
          label: translate("Activity ref"),
          selectOptions: createActivityRefOptions(element),
          modelProperty: "activityRef",
          get: function () {
            let activityRef = compensateEventDefinition.activityRef;
            activityRef = activityRef && activityRef.id;
            return {
              activityRef: activityRef || "",
            };
          },

          set: function (e: any, values: any) {
            let activityRef = values.activityRef || undefined;
            if (!bpmnModeler) return;
            const elementRegistry = bpmnModeler.get("elementRegistry");
            activityRef =
              activityRef && getBusinessObject(elementRegistry && elementRegistry.get(activityRef));
            if (!compensateEventDefinition) return;
            compensateEventDefinition.activityRef = activityRef;
          },
        }}
      />
    </div>
  );
}
