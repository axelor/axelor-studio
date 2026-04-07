/**
 * Save logic extracted from Builder.jsx.
 * Exports useSaveHandler hook with handleSave and getJSONQuery.
 */
import React from "react";
import { ModelType } from "@studio/shared/services";
import type { StoreApi, UseBoundStore } from "zustand";

import { saveRecord, generateScriptString } from "../../services/mapper-service";
import { VALUE_FROM, translate, dashToUnderScore } from "../../utils";
import type {  BuilderField, MetaField } from "../../utils";
import { VAR_TYPES } from "../../constants";
import { getDefaultFrom, getSourceModelString, getJSON, generateJson } from "../../Builder.utils";
import type { MapperStore } from "../../stores/useMapperStore";

type UseMapperStore = UseBoundStore<StoreApi<MapperStore>>;

function isFieldInvalid(field: BuilderField): boolean | undefined {
  const { from, selected, subFields } = field.value || {};
  if (
    ([VALUE_FROM.NONE, VALUE_FROM.EXPRESSION, VALUE_FROM.QUERY] as string[]).includes(
      from as string,
    )
  ) {
    return (
      !selected ||
      !selected?.value ||
      (typeof selected?.value === "string" && selected?.value?.trim() === "")
    );
  }
  if (
    ([VALUE_FROM.CONTEXT, VALUE_FROM.SELF, VALUE_FROM.SOURCE] as string[]).includes(
      field.value.from as string,
    )
  ) {
    return (subFields || []).length === 0;
  }
}

function checkRequiredFields(
  builderFields: BuilderField[],
  metaFields: MetaField[],
  newRecord: boolean,
): string | undefined {
  if (!newRecord) {
    return;
  }
  const $builderFields = builderFields.filter((item) => item.required).map((item) => item.name);

  return metaFields
    .filter((item) => item.required && !$builderFields.includes(item.name))
    .map((x) => x.title || x.name)
    .join(",");
}

function checkInvalidFields(builderFields: BuilderField[]): string | undefined {
  const requiredFields = builderFields.filter((item) => item.required);
  if (requiredFields.length === 0) {
    return;
  }
  const arr = requiredFields.filter((metaItem) => {
    const validItem = builderFields.find((f) => f.name === metaItem.name && !isFieldInvalid(f));
    return !validItem;
  });
  const uniqueNames: string[] = [];
  arr.filter((ele) => {
    if (!uniqueNames.includes(ele.name || ele.title || "")) {
      uniqueNames.push(ele.name || ele.title || "");
    }
    return uniqueNames;
  });
  return uniqueNames.map((x) => x).join(",");
}

function checkInvalidSubfields(builderFields: BuilderField[]): string {
  return builderFields
    .filter((field) => {
      const { subFields = [] } = field.value;
      const data = subFields && subFields[subFields.length - 1];
      const { target, fullName, name, type, jsonTarget, targetModel } =
        data || ({} as Record<string, unknown>);

      // ignore variables
      if (
        subFields &&
        (subFields.length === 0 ||
          Object.values(VAR_TYPES)?.includes(
            subFields[0]?.type as (typeof VAR_TYPES)[keyof typeof VAR_TYPES],
          ))
      ) {
        return false;
      }
      // relational fields type validation
      else if (
        type &&
        dashToUnderScore(field.type) !== dashToUnderScore(type) &&
        !["metaJsonModel", "metaModel"].includes(type)
      ) {
        return true;
      }
      // custom model relational fields
      else if (field?.jsonTarget) {
        if (jsonTarget) {
          return field.jsonTarget !== jsonTarget;
        }
        if ((data as Record<string, unknown>)?.["targetJsonModel.name"]) {
          return field.jsonTarget !== (data as Record<string, unknown>)["targetJsonModel.name"];
        }
        return field.jsonTarget !== name;
      }
      // metaJson model relational fields
      else if ((field as Record<string, unknown>)["targetJsonModel.name"] || field?.targetModel) {
        if ((field as Record<string, unknown>)["targetJsonModel.name"]) {
          return (
            (field as Record<string, unknown>)["targetJsonModel.name"] !==
            ((data as Record<string, unknown>)?.["targetJsonModel.name"] || jsonTarget || name)
          );
        }
        return field.targetModel !== (targetModel || target || fullName);
      }
      // meta model relational fields
      else if (field?.target) {
        if (jsonTarget) {
          return field.name !== (jsonTarget || name);
        }
        return field.target !== (target || fullName || targetModel);
      }
      // simple widget type validation
      else return dashToUnderScore(field.type) !== dashToUnderScore(type);
    })
    .map((f) => f.title || f.name)
    .join(", ");
}

const showAlert = (msg: string) => {
  const dialogs = window.axelor?.dialogs || window.top?.axelor?.dialogs;
  if (dialogs) {
    const showMsg = dialogs.error({ content: msg });
    return showMsg();
  }
  return window.alert(msg);
};

interface SaveHandlerOptions {
  params: Record<string, unknown> | null;
  onSave?: (data: Record<string, unknown>) => void;
}

export function useSaveHandler(store: UseMapperStore, { params, onSave }: SaveHandlerOptions) {
  const builderFields = store((s) => s.builderFields);
  const builderRecord = store((s) => s.builderRecord);
  const setBuilderRecord = store((s) => s.setBuilderRecord);
  const model = store((s) => s.model);
  const metaFields = store((s) => s.metaFields);
  const sourceModel = store((s) => s.sourceModel);
  const sourceModelList = store((s) => s.sourceModelList);
  const newRecord = store((s) => s.newRecord);
  const savedRecord = store((s) => s.savedRecord);
  const save = store((s) => s.save);
  const createVariable = store((s) => s.createVariable);
  const modelFrom = store((s) => s.modelFrom);
  const processId = store((s) => s.processId);
  const setLoading = store((s) => s.setLoading);

  const getJSONQuery = React.useCallback(() => {
    if (!params) return "";
    const { resultMetaField } = params;
    const currentJson = getJSON(builderRecord, resultMetaField as string);

    const jsonFields = generateJson(
      builderFields,
      currentJson,
      getDefaultFrom(sourceModel),
      sourceModel,
    );
    const json = {
      fields: jsonFields,
      targetModel: model?.name,
      sourceModel: getSourceModelString(sourceModelList),
      sourceModelList,
      newRecord,
      savedRecord,
      save,
      isJson: model?.modelType === ModelType.CUSTOM,
      createVariable,
      processId: processId?.name,
      modelFrom,
    };
    return JSON.stringify({ ...json });
  }, [
    builderFields,
    builderRecord,
    createVariable,
    newRecord,
    savedRecord,
    save,
    modelFrom,
    params,
    model,
    processId,
    sourceModel,
    sourceModelList,
  ]);

  const handleSave = React.useCallback(async () => {
    if (!params) return;
    const requiredItems = checkRequiredFields(builderFields, metaFields, newRecord);

    if (requiredItems) {
      return showAlert(translate(`Please select required field {0}`, requiredItems));
    }

    const invalidItems = checkInvalidFields(builderFields);

    if (invalidItems) {
      return showAlert(translate(`Please provide required field {0}`, invalidItems));
    }

    const invalidTypes = checkInvalidSubfields(builderFields);

    if (invalidTypes) {
      return showAlert(translate(`Invalid subfields for {0}`, invalidTypes));
    }

    // check when source model is empty and source type is selected in fields
    const invalidSourceField =
      !sourceModel && builderFields.some((field) => field?.value.from === VALUE_FROM.SOURCE);

    if (invalidSourceField) {
      return showAlert(translate("Source model is required"));
    }

    setLoading(true);

    try {
      const jsonQuery = getJSONQuery();
      let _model = params.model as string;
      if (!_model) {
        if (model?.modelType === ModelType.CUSTOM) {
          _model = "com.axelor.meta.db.MetaJsonRecord";
        } else {
          _model = model?.fullName as string;
        }
      }
      const scriptString = await generateScriptString(jsonQuery, _model);
      const expressionQuery = scriptString || "";
      const record: Record<string, unknown> = {
        ...builderRecord,
        [params.resultMetaField as string]: jsonQuery,
        [params.resultField as string]: expressionQuery,
        [params.targetField as string]: model?.name,
        [params.sourceField as string]: getSourceModelString(sourceModelList),
      };
      onSave &&
        onSave({
          resultField: scriptString,
          resultMetaField: jsonQuery,
          sourceField: record[params.sourceField as string],
          targetField: model?.name,
        });
      if (!params?.model) return;
      const result = await saveRecord(params as { model: string }, record);
      if (result) {
        setBuilderRecord({ ...result });
      } else {
        console.error("[Builder] Failed to save builder data");
      }
    } finally {
      setLoading(false);
    }
  }, [
    builderFields,
    params,
    model,
    builderRecord,
    sourceModel,
    newRecord,
    sourceModelList,
    metaFields,
    onSave,
    getJSONQuery,
    setLoading,
    setBuilderRecord,
  ]);

  return { handleSave, getJSONQuery };
}
