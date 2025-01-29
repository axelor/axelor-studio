import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import React, { useEffect, useState } from "react";
import { createElement } from "../../../../../utils/ElementUtil";

import { Box, Input, InputLabel } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import moment from "moment";
import TimerBuilder from "../../../../../components/TimerBuilder";
import Tooltip from "../../../../../components/Tooltip";
import {
  SelectBox,
  TextField,
} from "../../../../../components/properties/components";
import useDialog from "../../../../../hooks/useDialog";
import { getBool, translate } from "../../../../../utils";
import styles from "./timer-event.module.css";
import AlertDialog from "../../../../../components/AlertDialog";

const timerOptions = [
  { value: "timeDate", name: translate("Date") },
  { value: "timeDuration", name: translate("Duration") },
  { value: "timeCycle", name: translate("Cycle") },
];

const valueTypeOptions = [
  { value: "value", name: translate("Value") },
  { value: "expression", name: translate("Expression") },
];

function getTimerDefinitionType(timer) {
  if (!timer) {
    return;
  }

  let timeDate = timer.get("timeDate");
  if (typeof timeDate !== "undefined") {
    return "timeDate";
  }

  let timeCycle = timer.get("timeCycle");
  if (typeof timeCycle !== "undefined") {
    return "timeCycle";
  }

  let timeDuration = timer.get("timeDuration");
  if (typeof timeDuration !== "undefined") {
    return "timeDuration";
  }
}

function createFormalExpression(parent, body, bpmnFactory) {
  body = body || undefined;
  return createElement(
    "bpmn:FormalExpression",
    { body: body },
    parent,
    bpmnFactory
  );
}

export default function TimerEventProps({
  element,
  bpmnFactory,
  timerEventDefinition,
  bpmnModeler,
  setDummyProperty = () => {},
}) {
  const [timerDefinitionType, setTimerDefinitionType] = useState("");
  const [open, setOpen] = useState(false);
  const [isFromBuilder, setFromBuilder] = useState(false);
  const [valueType, setValueType] = useState("value");
  const [date, setDate] = useState();
  const openDialog = useDialog();
  const timerDefinitionRef = React.useRef(null);

  function createTimerEventDefinition(bo) {
    let eventDefinitions = bo.get("eventDefinitions") || [],
      timerEventDefinition = bpmnFactory.create("bpmn:TimerEventDefinition");
    eventDefinitions.push(timerEventDefinition);
    bo.eventDefinitions = eventDefinitions;
    return timerEventDefinition;
  }

  const getProperty = React.useCallback(
    (name) => {
      let propertyName = `camunda:${name}`;
      const bo = getBusinessObject(element);
      return (bo.$attrs && bo.$attrs[propertyName]) || "";
    },
    [element]
  );

  const setProperty = (name, value) => {
    setDummyProperty({
      bpmnModeler,
      element,
      value,
    });
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

  const getTypeProperty = React.useCallback(
    (name, timerDefinitionType) => {
      let propertyName = `camunda:${name}`;
      const bo = getBusinessObject(element);
      const target = bo?.eventDefinitions?.[0]?.[timerDefinitionType];
      return (target?.$attrs && target?.$attrs[propertyName]) || "";
    },
    [element]
  );

  const setTypeProperty = (name, value, timerDefinitionType) => {
    setDummyProperty({ bpmnModeler, element, value });
    const bo = getBusinessObject(element);
    let propertyName = `camunda:${name}`;

    if (!bo) return;

    const target = bo?.eventDefinitions?.[0]?.[timerDefinitionType];

    if (target) {
      if (target?.$attrs) {
        target.$attrs[propertyName] = value;
      } else {
        target.$attrs = { [propertyName]: value };
      }

      if (!value) {
        delete target.$attrs[propertyName];
      }
    }
  };

  const handleFromBuilder = (value) => {
    setFromBuilder(value);
    setProperty("isFromBuilder", value);
  };

  const handleTimerDefinitionChange = (element, values) => {
    setDummyProperty({
      bpmnModeler,
      element,
      value: true,
    });
    const bo = getBusinessObject(element);
    let timerDefinition = timerEventDefinition,
      type = getTimerDefinitionType(timerDefinition),
      definition = type && timerDefinition.get(type);

    if (definition) {
      definition.body = values.timerDefinition || undefined;
    }
    bo.eventDefinitions = [timerDefinition];
    if (!values.timerDefinition) {
      handleFromBuilder(false);
    }

    timerDefinitionRef.current = values.timerDefinition;
  };
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (value) => {
    setDummyProperty({
      bpmnModeler,
      element,
      value: true,
    });
    let isFromBuilder = value ? true : false;
    handleTimerDefinitionChange(element, { timerDefinition: value });
    handleFromBuilder(isFromBuilder);
  };

  const getTimerDefinition = () => {
    let timerDefinition = timerEventDefinition,
      type = getTimerDefinitionType(timerDefinition),
      definition = type && timerDefinition.get(type),
      value = definition && definition.get("body");
    return value || null;
  };

  const getTimerValue = () => {
    if (!isFromBuilder) return null;
    return getTimerDefinition();
  };

  useEffect(() => {
    const isFromBuilder = getBool(getProperty("isFromBuilder"));
    setFromBuilder(isFromBuilder);
  }, [getProperty]);

  useEffect(() => {
    if (open && timerDefinitionType === "timeDate") {
      setDate(getTimerValue());
    }
  }, [open, timerDefinitionType]);

  useEffect(() => {
    let timerDef = timerEventDefinition;
    let timerDefType = getTimerDefinitionType(timerDef) || "";
    const type = getTypeProperty("valueType", timerDefType);
    type && setValueType(type);

    if (timerDefinitionType && type === "") {
      setTypeProperty("valueType", "value", timerDefinitionType);
      setValueType("value");
    }
  }, [timerDefinitionType, timerEventDefinition, timerDefinitionRef.current]);

  return (
    <div>
      <SelectBox
        element={element}
        entry={{
          id: "timer-event-definition-type",
          label: translate("Timer definition type"),
          selectOptions: timerOptions,
          emptyParameter: true,
          modelProperty: "timerDefinitionType",
          get: function () {
            let timerDefinition = timerEventDefinition;
            let timerDefinitionType =
              getTimerDefinitionType(timerDefinition) || "";
            setTimerDefinitionType(timerDefinitionType);
            return {
              timerDefinitionType: timerDefinitionType,
            };
          },
          set: function (e, values) {
            const bo = getBusinessObject(element);
            setTimerDefinitionType(values.timerDefinitionType);
            handleFromBuilder(false);
            let props = {
              timeDuration: undefined,
              timeDate: undefined,
              timeCycle: undefined,
            };
            let timerDefinition = timerEventDefinition,
              newType = values.timerDefinitionType;
            if (
              !timerDefinition &&
              typeof createTimerEventDefinition === "function"
            ) {
              timerDefinition = createTimerEventDefinition(bo);
            }
            if (values.timerDefinitionType) {
              props[newType] = createFormalExpression(
                timerDefinition,
                undefined,
                bpmnFactory
              );
            }
            Object.entries(props).forEach(([key, value]) => {
              timerDefinition[key] = value;
            });
            bo.eventDefinitions = [timerDefinition];
          },
        }}
      />
      {(timerDefinitionType || timerDefinitionType !== "") && (
        <>
          <SelectBox
            element={element}
            entry={{
              id: "timer-event-definition-value-type",
              label: translate("Type"),
              selectOptions: valueTypeOptions,
              emptyParameter: true,
              modelProperty: "valueType",
              get: function () {
                let timerDefinition = timerEventDefinition;
                let timerDefinitionType =
                  getTimerDefinitionType(timerDefinition) || "";
                const value = getTypeProperty("valueType", timerDefinitionType);
                return { valueType: value || "value" };
              },
              set: function (e, value) {
                const valueType = value.valueType;
                let timerDefinition = timerEventDefinition;
                let timerDefinitionType =
                  getTimerDefinitionType(timerDefinition) || "";
                setValueType(valueType);
                setTypeProperty("valueType", valueType, timerDefinitionType);
                handleTimerDefinitionChange(element, "");
              },
            }}
          />
          {valueType === "value" ? (
            <TextField
              element={element}
              canRemove={true}
              readOnly={isFromBuilder}
              entry={{
                id: "timer-event-definition",
                label: translate("Timer definition"),
                modelProperty: "timerDefinition",
                get: function () {
                  return {
                    timerDefinition: getTimerDefinition(),
                  };
                },
                set: handleTimerDefinitionChange,
                validate: function (e, values) {
                  if (!values.timerDefinition && timerDefinitionType) {
                    return {
                      timerDefinition: translate("Must provide a value"),
                    };
                  }
                },
              }}
              endAdornment={
                <Box color="body" className={styles.new}>
                  <Tooltip title="Enable" aria-label="enable">
                    <MaterialIcon
                      icon="do_not_disturb"
                      fontSize={16}
                      className={styles.newIcon}
                      onClick={() => {
                        if (isFromBuilder) {
                          openDialog({
                            title: "Warning",
                            message:
                              "Expression can't be managed using builder once changed manually.",
                            onSave: () => handleFromBuilder(false),
                          });
                        }
                      }}
                    />
                  </Tooltip>
                  <MaterialIcon
                    icon="edit"
                    fontSize={16}
                    className={styles.newIcon}
                    onClick={handleClickOpen}
                  />
                </Box>
              }
            />
          ) : (
            <TextField
              element={element}
              canRemove={true}
              entry={{
                id: "expression",
                label: translate("Expression"),
                modelProperty: "timerDefinition",
                get: function () {
                  return {
                    timerDefinition: getTimerDefinition(),
                  };
                },
                set: handleTimerDefinitionChange,
                validate: function (e, values) {
                  if (!values.timerDefinition && timerDefinitionType) {
                    return {
                      timerDefinition: translate("Must provide a value"),
                    };
                  }
                },
              }}
            />
          )}
          {open && timerDefinitionType === "timeDate" && (
            <AlertDialog
              openAlert={open}
              fullscreen={false}
              title={"Timer definition"}
              handleAlertOk={() => {
                handleChange(moment(date).format("YYYY-MM-DDTHH:mm"));
                handleClose();
              }}
              alertClose={handleClose}
              children={
                <>
                  <InputLabel style={{ fontSize: 14 }}>
                    {translate("Select datetime")}
                  </InputLabel>
                  <Input
                    type="datetime-local"
                    value={moment(date).format("YYYY-MM-DDTHH:mm")}
                    onChange={(e) => setDate(moment(e?.target?.value))}
                    rounded
                  />
                </>
              }
            />
          )}
          {open && timerDefinitionType !== "timeDate" && (
            <TimerBuilder
              timerDefinitionType={timerDefinitionType}
              value={getTimerValue()}
              open={open}
              handleClose={handleClose}
              handleChange={handleChange}
              t={translate}
            />
          )}
        </>
      )}
    </div>
  );
}
