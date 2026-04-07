import React, { useEffect, useMemo, useState } from "react";
import { TextField, SelectBox } from "@studio/shared/properties";
import DatePicker from "@studio/shared/properties/DatePicker.tsx";
import { translate } from "@studio/shared/i18n";
import { getLowerCase } from "@studio/shared/utils";
import { Tooltip } from "@studio/shared/components";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { useDialog } from "@studio/shared/hooks";
import styles from "../output-head-properties.module.css";
import { TYPES } from "../../constants";
import { getDmnService } from "@studio/shared/types";
import type { DmnElement, DmnModeler, ModelOption } from "../types";

import useOutputExpression from "./useOutputExpression";
import ExpressionDialog from "../components/ExpressionDialog";

interface OutputHeadPropertiesProps {
  element: DmnElement;
  output: DmnElement;
  dmnModeler: DmnModeler;
  getData: (() => ModelOption[]) | null;
  getNameCol: ((col: string) => void) | null;
}

export default function OutputHeadProperties({
  element,
  output: propOutput,
  dmnModeler,
  getData,
  getNameCol,
}: OutputHeadPropertiesProps) {
  const [output, setOutput] = useState<DmnElement | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const models = useMemo(() => getData && getData(), [getData]);
  const [type, setType] = useState("string");
  const [defaultValue, setDefaultValue] = useState<string | undefined>(undefined);
  const openDialog = useDialog();

  const setProperty = React.useCallback(
    (context: Record<string, unknown>, field: unknown) => {
      const activeEditor = dmnModeler.getActiveViewer();
      const modeling = getDmnService(activeEditor, "modeling");
      modeling.updateProperties(field, context);
    },
    [dmnModeler],
  );

  const expr = useOutputExpression({
    output,
    setProperty,
    setReadOnly,
    setType,
    models,
    getNameCol,
  });

  useEffect(() => {
    setOutput(propOutput);
    setType((propOutput as Record<string, unknown>).typeRef as string);
    const attrs = propOutput?.$attrs || {};
    const textMetaField = attrs["camunda:textMetaField"] as string | undefined;
    const allFields = attrs["camunda:allFields"] as string | undefined;
    const valueFrom = attrs["camunda:valueFrom"] as string | undefined;
    const text = attrs["camunda:text"] as string | undefined;
    const defVal = attrs["camunda:defaultValue"] as string | undefined;
    setDefaultValue(defVal);
    expr.setValueFrom(valueFrom || "context");
    if (valueFrom === "model") {
      setReadOnly(textMetaField ? true : false);
    } else {
      const textValues = text ? text.split(".") : undefined;
      const modelName = textValues && textValues[0];
      const isPresent = models?.find(
        (m: ModelOption) => getLowerCase(m.name) === getLowerCase(modelName),
      )?.name;
      setReadOnly(allFields ? true : false);

      // model is removed from view drd
      if (!isPresent && allFields) {
        setReadOnly(false);
        setType("string");
        setProperty(
          {
            typeRef: "string",
            "camunda:textMetaField": undefined,
            "camunda:relationalField": undefined,
            "camunda:allFields": undefined,
          },
          propOutput,
        );
      }
    }
  }, [propOutput, models, setProperty]);

  const handleAlertOk = () => {
    setReadOnly(false);
    setType("string");
    setProperty(
      {
        typeRef: "string",
        "camunda:textMetaField": undefined,
        "camunda:relationalField": undefined,
        "camunda:allFields": undefined,
        "camunda:defaultValue": undefined,
        "camunda:valueFrom": undefined,
      },
      output,
    );
  };

  return (
    <React.Fragment>
      <TextField
        element={element}
        entry={{
          id: "label",
          label: translate("Label"),
          modelProperty: "label",
          get: function () {
            return { label: output && (output as Record<string, unknown>).label };
          },
          set: function (_e: unknown, values: Record<string, unknown>) {
            setProperty({ label: values["label"] }, output);
          },
        }}
        canRemove={true}
      />
      <TextField
        element={element}
        entry={{
          id: "expression",
          label: translate("Expression"),
          modelProperty: "expression",
          get: function () {
            return {
              expression: output?.$attrs?.["camunda:text"],
            };
          },
          set: function (_e: unknown, values: Record<string, unknown>) {
            const currentVal = values["expression"] as string | undefined;
            (currentVal || "").replace(/[\u200B-\u200D\uFEFF]/g, "");
            if (!currentVal) {
              setProperty(
                {
                  "camunda:textMetaField": undefined,
                  "camunda:relationalField": undefined,
                  "camunda:allFields": undefined,
                  "camunda:valueFrom": undefined,
                  typeRef: "string",
                },
                output,
              );
            }
            setProperty(
              {
                "camunda:text": currentVal && currentVal !== "" ? currentVal : undefined,
              },
              output,
            );
          },
        }}
        readOnly={readOnly}
        canRemove={true}
        endAdornment={
          <>
            <Tooltip title={translate("Enable")} aria-label="enable">
              <MaterialIcon
                icon="do_not_disturb_on"
                className={styles.newIcon}
                onClick={() =>
                  readOnly &&
                  openDialog({
                    title: "Warning",
                    message: "Script can't be managed using builder once changed manually.",
                    onSave: handleAlertOk,
                  })
                }
              />
            </Tooltip>
            <MaterialIcon icon="edit" className={styles.newIcon} onClick={expr.handleClickOpen} />
          </>
        }
      />
      <ExpressionDialog
        mode="output"
        open={expr.openOutputExpression}
        onOk={expr.handleDialogOk}
        onClose={expr.handleDialogClose}
        valueFrom={expr.valueFrom}
        setValueFrom={expr.setValueFrom}
        model={expr.model}
        setModel={expr.setModel}
        outputField={expr.outputField}
        setOutputField={expr.setOutputField}
        contextModel={expr.contextModel}
        setContextModel={expr.setContextModel}
        metaField={expr.metaField}
        setMetaField={expr.setMetaField}
        allFields={expr.allFields}
        setAllFields={expr.setAllFields}
        relationalField={expr.relationalField}
        setRelationalField={expr.setRelationalField}
        models={models}
        getData={getData}
      />
      <TextField
        element={element}
        entry={{
          id: "name",
          label: translate("Output name"),
          modelProperty: "name",
          get: function () {
            return { name: output && (output as Record<string, unknown>).name };
          },
          set: function (_e: unknown, values: Record<string, unknown>) {
            setProperty({ name: values["name"] }, output);
          },
        }}
        canRemove={true}
      />
      <SelectBox
        element={element}
        entry={{
          id: "typeRef",
          label: translate("Type"),
          modelProperty: "typeRef",
          selectOptions: TYPES,
          disabled: readOnly,
          get: function () {
            return { typeRef: type };
          },
          set: function (_e: unknown, value: Record<string, unknown>) {
            const typeRef = value.typeRef as string;
            if (output) {
              setType(typeRef);
              setDefaultValue(undefined);
              setProperty({ typeRef, "camunda:defaultValue": undefined }, output);
            }
          },
        }}
      />
      {["date", "time", "datetime"].includes(type) ? (
        <DatePicker
          type={type as "date" | "datetime" | "time"}
          entry={{
            label: translate("Default value"),
            get: function () {
              return { defaultValue };
            },
            set: function (value: string | undefined) {
              setDefaultValue(value);
              setProperty({ "camunda:defaultValue": value }, output);
            },
          }}
        />
      ) : (
        <TextField
          element={element}
          entry={{
            id: "defaultValue",
            label: translate("Default value"),
            modelProperty: "defaultValue",
            get: function () {
              return { defaultValue };
            },
            set: function (_e: unknown, values: Record<string, unknown>) {
              const currentVal = values["defaultValue"] as string | undefined;
              const value =
                currentVal && type === "string"
                  ? `"${currentVal.replace(/['"]+/g, "")}"`
                  : currentVal;
              setDefaultValue(value);
              setProperty({ "camunda:defaultValue": value }, output);
            },
          }}
          canRemove={true}
        />
      )}
    </React.Fragment>
  );
}
