import React, { useState, useEffect } from "react";
import { translate } from "@studio/shared/i18n";
import { InputLabel } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { AlertDialog } from "@studio/shared/components";

import { parseXmlRootElements } from "../../../utils/xml-parser";
import Select from "../../../../../components/Select";
import { TextField, CustomSelectBox } from "../../../../../components/properties/components";
import { getWkfModels } from "../../../../../shared/services";
import type { PropertiesPanelComponentProps } from "../../property-types";


interface SignalEventPropsProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signalEventDefinition?: any;
}

interface addElementProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wkf?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signal?: any;
}
import styles from "./signal-event.module.css";


export default function SignalEventProps({
  element,
  bpmnFactory,
  signalEventDefinition,
  bpmnModdle,
  bpmnModeler,
  id: wkfId,
}: SignalEventPropsProps) {
  const [selectedSignal, setSelectedSignal] = useState<any>(null);
  const [signalOptions, setSignalOptions] = useState<any[]>([]);
  const [ele, setEle] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [catchSignalObj, setSignalObj] = useState<any>(null);

  const getModels = React.useCallback((options: any) => {
    return getWkfModels(options, ["diagramXml", "code"]);
  }, []);

  const setInfo = async () => {
    const id = signalEventDefinition?.signalRef?.id;
    if (!id) return;
    const signalElement = findElementById(id);
    const code = signalElement?.$attrs["camunda:modelRefCode"];
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
    setSignalObj({
      wkf: model[0],
      signal: signalElement,
    });
  };

  const handleClickOpen = () => {
    setOpen(true);
    setInfo();
  };

  const handleClose = () => {
    setSignalObj(null);
    setOpen(false);
  };

  const _getSignals = async () => {
    if (!catchSignalObj?.wkf?.diagramXml) return [];
    const rootElements = await parseXmlRootElements(catchSignalObj.wkf.diagramXml);
    return rootElements.filter(
      (r) => !(r?.$attrs && r.$attrs["camunda:modelRefCode"]) && r.$type === "bpmn:Signal",
    );
  };

  function findElementById(id: any) {
    if (!id) return;
    const rootElements = bpmnModeler?.get("canvas")?.getRootElement()?.businessObject
      ?.$parent.rootElements;
    return rootElements?.find((r: any) => r.$type === "bpmn:Signal" && r.id === id);
  }

  const addElement = ({ wkf, signal: signalElement }: addElementProps) => {
    if (!signalEventDefinition || !signalElement) return;
    const { id, name } = signalElement;
    if (!findElementById(id)) {
      const rootElement =
        bpmnModeler &&
        bpmnModeler.get("canvas").getRootElement().businessObject.$parent.rootElements;
      rootElement.push(signalElement);
      const opt = {
        name: `${name} (id=${id})`,
        value: name,
        id: id,
      };
      setSignalOptions((signalEventDefinition) => [...(signalEventDefinition || []), opt]);
    }
    signalElement.$attrs["camunda:modelRefCode"] = wkf?.code;
    signalEventDefinition["signalRef"] = signalElement;
    setEle(signalElement);
    setSelectedSignal(id);
    if (signalEventDefinition?.signalRef) {
      signalEventDefinition.signalRef.name = signalElement.name;
    }
  };

  const getOptions = React.useCallback(() => {
    const rootElements =
      bpmnModeler && bpmnModeler.get("canvas").getRootElement().businessObject.$parent.rootElements;
    const elements = rootElements && rootElements.filter((r: any) => r.$type === "bpmn:Signal");
    const options =
      elements &&
      elements.map((element: any) => {
        return {
          value: element.name,
          name: `${element.name} (id=${element.id})`,
          id: element.id,
        };
      });
    setSignalOptions(options || []);
  }, [bpmnModeler]);

  useEffect(() => {
    const reference = signalEventDefinition.get("signalRef");
    setSelectedSignal(reference && reference.id);
    setEle(reference);
  }, [signalEventDefinition]);

  useEffect(() => {
    getOptions();
  }, [getOptions]);

  return (
    <div>
      <CustomSelectBox
        element={element}
        definition={signalEventDefinition}
        bpmnFactory={bpmnFactory}
        bpmnModdle={bpmnModdle}
        bpmnModeler={bpmnModeler}
        defaultOptions={signalOptions}
        endAdornment={
          <MaterialIcon
            icon="edit"
            fontSize={15}
            className={styles.newIcon}
            onClick={() => {
              handleClickOpen();
            }}
          />
        }
        entry={{
          label: translate("Signal"),
          elementName: "signal",
          elementType: "bpmn:Signal",
          referenceProperty: "signalRef",
          newElementIdPrefix: "Signal_",
          set: function (value: any, ele: any) {
            setEle(ele);
            setSelectedSignal(value);
            if (signalEventDefinition && signalEventDefinition.signalRef) {
              signalEventDefinition.signalRef.name = ele.name;
            }
          },
          get: function () {
            return {
              signalRef: selectedSignal,
            };
          },
        }}
      />
      {(selectedSignal || selectedSignal === "") && (
        <TextField
          element={element}
          canRemove={true}
          entry={{
            id: "signal-element-name",
            label: translate("Signal name"),
            referenceProperty: "signalRef",
            modelProperty: "name",
            shouldValidate: true,
            get: function () {
              if (!signalEventDefinition) return;
              const reference = signalEventDefinition.get("signalRef");
              return {
                name: reference && reference.name,
              };
            },
            set: function (e: any, value: any) {
              if (signalEventDefinition && signalEventDefinition.signalRef) {
                signalEventDefinition.signalRef.name = value.name;
                getOptions();
                setSelectedSignal(ele && ele.id);
              }
            },
            validate: function (e, values) {
              if (!values.name && selectedSignal) {
                return { name: translate("Must provide a value") };
              }
            },
          }}
        />
      )}

      <AlertDialog
        openAlert={open}
        fullscreen={false}
        title={"Select Signal"}
        handleAlertOk={() => {
          addElement(catchSignalObj);
          setSignalObj(null);
          handleClose();
        }}
        alertClose={handleClose}
        children={
          <div className={styles.dialogContent}>
            <InputLabel color="body">{translate("BPM model")}</InputLabel>
            <Select
              className={styles.select}
              disableClearable={true}
              update={(value: any) => {
                setSignalObj((signalObj: any) => ({
                  ...(signalObj || {}),
                  wkf: value,
                }));
              }}
              name="wkf"
              value={catchSignalObj?.wkf || ""}
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
          </div>
        }
      />
    </div>
  );
}
