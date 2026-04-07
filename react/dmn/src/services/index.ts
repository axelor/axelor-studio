import { ServiceInstance as services } from "@studio/shared/services";

const joinURL = (model: string, subURL: string): string => {
  return `ws/rest/${model}/${subURL}`;
};

class AxelorService {
  model: string;

  constructor(props: { model: string } = { model: "" }) {
    this.model = props.model;
  }

  search({
    fields,
    sortBy,
    data,
    limit,
    offset,
  }: {
    fields?: string[];
    sortBy?: string[];
    data?: Record<string, unknown>;
    limit?: number;
    offset?: number;
  }) {
    const _subURL = `search`;
    const url = joinURL(this.model, _subURL);
    return services.post(url, { fields, sortBy, data, limit, offset });
  }

  fetch(id: number | string, data: Record<string, unknown>) {
    const _subURL = `${id}/fetch`;
    const url = joinURL(this.model, _subURL);
    return services.post(url, data);
  }

  view(data: Record<string, unknown>) {
    const url = "/ws/meta/view";
    return services.post(url, data);
  }

  fields(data: Record<string, unknown>) {
    const url = "/ws/meta/view/fields";
    return services.post(url, data);
  }

  save(data: Record<string, unknown>, spread = false) {
    const url = joinURL(this.model, "");
    return services.post(url, { ...(spread ? data : { data }) });
  }

  removeAll(records: Record<string, unknown>[]) {
    const url = joinURL(this.model, "removeAll");
    return services.post(url, { records });
  }

  action(name: string, data: Record<string, unknown>) {
    const url = `/ws/action/${name}`;
    return services.post(url, { ...data, model: this.model });
  }
}

export default AxelorService;
