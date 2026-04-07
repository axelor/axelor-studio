/**
 * Model fetching service (generic functions only).
 * fetchModels remains in bpm (depends on BPM-specific getProcessConfig).
 *
 * @module model-service
 */
import { uniqBy } from "lodash";

import { ServiceInstance as Service } from "./Service";
import type { MetaModel, MetaJsonModel } from "../types";
import { isAxelorError } from "../types";

export async function getModels(
  data: Record<string, unknown> = {},
  metaModalType?: string,
  dmnModels?: Record<string, unknown>[],
): Promise<Record<string, unknown>[]> {
  const models =
    ((!metaModalType || metaModalType === "metaModel") && (await getMetaModels(data))) || [];
  const metaJsonModels =
    ((!metaModalType || metaModalType === "metaJsonModel") && (await getCustomModels(data))) || [];
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
  if (dmnModels) {
    for (let i = 0; i < dmnModels.length; i++) {
      allModels.push({
        ...dmnModels[i],
        type: "dmnModel",
      });
    }
  }
  return allModels || [];
}

export async function getMetaModels(_data: Record<string, unknown> = {}): Promise<MetaModel[]> {
  const res = await Service.search<MetaModel>("com.axelor.meta.db.MetaModel", {
    data: _data,
    limit: 40,
    fields: ["name", "fullName", "packageName"],
  });
  if (isAxelorError(res)) return [];
  const data = res?.data ?? [];
  return uniqBy(data, "id");
}

export async function getCustomModels(criteria: Record<string, unknown> = {}): Promise<MetaJsonModel[]> {
  const res = await Service.search<MetaJsonModel>("com.axelor.meta.db.MetaJsonModel", {
    data: criteria,
    limit: 40,
  });
  if (isAxelorError(res)) return [];
  const data = res?.data ?? [];
  return data;
}

export async function getAllModels(criteria: Record<string, unknown> = {}): Promise<Record<string, unknown>[]> {
  const models = (await getMetaModels(criteria)) || [];
  const metaJsonModels = (await getCustomModels(criteria)) || [];
  const data = [...models, ...metaJsonModels];
  return data;
}
