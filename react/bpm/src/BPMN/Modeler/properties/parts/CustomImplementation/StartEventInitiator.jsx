import React, { useEffect, useState } from "react";
import eventDefinitionHelper from "bpmn-js-properties-panel/lib/helper/EventDefinitionHelper";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import TextField from "../../../../../components/properties/components/TextField";
import { translate } from "../../../../../utils";
import { Box, Divider } from "@axelor/ui";
import styles from "./StartEventInitiator.module.css";

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
    let messageEventDefinition =
      eventDefinitionHelper.getMessageEventDefinition(element);
    if (messageEventDefinition) {
      return false;
    }
    let timerEventDefinition =
      eventDefinitionHelper.getTimerEventDefinition(element);
    if (timerEventDefinition) {
      return false;
    }
    let signalEventDefinition =
      eventDefinitionHelper.getSignalEventDefinition(element);
    if (signalEventDefinition) {
      return false;
    }
    let conditionalEventDefinition =
      eventDefinitionHelper.getConditionalEventDefinition(element);
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
      <div>
        {showLabel() && (
          <React.Fragment>
            <React.Fragment>
              {index > 0 && <Divider className={styles.divider} />}
            </React.Fragment>
            <Box color="body" className={styles.groupLabel}>
              {translate(label)}
            </Box>
          </React.Fragment>
        )}
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
      </div>
    )
  );
}
