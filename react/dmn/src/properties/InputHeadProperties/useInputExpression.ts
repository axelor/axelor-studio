import { useState, useCallback } from "react";
import { lowerCaseFirstLetter, getLowerCase } from "@studio/shared/utils";

import { RELATIONAL_TYPES, ALL_TYPES } from "../../constants";
import { getNameField } from "../../services/api";
import type {  DmnElement, MetaFieldInfo, ModelOption } from "../types";

interface UseInputExpressionParams {
  input: DmnElement | null;
  setProperty: (context: Record<string, unknown>, field: unknown) => void;
  setReadOnly: (value: boolean) => void;
  setType: (value: string) => void;
  setExpressionLanguage: (value: string) => void;
  models: ModelOption[] | null;
}

interface UseInputExpressionReturn {
  open: boolean;
  field: string | null | false;
  setField: (value: string | null) => void;
  metaField: MetaFieldInfo | null | undefined;
  setMetaField: (value: MetaFieldInfo | null | undefined) => void;
  contextModel: ModelOption | null;
  setContextModel: (value: ModelOption | null) => void;
  relationalField: MetaFieldInfo | null | undefined;
  setRelationalField: (value: MetaFieldInfo | null | undefined) => void;
  allFields: MetaFieldInfo[] | null;
  setAllFields: (value: MetaFieldInfo[] | null) => void;
  handleClickOpen: () => void;
  handleDialogOk: () => void;
  handleDialogClose: () => void;
}

export default function useInputExpression({
  input,
  setProperty,
  setReadOnly,
  setType,
  setExpressionLanguage,
  models,
}: UseInputExpressionParams): UseInputExpressionReturn {
  const [open, setOpen] = useState(false);
  const [field, setField] = useState<string | null | false>(false);
  const [metaField, setMetaField] = useState<MetaFieldInfo | null | undefined>(null);
  const [contextModel, setContextModel] = useState<ModelOption | null>(null);
  const [relationalField, setRelationalField] = useState<MetaFieldInfo | null | undefined>(null);
  const [allFields, setAllFields] = useState<MetaFieldInfo[] | null>([]);

  const resetDialogState = useCallback(() => {
    setContextModel(null);
    setField(null);
    setMetaField(null);
    setAllFields([]);
    setRelationalField(null);
  }, []);

  const handleClickOpen = useCallback(() => {
    setOpen(true);

    if (models && models.length === 1) setContextModel(models[0]);

    const inputExpression = input?.inputExpression;
    const { text, $attrs } = inputExpression || {};

    const af = $attrs && ($attrs["camunda:allFields"] as string | undefined);
    const mf = $attrs && ($attrs["camunda:textMetaField"] as string | undefined);
    const rf = $attrs && ($attrs["camunda:relationalField"] as string | undefined);

    setAllFields(af ? JSON.parse(af) : []);
    setMetaField(mf ? JSON.parse(mf) : undefined);
    setRelationalField(rf ? JSON.parse(rf) : undefined);

    if (!af) return;

    const textValues = text?.replace("?.atStartOfDay()", "")?.split(".");
    const modelName = textValues && textValues[0];
    const value = textValues && textValues.length > 0 ? textValues.slice(1).join(".") : text || null;
    setField(value);

    if (models && models.length > 1) {
      const model = models.find((m) => getLowerCase(m.name) === getLowerCase(modelName));
      setContextModel(model || null);
    }
  }, [input, models]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleOk = useCallback(async () => {
    const inputExpression = input?.inputExpression;
    if (!inputExpression) return;
    const model = lowerCaseFirstLetter(contextModel?.name);
    const type = metaField?.type?.toLowerCase();
    let text = field && model && field !== "" ? `${model}.${field}` : "";
    const dateExpr = text?.replace("?.atStartOfDay()", "");
    text = text && type === "date" ? `${dateExpr}?.atStartOfDay()` : text;
    let typeRef = "string";
    setReadOnly(allFields?.length ? true : false);
    if (type && ALL_TYPES.includes(type)) {
      typeRef = type;
    } else if (type && RELATIONAL_TYPES.includes(type)) {
      const { targetName, model: metaModel, jsonTarget } = metaField || {};
      let nameColumn = targetName;
      if (metaModel === "com.axelor.meta.db.MetaJsonRecord" && jsonTarget) {
        const fieldData = await getNameField(jsonTarget);
        nameColumn = fieldData?.name ? fieldData.name : targetName;
      }
      text = nameColumn && !text?.includes(nameColumn) ? `${text}.${nameColumn}` : text;
    } else if (type === "time") {
      typeRef = "long";
    } else if (type === "decimal") {
      typeRef = "double";
    }
    const exprLang = text && text !== "" ? "groovy" : "feel";
    const context: Record<string, unknown> = {
      text,
      expressionLanguage: exprLang,
      "camunda:textMetaField": JSON.stringify(metaField || undefined),
      "camunda:allFields": JSON.stringify(allFields || undefined),
      "camunda:relationalField":
        metaField?.type !== "BOOLEAN" ? JSON.stringify(relationalField || undefined) : undefined,
      typeRef,
    };
    setType(typeRef);
    setProperty(context, inputExpression);
    resetDialogState();
    setExpressionLanguage(exprLang);
  }, [
    input,
    contextModel,
    field,
    allFields,
    metaField,
    relationalField,
    setProperty,
    setReadOnly,
    setType,
    setExpressionLanguage,
    resetDialogState,
  ]);

  const handleDialogOk = useCallback(() => {
    handleOk();
    handleClose();
  }, [handleOk, handleClose]);

  const handleDialogClose = useCallback(() => {
    handleClose();
    resetDialogState();
  }, [handleClose, resetDialogState]);

  return {
    open,
    field,
    setField,
    metaField,
    setMetaField,
    contextModel,
    setContextModel,
    relationalField,
    setRelationalField,
    allFields,
    setAllFields,
    handleClickOpen,
    handleDialogOk,
    handleDialogClose,
  };
}
