import React, { useState, useEffect } from "react";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import { makeStyles } from "@material-ui/core/styles";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import NotInterested from "@material-ui/icons/NotInterested";

import TimerBuilder from "../../../../../components/TimerBuilder";
import AlertDialog from "../../../../../components/AlertDialog";
import {
  TextField,
  SelectBox,
} from "../../../../../components/properties/components";
import Tooltip from "../../../../../components/Tooltip";
import { getBool, translate } from "../../../../../utils";
import {
  Box,
  Button,
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogContent,
  Input,
  InputLabel,
} from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import moment from "moment";

const timerOptions = [
  { value: "timeDate", name: translate("Date") },
  { value: "timeDuration", name: translate("Duration") },
  { value: "timeCycle", name: translate("Cycle") },
];

const useStyles = makeStyles(() => ({
  newIcon: {
    cursor: "pointer",
    margin: 5,
  },
  new: {
    cursor: "pointer",
    display: "flex",
  },
  timeDateDialog: {
    "& > div": {
      maxWidth: "90%",
      width: "fit-content",
      minWidth: 500,
    },
  },
  timeDateContent: {
    minHeight: 300,
  },
  button: {
    minWidth: 64,
    textTransform: "capitalize",
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
  bpmnModeler,
  setDummyProperty = () => {},
}) {
  const [timerDefinitionType, setTimerDefinitionType] = useState("");
  const [open, setOpen] = useState(false);
  const [isFromBuilder, setFromBuilder] = useState(false);
  const [openAlert, setAlert] = useState({
    open: false,
    alertMessage: "Error",
    title: "Error",
  });
  const [date, setDate] = useState();
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
              <Box color="body" className={classes.new}>
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
                <MaterialIcon
                  icon="edit"
                  fontSize={16}
                  className={classes.newIcon}
                  onClick={handleClickOpen}
                />
              </Box>
            }
          />
          {open && timerDefinitionType === "timeDate" && (
            <Dialog
              centered
              backdrop
              open={open}
              className={classes.timeDateDialog}
            >
              <DialogHeader onCloseClick={handleClose}>
                <h3>{translate("Timer definition")}</h3>
              </DialogHeader>
              <DialogContent className={classes.timeDateContent}>
                <InputLabel style={{ fontSize: 14 }}>
                  {translate("Select datetime")}
                </InputLabel>
                <Input
                  type="datetime-local"
                  value={moment(date).format("YYYY-MM-DDTHH:mm")}
                  onChange={(e) => setDate(moment(e?.target?.value))}
                  rounded
                />
              </DialogContent>
              <DialogFooter>
                <Button
                  className={classes.button}
                  variant="primary"
                  onClick={() => {
                    handleChange(moment(date).format("YYYY-MM-DDTHH:mm"));
                    handleClose();
                  }}
                >
                  OK
                </Button>
                <Button
                  className={classes.button}
                  variant="secondary"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </Dialog>
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
