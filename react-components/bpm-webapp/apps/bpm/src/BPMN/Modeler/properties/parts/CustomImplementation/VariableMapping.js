import React, { useEffect, useState } from "react";
import filter from "lodash/filter";
import eventDefinitionHelper from "bpmn-js-properties-panel/lib/helper/EventDefinitionHelper";
import extensionElementsHelper from "bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import { makeStyles } from "@material-ui/core/styles";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";

import {
  SelectBox,
  ExtensionElementTable,
  TextField,
  Checkbox,
} from "../../../../../components/properties/components";
import { translate } from "../../../../../utils";

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

const inOutTypeOptions = [
  {
    name: translate("Source"),
    value: "source",
  },
  {
    name: translate("Source expression"),
    value: "sourceExpression",
  },
  {
    name: translate("All"),
    value: "variables",
  },
];

const CAMUNDA_IN_EXTENSION_ELEMENT = "camunda:In",
  CAMUNDA_OUT_EXTENSION_ELEMENT = "camunda:Out";

function getCamundaInOutMappings(element, type) {
  let bo = getBusinessObject(element);
  let signalEventDefinition =
    eventDefinitionHelper.getSignalEventDefinition(bo);
  return (
    extensionElementsHelper.getExtensionElements(
      signalEventDefinition || bo,
      type
    ) || []
  );
}

function getVariableMappings(element, type) {
  let camundaMappings = getCamundaInOutMappings(element, type);
  return filter(camundaMappings, function (mapping) {
    return !mapping.businessKey;
  });
}

function getInOutType(mapping) {
  let inOutType = "source";
  if (!mapping) return;
  if (mapping.variables === "all") {
    inOutType = "variables";
  } else if (typeof mapping.source !== "undefined") {
    inOutType = "source";
  } else if (typeof mapping.sourceExpression !== "undefined") {
    inOutType = "sourceExpression";
  }
  return inOutType;
}

function getMappings(bo, type) {
  return (bo && extensionElementsHelper.getExtensionElements(bo, type)) || [];
}

const setOptionLabelValue = (type, element) => {
  return function (index) {
    let variableMappings = getVariableMappings(element, type);
    let mappingValue = variableMappings[index];
    let label =
      ((mappingValue && mappingValue.target) || "<undefined>") + " := ";
    let mappingType = getInOutType(mappingValue);
    if (mappingType === "variables") {
      label = "all";
    } else if (mappingType === "source") {
      label = label + (mappingValue.source || `<${translate("empty")}>`);
    } else if (mappingType === "sourceExpression") {
      label =
        label + (mappingValue.sourceExpression || `<${translate("empty")}>`);
    } else {
      label = label + `<${translate("empty")}>`;
    }
    return label;
  };
};

function getLabel(l) {
  let mappingType = getInOutType(l);
  let label = (l.target || "<undefined>") + " := ";
  if (mappingType === "variables") {
    label = "all";
  } else if (mappingType === "source") {
    label = label + (l.source || `<${translate("empty")}>`);
  } else if (mappingType === "sourceExpression") {
    label = label + (l.sourceExpression || `<${translate("empty")}>`);
  } else {
    label = label + `<${translate("empty")}>`;
  }
  return label;
}

export default function VariableMapping({
  element,
  index,
  label,
  bpmnFactory,
}) {
  const [isVisible, setVisible] = useState(false);
  const [signalEventDefinition, setSignalEventDefinition] = useState(null);
  const [selectedInEntry, setSelectedInEntry] = useState(null);
  const [selectedOutEntry, setSelectedOutEntry] = useState(null);
  const [type, setType] = useState("source");
  const [inOptions, setInOptions] = useState(null);
  const [outOptions, setOutOptions] = useState(null);
  const classes = useStyles();

  const newElement = (type) => {
    return function (e, extensionEle, value) {
      let newElem = elementHelper.createElement(
        type,
        { source: "" },
        extensionEle,
        bpmnFactory
      );
      let bo = signalEventDefinition || getBusinessObject(element);
      let extensionElements = bo && bo.extensionElements;
      if (!extensionElements) {
        extensionElements = elementHelper.createElement(
          "bpmn:ExtensionElements",
          { values: [] },
          bo,
          bpmnFactory
        );
        bo.extensionElements = extensionElements;
      }
      bo.extensionElements.values.push(newElem);
      return newElem;
    };
  };

  const removeElement = (type) => {
    return function (index) {
      let bo = signalEventDefinition || getBusinessObject(element);
      const extensionElements =
        bo.extensionElements && bo.extensionElements.values;
      let count;
      extensionElements.forEach((element, ind) => {
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
      if (
        extensionElements &&
        !extensionElements.find((e) => e.$type === type)
      ) {
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
    (element, isInitial = false) => {
      const bo = signalEventDefinition || getBusinessObject(element);
      const inExtensions = getMappings(bo, CAMUNDA_IN_EXTENSION_ELEMENT);

      const inOptions =
        inExtensions &&
        inExtensions.map(function (l, index) {
          let label = getLabel(l);
          return {
            id: index,
            text: label,
          };
        });

      const outExtensions = getMappings(bo, CAMUNDA_OUT_EXTENSION_ELEMENT);
      const outOptions =
        outExtensions &&
        outExtensions.map(function (l, index) {
          let label = getLabel(l);
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
    [signalEventDefinition]
  );

  const getMapping = React.useCallback(() => {
    let type = selectedInEntry
      ? CAMUNDA_IN_EXTENSION_ELEMENT
      : CAMUNDA_OUT_EXTENSION_ELEMENT;
    let bo = signalEventDefinition || getBusinessObject(element);
    const mappings = getMappings(bo, type);
    const mapping =
      mappings[selectedInEntry ? selectedInEntry : selectedOutEntry];
    return mapping || (mappings && mappings[0]);
  }, [selectedInEntry, selectedOutEntry, element, signalEventDefinition]);

  useEffect(() => {
    addOptions(element, true);
  }, [element, addOptions]);

  useEffect(() => {
    const signalEventDefinition =
      eventDefinitionHelper.getSignalEventDefinition(element);
    setSignalEventDefinition(signalEventDefinition);
    if (is(element, "camunda:CallActivity") && !signalEventDefinition) {
      setVisible(true);
    } else {
      setVisible(false);
    }
    if (
      signalEventDefinition &&
      isAny(element, ["bpmn:IntermediateThrowEvent", "bpmn:EndEvent"])
    ) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [element]);

  return (
    isVisible && (
      <div>
        <React.Fragment>
          {index > 0 && <div className={classes.divider} />}
        </React.Fragment>
        <div className={classes.groupLabel}>{translate(label)}</div>
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
            getExtensionElements: function (element) {
              return getVariableMappings(element, CAMUNDA_IN_EXTENSION_ELEMENT);
            },
            onSelectionChange: function (value) {
              setSelectedInEntry(value);
              setSelectedOutEntry(null);
            },
            setOptionLabelValue: setOptionLabelValue(
              CAMUNDA_IN_EXTENSION_ELEMENT,
              element
            ),
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
              removeExtensionElement: removeElement(
                CAMUNDA_OUT_EXTENSION_ELEMENT
              ),
              getExtensionElements: function () {
                return getVariableMappings(
                  element,
                  CAMUNDA_OUT_EXTENSION_ELEMENT
                );
              },
              onSelectionChange: function (value) {
                setSelectedInEntry(null);
                setSelectedOutEntry(value);
              },
              setOptionLabelValue: setOptionLabelValue(
                CAMUNDA_OUT_EXTENSION_ELEMENT,
                element
              ),
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
                  let mapping = getMapping();
                  if (!mapping) return;
                  const inOutType = getInOutType(mapping);
                  setType(inOutType);
                  return {
                    inOutType: inOutType,
                  };
                },
                set: function (element, values) {
                  let inOutType = values.inOutType;
                  setType(inOutType);
                  let props = {
                    source: undefined,
                    sourceExpression: undefined,
                    variables: undefined,
                  };

                  if (inOutType === "source") {
                    props.source = "";
                  } else if (inOutType === "sourceExpression") {
                    props.sourceExpression = "";
                  } else if (inOutType === "variables") {
                    props.variables = "all";
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
                    modelProperty:
                      type === "source" ? "source" : "sourceExpression",
                    label:
                      type === "source"
                        ? translate("Source")
                        : translate("Source expression"),
                    get: function () {
                      let mapping = getMapping();
                      if (!mapping) return;
                      let type = getInOutType(mapping);
                      return {
                        [type]: mapping[type],
                      };
                    },
                    set: function (element, values) {
                      let mapping = getMapping();
                      if (!mapping) return;
                      let inOutType = getInOutType(mapping);
                      let props = {};
                      props[inOutType] =
                        values[
                          type === "source" ? "source" : "sourceExpression"
                        ] || undefined;
                      Object.entries(props).forEach(([key, value]) => {
                        mapping[key] = value;
                      });
                      addOptions(element);
                    },
                    validate: function (e, values) {
                      if (
                        type === "source"
                          ? !values["source"]
                          : !values["sourceExpression"]
                      ) {
                        return {
                          [type === "source" ? "source" : "sourceExpression"]:
                            translate(
                              `Mapping must have a ${
                                type === "source"
                                  ? "source"
                                  : "source expression"
                              }`
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
                      let mapping = getMapping();
                      if (!mapping) return;
                      return {
                        target: mapping.target,
                      };
                    },
                    set: function (e, values) {
                      values.target = values.target || undefined;
                      let mapping = getMapping();
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
                  let mapping = getMapping();
                  if (!mapping) return;
                  return {
                    local: mapping.local,
                  };
                },
                set: function (element, values) {
                  values.local = values.local || false;
                  let mapping = getMapping();
                  if (!mapping) return;
                  mapping.local = values.local;
                },
              }}
              element={element}
            />
          </React.Fragment>
        )}
      </div>
    )
  );
}
