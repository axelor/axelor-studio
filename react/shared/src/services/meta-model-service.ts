/**
 * Model metadata service.
 * Handles fetching of MetaModel and MetaJsonModel records from the Axelor backend.
 *
 * @module meta-model-service
 */
import { uniqBy } from "lodash";

import type {
  MetaModel,
  MetaJsonModel,
} from "../types";
import { isAxelorError } from "../types";

import { ServiceInstance as _Service } from "./Service";
import { getViews } from "./meta-view-service";

export const ModelType = {
  CUSTOM: "CUSTOM" as const,
  META: "META" as const,
};

export async function getModels(
  data: Record<string, unknown> = {},
  metaModalType?: string,
  criteria?: Record<string, unknown>[],
  isTitleAllow = false,
): Promise<(MetaModel | MetaJsonModel)[]> {
  const models =
    ((!metaModalType || metaModalType === "metaModel") &&
      (await getMetaModels(data, criteria, isTitleAllow))) ||
    [];
  const metaJsonModels =
    ((!metaModalType || metaModalType === "metaJsonModel") &&
      (await getCustomModels(data, criteria))) ||
    [];
  const allModels: (MetaModel | MetaJsonModel)[] = [];

  for (let i = 0; i < models.length; i++) {
    allModels.push({
      ...models[i],
      type: "metaModel",
    });
  }
  for (let i = 0; i < metaJsonModels.length; i++) {
    allModels.push({
      ...metaJsonModels[i],
      type: "metaJsonModel",
    });
  }
  return uniqBy(allModels, "id") ?? [];
}

export async function fetchModelByName(modelName: string): Promise<MetaModel | MetaJsonModel | null | undefined> {
  if (!modelName) {
    return;
  }
  let record: MetaModel | MetaJsonModel | null = null;
  const res = await _Service.search<MetaModel>("com.axelor.meta.db.MetaModel", {
    data: {
      criteria: [{ fieldName: "name", operator: "=", value: modelName }],
    },
    fields: ["name", "metaFields", "id", "fullName"],
  });
  if (!isAxelorError(res)) {
    record = res?.data?.[0] ?? null;
  }
  if (!record) {
    // find in custom model
    const criteria = [{ fieldName: "name", operator: "=", value: modelName }];
    const customModelData = await getCustomModels(undefined, criteria);
    record = customModelData[0] ?? null;
  }
  return record ?? null;
}

export async function fetchModelByFullName(targetName: string): Promise<MetaModel | MetaJsonModel | undefined> {
  if (!targetName) {
    return;
  }
  let record: MetaModel | MetaJsonModel | undefined;
  const criteria = [{ fieldName: "fullName", operator: "=", value: targetName }];
  const res = await getModels({}, undefined, criteria, true);
  if (res) {
    record = res[0] ?? undefined;
  }
  if (!record) {
    const criteria = [{ fieldName: "name", operator: "=", value: targetName }];
    const customRes = await getCustomModels({}, criteria);
    if (customRes) {
      const first = customRes[0];
      if (first) {
        record = { ...first, type: "metaJsonModel" };
      }
    }
  }
  return record;
}

export async function getMetaModels(
  e?: Record<string, unknown>,
  criteriaParent: Record<string, unknown>[] = [],
  isTitleAllow = false,
): Promise<MetaModel[]> {
  const criteria: Record<string, unknown>[] = [];
  if (e && e.search) {
    criteria.push({ fieldName: "fullName", operator: "like", value: e.search });
  }
  const res = await _Service.search<MetaModel>("com.axelor.meta.db.MetaModel", {
    data: {
      criteria: [...criteria, ...(criteriaParent || [])],
    },
    fields: ["name", "id", "fullName"],
    limit: 40,
  });
  if (isAxelorError(res)) return [];
  const data = res?.data ?? [];

  if (!isTitleAllow) {
    return data;
  }

  const models = data.map((m) => {
    return m.fullName;
  });

  const views =
    models.length > 0 &&
    (await getViews(
      undefined,
      [
        {
          fieldName: "model",
          value: models,
          operator: "IN",
        },
        {
          operator: "or",
          criteria: [
            {
              fieldName: "extension",
              operator: "IS NULL",
            },
            {
              fieldName: "extension",
              operator: "=",
              value: false,
            },
          ],
        },
      ],
      undefined,
      false,
    ));

  const result: MetaModel[] = [];
  data.forEach((d) => {
    if (views) {
      views.forEach((v) => {
        if (v.model === d.fullName) {
          result.push({ ...d, title: v.title });
        }
      });
    }
  });

  return uniqBy(result, "id") ?? [];
}

export async function getCustomModels(
  optionData: Record<string, unknown> | undefined = {},
  criteria: Record<string, unknown>[] = [],
): Promise<MetaJsonModel[]> {
  const options: Record<string, unknown>[] = [];
  if (optionData && optionData.search) {
    options.push({
      fieldName: "name",
      operator: "like",
      value: optionData.search,
    });
  }
  const res = await _Service.search<MetaJsonModel>("com.axelor.meta.db.MetaJsonModel", {
    data: {
      criteria: [...options, ...criteria],
    },
    fields: ["name", "title"],
  });
  if (isAxelorError(res)) return [];
  const data = res?.data ?? [];
  return data.map((d) => {
    return { ...d, modelType: ModelType.CUSTOM };
  });
}

/**
 * Search for a MetaModel by criteria and return the first match.
 */
export async function getMetaModel(data: Record<string, unknown>): Promise<MetaModel | undefined> {
  const res = await _Service.search<MetaModel>("com.axelor.meta.db.MetaModel", { data });
  return res?.data?.[0];
}
