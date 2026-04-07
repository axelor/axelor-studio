/**
 * View metadata service.
 * Handles fetching and filtering of MetaView records from the Axelor backend.
 *
 * @module meta-view-service
 */
import { uniqBy } from "lodash";

import type {
  AxelorViewResponse,
  MetaView,
  MetaField,
  MetaJsonField,
  ViewElement,
} from "../types";

import { ServiceInstance as _Service } from "./Service";

interface ModelDescriptor {
  name?: string;
  type?: string;
  fullName?: string;
  [key: string]: unknown;
}

export async function getViews(
  model: ModelDescriptor | undefined,
  criteria: Record<string, unknown>[] = [],
  type = "form",
  isModelAllow = true,
): Promise<MetaView[]> {
  if ((!model || !model.name) && isModelAllow) return [];
  const options: Record<string, unknown>[] = [
    {
      fieldName: "type",
      operator: "=",
      value: type,
    },
  ];

  if (model?.type === "metaJsonModel") {
    options.push({
      fieldName: "name",
      operator: "=",
      value: `custom-model-${model.name}-${type}`,
    });
  }

  if (model?.fullName) {
    options.push({
      fieldName: "model",
      value: model.fullName,
      operator: "=",
    });
  }

  const res = await _Service.search<MetaView>(`com.axelor.meta.db.MetaView`, {
    fields: ["name", "title", "model"],
    data: {
      criteria: [...options, ...criteria],
      operator: "and",
    },
  });
  const data = res?.data ?? [];
  let views = Array.isArray(data)
    ? data.filter((val) => val.name !== null)
    : [];
  views = uniqBy(views, "name") ?? [];
  return views;
}

export async function getFormViews(formViewNames: string[]): Promise<MetaView[]> {
  const res = await _Service.search<MetaView>("com.axelor.meta.db.MetaView", {
    data: {
      _domain:
        "self.type = :type and (self.extension IS NULL or self.extension IS FALSE) and self.name in :names",
      _domainContext: {
        type: "form",
        names: formViewNames && formViewNames.length > 0 ? formViewNames : [""],
      },
    },
    fields: ["name", "title", "model"],
  });
  return res?.data ?? [];
}

/**
 * Get form items (fields, panels, toolbar, menubar) for a model's form view.
 */
export async function getItems(
  formName: string | null,
  model: ModelDescriptor | null,
  criteria?: Record<string, unknown>[],
): Promise<ViewElement[]> {
  if (!model) return [];
  if (formName && model.fullName) {
    const res = (await _Service.post(`/ws/meta/view`, {
      data: {
        context: {
          "json-enhance": "true",
          _id: null,
        },
        name: formName,
        type: "form",
        criteria,
      },
      model: model.fullName,
    })) as AxelorViewResponse;
    const data = res?.data ?? ({} as AxelorViewResponse["data"]);
    const fields = (data.fields ?? []) as ViewElement[];
    const jsonAttrs = (data.jsonAttrs ?? []) as ViewElement[];
    const view = (data.view ?? {}) as ViewElement;
    const menubar = (view.menubar ?? []);
    const toolbar = (view.toolbar ?? []);
    const items = [...fields, ...jsonAttrs];
    const panels: ViewElement[] = [];

    const isMenu = (element: ViewElement) => {
      return element.type === "menu";
    };

    [...((view).items ?? []), ...menubar, ...toolbar].forEach((item: ViewElement) => {
      if (!isMenu(item)) {
        panels.push(item);
      }
      if (item) {
        const panelItems = item.items ?? [];
        panelItems.forEach((element: ViewElement) => {
          if (!isMenu(element)) {
            panels.push(element);
          }
          const jsonFields = element.jsonFields ?? [];
          if (jsonFields.length > 0) {
            jsonFields.forEach((field: ViewElement) => {
              if (!isMenu(field)) {
                panels.push(field);
              }
            });
          }
        });
      }
    });
    const allItems = [...items, ...panels];
    const uniqueItems = uniqBy(allItems, "name") ?? [];
    return [...uniqueItems, { name: "self", label: "Self" } as ViewElement];
  } else {
    let metaFields: MetaField[] = [],
      metaRealModelJsonFields: MetaJsonField[] = [];
    if (model.type === "metaModel") {
      const metaFieldsRes = await _Service.search<MetaField>("com.axelor.meta.db.MetaField", {
        data: {
          _domain: `self.metaModel.fullName = '${model.fullName}'`,
          _domainContext: {
            _model: "com.axelor.meta.db.MetaModel",
          },
        },
      });
      metaFields = uniqBy(metaFieldsRes?.data ?? [], "label") ?? [];

      const metaJsonFieldsRes = await _Service.search<MetaJsonField>("com.axelor.meta.db.MetaJsonField", {
        data: {
          _domain: `self.model = '${model.fullName}' AND self.jsonModel is null`,
          _domainContext: {
            _model: "com.axelor.meta.db.MetaJsonField",
          },
        },
      });
      metaRealModelJsonFields = metaJsonFieldsRes?.data ?? [];
    }
    const metaJsonFields = await _Service.search<MetaJsonField>("com.axelor.meta.db.MetaJsonField", {
      data: {
        _domain: `self.jsonModel.name = '${model.name}'`,
        _domainContext: {
          _model: "com.axelor.meta.db.MetaJsonField",
        },
      },
      fields: ["name", "model", "type", "title"],
    });
    const response: (MetaField | MetaJsonField)[] = [
      ...metaFields,
      ...metaRealModelJsonFields,
      ...(metaJsonFields?.data ?? []),
    ];
    return response as unknown as ViewElement[]; // safety: Axelor REST response shape is dynamic Record
  }
}
