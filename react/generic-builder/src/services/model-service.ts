import { ServiceInstance as services } from "@studio/shared/services";
import { uniqBy } from "lodash";

import { getViews } from "./view-service";

export async function getModels(data: Record<string, unknown> | null = {}, metaModalType?: string) {
  const models =
    ((!metaModalType || metaModalType === "metaModel") && (await getMetaModels(data || {}))) || [];
  const metaJsonModels =
    ((!metaModalType || metaModalType === "metaJsonModel") &&
      (await getCustomModels(data || {}))) ||
    [];
  const allModels: Record<string, unknown>[] = [];

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
  return allModels || [];
}

async function getMetaModels(_data: Record<string, unknown> = {}) {
  const res = await services.search("com.axelor.meta.db.MetaModel", {
    data: _data,
    limit: 20,
    fields: ["name", "fullName", "packageName"],
  });
  if (res && res.status === -1) return [];
  const { data = [] } = res || {};

  const models = data.map((m: Record<string, unknown>) => {
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

  const result: Record<string, unknown>[] = [];
  data.forEach((d: Record<string, unknown>) => {
    (views as Record<string, unknown>[]).forEach((v: Record<string, unknown>) => {
      if (v.model === d.fullName) {
        result.push({ ...d, title: v.title });
      }
    });
  });
  return uniqBy(result, "id");
}

async function getCustomModels(_data: Record<string, unknown> = {}) {
  const res = await services.search("com.axelor.meta.db.MetaJsonModel", {
    data: _data,
  });
  if (res && res.status === -1) return [];
  const { data = [] } = res || {};
  return data;
}
