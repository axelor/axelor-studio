import React, { useEffect, useMemo, useState } from "react";
import { TextField, SelectBox } from "@studio/shared/properties";
import DatePicker from "@studio/shared/properties/DatePicker.tsx";
import { translate } from "@studio/shared/i18n";
import { getLowerCase } from "@studio/shared/utils";
import { Tooltip } from "@studio/shared/components";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { useDialog } from "@studio/shared/hooks";
import styles from "../input-head-properties.module.css";
import { EXPRESSION_LANGUAGE_OPTIONS, TYPES } from "../../constants";
import { getDmnService } from "@studio/shared/types";
import type { DmnElement, DmnModeler, ModelOption } from "../types";

import useInputExpression from "./useInputExpression";
import ExpressionDialog from "../components/ExpressionDialog";

interface InputHeadPropertiesProps {
  element: DmnElement;
  input: DmnElement | null;
  dmnModeler: DmnModeler;
  getData: (() => ModelOption[]) | null;
}

export default function InputHeadProperties({
  element,
  input: propInput,
  dmnModeler,
  getData,
}: InputHeadPropertiesProps) {
  const [input, setInput] = useState<DmnElement | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [expressionLanguage, setExpressionLanguage] = useState("feel");
  const [type, setType] = useState("string");
  const [defaultValue, setDefaultValue] = useState<string | undefined>(undefined);
  const openDialog = useDialog();
  const models = useMemo(() => getData && getData(), [getData]);

  const setProperty = React.useCallback(
    (context: Record<string, unknown>, field: unknown) => {
      const activeEditor = dmnModeler.getActiveViewer();
      const modeling = getDmnService(activeEditor, "modeling");
      modeling.updateProperties(field, context);
      modeling._eventBus.fire("root.added");
    },
    [dmnModeler],
  );

  const expr = useInputExpression({
    input,
    setProperty,
    setReadOnly,
    setType,
    setExpressionLanguage,
    models,
  });

  useEffect(() => {
    setInput(propInput);
    const inputExpression = (propInput)?.inputExpression;
    const { $attrs, text, expressionLanguage: exprLang, typeRef } = inputExpression || {};
    setExpressionLanguage(exprLang || "feel");
    setType(typeRef || "string");
    setDefaultValue(
      propInput?.$attrs
        ? (propInput.$attrs["camunda:defaultValue"] as string | undefined)
        : undefined,
    );

    const textValues = text?.split(".");
    const modelName = textValues && textValues[0];
    const isPresent = models?.find(
      (m: ModelOption) => getLowerCase(m.name) === getLowerCase(modelName),
    )?.name;
    const allFields = $attrs && $attrs["camunda:allFields"];
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
        inputExpression,
      );
    }
  }, [propInput, models, setProperty]);

  const handleAlertOk = () => {
    setReadOnly(false);
    setType("string");
    setProperty(
      {
        typeRef: "string",
        "camunda:textMetaField": undefined,
        "camunda:relationalField": undefined,
        "camunda:allFields": undefined,
      },
      input?.inputExpression,
    );
    setProperty({ "camunda:defaultValue": undefined }, input);
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
            return { label: input && (input as Record<string, unknown>).label };
          },
          set: function (_e: unknown, values: Record<string, unknown>) {
            setProperty({ label: values["label"] }, input);
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
              expression: input?.inputExpression?.text,
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
                  typeRef: "string",
                  expressionLanguage: "feel",
                  "camunda:inputVariable": undefined,
                },
                input?.inputExpression,
              );
              setExpressionLanguage("feel");
            } else if (currentVal && currentVal.trim() !== "") {
              setExpressionLanguage("groovy");
              setProperty({ expressionLanguage: "groovy" }, input?.inputExpression);
            }
            setProperty({ text: currentVal }, input?.inputExpression);
          },
        }}
        canRemove={true}
        readOnly={readOnly}
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
        mode="input"
        open={expr.open}
        onOk={expr.handleDialogOk}
        onClose={expr.handleDialogClose}
        field={expr.field}
        setField={expr.setField}
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

      <SelectBox
        element={element}
        entry={{
          id: "expressionLanguage",
          label: "Expression language",
          modelProperty: "expressionLanguage",
          selectOptions: EXPRESSION_LANGUAGE_OPTIONS,
          get: function () {
            return { expressionLanguage };
          },
          set: function (_e: unknown, value: Record<string, unknown>) {
            const lang = value.expressionLanguage as string;
            if (input?.inputExpression) {
              setProperty({ expressionLanguage: lang }, input.inputExpression);
              setExpressionLanguage(lang);
            }
          },
        }}
      />
      <TextField
        element={element}
        entry={{
          id: "inputVariable",
          label: translate("Input variable"),
          modelProperty: "inputVariable",
          get: function () {
            return { inputVariable: input && (input as Record<string, unknown>).inputVariable };
          },
          set: function (_e: unknown, values: Record<string, unknown>) {
            setProperty({ inputVariable: values["inputVariable"] }, input);
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
            if (input?.inputExpression) {
              setType(typeRef);
              setDefaultValue(undefined);
              setProperty({ "camunda:defaultValue": undefined }, input);
              setProperty({ typeRef }, input.inputExpression);
            }
          },
        }}
      />
      {["date", "datetime", "time"].includes(type) ? (
        <DatePicker
          type={type as "date" | "datetime" | "time"}
          entry={{
            label: translate("Default value"),
            get: function () {
              return { defaultValue };
            },
            set: function (value: string | undefined) {
              setDefaultValue(value);
              setProperty({ "camunda:defaultValue": value }, input);
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
              setProperty({ "camunda:defaultValue": value }, input);
            },
          }}
          canRemove={true}
        />
      )}
    </React.Fragment>
  );
}
