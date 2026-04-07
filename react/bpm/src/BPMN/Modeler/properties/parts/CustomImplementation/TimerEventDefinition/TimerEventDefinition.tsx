import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import React, { useEffect, useState } from "react";
import { Box, Input, InputLabel } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import dayjs from "dayjs";
import { Tooltip, AlertDialog  } from "@studio/shared/components";
import { useDialog } from "@studio/shared/hooks";
import { translate } from "@studio/shared/i18n";

import { SelectBox, TextField } from "../../../../../../components/properties/components";
import { getBool } from "../../../../../../utils";
import TimerBuilder from "../../../../../../components/TimerBuilder";
import type { PropertiesPanelComponentProps } from "../../../property-types";


interface TimerEventPropsProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timerEventDefinition?: any;
}
import styles from "./timer-event.module.css";
import {
  timerOptions,
  valueTypeOptions,
  getTimerDefinitionType,
  createFormalExpression,
} from "./utils";

export default function TimerEventProps({
  element,
  bpmnFactory,
  timerEventDefinition,
  _bpmnModeler,
}: TimerEventPropsProps) {
  const [timerDefinitionType, setTimerDefinitionType] = useState("");
  const [open, setOpen] = useState(false);
  const [isFromBuilder, setFromBuilder] = useState(false);
  const [valueType, setValueType] = useState("value");
  const [date, setDate] = useState();
  const openDialog = useDialog();
  const timerDefinitionRef = React.useRef(null);

  function createTimerEventDefinition(bo: any) {
    if (!bpmnFactory) return;
    const eventDefinitions = bo.get("eventDefinitions") || [],
      timerEventDefinition = bpmnFactory.create("bpmn:TimerEventDefinition");
    eventDefinitions.push(timerEventDefinition);
    bo.eventDefinitions = eventDefinitions;
    return timerEventDefinition;
  }

  const getProperty = React.useCallback(
    (name: string) => {
      const propertyName = `camunda:${name}`;
      const bo = getBusinessObject(element);
      return (bo.$attrs && bo.$attrs[propertyName]) || "";
    },
    [element],
  );

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

  const getTypeProperty = React.useCallback(
    (name: any, timerDefinitionType: any) => {
      const propertyName = `camunda:${name}`;
      const bo = getBusinessObject(element);
      const target = bo?.eventDefinitions?.[0]?.[timerDefinitionType];
      return (target?.$attrs && target?.$attrs[propertyName]) || "";
    },
    [element],
  );

  const setTypeProperty = (name: any, value: any, timerDefinitionType: any) => {
    const bo = getBusinessObject(element);
    const propertyName = `camunda:${name}`;

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

  const handleFromBuilder = (value: any) => {
    setFromBuilder(value);
    setProperty("isFromBuilder", value);
  };

  const handleTimerDefinitionChange = (element: any, values: any) => {
    const bo = getBusinessObject(element);
    const timerDefinition = timerEventDefinition,
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

  const handleChange = (value: any) => {
    const isFromBuilder = value ? true : false;
    handleTimerDefinitionChange(element, { timerDefinition: value });
    handleFromBuilder(isFromBuilder);
  };

  const getTimerDefinition = () => {
    const timerDefinition = timerEventDefinition,
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
    const timerDef = timerEventDefinition;
    const timerDefType = getTimerDefinitionType(timerDef) || "";
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
            const timerDefinition = timerEventDefinition;
            const timerDefinitionType = getTimerDefinitionType(timerDefinition) || "";
            setTimerDefinitionType(timerDefinitionType);
            return {
              timerDefinitionType: timerDefinitionType,
            };
          },
          set: function (e: any, values: any) {
            const bo = getBusinessObject(element);
            setTimerDefinitionType(values.timerDefinitionType);
            handleFromBuilder(false);
            const props: Record<string, unknown> = {
              timeDuration: undefined,
              timeDate: undefined,
              timeCycle: undefined,
            };
            let timerDefinition = timerEventDefinition;
            const newType = values.timerDefinitionType;
            if (!timerDefinition && typeof createTimerEventDefinition === "function") {
              timerDefinition = createTimerEventDefinition(bo);
            }
            if (values.timerDefinitionType) {
              props[newType] = createFormalExpression(timerDefinition, undefined, bpmnFactory);
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
                const timerDefinition = timerEventDefinition;
                const timerDefinitionType = getTimerDefinitionType(timerDefinition) || "";
                const value = getTypeProperty("valueType", timerDefinitionType);
                return { valueType: value || "value" };
              },
              set: function (e: any, value: any) {
                const valueType = value.valueType;
                const timerDefinition = timerEventDefinition;
                const timerDefinitionType = getTimerDefinitionType(timerDefinition) || "";
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
                  <Tooltip title={translate("Enable")} aria-label="enable">
                    <MaterialIcon
                      // @ts-expect-error -- safety: bpmn-js boolean comparison on moddle value
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
                handleChange(dayjs(date).format("YYYY-MM-DDTHH:mm"));
                handleClose();
              }}
              alertClose={handleClose}
              children={
                <>
                  <InputLabel style={{ fontSize: 14 }}>{translate("Select datetime")}</InputLabel>
                  <Input
                    type="datetime-local"
                    value={dayjs(date).format("YYYY-MM-DDTHH:mm")}
                    // @ts-expect-error -- safety: bpmn-js element type mismatch with strict PropertiesPanelComponentProps
                    onChange={(e) => setDate(dayjs(e?.target?.value))}
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
