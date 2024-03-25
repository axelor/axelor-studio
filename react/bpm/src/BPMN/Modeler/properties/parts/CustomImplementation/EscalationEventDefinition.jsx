import React, { useState, useEffect } from "react";

import {
  TextField,
  CustomSelectBox,
} from "../../../../../components/properties/components";
import { translate } from "../../../../../utils";

export default function EscalationEventProps({
  element,
  bpmnFactory,
  escalationEventDefinition,
  bpmnModdle,
  showEscalationCodeVariable,
  bpmnModeler,
  setDummyProperty = () => {},
}) {
  const [selectedEscalation, setSelectedEscalation] = useState(null);
  const [escalationOptions, setEscalationOptions] = useState([]);
  const [ele, setEle] = useState(null);

  const getOptions = React.useCallback(() => {
    const rootElements =
      bpmnModeler &&
      bpmnModeler.get("canvas").getRootElement().businessObject.$parent
        .rootElements;
    const elements =
      rootElements && rootElements.filter((r) => r.$type === "bpmn:Escalation");
    const options =
      elements &&
      elements.map((element) => {
        return {
          value: element.name,
          name: `${element.name} (id=${element.id})`,
          id: element.id,
        };
      });
    setEscalationOptions(options || []);
  }, [bpmnModeler]);

  useEffect(() => {
    if (!escalationEventDefinition) return;
    let reference = escalationEventDefinition.get("escalationRef");
    setSelectedEscalation(reference && reference.id);
  }, [escalationEventDefinition]);

  useEffect(() => {
    getOptions();
  }, [getOptions]);

  return (
    <div>
      <CustomSelectBox
        element={element}
        definition={escalationEventDefinition}
        bpmnFactory={bpmnFactory}
        bpmnModdle={bpmnModdle}
        bpmnModeler={bpmnModeler}
        defaultOptions={escalationOptions}
        entry={{
          label: translate("Escalation"),
          elementName: "escalation",
          elementType: "bpmn:Escalation",
          referenceProperty: "escalationRef",
          newElementIdPrefix: "Escalation_",
          set: function (value, ele) {
            setSelectedEscalation(value);
            setEle(ele);
            if (
              escalationEventDefinition &&
              escalationEventDefinition.escalationRef
            ) {
              setDummyProperty({
                bpmnModeler,
                element,
                value: ele.name,
              });
              escalationEventDefinition.escalationRef.name = ele.name;
            }
          },
          get: function () {
            return {
              escalationRef: selectedEscalation,
            };
          },
        }}
      />
      {(selectedEscalation || selectedEscalation === "") && (
        <React.Fragment>
          <TextField
            element={element}
            canRemove={true}
            entry={{
              id: "escalation-element-name",
              label: translate("Escalation name"),
              referenceProperty: "escalationRef",
              modelProperty: "name",
              shouldValidate: true,
              get: function () {
                if (!escalationEventDefinition) return;
                let reference = escalationEventDefinition.get("escalationRef");
                return {
                  name: reference && reference.name,
                };
              },
              set: function (e, value) {
                if (
                  escalationEventDefinition &&
                  escalationEventDefinition.escalationRef
                ) {
                  setDummyProperty({
                    bpmnModeler,
                    element,
                    value: ele.name,
                  });
                  escalationEventDefinition.escalationRef.name = value.name;
                  getOptions();
                  setSelectedEscalation(ele && ele.id);
                }
              },
              validate: function (e, values) {
                if (!values.name && selectedEscalation) {
                  return { name: translate("Must provide a value") };
                }
              },
            }}
          />
          <TextField
            element={element}
            canRemove={true}
            entry={{
              id: "escalation-element-code",
              label: translate("Escalation code"),
              referenceProperty: "escalationRef",
              modelProperty: "escalationCode",
              get: function () {
                if (!escalationEventDefinition) return;
                let reference = escalationEventDefinition.get("escalationRef");
                return {
                  escalationCode: reference && reference.escalationCode,
                };
              },
              set: function (e, value) {
                if (!escalationEventDefinition) return;
                let reference = escalationEventDefinition.get("escalationRef");
                if (reference) {
                  setDummyProperty({
                    bpmnModeler,
                    element,
                    value: value.escalationCode,
                  });
                  reference.escalationCode = value.escalationCode;
                }
              },
            }}
          />
        </React.Fragment>
      )}
      {showEscalationCodeVariable && (
        <TextField
          element={element}
          canRemove={true}
          entry={{
            id: "escalationCodeVariable",
            label: translate("Escalation code variable"),
            modelProperty: "escalationCodeVariable",
            get: function () {
              let codeVariable = escalationEventDefinition.get(
                "camunda:escalationCodeVariable"
              );
              return {
                escalationCodeVariable: codeVariable,
              };
            },
            set: function (element, values) {
              if (!escalationEventDefinition) return;
              setDummyProperty({
                bpmnModeler,
                element,
                value: values.escalationCodeVariable || undefined,
              });
              escalationEventDefinition["camunda:escalationCodeVariable"] =
                values.escalationCodeVariable || undefined;
            },
          }}
        />
      )}
    </div>
  );
}
