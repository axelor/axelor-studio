import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";

import TextField from "../../../../../components/properties/components/TextField";
import { translate } from "../../../../../utils";
import { Box, Divider } from "@axelor/ui";

const useStyles = makeStyles({
  groupLabel: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    fontSize: "120%",
    margin: "10px 0px",
    transition: "margin 0.218s linear",
    fontStyle: "italic",
  },
  divider: {
    marginTop: 15,
  },
});

var linkEvents = ["bpmn:IntermediateThrowEvent", "bpmn:IntermediateCatchEvent"];

function getLinkEventDefinition(element) {
  var bo = getBusinessObject(element);

  var linkEventDefinition = null;
  if (bo && bo.eventDefinitions) {
    bo.eventDefinitions.forEach((eventDefinition) => {
      if (is(eventDefinition, "bpmn:LinkEventDefinition")) {
        linkEventDefinition = eventDefinition;
      }
    });
  }
  return linkEventDefinition;
}

export default function LinkProps({
  element,
  index,
  label,
  bpmnModeler,
  setDummyProperty = () => {},
}) {
  const [isVisible, setVisible] = useState(false);
  const [linkEventDefinition, setLinkEventDefinition] = useState(null);

  const classes = useStyles();

  useEffect(() => {
    let isVaild = false;
    linkEvents.forEach((event) => {
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
      <div>
        <React.Fragment>
          {index > 0 && <Divider className={classes.divider} />}
        </React.Fragment>
        <Box className={classes.groupLabel}>{translate(label)}</Box>
        <TextField
          element={element}
          entry={{
            id: "link-event",
            label: translate("Link name"),
            modelProperty: "link-name",
            get: function () {
              return { "link-name": linkEventDefinition.get("name") };
            },

            set: function (element, values) {
              setDummyProperty({
                bpmnModeler,
                element,
                value: values["link-name"],
              });
              element.businessObject.eventDefinitions[0].name =
                values["link-name"];
            },
          }}
          canRemove={true}
        />
      </div>
    )
  );
}
