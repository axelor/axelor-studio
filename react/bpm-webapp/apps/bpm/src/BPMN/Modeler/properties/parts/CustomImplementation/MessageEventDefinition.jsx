import React, { useState, useEffect } from "react";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import utils from "bpmn-js-properties-panel/lib/Utils";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";

import {
  TextField,
  CustomSelectBox,
} from "../../../../../components/properties/components";
import { translate } from "../../../../../utils";
import { setDummyProperty } from "./utils";

const setProperty = (name, value, element) => {
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
}) {
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageOptions, setMessageOptions] = useState([]);
  const [ele, setEle] = useState(null);

  const getOptions = React.useCallback(() => {
    const rootElements =
      bpmnModeler &&
      bpmnModeler.get("canvas").getRootElement().businessObject.$parent
        .rootElements;
    const elements =
      rootElements && rootElements.filter((r) => r.$type === "bpmn:Message");
    const options =
      elements &&
      elements.map((element) => {
        return {
          value: element.name,
          name: `${element.name} (id=${element.id})`,
          id: element.id,
        };
      });
    setMessageOptions(options || []);
  }, [bpmnModeler]);

  useEffect(() => {
    let reference = messageEventDefinition.get("messageRef");
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
        entry={{
          label: translate("Message"),
          elementName: "message",
          elementType: "bpmn:Message",
          referenceProperty: "messageRef",
          newElementIdPrefix: "Message_",
          set: function (value, ele) {
            setEle(ele);
            setSelectedMessage(value);
            if (messageEventDefinition && messageEventDefinition.messageRef) {
              setDummyProperty({
                bpmnModeler,
                element,
                value: ele.name,
              });
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
            set: function (e, values) {
              setDummyProperty({
                bpmnModeler,
                element,
                value: true,
              });
              let root = utils.getRoot(messageEventDefinition);
              if (is(element, "bpmn:SendTask")) {
                setProperty("camunda:messageName", values["name"], element);
              }
              if (messageEventDefinition.messageRef) {
                messageEventDefinition.messageRef.name = values["name"];
              } else {
                let ele = elementHelper.createElement(
                  "bpmn:Message",
                  { name: values["name"] },
                  root,
                  bpmnFactory
                );
                messageEventDefinition.messageRef = ele;
                let index =
                  ele.$parent.rootElements &&
                  ele.$parent.rootElements.findIndex(
                    (message) => message.id === ele.id
                  );
                if (index < 0) {
                  ele.$parent.rootElements.push(ele);
                }
              }
              getOptions();
              setSelectedMessage(ele && ele.id);
            },
            get: function () {
              let reference =
                messageEventDefinition &&
                messageEventDefinition.get("messageRef");
              let props = {};
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
    </div>
  );
}
