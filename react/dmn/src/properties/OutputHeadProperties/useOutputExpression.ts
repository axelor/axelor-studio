import { useState, useCallback } from "react";
import { getNameColumn } from "@studio/shared/services";
import { lowerCaseFirstLetter, getLowerCase } from "@studio/shared/utils";

import { RELATIONAL_TYPES, ALL_TYPES } from "../../constants";
import { getNameField } from "../../services/api";
import type { DmnElement, MetaFieldInfo, ModelOption } from "../types";

interface UseOutputExpressionParams {
  output: DmnElement | null;
  setProperty: (context: Record<string, unknown>, field: unknown) => void;
  setReadOnly: (value: boolean) => void;
  setType: (value: string) => void;
  models: ModelOption[] | null;
  getNameCol: ((col: string) => void) | null;
}

export default function useOutputExpression({
  output,
  setProperty,
  setReadOnly,
  setType,
  models,
  getNameCol,
}: UseOutputExpressionParams) {
  const [openOutputExpression, setOpenOutputExpression] = useState(false);
  const [outputField, setOutputField] = useState<string | null>(null);
  const [metaField, setMetaField] = useState<MetaFieldInfo | null | undefined>(null);
  const [relationalField, setRelationalField] = useState<MetaFieldInfo | null | undefined>(null);
  const [allFields, setAllFields] = useState<MetaFieldInfo[] | null>([]);
  const [valueFrom, setValueFrom] = useState("context");
  const [model, setModel] = useState<ModelOption | null>(null);
  const [contextModel, setContextModel] = useState<ModelOption | null>(null);

  const resetDialogState = useCallback(() => {
    setContextModel(null);
    setModel(null);
    setOutputField(null);
    setMetaField(null);
    setAllFields([]);
    setRelationalField(null);
  }, []);

  const handleOk = useCallback(async () => {
    if (!output) return;
    setProperty({ "camunda:valueFrom": valueFrom }, output);
    if (valueFrom === "context") {
      let typeRef = "string";
      const modelName = lowerCaseFirstLetter(contextModel?.name);
      let text =
        outputField && modelName && outputField !== "" ? `${modelName}.${outputField}` : undefined;
      setReadOnly(allFields?.length ? true : false);
      const type = metaField?.type?.toLowerCase();
      if (type && ALL_TYPES.includes(type)) {
        typeRef = type;
      } else if (type && RELATIONAL_TYPES.includes(type)) {
        const { targetName, model: metaModel, jsonTarget } = metaField || {};
        let nameColumn = targetName;
        if (metaModel === "com.axelor.meta.db.MetaJsonRecord" && jsonTarget) {
          const fieldData = await getNameField(jsonTarget);
          nameColumn = fieldData?.name || targetName;
        }
        text = nameColumn && text && !text.includes(nameColumn) ? `${text}.${nameColumn}` : text;
      } else if (type && ["date", "datetime", "time"].includes(type)) {
        typeRef = "date";
      } else if (type === "decimal") {
        typeRef = "decimal";
      }
      const context: Record<string, unknown> = {
        typeRef,
        "camunda:text": text,
        "camunda:textMetaField": JSON.stringify(metaField || undefined),
        "camunda:allFields": JSON.stringify(allFields || undefined),
        "camunda:relationalField":
          metaField?.type !== "BOOLEAN"
            ? JSON.stringify(relationalField || undefined)
            : undefined,
      };
      setType(typeRef);
      setProperty(context, output);
    } else if (valueFrom === "model") {
      setReadOnly(outputField ? true : false);
      const text = outputField && model ? outputField : undefined;
      const context: Record<string, unknown> = {
        typeRef: "string",
        "camunda:text": text,
        "camunda:textMetaField": JSON.stringify(model || undefined),
        "camunda:allFields": undefined,
        "camunda:relationalField": undefined,
      };
      setProperty(context, output);
      const nameColumn = await getNameColumn(model?.fullName || model?.name || "");
      getNameCol && getNameCol(nameColumn as string);
    }
    resetDialogState();
  }, [
    output,
    valueFrom,
    contextModel,
    outputField,
    allFields,
    metaField,
    relationalField,
    model,
    setProperty,
    setReadOnly,
    setType,
    getNameCol,
    resetDialogState,
  ]);

  const handleClickOpen = useCallback(() => {
    setOpenOutputExpression(true);
    const attrs = output?.$attrs || {};
    const from = (attrs["camunda:valueFrom"] as string) || "context";
    const textMetaField = attrs["camunda:textMetaField"] as string | undefined;

    setValueFrom(from);
    if (models && models.length === 1) setContextModel(models[0]);

    if (from === "model") {
      const m = textMetaField ? JSON.parse(textMetaField) : undefined;
      setModel(m ?? null);
      setOutputField(m?.name || "");
    } else {
      const af = attrs["camunda:allFields"] as string | undefined;
      setAllFields(af ? JSON.parse(af) : []);
      const rf = attrs["camunda:relationalField"] as string | undefined;
      setRelationalField(rf ? JSON.parse(rf) : undefined);
      setMetaField(textMetaField ? JSON.parse(textMetaField) : undefined);
      if (!af) return;

      const text = attrs["camunda:text"] as string | undefined;
      const textValues = text ? text.split(".") : undefined;
      const modelName = textValues && textValues[0];
      const value =
        textValues && textValues.length > 0 ? textValues.slice(1).join(".") : text || null;
      setOutputField(value);
      if (models && models.length > 1) {
        const m =
          modelName &&
          models.find((mod: ModelOption) => getLowerCase(mod.name) === getLowerCase(modelName));
        setContextModel(m || null);
      }
    }
  }, [output, models]);

  const handleDialogOk = useCallback(() => {
    handleOk();
    setModel(null);
    setOpenOutputExpression(false);
    const field =
      metaField || (allFields && allFields.length > 0 ? allFields[allFields.length - 1] : null);
    if (valueFrom === "model") {
      setProperty({ name: model?.name }, output);
    } else {
      setProperty({ name: field?.name }, output);
    }
  }, [handleOk, metaField, allFields, valueFrom, model, output, setProperty]);

  const handleDialogClose = useCallback(() => {
    setOpenOutputExpression(false);
    resetDialogState();
  }, [resetDialogState]);

  return {
    openOutputExpression,
    outputField,
    setOutputField,
    metaField,
    setMetaField,
    relationalField,
    setRelationalField,
    allFields,
    setAllFields,
    valueFrom,
    setValueFrom,
    model,
    setModel,
    contextModel,
    setContextModel,
    handleClickOpen,
    handleDialogOk,
    handleDialogClose,
  };
}
