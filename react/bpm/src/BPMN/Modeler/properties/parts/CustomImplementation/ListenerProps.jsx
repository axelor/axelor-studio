import React, { useEffect, useState } from "react";
import { getLinkEventDefinition } from "../../../../../utils/EventDefinitionUtil";
import { getExtensionElements } from "../../../../../utils/ExtensionElementsUtil";
import {
  getImplementationType,
  isSequenceFlow as _isSequenceFlow,
} from "../../../../../utils/ImplementationTypeUtils";
import { createElement } from "../../../../../utils/ElementUtil";
import find from "lodash/find";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { BootstrapIcon } from "@axelor/ui/icons/bootstrap-icon";

import AlertDialog from "../../../../../components/AlertDialog";
import Mapper from "../../../../../components/Mapper";
import { translate } from "../../../../../utils";
import {
  ExtensionElementTable,
  SelectBox,
  TextField,
  Textbox,
} from "../../../../../components/properties/components";
import Tooltip from "../../../../../components/Tooltip";
import { TASK_LISTENER_EVENT_TYPE_OPTION } from "../../../constants";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
  Box,
  DialogTitle,
} from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import styles from "./listener-props.module.css";
import useDialog from "../../../../../hooks/useDialog";
import CollapsePanel from "../componants/CollapsePanel";

const CAMUNDA_EXECUTION_LISTENER_ELEMENT = "camunda:ExecutionListener";
const CAMUNDA_TASK_LISTENER_ELEMENT = "camunda:TaskListener";

const LISTENER_TYPE_LABEL = {
  class: translate("Java class"),
  expression: translate("Expression"),
  delegateExpression: translate("Delegate expression"),
  script: translate("Script"),
};

const timerOptions = [
  { value: "timeDate", name: translate("Date") },
  { value: "timeDuration", name: translate("Duration") },
  { value: "timeCycle", name: translate("Cycle") },
];

function getListeners(bo, type) {
  return (bo && getExtensionElements(bo, type)) || [];
}

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

function getTimerDefinition(timerOrFunction, element, node) {
  if (typeof timerOrFunction === "function") {
    return timerOrFunction(element, node);
  }
  return timerOrFunction;
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

export default function ListenerProps({
  element,
  index,
  label,
  bpmnFactory,
  bpmnModeler,
  setDummyProperty = () => {},
}) {
  const [isVisible, setVisible] = useState(false);
  const [selectedExecutionEntity, setSelectedExecutionEntity] = useState(null);
  const [selectedTaskEntity, setSelectedTaskEntity] = useState(null);
  const [eventType, setEventType] = useState(null);
  const [timerDefinitionType, setTimerDefinitionType] = useState("");
  const [taskOptions, setTaskOptions] = useState(null);
  const [executionOptions, setExecutionOptions] = useState(null);
  const [open, setOpen] = useState(false);
  const [openAlert, setAlert] = useState(false);
  const [openScriptDialog, setOpenScriptDialog] = useState(false);
  const [script, setScript] = useState("");
  const isSequenceFlow = _isSequenceFlow(element);
  const openDialog = useDialog();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const onSave = (expr) => {
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
          bpmnFactory
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

  const getExecutionOptions = () => {
    const executionListenerEventTypeOptions = _isSequenceFlow(element)
      ? [{ name: translate("take"), value: "take" }]
      : [
          { name: translate("start"), value: "start" },
          { name: translate("end"), value: "end" },
        ];
    return executionListenerEventTypeOptions;
  };

  const newElement = (element, type, initialEvent) => {
    return function (e, extensionEle, value) {
      let props = {
        event: initialEvent,
        script: undefined,
      };

      let newElem = createElement(type, props, extensionEle, bpmnFactory);

      let bo = getBusinessObject(element);
      let extensionElements = bo && bo.extensionElements;
      if (!extensionElements) {
        extensionElements = createElement(
          "bpmn:ExtensionElements",
          { values: [] },
          bo,
          bpmnFactory
        );
        element.businessObject.extensionElements = extensionElements;
      }
      element.businessObject.extensionElements.values.push(newElem);
      return newElem;
    };
  };

  const removeElement = (type) => {
    return function (index) {
      if (Number(index) < 0) return;
      let bo = getBusinessObject(element);
      const extensionElements = bo?.extensionElements?.values;
      const elements = extensionElements?.filter((e) => e.$type === type) || [];
      elements.splice(index, 1);
      bo.extensionElements.values = [
        ...(extensionElements?.filter((e) => e.$type !== type) || []),
        ...(elements || []),
      ];
      addOptions(element);
      if (
        extensionElements &&
        !extensionElements.find((e) => e.$type === type)
      ) {
        if (type === CAMUNDA_EXECUTION_LISTENER_ELEMENT) {
          setSelectedExecutionEntity(null);
        } else {
          setSelectedTaskEntity(null);
        }
      } else {
        setSelectedExecutionEntity(null);
        setSelectedTaskEntity(null);
      }
    };
  };

  const getBO = React.useCallback(() => {
    return getBusinessObject(element);
  }, [element]);

  const getListener = React.useCallback(() => {
    let type =
      selectedExecutionEntity === 0 || selectedExecutionEntity
        ? CAMUNDA_EXECUTION_LISTENER_ELEMENT
        : CAMUNDA_TASK_LISTENER_ELEMENT;
    let bo = getBO();
    const listeners = getListeners(bo, type);
    const listener =
      listeners[
        selectedExecutionEntity === 0 || selectedExecutionEntity
          ? selectedExecutionEntity
          : selectedTaskEntity
      ];
    return listener || (listeners && listeners[0]);
  }, [getBO, selectedExecutionEntity, selectedTaskEntity]);

  const showExecutionListener = () => {
    if (
      is(element, "bpmn:FlowElement") ||
      is(element, "bpmn:Process") ||
      is(element, "bpmn:Participant")
    ) {
      const bo = getBO();
      return bo ? true : false;
    } else {
      return false;
    }
  };

  const setOptionLabelValue = (type) => {
    const bo = getBO();
    return function (index) {
      let listeners = getListeners(bo, type);
      let listener = listeners[index];
      let listenerType = getImplementationType(listener);
      if (!listener) return "";
      let event = listener.get("event")
        ? listener.get("event")
        : `<${translate("empty")}>`;

      let label =
        (translate(event) || "*") +
        " : " +
        (translate(LISTENER_TYPE_LABEL[listenerType]) || translate("Script"));
      return label;
    };
  };

  function createTimerEventDefinition(listener) {
    if (!listener || !isTimeoutTaskListener(listener)) {
      return;
    }
    let eventDefinitions = listener.get("eventDefinitions") || [],
      timerEventDefinition = bpmnFactory.create("bpmn:TimerEventDefinition");
    eventDefinitions.push(timerEventDefinition);
    listener.eventDefinitions = eventDefinitions;
    return timerEventDefinition;
  }

  function isTimeoutTaskListener(listener) {
    let eventType = listener && listener.event;
    return eventType === "timeout";
  }

  // timerEventDefinition //////
  let timerEventDefinitionHandler = function (listener) {
    if (!listener || !isTimeoutTaskListener(listener)) {
      return;
    }
    let timerEventDefinition = getTimerEventDefinition(listener);
    if (!timerEventDefinition) {
      return false;
    }
    return timerEventDefinition;
  };

  function getTimerEventDefinition(bo) {
    let eventDefinitions = bo.eventDefinitions || [];
    return find(eventDefinitions, function (event) {
      return is(event, "bpmn:TimerEventDefinition");
    });
  }

  const addOptions = (element, isInitial = false) => {
    const bo = getBusinessObject(element);
    const executionListeners = getListeners(
      bo,
      CAMUNDA_EXECUTION_LISTENER_ELEMENT
    );

    const executionOptions =
      executionListeners &&
      executionListeners.map(function (l, index) {
        let listenerType = getImplementationType(l);
        return {
          id: index,
          text: `${translate(l.event)} : ${
            translate(LISTENER_TYPE_LABEL[listenerType]) || translate("Script")
          }`,
        };
      });

    const taskListeners = getListeners(bo, CAMUNDA_TASK_LISTENER_ELEMENT);
    const taskOptions =
      taskListeners &&
      taskListeners.map(function (l, index) {
        let listenerType = getImplementationType(l);
        return {
          id: index,
          text: `${translate(l.event)} : ${
            translate(LISTENER_TYPE_LABEL[listenerType]) || translate("Script")
          }`,
        };
      });
    setExecutionOptions(executionOptions);
    setTaskOptions(taskOptions);
    if (isInitial) {
      if (executionOptions.length > 0) {
        setSelectedExecutionEntity(executionOptions[0]);
        setSelectedTaskEntity(null);
      } else if (taskOptions.length > 0) {
        setSelectedExecutionEntity(null);
        setSelectedTaskEntity(taskOptions[0]);
      }
    }
  };

  const setScriptValue = (values) => {
    const listener = getListener();
    setDummyProperty({
      bpmnModeler,
      element,
      value: true,
    });
    if (!listener?.script) {
      listener.script =
        listener.script ||
        createElement(
          "camunda:Script",
          {
            scriptFormat: "axelor",
            value: values.script,
          },
          getBO(),
          bpmnFactory
        );
    } else {
      if (!listener) return;
      listener.script.value = values.script;
      listener.script.resource = undefined;
      listener.script.scriptFormat = "axelor";
    }
  };

  useEffect(() => {
    setVisible(
      !getLinkEventDefinition(element) ||
        (!is(element, "bpmn:IntermediateThrowEvent") &&
          getLinkEventDefinition(element))
    );
  }, [element]);

  useEffect(() => {
    addOptions(element, true);
  }, [element]);

  return (
    isVisible && (
      <CollapsePanel label={label}>
        {showExecutionListener() && (
          <ExtensionElementTable
            element={element}
            options={executionOptions}
            entry={{
              id: "executionListeners",
              label: translate("Execution listener"),
              modelProperty: "name",
              idGeneration: "false",
              reference: "processRef",
              createExtensionElement: newElement(
                element,
                CAMUNDA_EXECUTION_LISTENER_ELEMENT,
                isSequenceFlow ? "take" : "start"
              ),
              removeExtensionElement: removeElement(
                CAMUNDA_EXECUTION_LISTENER_ELEMENT
              ),
              onSelectionChange: function (value) {
                setSelectedExecutionEntity(value);
                setSelectedTaskEntity(null);
              },
              setOptionLabelValue: setOptionLabelValue(
                CAMUNDA_EXECUTION_LISTENER_ELEMENT
              ),
            }}
          />
        )}
        {is(element, "bpmn:UserTask") && (
          <ExtensionElementTable
            element={element}
            options={taskOptions}
            entry={{
              id: "taskListeners",
              label: translate("Task listener"),
              modelProperty: "name",
              idGeneration: "false",
              createExtensionElement: newElement(
                element,
                CAMUNDA_TASK_LISTENER_ELEMENT,
                "create"
              ),
              removeExtensionElement: removeElement(
                CAMUNDA_TASK_LISTENER_ELEMENT
              ),
              onSelectionChange: function (value) {
                setSelectedTaskEntity(value);
                setSelectedExecutionEntity(null);
              },
              setOptionLabelValue: setOptionLabelValue(
                CAMUNDA_TASK_LISTENER_ELEMENT
              ),
            }}
          />
        )}
        {(selectedExecutionEntity ||
          selectedExecutionEntity === 0 ||
          selectedTaskEntity ||
          selectedTaskEntity === 0) && (
          <React.Fragment>
            <SelectBox
              element={element}
              entry={{
                id: "listener-event-type",
                label: translate("Event type"),
                modelProperty: "eventType",
                emptyParameter: false,
                selectOptions: function () {
                  return selectedExecutionEntity ||
                    selectedExecutionEntity === 0
                    ? getExecutionOptions()
                    : TASK_LISTENER_EVENT_TYPE_OPTION;
                },
                get: function () {
                  const listener = getListener();
                  if (!listener) return;
                  let eventType = listener && listener.get("event");
                  setEventType(eventType);
                  return {
                    eventType: eventType,
                  };
                },
                set: function (element, values) {
                  let eventType = values.eventType;
                  setEventType(eventType);
                  const listener = getListener();
                  if (!listener) return;
                  let eventDefinitions = listener && listener.eventDefinitions;
                  // ensure only timeout events can have timer event definitions
                  if (eventDefinitions && eventType !== "timeout") {
                    eventDefinitions = [];
                  }
                  listener.event = eventType;
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
                  set: function (e, values) {
                    const listener = getListener();
                    if (!listener) return;
                    setDummyProperty({
                      bpmnModeler,
                      element,
                      value: values.listenerId,
                    });
                    listener.id = values.listenerId;
                  },
                  validate: function (e, values) {
                    if (!values.listenerId && eventType === "timeout") {
                      return {
                        listenerId: translate(
                          "Must provide a value for timeout task listener"
                        ),
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
                  get: function () {
                    const listener = getListener();
                    if (listener?.script) {
                      return { script: listener.script.value };
                    }
                  },
                  set: function (e, values) {
                    setScriptValue(values);
                  },
                  validate: function (e, values) {
                    if (!values.script) {
                      return { script: translate("Must provide a value") };
                    }
                  },
                }}
              />
              <Box color="body" className={styles.edit}>
                <Tooltip title="Enable" aria-label="enable">
                  <BootstrapIcon
                    icon="code-slash"
                    fontSize={18}
                    onClick={() => {
                      const listener = getListener();
                      if (listener?.script?.scriptValue) {
                        openDialog({
                          title: "Warning",
                          message:"Script can't be managed using builder once changed manually.",
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
                        onSave={(expr) => onSave(expr)}
                        params={() => getExpression()}
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
                              set: function (e, values) {
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
              <React.Fragment>
                <SelectBox
                  element={element}
                  entry={{
                    id: "listener-timer-event-definition-type",
                    label: translate("Timer definition type"),
                    selectOptions: timerOptions,
                    emptyParameter: true,
                    modelProperty: "timerDefinitionType",
                    get: function (element, node) {
                      const listener = getListener();
                      let timerDefinition = getTimerDefinition(
                        timerEventDefinitionHandler(listener),
                        element,
                        node
                      );
                      let timerDefinitionType =
                        getTimerDefinitionType(timerDefinition) || "";
                      setTimerDefinitionType(timerDefinitionType);
                      return {
                        timerDefinitionType: timerDefinitionType,
                      };
                    },
                    set: function (element, values) {
                      setTimerDefinitionType(values.timerDefinitionType);
                      let props = {
                        timeDuration: undefined,
                        timeDate: undefined,
                        timeCycle: undefined,
                      };
                      const listener = getListener();
                      let timerDefinition = getTimerDefinition(
                          timerEventDefinitionHandler(listener),
                          element
                        ),
                        newType = values.timerDefinitionType;
                      if (
                        !timerDefinition &&
                        typeof createTimerEventDefinition === "function"
                      ) {
                        timerDefinition = createTimerEventDefinition(listener);
                      }
                      if (values.timerDefinitionType) {
                        let oldType = getTimerDefinitionType(timerDefinition);

                        let value;
                        if (oldType) {
                          let definition = timerDefinition.get(oldType);
                          value = definition.get("body");
                        }
                        props[newType] = createFormalExpression(
                          timerDefinition,
                          value,
                          bpmnFactory
                        );
                      }
                      Object.entries(props).forEach(([key, value]) => {
                        timerDefinition[key] = value;
                      });
                      if (!listener) return;
                      listener.eventDefinitions = [timerDefinition];
                    },
                  }}
                />
                {(timerDefinitionType || timerDefinitionType !== "") && (
                  <TextField
                    element={element}
                    canRemove={true}
                    entry={{
                      id: "listener-timer-event-definition",
                      label: translate("Timer definition"),
                      modelProperty: "timerDefinition",
                      get: function (element, node) {
                        const listener = getListener();
                        let timerDefinition = getTimerDefinition(
                            timerEventDefinitionHandler(listener),
                            element,
                            node
                          ),
                          type = getTimerDefinitionType(timerDefinition),
                          definition = type && timerDefinition.get(type),
                          value = definition && definition.get("body");

                        return {
                          timerDefinition: value,
                        };
                      },
                      set: function (element, values, node) {
                        const listener = getListener();
                        let timerDefinition = getTimerDefinition(
                            timerEventDefinitionHandler(listener),
                            element,
                            node
                          ),
                          type = getTimerDefinitionType(timerDefinition),
                          definition = type && timerDefinition.get(type);
                        setDummyProperty({
                          bpmnModeler,
                          element,
                          value: values.timerDefinitio,
                        });
                        if (definition) {
                          definition.body = values.timerDefinition || undefined;
                        }
                        if (!listener) return;
                        listener.eventDefinitions = [timerDefinition];
                      },
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
              </React.Fragment>
            )}
          </React.Fragment>
        )}
      </CollapsePanel>
    )
  );
}
