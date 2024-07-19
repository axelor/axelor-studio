import React, { useState, useEffect } from "react";
import { Checkbox } from "../../../../../components/properties/components";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { translate, getBool } from "../../../../../utils";

export default function StartOnListenerProps(props) {
  const { element, bpmnModeler, setDummyProperty = () => {} } = props;
  const [startOnListener, setStartOnListener] = useState(true);

  const getProperty = React.useCallback(
    (name) => {
      let propertyName = `camunda:${name}`;
      let bo = getBusinessObject(element);
      if (is(element, "bpmn:Participant")) {
        bo = getBusinessObject(element).get("processRef");
      }
      return (bo && bo.$attrs && bo.$attrs[propertyName]) || "";
    },
    [element]
  );

  const setProperty = React.useCallback(
    (name, value) => {
      setDummyProperty({ bpmnModeler, element, value });
      let bo = getBusinessObject(element);
      if ((element && element.type) === "bpmn:Participant") {
        bo = getBusinessObject(bo && bo.processRef);
      }
      let propertyName = `camunda:${name}`;
      if (!bo) return;
      if (bo.$attrs) {
        bo.$attrs[propertyName] = value;
      } else {
        bo.$attrs = { [propertyName]: value };
      }
      if (value === undefined || value === null) {
        delete bo.$attrs[propertyName];
      }
    },
    [element, bpmnModeler]
  );

  useEffect(() => {
    const startOnListener = getProperty("startOnListener");
    setStartOnListener(getBool(startOnListener));
  });

  return (
    <div>
      <Checkbox
        element={element}
        entry={{
          id: "process-is-start-on-listener",
          label: translate("Start on listener"),
          modelProperty: "startOnListener",
          get: function () {
            return {
              startOnListener: startOnListener,
            };
          },
          set: function (e, value) {
            const startOnListener = !value.startOnListener;
            setStartOnListener(startOnListener);
            setProperty("startOnListener", startOnListener);
          },
        }}
      />
    </div>
  );
}
