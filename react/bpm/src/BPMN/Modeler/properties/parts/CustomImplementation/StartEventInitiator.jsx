import React, { useEffect, useState } from "react";
import {
  getConditionalEventDefinition,
  getMessageEventDefinition,
  getSignalEventDefinition,
  getTimerEventDefinition,
} from "../../../../../utils/EventDefinitionUtil";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import TextField from "../../../../../components/properties/components/TextField";
import { translate } from "../../../../../utils";
import CollapsePanel from "../componants/CollapsePanel";

export default function StartEventInitiator({
  element,
  index,
  label,
  bpmnModeler,
  setDummyProperty = () => {},
}) {
  const [isVisible, setVisible] = useState(false);

  const showLabel = () => {
    if (!element) return;
    let messageEventDefinition = getMessageEventDefinition(element);
    if (messageEventDefinition) {
      return false;
    }
    let timerEventDefinition = getTimerEventDefinition(element);
    if (timerEventDefinition) {
      return false;
    }
    let signalEventDefinition = getSignalEventDefinition(element);
    if (signalEventDefinition) {
      return false;
    }
    let conditionalEventDefinition = getConditionalEventDefinition(element);
    if (conditionalEventDefinition) {
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (
      is(element, "camunda:Initiator") &&
      !is(element.parent, "bpmn:SubProcess")
    ) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [element]);

  return (
    isVisible && (
      <CollapsePanel label={showLabel() && label}>
        <TextField
          element={element}
          entry={{
            id: "initiator",
            label: translate("Initiator"),
            modelProperty: "initiator",
            get: function () {
              const bo = getBusinessObject(element);
              return { initiator: bo && bo.get("initiator") };
            },
            set: function (element, values) {
              setDummyProperty({
                bpmnModeler,
                element,
                value: values["initiator"],
              });
              element.businessObject.initiator = values["initiator"];
            },
          }}
          canRemove={true}
        />
      </CollapsePanel>
    )
  );
}
