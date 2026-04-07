import React, { useEffect, useState } from "react";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { translate } from "@studio/shared/i18n";

import TextField from "../../../../../components/properties/components/TextField";
import CollapsePanel from "../components/CollapsePanel";
import type { PropertiesPanelComponentProps } from "../../property-types";

const linkEvents = ["bpmn:IntermediateThrowEvent", "bpmn:IntermediateCatchEvent"];

function getLinkEventDefinition(element: any) {
  const bo = getBusinessObject(element);

  let linkEventDefinition = null;
  if (bo && bo.eventDefinitions) {
    bo.eventDefinitions.forEach((eventDefinition: any) => {
      if (is(eventDefinition, "bpmn:LinkEventDefinition")) {
        linkEventDefinition = eventDefinition;
      }
    });
  }
  return linkEventDefinition;
}

export default function LinkProps({
  element,
  _index,
  label,
  _bpmnModeler,
}: PropertiesPanelComponentProps) {
  const [isVisible, setVisible] = useState(false);
  const [linkEventDefinition, setLinkEventDefinition] = useState<any>(null);

  useEffect(() => {
    let isVaild = false;
    linkEvents.forEach((event: any) => {
      if (is(element, event)) {
        isVaild = true;
      }
    });
    const linkEventDefinition = getLinkEventDefinition(element);
    if (isVaild && linkEventDefinition) {
      setVisible(true);
      setLinkEventDefinition(linkEventDefinition);
    } else {
      setVisible(false);
    }
  }, [element]);

  return (
    isVisible && (
      <CollapsePanel label={label}>
        <TextField
          element={element ? getBusinessObject(element) : undefined}
          entry={{
            id: "link-event",
            label: translate("Link name"),
            modelProperty: "link-name",
            get: function () {
              return { "link-name": linkEventDefinition.get("name") };
            },

            set: function (element: any, values: any) {
              const eventDef = getBusinessObject(element)?.eventDefinitions?.[0];
              if (eventDef) eventDef.name = values["link-name"];
            },
          }}
          canRemove={true}
        />
      </CollapsePanel>
    )
  );
}
