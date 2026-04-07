import { ModelType } from "@studio/shared/services";
import get from "lodash/get";

import { VALUE_FROM, lowerCaseFirstLetter } from "./utils";
import type {  BuilderField, MetaField, ModelRecord, ValueMode } from "./utils";
import { VAR_TYPES } from "./constants";

export const getDefaultFrom = (sourceModel: ModelRecord | null): ValueMode => {
  return sourceModel ? VALUE_FROM.SOURCE : VALUE_FROM.NONE;
};

export const getSourceModelString = (list: ModelRecord[]): string => {
  let string = "";
  list.forEach((item) => {
    if (string === "") {
      string = item.name || "";
    } else {
      string = `${string}.${item.name}`;
    }
  });
  return string;
};

let fieldIndex = 0;

export function getBuilderField(
  field: Partial<BuilderField>,
  sourceModel?: ModelRecord | null,
): BuilderField {
  return {
    ...field,
    name: field.name || "",
    type: field.type || "",
    key: ++fieldIndex,
    condition: null,
    conditionMeta: null,
    searchField: null,
    dmn: null,
    value: {
      from: sourceModel ? VALUE_FROM.SOURCE : VALUE_FROM.NONE,
      selected: null,
      query: null,
    },
  };
}

export function getJSON(object: Record<string, unknown>, key: string): Record<string, unknown> {
  try {
    return JSON.parse((object[key] as string) || "{}");
  } catch {}
  return {};
}

const getTarget = (element: BuilderField): string | null => {
  if (element.target) {
    return element.target.split(".").pop() || null;
  }
  if (element.targetModel) {
    return element.targetModel.split(".").pop() || null;
  }
  return null;
};

const getModelFieldValue = (fields: MetaField[]): string => {
  let modelFieldText = "";
  if (fields) {
    fields.forEach((field) => {
      const isVariableOption = Object.values(VAR_TYPES)?.includes(
        field?.type as (typeof VAR_TYPES)[keyof typeof VAR_TYPES],
      );
      if (field.name && !isVariableOption) {
        const fieldName = lowerCaseFirstLetter(field.name);
        if (modelFieldText) {
          modelFieldText = `${modelFieldText}?.${fieldName}`;
        } else {
          modelFieldText = `${fieldName}`;
        }
      }
    });
  }
  return modelFieldText;
};

const subFieldList = [
  "id",
  "version",
  "title",
  "name",
  "type",
  "fullName",
  "modelType",
  "jsonModel",
  "target",
  "targetModel",
  "targetJsonModel",
  "targetJsonModel.name",
];

const getModelSubField = (subFields: MetaField[] = []): Record<string, unknown>[] => {
  return subFields.map((field) =>
    subFieldList.reduce(
      (obj, key) => ({
        ...obj,
        ...(field[key] !== undefined ? { [key]: field[key] } : {}),
        trackKey: field["trackKey"],
      }),
      {} as Record<string, unknown>,
    ),
  );
};

interface JsonRecord {
  name: string;
  type: string;
  target?: string;
  condition: string | null;
  conditionMeta: unknown;
  value: Record<string, unknown>;
  dmn?: Record<string, unknown>;
  searchField?: { name: string; title?: string };
  processId?: string;
  jsonModel?: string;
  [key: string]: unknown;
}

export function generateJson(
  data: BuilderField[],
  currentJson: Record<string, unknown>,
  defaultFrom?: ValueMode,
  sourceModel?: ModelRecord | null,
): JsonRecord[] {
  const getValue = (element: BuilderField) => {
    const { value, dmn } = element;
    const { subFields = [] } = value || {};
    const from = value?.from || defaultFrom;
    let newValue = value?.selected as { value: unknown; targetName?: string } | null;
    const modelFieldValue = getModelFieldValue(subFields);
    if (from === VALUE_FROM.CONTEXT) {
      if (modelFieldValue) {
        newValue = { value: modelFieldValue };
      } else {
        newValue = null;
      }
    }
    if (from === VALUE_FROM.PROCESS) {
      if (modelFieldValue) {
        newValue = { value: modelFieldValue };
      } else {
        newValue = null;
      }
    }
    if (from === VALUE_FROM.SOURCE) {
      if (modelFieldValue) {
        const firstField = (subFields)[0];
        let sourceModelName = sourceModel?.fullName;
        let fieldName = firstField?.fullName;
        if (sourceModel?.modelType === ModelType.CUSTOM) {
          sourceModelName = sourceModel?.name;
        }

        if (firstField?.modelType === ModelType.CUSTOM) {
          fieldName = firstField?.name;
        }
        if (fieldName && sourceModelName && fieldName === sourceModelName) {
          newValue = { value: "SOURCE" };
        } else {
          newValue = { value: modelFieldValue };
        }
      } else {
        newValue = null;
      }
    }
    if (from === VALUE_FROM.SELF) {
      if (modelFieldValue) {
        newValue = { value: modelFieldValue };
      } else {
        newValue = null;
      }
    }
    if (
      ([VALUE_FROM.PARENT] as string[]).includes(from as string) &&
      newValue?.value &&
      typeof newValue?.value === "object"
    ) {
      const parentValue = newValue.value as Record<string, unknown>;
      const contextKey = lowerCaseFirstLetter(parentValue.name as string);
      if (!modelFieldValue) {
        newValue = { value: contextKey };
      } else {
        newValue = { value: `${contextKey}?.${modelFieldValue}` };
      }
    }

    if (([VALUE_FROM.DMN] as string[]).includes(from as string) && newValue?.value) {
      const contextKey = lowerCaseFirstLetter(
        typeof newValue.value === "object"
          ? ((newValue.value as Record<string, unknown>).name as string)
          : (newValue.value as string),
      );
      const keys = contextKey && contextKey.split("?.");
      if (keys && keys[0] === dmn?.resultVariable) {
        return {
          value: `${contextKey}`,
        };
      }
      return {
        value: `${dmn?.resultVariable}?.${contextKey}`,
      };
    }
    return newValue || null;
  };

  return data.reduce<JsonRecord[]>((list, element) => {
    const { value, type } = element;
    const { fields } = value || {};

    const modelTarget = getTarget(element);
    const jsonTarget = element.jsonTarget;
    const jsonModel =
      typeof element.jsonModel === "object" ? element.jsonModel?.name : element.jsonModel;
    const newValue = { ...value };

    if (typeof fields === "object" && fields) {
      newValue.fields = generateJson(
        value.fields as BuilderField[],
        currentJson,
      ) as unknown as BuilderField[]; // safety: Axelor REST field response shape differs from BuilderField
    }

    newValue.selected = getValue(element);

    if (newValue && !newValue.from) {
      newValue.from = defaultFrom;
    }

    if (
      newValue.selected &&
      ![undefined, null].includes(newValue.selected.value as null | undefined)
    ) {
      const record: JsonRecord = {
        name: element.name,
        type,
        target: modelTarget || undefined,
        condition: element.condition ?? null,
        conditionMeta: element.conditionMeta,
        value: {
          ...newValue,
          subFields: getModelSubField(newValue.subFields as MetaField[]) || undefined,
        },
      };
      if (element.dmn) {
        record.dmn = {
          dmnNodeId: element.dmn.dmnNodeId,
          dmnNodeNameId: element.dmn.dmnNodeNameId,
          name: element.dmn.name,
          resultVariable: element.dmn.resultVariable,
          outputDmnFieldList:
            element.dmn.outputDmnFieldList &&
            element.dmn.outputDmnFieldList.map((f) => {
              return { name: f.name };
            }),
        };
      } else {
        delete record.dmn;
      }

      if (element.searchField && element.searchField.name) {
        record.searchField = {
          name: element.searchField && element.searchField.name,
          title: element.searchField && element.searchField.title,
        };
      } else {
        delete record.searchField;
      }

      if (element?.processId?.name) {
        record.processId = element.processId && element.processId.name;
      } else {
        delete record.processId;
      }

      if (type.toLowerCase() === "many-to-one") {
        record["jsonModel"] = jsonModel || undefined;
        if (!jsonModel && jsonTarget) {
          record["jsonModel"] = jsonTarget || undefined;
        }
      }
      if (type.toLowerCase() === "json-many-to-one") {
        record["target"] = get(element, "targetJsonModel.name") as string | undefined;
      }

      return [...list, record];
    }
    return list;
  }, []);
}
