import React, { useState, useEffect } from "react";
import { is } from "bpmn-js/lib/util/ModelUtil";

import {
  TextField,
  CustomSelectBox,
} from "../../../../../components/properties/components";
import { translate } from "../../../../../utils";

export default function ErrorEventProps({
  element,
  bpmnFactory,
  errorEventDefinition,
  bpmnModdle,
  bpmnModeler,
  setDummyProperty = () => {},
}) {
  const [selectedError, setSelectedError] = useState(null);
  const [errorOptions, setErrorOptions] = useState([]);
  const [ele, setEle] = useState(null);

  const getValue = React.useCallback(
    (modelProperty) => {
      return function () {
        return { [modelProperty]: errorEventDefinition[modelProperty] };
      };
    },
    [errorEventDefinition]
  );

  const setValue = (modelProperty) => {
    return function (element, values) {
      if (!errorEventDefinition) return;
      setDummyProperty();
      if (!values[modelProperty]) {
        delete errorEventDefinition[modelProperty];
        return;
      }
      errorEventDefinition[modelProperty] = values[modelProperty];
    };
  };

  const getOptions = React.useCallback(() => {
    const rootElements =
      bpmnModeler &&
      bpmnModeler.get("canvas").getRootElement().businessObject.$parent
        .rootElements;
    const elements =
      rootElements && rootElements.filter((r) => r.$type === "bpmn:Error");
    const options =
      elements &&
      elements.map((element) => {
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
    let reference = errorEventDefinition.get("errorRef");
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
          set: function (value, ele) {
            setSelectedError(value);
            setEle(ele);
            if (errorEventDefinition && errorEventDefinition.errorRef) {
              setDummyProperty();
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
                let reference = errorEventDefinition.get("errorRef");
                return {
                  name: reference && reference.name,
                };
              },
              set: function (e, value) {
                if (errorEventDefinition && errorEventDefinition.errorRef) {
                  errorEventDefinition.errorRef.name = value.name;
                  setDummyProperty();
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
                let reference = errorEventDefinition.get("errorRef");
                return {
                  errorCode: reference?.errorCode,
                };
              },
              set: function (e, value) {
                if (!errorEventDefinition) return;
                let reference = errorEventDefinition.get("errorRef");
                if (reference) {
                  setDummyProperty();
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
                let reference = errorEventDefinition.get("errorRef");
                return {
                  errorMessage: reference?.errorMessage,
                };
              },
              set: function (e, value) {
                if (!errorEventDefinition) return;
                let reference = errorEventDefinition.get("errorRef");
                if (reference) {
                  setDummyProperty();
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
