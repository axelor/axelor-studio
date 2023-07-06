import React, { useState, useEffect } from "react";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import Edit from "@material-ui/icons/Edit";
import { makeStyles } from "@material-ui/core/styles";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { DateTimePicker } from "@material-ui/pickers";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import MomentUtils from "@date-io/moment";
import Tooltip from "@material-ui/core/Tooltip";
import NotInterested from "@material-ui/icons/NotInterested";

import TimerBuilder from "../../../../../components/TimerBuilder";
import AlertDialog from "../../../../../components/AlertDialog";
import {
  TextField,
  SelectBox,
} from "../../../../../components/properties/components";
import { getBool, translate } from "../../../../../utils";

const timerOptions = [
  { value: "timeDate", name: translate("Date") },
  { value: "timeDuration", name: translate("Duration") },
  { value: "timeCycle", name: translate("Cycle") },
];

const useStyles = makeStyles(() => ({
  newIcon: {
    color: "#58B423",
    cursor: "pointer",
    margin: 5,
  },
  new: {
    cursor: "pointer",
    display: "flex",
  },
}));

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
  return elementHelper.createElement(
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
}) {
  const [timerDefinitionType, setTimerDefinitionType] = useState("");
  const [open, setOpen] = useState(false);
  const [isFromBuilder, setFromBuilder] = useState(false);
  const [openAlert, setAlert] = useState({
    open: false,
    alertMessage: "Error",
    title: "Error",
  });
  const classes = useStyles();

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

  const handleFromBuilder = (value) => {
    setFromBuilder(value);
    setProperty("isFromBuilder", value);
  };

  const handleTimerDefinitionChange = (element, values) => {
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
  };

  const handleAlertAction = (key) => {
    if (openAlert?.onCancel && key === "cancel") {
      openAlert.onCancel();
    } else if (openAlert?.onOk && key === "ok") {
      openAlert.onOk();
    }
    setAlert({
      open: false,
      alertMessage: "Error",
      title: "Error",
    });
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (value) => {
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
                  return { timerDefinition: translate("Must provide a value") };
                }
              },
            }}
            endAdornment={
              <div className={classes.new}>
                <Tooltip title="Enable" aria-label="enable">
                  <NotInterested
                    className={classes.newIcon}
                    onClick={() => {
                      if (isFromBuilder) {
                        setAlert({
                          open: true,
                          alertMessage:
                            "Expression can't be managed using builder once changed manually.",
                          title: "Warning",
                          onOk: () => {
                            handleFromBuilder(false);
                          },
                        });
                      }
                    }}
                  />
                </Tooltip>
                <Edit className={classes.newIcon} onClick={handleClickOpen} />
              </div>
            }
          />
          {open && timerDefinitionType === "timeDate" && (
            <MuiPickersUtilsProvider utils={MomentUtils}>
              <DateTimePicker
                style={{ display: "none" }}
                open={open}
                onClose={handleClose}
                value={getTimerValue()}
                onChange={(value) => handleChange(value?.format())}
              />
            </MuiPickersUtilsProvider>
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
          {openAlert && (
            <AlertDialog
              openAlert={openAlert?.open}
              alertClose={() => handleAlertAction("cancel")}
              handleAlertOk={() => handleAlertAction("ok")}
              message={openAlert?.alertMessage}
              title={openAlert?.title}
            />
          )}
        </>
      )}
    </div>
  );
}
