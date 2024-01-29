import React, { useState, useEffect } from "react";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import utils from "bpmn-js-properties-panel/lib/Utils";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import BpmnModeler from "bpmn-js/lib/Modeler";

import { getWkfModels } from "../../../../../services/api";
import {
  TextField,
  CustomSelectBox,
} from "../../../../../components/properties/components";
import Select from "../../../../../components/Select";
import { translate } from "../../../../../utils";
import { makeStyles } from "@material-ui/core/styles";
import {
  Button,
  InputLabel,
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
} from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

const useStyles = makeStyles((theme) => ({
  dialogPaper: {
    minWidth: 450,
    overflow: "auto",
  },
  button: {
    margin: theme.spacing(1),
    textTransform: "none",
    minWidth: 64,
  },
  label: {
    margin: "3px 0px",
    color: "rgba(var(--bs-body-color-rgb),.65) !important",
    fontSize: "var(----ax-theme-panel-header-font-size, 1rem)",
  },
  select: {
    width: "100%",
  },
  newIcon: {
    cursor: "pointer",
  },
}));

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
  id: wkfId,
  setDummyProperty = () => {},
}) {
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageOptions, setMessageOptions] = useState([]);
  const [ele, setEle] = useState(null);
  const [open, setOpen] = useState(false);
  const [catchMsgObj, setMsgObj] = useState(null);
  const classes = useStyles();

  const getModels = React.useCallback((options) => {
    return getWkfModels(options, ["diagramXml", "code"]);
  }, []);

  const setInfo = async () => {
    let code;
    const id = messageEventDefinition?.messageRef?.id;
    if (!id) return;
    const messageElement = findElementById(id);
    code = messageElement?.$attrs["camunda:modelRefCode"];
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
    let modeler = {
      keyboard: { bindTo: document },
    };
    let bpmnModelerTest = new BpmnModeler({ ...modeler });
    await bpmnModelerTest.importXML(catchMsgObj?.wkf?.diagramXml);
    const rootElements = bpmnModelerTest?.get("canvas")?.getRootElement()
      ?.businessObject?.$parent.rootElements;
    return rootElements?.filter(
      (r) =>
        !(r?.$attrs && r.$attrs["camunda:modelRefCode"]) &&
        r.$type === "bpmn:Message"
    );
  };

  function findElementById(id) {
    if (!id) return;
    const rootElements = bpmnModeler?.get("canvas")?.getRootElement()
      ?.businessObject?.$parent.rootElements;
    return rootElements?.find((r) => r.$type === "bpmn:Message" && r.id === id);
  }

  const addElement = ({ wkf, message: messageElement }) => {
    if (!messageEventDefinition || !messageElement) return;
    const { id, name } = messageElement;
    if (!findElementById(id)) {
      let rootElement =
        bpmnModeler &&
        bpmnModeler.get("canvas").getRootElement().businessObject.$parent
          .rootElements;
      rootElement.push(messageElement);
      let opt = {
        name: `${name} (id=${id})`,
        value: name,
        id: id,
      };
      setMessageOptions((messageEventDefinition) => [
        ...(messageEventDefinition || []),
        opt,
      ]);
    }
    messageElement.$attrs["camunda:modelRefCode"] = wkf?.code;
    messageEventDefinition["messageRef"] = messageElement;
    setEle(messageElement);
    setSelectedMessage(id);
    if (is(element, "bpmn:SendTask")) {
      setProperty("camunda:messageName", name, element);
    }
    if (messageEventDefinition?.messageRef) {
      setDummyProperty({
        bpmnModeler,
        element,
        value: name,
      });
      messageEventDefinition.messageRef.name = messageElement.name;
    }
  };

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
        endAdornment={
          <MaterialIcon
            icon="edit"
            fontSize={16}
            className={classes.newIcon}
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
      {open && (
        <Dialog open={open} centered backdrop className={classes.dialogPaper}>
          <DialogHeader id="form-dialog-title" onCloseClick={handleClose}>
            <h3>{translate("Select Message")}</h3>
          </DialogHeader>
          <DialogContent className={classes.dialogContent}>
            <InputLabel className={classes.label}>
              {translate("BPM model")}
            </InputLabel>
            <Select
              className={classes.select}
              disableClearable={true}
              update={(value) => {
                setMsgObj((msgObj) => ({ ...(msgObj || {}), wkf: value }));
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
                <InputLabel className={classes.label}>
                  {translate("Messages")}
                </InputLabel>
                <Select
                  className={classes.select}
                  disableClearable={true}
                  update={(value) => {
                    setMsgObj((msgObj) => ({
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
          </DialogContent>
          <DialogFooter>
            <Button
              onClick={handleClose}
              className={classes.button}
              variant="secondary"
            >
              {translate("Cancel")}
            </Button>
            <Button
              onClick={() => {
                addElement(catchMsgObj);
                setMsgObj(null);
                handleClose();
              }}
              className={classes.button}
              variant="primary"
            >
              {translate("OK")}
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
}
