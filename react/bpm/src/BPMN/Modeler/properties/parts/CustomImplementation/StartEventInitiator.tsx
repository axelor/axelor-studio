import React, { useEffect, useState } from "react";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { translate } from "@studio/shared/i18n";

import {
  getConditionalEventDefinition,
  getMessageEventDefinition,
  getSignalEventDefinition,
  getTimerEventDefinition,
} from "../../../../../utils/EventDefinitionUtil";
import TextField from "../../../../../components/properties/components/TextField";
import CollapsePanel from "../components/CollapsePanel";
import type { PropertiesPanelComponentProps } from "../../property-types";

export default function StartEventInitiator({
  element,
  _index,
  label,
  _bpmnModeler,
}: PropertiesPanelComponentProps) {
  const [isVisible, setVisible] = useState(false);

  const showLabel = () => {
    if (!element) return;
    const messageEventDefinition = getMessageEventDefinition(element);
    if (messageEventDefinition) {
      return false;
    }
    const timerEventDefinition = getTimerEventDefinition(element);
    if (timerEventDefinition) {
      return false;
    }
    const signalEventDefinition = getSignalEventDefinition(element);
    if (signalEventDefinition) {
      return false;
    }
    const conditionalEventDefinition = getConditionalEventDefinition(element);
    if (conditionalEventDefinition) {
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (is(element, "camunda:Initiator") && element && !is(element.parent, "bpmn:SubProcess")) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [element]);

  return (
    isVisible && (
      <CollapsePanel label={showLabel() && label}>
        <TextField
          element={element ? getBusinessObject(element) : undefined}
          entry={{
            id: "initiator",
            label: translate("Initiator"),
            modelProperty: "initiator",
            get: function () {
              const bo = getBusinessObject(element);
              return { initiator: bo && bo.get("initiator") };
            },
            set: function (element: any, values: any) {
              getBusinessObject(element).initiator = values["initiator"];
            },
          }}
          canRemove={true}
        />
      </CollapsePanel>
    )
  );
}
