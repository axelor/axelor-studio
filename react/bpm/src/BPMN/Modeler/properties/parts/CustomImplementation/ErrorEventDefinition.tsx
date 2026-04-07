import React, { useState, useEffect } from "react";
import { is } from "bpmn-js/lib/util/ModelUtil";
import { translate } from "@studio/shared/i18n";

import { TextField, CustomSelectBox } from "../../../../../components/properties/components";
import type { PropertiesPanelComponentProps } from "../../property-types";


interface ErrorEventPropsProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errorEventDefinition?: any;
}
export default function ErrorEventProps({
  element,
  bpmnFactory,
  errorEventDefinition,
  bpmnModdle,
  bpmnModeler,
}: ErrorEventPropsProps) {
  const [selectedError, setSelectedError] = useState<any>(null);
  const [errorOptions, setErrorOptions] = useState<any[]>([]);
  const [ele, setEle] = useState<any>(null);

  const getValue = React.useCallback(
    (modelProperty: any) => {
      return function () {
        return { [modelProperty]: errorEventDefinition[modelProperty] };
      };
    },
    [errorEventDefinition],
  );

  const setValue = (modelProperty: any) => {
    return function (element: any, values: any) {
      if (!errorEventDefinition) return;

      if (!values[modelProperty]) {
        delete errorEventDefinition[modelProperty];
        return;
      }
      errorEventDefinition[modelProperty] = values[modelProperty];
    };
  };

  const getOptions = React.useCallback(() => {
    const rootElements =
      bpmnModeler && bpmnModeler.get("canvas").getRootElement().businessObject.$parent.rootElements;
    const elements = rootElements && rootElements.filter((r: any) => r.$type === "bpmn:Error");
    const options =
      elements &&
      elements.map((element: any) => {
        return {
          value: element.name,
          name: `${element.name} (id=${element.id})`,
          id: element.id,
        };
      });
    setErrorOptions(options || []);
  }, [bpmnModeler]);

  useEffect(() => {
    if (!errorEventDefinition) return;
    const reference = errorEventDefinition.get("errorRef");
    setSelectedError(reference && reference.id);
  }, [errorEventDefinition]);

  useEffect(() => {
    getOptions();
  }, [getOptions]);

  return (
    <div>
      <CustomSelectBox
        element={element}
        definition={errorEventDefinition}
        bpmnFactory={bpmnFactory}
        bpmnModdle={bpmnModdle}
        bpmnModeler={bpmnModeler}
        defaultOptions={errorOptions}
        entry={{
          label: translate("Error"),
          elementName: "error",
          elementType: "bpmn:Error",
          referenceProperty: "errorRef",
          newElementIdPrefix: "Error_",
          set: function (value: any, ele: any) {
            setSelectedError(value);
            setEle(ele);
            if (errorEventDefinition && errorEventDefinition.errorRef) {
              errorEventDefinition.errorRef.name = ele.name;
            }
          },
          get: function () {
            return {
              errorRef: selectedError,
            };
          },
        }}
      />
      {(selectedError || selectedError === "") && (
        <React.Fragment>
          <TextField
            element={element}
            canRemove={true}
            entry={{
              id: "error-element-name",
              label: translate("Error name"),
              referenceProperty: "errorRef",
              modelProperty: "name",
              shouldValidate: true,
              get: function () {
                if (!errorEventDefinition) return;
                const reference = errorEventDefinition.get("errorRef");
                return {
                  name: reference && reference.name,
                };
              },
              set: function (e: any, value: any) {
                if (errorEventDefinition && errorEventDefinition.errorRef) {
                  errorEventDefinition.errorRef.name = value.name;

                  getOptions();
                  setSelectedError(ele && ele.id);
                }
              },
              validate: function (e, values) {
                if (!values.name && selectedError) {
                  return { name: translate("Must provide a value") };
                }
              },
            }}
          />
          <TextField
            element={element}
            canRemove={true}
            entry={{
              id: "error-element-code",
              label: translate("Error code"),
              referenceProperty: "errorRef",
              modelProperty: "errorCode",
              get: function () {
                if (!errorEventDefinition) return;
                const reference = errorEventDefinition.get("errorRef");
                return {
                  errorCode: reference?.errorCode,
                };
              },
              set: function (e: any, value: any) {
                if (!errorEventDefinition) return;
                const reference = errorEventDefinition.get("errorRef");
                if (reference) {
                  if (!value.errorCode) {
                    delete reference?.errorCode;
                    return;
                  }
                  reference.errorCode = value.errorCode;
                }
              },
            }}
          />
          <TextField
            element={element}
            canRemove={true}
            entry={{
              id: "error-element-message",
              label: translate("Error message"),
              referenceProperty: "errorRef",
              modelProperty: "errorMessage",
              get: function () {
                if (!errorEventDefinition) return;
                const reference = errorEventDefinition.get("errorRef");
                return {
                  errorMessage: reference?.errorMessage,
                };
              },
              set: function (e: any, value: any) {
                if (!errorEventDefinition) return;
                const reference = errorEventDefinition.get("errorRef");
                if (reference) {
                  if (!value.errorMessage) {
                    delete reference?.errorMessage;
                    return;
                  }
                  reference.errorMessage = value.errorMessage;
                }
              },
            }}
          />
        </React.Fragment>
      )}
      {is(element, "bpmn:StartEvent") ||
        (is(element, "bpmn:BoundaryEvent") && (
          <React.Fragment>
            <TextField
              canRemove={true}
              element={element}
              entry={{
                id: "errorCodeVariable",
                label: translate("Error code variable"),
                modelProperty: "errorCodeVariable",
                get: getValue("errorCodeVariable"),
                set: setValue("errorCodeVariable"),
              }}
            />
            <TextField
              canRemove={true}
              element={element}
              entry={{
                id: "errorMessageVariable",
                label: translate("Error message variable"),
                modelProperty: "errorMessageVariable",
                get: getValue("errorMessageVariable"),
                set: setValue("errorMessageVariable"),
              }}
            />
          </React.Fragment>
        ))}
    </div>
  );
}
