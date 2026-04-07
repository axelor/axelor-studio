import React, { useEffect, useState } from "react";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { translate } from "@studio/shared/i18n";

import { getExtensionElementsList } from "../../../../../utils/ExtensionElementsUtil";
import { Checkbox, SelectBox } from "../../../../../components/properties/components";
import { getBool } from "../../../../../utils";
import CollapsePanel from "../components/CollapsePanel";
import type { PropertiesPanelComponentProps } from "../../property-types";

export default function BusinessRuleTaskProps({
  element,
  _index,
  _bpmnModeler,
}: PropertiesPanelComponentProps) {
  const [isVisible, setVisible] = useState(false);
  const [searchWith, setSearchWith] = useState<any>(null);
  const [ifMultiple, setIfMultiple] = useState<any>(null);
  const [assignOutputToFields, setAssignOutputToFields] = useState<any>(null);

  const setProperty = (name: string, value: any) => {
    const bo = getBusinessObject(element);
    const propertyName = `camunda:${name}`;
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
    (name: string) => {
      if (!element) return;
      const propertyName = `camunda:${name}`;
      const bo = getBusinessObject(element);
      return (bo.$attrs && bo.$attrs[propertyName]) || "";
    },
    [element],
  );

  function getListeners(bo: any, type: any) {
    return (bo && getExtensionElementsList(bo, type)) || [];
  }

  const getBO = () => {
    let bo = getBusinessObject(element);
    if (is(element, "bpmn:Participant")) {
      bo = bo.get("processRef");
    }
    return bo;
  };

  const removeElement = () => {
    const bo = getBO();
    const listeners = getListeners(bo, "camunda:ExecutionListener");
    if (!listeners || listeners.length < 0) return;
    const listenerIndex = listeners.findIndex(
      (l: any) => l && l.$attrs && l.$attrs["outId"] === "dmn_output_mapping",
    );
    let extensionElements = bo && bo.extensionElements && bo.extensionElements.values;
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
            set: function (e: any, value: any) {
              const assignOutputToFields = !value.assignOutputToFields;
              setAssignOutputToFields(assignOutputToFields);
              setProperty("assignOutputToFields", assignOutputToFields);
              if (assignOutputToFields === false) {
                removeElement();
              }
            },
          }}
        />
        {assignOutputToFields && (
          <CollapsePanel label={translate("Relational field search")}>
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
                set: function (e: any, value: any) {
                  const searchWith = value.searchWith;
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
                set: function (e: any, value: any) {
                  const ifMultiple = value.ifMultiple;
                  setIfMultiple(ifMultiple);
                  setProperty("ifMultiple", ifMultiple);
                },
              }}
            />
          </CollapsePanel>
        )}
      </div>
    )
  );
}
