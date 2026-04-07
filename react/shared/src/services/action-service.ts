import Service from "./Service";
import { getViews } from "./meta-view-service";
import { getResultedFields } from "./meta-field-service";
import type { AxelorViewResponse, MetaJsonField, MetaView, ViewElement } from "../types";

function getItemsByType(view: ViewElement, type: string): ViewElement[] {
  function collectItems(item: ViewElement): ViewElement[] {
    const items = item.items ?? [];
    const jsonFields = item.jsonFields ?? [];
    const toolbar = item.toolbar ?? [];
    const menubar = item.menubar ?? [];
    const allItems = [...items, ...jsonFields, ...toolbar, ...menubar];
    return allItems.reduce(
      (all: ViewElement[], child: ViewElement) => [...all, ...collectItems(child)],
      item.type === type ? [item] : [],
    );
  }
  return collectItems(view);
}

interface ModelDescriptor {
  type: string;
  model: string;
  modelFullName?: string;
  defaultForm?: string;
}

export async function getButtons(
  models: ModelDescriptor[] = [],
  includeAllForms = false,
): Promise<ViewElement[]> {
  let buttons: ViewElement[] = [];
  const metaModeNames: string[] = [];
  const modelNames: string[] = [];
  if (models.length > 0) {
    for (let i = 0; i < models.length; i++) {
      const { type, model, modelFullName, defaultForm } = models[i];
      let formName = defaultForm;
      let allFormViews: string[] | undefined;
      if (includeAllForms || !formName) {
        const views = await getViews({
          name: model,
          type,
          fullName: modelFullName,
        });
        if (views?.[0]) {
          allFormViews = views.map((v: MetaView) => v.name).filter((n): n is string => !!n);
          formName = views[0].name;
        }
      }
      if (formName) {
        if (type === "metaModel") {
          metaModeNames.push(modelFullName ?? "");
        }
        const apis: Promise<AxelorViewResponse>[] = [];
        if (includeAllForms && allFormViews) {
          for (let i = 0; i < allFormViews.length; i++) {
            apis.push(
              Service.view({
                data: {
                  name: type === "metaModel" ? allFormViews[i] : `custom-model-${model}-form`,
                  type: "form",
                },
                model,
              }),
            );
          }
          const res = await Promise.all(apis);
          let allFormButtons: ViewElement[] = [];
          res.forEach((element: AxelorViewResponse) => {
            const formView = element?.data?.view as ViewElement | undefined;
            if (formView) {
              const btns = getItemsByType(formView, "button");
              const menuItems = getItemsByType(formView, "menu-item");
              allFormButtons = [...allFormButtons, ...btns, ...menuItems];
            }
          });
          buttons = [...buttons, ...allFormButtons];
        } else {
          const res = await Service.view({
            data: {
              name: type === "metaModel" ? formName : `custom-model-${model}-form`,
              type: "form",
            },
            model,
          });
          const formView = res?.data?.view as ViewElement | undefined;
          if (formView) {
            const btns = getItemsByType(formView, "button");
            const menuItems = getItemsByType(formView, "menu-item");
            buttons = [...buttons, ...btns, ...menuItems];
          }
        }
      } else {
        if (type === "metaJsonModel") {
          modelNames.push(model);
        }
      }
    }
    if (metaModeNames.length > 0) {
      for (let i = 0; i < metaModeNames.length; i++) {
        const res = await Service.search<MetaJsonField>(`com.axelor.meta.db.MetaJsonField`, {
          data: {
            criteria: [
              {
                fieldName: "model",
                operator: "like",
                value: metaModeNames[i],
              },
              {
                fieldName: "type",
                operator: "=",
                value: "button",
              },
            ],
            operator: "and",
          },
        });
        const buttonFields = res?.data;
        if (buttonFields && buttonFields.length > 0) {
          buttons = [...buttons, ...(buttonFields as unknown as ViewElement[])]; // safety: Axelor REST button fields shape differs from ViewElement interface
        }
      }
    }
    if (modelNames.length > 0) {
      for (let i = 0; i < modelNames.length; i++) {
        const res = await Service.get(
          `ws/meta/fields/com.axelor.meta.db.MetaJsonRecord?jsonModel=${modelNames[i]}`,
        );
        const fields = getResultedFields(res);
        const buttonFields = fields.filter((f) => f.type === "button");
        buttons = [...buttons, ...(buttonFields as unknown as ViewElement[])]; // safety: Axelor REST button fields shape differs from ViewElement interface
      }
    }
    return buttons;
  }
  return [];
}

export async function getExpressionValues(
  model: string,
  options?: Record<string, unknown>,
): Promise<Record<string, unknown>[] | undefined> {
  if (!model) return;
  if (model.includes(".")) {
    const res = await Service.search(model, options);
    return res?.data ?? [];
  } else {
    const res = await Service.search("com.axelor.meta.db.MetaJsonRecord", {
      data: {
        _domain: `self.jsonModel = '${model}'`,
      },
    });
    return res?.data ?? [];
  }
}
