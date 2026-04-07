import { ServiceInstance as services } from "@studio/shared/services";
import { uniqBy } from "lodash";

interface ModelParam {
  name?: string;
  type?: string;
  fullName?: string;
}

interface Criterion {
  fieldName?: string;
  operator?: string;
  value?: unknown;
  criteria?: Criterion[];
}

export async function getViews(
  model?: ModelParam,
  criteria: Criterion[] = [],
  type: string = "form",
  isModelAllow: boolean = true,
) {
  if ((!model || !model.name) && isModelAllow) return [];
  const options: Criterion[] = [
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

  const res = await services.search(`com.axelor.meta.db.MetaView`, {
    fields: ["name", "title", "model"],
    data: {
      criteria: [...options, ...criteria],
      operator: "and",
    },
  });
  const { data = [] } = res || {};
  let views =
    Array.isArray(data) && data.filter((val: Record<string, unknown>) => val.name !== null);
  views = uniqBy(views || [], "name") || [];
  return views;
}
