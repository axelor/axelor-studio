import React, { useState, useEffect } from "react";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { translate } from "@studio/shared/i18n";
import {
  Button as _Button,
  InputLabel,
  Dialog as _Dialog,
  DialogHeader as _DialogHeader,
  DialogContent as _DialogContent,
  DialogFooter as _DialogFooter,
  DialogTitle as _DialogTitle,
} from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { AlertDialog } from "@studio/shared/components";

import { createElement, getRoot } from "../../../../../utils/ElementUtil";
import { getMessagesFromXml } from "../../../utils/xml-parser";
import { getWkfModels } from "../../../../../shared/services";
import { TextField, CustomSelectBox } from "../../../../../components/properties/components";
import Select from "../../../../../components/Select";
import type { ModdleElement } from "@studio/shared/types";
import type { PropertiesPanelComponentProps } from "../../property-types";


interface MessagePropsProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messageEventDefinition?: any;
}

interface addElementProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wkf?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message?: any;
}
import styles from "./message-event.module.css";


const setProperty = (name: any, value: any, element: any) => {
  const bo = getBusinessObject(element);
  if (!bo) return;
  if (bo.$attrs) {
    if (!value) {
      delete bo.$attrs[name];
      return;
    }
    bo.$attrs[name] = value;
  } else {
    if (!value) {
      return;
    }
    bo.$attrs = { [name]: value };
  }
};

export default function MessageProps({
  element,
  bpmnFactory,
  messageEventDefinition,
  bpmnModdle,
  bpmnModeler,
  id: wkfId,
}: MessagePropsProps) {
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [messageOptions, setMessageOptions] = useState<any[]>([]);
  const [ele, setEle] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [catchMsgObj, setMsgObj] = useState<any>(null);

  const getModels = React.useCallback((options: any) => {
    return getWkfModels(options, ["diagramXml", "code"]);
  }, []);

  const setInfo = async () => {
    const id = messageEventDefinition?.messageRef?.id;
    if (!id) return;
    const messageElement = findElementById(id);
    const code = messageElement?.$attrs["camunda:modelRefCode"];
    if (!code) return;
    const model = await getModels({
      criteria: [
        {
          fieldName: "code",
          operator: "=",
          value: code,
        },
      ],
    });
    if (!model) return;
    setMsgObj({
      wkf: model[0],
      message: messageElement,
    });
  };

  const handleClickOpen = () => {
    setOpen(true);
    setInfo();
  };

  const handleClose = () => {
    setMsgObj(null);
    setOpen(false);
  };

  const getMessages = async () => {
    if (!catchMsgObj?.wkf?.diagramXml) return [];
    return getMessagesFromXml(catchMsgObj.wkf.diagramXml);
  };

  function findElementById(id: any) {
    if (!id) return;
    const rootElements = bpmnModeler?.get("canvas")?.getRootElement()?.businessObject
      ?.$parent.rootElements;
    return rootElements?.find((r: any) => r.$type === "bpmn:Message" && r.id === id);
  }

  const addElement = ({ wkf, message: messageElement }: addElementProps) => {
    if (!messageEventDefinition || !messageElement) return;
    const { id, name } = messageElement;
    if (!findElementById(id)) {
      const rootElement =
        bpmnModeler &&
        bpmnModeler.get("canvas").getRootElement().businessObject.$parent.rootElements;
      rootElement.push(messageElement);
      const opt = {
        name: `${name} (id=${id})`,
        value: name,
        id: id,
      };
      setMessageOptions((messageEventDefinition) => [...(messageEventDefinition || []), opt]);
    }
    messageElement.$attrs["camunda:modelRefCode"] = wkf?.code;
    messageEventDefinition["messageRef"] = messageElement;
    setEle(messageElement);
    setSelectedMessage(id);
    if (is(element, "bpmn:SendTask")) {
      setProperty("camunda:messageName", name, element);
    }
    if (messageEventDefinition?.messageRef) {
      messageEventDefinition.messageRef.name = messageElement.name;
    }
  };

  const getOptions = React.useCallback(() => {
    const rootElements =
      bpmnModeler && bpmnModeler.get("canvas").getRootElement().businessObject.$parent.rootElements;
    const elements = rootElements && rootElements.filter((r: any) => r.$type === "bpmn:Message");
    const options =
      elements &&
      elements.map((element: any) => {
        return {
          value: element.name,
          name: `${element.name} (id=${element.id})`,
          id: element.id,
        };
      });
    setMessageOptions(options || []);
  }, [bpmnModeler]);

  useEffect(() => {
    const reference = messageEventDefinition.get("messageRef");
    setSelectedMessage(reference && reference.id);
    setEle(reference);
  }, [messageEventDefinition]);

  useEffect(() => {
    getOptions();
  }, [getOptions]);

  return (
    <div>
      <CustomSelectBox
        element={element}
        definition={messageEventDefinition}
        bpmnFactory={bpmnFactory}
        bpmnModdle={bpmnModdle}
        bpmnModeler={bpmnModeler}
        defaultOptions={messageOptions}
        endAdornment={
          <MaterialIcon
            icon="edit"
            fontSize={16}
            className={styles.newIcon}
            onClick={() => {
              handleClickOpen();
            }}
          />
        }
        entry={{
          label: translate("Message"),
          elementName: "message",
          elementType: "bpmn:Message",
          referenceProperty: "messageRef",
          newElementIdPrefix: "Message_",
          set: function (value: any, ele: any) {
            setEle(ele);
            setSelectedMessage(value);
            if (messageEventDefinition && messageEventDefinition.messageRef) {
              messageEventDefinition.messageRef.name = ele.name;
            }
          },
          get: function () {
            return {
              messageRef: selectedMessage,
            };
          },
        }}
      />
      {(selectedMessage || selectedMessage === "") && (
        <TextField
          element={element}
          entry={{
            id: "message-element-name",
            label: translate("Message name"),
            referenceProperty: "messageRef",
            modelProperty: "name",
            shouldValidate: true,
            elementType: "bpmn:Message",
            required: true,
            set: function (e: any, values: any) {
              const root = getRoot(messageEventDefinition);
              if (is(element, "bpmn:SendTask")) {
                setProperty("camunda:messageName", values["name"], element);
              }
              if (messageEventDefinition.messageRef) {
                messageEventDefinition.messageRef.name = values["name"];
              } else {
                if (!bpmnFactory) return;
                const ele = createElement(
                  "bpmn:Message",
                  { name: values["name"] },
                  root,
                  bpmnFactory,
                );
                messageEventDefinition.messageRef = ele;
                const rootElements = ele.$parent?.rootElements as ModdleElement[] | undefined;
                const index = rootElements?.findIndex((message: ModdleElement) => message.id === ele.id) ?? -1;
                if (index < 0) {
                  rootElements?.push(ele);
                }
              }
              getOptions();
              setSelectedMessage(ele && ele.id);
            },
            get: function () {
              const reference = messageEventDefinition && messageEventDefinition.get("messageRef");
              const props: Record<string, any> = {};
              props["name"] = reference && reference.get("name");
              return props;
            },
            validate: function (e, values) {
              if (!values.name && selectedMessage) {
                return { name: translate("Must provide a value") };
              }
            },
          }}
          canRemove={true}
        />
      )}

      <AlertDialog
        openAlert={open}
        title={"Select Message"}
        fullscreen={false}
        handleAlertOk={() => {
          addElement(catchMsgObj);
          setMsgObj(null);
          handleClose();
        }}
        alertClose={handleClose}
        children={
          <div className={styles.alertMessageWrapper}>
            <InputLabel className={styles.label}>{translate("BPM model")}</InputLabel>
            <Select
              className={styles.select}
              disableClearable={true}
              update={(value: any) => {
                setMsgObj((msgObj: any) => ({ ...(msgObj || {}), wkf: value }));
              }}
              name="wkf"
              value={catchMsgObj?.wkf || ""}
              optionLabel="name"
              optionLabelSecondary="description"
              isLabel={false}
              fetchMethod={(options = {}) =>
                getModels({
                  ...options,
                  criteria: wkfId
                    ? [
                        {
                          fieldName: "id",
                          operator: "!=",
                          value: wkfId,
                        },
                        ...(options?.criteria || []),
                      ]
                    : [...(options?.criteria || [])],
                })
              }
              disableUnderline={true}
              isOptionEllipsis={true}
            />
            {catchMsgObj?.wkf && (
              <>
                <InputLabel className={styles.label}>{translate("Messages")}</InputLabel>
                <Select
                  className={styles.select}
                  disableClearable={true}
                  update={(value: any) => {
                    setMsgObj((msgObj: any) => ({
                      ...(msgObj || {}),
                      message: value,
                    }));
                  }}
                  name="message"
                  value={catchMsgObj?.message}
                  optionLabel="name"
                  optionLabelSecondary="description"
                  isLabel={false}
                  fetchMethod={getMessages}
                  disableUnderline={true}
                  isOptionEllipsis={true}
                />
              </>
            )}
          </div>
        }
      />
    </div>
  );
}
