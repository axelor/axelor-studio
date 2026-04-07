/**
 * Field metadata service.
 * Handles fetching, caching, and filtering of field metadata from the Axelor backend.
 *
 * @module meta-field-service
 */
import type {
  AxelorResponse,
  AxelorViewResponse,
  MetaField,
  MetaJsonField,
  MetaSelect,
  MetaSelectItem,
} from "../types";
import { isAxelorError } from "../types";

import { ServiceInstance as _Service } from "./Service";
import { ModelType, getMetaModel } from "./meta-model-service";

export const excludedUITypes = ["panel", "label", "spacer", "button"];

/** Field metadata descriptor returned by the Axelor fields REST API. */
export interface FieldMetadata {
  name: string;
  type: string;
  [key: string]: unknown;
}

interface ModelDescriptor {
  name?: string;
  type?: string;
  fullName?: string;
  [key: string]: unknown;
}

// Local sort helper (same as mapper/utils.sortBy)
function sortBy<T extends Record<string, unknown>>(array: T[] = [], key: string): T[] {
  return array.sort(function (a: T, b: T) {
    const x = a[key] as string | number | undefined;
    const y = b[key] as string | number | undefined;
    return (x ?? "") < (y ?? "") ? -1 : (x ?? "") > (y ?? "") ? 1 : 0;
  });
}

async function fetchSelectionByName(name: string): Promise<MetaSelectItem[]> {
  const res = (await _Service.post("ws/rest/com.axelor.meta.db.MetaSelect/search", {
    data: {
      _domain: "self.name = :name",
      _domainContext: { name },
    },
    fields: ["name", "items"],
    offset: 0,
    limit: 1,
    sortBy: null,
  })) as AxelorResponse<MetaSelect>;
  const record = res?.data?.[0];
  if (record) {
    const { items } = record;
    const itemRes = (await _Service.post("ws/rest/com.axelor.meta.db.MetaSelectItem/search", {
      data: {
        _domain: "self.id in (:list)",
        _domainContext: { list: (items ?? []).map((x) => x.id) },
      },
      fields: ["title", "value", "color", "data", "order"],
      offset: 0,
      limit: -1,
      sortBy: ["order"],
    })) as AxelorResponse<MetaSelectItem>;
    return itemRes?.data ?? [];
  }
  return [];
}

export async function fetchMetaFields(criteria: Record<string, unknown> = {}): Promise<MetaField[]> {
  const res = await _Service.search<MetaField>("com.axelor.meta.db.MetaField", {
    data: criteria,
  });
  if (isAxelorError(res)) return [];
  return res?.data ?? [];
}

export async function fetchModelFields(
  item: { packageName: string; typeName: string; target?: string },
  isSubField = false,
): Promise<Record<string, unknown>[]> {
  let entity = `${item.packageName}.${item.typeName}`;
  if (isSubField) {
    if (!item.target) return [];
    entity = item.target;
  }
  const fields = await fetchFields({ fullName: entity });
  return fields;
}

const cache: Record<string, FieldMetadata[]> = {};

export async function fetchFields(
  item: Record<string, unknown> | null,
  _excludeUIFields = false,
): Promise<FieldMetadata[]> {
  if (!item) return [];
  let fields: FieldMetadata[] = [];
  const entity = `${item.targetModel || item.fullName || item.target || item.name}`;
  if (cache[entity]) {
    return Array.isArray(cache[entity]) ? cache[entity].slice() : cache[entity];
  }

  if (item.modelType === ModelType.CUSTOM || !entity) {
    const criteria = [{ fieldName: "jsonModel.name", operator: "=", value: item.name }];
    const searchData = {
      criteria,
    };
    const res = await _Service.search<MetaJsonField>("com.axelor.meta.db.MetaJsonField", {
      data: searchData,
      fields: [
        "type",
        "nameField",
        "required",
        "model",
        "targetModel",
        "targetJsonModel",
        "targetJsonModel.name",
        "modelField",
        "jsonModel",
        "jsonModel.name",
        "title",
        "name",
        "selection",
      ],
      sortBy: ["title"],
    });
    const data = res?.data ?? [];
    for (let i = 0; i < data.length; i++) {
      const field = data[i];
      if (field.selection) {
        const selectionList = await fetchSelectionByName(field.selection);
        (field as Record<string, unknown>).selectionList = selectionList;
      }
      if (field.jsonModel) {
        (field as Record<string, unknown>).jsonModel = {
          ...(typeof field.jsonModel === "object" ? field.jsonModel : {}),
          name: (field as Record<string, unknown>)["jsonModel.name"],
        };
      }
      fields.push(field as unknown as FieldMetadata); // safety: Axelor REST field metadata shape is dynamic
    }
  } else {
    if (entity === "undefined") return [];

    const res = (await _Service.get(`/ws/meta/fields/${entity}`)) as AxelorViewResponse;
    if (res?.status === 0) {
      const data = res?.data ?? ({} as AxelorViewResponse["data"]);
      fields = [...((data.fields ?? []) as FieldMetadata[])];
      Object.keys(data.jsonFields ?? {}).forEach((fieldKey: string) => {
        const jsonField = (data.jsonFields ?? {})[fieldKey];
        fields.push(...Object.values(jsonField as Record<string, FieldMetadata>));
      });
    }
  }
  const newFields = sortBy(fields, "title");
  return (cache[entity] = newFields.filter(
    (field) => !excludedUITypes.includes(field.type),
  ));
}

export async function fetchCustomFields(item: {
  targetModel?: string;
  targetJsonModel?: { id: number | string };
  [key: string]: unknown;
}): Promise<FieldMetadata[]> {
  if (item.targetModel) {
    const fields = await fetchFields({ fullName: item.targetModel });
    return fields;
  } else if (item.targetJsonModel) {
    const criteria = [
      {
        fieldName: "jsonModel.id",
        operator: "=",
        value: item.targetJsonModel.id,
      },
    ];
    const searchData = {
      criteria,
    };
    const res = await _Service.search<MetaJsonField>("com.axelor.meta.db.MetaJsonField", {
      data: searchData,
      fields: [
        "type",
        "nameField",
        "required",
        "model",
        "targetModel",
        "targetJsonModel",
        "targetJsonModel.name",
        "modelField",
        "jsonModel",
        "jsonModel.name",
        "title",
        "name",
      ],
      sortBy: ["title"],
    });
    const data = res?.data ?? [];
    const newData = data.map((field) => {
      const record = field as Record<string, unknown>;
      if (field.jsonModel) {
        record.jsonModel = {
          ...(typeof field.jsonModel === "object" ? field.jsonModel : {}),
          name: record["jsonModel.name"],
        };
      }
      return record;
    });
    return [...newData] as FieldMetadata[];
  }
  return [];
}

/**
 * Extract fields from a metadata response (allFields + jsonFields).
 */
export const getResultedFields = (res: AxelorViewResponse | unknown): FieldMetadata[] => {
  const typedRes = res as AxelorViewResponse;
  const responseData = typedRes?.data;
  const allFields = responseData?.fields as FieldMetadata[] | undefined;
  const jsonFields: Record<string, unknown>[] = Object.values(responseData?.jsonFields ?? {});
  let result: FieldMetadata[] = [];
  result = allFields ?? [];

  jsonFields?.forEach((jsonField) => {
    const nestedFields = Object.values((jsonField ?? {}) as Record<string, FieldMetadata>);
    result = [...result, ...nestedFields];
  });
  return result;
};

/**
 * Fetch sub-fields for a model, filtered by type.
 */
export async function getSubMetaField(
  model: string,
  relationJsonModel: string | null,
  isCollection = false,
  allowAllFields = false,
  excludeUITypesFlag = false,
  isDatePath?: boolean,
): Promise<FieldMetadata[]> {
  if (model === "com.axelor.meta.db.MetaJsonRecord" && relationJsonModel) {
    const res = await _Service.get(
      `ws/meta/fields/com.axelor.meta.db.MetaJsonRecord?jsonModel=${relationJsonModel}`,
    );
    const result = getResultedFields(res) ?? [];
    return (
      result.filter((r) =>
        excludeUITypesFlag
          ? !excludedUITypes.includes((r.type)?.toLowerCase())
          : isCollection
            ? ["many_to_one", "one_to_many", "many_to_many"].includes((r.type).toLowerCase())
            : allowAllFields
              ? true
              : isDatePath
                ? ["date", "datetime", "many_to_one", "many-to-one"].includes((r.type).toLowerCase())
                : ["many_to_one", "many-to-one"].includes((r.type).toLowerCase()),
      )
    );
  } else {
    const data = {
      criteria: [{ fieldName: "fullName", operator: "=", value: model }],
    };
    const metaModel = await getMetaModel(data);
    if (!metaModel) return [];
    const fields = metaModel?.metaFields?.map((f) => f.name);
    const res = await _Service.fields({
      fields,
      model: metaModel.fullName,
    });
    const resultFields = res?.data?.fields as FieldMetadata[] | undefined;
    return (
      resultFields?.filter((r) =>
        excludeUITypesFlag
          ? !excludedUITypes.includes((r.type)?.toLowerCase())
          : isCollection
            ? ["many_to_one", "one_to_many", "many_to_many"].includes((r.type).toLowerCase())
            : allowAllFields
              ? true
              : isDatePath
                ? ["date", "datetime", "many_to_one", "many-to-one"].includes((r.type).toLowerCase())
                : ["many_to_one", "many-to-one"].includes((r.type).toLowerCase()),
      ) ?? []
    );
  }
}

/**
 * Get metadata fields for a model (metaModel or metaJsonModel).
 */
export async function getMetaFields(model: ModelDescriptor | null): Promise<FieldMetadata[]> {
  if (!model) return [];
  if (model.type === "metaModel") {
    if (!model.fullName) return [];
    const res = await _Service.get(`ws/meta/fields/${model.fullName}`);
    const result = getResultedFields(res);
    return result;
  } else {
    if (!model.name) return [];
    const res = await _Service.get(
      `ws/meta/fields/com.axelor.meta.db.MetaJsonRecord?jsonModel=${model.name}`,
    );
    const result = getResultedFields(res);
    return result ?? [];
  }
}

/**
 * Get the name column for a model entity.
 */
export async function getNameColumn(model: string): Promise<string | undefined> {
  if (!model) return;
  const res = await _Service.fetchFields(model);
  if (res.status === 0) {
    const { fields } = res.data;
    const nameColumnField = fields?.find((f) => f.nameColumn);
    return (nameColumnField?.name as string) || "name";
  }
}
