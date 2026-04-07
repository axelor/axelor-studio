import React, { useState, useEffect } from "react";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { translate } from "@studio/shared/i18n";

import { Checkbox } from "../../../../../components/properties/components";
import { getBool } from "../../../../../utils";

export default function StartOnListenerProps(props: any) {
  const { element, bpmnModeler } = props;
  const [onlyOnClientChange, setOnlyOnClientChange] = useState(true);

  const getProperty = React.useCallback(
    (name: string) => {
      const propertyName = `camunda:${name}`;
      let bo = getBusinessObject(element);
      if (is(element, "bpmn:Participant")) {
        bo = getBusinessObject(element).get("processRef");
      }
      return (bo && bo.$attrs && bo.$attrs[propertyName]) || "";
    },
    [element],
  );

  const setProperty = React.useCallback(
    (name: any, value: any) => {
      let bo = getBusinessObject(element);
      if ((element && element.type) === "bpmn:Participant") {
        bo = getBusinessObject(bo && bo.processRef);
      }
      const propertyName = `camunda:${name}`;
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
    [element, bpmnModeler],
  );

  useEffect(() => {
    const onlyOnClientChange = getProperty("onlyOnClientChange");
    setOnlyOnClientChange(getBool(onlyOnClientChange));
  });

  return (
    <div>
      <Checkbox
        element={element}
        entry={{
          id: "process-is-start-on-listener",
          label: translate("Trigger only on client change"),
          modelProperty: "onlyOnClientChange",
          get: function () {
            return {
              onlyOnClientChange: onlyOnClientChange,
            };
          },
          set: function (e: any, value: any) {
            const onlyOnClientChange = !value.onlyOnClientChange;
            setOnlyOnClientChange(onlyOnClientChange);
            setProperty("onlyOnClientChange", onlyOnClientChange);
          },
        }}
      />
    </div>
  );
}
