import React from "react";
import { BootstrapIcon } from "@axelor/ui/icons/bootstrap-icon";
import { Box } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { AlertDialog, Tooltip  } from "@studio/shared/components";
import { translate } from "@studio/shared/i18n";

import { createElement } from "../../../../../../utils/ElementUtil";
import Mapper from "../../../../../../components/Mapper";
import { SelectBox, TextField, Textbox } from "../../../../../../components/properties/components";
import { TASK_LISTENER_EVENT_TYPE_OPTION } from "../../../../constants";
import type { PropertiesPanelComponentProps } from "../../../property-types";


interface ListenerDetailSectionProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedExecutionEntity?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedTaskEntity?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventType?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setEventType?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timerDefinitionType?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setTimerDefinitionType?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  open?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setOpen?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openScriptDialog?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setOpenScriptDialog?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  script?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setScript?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getListener?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getBO?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getExecutionOptions?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setScriptValue?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addOptions?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openDialog?: any;
}
import styles from "./listener-props.module.css";
import TimerSection from "./TimerSection";

export default function ListenerDetailSection({
  element,
  bpmnModeler,
  bpmnFactory,
  selectedExecutionEntity,
  selectedTaskEntity,
  eventType,
  setEventType,
  timerDefinitionType,
  setTimerDefinitionType,
  open,
  setOpen,
  openScriptDialog,
  setOpenScriptDialog,
  script,
  setScript,
  getListener,
  getBO,
  getExecutionOptions,
  setScriptValue,
  addOptions,
  openDialog,
}: ListenerDetailSectionProps) {
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const onSave = (expr: any) => {
    const listener = getListener();
    if (!listener) return;
    if (!expr) {
      listener.script.value = undefined;
      listener.script.resource = undefined;
      listener.script.scriptFormat = undefined;
      listener.script.scriptValue = undefined;
      handleClose();
      return;
    }
    if (!listener?.script) {
      if (!bpmnFactory) return;
      listener.script =
        listener.script ||
        createElement(
          "camunda:Script",
          {
            scriptFormat: "axelor",
            value: expr.resultField,
            scriptValue: expr.resultMetaField,
          },
          getBO(),
          bpmnFactory,
        );
    } else {
      listener.script.value = expr.resultField;
      listener.script.resource = undefined;
      listener.script.scriptFormat = "axelor";
      listener.script.scriptValue = expr.resultMetaField;
    }
    handleClose();
  };

  const getExpression = () => {
    const listener = getListener();
    if (!listener && !listener?.script)
      return {
        resultField: undefined,
        resultMetaField: undefined,
      };
    return {
      resultField: listener?.script?.value,
      resultMetaField: listener?.script?.scriptValue,
    };
  };

  const getReadOnly = () => {
    const listener = getListener();
    return listener?.script?.scriptValue ? true : false;
  };

  function isTimeoutTaskListener(listener: any) {
    const eventTypeVal = listener && listener.event;
    return eventTypeVal === "timeout";
  }

  function createTimerEventDefinition(listener: any) {
    if (!listener || !isTimeoutTaskListener(listener)) {
      return;
    }
    if (!bpmnFactory) return;
    const eventDefinitions = listener.get("eventDefinitions") || [],
      timerEventDefinition = bpmnFactory.create("bpmn:TimerEventDefinition");
    eventDefinitions.push(timerEventDefinition);
    listener.eventDefinitions = eventDefinitions;
    return timerEventDefinition;
  }

  return (
    <React.Fragment>
      <SelectBox
        element={element}
        entry={{
          id: "listener-event-type",
          label: translate("Event type"),
          modelProperty: "eventType",
          emptyParameter: false,
          selectOptions: function () {
            return selectedExecutionEntity || selectedExecutionEntity === 0
              ? getExecutionOptions()
              : TASK_LISTENER_EVENT_TYPE_OPTION;
          },
          get: function () {
            const listener = getListener();
            if (!listener) return;
            const eventTypeVal = listener && listener.get("event");
            setEventType(eventTypeVal);
            return {
              eventType: eventTypeVal,
            };
          },
          set: function (element: any, values: any) {
            const eventTypeVal = values.eventType;
            setEventType(eventTypeVal);
            const listener = getListener();
            if (!listener) return;
            let eventDefinitions = listener && listener.eventDefinitions;
            if (eventDefinitions && eventTypeVal !== "timeout") {
              eventDefinitions = [];
            }
            listener.event = eventTypeVal;
            listener.eventDefinitions = eventDefinitions;
            addOptions(element);
          },
        }}
      />
      {(selectedTaskEntity || selectedTaskEntity === 0) && (
        <TextField
          element={element}
          canRemove={true}
          entry={{
            id: "listener-id",
            label: translate("Listener id"),
            modelProperty: "listenerId",
            get: function () {
              const listener = getListener();
              if (!listener) return;
              return { listenerId: listener.id };
            },
            set: function (e: any, values: any) {
              const listener = getListener();
              if (!listener) return;
              listener.id = values.listenerId;
            },
            validate: function (e, values) {
              if (!values.listenerId && eventType === "timeout") {
                return {
                  listenerId: translate("Must provide a value for timeout task listener"),
                };
              }
            },
          }}
        />
      )}
      <div className={styles.mapperBuilder}>
        <Textbox
          element={element}
          rows={3}
          className={styles.textbox}
          readOnly={() => getReadOnly()}
          minimap={false}
          entry={{
            id: "script",
            label: translate("Script"),
            modelProperty: "script",
            required: true,
            get: function () {
              const listener = getListener();
              if (listener?.script) {
                return { script: listener.script.value };
              }
            },
            set: function (e: any, values: any) {
              setScriptValue(values);
            },
            validate: function (e: any, values: any) {
              if (!values.script) {
                return { script: translate("Must provide a value") };
              }
            },
          }}
        />
        <Box color="body" className={styles.edit}>
          <Tooltip title={translate("Enable")} aria-label="enable">
            <BootstrapIcon
              icon="code-slash"
              fontSize={18}
              onClick={() => {
                const listener = getListener();
                if (listener?.script?.scriptValue) {
                  openDialog({
                    title: "Warning",
                    message: "Script can't be managed using builder once changed manually.",
                    onSave: () => {
                      const listener = getListener();
                      if (!listener) return;
                      setScript(listener?.script?.value);
                      listener.script.scriptValue = undefined;
                      setOpenScriptDialog(true);
                    },
                  });
                } else {
                  setScript(listener?.script?.value);
                  setOpenScriptDialog(true);
                }
              }}
            />
          </Tooltip>
          {(selectedExecutionEntity === 0 ||
            selectedExecutionEntity ||
            selectedTaskEntity ||
            selectedTaskEntity === 0) && (
            <>
              <MaterialIcon
                icon="edit"
                fontSize={16}
                className={styles.editIcon}
                onClick={handleClickOpen}
              />
              {open && (
                <Mapper
                  open={open}
                  handleClose={handleClose}
                  onSave={(expr: any) => onSave(expr)}
                  params={() => getExpression()}
                  // @ts-expect-error -- safety: bpmn-js element is BpmnElement at this call site
                  element={element}
                  bpmnModeler={bpmnModeler}
                />
              )}
              {openScriptDialog && (
                <AlertDialog
                  className={styles.scriptDialog}
                  openAlert={openScriptDialog}
                  alertClose={() => {
                    const listener = getListener();
                    setScript(listener?.script?.value);
                    setOpenScriptDialog(false);
                  }}
                  handleAlertOk={() => {
                    setScriptValue({ script });
                    setOpenScriptDialog(false);
                  }}
                  title={translate("Add script")}
                  children={
                    <Textbox
                      element={element}
                      className={styles.textbox}
                      showLabel={false}
                      defaultHeight={window?.innerHeight - 205}
                      entry={{
                        id: "script",
                        label: translate("Script"),
                        modelProperty: "script",
                        get: function () {
                          return { script };
                        },
                        set: function (e: any, values: any) {
                          setScript(values?.script);
                        },
                      }}
                    />
                  }
                />
              )}
            </>
          )}
        </Box>
      </div>
      {eventType === "timeout" && (
        <TimerSection
          element={element}
          bpmnFactory={bpmnFactory}
          timerDefinitionType={timerDefinitionType}
          setTimerDefinitionType={setTimerDefinitionType}
          getListener={getListener}
          createTimerEventDefinition={createTimerEventDefinition}
        />
      )}
    </React.Fragment>
  );
}
