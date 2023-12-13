import React, { useEffect, useState } from "react";
import eventDefinitionHelper from "bpmn-js-properties-panel/lib/helper/EventDefinitionHelper";
import { makeStyles } from "@material-ui/core/styles";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import TextField from "../../../../../components/properties/components/TextField";
import { translate } from "../../../../../utils";
import { setDummyProperty } from "./utils";

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

export default function StartEventInitiator({
  element,
  index,
  label,
  bpmnModeler,
}) {
  const [isVisible, setVisible] = useState(false);
  const classes = useStyles();

  const showLabel = () => {
    if (!element) return;
    let messageEventDefinition = eventDefinitionHelper.getMessageEventDefinition(
      element
    );
    if (messageEventDefinition) {
      return false;
    }
    let timerEventDefinition = eventDefinitionHelper.getTimerEventDefinition(
      element
    );
    if (timerEventDefinition) {
      return false;
    }
    let signalEventDefinition = eventDefinitionHelper.getSignalEventDefinition(
      element
    );
    if (signalEventDefinition) {
      return false;
    }
    let conditionalEventDefinition = eventDefinitionHelper.getConditionalEventDefinition(
      element
    );
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
              {index > 0 && <div className={classes.divider} />}
            </React.Fragment>
            <div className={classes.groupLabel}>{translate(label)}</div>
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
