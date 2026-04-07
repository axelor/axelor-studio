import React, { useState, useEffect } from "react";
import { translate } from "@studio/shared/i18n";

import { TextField, CustomSelectBox } from "../../../../../components/properties/components";
import type { PropertiesPanelComponentProps } from "../../property-types";


interface EscalationEventPropsProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  escalationEventDefinition?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  showEscalationCodeVariable?: any;
}
export default function EscalationEventProps({
  element,
  bpmnFactory,
  escalationEventDefinition,
  bpmnModdle,
  showEscalationCodeVariable,
  bpmnModeler,
}: EscalationEventPropsProps) {
  const [selectedEscalation, setSelectedEscalation] = useState<any>(null);
  const [escalationOptions, setEscalationOptions] = useState<any[]>([]);
  const [ele, setEle] = useState<any>(null);

  const getOptions = React.useCallback(() => {
    const rootElements =
      bpmnModeler && bpmnModeler.get("canvas").getRootElement().businessObject.$parent.rootElements;
    const elements = rootElements && rootElements.filter((r: any) => r.$type === "bpmn:Escalation");
    const options =
      elements &&
      elements.map((element: any) => {
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
    const reference = escalationEventDefinition.get("escalationRef");
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
          set: function (value: any, ele: any) {
            setSelectedEscalation(value);
            setEle(ele);
            if (escalationEventDefinition && escalationEventDefinition.escalationRef) {
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
                const reference = escalationEventDefinition.get("escalationRef");
                return {
                  name: reference?.name,
                };
              },
              set: function (e: any, value: any) {
                if (escalationEventDefinition?.escalationRef) {
                  escalationEventDefinition.escalationRef.name = value.name;
                  getOptions();
                  setSelectedEscalation(ele?.id);
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
                const reference = escalationEventDefinition.get("escalationRef");
                return {
                  escalationCode: reference?.escalationCode,
                };
              },
              set: function (e: any, value: any) {
                if (!escalationEventDefinition) return;
                const reference = escalationEventDefinition.get("escalationRef");
                if (reference) {
                  if (!value?.escalationCode) {
                    delete reference?.escalationCode;
                    return;
                  }
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
              return {
                escalationCodeVariable: escalationEventDefinition?.escalationCodeVariable,
              };
            },
            set: function (element: any, values: any) {
              if (!escalationEventDefinition) return;
              if (!values?.escalationCodeVariable) {
                delete escalationEventDefinition?.escalationCodeVariable;
                return;
              }
              escalationEventDefinition.escalationCodeVariable = values.escalationCodeVariable;
            },
          }}
        />
      )}
    </div>
  );
}
