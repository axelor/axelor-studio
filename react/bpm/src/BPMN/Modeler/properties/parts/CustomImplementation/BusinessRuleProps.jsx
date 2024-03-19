import React, { useEffect, useState } from "react";
import extensionElementsHelper from "bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import {
  Checkbox,
  SelectBox,
} from "../../../../../components/properties/components";
import { translate, getBool } from "../../../../../utils";
import { Box, Divider } from "@axelor/ui";
import styles from "./BusinessRuleProps.module.css";

export default function BusinessRuleTaskProps({
  element,
  index,
  bpmnModeler,
  setDummyProperty = () => {},
}) {
  const [isVisible, setVisible] = useState(false);
  const [searchWith, setSearchWith] = useState(null);
  const [ifMultiple, setIfMultiple] = useState(null);
  const [assignOutputToFields, setAssignOutputToFields] = useState(null);

  const setProperty = (name, value) => {
    setDummyProperty({ bpmnModeler, element, value });
    const bo = getBusinessObject(element);
    let propertyName = `camunda:${name}`;
    if (!bo) return;
    if (bo.$attrs) {
      bo.$attrs[propertyName] = value;
    } else {
      bo.$attrs = { [propertyName]: value };
    }
    if (!value) {
      delete bo.$attrs[propertyName];
    }
  };

  const getProperty = React.useCallback(
    (name) => {
      if (!element) return;
      let propertyName = `camunda:${name}`;
      const bo = getBusinessObject(element);
      return (bo.$attrs && bo.$attrs[propertyName]) || "";
    },
    [element]
  );

  function getListeners(bo, type) {
    return (bo && extensionElementsHelper.getExtensionElements(bo, type)) || [];
  }

  const getBO = () => {
    let bo = getBusinessObject(element);
    if (is(element, "bpmn:Participant")) {
      bo = bo.get("processRef");
    }
    return bo;
  };

  const removeElement = () => {
    let bo = getBO();
    const listeners = getListeners(bo, "camunda:ExecutionListener");
    if (!listeners || listeners.length < 0) return;
    const listenerIndex = listeners.findIndex(
      (l) => l && l.$attrs && l.$attrs["outId"] === "dmn_output_mapping"
    );
    let extensionElements =
      bo && bo.extensionElements && bo.extensionElements.values;
    if (extensionElements) {
      extensionElements.splice(listenerIndex, 1);
    }
    if (extensionElements && extensionElements.length === 0) {
      extensionElements = undefined;
    }
    bo.extensionElements = extensionElements;
  };

  useEffect(() => {
    const assignOutputToFields = getProperty("assignOutputToFields");
    const searchWith = getProperty("searchWith");
    const ifMultiple = getProperty("ifMultiple");

    setAssignOutputToFields(getBool(assignOutputToFields));
    setIfMultiple(ifMultiple);
    setSearchWith(searchWith);
  }, [getProperty]);

  useEffect(() => {
    if (is(element, "bpmn:BusinessRuleTask")) {
      const bo = getBusinessObject(element);
      if (bo) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    } else {
      setVisible(false);
    }
  }, [element]);

  return (
    isVisible && (
      <div>
        <Checkbox
          element={element}
          entry={{
            id: "assign-output-to-fields",
            label: translate("Assign output to fields"),
            modelProperty: "assignOutputToFields",
            widget: "checkbox",
            get: function () {
              return {
                assignOutputToFields,
              };
            },
            set: function (e, value) {
              let assignOutputToFields = !value.assignOutputToFields;
              setAssignOutputToFields(assignOutputToFields);
              setProperty("assignOutputToFields", assignOutputToFields);
              if (assignOutputToFields === false) {
                removeElement();
              }
            },
          }}
        />
        {assignOutputToFields && (
          <React.Fragment>
            <React.Fragment>
              {index > 0 && <Divider className={styles.divider} />}
            </React.Fragment>
            <Box color="body" className={styles.groupLabel}>
              {translate("Relational field search")}
            </Box>
            <SelectBox
              element={element}
              entry={{
                id: "searchWith",
                label: "Search with",
                modelProperty: "searchWith",
                selectOptions: [
                  { name: translate("Equal"), value: "Equal" },
                  { name: translate("Like"), value: "Like" },
                ],
                emptyParameter: true,
                get: function () {
                  return { searchWith: searchWith };
                },
                set: function (e, value) {
                  let searchWith = value.searchWith;
                  setSearchWith(searchWith);
                  setProperty("searchWith", searchWith);
                },
              }}
            />
            <SelectBox
              element={element}
              entry={{
                id: "ifMultiple",
                label: "If multiple",
                modelProperty: "ifMultiple",
                selectOptions: [
                  { name: translate("Keep empty"), value: "Keep empty" },
                  { name: translate("Select first"), value: "Select first" },
                ],
                emptyParameter: true,
                get: function () {
                  return { ifMultiple: ifMultiple };
                },
                set: function (e, value) {
                  let ifMultiple = value.ifMultiple;
                  setIfMultiple(ifMultiple);
                  setProperty("ifMultiple", ifMultiple);
                },
              }}
            />
          </React.Fragment>
        )}
      </div>
    )
  );
}
