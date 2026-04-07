import { ServiceInstance as services } from "@studio/shared/services";

import { getItemsByType, sortBy } from "../common/utils";
import { ALLOWED_TYPES, QUERY_CUSTOM_TYPES } from "../common/constants";

import { getViews } from "./view-service";

interface FieldRecord {
  name?: string;
  type?: string;
  json?: boolean;
  targetName?: string;
  target?: string;
  targetModel?: string;
  jsonField?: string;
  jsonTarget?: string;
  model?: string;
  modelField?: string;
  nameField?: boolean;
  selectionList?: Record<string, unknown>[];
  sequence?: number;
  typeName?: string;
  [key: string]: unknown;
}

interface ModelParam {
  name?: string;
  type?: string;
  fullName?: string;
  packageName?: string;
  [key: string]: unknown;
}

const getResultedFields = (
  res: Record<string, unknown> | null | undefined,
  isQuery: boolean | null | undefined,
  isAllowButtons: boolean = false,
  isContextValue: boolean = false,
): FieldRecord[] => {
  const responseData = res && (res.data as Record<string, unknown> | undefined);
  const allFields = responseData && (responseData.fields as FieldRecord[] | undefined);
  const jsonFields = Object.values(
    ((responseData && responseData.jsonFields) as
      | Record<string, Record<string, FieldRecord>>
      | undefined) || [{}],
  );
  let result: FieldRecord[] = [];
  const CLONE_ALLOWED_TYPES = [...ALLOWED_TYPES];
  if (isAllowButtons) {
    CLONE_ALLOWED_TYPES.push("button");
  }
  result =
    (allFields &&
      allFields.filter(
        (f: FieldRecord) => !f.json && CLONE_ALLOWED_TYPES.includes((f.type || "").toLowerCase()),
      )) ||
    [];

  jsonFields &&
    jsonFields.forEach((jsonField: Record<string, FieldRecord>) => {
      const nestedFields = Object.values(jsonField || {}) || [];
      let fields: FieldRecord[] =
        nestedFields.filter(
          (a: FieldRecord) =>
            CLONE_ALLOWED_TYPES.includes((a.type || "").toLowerCase()) &&
            (a.type === "many-to-many" ? a.targetName : true),
        ) || [];
      if (isQuery && !isContextValue) {
        fields =
          fields.filter(
            (f: FieldRecord) => !QUERY_CUSTOM_TYPES.includes((f.type || "").toLowerCase()),
          ) || [];
      }
      result = [...result, ...fields];
    });
  return result;
};

const _cache: {
  metaFields: Record<string, Promise<FieldRecord[]> | FieldRecord[]>;
} = {
  metaFields: {},
};

export async function getMetaFields(
  model: ModelParam | undefined | null,
  isQuery?: boolean,
): Promise<FieldRecord[]> {
  if (!model) return [];
  const key =
    model.type === "metaModel"
      ? model.fullName
        ? model.fullName
        : `${model.packageName}.${model.name}`
      : model.name || "";

  async function fetch(): Promise<FieldRecord[]> {
    if (!model) return [];
    if (model.type === "metaModel") {
      const res = await services.get(`ws/meta/fields/${key}`) as Record<string, unknown>;
      let result = getResultedFields(res, isQuery);
      const zonedDateTimeFieldsRes = await services.search("com.axelor.meta.db.MetaField", {
        data: {
          _domain: `self.metaModel.name = '${model.name}' AND self.typeName = 'ZonedDateTime'`,
          _domainContext: {
            _model: "com.axelor.meta.db.MetaField",
          },
        },
        fields: ["name", "typeName", "metaModel"],
      });
      const zonedDateTimeFields =
        zonedDateTimeFieldsRes &&
        zonedDateTimeFieldsRes.data &&
        zonedDateTimeFieldsRes.data.length > 0 &&
        zonedDateTimeFieldsRes.data.map((f: Record<string, unknown>) => f.name);
      if (zonedDateTimeFields && zonedDateTimeFields.length > 0 && result && result.length > 0) {
        result = result.map((field: FieldRecord) => {
          if ((zonedDateTimeFields as string[]).includes(field.name || "")) {
            return { ...field, typeName: "ZonedDateTime" };
          }
          return field;
        });
        return result;
      }
      return sortBy(result, "name");
    } else {
      const res = await services.get(
        `ws/meta/fields/com.axelor.meta.db.MetaJsonRecord?jsonModel=${model.name}`,
      ) as Record<string, unknown>;
      const result = getResultedFields(res, isQuery);
      return sortBy(result, "sequence") || [];
    }
  }
  if (_cache.metaFields[key]) {
    return _cache.metaFields[key];
  }
  return (_cache.metaFields[key] = await fetch());
}

async function getFields(model: string) {
  const res = await services.get(`ws/meta/fields/${model}`);
  return res || [];
}

export async function getPackageFields(model: string) {
  if (!model) return [];
  const actionRes = await services.action(
    "com.axelor.apps.tool.web.QueryBuilderController:getCommonFields",
    {
      model: "com.axelor.meta.db.MetaModel",
      data: {
        context: {
          package: model,
        },
        model: "com.axelor.meta.db.MetaModel",
      },
    },
  );
  return actionRes && actionRes.data;
}

interface ButtonModelParam {
  model?: string;
  type?: string;
  modelFullName?: string;
  defaultForm?: string;
}

export async function getButtons(models: ButtonModelParam[] = []): Promise<FieldRecord[]> {
  let buttons: FieldRecord[] = [];
  const metaModeNames: string[] = [];
  const modelNames: string[] = [];
  if (models.length > 0) {
    for (let i = 0; i < models.length; i++) {
      const { type, model, modelFullName, defaultForm } = models[i];
      let formName = defaultForm;
      if (!formName) {
        const views = await getViews({
          name: model,
          type,
          fullName: modelFullName,
        });
        if (views && views[0]) {
          formName = views[0].name as string;
        }
      }
      if (formName) {
        if (type === "metaModel") {
          metaModeNames.push(modelFullName || "");
        }
        const res = await services.view({
          data: {
            name: type === "metaModel" ? formName : `custom-model-${model}-form`,
            type: "form",
          },
          model,
        });
        const formView = res && res.data && (res.data as Record<string, unknown>).view;
        if (formView) {
          const btns = getItemsByType(
            formView as Record<string, unknown> & { type?: string },
            "button",
          ) as FieldRecord[];
          const menuItems = getItemsByType(
            formView as Record<string, unknown> & { type?: string },
            "menu-item",
          ) as FieldRecord[];
          buttons = [...buttons, ...(btns || []), ...(menuItems || [])];
        }
      } else {
        if (type === "metaJsonModel") {
          modelNames.push(model || "");
        }
      }
    }
    if (metaModeNames && metaModeNames.length > 0) {
      for (let i = 0; i < metaModeNames.length; i++) {
        const res = await services.search(`com.axelor.meta.db.MetaJsonField`, {
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
        const buttonFields = res && res.data;
        if (buttonFields && buttonFields.length > 0) {
          buttons = [...buttons, ...((buttonFields as FieldRecord[]) || [])];
        }
      }
    }
    if (modelNames && modelNames.length > 0) {
      for (let i = 0; i < modelNames.length; i++) {
        const res = await services.get(
          `ws/meta/fields/com.axelor.meta.db.MetaJsonRecord?jsonModel=${modelNames[i]}`,
        ) as Record<string, unknown>;
        const fields = getResultedFields(res, null, true);
        const buttonFields = fields.filter((f: FieldRecord) => f.type === "button");
        buttons = [...buttons, ...(buttonFields || [])];
      }
    }
    return buttons;
  }
  return buttons;
}

export async function getSubMetaField(
  model: string | undefined,
  isM2MFields: boolean = true,
  isQuery: boolean = false,
  relationJsonModel?: string,
  _isM2OField: boolean | FieldRecord | undefined = false,
  isContextValue?: boolean,
  isAllowButtons: boolean = false,
  targetField: FieldRecord = {},
): Promise<FieldRecord[]> {
  const isJsonModel = model === "com.axelor.meta.db.MetaJsonRecord" && relationJsonModel;
  const endpoint = isJsonModel
    ? `com.axelor.meta.db.MetaJsonRecord?jsonModel=${relationJsonModel}`
    : model || "";
  const res = await getFields(endpoint);
  let result =
    getResultedFields(res as Record<string, unknown>, isQuery, false, isContextValue) || [];
  if (!result) return [];
  if (isQuery && !isContextValue && ALLOWED_TYPES.includes(targetField?.type || "")) {
    return [
      ...(result.filter(
        (val: FieldRecord) => val?.nameField || val?.name === targetField?.targetName,
      ) || []),
      { name: "id", title: "Id", type: "long" },
    ];
  }
  result = result.filter(
    (a: FieldRecord) =>
      ALLOWED_TYPES.includes((a.type || "").toLowerCase()) &&
      (isQuery ? !a.json : true) &&
      ((a.type || "").toLowerCase() === "many-to-many" ? a.targetName : true),
  );
  if (isAllowButtons) {
    const buttons = await getButtons([
      {
        model: isJsonModel ? relationJsonModel : model?.split(".")?.pop(),
        type: isJsonModel ? "metaJsonModel" : "metaModel",
        modelFullName: model,
      },
    ]);
    result = [...(result || []), ...(buttons || [])];
  }

  if (!isM2MFields && result && result.length > 0) {
    return result.filter(
      (f: FieldRecord) =>
        !["many_to_many", "json_many_to_many"].includes(
          (f && (f.type || "")).toLowerCase().replaceAll("-", "_"),
        ),
    );
  }
  return sortBy(result, "sequence") || [];
}
