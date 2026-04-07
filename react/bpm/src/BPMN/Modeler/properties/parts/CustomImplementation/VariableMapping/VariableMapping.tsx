import React, { useEffect, useState } from "react";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";
import { translate } from "@studio/shared/i18n";

import type { PropertiesPanelComponentProps } from "../../../property-types";
import { createElement } from "../../../../../../utils/ElementUtil";
import { getSignalEventDefinition } from "../../../../../../utils/EventDefinitionUtil";
import {
  SelectBox,
  ExtensionElementTable,
  TextField,
  Checkbox,
} from "../../../../../../components/properties/components";
import CollapsePanel from "../../components/CollapsePanel";

import {
  inOutTypeOptions,
  CAMUNDA_IN_EXTENSION_ELEMENT,
  CAMUNDA_OUT_EXTENSION_ELEMENT,
  getVariableMappings,
  getInOutType,
  getMappings,
  getLabel,
  setOptionLabelValue,
} from "./utils";

export default function VariableMapping({
  element,
  _index,
  label,
  bpmnFactory,
}: PropertiesPanelComponentProps) {
  const [isVisible, setVisible] = useState(false);
  const [signalEventDefinition, setSignalEventDefinition] = useState<any>(null);
  const [selectedInEntry, setSelectedInEntry] = useState<any>(null);
  const [selectedOutEntry, setSelectedOutEntry] = useState<any>(null);
  const [type, setType] = useState("source");
  const [inOptions, setInOptions] = useState<any>(null);
  const [outOptions, setOutOptions] = useState<any>(null);

  const newElement = (type: any) => {
    return function (e: any, extensionEle: any, _value: any) {
      if (!bpmnFactory) return;
      const newElem = createElement(type, { source: "" }, extensionEle, bpmnFactory);
      const bo = signalEventDefinition || getBusinessObject(element);
      let extensionElements = bo && bo.extensionElements;
      if (!extensionElements) {
        extensionElements = createElement(
          "bpmn:ExtensionElements",
          { values: [] },
          bo,
          bpmnFactory,
        );
        bo.extensionElements = extensionElements;
      }
      bo.extensionElements.values.push(newElem);
      return newElem;
    };
  };

  const removeElement = (type: any) => {
    return function (index: any) {
      const bo = signalEventDefinition || getBusinessObject(element);
      const extensionElements = bo.extensionElements && bo.extensionElements.values;
      let count: any;
      extensionElements.forEach((element: any, ind: any) => {
        if (element.$type === type) {
          if (count > -1) {
            count++;
          } else {
            count = 0;
          }
        }
        if (count === Number(index)) {
          bo.extensionElements.values.splice(ind, 1);
          return;
        }
      });
      addOptions(element);
      if (extensionElements && !extensionElements.find((e: any) => e.$type === type)) {
        if (type === CAMUNDA_IN_EXTENSION_ELEMENT) {
          setSelectedInEntry(null);
        } else {
          setSelectedOutEntry(null);
        }
      } else {
        setSelectedInEntry(null);
        setSelectedOutEntry(null);
      }
    };
  };

  const addOptions = React.useCallback(
    (element: any, isInitial = false) => {
      const bo = signalEventDefinition || getBusinessObject(element);
      const inExtensions = getMappings(bo, CAMUNDA_IN_EXTENSION_ELEMENT);

      const inOptions =
        inExtensions &&
        inExtensions.map(function (l: any, index: any) {
          const label = getLabel(l);
          return {
            id: index,
            text: label,
          };
        });

      const outExtensions = getMappings(bo, CAMUNDA_OUT_EXTENSION_ELEMENT);
      const outOptions =
        outExtensions &&
        outExtensions.map(function (l: any, index: any) {
          const label = getLabel(l);
          return {
            id: index,
            text: label,
          };
        });
      setInOptions(inOptions);
      setOutOptions(outOptions);
      if (isInitial) {
        if (inOptions.length > 0) {
          setSelectedInEntry(inOptions[0]);
          setSelectedOutEntry(null);
        } else if (outOptions.length > 0) {
          setSelectedInEntry(null);
          setSelectedOutEntry(outOptions[0]);
        }
      }
    },
    [signalEventDefinition],
  );

  const getMapping = React.useCallback(() => {
    const type = selectedInEntry ? CAMUNDA_IN_EXTENSION_ELEMENT : CAMUNDA_OUT_EXTENSION_ELEMENT;
    const bo = signalEventDefinition || getBusinessObject(element);
    const mappings = getMappings(bo, type);
    const mapping = mappings[selectedInEntry ? selectedInEntry : selectedOutEntry];
    return mapping || (mappings && mappings[0]);
  }, [selectedInEntry, selectedOutEntry, element, signalEventDefinition]);

  useEffect(() => {
    addOptions(element, true);
  }, [element, addOptions]);

  useEffect(() => {
    const signalEventDefinition = getSignalEventDefinition(element);
    setSignalEventDefinition(signalEventDefinition);
    if (is(element, "camunda:CallActivity") && !signalEventDefinition) {
      setVisible(true);
    } else {
      setVisible(false);
    }
    if (signalEventDefinition && isAny(element, ["bpmn:IntermediateThrowEvent", "bpmn:EndEvent"])) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [element]);

  return (
    isVisible && (
      <CollapsePanel label={label}>
        <ExtensionElementTable
          element={element}
          options={inOptions}
          entry={{
            id: "variableMapping-in",
            label: translate("In mapping"),
            modelProperty: "source",
            prefix: "In",
            createExtensionElement: newElement(CAMUNDA_IN_EXTENSION_ELEMENT),
            removeExtensionElement: removeElement(CAMUNDA_IN_EXTENSION_ELEMENT),
            getExtensionElements: function (element: any) {
              return getVariableMappings(element, CAMUNDA_IN_EXTENSION_ELEMENT);
            },
            onSelectionChange: function (value: any) {
              setSelectedInEntry(`${value}`);
              setSelectedOutEntry(null);
            },
            setOptionLabelValue: setOptionLabelValue(CAMUNDA_IN_EXTENSION_ELEMENT, element),
          }}
        />
        {!signalEventDefinition && (
          <ExtensionElementTable
            element={element}
            options={outOptions}
            entry={{
              id: "variableMapping-out",
              label: translate("Out mapping"),
              modelProperty: "source",
              prefix: "Out",
              createExtensionElement: newElement(CAMUNDA_OUT_EXTENSION_ELEMENT),
              removeExtensionElement: removeElement(CAMUNDA_OUT_EXTENSION_ELEMENT),
              getExtensionElements: function () {
                return getVariableMappings(element, CAMUNDA_OUT_EXTENSION_ELEMENT);
              },
              onSelectionChange: function (value: any) {
                setSelectedInEntry(null);
                setSelectedOutEntry(`${value}`);
              },
              setOptionLabelValue: setOptionLabelValue(CAMUNDA_OUT_EXTENSION_ELEMENT, element),
            }}
          />
        )}
        {(selectedInEntry ||
          selectedOutEntry ||
          selectedInEntry === 0 ||
          selectedOutEntry === 0) && (
          <React.Fragment>
            <SelectBox
              element={element}
              entry={{
                id: "variableMapping-inOutType",
                label: translate("Type"),
                selectOptions: inOutTypeOptions,
                modelProperty: "inOutType",
                widget: "selectBox",
                get: function () {
                  const mapping = getMapping();
                  if (!mapping) return;
                  const inOutType = getInOutType(mapping);
                  // @ts-expect-error -- safety: bpmn-js element type mismatch with strict PropertiesPanelComponentProps
                  setType(inOutType);
                  return {
                    inOutType: inOutType,
                  };
                },
                set: function (element: any, values: any) {
                  const inOutType = values.inOutType;
                  setType(inOutType);
                  const props = {
                    source: undefined,
                    sourceExpression: undefined,
                    variables: undefined,
                  };

                  if (inOutType === "source") {
                    // @ts-expect-error -- safety: bpmn-js element union type incompatible with narrower prop type
                    props.source = "";
                  } else if (inOutType === "sourceExpression") {
                    // @ts-expect-error -- safety: bpmn-js element union type incompatible with narrower prop type
                    props.sourceExpression = "";
                  } else if (inOutType === "variables") {
                    // @ts-expect-error -- safety: bpmn-js element union type incompatible with narrower prop type
                    props.variables = "all";
                    // @ts-expect-error -- safety: bpmn-js dynamic moddle property not in typed interface
                    props.target = undefined;
                  }

                  const mapping = getMapping();
                  if (!mapping) return;
                  Object.entries(props).forEach(([key, value]) => {
                    mapping[key] = value;
                  });
                  addOptions(element);
                },
              }}
            />
            {["source", "sourceExpression"].includes(type) && (
              <React.Fragment>
                <TextField
                  element={element}
                  canRemove={true}
                  entry={{
                    id: "variableMapping-source",
                    modelProperty: type === "source" ? "source" : "sourceExpression",
                    label: type === "source" ? translate("Source") : translate("Source expression"),
                    get: function () {
                      const mapping = getMapping();
                      if (!mapping) return;
                      const type = getInOutType(mapping);
                      return {
                        // @ts-expect-error -- safety: bpmn-js dynamic mapping key access
                        [type]: mapping[type],
                      };
                    },
                    set: function (element: any, values: any) {
                      const mapping = getMapping();
                      if (!mapping) return;
                      const inOutType = getInOutType(mapping);
                      const props: Record<string, any> = {};
                      // @ts-expect-error -- safety: bpmn-js dynamic property key type
                      props[inOutType] =
                        values[type === "source" ? "source" : "sourceExpression"] || undefined;
                      Object.entries(props).forEach(([key, value]) => {
                        mapping[key] = value;
                      });
                      addOptions(element);
                    },
                    validate: function (e, values) {
                      if (type === "source" ? !values["source"] : !values["sourceExpression"]) {
                        return {
                          [type === "source" ? "source" : "sourceExpression"]: translate(
                            `Mapping must have a ${
                              type === "source" ? "source" : "source expression"
                            }`,
                          ),
                        };
                      }
                    },
                  }}
                />
                <TextField
                  element={element}
                  canRemove={true}
                  entry={{
                    id: "variableMapping-target",
                    label: translate("Target"),
                    modelProperty: "target",
                    widget: "textField",
                    get: function () {
                      const mapping = getMapping();
                      if (!mapping) return;
                      return {
                        target: mapping.target,
                      };
                    },
                    set: function (e: any, values: any) {
                      values.target = values.target || undefined;
                      const mapping = getMapping();
                      if (!mapping) return;
                      mapping.target = values.target;
                      addOptions(element);
                    },
                    validate: function (e, values) {
                      if (!values.target) {
                        return {
                          target: translate("Mapping must have a target"),
                        };
                      }
                    },
                  }}
                />
              </React.Fragment>
            )}
            <Checkbox
              entry={{
                id: "variableMapping-local",
                label: translate("Local"),
                modelProperty: "local",
                get: function () {
                  const mapping = getMapping();
                  if (!mapping) return;
                  return {
                    local: mapping.local,
                  };
                },
                set: function (element: any, values: any) {
                  values.local = values.local || false;
                  const mapping = getMapping();
                  if (!mapping) return;
                  mapping.local = values.local;
                },
              }}
              element={element}
            />
          </React.Fragment>
        )}
      </CollapsePanel>
    )
  );
}
