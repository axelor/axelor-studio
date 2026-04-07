/**
 * Language/locale selection service.
 * Fetches available languages from MetaSelect or falls back to defaults.
 *
 * @module language-service
 */
import { ServiceInstance as Service } from "./Service";
import type { MetaSelect, MetaSelectItem } from "../types";

export const getLanguages = async () => {
  const defaultLanguages = [
    {
      value: "en",
      title: "English",
      id: "en",
    },
    {
      value: "fr",
      title: "French",
      id: "fr",
    },
  ];
  const res = await Service.search<MetaSelect>("com.axelor.meta.db.MetaSelect", {
    fields: ["items"],
    limit: 1,
    sortBy: ["-priority"],
    data: {
      criteria: [
        {
          fieldName: "name",
          operator: "=",
          value: "select.language",
        },
      ],
    },
  });
  const items = res?.data?.[0]?.items?.map((i) => i.id);
  if (!items?.length) return defaultLanguages;
  const languagesRes = await Service.search<MetaSelectItem>("com.axelor.meta.db.MetaSelectItem", {
    fields: ["title", "value"],
    data: {
      criteria: [
        {
          fieldName: "id",
          operator: "IN",
          value: items,
        },
      ],
    },
  });
  return languagesRes?.status > -1 ? languagesRes?.data : defaultLanguages;
};
