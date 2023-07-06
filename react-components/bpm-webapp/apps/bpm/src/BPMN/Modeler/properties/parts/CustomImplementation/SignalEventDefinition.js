import React, { useState, useEffect } from "react";

import {
  TextField,
  CustomSelectBox,
} from "../../../../../components/properties/components";
import { translate } from "../../../../../utils";

export default function SignalEventProps({
  element,
  bpmnFactory,
  signalEventDefinition,
  bpmnModdle,
  bpmnModeler,
}) {
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [signalOptions, setSignalOptions] = useState([]);
  const [ele, setEle] = useState(null);

  const getOptions = React.useCallback(() => {
    const rootElements =
      bpmnModeler &&
      bpmnModeler.get("canvas").getRootElement().businessObject.$parent
        .rootElements;
    const elements =
      rootElements && rootElements.filter((r) => r.$type === "bpmn:Signal");
    const options =
      elements &&
      elements.map((element) => {
        return {
          value: element.name,
          name: `${element.name} (id=${element.id})`,
          id: element.id,
        };
      });
    setSignalOptions(options || []);
  }, [bpmnModeler]);

  useEffect(() => {
    let reference = signalEventDefinition.get("signalRef");
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
        entry={{
          label: translate("Signal"),
          elementName: "signal",
          elementType: "bpmn:Signal",
          referenceProperty: "signalRef",
          newElementIdPrefix: "Signal_",
          set: function (value, ele) {
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
              let reference = signalEventDefinition.get("signalRef");
              return {
                name: reference && reference.name,
              };
            },
            set: function (e, value) {
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
    </div>
  );
}
