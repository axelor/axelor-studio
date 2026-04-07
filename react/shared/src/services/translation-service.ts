/**
 * Internationalization CRUD service for MetaTranslation records.
 *
 * @module translation-service
 */
import { ServiceInstance as Service } from "./Service";
import type { MetaTranslation, AxelorResponse } from "../types";

export async function getTranslations(key: string): Promise<MetaTranslation[] | undefined> {
  if (!key) return;
  const res = await Service.search<MetaTranslation>("com.axelor.meta.db.MetaTranslation", {
    data: {
      _domain: "self.key = :key",
      _domainContext: {
        key: `value:${key}`,
      },
    },
    sortBy: ["id"],
  });
  const data = res?.data ?? [];
  return data;
}

export async function removeAllTranslations(records: Record<string, unknown>[]): Promise<boolean> {
  const url = `ws/rest/com.axelor.meta.db.MetaTranslation/removeAll`;
  const res = await Service.post(url, {
    records,
  }) as AxelorResponse<MetaTranslation>;
  const { status } = res || {};
  if (status === 0) return true;
  return false;
}

export async function addTranslations(records: Record<string, unknown>[]): Promise<MetaTranslation[]> {
  const url = `ws/rest/com.axelor.meta.db.MetaTranslation`;
  const res = await Service.post(url, {
    records,
  }) as AxelorResponse<MetaTranslation>;
  const { data = [] } = res || {};
  return data;
}
